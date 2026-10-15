import Anthropic from "@anthropic-ai/sdk";
import { MESSAGGI } from "./messaggi";

/**
 * Messaggio in italiano per un errore della chiamata a Claude, senza mai
 * mostrare il testo grezzo dell'errore. `null` se la richiesta è stata
 * interrotta da chi chiede (pagina chiusa): non c'è nessuno a cui rispondere.
 * Le classi si controllano dalla più specifica alla più generica.
 */
export function messaggioErrore(errore: unknown): string | null {
  if (errore instanceof Anthropic.APIUserAbortError) return null;
  if (errore instanceof Anthropic.RateLimitError) return MESSAGGI.troppeRichieste;
  if (errore instanceof Anthropic.AuthenticationError || errore instanceof Anthropic.PermissionDeniedError) {
    return MESSAGGI.configurazioneErrata;
  }
  if (errore instanceof Anthropic.APIConnectionError) return MESSAGGI.connessione;
  if (errore instanceof Anthropic.APIError) {
    if (errore.status === 529 || errore.type === "overloaded_error") return MESSAGGI.servizioOccupato;
    return MESSAGGI.erroreGenerico;
  }
  if (errore instanceof Error && errore.name === "AbortError") return null;
  return MESSAGGI.erroreGenerico;
}

/** Dettagli sicuri da scrivere nei log del server (niente testo della domanda). */
export function dettagliErrore(errore: unknown): Record<string, unknown> {
  if (errore instanceof Anthropic.APIError) {
    return { tipo: errore.constructor.name, status: errore.status, request_id: errore.requestID ?? null };
  }
  if (errore instanceof Error) return { tipo: errore.name, messaggio: errore.message };
  return { tipo: typeof errore };
}
