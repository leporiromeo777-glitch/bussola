"use client";

import { useActionState } from "react";
import { CampoTurnstile } from "@/components/turnstile";
import { inviaLinkAccesso, type StatoAccesso } from "./azioni";

/** Chiave pubblica di Cloudflare Turnstile; senza, la verifica anti-robot è spenta. */
const CHIAVE_TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function ModuloAccesso({ next }: { next?: string }) {
  const [stato, azione, inCorso] = useActionState<StatoAccesso, FormData>(inviaLinkAccesso, {
    stato: "iniziale",
  });

  if (stato.stato === "inviato") {
    return (
      <p role="status" className="rounded-lg border border-border bg-brand-soft p-4">
        Ti abbiamo inviato un link. Aprilo da questo dispositivo per entrare.
      </p>
    );
  }

  return (
    <form action={azione} className="flex flex-col gap-3">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label htmlFor="email" className="text-sm font-medium">
        La tua email
      </label>
      <input
        // La key cambia a ogni errore: il campo si rimonta con l'email scritta.
        key={stato.tentativo ?? 0}
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        defaultValue={stato.email ?? ""}
        aria-invalid={stato.stato === "errore" && stato.emailNonValida ? true : undefined}
        aria-describedby={stato.stato === "errore" ? "accesso-errore" : undefined}
        className="rounded-lg border border-border bg-card px-3 py-2 aria-[invalid=true]:border-danger"
      />
      {CHIAVE_TURNSTILE ? (
        // Nuovo widget (e nuovo token) dopo ogni errore: un token vale una volta sola.
        <CampoTurnstile key={stato.tentativo ?? 0} chiaveSito={CHIAVE_TURNSTILE} azione="accesso" />
      ) : null}
      {stato.stato === "errore" ? (
        <p id="accesso-errore" role="alert" className="text-sm text-danger">
          {stato.messaggio}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={inCorso}
        className="rounded-lg bg-brand px-4 py-2 font-medium text-background hover:bg-brand-strong disabled:opacity-60"
      >
        {inCorso ? "Invio…" : "Ricevi il link di accesso"}
      </button>
    </form>
  );
}
