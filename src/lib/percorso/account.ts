import "server-only";
import { unstable_rethrow } from "next/navigation";
import { eIdPasso } from "@/data/passi";
import { createClient } from "@/lib/supabase/server";
import { leggiRisposte } from "./risposte";
import { ACCOUNT_VUOTO, type DatiAccount } from "./sincronizza";

type ClienteSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

export type Collegamento =
  | { ok: true; supabase: ClienteSupabase; userId: string; email: string | null }
  | { ok: false; motivo: "non_configurato" | "non_collegato" };

/** Client Supabase dell'utente collegato (RLS), oppure il motivo per cui non c'è. */
export async function utenteCollegato(): Promise<Collegamento> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, motivo: "non_configurato" };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { ok: false, motivo: "non_collegato" };
  return { ok: true, supabase, userId: data.user.id, email: data.user.email ?? null };
}

/**
 * Risposte e passi fatti salvati nell'account. Non lancia mai errori: senza
 * Supabase, senza accesso o se il database non risponde restituisce un
 * account vuoto e la pagina usa i dati del browser.
 */
export async function leggiDatiAccount(): Promise<DatiAccount> {
  try {
    const collegamento = await utenteCollegato();
    if (!collegamento.ok) return ACCOUNT_VUOTO;
    const { supabase, userId, email } = collegamento;
    const [questionario, passi] = await Promise.all([
      supabase.from("questionari").select("risposte, aggiornato_il").eq("user_id", userId).maybeSingle(),
      supabase.from("passi_completati").select("passo_id").eq("user_id", userId),
    ]);
    const riga = questionario.error ? null : (questionario.data as { risposte: unknown; aggiornato_il: string } | null);
    const risposte = riga ? leggiRisposte(riga.risposte) : null;
    const righePassi = passi.error ? [] : ((passi.data ?? []) as { passo_id: unknown }[]);
    return {
      collegato: true,
      userId,
      email,
      risposte,
      aggiornatoIl: risposte ? (riga?.aggiornato_il ?? null) : null,
      passiFatti: righePassi.map((r) => r.passo_id).filter(eIdPasso),
    };
  } catch (errore) {
    // Gli errori interni di Next (per esempio il rendering dinamico) devono passare.
    unstable_rethrow(errore);
    return ACCOUNT_VUOTO;
  }
}
