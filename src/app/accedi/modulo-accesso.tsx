"use client";

import { useActionState } from "react";
import { inviaLinkAccesso, type StatoAccesso } from "./azioni";

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
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="rounded-lg border border-border bg-card px-3 py-2"
      />
      {stato.stato === "errore" ? (
        <p role="alert" className="text-sm text-danger">
          {stato.messaggio}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={inCorso}
        className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {inCorso ? "Invio…" : "Ricevi il link di accesso"}
      </button>
    </form>
  );
}
