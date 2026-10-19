import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";
import { MESSAGGI_DOCUMENTI } from "./account";

/**
 * «Preventivo e fattura» nell'account, sul server: accesso (cookie del sito
 * o `Authorization: Bearer` dell'app), risposte JSON ed errori del database.
 * Tutto con il client dell'utente (RLS), mai con la chiave segreta. Nei log
 * solo codici: mai nomi, indirizzi, IBAN o voci.
 */

export function registra(contesto: string, dettagli: Record<string, unknown> = {}) {
  console.error(`[preventivi e fatture] ${contesto}`, dettagli);
}

export function json(status: number, corpo: unknown) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

export function errore(status: number, messaggio: string) {
  return json(status, { messaggio });
}

export function vuota() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

/** Errore del database come risposta: troppi documenti (trigger) o errore generico. */
export function erroreDatabase(contesto: string, e: { code?: string } | null) {
  registra(contesto, { code: e?.code ?? null });
  if (e?.code === "54000") return errore(409, MESSAGGI_DOCUMENTI.troppi);
  // Tabelle che non ci sono ancora (migrazione non eseguita): la funzione non è attiva.
  if (e?.code === "42P01" || e?.code === "PGRST205") return errore(503, MESSAGGI_DOCUMENTI.nonAttivo);
  return errore(503, MESSAGGI_DOCUMENTI.erroreDatabase);
}

export type AccessoDocumenti = { ok: true; supabase: SupabaseClient; user: User } | { ok: false; risposta: Response };

/** Utente della richiesta con il suo client (RLS). 503 in modalità demo, 401 senza accesso. */
export async function accediDocumenti(request: Request): Promise<AccessoDocumenti> {
  const utente = await utenteDaRichiesta(request);
  if (utente.ok) return utente;
  return {
    ok: false,
    risposta:
      utente.motivo === "non_configurato"
        ? errore(503, MESSAGGI_DOCUMENTI.nonAttivo)
        : errore(401, MESSAGGI_DOCUMENTI.nonCollegato),
  };
}

export type CorpoLetto = { ok: true; corpo: unknown } | { ok: false; status: 400 | 413 | 415 };

/** Corpo JSON della richiesta, con un limite di caratteri. */
export async function leggiCorpo(request: Request, massimo: number): Promise<CorpoLetto> {
  if (!request.headers.get("content-type")?.includes("application/json")) return { ok: false, status: 415 };
  const lunghezza = Number(request.headers.get("content-length"));
  if (Number.isFinite(lunghezza) && lunghezza > massimo) return { ok: false, status: 413 };
  try {
    const testo = await request.text();
    if (testo.length > massimo) return { ok: false, status: 413 };
    return { ok: true, corpo: JSON.parse(testo) as unknown };
  } catch {
    return { ok: false, status: 400 };
  }
}

/** Risposta per un corpo che non si è potuto leggere. */
export function erroreCorpo(status: 400 | 413 | 415) {
  return errore(status, status === 413 ? MESSAGGI_DOCUMENTI.troppoLungo : MESSAGGI_DOCUMENTI.richiestaNonValida);
}
