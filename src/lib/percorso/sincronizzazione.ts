/**
 * Il percorso nell'account dal lato dell'app: allinea la copia sul telefono
 * (risposte, passi fatti, modifiche non ancora salvate) con l'account, con
 * le regole del sito (pianoAllineamento in sincronizza.ts). La copia sul
 * telefono si scrive subito; all'account si manda quando si può, e dopo un
 * errore di rete si riprova da solo. Una sincronizzazione alla volta.
 *
 * Logica pura: le chiamate al sito e la memoria del telefono arrivano da
 * fuori (mobile/src/lib/percorso-account.ts).
 */
import type { Chiamata, EsitoChiamata } from "@/lib/strumenti/archivio-account";
import { leggiPercorsoAccount, PERCORSO_API, type PercorsoAccount } from "./account-api";
import {
  cambiDellaCopia,
  pianoAllineamento,
  type CopiaLocale,
  type DatiAccount,
  type DomandaSalvataggio,
} from "./sincronizza";

export type FaseSincronizzazione =
  /** Nessun account collegato (o modalità demo): il percorso resta sul telefono. */
  | "senza_accesso"
  /** Prima lettura dell'account dopo l'accesso. */
  | "controllo"
  /** Telefono e account sono uguali. */
  | "salvato"
  /** Modifiche del telefono ancora da mandare all'account. */
  | "da_mandare"
  /** Non si è riusciti a leggere l'account (per esempio senza rete): si riprova. */
  | "non_raggiungibile"
  /** Copia creata senza accesso: prima di salvarla nell'account serve il sì. */
  | "da_confermare"
  /** L'utente ha detto no: il percorso resta solo sul telefono. */
  | "rifiutato"
  /** Il sito non riconosce più l'accesso: bisogna accedere di nuovo. */
  | "accesso_scaduto"
  /** Un errore che riprovando uguale non si risolve. */
  | "errore";

export type StatoSincronizzazione = {
  fase: FaseSincronizzazione;
  /** true mentre parla con il sito. */
  occupato: boolean;
  domanda: DomandaSalvataggio | null;
  errore: { messaggio: string; stato: number | null } | null;
  /** Email dell'account collegato, da mostrare nella domanda. */
  email: string | null;
  /** Cresce a ogni salvataggio riuscito nell'account: chi legge l'account (il calendario) sa che può rileggere. */
  scritture: number;
};

export type DipendenzeSincronizzazione = {
  chiama: Chiamata;
  leggiCopia: () => CopiaLocale;
  scriviCopia: (copia: CopiaLocale) => void;
  /** Dopo che risposte o passi fatti sul telefono sono cambiati per via dell'account (per i promemoria). */
  dopoCambio?: (cambi: { risposte: boolean; passi: boolean }) => void;
  adesso?: () => Date;
};

/** Pausa dopo una modifica sul telefono (più caselle toccate di seguito: un salvataggio solo). */
export const RITARDO_SINCRONIZZAZIONE_MS = 600;

/** Attese prima di riprovare dopo un errore di rete o del server. */
export const ATTESE_NUOVO_TENTATIVO_MS = [2_000, 5_000, 15_000, 30_000, 60_000] as const;

/** Giri di lettura e scrittura al massimo in una sincronizzazione (se si continua a modificare, si riprova dopo). */
const GIRI_MASSIMI = 4;

const MESSAGGIO_INATTESO = "Risposta inattesa da Bleo. Riprovo tra poco.";
const MESSAGGIO_NON_TENUTO = "Non riesco a salvare tutto nel tuo account: riprovo più tardi.";

const iniziale = (): StatoSincronizzazione => ({
  fase: "senza_accesso",
  occupato: false,
  domanda: null,
  errore: null,
  email: null,
  scritture: 0,
});

/** Errori che non si risolvono riprovando uguale (dati non validi, accesso scaduto). */
function definitivo(stato: number | null): boolean {
  return stato !== null && stato >= 400 && stato < 500 && stato !== 408 && stato !== 429;
}

function conModifiche(copia: CopiaLocale, utente: string): boolean {
  return copia.proprietario === utente && copia.inSospeso?.utente === utente && Object.keys(copia.inSospeso.passi).length > 0;
}

export class SincronizzazionePercorso {
  private stato: StatoSincronizzazione = iniziale();
  private readonly ascoltatori = new Set<() => void>();
  private utente: { id: string; email: string | null } | null = null;
  /** Cresce a ogni cambio di utente: le risposte arrivate dopo non toccano più niente. */
  private epoca = 0;
  private inCorso: Promise<void> | null = null;
  private ancora = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private tentativi = 0;
  /** Sì e no alla domanda, finché resta collegato lo stesso account. */
  private confermato = false;
  private rifiutato = false;

