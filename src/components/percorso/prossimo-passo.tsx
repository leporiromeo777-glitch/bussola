"use client";

import Link from "next/link";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { IconaChat, IconaSpunta } from "@/components/landing/icone";
import type { PassoPercorso } from "@/lib/percorso/regole";
import { ElencoFonti } from "./elenco-fonti";
import { IconaLinkEsterno } from "./icone";
import { hrefChiedi } from "./scheda-passo";

/** Ultimo passo segnato come fatto, per il messaggio «Fatto!» con «Annulla». */
export type UltimoFatto = { id: string; titolo: string } | null;

/**
 * La scheda in cima al percorso: una sola cosa da fare adesso, con tutto
 * quello che serve per farla (cosa fare, modulo ufficiale, «Fatto»).
 */
export function ProssimoPasso({
  voce,
  numero,
  totale,
  ultimoFatto,
  onFatto,
  onAnnulla,
}: {
  voce: PassoPercorso | undefined;
  /** Posizione del passo tra quelli da fare (1, 2, …). */
  numero: number;
  totale: number;
  ultimoFatto: UltimoFatto;
  onFatto: () => void;
  onAnnulla: () => void;
}) {
  const messaggioFatto = ultimoFatto ? (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
      <span className="inline-flex items-center gap-1.5">
        <IconaSpunta className="size-4" />
        Fatto: «{ultimoFatto.titolo}»
      </span>
      <button type="button" onClick={onAnnulla} className="underline underline-offset-2 hover:no-underline">
        Annulla
      </button>
    </p>
  ) : null;

  if (!voce) {
    return (
      <section
        aria-labelledby="titolo-prossimo"
        className="flex flex-col items-center gap-4 rounded-3xl border-2 border-success/40 bg-card p-6 text-center sm:p-8"
      >
        {messaggioFatto}
        <ImmagineMascotte nome="festa" sizes="160px" className="h-auto w-36" />
        <h2 id="titolo-prossimo" className="text-2xl font-extrabold tracking-tight">
          Hai fatto tutti i passi!
        </h2>
        <p className="max-w-md text-muted">
          Complimenti. Adesso restano le scadenze di ogni anno: le trovi qui accanto, e puoi metterle nel tuo
          calendario.
        </p>
      </section>
    );
  }

  const { passo, perche } = voce;
  return (
    <section
      aria-labelledby="titolo-prossimo"
      className="bordo-sfumato rounded-3xl p-5 shadow-lg shadow-brand/10 sm:p-7 print:hidden"
    >
      {messaggioFatto ? <div className="mb-4">{messaggioFatto}</div> : null}
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand">
            Adesso tocca a te · passo {numero} di {totale}
          </p>
          <h2 id="titolo-prossimo" className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-balance">
            {passo.titolo}
          </h2>
          <p className="mt-2 text-muted">{perche}</p>
        </div>
        <ImmagineMascotte nome="checklist" sizes="96px" className="hidden h-auto w-24 shrink-0 sm:block" />
      </div>

      <h3 className="mt-5 text-sm font-semibold">Cosa fare</h3>
      <ol className="mt-2 space-y-2">
        {passo.cosaFare.map((c, i) => (
          <li key={c} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand"
            >
              {i + 1}
            </span>
            <span>{c}</span>
          </li>
        ))}
      </ol>
      {passo.tempoStimato || passo.costoNoto ? (
        <p className="mt-3 text-sm text-muted">
          {passo.tempoStimato ? <>Tempo: {passo.tempoStimato}</> : null}
          {passo.tempoStimato && passo.costoNoto ? " · " : null}
          {passo.costoNoto ? <>Costo: {passo.costoNoto.testo}</> : null}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={passo.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="fondo-sfumato inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold shadow-md hover:brightness-110"
        >
          {passo.link.etichetta}
          <IconaLinkEsterno className="size-4" />
          <span className="sr-only">(si apre in una nuova scheda)</span>
        </a>
        <button
          type="button"
          onClick={onFatto}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-success bg-card px-6 py-3 font-semibold text-success hover:bg-success/10"
        >
          <IconaSpunta className="size-5" />
          Fatto, avanti
        </button>
        <Link
          href={hrefChiedi(passo.domandaChat)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 py-3 font-medium text-brand hover:bg-brand-soft"
        >
          <IconaChat className="size-4" />
          Ho un dubbio
        </Link>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <ElencoFonti fonti={passo.fonti} verificatoIl={passo.verificatoIl} />
      </div>
    </section>
  );
}
