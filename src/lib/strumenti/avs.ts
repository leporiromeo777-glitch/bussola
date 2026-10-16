/**
 * Stima dei contributi sociali personali di un indipendente in Ticino:
 * AVS/AI/IPG secondo la tavola scalare, più i supplementi della cassa
 * cantonale (spese amministrative, assegni familiari, assegno integrativo).
 *
 * Su quale reddito? La cassa calcola i contributi sul reddito netto
 * dell'attività stabilito dalla tassazione, al quale riaggiunge i contributi
 * AVS/AI/IPG dedotti (promemoria 2.02, punti 7 e 9). Qui il punto di partenza
 * è quindi l'**utile prima dei contributi sociali personali**: ricavi meno
 * costi dell'attività, senza togliere AVS, spese amministrative, AF e AFI.
 * Per le spese amministrative e gli assegni familiari il promemoria non dice
 * se si riaggiungono: contarli dentro il reddito dà una stima leggermente più
 * alta, cioè prudente. Non togliamo l'interesse sul capitale proprio investito
 * (punto 7), che riduce il reddito: anche questo rende la stima prudente.
 *
 * Il reddito si arrotonda al multiplo di 100 franchi immediatamente
 * inferiore (art. 8 cpv. 1 LAVS): 60'499 conta come 60'400.
 *
 * È una stima indicativa: l'importo vero lo decide la cassa di compensazione.
 */
import { anniTavola, parametriAnno, tavoleScalari, type AnnoAvs, type FasciaScalare } from "@/data/avs-tavola-scalare";
import { anniSupplementiTicino, datiStrumenti, percentuale, supplementiTicino } from "@/data/svizzera";
import { arrotonda, importo } from "./numeri";

export type { AnnoAvs };

/**
 * - `principale`: l'attività indipendente è il tuo lavoro (caso normale).
 * - `accessoria`: lavori anche come dipendente e sul salario paghi già almeno
 *   il contributo minimo (promemoria 2.02, punto 6).
 */
export type SituazioneAvs = "principale" | "accessoria";

export type CasoAvs =
  /** Reddito sotto il limite inferiore: contributo minimo. */
  | "minimo"
  /** Reddito nella tavola scalare. */
  | "scalare"
  /** Reddito dal limite superiore in su: 10%. */
  | "massimo"
  /** Accessoria sotto il limite inferiore: tasso più basso su richiesta, quando costa meno del minimo. */
  | "tassoMinimoAccessoria"
  /** Accessoria fino a CHF 2'500: contributi solo su richiesta. */
  | "suRichiesta";

export type StimaContributi = {
  anno: AnnoAvs;
  situazione: SituazioneAvs;
  /** Reddito su cui si calcolano i contributi: utile arrotondato ai 100 franchi inferiori, mai sotto zero. */
  redditoAvs: number;
  caso: CasoAvs;
  /** Tasso AVS/AI/IPG applicato (frazione), null se si paga il contributo minimo fisso o niente. */
  tasso: number | null;
  fascia: FasciaScalare | null;
  avsAiIpg: number;
  speseAmministrative: number;
  assegniFamiliari: number;
  assegnoIntegrativo: number;
  /** Spese amministrative + assegni familiari + assegno integrativo. */
  supplementiTicino: number;
  totale: number;
  /** Totale diviso per il reddito AVS (frazione), null se il reddito è zero. */
  tassoEffettivo: number | null;
};

/** Reddito AVS: arrotondato al multiplo di 100 franchi immediatamente inferiore, mai sotto zero (art. 8 cpv. 1 LAVS). */
export function arrotondaRedditoAvs(utile: number): number {
  const passo = datiStrumenti.arrotondamentoRedditoAvs.valore;
  // Prima al centesimo, così 60'399.999999 (errore di virgola mobile) conta come 60'400.
  return Math.floor(arrotonda(Math.max(0, utile), 2) / passo) * passo;
}

/** Trova la fascia della tavola scalare per un reddito, o null se fuori dalla tavola. */
export function fasciaPerReddito(reddito: number, anno: AnnoAvs): FasciaScalare | null {
  return tavoleScalari[anno].fasce.find((f) => f.da <= reddito && reddito < f.a) ?? null;
}

/**
 * Solo AVS/AI/IPG, senza supplementi cantonali. `utile` è il reddito prima
 * dell'arrotondamento: qui si arrotonda ai 100 franchi inferiori.
 */
