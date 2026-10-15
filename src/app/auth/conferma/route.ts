import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { destinazioneInterna } from "@/lib/destinazione";
import { createClient } from "@/lib/supabase/server";

/**
 * Destinazione del link di accesso. Gestisce sia il flusso PKCE (?code=)
 * sia il template email con token_hash (?token_hash=&type=), che funziona
 * anche se il link si apre su un altro dispositivo.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  // Solo percorsi del nostro sito: niente redirect verso altri domini.
  const next = destinazioneInterna(searchParams.get("next"));

  const supabase = await createClient();
  if (supabase) {
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (!error) return NextResponse.redirect(new URL(next, origin));
    }
  }
  return NextResponse.redirect(new URL("/accedi?errore=link", origin));
}
