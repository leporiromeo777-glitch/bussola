/**
 * «Fotografa la lettera»: la foto o il PDF va al sito (POST /api/lettera),
 * Claude la legge e il sito restituisce la spiegazione. Come sul sito, la
 * lettera e la spiegazione non si salvano da nessuna parte: restano nella
 * schermata finché non la chiudi. Con l'accesso si manda il token
 * (`Authorization: Bearer`): il limite di letture conta per account invece
 * che per connessione. Senza accesso funziona lo stesso.
 */
import {
  MESSAGGIO_SENZA_CONNESSIONE,
  MESSAGGIO_TROPPO_LENTO,
  leggiDisponibilitaLettera,
  leggiRispostaLettera,
  type EsitoLettera,
} from "@/lib/lettera/risposta";
import { tokenAttuale } from "./api";
import { SITO_URL } from "./config";
import type { FileRicevuta } from "./conti";

const URL_LETTERA = `${SITO_URL}/api/lettera`;

/** Il sito smette dopo 60 secondi: qui un po' di margine per la rete del telefono. */
const TEMPO_MASSIMO_MS = 75_000;

/** La funzione è attiva sul sito? null se non si sa (rete assente): si lascia provare. */
export async function letteraAttiva(): Promise<boolean | null> {
  try {
    const risposta = await fetch(URL_LETTERA, { headers: { Accept: "application/json" } });
    return leggiDisponibilitaLettera(risposta.status, await risposta.json().catch(() => null));
  } catch {
    return null;
  }
}

/** Esito della lettura; `annullata` se hai chiuso la schermata prima della risposta. */
export type EsitoInvio = EsitoLettera | { ok: false; annullata: true };

/** Manda la lettera al sito e aspetta la spiegazione (di solito 10–20 secondi). */
export async function spiegaLettera(file: FileRicevuta, segnale?: AbortSignal): Promise<EsitoInvio> {
  const intestazioni: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  const token = await tokenAttuale();
  if (token) intestazioni.Authorization = `Bearer ${token}`;

  const controllo = new AbortController();
  let scaduto = false;
  const timer = setTimeout(() => {
    scaduto = true;
    controllo.abort();
  }, TEMPO_MASSIMO_MS);
  const annulla = () => controllo.abort();
  if (segnale?.aborted) controllo.abort();
  segnale?.addEventListener("abort", annulla);
  try {
    const risposta = await fetch(URL_LETTERA, {
      method: "POST",
      headers: intestazioni,
      // Solo tipo e contenuto: il nome del file non serve e non si manda.
      body: JSON.stringify({ tipo: file.tipo, dati: file.dati }),
      signal: controllo.signal,
    });
    return leggiRispostaLettera(risposta.status, await risposta.json().catch(() => null));
  } catch {
    if (segnale?.aborted && !scaduto) return { ok: false, annullata: true };
    return { ok: false, messaggio: scaduto ? MESSAGGIO_TROPPO_LENTO : MESSAGGIO_SENZA_CONNESSIONE, stato: 0 };
  } finally {
    clearTimeout(timer);
    segnale?.removeEventListener("abort", annulla);
  }
}
