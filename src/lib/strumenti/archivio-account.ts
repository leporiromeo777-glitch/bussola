/**
 * Preventivi e fatture salvati nell'account, dal lato di chi li modifica
 * (sito e app): tiene in memoria i documenti e i dati dell'emittente, salva
 * le modifiche dopo una breve pausa (un documento alla volta, nell'ordine) e
 * riprova da solo quando la rete torna. Stessa forma di aggiornamento
 * dell'archivio nel browser (src/components/strumenti/usa-archivio.ts):
 * `aggiornaDocumenti((lista) => …)`.
 *
 * Logica pura: le chiamate al sito arrivano da fuori (`chiama`), con i
 * cookie sul sito e con `Authorization: Bearer` nell'app.
 */
import {
  lottiImportazione,
  PERCORSI_DOCUMENTI,
  type RispostaDocumenti,
  type RispostaImportazione,
} from "./account";
import type { Documento, Emittente } from "./documenti";

export type EsitoChiamata<T> = { ok: true; dati: T } | { ok: false; messaggio: string; stato: number | null };

export type OpzioniChiamata = { metodo?: string; corpo?: unknown; keepalive?: boolean };

/** Chiamata a un'API del sito; non lancia errori. */
export type Chiamata = <T>(percorso: string, opzioni?: OpzioniChiamata) => Promise<EsitoChiamata<T>>;

export type ErroreArchivio = { messaggio: string; stato: number | null };

export type StatoArchivio = {
  caricamento: "da_fare" | "in_corso" | "pronto" | "errore";
  /** Perché non si è riusciti a leggere i documenti dall'account. */
  errore: ErroreArchivio | null;
  /** null finché non sono stati letti. */
  documenti: Documento[] | null;
  emittente: Emittente | null;
  /** true se nell'account ci sono già i dati dell'emittente. */
  emittenteNellAccount: boolean;
  /** «salvato»: niente in sospeso; «in_attesa»: modifiche da mandare; «errore»: l'ultimo salvataggio non è riuscito. */
  salvataggio: "salvato" | "in_attesa" | "in_corso" | "errore";
  erroreSalvataggio: ErroreArchivio | null;
};

/** Pausa dopo l'ultima modifica prima di salvare (si scrive di seguito: un salvataggio solo). */
export const RITARDO_SALVATAGGIO_MS = 800;

/** Attese prima di riprovare dopo un errore di rete o del server. */
export const ATTESE_NUOVO_TENTATIVO_MS = [2_000, 5_000, 15_000, 30_000, 60_000] as const;

const MESSAGGIO_INATTESO = "Risposta inattesa da Bleo. Riprova tra poco.";

const CHIAVE_EMITTENTE = "emittente";
const chiaveDocumento = (id: string) => `doc:${id}`;

const iniziale = (): StatoArchivio => ({
  caricamento: "da_fare",
  errore: null,
  documenti: null,
  emittente: null,
  emittenteNellAccount: false,
  salvataggio: "salvato",
  erroreSalvataggio: null,
});

/** Errori che non si risolvono riprovando uguale (dati non validi, accesso scaduto, troppi documenti). */
function definitivo(stato: number | null): boolean {
  return stato !== null && stato >= 400 && stato < 500 && stato !== 408 && stato !== 429;
}

export class ArchivioAccount {
  private stato: StatoArchivio = iniziale();
  private readonly ascoltatori = new Set<() => void>();
  /** Modifiche da mandare: chiave → numero della modifica (per sapere se è cambiata mentre si salvava). */
  private readonly inSospeso = new Map<string, number>();
  private contatore = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private tentativi = 0;
  private salvataggioInCorso: Promise<void> | null = null;
  private ancora = false;
  private letturaInCorso: Promise<void> | null = null;
  /** Cresce a ogni azzeramento: le risposte arrivate dopo non toccano più lo stato. */
  private epoca = 0;

  constructor(
    private readonly chiama: Chiamata,
    private readonly opzioni: { ritardo?: number; attese?: readonly number[] } = {},
  ) {}

  /* --- Per useSyncExternalStore ---------------------------------- */

  readonly istantanea = (): StatoArchivio => this.stato;

  readonly iscrivi = (ascoltatore: () => void): (() => void) => {
    this.ascoltatori.add(ascoltatore);
    return () => {
      this.ascoltatori.delete(ascoltatore);
    };
  };

  private imposta(modifica: Partial<StatoArchivio>) {
    this.stato = { ...this.stato, ...modifica };
    for (const a of this.ascoltatori) a();
  }

  /** true se ci sono modifiche non ancora salvate nell'account. */
  inAttesa(): boolean {
    return this.inSospeso.size > 0;
  }

  /* --- Lettura ----------------------------------------------------- */

