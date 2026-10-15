import { IconaAvviso, IconaInfo } from "@/components/landing/icone";
import type { Avviso, LivelloAvviso } from "@/lib/percorso/regole";
import { ElencoFonti } from "./elenco-fonti";

const STILI: Record<LivelloAvviso, { bordo: string; icona: string; etichetta: string }> = {
  importante: { bordo: "border-l-danger", icona: "text-danger", etichetta: "Importante" },
  attenzione: { bordo: "border-l-accent", icona: "text-accent", etichetta: "Attenzione" },
  info: { bordo: "border-l-brand", icona: "text-brand", etichetta: "Da sapere" },
};

/** Gli avvisi del percorso, prima dei passi: i più importanti in alto. */
export function ElencoAvvisi({ avvisi, verificatoIl }: { avvisi: readonly Avviso[]; verificatoIl: string }) {
  if (avvisi.length === 0) return null;
  return (
    <section aria-labelledby="titolo-avvisi">
      <h2 id="titolo-avvisi" className="text-xl font-semibold tracking-tight">
        Da sapere subito
      </h2>
      <ul className="mt-4 space-y-3">
        {avvisi.map((a) => {
          const stile = STILI[a.livello];
          const Icona = a.livello === "info" ? IconaInfo : IconaAvviso;
          return (
            <li
              key={a.id}
              className={`rounded-xl border border-l-4 border-border bg-card p-4 break-inside-avoid ${stile.bordo}`}
            >
              <div className="flex gap-3">
                <Icona className={`mt-0.5 size-5 shrink-0 ${stile.icona}`} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">
                    <span className="sr-only">{stile.etichetta}: </span>
                    {a.titolo}
                  </h3>
                  <p className="mt-1">{a.testo}</p>
                  <div className="mt-3">
                    <ElencoFonti fonti={a.fonti} verificatoIl={verificatoIl} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
