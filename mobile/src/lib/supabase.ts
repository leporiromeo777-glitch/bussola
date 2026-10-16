/**
 * Accesso con un codice via email (Supabase). La sessione resta salvata sul
 * telefono; la chat la manda al sito come "Authorization: Bearer".
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CHIAVE, SUPABASE_URL } from "./config";
import { archivioAsincrono } from "./memoria";

let client: SupabaseClient | null | undefined;

/** Null nella versione di prova (Supabase non configurato nell'app). */
export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  client =
    SUPABASE_URL && SUPABASE_CHIAVE
      ? createClient(SUPABASE_URL, SUPABASE_CHIAVE, {
          auth: {
            storage: archivioAsincrono,
            storageKey: "bleo:app:sessione",
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        })
      : null;
  return client;
}
