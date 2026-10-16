import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EsitoEliminazione } from "./esiti";

/**
 * Elimina per sempre l'account di un utente già verificato (sito o app).
 *
 * Basta cancellare l'utente da Supabase Auth: tutte le tabelle con i suoi
 * dati (profili, questionari, passi_completati, domande_chat) puntano ad
 * auth.users con "on delete cascade" e si svuotano insieme. Lo controlla
 * supabase/schema.test.ts: una tabella nuova senza cascade fa fallire il test.
 * La lista d'attesa è un'iscrizione separata (per email, senza account) e
 * ha il suo link per disiscriversi; limiti_richieste non contiene utenti.
 *
 * Serve la chiave segreta: senza, esito "non_configurato".
 */
export async function eliminaAccount(userId: string): Promise<EsitoEliminazione> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, motivo: "non_configurato" };
  try {
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
