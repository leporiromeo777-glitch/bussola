import { EsempioPercorso } from "./esempio-percorso";
import { IconaFreccia, IconaSpunta } from "./icone";
import { classePulsantePrincipale, classePulsanteSecondario } from "./sezione";

const PROMESSE = [
  { titolo: "Un percorso personale", testo: "i passi giusti per te, nell'ordine giusto." },
  { titolo: "Risposte con la fonte ufficiale", testo: "ogni risposta mostra il link da cui viene." },
  { titolo: "Documenti pronti", testo: "business plan, tariffa, budget, preventivi e fatture." },
];

export function Hero() {
  return (
    <section aria-labelledby="hero-titolo">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 pb-16 pt-12 sm:pb-24 sm:pt-20 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted">
            <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
            Lista d&apos;attesa aperta
          </p>
          <h1
            id="hero-titolo"
            className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl"
          >
            Dall&apos;idea alla tua ditta individuale aperta e alla prima fattura, passo per passo.
          </h1>
          <p className="mt-5 text-lg text-muted">
            Bussola è il mentore che ti dice cosa fare e in che ordine. In italiano, senza giri di parole.
          </p>
          <ul className="mt-6 space-y-3">
            {PROMESSE.map((p) => (
              <li key={p.titolo} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <IconaSpunta className="size-4" />
                </span>
                <span>
                  <strong className="font-semibold">{p.titolo}</strong>: {p.testo}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#lista-attesa" className={classePulsantePrincipale}>
              Entra nella lista d&apos;attesa
              <IconaFreccia className="size-4" />
            </a>
            <a href="#come-funziona" className={classePulsanteSecondario}>
              Come funziona
            </a>
          </div>
          <p className="mt-6 text-sm text-muted">Per chi apre un&apos;attività in Ticino e nel Grigioni italiano.</p>
        </div>
        <EsempioPercorso />
      </div>
    </section>
  );
}
