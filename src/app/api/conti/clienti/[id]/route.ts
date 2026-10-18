import { clienteDaRiga, colonneCliente, COLONNE_CLIENTE, type RigaCliente } from "@/lib/clienti/righe";
import { erroreOre } from "@/lib/clienti/server";
import { leggiModificaCliente } from "@/lib/clienti/validazione";
import { accediConti, corpoJson, errore, json, vuota } from "@/lib/conti/server";
import { idValido, MESSAGGI_CONTI } from "@/lib/conti/validazione";

/** PATCH /api/conti/clienti/[id] — uno o più campi del cliente → { cliente }. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/conti/clienti/[id]">) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CONTI.nonTrovato);

  const corpo = await corpoJson(request);
  if (corpo === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const letto = leggiModificaCliente(corpo);
  if (!letto.ok) return errore(400, letto.messaggio);

  const { data, error } = await supabase
    .from("conti_clienti")
    .update({ ...colonneCliente(letto.dati), aggiornato_il: new Date().toISOString() })
    .eq("id", id)
    .select(COLONNE_CLIENTE)
    .maybeSingle();
  if (error) return erroreOre("modifica del cliente", error);
  if (!data) return errore(404, MESSAGGI_CONTI.nonTrovato);
  return json(200, { cliente: clienteDaRiga(data as unknown as RigaCliente) });
}

/** DELETE /api/conti/clienti/[id] → 204. Si cancellano anche le sue ore (on delete cascade). */
export async function DELETE(request: Request, ctx: RouteContext<"/api/conti/clienti/[id]">) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CONTI.nonTrovato);

  const { data, error } = await supabase.from("conti_clienti").delete().eq("id", id).select("id");
  if (error) return erroreOre("cancellazione del cliente", error);
  if (!data || data.length === 0) return errore(404, MESSAGGI_CONTI.nonTrovato);
  return vuota();
}
