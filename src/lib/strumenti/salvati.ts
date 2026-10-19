/**
 * «Budget del primo anno» e «Business plan di una pagina» nell'account: i
 * dati dei due strumenti salvati nel database invece che nel browser (o nel
 * telefono) quando c'è l'accesso. Così lo stesso budget e lo stesso business
 * plan si vedono sul sito e nell'app.
 *
 * Qui la parte pura: controllo di quello che arriva alle API (zod, con le
 * stesse lunghezze degli strumenti), righe del database (tabella
 * strumenti_salvati, migrazione 20261021000001_strumenti_salvati.sql) e cosa
 * proporre di copiare dal browser o dal telefono. La usano la route
 * /api/strumenti/salvati/[strumento], il sito e l'app.
 */
import { z } from "zod";
import { CHIAVI_ARCHIVIO } from "./archivio";
import { calcolaBudget, datiBudgetIniziali, LUNGHEZZE_BUDGET, schemaDatiBudget, type DatiBudget } from "./budget";
import {
  CAMPI_PIANO,
  campiCompilati,
  datiPianoIniziali,
  LUNGHEZZA_NOME_PIANO,
  MASSIMO_ASSOLUTO,
  schemaDatiPiano,
  type CampoPiano,
  type DatiPiano,
} from "./business-plan";
import { importo } from "./numeri";

/** Gli strumenti che si salvano nell'account (colonna «strumento», lo verifica supabase/schema.test.ts). */
export const STRUMENTI_SALVATI = ["budget", "business-plan"] as const;
export type StrumentoSalvato = (typeof STRUMENTI_SALVATI)[number];

export type DatiStrumento = { budget: DatiBudget; "business-plan": DatiPiano };

export function strumentoValido(s: unknown): s is StrumentoSalvato {
  return typeof s === "string" && (STRUMENTI_SALVATI as readonly string[]).includes(s);
}

/** Chiave dello stesso strumento nel browser (sito) e sul telefono (app). */
export const CHIAVI_STRUMENTI = {
  budget: CHIAVI_ARCHIVIO.budget,
  "business-plan": CHIAVI_ARCHIVIO.businessPlan,
} as const satisfies Record<StrumentoSalvato, string>;

/** Schema con cui il browser, il telefono e il server rileggono i dati (i campi rovinati tornano ai valori iniziali). */
export const SCHEMI_STRUMENTI: { [S in StrumentoSalvato]: z.ZodType<DatiStrumento[S]> } = {
  budget: schemaDatiBudget,
  "business-plan": schemaDatiPiano,
};

/** I dati di uno strumento mai compilato. Il budget parte dal mese dopo `oggiIso`. */
export function datiIniziali<S extends StrumentoSalvato>(strumento: S, oggiIso: string): DatiStrumento[S] {
  return (strumento === "budget" ? datiBudgetIniziali(oggiIso) : datiPianoIniziali()) as DatiStrumento[S];
}

export const PERCORSI_SALVATI = {
  strumento: (s: StrumentoSalvato) => `/api/strumenti/salvati/${s}`,
} as const;

/** Caratteri al massimo del corpo di una richiesta (i dati validi ne usano molti meno). */
export const CORPO_STRUMENTO_MASSIMO = 200_000;

/** Byte al massimo del contenuto nel database (vincolo strumenti_salvati_contenuto). */
export const CONTENUTO_STRUMENTO_MASSIMO = 500_000;

/** Nomi per i testi dell'interfaccia (tutti e due maschili: «il budget», «il business plan»). */
export const NOMI_STRUMENTI = {
  budget: { titolo: "Budget del primo anno", nome: "budget", percorso: "/strumenti/budget" },
  "business-plan": { titolo: "Business plan di una pagina", nome: "business plan", percorso: "/strumenti/business-plan" },
} as const satisfies Record<StrumentoSalvato, { titolo: string; nome: string; percorso: string }>;

