/** Limiti della chat, condivisi tra il modulo nel browser e la validazione sul server. */
export const LUNGHEZZA_MINIMA_DOMANDA = 3;
export const LUNGHEZZA_MASSIMA_DOMANDA = 1_000;
export const LUNGHEZZA_MASSIMA_RISPOSTA_PRECEDENTE = 4_000;
export const SCAMBI_PRECEDENTI_MASSIMI = 3;
/** Ogni risposta precedente si accorcia a tanti caratteri prima di rimandarla a Claude come contesto. */
export const LUNGHEZZA_RISPOSTA_IN_CRONOLOGIA = 2_000;
