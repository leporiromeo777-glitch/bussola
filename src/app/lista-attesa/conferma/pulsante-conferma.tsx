"use client";

import { useFormStatus } from "react-dom";

/** Pulsante del modulo di conferma: senza JavaScript funziona come un normale invio. */
export function PulsanteConferma() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-brand px-6 py-3 text-base font-medium text-background hover:bg-brand-strong disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Conferma in corso…" : "Confermo l'iscrizione"}
    </button>
  );
}
