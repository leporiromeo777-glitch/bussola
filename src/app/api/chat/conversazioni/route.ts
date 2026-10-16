import type { RispostaElencoChat } from "@/lib/chat/conversazioni";
import { accediChat, elencoChat, json, rispostaErrore } from "@/lib/chat/conversazioni-server";
import { MESSAGGI } from "@/lib/chat/messaggi";

/**
 * GET /api/chat/conversazioni → RispostaElencoChat: le ultime 200 chat
 * dell'utente, dalla più recente. Accesso con i cookie del sito o con
 * `Authorization: Bearer <access_token>` dall'app.
 */
export async function GET(request: Request) {
  const accesso = await accediChat(request);
  if (!accesso.ok) return accesso.risposta;
  const conversazioni = await elencoChat(accesso.supabase);
  if (!conversazioni) return rispostaErrore(503, MESSAGGI.chatNonDisponibili);
  return json(200, { conversazioni } satisfies RispostaElencoChat);
}
