import "server-only";
import type { InviaEmail } from "./iscrizione";

export const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** true se l'invio delle email è configurato (chiave Resend e mittente). */
export function emailConfigurata(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_MITTENTE);
}

/**
 * Invio tramite l'API REST di Resend (senza SDK). Restituisce null se
 * RESEND_API_KEY o EMAIL_MITTENTE mancano: l'iscrizione si salva comunque.
 */
export function creaInvioEmail(): InviaEmail | null {
  const chiave = process.env.RESEND_API_KEY;
  const mittente = process.env.EMAIL_MITTENTE;
  if (!chiave || !mittente) return null;

  return async (messaggio) => {
    try {
      const risposta = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${chiave}`,
          "Content-Type": "application/json",
          ...(messaggio.chiaveIdempotenza ? { "Idempotency-Key": messaggio.chiaveIdempotenza } : {}),
        },
        body: JSON.stringify({
          from: mittente,
          to: messaggio.a,
          subject: messaggio.oggetto,
          html: messaggio.html,
          text: messaggio.testo,
          ...(messaggio.intestazioni ? { headers: messaggio.intestazioni } : {}),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!risposta.ok) {
        // Solo lo stato: il corpo dell'errore può contenere l'indirizzo.
        console.error(`[lista-attesa] Resend ha risposto ${risposta.status}`);
        return false;
      }
      return true;
    } catch (errore) {
      console.error("[lista-attesa] invio email non riuscito:", errore instanceof Error ? errore.name : "errore");
      return false;
    }
  };
}
