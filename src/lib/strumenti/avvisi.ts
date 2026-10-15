/**
 * Avvisi sulle soglie di legge mostrati da tariffa e budget. Testi generali
 * con la fonte: non dicono all'utente cosa fare nel suo caso.
 */
import { datiStrumenti, fonti, percentuale, pilastro3a, regole, type Fonte } from "@/data/svizzera";
import type { AnnoAvs, SituazioneAvs } from "./avs";
import { importo } from "./numeri";

export type Avviso = {
  id: "soglia-iva-registro" | "pilastro-3a-massimo" | "pilastro-3a-20" | "pilastro-3a-cassa-pensione" | "perdita";
  livello: "info" | "attenzione";
  titolo: string;
  testo: string;
  fonti: Fonte[];
};

/** Fatturato annuo (o stimato su 12 mesi) da CHF 100'000 in su: IVA e registro di commercio. */
export function avvisoSoglie(fatturatoAnnuo: number, contesto: "tariffa" | "budget"): Avviso | null {
  const sogliaIva = regole.sogliaIva.valore;
  const sogliaRc = regole.sogliaRegistroCommercio.valore;
  if (fatturatoAnnuo < Math.min(sogliaIva, sogliaRc)) return null;
  const quando =
    contesto === "budget"
      ? "Se all'inizio dell'attività è presumibile superare la soglia entro 12 mesi, l'assoggettamento all'IVA vale da subito (art. 14 LIVA)."
      : "Conta la cifra d'affari annua in Svizzera e all'estero, non l'utile.";
  return {
    id: "soglia-iva-registro",
    livello: "attenzione",
    titolo: `Fatturato da ${importo(sogliaIva, 0)} in su: IVA e registro di commercio`,
    testo:
      `Da ${importo(sogliaIva, 0)} di cifra d'affari annua l'iscrizione all'IVA è obbligatoria; ` +
      `ci si annuncia all'AFC entro ${regole.termineAnnuncioIvaGiorni.valore} giorni dall'inizio dell'assoggettamento. ${quando} ` +
      `Con almeno ${importo(sogliaRc, 0)} di cifra d'affari nell'ultimo esercizio la ditta individuale va iscritta nel registro di commercio. ` +
      "Gli importi di questo strumento sono senza IVA: se sei iscritto, l'IVA si aggiunge in fattura.",
    fonti: [fonti.liva10, fonti.liva14, fonti.afcAssoggettamento, fonti.co931],
  };
}

/**
 * Pilastro 3a: confronto con l'importo massimo deducibile senza cassa
 * pensione e, per chi lavora anche come dipendente (attività accessoria), con
 * quello con cassa pensione.
 */
export function avvisiPilastro3a(
  versamento: number,
  redditoAttivita: number,
  anno: AnnoAvs,
  situazione: SituazioneAvs = "principale",
): Avviso[] {
  if (versamento <= 0) return [];
  const limiti = pilastro3a[anno];
  const massimo = limiti.valore.senzaCassaPensione;
  const avvisi: Avviso[] = [];
  if (versamento > massimo) {
    avvisi.push({
      id: "pilastro-3a-massimo",
      livello: "attenzione",
      titolo: `Pilastro 3a sopra il massimo ${anno}`,
      testo: `Nel ${anno}, senza cassa pensione, si può dedurre al massimo ${importo(massimo, 0)} (con cassa pensione ${importo(limiti.valore.conCassaPensione, 0)}).`,
      fonti: [limiti.fonte, fonti.opp3],
    });
  } else if (redditoAttivita > 0 && versamento > redditoAttivita * datiStrumenti.quotaMassimaPilastro3a.valore) {
    avvisi.push({
      id: "pilastro-3a-20",
      livello: "info",
      titolo: `Pilastro 3a: controlla il limite del ${percentuale(datiStrumenti.quotaMassimaPilastro3a.valore)}`,
      testo:
        `Senza cassa pensione il versamento deducibile è al massimo il ${percentuale(datiStrumenti.quotaMassimaPilastro3a.valore)} del reddito da attività lucrativa. ` +
        "Con questi numeri potresti superarlo: da verificare con il tuo istituto 3a o con un fiduciario.",
      fonti: [fonti.opp3, limiti.fonte],
    });
  }
  // Chi è anche dipendente spesso ha la cassa pensione del datore di lavoro: allora vale il massimo più basso.
  const conCassa = limiti.valore.conCassaPensione;
  if (situazione === "accessoria" && versamento > conCassa && versamento <= massimo) {
    avvisi.push({
      id: "pilastro-3a-cassa-pensione",
      livello: "info",
      titolo: `Pilastro 3a: con una cassa pensione il massimo è ${importo(conCassa, 0)}`,
      testo:
        `Se come dipendente sei affiliato a una cassa pensione (LPP), nel ${anno} puoi versare e dedurre nel 3a al massimo ${importo(conCassa, 0)} in tutto, anche se hai un'attività indipendente. ` +
        `Il limite di ${importo(massimo, 0)} vale solo senza cassa pensione.`,
      fonti: [limiti.fonte, fonti.opp3],
    });
  }
  return avvisi;
}
