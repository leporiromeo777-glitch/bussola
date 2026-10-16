import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { dettagliErrore } from "@/lib/chat/errori";
import { scegliModelloFunzione, supportaFallback } from "@/lib/chat/modello";
import { creaClientAnthropic } from "@/lib/chat/server";
import { controllaLimite } from "@/lib/limiti/server";
import {
  ISTRUZIONI_NOME_DITTA,
  MESSAGGI_NOME_DITTA,
  leggiRichiestaNomi,
  messaggioNomeDitta,
  pulisciProposte,
  schemaProposte,
} from "@/lib/nome-ditta/proposte";
import { cercaSuZefix } from "@/lib/nome-ditta/zefix";

// Claude (al massimo 2 tentativi da 20 secondi) e poi Zefix (4 secondi, in parallelo).
export const maxDuration = 60;

// La risposta è un JSON breve; il resto lascia spazio al ragionamento, attivo di serie
// su Haiku 5.5 (con effort "low" pensa poco). Niente temperature/top_p: Haiku 5.5 li rifiuta.
const MAX_TOKENS = 8_000;
const TEMPO_MASSIMO_MS = 20_000;

const FORMATO = betaZodOutputFormat(schemaProposte);

function json(status: number, corpo: Record<string, unknown>) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

/** Nei log solo tipo e codici, mai i dati di chi scrive né l'output del modello che li riprende. */
function registra(contesto: string, dettagli: Record<string, unknown>) {
  console.error(`[nome-ditta] ${contesto}`, dettagli);
}

/**
 * POST /api/nome-ditta — { cognome, nome?, attivita, parole?, stile? }
 * → { proposte: [{ nome, perche, registro }] }.
 * Claude propone da 6 a 8 nomi; restano solo quelli con il cognome e senza
 * parole vietate (pulisciProposte). Per ognuno si cercano su Zefix le ditte
 * attive con le stesse parole (`registro`, solo indicativo). Senza accesso,
 * con un limite per connessione: se il limite non si può verificare la
 * richiesta si rifiuta, perché ogni chiamata a Claude costa.
 */
export async function POST(request: Request) {
  const anthropic = creaClientAnthropic();
  if (!anthropic) return json(503, { messaggio: MESSAGGI_NOME_DITTA.nonAttivo });

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, { messaggio: MESSAGGI_NOME_DITTA.richiestaNonValida });
  }
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return json(400, { messaggio: MESSAGGI_NOME_DITTA.richiestaNonValida });
  }
  const richiesta = leggiRichiestaNomi(corpo);
  if (!richiesta.ok) return json(400, { messaggio: richiesta.messaggio });

  // Si conta solo una richiesta valida, subito prima di chiamare Claude.
  const limite = await controllaLimite("nomeDitta");
  if (limite === "non_disponibile") return json(503, { messaggio: MESSAGGI_NOME_DITTA.occupato });
  if (limite === "superato") return json(429, { messaggio: MESSAGGI_NOME_DITTA.troppeRichieste });

  const modello = scegliModelloFunzione("nomeDitta");
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
        system: [{ type: "text", text: ISTRUZIONI_NOME_DITTA, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: messaggioNomeDitta(richiesta.dati) }],
      },
      { signal: request.signal, timeout: TEMPO_MASSIMO_MS, maxRetries: 1 },
    );

    if (risposta.stop_reason === "refusal" || risposta.stop_reason === "max_tokens" || !risposta.parsed_output) {
      registra("risposta non utilizzabile", {
        stop_reason: risposta.stop_reason,
        categoria: risposta.stop_details?.category ?? null,
        modello: risposta.model,
      });
      return json(502, { messaggio: MESSAGGI_NOME_DITTA.nonCapito });
    }

    const proposte = pulisciProposte(risposta.parsed_output, richiesta.dati);
    if (proposte.length === 0) {
      registra("nessuna proposta valida", {
        ricevute: risposta.parsed_output.proposte.length,
        modello: risposta.model,
      });
      return json(502, { messaggio: MESSAGGI_NOME_DITTA.nonCapito });
    }

    // Zefix non lancia errori: se non risponde, quel nome ha «non_disponibile».
    const registri = await Promise.all(proposte.map((p) => cercaSuZefix(p.nome, { segnale: request.signal })));
    return json(200, { proposte: proposte.map((p, i) => ({ ...p, registro: registri[i] })) });
  } catch (errore) {
    // Pagina chiusa o richiesta interrotta: non c'è nessuno a cui rispondere.
    if (errore instanceof Anthropic.APIUserAbortError || request.signal.aborted) {
      return json(499, { messaggio: MESSAGGI_NOME_DITTA.richiestaNonValida });
    }
    if (errore instanceof Anthropic.APIError) {
      registra("errore di Claude", dettagliErrore(errore));
      const occupato =
        errore instanceof Anthropic.RateLimitError ||
        errore instanceof Anthropic.APIConnectionError ||
        errore.status === 529 ||
        errore.type === "overloaded_error";
      return occupato
        ? json(503, { messaggio: MESSAGGI_NOME_DITTA.occupato })
        : json(502, { messaggio: MESSAGGI_NOME_DITTA.nonCapito });
    }
    // JSON incompleto o non valido: l'SDK lo segnala con un AnthropicError, il cui
    // messaggio può riportare pezzi dell'output. Nei log va solo il tipo.
    registra("output non leggibile", { tipo: errore instanceof Error ? errore.name : typeof errore });
    return json(502, { messaggio: MESSAGGI_NOME_DITTA.nonCapito });
  }
}
