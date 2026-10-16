/**
 * «Fotografa la lettera»: controlli sul file che arriva dal browser (foto o
 * PDF di una lettera di un ufficio). Logica pura, senza browser né Node: la
 * usano la route src/app/api/lettera/route.ts, la pagina e l'app.
 */
import { z } from "zod";

/** Tipi di file accettati: quelli che Claude sa leggere come immagine o documento. */
export const TIPI_LETTERA = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type TipoLettera = (typeof TIPI_LETTERA)[number];

/** Lato lungo massimo della foto ridimensionata nel browser, in pixel. */
export const LATO_MASSIMO_FOTO = 1600;
/** Qualità JPEG della foto ridimensionata (0–1). */
export const QUALITA_FOTO = 0.85;
/** Peso a cui punta il browser per la foto ridimensionata. */
export const PESO_OBIETTIVO_FOTO = 1_500_000;
/** Peso massimo di un'immagine accettato dal server (margine sopra l'obiettivo). */
export const PESO_MASSIMO_IMMAGINE = 2_000_000;
/**
 * Peso massimo di un PDF. In base64 un file cresce di un terzo: 3,5 MB
 * diventano circa 4,7 MB di richiesta, sotto il limite delle funzioni
 * dell'hosting (circa 6 MB).
 */
export const PESO_MASSIMO_PDF = 3_500_000;
/** Pagine massime di un PDF (controllo indicativo, vedi stimaPaginePdf). */
export const PAGINE_MASSIME_PDF = 10;
/** Dimensione massima del corpo JSON della richiesta, in caratteri. */
export const CORPO_MASSIMO = 5_000_000;

/** «3,5 MB» in formato svizzero. */
export function formatoMegabyte(byte: number): string {
  const mb = Math.round((byte / 1_000_000) * 10) / 10;
  return `${String(mb).replace(".", ",")} MB`;
}

/** Testi fissi di «Fotografa la lettera», in italiano semplice. */
export const MESSAGGI_LETTERA = {
  richiestaNonValida: "La richiesta non è valida. Ricarica la pagina e riprova.",
  fileMancante: "Scegli una foto o un PDF della lettera.",
  tipoNonValido: "Questo tipo di file non va bene: usa una foto (JPG, PNG o WebP) oppure un PDF.",
  fileNonCorrisponde: "Il file non sembra una foto o un PDF valido. Prova a scattare di nuovo la foto.",
  fileVuoto: "Il file è vuoto. Prova a scattare di nuovo la foto.",
  immagineGrande: `La foto è troppo pesante: al massimo ${formatoMegabyte(PESO_MASSIMO_IMMAGINE)}.`,
  pdfGrande: `Il PDF è troppo pesante: al massimo ${formatoMegabyte(PESO_MASSIMO_PDF)}. Fotografa solo le pagine che ti servono.`,
  pdfLungo: `Il PDF ha troppe pagine: al massimo ${PAGINE_MASSIME_PDF}. Fotografa solo le pagine importanti.`,
  nonAttivo: "Questa funzione non è ancora attiva.",
  troppeRichieste: "Hai già letto diverse lettere in poco tempo. Riprova tra un'ora.",
  occupato: "In questo momento Bleo non riesce a leggere la lettera. Riprova tra qualche minuto.",
  nonCapito: "Bleo non è riuscito a leggere questa lettera. Prova con una foto più nitida, con tutta la pagina.",
} as const;

/* ------------------------------------------------------------------ */
/* Base64                                                              */
/* ------------------------------------------------------------------ */

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const FORMATO_BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

/** Byte del file decodificato, senza decodificarlo; null se il testo non è base64 valido (senza a capo). */
export function byteDaBase64(base64: string): number | null {
  if (base64.length === 0 || base64.length % 4 !== 0 || !FORMATO_BASE64.test(base64)) return null;
  const riempimento = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length / 4) * 3 - riempimento;
}

/** Decodifica i primi `quanti` byte (bastano per riconoscere il tipo di file). */
export function inizioBase64(base64: string, quanti: number): Uint8Array {
  const caratteri = base64.slice(0, Math.ceil(quanti / 3) * 4).replace(/=+$/, "");
  const byte: number[] = [];
  let accumulo = 0;
  let bit = 0;
  for (const carattere of caratteri) {
    const valore = ALFABETO.indexOf(carattere);
    if (valore < 0) break;
    accumulo = (accumulo << 6) | valore;
    bit += 6;
    if (bit >= 8) {
      bit -= 8;
      byte.push((accumulo >> bit) & 0xff);
    }
  }
  return Uint8Array.from(byte.slice(0, quanti));
}

/* ------------------------------------------------------------------ */
/* Tipo di file dai primi byte                                         */
/* ------------------------------------------------------------------ */

function iniziaCon(byte: Uint8Array, firma: readonly number[], da = 0): boolean {
  return firma.every((valore, i) => byte[da + i] === valore);
}

const ascii = (testo: string) => [...testo].map((c) => c.charCodeAt(0));

/**
 * Tipo di file riconosciuto dai primi byte («magic bytes»), indipendente da
 * quello dichiarato dal browser. Null se non è uno dei tipi accettati.
 */
