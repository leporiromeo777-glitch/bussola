/**
 * Tutte le lezioni del corso. Per aggiungerne una: un nuovo file di dati in
 * questa cartella, la voce in LEZIONI qui sotto e in src/data/corso.ts.
 */
import { accontiAvs } from "./acconti-avs";
import { accontiImposte } from "./acconti-imposte";
import { assicurazioneInfortuni } from "./assicurazione-infortuni";
import { assicurazioniPrevidenza } from "./assicurazioni-previdenza";
import { assicurazioniPrevidenzaDipendenti } from "./assicurazioni-previdenza-dipendenti";
import { aiuto } from "./aiuto";
import { autorizzazioneSanitaria } from "./autorizzazione-sanitaria";
import { autorizzazioni } from "./autorizzazioni";
import { contabilita } from "./contabilita";
import { dichiarazioneImposte } from "./dichiarazione-imposte";
import { speseDitta } from "./dichiarazione-imposte-spese";
import { dittaIndividuale } from "./ditta-individuale";
import { esercizioPubblico } from "./esercizio-pubblico";
import { fatture } from "./fatture";
import { fattureMancatoPagamento } from "./fatture-mancato-pagamento";
import { iscrizioneRc } from "./iscrizione-rc";
import { iscrizioneIva } from "./iscrizione-iva";
import { localiPubblico } from "./locali-pubblico";
import { nomeDitta } from "./nome-ditta";
import { notificaAlimenti } from "./notifica-alimenti";
import { permessoLavoro } from "./permesso-lavoro";
import { riconoscimentoAvs } from "./riconoscimento-avs";
import { sociFormaGiuridica } from "./soci-forma-giuridica";
import { attoFondazioneSagl } from "./soci-forma-giuridica-atto";
import { statutoSagl } from "./soci-forma-giuridica-statuto";
import { sitoOnline } from "./sito-online";
import { soglieAnnuali } from "./soglie-annuali";
import { statutoSuva } from "./statuto-suva";
import type { Lezione } from "./tipi";

/** Le lezioni e i loro video facoltativi (anche questi hanno una composizione). */
export const LEZIONI: readonly Lezione[] = [dittaIndividuale, sociFormaGiuridica, statutoSagl, attoFondazioneSagl, autorizzazioni, esercizioPubblico, notificaAlimenti, autorizzazioneSanitaria, permessoLavoro, nomeDitta, statutoSuva, assicurazioneInfortuni, riconoscimentoAvs, aiuto, iscrizioneRc, sitoOnline, iscrizioneIva, fatture, localiPubblico, contabilita, accontiAvs, accontiImposte, assicurazioniPrevidenza, dichiarazioneImposte, speseDitta, soglieAnnuali, fattureMancatoPagamento, assicurazioniPrevidenzaDipendenti];

export function trovaLezione(id: string): Lezione {
  const lezione = LEZIONI.find((l) => l.id === id);
  if (!lezione) throw new Error(`Lezione sconosciuta: ${id}. Quelle che ci sono: ${LEZIONI.map((l) => l.id).join(", ")}`);
  return lezione;
}
