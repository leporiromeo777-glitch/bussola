import { leggiAnno, oggiZurigo } from "@/lib/conti/importi";
import { riepilogo } from "@/lib/conti/riepilogo";
import {
  COLONNE_FATTURA,
  COLONNE_MOVIMENTO,
  fatturaDaRiga,
  movimentoDaRiga,
  type RigaFattura,
  type RigaMovimento,
} from "@/lib/conti/righe";
import { accediConti, erroreDatabase, errore, funzioniConti, json, tutteLeRighe } from "@/lib/conti/server";
import type { RispostaConti } from "@/lib/conti/tipi";
import { MESSAGGI_CONTI } from "@/lib/conti/validazione";

/**
 * GET /api/conti?anno=AAAA → RispostaConti.
 * - movimenti: quelli con la data nell'anno, più tutti quelli ancora da
 *   confermare (anche di altri anni: non devono sparire);
 * - fatture: quelle con la data nell'anno, più quelle non ancora pagate;
 * - riepilogo: src/lib/conti/riepilogo.ts.
 * Senza `anno` vale l'anno in corso (ora di Zurigo).
 */
export async function GET(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;

  const parametro = new URL(request.url).searchParams.get("anno");
  const oggi = oggiZurigo();
  const anno = parametro === null ? Number(oggi.slice(0, 4)) : leggiAnno(parametro);
  if (anno === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);
  const inizio = `${anno}-01-01`;
  const fine = `${anno}-12-31`;

  const [movimenti, fatture] = await Promise.all([
    tutteLeRighe<RigaMovimento>((da, a) =>
      supabase
        .from("conti_movimenti")
        .select(COLONNE_MOVIMENTO)
        .or(`and(data.gte.${inizio},data.lte.${fine}),stato.eq.da_confermare`)
        .order("data", { ascending: false })
        .order("creato_il", { ascending: false })
        .range(da, a)
        .overrideTypes<RigaMovimento[], { merge: false }>(),
    ),
    tutteLeRighe<RigaFattura>((da, a) =>
      supabase
        .from("conti_fatture")
        .select(COLONNE_FATTURA)
        .or(`and(data.gte.${inizio},data.lte.${fine}),pagata_il.is.null`)
        .order("data", { ascending: false })
        .order("numero", { ascending: false })
        .range(da, a)
        .overrideTypes<RigaFattura[], { merge: false }>(),
    ),
  ]);
  if (movimenti.errore || fatture.errore) return erroreDatabase("lettura dei conti", movimenti.errore ?? fatture.errore);

  const elencoMovimenti = movimenti.righe.map(movimentoDaRiga);
  const elencoFatture = fatture.righe.map((r) => fatturaDaRiga(r, oggi));
  const risposta: RispostaConti = {
    movimenti: elencoMovimenti,
    fatture: elencoFatture,
    riepilogo: riepilogo(elencoMovimenti, elencoFatture, anno, oggi),
    funzioni: funzioniConti(),
  };
  return json(200, risposta);
}
