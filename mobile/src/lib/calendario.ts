/**
 * «Calendario sempre aggiornato»: chiamate al sito con il token dell'accesso
 * ("Authorization: Bearer"), come i conti. Il link intero resta solo su
 * questo telefono (stessa chiave del sito): il server ne tiene l'impronta.
 */
import {
  analizzaLinkSalvato,
  leggiLinkCreato,
  leggiStatoCalendario,
  linkCalendario,
  PERCORSO_CALENDARIO,
  serializzaLinkSalvato,
  type LinkCreato,
  type LinkSalvato,
  type StatoCalendario,
} from "@/lib/percorso/abbonamento";
import { CHIAVE_LINK_CALENDARIO } from "@/lib/percorso/archivio";
import type { Risposte } from "@/lib/percorso/risposte";
import { tokenAttuale } from "./api";
import { SITO_URL } from "./config";
import { leggi, scrivi } from "./memoria";

export type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string; stato: number | null };

const MESSAGGI: Record<number, string> = {
  400: "Le risposte del questionario non sono valide: rifai il questionario e riprova.",
  401: "Accedi di nuovo per avere il link del calendario.",
  503: "Il calendario sempre aggiornato non è ancora attivo.",
};
const INATTESA = "Risposta inattesa da Bleo. Riprova tra poco.";

async function chiama(metodo: string, corpo?: unknown): Promise<Esito<unknown>> {
  const token = await tokenAttuale();
  if (!token) return { ok: false, messaggio: "Accedi per avere il link del calendario.", stato: 401 };
  const intestazioni: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (corpo !== undefined) intestazioni["Content-Type"] = "application/json";
  let risposta: Response;
  try {
    risposta = await fetch(`${SITO_URL}${PERCORSO_CALENDARIO}`, {
      method: metodo,
      headers: intestazioni,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    return { ok: false, messaggio: "Non riesco a raggiungere Bleo: controlla la connessione e riprova.", stato: null };
  }
  if (risposta.status === 204) return { ok: true, dati: null };
  const dati = (await risposta.json().catch(() => null)) as unknown;
  if (!risposta.ok) {
    const messaggio = (dati as { messaggio?: unknown } | null)?.messaggio;
    return {
      ok: false,
      messaggio:
        typeof messaggio === "string" && messaggio.trim()
          ? messaggio
          : (MESSAGGI[risposta.status] ?? "Qualcosa non ha funzionato. Riprova tra poco."),
      stato: risposta.status,
    };
  }
  return { ok: true, dati };
}

function conStato(esito: Esito<unknown>): Esito<StatoCalendario> {
  if (!esito.ok) return esito;
  const stato = leggiStatoCalendario(esito.dati);
  return stato ? { ok: true, dati: stato } : { ok: false, messaggio: INATTESA, stato: null };
}

/** Il link attivo (senza token) e le risposte salvate nell'account. */
export async function leggiCalendario(): Promise<Esito<StatoCalendario>> {
  return conStato(await chiama("GET"));
}

/** Un link nuovo al posto di quello vecchio (se c'era). */
export async function creaLinkCalendario(): Promise<Esito<LinkCreato>> {
  const esito = await chiama("POST");
  if (!esito.ok) return esito;
  const link = leggiLinkCreato(esito.dati);
  return link ? { ok: true, dati: link } : { ok: false, messaggio: INATTESA, stato: null };
}

export async function disattivaLinkCalendario(): Promise<Esito<null>> {
  const esito = await chiama("DELETE");
  return esito.ok ? { ok: true, dati: null } : esito;
}

/** Salva nell'account le risposte di questo telefono: le scadenze del calendario nascono da lì. */
export async function usaRisposteDelTelefono(risposte: Risposte): Promise<Esito<StatoCalendario>> {
  return conStato(await chiama("PUT", { risposte }));
}

/** La copia del link su questo telefono, se è dell'utente e del link attivo. */
export function leggiLinkLocale(userId: string, idAttivo: string | null): LinkSalvato | null {
  return analizzaLinkSalvato(leggi(CHIAVE_LINK_CALENDARIO), userId, idAttivo);
}

export function salvaLinkLocale(link: LinkSalvato | null): void {
  scrivi(CHIAVE_LINK_CALENDARIO, link ? serializzaLinkSalvato(link) : null);
}

/** Il link completo, sul sito di Bleo. */
export function linkCompleto(percorso: string): string {
  return linkCalendario(SITO_URL, percorso);
}
