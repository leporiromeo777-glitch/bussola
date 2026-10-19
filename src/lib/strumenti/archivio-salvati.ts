/**
 * Budget o business plan salvato nell'account, dal lato di chi lo modifica
 * (sito e app): tiene in memoria i dati dello strumento, li salva dopo una
 * breve pausa e riprova da solo quando la rete torna. Come
 * src/lib/strumenti/archivio-account.ts per preventivi e fatture, ma con un
 * solo documento per strumento: `aggiorna((dati) => …)`, come l'archivio nel
 * browser.
 *
 * Logica pura: le chiamate al sito arrivano da fuori (`chiama`), con i
 * cookie sul sito e con `Authorization: Bearer` nell'app.
 */
import {
  ATTESE_NUOVO_TENTATIVO_MS,
  RITARDO_SALVATAGGIO_MS,
  type Chiamata,
  type ErroreArchivio,
} from "./archivio-account";
import { dataIsoLocale } from "./documenti";
import {
  datiDaContenuto,
  datiIniziali,
  PERCORSI_SALVATI,
  type DatiStrumento,
  type RispostaImportazioneStrumento,
  type RispostaSalvataggio,
  type RispostaStrumento,
  type StrumentoSalvato,
} from "./salvati";

export type StatoStrumento<T> = {
  caricamento: "da_fare" | "in_corso" | "pronto" | "errore";
  /** Perché non si è riusciti a leggere i dati dall'account. */
  errore: ErroreArchivio | null;
  /** I dati da mostrare: quelli dell'account o, se l'account non li ha, quelli iniziali. null finché non letti. */
  dati: T | null;
  /** true se nell'account c'è già una riga per questo strumento. */
  nellAccount: boolean;
  /** Ultimo salvataggio nell'account (ISO), null se mai. */
  aggiornatoIl: string | null;
  /** «salvato»: niente in sospeso; «in_attesa»: modifiche da mandare; «errore»: l'ultimo salvataggio non è riuscito. */
  salvataggio: "salvato" | "in_attesa" | "in_corso" | "errore";
  erroreSalvataggio: ErroreArchivio | null;
};

const MESSAGGIO_INATTESO = "Risposta inattesa da Bleo. Riprova tra poco.";

function iniziale<T>(): StatoStrumento<T> {
  return {
    caricamento: "da_fare",
    errore: null,
    dati: null,
    nellAccount: false,
    aggiornatoIl: null,
    salvataggio: "salvato",
    erroreSalvataggio: null,
  };
}

/** Errori che non si risolvono riprovando uguale (dati non validi, accesso scaduto). */
function definitivo(stato: number | null): boolean {
  return stato !== null && stato >= 400 && stato < 500 && stato !== 408 && stato !== 429;
}

const testoOppureNull = (v: unknown) => (typeof v === "string" ? v : null);

export type OpzioniArchivioStrumento = {
  /** Data di oggi (AAAA-MM-GG, ora locale): il budget nuovo parte dal mese dopo. */
  oggi?: () => string;
  ritardo?: number;
  attese?: readonly number[];
};

export type EsitoCopia = { ok: true; importato: boolean } | { ok: false; errore: ErroreArchivio };

export class ArchivioStrumento<S extends StrumentoSalvato> {
  private stato: StatoStrumento<DatiStrumento[S]> = iniziale();
  private readonly ascoltatori = new Set<() => void>();
  /** Numero dell'ultima modifica e dell'ultima salvata: diversi = qualcosa da mandare. */
  private modifica = 0;
  private salvata = 0;
  /** L'ultima modifica è «ricomincia da zero»: si cancella la riga dell'account. */
  private daCancellare = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private tentativi = 0;
  private salvataggioInCorso: Promise<void> | null = null;
  private ancora = false;
  private letturaInCorso: Promise<void> | null = null;
  /** Cresce a ogni azzeramento: le risposte arrivate dopo non toccano più lo stato. */
  private epoca = 0;

  constructor(
    readonly strumento: S,
    private readonly chiama: Chiamata,
    private readonly opzioni: OpzioniArchivioStrumento = {},
  ) {}

  private get percorso() {
    return PERCORSI_SALVATI.strumento(this.strumento);
  }

  private predefinito(): DatiStrumento[S] {
    return datiIniziali(this.strumento, (this.opzioni.oggi ?? (() => dataIsoLocale(new Date())))());
  }

