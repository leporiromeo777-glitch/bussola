import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { dettagliErrore } from "@/lib/chat/errori";
import { scegliModelloRacconto, supportaFallback } from "@/lib/chat/modello";
import { creaClientAnthropic } from "@/lib/chat/server";
import { controllaLimite } from "@/lib/limiti/server";
import {
  ISTRUZIONI_RACCONTO,
  MESSAGGI_RACCONTO,
  leggiRichiestaRacconto,
  messaggioRacconto,
  pulisciRacconto,
  schemaRacconto,
} from "@/lib/percorso/racconto";

// Una sola chiamata a Claude, non in streaming: al massimo 2 tentativi da 20 secondi.
export const maxDuration = 60;

// La risposta è breve (un JSON); il resto lascia spazio al ragionamento, attivo di serie su Haiku 5.5
// (con effort "low" pensa poco o niente). Niente temperature/top_p: Haiku 5.5 li rifiuta.
const MAX_TOKENS = 8_000;
const TEMPO_MASSIMO_MS = 20_000;

const FORMATO = betaZodOutputFormat(schemaRacconto);

function json(status: number, corpo: Record<string, unknown>) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

/** Nei log solo tipo e codici, mai il testo di chi scrive né l'output del modello che lo riprende. */
function registra(contesto: string, dettagli: Record<string, unknown>) {
  console.error(`[racconta] ${contesto}`, dettagli);
}

/**
 * POST /api/racconta — { testo } → { bozza, riassunto }.
 * Chi scrive racconta la sua idea con parole sue; Claude ne ricava le
 * risposte del questionario che il testo dice o lascia capire chiaramente
 * (`bozza`, solo valori validi) e una frase di riassunto. Senza accesso, ma
 * con un limite per connessione: se il limite non si può verificare la
 * richiesta si rifiuta, perché ogni chiamata a Claude costa.
 */
export async function POST(request: Request) {
  const anthropic = creaClientAnthropic();
  if (!anthropic) return json(503, { messaggio: MESSAGGI_RACCONTO.nonAttivo });

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, { messaggio: MESSAGGI_RACCONTO.richiestaNonValida });
  }
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return json(400, { messaggio: MESSAGGI_RACCONTO.richiestaNonValida });
  }
  const richiesta = leggiRichiestaRacconto(corpo);
  if (!richiesta.ok) return json(400, { messaggio: richiesta.messaggio });

  // Si conta solo una richiesta valida, subito prima di chiamare Claude.
  const limite = await controllaLimite("racconto");
  if (limite === "non_disponibile") return json(503, { messaggio: MESSAGGI_RACCONTO.occupato });
  if (limite === "superato") return json(429, { messaggio: MESSAGGI_RACCONTO.troppeRichieste });

  const modello = scegliModelloRacconto(process.env.ANTHROPIC_MODEL_RACCONTO);
  try {
    const risposta = await anthropic.beta.messages.parse(
      {
        model: modello,
        max_tokens: MAX_TOKENS,
        output_config: { effort: "low", format: FORMATO },
        // Se i filtri di sicurezza rifiutano la richiesta, il server riprova con il modello consigliato.
        // Haiku 5.5 (il predefinito) non ha questo ripiego: per lui il parametro non si manda.
        ...(supportaFallback(modello)
          ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
          : {}),
        system: [{ type: "text", text: ISTRUZIONI_RACCONTO, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: messaggioRacconto(richiesta.dati.testo) }],
      },
      { signal: request.signal, timeout: TEMPO_MASSIMO_MS, maxRetries: 1 },
    );

    if (risposta.stop_reason === "refusal" || risposta.stop_reason === "max_tokens" || !risposta.parsed_output) {
      registra("risposta non utilizzabile", {
        stop_reason: risposta.stop_reason,
        categoria: risposta.stop_details?.category ?? null,
        modello: risposta.model,
      });
      return json(502, { messaggio: MESSAGGI_RACCONTO.nonCapito });
    }

    const { bozza, riassunto } = pulisciRacconto(risposta.parsed_output);
    return json(200, { bozza, riassunto });
  } catch (errore) {
    // Pagina chiusa o richiesta interrotta: non c'è nessuno a cui rispondere.
    if (errore instanceof Anthropic.APIUserAbortError || request.signal.aborted) {
      return json(499, { messaggio: MESSAGGI_RACCONTO.richiestaNonValida });
    }
    if (errore instanceof Anthropic.APIError) {
      registra("errore di Claude", dettagliErrore(errore));
      const occupato =
        errore instanceof Anthropic.RateLimitError ||
        errore instanceof Anthropic.APIConnectionError ||
        errore.status === 529 ||
        errore.type === "overloaded_error";
      return occupato
        ? json(503, { messaggio: MESSAGGI_RACCONTO.occupato })
        : json(502, { messaggio: MESSAGGI_RACCONTO.nonCapito });
    }
    // JSON incompleto o non valido: l'SDK lo segnala con un AnthropicError, il cui
    // messaggio può riportare pezzi dell'output. Nei log va solo il tipo.
    registra("output non leggibile", { tipo: errore instanceof Error ? errore.name : typeof errore });
    return json(502, { messaggio: MESSAGGI_RACCONTO.nonCapito });
  }
}
