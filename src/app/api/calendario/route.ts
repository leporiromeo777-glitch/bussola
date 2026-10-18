import type { SupabaseClient } from "@supabase/supabase-js";
import {
  improntaToken,
  nuovoTokenCalendario,
  percorsoCalendario,
  type LinkCreato,
  type StatoCalendario,
} from "@/lib/percorso/abbonamento";
import {
  calendarioAttivo,
  jsonCalendario as json,
  MESSAGGI_CALENDARIO,
  registraCalendario,
} from "@/lib/percorso/abbonamento-server";
import { VERSIONE_REGOLE } from "@/lib/percorso/regole";
import { leggiRisposte } from "@/lib/percorso/risposte";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";

/**
 * «Calendario sempre aggiornato»: il link personale dell'utente collegato
 * (cookie del sito o `Authorization: Bearer` dell'app). Tutto con il client
 * dell'utente: valgono la RLS e i permessi di link_calendario.
 *
 * - GET → StatoCalendario: il link attivo (senza token) e le risposte
 *   salvate nell'account, da cui nascono le scadenze.
 * - POST → 201 LinkCreato: un link nuovo al posto di quello vecchio
 *   («Rigenera il link»). Il token si vede solo in questa risposta.
 * - PUT { risposte } → StatoCalendario: salva nell'account le risposte del
 *   questionario da usare nel calendario (l'app, che le tiene sul telefono).
 * - DELETE → 204: disattiva il link.
 *
 * 503 se il calendario non è attivo (modalità demo o senza chiave segreta),
 * 401 senza accesso.
 */

type Accesso = { ok: true; supabase: SupabaseClient; userId: string } | { ok: false; risposta: Response };

async function accedi(request: Request): Promise<Accesso> {
  if (!calendarioAttivo()) return { ok: false, risposta: json(503, { messaggio: MESSAGGI_CALENDARIO.nonAttivo }) };
  const utente = await utenteDaRichiesta(request);
  if (utente.ok) return { ok: true, supabase: utente.supabase, userId: utente.user.id };
  return {
    ok: false,
    risposta:
      utente.motivo === "non_configurato"
        ? json(503, { messaggio: MESSAGGI_CALENDARIO.nonAttivo })
        : json(401, { messaggio: MESSAGGI_CALENDARIO.nonCollegato }),
  };
}

function erroreDatabase(contesto: string, errore: { code?: string } | null) {
  registraCalendario(contesto, { code: errore?.code ?? null });
  return json(503, { messaggio: MESSAGGI_CALENDARIO.erroreDatabase });
}

type RigaLink = { id: string; creato_il: string; letto_il: string | null };
type RigaQuestionario = { risposte: unknown; aggiornato_il: string };

async function leggiStato(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true; stato: StatoCalendario } | { ok: false; risposta: Response }> {
  const [link, questionario] = await Promise.all([
    supabase.from("link_calendario").select("id, creato_il, letto_il").eq("user_id", userId).maybeSingle(),
    supabase.from("questionari").select("risposte, aggiornato_il").eq("user_id", userId).maybeSingle(),
  ]);
  if (link.error) return { ok: false, risposta: erroreDatabase("lettura del link", link.error) };
  if (questionario.error)
    return { ok: false, risposta: erroreDatabase("lettura del questionario", questionario.error) };
  const rigaLink = link.data as RigaLink | null;
  const rigaQuestionario = questionario.data as RigaQuestionario | null;
  const risposte = rigaQuestionario ? leggiRisposte(rigaQuestionario.risposte) : null;
  return {
    ok: true,
    stato: {
      link: rigaLink ? { id: rigaLink.id, creatoIl: rigaLink.creato_il, lettoIl: rigaLink.letto_il } : null,
      percorso: risposte && rigaQuestionario ? { risposte, aggiornatoIl: rigaQuestionario.aggiornato_il } : null,
    },
  };
}

export async function GET(request: Request) {
  const accesso = await accedi(request);
  if (!accesso.ok) return accesso.risposta;
  const esito = await leggiStato(accesso.supabase, accesso.userId);
  return esito.ok ? json(200, esito.stato) : esito.risposta;
}

export async function POST(request: Request) {
  const accesso = await accedi(request);
  if (!accesso.ok) return accesso.risposta;
  // Il token lo crea sempre il server; nel database va solo la sua impronta.
  const token = nuovoTokenCalendario();
  const { data, error } = await accesso.supabase.rpc("nuovo_link_calendario", {
    p_impronta: await improntaToken(token),
  });
  const riga = (Array.isArray(data) ? data[0] : data) as { id: string; creato_il: string } | null | undefined;
  if (error || !riga) return erroreDatabase("nuovo link", error);
  const creato: LinkCreato = { id: riga.id, creatoIl: riga.creato_il, percorso: percorsoCalendario(token) };
  return json(201, creato);
}

/** Le risposte valide stanno sotto 1 KB (vedi questionari_risposte_dimensione): 8 KB bastano e avanzano. */
const CORPO_MASSIMO = 8_192;

async function leggiCorpo(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) return null;
  const lunghezza = Number(request.headers.get("content-length"));
  if (Number.isFinite(lunghezza) && lunghezza > CORPO_MASSIMO) return null;
  try {
    const testo = await request.text();
    return testo.length > CORPO_MASSIMO ? null : (JSON.parse(testo) as unknown);
  } catch {
    return null;
  }
}

export async function PUT(request: Request) {
  const accesso = await accedi(request);
  if (!accesso.ok) return accesso.risposta;
  const corpo = await leggiCorpo(request);
  const risposte =
    corpo && typeof corpo === "object" ? leggiRisposte((corpo as { risposte?: unknown }).risposte) : null;
  if (!risposte) return json(400, { messaggio: MESSAGGI_CALENDARIO.risposteNonValide });
  // Come «salvaRisposte» del sito (src/app/questionario/azioni.ts).
  const { error } = await accesso.supabase.from("questionari").upsert(
    {
      user_id: accesso.userId,
      risposte,
      versione_regole: VERSIONE_REGOLE,
      aggiornato_il: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return erroreDatabase("salvataggio delle risposte", error);
  const esito = await leggiStato(accesso.supabase, accesso.userId);
  return esito.ok ? json(200, esito.stato) : esito.risposta;
}

export async function DELETE(request: Request) {
  const accesso = await accedi(request);
  if (!accesso.ok) return accesso.risposta;
  const { error } = await accesso.supabase.from("link_calendario").delete().eq("user_id", accesso.userId);
  if (error) return erroreDatabase("revoca del link", error);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
