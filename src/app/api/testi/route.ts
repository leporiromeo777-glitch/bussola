import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { connection } from "next/server";
import { dettagliErrore } from "@/lib/chat/errori";
import { scegliModelloFunzione, supportaFallback } from "@/lib/chat/modello";
import { anthropicConfigurato, creaClientAnthropic } from "@/lib/chat/server";
import { controllaLimite } from "@/lib/limiti/server";
import { utentePerLimite } from "@/lib/limiti/utente";
import { createAdminClient } from "@/lib/supabase/admin";
import { ISTRUZIONI_TESTI, messaggioTesti } from "@/lib/testi/istruzioni";
import { MESSAGGI_TESTI, leggiRichiestaTesti, pulisciTesti, schemaOutputTesti } from "@/lib/testi/richiesta";

// Una sola chiamata a Claude, non in streaming: al massimo 2 tentativi da 25 secondi.
export const maxDuration = 60;

// I testi sono brevi (qualche centinaio di parole); il resto lascia spazio al ragionamento,
// attivo di serie su Haiku 5.5 (con effort "low" pensa poco). Niente temperature/top_p: Haiku 5.5 li rifiuta.
const MAX_TOKENS = 8_000;
const TEMPO_MASSIMO_MS = 25_000;

const FORMATO = betaZodOutputFormat(schemaOutputTesti);

function json(status: number, corpo: Record<string, unknown>) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

/** Nei log solo tipo e codici, mai i dati di chi scrive né i testi del modello che li riprendono. */
function registra(contesto: string, dettagli: Record<string, unknown>) {
  console.error(`[testi] ${contesto}`, dettagli);
}

/**
 * GET /api/testi — { attiva }: lo strumento si può usare (Claude e il limite
 * delle richieste configurati)? La usa l'app per mostrare subito «non ancora
 * attivo», come fa la pagina del sito.
 */
export async function GET() {
  // Al momento della richiesta: dipende dalle variabili d'ambiente del server.
  await connection();
  return json(200, { attiva: anthropicConfigurato() && createAdminClient() !== null });
}

/**
 * POST /api/testi — { tipo, descrizione, nome?, luogo?, clienti?, tono, lingua?, rifai? }
 * → { testi: [{ titolo, testo }] }.
 * Bleo scrive testi pronti per la nuova attività (bio e descrizione, prima
 * email a un cliente, introduzione al preventivo, attività in breve) solo da
 * quello che la persona ha scritto. Senza accesso, ma con un limite per
 * connessione; con l'accesso (sito o app con `Authorization: Bearer`) lo
 * stesso limite vale per account. Se il limite non si può verificare la
 * richiesta si rifiuta, perché ogni chiamata a Claude costa.
 */
export async function POST(request: Request) {
  const anthropic = creaClientAnthropic();
  if (!anthropic) return json(503, { messaggio: MESSAGGI_TESTI.nonAttivo });

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, { messaggio: MESSAGGI_TESTI.richiestaNonValida });
  }
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return json(400, { messaggio: MESSAGGI_TESTI.richiestaNonValida });
  }
  const richiesta = leggiRichiestaTesti(corpo);
  if (!richiesta.ok) return json(400, { messaggio: richiesta.messaggio });

  // Si conta solo una richiesta valida, subito prima di chiamare Claude.
  const limite = await controllaLimite("testi", { utenteId: await utentePerLimite(request) });
  if (limite === "non_disponibile") return json(503, { messaggio: MESSAGGI_TESTI.occupato });
  if (limite === "superato") return json(429, { messaggio: MESSAGGI_TESTI.troppeRichieste });

  const { tipo, tono, lingua } = richiesta.dati;
  const modello = scegliModelloFunzione("testi");
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
        system: [{ type: "text", text: ISTRUZIONI_TESTI, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: messaggioTesti(richiesta.dati) }],
      },
      { signal: request.signal, timeout: TEMPO_MASSIMO_MS, maxRetries: 1 },
    );

    if (risposta.stop_reason === "refusal" || risposta.stop_reason === "max_tokens" || !risposta.parsed_output) {
      registra("risposta non utilizzabile", {
        stop_reason: risposta.stop_reason,
        categoria: risposta.stop_details?.category ?? null,
        modello: risposta.model,
      });
      return json(502, { messaggio: MESSAGGI_TESTI.nonRiuscito });
    }

    const testi = pulisciTesti(risposta.parsed_output, tipo, tono, lingua);
    if (testi.length === 0) {
      registra("nessun testo utilizzabile", { tipo, modello: risposta.model });
      return json(502, { messaggio: MESSAGGI_TESTI.nonRiuscito });
    }
    return json(200, { testi });
  } catch (errore) {
    // Pagina chiusa o richiesta interrotta: non c'è nessuno a cui rispondere.
    if (errore instanceof Anthropic.APIUserAbortError || request.signal.aborted) {
      return json(499, { messaggio: MESSAGGI_TESTI.richiestaNonValida });
    }
    if (errore instanceof Anthropic.APIError) {
      registra("errore di Claude", dettagliErrore(errore));
      const occupato =
        errore instanceof Anthropic.RateLimitError ||
        errore instanceof Anthropic.APIConnectionError ||
        errore.status === 529 ||
        errore.type === "overloaded_error";
      return occupato
        ? json(503, { messaggio: MESSAGGI_TESTI.occupato })
        : json(502, { messaggio: MESSAGGI_TESTI.nonRiuscito });
    }
    // JSON incompleto o non valido: l'SDK lo segnala con un AnthropicError, il cui
    // messaggio può riportare pezzi dell'output. Nei log va solo il tipo.
    registra("output non leggibile", { tipo: errore instanceof Error ? errore.name : typeof errore });
    return json(502, { messaggio: MESSAGGI_TESTI.nonRiuscito });
  }
}
