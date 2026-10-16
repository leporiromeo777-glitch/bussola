import { MESSAGGI } from "@/lib/chat/messaggi";
import { quotaPubblica } from "@/lib/chat/quota";
import { leggiQuota } from "@/lib/chat/server";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";

function json(status: number, corpo: Record<string, unknown>) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * GET /api/quota — domande alla chat disponibili questo mese per chi chiede
 * (token `Authorization: Bearer` dell'app oppure cookie del sito):
 * 200 { quota: QuotaPubblica }; 401 senza accesso; 503 in modalità demo o se
 * la quota non si può leggere.
 */
export async function GET(request: Request) {
  const utente = await utenteDaRichiesta(request);
  if (!utente.ok) {
    return utente.motivo === "non_configurato"
      ? json(503, { messaggio: MESSAGGI.modalitaDemo })
      : json(401, { messaggio: MESSAGGI.nonCollegato });
  }
  const quota = await leggiQuota(utente.supabase, utente.user.id);
  if (!quota) return json(503, { messaggio: MESSAGGI.quotaNonVerificabile });
  return json(200, { quota: quotaPubblica(quota) });
}
