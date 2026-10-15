import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicEnv } from "./env";

/**
 * Client Supabase per Server Components, Server Functions e Route Handlers.
 * Agisce come l'utente collegato (rispetta la RLS). Restituisce null se
 * Supabase non è configurato.
 */
export async function createClient() {
  const env = supabasePublicEnv();
  if (!env) return null;
  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chiamato da un Server Component: i cookie si aggiornano nel proxy.
        }
      },
    },
  });
}

/** Utente collegato (verificato sul server) oppure null. */
export async function getUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
