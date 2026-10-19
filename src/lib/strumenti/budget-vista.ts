/**
 * I risultati del budget del primo anno pronti da mostrare fuori dal sito
 * (schermata dell'app e PDF): righe della tabella mese per mese, riquadri del
 * riepilogo, dettaglio dei contributi e note. Gli stessi testi e le stesse
 * fonti della pagina del sito (src/components/strumenti/budget/budget-anno.tsx
 * e dettaglio-contributi.tsx).
 *
 * Logica pura, senza browser né React.
 */
import { tavoleScalari } from "@/data/avs-tavola-scalare";
import { datiStrumenti, fonti, percentuale, supplementiTicino, type Fonte } from "@/data/svizzera";
import type { StimaContributi } from "./avs";
import { nomeMese, type MeseBudget, type RisultatoBudget } from "./budget";
import { articoloNumero, importo, numeroBreve, numeroSvizzero } from "./numeri";

export type ChiaveRigaBudget = Exclude<keyof MeseBudget, "indice" | "anno" | "mese" | "etichetta">;

export type RigaTabellaBudget = { chiave: ChiaveRigaBudget; etichetta: string; segno?: "-" | "="; forte?: boolean };

export const RIGHE_BUDGET: readonly RigaTabellaBudget[] = [
  { chiave: "ricavi", etichetta: "Ricavi" },
  { chiave: "costiVariabili", etichetta: "Costi variabili", segno: "-" },
  { chiave: "costiFissi", etichetta: "Costi fissi", segno: "-" },
  { chiave: "costiAvvio", etichetta: "Costi di avvio", segno: "-" },
  { chiave: "risultato", etichetta: "Risultato dell'attività", segno: "=", forte: true },
  { chiave: "accantonamentoAvs", etichetta: "Da parte per AVS e supplementi", segno: "-" },
  { chiave: "accantonamentoImposte", etichetta: "Da parte per le imposte", segno: "-" },
  { chiave: "prelievi", etichetta: "Prelievi privati", segno: "-" },
  { chiave: "flusso", etichetta: "Saldo del mese", segno: "=", forte: true },
  { chiave: "cumulato", etichetta: "Saldo cumulato", forte: true },
];

/** Le righe da mostrare: quelle sempre a zero (per es. niente costi variabili) non servono. */
export function righeBudget(r: RisultatoBudget): RigaTabellaBudget[] {
  return RIGHE_BUDGET.filter((riga) => riga.forte || r.mesi.some((m) => m[riga.chiave] !== 0));
}

/** Le righe di un mese (per il telefono, un mese sotto l'altro): solo quelle diverse da zero. */
export function righeMese(r: RisultatoBudget, m: MeseBudget): RigaTabellaBudget[] {
  return righeBudget(r).filter((riga) => riga.forte || m[riga.chiave] !== 0);
}

/** Totale di una riga sui 12 mesi; per il saldo cumulato, quello dell'ultimo mese. */
export function totaleRiga(r: RisultatoBudget, chiave: ChiaveRigaBudget): number {
  return chiave === "cumulato" ? (r.mesi[11]?.cumulato ?? 0) : r.totali[chiave];
}

/** Importo nelle tabelle, senza «CHF» davanti: «-1'250». */
export function cifraBudget(n: number): string {
  return importo(n, 0).replace("CHF ", "");
}

/** true se in quel mese il saldo cumulato torna (e resta) positivo, dopo mesi in rosso. */
export function eMesePareggio(r: RisultatoBudget, indice: number): boolean {
  return indice === r.mesePareggio && !r.pareggioSubito;
}

export function testoPareggio(r: RisultatoBudget): string {
  if (r.mesePareggio === null) return "Non nei 12 mesi";
  if (r.pareggioSubito) return "Dal primo mese";
  return nomeMese(r.mesi[r.mesePareggio]);
}

export function periodoBudget(r: RisultatoBudget): string {
  return `${r.mesi[0].etichetta} – ${r.mesi[11].etichetta}`;
}

export type RiquadroBudget = { etichetta: string; valore: string; nota?: string; negativo?: boolean };

/** I quattro numeri del riepilogo. */
export function riquadriBudget(r: RisultatoBudget): RiquadroBudget[] {
  const finale = r.mesi[11].cumulato;
  return [
    { etichetta: "Ricavi in 12 mesi", valore: importo(r.totali.ricavi, 0) },
    {
      etichetta: "Risultato dell'attività",
      nota: "Prima di AVS, imposte e prelievi",
      valore: importo(r.totali.risultato, 0),
      negativo: r.totali.risultato < 0,
    },
    {
      etichetta: "Mese di pareggio",
      nota: r.mesePareggio === null ? "A fine anno il saldo cumulato è ancora sotto zero" : "Da qui il saldo cumulato resta positivo",
      valore: testoPareggio(r),
    },
    {
      etichetta: "Saldo dopo 12 mesi",
      nota:
        r.fabbisognoMassimo > 0 && r.meseFabbisogno !== null
          ? `Punto più basso: ${importo(-r.fabbisognoMassimo, 0)} a ${nomeMese(r.mesi[r.meseFabbisogno])}`
          : "Mai sotto zero",
      valore: importo(finale, 0),
      negativo: finale < 0,
    },
  ];
}

