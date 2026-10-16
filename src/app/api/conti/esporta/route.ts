import { csvConti, nomeFileCsv } from "@/lib/conti/csv";
import { leggiAnno, oggiZurigo } from "@/lib/conti/importi";
import { COLONNE_MOVIMENTO, movimentoDaRiga, type RigaMovimento } from "@/lib/conti/righe";
import { accediConti, erroreDatabase, errore, tutteLeRighe } from "@/lib/conti/server";
import { MESSAGGI_CONTI } from "@/lib/conti/validazione";

/**
 * GET /api/conti/esporta?anno=AAAA → file CSV per il fiduciario (formato in
 * src/lib/conti/csv.ts): voci confermate dell'anno, poi quelle da confermare.
 */
export async function GET(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase } = accesso;

  const parametro = new URL(request.url).searchParams.get("anno");
  const anno = parametro === null ? Number(oggiZurigo().slice(0, 4)) : leggiAnno(parametro);
  if (anno === null) return errore(400, MESSAGGI_CONTI.richiestaNonValida);

  const { righe, errore: erroreLettura } = await tutteLeRighe<RigaMovimento>((da, a) =>
    supabase
      .from("conti_movimenti")
      .select(COLONNE_MOVIMENTO)
      .gte("data", `${anno}-01-01`)
      .lte("data", `${anno}-12-31`)
      .neq("stato", "privato")
      .order("data", { ascending: true })
      .range(da, a)
      .overrideTypes<RigaMovimento[], { merge: false }>(),
  );
  if (erroreLettura) return erroreDatabase("esportazione dei conti", erroreLettura);

  return new Response(csvConti(righe.map(movimentoDaRiga), anno), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeFileCsv(anno)}"`,
      "Cache-Control": "no-store",
    },
  });
}
