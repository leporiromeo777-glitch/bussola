import { tutteLeRighe } from "@/lib/conti/server";
import {
  COLONNE_DOCUMENTO_ACCOUNT,
  COLONNE_EMITTENTE,
  CORPO_IMPORTAZIONE_MASSIMO,
  documentoDaRiga,
  emittenteDaRiga,
  leggiImportazione,
  rigaDocumento,
  rigaEmittente,
  type RigaDocumentoAccount,
  type RigaEmittente,
  type RispostaDocumenti,
  type RispostaImportazione,
} from "@/lib/strumenti/account";
import { accediDocumenti, erroreCorpo, erroreDatabase, errore, json, leggiCorpo, registra } from "@/lib/strumenti/server";

/**
 * GET /api/strumenti/documenti → RispostaDocumenti: tutti i preventivi e le
 * fatture dell'utente, dal più recente, e i suoi dati di emittente (null se
 * non li ha mai salvati). Un contenuto che non è un documento valido si
 * salta (nei log solo quanti).
 */
export async function GET(request: Request) {
  const accesso = await accediDocumenti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;

  const { righe, errore: e } = await tutteLeRighe<RigaDocumentoAccount>((da, a) =>
    supabase
      .from("preventivi_fatture")
      .select(COLONNE_DOCUMENTO_ACCOUNT)
      .eq("user_id", user.id)
      .order("aggiornato_il", { ascending: false })
      .order("id", { ascending: true })
      .range(da, a)
      .overrideTypes<RigaDocumentoAccount[], { merge: false }>(),
  );
  if (e) return erroreDatabase("lettura dei documenti", e);
  const emittente = await supabase.from("emittenti").select(COLONNE_EMITTENTE).eq("user_id", user.id).maybeSingle();
  if (emittente.error) return erroreDatabase("lettura dell'emittente", emittente.error);

  const documenti = righe.flatMap((r) => {
    const doc = documentoDaRiga(r);
    return doc ? [doc] : [];
  });
  if (documenti.length < righe.length) registra("documenti non leggibili", { quanti: righe.length - documenti.length });
  const risposta: RispostaDocumenti = {
    documenti,
    emittente: emittente.data ? emittenteDaRiga(emittente.data as unknown as RigaEmittente) : null,
  };
  return json(200, risposta);
}

/** Un momento ISO plausibile (dal 2000 a domani), altrimenti null. */
function momento(iso: string, adesso: Date): string | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t) || t < Date.UTC(2000, 0, 1) || t > adesso.getTime() + 86_400_000) return null;
  return new Date(t).toISOString();
}

/**
 * POST /api/strumenti/documenti — { documenti: Documento[] (al massimo
 * IMPORTAZIONE_MASSIMA), emittente?: Emittente } → RispostaImportazione.
 *
 * Copia nell'account i documenti salvati nel browser prima dell'accesso.
 * Un documento con un id già presente non si tocca (niente doppioni, niente
 * sovrascritture); i dati dell'emittente si salvano solo se l'account non li
 * ha ancora. 409 se si supera il numero massimo di documenti.
 */
export async function POST(request: Request) {
  const accesso = await accediDocumenti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;

  const letto = await leggiCorpo(request, CORPO_IMPORTAZIONE_MASSIMO);
  if (!letto.ok) return erroreCorpo(letto.status);
  const importazione = leggiImportazione(letto.corpo);
  if (!importazione.ok) return errore(400, importazione.messaggio);
  const { documenti, scartati, emittente } = importazione.dati;
  const adesso = new Date();

  let importati: string[] = [];
  if (documenti.length > 0) {
    const righe = documenti.map((d) => {
      const quando = momento(d.aggiornatoIl, adesso) ?? adesso.toISOString();
      return { ...rigaDocumento(user.id, d, quando), creato_il: momento(d.creatoIl, adesso) ?? quando };
    });
    const { data, error } = await supabase
      .from("preventivi_fatture")
      .upsert(righe, { onConflict: "user_id,id", ignoreDuplicates: true })
      .select("id");
    if (error) return erroreDatabase("importazione dei documenti", error);
    importati = (data ?? []).map((r) => (r as { id: string }).id);
  }

  let emittenteSalvato = false;
  if (emittente) {
    const { data, error } = await supabase
      .from("emittenti")
      .upsert(rigaEmittente(user.id, emittente, adesso.toISOString()), { onConflict: "user_id", ignoreDuplicates: true })
      .select("user_id");
    if (error) return erroreDatabase("importazione dell'emittente", error);
    emittenteSalvato = (data ?? []).length > 0;
  }

  const nuovi = new Set(importati);
  const risposta: RispostaImportazione = {
    importati,
    giaPresenti: documenti.filter((d) => !nuovi.has(d.id)).map((d) => d.id),
    scartati,
    emittente: emittenteSalvato,
  };
  return json(200, risposta);
}
