"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { destinazioneInterna } from "@/lib/destinazione";
import { createClient } from "@/lib/supabase/server";

export type StatoAccesso = { stato: "iniziale" | "inviato" | "errore"; messaggio?: string };

const schema = z.object({
  email: z.email({ error: "Inserisci un indirizzo email valido." }),
  next: z.string().optional(),
});

/** Invia il link di accesso via email (nessuna password). */
export async function inviaLinkAccesso(_prev: StatoAccesso, form: FormData): Promise<StatoAccesso> {
  const dati = schema.safeParse({
    email: String(form.get("email") ?? "").trim(),
    next: form.get("next") ? String(form.get("next")) : undefined,
  });
  if (!dati.success) return { stato: "errore", messaggio: dati.error.issues[0]?.message };

  const supabase = await createClient();
  if (!supabase) {
    return { stato: "errore", messaggio: "L'accesso non è ancora attivo (Supabase non configurato)." };
  }

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITO_URL ?? "";
  const next = destinazioneInterna(dati.data.next);
  const { error } = await supabase.auth.signInWithOtp({
    email: dati.data.email,
    options: { emailRedirectTo: `${origin}/auth/conferma?next=${encodeURIComponent(next)}` },
  });
  if (error) return { stato: "errore", messaggio: "Invio non riuscito. Riprova tra qualche minuto." };
  return { stato: "inviato" };
}

export async function esci() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
