import { aggiornamentoMovimento, COLONNE_MOVIMENTO, movimentoDaRiga, type RigaMovimento } from "@/lib/conti/righe";
import { accediConti, cancellaDocumento, corpoJson, erroreDatabase, errore, json, vuota } from "@/lib/conti/server";
import { MESSAGGI_CONTI, idValido, leggiModificaMovimento, unisciModifica } from "@/lib/conti/validazione";

/** Su un'entrata nata da una fattura si cambiano solo categoria e descrizione: il resto segue la fattura. */
const CAMPI_FATTURA = new Set(["categoria", "descrizione"]);

/**
 * PATCH /api/conti/movimenti/[id] — uno o più tra { stato: "confermato" | "privato",
 * categoria, importo, data, descrizione, controparte, tipo } → { movimento }.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/conti/movimenti/[id]">) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CONTI.nonTrovato);

  const corpo = await corpoJson(request);
  if (corpo === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const modifica = leggiModificaMovimento(corpo);
  if (!modifica.ok) return errore(400, modifica.messaggio);

  const attuale = await supabase.from("conti_movimenti").select("tipo, categoria, origine").eq("id", id).maybeSingle();
  if (attuale.error) return erroreDatabase("lettura del movimento", attuale.error);
  if (!attuale.data) return errore(404, MESSAGGI_CONTI.nonTrovato);

  if (attuale.data.origine === "fattura" && Object.keys(modifica.dati).some((campo) => !CAMPI_FATTURA.has(campo))) {
    return errore(409, MESSAGGI_CONTI.movimentoFattura);
  }
  const coerenti = unisciModifica(attuale.data, modifica.dati);
  if (!coerenti.ok) return errore(400, coerenti.messaggio);

  const { data, error } = await supabase
    .from("conti_movimenti")
    .update(aggiornamentoMovimento(modifica.dati, coerenti.dati, new Date().toISOString()))
    .eq("id", id)
    .select(COLONNE_MOVIMENTO)
    .maybeSingle();
  if (error) return erroreDatabase("modifica del movimento", error);
  if (!data) return errore(404, MESSAGGI_CONTI.nonTrovato);
  return json(200, { movimento: movimentoDaRiga(data as unknown as RigaMovimento) });
}

/**
 * DELETE /api/conti/movimenti/[id] → 204. Cancella anche il documento se
 * nessun'altra voce lo usa. L'entrata di una fattura pagata non si cancella
 * da sola: la fattura torna «da pagare» e l'entrata sparisce con lei.
 */
export async function DELETE(request: Request, ctx: RouteContext<"/api/conti/movimenti/[id]">) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CONTI.nonTrovato);

  const attuale = await supabase.from("conti_movimenti").select("fattura_id, documento_id").eq("id", id).maybeSingle();
  if (attuale.error) return erroreDatabase("lettura del movimento", attuale.error);
  if (!attuale.data) return errore(404, MESSAGGI_CONTI.nonTrovato);

  if (attuale.data.fattura_id) {
    const { error } = await supabase
      .from("conti_fatture")
      .update({ pagata_il: null, aggiornato_il: new Date().toISOString() })
      .eq("id", attuale.data.fattura_id);
    if (error) return erroreDatabase("fattura non più pagata", error);
    return vuota();
  }

  const { error } = await supabase.from("conti_movimenti").delete().eq("id", id);
  if (error) return erroreDatabase("cancellazione del movimento", error);

  const documentoId = attuale.data.documento_id as string | null;
  if (documentoId) {
    const altri = await supabase
      .from("conti_movimenti")
      .select("id", { count: "exact", head: true })
      .eq("documento_id", documentoId);
    if (!altri.error && altri.count === 0) await cancellaDocumento(supabase, documentoId);
  }
  return vuota();
}
