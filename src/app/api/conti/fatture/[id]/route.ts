import { oggiZurigo } from "@/lib/conti/importi";
import { COLONNE_FATTURA, aggiornamentoSollecito, fatturaDaRiga, type RigaFattura } from "@/lib/conti/righe";
import { accediConti, corpoJson, erroreDatabase, errore, json, vuota } from "@/lib/conti/server";
import { MESSAGGI_CONTI, idValido, leggiPagamentoFattura, leggiSollecitoFattura } from "@/lib/conti/validazione";

/**
 * PATCH /api/conti/fatture/[id] → { fattura }, con uno di questi corpi:
 * - { pagataIl: "AAAA-MM-GG" | null }: pagata, il database crea (una volta
 *   sola) l'entrata confermata, origine «fattura», categoria vendite; null:
 *   l'entrata sparisce. Ripetere la stessa richiesta non cambia niente.
 * - { sollecito: { livello: 1 | 2, inviatoIl: "AAAA-MM-GG" } | null }:
 *   l'ultimo sollecito che l'utente ha mandato al cliente (il testo lo manda
 *   lui, Bleo non lo riceve); null lo toglie.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/conti/fatture/[id]">) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;
  const { id } = await ctx.params;
  if (!idValido(id)) return errore(404, MESSAGGI_CONTI.nonTrovato);

  const corpo = await corpoJson(request);
  if (corpo === null || typeof corpo !== "object") return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const oggi = oggiZurigo();
  const adesso = new Date().toISOString();

  let modifica: Record<string, unknown>;
  if ("sollecito" in corpo) {
    const letto = leggiSollecitoFattura(corpo, oggi);
    if (!letto.ok) return errore(400, letto.messaggio);
    modifica = aggiornamentoSollecito(letto.dati.sollecito, adesso);
  } else {
    const letto = leggiPagamentoFattura(corpo);
    if (!letto.ok) return errore(400, letto.messaggio);
    modifica = { pagata_il: letto.dati.pagataIl, aggiornato_il: adesso };
  }

  const { data, error } = await supabase
    .from("conti_fatture")
    .update(modifica)
    .eq("id", id)
    .select(COLONNE_FATTURA)
    .maybeSingle();
  // Vincolo conti_fatture_sollecito: il sollecito non può essere prima della fattura.
  if (error?.code === "23514" && "sollecito" in corpo) return errore(400, MESSAGGI_CONTI.sollecitoPrima);
  if (error) return erroreDatabase("modifica della fattura", error);
  if (!data) return errore(404, MESSAGGI_CONTI.nonTrovato);
  return json(200, { fattura: fatturaDaRiga(data as unknown as RigaFattura, oggi) });
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
