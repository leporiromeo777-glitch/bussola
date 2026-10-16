import { fonti } from "@/data/svizzera";
import { IconaInfo } from "@/components/landing/icone";

/** Il limite del servizio, sempre visibile: informazione generale, non consulenza (LFid). */
export function NotaInformazione({ compatta = false }: { compatta?: boolean }) {
  if (compatta) {
    return (
      <p role="note" className="flex items-start gap-2 text-sm text-muted">
        <IconaInfo className="mt-0.5 size-4 shrink-0 text-brand" />
        <span>
          Informazione generale con fonti ufficiali, non consulenza personalizzata. Per il tuo caso personale:
          l&apos;ufficio competente o un fiduciario autorizzato (
          <a
            href={fonti.albofiduciari.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline underline-offset-2 hover:text-brand-strong"
          >
            albo del Cantone Ticino
            <span className="sr-only"> (si apre in una nuova scheda)</span>
          </a>
          ).
        </span>
      </p>
    );
  }
  return (
    <p role="note" className="flex gap-3 rounded-xl border border-border bg-brand-soft p-4 text-sm">
      <IconaInfo className="mt-0.5 size-5 shrink-0 text-brand" />
      <span>
        <strong className="font-semibold">
          Informazione generale con fonti ufficiali, non consulenza personalizzata.
        </strong>{" "}
        Ogni passo indica cosa vale di regola nella tua situazione; per il tuo caso personale rivolgiti all&apos;ufficio
        competente o a un fiduciario autorizzato (
        <a
          href={fonti.albofiduciari.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline underline-offset-2 hover:text-brand-strong"
        >
          albo online del Cantone Ticino
          <span className="sr-only"> (si apre in una nuova scheda)</span>
        </a>
        ).
      </span>
    </p>
  );
}
