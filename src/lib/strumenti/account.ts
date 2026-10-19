/**
 * «Preventivo e fattura» nell'account: i documenti degli strumenti preventivo
 * e fattura e i dati di chi li emette, salvati nel database invece che nel
 * browser quando c'è l'accesso. Così gli stessi documenti si vedono sul sito
 * e nell'app.
 *
 * Qui la parte pura: controllo di quello che arriva alle API (zod, con le
 * stesse lunghezze dello strumento), righe del database (tabelle
 * preventivi_fatture ed emittenti, migrazione
 * 20261020000001_preventivi_fatture.sql) e cosa importare dal browser.
 * La usano le route in src/app/api/strumenti, il sito e l'app.
 */
import { z } from "zod";
import {
  controllaDocumento,
  dataIsoValida,
  emittenteVuoto,
  LUNGHEZZE_DOCUMENTO,
  LUNGHEZZE_EMITTENTE,
  schemaDocumento,
  schemaEmittente,
  type Documento,
  type Emittente,
} from "./documenti";
import { numeroSvizzero } from "./numeri";

/** Preventivi e fatture al massimo per utente (trigger nel database, lo verifica supabase/schema.test.ts). */
export const DOCUMENTI_ACCOUNT_MASSIMI = 2000;

/** Documenti al massimo in una richiesta di importazione dal browser. */
export const IMPORTAZIONE_MASSIMA = 25;

/** Caratteri al massimo del corpo di una richiesta con un documento. */
export const CORPO_DOCUMENTO_MASSIMO = 250_000;

/** Caratteri al massimo del corpo di una richiesta di importazione. */
export const CORPO_IMPORTAZIONE_MASSIMO = 2_000_000;

/**
 * Stato di un documento salvato: «pronto» quando lo strumento non segnala
 * più niente da completare (controllaDocumento), altrimenti «bozza».
 */
export const STATI_DOCUMENTO = ["bozza", "pronto"] as const;
export type StatoDocumento = (typeof STATI_DOCUMENTO)[number];

/** Forma dell'id di un documento nell'account (uuid o id dello strumento). */
export const ID_DOCUMENTO = /^[A-Za-z0-9-]{8,60}$/;

export function idDocumentoValido(id: unknown): id is string {
  return typeof id === "string" && ID_DOCUMENTO.test(id);
}

export const PERCORSI_DOCUMENTI = {
  elenco: "/api/strumenti/documenti",
  documento: (id: string) => `/api/strumenti/documenti/${encodeURIComponent(id)}`,
  emittente: "/api/strumenti/emittente",
} as const;

export const MESSAGGI_DOCUMENTI = {
  nonAttivo: "Il salvataggio di preventivi e fatture nell'account non è ancora attivo.",
  nonCollegato: "Accedi di nuovo per salvare preventivi e fatture nel tuo account.",
  richiestaNonValida: "La richiesta non è valida. Ricarica la pagina e riprova.",
  documentoNonValido: "Questo documento non si può salvare così: ricarica la pagina e riprova.",
  emittenteNonValido: "I tuoi dati non si possono salvare così: controlla i campi e riprova.",
  troppoLungo: "Il documento è troppo lungo per salvarlo: togli qualche voce o accorcia le descrizioni.",
  troppi: `Hai già ${numeroSvizzero(DOCUMENTI_ACCOUNT_MASSIMI, 0)} preventivi e fatture, il massimo che Bleo può tenere. Elimina quelli vecchi che non ti servono più.`,
  erroreDatabase: "Non riesco a salvare in questo momento. Riprova tra poco.",
  nonTrovato: "Questo documento non c'è più. Ricarica la pagina.",
} as const;

/* ------------------------------------------------------------------ */
/* Controllo di quello che arriva alle API                             */
/* ------------------------------------------------------------------ */

const E = LUNGHEZZE_EMITTENTE;
const D = LUNGHEZZE_DOCUMENTO;
const testo = (massimo: number) => z.string().max(massimo);

const campiIndirizzo = {
  nome: testo(E.nome),
  via: testo(E.via),
  numero: testo(E.numero),
  npa: testo(E.npa),
  localita: testo(E.localita),
  paese: testo(E.paese),
};

/** I dati dell'emittente come li manda lo strumento: tutti i campi, niente di più. */
export const schemaEmittenteRichiesta = z
  .object({
    ...campiIndirizzo,
    email: testo(E.email),
    telefono: testo(E.telefono),
    iban: testo(E.iban),
    ivaIscritto: z.boolean(),
    numeroIva: testo(E.numeroIva),
  })
  .strict() satisfies z.ZodType<Emittente>;

