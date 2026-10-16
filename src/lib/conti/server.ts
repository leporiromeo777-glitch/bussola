import "server-only";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { dettagliErrore } from "@/lib/chat/errori";
import { scegliModelloFunzione, supportaFallback } from "@/lib/chat/modello";
import { anthropicConfigurato } from "@/lib/chat/server";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";
import { dominioRicezione } from "./casella";
import {
  ISTRUZIONI_RICEVUTA,
  NOTE_LETTURA,
  datiDaCompilare,
  pulisciLettura,
  richiestaRicevuta,
  richiestaTestoEmail,
  schemaRicevuta,
  type DatiLetti,
} from "./lettura";
import { COLONNE_MOVIMENTO, movimentoDaRiga, rigaMovimentoLetto, type RigaMovimento } from "./righe";
import type { Movimento } from "./tipi";
import { MESSAGGI_CONTI } from "./validazione";

/**
 * «I tuoi conti» sul server: accesso, risposte JSON, Storage e lettura con
 * Claude delle ricevute. Nei log solo codici e tipi: mai importi, nomi,
 * testi delle email o file.
 */

export const BUCKET_RICEVUTE = "ricevute";

export function registra(contesto: string, dettagli: Record<string, unknown> = {}) {
  console.error(`[conti] ${contesto}`, dettagli);
}

export function json(status: number, corpo: unknown) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

export function errore(status: number, messaggio: string) {
  return json(status, { messaggio });
}

export function vuota() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

/** Errore del database come risposta: troppe righe (trigger) o errore generico. */
export function erroreDatabase(contesto: string, e: { code?: string; message?: string } | null) {
  registra(contesto, { code: e?.code ?? null });
  if (e?.code === "54000") {
    return errore(409, "Hai raggiunto il numero massimo di voci che Bleo può tenere. Scarica i conti ed elimina quelle vecchie.");
  }
  return errore(503, MESSAGGI_CONTI.erroreDatabase);
}

/** Ricezione delle email attiva: segreto del webhook, dominio, chiave Resend e chiave segreta di Supabase. */
export function ricezioneEmailAttiva(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(
    env.RESEND_WEBHOOK_SECRET?.trim() &&
      dominioRicezione(env.RESEND_DOMINIO_RICEZIONE) &&
      env.RESEND_API_KEY?.trim() &&
      env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      env.SUPABASE_SECRET_KEY?.trim(),
  );
}

export function funzioniConti() {
  return { lettura: anthropicConfigurato(), email: ricezioneEmailAttiva() };
}

export type AccessoConti = { ok: true; supabase: SupabaseClient; user: User } | { ok: false; risposta: Response };

/**
 * Utente della richiesta (cookie del sito o `Authorization: Bearer` dell'app)
 * con il suo client (RLS). 503 in modalità demo, 401 senza accesso.
 */
export async function accediConti(request: Request): Promise<AccessoConti> {
  const utente = await utenteDaRichiesta(request);
  if (utente.ok) return utente;
  return {
    ok: false,
    risposta:
      utente.motivo === "non_configurato"
        ? errore(503, MESSAGGI_CONTI.nonAttivo)
        : errore(401, MESSAGGI_CONTI.nonCollegato),
  };
}

