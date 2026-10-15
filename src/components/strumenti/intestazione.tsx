import Link from "next/link";
import type { ReactNode } from "react";
import { fonti } from "@/data/svizzera";
import { IconaIndietro } from "./icone";
import { classeLink, FonteLink } from "./ui";

/** Titolo della pagina di uno strumento, con il ritorno all'elenco e la nota "non è consulenza". */
export function IntestazioneStrumento({
  titolo,
  introduzione,
  children,
}: {
  titolo: string;
  introduzione: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="print:hidden">
      <nav aria-label="Percorso">
        <Link href="/strumenti" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <IconaIndietro className="size-4" />
          Tutti gli strumenti
        </Link>
      </nav>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{titolo}</h1>
      <div className="mt-3 max-w-3xl text-lg text-muted">{introduzione}</div>
      {children}
    </header>
  );
}

/** Nota fissa in fondo agli strumenti: informazione generale, non consulenza. */
export function NotaNonConsulenza({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-muted ${className}`}>
      È uno strumento che compili tu, con regole generali e fonti ufficiali: non è una consulenza fiscale o
      giuridica. Per il tuo caso personale rivolgiti all&apos;ufficio competente o a un fiduciario autorizzato (
      <FonteLink fonte={fonti.albofiduciari} />
      ).
    </p>
  );
}

export function LinkStrumento({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={classeLink}>
      {children}
    </Link>
  );
}
