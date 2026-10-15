import { rispondi } from "@/lib/chat/flusso";
import { MESSAGGI, messaggioQuotaEsaurita } from "@/lib/chat/messaggi";
import { flussoNdjson } from "@/lib/chat/ndjson";
import { DOMANDE_GRATIS_AL_MESE, calcolaQuota, quotaPubblica } from "@/lib/chat/quota";
import { leggiRichiesta } from "@/lib/chat/richiesta";
import { creaClientAnthropic, dipendenzeChat, leggiQuota, prenotaDomanda, registraErrore } from "@/lib/chat/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createClient, getUser } from "@/lib/supabase/server";

// Le risposte arrivano in streaming; con il ragionamento di Claude possono servire decine di secondi.
export const maxDuration = 60;

function json(status: number, corpo: Record<string, unknown>) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/chat — { domanda, cronologia? } → NDJSON:
 *   {"t":"testo","d":"..."} mentre la risposta si scrive,
 *   poi {"t":"fine","risposta":[...],"fonti":[...]} oppure {"t":"errore","messaggio":"..."}.
 */
export async function POST(request: Request) {
  const anthropic = creaClientAnthropic();
  if (!supabaseConfigured() || !anthropic) return json(503, { messaggio: MESSAGGI.modalitaDemo });

  const user = await getUser();
  if (!user) return json(401, { messaggio: MESSAGGI.nonCollegato });
  const supabase = await createClient();
  if (!supabase) return json(503, { messaggio: MESSAGGI.modalitaDemo });

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

  // La domanda si prenota (e conta) prima di chiamare Claude: così né le
  // richieste parallele né quelle interrotte a metà superano la quota.
  const prenotazione = await prenotaDomanda(supabase, richiesta.dati.domanda);
  if (prenotazione.tipo === "errore") return json(503, { messaggio: MESSAGGI.quotaNonVerificabile });
  // Letta dopo la prenotazione: conta già questa domanda.
  const quota = await leggiQuota(supabase, user.id);
  if (prenotazione.tipo === "quota_esaurita") {
    const pubblica = quotaPubblica(quota ?? calcolaQuota(null, DOMANDE_GRATIS_AL_MESE, new Date()));
    return json(429, { messaggio: messaggioQuotaEsaurita(pubblica), quota: pubblica });
  }

  const dipendenze = dipendenzeChat({
    supabase,
    userId: user.id,
    idDomanda: prenotazione.id,
    anthropic,
    segnale: request.signal,
  });
  const eventi = rispondi(dipendenze, {
    domanda: richiesta.dati.domanda,
    cronologia: richiesta.dati.cronologia,
    quotaDopo: quota ? quotaPubblica(quota) : undefined,
  });

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
