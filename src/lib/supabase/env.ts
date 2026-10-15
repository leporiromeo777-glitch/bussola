/** Variabili pubbliche di Supabase (disponibili anche nel browser). */
export function supabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

/** true se Supabase è configurato; senza, l'app funziona in modalità demo. */
export function supabaseConfigured() {
  return supabasePublicEnv() !== null;
}
