/**
 * «Preventivo e fattura» nell'app: i documenti e i tuoi dati stanno
 * nell'account (le stesse API del sito, con "Authorization: Bearer"), così
 * sono gli stessi sul sito e sul telefono. Le modifiche si salvano da sole
 * dopo una breve pausa (src/lib/strumenti/archivio-account.ts); calcoli,
 * controlli e QR-fattura sono quelli del sito (src/lib/strumenti).
 *
 * Il PDF si crea sul telefono con expo-print dall'HTML del documento
 * (src/lib/strumenti/stampa-documento.ts) e si condivide con expo-sharing:
 * non passa dai server di Bleo.
 */
import { Directory, File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEffect, useSyncExternalStore } from "react";
import { AppState, Platform } from "react-native";
import { documentoDaPrecompilazione } from "@/lib/clienti/fattura";
import type { Precompilazione } from "@/lib/clienti/tipi";
import type { FatturaEmessa } from "@/lib/conti/tipi";
import { ArchivioAccount, type Chiamata, type StatoArchivio } from "@/lib/strumenti/archivio-account";
import {
  dataIsoLocale,
  emittenteVuoto,
  fatturaPerConti,
  type Contesto,
  type Documento,
  type Emittente,
} from "@/lib/strumenti/documenti";
import { A4_PUNTI, htmlDocumento, nomeFilePdf } from "@/lib/strumenti/stampa-documento";
import { tokenAttuale } from "./api";
import { SITO_URL } from "./config";
import { supabase } from "./supabase";

const MESSAGGI: Record<number, string> = {
  401: "Accedi di nuovo per salvare preventivi e fatture.",
  413: "Il documento è troppo lungo per salvarlo: togli qualche voce o accorcia le descrizioni.",
  503: "Il salvataggio di preventivi e fatture non è ancora attivo.",
};

const chiamaApp: Chiamata = async <T,>(percorso: string, opzioni: { metodo?: string; corpo?: unknown } = {}) => {
  const token = await tokenAttuale();
  if (!token) return { ok: false, messaggio: MESSAGGI[401], stato: 401 };
  const intestazioni: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (opzioni.corpo !== undefined) intestazioni["Content-Type"] = "application/json";
  let risposta: Response;
  try {
    risposta = await fetch(`${SITO_URL}${percorso}`, {
      method: opzioni.metodo ?? "GET",
      headers: intestazioni,
      body: opzioni.corpo === undefined ? undefined : JSON.stringify(opzioni.corpo),
    });
  } catch {
    return { ok: false, messaggio: "Non riesco a raggiungere Bleo: controlla la connessione. Riprovo da solo.", stato: null };
  }
  if (risposta.status === 204) return { ok: true, dati: undefined as T };
  const corpo = (await risposta.json().catch(() => null)) as unknown;
  if (!risposta.ok) {
    const messaggio = (corpo as { messaggio?: unknown } | null)?.messaggio;
    return {
      ok: false,
      messaggio:
        typeof messaggio === "string" && messaggio.trim()
          ? messaggio
          : (MESSAGGI[risposta.status] ?? "Qualcosa non ha funzionato. Riprova tra poco."),
      stato: risposta.status,
    };
  }
  return { ok: true, dati: corpo as T };
};

/** L'archivio dell'app: uno solo, condiviso da elenco, modifica e «Clienti e ore». */
export const archivioFatture = new ArchivioAccount(chiamaApp);

// Uscendo dall'account (o entrando con un altro) si dimentica tutto; andando in
// secondo piano si salva subito quello che manca.
let utenteAttuale: string | null | undefined;
supabase()?.auth.onAuthStateChange((_evento, sessione) => {
  const utente = sessione?.user.id ?? null;
  if (utenteAttuale !== undefined && utente !== utenteAttuale) archivioFatture.azzera();
  utenteAttuale = utente;
});
AppState.addEventListener("change", (stato) => {
  if (stato !== "active" && archivioFatture.inAttesa()) void archivioFatture.salva();
});

/** Lo stato dell'archivio; la prima volta legge i documenti dall'account. */
export function useArchivioFatture(): StatoArchivio {
  const stato = useSyncExternalStore(archivioFatture.iscrivi, archivioFatture.istantanea, archivioFatture.istantanea);
  useEffect(() => {
    void archivioFatture.carica();
  }, []);
  return stato;
}

/** Id casuale per documenti e voci (stessa forma di quelli del sito). */
export function nuovoId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  const pezzo = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  return `${Date.now().toString(36)}-${pezzo()}-${pezzo()}`;
}

