/**
 * «Racconta a Bleo» nel questionario: il testo va al sito (POST
 * /api/racconta), Claude ne ricava le risposte e il sito le restituisce da
 * controllare. Come sul sito, il testo non si salva da nessuna parte. Con
 * l'accesso si manda il token (`Authorization: Bearer`): il limite delle
 * prove conta per account invece che per connessione. Senza accesso
 * funziona lo stesso, con il limite per connessione del sito.
 */
import { useEffect, useState } from "react";
import {
  TESTI_RACCONTO,
  leggiDisponibilitaRacconto,
  leggiRispostaRacconto,
  type EsitoRacconto,
} from "@/lib/percorso/racconto-revisione";
import { tokenAttuale } from "./api";
import { SITO_URL } from "./config";

const URL_RACCONTO = `${SITO_URL}/api/racconta`;

/** Il sito smette dopo 60 secondi: qui un po' di margine per la rete del telefono. */
const TEMPO_MASSIMO_MS = 75_000;

/** La funzione è attiva sul sito? null se non si sa (rete assente): si lascia provare. */
export async function raccontoAttivo(): Promise<boolean | null> {
  try {
    const risposta = await fetch(URL_RACCONTO, { headers: { Accept: "application/json" } });
    return leggiDisponibilitaRacconto(risposta.status, await risposta.json().catch(() => null));
  } catch {
    return null;
  }
}

/** Lo stato di «Racconta a Bleo» sul sito, chiesto una volta all'apertura (null finché non si sa). */
export function useRaccontoAttivo(): [boolean | null, (attivo: boolean) => void] {
  const [attivo, setAttivo] = useState<boolean | null>(null);
  useEffect(() => {
    let valido = true;
    void raccontoAttivo().then((v) => {
      if (valido && v !== null) setAttivo(v);
    });
    return () => {
      valido = false;
    };
  }, []);
  return [attivo, setAttivo];
}

/** Esito dell'invio; `annullato` se hai chiuso la schermata prima della risposta. */
export type EsitoInvioRacconto = EsitoRacconto | { ok: false; annullato: true };

/** Manda il racconto al sito e aspetta le risposte proposte (di solito pochi secondi). */
export async function inviaRacconto(testo: string, segnale?: AbortSignal): Promise<EsitoInvioRacconto> {
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
    const risposta = await fetch(URL_RACCONTO, {
      method: "POST",
      headers: intestazioni,
      body: JSON.stringify({ testo }),
      signal: controllo.signal,
    });
    return leggiRispostaRacconto(risposta.status, await risposta.json().catch(() => null));
  } catch {
    if (segnale?.aborted && !scaduto) return { ok: false, annullato: true };
    return scaduto
      ? { ok: false, motivo: "lento", messaggio: TESTI_RACCONTO.troppoLento, stato: 0 }
      : { ok: false, motivo: "rete", messaggio: TESTI_RACCONTO.senzaConnessione, stato: 0 };
  } finally {
    clearTimeout(timer);
    segnale?.removeEventListener("abort", annulla);
  }
}
