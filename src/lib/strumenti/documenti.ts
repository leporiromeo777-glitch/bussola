/**
 * Preventivi e fatture: un solo modello di documento, totali in centesimi
 * interi, IVA solo per chi è iscritto, sezione pagamento con QR-fattura.
 *
 * - Chi è iscritto all'IVA: numero IVA obbligatorio, aliquota per riga, IVA
 *   per aliquota e gli elementi dell'art. 26 LIVA.
 * - Chi non è iscritto non può indicare l'IVA in fattura (art. 27 LIVA): i
 *   campi IVA spariscono e le aliquote delle righe vengono ignorate.
 */
import { z } from "zod";
import { aliquoteIva } from "@/data/svizzera";
import { arrotonda5Centesimi, daCentesimi, inCentesimi, leggiNumero } from "./numeri";
import {
  creaRiferimentoQr,
  creaRiferimentoScor,
  indirizzoCompleto,
  pulisciTestoQr,
  validaIbanPerQr,
  validaPagamentoQr,
  type DatiPagamentoQr,
  type ErroreQr,
  type IndirizzoStrutturato,
  type TipoRiferimento,
  type Valuta,
} from "./qr";

export type TipoDocumento = "preventivo" | "fattura";
export type AliquotaIva = keyof typeof aliquoteIva.valore;

export const ALIQUOTE: { id: AliquotaIva; etichetta: string }[] = [
  { id: "normale", etichetta: "Aliquota normale" },
  { id: "ridotta", etichetta: "Aliquota ridotta" },
  { id: "alloggio", etichetta: "Aliquota speciale per l'alloggio" },
];

export type Emittente = IndirizzoStrutturato & {
  email: string;
  telefono: string;
  iban: string;
  ivaIscritto: boolean;
  /** CHE-123.456.789 IVA */
  numeroIva: string;
};

export type Riga = {
  id: string;
  descrizione: string;
  quantita: string;
  unita: string;
  prezzo: string;
  aliquota: AliquotaIva;
};

export type SceltaRiferimento = "automatico" | "nessuno" | "manuale";

export type Documento = {
  id: string;
  tipo: TipoDocumento;
  numero: string;
  /** Data del documento, ISO AAAA-MM-GG. */
  data: string;
  /** Fattura: pagabile entro. Preventivo: valido fino al. ISO. */
  scadenza: string;
  /** Data o periodo della prestazione, se diverso dalla data della fattura (testo libero). */
  periodoPrestazione: string;
  oggetto: string;
  emittente: Emittente;
  cliente: IndirizzoStrutturato;
  righe: Riga[];
  valuta: Valuta;
  arrotonda5: boolean;
  riferimento: SceltaRiferimento;
  riferimentoManuale: string;
  note: string;
  /** Numero del preventivo da cui nasce la fattura. */
  daPreventivo: string;
  creatoIl: string;
  aggiornatoIl: string;
};

/**
 * Nomi del tipo di documento con articoli e accordi già pronti: «preventivo»
 * è maschile, «fattura» femminile. Usarli sempre, invece di comporre «del »
 * + nome, evita errori come «Dati del fattura».
 */
export type NomiTipo = {
  singolare: string;
  /** Il nome in minuscolo, dentro una frase. */
  minuscolo: string;
  plurale: string;
  /** «un preventivo», «una fattura». */
  conUn: string;
  /** «del preventivo», «della fattura». */
  conDel: string;
  /** Pulsante per crearne uno: «Nuovo preventivo», «Nuova fattura». */
  nuovo: string;
  /** Titolo dell'elenco: «I tuoi preventivi», «Le tue fatture». */
  elenco: string;
  /** Participi accordati: «creato», «Aperto», «eliminato» (o «-a» al femminile). */
  creato: string;
  aperto: string;
  eliminato: string;
  prefisso: string;
  scadenza: string;
};

