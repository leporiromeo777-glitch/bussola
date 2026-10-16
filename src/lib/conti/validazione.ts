/**
 * «I tuoi conti»: controllo dei corpi delle richieste alle API (zod).
 * Logica pura: la usano le route in src/app/api/conti e, se serve, l'app.
 * I messaggi d'errore sono in italiano semplice, pronti da mostrare.
 */
import { z } from "zod";
import { categoriaPerTipo, dataIsoValida, eCategoria, haDueDecimali, tipoCategoria } from "./importi";
import { IMPORTO_MASSIMO, LUNGHEZZE } from "./limiti";
import type { CategoriaId, TipoMovimento } from "./tipi";

export const MESSAGGI_CONTI = {
  richiestaNonValida: "La richiesta non è valida. Ricarica la pagina e riprova.",
  nonCollegato: "Accedi per vedere i tuoi conti.",
  nonAttivo: "«I tuoi conti» non è ancora attivo.",
  erroreDatabase: "Non riesco a salvare in questo momento. Riprova tra poco.",
  nonTrovato: "Questa voce non c'è più. Ricarica la pagina.",
  data: "Scrivi una data valida.",
  importo: "Scrivi l'importo in franchi, con al massimo due decimali (per esempio 48.50).",
  descrizione: "Scrivi una breve descrizione (per esempio «Carta per la stampante»).",
  categoria: "Scegli una categoria che va bene per un'entrata o un'uscita.",
  numero: "Scrivi il numero della fattura.",
  cliente: "Scrivi il nome del cliente.",
  scadenza: "La scadenza non può essere prima della data della fattura.",
  modificaVuota: "Non c'è niente da cambiare.",
  movimentoFattura: "Questa entrata viene da una fattura: cambia la fattura in «Fatture emesse».",
  troppeLetture: "Oggi Bleo ha già letto molte ricevute per te. Riprova domani, oppure scrivi la voce a mano.",
  troppeRichieste: "Hai mandato diverse ricevute in poco tempo. Riprova tra un'ora.",
  occupato: "In questo momento Bleo non riesce a leggere la ricevuta. Riprova tra qualche minuto.",
  nonRicevuta:
    "Questo file non sembra una ricevuta o una fattura. Se lo è, prova con una foto più nitida, con tutto il foglio, oppure scrivi la voce a mano.",
  documentoNonDisponibile: "Non riesco ad aprire il documento in questo momento. Riprova tra poco.",
  casellaNonAttiva: "La ricezione delle fatture via email non è ancora attiva.",
} as const;

type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string };

const testo = (massimo: number) => z.string().trim().max(massimo);

const data = z.string().refine(dataIsoValida, { message: MESSAGGI_CONTI.data });

const importo = z
  .number({ message: MESSAGGI_CONTI.importo })
  .min(0, { message: MESSAGGI_CONTI.importo })
  .max(IMPORTO_MASSIMO, { message: MESSAGGI_CONTI.importo })
  .refine(haDueDecimali, { message: MESSAGGI_CONTI.importo });

const tipo = z.enum(["entrata", "uscita"], { message: MESSAGGI_CONTI.richiestaNonValida });

const categoria = z.string().refine(eCategoria, { message: MESSAGGI_CONTI.categoria });

/** Controparte facoltativa: stringa vuota o assente → null. */
const controparte = testo(LUNGHEZZE.controparte)
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

function primoMessaggio(errore: z.ZodError): string {
  const problema = errore.issues[0];
  return problema && problema.code === "custom" ? problema.message : (problema?.message ?? MESSAGGI_CONTI.richiestaNonValida);
}

function esito<T>(risultato: { success: true; data: T } | { success: false; error: z.ZodError }): Esito<T> {
  return risultato.success ? { ok: true, dati: risultato.data } : { ok: false, messaggio: primoMessaggio(risultato.error) };
}

/* ------------------------------------------------------------------ */
/* Movimenti                                                           */
/* ------------------------------------------------------------------ */

export const schemaNuovoMovimento = z
  .object({
    tipo,
    data,
    importo,
    descrizione: testo(LUNGHEZZE.descrizione).min(1, { message: MESSAGGI_CONTI.descrizione }),
    controparte,
    categoria,
  })
  .strict()
  // Se la categoria non esiste lo dice già il suo campo: qui solo la coerenza con il tipo.
  .refine((m) => !eCategoria(m.categoria) || tipoCategoria(m.categoria) === m.tipo, {
    message: MESSAGGI_CONTI.categoria,
    path: ["categoria"],
  });

