/**
 * Chiamate JSON agli strumenti del sito che funzionano anche senza accesso
 * («Nome della ditta», «Testi pronti»). Con l'accesso si manda il token
 * (`Authorization: Bearer`): il limite delle richieste conta per account
 * invece che per connessione. Senza accesso funziona lo stesso.
 */
import { leggiDisponibilita } from "@/lib/strumenti/disponibilita";
import { tokenAttuale } from "./api";
import { SITO_URL } from "./config";

/** Quando la richiesta non arriva al sito (rete assente, server irraggiungibile). */
export { MESSAGGIO_SENZA_CONNESSIONE } from "@/lib/lettera/risposta";

/** Quando il sito non risponde in tempo. */
export const MESSAGGIO_LENTO = "Bleo ci sta mettendo troppo. Riprova tra poco.";

export type RispostaSito =
  | { ok: true; stato: number; corpo: unknown }
  | { ok: false; motivo: "rete" | "tempo" | "annullata" };

/** Lo strumento è attivo sul sito (GET → { attiva })? null se non si sa: si lascia provare. */
export async function strumentoAttivo(percorso: string): Promise<boolean | null> {
  try {
    const risposta = await fetch(`${SITO_URL}${percorso}`, { headers: { Accept: "application/json" } });
    return leggiDisponibilita(risposta.status, await risposta.json().catch(() => null));
  } catch {
    return null;
  }
}

/**
 * POST JSON al sito con il token, se c'è. Non lancia errori: rete assente,
 * tempo scaduto o schermata chiusa (segnale) diventano un motivo.
 */
export async function inviaAlSito(
  percorso: string,
  corpo: unknown,
  { segnale, tempoMassimoMs }: { segnale?: AbortSignal; tempoMassimoMs: number },
): Promise<RispostaSito> {
  const intestazioni: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  const token = await tokenAttuale().catch(() => null);
  if (token) intestazioni.Authorization = `Bearer ${token}`;

  const controllo = new AbortController();
  let scaduto = false;
  const timer = setTimeout(() => {
    scaduto = true;
    controllo.abort();
  }, tempoMassimoMs);
  const annulla = () => controllo.abort();
  if (segnale?.aborted) controllo.abort();
  segnale?.addEventListener("abort", annulla);
  try {
    const risposta = await fetch(`${SITO_URL}${percorso}`, {
      method: "POST",
      headers: intestazioni,
      body: JSON.stringify(corpo),
      signal: controllo.signal,
    });
    return { ok: true, stato: risposta.status, corpo: await risposta.json().catch(() => null) };
  } catch {
    if (segnale?.aborted && !scaduto) return { ok: false, motivo: "annullata" };
    return { ok: false, motivo: scaduto ? "tempo" : "rete" };
  } finally {
    clearTimeout(timer);
    segnale?.removeEventListener("abort", annulla);
  }
}
