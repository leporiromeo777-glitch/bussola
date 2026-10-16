import type { ConversazioneBreve, RispostaChat } from "@/lib/chat/conversazioni";
import {
  accediChat,
  eliminaChat,
  json,
  leggiChat,
  rinominaChat,
  rispostaErrore,
} from "@/lib/chat/conversazioni-server";
import { MESSAGGI } from "@/lib/chat/messaggi";
import { leggiTitolo } from "@/lib/chat/storico";

type Contesto = RouteContext<"/api/chat/conversazioni/[id]">;

/** GET /api/chat/conversazioni/[id] → RispostaChat: la chat con tutti i messaggi in ordine. */
export async function GET(request: Request, ctx: Contesto) {
  const accesso = await accediChat(request);
  if (!accesso.ok) return accesso.risposta;
  const { id } = await ctx.params;
  const chat = await leggiChat(accesso.supabase, id);
  if (chat.tipo === "non_trovata") return rispostaErrore(404, MESSAGGI.chatNonTrovata);
  if (chat.tipo === "errore") return rispostaErrore(503, MESSAGGI.chatNonDisponibili);
  return json(200, { conversazione: chat.conversazione, messaggi: chat.messaggi } satisfies RispostaChat);
}

/** PATCH /api/chat/conversazioni/[id] — { titolo } → { conversazione }. */
export async function PATCH(request: Request, ctx: Contesto) {
  const accesso = await accediChat(request);
  if (!accesso.ok) return accesso.risposta;
  const { id } = await ctx.params;
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return rispostaErrore(400, MESSAGGI.richiestaNonValida);
  }
  const titolo = leggiTitolo(corpo);
  if (!titolo.ok) return rispostaErrore(400, titolo.messaggio);
  const esito = await rinominaChat(accesso.supabase, id, titolo.titolo);
  if (esito.tipo === "non_trovata") return rispostaErrore(404, MESSAGGI.chatNonTrovata);
  if (esito.tipo === "errore") return rispostaErrore(503, MESSAGGI.chatNonDisponibili);
  return json(200, { conversazione: esito.valore } satisfies { conversazione: ConversazioneBreve });
}

/** DELETE /api/chat/conversazioni/[id] → 204: cancella la chat con tutti i messaggi. */
export async function DELETE(request: Request, ctx: Contesto) {
  const accesso = await accediChat(request);
  if (!accesso.ok) return accesso.risposta;
  const { id } = await ctx.params;
  const esito = await eliminaChat(accesso.supabase, id);
  if (esito.tipo === "non_trovata") return rispostaErrore(404, MESSAGGI.chatNonTrovata);
  if (esito.tipo === "errore") return rispostaErrore(503, MESSAGGI.chatNonDisponibili);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
