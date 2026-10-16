import type { ReactNode } from "react";

const SFONDI = {
  normale: "",
  card: "border-y border-border bg-card",
  brand: "bg-brand-soft",
} as const;

/** Sezione della landing con titolo collegato (aria-labelledby) e contenitore max-w-5xl. */
export function Sezione({
  id,
  sopratitolo,
  titolo,
  introduzione,
  sfondo = "normale",
  illustrazione,
  children,
}: {
  id: string;
  sopratitolo?: string;
  titolo: string;
  introduzione?: ReactNode;
  sfondo?: keyof typeof SFONDI;
  /** Immagine decorativa accanto al titolo (dal tablet in su). */
  illustrazione?: ReactNode;
  children: ReactNode;
}) {
  const idTitolo = `${id}-titolo`;
  return (
    <section id={id} aria-labelledby={idTitolo} className={`scroll-mt-4 py-16 sm:py-24 ${SFONDI[sfondo]}`}>
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex items-end justify-between gap-8">
          <div className="max-w-2xl">
            {sopratitolo ? <p className="text-sm font-semibold text-brand">{sopratitolo}</p> : null}
            <h2 id={idTitolo} className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {titolo}
            </h2>
            {introduzione ? <div className="mt-4 text-lg text-muted">{introduzione}</div> : null}
          </div>
          {illustrazione ? <div className="hidden w-36 shrink-0 sm:block lg:w-44">{illustrazione}</div> : null}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

/** Pulsante principale (link all'ancora del modulo). Testo scuro su teal chiaro in dark mode. */
export const classePulsantePrincipale =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-background shadow-sm transition-colors hover:bg-brand-strong";

export const classePulsanteSecondario =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-medium text-foreground transition-colors hover:border-brand";
