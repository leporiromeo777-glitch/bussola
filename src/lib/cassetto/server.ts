import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";
import { DURATA_LINK_CASSETTO } from "./limiti";
import type { DocumentoCassetto, TipoFileCassetto } from "./tipi";
import { COLONNE_DOCUMENTO, MESSAGGI_CASSETTO, documentoDaRiga, type NuovoDocumento, type RigaDocumento } from "./validazione";

/**
 * «Cassetto dei documenti» sul server: accesso, risposte JSON e Storage.
 * Tutto con il client dell'utente (RLS sulla tabella e sullo Storage), mai
 * con la chiave segreta. Nei log solo codici e tipi: mai titoli, note o file.
 */

/** Bucket privato della migrazione 20261019000004_cassetto_documenti.sql. */
export const BUCKET_CASSETTO = "cassetto";

export function registra(contesto: string, dettagli: Record<string, unknown> = {}) {
  console.error(`[cassetto] ${contesto}`, dettagli);
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

/** Errore del database come risposta: troppi documenti (trigger) o errore generico. */
export function erroreDatabase(contesto: string, e: { code?: string } | null) {
  registra(contesto, { code: e?.code ?? null });
  if (e?.code === "54000") return errore(409, MESSAGGI_CASSETTO.troppi);
  return errore(503, MESSAGGI_CASSETTO.erroreDatabase);
}

/** Corpo JSON di una richiesta piccola (modifiche), con un limite di caratteri; null se manca o non è JSON. */
export async function corpoJson(request: Request, massimo = 10_000): Promise<unknown | null> {
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

export type AccessoCassetto = { ok: true; supabase: SupabaseClient; user: User } | { ok: false; risposta: Response };

/**
 * Utente della richiesta (cookie del sito o `Authorization: Bearer` dell'app)
 * con il suo client (RLS). 503 in modalità demo, 401 senza accesso.
 */
export async function accediCassetto(request: Request): Promise<AccessoCassetto> {
  const utente = await utenteDaRichiesta(request);
  if (utente.ok) return utente;
  return {
    ok: false,
    risposta:
      utente.motivo === "non_configurato"
        ? errore(503, MESSAGGI_CASSETTO.nonAttivo)
        : errore(401, MESSAGGI_CASSETTO.nonCollegato),
  };
}

const ESTENSIONI: Record<TipoFileCassetto, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** "<user_id>/<uuid>.<estensione>": un nome casuale, mai quello del file dell'utente. */
export function percorsoFileCassetto(userId: string, tipo: TipoFileCassetto, id: string = randomUUID()): string {
  return `${userId}/${id}.${ESTENSIONI[tipo]}`;
}

export type EsitoSalvataggio = { ok: true; documento: DocumentoCassetto } | { ok: false; codice?: string };

/** Carica il file nella cartella dell'utente e crea la riga. Se la riga non si salva, il file si cancella. */
export async function salvaDocumento(db: SupabaseClient, userId: string, nuovo: NuovoDocumento): Promise<EsitoSalvataggio> {
  const percorso = percorsoFileCassetto(userId, nuovo.file.tipo);
  const byte = Buffer.from(nuovo.file.dati, "base64");
  const caricamento = await db.storage.from(BUCKET_CASSETTO).upload(percorso, byte, {
    contentType: nuovo.file.tipo,
    upsert: false,
  });
  if (caricamento.error) {
    registra("caricamento del file", { file: nuovo.file.tipo, errore: caricamento.error.name });
    return { ok: false };
  }
  const { data, error } = await db
    .from("cassetto_documenti")
    .insert({
      user_id: userId,
      titolo: nuovo.titolo,
      tipo: nuovo.tipo,
      scade_il: nuovo.scadeIl,
      nota: nuovo.nota,
      percorso,
      tipo_file: nuovo.file.tipo,
      nome_file: nuovo.file.nome,
      byte: byte.byteLength,
    })
    .select(COLONNE_DOCUMENTO)
    .single();
  if (error || !data) {
    registra("salvataggio del documento", { code: error?.code ?? null });
    const rimozione = await db.storage.from(BUCKET_CASSETTO).remove([percorso]);
    if (rimozione.error) registra("cancellazione del file rimasto", { errore: rimozione.error.name });
    return { ok: false, codice: error?.code };
  }
  return { ok: true, documento: documentoDaRiga(data as unknown as RigaDocumento) };
}

/**
 * Cancella un documento: prima il file (è la parte delicata), poi la riga.
 * Se il file non si cancella la riga resta e si può riprovare.
 */
export async function cancellaDocumentoCassetto(db: SupabaseClient, id: string): Promise<"ok" | "non_trovato" | "errore"> {
  const { data, error } = await db.from("cassetto_documenti").select("percorso").eq("id", id).maybeSingle();
  if (error) {
    registra("lettura del documento", { code: error.code ?? null });
    return "errore";
  }
  if (!data) return "non_trovato";
  const rimozione = await db.storage.from(BUCKET_CASSETTO).remove([data.percorso as string]);
  if (rimozione.error) {
    registra("cancellazione del file", { errore: rimozione.error.name });
    return "errore";
  }
  const cancellazione = await db.from("cassetto_documenti").delete().eq("id", id);
  if (cancellazione.error) {
    registra("cancellazione del documento", { code: cancellazione.error.code ?? null });
    return "errore";
  }
  return "ok";
}

/** Link temporaneo (DURATA_LINK_CASSETTO secondi) per aprire il file; null se il documento non c'è. */
export async function linkDocumento(
  db: SupabaseClient,
  id: string,
): Promise<{ esito: "ok"; url: string } | { esito: "non_trovato" } | { esito: "errore" }> {
  const { data, error } = await db.from("cassetto_documenti").select("percorso").eq("id", id).maybeSingle();
  if (error) {
    registra("lettura del documento", { code: error.code ?? null });
    return { esito: "errore" };
  }
  if (!data) return { esito: "non_trovato" };
  const link = await db.storage.from(BUCKET_CASSETTO).createSignedUrl(data.percorso as string, DURATA_LINK_CASSETTO);
  if (link.error || !link.data?.signedUrl) {
    registra("link del documento", { errore: link.error?.name ?? null });
    return { esito: "errore" };
  }
  return { esito: "ok", url: link.data.signedUrl };
}
