import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { LIMITI_RICHIESTE, chiaveLimite, ipDaIntestazioni, type AmbitoLimite } from "./richieste";

/**
 * Conta una richiesta di questa connessione per l'ambito e dice se è
 * consentita. In modalità demo (niente chiave segreta), senza IP o se il
 * database non risponde la richiesta passa: il limite protegge dagli abusi,
 * non deve bloccare chi usa il sito.
 */
export async function richiestaConsentita(ambito: AmbitoLimite): Promise<boolean> {
  const segreto = process.env.SUPABASE_SECRET_KEY;
  const db = createAdminClient();
  if (!db || !segreto) return true;
  const ip = ipDaIntestazioni(await headers());
  if (!ip) return true;

  const { massimo, finestraSecondi } = LIMITI_RICHIESTE[ambito];
  const { data, error } = await db.rpc("consuma_limite", {
    p_chiave: chiaveLimite(ambito, ip, segreto),
    p_massimo: massimo,
    p_finestra_secondi: finestraSecondi,
  });
  if (error) {
    console.error(`[limiti] ${ambito}: ${error.code ?? "?"} ${error.message}`);
    return true;
  }
  return data !== false;
}
