import "server-only";

/**
 * «Calendario sempre aggiornato» sul server: quando è attivo e i messaggi
 * delle API. Nei log solo codici: mai token, impronte o risposte.
 */

/**
 * Il link funziona solo se il server può leggere il calendario senza
 * l'utente: servono Supabase e la chiave segreta (SUPABASE_SECRET_KEY).
 */
export function calendarioAttivo(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() &&
    env.SUPABASE_SECRET_KEY?.trim(),
  );
}

export const MESSAGGI_CALENDARIO = {
  nonAttivo: "Il calendario sempre aggiornato non è ancora attivo.",
  nonCollegato: "Accedi per avere il link del tuo calendario.",
  erroreDatabase: "Non sono riuscito a leggere il tuo calendario. Riprova tra poco.",
  risposteNonValide: "Le risposte del questionario non sono valide: rifai il questionario e riprova.",
} as const;

export function registraCalendario(contesto: string, dettagli: { code?: string | null } = {}) {
  console.error(`[calendario] ${contesto}`, { code: dettagli.code ?? null });
}

export function jsonCalendario(status: number, corpo: unknown) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}
