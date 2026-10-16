/**
 * Verifica della firma dei webhook di Resend (formato Svix), senza il
 * pacchetto svix: HMAC-SHA256 di "<svix-id>.<svix-timestamp>.<corpo>" con il
 * segreto "whsec_<base64>", in base64. L'intestazione svix-signature ha una
 * o più firme separate da spazi, ognuna «v1,<firma>»: basta che una torni.
 * Il timestamp deve essere vicino all'ora attuale, così una richiesta
 * copiata non si può rimandare più tardi.
 *
 * Solo server (node:crypto). Documentazione: https://resend.com/docs/webhooks/verify-webhooks-requests
 * e https://docs.svix.com/receiving/verifying-payloads/how-manual
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Scarto massimo tra il timestamp della firma e l'ora del server. */
export const TOLLERANZA_FIRMA_SECONDI = 5 * 60;

export type IntestazioniFirma = {
  id: string | null;
  timestamp: string | null;
  firma: string | null;
};

export type EsitoFirma = "valida" | "mancante" | "scaduta" | "non_valida";

/** Chiave HMAC dal segreto "whsec_…" (base64); null se il segreto non è valido. */
export function chiaveSegreto(segreto: string | undefined): Buffer | null {
  const base64 = segreto?.trim().replace(/^whsec_/, "");
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return null;
  const chiave = Buffer.from(base64, "base64");
  return chiave.length >= 16 ? chiave : null;
}

/** Firma attesa (base64) per un messaggio. */
export function firmaSvix(chiave: Buffer, id: string, timestamp: string, corpo: string): string {
  return createHmac("sha256", chiave).update(`${id}.${timestamp}.${corpo}`).digest("base64");
}

export function verificaFirma(
  corpo: string,
  intestazioni: IntestazioniFirma,
  segreto: string | undefined,
  adesso: number = Date.now(),
): EsitoFirma {
  const { id, timestamp, firma } = intestazioni;
  if (!id || !timestamp || !firma) return "mancante";
  const chiave = chiaveSegreto(segreto);
  if (!chiave || id.length > 200 || firma.length > 2000) return "non_valida";
  if (!/^\d{1,12}$/.test(timestamp)) return "non_valida";
  if (Math.abs(adesso / 1000 - Number(timestamp)) > TOLLERANZA_FIRMA_SECONDI) return "scaduta";

  const attesa = Buffer.from(firmaSvix(chiave, id, timestamp, corpo), "base64");
  for (const parte of firma.split(" ")) {
    const virgola = parte.indexOf(",");
    if (virgola < 0 || parte.slice(0, virgola) !== "v1") continue;
    const ricevuta = Buffer.from(parte.slice(virgola + 1), "base64");
    if (ricevuta.length === attesa.length && timingSafeEqual(ricevuta, attesa)) return "valida";
  }
  return "non_valida";
}
