import "server-only";
import { informativaPrivacy } from "@/lib/privacy";

/**
 * true se la lista d'attesa salva davvero le iscrizioni: stesse condizioni di
 * archivioRaccolta in src/app/lista-attesa/azioni.ts (chiave segreta di
 * Supabase e informativa completa). Serve per non promettere una lista
 * «aperta» quando il modulo è in modalità demo.
 */
export function listaAttesaAttiva(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) && !informativaPrivacy.incompleta
  );
}
