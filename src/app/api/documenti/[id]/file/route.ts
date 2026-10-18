import { accediCassetto, errore, json, linkDocumento } from "@/lib/cassetto/server";
import { MESSAGGI_CASSETTO } from "@/lib/cassetto/validazione";
import { idValido } from "@/lib/conti/validazione";

/**
 * GET /api/documenti/[id]/file → { url }: link temporaneo (60 secondi) per
 * aprire il file. Solo i documenti dell'utente (RLS sulla tabella e sullo
 * Storage): chi ha il link di un altro non lo può rinnovare.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/documenti/[id]/file">) {
  const accesso = await accediCassetto(request);
  if (!accesso.ok) return accesso.risposta;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CASSETTO.nonTrovato);

  const link = await linkDocumento(accesso.supabase, id);
  if (link.esito === "non_trovato") return errore(404, MESSAGGI_CASSETTO.nonTrovato);
  if (link.esito === "errore") return errore(503, MESSAGGI_CASSETTO.documentoNonDisponibile);
  return json(200, { url: link.url });
}
