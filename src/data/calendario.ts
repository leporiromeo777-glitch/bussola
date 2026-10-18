/**
 * «Calendario sempre aggiornato»: le guide ufficiali per aggiungere il link
 * personale di Bleo a Google Calendar e ad Apple Calendario. Le date delle
 * scadenze e delle votazioni sono in svizzera.ts e votazioni.ts.
 */
import type { Fonte } from "./svizzera";

/** Data dell'ultimo controllo delle pagine qui sotto. */
export const VERIFICATO_IL_CALENDARIO = "2026-10-18";

export const fontiCalendario = {
  /**
   * «Aggiungere un calendario pubblico utilizzando un link»: dal computer,
   * Altri calendari > Aggiungi altri calendari > Da URL. Dall'app Google
   * Calendar per Android, iPhone o iPad non ci si può iscrivere.
   */
  googleDaUrl: {
    titolo: "Iscriviti al calendario di un'altra persona (aggiungere un calendario da un URL)",
    url: "https://support.google.com/calendar/answer/37100?hl=it",
    ente: "Guida di Google Calendar (Google)",
  },
  /**
   * «Aggiungi calendario con iscrizione» con l'URL del file .ics; per
   * iscriversi a un calendario .ics si può anche toccare il suo link.
   */
  appleIphone: {
    titolo: "Configurare più calendari su iPhone (iscriversi a un calendario esterno)",
    url: "https://support.apple.com/it-ch/guide/iphone/iph3d1110d4/ios",
    ente: "Supporto Apple",
  },
} as const satisfies Record<string, Fonte>;
