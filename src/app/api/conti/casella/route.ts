import type { SupabaseClient } from "@supabase/supabase-js";
import { casellaDaRiga, dominioRicezione, nuovoToken, type RigaCasella } from "@/lib/conti/casella";
import { accediConti, erroreDatabase, errore, json, ricezioneEmailAttiva } from "@/lib/conti/server";
import { MESSAGGI_CONTI } from "@/lib/conti/validazione";
import { createAdminClient } from "@/lib/supabase/admin";

const COLONNE = "token, conferma_codice, conferma_link, conferma_ricevuta_il, ultima_email_il";

/**
 * Crea la casella con un token nuovo, o cambia il token se c'è già (il
 * vecchio indirizzo smette di funzionare e la conferma di Gmail si azzera).
 * Scrive solo il server con la chiave segreta: il token non lo sceglie mai
 * l'utente.
 */
async function nuovaCasella(admin: SupabaseClient, userId: string) {
  return admin
    .from("conti_caselle")
    .upsert(
      {
        user_id: userId,
        token: nuovoToken(),
        conferma_codice: null,
        conferma_link: null,
        conferma_ricevuta_il: null,
        aggiornato_il: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select(COLONNE)
    .single();
}

/**
 * GET /api/conti/casella → Casella. Se la ricezione email è attiva e
 * l'utente non ha ancora un indirizzo, lo crea. `indirizzo` è null solo se
 * la ricezione non è attiva (RESEND_DOMINIO_RICEZIONE e le altre variabili).
 */
export async function GET(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { supabase, user } = accesso;

  const dominio = dominioRicezione(process.env.RESEND_DOMINIO_RICEZIONE);
  const { data, error } = await supabase.from("conti_caselle").select(COLONNE).eq("user_id", user.id).maybeSingle();
  if (error) return erroreDatabase("lettura della casella", error);
  if (data || !ricezioneEmailAttiva()) {
    return json(200, casellaDaRiga(ricezioneEmailAttiva() ? (data as RigaCasella | null) : null, dominio));
  }

  const admin = createAdminClient();
  if (!admin) return json(200, casellaDaRiga(null, null));
  const creata = await nuovaCasella(admin, user.id);
  if (creata.error || !creata.data) return erroreDatabase("nuova casella", creata.error);
  return json(200, casellaDaRiga(creata.data as RigaCasella, dominio));
}

/** POST /api/conti/casella → Casella con un indirizzo nuovo (per esempio se quello vecchio è finito in giro). */
export async function POST(request: Request) {
  const accesso = await accediConti(request);
  if (!accesso.ok) return accesso.risposta;
  const { user } = accesso;

  const admin = createAdminClient();
  if (!ricezioneEmailAttiva() || !admin) return errore(503, MESSAGGI_CONTI.casellaNonAttiva);
  const creata = await nuovaCasella(admin, user.id);
  if (creata.error || !creata.data) return erroreDatabase("nuova casella", creata.error);
  return json(200, casellaDaRiga(creata.data as RigaCasella, dominioRicezione(process.env.RESEND_DOMINIO_RICEZIONE)));
}
