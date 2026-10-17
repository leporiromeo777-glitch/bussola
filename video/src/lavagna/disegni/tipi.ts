import type { ReactNode } from "react";
import type { Schermo } from "../../lezioni/tipi";

/** Quello che un disegno sa della sua scena (tutto in fotogrammi dall'inizio della scena). */
export type ContestoDisegno = {
  /** Fotogrammi della scena, pausa compresa. */
  durata: number;
  /** Fotogrammi in cui Bleo parla. */
  voce: number;
  /** Quando cambia il sottotitolo (le pause misurate della voce): la seconda parte della scena. */
  cambi: readonly number[];
  fps: number;
};

export type PuntoTela = { x: number; y: number };

/** Cosa fa la bussolina in un momento della scena. */
export type AzioneBussolina =
  /** Tocca `bersaglio` con la mano (ci va accanto da sola); `specchio` = da destra. */
  | { tipo: "tocca"; quando: number; bersaglio: PuntoTela; specchio?: boolean }
  | { tipo: "lancia" | "scuoti" | "festeggia"; quando: number };

export type Disegno = {
  /** Il disegno della scena, al fotogramma `locale` dall'inizio della scena. */
  Figura: (props: { locale: number; ctx: ContestoDisegno; schermo: Schermo }) => ReactNode;
  /** Il momento chiave: lì la bussolina agisce e, nell'elenco, si riempie il punto. */
  chiave: (ctx: ContestoDisegno) => number;
  /**
   * Dove aspetta la bussolina (i piedi, coordinate della tela 1000×700) e
   * cosa fa. Non deve coprire le figure o le scritte importanti.
   */
  bussolina: (ctx: ContestoDisegno) => { posto: PuntoTela; specchio?: boolean; azioni: AzioneBussolina[] };
};

/** La seconda parte della scena: il primo cambio di sottotitolo, o metà della voce. */
export function seconda(ctx: ContestoDisegno, i = 0): number {
  return ctx.cambi[i] ?? Math.round(ctx.voce * 0.5);
}