  /**
   * Legge documenti ed emittente dall'account. Senza `forza` lo fa una volta
   * sola; con `forza` rilegge, ma le modifiche non ancora salvate restano
   * quelle fatte qui.
   */
  carica({ forza = false }: { forza?: boolean } = {}): Promise<void> {
    if (this.letturaInCorso) return this.letturaInCorso;
    if (!forza && this.stato.caricamento === "pronto") return Promise.resolve();
    const epoca = this.epoca;
    this.imposta({ caricamento: this.stato.documenti ? "pronto" : "in_corso", errore: null });
    this.letturaInCorso = (async () => {
      const esito = await this.chiama<RispostaDocumenti>(PERCORSI_DOCUMENTI.elenco);
      if (epoca !== this.epoca) return;
      if (!esito.ok || !Array.isArray(esito.dati?.documenti)) {
        const errore = esito.ok ? { messaggio: MESSAGGIO_INATTESO, stato: null } : { messaggio: esito.messaggio, stato: esito.stato };
        this.imposta({ caricamento: this.stato.documenti ? "pronto" : "errore", errore });
        return;
      }
      const remoti = esito.dati.documenti;
      const locali = new Map((this.stato.documenti ?? []).map((d) => [d.id, d]));
      // Le modifiche non ancora salvate vincono su quello che c'è nell'account.
      const documenti = remoti
        .filter((d) => !this.inSospeso.has(chiaveDocumento(d.id)) || locali.has(d.id))
        .map((d) => (this.inSospeso.has(chiaveDocumento(d.id)) ? (locali.get(d.id) ?? d) : d));
      for (const [id, d] of locali) {
        if (this.inSospeso.has(chiaveDocumento(id)) && !remoti.some((r) => r.id === id)) documenti.push(d);
      }
      const emittente =
        this.inSospeso.has(CHIAVE_EMITTENTE) && this.stato.emittente ? this.stato.emittente : esito.dati.emittente;
      this.imposta({
        caricamento: "pronto",
        errore: null,
        documenti,
        emittente,
        emittenteNellAccount: esito.dati.emittente !== null || this.stato.emittenteNellAccount,
      });
    })().finally(() => {
      this.letturaInCorso = null;
    });
    return this.letturaInCorso;
  }

  /* --- Modifiche --------------------------------------------------- */

  /** Cambia l'elenco dei documenti: quelli nuovi o cambiati si salvano, quelli tolti si cancellano. */
  aggiornaDocumenti(aggiornamento: (precedenti: Documento[]) => Documento[]): void {
    const precedenti = this.stato.documenti;
    if (!precedenti) return;
    const nuovi = aggiornamento(precedenti);
    const prima = new Map(precedenti.map((d) => [d.id, d]));
    const dopo = new Set<string>();
    for (const d of nuovi) {
      dopo.add(d.id);
      if (prima.get(d.id) !== d) this.segna(chiaveDocumento(d.id));
    }
    for (const id of prima.keys()) if (!dopo.has(id)) this.segna(chiaveDocumento(id));
    this.imposta({ documenti: nuovi });
    this.pianifica();
  }

  /** Cambia i dati dell'emittente (per i prossimi documenti). */
  aggiornaEmittente(aggiornamento: (precedente: Emittente | null) => Emittente): void {
    if (this.stato.caricamento !== "pronto") return;
    const nuovo = aggiornamento(this.stato.emittente);
    if (nuovo === this.stato.emittente) return;
    this.segna(CHIAVE_EMITTENTE);
    this.imposta({ emittente: nuovo });
    this.pianifica();
  }

  private segna(chiave: string) {
    this.inSospeso.set(chiave, ++this.contatore);
    this.tentativi = 0;
  }

