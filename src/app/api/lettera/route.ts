import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { connection } from "next/server";
import { dettagliErrore } from "@/lib/chat/errori";
import { scegliModelloFunzione, supportaFallback } from "@/lib/chat/modello";
import { anthropicConfigurato, creaClientAnthropic } from "@/lib/chat/server";
import { controllaLimite } from "@/lib/limiti/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/env";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";
import {
  CORPO_MASSIMO,
  MESSAGGI_LETTERA,
  PAGINE_MASSIME_PDF,
  leggiRichiestaLettera,
  stimaPaginePdf,
  type RichiestaLettera,
} from "@/lib/lettera/richiesta";
import { ISTRUZIONI_LETTERA, RICHIESTA_LETTERA, pulisciSpiegazione, schemaLettera } from "@/lib/lettera/spiegazione";

// Una sola chiamata a Claude, non in streaming: al massimo 2 tentativi da 25 secondi.
export const maxDuration = 60;

// La risposta è un JSON breve; il resto lascia spazio al ragionamento (attivo di serie).
// Effort "low": leggere e riassumere una lettera non chiede un ragionamento lungo
// e la risposta deve arrivare entro il tempo massimo della funzione.
const MAX_TOKENS = 8_000;
const TEMPO_MASSIMO_MS = 25_000;

const FORMATO = betaZodOutputFormat(schemaLettera);

function json(status: number, corpo: Record<string, unknown>) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

/** Nei log solo tipo di file e codici: mai l'immagine, il PDF o il testo della spiegazione. */
function registra(contesto: string, dettagli: Record<string, unknown>) {
  console.error(`[lettera] ${contesto}`, dettagli);
}

/** Il file della lettera come blocco per Claude: immagine o documento PDF (senza citazioni, incompatibili con lo structured output). */
function bloccoLettera({ tipo, dati }: RichiestaLettera): Anthropic.Beta.BetaContentBlockParam {
  if (tipo === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: dati } };
  }
  return { type: "image", source: { type: "base64", media_type: tipo, data: dati } };
}

/**
 * Id dell'utente se la richiesta ha un accesso valido (cookie del sito o
 * `Authorization: Bearer` dell'app), altrimenti null. L'accesso non serve
 * per leggere una lettera: decide solo come si conta il limite. Un token
 * scaduto o non valido vale come nessun accesso (si conta per connessione).
 */
async function utenteFacoltativo(request: Request): Promise<string | null> {
  if (!supabaseConfigured()) return null;
  const utente = await utenteDaRichiesta(request);
  return utente.ok ? utente.user.id : null;
}

/**
 * GET /api/lettera — { attiva }: la funzione si può usare (Claude e il
 * limite delle richieste configurati)? La usa l'app per mostrare subito
 * «non ancora attiva» invece di farti scattare la foto per niente.
 */
export async function GET() {
  // Al momento della richiesta: dipende dalle variabili d'ambiente del server.
  await connection();
  return json(200, { attiva: anthropicConfigurato() && createAdminClient() !== null });
}

/**
 * POST /api/lettera — { tipo, dati } → { spiegazione }.
 * `tipo` è image/jpeg, image/png, image/webp o application/pdf; `dati` il file
 * in base64 (senza «data:…;base64,»). Claude legge la lettera e la spiega in
 * italiano semplice (src/lib/lettera/spiegazione.ts). Il file non si salva:
 * passa solo da qui a Claude. Senza accesso, ma con un limite per
 * connessione; con l'accesso (sito o app con `Authorization: Bearer`) lo
 * stesso limite vale per account, perché dietro una connessione mobile
 * possono esserci molte persone. Se il limite non si può verificare la
 * richiesta si rifiuta, perché ogni chiamata a Claude costa.
 */
