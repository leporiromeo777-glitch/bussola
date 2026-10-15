import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client con la chiave segreta: ignora la RLS. Solo sul server, solo per
 * operazioni senza utente (lista d'attesa, import delle fonti, quote).
 * Restituisce null se le variabili non sono impostate.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createSupabaseClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
