import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import { dettagliErrore, messaggioErrore } from "./errori";
import type { DipendenzeChat } from "./flusso";
import { FRAMMENTI_PER_DOMANDA, leggiFrammenti } from "./frammenti";
import { scegliModello, supportaFallback } from "./modello";
import { calcolaQuota, inizioMese, type ProfiloPiano, type Quota } from "./quota";

type ClientSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

const MAX_TOKENS = 8_000;

/** true se la chiave di Claude è impostata; senza, la chat è in modalità demo. */
export function anthropicConfigurato(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Client Claude; null se ANTHROPIC_API_KEY manca (modalità demo). */
export function creaClientAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  // Il tempo massimo vale fino all'inizio dello streaming; resta sotto maxDuration della route.
  return new Anthropic({ apiKey, maxRetries: 2, timeout: 45_000 });
}

export function registraErrore(contesto: string, errore: unknown) {
  console.error(`[chat] ${contesto}`, dettagliErrore(errore));
}

/**
 * Quota del mese per l'utente collegato: piano dal profilo e domande del mese
 * da domande_chat (entrambe lette con la RLS dell'utente). Null se la lettura
 * non riesce.
 */
export async function leggiQuota(supabase: ClientSupabase, userId: string, ora = new Date()): Promise<Quota | null> {
  const [profilo, conteggio] = await Promise.all([
    supabase.from("profili").select("piano, piano_scade_il").eq("id", userId).maybeSingle(),
    supabase
      .from("domande_chat")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("creato_il", inizioMese(ora).toISOString()),
  ]);
  if (profilo.error || conteggio.error) {
    registraErrore("lettura della quota", profilo.error ?? conteggio.error);
    return null;
  }
  return calcolaQuota((profilo.data as ProfiloPiano | null) ?? null, conteggio.count ?? 0, ora);
}

export type PrenotazioneDomanda = { tipo: "prenotata"; id: number } | { tipo: "quota_esaurita" } | { tipo: "errore" };

/**
 * Prenota la domanda con public.prenota_domanda: controlla la quota e scrive
 * la riga in un colpo solo, sotto un lock per utente. Così né le richieste
 * parallele né quelle interrotte a metà superano la quota.
 */
export async function prenotaDomanda(supabase: ClientSupabase, domanda: string): Promise<PrenotazioneDomanda> {
  const { data, error } = await supabase.rpc("prenota_domanda", { p_domanda: domanda });
  if (error) {
    registraErrore("prenotazione della domanda", new Error(`prenota_domanda: ${error.code ?? "?"} ${error.message}`));
    return { tipo: "errore" };
  }
  if (data === null) return { tipo: "quota_esaurita" };
  const id = Number(data);
  if (!Number.isSafeInteger(id)) {
    registraErrore("prenotazione della domanda", new Error("prenota_domanda: id non valido"));
    return { tipo: "errore" };
  }
  return { tipo: "prenotata", id };
}

/** Collega la chat a Supabase (ricerca e registro) e a Claude (risposta in streaming). */
export function dipendenzeChat(opzioni: {
  supabase: ClientSupabase;
  userId: string;
  /** Riga di domande_chat prenotata per questa domanda. */
  idDomanda: number;
  anthropic: Anthropic;
  segnale: AbortSignal;
}): DipendenzeChat {
  const { supabase, userId, idDomanda, anthropic, segnale } = opzioni;
  return {
    async cerca(testo) {
      const { data, error } = await supabase.rpc("cerca_frammenti", {
        domanda: testo,
        quanti: FRAMMENTI_PER_DOMANDA,
      });
      if (error) throw new Error(`cerca_frammenti: ${error.message}`);
      return leggiFrammenti(data);
    },

    genera({ istruzioni, contenuto }) {
      const modello = scegliModello(process.env.ANTHROPIC_MODEL);
      const flusso = anthropic.beta.messages.stream(
        {
          model: modello,
          max_tokens: MAX_TOKENS,
          output_config: { effort: "medium" },
          // Se i filtri di sicurezza rifiutano la richiesta, il server riprova con il modello consigliato.
          ...(supportaFallback(modello)
            ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
            : {}),
          system: [{ type: "text", text: istruzioni, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: contenuto }],
        },
        { signal: segnale },
      );
      return {
        async *testi() {
          for await (const evento of flusso) {
            if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
              yield evento.delta.text;
            }
          }
        },
        messaggioFinale: () => flusso.finalMessage(),
      };
    },

    async salva(registro) {
      const { error } = await supabase.rpc("chiudi_domanda", {
        p_id: idDomanda,
        p_fonti: registro.fonti_citate,
        p_senza: registro.senza_risposta,
      });
      if (error) throw new Error(`chiudi_domanda: ${error.message}`);
    },

    async annulla() {
      // Interrotta da chi chiede: la domanda resta contata.
      if (segnale.aborted) return;
      // Solo con la chiave segreta: all'utente non si dà un modo per azzerarsi la quota.
      const admin = createAdminClient();
      if (!admin) return;
      const { error } = await admin.from("domande_chat").delete().eq("id", idDomanda).eq("user_id", userId);
      if (error) throw new Error(`domande_chat (annullamento): ${error.message}`);
    },

    descriviErrore: messaggioErrore,
    registraErrore,
  };
}