export const MESSAGGI_SALVATI = {
  nonAttivo: "Il salvataggio di budget e business plan nell'account non è ancora attivo.",
  nonCollegato: "Accedi di nuovo per salvare budget e business plan nel tuo account.",
  richiestaNonValida: "La richiesta non è valida. Ricarica la pagina e riprova.",
  datiNonValidi: "Questi dati non si possono salvare così: ricarica la pagina e riprova.",
  troppoLungo: "Sono troppi dati per salvarli: togli qualche voce o accorcia i testi.",
  erroreDatabase: "Non riesco a salvare in questo momento. Riprova tra poco.",
  nonTrovato: "Questo strumento non si salva nell'account.",
  nienteDaCancellare: "Nel tuo account non c'è niente da cancellare per questo strumento.",
} as const;

/* ------------------------------------------------------------------ */
/* Controllo di quello che arriva alle API                             */
/* ------------------------------------------------------------------ */

const testo = (massimo: number) => z.string().max(massimo);
const B = LUNGHEZZE_BUDGET;
const campiRiga = { id: testo(B.id), descrizione: testo(B.descrizione), importo: testo(B.importo) };

/**
 * Il budget come lo manda lo strumento (sito o app): stessi campi e stesse
 * lunghezze dello schema del browser, ma senza correzioni. Quello che non va
 * bene si rifiuta.
 */
export const schemaBudgetRichiesta = z
  .object({
    meseInizio: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    situazione: z.enum(["principale", "accessoria"]),
    ricavi: z.array(testo(B.importo)).length(12),
    iscrizioneRegistro: z.boolean(),
    costiAvvio: z
      .array(z.object({ ...campiRiga, mese: z.number().int().min(0).max(11) }).strict())
      .max(B.righe),
    costiFissi: z.array(z.object(campiRiga).strict()).max(B.righe),
    costiVariabiliPercento: testo(B.importo),
    prelieviMensili: testo(B.importo),
    riservaImpostePercento: testo(B.importo),
  })
  .strict() satisfies z.ZodType<DatiBudget>;

/** Il business plan come lo manda lo strumento: ogni risposta al massimo il doppio dei caratteri consigliati. */
export const schemaPianoRichiesta = z
  .object({
    nomeAttivita: testo(LUNGHEZZA_NOME_PIANO),
    titolare: testo(LUNGHEZZA_NOME_PIANO),
    campi: z
      .object(
        Object.fromEntries(CAMPI_PIANO.map((c) => [c.id, testo(c.consigliati * MASSIMO_ASSOLUTO)])) as Record<
          CampoPiano,
          z.ZodString
        >,
      )
      .strict(),
  })
  .strict() satisfies z.ZodType<DatiPiano>;

const SCHEMI_RICHIESTA: { [S in StrumentoSalvato]: z.ZodType<DatiStrumento[S]> } = {
  budget: schemaBudgetRichiesta,
  "business-plan": schemaPianoRichiesta,
};

export type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string };

/** Il corpo di PUT e POST /api/strumenti/salvati/[strumento]: i dati interi dello strumento. */
export function leggiDatiStrumento<S extends StrumentoSalvato>(strumento: S, corpo: unknown): Esito<DatiStrumento[S]> {
  const letto = SCHEMI_RICHIESTA[strumento].safeParse(corpo);
  return letto.success ? { ok: true, dati: letto.data } : { ok: false, messaggio: MESSAGGI_SALVATI.datiNonValidi };
}

/* ------------------------------------------------------------------ */
/* Righe del database                                                  */
/* ------------------------------------------------------------------ */

export const COLONNE_STRUMENTO = "contenuto, aggiornato_il";

export type RigaStrumento = { contenuto: unknown; aggiornato_il: string };

export function rigaStrumento<S extends StrumentoSalvato>(userId: string, strumento: S, dati: DatiStrumento[S], adesso: string) {
  return { user_id: userId, strumento, contenuto: dati, aggiornato_il: adesso };
}

/**
 * I dati salvati, letti come li legge lo strumento (i campi rovinati tornano
 * ai valori iniziali). Null se il contenuto non è un oggetto: per esempio se
 * qualcuno ha scritto nella tabella senza passare dalle API.
 */
