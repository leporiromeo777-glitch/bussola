"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconaCopia, IconaFatto, IconaRiprova } from "./icone";
import { ElencoFonti, TestoRisposta } from "./risposta";
import { testoDaCopiare, type Turno } from "./turni";

/** L'avatar di Bleo accanto alle risposte: la bussolina del marchio. */
export function AvatarBleo() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
      <Image src="/mascotte/bussolina.webp" alt="" width={540} height={720} className="h-6 w-auto" />
    </span>
  );
}

/** Una domanda (a destra, nel fumetto) e la risposta di Bleo (a sinistra, senza fumetto). */
export function VistaTurno({
  turno: t,
  onRiprova,
  idAccesso,
}: {
  turno: Turno;
  onRiprova: (turno: Turno) => void;
  /** Dove tornare dopo l'accesso. */
  idAccesso: string;
}) {
  const inCorso = t.stato === "in_attesa" || t.stato === "in_scrittura";
  return (
    <>
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-brand-soft px-4 py-2.5 sm:max-w-[75%]">
          <span className="sr-only">Tu: </span>
          {t.domanda}
        </p>
      </div>

      <div className="mt-5 flex gap-3" aria-busy={inCorso}>
        <AvatarBleo />
        <div className="min-w-0 flex-1 pt-1">
          <p className="sr-only">Bleo:</p>
          {t.stato === "in_attesa" ? (
            <p className="flex items-center gap-2 text-muted">
              <span aria-hidden="true" className="flex gap-1">
                <span className="size-1.5 rounded-full bg-muted motion-safe:animate-bounce" />
                <span className="size-1.5 rounded-full bg-muted [animation-delay:150ms] motion-safe:animate-bounce" />
                <span className="size-1.5 rounded-full bg-muted [animation-delay:300ms] motion-safe:animate-bounce" />
              </span>
              Cerco nelle fonti ufficiali…
            </p>
          ) : null}

          {t.stato === "in_scrittura" ? (
            <div className="cursore-scrittura">
              <TestoRisposta blocchi={[{ testo: t.testo, citazioni: [] }]} idMessaggio={t.chiave} />
            </div>
          ) : null}

          {t.stato === "completo" && t.fine ? (
            <>
              <TestoRisposta blocchi={t.fine.risposta} idMessaggio={t.chiave} />
              {t.fine.avviso ? <p className="mt-3 text-sm text-accent">{t.fine.avviso}</p> : null}
              <ElencoFonti fonti={t.fine.fonti} idMessaggio={t.chiave} />
              <PulsanteCopia testo={testoDaCopiare(t.fine)} />
            </>
          ) : null}

          {t.stato === "errore" || t.stato === "interrotta" ? (
            <div>
              {t.testo ? (
                <div className="mb-3 opacity-70">
                  <TestoRisposta blocchi={[{ testo: t.testo, citazioni: [] }]} idMessaggio={t.chiave} />
                </div>
              ) : null}
              <p className={t.stato === "errore" ? "text-danger" : "text-muted"}>
                {t.stato === "interrotta" ? "Hai fermato la risposta." : t.errore}
              </p>
              {t.azione === "riprova" ? (
                <button
                  type="button"
                  onClick={() => onRiprova(t)}
                  className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold hover:border-brand hover:text-brand"
                >
                  <IconaRiprova />
                  Riprova
                </button>
              ) : null}
              {t.azione === "accedi" ? (
                <Link
                  href={`/accedi?next=${encodeURIComponent(idAccesso)}`}
                  className="mt-2 inline-block font-medium text-brand underline underline-offset-2"
                >
                  Accedi di nuovo
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function PulsanteCopia({ testo }: { testo: string }) {
  const [copiata, setCopiata] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copia() {
    try {
      await navigator.clipboard.writeText(testo);
      setCopiata(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiata(false), 2000);
    } catch {
      // Appunti non disponibili (permesso negato): il testo resta selezionabile a mano.
    }
  }

  return (
    <div className="mt-3 flex items-center">
      <button
        type="button"
        onClick={() => void copia()}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-muted hover:bg-brand-soft hover:text-foreground"
      >
        {copiata ? <IconaFatto /> : <IconaCopia />}
        {copiata ? "Copiata" : "Copia"}
        <span className="sr-only"> la risposta</span>
      </button>
      <span role="status" className="sr-only">
        {copiata ? "Risposta copiata." : ""}
      </span>
    </div>
  );
}