  constructor(
    private readonly dip: DipendenzeSincronizzazione,
    private readonly opzioni: { ritardo?: number; attese?: readonly number[] } = {},
  ) {}

  /* --- Per useSyncExternalStore ---------------------------------- */

  readonly istantanea = (): StatoSincronizzazione => this.stato;

  readonly iscrivi = (ascoltatore: () => void): (() => void) => {
    this.ascoltatori.add(ascoltatore);
    return () => {
      this.ascoltatori.delete(ascoltatore);
    };
  };

  private imposta(modifica: Partial<StatoSincronizzazione>) {
    this.stato = { ...this.stato, ...modifica };
    for (const a of this.ascoltatori) a();
  }

  /* --- Accesso ----------------------------------------------------- */

  /**
   * L'account collegato (null: nessuno). Con un account nuovo si riparte da
   * capo e si allinea subito (con un timer: non dentro chi avvisa del cambio).
   */
  impostaUtente(utente: { id: string; email: string | null } | null): void {
    if (utente?.id === this.utente?.id) {
      if (utente && utente.email !== this.stato.email) this.imposta({ email: utente.email });
      return;
    }
    this.ricomincia();
    this.utente = utente;
    this.imposta({ ...iniziale(), fase: utente ? "controllo" : "senza_accesso", email: utente?.email ?? null, scritture: this.stato.scritture });
    if (utente) this.pianifica(0);
  }

  /** Dimentica l'account (per esempio uscendo): le risposte ancora in viaggio si ignorano. */
  azzera(): void {
    this.impostaUtente(null);
  }

  private ricomincia() {
    this.epoca++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.inCorso = null;
    this.ancora = false;
    this.tentativi = 0;
    this.confermato = false;
    this.rifiutato = false;
  }

  /* --- Modifiche e domanda ---------------------------------------- */

  /** Dopo una modifica sul telefono (passo segnato, questionario finito): si manda all'account dopo una breve pausa. */
  modificaLocale(): void {
    if (!this.utente) return;
    // Copia di questo account: la modifica è da mandare. Copia senza proprietario: decide la domanda.
    if (this.dip.leggiCopia().proprietario === this.utente.id && this.stato.fase !== "da_mandare") {
      this.imposta({ fase: "da_mandare", errore: null });
    }
    this.tentativi = 0;
    this.pianifica(this.opzioni.ritardo ?? RITARDO_SINCRONIZZAZIONE_MS);
  }

  /** «Salva»: la copia creata senza accesso va nell'account. */
  conferma(): Promise<void> {
    this.confermato = true;
    this.rifiutato = false;
    return this.sincronizza();
  }

  /** «No»: il percorso resta solo sul telefono (fino al prossimo avvio dell'app o a «Salvalo nell'account»). */
  rifiuta(): void {
    this.rifiutato = true;
    if (this.stato.fase === "da_confermare") this.imposta({ fase: "rifiutato" });
  }

  /**
   * true se sul telefono c'è qualcosa del percorso che nell'account (forse)
   * non c'è: prima di uscire conviene avvisare.
   */
  daSalvare(): boolean {
    const copia = this.dip.leggiCopia();
    if (!copia.risposte && copia.passiFatti.length === 0 && !copia.inSospeso) return false;
    if (!this.utente) return copia.inSospeso !== null;
    return this.stato.fase !== "salvato" || conModifiche(copia, this.utente.id);
  }

  /* --- Sincronizzazione ------------------------------------------- */