  /* --- Per useSyncExternalStore ---------------------------------- */

  readonly istantanea = (): StatoStrumento<DatiStrumento[S]> => this.stato;

  readonly iscrivi = (ascoltatore: () => void): (() => void) => {
    this.ascoltatori.add(ascoltatore);
    return () => {
      this.ascoltatori.delete(ascoltatore);
    };
  };

  private imposta(modifica: Partial<StatoStrumento<DatiStrumento[S]>>) {
    this.stato = { ...this.stato, ...modifica };
    for (const a of this.ascoltatori) a();
  }

  /** true se ci sono modifiche non ancora salvate nell'account. */
  inAttesa(): boolean {
    return this.modifica !== this.salvata;
  }

  /* --- Lettura ----------------------------------------------------- */

  /**
   * Legge i dati dall'account. Senza `forza` lo fa una volta sola; con
   * `forza` rilegge (per vedere le modifiche fatte su un altro dispositivo),
   * ma le modifiche non ancora salvate restano quelle fatte qui.
   */
  carica({ forza = false }: { forza?: boolean } = {}): Promise<void> {
    if (this.letturaInCorso) return this.letturaInCorso;
    if (!forza && this.stato.caricamento === "pronto") return Promise.resolve();
    const epoca = this.epoca;
    this.imposta({ caricamento: this.stato.dati ? "pronto" : "in_corso", errore: null });
    this.letturaInCorso = (async () => {
      const esito = await this.chiama<RispostaStrumento<unknown>>(this.percorso);
      if (epoca !== this.epoca) return;
      const risposta = esito.ok && typeof esito.dati === "object" && esito.dati !== null && "dati" in esito.dati ? esito.dati : null;
      if (!risposta) {
        const errore = esito.ok ? { messaggio: MESSAGGIO_INATTESO, stato: null } : { messaggio: esito.messaggio, stato: esito.stato };
        this.imposta({ caricamento: this.stato.dati ? "pronto" : "errore", errore });
        return;
      }
      const remoti = risposta.dati === null ? null : datiDaContenuto(this.strumento, risposta.dati);
      // Le modifiche non ancora salvate vincono su quello che c'è nell'account.
      const dati = this.inAttesa() && this.stato.dati ? this.stato.dati : (remoti ?? this.predefinito());
      this.imposta({
        caricamento: "pronto",
        errore: null,
        dati,
        nellAccount: risposta.dati !== null,
        aggiornatoIl: testoOppureNull(risposta.aggiornatoIl),
      });
    })().finally(() => {
      this.letturaInCorso = null;
    });
    return this.letturaInCorso;
  }

  /* --- Modifiche --------------------------------------------------- */

  /** Cambia i dati: si salvano nell'account dopo una breve pausa. */
  aggiorna(aggiornamento: (precedente: DatiStrumento[S]) => DatiStrumento[S]): void {
    const precedente = this.stato.dati;
    if (this.stato.caricamento !== "pronto" || !precedente) return;
    const nuovo = aggiornamento(precedente);
    if (nuovo === precedente) return;
    this.segna(false);
    this.imposta({ dati: nuovo });
    this.pianifica();
  }

  /** «Ricomincia da zero»: i dati tornano quelli iniziali e si cancellano dall'account. */
  cancella(): void {
    if (this.stato.caricamento !== "pronto") return;
    this.segna(true);
    this.imposta({ dati: this.predefinito() });
    this.pianifica(0);
  }

  private segna(cancella: boolean) {
    this.modifica++;
    this.daCancellare = cancella;
    this.tentativi = 0;
  }

