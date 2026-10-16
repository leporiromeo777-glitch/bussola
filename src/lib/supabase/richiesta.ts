import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { leggiAutorizzazione } from "./bearer";
import { supabasePublicEnv } from "./env";
import { createClient } from "./server";

/**
 * Client Supabase che agisce come l'utente del token (access token di
 * Supabase Auth, per esempio dall'app): PostgREST riceve il JWT e la RLS vale
 * come con i cookie. Null se Supabase non è configurato.
 * Il token va verificato a parte (vedi utenteDaRichiesta).
 */
export function createBearerClient(token: string): SupabaseClient | null {
  const env = supabasePublicEnv();
  if (!env) return null;
  return createSupabaseClient(env.url, env.key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export type UtenteRichiesta =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; motivo: "non_configurato" | "non_collegato" };

/**
 * Utente di una richiesta a un Route Handler, verificato da Supabase Auth, e
 * il suo client (RLS). Vale il token `Authorization: Bearer` se c'è (app),
 * altrimenti la sessione del sito con i cookie, come prima.
 */
export async function utenteDaRichiesta(request: Request): Promise<UtenteRichiesta> {
  const autorizzazione = leggiAutorizzazione(request.headers.get("authorization"));

  if (autorizzazione.tipo === "cookie") {
    const supabase = await createClient();
    if (!supabase) return { ok: false, motivo: "non_configurato" };
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { ok: false, motivo: "non_collegato" };
    return { ok: true, supabase, user: data.user };
  }

  if (!supabasePublicEnv()) return { ok: false, motivo: "non_configurato" };
  if (autorizzazione.tipo === "non_valida") return { ok: false, motivo: "non_collegato" };

  const supabase = createBearerClient(autorizzazione.token);
  if (!supabase) return { ok: false, motivo: "non_configurato" };
  // getUser(token) chiede a Supabase Auth: un token scaduto, falso o di un
  // utente eliminato non passa.
  const { data, error } = await supabase.auth.getUser(autorizzazione.token);
  if (error || !data.user) return { ok: false, motivo: "non_collegato" };
  return { ok: true, supabase, user: data.user };
}
