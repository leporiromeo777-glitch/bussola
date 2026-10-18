import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EsitoEliminazione } from "./esiti";

/**
 * Bucket dello Storage con una cartella "<user_id>/" per utente: le ricevute
 * di «I tuoi conti» (migrazione 20261017000000_conti.sql) e il cassetto dei
 * documenti (migrazione 20261019000004_cassetto_documenti.sql).
 */
export const BUCKET_UTENTE = ["ricevute", "cassetto"] as const;

/**
 * Cancella tutti i file dell'utente nello Storage (la sua cartella in ogni
 * bucket di BUCKET_UTENTE). Supabase non cancella un utente che possiede file
 * nello Storage, e i file non hanno "on delete cascade": vanno tolti prima.
 */
export async function cancellaFileUtente(admin: SupabaseClient, userId: string): Promise<boolean> {
  for (const bucket of BUCKET_UTENTE) {
    if (!(await cancellaCartella(admin, bucket, userId))) return false;
  }
  return true;
}

/**
 * Cancella i file della cartella "<user_id>/" di un bucket, a gruppi di 1000.
 * Se il bucket non esiste (migrazione non ancora eseguita) non c'è niente da
 * cancellare.
 */
async function cancellaCartella(admin: SupabaseClient, nomeBucket: string, userId: string): Promise<boolean> {
  const bucket = admin.storage.from(nomeBucket);
  for (let giro = 0; giro < 100; giro++) {
    const { data, error } = await bucket.list(userId, { limit: 1000 });
    if (error) {
      if (/not.?found/i.test(error.message)) return true;
      console.error("[account] elenco dei file", { bucket: nomeBucket, nome: error.name });
      return false;
    }
    const file = (data ?? []).filter((f) => f.name && f.name !== ".emptyFolderPlaceholder");
    if (file.length === 0) return true;
    const rimozione = await bucket.remove(file.map((f) => `${userId}/${f.name}`));
    if (rimozione.error) {
      console.error("[account] cancellazione dei file", { bucket: nomeBucket, nome: rimozione.error.name });
      return false;
    }
  }
  return false;
}

/**
 * Elimina per sempre l'account di un utente già verificato (sito o app).
 *
 * Prima i file nello Storage (ricevute, PDF e allegati delle email di «I tuoi
 * conti», documenti del cassetto), poi l'utente da Supabase Auth: tutte le
 * tabelle con i suoi dati (profili, questionari, passi_completati,
 * domande_chat, le chat salvate in chat_conversazioni e chat_messaggi, le
 * tabelle conti_* e cassetto_documenti) puntano ad auth.users con "on delete cascade" e si svuotano
 * insieme. Lo controlla supabase/schema.test.ts: una tabella nuova senza
 * cascade fa fallire il test.
 * La lista d'attesa è un'iscrizione separata (per email, senza account) e
 * ha il suo link per disiscriversi; limiti_richieste non contiene utenti.
 *
 * Serve la chiave segreta: senza, esito "non_configurato". Se i file non si
 * cancellano l'account resta: meglio riprovare che lasciare documenti orfani.
 */
export async function eliminaAccount(userId: string): Promise<EsitoEliminazione> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, motivo: "non_configurato" };
  try {
    if (!(await cancellaFileUtente(admin, userId))) return { ok: false, motivo: "errore" };
    // shouldSoftDelete = false: cancellazione vera, non solo disattivazione.
    const { error } = await admin.auth.admin.deleteUser(userId, false);
    if (error) {
      console.error("[account] eliminazione", { status: error.status, code: error.code, message: error.message });
      return { ok: false, motivo: "errore" };
    }
    return { ok: true };
  } catch (errore) {
    console.error("[account] eliminazione", errore instanceof Error ? errore.message : String(errore));
    return { ok: false, motivo: "errore" };
  }
}