  private pianifica(ritardo = this.opzioni.ritardo ?? RITARDO_SALVATAGGIO_MS) {
    if (!this.inAttesa()) return;
    if (this.stato.salvataggio !== "in_corso") this.imposta({ salvataggio: "in_attesa" });
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.salva();
    }, ritardo);
  }

  /* --- Salvataggio ------------------------------------------------- */

  /**
   * Manda subito all'account l'ultima modifica. Con `keepalive` la richiesta
   * continua anche se la pagina si chiude.
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
    if (!this.inAttesa()) return Promise.resolve();
    const epoca = this.epoca;
    this.salvataggioInCorso = (async () => {
      let errore: ErroreArchivio | null = null;
      do {
        this.ancora = false;
        if (!this.inAttesa()) break;
        this.imposta({ salvataggio: "in_corso" });
        const numero = this.modifica;
        const cancella = this.daCancellare;
        const esito = cancella
          ? await this.chiama(this.percorso, { metodo: "DELETE", keepalive })
          : await this.chiama<RispostaSalvataggio>(this.percorso, { metodo: "PUT", corpo: this.stato.dati, keepalive });
        if (epoca !== this.epoca) return;
        if (esito.ok || (cancella && esito.stato === 404)) {
          // Già cancellato altrove (404): va bene così.
          if (numero > this.salvata) this.salvata = numero;
          if (cancella) this.imposta({ nellAccount: false, aggiornatoIl: null });
          else {
            const quando = esito.ok ? testoOppureNull((esito.dati as Partial<RispostaSalvataggio> | undefined)?.aggiornatoIl) : null;
            this.imposta({ nellAccount: true, aggiornatoIl: quando ?? this.stato.aggiornatoIl });
          }
        } else {
          errore = { messaggio: esito.messaggio, stato: esito.stato };
        }
      } while (this.ancora && !errore);
      if (errore) {
        this.imposta({ salvataggio: "errore", erroreSalvataggio: errore });
        if (!definitivo(errore.stato)) this.riprovaPiuTardi();
      } else if (this.inAttesa()) {
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

  /* --- Copia dal browser o dal telefono -------------------------- */

  /**
   * Copia nell'account i dati salvati nel browser o sul telefono prima
   * dell'accesso, solo se l'account non ha ancora questo strumento: se li ha
   * (per esempio salvati nel frattempo dall'altro dispositivo) restano quelli
   * dell'account e `importato` è false.
   */
  async importa(dati: DatiStrumento[S]): Promise<EsitoCopia> {
    // Prima le modifiche fatte qui, così l'account sa se ha già i suoi dati.
    if (this.inAttesa()) await this.salva();
    const epoca = this.epoca;
    const esito = await this.chiama<RispostaImportazioneStrumento<unknown>>(this.percorso, { metodo: "POST", corpo: dati });
    if (epoca !== this.epoca) return { ok: false, errore: { messaggio: MESSAGGIO_INATTESO, stato: null } };
    if (!esito.ok) return { ok: false, errore: { messaggio: esito.messaggio, stato: esito.stato } };
    if (typeof esito.dati?.importato !== "boolean") return { ok: false, errore: { messaggio: MESSAGGIO_INATTESO, stato: null } };
    const nellAccount = esito.dati.dati === null ? null : datiDaContenuto(this.strumento, esito.dati.dati);
    if (!this.inAttesa()) {
      this.imposta({
        caricamento: "pronto",
        errore: null,
        dati: nellAccount ?? (esito.dati.importato ? dati : (this.stato.dati ?? this.predefinito())),
        nellAccount: true,
        aggiornatoIl: testoOppureNull(esito.dati.aggiornatoIl),
      });
    }
    return { ok: true, importato: esito.dati.importato };
  }

  /**
   * Mette nell'account i dati del browser o del telefono al posto di quelli
   * che c'erano (l'utente l'ha scelto) e li salva subito.
   */
  async sostituisci(dati: DatiStrumento[S]): Promise<{ ok: true } | { ok: false; errore: ErroreArchivio }> {
    if (this.stato.caricamento !== "pronto") {
      return { ok: false, errore: this.stato.errore ?? { messaggio: MESSAGGIO_INATTESO, stato: null } };
    }
    this.aggiorna(() => dati);
    await this.salva();
    if (this.inAttesa() || this.stato.salvataggio === "errore") {
      return { ok: false, errore: this.stato.erroreSalvataggio ?? { messaggio: MESSAGGIO_INATTESO, stato: null } };
    }
    return { ok: true };
  }

  /* --- Uscita ------------------------------------------------------ */

  /** Dimentica tutto (per esempio quando si esce dall'account). Le risposte ancora in viaggio si ignorano. */
  azzera(): void {
    this.epoca++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.modifica = 0;
    this.salvata = 0;
    this.daCancellare = false;
    this.tentativi = 0;
    this.ancora = false;
    this.salvataggioInCorso = null;
    this.letturaInCorso = null;
    this.imposta(iniziale());
  }
}
