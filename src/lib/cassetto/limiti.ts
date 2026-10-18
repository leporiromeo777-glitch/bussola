/**
 * «Cassetto dei documenti»: limiti fissi. Logica pura, la usano sito, API e app.
 * I pesi dei file sono quelli delle ricevute (src/lib/lettera/richiesta.ts).
 */

/**
 * Documenti al massimo per persona: un'attività piccola ne ha qualche decina.
 * Stesso numero nel trigger della migrazione 20261019000004_cassetto_documenti.sql
 * (lo verifica supabase/schema.test.ts).
 */
export const DOCUMENTI_MASSIMI = 100;

/** Durata del link temporaneo per aprire un documento, in secondi: i documenti sono personali. */
export const DURATA_LINK_CASSETTO = 60;

/** Giorni prima della scadenza in cui arriva un promemoria (notifiche dell'app e calendario). */
export const GIORNI_AVVISO_DOCUMENTI = [30, 7] as const;

/** Da quanti giorni prima della scadenza un documento è «da guardare» (il primo promemoria). */
export const GIORNI_IN_SCADENZA = GIORNI_AVVISO_DOCUMENTI[0];

/** Date di scadenza accettate: fuori da qui è quasi sicuramente un errore di battitura. */
export const SCADENZA_MINIMA = "2000-01-01";
export const SCADENZA_MASSIMA = "2100-12-31";

export const LUNGHEZZE_CASSETTO = {
  titolo: 120,
  nota: 500,
  nomeFile: 200,
} as const;
