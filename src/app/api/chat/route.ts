import { titoloDaDomanda, type ConversazioneBreve } from "@/lib/chat/conversazioni";
import { creaChat, leggiChat, salvaDomanda, salvaRisposta } from "@/lib/chat/conversazioni-server";
import { rispondi } from "@/lib/chat/flusso";
import { SCAMBI_PRECEDENTI_MASSIMI } from "@/lib/chat/limiti";
import { MESSAGGI, messaggioQuotaEsaurita } from "@/lib/chat/messaggi";
import { flussoNdjson } from "@/lib/chat/ndjson";
import { DOMANDE_GRATIS_AL_MESE, calcolaQuota, quotaPubblica } from "@/lib/chat/quota";
import { leggiRichiesta } from "@/lib/chat/richiesta";
import { conConversazione, cronologiaDaMessaggi, domandaGiaSalvata } from "@/lib/chat/storico";
import type { ScambioPrecedente } from "@/lib/chat/tipi";
import { creaClientAnthropic, dipendenzeChat, leggiQuota, prenotaDomanda, registraErrore } from "@/lib/chat/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";

// Le risposte arrivano in streaming; con il ragionamento di Claude possono servire decine di secondi.
export const maxDuration = 60;

function json(status: number, corpo: Record<string, unknown>) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/chat — { domanda, conversazioneId?, cronologia? } → NDJSON:
 *   {"t":"conversazione","id":"...","titolo":"..."} la chat in cui è salvata la domanda,
 *   {"t":"testo","d":"..."} mentre la risposta si scrive,
 *   poi {"t":"fine","risposta":[...],"fonti":[...]} oppure {"t":"errore","messaggio":"..."}.
 * Con `conversazioneId` la domanda continua quella chat (404 se non c'è o è
 * di un altro) e il contesto viene dai messaggi salvati; senza, si apre una
 * chat nuova e vale la `cronologia` mandata (client senza chat salvate).
 * La domanda si salva prima di chiamare Claude, la risposta all'evento "fine";
 * dopo un errore resta solo la domanda, e si può riprovare.
 * Accesso con la sessione del sito (cookie) oppure, dall'app, con
 * `Authorization: Bearer <access_token>`: stesse risposte in entrambi i casi.
 */
export async function POST(request: Request) {
  const anthropic = creaClientAnthropic();
  if (!supabaseConfigured() || !anthropic) return json(503, { messaggio: MESSAGGI.modalitaDemo });

  const utente = await utenteDaRichiesta(request);
  if (!utente.ok) {
    return utente.motivo === "non_configurato"
      ? json(503, { messaggio: MESSAGGI.modalitaDemo })
      : json(401, { messaggio: MESSAGGI.nonCollegato });
  }
  const { supabase, user } = utente;

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, { messaggio: MESSAGGI.richiestaNonValida });
  }
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return json(400, { messaggio: MESSAGGI.richiestaNonValida });
  }
  const richiesta = leggiRichiesta(corpo);
  if (!richiesta.ok) return json(400, { messaggio: richiesta.messaggio });
  const { domanda, conversazioneId } = richiesta.dati;

  // La chat da continuare si controlla prima di contare la domanda.
  let conversazione: ConversazioneBreve | null = null;
  let cronologia: ScambioPrecedente[] = richiesta.dati.cronologia;
  let giaSalvata = false;
  if (conversazioneId) {
    // Gli ultimi messaggi bastano: al massimo 3 scambi, più domande rimaste senza risposta.
    const chat = await leggiChat(supabase, conversazioneId, SCAMBI_PRECEDENTI_MASSIMI * 2 + 4);
    if (chat.tipo === "non_trovata") return json(404, { messaggio: MESSAGGI.chatNonTrovata });
    if (chat.tipo === "errore") return json(503, { messaggio: MESSAGGI.chatNonDisponibili });
    conversazione = chat.conversazione;
    cronologia = cronologiaDaMessaggi(chat.messaggi);
    giaSalvata = domandaGiaSalvata(chat.messaggi, domanda);
  }

  // La domanda si prenota (e conta) prima di chiamare Claude: così né le
  // richieste parallele né quelle interrotte a metà superano la quota.
  const prenotazione = await prenotaDomanda(supabase, domanda);
  if (prenotazione.tipo === "errore") return json(503, { messaggio: MESSAGGI.quotaNonVerificabile });
  // Letta dopo la prenotazione: conta già questa domanda.
  const quota = await leggiQuota(supabase, user.id);
  if (prenotazione.tipo === "quota_esaurita") {
    const pubblica = quotaPubblica(quota ?? calcolaQuota(null, DOMANDE_GRATIS_AL_MESE, new Date()));
    return json(429, { messaggio: messaggioQuotaEsaurita(pubblica), quota: pubblica });
  }

  // Chat nuova con la prima domanda come titolo. Se non si riesce a salvare
  // (per esempio tabelle non ancora create) si risponde lo stesso, come prima.
  conversazione ??= await creaChat(supabase, user.id, titoloDaDomanda(domanda));
  // Dopo un «Riprova» la domanda è già l'ultimo messaggio: non si ripete.
  if (conversazione && !giaSalvata) await salvaDomanda(supabase, user.id, conversazione.id, domanda);

  const dipendenze = dipendenzeChat({
    supabase,
    userId: user.id,
    idDomanda: prenotazione.id,
    anthropic,
    segnale: request.signal,
  });
  const idChat = conversazione?.id;
  const eventi = conConversazione(
    rispondi(dipendenze, {
      domanda,
      cronologia,
      quotaDopo: quota ? quotaPubblica(quota) : undefined,
    }),
    conversazione,
    (fine) => (idChat ? salvaRisposta(supabase, user.id, idChat, fine) : Promise.resolve()),
    registraErrore,
  );

  return new Response(
    flussoNdjson(eventi, MESSAGGI.erroreGenerico, (errore) => registraErrore("flusso della risposta", errore)),
    {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    },
  );
}
