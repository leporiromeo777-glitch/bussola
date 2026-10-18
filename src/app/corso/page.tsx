import type { Metadata } from "next";
import Link from "next/link";
import { LezioneVideo } from "@/components/corso/lezione-video";
import { IconaFreccia } from "@/components/landing/icone";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { ElencoFonti } from "@/components/percorso/elenco-fonti";
import { durataBreve, lezionePerPasso } from "@/data/corso";
import { FASI, PASSI, TITOLI_FASI } from "@/data/passi";

export const metadata: Metadata = {
  title: "Il corso di Bleo",
  description:
    "Una lezione video breve per ogni passo del percorso: Bleo ti spiega cos'è una ditta individuale e cosa fare, con i sottotitoli e le fonti ufficiali.",
};

/** Le lezioni seguono l'ordine dei passi: la lezione N spiega il passo N del percorso. */
const VOCI = PASSI.map((passo, i) => ({ passo, numero: i + 1, lezione: lezionePerPasso(passo.id) }));
const PRONTE = VOCI.filter((v) => v.lezione).length;

export default function PaginaCorso() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <header className="flex max-w-4xl items-end justify-between gap-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-brand">Il corso di Bleo</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            Un video breve per ogni passo
          </h1>
          <p className="mt-4 text-lg text-muted">
            Bleo ti spiega ogni passo del percorso in pochi minuti, con i sottotitoli e il link alla fonte
            ufficiale. Le lezioni seguono l&apos;ordine del percorso: {PRONTE === 1 ? "la prima è pronta" : `${PRONTE} sono pronte`}, le altre
            arrivano presto.
          </p>
        </div>
        <ImmagineMascotte nome="checklist" priority sizes="160px" className="hidden h-auto w-36 shrink-0 sm:block" />
      </header>

      <div className="mt-10 space-y-10">
        {FASI.map((fase) => {
          const voci = VOCI.filter((v) => v.passo.fase === fase);
          const idTitolo = `fase-${FASI.indexOf(fase)}`;
          return (
            <section key={fase} aria-labelledby={idTitolo}>
              <h2 id={idTitolo} className="text-xl font-extrabold tracking-tight">
                {TITOLI_FASI[fase]}
              </h2>
              <ol className="mt-4 space-y-3">
                {voci.map(({ passo, numero, lezione }) =>
                  lezione ? (
                    <li
                      key={passo.id}
                      id={`lezione-${passo.id}`}
                      className="bordo-sfumato grid scroll-mt-32 gap-5 rounded-3xl p-4 shadow-lg shadow-brand/10 sm:grid-cols-[minmax(0,20rem)_1fr] sm:p-6"
                    >
                      <LezioneVideo lezione={lezione} />
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-sm font-semibold text-brand">
                            Lezione {lezione.numero} · {durataBreve(lezione.durataSecondi)}
                          </p>
                          <h3 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-balance">
                            {lezione.titolo}
                          </h3>
                          <p className="mt-2 text-muted">{passo.descrizione}</p>
                        </div>
                        <ElencoFonti fonti={lezione.fonti} verificatoIl={lezione.verificatoIl} />
                        <Link
                          href={`/percorso#passo-${passo.id}`}
                          className="inline-flex items-center gap-1.5 self-start font-medium text-brand hover:text-brand-strong"
                        >
                          Vai al passo nel tuo percorso
                          <IconaFreccia className="size-4" />
                        </Link>
                      </div>
                    </li>
                  ) : (
                    <li
                      key={passo.id}
                      id={`lezione-${passo.id}`}
                      className="flex scroll-mt-32 items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-3 text-muted"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold"
                      >
                        {numero}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="sr-only">Lezione {numero}: </span>
                        <Link href={`/percorso#passo-${passo.id}`} className="hover:text-foreground hover:underline">
                          {passo.titolo}
                        </Link>
                      </span>
                      <span className="shrink-0 rounded-full bg-border/60 px-2.5 py-0.5 text-xs font-medium">In arrivo</span>
                    </li>
                  ),
                )}
              </ol>
            </section>
          );
        })}
      </div>

      <p className="mt-10 max-w-3xl text-sm text-muted">
        Le lezioni danno informazioni generali con le fonti ufficiali, non una consulenza personale. Per il tuo caso
        rivolgiti a un fiduciario autorizzato.
      </p>
    </div>
  );
}
