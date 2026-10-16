/**
 * «I tuoi conti»: limiti fissi. Logica pura, la usano sito, API e app.
 */

/**
 * Letture con Claude (foto, PDF, email) al giorno per utente, contate nel
 * database da public.prenota_lettura_conti (stesso numero nella migrazione
 * 20261017000000_conti.sql, lo verifica supabase/schema.test.ts).
 */
export const LETTURE_AL_GIORNO = 50;

/** Allegati letti al massimo da una sola email: il lavoro resta entro il tempo della funzione. */
export const ALLEGATI_MASSIMI_PER_EMAIL = 5;

/** Caratteri massimi del testo di un'email mandato a Claude quando non ci sono allegati. */
export const TESTO_EMAIL_MASSIMO = 15_000;

/** Durata del link temporaneo per vedere un documento salvato, in secondi. */
export const DURATA_LINK_DOCUMENTO = 120;

/** Importo massimo di una voce, in franchi (sopra c'è quasi sicuramente un errore di lettura). */
export const IMPORTO_MASSIMO = 100_000_000;

export const LUNGHEZZE = {
  descrizione: 300,
  controparte: 200,
  nota: 500,
  numeroFattura: 40,
  cliente: 140,
  riferimento: 40,
  nomeFile: 200,
} as const;
