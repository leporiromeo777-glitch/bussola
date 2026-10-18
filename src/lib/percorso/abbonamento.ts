/**
 * «Calendario sempre aggiornato»: un link personale e segreto
 * (https://<sito>/api/calendario/<token>) che Google Calendar, Apple
 * Calendario o Outlook rileggono da soli. Ogni volta il server costruisce gli
 * stessi eventi del file .ics da scaricare: le scadenze del percorso (dalle
 * risposte salvate nell'account) per quest'anno e il prossimo, e le votazioni
 * da seguire.
 *
 * Logica pura: token, impronta (Web Crypto, che c'è in Node, nei browser e
 * nell'app), link per i calendari, eventi e file .ics.
 */
import { z } from "zod";
import type { Votazione } from "@/data/votazioni";
import { eventiVotazioni } from "@/lib/votazioni";
import { dataIsoValida, eventiDaScadenze, generaIcs, type EventoCalendario } from "./calendario";
import { calcolaPercorso } from "./regole";
import { leggiRisposte, type Risposte } from "./risposte";

/** Dove sta il calendario: `${PERCORSO_CALENDARIO}/<token>`. */
export const PERCORSO_CALENDARIO = "/api/calendario";

/** Caratteri del token: base64url (RFC 4648), sicuri in un URL. */
const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** 32 caratteri × 6 bit = 192 bit casuali: impossibile da indovinare. */
export const LUNGHEZZA_TOKEN_CALENDARIO = 32;

const FORMATO_TOKEN = /^[A-Za-z0-9_-]{32}$/;

/** Nome del calendario che si vede in Google Calendar o Apple Calendario. */
export const NOME_CALENDARIO_ABBONAMENTO = "Bleo: scadenze e votazioni";

/** Ogni quanto chiediamo ai calendari di rileggere il link (è solo un suggerimento). */
export const AGGIORNA_OGNI = "PT12H";

/** Nuovo token casuale. */
export function nuovoTokenCalendario(
  casuale: (byte: Uint8Array<ArrayBuffer>) => Uint8Array = (b) => crypto.getRandomValues(b),
): string {
  const byte = casuale(new Uint8Array(LUNGHEZZA_TOKEN_CALENDARIO));
  // 256 è un multiplo di 64: prendere i 6 bit bassi non sbilancia nessun carattere.
  return Array.from(byte, (b) => ALFABETO[b & 63]).join("");
}

export function tokenCalendarioValido(token: unknown): token is string {
  return typeof token === "string" && FORMATO_TOKEN.test(token);
}

/** Il token dall'ultimo pezzo dell'URL (accetta anche «.ics» in fondo); null se non ha la forma giusta. */
export function tokenDaSegmento(segmento: string): string | null {
  const token = segmento.endsWith(".ics") ? segmento.slice(0, -4) : segmento;
  return tokenCalendarioValido(token) ? token : null;
}

/**
 * Impronta SHA-256 del token, in esadecimale minuscolo: è l'unica cosa che
 * finisce nel database. Da lì nessuno può ricostruire il link.
 */
