import Link from "next/link";
import type { ReactNode } from "react";
import { IconaAvviso, IconaInfo, IconaSpunta } from "./icone";

const TONI = {
  ok: { classe: "bg-brand-soft text-brand", Icona: IconaSpunta },
  info: { classe: "bg-card text-muted border border-border", Icona: IconaInfo },
  errore: { classe: "bg-card text-danger border border-border", Icona: IconaAvviso },
} as const;

/** Pagina breve con un esito (conferma, disiscrizione, errori dei link). */
export function PaginaMessaggio({
  tono,
  titolo,
  children,
  azioni = true,
}: {
  tono: keyof typeof TONI;
  titolo: string;
  children?: ReactNode;
  /** Mostra il link per tornare alla pagina iniziale. */
  azioni?: boolean;
}) {
  const { classe, Icona } = TONI[tono];
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-24">
      <span className={`flex size-12 items-center justify-center rounded-full ${classe}`}>
        <Icona className="size-6" />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{titolo}</h1>
      <div className="mt-4 space-y-3 text-lg text-muted">{children}</div>
      {azioni ? (
        <p className="mt-8">
          <Link href="/" className="font-medium text-brand underline underline-offset-2 hover:text-brand-strong">
            Torna alla pagina iniziale
          </Link>
        </p>
      ) : null}
    </div>
  );
}
