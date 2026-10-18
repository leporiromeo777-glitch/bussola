/**
 * Tutte le lezioni del corso. Per aggiungerne una: un nuovo file di dati in
 * questa cartella, la voce in LEZIONI qui sotto e in src/data/corso.ts.
 */
import { assicurazioneInfortuni } from "./assicurazione-infortuni";
import { autorizzazioneSanitaria } from "./autorizzazione-sanitaria";
import { autorizzazioni } from "./autorizzazioni";
import { dittaIndividuale } from "./ditta-individuale";
import { esercizioPubblico } from "./esercizio-pubblico";
import { iscrizioneIva } from "./iscrizione-iva";
import { nomeDitta } from "./nome-ditta";
import { notificaAlimenti } from "./notifica-alimenti";
import { permessoLavoro } from "./permesso-lavoro";
import { sociFormaGiuridica } from "./soci-forma-giuridica";
import { attoFondazioneSagl } from "./soci-forma-giuridica-atto";
import { statutoSagl } from "./soci-forma-giuridica-statuto";
import { statutoSuva } from "./statuto-suva";
import type { Lezione } from "./tipi";

/** Le lezioni e i loro video facoltativi (anche questi hanno una composizione). */
export const LEZIONI: readonly Lezione[] = [dittaIndividuale, sociFormaGiuridica, statutoSagl, attoFondazioneSagl, autorizzazioni, esercizioPubblico, notificaAlimenti, autorizzazioneSanitaria, permessoLavoro, nomeDitta, statutoSuva, assicurazioneInfortuni, iscrizioneIva];

export function trovaLezione(id: string): Lezione {
  const lezione = LEZIONI.find((l) => l.id === id);
  if (!lezione) throw new Error(`Lezione sconosciuta: ${id}. Quelle che ci sono: ${LEZIONI.map((l) => l.id).join(", ")}`);
  return lezione;
}
