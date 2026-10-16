import { COLONNE_MOVIMENTO, movimentoDaRiga, rigaNuovoMovimento, type RigaMovimento } from "@/lib/conti/righe";
import { accediConti, corpoJson, erroreDatabase, errore, json } from "@/lib/conti/server";
import { MESSAGGI_CONTI, leggiNuovoMovimento } from "@/lib/conti/validazione";

/**
 * POST /api/conti/movimenti — { tipo, data, importo, descrizione, controparte?, categoria }
 * → 201 { movimento }. Voce scritta a mano: è già confermata.
 */
export async function POST(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;

  const corpo = await corpoJson(request);
  if (corpo === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const letto = leggiNuovoMovimento(corpo);
  if (!letto.ok) return errore(400, letto.messaggio);

  const { data, error } = await supabase
    .from("conti_movimenti")
    .insert(rigaNuovoMovimento(user.id, letto.dati))
    .select(COLONNE_MOVIMENTO)
    .single();
  if (error || !data) return erroreDatabase("nuovo movimento", error);
  return json(201, { movimento: movimentoDaRiga(data as unknown as RigaMovimento) });
}
