import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/supabase/env";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";
import type { ConversazioneBreve, MessaggioSalvato } from "./conversazioni";
import { MESSAGGI } from "./messaggi";
import { idChatValido } from "./richiesta";
import { anthropicConfigurato, registraErrore } from "./server";
import {
  CHAT_IN_ELENCO,
  COLONNE_CONVERSAZIONE,
  COLONNE_MESSAGGIO,
  conversazioneDaRiga,
  messaggiDaRighe,
  rigaRispostaBleo,
  type RigaConversazione,
  type RigaMessaggio,
} from "./storico";
import type { EventoChat } from "./tipi";

/**
 * Le chat salvate sul server (tabelle chat_conversazioni e chat_messaggi).
 * Tutto passa dal client dell'utente: la RLS e i trigger del database
 * garantiscono che ognuno legga e scriva solo nelle sue chat. Nei log solo
 * codici di errore, mai domande o risposte.
 */

type ErroreDb = { code?: string; message?: string } | null;

function errore(contesto: string, e: ErroreDb) {
  registraErrore(contesto, new Error(`${e?.code ?? "?"}`));
}

export function json(status: number, corpo: unknown) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

export function rispostaErrore(status: number, messaggio: string) {
  return json(status, { messaggio });
}

export type AccessoChat = { ok: true; supabase: SupabaseClient; user: User } | { ok: false; risposta: Response };

/**
 * Utente della richiesta (cookie del sito o `Authorization: Bearer`
 * dell'app) con il suo client (RLS). 503 in modalità demo (come /api/chat),
 * 401 senza accesso.
 */
export async function accediChat(request: Request): Promise<AccessoChat> {
  if (!supabaseConfigured() || !anthropicConfigurato()) {
    return { ok: false, risposta: rispostaErrore(503, MESSAGGI.modalitaDemo) };
  }
  const utente = await utenteDaRichiesta(request);
  if (!utente.ok) {
    return {
      ok: false,
      risposta:
        utente.motivo === "non_configurato"
          ? rispostaErrore(503, MESSAGGI.modalitaDemo)
          : rispostaErrore(401, MESSAGGI.nonCollegato),
    };
  }
  return { ok: true, supabase: utente.supabase, user: utente.user };
}

/** Le chat più recenti dell'utente, dalla più nuova; null se la lettura non riesce. */
export async function elencoChat(supabase: SupabaseClient): Promise<ConversazioneBreve[] | null> {
  const { data, error } = await supabase
    .from("chat_conversazioni")
    .select(COLONNE_CONVERSAZIONE)
    .order("aggiornata_il", { ascending: false })
    .limit(CHAT_IN_ELENCO);
  if (error) {
    errore("elenco delle chat", error);
    return null;
  }
  return (data as RigaConversazione[]).map(conversazioneDaRiga);
}

export type LetturaChat =
  | { tipo: "trovata"; conversazione: ConversazioneBreve; messaggi: MessaggioSalvato[] }
  | { tipo: "non_trovata" }
  | { tipo: "errore" };

/**
 * Una chat dell'utente con i messaggi in ordine. Con `ultimi` legge solo gli
 * ultimi messaggi (per il contesto di una nuova domanda). Un id con
 * un'altra forma, o di un altro utente, vale come non trovata.
 */
export async function leggiChat(supabase: SupabaseClient, id: string, ultimi?: number): Promise<LetturaChat> {
  if (!idChatValido(id)) return { tipo: "non_trovata" };
  const conversazione = await supabase.from("chat_conversazioni").select(COLONNE_CONVERSAZIONE).eq("id", id).maybeSingle();
  if (conversazione.error) {
    errore("lettura della chat", conversazione.error);
    return { tipo: "errore" };
  }
  if (!conversazione.data) return { tipo: "non_trovata" };

  const domanda = supabase
    .from("chat_messaggi")
    .select(COLONNE_MESSAGGIO)
    .eq("conversazione_id", id)
    .order("id", { ascending: ultimi === undefined });
  const messaggi = await (ultimi === undefined ? domanda : domanda.limit(ultimi));
  if (messaggi.error) {
    errore("lettura dei messaggi", messaggi.error);
    return { tipo: "errore" };
  }
  const righe = messaggi.data as RigaMessaggio[];
  return {
    tipo: "trovata",
    conversazione: conversazioneDaRiga(conversazione.data as RigaConversazione),
    messaggi: messaggiDaRighe(ultimi === undefined ? righe : [...righe].reverse()),
  };
}

/** Apre una chat nuova; null (e un log) se non riesce: la risposta arriva lo stesso, senza salvarla. */
export async function creaChat(supabase: SupabaseClient, userId: string, titolo: string): Promise<ConversazioneBreve | null> {
  const { data, error } = await supabase
    .from("chat_conversazioni")
    .insert({ user_id: userId, titolo })
    .select(COLONNE_CONVERSAZIONE)
    .single();
  if (error || !data) {
    errore("creazione della chat", error);
    return null;
  }
  return conversazioneDaRiga(data as RigaConversazione);
}

/** Salva la domanda nella chat. Un errore si registra ma non blocca la risposta. */
export async function salvaDomanda(supabase: SupabaseClient, userId: string, conversazioneId: string, domanda: string) {
  const { error } = await supabase
    .from("chat_messaggi")
    .insert({ conversazione_id: conversazioneId, user_id: userId, ruolo: "utente", testo: domanda });
  if (error) errore("salvataggio della domanda nella chat", error);
}

/** Salva la risposta di Bleo nella chat; lancia un errore se non riesce. */
export async function salvaRisposta(
  supabase: SupabaseClient,
  userId: string,
  conversazioneId: string,
  fine: Extract<EventoChat, { t: "fine" }>,
) {
  const { error } = await supabase
    .from("chat_messaggi")
    .insert({ conversazione_id: conversazioneId, user_id: userId, ...rigaRispostaBleo(fine) });
  if (error) throw new Error(`chat_messaggi: ${error.code ?? "?"}`);
}

export type EsitoModifica<T> = { tipo: "ok"; valore: T } | { tipo: "non_trovata" } | { tipo: "errore" };

export async function rinominaChat(
  supabase: SupabaseClient,
  id: string,
  titolo: string,
): Promise<EsitoModifica<ConversazioneBreve>> {
  if (!idChatValido(id)) return { tipo: "non_trovata" };
  const { data, error } = await supabase
    .from("chat_conversazioni")
    .update({ titolo })
    .eq("id", id)
    .select(COLONNE_CONVERSAZIONE)
    .maybeSingle();
  if (error) {
    errore("modifica del titolo", error);
    return { tipo: "errore" };
  }
  return data ? { tipo: "ok", valore: conversazioneDaRiga(data as RigaConversazione) } : { tipo: "non_trovata" };
}

/** Cancella una chat con i suoi messaggi (on delete cascade). */
export async function eliminaChat(supabase: SupabaseClient, id: string): Promise<EsitoModifica<null>> {
  if (!idChatValido(id)) return { tipo: "non_trovata" };
  const { data, error } = await supabase.from("chat_conversazioni").delete().eq("id", id).select("id");
  if (error) {
    errore("cancellazione della chat", error);
    return { tipo: "errore" };
  }
  return data && data.length > 0 ? { tipo: "ok", valore: null } : { tipo: "non_trovata" };
}
