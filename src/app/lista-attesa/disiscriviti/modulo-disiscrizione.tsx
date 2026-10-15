"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PaginaMessaggio } from "@/components/landing/pagina-messaggio";
import { disiscriviListaAttesa, type StatoDisiscrizione } from "../azioni";

const STATO_INIZIALE: StatoDisiscrizione = { stato: "iniziale" };

/** Conferma della disiscrizione: funziona anche senza JavaScript (POST del modulo). */
export function ModuloDisiscrizione({ token, email }: { token: string; email: string }) {
  const [stato, azione, inCorso] = useActionState(disiscriviListaAttesa, STATO_INIZIALE);

  return (
    <PaginaMessaggio tono="info" titolo="Vuoi lasciare la lista d'attesa?" azioni={false}>
      <p>
        Cancelliamo <strong className="font-semibold text-foreground">{email}</strong> e tutti i dati
        dell&apos;iscrizione. Non riceverai più email sulla beta.
      </p>
      <form action={azione} className="pt-4">
        <input type="hidden" name="token" value={token} />
        {stato.stato === "errore" ? (
          <p role="alert" className="mb-4 text-base text-danger">
            {stato.messaggio}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={inCorso}
            className="rounded-full bg-brand px-6 py-3 text-base font-medium text-background hover:bg-brand-strong disabled:cursor-wait disabled:opacity-60"
          >
            {inCorso ? "Cancellazione…" : "Sì, toglimi dalla lista"}
          </button>
          <Link
            href="/"
            className="rounded-full border border-border px-6 py-3 text-center text-base font-medium text-foreground hover:border-brand"
          >
            No, resto in lista
          </Link>
        </div>
      </form>
    </PaginaMessaggio>
  );
}
