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

export type EsitoInserimento = { tipo: "nuova"; token: string } | { tipo: "duplicata" };
export type EsitoConferma = "confermata" | "gia_confermata" | "non_trovata";

/**
 * Accesso alla tabella lista_attesa. L'implementazione reale (Supabase con
 * chiave segreta) è in archivio.ts; nei test si usa un finto archivio.
 * I metodi lanciano un errore se il database non risponde.
 */
export interface ArchivioListaAttesa {
  /** Inserisce una nuova iscrizione; "duplicata" se l'email (minuscola) c'è già. */
  inserisci(riga: RigaNuova): Promise<EsitoInserimento>;
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
 * Esito mostrato all'utente. "email" = gli abbiamo chiesto di confermare via
 * email; "lancio" = salvato, gli scriveremo all'apertura. Un'email già in
 * lista dà lo stesso esito di una nuova: non riveliamo chi è iscritto.
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

export async function registraIscrizione(
  dati: DatiIscrizione,
  dipendenze: {
    archivio: ArchivioListaAttesa | null;
    inviaEmail: InviaEmail | null;
    mittente: Mittente;
    /** Limite per connessione: false se da qui sono arrivate troppe iscrizioni. */
    richiestaConsentita?: () => Promise<boolean>;
  },
): Promise<EsitoIscrizione> {
  const { archivio, inviaEmail, mittente, richiestaConsentita } = dipendenze;
  if (!archivio) return { tipo: "demo" };
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

  // Già in lista: stessa risposta di una nuova iscrizione, nessuna email
  // (così il modulo non si può usare per riempire di email la casella di qualcuno).
  if (inserimento.tipo === "duplicata") return esitoFinto(inviaEmail !== null);
  if (!inviaEmail) return { tipo: "ok", conferma: "lancio" };

  const email = componiEmailConferma({ token: inserimento.token, mittente });
  const inviata = await inviaEmail({
    a: dati.email,
    oggetto: email.oggetto,
    html: email.html,
    testo: email.testo,
    intestazioni: email.intestazioni,
    chiaveIdempotenza: `lista-attesa-conferma/${inserimento.token}`,
  });
  return { tipo: "ok", conferma: inviata ? "email" : "lancio" };
}
