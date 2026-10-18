import { oggiZurigo } from "@/lib/conti/importi";
import { accediConti, corpoJson, errore, json, tutteLeRighe } from "@/lib/conti/server";
import { MESSAGGI_CONTI } from "@/lib/conti/validazione";
import { intervalloMese, meseDi, mesiDaFatturare } from "@/lib/clienti/ore";
import {
  clienteDaRiga,
  COLONNE_CLIENTE,
  COLONNE_ORE,
  rigaNuovaVoce,
  voceDaRiga,
  type RigaCliente,
  type RigaOre,
} from "@/lib/clienti/righe";
import { erroreOre } from "@/lib/clienti/server";
import type { RispostaOre } from "@/lib/clienti/tipi";
import { leggiMese, leggiNuovaVoce } from "@/lib/clienti/validazione";

/**
 * GET /api/conti/ore?mese=AAAA-MM → RispostaOre: tutti i clienti, le voci
 * del mese e i mesi con ore ancora da fatturare. Senza `mese` vale il mese in
 * corso (ora di Zurigo).
 */
export async function GET(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;

  const letto = leggiMese(new URL(request.url).searchParams.get("mese"), meseDi(oggiZurigo()));
  if (!letto.ok) return errore(400, letto.messaggio);
  const mese = letto.dati;
  const { inizio, fine } = intervalloMese(mese);

  const [clienti, voci, aperte] = await Promise.all([
    tutteLeRighe<RigaCliente>((da, a) =>
      supabase
        .from("conti_clienti")
        .select(COLONNE_CLIENTE)
        .order("nome", { ascending: true })
        .range(da, a)
        .overrideTypes<RigaCliente[], { merge: false }>(),
    ),
    tutteLeRighe<RigaOre>((da, a) =>
      supabase
        .from("conti_ore")
        .select(COLONNE_ORE)
        .gte("data", inizio)
        .lte("data", fine)
        .order("data", { ascending: false })
        .order("creato_il", { ascending: false })
        .range(da, a)
        .overrideTypes<RigaOre[], { merge: false }>(),
    ),
    tutteLeRighe<{ data: string; minuti: number }>((da, a) =>
      supabase
        .from("conti_ore")
        .select("data, minuti")
        .is("fatturata_il", null)
        .order("data", { ascending: false })
        .range(da, a)
        .overrideTypes<{ data: string; minuti: number }[], { merge: false }>(),
    ),
  ]);
  const e = clienti.errore ?? voci.errore ?? aperte.errore;
  if (e) return erroreOre("lettura delle ore", e);

  const risposta: RispostaOre = {
    mese,
    clienti: clienti.righe.map(clienteDaRiga),
    voci: voci.righe.map(voceDaRiga),
    daFatturare: mesiDaFatturare(aperte.righe.map((r) => ({ data: r.data.slice(0, 10), minuti: r.minuti }))),
  };
  return json(200, risposta);
}

/**
 * POST /api/conti/ore — { clienteId, data, minuti, descrizione?, tariffa? }
 * → 201 { voce }. Il cliente deve essere tuo (chiave esterna nel database).
 */
export async function POST(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;

  const corpo = await corpoJson(request);
  if (corpo === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const letto = leggiNuovaVoce(corpo);
  if (!letto.ok) return errore(400, letto.messaggio);

  const { data, error } = await supabase
    .from("conti_ore")
    .insert(rigaNuovaVoce(user.id, letto.dati))
    .select(COLONNE_ORE)
    .single();
  if (error || !data) return erroreOre("nuova voce di ore", error);
  return json(201, { voce: voceDaRiga(data as unknown as RigaOre) });
}
