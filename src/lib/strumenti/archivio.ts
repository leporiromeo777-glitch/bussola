/**
 * Salvataggio degli strumenti nel browser (localStorage). I dati restano sul
 * dispositivo dell'utente: Bussola non li riceve. Qui c'è la parte pura
 * (chiavi, codifica e lettura sicura); l'aggancio a React è in
 * src/components/strumenti/usa-archivio.ts.
 */
import type { z } from "zod";

export const VERSIONE_ARCHIVIO = 1;

export const CHIAVI_ARCHIVIO = {
  tariffa: "bussola.strumenti.tariffa",
  budget: "bussola.strumenti.budget",
  businessPlan: "bussola.strumenti.business-plan",
  documenti: "bussola.strumenti.documenti",
  emittente: "bussola.strumenti.emittente",
} as const;

export type ChiaveArchivio = (typeof CHIAVI_ARCHIVIO)[keyof typeof CHIAVI_ARCHIVIO];

/** Busta con la versione, così in futuro si possono migrare i dati. */
export function codifica<T>(dati: T): string {
  return JSON.stringify({ v: VERSIONE_ARCHIVIO, dati });
}

/**
 * Legge un valore salvato. Se manca, è rovinato o di una versione che non
 * conosciamo, restituisce il predefinito: lo strumento non si rompe mai.
 */
export function decodifica<T>(grezzo: string | null, schema: z.ZodType<T>, predefinito: () => T): T {
  if (grezzo === null) return predefinito();
  try {
    const busta: unknown = JSON.parse(grezzo);
    if (typeof busta !== "object" || busta === null || (busta as { v?: unknown }).v !== VERSIONE_ARCHIVIO) {
      return predefinito();
    }
    const esito = schema.safeParse((busta as { dati?: unknown }).dati);
    return esito.success ? esito.data : predefinito();
  } catch {
    return predefinito();
  }
}