export type NuovoMovimento = {
  tipo: TipoMovimento;
  data: string;
  importo: number;
  descrizione: string;
  controparte: string | null;
  categoria: CategoriaId;
};

/** POST /api/conti/movimenti */
export function leggiNuovoMovimento(corpo: unknown): Esito<NuovoMovimento> {
  return esito(schemaNuovoMovimento.safeParse(corpo)) as Esito<NuovoMovimento>;
}

export const schemaModificaMovimento = z
  .object({
    stato: z.enum(["confermato", "privato"], { message: MESSAGGI_CONTI.richiestaNonValida }),
    tipo,
    data,
    importo,
    descrizione: testo(LUNGHEZZE.descrizione),
    controparte,
    categoria,
  })
  .partial()
  .strict();

export type ModificaMovimento = Partial<{
  stato: "confermato" | "privato";
  tipo: TipoMovimento;
  data: string;
  importo: number;
  descrizione: string;
  controparte: string | null;
  categoria: CategoriaId;
}>;

/** PATCH /api/conti/movimenti/[id]: almeno un campo. */
export function leggiModificaMovimento(corpo: unknown): Esito<ModificaMovimento> {
  const letto = esito(schemaModificaMovimento.safeParse(corpo)) as Esito<ModificaMovimento>;
  if (letto.ok && Object.keys(letto.dati).length === 0) return { ok: false, messaggio: MESSAGGI_CONTI.modificaVuota };
  return letto;
}

/**
 * Applica una modifica a un movimento e tiene la categoria coerente con il
 * tipo: se cambia il tipo e la categoria non va più bene, prende quella di
 * ripiego («Altre entrate» o «Altre uscite»). Se la categoria scelta non va
 * bene per il tipo, errore.
 */
export function unisciModifica(
  attuale: { tipo: TipoMovimento; categoria: CategoriaId },
  modifica: ModificaMovimento,
): Esito<{ tipo: TipoMovimento; categoria: CategoriaId }> {
  const tipoNuovo = modifica.tipo ?? attuale.tipo;
  if (modifica.categoria) {
    if (tipoCategoria(modifica.categoria) !== tipoNuovo) return { ok: false, messaggio: MESSAGGI_CONTI.categoria };
    return { ok: true, dati: { tipo: tipoNuovo, categoria: modifica.categoria } };
  }
  return { ok: true, dati: { tipo: tipoNuovo, categoria: categoriaPerTipo(attuale.categoria, tipoNuovo) } };
}

/* ------------------------------------------------------------------ */
/* Fatture                                                             */
/* ------------------------------------------------------------------ */

export const schemaNuovaFattura = z
  .object({
    numero: testo(LUNGHEZZE.numeroFattura).min(1, { message: MESSAGGI_CONTI.numero }),
    cliente: testo(LUNGHEZZE.cliente).min(1, { message: MESSAGGI_CONTI.cliente }),
    data,
    scadenza: data.nullable().optional().transform((v) => v ?? null),
    importo,
    riferimento: testo(LUNGHEZZE.riferimento)
      .nullable()
      .optional()
      .transform((v) => (v ? v.replace(/\s+/g, " ") : null)),
  })
  .strict()
  .refine((f) => !f.scadenza || f.scadenza >= f.data, { message: MESSAGGI_CONTI.scadenza, path: ["scadenza"] });

export type NuovaFattura = {
  numero: string;
  cliente: string;
  data: string;
  scadenza: string | null;
  importo: number;
  riferimento: string | null;
};

/** POST /api/conti/fatture */
export function leggiNuovaFattura(corpo: unknown): Esito<NuovaFattura> {
  return esito(schemaNuovaFattura.safeParse(corpo)) as Esito<NuovaFattura>;
}

export const schemaPagamentoFattura = z.object({ pagataIl: data.nullable() }).strict();

/** PATCH /api/conti/fatture/[id] */
export function leggiPagamentoFattura(corpo: unknown): Esito<{ pagataIl: string | null }> {
  return esito(schemaPagamentoFattura.safeParse(corpo));
}

/* ------------------------------------------------------------------ */
/* Ricevute                                                            */
/* ------------------------------------------------------------------ */

/** Nome del file facoltativo nella richiesta POST /api/conti/ricevute: pulito e accorciato. */
export function nomeFilePulito(valore: unknown): string | null {
  if (typeof valore !== "string") return null;
  const pulito = valore
    .replace(/[\u0000-\u001f\u007f/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LUNGHEZZE.nomeFile);
  return pulito || null;
}

/** Id di una riga (uuid): così un id strano non arriva al database. */
export function idValido(valore: unknown): valore is string {
  return typeof valore === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valore);
}
