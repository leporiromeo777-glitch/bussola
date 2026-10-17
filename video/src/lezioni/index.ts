/**
 * Tutte le lezioni del corso. Per aggiungerne una: un nuovo file di dati in
 * questa cartella, la voce in LEZIONI qui sotto e in src/data/corso.ts.
 */
import { dittaIndividuale } from "./ditta-individuale";
import { sociFormaGiuridica } from "./soci-forma-giuridica";
import type { Lezione } from "./tipi";

export const LEZIONI: readonly Lezione[] = [dittaIndividuale, sociFormaGiuridica];

export function trovaLezione(id: string): Lezione {
  const lezione = LEZIONI.find((l) => l.id === id);
  if (!lezione) throw new Error(`Lezione sconosciuta: ${id}. Quelle che ci sono: ${LEZIONI.map((l) => l.id).join(", ")}`);
  return lezione;
}
