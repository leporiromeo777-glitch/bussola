import "server-only";
import { supabaseConfigured } from "@/lib/supabase/env";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";

/**
 * Id dell'utente se la richiesta ha un accesso valido (cookie del sito o
 * `Authorization: Bearer` dell'app), altrimenti null. Serve alle funzioni
 * che si usano anche senza accesso («Fotografa la lettera», «Racconta a
 * Bleo», «Nome della ditta», «Testi pronti»):
 * l'accesso decide solo come si conta il limite delle richieste, per
 * account invece che per connessione, perché dietro una connessione mobile
 * possono esserci molte persone. Un token scaduto o non valido vale come
 * nessun accesso (si conta per connessione).
 */
export async function utentePerLimite(request: Request): Promise<string | null> {
  if (!supabaseConfigured()) return null;
  const utente = await utenteDaRichiesta(request);
  return utente.ok ? utente.user.id : null;
}