export function contributoAvsAiIpg(
  utile: number,
  anno: AnnoAvs,
  situazione: SituazioneAvs = "principale",
): Pick<StimaContributi, "caso" | "tasso" | "fascia" | "avsAiIpg"> {
  const p = parametriAnno(anno).valore;
  const lordo = Math.max(0, utile);
  const reddito = arrotondaRedditoAvs(lordo);

  // Il limite di CHF 2'500 si confronta con l'utile non arrotondato: da 2'500.01
  // contiamo i contributi (stima prudente, e il salto resta in puntiDiSalto).
  if (situazione === "accessoria" && lordo <= datiStrumenti.limiteAttivitaAccessoria.valore) {
    return { caso: "suRichiesta", tasso: null, fascia: null, avsAiIpg: 0 };
  }
  if (reddito >= p.limiteSuperioreScala) {
    return { caso: "massimo", tasso: p.tassoMassimo, fascia: null, avsAiIpg: arrotonda(reddito * p.tassoMassimo) };
  }
  if (reddito < p.limiteInferioreScala) {
    // Con il minimo già pagato sul salario si PUÒ chiedere il tasso più basso
    // della tavola (promemoria 2.02, punto 6): conviene solo se costa meno.
    if (situazione === "accessoria") {
      const conTasso = arrotonda(reddito * p.tassoMinimoScala);
      if (conTasso < p.contributoMinimo) {
        return { caso: "tassoMinimoAccessoria", tasso: p.tassoMinimoScala, fascia: null, avsAiIpg: conTasso };
      }
    }
    return { caso: "minimo", tasso: null, fascia: null, avsAiIpg: p.contributoMinimo };
  }
  const fascia = fasciaPerReddito(reddito, anno);
  if (!fascia) throw new Error(`Tavola scalare ${anno} incompleta per CHF ${reddito}`);
  // Percento con 3 decimali → frazione; il prodotto si arrotonda al centesimo.
  return {
    caso: "scalare",
    tasso: fascia.tassoPercento / 100,
    fascia,
    avsAiIpg: arrotonda((reddito * fascia.tassoPercento) / 100),
  };
}

/**
 * Stima completa per il Ticino (cassa cantonale IAS) a partire dall'utile
 * dell'attività prima dei contributi sociali personali.
 */
export function stimaContributi(
  utilePrimaDeiContributi: number,
  anno: AnnoAvs,
  situazione: SituazioneAvs = "principale",
): StimaContributi {
  const utile = Math.max(0, utilePrimaDeiContributi);
  const redditoAvs = arrotondaRedditoAvs(utile);
  const base = contributoAvsAiIpg(utile, anno, situazione);

  // Se l'AVS non viene riscossa (accessoria fino a CHF 2'500), non contiamo
  // nemmeno i supplementi: se chiedi di pagare, valgono le regole normali.
  const riscossa = base.caso !== "suRichiesta";
  const speseAmministrative = riscossa ? arrotonda(base.avsAiIpg * supplementiTicino.speseAmministrative.valore) : 0;
  const baseAf = Math.min(redditoAvs, datiStrumenti.guadagnoMassimoAssegniFamiliari.valore);
  const assegniFamiliari = riscossa ? arrotonda(baseAf * supplementiTicino.assegniFamiliari.valore) : 0;
  const assegnoIntegrativo = riscossa ? arrotonda(redditoAvs * supplementiTicino.assegnoIntegrativo.valore) : 0;
  const supplementi = arrotonda(speseAmministrative + assegniFamiliari + assegnoIntegrativo);
  const totale = arrotonda(base.avsAiIpg + supplementi);

  return {
    anno,
    situazione,
    redditoAvs,
    ...base,
    speseAmministrative,
    assegniFamiliari,
    assegnoIntegrativo,
    supplementiTicino: supplementi,
    totale,
    tassoEffettivo: redditoAvs > 0 ? totale / redditoAvs : null,
  };
}

/**
 * Punti in cui il totale dei contributi salta di più (inizio di ogni fascia,
 * limiti, tetto degli assegni familiari). Tra due punti i contributi crescono
 * a gradini di 100 franchi (il reddito si arrotonda ai 100 franchi inferiori),
 * di meno di CHF 100 per gradino. Servono al risolutore della tariffa.
 */