export const NOMI_TIPO: Record<TipoDocumento, NomiTipo> = {
  preventivo: {
    singolare: "Preventivo",
    minuscolo: "preventivo",
    plurale: "preventivi",
    conUn: "un preventivo",
    conDel: "del preventivo",
    nuovo: "Nuovo preventivo",
    elenco: "I tuoi preventivi",
    creato: "creato",
    aperto: "Aperto",
    eliminato: "eliminato",
    prefisso: "P",
    scadenza: "Valido fino al",
  },
  fattura: {
    singolare: "Fattura",
    minuscolo: "fattura",
    plurale: "fatture",
    conUn: "una fattura",
    conDel: "della fattura",
    nuovo: "Nuova fattura",
    elenco: "Le tue fatture",
    creato: "creata",
    aperto: "Aperta",
    eliminato: "eliminata",
    prefisso: "F",
    scadenza: "Da pagare entro il",
  },
};

/** Giorni predefiniti per la scadenza o la validità: si possono cambiare. */
export const GIORNI_PREDEFINITI = 30;

// --- Date.

/** Data locale in formato ISO AAAA-MM-GG. */
export function dataIsoLocale(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dataIsoValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

export function aggiungiGiorni(iso: string, giorni: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + giorni);
  return d.toISOString().slice(0, 10);
}

// --- Indirizzi vuoti e documenti nuovi.

export function indirizzoVuoto(): IndirizzoStrutturato {
  return { nome: "", via: "", numero: "", npa: "", localita: "", paese: "CH" };
}

export function emittenteVuoto(): Emittente {
  return { ...indirizzoVuoto(), email: "", telefono: "", iban: "", ivaIscritto: false, numeroIva: "" };
}

export function rigaVuota(id: string): Riga {
  return { id, descrizione: "", quantita: "1", unita: "", prezzo: "", aliquota: "normale" };
}

/** Prossimo numero libero per tipo e anno: F-2026-001, F-2026-002 … */
export function prossimoNumero(tipo: TipoDocumento, documenti: readonly Documento[], anno: number): string {
  const prefisso = `${NOMI_TIPO[tipo].prefisso}-${anno}-`;
  let massimo = 0;
  for (const d of documenti) {
    if (d.tipo !== tipo || !d.numero.startsWith(prefisso)) continue;
    const n = Number(d.numero.slice(prefisso.length));
    if (Number.isInteger(n) && n > massimo) massimo = n;
  }
  return `${prefisso}${String(massimo + 1).padStart(3, "0")}`;
}

export type Contesto = { id: string; oggiIso: string; adessoIso: string; idRiga: () => string };

export function nuovoDocumento(tipo: TipoDocumento, emittente: Emittente, documenti: readonly Documento[], c: Contesto): Documento {
  return {
    id: c.id,
    tipo,
    numero: prossimoNumero(tipo, documenti, Number(c.oggiIso.slice(0, 4))),
    data: c.oggiIso,
    scadenza: aggiungiGiorni(c.oggiIso, GIORNI_PREDEFINITI),
    periodoPrestazione: "",
    oggetto: "",
    emittente: { ...emittente },
    cliente: indirizzoVuoto(),
    righe: [rigaVuota(c.idRiga())],
    valuta: "CHF",
    arrotonda5: false,
    riferimento: "automatico",
    riferimentoManuale: "",
    note: "",
    daPreventivo: "",
    creatoIl: c.adessoIso,
    aggiornatoIl: c.adessoIso,
  };
}

/** Copia con nuovo numero e data di oggi (stesso tipo). */
export function duplicaDocumento(doc: Documento, documenti: readonly Documento[], c: Contesto): Documento {
  return {
    ...doc,
    id: c.id,
    numero: prossimoNumero(doc.tipo, documenti, Number(c.oggiIso.slice(0, 4))),
    data: c.oggiIso,
    scadenza: aggiungiGiorni(c.oggiIso, GIORNI_PREDEFINITI),
    righe: doc.righe.map((r) => ({ ...r, id: c.idRiga() })),
    riferimentoManuale: "",
    creatoIl: c.adessoIso,
    aggiornatoIl: c.adessoIso,
  };
}

/** Il preventivo diventa una fattura: stesse righe e cliente, nuovo numero, data di oggi. */
export function preventivoInFattura(preventivo: Documento, documenti: readonly Documento[], c: Contesto): Documento {
  return {
    ...duplicaDocumento(preventivo, documenti, c),
    tipo: "fattura",
    numero: prossimoNumero("fattura", documenti, Number(c.oggiIso.slice(0, 4))),
    daPreventivo: preventivo.numero,
    riferimento: "automatico",
  };
}

