/**
 * «Cassetto dei documenti»: chiamate al sito con il token dell'accesso
 * ("Authorization: Bearer"). I tipi sono quelli del sito
 * (src/lib/cassetto/tipi.ts). I file stanno nell'account, sul telefono solo
 * nome e data di scadenza dei documenti, per i promemoria.
 */
import { useMemo, useSyncExternalStore } from "react";
import {
  CHIAVE_SCADENZE_DOCUMENTI,
  analizzaScadenzeDocumenti,
  scadenzeDaDocumenti,
  type ScadenzaDocumento,
} from "@/lib/cassetto/promemoria";
import type { DocumentoCassetto, RispostaCassetto, TipoDocumento } from "@/lib/cassetto/tipi";
import { tokenAttuale } from "./api";
import { SITO_URL } from "./config";
import { iscriviti, leggi, scrivi } from "./memoria";

export type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string; stato: number | null };

export type CampiDocumento = {
  titolo: string;
  tipo: TipoDocumento;
  /** AAAA-MM-GG o null. */
  scadeIl: string | null;
  nota: string | null;
};

export type FileDocumento = {
  tipo: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  /** Base64 senza il prefisso «data:». */
  dati: string;
  nomeFile?: string;
};

const MESSAGGI: Record<number, string> = {
  401: "Accedi di nuovo per vedere i tuoi documenti.",
  404: "Questo documento non c'è più. Tira giù per aggiornare.",
  413: "Il file è troppo grande. Prova con una foto più vicina o con un PDF più leggero.",
  429: "Hai caricato diversi documenti in poco tempo. Riprova tra un'ora.",
  503: "Il cassetto dei documenti non è ancora attivo.",
};

async function chiama<T>(percorso: string, opzioni: { metodo?: string; corpo?: unknown } = {}): Promise<Esito<T>> {
  const token = await tokenAttuale();
  if (!token) return { ok: false, messaggio: "Accedi per vedere i tuoi documenti.", stato: 401 };
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
    return { ok: false, messaggio: "Non riesco a raggiungere Bleo: controlla la connessione e riprova.", stato: null };
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
  if (corpo === null || typeof corpo !== "object") {
    return { ok: false, messaggio: "Risposta inattesa da Bleo. Riprova tra poco.", stato: risposta.status };
  }
  return { ok: true, dati: corpo as T };
}

function estrai<T, K extends string>(esito: Esito<Record<K, T>>, chiave: K): Esito<T> {
  if (!esito.ok) return esito;
  const valore = esito.dati[chiave];
  return valore ? { ok: true, dati: valore } : { ok: false, messaggio: "Risposta inattesa da Bleo. Riprova tra poco.", stato: null };
}

const url = (id: string) => `/api/documenti/${encodeURIComponent(id)}`;

export async function caricaDocumenti(): Promise<Esito<DocumentoCassetto[]>> {
  const esito = await chiama<RispostaCassetto>("/api/documenti");
  if (!esito.ok) return esito;
  return Array.isArray(esito.dati.documenti)
    ? { ok: true, dati: esito.dati.documenti }
    : { ok: false, messaggio: "Risposta inattesa da Bleo. Riprova tra poco.", stato: null };
}

export async function creaDocumento(campi: CampiDocumento, file: FileDocumento): Promise<Esito<DocumentoCassetto>> {
  return estrai(
    await chiama<{ documento: DocumentoCassetto }>("/api/documenti", { metodo: "POST", corpo: { ...campi, file } }),
    "documento",
  );
}

export async function aggiornaDocumento(id: string, campi: Partial<CampiDocumento>): Promise<Esito<DocumentoCassetto>> {
  return estrai(await chiama<{ documento: DocumentoCassetto }>(url(id), { metodo: "PATCH", corpo: campi }), "documento");
}

export function eliminaDocumento(id: string): Promise<Esito<void>> {
  return chiama<void>(url(id), { metodo: "DELETE" });
}

/** Link temporaneo (pochi secondi) per aprire il file. */
export async function linkFile(id: string): Promise<Esito<string>> {
  return estrai(await chiama<{ url: string }>(`${url(id)}/file`), "url");
}

// --- Scadenze salvate sul telefono, per i promemoria (src/lib/cassetto/promemoria.ts).

export function leggiScadenzeDocumenti(): ScadenzaDocumento[] {
  return analizzaScadenzeDocumenti(leggi(CHIAVE_SCADENZE_DOCUMENTI));
}

/** Salva nome e data di scadenza dei documenti; true se sono cambiati (vanno riprogrammati i promemoria). */
export function salvaScadenzeDocumenti(documenti: readonly DocumentoCassetto[]): boolean {
  const nuove = JSON.stringify(scadenzeDaDocumenti(documenti));
  const vecchie = leggi(CHIAVE_SCADENZE_DOCUMENTI) ?? "[]";
  if (nuove === vecchie) return false;
  scrivi(CHIAVE_SCADENZE_DOCUMENTI, nuove === "[]" ? null : nuove);
  return true;
}

/** Toglie dal telefono le scadenze dei documenti (uscita dall'account). true se ce n'erano. */
export function dimenticaScadenzeDocumenti(): boolean {
  if (leggi(CHIAVE_SCADENZE_DOCUMENTI) === null) return false;
  scrivi(CHIAVE_SCADENZE_DOCUMENTI, null);
  return true;
}

/** Le scadenze salvate, aggiornate quando cambiano (per il pallino). */
export function useScadenzeDocumenti(): ScadenzaDocumento[] {
  const grezzo = useSyncExternalStore(
    iscriviti,
    () => leggi(CHIAVE_SCADENZE_DOCUMENTI),
    () => null,
  );
  return useMemo(() => analizzaScadenzeDocumenti(grezzo), [grezzo]);
}

let aggiornamentoInCorso = false;

/**
 * Rilegge i documenti dall'account e salva le scadenze sul telefono, senza
 * mostrare errori: così arrivano i promemoria anche dei documenti caricati
 * dal sito. true se le scadenze sono cambiate.
 */
export async function aggiornaScadenzeDocumenti(): Promise<boolean> {
  if (aggiornamentoInCorso) return false;
  aggiornamentoInCorso = true;
  try {
    const esito = await caricaDocumenti();
    return esito.ok ? salvaScadenzeDocumenti(esito.dati) : false;
  } finally {
    aggiornamentoInCorso = false;
  }
}