/** Corpo JSON della richiesta, con un limite di caratteri; null se manca o non è JSON. */
export async function corpoJson(request: Request, massimo = 20_000): Promise<unknown | null> {
  if (!request.headers.get("content-type")?.includes("application/json")) return null;
  const lunghezza = Number(request.headers.get("content-length"));
  if (Number.isFinite(lunghezza) && lunghezza > massimo) return null;
  try {
    const testo = await request.text();
    if (testo.length > massimo) return null;
    return JSON.parse(testo) as unknown;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

export type TipoDocumento = "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | "text/plain";

const ESTENSIONI: Record<TipoDocumento, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/plain": "txt",
};

export function percorsoDocumento(userId: string, tipo: TipoDocumento, id: string = randomUUID()): string {
  return `${userId}/${id}.${ESTENSIONI[tipo]}`;
}

/** Cancella un documento (riga e file). Ignora gli errori: al massimo resta un file orfano, nei log. */
export async function cancellaDocumento(db: SupabaseClient, documentoId: string) {
  const { data } = await db.from("conti_documenti").select("percorso").eq("id", documentoId).maybeSingle();
  if (!data) return;
  const { error } = await db.from("conti_documenti").delete().eq("id", documentoId);
  if (error) registra("cancellazione del documento", { code: error.code });
  const rimozione = await db.storage.from(BUCKET_RICEVUTE).remove([data.percorso as string]);
  if (rimozione.error) registra("cancellazione del file", { status: rimozione.error.name });
}

/* ------------------------------------------------------------------ */
/* Claude                                                              */
/* ------------------------------------------------------------------ */

const FORMATO = betaZodOutputFormat(schemaRicevuta);
// La risposta è un JSON breve; effort "low": leggere una ricevuta non chiede un ragionamento lungo.
const MAX_TOKENS = 4_000;
const TEMPO_MASSIMO_MS = 25_000;

export type ContenutoDaLeggere =
  | { tipo: "image/jpeg" | "image/png" | "image/webp" | "application/pdf"; base64: string; contesto?: { mittente: string; oggetto: string } }
  | { tipo: "text/plain"; testo: string; mittente: string; oggetto: string };

function blocchi(contenuto: ContenutoDaLeggere): Anthropic.Beta.BetaContentBlockParam[] {
  if (contenuto.tipo === "text/plain") {
    return [{ type: "text", text: richiestaTestoEmail({ mittente: contenuto.mittente, oggetto: contenuto.oggetto, testo: contenuto.testo }) }];
  }
  const file: Anthropic.Beta.BetaContentBlockParam =
    contenuto.tipo === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: contenuto.base64 } }
      : { type: "image", source: { type: "base64", media_type: contenuto.tipo, data: contenuto.base64 } };
  return [file, { type: "text", text: richiestaRicevuta(contenuto.contesto) }];
}

export type EsitoClaude = { ok: true; output: unknown } | { ok: false; occupato: boolean };

/** Chiede a Claude i dati di una ricevuta. Non lancia errori. */
export async function leggiConClaude(
  anthropic: Anthropic,
  contenuto: ContenutoDaLeggere,
  segnale?: AbortSignal,
): Promise<EsitoClaude> {
  const modello = scegliModelloFunzione("ricevuta");
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
        system: [{ type: "text", text: ISTRUZIONI_RICEVUTA, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: blocchi(contenuto) }],
      },
      { signal: segnale, timeout: TEMPO_MASSIMO_MS, maxRetries: 1 },
    );
    if (risposta.stop_reason === "refusal" || risposta.stop_reason === "max_tokens" || !risposta.parsed_output) {
      registra("lettura non utilizzabile", {
        file: contenuto.tipo,
        stop_reason: risposta.stop_reason,
        modello: risposta.model,
      });
      return { ok: false, occupato: false };
    }
    return { ok: true, output: risposta.parsed_output };
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      registra("errore di Claude", { file: contenuto.tipo, ...dettagliErrore(e) });
      const occupato =
        e instanceof Anthropic.RateLimitError ||
        e instanceof Anthropic.APIConnectionError ||
        e.status === 529 ||
        e.type === "overloaded_error";
      return { ok: false, occupato };
    }
    // Il messaggio di un errore di parsing può riportare pezzi dell'output: nei log solo il tipo.
    registra("output non leggibile", { tipo: e instanceof Error ? e.name : typeof e });
    return { ok: false, occupato: false };
  }
}

/* ------------------------------------------------------------------ */
/* Ricevuta: file nello Storage, lettura, movimento da confermare      */
/* ------------------------------------------------------------------ */

export type RegistrazioneRicevuta = {
  /** Client dell'utente (RLS) o client con la chiave segreta (email). */
  db: SupabaseClient;
  userId: string;
  file: { tipo: TipoDocumento; byte: Uint8Array; nome: string | null };
  /** Cosa mandare a Claude; null se la lettura è spenta o il limite del giorno è raggiunto. */
  contenuto: ContenutoDaLeggere | null;
  /** Nota quando non si legge (contenuto null). */
  notaSenzaLettura?: string;
  /** Descrizione di partenza se non si legge (per esempio l'oggetto dell'email). */
  descrizioneDiRipiego?: string;
  origine: "foto" | "email";
  emailId?: string | null;
  oggi: string;
  anthropic: Anthropic | null;
  segnale?: AbortSignal;
};

