"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PaginaMessaggio } from "@/components/landing/pagina-messaggio";
import { classePulsantePrincipale } from "@/components/landing/sezione";

/** Errore imprevisto in una pagina: messaggio in italiano, «Riprova» e link alla pagina iniziale. */
export default function Errore({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PaginaMessaggio tono="errore" titolo="Qualcosa non ha funzionato" azioni={false}>
      <p>Non siamo riusciti a mostrare questa pagina. Non hai sbagliato nulla: riprova tra qualche secondo.</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 text-base">
        <button type="button" onClick={() => retry()} className={classePulsantePrincipale}>
          Riprova
        </button>
        <Link href="/" className="font-medium text-brand underline underline-offset-2 hover:text-brand-strong">
          Torna alla pagina iniziale
        </Link>
      </div>
      {error.digest ? <p className="text-sm">Codice dell&apos;errore: {error.digest}</p> : null}
    </PaginaMessaggio>
  );
}
