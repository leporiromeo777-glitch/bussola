import "server-only";
import { errore, erroreDatabase } from "@/lib/conti/server";
import { MESSAGGI_ORE } from "./validazione";

/**
 * Errore del database per «Clienti e ore»: un cliente che non c'è (più) o di
 * un altro utente (chiave esterna, 23503) è un 404; il resto come nei conti.
 */
export function erroreOre(contesto: string, e: { code?: string; message?: string } | null) {
  if (e?.code === "23503") return errore(404, MESSAGGI_ORE.clienteNonTrovato);
  return erroreDatabase(contesto, e);
}