const schemaRigaRichiesta = z
  .object({
    id: z.string().min(1).max(D.id),
    descrizione: testo(D.descrizione),
    quantita: testo(D.quantita),
    unita: testo(D.unita),
    prezzo: testo(D.prezzo),
    aliquota: z.enum(["normale", "ridotta", "alloggio"]),
  })
  .strict();

/**
 * Un documento intero come lo manda lo strumento (sito o app). Stessi campi e
 * stesse lunghezze dello schema del browser, ma senza correzioni: quello che
 * non va bene si rifiuta.
 */
export const schemaDocumentoRichiesta = z
  .object({
    id: z.string().regex(ID_DOCUMENTO),
    tipo: z.enum(["preventivo", "fattura"]),
    numero: testo(D.numero),
    data: testo(D.data),
    scadenza: testo(D.data),
    periodoPrestazione: testo(D.periodoPrestazione),
    oggetto: testo(D.oggetto),
    emittente: schemaEmittenteRichiesta,
    cliente: z.object(campiIndirizzo).strict(),
    righe: z.array(schemaRigaRichiesta).max(D.righe),
    valuta: z.enum(["CHF", "EUR"]),
    arrotonda5: z.boolean(),
    riferimento: z.enum(["automatico", "nessuno", "manuale"]),
    riferimentoManuale: testo(D.riferimentoManuale),
    note: testo(D.note),
    daPreventivo: testo(D.daPreventivo),
    creatoIl: testo(D.momento),
    aggiornatoIl: testo(D.momento),
  })
  .strict() satisfies z.ZodType<Documento>;

export type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string };

/** Il documento di PUT /api/strumenti/documenti/[id]: deve avere lo stesso id dell'indirizzo. */
export function leggiDocumento(corpo: unknown, id: string): Esito<Documento> {
  if (!idDocumentoValido(id)) return { ok: false, messaggio: MESSAGGI_DOCUMENTI.nonTrovato };
  const letto = schemaDocumentoRichiesta.safeParse(corpo);
  if (!letto.success || letto.data.id !== id) return { ok: false, messaggio: MESSAGGI_DOCUMENTI.documentoNonValido };
  return { ok: true, dati: letto.data };
}

export function leggiEmittente(corpo: unknown): Esito<Emittente> {
  const letto = schemaEmittenteRichiesta.safeParse(corpo);
  return letto.success ? { ok: true, dati: letto.data } : { ok: false, messaggio: MESSAGGI_DOCUMENTI.emittenteNonValido };
}

export type Importazione = {
  /** I documenti validi, senza id ripetuti. */
  documenti: Documento[];
  /** Quanti documenti non erano validi (restano nel browser). */
  scartati: number;
  emittente: Emittente | null;
};

const schemaCorpoImportazione = z
  .object({
    documenti: z.array(z.unknown()).max(IMPORTAZIONE_MASSIMA),
    emittente: z.unknown().optional(),
  })
  .strict();

/**
 * POST /api/strumenti/documenti — { documenti: Documento[], emittente?: Emittente }.
 * I documenti non validi si contano e si saltano: gli altri si importano lo stesso.
 */
export function leggiImportazione(corpo: unknown): Esito<Importazione> {
  const letto = schemaCorpoImportazione.safeParse(corpo);
  if (!letto.success) return { ok: false, messaggio: MESSAGGI_DOCUMENTI.richiestaNonValida };
  const visti = new Set<string>();
  const documenti: Documento[] = [];
  let scartati = 0;
  for (const voce of letto.data.documenti) {
    const doc = schemaDocumentoRichiesta.safeParse(voce);
    if (!doc.success || visti.has(doc.data.id)) {
      scartati++;
      continue;
    }
    visti.add(doc.data.id);
    documenti.push(doc.data);
  }
  let emittente: Emittente | null = null;
  if (letto.data.emittente !== undefined && letto.data.emittente !== null) {
    const e = leggiEmittente(letto.data.emittente);
    if (!e.ok) return e;
    emittente = e.dati;
  }
  return { ok: true, dati: { documenti, scartati, emittente } };
}

/* ------------------------------------------------------------------ */
/* Righe del database                                                  */
/* ------------------------------------------------------------------ */

export function statoDocumento(doc: Documento): StatoDocumento {
  return controllaDocumento(doc).length === 0 ? "pronto" : "bozza";
}

/** La data del documento per la colonna «data» (null se non è ancora una data valida). */
export function dataColonna(iso: string): string | null {
  return dataIsoValida(iso) && iso >= "2000-01-01" && iso <= "2100-12-31" ? iso : null;
}

export const COLONNE_DOCUMENTO_ACCOUNT = "id, contenuto";

export type RigaDocumentoAccount = { id: string; contenuto: unknown };