export type EsitoRicevuta =
  | { esito: "creato"; movimento: Movimento }
  | { esito: "non_ricevuta" }
  | { esito: "errore"; codice?: string };

/**
 * Salva il file nello Storage, lo fa leggere a Claude (se si può) e crea il
 * movimento «da confermare» con origine foto o email. Se Claude dice che non
 * è una ricevuta, cancella il file e non crea niente. Se Claude non riesce,
 * il movimento resta vuoto con una nota: il documento non si perde.
 */
export async function registraRicevuta(r: RegistrazioneRicevuta): Promise<EsitoRicevuta> {
  const percorso = percorsoDocumento(r.userId, r.file.tipo);
  const caricamento = await r.db.storage.from(BUCKET_RICEVUTE).upload(percorso, r.file.byte, {
    contentType: r.file.tipo === "text/plain" ? "text/plain; charset=utf-8" : r.file.tipo,
    upsert: false,
  });
  if (caricamento.error) {
    registra("caricamento del file", { file: r.file.tipo, errore: caricamento.error.name });
    return { esito: "errore" };
  }

  const documento = await r.db
    .from("conti_documenti")
    .insert({
      user_id: r.userId,
      percorso,
      tipo: r.file.tipo,
      nome_file: r.file.nome,
      byte: r.file.byte.byteLength,
      origine: r.origine,
      email_id: r.emailId ?? null,
    })
    .select("id")
    .single();
  if (documento.error || !documento.data) {
    registra("salvataggio del documento", { code: documento.error?.code ?? null });
    await r.db.storage.from(BUCKET_RICEVUTE).remove([percorso]);
    return { esito: "errore", codice: documento.error?.code };
  }
  const documentoId = documento.data.id as string;

  let dati: DatiLetti;
  if (r.contenuto && r.anthropic) {
    const letta = await leggiConClaude(r.anthropic, r.contenuto, r.segnale);
    if (letta.ok) {
      const pulita = pulisciLettura(letta.output, r.oggi);
      if (pulita.stato === "non_ricevuta") {
        await cancellaDocumento(r.db, documentoId);
        return { esito: "non_ricevuta" };
      }
      dati = pulita.dati;
    } else {
      dati = datiDaCompilare(r.oggi, NOTE_LETTURA.nonRiuscita, r.descrizioneDiRipiego);
    }
  } else {
    dati = datiDaCompilare(r.oggi, r.notaSenzaLettura ?? NOTE_LETTURA.compilaTu, r.descrizioneDiRipiego);
  }

  const movimento = await r.db
    .from("conti_movimenti")
    .insert(rigaMovimentoLetto(r.userId, dati, r.origine, documentoId))
    .select(COLONNE_MOVIMENTO)
    .single();
  if (movimento.error || !movimento.data) {
    registra("salvataggio del movimento letto", { code: movimento.error?.code ?? null });
    await cancellaDocumento(r.db, documentoId);
    return { esito: "errore", codice: movimento.error?.code };
  }
  return { esito: "creato", movimento: movimentoDaRiga(movimento.data as unknown as RigaMovimento) };
}

/** Conta una lettura con Claude per l'utente: true se consentita, false se il limite del giorno è raggiunto, null se non si sa. */
export async function prenotaLettura(db: SupabaseClient, userId?: string): Promise<boolean | null> {
  const { data, error } = await db.rpc("prenota_lettura_conti", userId ? { p_user_id: userId } : {});
  if (error) {
    registra("limite delle letture", { code: error.code ?? null });
    return null;
  }
  return data === true;
}


/**
 * Tutte le righe di una query, a pagine di 1000: PostgREST su Supabase ne
 * restituisce al massimo 1000 per richiesta. `pagina(da, a)` costruisce la
 * query con .range(da, a). Al massimo 50 pagine.
 */
export async function tutteLeRighe<T>(
  pagina: (da: number, a: number) => PromiseLike<{ data: T[] | null; error: { code?: string; message?: string } | null }>,
): Promise<{ righe: T[]; errore: { code?: string; message?: string } | null }> {
  const righe: T[] = [];
  const passo = 1000;
  for (let i = 0; i < 50; i++) {
    const { data, error } = await pagina(i * passo, (i + 1) * passo - 1);
    if (error) return { righe, errore: error };
    righe.push(...(data ?? []));
    if (!data || data.length < passo) break;
  }
  return { righe, errore: null };
}
