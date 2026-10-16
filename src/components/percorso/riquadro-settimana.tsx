"use client";

import { useSyncExternalStore } from "react";
import { dataSvizzera } from "@/data/svizzera";
import type { Percorso } from "@/lib/percorso/regole";
import { GIORNI_SETTIMANA, quando, riassuntoSettimana } from "@/lib/percorso/settimana";

const nessunaIscrizione = () => () => {};

function oggiLocale(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** «La tua settimana»: due passi da fare e le scadenze dei prossimi 14 giorni. */
export function RiquadroSettimana({ percorso, fatti }: { percorso: Percorso; fatti: ReadonlySet<string> }) {
  // La data di oggi solo nel browser: sul server il riquadro non si mostra (niente differenze di idratazione).
  const oggi = useSyncExternalStore(nessunaIscrizione, oggiLocale, () => null);
  if (!oggi) return null;
  const { passi, scadenze } = riassuntoSettimana(percorso, fatti, oggi);

  return (
    <section aria-labelledby="titolo-settimana" className="rounded-2xl border border-border bg-card p-5 print:hidden">
      <h2 id="titolo-settimana" className="text-lg font-bold">
        La tua settimana
      </h2>
      {passi.length > 0 ? (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Da fare</p>
          <ol className="mt-1 space-y-1">
            {passi.map((p) => (
              <li key={p.passo.id}>
                <a
                  href={`#passo-${p.passo.id}`}
                  className="text-sm font-medium text-brand underline underline-offset-2 hover:text-brand-strong"
                >
                  {p.passo.titolo}
                </a>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">Hai fatto tutti i passi da fare.</p>
      )}
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Scadenze vicine</p>
      {scadenze.length > 0 ? (
        <ul className="mt-1 space-y-2">
          {scadenze.map((e) => (
            <li key={e.uid} className="text-sm">
              <span className="font-semibold">{dataSvizzera(e.data)}</span>{" "}
              <span className="text-muted">({quando(e.traGiorni)})</span>
              <span className="block">{e.titolo}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted">Nessuna scadenza nei prossimi {GIORNI_SETTIMANA} giorni.</p>
      )}
    </section>
  );
}
