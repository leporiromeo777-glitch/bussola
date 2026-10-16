/**
 * «I tuoi conti»: email inoltrate all'indirizzo personale (ricezione di
 * Resend). Logica pura: lettura del webhook e dell'email completa,
 * conferma dell'inoltro di Gmail, spam, allegati da leggere e testo di
 * ripiego. La route è src/app/api/conti/email-in/route.ts.
 *
 * Formati (documentazione di Resend, controllata il 16.10.2026):
 * - webhook «email.received»: { type, created_at, data: { email_id, from,
 *   to[], cc[], bcc[], received_for[], subject, attachments[] } }, senza testo
 *   né allegati;
 * - GET /emails/receiving/{id}: { id, from, to[], subject, html, text,
 *   headers{}, received_for[], authentication{spf,dkim,dmarc}, attachments[] };
 * - GET /emails/receiving/{id}/attachments: { data: [{ id, filename, size,
 *   content_type, content_disposition, content_id, download_url, expires_at }] }.
 *
 * Il contenuto delle email non è affidabile: qui si legge solo come dati.
 */
import { z } from "zod";
import { PESO_MASSIMO_IMMAGINE, PESO_MASSIMO_PDF, type TipoLettera } from "@/lib/lettera/richiesta";
import { indirizzoNudo } from "./casella";
import { ALLEGATI_MASSIMI_PER_EMAIL, TESTO_EMAIL_MASSIMO } from "./limiti";

/* ------------------------------------------------------------------ */
/* Webhook                                                             */
/* ------------------------------------------------------------------ */

const listaTesti = z.array(z.unknown()).catch([]).transform((v) => v.filter((x): x is string => typeof x === "string"));

const schemaEvento = z.object({
  type: z.string(),
  data: z
    .object({
      email_id: z.string().min(1).max(100),
      from: z.string().max(1000).catch(""),
      to: listaTesti,
      cc: listaTesti,
      bcc: listaTesti,
      received_for: listaTesti,
      subject: z.string().catch(""),
    })
    .optional(),
});

export type EventoEmail = {
  tipo: string;
  /** Solo per «email.received». */
  email: {
    id: string;
    mittente: string;
    /** received_for, to, cc e bcc, in quest'ordine. */
    destinatari: string[];
    oggetto: string;
  } | null;
};

