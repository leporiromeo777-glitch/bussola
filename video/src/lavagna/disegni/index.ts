/**
 * I disegni della lavagna, per nome. Ogni scena di una lezione può nominare
 * il suo con `disegno` (vedi src/lezioni/tipi.ts); una lezione nuova aggiunge
 * il suo file di disegni e lo mette qui.
 */
import { DISEGNI_AUTORIZZAZIONI } from "./autorizzazioni";
import { DISEGNI_DITTA_INDIVIDUALE } from "./ditta-individuale";
import { DISEGNI_DOCUMENTI_SAGL } from "./documenti-sagl";
import { DISEGNI_ESERCIZIO_PUBBLICO } from "./esercizio-pubblico";
import { DISEGNI_FONDARE_SAGL } from "./fondare-sagl";
import { DISEGNI_FORME } from "./forme-giuridiche";
import { DISEGNI_SANITA } from "./sanita";
import type { Disegno } from "./tipi";

export const DISEGNI: Readonly<Record<string, Disegno>> = {
  ...DISEGNI_DITTA_INDIVIDUALE,
  ...DISEGNI_FORME,
  ...DISEGNI_FONDARE_SAGL,
  ...DISEGNI_DOCUMENTI_SAGL,
  ...DISEGNI_AUTORIZZAZIONI,
  ...DISEGNI_ESERCIZIO_PUBBLICO,
  ...DISEGNI_SANITA,
};

export type { ContestoDisegno, Disegno } from "./tipi";