// --- IVA.

/** Normalizza il numero IVA nel formato CHE-123.456.789 IVA. Null se non riconosciuto. */
export function normalizzaNumeroIva(testo: string): string | null {
  const m = testo
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
    .match(/^CHE[\s.-]*(\d{3})[\s.]*(\d{3})[\s.]*(\d{3})(?:\s*(IVA|MWST|TVA|VAT))?$/);
  if (!m) return null;
  return `CHE-${m[1]}.${m[2]}.${m[3]} IVA`;
}

/** Tasso dell'aliquota (frazione) da svizzera.ts. */
export function tassoIva(aliquota: AliquotaIva): number {
  return aliquoteIva.valore[aliquota];
}

// --- Totali.

export type RigaCalcolata = { id: string; quantita: number; prezzo: number; importo: number; valida: boolean };
export type IvaPerAliquota = { aliquota: AliquotaIva; tasso: number; base: number; imposta: number };
export type Totali = {
  righe: RigaCalcolata[];
  imponibile: number;
  iva: IvaPerAliquota[];
  totaleIva: number;
  totaleLordo: number;
  arrotondamento: number;
  totale: number;
};

export function calcolaRiga(r: Riga): RigaCalcolata {
  const quantita = leggiNumero(r.quantita);
  const prezzo = leggiNumero(r.prezzo);
  const valida = quantita !== null && prezzo !== null && quantita >= 0;
  const importo = valida ? daCentesimi(Math.round(quantita * inCentesimi(prezzo))) : 0;
  return { id: r.id, quantita: quantita ?? 0, prezzo: prezzo ?? 0, importo, valida };
}

export function calcolaTotali(doc: Pick<Documento, "righe" | "emittente" | "arrotonda5" | "valuta">): Totali {
  const righe = doc.righe.map(calcolaRiga);
  const imponibileC = righe.reduce((s, r) => s + inCentesimi(r.importo), 0);

  const iva: IvaPerAliquota[] = [];
  if (doc.emittente.ivaIscritto) {
    for (const { id } of ALIQUOTE) {
      const baseC = doc.righe.reduce((s, r, i) => (r.aliquota === id ? s + inCentesimi(righe[i].importo) : s), 0);
      if (baseC === 0 && !doc.righe.some((r, i) => r.aliquota === id && righe[i].valida && r.descrizione.trim())) continue;
      // Tasso in millesimi interi (8,1% = 81): imposta arrotondata al centesimo.
      const millesimi = Math.round(tassoIva(id) * 1000);
      const impostaC = Math.round((baseC * millesimi) / 1000);
      iva.push({ aliquota: id, tasso: tassoIva(id), base: daCentesimi(baseC), imposta: daCentesimi(impostaC) });
    }
  }
  const totaleIvaC = iva.reduce((s, v) => s + inCentesimi(v.imposta), 0);
  const lordoC = imponibileC + totaleIvaC;
  const totale = doc.arrotonda5 && doc.valuta === "CHF" ? arrotonda5Centesimi(daCentesimi(lordoC)) : daCentesimi(lordoC);
  return {
    righe,
    imponibile: daCentesimi(imponibileC),
    iva,
    totaleIva: daCentesimi(totaleIvaC),
    totaleLordo: daCentesimi(lordoC),
    arrotondamento: daCentesimi(inCentesimi(totale) - lordoC),
    totale,
  };
}

// --- Controlli prima di stampare.

export type Problema = { campo: string; messaggio: string };

