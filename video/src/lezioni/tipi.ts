import type { LezioneCorso } from "../../../src/data/corso";
import type { Fonte } from "../../../src/data/svizzera";

/** Un punto di un elenco che si costruisce scena dopo scena. */
export type PuntoElenco = { testo: string; nota?: string };

/** Cosa si vede accanto a Bleo mentre parla: il punto chiave della scena. */
export type Schermo =
  /** Titolo della lezione, con l'etichetta del corso. */
  | { tipo: "titolo"; etichetta: string; titolo: string }
  /**
   * Elenco numerato. Scene consecutive con lo stesso `titolo` condividono la
   * scheda: cambia solo `visibili`, e il nuovo punto entra con una molla.
   */
  | { tipo: "elenco"; titolo: string; intro?: string; punti: readonly PuntoElenco[]; visibili: number }
  /** Un concetto, con la fonte facoltativa in piccolo. */
  | { tipo: "punto"; titolo: string; testo?: string; fonte?: Fonte }
  /** Avviso importante, nei colori dell'accento. */
  | { tipo: "attenzione"; titolo: string; testo?: string }
  /** La fonte ufficiale, con la data di controllo. */
  | { tipo: "fonte"; fonte: Fonte; verificatoIl: string };

export type Scena = {
  /** Nome del file audio nella cartella della lezione (video/public/<id>/). */
  audio: string;
  /**
   * Il testo detto, come si scrive (anche «Bleo»): diventa sottotitolo.
   * Le frasi lunghe vengono divise da sole in righe più brevi.
   */
  testo: string;
  schermo: Schermo;
};

export type Lezione = {
  /** Uguale al passo del percorso: è anche l'id della composizione e il nome dei file. */
  id: LezioneCorso["passoId"];
  numero: number;
  titolo: string;
  /** Il video di Bleo che parla, già pronto per il loop (vedi scripts/prepara.ts). */
  clip: string;
  scene: readonly Scena[];
  /** Titolo del passo successivo del percorso, per la scheda finale. */
  prossimoPasso?: string;
};

/** Durate misurate da scripts/prepara.ts (in secondi) e salvate in public/<id>/durate.json. */
export type Durate = {
  clip: number;
  scene: readonly {
    audio: string;
    durata: number;
    /** Pause nella voce [inizio, fine]: servono per dividere bene i sottotitoli. */
    pause: readonly (readonly [number, number])[];
  }[];
};
