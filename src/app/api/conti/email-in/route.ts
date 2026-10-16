import { after } from "next/server";
import { dominioRicezione, indirizzoNudo, tokenDaDestinatari } from "@/lib/conti/casella";
import { leggiEvento } from "@/lib/conti/email";
import { verificaFirma } from "@/lib/conti/firma";
import { elaboraEmail } from "@/lib/conti/ricezione";
import { json, registra } from "@/lib/conti/server";
import { creaClientAnthropic } from "@/lib/chat/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Il lavoro vero (scaricare l'email, leggere al massimo 5 allegati con
 * Claude) gira dopo la risposta, con after(): Resend riceve subito il 200.
 * Tutto deve finire entro il tempo massimo della funzione dell'hosting
 * (60 secondi qui; su Netlify verifica che il piano lo consenta): per questo
 * gli allegati sono al massimo 5 e si leggono in parallelo, ognuno con un
 * tempo massimo di 25 secondi.
 */
export const maxDuration = 60;

/** Il corpo del webhook contiene solo i metadati dell'email: pochi kB. */
const CORPO_MASSIMO = 256_000;

const ok = (corpo: Record<string, unknown> = { ok: true }) => json(200, corpo);

/**
 * POST /api/conti/email-in — webhook «email.received» di Resend (ricezione
 * email). Non serve un accesso: vale la firma (Svix) con RESEND_WEBHOOK_SECRET.
 * 1. firma e timestamp verificati, altrimenti 401;
 * 2. eventi diversi da email.received ignorati (200);
 * 3. utente trovato dal token nell'indirizzo ricevute-<token>@<dominio>;
 * 4. la stessa email (id di Resend) si elabora una volta sola, anche se Resend riprova;
 * 5. dopo la risposta: conferma di Gmail salvata, oppure allegati o testo letti
 *    (src/lib/conti/ricezione.ts), con il limite giornaliero per utente.
 * Il contenuto delle email non è affidabile: va a Claude solo come dati, senza strumenti.
 */
export async function POST(request: Request) {
  const segreto = process.env.RESEND_WEBHOOK_SECRET;
  const dominio = dominioRicezione(process.env.RESEND_DOMINIO_RICEZIONE);
  const chiaveResend = process.env.RESEND_API_KEY?.trim();
  const admin = createAdminClient();
  if (!segreto?.trim() || !dominio || !chiaveResend || !admin) {
    registra("webhook delle email: ricezione non configurata");
    return json(503, { messaggio: "Ricezione delle email non attiva." });
  }

  const lunghezza = Number(request.headers.get("content-length"));
  if (Number.isFinite(lunghezza) && lunghezza > CORPO_MASSIMO) return json(413, { messaggio: "Richiesta troppo grande." });
  const corpo = await request.text();
  if (corpo.length > CORPO_MASSIMO) return json(413, { messaggio: "Richiesta troppo grande." });

  const firma = verificaFirma(
    corpo,
    {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      firma: request.headers.get("svix-signature"),
    },
    segreto,
  );
  if (firma !== "valida") {
    registra("webhook delle email: firma non valida", { esito: firma });
    return json(401, { messaggio: "Firma non valida." });
  }

  let evento: ReturnType<typeof leggiEvento>;
  try {
    evento = leggiEvento(JSON.parse(corpo));
  } catch {
    evento = null;
  }
  if (!evento) return json(400, { messaggio: "Evento non valido." });
  if (!evento.email) return ok({ ok: true, ignorato: evento.tipo });

  const token = tokenDaDestinatari(evento.email.destinatari, dominio);
  if (!token) return ok({ ok: true, ignorato: "destinatario" });

  const casella = await admin.from("conti_caselle").select("user_id").eq("token", token).maybeSingle();
  if (casella.error) {
    registra("webhook delle email: lettura della casella", { code: casella.error.code });
    // Errore del database: Resend riproverà più tardi.
    return json(503, { messaggio: "Riprova più tardi." });
  }
  if (!casella.data) return ok({ ok: true, ignorato: "casella" });
  const userId = casella.data.user_id as string;

  // Una riga per email: se Resend manda di nuovo lo stesso evento, la seconda volta non si rilegge.
  const riga = await admin
    .from("conti_email")
    .insert({
      user_id: userId,
      resend_id: evento.email.id,
      mittente: indirizzoNudo(evento.email.mittente)?.slice(0, 320) ?? null,
      oggetto: evento.email.oggetto || null,
    })
    .select("id")
    .single();
  if (riga.error?.code === "23505") return ok({ ok: true, ignorato: "doppione" });
  if (riga.error || !riga.data) {
    registra("webhook delle email: salvataggio", { code: riga.error?.code ?? null });
    return json(503, { messaggio: "Riprova più tardi." });
  }
  const rigaId = riga.data.id as string;

  const aggiornata = await admin
    .from("conti_caselle")
    .update({ ultima_email_il: new Date().toISOString() })
    .eq("user_id", userId);
  if (aggiornata.error) registra("webhook delle email: ultima email", { code: aggiornata.error.code });

  const anthropic = creaClientAnthropic();
  const resendId = evento.email.id;
  after(async () => {
    await elaboraEmail({ admin, anthropic, chiaveResend, userId, rigaId, resendId });
  });
  return ok();
}
