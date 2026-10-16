import type { ReactNode } from "react";

const SFONDI = {
  normale: "",
  card: "border-y border-border bg-card",
  brand: "bg-brand-soft",
} as const;

/**
 * Sezione della landing con titolo collegato (aria-labelledby) e contenitore
 * max-w-5xl. Titolo centrato e grande, con il sopratitolo in una pillola.
 */
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
  titolo: ReactNode;
  introduzione?: ReactNode;
  sfondo?: keyof typeof SFONDI;
  /** Immagine decorativa sopra il titolo. */
  illustrazione?: ReactNode;
  children: ReactNode;
}) {
  const idTitolo = `${id}-titolo`;
  return (
    <section id={id} aria-labelledby={idTitolo} className={`scroll-mt-24 py-20 sm:py-28 ${SFONDI[sfondo]}`}>
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          {illustrazione ? <div className="mb-4 w-28 sm:w-32">{illustrazione}</div> : null}
          {sopratitolo ? <Pillola>{sopratitolo}</Pillola> : null}
          <h2
            id={idTitolo}
            className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-4xl"
          >
            {titolo}
          </h2>
          {introduzione ? <div className="mt-4 text-lg text-muted text-pretty">{introduzione}</div> : null}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

/** Piccola etichetta con il bordo sfumato (sopratitoli, «Esempio»). */
export function Pillola({ children }: { children: ReactNode }) {
  return (
    <p className="bordo-sfumato inline-flex rounded-full px-3 py-1 text-sm font-semibold text-brand">{children}</p>
  );
}

/** Pulsante principale con la sfumatura del marchio. */
export const classePulsantePrincipale =
  "fondo-sfumato inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 font-semibold shadow-md shadow-brand/20 transition-[filter,transform] hover:brightness-110 active:scale-[0.98] motion-reduce:transition-none";

export const classePulsanteSecondario =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-7 py-3 font-semibold text-foreground transition-colors hover:border-brand";