/** La riserva che serve per i mesi in rosso, o null se il saldo non va mai sotto zero. */
export function notaFabbisogno(r: RisultatoBudget): string | null {
  if (r.fabbisognoMassimo <= 0) return null;
  return (
    `Nel mese peggiore il saldo cumulato scende a ${importo(-r.fabbisognoMassimo, 0)}: è la riserva (risparmi o altri ` +
    "soldi) che ti serve per coprire i mesi in rosso."
  );
}

/** «Cosa considera questo budget». */
export function puntiBudget(r: RisultatoBudget): string[] {
  return [
    "Gli accantonamenti per AVS e imposte sono 1/12 della stima annua ogni mese: la cassa chiede acconti trimestrali, le imposte arrivano dopo, ma i soldi vanno messi da parte mentre incassi.",
    `I contributi sono stimati sui 12 mesi con la tavola ${r.annoAvs}${r.annoAvsApprossimato ? " (la più vicina che abbiamo)" : ""}: la cassa calcola per anno civile, sul reddito effettivo.`,
    "Tutti i costi contano nell'anno in cui li paghi. Nella contabilità vera alcuni acquisti si ammortizzano su più anni: per il tuo caso, da verificare con un fiduciario.",
    r.riservaPercento !== null
      ? `Riserva imposte: ${numeroBreve(r.riservaPercento, 2)}% del risultato dopo i contributi = ${importo(r.riservaImposte, 0)}, percentuale scelta da te.`
      : "Non hai indicato una riserva per le imposte: le imposte non sono nel saldo.",
    "Importi senza IVA.",
  ];
}

export type RigaContributo = { etichetta: string; valore: string; nota?: string; forte?: boolean };

/** Il dettaglio dei contributi sociali stimati, con le percentuali dei dati ufficiali. */
export function righeContributi(stima: StimaContributi): RigaContributo[] {
  const tassoAvs =
    stima.caso === "minimo"
      ? "contributo minimo"
      : stima.caso === "suRichiesta"
        ? "solo su richiesta"
        : stima.tasso !== null
          ? percentuale(stima.tasso, stima.caso === "massimo" ? 1 : 3)
          : "";
  const tassoEffettivo = stima.tassoEffettivo !== null ? percentuale(stima.tassoEffettivo, 1) : null;
  return [
    {
      etichetta: "Reddito su cui si calcolano",
      nota: `Utile dell'attività prima dei contributi sociali, arrotondato ai ${numeroSvizzero(datiStrumenti.arrotondamentoRedditoAvs.valore)} franchi inferiori`,
      valore: importo(stima.redditoAvs, 0),
    },
    {
      etichetta: `AVS/AI/IPG (${tassoAvs})`,
      nota: stima.fascia ? `Fascia da ${importo(stima.fascia.da, 0)} a meno di ${importo(stima.fascia.a, 0)}` : undefined,
      valore: importo(stima.avsAiIpg),
    },
    {
      etichetta: `Spese amministrative (${percentuale(supplementiTicino.speseAmministrative.valore)} dei contributi)`,
      valore: importo(stima.speseAmministrative),
    },
    {
      etichetta: `Assegni familiari (${percentuale(supplementiTicino.assegniFamiliari.valore, 2)} del reddito)`,
      nota:
        stima.redditoAvs > datiStrumenti.guadagnoMassimoAssegniFamiliari.valore
          ? `Solo sui primi ${importo(datiStrumenti.guadagnoMassimoAssegniFamiliari.valore, 0)} di reddito`
          : undefined,
      valore: importo(stima.assegniFamiliari),
    },
    {
      etichetta: `Assegno integrativo AFI (${percentuale(supplementiTicino.assegnoIntegrativo.valore, 2)} del reddito)`,
      valore: importo(stima.assegnoIntegrativo),
    },
    {
      etichetta: "Totale all'anno",
      nota: tassoEffettivo ? `Circa ${articoloNumero(tassoEffettivo)}${tassoEffettivo} del reddito` : undefined,
      valore: importo(stima.totale),
      forte: true,
    },
  ];
}

/** Le fonti ufficiali dei numeri del budget (contributi, IVA, registro di commercio), senza doppioni. */
export function fontiBudget(r: RisultatoBudget): Fonte[] {
  const tutte = [
    tavoleScalari[r.annoAvs].fonte,
    fonti.avsPromemoria202,
    datiStrumenti.arrotondamentoRedditoAvs.fonte,
    supplementiTicino.speseAmministrative.fonte,
    supplementiTicino.assegniFamiliari.fonte,
    supplementiTicino.assegnoIntegrativo.fonte,
    fonti.liva10,
    fonti.co931,
  ];
  return tutte.filter((f, i) => tutte.findIndex((g) => g.url === f.url) === i);
}
