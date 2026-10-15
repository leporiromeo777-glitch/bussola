import { datiTitolareIncompleti } from "@/lib/sito";
import { componiEmailConferma, type Mittente } from "./email";
import type { DatiIscrizione } from "./validazione";

/** Riga da inserire in public.lista_attesa. */
export type RigaNuova = {
  email: string;
  nome: string | null;
  cantone: string | null;
  situazione: string | null;
  provenienza: string | null;
  consenso_email: true;
};

export type EsitoInserimento =
  | { tipo: "nuova"; token: string }
  | {
      tipo: "duplicata";
      token: string;
      confermata: boolean;
      /** Quando è partita l'ultima email di conferma (ISO), o null se mai. */
      ultimoInvio: string | null;
    };
export type EsitoConferma = "confermata" | "gia_confermata" | "non_trovata";

/**
 * Accesso alla tabella lista_attesa. L'implementazione reale (Supabase con
 * chiave segreta) è in archivio.ts; nei test si usa un finto archivio.
 * I metodi lanciano un errore se il database non risponde.
 */
export interface ArchivioListaAttesa {
  /**
   * Inserisce una nuova iscrizione; se l'email (minuscola) c'è già
   * restituisce "duplicata" con il token e lo stato della conferma.
   */
  inserisci(riga: RigaNuova): Promise<EsitoInserimento>;
  /** Segna che l'email di conferma per il token è appena partita. */
  segnaInvio(token: string): Promise<void>;
  /** Imposta confermato_il per il token, solo se non era già confermata. */
  conferma(token: string): Promise<EsitoConferma>;
  /** Email legata al token, o null se il token non esiste. */
  trova(token: string): Promise<{ email: string } | null>;
  /** Cancella l'iscrizione; true se c'era una riga da cancellare. */
  cancella(token: string): Promise<boolean>;
}

export type MessaggioEmail = {
  a: string;
  oggetto: string;
  html: string;
  testo: string;
  intestazioni?: Record<string, string>;
  /** Evita invii doppi se la richiesta viene ripetuta. */
  chiaveIdempotenza?: string;
};

/** Invia un'email; restituisce false se l'invio non è riuscito. */
export type InviaEmail = (messaggio: MessaggioEmail) => Promise<boolean>;

/**
 * Esito mostrato all'utente. "email" = l'invio delle email è attivo e gli
 * chiediamo di confermare dal link; "lancio" = salvato, gli scriveremo
 * all'apertura. Un'email già in lista dà lo stesso esito di una nuova, e
 * anche un invio non riuscito: non riveliamo chi è iscritto.
 */
export type EsitoIscrizione =
  | { tipo: "ok"; conferma: "email" | "lancio" }
  | { tipo: "demo" }
  | { tipo: "errore" }
  /** Troppe iscrizioni dalla stessa connessione in poco tempo. */
  | { tipo: "troppe_richieste" };

/** Risposta per i bot (campo trappola compilato): uguale a un'iscrizione riuscita. */
export function esitoFinto(emailAttiva: boolean): EsitoIscrizione {
  return { tipo: "ok", conferma: emailAttiva ? "email" : "lancio" };
}

/** Una nuova email di conferma a chi non ha confermato parte al massimo ogni 24 ore. */
export const ATTESA_NUOVO_INVIO_MS = 24 * 60 * 60 * 1000;

const formatoGiorno = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Zurich",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Giorno AAAA-MM-GG nell'ora di Zurigo. */
function giornoZurigo(ora: Date): string {
  const parti = Object.fromEntries(formatoGiorno.formatToParts(ora).map((p) => [p.type, p.value]));
  return `${parti.year}-${parti.month}-${parti.day}`;
}

/**
 * Chiave di idempotenza per Resend: una al giorno per token, così la stessa
 * email non parte due volte nello stesso giorno nemmeno con richieste
 * ripetute (Resend tiene le chiavi per 24 ore).
 */
export function chiaveInvioConferma(token: string, ora: Date): string {
  return `lista-attesa-conferma/${token}/${giornoZurigo(ora)}`;
}

/** true se a questa iscrizione va (ri)mandata l'email di conferma. */
export function serveInvioConferma(inserimento: EsitoInserimento, ora: Date): boolean {
  if (inserimento.tipo === "nuova") return true;
  if (inserimento.confermata) return false;
  if (!inserimento.ultimoInvio) return true;
  const ultimo = new Date(inserimento.ultimoInvio).getTime();
  return Number.isNaN(ultimo) || ora.getTime() - ultimo >= ATTESA_NUOVO_INVIO_MS;
}

export async function registraIscrizione(
  dati: DatiIscrizione,
  dipendenze: {
    archivio: ArchivioListaAttesa | null;
    inviaEmail: InviaEmail | null;
    mittente: Mittente;
    /** Limite per connessione: false se da qui sono arrivate troppe iscrizioni. */
    richiestaConsentita?: () => Promise<boolean>;
    ora?: Date;
  },
): Promise<EsitoIscrizione> {
  const { archivio, inviaEmail, mittente, richiestaConsentita, ora = new Date() } = dipendenze;
  if (!archivio) return { tipo: "demo" };
  // Senza nome, indirizzo ed email del titolare non si raccolgono dati e non
  // parte nessuna email: il mittente deve essere identificabile (LCSl art. 3
  // cpv. 1 lett. o) e l'informativa deve dire chi tratta i dati.
  if (datiTitolareIncompleti(mittente.titolare)) return { tipo: "demo" };
  if (richiestaConsentita && !(await richiestaConsentita())) return { tipo: "troppe_richieste" };

  let inserimento: EsitoInserimento;
  try {
    inserimento = await archivio.inserisci({
      email: dati.email,
      nome: dati.nome,
      cantone: dati.cantone,
      situazione: dati.situazione,
      provenienza: dati.provenienza,
      consenso_email: true,
    });
  } catch (errore) {
    // Niente dati personali nei log: solo il messaggio tecnico.
    console.error("[lista-attesa] inserimento non riuscito:", errore instanceof Error ? errore.message : errore);
    return { tipo: "errore" };
  }

  if (!inviaEmail) return { tipo: "ok", conferma: "lancio" };

  // Già in lista: stessa risposta di una nuova iscrizione. Se non ha ancora
  // confermato rimandiamo il link, ma al massimo una volta ogni 24 ore (così
  // il modulo non si può usare per riempire di email la casella di qualcuno).
  if (serveInvioConferma(inserimento, ora)) {
    await inviaConferma(dati.email, inserimento.token, { archivio, inviaEmail, mittente, ora });
  }
  return { tipo: "ok", conferma: "email" };
}

/** Manda l'email di conferma e, se parte, lo segna. Gli errori finiscono solo nel log. */
async function inviaConferma(
  a: string,
  token: string,
  dip: { archivio: ArchivioListaAttesa; inviaEmail: InviaEmail; mittente: Mittente; ora: Date },
): Promise<void> {
  const email = componiEmailConferma({ token, mittente: dip.mittente });
  const inviata = await dip.inviaEmail({
    a,
    oggetto: email.oggetto,
    html: email.html,
    testo: email.testo,
    intestazioni: email.intestazioni,
    chiaveIdempotenza: chiaveInvioConferma(token, dip.ora),
  });
  if (!inviata) return;
  try {
    await dip.archivio.segnaInvio(token);
  } catch (errore) {
    console.error("[lista-attesa] data di invio non salvata:", errore instanceof Error ? errore.message : errore);
  }
}