  /** Legge l'account, allinea il telefono e manda quello che manca. Se è già in corso, ne fa un'altra subito dopo. */
  sincronizza(): Promise<void> {
    if (!this.utente) return Promise.resolve();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.inCorso) {
      this.ancora = true;
      return this.inCorso;
    }
    const epoca = this.epoca;
    const lavoro: Promise<void> = (async () => {
      do {
        this.ancora = false;
        await this.giro(epoca);
      } while (this.ancora && epoca === this.epoca);
    })().finally(() => {
      if (this.inCorso === lavoro) this.inCorso = null;
      if (epoca === this.epoca) this.imposta({ occupato: false });
    });
    this.inCorso = lavoro;
    return lavoro;
  }

  private pianifica(ritardo: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.sincronizza();
    }, ritardo);
  }

  private riprovaPiuTardi() {
    const attese = this.opzioni.attese ?? ATTESE_NUOVO_TENTATIVO_MS;
    const attesa = attese[Math.min(this.tentativi, attese.length - 1)];
    this.tentativi++;
    this.pianifica(attesa);
  }

  private async giro(epoca: number): Promise<void> {
    const utente = this.utente;
    if (!utente) return;
    this.imposta({ occupato: true });
    let account = await this.leggi(epoca, this.dip.chiama<unknown>(PERCORSO_API));
    if (!account) return;
    let ultimoInvio: string | null = null;

    for (let giro = 0; giro < GIRI_MASSIMI; giro++) {
      const dati: DatiAccount = { collegato: true, userId: utente.id, email: utente.email, ...account };
      const piano = pianoAllineamento(dati, this.dip.leggiCopia(), {
        confermato: this.confermato,
        adesso: (this.dip.adesso?.() ?? new Date()).toISOString(),
      });
      if (piano.tipo === "da_confermare") {
        this.imposta({ fase: this.rifiutato ? "rifiutato" : "da_confermare", domanda: piano.domanda, errore: null });
        return;
      }
      this.scrivi(piano.copia);
      const passi = piano.passi.fatti.length + piano.passi.daFare.length > 0;
      if (!piano.risposte && !passi) {
        this.tentativi = 0;
        this.imposta({ fase: "salvato", domanda: null, errore: null });
        return;
      }
      // Il sito ha risposto bene ma non ha tenuto la modifica (per esempio un passo che non conosce ancora):
      // inutile rimandarla subito. Resta sul telefono e si riprova alla prossima sincronizzazione.
      const invio = JSON.stringify({ risposte: piano.risposte, passi: piano.passi });
      if (invio === ultimoInvio) {
        this.imposta({ fase: "errore", errore: { messaggio: MESSAGGIO_NON_TENUTO, stato: null } });
        return;
      }
      ultimoInvio = invio;
      this.imposta({ fase: "da_mandare", domanda: null });
      if (piano.risposte) {
        account = await this.leggi(
          epoca,
          this.dip.chiama<unknown>(PERCORSO_API, { metodo: "PUT", corpo: { risposte: piano.risposte } }),
        );
        if (!account) return;
      }
      if (passi) {
        account = await this.leggi(epoca, this.dip.chiama<unknown>(PERCORSO_API, { metodo: "PATCH", corpo: piano.passi }));
        if (!account) return;
      }
      this.imposta({ scritture: this.stato.scritture + 1 });
    }
    // Si continua a modificare mentre si salva: si riprende tra poco.
    this.pianifica(this.opzioni.ritardo ?? RITARDO_SINCRONIZZAZIONE_MS);
  }

  /** Il percorso dell'account dalla risposta, oppure null (e lo stato dice perché). */
  private async leggi(epoca: number, chiamata: Promise<EsitoChiamata<unknown>>): Promise<PercorsoAccount | null> {
    const esito = await chiamata;
    if (epoca !== this.epoca) return null;
    const account = esito.ok ? leggiPercorsoAccount(esito.dati) : null;
    if (account) return account;
    this.fallito(esito.ok ? { messaggio: MESSAGGIO_INATTESO, stato: null } : { messaggio: esito.messaggio, stato: esito.stato });
    return null;
  }

  private fallito(errore: { messaggio: string; stato: number | null }) {
    if (errore.stato === 401) {
      this.imposta({ fase: "accesso_scaduto", errore });
      return;
    }
    if (definitivo(errore.stato)) {
      this.imposta({ fase: "errore", errore });
      return;
    }
    // In attesa del sì (o dopo il no): la domanda resta quella, si riprova al prossimo controllo.
    if (this.stato.fase === "da_confermare" || this.stato.fase === "rifiutato") {
      this.imposta({ errore });
      return;
    }
    // Rete o server: si riprova da solo. Se c'era solo da controllare, il telefono resta com'è.
    const copia = this.dip.leggiCopia();
    const daMandare = this.stato.fase === "da_mandare" || (this.utente !== null && conModifiche(copia, this.utente.id));
    const fase = daMandare ? "da_mandare" : this.stato.fase === "salvato" ? "salvato" : "non_raggiungibile";
    this.imposta({ fase, errore });
    if (fase !== "salvato") this.riprovaPiuTardi();
  }

  private scrivi(copia: CopiaLocale) {
    const prima = this.dip.leggiCopia();
    this.dip.scriviCopia(copia);
    const cambi = cambiDellaCopia(prima, copia);
    if (cambi.risposte || cambi.passi) this.dip.dopoCambio?.(cambi);
  }
}
