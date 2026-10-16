import { IconaSpunta } from "@/components/landing/icone";
import { FASI, TITOLI_FASI, type Fase } from "@/data/passi";
import type { PassoPercorso } from "@/lib/percorso/regole";

/**
 * Le quattro fasi del percorso come tappe: quante cose fatte in ognuna e dove
 * sei adesso. Ogni tappa porta alla sua sezione.
 */
export function FasiPercorso({
  passi,
  fatti,
  faseAttuale,
}: {
  /** Solo i passi che ti riguardano. */
  passi: readonly PassoPercorso[];
  fatti: ReadonlySet<string>;
  faseAttuale: Fase | undefined;
}) {
  const tappe = FASI.map((fase, indice) => {
    const daFare = passi.filter((p) => p.passo.fase === fase && p.stato === "da_fare");
    const tutte = passi.filter((p) => p.passo.fase === fase);
    return { fase, indice, fatti: daFare.filter((p) => fatti.has(p.passo.id)).length, totale: daFare.length, vuota: tutte.length === 0 };
  }).filter((t) => !t.vuota);

  return (
    <nav aria-label="Fasi del percorso" className="print:hidden">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tappe.map((t) => {
          const completa = t.totale > 0 && t.fatti === t.totale;
          const attuale = t.fase === faseAttuale;
          return (
            <li key={t.fase}>
              <a
                href={`#fase-${t.indice}`}
                aria-current={attuale ? "step" : undefined}
                className={`flex h-full items-center gap-3 rounded-2xl border p-3 transition-colors hover:border-brand ${
                  attuale ? "border-brand bg-brand-soft" : "border-border bg-card"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    completa
                      ? "bg-success text-background"
                      : attuale
                        ? "bg-brand text-background"
                        : "border border-border text-muted"
                  }`}
                >
                  {completa ? <IconaSpunta className="size-4" /> : t.indice + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{TITOLI_FASI[t.fase]}</span>
                  <span className="block text-xs text-muted">
                    {t.totale === 0 ? "Solo facoltativi" : `${t.fatti} di ${t.totale} fatti`}
                    {attuale ? <span className="sr-only"> (sei qui)</span> : null}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
