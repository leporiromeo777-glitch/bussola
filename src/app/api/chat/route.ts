import { rispondi } from "@/lib/chat/flusso";
import { MESSAGGI, messaggioQuotaEsaurita } from "@/lib/chat/messaggi";
import { flussoNdjson } from "@/lib/chat/ndjson";
import { conUnaDomandaInPiu, quotaPubblica } from "@/lib/chat/quota";
import { leggiRichiesta } from "@/lib/chat/richiesta";
import { creaClientAnthropic, dipendenzeChat, leggiQuota, registraErrore } from "@/lib/chat/server";
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

  const quota = await leggiQuota(supabase, user.id);
  if (!quota) return json(503, { messaggio: MESSAGGI.quotaNonVerificabile });
  if (quota.esaurita) {
    const pubblica = quotaPubblica(quota);
    return json(429, { messaggio: messaggioQuotaEsaurita(pubblica), quota: pubblica });
  }

  const eventi = rispondi(dipendenzeChat({ supabase, userId: user.id, anthropic, segnale: request.signal }), {
    domanda: richiesta.dati.domanda,
    cronologia: richiesta.dati.cronologia,
    quotaDopo: quotaPubblica(conUnaDomandaInPiu(quota)),
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
