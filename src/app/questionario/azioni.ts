"use server";

import { utenteCollegato } from "@/lib/percorso/account";
import { VERSIONE_REGOLE } from "@/lib/percorso/regole";
import { leggiRisposte } from "@/lib/percorso/risposte";
import type { EsitoSalvataggio } from "@/lib/percorso/salvataggio";

/**
 * Salva le risposte del questionario nell'account dell'utente collegato
 * (tabella questionari, protetta dalla RLS). Senza accesso non fa nulla: le
 * risposte restano nel browser.
 */
export async function salvaRisposte(dati: unknown): Promise<EsitoSalvataggio> {
  const risposte = leggiRisposte(dati);
  if (!risposte) return { ok: false, motivo: "non_valide" };
  try {
    const collegamento = await utenteCollegato();
    if (!collegamento.ok) return collegamento;
    const { supabase, userId } = collegamento;
    const { error } = await supabase.from("questionari").upsert(
      {
        user_id: userId,
        risposte,
        versione_regole: VERSIONE_REGOLE,
        aggiornato_il: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    return error ? { ok: false, motivo: "errore" } : { ok: true };
  } catch {
    return { ok: false, motivo: "errore" };
  }
}