export async function POST(request: Request) {
  const anthropic = creaClientAnthropic();
  if (!anthropic) return json(503, { messaggio: MESSAGGI_LETTERA.nonAttivo });

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, { messaggio: MESSAGGI_LETTERA.richiestaNonValida });
  }
  const lunghezza = Number(request.headers.get("content-length"));
  if (Number.isFinite(lunghezza) && lunghezza > CORPO_MASSIMO) {
    return json(413, { messaggio: MESSAGGI_LETTERA.fileGrande });
  }
  let corpo: unknown;
  try {
    const testo = await request.text();
    if (testo.length > CORPO_MASSIMO) return json(413, { messaggio: MESSAGGI_LETTERA.fileGrande });
    corpo = JSON.parse(testo);
  } catch {
    return json(400, { messaggio: MESSAGGI_LETTERA.richiestaNonValida });
  }
  const richiesta = leggiRichiestaLettera(corpo);
  if (!richiesta.ok) return json(richiesta.stato, { messaggio: richiesta.messaggio });

  if (richiesta.dati.tipo === "application/pdf") {
    const pagine = stimaPaginePdf(Buffer.from(richiesta.dati.dati, "base64"));
    if (pagine !== null && pagine > PAGINE_MASSIME_PDF) return json(413, { messaggio: MESSAGGI_LETTERA.pdfLungo });
  }

  // Si conta solo una richiesta valida, subito prima di chiamare Claude.
  const limite = await controllaLimite("lettera", { utenteId: await utenteFacoltativo(request) });
  if (limite === "non_disponibile") return json(503, { messaggio: MESSAGGI_LETTERA.occupato });
  if (limite === "superato") return json(429, { messaggio: MESSAGGI_LETTERA.troppeRichieste });

  const modello = scegliModelloFunzione("lettera");
  try {
    const risposta = await anthropic.beta.messages.parse(
      {
        model: modello,
        max_tokens: MAX_TOKENS,
        output_config: { effort: "low", format: FORMATO },
        // Se i filtri di sicurezza rifiutano la richiesta, il server riprova con il modello consigliato.
        ...(supportaFallback(modello)
          ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
          : {}),
        system: [{ type: "text", text: ISTRUZIONI_LETTERA, cache_control: { type: "ephemeral" } }],
        messages: [
          {
            role: "user",
            content: [bloccoLettera(richiesta.dati), { type: "text", text: RICHIESTA_LETTERA }],
          },
        ],
      },
      { signal: request.signal, timeout: TEMPO_MASSIMO_MS, maxRetries: 1 },
    );

    if (risposta.stop_reason === "refusal" || risposta.stop_reason === "max_tokens" || !risposta.parsed_output) {
      registra("risposta non utilizzabile", {
        file: richiesta.dati.tipo,
        stop_reason: risposta.stop_reason,
        categoria: risposta.stop_details?.category ?? null,
        modello: risposta.model,
      });
      return json(502, { messaggio: MESSAGGI_LETTERA.nonCapito });
    }

    return json(200, { spiegazione: pulisciSpiegazione(risposta.parsed_output) });
  } catch (errore) {
    // Pagina chiusa o richiesta interrotta: non c'è nessuno a cui rispondere.
    if (errore instanceof Anthropic.APIUserAbortError || request.signal.aborted) {
      return json(499, { messaggio: MESSAGGI_LETTERA.richiestaNonValida });
    }
    if (errore instanceof Anthropic.APIError) {
      registra("errore di Claude", { file: richiesta.dati.tipo, ...dettagliErrore(errore) });
      const occupato =
        errore instanceof Anthropic.RateLimitError ||
        errore instanceof Anthropic.APIConnectionError ||
        errore.status === 529 ||
        errore.type === "overloaded_error";
      return occupato
        ? json(503, { messaggio: MESSAGGI_LETTERA.occupato })
        : json(502, { messaggio: MESSAGGI_LETTERA.nonCapito });
    }
    // JSON incompleto o non valido: l'SDK lo segnala con un AnthropicError, il cui
    // messaggio può riportare pezzi dell'output. Nei log va solo il tipo.
    registra("output non leggibile", { tipo: errore instanceof Error ? errore.name : typeof errore });
    return json(502, { messaggio: MESSAGGI_LETTERA.nonCapito });
  }
}
