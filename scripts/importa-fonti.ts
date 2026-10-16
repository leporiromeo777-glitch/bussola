/**
 * Importa le fonti ufficiali di supabase/fonti/elenco.json nella base di
 * fonti della chat (tabelle `fonti` e `frammenti_fonti`).
 *
 *   npm run fonti:importa                 tutte le fonti
 *   npm run fonti:importa -- --solo <id>  una fonte sola
 *   npm run fonti:importa -- --prova      scarica e divide, senza scrivere nel database
 *   npm run fonti:importa -- --sql <file> scrive le istruzioni SQL in un file, da
 *                                         incollare nel SQL editor di Supabase (senza chiavi)
 *
 * Le fonti con "verificato_da" ancora "import automatico - ..." si salvano
 * con attiva = false: la chat usa solo fonti ricontrollate a mano.
 *
 * Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY in .env.local
 * (tranne che con --prova e --sql). Istruzioni complete in docs/fonti.md.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { extractText, getDocumentProxy } from "unpdf";
import { leggiElenco, statoImport, type FonteElenco } from "../src/lib/fonti/elenco";
import { estraiTestoHtml } from "../src/lib/fonti/estrai-html";
import { pagineInBlocchi } from "../src/lib/fonti/estrai-pdf";
import { problemaContenuto } from "../src/lib/fonti/controllo-contenuto";
import { dividiInFrammenti, type Frammento } from "../src/lib/fonti/frammenti";
import { sqlFonte } from "../src/lib/fonti/sql";

const PERCORSO_ELENCO = "supabase/fonti/elenco.json";
const TEMPO_MASSIMO_MS = 30_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; BussolaFonti/1.0; import delle fonti ufficiali per la chat di Bussola)";

type Opzioni = { solo: string | null; prova: boolean; sql: string | null; aiuto: boolean };
/** Dove finisce una fonte importata: database (chiave segreta) o file SQL. */
type Salva = (fonte: FonteElenco, frammenti: Frammento[] | null) => Promise<void>;
type Esito =
  | { id: string; stato: "importata"; frammenti: number; caratteri: number; avviso?: string }
  | { id: string; stato: "disattivata" }
  | { id: string; stato: "da_ricontrollare" }
  | { id: string; stato: "errore"; motivo: string };
type Scaricato = { urlFinale: string; pdf: boolean; dati: ArrayBuffer; charset: string | null };

function leggiOpzioni(argv: string[]): Opzioni {
  const opzioni: Opzioni = { solo: null, prova: false, sql: null, aiuto: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--solo") opzioni.solo = argv[++i] ?? "";
    else if (arg?.startsWith("--solo=")) opzioni.solo = arg.slice("--solo=".length);
    else if (arg === "--prova") opzioni.prova = true;
    else if (arg === "--sql") opzioni.sql = argv[++i] ?? "";
    else if (arg?.startsWith("--sql=")) opzioni.sql = arg.slice("--sql=".length);
    else if (arg === "--aiuto" || arg === "--help" || arg === "-h") opzioni.aiuto = true;
    else throw new Error(`Opzione sconosciuta: ${arg}. Usa --aiuto per l'elenco.`);
  }
  if (opzioni.solo === "") throw new Error("Dopo --solo indica l'id di una fonte, es. --solo ahv-2-02-indipendenti");
  if (opzioni.sql === "") throw new Error("Dopo --sql indica il file da scrivere, es. --sql fonti.sql");
  return opzioni;
}

async function scarica(url: string): Promise<Scaricato> {
  const risposta = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(TEMPO_MASSIMO_MS),
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
      "Accept-Language": "it-CH,it;q=0.9",
    },
  });
  if (!risposta.ok) throw new Error(`la pagina risponde HTTP ${risposta.status}`);
  const tipo = risposta.headers.get("content-type") ?? "";
  const dati = await risposta.arrayBuffer();
  const inizio = new TextDecoder().decode(dati.slice(0, 5));
  return {
    urlFinale: risposta.url || url,
    pdf: tipo.includes("application/pdf") || inizio === "%PDF-",
    dati,
    charset: /charset=([^;]+)/i.exec(tipo)?.[1]?.trim() ?? null,
  };
}

async function estraiFrammenti(scaricato: Scaricato): Promise<Frammento[]> {
  if (scaricato.pdf) {
    const documento = await getDocumentProxy(new Uint8Array(scaricato.dati));
    const { text } = await extractText(documento, { mergePages: false });
    return dividiInFrammenti(pagineInBlocchi(text));
  }
  let html: string;
  try {
    html = new TextDecoder(scaricato.charset ?? "utf-8").decode(scaricato.dati);
  } catch {
    html = new TextDecoder("utf-8").decode(scaricato.dati);
  }
  return dividiInFrammenti(estraiTestoHtml(html).blocchi);
}