  private pianifica(ritardo = this.opzioni.ritardo ?? RITARDO_SALVATAGGIO_MS) {
    if (this.inSospeso.size === 0) return;
    if (this.stato.salvataggio !== "in_corso") this.imposta({ salvataggio: "in_attesa" });
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.salva();
    }, ritardo);
  }

  /* --- Salvataggio ------------------------------------------------- */

  /**
   * Manda subito all'account le modifiche in sospeso. Con `keepalive` la
   * richiesta continua anche se la pagina si chiude.
   */
  salva({ keepalive = false }: { keepalive?: boolean } = {}): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.salvataggioInCorso) {
      this.ancora = true;
      return this.salvataggioInCorso;
    }
    if (this.inSospeso.size === 0) return Promise.resolve();
    const epoca = this.epoca;
    this.salvataggioInCorso = (async () => {
      let errore: ErroreArchivio | null = null;
      let riprova = false;
      do {
        this.ancora = false;
        this.imposta({ salvataggio: "in_corso" });
        errore = null;
        for (const [chiave, numero] of [...this.inSospeso]) {
          const esito = await this.manda(chiave, keepalive);
          if (epoca !== this.epoca) return;
          if (esito.ok) {
            if (this.inSospeso.get(chiave) === numero) this.inSospeso.delete(chiave);
            continue;
          }
          errore = { messaggio: esito.messaggio, stato: esito.stato };
          // Rete o server: inutile provare gli altri adesso. Dati non validi: gli altri si salvano lo stesso.
          if (!definitivo(esito.stato) || esito.stato === 401) {
            riprova = !definitivo(esito.stato);
            break;
          }
        }
      } while (this.ancora && !errore);
      if (errore) {
        this.imposta({ salvataggio: "errore", erroreSalvataggio: errore });
        if (riprova) this.riprovaPiuTardi();
      } else if (this.inSospeso.size > 0) {
        this.imposta({ salvataggio: "in_attesa", erroreSalvataggio: null });
        this.pianifica();
      } else {
        this.tentativi = 0;
        this.imposta({ salvataggio: "salvato", erroreSalvataggio: null });
      }
    })().finally(() => {
      this.salvataggioInCorso = null;
    });
    return this.salvataggioInCorso;
  }

  private riprovaPiuTardi() {
    const attese = this.opzioni.attese ?? ATTESE_NUOVO_TENTATIVO_MS;
    const attesa = attese[Math.min(this.tentativi, attese.length - 1)];
    this.tentativi++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.salva();
    }, attesa);
  }

  private async manda(chiave: string, keepalive: boolean): Promise<EsitoChiamata<unknown>> {
    if (chiave === CHIAVE_EMITTENTE) {
      const emittente = this.stato.emittente;
      if (!emittente) return { ok: true, dati: null };
      const esito = await this.chiama(PERCORSI_DOCUMENTI.emittente, { metodo: "PUT", corpo: emittente, keepalive });
      if (esito.ok) this.imposta({ emittenteNellAccount: true });
      return esito;
    }
    const id = chiave.slice("doc:".length);
    const doc = this.stato.documenti?.find((d) => d.id === id);
    if (doc) return this.chiama(PERCORSI_DOCUMENTI.documento(id), { metodo: "PUT", corpo: doc, keepalive });
    const esito = await this.chiama(PERCORSI_DOCUMENTI.documento(id), { metodo: "DELETE", keepalive });
    // Già cancellato altrove: va bene così.
    return !esito.ok && esito.stato === 404 ? { ok: true, dati: null } : esito;
  }

  /* --- Importazione dal browser ---------------------------------- */

  /**
   * Copia nell'account i documenti (e, se l'account non li ha, i dati
   * dell'emittente) salvati nel browser prima dell'accesso. Quelli con un id
   * già presente nell'account non si toccano: niente doppioni. Restituisce
   * gli id dei documenti che ora sono nell'account.
   */
  async importa(
    documenti: readonly Documento[],
    emittente: Emittente | null,
  ): Promise<{ ok: true; importati: string[]; giaPresenti: string[]; scartati: number } | { ok: false; errore: ErroreArchivio; importati: string[] }> {
    const epoca = this.epoca;
    const importati: string[] = [];
    const giaPresenti: string[] = [];
    let scartati = 0;
    let conEmittente = emittente !== null && !this.stato.emittenteNellAccount;
    const lotti = lottiImportazione(documenti);
    if (lotti.length === 0 && conEmittente) lotti.push([]);
    for (const lotto of lotti) {
      const esito = await this.chiama<RispostaImportazione>(PERCORSI_DOCUMENTI.elenco, {
        metodo: "POST",
        corpo: conEmittente ? { documenti: lotto, emittente } : { documenti: lotto },
      });
      if (epoca !== this.epoca) return { ok: false, errore: { messaggio: MESSAGGIO_INATTESO, stato: null }, importati };
      if (!esito.ok || !Array.isArray(esito.dati?.importati)) {
        const errore = esito.ok ? { messaggio: MESSAGGIO_INATTESO, stato: null } : { messaggio: esito.messaggio, stato: esito.stato };
        if (importati.length > 0) await this.carica({ forza: true });
        return { ok: false, errore, importati };
      }
      importati.push(...esito.dati.importati);
      giaPresenti.push(...esito.dati.giaPresenti);
      scartati += esito.dati.scartati;
      if (conEmittente && esito.dati.emittente && emittente && !this.inSospeso.has(CHIAVE_EMITTENTE)) {
        this.imposta({ emittente, emittenteNellAccount: true });
      }
      // Una volta basta: se l'account li aveva già, restano quelli dell'account.
      conEmittente = false;
      const nuovi = new Set(esito.dati.importati);
      const aggiunti = lotto.filter((d) => nuovi.has(d.id) && !this.stato.documenti?.some((x) => x.id === d.id));
      if (aggiunti.length > 0) this.imposta({ documenti: [...(this.stato.documenti ?? []), ...aggiunti] });
    }
    return { ok: true, importati, giaPresenti, scartati };
  }

  /* --- Uscita ------------------------------------------------------ */

  /** Dimentica tutto (per esempio quando si esce dall'account). Le risposte ancora in viaggio si ignorano. */
  azzera(): void {
    this.epoca++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.inSospeso.clear();
    this.tentativi = 0;
    this.ancora = false;
    this.salvataggioInCorso = null;
    this.letturaInCorso = null;
    this.imposta(iniziale());
  }
}
