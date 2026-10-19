/**
 * «Testi pronti» nell'app: la stessa API del sito (/api/testi), con gli
 * stessi controlli e limiti. I testi non si salvano: restano nella
 * schermata finché non la chiudi; li copi o li condividi tu.
 */
import type { RichiestaTesti } from "@/lib/testi/richiesta";
import { leggiRispostaTesti, type EsitoTesti } from "@/lib/testi/risposta";
import { MESSAGGIO_LENTO, MESSAGGIO_SENZA_CONNESSIONE, inviaAlSito, strumentoAttivo } from "./richiesta-sito";

/** Il sito smette dopo 60 secondi: qui un po' di margine per la rete del telefono. */
const TEMPO_MASSIMO_MS = 75_000;

/** «Testi pronti» è attivo sul sito? null se non si sa. */
export function testiPronti(): Promise<boolean | null> {
  return strumentoAttivo("/api/testi");
}

/** Chiede a Bleo i testi (con `rifai`, un'altra versione). */
export async function scriviTesti(
  richiesta: RichiestaTesti,
  segnale?: AbortSignal,
): Promise<EsitoTesti | { ok: false; annullata: true }> {
  const risposta = await inviaAlSito("/api/testi", richiesta, { segnale, tempoMassimoMs: TEMPO_MASSIMO_MS });
  if (risposta.ok) return leggiRispostaTesti(risposta.stato, risposta.corpo);
  if (risposta.motivo === "annullata") return { ok: false, annullata: true };
  return { ok: false, messaggio: risposta.motivo === "tempo" ? MESSAGGIO_LENTO : MESSAGGIO_SENZA_CONNESSIONE, stato: 0 };
}
