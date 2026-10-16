import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { LIMITI_RICHIESTE, chiaveLimite, ipDaIntestazioni, type AmbitoLimite } from "./richieste";

/**
 * - "consentita": richiesta contata, può passare;
 * - "superato": troppe richieste da questa connessione;
 * - "non_disponibile": il limite non si può verificare (modalità demo senza
 *   chiave segreta, IP sconosciuto o database che non risponde).
 */
export type EsitoLimite = "consentita" | "superato" | "non_disponibile";

/** Conta una richiesta di questa connessione per l'ambito e dice com'è andata. */
export async function controllaLimite(ambito: AmbitoLimite): Promise<EsitoLimite> {
  const segreto = process.env.SUPABASE_SECRET_KEY;
  const db = createAdminClient();
  if (!db || !segreto) return "non_disponibile";
  const ip = ipDaIntestazioni(await headers());
  if (!ip) return "non_disponibile";

  const { massimo, finestraSecondi } = LIMITI_RICHIESTE[ambito];
  const { data, error } = await db.rpc("consuma_limite", {
    p_chiave: chiaveLimite(ambito, ip, segreto),
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
 * rifiutare quando il limite non è disponibile.
 */
export async function richiestaConsentita(ambito: AmbitoLimite): Promise<boolean> {
  return (await controllaLimite(ambito)) !== "superato";
}
