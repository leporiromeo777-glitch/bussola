import { dataSvizzera, type Fonte } from "@/data/svizzera";

/** Fonti ufficiali con link e data di controllo. */
export function ElencoFonti({ fonti, verificatoIl }: { fonti: readonly Fonte[]; verificatoIl?: string }) {
  if (fonti.length === 0) return null;
  const una = fonti.length === 1;
  return (
    <div className="text-sm">
      <p className="font-medium text-muted">
        {una ? "Fonte ufficiale" : "Fonti ufficiali"}
        {verificatoIl ? (
          <span className="font-normal">
            {" "}
            · {una ? "verificata" : "verificate"} il {dataSvizzera(verificatoIl)}
          </span>
        ) : null}
      </p>
      <ul className="mt-1 space-y-1">
        {fonti.map((f) => (
          <li key={f.url}>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline underline-offset-2 hover:text-brand-strong"
            >
              {f.titolo}
              <span className="sr-only"> (si apre in una nuova scheda)</span>
            </a>
            <span className="text-muted"> · {f.ente}</span>
            <span className="hidden break-all text-muted print:inline"> · {f.url}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