/** Legge il corpo del webhook di Resend; null se non è un evento. */
export function leggiEvento(json: unknown): EventoEmail | null {
  const esito = schemaEvento.safeParse(json);
  if (!esito.success) return null;
  const { type, data } = esito.data;
  if (type !== "email.received" || !data) return { tipo: type, email: null };
  return {
    tipo: type,
    email: {
      id: data.email_id,
      mittente: data.from,
      destinatari: [...data.received_for, ...data.to, ...data.cc, ...data.bcc],
      oggetto: data.subject.slice(0, 500),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Email completa                                                      */
/* ------------------------------------------------------------------ */

const risultatoAutenticazione = z.string().nullable().optional().catch(null);

const schemaAllegato = z.object({
  id: z.string(),
  filename: z.string().nullable().optional().catch(null),
  content_type: z.string().nullable().optional().catch(null),
  content_disposition: z.string().nullable().optional().catch(null),
  content_id: z.string().nullable().optional().catch(null),
  size: z.number().nullable().optional().catch(null),
  download_url: z.string().nullable().optional().catch(null),
});

const schemaEmail = z.object({
  id: z.string(),
  from: z.string().catch(""),
  subject: z.string().nullable().catch(""),
  html: z.string().nullable().optional().catch(null),
  text: z.string().nullable().optional().catch(null),
  headers: z.record(z.string(), z.unknown()).nullable().optional().catch(null),
  authentication: z
    .object({ spf: risultatoAutenticazione, dkim: risultatoAutenticazione, dmarc: risultatoAutenticazione })
    .nullable()
    .optional()
    .catch(null),
  attachments: z.array(schemaAllegato).catch([]),
});

export type Allegato = {
  id: string;
  nome: string | null;
  tipo: string | null;
  disposizione: string | null;
  contentId: string | null;
  byte: number | null;
  url: string | null;
};

export type EmailRicevuta = {
  id: string;
  mittente: string;
  oggetto: string;
  html: string | null;
  testo: string | null;
  /** Nomi in minuscolo. */
  intestazioni: Record<string, string>;
  autenticazione: { spf: string | null; dkim: string | null; dmarc: string | null } | null;
  allegati: Allegato[];
};

function allegatoDa(a: z.infer<typeof schemaAllegato>): Allegato {
  return {
    id: a.id,
    nome: a.filename ?? null,
    tipo: a.content_type?.toLowerCase().split(";")[0].trim() ?? null,
    disposizione: a.content_disposition?.toLowerCase() ?? null,
    contentId: a.content_id ?? null,
    byte: typeof a.size === "number" ? a.size : null,
    url: a.download_url ?? null,
  };
}

/** Legge la risposta di GET /emails/receiving/{id}; null se non ha la forma attesa. */
export function leggiEmail(json: unknown): EmailRicevuta | null {
  const esito = schemaEmail.safeParse(json);
  if (!esito.success) return null;
  const e = esito.data;
  const intestazioni: Record<string, string> = {};
  for (const [nome, valore] of Object.entries(e.headers ?? {})) {
    const testo = Array.isArray(valore) ? valore.filter((v) => typeof v === "string").join(", ") : valore;
    if (typeof testo === "string") intestazioni[nome.toLowerCase()] = testo;
  }
  return {
    id: e.id,
    mittente: e.from,
    oggetto: (e.subject ?? "").slice(0, 500),
    html: e.html ?? null,
    testo: e.text ?? null,
    intestazioni,
    autenticazione: e.authentication
      ? { spf: e.authentication.spf ?? null, dkim: e.authentication.dkim ?? null, dmarc: e.authentication.dmarc ?? null }
      : null,
    allegati: e.attachments.map(allegatoDa),
  };
}

/** Legge la risposta di GET /emails/receiving/{id}/attachments. */
export function leggiAllegati(json: unknown): Allegato[] {
  const esito = z.object({ data: z.array(schemaAllegato) }).safeParse(json);
  return esito.success ? esito.data.data.map(allegatoDa) : [];
}

/* ------------------------------------------------------------------ */
/* Testo                                                               */
/* ------------------------------------------------------------------ */

const ENTITA: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  euro: "€",
  agrave: "à",
  egrave: "è",
  eacute: "é",
  igrave: "ì",
  ograve: "ò",
  ugrave: "ù",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  szlig: "ß",
  ccedil: "ç",
};

export function decodificaEntita(testo: string): string {
  return testo.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tutto, codice: string) => {
    if (codice[0] === "#") {
      const n = codice[1] === "x" || codice[1] === "X" ? parseInt(codice.slice(2), 16) : parseInt(codice.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : tutto;
    }
    return ENTITA[codice.toLowerCase()] ?? tutto;
  });
}

/** Testo leggibile da un HTML di email: niente script, stili, tag e commenti; a capo per blocchi e righe di tabella. */
export function testoDaHtml(html: string): string {
  return decodificaEntita(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|head|title)\b[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|tr|li|h[1-6]|table|section)\s*>/gi, "\n")
      .replace(/<\/t[dh]\s*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Testo dell'email: quello semplice se c'è, altrimenti dall'HTML. */
export function testoEmail(email: Pick<EmailRicevuta, "testo" | "html">): string {
  const semplice = email.testo?.trim();
  if (semplice) return semplice;
  return email.html ? testoDaHtml(email.html) : "";
}

/* ------------------------------------------------------------------ */
/* Conferma dell'inoltro di Gmail                                      */
/* ------------------------------------------------------------------ */

export const MITTENTE_CONFERMA_GMAIL = "forwarding-noreply@google.com";

/** Host dei link di conferma di Gmail: solo questi si mostrano all'utente. */
const HOST_GMAIL = new Set(["mail-settings.google.com", "mail.google.com", "isolated.mail.google.com"]);

export function eConfermaGmail(mittente: string): boolean {
  return indirizzoNudo(mittente) === MITTENTE_CONFERMA_GMAIL;
}

/**
 * Link di conferma di Gmail nel testo o nell'HTML: solo https e solo sugli
 * host di Google, così una email falsa non può far mostrare un altro link.
 */
export function linkConfermaGmail(...testi: (string | null | undefined)[]): string | null {
  for (const testo of testi) {
    if (!testo) continue;
    for (const trovato of decodificaEntita(testo).matchAll(/https:\/\/[^\s"'<>()\]]+/gi)) {
      const candidato = trovato[0].replace(/[.,;:!?]+$/, "");
      try {
        const url = new URL(candidato);
        if (url.protocol === "https:" && HOST_GMAIL.has(url.hostname.toLowerCase()) && url.pathname.startsWith("/mail/")) {
          return url.toString().slice(0, 2000);
        }
      } catch {
        // Non è un URL valido: si passa al prossimo.
      }
    }
  }
  return null;
}

/**
 * Codice di conferma (di solito 9 cifre), in qualsiasi lingua: prima
 * dall'oggetto «(#123456789) …», poi dopo una parola come «code», «codice»,
 * «Bestätigungscode», infine il primo numero di 6–12 cifre fuori dai link.
 */
export function codiceConfermaGmail(oggetto: string, testo: string): string | null {
  const nellOggetto = /\(#(\d{4,12})\)/.exec(oggetto);
  if (nellOggetto) return nellOggetto[1];
  const senzaLink = testo.replace(/https?:\/\/\S+/gi, " ").replace(/\S+@\S+/g, " ");
  const etichettato = /(?:code|codice|código|codigo|kode|bestätigungscode|bestaetigungscode)\b[^\d\n]{0,30}?(\d{4,12})(?!\d)/iu.exec(
    senzaLink,
  );
  if (etichettato) return etichettato[1];
  const numero = /(?<![\d.,'’])(\d{6,12})(?![\d.,'’]?\d)/.exec(senzaLink);
  return numero ? numero[1] : null;
}

export type ConfermaGmail = { codice: string | null; link: string | null };

/**
 * Codice e link dell'email di conferma di Gmail. Null se il mittente non è
 * quello di Google o se il server di ricezione dice che la firma (DKIM o
 * DMARC) non torna: un'email falsa non deve arrivare nella pagina.
 */
export function leggiConfermaGmail(email: EmailRicevuta): ConfermaGmail | null {
  if (!eConfermaGmail(email.mittente)) return null;
  const a = email.autenticazione;
  if (a && a.dkim !== "pass" && a.dmarc !== "pass") return null;
  const testo = testoEmail(email);
  const codice = codiceConfermaGmail(email.oggetto, testo);
  const link = linkConfermaGmail(email.testo, email.html);
  return codice || link ? { codice, link } : null;
}

/* ------------------------------------------------------------------ */
/* Spam                                                                */
/* ------------------------------------------------------------------ */

/** true se un'intestazione antispam segna l'email come spam (X-Spam-Flag, X-Spam-Status, X-Spam). */
export function eSpam(intestazioni: Record<string, string>): boolean {
  const flag = intestazioni["x-spam-flag"]?.trim().toLowerCase();
  const stato = intestazioni["x-spam-status"]?.trim().toLowerCase();
  const spam = intestazioni["x-spam"]?.trim().toLowerCase();
  return flag === "yes" || flag === "true" || stato?.startsWith("yes") === true || spam === "yes" || spam === "true";
}

/* ------------------------------------------------------------------ */
/* Allegati e testo da leggere                                         */
/* ------------------------------------------------------------------ */

const PER_ESTENSIONE: Record<string, TipoLettera> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Tipo di un allegato, dal content type o (se generico) dall'estensione; null se non si legge. */
export function tipoAllegato(a: Pick<Allegato, "tipo" | "nome">): TipoLettera | null {
  const dichiarato = a.tipo === "image/jpg" || a.tipo === "image/pjpeg" ? "image/jpeg" : a.tipo;
  if (dichiarato && (Object.values(PER_ESTENSIONE) as string[]).includes(dichiarato)) return dichiarato as TipoLettera;
  if (!dichiarato || dichiarato === "application/octet-stream") {
    const estensione = a.nome?.toLowerCase().split(".").pop() ?? "";
    return PER_ESTENSIONE[estensione] ?? null;
  }
  return null;
}

export function pesoMassimo(tipo: TipoLettera): number {
  return tipo === "application/pdf" ? PESO_MASSIMO_PDF : PESO_MASSIMO_IMMAGINE;
}

/** Immagini inline piccole (loghi, firme, icone social): non sono ricevute. */
const IMMAGINE_INLINE_PICCOLA = 60_000;

/**
 * Allegati da leggere: PDF e immagini, nel peso massimo, senza i loghi
 * inline, al massimo ALLEGATI_MASSIMI_PER_EMAIL. Prima i PDF.
 */
export function allegatiDaLeggere(allegati: readonly Allegato[]): (Allegato & { tipoFile: TipoLettera })[] {
  return allegati
    .map((a) => ({ ...a, tipoFile: tipoAllegato(a) }))
    .filter((a): a is Allegato & { tipoFile: TipoLettera } => a.tipoFile !== null)
    .filter((a) => a.byte === null || (a.byte > 0 && a.byte <= pesoMassimo(a.tipoFile)))
    .filter(
      (a) =>
        a.tipoFile === "application/pdf" ||
        !(a.disposizione === "inline" || a.contentId) ||
        (a.byte !== null && a.byte >= IMMAGINE_INLINE_PICCOLA),
    )
    .sort((a, b) => Number(b.tipoFile === "application/pdf") - Number(a.tipoFile === "application/pdf"))
    .slice(0, ALLEGATI_MASSIMI_PER_EMAIL);
}

const PAROLE_RICEVUTA =
  /\b(ricevut|fattur|scontrin|ordin|pagament|acquist|invoice|receipt|order|payment|purchase|rechnung|quittung|beleg|bestellung|zahlung|kauf|facture|re[çc]u|commande|paiement|achat|totale?|betrag|montant|importo)/i;
const IMPORTO_IN_TESTO = /(?:CHF|EUR|USD|GBP|Fr\.|€|\$|£)\s?\d|\d[\d'’.,\s]*[.,]\d{2}\s?(?:CHF|EUR|USD|GBP|Fr\.|€|\$|£)/i;

/** true se oggetto e testo sembrano una ricevuta o una conferma d'acquisto (parola chiave + importo). */
export function sembraRicevuta(oggetto: string, testo: string): boolean {
  const tutto = `${oggetto}\n${testo}`;
  return PAROLE_RICEVUTA.test(tutto) && IMPORTO_IN_TESTO.test(tutto);
}

export type PianoEmail =
  | { azione: "conferma_gmail"; conferma: ConfermaGmail }
  | { azione: "spam" }
  | { azione: "allegati"; allegati: (Allegato & { tipoFile: TipoLettera })[] }
  | { azione: "testo"; testo: string }
  | { azione: "niente" };

/**
 * Cosa fare con un'email ricevuta, in ordine: conferma di Gmail (si salva e
 * basta), spam (si salta), allegati PDF o immagini (si leggono), altrimenti
 * il testo se sembra una ricevuta d'acquisto online, altrimenti niente.
 * `allegati` sono quelli dell'API degli allegati (con il link per scaricarli).
 */
export function pianoEmail(email: EmailRicevuta, allegati: readonly Allegato[] = email.allegati): PianoEmail {
  if (eConfermaGmail(email.mittente)) {
    const conferma = leggiConfermaGmail(email);
    return conferma ? { azione: "conferma_gmail", conferma } : { azione: "niente" };
  }
  if (eSpam(email.intestazioni)) return { azione: "spam" };
  const daLeggere = allegatiDaLeggere(allegati);
  if (daLeggere.length > 0) return { azione: "allegati", allegati: daLeggere };
  const testo = testoEmail(email);
  if (testo && sembraRicevuta(email.oggetto, testo)) {
    return { azione: "testo", testo: testo.slice(0, TESTO_EMAIL_MASSIMO) };
  }
  return { azione: "niente" };
}
