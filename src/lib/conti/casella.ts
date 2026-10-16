/**
 * «I tuoi conti»: l'indirizzo personale per inoltrare fatture e ricevute,
 * ricevute-<token>@<dominio di ricezione>. Logica pura (usa solo
 * crypto.getRandomValues, che c'è in Node, nei browser e nell'app).
 */

/** Prefisso della parte locale dell'indirizzo. */
export const PREFISSO_CASELLA = "ricevute-";

/** Caratteri del token: base32 minuscolo (RFC 4648), niente 0/1/8/9 che si confondono con o/l/b/g. */
const ALFABETO = "abcdefghijklmnopqrstuvwxyz234567";

/** 26 caratteri × 5 bit = 130 bit casuali: impossibile da indovinare. */
export const LUNGHEZZA_TOKEN = 26;

const FORMATO_TOKEN = /^[a-z2-7]{24,64}$/;

/** Nuovo token casuale. */
export function nuovoToken(casuale: (byte: Uint8Array) => Uint8Array = (b) => crypto.getRandomValues(b)): string {
  const byte = casuale(new Uint8Array(LUNGHEZZA_TOKEN));
  // 256 è un multiplo di 32: prendere i 5 bit bassi non sbilancia nessuna lettera.
  return Array.from(byte, (b) => ALFABETO[b & 31]).join("");
}

export function tokenValido(token: unknown): token is string {
  return typeof token === "string" && FORMATO_TOKEN.test(token);
}

/**
 * Dominio di ricezione da RESEND_DOMINIO_RICEZIONE (es. "abc123.resend.app"),
 * in minuscolo; null se manca o non sembra un dominio.
 */
export function dominioRicezione(valore: string | undefined): string | null {
  const dominio = valore?.trim().toLowerCase().replace(/^@/, "");
  if (!dominio || !/^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(dominio)) return null;
  return dominio;
}

export function indirizzoCasella(token: string, dominio: string): string {
  return `${PREFISSO_CASELLA}${token}@${dominio}`;
}

/** Solo l'indirizzo da «Nome <indirizzo>», in minuscolo; null se non c'è. */
export function indirizzoNudo(valore: unknown): string | null {
  if (typeof valore !== "string") return null;
  const tra = /<([^<>\s]+@[^<>\s]+)>/.exec(valore);
  const indirizzo = (tra ? tra[1] : valore).trim().toLowerCase();
  return /^[^\s@<>]+@[^\s@<>]+$/.test(indirizzo) ? indirizzo : null;
}

/**
 * Token dal primo destinatario che è una casella di Bleo sul nostro dominio.
 * Le email inoltrate da Gmail tengono nel «To» il destinatario originale:
 * l'indirizzo della casella sta in received_for (busta), quindi si guardano
 * tutti i destinatari.
 */
export function tokenDaDestinatari(destinatari: readonly unknown[], dominio: string): string | null {
  for (const destinatario of destinatari) {
    const indirizzo = indirizzoNudo(destinatario);
    if (!indirizzo) continue;
    const chiocciola = indirizzo.lastIndexOf("@");
    const locale = indirizzo.slice(0, chiocciola);
    if (indirizzo.slice(chiocciola + 1) !== dominio || !locale.startsWith(PREFISSO_CASELLA)) continue;
    const token = locale.slice(PREFISSO_CASELLA.length);
    if (tokenValido(token)) return token;
  }
  return null;
}
