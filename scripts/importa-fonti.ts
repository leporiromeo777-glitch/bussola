/**
 * Importa le fonti ufficiali di supabase/fonti/elenco.json nella base di
 * fonti della chat (tabelle `fonti` e `frammenti_fonti`).
 *
 *   npm run fonti:importa                 tutte le fonti
 *   npm run fonti:importa -- --solo <id>  una fonte sola
 *   npm run fonti:importa -- --prova      scarica e divide, senza scrivere nel database
 *
 * Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY in .env.local
 * (tranne che con --prova). Istruzioni complete in docs/fonti.md.
 */
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { extractText, getDocumentProxy } from "unpdf";
import { leggiElenco, type FonteElenco } from "../src/lib/fonti/elenco";
import { estraiTestoHtml } from "../src/lib/fonti/estrai-html";
import { pagineInBlocchi } from "../src/lib/fonti/estrai-pdf";
import { dividiInFrammenti, type Frammento } from "../src/lib/fonti/frammenti";

const PERCORSO_ELENCO = "supabase/fonti/elenco.json";
const TEMPO_MASSIMO_MS = 30_000;
const CARATTERI_MINIMI = 300;
const USER_AGENT =
  "Mozilla/5.0 (compatible; BussolaFonti/1.0; import delle fonti ufficiali per la chat di Bussola)";

type Opzioni = { solo: string | null; prova: boolean; aiuto: boolean };
type Esito =
  | { id: string; stato: "importata"; frammenti: number; caratteri: number; avviso?: string }
  | { id: string; stato: "disattivata" }
  | { id: string; stato: "errore"; motivo: string };
type Scaricato = { urlFinale: string; pdf: boolean; dati: ArrayBuffer; charset: string | null };

function leggiOpzioni(argv: string[]): Opzioni {
  const opzioni: Opzioni = { solo: null, prova: false, aiuto: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--solo") opzioni.solo = argv[++i] ?? "";
    else if (arg?.startsWith("--solo=")) opzioni.solo = arg.slice("--solo=".length);
    else if (arg === "--prova") opzioni.prova = true;
    else if (arg === "--aiuto" || arg === "--help" || arg === "-h") opzioni.aiuto = true;
    else throw new Error(`Opzione sconosciuta: ${arg}. Usa --aiuto per l'elenco.`);
  }
  if (opzioni.solo === "") throw new Error("Dopo --solo indica l'id di una fonte, es. --solo ahv-2-02-indipendenti");
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

async function importaFonte(fonte: FonteElenco, supabase: SupabaseClient | null, prova: boolean): Promise<Esito> {
  if (!fonte.attiva) {
    if (supabase) await salvaFonte(supabase, fonte, null);
    return { id: fonte.id, stato: "disattivata" };
  }
  const scaricato = await scarica(fonte.url);
  const frammenti = await estraiFrammenti(scaricato);
  const caratteri = frammenti.reduce((somma, f) => somma + f.testo.length, 0);
  if (caratteri < CARATTERI_MINIMI) {
    throw new Error(
      `testo estratto troppo corto (${caratteri} caratteri): la pagina forse si carica con JavaScript o è cambiata`,
    );
  }
  if (prova) {
    console.log(`\n--- ${fonte.id}: ${frammenti.length} frammenti`);
    for (const f of frammenti) {
      const anteprima = f.testo.slice(0, 120).replace(/\s+/g, " ");
      console.log(`  #${f.posizione} [${f.titolo_sezione ?? "-"}] ${f.testo.length} car.: ${anteprima}…`);
    }
  } else if (supabase) {
    await salvaFonte(supabase, fonte, frammenti);
  }
  const avviso =
    scaricato.urlFinale !== fonte.url
      ? `reindirizzata a ${scaricato.urlFinale}: valuta di aggiornare l'URL in elenco.json`
      : undefined;
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
    console.log("Uso: npm run fonti:importa [-- --solo <id>] [-- --prova]\nVedi docs/fonti.md.");
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
  if (!opzioni.prova) {
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
    supabase = createClient(url, chiave, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  console.log(`${opzioni.prova ? "Prova (niente database)" : "Import"}: ${fonti.length} fonti da ${PERCORSO_ELENCO}`);
  const esiti: Esito[] = [];
  for (const fonte of fonti) {
    process.stdout.write(`- ${fonte.id} … `);
    try {
      const esito = await importaFonte(fonte, supabase, opzioni.prova);
      esiti.push(esito);
      console.log(esito.stato === "importata" ? `ok, ${esito.frammenti} frammenti` : "disattivata");
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
    } else {
      console.log(`  ✗ ${esito.id}: ${esito.motivo}`);
    }
  }
  const errori = esiti.filter((e) => e.stato === "errore").length;
  console.log(`\n${esiti.length - errori} riuscite, ${errori} non riuscite.`);

  if (supabase && !opzioni.solo) await segnalaFontiNonInElenco(supabase, new Set(elenco.fonti.map((f) => f.id)));
  if (errori > 0) process.exitCode = 1;
}

main().catch((errore: unknown) => {
  console.error(`Import interrotto: ${descriviErrore(errore)}`);
  process.exitCode = 1;
});