export async function improntaToken(token: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function percorsoCalendario(token: string): string {
  return `${PERCORSO_CALENDARIO}/${token}`;
}

/** Il link completo, dal sito (per esempio https://bleo.ch) e dal percorso. */
export function linkCalendario(sito: string, percorso: string): string {
  return `${sito.replace(/\/+$/, "")}${percorso}`;
}

/** Lo stesso link con webcal://: Apple Calendario (e altri) lo aprono come iscrizione. */
export function linkWebcal(link: string): string {
  return link.replace(/^https?:\/\//i, "webcal://");
}

/**
 * Il link che apre Google Calendar con la richiesta di aggiungere il
 * calendario (si conferma con «Aggiungi»). Google lo legge dai suoi server:
 * con un sito in locale (localhost) non funziona.
 */
export function linkGoogleCalendar(link: string): string {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(linkWebcal(link))}`;
}

/** La data di oggi in Svizzera (AAAA-MM-GG), qualunque sia il fuso del server. */
export function dataZurigo(adesso: Date): string {
  const parti = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(adesso);
  const valore = (tipo: string) => parti.find((p) => p.type === tipo)?.value ?? "";
  return `${valore("year")}-${valore("month")}-${valore("day")}`;
}

/**
 * Gli eventi del calendario a cui ci si iscrive, in ordine di data:
 * - le scadenze del percorso con una data, per l'anno di `oggi` e il
 *   seguente (le stesse del file .ics; il termine IVA che dipende dalla data
 *   di inizio non c'è, perché Bleo quella data non la salva);
 * - le votazioni da seguire, dall'inizio dell'anno in poi: così una votazione
 *   appena passata non sparisce dal calendario il giorno dopo.
 * Senza risposte (questionario non salvato nell'account) restano le votazioni.
 */
export function eventiAbbonamento(
  risposte: Risposte | null,
  votazioni: readonly Votazione[],
  oggi: string,
): EventoCalendario[] {
  if (!dataIsoValida(oggi)) return [];
  const anno = Number(oggi.slice(0, 4));
  const scadenze = risposte ? calcolaPercorso(risposte).scadenze : [];
  const eventi = [
    ...eventiDaScadenze(scadenze, { anno }),
    ...eventiDaScadenze(scadenze, { anno: anno + 1 }),
    ...eventiVotazioni(votazioni.filter((v) => v.data >= `${anno}-01-01`)),
  ];
  // Un evento per UID: è l'UID che fa aggiornare l'evento invece di duplicarlo.
  const unici = new Map(eventi.map((e) => [e.uid, e]));
  return [...unici.values()].sort((a, b) => a.data.localeCompare(b.data) || a.uid.localeCompare(b.uid));
}

/** Il file .ics del link personale, costruito al momento della richiesta. */
export function icsAbbonamento(risposte: Risposte | null, votazioni: readonly Votazione[], adesso: Date): string {
  return generaIcs(eventiAbbonamento(risposte, votazioni, dataZurigo(adesso)), {
    adesso,
    nomeCalendario: NOME_CALENDARIO_ABBONAMENTO,
    descrizioneCalendario:
      "Le scadenze del tuo percorso e le votazioni da seguire, con le fonti ufficiali. Informazione generale di Bleo: verifica sempre con l'ufficio competente.",
    aggiornaOgni: AGGIORNA_OGNI,
  });
}

/* ------------------------------------------------------------------ */
/* Risposte dell'API /api/calendario (sito e app)                      */
/* ------------------------------------------------------------------ */

export type StatoCalendario = {
  /** Il link attivo (senza il token: il server non lo conosce), oppure null. */
  link: { id: string; creatoIl: string; lettoIl: string | null } | null;
  /** Le risposte salvate nell'account, da cui nascono le scadenze del calendario. */
  percorso: { risposte: Risposte; aggiornatoIl: string } | null;
};

/** POST /api/calendario: il link nuovo. Il percorso con il token si vede solo qui, una volta. */
export type LinkCreato = { id: string; creatoIl: string; percorso: string };

const schemaStato = z.object({
  link: z.object({ id: z.string().min(1), creatoIl: z.string().min(1), lettoIl: z.string().nullable() }).nullable(),
  percorso: z.object({ risposte: z.unknown(), aggiornatoIl: z.string().min(1) }).nullable(),
});

/** Valida la risposta di GET (e PUT) /api/calendario; null se non ha la forma attesa. */
export function leggiStatoCalendario(dati: unknown): StatoCalendario | null {
  const esito = schemaStato.safeParse(dati);
  if (!esito.success) return null;
  const { link, percorso } = esito.data;
  const risposte = percorso ? leggiRisposte(percorso.risposte) : null;
  return { link, percorso: percorso && risposte ? { risposte, aggiornatoIl: percorso.aggiornatoIl } : null };
}

/** Valida la risposta di POST /api/calendario; null se non ha la forma attesa. */
export function leggiLinkCreato(dati: unknown): LinkCreato | null {
  const esito = z.object({ id: z.string().min(1), creatoIl: z.string().min(1), percorso: z.string() }).safeParse(dati);
  if (!esito.success) return null;
  const token = esito.data.percorso.slice(PERCORSO_CALENDARIO.length + 1);
  return esito.data.percorso === percorsoCalendario(token) && tokenCalendarioValido(token) ? esito.data : null;
}

/* ------------------------------------------------------------------ */
/* Copia del link sul dispositivo                                      */
/* ------------------------------------------------------------------ */

/*
 * Il link resta salvato solo nel browser o nel telefono che l'ha creato
 * (CHIAVE_LINK_CALENDARIO in archivio.ts, localStorage o SQLite): il server
 * ne tiene l'impronta.
 */

export type LinkSalvato = { userId: string; id: string; percorso: string };

/** Il testo da salvare sul dispositivo dopo aver creato il link. */
export function serializzaLinkSalvato(link: LinkSalvato): string {
  return JSON.stringify(link);
}

/**
 * La copia del link salvata sul dispositivo, solo se è dell'utente collegato
 * e del link ancora attivo (`idAttivo`, da GET /api/calendario): dopo «Rigenera
 * il link» su un altro dispositivo, o con un altro account, non vale più.
 */
export function analizzaLinkSalvato(
  grezzo: string | null,
  userId: string | null,
  idAttivo: string | null,
): LinkSalvato | null {
  if (!grezzo || !userId || !idAttivo) return null;
  try {
    const dati = JSON.parse(grezzo) as Partial<Record<keyof LinkSalvato, unknown>> | null;
    if (!dati || typeof dati !== "object") return null;
    const { userId: utente, id, percorso } = dati;
    if (utente !== userId || id !== idAttivo || typeof percorso !== "string") return null;
    const prefisso = `${PERCORSO_CALENDARIO}/`;
    if (!percorso.startsWith(prefisso) || !tokenCalendarioValido(percorso.slice(prefisso.length))) return null;
    return { userId, id: idAttivo, percorso };
  } catch {
    return null;
  }
}
