import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ArchivioListaAttesa } from "./iscrizione";

const TABELLA = "lista_attesa";
/** Codice Postgres di unique_violation (indice unico su lower(email)). */
const DUPLICATO = "23505";

function errore(operazione: string, e: { code?: string; message?: string }) {
  // Solo codice e messaggio: i "details" di Postgres possono contenere l'email.
  return new Error(`${operazione} su ${TABELLA}: ${e.code ?? "?"} ${e.message ?? ""}`.trim());
}

/**
 * Archivio della lista d'attesa su Supabase, con la chiave segreta (la
 * tabella non ha policy RLS: anon e utenti non la vedono). Null in
 * modalità demo, cioè se le variabili di Supabase non sono impostate.
 */
export function archivioListaAttesa(): ArchivioListaAttesa | null {
  const db = createAdminClient();
  if (!db) return null;

  return {
    async inserisci(riga) {
      const { data, error } = await db.from(TABELLA).insert(riga).select("token_conferma").single();
      if (!error) return { tipo: "nuova", token: String(data.token_conferma) };
      if (error.code !== DUPLICATO) throw errore("insert", error);

      // Già in lista: servono token e stato della conferma per rimandare il link.
      // L'email arriva già in minuscolo dalla validazione, come nell'indice unico.
      const { data: esistente, error: erroreLettura } = await db
        .from(TABELLA)
        .select("token_conferma, confermato_il, conferma_inviata_il")
        .eq("email", riga.email)
        .maybeSingle();
      if (erroreLettura) throw errore("select", erroreLettura);
      if (!esistente) throw errore("select", { message: "iscrizione duplicata non trovata" });
      return {
        tipo: "duplicata",
        token: String(esistente.token_conferma),
        confermata: esistente.confermato_il !== null,
        ultimoInvio: esistente.conferma_inviata_il === null ? null : String(esistente.conferma_inviata_il),
      };
    },

    async segnaInvio(token) {
      const { error } = await db
        .from(TABELLA)
        .update({ conferma_inviata_il: new Date().toISOString() })
        .eq("token_conferma", token);
      if (error) throw errore("update", error);
    },

    async conferma(token) {
      const { data, error } = await db
        .from(TABELLA)
        .update({ confermato_il: new Date().toISOString() })
        .eq("token_conferma", token)
        .is("confermato_il", null)
        .select("id");
      if (error) throw errore("update", error);
      if (data.length > 0) return "confermata";

      const { data: esistente, error: erroreLettura } = await db
        .from(TABELLA)
        .select("id")
        .eq("token_conferma", token)
        .maybeSingle();
      if (erroreLettura) throw errore("select", erroreLettura);
      return esistente ? "gia_confermata" : "non_trovata";
    },

    async trova(token) {
      const { data, error } = await db.from(TABELLA).select("email").eq("token_conferma", token).maybeSingle();
      if (error) throw errore("select", error);
      return data ? { email: String(data.email) } : null;
    },

    async cancella(token) {
      const { data, error } = await db.from(TABELLA).delete().eq("token_conferma", token).select("id");
      if (error) throw errore("delete", error);
      return data.length > 0;
    },
  };
}
