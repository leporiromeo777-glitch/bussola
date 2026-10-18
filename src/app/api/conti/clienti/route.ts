import { clienteDaRiga, COLONNE_CLIENTE, rigaNuovoCliente, type RigaCliente } from "@/lib/clienti/righe";
import { erroreOre } from "@/lib/clienti/server";
import { leggiNuovoCliente } from "@/lib/clienti/validazione";
import { accediConti, corpoJson, errore, json, tutteLeRighe } from "@/lib/conti/server";
import { MESSAGGI_CONTI } from "@/lib/conti/validazione";

/** GET /api/conti/clienti → { clienti } in ordine di nome. */
export async function GET(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;

  const { righe, errore: e } = await tutteLeRighe<RigaCliente>((da, a) =>
    supabase
      .from("conti_clienti")
      .select(COLONNE_CLIENTE)
      .order("nome", { ascending: true })
      .range(da, a)
      .overrideTypes<RigaCliente[], { merge: false }>(),
  );
  if (e) return erroreOre("lettura dei clienti", e);
  return json(200, { clienti: righe.map(clienteDaRiga) });
}

/**
 * POST /api/conti/clienti — { nome, via?, numero?, npa?, localita?, paese?, email?, tariffa? }
 * → 201 { cliente }.
 */
export async function POST(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;

  const corpo = await corpoJson(request);
  if (corpo === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const letto = leggiNuovoCliente(corpo);
  if (!letto.ok) return errore(400, letto.messaggio);

  const { data, error } = await supabase
    .from("conti_clienti")
    .insert(rigaNuovoCliente(user.id, letto.dati))
    .select(COLONNE_CLIENTE)
    .single();
  if (error || !data) return erroreOre("nuovo cliente", error);
  return json(201, { cliente: clienteDaRiga(data as unknown as RigaCliente) });
}
