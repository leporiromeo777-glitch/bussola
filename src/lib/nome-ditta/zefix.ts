/**
 * Controllo indicativo nel registro di commercio con la ricerca di Zefix
 * (Indice centrale delle ditte). Si usa la stessa ricerca della pagina
 * pubblica zefix.admin.ch: non serve un accesso, ma non è un'API documentata
 * e può cambiare. Per questo ogni errore diventa «non_disponibile» e la
 * pagina mostra il link per cercare a mano.
 *
 * Logica pura più una funzione di ricerca con `fetch` sostituibile nei test.
 */
import { normalizza, parole } from "./regole";

export const URL_RICERCA_ZEFIX = "https://www.zefix.admin.ch/ZefixREST/api/v1/firm/search.json";

/** Quanto aspettare Zefix prima di rinunciare. */
export const TEMPO_MASSIMO_ZEFIX_MS = 4_000;

/** Quante ditte simili mostrare al massimo per nome. */
export const DITTE_MOSTRATE = 3;

/** Quante ditte chiedere a Zefix (per trovare anche quella con il nome uguale). */
const DITTE_CHIESTE = 10;

/** Parole troppo comuni per la ricerca: Zefix cerca le ditte che contengono tutte le parole. */
const PAROLE_VUOTE = new Set(["di", "da", "del", "dello", "della", "dei", "degli", "delle", "e", "ed", "il", "lo", "la", "le", "i", "gli", "l", "d", "de"]);

/**
 * Forme giuridiche di Zefix (id → nome in italiano), dall'elenco pubblico
 * https://www.zefix.admin.ch/ZefixREST/api/v1/legalForm.json (16.10.2026).
 */
export const FORME_GIURIDICHE_ZEFIX: Readonly<Record<number, string>> = {
  1: "Ditta individuale",
  2: "Società in nome collettivo",
  3: "Società anonima",
  4: "Società a garanzia limitata",
  5: "Cooperativa",
  6: "Associazione",
  7: "Fondazione",
  8: "Istituto di diritto pubblico",
  9: "Succursale",
  10: "Società in accomandita",
  11: "Succursale estera",
  12: "Società in accomandita per azioni",
  13: "Natura giuridica particolare",
  14: "Indivisione",
  15: "Società di investimento a capitale fisso",
  16: "Società di investimento a capitale variabile",
  17: "Società in accomandita per investimenti collettivi di capitale",
  18: "Procura non commerciale",
};

export type DittaTrovata = {
  nome: string;
  /** Forma giuridica in italiano, se Zefix la indica. */
  forma: string | null;
  /** Sede (comune). */
  sede: string | null;
  /** Il nome è uguale a quello cercato (senza contare maiuscole, accenti e punteggiatura). */
  uguale: boolean;
};

export type EsitoRegistro =
  | { stato: "trovati"; ditte: DittaTrovata[]; uguale: boolean; altre: boolean }
  | { stato: "nessuno" }
  | { stato: "non_disponibile" };

/** Le parole da cercare: senza articoli e preposizioni, al massimo 6. */
export function testoRicercaZefix(nomeDitta: string): string {
  return parole(nomeDitta)
    .filter((p) => !PAROLE_VUOTE.has(p))
    .slice(0, 6)
    .join(" ");
}

/** Corpo JSON della ricerca: solo le ditte attive. */
export function corpoRicercaZefix(nomeDitta: string) {
  return { name: testoRicercaZefix(nomeDitta), languageKey: "it", maxEntries: DITTE_CHIESTE, deletedFirms: false };
}

function testo(valore: unknown): string | null {
  return typeof valore === "string" && valore.trim() ? valore.replace(/\s+/g, " ").trim() : null;
}

/** Dalla risposta HTTP di Zefix all'esito da mostrare. */
export function leggiRispostaZefix(status: number, corpo: unknown, nomeCercato: string): EsitoRegistro {
  const oggetto = corpo && typeof corpo === "object" ? (corpo as Record<string, unknown>) : null;
  // Zefix risponde 404 con questo codice quando non trova niente.
  const errore = oggetto?.error as { code?: unknown } | undefined;
  if (status === 404 && errore?.code === "API.ZFR.SEARCH.NORESULT") return { stato: "nessuno" };
  if (status !== 200 || !oggetto || !Array.isArray(oggetto.list)) return { stato: "non_disponibile" };

  const cercato = normalizza(nomeCercato);
  const ditte: DittaTrovata[] = [];
  for (const voce of oggetto.list as unknown[]) {
    if (!voce || typeof voce !== "object") continue;
    const v = voce as Record<string, unknown>;
    const nome = testo(v.name);
    // Solo le ditte esistenti (la ricerca esclude già quelle cancellate).
    if (!nome || (v.status !== undefined && v.status !== "EXISTIEREND")) continue;
    ditte.push({
      nome,
      forma: typeof v.legalFormId === "number" ? (FORME_GIURIDICHE_ZEFIX[v.legalFormId] ?? null) : null,
      sede: testo(v.legalSeat),
      uguale: normalizza(nome) === cercato,
    });
  }
  if (ditte.length === 0) return { stato: "nessuno" };

  // Prima il nome uguale, poi le altre nell'ordine di Zefix.
  const ordinate = [...ditte.filter((d) => d.uguale), ...ditte.filter((d) => !d.uguale)];
  return {
    stato: "trovati",
    ditte: ordinate.slice(0, DITTE_MOSTRATE),
    uguale: ordinate[0].uguale,
    altre: ordinate.length > DITTE_MOSTRATE || oggetto.hasMoreResults === true,
  };
}

type Fetch = (url: string, init: RequestInit) => Promise<Pick<Response, "status" | "json">>;

/**
 * Cerca le ditte attive con le stesse parole del nome. Non lancia mai
 * errori: se Zefix non risponde in tempo o risponde male, «non_disponibile».
 */
export async function cercaSuZefix(
  nomeDitta: string,
  opzioni: { fetch?: Fetch; tempoMassimoMs?: number; segnale?: AbortSignal } = {},
): Promise<EsitoRegistro> {
  const corpo = corpoRicercaZefix(nomeDitta);
  if (!corpo.name) return { stato: "non_disponibile" };
  const esegui = opzioni.fetch ?? fetch;
  const scadenza = AbortSignal.timeout(opzioni.tempoMassimoMs ?? TEMPO_MASSIMO_ZEFIX_MS);
  const segnale = opzioni.segnale ? AbortSignal.any([scadenza, opzioni.segnale]) : scadenza;
  try {
    const risposta = await esegui(URL_RICERCA_ZEFIX, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(corpo),
      signal: segnale,
      cache: "no-store",
    });
    const json: unknown = await risposta.json().catch(() => null);
    return leggiRispostaZefix(risposta.status, json, nomeDitta);
  } catch {
    return { stato: "non_disponibile" };
  }
}
