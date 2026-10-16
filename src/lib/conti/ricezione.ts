import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PAGINE_MASSIME_PDF, riconosciTipo, stimaPaginePdf } from "@/lib/lettera/richiesta";
import { indirizzoNudo } from "./casella";
import { leggiAllegati, leggiEmail, pesoMassimo, pianoEmail, type Allegato, type EmailRicevuta } from "./email";
import { oggiZurigo } from "./importi";
import { NOTE_LETTURA } from "./lettura";
import { nomeFilePulito } from "./validazione";
import { prenotaLettura, registra, registraRicevuta, type RegistrazioneRicevuta } from "./server";

/**
 * Email ricevute (Resend): si scaricano email e allegati con l'API REST di
 * Resend, senza SDK, come per l'invio (src/lib/lista-attesa/resend.ts).
 * Endpoint (documentazione controllata il 16.10.2026):
 * - GET https://api.resend.com/emails/receiving/{id}
 * - GET https://api.resend.com/emails/receiving/{id}/attachments (con download_url valido 1 ora)
 */
export const API_RESEND = "https://api.resend.com";

async function chiamaResend(percorso: string, chiave: string): Promise<unknown | null> {
  try {
    const risposta = await fetch(`${API_RESEND}${percorso}`, {
      headers: { Authorization: `Bearer ${chiave}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!risposta.ok) {
      registra("Resend ha risposto con un errore", { status: risposta.status });
      return null;
    }
    return (await risposta.json()) as unknown;
  } catch (e) {
    registra("Resend non risponde", { tipo: e instanceof Error ? e.name : typeof e });
    return null;
  }
}

/** Scarica un allegato dal link temporaneo di Resend, al massimo `massimo` byte. */
async function scaricaAllegato(url: string, massimo: number): Promise<Uint8Array | null> {
  let indirizzo: URL;
  try {
    indirizzo = new URL(url);
  } catch {
    return null;
  }
  if (indirizzo.protocol !== "https:") return null;
  try {
    const risposta = await fetch(indirizzo, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!risposta.ok) {
      registra("download dell'allegato", { status: risposta.status });
      return null;
    }
    const dichiarata = Number(risposta.headers.get("content-length"));
    if (Number.isFinite(dichiarata) && dichiarata > massimo) return null;
    const byte = new Uint8Array(await risposta.arrayBuffer());
    return byte.byteLength > 0 && byte.byteLength <= massimo ? byte : null;
  } catch (e) {
    registra("download dell'allegato", { tipo: e instanceof Error ? e.name : typeof e });
    return null;
  }
}

type EsitoEmail = "letta" | "conferma_gmail" | "spam" | "limite" | "nessun_documento" | "errore";

export type ElaborazioneEmail = {
  admin: SupabaseClient;
  anthropic: Anthropic | null;
  chiaveResend: string;
  userId: string;
  /** Riga in conti_email. */
  rigaId: string;
  resendId: string;
};

/**
 * Lavoro dopo la risposta al webhook: scarica l'email, salva la conferma di
 * Gmail oppure legge allegati (al massimo 5) o testo, ognuno contato nel
 * limite giornaliero. Alla fine scrive l'esito in conti_email.
 */
export async function elaboraEmail(e: ElaborazioneEmail): Promise<EsitoEmail> {
  const esito = await elabora(e).catch((errore: unknown) => {
    registra("elaborazione dell'email", { tipo: errore instanceof Error ? errore.name : typeof errore });
    return "errore" as const;
  });
  const { error } = await e.admin.from("conti_email").update({ esito }).eq("id", e.rigaId);
  if (error) registra("esito dell'email", { code: error.code });
  return esito;
}

async function elabora(e: ElaborazioneEmail): Promise<EsitoEmail> {
  const email = leggiEmail(await chiamaResend(`/emails/receiving/${encodeURIComponent(e.resendId)}`, e.chiaveResend));
  if (!email) return "errore";

  let allegati: Allegato[] = [];
  if (email.allegati.length > 0) {
    allegati = leggiAllegati(
      await chiamaResend(`/emails/receiving/${encodeURIComponent(e.resendId)}/attachments`, e.chiaveResend),
    );
  }

  const piano = pianoEmail(email, allegati);
  switch (piano.azione) {
    case "conferma_gmail": {
      const { error } = await e.admin
        .from("conti_caselle")
        .update({
          conferma_codice: piano.conferma.codice,
          conferma_link: piano.conferma.link,
          conferma_ricevuta_il: new Date().toISOString(),
        })
        .eq("user_id", e.userId);
      if (error) {
        registra("salvataggio della conferma di Gmail", { code: error.code });
        return "errore";
      }
      return "conferma_gmail";
    }
    case "spam":
      return "spam";
    case "niente":
      return "nessun_documento";
    case "testo":
      return leggiTesto(e, email, piano.testo);
    case "allegati":
      return leggiAllegatiEmail(e, email, piano.allegati);
  }
}

function base(e: ElaborazioneEmail, email: EmailRicevuta): Omit<RegistrazioneRicevuta, "file" | "contenuto"> {
  return {
    db: e.admin,
    userId: e.userId,
    origine: "email",
    emailId: e.rigaId,
    oggi: oggiZurigo(),
    anthropic: e.anthropic,
    descrizioneDiRipiego: email.oggetto,
  };
}

async function leggiTesto(e: ElaborazioneEmail, email: EmailRicevuta, testo: string): Promise<EsitoEmail> {
  if ((await prenotaLettura(e.admin, e.userId)) !== true) return "limite";
  const mittente = indirizzoNudo(email.mittente) ?? "";
  const intestazione = `Da: ${mittente}\nOggetto: ${email.oggetto}\n\n`;
  const esito = await registraRicevuta({
    ...base(e, email),
    file: { tipo: "text/plain", byte: new TextEncoder().encode(intestazione + testo), nome: "email.txt" },
    contenuto: e.anthropic ? { tipo: "text/plain", testo, mittente, oggetto: email.oggetto } : null,
  });
  return esito.esito === "creato" ? "letta" : esito.esito === "non_ricevuta" ? "nessun_documento" : "errore";
}

async function leggiAllegatiEmail(
  e: ElaborazioneEmail,
  email: EmailRicevuta,
  allegati: Extract<ReturnType<typeof pianoEmail>, { azione: "allegati" }>["allegati"],
): Promise<EsitoEmail> {
  // Prima si contano le letture (una per allegato), poi si leggono insieme: così il tempo resta breve.
  const consentiti: typeof allegati = [];
  for (const allegato of allegati) {
    if ((await prenotaLettura(e.admin, e.userId)) !== true) break;
    consentiti.push(allegato);
  }
  if (consentiti.length === 0) return "limite";

  const mittente = indirizzoNudo(email.mittente) ?? "";
  const esiti = await Promise.all(
    consentiti.map(async (allegato) => {
      if (!allegato.url) return "errore" as const;
      const byte = await scaricaAllegato(allegato.url, pesoMassimo(allegato.tipoFile));
      // Il tipo vero si riconosce dai primi byte, non da quello dichiarato nell'email.
      if (!byte || riconosciTipo(byte.subarray(0, 12)) !== allegato.tipoFile) return "errore" as const;
      if (allegato.tipoFile === "application/pdf") {
        const pagine = stimaPaginePdf(byte);
        if (pagine !== null && pagine > PAGINE_MASSIME_PDF) return "errore" as const;
      }
      const esito = await registraRicevuta({
        ...base(e, email),
        file: { tipo: allegato.tipoFile, byte, nome: nomeFilePulito(allegato.nome) },
        contenuto: e.anthropic
          ? {
              tipo: allegato.tipoFile,
              base64: Buffer.from(byte).toString("base64"),
              contesto: { mittente, oggetto: email.oggetto },
            }
          : null,
        notaSenzaLettura: NOTE_LETTURA.compilaTu,
      });
      return esito.esito;
    }),
  );
  if (esiti.includes("creato")) return "letta";
  if (esiti.every((x) => x === "non_ricevuta")) return "nessun_documento";
  return "errore";
}
