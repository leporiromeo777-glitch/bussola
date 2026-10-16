import { oggiZurigo } from "@/lib/conti/importi";
import { COLONNE_FATTURA, fatturaDaRiga, type RigaFattura } from "@/lib/conti/righe";
import { accediConti, corpoJson, erroreDatabase, errore, json, vuota } from "@/lib/conti/server";
import { MESSAGGI_CONTI, idValido, leggiPagamentoFattura } from "@/lib/conti/validazione";

/**
 * PATCH /api/conti/fatture/[id] — { pagataIl: "AAAA-MM-GG" | null } → { fattura }.
 * Pagata: il database crea (una volta sola) l'entrata confermata, origine
 * «fattura», categoria vendite; null: l'entrata sparisce. Ripetere la stessa
 * richiesta non cambia niente.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/conti/fatture/[id]">) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CONTI.nonTrovato);

  const corpo = await corpoJson(request);
  if (corpo === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const letto = leggiPagamentoFattura(corpo);
  if (!letto.ok) return errore(400, letto.messaggio);

  const { data, error } = await supabase
    .from("conti_fatture")
    .update({ pagata_il: letto.dati.pagataIl, aggiornato_il: new Date().toISOString() })
    .eq("id", id)
    .select(COLONNE_FATTURA)
    .maybeSingle();
  if (error) return erroreDatabase("pagamento della fattura", error);
  if (!data) return errore(404, MESSAGGI_CONTI.nonTrovato);
  return json(200, { fattura: fatturaDaRiga(data as unknown as RigaFattura, oggiZurigo()) });
}

/** DELETE /api/conti/fatture/[id] → 204. Se era pagata, sparisce anche la sua entrata. */
export async function DELETE(request: Request, ctx: RouteContext<"/api/conti/fatture/[id]">) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CONTI.nonTrovato);

  const { data, error } = await supabase.from("conti_fatture").delete().eq("id", id).select("id");
  if (error) return erroreDatabase("cancellazione della fattura", error);
  if (!data || data.length === 0) return errore(404, MESSAGGI_CONTI.nonTrovato);
  return vuota();
}
