import { z } from "zod";

/**
 * Risposte al questionario iniziale. Lo schema ha una versione: se cambia la
 * forma delle risposte, si aumenta la versione e le risposte vecchie vengono
 * scartate (l'utente rifà il questionario, che dura 5 minuti).
 */
export const VERSIONE_RISPOSTE = "2026-10-15";

export const ATTIVITA = [
  "digitale_creativo",
  "consulenza_formazione",
  "artigianato_edilizia",
  "trasporti",
  "commercio_online",
  "ristorazione_alimentari",
  "salute_benessere",
  "altro",
] as const;

export const CANTONI = ["TI", "GR", "altro"] as const;
export const SOCI = ["solo", "con_soci"] as const;
/** Cifra d'affari prevista nei primi 12 mesi. Le soglie di CHF 100'000 (IVA e registro) sono "almeno 100'000". */
export const FATTURATI = ["meno_10k", "da_10k_a_60k", "da_60k_a_100k", "almeno_100k", "non_so"] as const;
export const CLIENTI = ["uno", "pochi", "molti"] as const;
export const IMPIEGHI = ["no", "parziale", "pieno"] as const;
export const AVVII = ["no", "meno_3_mesi", "oltre_3_mesi"] as const;
export const PERMESSI = ["svizzero_c", "b", "g", "altro"] as const;
export const SI_NO = ["si", "no"] as const;

export const LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO = 120;

export const schemaRisposte = z.object({
  versione: z.literal(VERSIONE_RISPOSTE),
  attivita: z.enum(ATTIVITA),
  /** Descrizione libera, solo se l'attività è "altro". */
  attivitaAltro: z.string().trim().max(LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO).optional(),
  cantone: z.enum(CANTONI),
  soci: z.enum(SOCI),
  fatturato: z.enum(FATTURATI),
  clienti: z.enum(CLIENTI),
  impiego: z.enum(IMPIEGHI),
  avviata: z.enum(AVVII),
  permesso: z.enum(PERMESSI),
  locali: z.enum(SI_NO),
  venditaOnline: z.enum(SI_NO),
});

export type Risposte = z.infer<typeof schemaRisposte>;

/** Le chiavi che corrispondono a una domanda del questionario. */
export type IdDomanda = Exclude<keyof Risposte, "versione" | "attivitaAltro">;

/** Valida dati sconosciuti (localStorage, database, form). Null se non validi o di un'altra versione. */
export function leggiRisposte(dati: unknown): Risposte | null {
  const esito = schemaRisposte.safeParse(dati);
  if (!esito.success) return null;
  const risposte = { ...esito.data };
  // Il testo libero ha senso solo con "altro"; vuoto equivale ad assente.
  if (risposte.attivita !== "altro" || !risposte.attivitaAltro) delete risposte.attivitaAltro;
  return risposte;
}