export function riconosciTipo(byte: Uint8Array): TipoLettera | null {
  if (iniziaCon(byte, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (iniziaCon(byte, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (iniziaCon(byte, ascii("RIFF")) && iniziaCon(byte, ascii("WEBP"), 8)) return "image/webp";
  if (iniziaCon(byte, ascii("%PDF-"))) return "application/pdf";
  return null;
}

/* ------------------------------------------------------------------ */
/* Pagine di un PDF                                                    */
/* ------------------------------------------------------------------ */

/** I byte come testo latino-1, a pezzi (un file intero non sta negli argomenti di una funzione). */
function testoLatino(byte: Uint8Array): string {
  let testo = "";
  for (let i = 0; i < byte.length; i += 0x8000) {
    testo += String.fromCharCode(...byte.subarray(i, i + 0x8000));
  }
  return testo;
}

/**
 * Stima delle pagine di un PDF senza aprirlo: il valore /Count più alto tra
 * gli oggetti /Type /Pages, o il numero di oggetti /Type /Page. Nei PDF con
 * gli oggetti compressi non si vede nulla: null (vale solo il limite di peso).
 */
export function stimaPaginePdf(byte: Uint8Array): number | null {
  const testo = testoLatino(byte);
  let conteggio = 0;
  for (const corrispondenza of testo.matchAll(/\/Type\s*\/Pages(?![A-Za-z])/g)) {
    const inizio = Math.max(0, corrispondenza.index - 300);
    const vicino = testo.slice(inizio, corrispondenza.index + 300);
    for (const numero of vicino.matchAll(/\/Count\s+(\d{1,6})/g)) {
      conteggio = Math.max(conteggio, Number(numero[1]));
    }
  }
  const foglie = [...testo.matchAll(/\/Type\s*\/Page(?![A-Za-z])/g)].length;
  const pagine = Math.max(conteggio, foglie);
  return pagine > 0 ? pagine : null;
}

/* ------------------------------------------------------------------ */
/* Ridimensionamento della foto                                        */
/* ------------------------------------------------------------------ */

/** Dimensioni della foto ridimensionata: lato lungo al massimo `lato`, proporzioni uguali, mai ingrandita. */
export function dimensioniRidotte(
  larghezza: number,
  altezza: number,
  lato: number = LATO_MASSIMO_FOTO,
): { larghezza: number; altezza: number } {
  if (!(larghezza > 0) || !(altezza > 0)) return { larghezza: 0, altezza: 0 };
  const scala = Math.min(1, lato / Math.max(larghezza, altezza));
  return {
    larghezza: Math.max(1, Math.round(larghezza * scala)),
    altezza: Math.max(1, Math.round(altezza * scala)),
  };
}

/* ------------------------------------------------------------------ */
/* Richiesta                                                           */
/* ------------------------------------------------------------------ */

/** Corpo della richiesta POST /api/lettera: tipo del file e contenuto in base64 (senza «data:…;base64,»). */
export const schemaRichiestaLettera = z.object({
  tipo: z.string(),
  dati: z.string(),
});

export type RichiestaLettera = { tipo: TipoLettera; dati: string; byte: number };

export type EsitoRichiestaLettera =
  | { ok: true; dati: RichiestaLettera }
  | { ok: false; stato: 400 | 413 | 415; messaggio: string };

function errore(stato: 400 | 413 | 415, messaggio: string): EsitoRichiestaLettera {
  return { ok: false, stato, messaggio };
}

/**
 * Valida il corpo: tipo tra quelli accettati, base64 valido, peso entro il
 * limite del tipo e primi byte che corrispondono al tipo dichiarato. Le
 * pagine di un PDF si controllano a parte (stimaPaginePdf), sui byte decodificati.
 */
export function leggiRichiestaLettera(corpo: unknown): EsitoRichiestaLettera {
  const esito = schemaRichiestaLettera.safeParse(corpo);
  if (!esito.success) {
    const campo = esito.error.issues[0]?.path[0];
    return errore(400, campo === "dati" ? MESSAGGI_LETTERA.fileMancante : MESSAGGI_LETTERA.richiestaNonValida);
  }
  const { tipo, dati } = esito.data;
  if (!(TIPI_LETTERA as readonly string[]).includes(tipo)) return errore(415, MESSAGGI_LETTERA.tipoNonValido);
  const tipoDichiarato = tipo as TipoLettera;
  const pdf = tipoDichiarato === "application/pdf";
  const massimo = pdf ? PESO_MASSIMO_PDF : PESO_MASSIMO_IMMAGINE;

  if (dati.length === 0) return errore(400, MESSAGGI_LETTERA.fileVuoto);
  // Prima della regex sull'intero testo: un file enorme si rifiuta subito.
  if (dati.length > Math.ceil(massimo / 3) * 4) {
    return errore(413, pdf ? MESSAGGI_LETTERA.pdfGrande : MESSAGGI_LETTERA.immagineGrande);
  }
  const byte = byteDaBase64(dati);
  if (byte === null) return errore(400, MESSAGGI_LETTERA.fileNonCorrisponde);
  if (byte > massimo) return errore(413, pdf ? MESSAGGI_LETTERA.pdfGrande : MESSAGGI_LETTERA.immagineGrande);
  if (riconosciTipo(inizioBase64(dati, 12)) !== tipoDichiarato) {
    return errore(415, MESSAGGI_LETTERA.fileNonCorrisponde);
  }
  return { ok: true, dati: { tipo: tipoDichiarato, dati, byte } };
}