function rigaFonte(fonte: FonteElenco) {
  return {
    id: fonte.id,
    url: fonte.url,
    titolo: fonte.titolo,
    ente: fonte.ente,
    livello: fonte.livello,
    cantone: fonte.cantone,
    argomenti: fonte.argomenti,
    lingua: "it",
    verificato_il: fonte.verificato_il,
    verificato_da: fonte.verificato_da,
    attiva: fonte.attiva,
    aggiornato_il: new Date().toISOString(),
  };
}

async function salvaFonte(supabase: SupabaseClient, fonte: FonteElenco, frammenti: Frammento[] | null) {
  const { error: erroreFonte } = await supabase.from("fonti").upsert(rigaFonte(fonte), { onConflict: "id" });
  if (erroreFonte) throw new Error(`salvataggio della fonte non riuscito: ${erroreFonte.message}`);
  if (!frammenti) return;

  // I frammenti si sostituiscono tutti: prima si tolgono i vecchi, poi si inseriscono i nuovi.
  const { error: erroreCancella } = await supabase.from("frammenti_fonti").delete().eq("fonte_id", fonte.id);
  if (erroreCancella) throw new Error(`cancellazione dei vecchi frammenti non riuscita: ${erroreCancella.message}`);
  const { error: erroreInserisci } = await supabase.from("frammenti_fonti").insert(
    frammenti.map((f) => ({
      fonte_id: fonte.id,
      posizione: f.posizione,
      titolo_sezione: f.titolo_sezione,
      testo: f.testo,
    })),
  );
  if (erroreInserisci) {
    throw new Error(
      `inserimento dei frammenti non riuscito (la fonte ora non ha frammenti, rilancia l'import): ${erroreInserisci.message}`,
    );
  }
}

const MESSAGGIO_DA_RICONTROLLARE = "non ancora ricontrollata a mano: metti il tuo nome in verificato_da";

async function importaFonte(fonte: FonteElenco, salva: Salva | null, prova: boolean): Promise<Esito> {
  const stato = statoImport(fonte);
  if (stato === "disattivata") {
    if (salva) await salva(fonte, null);
    return { id: fonte.id, stato: "disattivata" };
  }
  // Con --prova la si scarica comunque, così si possono controllare i frammenti prima di firmarla.
  if (stato === "da_ricontrollare" && !prova) {
    if (salva) await salva({ ...fonte, attiva: false }, null);
    return { id: fonte.id, stato: "da_ricontrollare" };
  }
  const scaricato = await scarica(fonte.url);
  const frammenti = await estraiFrammenti(scaricato);
  const problema = problemaContenuto(frammenti);
  if (problema) throw new Error(problema);
  const caratteri = frammenti.reduce((somma, f) => somma + f.testo.length, 0);
  if (prova) {
    console.log(`\n--- ${fonte.id}: ${frammenti.length} frammenti`);
    for (const f of frammenti) {
      const anteprima = f.testo.slice(0, 120).replace(/\s+/g, " ");
      console.log(`  #${f.posizione} [${f.titolo_sezione ?? "-"}] ${f.testo.length} car.: ${anteprima}…`);
    }
  } else if (salva) {
    await salva(fonte, frammenti);
  }
  const avvisi = [
    scaricato.urlFinale !== fonte.url
      ? `reindirizzata a ${scaricato.urlFinale}: valuta di aggiornare l'URL in elenco.json`
      : null,
    stato === "da_ricontrollare" ? `${MESSAGGIO_DA_RICONTROLLARE} (finché non lo fai, l'import la tiene fuori dalla chat)` : null,
  ].filter((a) => a !== null);
  const avviso = avvisi.length ? avvisi.join("\n    ! ") : undefined;
  return { id: fonte.id, stato: "importata", frammenti: frammenti.length, caratteri, avviso };
}

