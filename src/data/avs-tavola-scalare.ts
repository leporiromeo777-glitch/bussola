/**
 * Tavola scalare dei contributi AVS/AI/IPG degli indipendenti.
 *
 * Sotto il limite superiore della tavola il tasso non è il 10%, ma scende per
 * fasce di reddito. I tassi qui sotto sono la somma AVS + AI + IPG, cioè il
 * tasso che paga davvero l'indipendente.
 *
 * - 2026: tabella del promemoria 2.02 (stato al 1° gennaio 2026), punto 6,
 *   letta dal PDF ufficiale il 15.10.2026. Il tasso AVS da solo è nell'art. 21
 *   OAVS (4,35% … 7,55%), quello AI nell'OAI e quello IPG nell'OIPG.
 * - 2027: fasce e tassi dal testo provvisorio delle ordinanze del Consiglio
 *   federale del 2.10.2026 (OAVS art. 21, OAI art. 1bis, OIPG art. 36), in
 *   vigore dal 1.1.2027. La somma delle tre parti è nostra; i tassi per fascia
 *   restano quelli del 2026, cambiano solo i limiti delle fasce. Quando esce il
 *   promemoria 2.02 del 2027 va confrontato con questa tabella.
 *
 * Se cambi un valore aggiorna anche `verificatoIl` e la fonte.
 */
import { avsIndipendenti, fonti, fontiStrumenti, type Fonte } from "./svizzera";

export type AnnoAvs = 2026 | 2027;

/** Una fascia: reddito annuo di almeno `da` ma inferiore a `a` (CHF). */
export type FasciaScalare = {
  da: number;
  a: number;
  /** Tasso AVS/AI/IPG in percento del reddito, con 3 decimali come nella fonte. */
  tassoPercento: number;
  /** Ripartizione, quando la fonte la indica. */
  parti?: { avs: number; ai: number; ipg: number };
};

export type TavolaScalare = {
  anno: AnnoAvs;
  stato: "in vigore" | "testo provvisorio";
  fasce: readonly FasciaScalare[];
  fonte: Fonte;
  /** Data ISO dell'ultimo controllo sulla fonte. */
  verificatoIl: string;
  nota: string;
};

/** Le tre parti (AVS, AI, IPG) di una fascia del 2027, come nelle ordinanze. */
function fascia2027(da: number, a: number, avs: number, ai: number, ipg: number): FasciaScalare {
  // Somma arrotondata ai 3 decimali della fonte (per es. 4,35 + 0,752 + 0,269 = 5,371).
  const tassoPercento = Math.round((avs + ai + ipg) * 1000) / 1000;
  return { da, a, tassoPercento, parti: { avs, ai, ipg } };
}

export const tavoleScalari: Record<AnnoAvs, TavolaScalare> = {
  2026: {
    anno: 2026,
    stato: "in vigore",
    fonte: fonti.avsPromemoria202,
    verificatoIl: "2026-10-15",
    nota: "Promemoria 2.02, stato al 1° gennaio 2026, punto 6. Da CHF 60'500 il tasso è del 10%.",
    fasce: [
      { da: 10_100, a: 17_600, tassoPercento: 5.371 },
      { da: 17_600, a: 23_000, tassoPercento: 5.494 },
      { da: 23_000, a: 25_500, tassoPercento: 5.617 },
      { da: 25_500, a: 28_000, tassoPercento: 5.741 },
      { da: 28_000, a: 30_500, tassoPercento: 5.864 },
      { da: 30_500, a: 33_000, tassoPercento: 5.987 },
      { da: 33_000, a: 35_500, tassoPercento: 6.235 },
      { da: 35_500, a: 38_000, tassoPercento: 6.481 },
      { da: 38_000, a: 40_500, tassoPercento: 6.728 },
      { da: 40_500, a: 43_000, tassoPercento: 6.976 },
      { da: 43_000, a: 45_500, tassoPercento: 7.222 },
      { da: 45_500, a: 48_000, tassoPercento: 7.469 },
      { da: 48_000, a: 50_500, tassoPercento: 7.84 },
      { da: 50_500, a: 53_000, tassoPercento: 8.209 },
      { da: 53_000, a: 55_500, tassoPercento: 8.58 },
      { da: 55_500, a: 58_000, tassoPercento: 8.951 },
      { da: 58_000, a: 60_500, tassoPercento: 9.321 },
    ],
  },
  2027: {
    anno: 2027,
    stato: "testo provvisorio",
    fonte: fontiStrumenti.adeguamentiAvs2027,
    verificatoIl: "2026-10-15",
    nota:
      "Testo provvisorio del Consiglio federale (2.10.2026), in vigore dal 1.1.2027: fa stato la versione pubblicata su Fedlex. " +
      "La somma AVS + AI + IPG per fascia è nostra. L'ordinanza fissa a CHF 10'200 il limite per il contributo minimo (art. 8 cpv. 2 LAVS): " +
      "tra CHF 10'200 e 10'300 qui contiamo il contributo minimo (differenza di pochi franchi).",
    fasce: [
      fascia2027(10_300, 17_700, 4.35, 0.752, 0.269),
      fascia2027(17_700, 24_000, 4.45, 0.769, 0.275),
      fascia2027(24_000, 26_500, 4.55, 0.786, 0.281),
      fascia2027(26_500, 29_000, 4.65, 0.804, 0.287),
      fascia2027(29_000, 31_500, 4.75, 0.821, 0.293),
      fascia2027(31_500, 34_000, 4.85, 0.838, 0.299),
      fascia2027(34_000, 36_500, 5.05, 0.873, 0.312),
      fascia2027(36_500, 39_000, 5.25, 0.907, 0.324),
      fascia2027(39_000, 41_500, 5.45, 0.942, 0.336),
      fascia2027(41_500, 44_000, 5.65, 0.977, 0.349),
      fascia2027(44_000, 46_500, 5.85, 1.011, 0.361),
      fascia2027(46_500, 49_000, 6.05, 1.046, 0.373),
      fascia2027(49_000, 51_500, 6.35, 1.098, 0.392),
      fascia2027(51_500, 54_000, 6.65, 1.149, 0.41),
      fascia2027(54_000, 56_500, 6.95, 1.201, 0.429),
      fascia2027(56_500, 59_000, 7.25, 1.253, 0.448),
      fascia2027(59_000, 61_500, 7.55, 1.305, 0.466),
    ],
  },
};

/** Anni per cui abbiamo la tavola, dal più recente. */
export const anniTavola: readonly AnnoAvs[] = [2027, 2026];

/** Parametri generali dell'anno (limiti, contributo minimo, tasso massimo) da svizzera.ts. */
export function parametriAnno(anno: AnnoAvs) {
  return avsIndipendenti[anno];
}