/** La riga di preventivi_fatture per un documento: numero, data e stato vengono dal contenuto. */
export function rigaDocumento(userId: string, doc: Documento, adesso: string) {
  return {
    user_id: userId,
    id: doc.id,
    tipo: doc.tipo,
    numero: doc.numero,
    data: dataColonna(doc.data),
    stato: statoDocumento(doc),
    contenuto: doc,
    aggiornato_il: adesso,
  };
}

/**
 * Il documento salvato in una riga, letto come lo legge lo strumento (i campi
 * rovinati tornano ai valori iniziali). Null se il contenuto non è un
 * documento o non ha lo stesso id della riga: per esempio se qualcuno ha
 * scritto nella tabella senza passare dalle API.
 */
export function documentoDaRiga(riga: RigaDocumentoAccount): Documento | null {
  const letto = schemaDocumento.safeParse(riga.contenuto);
  if (!letto.success || letto.data.id !== riga.id) return null;
  return letto.data;
}

export const COLONNE_EMITTENTE = "nome, via, numero, npa, localita, paese, email, telefono, iban, iva_iscritto, numero_iva";

export type RigaEmittente = {
  nome: string;
  via: string;
  numero: string;
  npa: string;
  localita: string;
  paese: string;
  email: string;
  telefono: string;
  iban: string;
  iva_iscritto: boolean;
  numero_iva: string;
};

export function rigaEmittente(userId: string, e: Emittente, adesso: string) {
  return {
    user_id: userId,
    nome: e.nome,
    via: e.via,
    numero: e.numero,
    npa: e.npa,
    localita: e.localita,
    paese: e.paese,
    email: e.email,
    telefono: e.telefono,
    iban: e.iban,
    iva_iscritto: e.ivaIscritto,
    numero_iva: e.numeroIva,
    aggiornato_il: adesso,
  };
}

export function emittenteDaRiga(r: RigaEmittente): Emittente {
  return schemaEmittente.catch(emittenteVuoto()).parse({
    nome: r.nome,
    via: r.via,
    numero: r.numero,
    npa: r.npa,
    localita: r.localita,
    paese: r.paese,
    email: r.email,
    telefono: r.telefono,
    iban: r.iban,
    ivaIscritto: r.iva_iscritto,
    numeroIva: r.numero_iva,
  });
}

/** GET /api/strumenti/documenti: tutti i documenti (dal più recente) e i dati dell'emittente (null se mai salvati). */
export type RispostaDocumenti = { documenti: Documento[]; emittente: Emittente | null };

/** POST /api/strumenti/documenti: id dei documenti aggiunti, già presenti (non toccati) e non validi. */
export type RispostaImportazione = {
  importati: string[];
  giaPresenti: string[];
  scartati: number;
  /** true se i dati dell'emittente sono stati salvati ora (l'account non li aveva). */
  emittente: boolean;
};

/* ------------------------------------------------------------------ */
/* Importazione dal browser                                            */
/* ------------------------------------------------------------------ */

/** true se nei dati dell'emittente c'è scritto qualcosa (oltre al paese predefinito). */
export function emittenteCompilato(e: Emittente | null | undefined): e is Emittente {
  if (!e) return false;
  return Boolean(
    e.nome.trim() ||
      e.via.trim() ||
      e.numero.trim() ||
      e.npa.trim() ||
      e.localita.trim() ||
      e.email.trim() ||
      e.telefono.trim() ||
      e.iban.trim() ||
      e.numeroIva.trim() ||
      e.ivaIscritto,
  );
}

/**
 * I documenti del browser che non sono ancora nell'account (stesso id = stesso
 * documento: non si importa due volte). Un documento con un id che l'account
 * non accetta riceve un id nuovo.
 */
export function documentiDaImportare(
  locali: readonly Documento[],
  account: readonly Pick<Documento, "id">[],
  nuovoId: () => string,
): Documento[] {
  const presenti = new Set(account.map((d) => d.id));
  return locali.filter((d) => !presenti.has(d.id)).map((d) => (idDocumentoValido(d.id) ? d : { ...d, id: nuovoId() }));
}

/** Divide i documenti in gruppi da mandare uno dopo l'altro (per numero e per peso). */
export function lottiImportazione(
  documenti: readonly Documento[],
  massimo = IMPORTAZIONE_MASSIMA,
  caratteri = CORPO_IMPORTAZIONE_MASSIMO / 2,
): Documento[][] {
  const lotti: Documento[][] = [];
  let lotto: Documento[] = [];
  let peso = 0;
  for (const d of documenti) {
    const pesoDoc = JSON.stringify(d).length;
    if (lotto.length > 0 && (lotto.length >= massimo || peso + pesoDoc > caratteri)) {
      lotti.push(lotto);
      lotto = [];
      peso = 0;
    }
    lotto.push(d);
    peso += pesoDoc;
  }
  if (lotto.length > 0) lotti.push(lotto);
  return lotti;
}