export function puntiDiSalto(anno: AnnoAvs, situazione: SituazioneAvs = "principale"): number[] {
  const p = parametriAnno(anno).valore;
  const punti = new Set<number>([
    ...tavoleScalari[anno].fasce.map((f) => f.da),
    p.limiteInferioreScala,
    p.limiteSuperioreScala,
    datiStrumenti.guadagnoMassimoAssegniFamiliari.valore,
  ]);
  if (situazione === "accessoria") {
    // Fino a 2'500 compreso niente contributi: il salto è subito dopo.
    punti.add(datiStrumenti.limiteAttivitaAccessoria.valore + 0.01);
  }
  return [...punti].sort((a, b) => a - b);
}

/** Anni disponibili per la stima, dal più recente. */
export const anniDisponibili = anniTavola;

/** È un anno per cui abbiamo la tavola? */
export function eAnnoAvs(anno: number): anno is AnnoAvs {
  return (anniTavola as readonly number[]).includes(anno);
}

/**
 * Anno predefinito per una stima fatta oggi: l'anno in corso, oppure il
 * prossimo da ottobre (chi parte adesso fa i conti sull'anno che viene),
 * limitato agli anni con la tavola.
 */
export function annoPredefinito(oggiIso: string): AnnoAvs {
  const anno = Number(oggiIso.slice(0, 4));
  const mese = Number(oggiIso.slice(5, 7));
  const scelto = mese >= 10 ? anno + 1 : anno;
  const disponibili = [...anniTavola].sort((a, b) => a - b);
  if (eAnnoAvs(scelto)) return scelto;
  return scelto < disponibili[0] ? disponibili[0] : disponibili[disponibili.length - 1];
}

/**
 * Da quali anni vengono i supplementi della cassa ticinese usati nella stima
 * (per «Come lo calcoliamo»): spesso non sono ancora quelli dell'anno scelto.
 */
export function notaAnniSupplementi(anno: AnnoAvs): string {
  const anni = anniSupplementiTicino;
  const tetto = importo(datiStrumenti.guadagnoMassimoAssegniFamiliari.valore, 0);
  const elenco =
    `spese amministrative ${percentuale(supplementiTicino.speseAmministrative.valore)} (valore ${anni.speseAmministrative}), ` +
    `assegni familiari ${percentuale(supplementiTicino.assegniFamiliari.valore, 2)} (valore ${anni.assegniFamiliari}), ` +
    `calcolati solo sui primi ${tetto} di reddito (limite ${anni.guadagnoMassimoAssegniFamiliari}), ` +
    `e assegno integrativo AFI ${percentuale(supplementiTicino.assegnoIntegrativo.valore, 2)} (fissato dalla legge cantonale sugli assegni di famiglia).`;
  const diversi = Object.values(anni).some((a) => a !== anno);
  return diversi
    ? `Per i supplementi usiamo gli ultimi valori pubblicati dall'IAS, non quelli del ${anno}: ${elenco} Se per il ${anno} cambiano, cambia anche la stima.`
    : `Per i supplementi usiamo i valori ${anno} dell'IAS: ${elenco}`;
}

/** Breve spiegazione del caso, per l'interfaccia. */
export function descrizioneCaso(stima: StimaContributi): string {
  const p = parametriAnno(stima.anno).valore;
  switch (stima.caso) {
    case "minimo":
      return (
        `Reddito sotto ${importo(p.limiteInferioreScala, 0)}: si paga il contributo minimo (${importo(p.contributoMinimo, 0)}).` +
        (stima.situazione === "accessoria"
          ? ` Il tasso più basso della tavola (${percentuale(p.tassoMinimoScala, 3)}), che con un'attività accessoria puoi chiedere, qui costerebbe di più.`
          : "")
      );
    case "scalare":
      return "Reddito nella tavola scalare: il tasso AVS/AI/IPG è ridotto.";
    case "massimo":
      return `Reddito da ${importo(p.limiteSuperioreScala, 0)} in su: tasso pieno AVS/AI/IPG.`;
    case "tassoMinimoAccessoria":
      return `Attività accessoria con il contributo minimo già pagato sul salario: puoi chiedere alla cassa il tasso più basso della tavola (${percentuale(p.tassoMinimoScala, 3)}), che qui costa meno del contributo minimo.`;
    case "suRichiesta":
      return "Attività accessoria con reddito basso: i contributi si pagano solo se li chiedi tu.";
  }
}
