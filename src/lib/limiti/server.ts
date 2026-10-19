import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { LIMITI_RICHIESTE, chiaveLimite, chiaveLimiteUtente, ipDaIntestazioni, type AmbitoLimite } from "./richieste";

/**
 * - "consentita": richiesta contata, può passare;
 * - "superato": troppe richieste da questa connessione;
 * - "non_disponibile": il limite non si può verificare (modalità demo senza
 *   chiave segreta, IP sconosciuto o database che non risponde).
 */
export type EsitoLimite = "consentita" | "superato" | "non_disponibile";

/**
 * Conta una richiesta per l'ambito e dice com'è andata. Di solito conta per
 * connessione (impronta dell'IP); con `utenteId` (accesso verificato) conta
 * per account, con lo stesso limite.
 */
export async function controllaLimite(
  ambito: AmbitoLimite,
  opzioni: { utenteId?: string | null } = {},
): Promise<EsitoLimite> {
  const segreto = process.env.SUPABASE_SECRET_KEY;
  const db = createAdminClient();
  if (!db || !segreto) return "non_disponibile";
  let chiave: string;
  if (opzioni.utenteId) {
    chiave = chiaveLimiteUtente(ambito, opzioni.utenteId, segreto);
  } else {
    const ip = ipDaIntestazioni(await headers());
    if (!ip) return "non_disponibile";
    chiave = chiaveLimite(ambito, ip, segreto);
  }

  const { massimo, finestraSecondi } = LIMITI_RICHIESTE[ambito];
  const { data, error } = await db.rpc("consuma_limite", {
    p_chiave: chiave,
    p_massimo: massimo,
    p_finestra_secondi: finestraSecondi,
  });
  if (error) {
    console.error(`[limiti] ${ambito}: ${error.code ?? "?"} ${error.message}`);
    return "non_disponibile";
  }
  return data === false ? "superato" : "consentita";
}

/**
 * Dice se la richiesta è consentita. Se il limite non si può verificare la
 * richiesta passa: qui il limite protegge dagli abusi, non deve bloccare chi
 * usa il sito. Per le azioni che costano (Claude) usare controllaLimite e
 * rifiutare quando il limite non è disponibile. Con `utenteId` conta per
 * account, come controllaLimite.
 */
export async function richiestaConsentita(
  ambito: AmbitoLimite,
  opzioni: { utenteId?: string | null } = {},
): Promise<boolean> {
  return (await controllaLimite(ambito, opzioni)) !== "superato";
}
