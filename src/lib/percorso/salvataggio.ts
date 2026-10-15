/** Esito di un salvataggio nell'account (condiviso tra server actions e client). */
export type EsitoSalvataggio =
  | { ok: true }
  | { ok: false; motivo: "non_configurato" | "non_collegato" | "non_valide" | "errore" };

/** Messaggio per l'utente quando il salvataggio nell'account non riesce. */
export function messaggioErrore(esito: EsitoSalvataggio): string | null {
  if (esito.ok) return null;
  switch (esito.motivo) {
    case "non_collegato":
      return "La sessione è scaduta: accedi di nuovo per salvare nel tuo account. Intanto i dati restano in questo browser.";
    case "non_configurato":
      return "Il salvataggio nell'account non è attivo in questa versione: i dati restano in questo browser.";
    case "non_valide":
      return "Qualcosa non torna nei dati: ricarica la pagina e riprova.";
    case "errore":
      return "Non sono riuscito a salvare nel tuo account. I dati restano in questo browser: riprova più tardi.";
  }
}
