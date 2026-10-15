"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicEnv } from "./env";

/** Client Supabase per i Client Components. Null se non configurato. */
export function createClient() {
  const env = supabasePublicEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.key);
}
