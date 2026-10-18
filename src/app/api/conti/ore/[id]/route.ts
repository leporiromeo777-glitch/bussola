import { accediConti, corpoJson, errore, json, vuota } from "@/lib/conti/server";
import { idValido, MESSAGGI_CONTI } from "@/lib/conti/validazione";
import { aggiornamentoVoce, COLONNE_ORE, voceDaRiga, type RigaOre } from "@/lib/clienti/righe";
import { erroreOre } from "@/lib/clienti/server";
import { leggiModificaVoce, MESSAGGI_ORE, modificaAmmessaSuFatturata } from "@/lib/clienti/validazione";

/**
 * PATCH /api/conti/ore/[id] — uno o più tra { clienteId, data, minuti,
 * descrizione, tariffa, fatturataIl } → { voce }. Una voce già fatturata si
 * cambia solo togliendo prima il segno: { fatturataIl: null }.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/conti/ore/[id]">) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_ORE.nonTrovato);

  const corpo = await corpoJson(request);
  if (corpo === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const modifica = leggiModificaVoce(corpo);
  if (!modifica.ok) return errore(400, modifica.messaggio);

  // Una voce fatturata si cambia solo nel segno «fatturata»: la condizione sta nella stessa modifica.
  const soloSegno = modificaAmmessaSuFatturata(modifica.dati);
  let query = supabase.from("conti_ore").update(aggiornamentoVoce(modifica.dati, new Date().toISOString())).eq("id", id);
  if (!soloSegno) query = query.is("fatturata_il", null);
  const { data, error } = await query.select(COLONNE_ORE).maybeSingle();
  if (error) return erroreOre("modifica della voce", error);
  if (!data) {
    if (soloSegno) return errore(404, MESSAGGI_ORE.nonTrovato);
    const esiste = await supabase.from("conti_ore").select("id").eq("id", id).maybeSingle();
    return esiste.data ? errore(409, MESSAGGI_ORE.giaFatturata) : errore(404, MESSAGGI_ORE.nonTrovato);
  }
  return json(200, { voce: voceDaRiga(data as unknown as RigaOre) });
}

/** DELETE /api/conti/ore/[id] → 204. */
export async function DELETE(request: Request, ctx: RouteContext<"/api/conti/ore/[id]">) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_ORE.nonTrovato);

  const { data, error } = await supabase.from("conti_ore").delete().eq("id", id).select("id");
  if (error) return erroreOre("cancellazione della voce", error);
  if (!data || data.length === 0) return errore(404, MESSAGGI_ORE.nonTrovato);
  return vuota();
}
