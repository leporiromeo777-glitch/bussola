"use server";

import { eIdPasso, ID_PASSI } from "@/data/passi";
import { utenteCollegato } from "@/lib/percorso/account";
import { segnaPassiUtente } from "@/lib/percorso/account-utente";
import type { EsitoSalvataggio } from "@/lib/percorso/salvataggio";

/** Segna un passo come fatto (inserisce) o da fare (cancella) per l'utente collegato. */
export async function segnaPasso(passoId: unknown, fatto: unknown): Promise<EsitoSalvataggio> {
  if (!eIdPasso(passoId) || typeof fatto !== "boolean") return { ok: false, motivo: "non_valide" };
  try {
    const collegamento = await utenteCollegato();
    if (!collegamento.ok) return collegamento;
    const { supabase, userId } = collegamento;
    const { error } = await segnaPassiUtente(
      supabase,
      userId,
      fatto ? { fatti: [passoId], daFare: [] } : { fatti: [], daFare: [passoId] },
    );
    return error ? { ok: false, motivo: "errore" } : { ok: true };
  } catch {
    return { ok: false, motivo: "errore" };
  }
}

/**
 * Copia nell'account i passi fatti nel browser prima dell'accesso. Aggiunge
 * soltanto: non cancella i passi già salvati.
 */
export async function sincronizzaPassi(passiIds: unknown): Promise<EsitoSalvataggio> {
  if (!Array.isArray(passiIds) || passiIds.length > ID_PASSI.length * 2) return { ok: false, motivo: "non_valide" };
  const passi = [...new Set(passiIds.filter(eIdPasso))];
  if (passi.length === 0) return { ok: true };
  try {
    const collegamento = await utenteCollegato();
    if (!collegamento.ok) return collegamento;
    const { supabase, userId } = collegamento;
    const { error } = await segnaPassiUtente(supabase, userId, { fatti: passi, daFare: [] });
    return error ? { ok: false, motivo: "errore" } : { ok: true };
  } catch {
    return { ok: false, motivo: "errore" };
  }
}
