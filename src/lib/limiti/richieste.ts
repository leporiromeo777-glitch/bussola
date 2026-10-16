import { createHmac } from "node:crypto";

/** Quante richieste per connessione (indirizzo IP) e in che finestra di tempo. */
export type RegolaLimite = { massimo: number; finestraSecondi: number };

/**
 * Limiti per le azioni pubbliche che fanno partire email dal nostro server
 * o che costano (una chiamata a Claude senza accesso).
 * Abbastanza larghi per una classe o un ufficio dietro lo stesso IP,
 * abbastanza stretti da fermare uno script da una sola connessione.
 */
export const LIMITI_RICHIESTE = {
  listaAttesa: { massimo: 10, finestraSecondi: 60 * 60 },
  accesso: { massimo: 10, finestraSecondi: 60 * 60 },
  /** «Raccontami la tua idea» nel questionario: costa una chiamata a Claude e di solito basta una prova. */
  racconto: { massimo: 5, finestraSecondi: 60 * 60 },
  /** «Fotografa la lettera»: un'immagine costa più di un testo. */
  lettera: { massimo: 5, finestraSecondi: 60 * 60 },
  /** «Testi pronti»: si provano più versioni. */
  testi: { massimo: 10, finestraSecondi: 60 * 60 },
  /** «Nome della ditta»: proposte di nomi. */
  nomeDitta: { massimo: 10, finestraSecondi: 60 * 60 },
} as const satisfies Record<string, RegolaLimite>;

export type AmbitoLimite = keyof typeof LIMITI_RICHIESTE;

type Intestazioni = { get(nome: string): string | null };

const FORMATO_IP = /^[0-9a-f.:]{2,45}$/i;

function ipValido(valore: string | null | undefined): string | null {
  const ip = valore?.trim();
  return ip && FORMATO_IP.test(ip) ? ip.toLowerCase() : null;
}

/**
 * Indirizzo IP di chi fa la richiesta, dalle intestazioni dell'hosting.
 * Prima quelle che l'hosting scrive da sé (Netlify, Vercel), poi l'ultimo
 * valore di X-Forwarded-For, cioè quello aggiunto dal proxy più vicino (i
 * primi valori li può scrivere chiunque). Null se non si trova.
 */
export function ipDaIntestazioni(intestazioni: Intestazioni): string | null {
  return (
    ipValido(intestazioni.get("x-nf-client-connection-ip")) ??
    ipValido(intestazioni.get("x-real-ip")) ??
    ipValido(intestazioni.get("x-forwarded-for")?.split(",").at(-1))
  );
}

/**
 * Chiave salvata nel database: ambito e impronta HMAC-SHA256 dell'IP con un
 * segreto del server. L'IP in chiaro non si salva mai.
 */
export function chiaveLimite(ambito: AmbitoLimite, ip: string, segreto: string): string {
  const impronta = createHmac("sha256", segreto).update(ip).digest("base64url");
  return `${ambito}:${impronta}`;
}
