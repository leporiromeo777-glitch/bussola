import { DURATA_LINK_DOCUMENTO } from "@/lib/conti/limiti";
import { BUCKET_RICEVUTE, accediConti, erroreDatabase, errore, json, registra } from "@/lib/conti/server";
import { MESSAGGI_CONTI, idValido } from "@/lib/conti/validazione";

/**
 * GET /api/conti/documenti/[id] → { url }: link temporaneo (2 minuti) per
 * vedere la ricevuta salvata. Solo i documenti dell'utente (RLS sulla
 * tabella e sullo Storage).
 */
export async function GET(request: Request, ctx: RouteContext<"/api/conti/documenti/[id]">) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CONTI.nonTrovato);

  const { data, error } = await supabase.from("conti_documenti").select("percorso").eq("id", id).maybeSingle();
  if (error) return erroreDatabase("lettura del documento", error);
  if (!data) return errore(404, MESSAGGI_CONTI.nonTrovato);

  const link = await supabase.storage.from(BUCKET_RICEVUTE).createSignedUrl(data.percorso as string, DURATA_LINK_DOCUMENTO);
  if (link.error || !link.data?.signedUrl) {
    registra("link del documento", { errore: link.error?.name ?? null });
    return errore(503, MESSAGGI_CONTI.documentoNonDisponibile);
  }
  return json(200, { url: link.data.signedUrl });
}
