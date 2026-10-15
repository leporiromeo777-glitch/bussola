/** Origine fittizia: serve solo a capire se un percorso resta sul nostro sito. */
const BASE = "https://interno.invalid";

/** Dove si va dopo l'accesso se `next` manca o non è sicuro. */
export const DESTINAZIONE_PREDEFINITA = "/questionario";

/**
 * Percorso interno sicuro per i redirect dopo l'accesso (parametro `next`),
 * altrimenti la destinazione predefinita. Rifiuta tutto quello che il
 * browser potrebbe leggere come un altro sito: `//host`, `/\host`, tab e a
 * capo (che il parser degli URL toglie), URL assoluti.
 */
export function destinazioneInterna(valore: unknown, predefinita = DESTINAZIONE_PREDEFINITA): string {
  if (typeof valore !== "string" || !/^\/(?![/\\])[^\\\s]*$/.test(valore)) return predefinita;
  try {
    const url = new URL(valore, BASE);
    return url.origin === BASE ? `${url.pathname}${url.search}${url.hash}` : predefinita;
  } catch {
    return predefinita;
  }
}
