/**
 * Come si è identificata una richiesta alle API:
 * - "cookie": nessuna intestazione Authorization, vale la sessione del sito (cookie);
 * - "bearer": l'app manda `Authorization: Bearer <access_token>` di Supabase;
 * - "non_valida": c'è un'intestazione Authorization, ma non nella forma attesa.
 *
 * Con un'intestazione non valida non si ripiega sui cookie: chi la manda
 * (l'app) deve sapere che il suo accesso non vale.
 */
export type Autorizzazione = { tipo: "cookie" } | { tipo: "bearer"; token: string } | { tipo: "non_valida" };

/** Un access token di Supabase è un JWT: ben sotto questa lunghezza. */
export const LUNGHEZZA_MASSIMA_TOKEN = 8_192;

// Tre parti in base64url separate da punti (intestazione, dati, firma).
const FORMA_JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** Legge l'intestazione Authorization di una richiesta (null se manca). */
export function leggiAutorizzazione(intestazione: string | null | undefined): Autorizzazione {
  if (intestazione == null) return { tipo: "cookie" };
  const parti = /^Bearer[ \t]+(\S+)[ \t]*$/i.exec(intestazione.trim());
  const token = parti?.[1];
  if (!token || token.length > LUNGHEZZA_MASSIMA_TOKEN || !FORMA_JWT.test(token)) return { tipo: "non_valida" };
  return { tipo: "bearer", token };
}
