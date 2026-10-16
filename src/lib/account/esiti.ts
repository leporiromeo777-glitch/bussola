/** Testi sull'account, in italiano semplice. */
export const MESSAGGI_ACCOUNT = {
  nonConfigurato: "Gli account non sono ancora attivi in questa versione di prova.",
  nonCollegato: "Per eliminare l'account devi accedere.",
  errore: "Non sono riuscito a eliminare l'account. Riprova tra poco.",
} as const;

export type EsitoEliminazione =
  | { ok: true }
  | { ok: false; motivo: "non_configurato" | "non_collegato" | "errore" };

export type RispostaEliminazione = { status: 204 } | { status: 401 | 500 | 503; messaggio: string };

/** Risposta di DELETE /api/account per un esito dell'eliminazione. */
export function rispostaEliminazione(esito: EsitoEliminazione): RispostaEliminazione {
  if (esito.ok) return { status: 204 };
  switch (esito.motivo) {
    case "non_configurato":
      return { status: 503, messaggio: MESSAGGI_ACCOUNT.nonConfigurato };
    case "non_collegato":
      return { status: 401, messaggio: MESSAGGI_ACCOUNT.nonCollegato };
    case "errore":
      return { status: 500, messaggio: MESSAGGI_ACCOUNT.errore };
  }
}