export function controllaDocumento(doc: Documento): Problema[] {
  const p: Problema[] = [];
  const e = doc.emittente;
  if (!e.nome.trim()) p.push({ campo: "emittente.nome", messaggio: "Scrivi il tuo nome e cognome (o il nome della ditta)." });
  if (!e.npa.trim() || !e.localita.trim()) p.push({ campo: "emittente.localita", messaggio: "Scrivi NPA e località del tuo indirizzo." });
  if (e.ivaIscritto && !normalizzaNumeroIva(e.numeroIva)) {
    p.push({ campo: "emittente.numeroIva", messaggio: "Scrivi il numero IVA nel formato CHE-123.456.789 IVA." });
  }
  if (e.ivaIscritto && doc.valuta !== "CHF") {
    p.push({ campo: "valuta", messaggio: "Con l'IVA questo strumento prepara documenti solo in CHF." });
  }
  if (!doc.numero.trim()) p.push({ campo: "numero", messaggio: "Dai un numero al documento." });
  if (!dataIsoValida(doc.data)) p.push({ campo: "data", messaggio: "Scegli la data del documento." });
  if (doc.scadenza && !dataIsoValida(doc.scadenza)) p.push({ campo: "scadenza", messaggio: "La data non è valida." });
  if (dataIsoValida(doc.data) && dataIsoValida(doc.scadenza) && doc.scadenza < doc.data) {
    p.push({ campo: "scadenza", messaggio: "La scadenza viene prima della data del documento." });
  }
  if (!doc.cliente.nome.trim()) p.push({ campo: "cliente.nome", messaggio: "Scrivi il nome del cliente." });

  const conContenuto = doc.righe.filter((r) => r.descrizione.trim() || r.prezzo.trim());
  if (conContenuto.length === 0) p.push({ campo: "righe", messaggio: "Aggiungi almeno una voce con descrizione e prezzo." });
  doc.righe.forEach((r) => {
    if (!r.descrizione.trim() && !r.prezzo.trim()) return;
    const c = calcolaRiga(r);
    if (!r.descrizione.trim()) p.push({ campo: `righe.${r.id}.descrizione`, messaggio: "Descrivi la prestazione." });
    if (leggiNumero(r.quantita) === null || c.quantita < 0) {
      p.push({ campo: `righe.${r.id}.quantita`, messaggio: "Quantità non valida." });
    }
    if (leggiNumero(r.prezzo) === null) p.push({ campo: `righe.${r.id}.prezzo`, messaggio: "Prezzo non valido." });
  });
  const totali = calcolaTotali(doc);
  if (totali.totale < 0) p.push({ campo: "righe", messaggio: "Il totale non può essere negativo." });

  // Fattura: senza una sezione pagamento valida il PDF esce senza conto né codice QR.
  if (doc.tipo === "fattura") {
    for (const errore of erroriPagamento(doc)) {
      // Nome, NPA e località sono già chiesti sopra con un messaggio più chiaro.
      if (errore.campo === "creditore.nome" && p.some((x) => x.campo === "emittente.nome")) continue;
      if (/^creditore\.(npa|localita)$/.test(errore.campo) && p.some((x) => x.campo === "emittente.localita")) continue;
      const messaggio = messaggioPagamento(errore);
      if (!p.some((x) => x.messaggio === messaggio)) p.push({ campo: `pagamento.${errore.campo}`, messaggio });
    }
  }
  return p;
}

/** Cosa impedisce la sezione pagamento della fattura (vuoto se si può creare). */
export function erroriPagamento(doc: Documento): ErroreQr[] {
  const pagamento = pagamentoDaDocumento(doc);
  if (!pagamento.ok) return pagamento.errori;
  const valido = validaPagamentoQr(pagamento.dati);
  return valido.ok ? [] : valido.errori;
}

const CAMPI_INDIRIZZO_EMITTENTE: Record<string, string> = {
  nome: "nome",
  via: "via",
  numero: "numero civico",
  npa: "NPA",
  localita: "località",
  paese: "paese",
};

/** I messaggi sull'indirizzo del creditore dicono di quale campo si tratta. */
function messaggioPagamento(errore: ErroreQr): string {
  const campo = /^creditore\.(\w+)$/.exec(errore.campo)?.[1];
  if (!campo) return errore.messaggio;
  return `Il tuo indirizzo nella QR-fattura (${CAMPI_INDIRIZZO_EMITTENTE[campo] ?? campo}): ${errore.messaggio}`;
}

/**
 * Elementi obbligatori di una fattura per chi è iscritto all'IVA (art. 26
 * cpv. 2 LIVA), con lo stato nel documento.
 */
