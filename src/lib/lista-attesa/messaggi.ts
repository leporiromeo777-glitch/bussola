import type { EsitoIscrizione } from "./iscrizione";

export type Messaggio = { titolo: string; testo: string };

export const MESSAGGIO_DEMO =
  "Le iscrizioni non sono ancora attive su questo sito: lo stiamo ancora collegando. Riprova tra qualche giorno.";

export const MESSAGGIO_ERRORE =
  "Non siamo riusciti a salvare l'iscrizione. Riprova tra qualche minuto: i dati che hai scritto sono ancora qui.";

/** Testo da mostrare dopo l'invio del modulo, in base all'esito. */
export function messaggioIscrizione(esito: EsitoIscrizione, email: string): Messaggio {
  switch (esito.tipo) {
    case "demo":
      return { titolo: "Iscrizioni non ancora attive", testo: MESSAGGIO_DEMO };
    case "errore":
      return { titolo: "Qualcosa non ha funzionato", testo: MESSAGGIO_ERRORE };
    case "ok":
      return esito.conferma === "email"
        ? {
            titolo: "Ci sei quasi: controlla la tua email",
            testo: `Se l'indirizzo ${email} è nuovo, ti arriva un'email con il link per confermare l'iscrizione (guarda anche nello spam). Se eri già in lista, non devi fare nulla.`,
          }
        : {
            titolo: "Fatto, sei in lista!",
            testo: `Ti scriveremo a ${email} quando apre la beta chiusa.`,
          };
  }
}
