import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CORPO_MASSIMO_PERCORSO,
  leggiModifichePassi,
  leggiRichiestaRisposte,
  MESSAGGI_PERCORSO,
} from "@/lib/percorso/account-api";
import {
  leggiPercorsoUtente,
  salvaRisposteUtente,
  segnaPassiUtente,
  type ErroreDatabase,
} from "@/lib/percorso/account-utente";
import { json, leggiCorpo } from "@/lib/strumenti/server";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";

/**
 * Il percorso nell'account (risposte al questionario e passi fatti) per
 * l'app, con `Authorization: Bearer` (o i cookie del sito). Tutto con il
 * client dell'utente: vale la RLS di questionari e passi_completati.
 *
 * - GET → PercorsoAccount
 * - PUT { risposte } → PercorsoAccount: salva le risposte (come «salvaRisposte» del sito)
 * - PATCH { fatti?: IdPasso[], daFare?: IdPasso[] } → PercorsoAccount: segna i passi
 *
 * 503 in modalità demo, 401 senza accesso, 400/413/415 per una richiesta
 * non valida. Nei log solo codici: mai risposte.
 */

type Accesso = { ok: true; supabase: SupabaseClient; userId: string } | { ok: false; risposta: Response };

function errore(status: number, messaggio: string) {
  return json(status, { messaggio });
}

async function accedi(request: Request): Promise<Accesso> {
  const utente = await utenteDaRichiesta(request);
  if (utente.ok) return { ok: true, supabase: utente.supabase, userId: utente.user.id };
  return {
    ok: false,
    risposta:
      utente.motivo === "non_configurato"
        ? errore(503, MESSAGGI_PERCORSO.nonAttivo)
        : errore(401, MESSAGGI_PERCORSO.nonCollegato),
  };
}

function erroreDatabase(contesto: string, e: ErroreDatabase) {
  console.error(`[percorso] ${contesto}`, { code: e?.code ?? null });
  // Più di 100 passi (trigger limita_passi).
  if (e?.code === "54000") return errore(409, MESSAGGI_PERCORSO.troppiPassi);
  return errore(503, MESSAGGI_PERCORSO.erroreDatabase);
}

async function statoAttuale(supabase: SupabaseClient, userId: string) {
  const esito = await leggiPercorsoUtente(supabase, userId);
  return esito.ok ? json(200, esito.dati) : erroreDatabase("lettura del percorso", esito.errore);
}

async function corpoDi(request: Request): Promise<{ ok: true; corpo: unknown } | { ok: false; risposta: Response }> {
  const letto = await leggiCorpo(request, CORPO_MASSIMO_PERCORSO);
  if (letto.ok) return letto;
  return {
    ok: false,
    risposta: errore(
      letto.status,
      letto.status === 413 ? MESSAGGI_PERCORSO.troppoLungo : MESSAGGI_PERCORSO.richiestaNonValida,
    ),
  };
}

export async function GET(request: Request) {
  const accesso = await accedi(request);
  if (!accesso.ok) return accesso.risposta;
  return statoAttuale(accesso.supabase, accesso.userId);
}

export async function PUT(request: Request) {
  const accesso = await accedi(request);
  if (!accesso.ok) return accesso.risposta;
  const letto = await corpoDi(request);
  if (!letto.ok) return letto.risposta;
  const risposte = leggiRichiestaRisposte(letto.corpo);
  if (!risposte) return errore(400, MESSAGGI_PERCORSO.risposteNonValide);
  const { error } = await salvaRisposteUtente(accesso.supabase, accesso.userId, risposte);
  if (error) return erroreDatabase("salvataggio delle risposte", error);
  return statoAttuale(accesso.supabase, accesso.userId);
}

export async function PATCH(request: Request) {
  const accesso = await accedi(request);
  if (!accesso.ok) return accesso.risposta;
  const letto = await corpoDi(request);
  if (!letto.ok) return letto.risposta;
  const modifiche = leggiModifichePassi(letto.corpo);
  if (!modifiche) return errore(400, MESSAGGI_PERCORSO.passiNonValidi);
  const { error } = await segnaPassiUtente(accesso.supabase, accesso.userId, modifiche);
  if (error) return erroreDatabase("salvataggio dei passi", error);
  return statoAttuale(accesso.supabase, accesso.userId);
}