export function contesto(): Contesto {
  const adesso = new Date();
  return { id: nuovoId(), oggiIso: dataIsoLocale(adesso), adessoIso: adesso.toISOString(), idRiga: nuovoId };
}

/** I tuoi dati per i prossimi documenti (vuoti se non li hai ancora scritti). */
export function profiloAttuale(stato: StatoArchivio): Emittente {
  return stato.emittente ?? emittenteVuoto();
}

/**
 * La fattura preparata da «Clienti e ore»: si aggiunge ai documenti (una
 * volta sola: l'id è quello della precompilazione) e si salva subito.
 * Restituisce l'id da aprire, o null se i documenti non si possono leggere.
 */
export async function creaFatturaDaOre(p: Precompilazione): Promise<string | null> {
  await archivioFatture.carica();
  const stato = archivioFatture.istantanea();
  if (stato.caricamento !== "pronto") return null;
  archivioFatture.aggiornaDocumenti((lista) =>
    lista.some((d) => d.id === p.id) ? lista : [...lista, documentoDaPrecompilazione(p, profiloAttuale(stato), lista, contesto())],
  );
  void archivioFatture.salva();
  return p.id;
}

/* ------------------------------------------------------------------ */
/* «I tuoi conti»                                                      */
/* ------------------------------------------------------------------ */

/** «Registra in I tuoi conti»: numero, cliente, date, totale e riferimento (come sul sito). */
export async function registraNeiConti(
  doc: Documento,
): Promise<{ ok: true; fattura: FatturaEmessa } | { ok: false; messaggio: string }> {
  const esito = await chiamaApp<{ fattura?: FatturaEmessa }>("/api/conti/fatture", {
    metodo: "POST",
    corpo: fatturaPerConti(doc),
  });
  if (!esito.ok) return { ok: false, messaggio: esito.messaggio };
  if (!esito.dati.fattura) return { ok: false, messaggio: "Risposta inattesa da Bleo. Riprova tra poco." };
  return { ok: true, fattura: esito.dati.fattura };
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Crea il PDF A4 del documento nella cache del telefono, con il nome
 * «Fattura F-2026-001.pdf». Se il documento non sta su una pagina insieme
 * alla sezione pagamento, la sezione va su una pagina sua, in fondo.
 */
export async function creaPdf(doc: Documento): Promise<string> {
  const opzioni = {
    width: A4_PUNTI.larghezza,
    height: A4_PUNTI.altezza,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
  };
  let risultato = await Print.printToFileAsync({ ...opzioni, html: htmlDocumento(doc) });
  if (doc.tipo === "fattura" && risultato.numberOfPages > 1) {
    const primo = risultato.uri;
    risultato = await Print.printToFileAsync({ ...opzioni, html: htmlDocumento(doc, { impaginazione: "pagina-separata" }) });
    cancellaSenzaErrori(new File(primo));
  }
  try {
    // I PDF di prima non servono più: ne resta uno, con il nome giusto.
    const base = new Directory(Paths.cache, "pdf-bleo");
    cancellaSenzaErrori(base);
    const cartella = new Directory(base, nuovoId());
    cartella.create({ intermediates: true, idempotent: true });
    const file = new File(risultato.uri);
    const conNome = new File(cartella, nomeFilePdf(doc));
    await file.move(conNome);
    return conNome.uri;
  } catch {
    // Se il nome non si può cambiare, il PDF va bene lo stesso.
    return risultato.uri;
  }
}

function cancellaSenzaErrori(voce: File | Directory) {
  try {
    if (voce.exists) voce.delete();
  } catch {
    // Resta nella cache: il telefono la svuota da solo.
  }
}

/** Crea il PDF e apre la condivisione (email, messaggi, File…). */
export async function condividiPdf(doc: Documento): Promise<void> {
  const uri = await creaPdf(doc);
  if (!(await Sharing.isAvailableAsync())) throw new Error("condivisione non disponibile");
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: nomeFilePdf(doc).replace(/\.pdf$/, ""),
  });
}

/** Crea il PDF e apre la stampa del telefono (con l'anteprima delle pagine). */
export async function stampaPdf(doc: Documento): Promise<void> {
  const uri = await creaPdf(doc);
  await Print.printAsync({ uri });
}

/** Sul web (anteprima di sviluppo) PDF e condivisione non ci sono. */
export const PDF_DISPONIBILE = Platform.OS !== "web";
