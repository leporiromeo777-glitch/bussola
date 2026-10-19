import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";
import { MESSAGGI_SALVATI } from "./salvati";
import { errore } from "./server";

/**
 * Budget e business plan nell'account, sul server: accesso (cookie del sito
 * o `Authorization: Bearer` dell'app) ed errori del database. Tutto con il
 * client dell'utente (RLS), mai con la chiave segreta. Nei log solo codici:
 * mai cifre, nomi o testi dello strumento.
 */

export function registraSalvati(contesto: string, dettagli: Record<string, unknown> = {}) {
  console.error(`[budget e business plan] ${contesto}`, dettagli);
}

/** Errore del database come risposta. */
export function erroreDatabaseSalvati(contesto: string, e: { code?: string } | null) {
  registraSalvati(contesto, { code: e?.code ?? null });
  // Tabella che non c'è ancora (migrazione non eseguita): la funzione non è attiva.
  if (e?.code === "42P01" || e?.code === "PGRST205") return errore(503, MESSAGGI_SALVATI.nonAttivo);
  // Vincolo del contenuto (troppo grande o con la forma sbagliata).
  if (e?.code === "23514") return errore(400, MESSAGGI_SALVATI.datiNonValidi);
  return errore(503, MESSAGGI_SALVATI.erroreDatabase);
}

export type AccessoSalvati = { ok: true; supabase: SupabaseClient; user: User } | { ok: false; risposta: Response };

/** Utente della richiesta con il suo client (RLS). 503 in modalità demo, 401 senza accesso. */
export async function accediSalvati(request: Request): Promise<AccessoSalvati> {
  const utente = await utenteDaRichiesta(request);
  if (utente.ok) return utente;
  return {
    ok: false,
    risposta:
      utente.motivo === "non_configurato"
        ? errore(503, MESSAGGI_SALVATI.nonAttivo)
        : errore(401, MESSAGGI_SALVATI.nonCollegato),
  };
}

/** Risposta per un corpo che non si è potuto leggere. */
export function erroreCorpoSalvati(status: 400 | 413 | 415) {
  return errore(status, status === 413 ? MESSAGGI_SALVATI.troppoLungo : MESSAGGI_SALVATI.richiestaNonValida);
}
