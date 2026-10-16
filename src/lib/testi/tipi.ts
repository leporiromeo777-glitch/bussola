/**
 * «Testi pronti»: i tipi di testo che Bleo scrive per la nuova attività,
 * con le parti di ciascuno, le lunghezze e le scelte di tono e lingua.
 * Logica pura, usata sia dalla pagina sia dalla route
 * (src/app/api/testi/route.ts): niente dipendenze dal browser o da Next.js.
 */

export const TIPI_TESTO = ["social", "email", "preventivo", "breve"] as const;
export type TipoTesto = (typeof TIPI_TESTO)[number];

export const TONI = ["amichevole", "professionale"] as const;
export type Tono = (typeof TONI)[number];

export const LINGUE = ["it", "de", "fr", "en"] as const;
export type Lingua = (typeof LINGUE)[number];

/** Una parte del risultato (per esempio la bio e la descrizione per il sito). */
export type ParteTesto = {
  /** Titolo mostrato sopra il testo, sempre in italiano. */
  titolo: string;
  /** Massimo di caratteri: oltre, il testo si accorcia. */
  massimo: number;
  /** Indicazione di lunghezza e contenuto per Claude. */
  guida: string;
  /** true se in questa parte sono ammesse emoji (solo con il tono amichevole). */
  emoji?: boolean;
  /** true se il testo può andare a capo (paragrafi); altrimenti resta su una riga. */
  paragrafi?: boolean;
};

export type DefinizioneTipo = {
  id: TipoTesto;
  etichetta: string;
  /** Spiegazione breve per chi sceglie. */
  descrizione: string;
  /** Cosa deve fare il testo, per Claude. */
  scopo: string;
  parti: readonly ParteTesto[];
};

export const MASSIMO_EMOJI = 2;

export const TIPI: Record<TipoTesto, DefinizioneTipo> = {
  social: {
    id: "social",
    etichetta: "Descrizione per sito o Instagram",
    descrizione: "Una bio corta per il profilo e un testo più lungo per il sito.",
    scopo:
      "Presentare l'attività a chi la scopre per la prima volta su Instagram o sul sito: chi sei, cosa offri, a chi e dove.",
    parti: [
      {
        titolo: "Bio per Instagram",
        massimo: 150,
        guida:
          "Al massimo 150 caratteri, spazi ed emoji compresi. Una o due righe brevi: cosa fai, per chi e dove. Niente hashtag.",
        emoji: true,
        paragrafi: true,
      },
      {
        titolo: "Descrizione per il sito",
        massimo: 900,
        guida: "Da 60 a 120 parole, in uno o due paragrafi brevi.",
        paragrafi: true,
      },
    ],
  },
  email: {
    id: "email",
    etichetta: "Prima email a un possibile cliente",
    descrizione: "Oggetto e testo per presentarti a qualcuno che ancora non ti conosce.",
    scopo:
      "Presentarsi a un possibile cliente che non conosce ancora la persona: chi è, cosa offre, perché scrive, e proporre un passo semplice (una telefonata o un incontro breve). Niente pressioni.",
    parti: [
      {
        titolo: "Oggetto",
        massimo: 90,
        guida: "Una riga sola, al massimo 70 caratteri, concreta.",
      },
      {
        titolo: "Testo dell'email",
        massimo: 1_400,
        guida:
          "Da 80 a 150 parole: saluto, presentazione, cosa offri, proposta di un passo semplice, saluti e firma. Paragrafi brevi separati da una riga vuota.",
        paragrafi: true,
      },
    ],
  },
  preventivo: {
    id: "preventivo",
    etichetta: "Presentazione per un preventivo",
    descrizione: "Il paragrafo che va sopra le voci e i prezzi del preventivo.",
    scopo:
      "Il paragrafo introduttivo di un preventivo, sopra l'elenco delle voci: ringraziare per la richiesta, dire in breve cosa si propone e come si lavora. Non contiene prezzi, voci, condizioni di pagamento né scadenze: quelle le scrive la persona nel preventivo.",
    parti: [
      {
        titolo: "Introduzione al preventivo",
        massimo: 700,
        guida: "Da 40 a 90 parole, un solo paragrafo o due molto brevi.",
        paragrafi: true,
      },
    ],
  },
  breve: {
    id: "breve",
    etichetta: "La mia attività in breve",
    descrizione: "Per il business plan o per spiegare in poco tempo cosa fai, per esempio a una banca o a un fiduciario.",
    scopo:
      "Spiegare in modo chiaro e concreto cosa fa l'attività, per chi e dove, in prima persona: per esempio nel business plan o quando la persona si presenta a una banca o a un fiduciario.",
    parti: [
      {
        titolo: "In una frase",
        massimo: 220,
        guida: "Una frase sola, al massimo 25 parole.",
      },
      {
        titolo: "In un paragrafo",
        massimo: 900,
        guida: "Da 60 a 120 parole, un solo paragrafo.",
        paragrafi: true,
      },
    ],
  },
};

export const ETICHETTE_TONO: Record<Tono, { etichetta: string; descrizione: string }> = {
  amichevole: { etichetta: "Amichevole", descrizione: "Dai del tu, caldo e diretto." },
  professionale: { etichetta: "Professionale", descrizione: "Dai del Lei, cortese e sobrio." },
};

export const ETICHETTE_LINGUA: Record<Lingua, string> = {
  it: "Italiano",
  de: "Tedesco",
  fr: "Francese",
  en: "Inglese",
};

/** Nome della lingua per le istruzioni di Claude. */
export const NOMI_LINGUA_ISTRUZIONI: Record<Lingua, string> = {
  it: "italiano",
  de: "tedesco (grafia svizzera: «ss» al posto di «ß»)",
  fr: "francese",
  en: "inglese",
};

export function eTipoTesto(valore: unknown): valore is TipoTesto {
  return typeof valore === "string" && (TIPI_TESTO as readonly string[]).includes(valore);
}
