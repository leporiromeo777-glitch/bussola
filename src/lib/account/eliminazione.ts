import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EsitoEliminazione } from "./esiti";

/** Bucket dello Storage con le ricevute di «I tuoi conti» (migrazione 20261017000000_conti.sql). */
const BUCKET_RICEVUTE = "ricevute";

/**
 * Cancella tutti i file dell'utente nello Storage (cartella "<user_id>/" del
 * bucket delle ricevute), a gruppi di 1000. Supabase non cancella un utente
 * che possiede file nello Storage, e i file non hanno "on delete cascade":
 * vanno tolti prima. Se il bucket non esiste (migrazione dei conti non
 * ancora eseguita) non c'è niente da cancellare.
 */
export async function cancellaFileUtente(admin: SupabaseClient, userId: string): Promise<boolean> {
  const bucket = admin.storage.from(BUCKET_RICEVUTE);
  for (let giro = 0; giro < 100; giro++) {
    const { data, error } = await bucket.list(userId, { limit: 1000 });
    if (error) {
      if (/not.?found/i.test(error.message)) return true;
      console.error("[account] elenco dei file", { nome: error.name });
      return false;
    }
    const file = (data ?? []).filter((f) => f.name && f.name !== ".emptyFolderPlaceholder");
    if (file.length === 0) return true;
    const rimozione = await bucket.remove(file.map((f) => `${userId}/${f.name}`));
    if (rimozione.error) {
      console.error("[account] cancellazione dei file", { nome: rimozione.error.name });
      return false;
    }
  }
  return false;
}

/**
 * Elimina per sempre l'account di un utente già verificato (sito o app).
 *
 * Prima i file di «I tuoi conti» nello Storage (ricevute, PDF, allegati
 * delle email), poi l'utente da Supabase Auth: tutte le tabelle con i suoi
 * dati (profili, questionari, passi_completati, domande_chat e le tabelle
 * conti_*) puntano ad auth.users con "on delete cascade" e si svuotano
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
