import { VOTAZIONI } from "@/data/votazioni";
import { icsAbbonamento, improntaToken, tokenDaSegmento } from "@/lib/percorso/abbonamento";
import { registraCalendario } from "@/lib/percorso/abbonamento-server";
import { leggiRisposte } from "@/lib/percorso/risposte";
import { createAdminClient } from "@/lib/supabase/admin";

/** Ogni quanto il server segna «letto il» (meno scritture se un calendario rilegge spesso). */
const SEGNA_LETTURA_OGNI_MS = 60 * 60 * 1000;

function testo(status: number, messaggio: string) {
  return new Response(`${messaggio}\n`, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/**
 * GET /api/calendario/<token> — il calendario personale (text/calendar) che
 * Google Calendar, Apple Calendario o Outlook rileggono da soli. Lo si
 * costruisce a ogni richiesta dalle risposte salvate nell'account, con gli
 * stessi eventi (e UID) del file .ics da scaricare.
 *
 * Il token non è nel database: si cerca la sua impronta SHA-256 con la
 * chiave segreta. 404 per un link sconosciuto o disattivato; 503 se il
 * database non risponde, così il calendario tiene la copia di prima invece
 * di svuotarsi. HEAD funziona da solo (Next.js usa GET).
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/calendario/[token]">) {
  const { token: segmento } = await ctx.params;
  const token = tokenDaSegmento(segmento);
  if (!token) return testo(404, "Calendario non trovato.");

  const admin = createAdminClient();
  if (!admin) return testo(503, "Il calendario sempre aggiornato non è ancora attivo.");

  const impronta = await improntaToken(token);
  const link = await admin
    .from("link_calendario")
    .select("id, user_id, letto_il")
    .eq("impronta", impronta)
    .maybeSingle();
  if (link.error) {
    registraCalendario("lettura del link (calendario)", link.error);
    return testo(503, "Calendario non disponibile adesso. Riprova più tardi.");
  }
  const riga = link.data as { id: string; user_id: string; letto_il: string | null } | null;
  if (!riga) return testo(404, "Calendario non trovato.");

  const questionario = await admin.from("questionari").select("risposte").eq("user_id", riga.user_id).maybeSingle();
  if (questionario.error) {
    registraCalendario("lettura del questionario (calendario)", questionario.error);
    return testo(503, "Calendario non disponibile adesso. Riprova più tardi.");
  }
  const risposte = questionario.data ? leggiRisposte((questionario.data as { risposte: unknown }).risposte) : null;

  const adesso = new Date();
  const ics = icsAbbonamento(risposte, VOTAZIONI, adesso);

  const letto = riga.letto_il ? Date.parse(riga.letto_il) : Number.NaN;
  if (Number.isNaN(letto) || adesso.getTime() - letto > SEGNA_LETTURA_OGNI_MS) {
    const { error } = await admin.from("link_calendario").update({ letto_il: adesso.toISOString() }).eq("id", riga.id);
    if (error) registraCalendario("lettura segnata (calendario)", error);
  }

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="bleo-calendario.ics"',
      // Personale: mai nelle cache condivise (CDN). Un'ora nel client basta, il calendario cambia di rado.
      "Cache-Control": "private, max-age=3600",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}
