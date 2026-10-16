"use client";

import Link from "next/link";
import { useState } from "react";
import { IconaChat, IconaFrecciaGiu } from "@/components/landing/icone";
import type { PassoPercorso, StatoPasso } from "@/lib/percorso/regole";
import { ElencoFonti } from "./elenco-fonti";
import { IconaLinkEsterno } from "./icone";

const ETICHETTE_STATO: Record<StatoPasso, string> = {
  da_fare: "Da fare",
  facoltativo: "Facoltativo",
  non_serve: "Non ti riguarda",
};

/** Link a "Chiedi a Bleo" con la domanda precompilata. */
export function hrefChiedi(domanda: string): string {
  return `/chat?domanda=${encodeURIComponent(domanda)}`;
}

/** Un passo del percorso: casella "fatto", perché per te e dettagli espandibili (sempre visibili in stampa). */
export function SchedaPasso({
  voce,
  fatto,
  prossimo,
  onCambia,
}: {
  voce: PassoPercorso;
  fatto: boolean;
  prossimo: boolean;
  onCambia: (fatto: boolean) => void;
}) {
  const [aperto, setAperto] = useState(false);
  const { passo, stato, perche, note } = voce;
  const idCasella = `fatto-${passo.id}`;
  const idPerche = `perche-${passo.id}`;
  const idDettagli = `dettagli-${passo.id}`;

  return (
    <li
      id={`passo-${passo.id}`}
      className={`scroll-mt-24 rounded-2xl border bg-card p-4 transition-colors sm:p-5 ${
        prossimo ? "border-brand ring-1 ring-brand" : "border-border"
      } ${fatto ? "bg-card/60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id={idCasella}
          checked={fatto}
          onChange={(e) => onCambia(e.target.checked)}
          aria-label={`Fatto: ${passo.titolo}`}
          aria-describedby={fatto ? undefined : idPerche}
          className="mt-1 size-6 shrink-0 cursor-pointer rounded accent-brand"
        />
        <div className="min-w-0 flex-1">
          <h3 className="break-after-avoid">
            <button
              type="button"
              aria-expanded={aperto}
              aria-controls={idDettagli}
              onClick={() => setAperto((a) => !a)}
              className="group flex w-full items-start justify-between gap-3 text-left"
            >
              <span className="min-w-0">
                <span className={`font-semibold ${fatto ? "text-muted line-through" : "group-hover:text-brand"}`}>
                  {passo.titolo}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  {fatto ? (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Fatto</span>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        stato === "da_fare" ? "bg-brand-soft text-brand" : "border border-border text-muted"
                      }`}
                    >
                      {ETICHETTE_STATO[stato]}
                    </span>
                  )}
                  {prossimo ? (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-foreground">
                      Prossimo passo
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand print:hidden">
                <span className="hidden sm:inline">{aperto ? "Chiudi" : "Dettagli"}</span>
                <IconaFrecciaGiu
                  className={`size-5 transition-transform motion-reduce:transition-none ${aperto ? "rotate-180" : ""}`}
                />
              </span>
            </button>
          </h3>
          {fatto && !aperto ? null : (
            <p id={idPerche} className="mt-2 text-sm text-muted">
              <span className="sr-only">Perché per te: </span>
              {perche}
            </p>
          )}

          <div id={idDettagli} className={aperto ? "mt-4 space-y-4" : "hidden print:mt-4 print:block print:space-y-4"}>
            <p>{passo.descrizione}</p>

            {note.length > 0 ? (
              <div className="rounded-lg bg-brand-soft p-3 text-sm">
                <p className="font-semibold">Nella tua situazione</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {note.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <h4 className="text-sm font-semibold">Cosa fare</h4>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {passo.cosaFare.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>

            {passo.tempoStimato || passo.costoNoto ? (
              <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                {passo.tempoStimato ? (
                  <>
                    <dt className="text-muted">Tempo indicativo</dt>
                    <dd>{passo.tempoStimato}</dd>
                  </>
                ) : null}
                {passo.costoNoto ? (
                  <>
                    <dt className="text-muted">Costo</dt>
                    <dd>{passo.costoNoto.testo}</dd>
                  </>
                ) : null}
              </dl>
            ) : null}

            <div className="flex flex-wrap gap-3 print:hidden">
              <a
                href={passo.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-background hover:bg-brand-strong"
              >
                {passo.link.etichetta}
                <IconaLinkEsterno className="size-4" />
                <span className="sr-only">(si apre in una nuova scheda)</span>
              </a>
              <Link
                href={hrefChiedi(passo.domandaChat)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-brand"
              >
                <IconaChat className="size-4" />
                Chiedi a Bleo
              </Link>
            </div>
            <p className="hidden text-sm print:block">
              Pagina ufficiale: {passo.link.etichetta}, <span className="break-all">{passo.link.url}</span>
            </p>

            <ElencoFonti fonti={passo.fonti} verificatoIl={passo.verificatoIl} />
          </div>
        </div>
      </div>
    </li>
  );
}
