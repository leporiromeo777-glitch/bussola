import type { ReactNode } from "react";

/**
 * Contenitore per privacy e impressum: colonna di lettura stretta e stili
 * per titoli, paragrafi, elenchi e link del contenuto.
 */
export function PaginaLegale({
  titolo,
  aggiornato,
  prima,
  children,
}: {
  titolo: string;
  /** Data dell'ultimo aggiornamento: ISO per <time>, svizzera per il testo. */
  aggiornato?: { iso: string; testo: string };
  /** Contenuto sopra il titolo (es. avviso di bozza). */
  prima?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 leading-relaxed sm:py-16 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-brand-strong [&_h2]:mt-12 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:pl-1 [&_p]:mt-3 [&_section>ul]:mt-3 [&_section>ul]:list-disc [&_section>ul]:space-y-2 [&_section>ul]:pl-5">
      {prima}
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{titolo}</h1>
      {aggiornato ? (
        <p className="mt-2! text-sm text-muted">
          Ultimo aggiornamento: <time dateTime={aggiornato.iso}>{aggiornato.testo}</time>
        </p>
      ) : null}
      {children}
    </article>
  );
}

/** Avviso evidenziato (es. "Bozza"). */
export function Avviso({ children }: { children: ReactNode }) {
  return (
    <div role="note" className="mb-8 rounded-xl border border-accent/60 bg-card p-4 text-sm">
      {children}
    </div>
  );
}
