import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { eIdPasso } from "@/data/passi";
import { momentoIso, type ModifichePassi, type PercorsoAccount } from "./account-api";
import { VERSIONE_REGOLE } from "./regole";
import { leggiRisposte, type Risposte } from "./risposte";

/**
 * Il percorso nell'account, sul server, con il client dell'utente (RLS):
 * lo usano le server action del sito (questionario e percorso), l'API per
 * l'app (src/app/api/percorso) e il calendario. Una sola strada per leggere
 * e scrivere le tabelle questionari e passi_completati.
 */

export type ErroreDatabase = { code?: string } | null;

export type EsitoLettura = { ok: true; dati: PercorsoAccount } | { ok: false; errore: ErroreDatabase };

/**
 * Risposte e passi fatti dell'utente. Se una delle due letture non riesce,
 * errore: chi sincronizza non deve scambiare un errore per un account vuoto.
 */
export async function leggiPercorsoUtente(supabase: SupabaseClient, userId: string): Promise<EsitoLettura> {
  const [questionario, passi] = await Promise.all([
    supabase.from("questionari").select("risposte, aggiornato_il").eq("user_id", userId).maybeSingle(),
    supabase.from("passi_completati").select("passo_id").eq("user_id", userId),
  ]);
  if (questionario.error) return { ok: false, errore: questionario.error };
  if (passi.error) return { ok: false, errore: passi.error };
  const riga = questionario.data as { risposte: unknown; aggiornato_il: unknown } | null;
  const risposte = riga ? leggiRisposte(riga.risposte) : null;
  const righePassi = (passi.data ?? []) as { passo_id: unknown }[];
  return {
    ok: true,
    dati: {
      risposte,
      aggiornatoIl: risposte ? momentoIso(riga?.aggiornato_il) : null,
      passiFatti: [...new Set(righePassi.map((r) => r.passo_id).filter(eIdPasso))],
    },
  };
}

/** Salva (o sostituisce) le risposte del questionario, con la versione delle regole e il momento. */
export async function salvaRisposteUtente(
  supabase: SupabaseClient,
  userId: string,
  risposte: Risposte,
): Promise<{ error: ErroreDatabase }> {
  const { error } = await supabase.from("questionari").upsert(
    {
      user_id: userId,
      risposte,
      versione_regole: VERSIONE_REGOLE,
      aggiornato_il: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  return { error: error ?? null };
}

/** Segna passi come fatti (inserisce, senza doppioni) e come da fare (cancella). */
export async function segnaPassiUtente(
  supabase: SupabaseClient,
  userId: string,
  { fatti, daFare }: ModifichePassi,
): Promise<{ error: ErroreDatabase }> {
  if (daFare.length > 0) {
    const { error } = await supabase.from("passi_completati").delete().eq("user_id", userId).in("passo_id", daFare);
    if (error) return { error };
  }
  if (fatti.length > 0) {
    const { error } = await supabase.from("passi_completati").upsert(
      fatti.map((passo_id) => ({ user_id: userId, passo_id })),
      { onConflict: "user_id,passo_id", ignoreDuplicates: true },
    );
    if (error) return { error };
  }
  return { error: null };
}
