/**
 * Opzioni e tipi del modulo della lista d'attesa. Senza dipendenze, così il
 * componente nel browser non si porta dietro zod.
 */

/** Valori salvati nella colonna cantone e loro etichette. */
export const CANTONI = {
  TI: "Ticino",
  GR: "Grigioni",
  altro: "Un altro Cantone",
} as const;

/** Valori ammessi dal vincolo check su lista_attesa.situazione. */
export const SITUAZIONI = {
  idea: "Ho un'idea",
  in_apertura: "Sto aprendo la mia attività",
  aperta_da_poco: "L'ho aperta da poco",
  fiduciario: "Sono un fiduciario",
  altro: "Altro",
} as const;

export type Cantone = keyof typeof CANTONI;
export type Situazione = keyof typeof SITUAZIONI;

/** Campo trappola: nascosto alle persone, i bot spesso lo compilano. */
export const CAMPO_TRAPPOLA = "sito_web";

/** Valore della casella del consenso quando è spuntata. */
export const VALORE_CONSENSO = "si";

export const LIMITI = { email: 254, nome: 80 } as const;

export type CampoModulo = "email" | "nome" | "cantone" | "situazione" | "consenso";
export type ErroriModulo = Partial<Record<CampoModulo, string>>;

/** Quello che la persona ha scritto, per ripresentarlo nel modulo dopo un errore. */
export type ValoriModulo = {
  email: string;
  nome: string;
  cantone: string;
  situazione: string;
  consenso: boolean;
};
