import { oggiZurigo } from "@/lib/conti/importi";
import { COLONNE_FATTURA, fatturaDaRiga, rigaNuovaFattura, type RigaFattura } from "@/lib/conti/righe";
import { accediConti, corpoJson, erroreDatabase, errore, json } from "@/lib/conti/server";
import { MESSAGGI_CONTI, leggiNuovaFattura } from "@/lib/conti/validazione";

/**
 * POST /api/conti/fatture — { numero, cliente, data, scadenza?, importo, riferimento? }
 * → { fattura }. Una fattura per numero: se il numero c'è già la aggiorna
 * (per esempio dopo una correzione nello strumento fattura); se era pagata,
 * l'entrata segue il nuovo importo (trigger nel database).
 */
export async function POST(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;

  const corpo = await corpoJson(request);
  if (corpo === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const letta = leggiNuovaFattura(corpo);
  if (!letta.ok) return errore(400, letta.messaggio);

  const { data, error } = await supabase
    .from("conti_fatture")
    .upsert(rigaNuovaFattura(user.id, letta.dati, new Date().toISOString()), { onConflict: "user_id,numero" })
    .select(COLONNE_FATTURA)
    .single();
  if (error || !data) return erroreDatabase("salvataggio della fattura", error);
  return json(200, { fattura: fatturaDaRiga(data as unknown as RigaFattura, oggiZurigo()) });
}
