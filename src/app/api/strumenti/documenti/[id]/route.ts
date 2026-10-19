import { CORPO_DOCUMENTO_MASSIMO, idDocumentoValido, leggiDocumento, MESSAGGI_DOCUMENTI, rigaDocumento } from "@/lib/strumenti/account";
import { accediDocumenti, erroreCorpo, erroreDatabase, errore, json, leggiCorpo, vuota } from "@/lib/strumenti/server";

/**
 * PUT /api/strumenti/documenti/[id] — il documento intero dello strumento
 * (con lo stesso id) → { id, stato }. Lo crea o lo sostituisce: numero, data
 * e stato («bozza» o «pronto») li calcola il server dal contenuto.
 */
export async function PUT(request: Request, ctx: RouteContext<"/api/strumenti/documenti/[id]">) {
  const accesso = await accediDocumenti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;
  const { id } = await ctx.params;
  if (!idDocumentoValido(id)) return errore(404, MESSAGGI_DOCUMENTI.nonTrovato);

  const letto = await leggiCorpo(request, CORPO_DOCUMENTO_MASSIMO);
  if (!letto.ok) return erroreCorpo(letto.status);
  const doc = leggiDocumento(letto.corpo, id);
  if (!doc.ok) return errore(400, doc.messaggio);

  const riga = rigaDocumento(user.id, doc.dati, new Date().toISOString());
  const { data, error } = await supabase
    .from("preventivi_fatture")
    .upsert(riga, { onConflict: "user_id,id" })
    .select("id, stato")
    .single();
  if (error || !data) return erroreDatabase("salvataggio del documento", error);
  return json(200, data);
}

/** DELETE /api/strumenti/documenti/[id] → 204 (404 se non c'è). La fattura in «I tuoi conti», se registrata, resta. */
export async function DELETE(request: Request, ctx: RouteContext<"/api/strumenti/documenti/[id]">) {
  const accesso = await accediDocumenti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;
  const { id } = await ctx.params;
  if (!idDocumentoValido(id)) return errore(404, MESSAGGI_DOCUMENTI.nonTrovato);

  const { data, error } = await supabase
    .from("preventivi_fatture")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id)
    .select("id");
  if (error) return erroreDatabase("cancellazione del documento", error);
  if (!data || data.length === 0) return errore(404, MESSAGGI_DOCUMENTI.nonTrovato);
  return vuota();
}
