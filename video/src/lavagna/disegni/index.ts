/**
 * I disegni della lavagna, per nome. Ogni scena di una lezione può nominare
 * il suo con `disegno` (vedi src/lezioni/tipi.ts); una lezione nuova aggiunge
 * il suo file di disegni e lo mette qui.
 */
import { DISEGNI_DITTA_INDIVIDUALE } from "./ditta-individuale";
import type { Disegno } from "./tipi";

export const DISEGNI: Readonly<Record<string, Disegno>> = {
  ...DISEGNI_DITTA_INDIVIDUALE,
};

export type { ContestoDisegno, Disegno } from "./tipi";