export function elementiObbligatoriIva(doc: Documento): { id: string; testo: string; ok: boolean; nota?: string }[] {
  const e = doc.emittente;
  const totali = calcolaTotali(doc);
  const righeCompilate = doc.righe.filter((r) => r.descrizione.trim());
  return [
    {
      id: "fornitore",
      testo: "Nome e luogo del fornitore, indicazione dell'iscrizione nel registro dei contribuenti e numero IVA",
      ok: Boolean(e.nome.trim() && e.localita.trim() && normalizzaNumeroIva(e.numeroIva)),
    },
    { id: "destinatario", testo: "Nome e luogo del destinatario", ok: Boolean(doc.cliente.nome.trim() && doc.cliente.localita.trim()) },
    {
      id: "data",
      testo: "Data o periodo della prestazione, se diversi dalla data della fattura",
      ok: dataIsoValida(doc.data),
      nota: doc.periodoPrestazione.trim() ? undefined : "Se la prestazione è di un altro giorno o periodo, scrivilo nel campo apposito.",
    },
    { id: "prestazione", testo: "Genere, oggetto ed entità della prestazione", ok: righeCompilate.length > 0 },
    { id: "importo", testo: "Ammontare della controprestazione", ok: totali.imponibile > 0 },
    { id: "imposta", testo: "Aliquota e importo dell'imposta", ok: totali.iva.length > 0 },
  ];
}

// --- Sezione pagamento (solo fatture).

export type EsitoRiferimento = { ok: true; tipo: TipoRiferimento; valore: string } | { ok: false; errore: ErroreQr };

export function riferimentoPerFattura(doc: Documento): EsitoRiferimento {
  const iban = validaIbanPerQr(doc.emittente.iban);
  if (!iban.ok) return { ok: false, errore: { campo: "iban", messaggio: iban.errore } };
  const manuale = doc.riferimentoManuale.replace(/\s/g, "").toUpperCase();
  if (iban.qrIban) {
    if (doc.riferimento === "manuale") return { ok: true, tipo: "QRR", valore: manuale };
    const qrr = creaRiferimentoQr(doc.numero);
    if (!qrr) {
      return {
        ok: false,
        errore: {
          campo: "riferimento",
          messaggio: "Con un QR-IBAN serve un riferimento QR: il numero della fattura deve contenere da 1 a 26 cifre, oppure scrivi tu il riferimento.",
        },
      };
    }
    return { ok: true, tipo: "QRR", valore: qrr };
  }
  if (doc.riferimento === "nessuno") return { ok: true, tipo: "NON", valore: "" };
  if (doc.riferimento === "manuale") return { ok: true, tipo: "SCOR", valore: manuale };
  const scor = creaRiferimentoScor(doc.numero);
  if (!scor) {
    return {
      ok: false,
      errore: { campo: "riferimento", messaggio: "Dal numero della fattura non si può creare un riferimento RF: scegli «nessun riferimento» o scrivilo tu." },
    };
  }
  return { ok: true, tipo: "SCOR", valore: scor };
}

/** Dati per la sezione pagamento, o l'errore che lo impedisce. */
export function pagamentoDaDocumento(doc: Documento): { ok: true; dati: DatiPagamentoQr } | { ok: false; errori: ErroreQr[] } {
  const rif = riferimentoPerFattura(doc);
  if (!rif.ok) return { ok: false, errori: [rif.errore] };
  const totali = calcolaTotali(doc);
  return {
    ok: true,
    dati: {
      iban: doc.emittente.iban,
      riferimento: { tipo: rif.tipo, valore: rif.valore },
      importo: totali.totale,
      valuta: doc.valuta,
      creditore: doc.emittente,
      // Il debitore va nella sezione solo se l'indirizzo è completo; altrimenti resta il riquadro vuoto.
      ...(indirizzoCompleto(doc.cliente) ? { debitore: doc.cliente } : {}),
      messaggio: pulisciTestoQr(`${NOMI_TIPO.fattura.singolare} ${doc.numero}`).slice(0, 140),
    },
  };
}

