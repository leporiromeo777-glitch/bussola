"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MESSAGGI_ACCESSO, leggiCaptcha, messaggioErroreInvio } from "@/lib/accesso/captcha";
import { destinazioneInterna } from "@/lib/destinazione";
import { richiestaConsentita } from "@/lib/limiti/server";
import { createClient } from "@/lib/supabase/server";

export type StatoAccesso = {
  stato: "iniziale" | "inviato" | "errore";
  messaggio?: string;
  /** Cambia a ogni errore: il modulo si rimonta (e la verifica anti-robot riparte con un token nuovo). */
  tentativo?: number;
};

const schema = z.object({
  email: z.email({ error: "Inserisci un indirizzo email valido." }),
  next: z.string().optional(),
});

/** Invia il link di accesso via email (nessuna password). */
export async function inviaLinkAccesso(prev: StatoAccesso, form: FormData): Promise<StatoAccesso> {
  const errore = (messaggio: string | undefined): StatoAccesso => ({
    stato: "errore",
    messaggio,
    tentativo: (prev.tentativo ?? 0) + 1,
  });
  const dati = schema.safeParse({
    email: String(form.get("email") ?? "").trim(),
    next: form.get("next") ? String(form.get("next")) : undefined,
  });
  if (!dati.success) return errore(dati.error.issues[0]?.message);

  // Verifica anti-robot (Cloudflare Turnstile), attiva se la chiave del sito è impostata.
  // Il token lo controlla Supabase Auth (CAPTCHA in Attack Protection).
  const captcha = leggiCaptcha(form, process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  if (!captcha.ok) return errore(captcha.messaggio);

  const supabase = await createClient();
  if (!supabase) return errore("L'accesso non è ancora attivo (Supabase non configurato).");

  // La richiesta a Supabase parte dal nostro server: i suoi limiti per IP vedono
  // il server, non chi chiede. Qui si limita per connessione di chi chiede.
  if (!(await richiestaConsentita("accesso"))) return errore(MESSAGGI_ACCESSO.troppeRichieste);

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITO_URL ?? "";
  const next = destinazioneInterna(dati.data.next);
  const { error } = await supabase.auth.signInWithOtp({
    email: dati.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/conferma?next=${encodeURIComponent(next)}`,
      ...(captcha.token ? { captchaToken: captcha.token } : {}),
    },
  });
  if (error) return errore(messaggioErroreInvio(error.code));
  return { stato: "inviato" };
}

export async function esci() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