/** 16313 → "16'313" (formato svizzero). */
function migliaia(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

function descriviErrore(errore: unknown): string {
  if (errore instanceof Error) {
    if (errore.name === "TimeoutError") return `nessuna risposta entro ${TEMPO_MASSIMO_MS / 1000} secondi`;
    const causa = errore.cause instanceof Error ? ` (${errore.cause.message})` : "";
    return `${errore.message}${causa}`;
  }
  return String(errore);
}

async function segnalaFontiNonInElenco(supabase: SupabaseClient, ids: Set<string>) {
  const { data, error } = await supabase.from("fonti").select("id, attiva");
  if (error || !data) return;
  const orfane = (data as { id: string; attiva: boolean }[]).filter((r) => !ids.has(r.id) && r.attiva);
  if (orfane.length) {
    console.log(
      `\nAttenzione: queste fonti attive sono nel database ma non in elenco.json: ${orfane.map((r) => r.id).join(", ")}.` +
        "\nSe non servono più, aggiungile all'elenco con \"attiva\": false oppure disattivale dal pannello di Supabase.",
    );
  }
}

async function main() {
  const opzioni = leggiOpzioni(process.argv.slice(2));
  if (opzioni.aiuto) {
    console.log("Uso: npm run fonti:importa [-- --solo <id>] [-- --prova] [-- --sql <file>]\nVedi docs/fonti.md.");
    return;
  }

  const elenco = leggiElenco(JSON.parse(readFileSync(PERCORSO_ELENCO, "utf8")));
  if (!elenco.ok) {
    console.error(`${PERCORSO_ELENCO} non è valido:\n- ${elenco.errori.join("\n- ")}`);
    process.exitCode = 1;
    return;
  }
  const fonti = opzioni.solo ? elenco.fonti.filter((f) => f.id === opzioni.solo) : elenco.fonti;
  if (fonti.length === 0) {
    console.error(`Nessuna fonte con id "${opzioni.solo}" in ${PERCORSO_ELENCO}.`);
    process.exitCode = 1;
    return;
  }

  let supabase: SupabaseClient | null = null;
  let salva: Salva | null = null;
  const istruzioniSql: string[] = [];
  if (opzioni.sql && !opzioni.prova) {
    const adesso = new Date().toISOString();
    salva = async (fonte, frammenti) => {
      istruzioniSql.push(`-- ${fonte.id}\n${sqlFonte(fonte, frammenti, adesso)}`);
    };
  } else if (!opzioni.prova) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const chiave = process.env.SUPABASE_SECRET_KEY;
    if (!url || !chiave) {
      console.error(
        "Mancano NEXT_PUBLIC_SUPABASE_URL e/o SUPABASE_SECRET_KEY in .env.local.\n" +
          "Per provare l'estrazione senza database: npm run fonti:importa -- --prova",
      );
      process.exitCode = 1;
      return;
    }
    const client = createClient(url, chiave, { auth: { persistSession: false, autoRefreshToken: false } });
    supabase = client;
    salva = (fonte, frammenti) => salvaFonte(client, fonte, frammenti);
  }

  const modo = opzioni.prova ? "Prova (niente database)" : opzioni.sql ? `SQL in ${opzioni.sql}` : "Import";
  console.log(`${modo}: ${fonti.length} fonti da ${PERCORSO_ELENCO}`);
  const esiti: Esito[] = [];
  for (const fonte of fonti) {
    process.stdout.write(`- ${fonte.id} … `);
    try {
      const esito = await importaFonte(fonte, salva, opzioni.prova);
      esiti.push(esito);
      console.log(
        esito.stato === "importata"
          ? `ok, ${esito.frammenti} frammenti`
          : esito.stato === "disattivata"
            ? "disattivata"
            : "non ancora ricontrollata a mano",
      );
    } catch (errore) {
      const motivo = descriviErrore(errore);
      esiti.push({ id: fonte.id, stato: "errore", motivo });
      console.log(`ERRORE: ${motivo}`);
    }
  }

  console.log("\nRiepilogo");
  for (const esito of esiti) {
    if (esito.stato === "importata") {
      console.log(`  ✓ ${esito.id}: ${esito.frammenti} frammenti, ${migliaia(esito.caratteri)} caratteri`);
      if (esito.avviso) console.log(`    ! ${esito.avviso}`);
    } else if (esito.stato === "disattivata") {
      console.log(`  – ${esito.id}: disattivata (attiva = false), non scaricata`);
    } else if (esito.stato === "da_ricontrollare") {
      console.log(`  – ${esito.id}: ${MESSAGGIO_DA_RICONTROLLARE} (salvata con attiva = false, non scaricata)`);
    } else {
      console.log(`  ✗ ${esito.id}: ${esito.motivo}`);
    }
  }
  const errori = esiti.filter((e) => e.stato === "errore").length;
  console.log(`\n${esiti.length - errori} riuscite, ${errori} non riuscite.`);

  if (opzioni.sql && !opzioni.prova) {
    writeFileSync(opzioni.sql, `-- Fonti della chat, generate il ${new Date().toISOString()}\nbegin;\n\n${istruzioniSql.join("\n\n")}\n\ncommit;\n`);
    console.log(`Istruzioni SQL scritte in ${opzioni.sql}: incollale nel SQL editor di Supabase.`);
  }
  if (supabase && !opzioni.solo) await segnalaFontiNonInElenco(supabase, new Set(elenco.fonti.map((f) => f.id)));
  if (errori > 0) process.exitCode = 1;
}

main().catch((errore: unknown) => {
  console.error(`Import interrotto: ${descriviErrore(errore)}`);
  process.exitCode = 1;
});
