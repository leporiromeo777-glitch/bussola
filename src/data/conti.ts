/**
 * «I tuoi conti»: link ufficiali usati nelle guide della pagina /conti
 * (inoltro automatico delle email). Le regole e le soglie (IVA, contabilità,
 * conservazione dei documenti) sono in svizzera.ts.
 */
import type { Fonte } from "./svizzera";

/** Data dell'ultimo controllo delle pagine qui sotto. */
export const VERIFICATO_IL_CONTI = "2026-10-16";

export const fontiConti = {
  gmailInoltro: {
    titolo: "Inoltrare automaticamente messaggi di Gmail a un altro account",
    url: "https://support.google.com/mail/answer/10957?hl=it",
    ente: "Guida di Gmail (Google)",
  },
  gmailRicerca: {
    titolo: "Perfezionare le ricerche in Gmail (operatori di ricerca)",
    url: "https://support.google.com/mail/answer/7190?hl=it",
    ente: "Guida di Gmail (Google)",
  },
  outlookRegole: {
    titolo: "Usare le regole per l'inoltro automatico dei messaggi",
    url: "https://support.microsoft.com/it-it/outlook/mail/use-rules-to-automatically-forward-messages",
    ente: "Supporto Microsoft",
  },
} as const satisfies Record<string, Fonte>;

/**
 * Ricerca da incollare nel filtro di Gmail: email con allegato che parlano
 * di fatture o ricevute, in più lingue. Le graffe vogliono dire «una di
 * queste parole» (operatori di ricerca di Gmail).
 */
export const RICERCA_FILTRO_GMAIL =
  "has:attachment {fattura ricevuta scontrino invoice receipt Rechnung Quittung facture reçu}";
