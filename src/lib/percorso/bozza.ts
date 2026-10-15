/**
 * Bozza del questionario: le risposte date finora e la domanda a cui si è
 * arrivati. Sta in sessionStorage (solo questa scheda), così un ricaricamento,
 * il tasto Indietro del browser o una scheda ricaricata dal telefono non fanno
 * ricominciare da capo. Si cancella alla fine del questionario e all'uscita
 * dall'account. Ogni accesso è protetto: se il browser non salva, il
 * questionario funziona lo stesso, senza bozza.
 */
import { DOMANDE } from "./domande";
import { LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO, VERSIONE_RISPOSTE, type IdDomanda, type Risposte } from "./risposte";

export const CHIAVE_BOZZA = "bussola:questionario:bozza";

/** Risposte date finora (ancora incomplete). */
export type Bozza = Partial<Omit<Risposte, "versione">>;

export type BozzaSalvata = { indice: number; bozza: Bozza };

/** Tiene solo le risposte valide: valori tra le opzioni della domanda e testo libero non troppo lungo. */
export function pulisciBozza(dati: unknown): Bozza {
  if (!dati || typeof dati !== "object" || Array.isArray(dati)) return {};
  const grezza = dati as Record<string, unknown>;
  const bozza: Record<string, string> = {};
  for (const domanda of DOMANDE) {
    const valore = grezza[domanda.id];
    if (typeof valore === "string" && domanda.opzioni.some((o) => o.valore === valore)) bozza[domanda.id] = valore;
  }
  const altro = grezza.attivitaAltro;
  if (typeof altro === "string" && altro.length <= LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO) bozza.attivitaAltro = altro;
  return bozza as Bozza;
}

/** La bozza salvata, se valida e della versione attuale delle risposte. */
export function analizzaBozza(grezzo: string | null): BozzaSalvata | null {
  if (!grezzo) return null;
  try {
    const dati: unknown = JSON.parse(grezzo);
    if (!dati || typeof dati !== "object" || Array.isArray(dati)) return null;
    const { versione, indice, bozza } = dati as Record<string, unknown>;
    if (versione !== VERSIONE_RISPOSTE) return null;
    if (typeof indice !== "number" || !Number.isInteger(indice) || indice < 0 || indice >= DOMANDE.length) return null;
    if (!bozza || typeof bozza !== "object" || Array.isArray(bozza)) return null;
    return { indice, bozza: pulisciBozza(bozza) };
  } catch {
    return null;
  }
}

/**
 * La domanda da cui riprendere: quella chiesta, se tutte le precedenti hanno
 * una risposta; altrimenti la prima senza risposta.
 */
export function indiceDiRipresa(indice: number, valori: Bozza): number {
  const richiesto = Math.min(Math.max(Math.trunc(indice) || 0, 0), DOMANDE.length - 1);
  const mancante = DOMANDE.findIndex((d) => !valori[d.id as IdDomanda]);
  return mancante >= 0 && mancante < richiesto ? mancante : richiesto;
}

function spazio(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function leggiBozzaGrezza(): string | null {
  try {
    return spazio()?.getItem(CHIAVE_BOZZA) ?? null;
  } catch {
    return null;
  }
}

export function salvaBozza({ indice, bozza }: BozzaSalvata): void {
  try {
    spazio()?.setItem(CHIAVE_BOZZA, JSON.stringify({ versione: VERSIONE_RISPOSTE, indice, bozza }));
  } catch {
    // Il browser non salva: il questionario continua senza bozza.
  }
}

export function cancellaBozza(): void {
  try {
    spazio()?.removeItem(CHIAVE_BOZZA);
  } catch {
    // Niente da cancellare.
  }
}
