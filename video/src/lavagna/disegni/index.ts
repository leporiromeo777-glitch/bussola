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
import { DISEGNI_NOTIFICA_ALIMENTI } from "./notifica-alimenti";
import { DISEGNI_SANITA } from "./sanita";
import { DISEGNI_PERMESSO_LAVORO } from "./permesso-lavoro";
import { DISEGNI_NOME_DITTA } from "./nome-ditta";
import { DISEGNI_STATUTO_SUVA } from "./statuto-suva";
import { DISEGNI_ASSICURAZIONE_INFORTUNI } from "./assicurazione-infortuni";
import { DISEGNI_RICONOSCIMENTO_AVS } from "./riconoscimento-avs";
import { DISEGNI_AIUTO } from "./aiuto";
import { DISEGNI_REGISTRO_COMMERCIO } from "./registro-commercio";
import { DISEGNI_SITO_ONLINE } from "./sito-online";
import { DISEGNI_ISCRIZIONE_IVA } from "./iscrizione-iva";
import { DISEGNI_FATTURE } from "./fatture";
import { DISEGNI_LOCALI_PUBBLICO } from "./locali-pubblico";
import { DISEGNI_CONTABILITA } from "./contabilita";
import { DISEGNI_ACCONTI_AVS } from "./acconti-avs";
import { DISEGNI_ACCONTI_IMPOSTE } from "./acconti-imposte";
import { DISEGNI_ASSICURAZIONI_PREVIDENZA } from "./assicurazioni-previdenza";
import { DISEGNI_DICHIARAZIONE_IMPOSTE } from "./dichiarazione-imposte";
import { DISEGNI_SOGLIE_ANNUALI } from "./soglie-annuali";
import type { Disegno } from "./tipi";

export const DISEGNI: Readonly<Record<string, Disegno>> = {
  ...DISEGNI_DITTA_INDIVIDUALE,
  ...DISEGNI_FORME,
  ...DISEGNI_FONDARE_SAGL,
  ...DISEGNI_DOCUMENTI_SAGL,
  ...DISEGNI_AUTORIZZAZIONI,
  ...DISEGNI_ESERCIZIO_PUBBLICO,
  ...DISEGNI_NOTIFICA_ALIMENTI,
  ...DISEGNI_SANITA,
  ...DISEGNI_PERMESSO_LAVORO,
  ...DISEGNI_NOME_DITTA,
  ...DISEGNI_STATUTO_SUVA,
  ...DISEGNI_ASSICURAZIONE_INFORTUNI,
  ...DISEGNI_RICONOSCIMENTO_AVS,
  ...DISEGNI_AIUTO,
  ...DISEGNI_REGISTRO_COMMERCIO,
  ...DISEGNI_SITO_ONLINE,
  ...DISEGNI_ISCRIZIONE_IVA,
  ...DISEGNI_FATTURE,
  ...DISEGNI_LOCALI_PUBBLICO,
  ...DISEGNI_CONTABILITA,
  ...DISEGNI_ACCONTI_AVS,
  ...DISEGNI_ACCONTI_IMPOSTE,
  ...DISEGNI_ASSICURAZIONI_PREVIDENZA,
  ...DISEGNI_DICHIARAZIONE_IMPOSTE,
  ...DISEGNI_SOGLIE_ANNUALI,
};

export type { ContestoDisegno, Disegno } from "./tipi";
