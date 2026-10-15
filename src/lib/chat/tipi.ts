/** Tipi condivisi tra il server (/api/chat) e l'interfaccia della chat. */

export type Piano = "gratis" | "avvio" | "accompagnamento" | "partner";

/** Una fonte citata in una risposta, con il numero mostrato accanto alle frasi. */
export type FonteCitata = {
  numero: number;
  fonte_id: string;
  titolo: string;
  url: string;
  ente: string;
  /** Data di controllo della fonte, AAAA-MM-GG. */
  verificato_il: string;
};

/** Una citazione su un pezzo di risposta: la fonte e il passaggio citato. */
export type CitazioneMappata = FonteCitata & { citato: string };

/** Un pezzo di risposta; le citazioni valgono per il testo di questo pezzo. */
export type BloccoRisposta = { testo: string; citazioni: CitazioneMappata[] };

/** Quota di domande da mostrare all'utente. */
export type QuotaPubblica = {
  piano: Piano;
  illimitata: boolean;
  limite: number | null;
  rimanenti: number | null;
  /** Primo giorno del mese successivo (AAAA-MM-GG), quando la quota gratuita riparte. */
  rinnovo_il: string;
  /** Scadenza del piano Avvio (AAAA-MM-GG), se c'è. */
  piano_scade_il: string | null;
};

/** Eventi inviati dal server, uno per riga (NDJSON). */
export type EventoChat =
  | { t: "testo"; d: string }
  | {
      t: "fine";
      risposta: BloccoRisposta[];
      fonti: FonteCitata[];
      senza_risposta: boolean;
      avviso?: string;
      quota?: QuotaPubblica;
    }
  | { t: "errore"; messaggio: string };

/** Uno scambio precedente, rimandato al server come contesto (al massimo 3). */
export type ScambioPrecedente = { domanda: string; risposta: string };
