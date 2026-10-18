/**
 * «Clienti e ore»: limiti fissi. Logica pura, la usano sito, API e app.
 * Gli stessi numeri sono nei vincoli della migrazione
 * 20261019000005_clienti_ore.sql (lo verifica supabase/schema.test.ts).
 */

/** Durata massima di una voce: un giorno intero, in minuti. */
export const MINUTI_MASSIMI = 24 * 60;

/** Tariffa oraria massima, in franchi (sopra c'è quasi sicuramente un errore di battitura). */
export const TARIFFA_MASSIMA = 10_000;

/** Voci al massimo in una fattura: lo strumento fattura tiene fino a 100 righe. */
export const RIGHE_MASSIME_FATTURA = 100;

export const LUNGHEZZE_ORE = {
  descrizione: 200,
  email: 254,
} as const;
