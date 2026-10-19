"use server";

import { utenteCollegato } from "@/lib/percorso/account";
import { salvaRisposteUtente } from "@/lib/percorso/account-utente";
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
    const { error } = await salvaRisposteUtente(supabase, userId, risposte);
    return error ? { ok: false, motivo: "errore" } : { ok: true };
  } catch {
    return { ok: false, motivo: "errore" };
  }
}