/**
 * Dati di una fattura per «I tuoi conti» (POST /api/conti/fatture): solo
 * numero, nome del cliente, date, totale e riferimento QR. Niente IBAN né
 * voci: restano nel documento (nel browser o, con l'accesso, tra i
 * preventivi e le fatture dell'account).
 */
export function fatturaPerConti(doc: Documento) {
  const rif = riferimentoPerFattura(doc);
  return {
    numero: doc.numero.trim(),
    cliente: doc.cliente.nome.trim(),
    data: doc.data,
    scadenza: dataIsoValida(doc.scadenza) && doc.scadenza >= doc.data ? doc.scadenza : null,
    importo: calcolaTotali(doc).totale,
    riferimento: rif.ok && rif.valore ? rif.valore : null,
  };
}

// --- Archivio (schema per i dati salvati nel browser).

/**
 * Lunghezze massime dei campi dei dati dell'emittente, uguali nel browser,
 * nelle API e nella tabella emittenti del database (migrazione
 * 20261020000001_preventivi_fatture.sql, lo verifica supabase/schema.test.ts).
 */
export const LUNGHEZZE_EMITTENTE = {
  nome: 140,
  via: 140,
  numero: 32,
  npa: 32,
  localita: 70,
  paese: 2,
  email: 200,
  telefono: 60,
  iban: 60,
  numeroIva: 40,
} as const;

/** Lunghezze massime degli altri campi di un documento (e numero massimo di voci). */
export const LUNGHEZZE_DOCUMENTO = {
  id: 60,
  numero: 40,
  data: 10,
  periodoPrestazione: 120,
  oggetto: 200,
  descrizione: 500,
  quantita: 30,
  unita: 30,
  prezzo: 30,
  riferimentoManuale: 40,
  note: 1000,
  daPreventivo: 40,
  momento: 40,
  righe: 100,
} as const;

const E = LUNGHEZZE_EMITTENTE;
const D = LUNGHEZZE_DOCUMENTO;
const t = (max: number) => z.string().max(max).catch("");
const schemaIndirizzo = z.object({
  nome: t(E.nome),
  via: t(E.via),
  numero: t(E.numero),
  npa: t(E.npa),
  localita: t(E.localita),
  paese: t(E.paese).transform((p) => p || "CH"),
});
export const schemaEmittente = schemaIndirizzo.extend({
  email: t(E.email),
  telefono: t(E.telefono),
  iban: t(E.iban),
  ivaIscritto: z.boolean().catch(false),
  numeroIva: t(E.numeroIva),
}) satisfies z.ZodType<Emittente>;

const schemaRiga = z.object({
  id: z.string().min(1).max(D.id),
  descrizione: t(D.descrizione),
  quantita: t(D.quantita),
  unita: t(D.unita),
  prezzo: t(D.prezzo),
  aliquota: z.enum(["normale", "ridotta", "alloggio"]).catch("normale"),
});

export const schemaDocumento = z.object({
  id: z.string().min(1).max(D.id),
  tipo: z.enum(["preventivo", "fattura"]),
  numero: t(D.numero),
  data: t(D.data),
  scadenza: t(D.data),
  periodoPrestazione: t(D.periodoPrestazione),
  oggetto: t(D.oggetto),
  emittente: schemaEmittente.catch(emittenteVuoto()),
  cliente: schemaIndirizzo.catch(indirizzoVuoto()),
  righe: z.array(schemaRiga).max(D.righe).catch([]),
  valuta: z.enum(["CHF", "EUR"]).catch("CHF"),
  arrotonda5: z.boolean().catch(false),
  riferimento: z.enum(["automatico", "nessuno", "manuale"]).catch("automatico"),
  riferimentoManuale: t(D.riferimentoManuale),
  note: t(D.note),
  daPreventivo: t(D.daPreventivo),
  creatoIl: t(D.momento),
  aggiornatoIl: t(D.momento),
}) satisfies z.ZodType<Documento>;

/** Elenco salvato: i documenti rovinati si scartano uno per uno, gli altri restano. */
export const schemaElencoDocumenti = z
  .array(z.unknown())
  .catch([])
  .transform((voci) =>
    voci.flatMap((v) => {
      const r = schemaDocumento.safeParse(v);
      return r.success ? [r.data] : [];
    }),
  );