export function datiDaContenuto<S extends StrumentoSalvato>(strumento: S, contenuto: unknown): DatiStrumento[S] | null {
  if (typeof contenuto !== "object" || contenuto === null || Array.isArray(contenuto)) return null;
  const letto = SCHEMI_STRUMENTI[strumento].safeParse(contenuto);
  return letto.success ? letto.data : null;
}

/** GET /api/strumenti/salvati/[strumento]: i dati nell'account, o null se non ci sono ancora. */
export type RispostaStrumento<T> = { dati: T | null; aggiornatoIl: string | null };

/** PUT /api/strumenti/salvati/[strumento]. */
export type RispostaSalvataggio = { aggiornatoIl: string };

/**
 * POST /api/strumenti/salvati/[strumento] (copia dal browser o dal telefono):
 * `importato` è false se l'account aveva già i suoi dati, che non si toccano;
 * `dati` è quello che ora c'è nell'account.
 */
export type RispostaImportazioneStrumento<T> = { importato: boolean; dati: T | null; aggiornatoIl: string | null };

/* ------------------------------------------------------------------ */
/* Copia dal browser o dal telefono                                    */
/* ------------------------------------------------------------------ */

const scritto = (t: string) => t.trim() !== "";

/** true se nel budget c'è almeno un numero o una scelta (le voci con il solo nome non contano). */
export function budgetCompilato(d: DatiBudget): boolean {
  return (
    d.iscrizioneRegistro ||
    d.ricavi.some(scritto) ||
    d.costiAvvio.some((r) => scritto(r.importo)) ||
    d.costiFissi.some((r) => scritto(r.importo)) ||
    [d.costiVariabiliPercento, d.prelieviMensili, d.riservaImpostePercento].some(scritto)
  );
}

/** true se nel business plan c'è scritto qualcosa. */
export function pianoCompilato(d: DatiPiano): boolean {
  return scritto(d.nomeAttivita) || scritto(d.titolare) || CAMPI_PIANO.some((c) => scritto(d.campi[c.id]));
}

export function strumentoCompilato<S extends StrumentoSalvato>(strumento: S, dati: DatiStrumento[S]): boolean {
  return strumento === "budget" ? budgetCompilato(dati as DatiBudget) : pianoCompilato(dati as DatiPiano);
}

/** Stessi dati (letti con lo stesso schema, quindi con le chiavi nello stesso ordine). */
export function stessiDati(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Cosa proporre a chi ha fatto l'accesso e ha ancora dei dati nel browser o
 * sul telefono, salvati prima:
 * - «copia»: l'account non ha ancora questo strumento, si copiano lì;
 * - «scegli»: l'account ha dati diversi, si sceglie quali tenere;
 * - null: niente da proporre (niente di compilato, o gli stessi dati).
 */
export function propostaCopia<S extends StrumentoSalvato>(
  strumento: S,
  locali: DatiStrumento[S] | null,
  account: { dati: DatiStrumento[S] | null; nellAccount: boolean },
): "copia" | "scegli" | null {
  if (!locali || !strumentoCompilato(strumento, locali)) return null;
  if (account.nellAccount && account.dati && stessiDati(locali, account.dati)) return null;
  return account.nellAccount ? "scegli" : "copia";
}

/**
 * Due parole per riconoscere i dati quando si sceglie quali tenere:
 * «nov 2026 – ott 2027, ricavi CHF 48'000», «Siti Rossi, 7 di 11 domande».
 */
export function riassuntoStrumento<S extends StrumentoSalvato>(strumento: S, dati: DatiStrumento[S]): string {
  if (strumento === "budget") {
    const r = calcolaBudget(dati as DatiBudget).risultato;
    return `${r.mesi[0].etichetta} – ${r.mesi[11].etichetta}, ricavi ${importo(r.totali.ricavi, 0)}`;
  }
  const piano = dati as DatiPiano;
  const nome = piano.nomeAttivita.trim();
  const risposte = `${campiCompilati(piano)} di ${CAMPI_PIANO.length} domande`;
  return nome ? `«${nome}», ${risposte}` : risposte;
}
