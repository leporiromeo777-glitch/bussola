import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { listaAttesaAttiva } from "@/lib/lista-attesa/stato";
import { IconaChecklist, IconaDocumento, IconaFreccia, IconaSpunta } from "./icone";
import { classePulsantePrincipale, classePulsanteSecondario, Pillola } from "./sezione";

/**
 * Apertura centrata: pillola, titolo grande, una riga di spiegazione, due
 * pulsanti, due garanzie vere (niente voti o numeri di clienti: non ne
 * abbiamo ancora) e Bleo grande al centro con tre esempi intorno.
 */
export function Hero() {
  const listaAperta = listaAttesaAttiva();
  return (
    <section aria-labelledby="hero-titolo" className="overflow-x-clip">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-14 text-center sm:pt-20">
        <Pillola>Il mentore per aprire la tua attività in Ticino</Pillola>
        <h1
          id="hero-titolo"
          className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-balance sm:text-6xl"
        >
          Dall&apos;idea alla tua <span className="testo-sfumato">prima fattura</span>, passo per passo.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted text-pretty sm:text-xl">
          Bleo ti dice cosa fare e in che ordine per aprire la tua ditta individuale, con il link ufficiale per ogni
          passo. In italiano, senza giri di parole.
        </p>
        <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Link href="/questionario" className={`${classePulsantePrincipale} w-full sm:w-auto`}>
            Prova il questionario
            <IconaFreccia className="size-4" />
          </Link>
          <a href="#lista-attesa" className={`${classePulsanteSecondario} w-full sm:w-auto`}>
            Entra nella lista d&apos;attesa
          </a>
        </div>
        <ul className="mt-8 flex flex-col gap-3 text-left text-sm sm:flex-row sm:gap-8">
          <Garanzia titolo="Fonti ufficiali" testo="Confederazione, Cantone, AVS" />
          <Garanzia titolo="5 minuti" testo="10 domande e hai il tuo percorso" />
          <Garanzia titolo="Fatto in Ticino" testo="Per Ticino e Grigioni italiano" />
        </ul>

        <div className="relative mt-12 w-full max-w-3xl">
          <div
            aria-hidden="true"
            className="absolute inset-x-10 bottom-4 top-10 -z-10 rounded-full bg-brand-soft blur-3xl sm:inset-x-24"
          />
          <ImmagineMascotte
            nome="coppia"
            priority
            sizes="(min-width: 640px) 380px, 260px"
            className="mx-auto h-auto w-64 drop-shadow-xl sm:w-96"
          />
          <Etichetta className="left-0 top-10 sm:left-4" Icona={IconaSpunta}>
            Forma giuridica scelta
          </Etichetta>
          <Etichetta className="right-0 top-36 sm:right-2" Icona={IconaChecklist}>
            Prossimo passo: cassa AVS
          </Etichetta>
          <Etichetta className="bottom-10 left-2 sm:left-16" Icona={IconaDocumento}>
            Fattura con codice QR pronta
          </Etichetta>
        </div>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted shadow-sm">
          <span aria-hidden="true" className={`size-2 rounded-full ${listaAperta ? "bg-success" : "bg-accent"}`} />
          {listaAperta ? "Lista d'attesa aperta" : "Versione di prova · lista d'attesa in arrivo"}
        </p>
      </div>
    </section>
  );
}

function Garanzia({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <IconaSpunta className="size-4" />
      </span>
      <span>
        <strong className="block font-semibold">{titolo}</strong>
        <span className="text-muted">{testo}</span>
      </span>
    </li>
  );
}

/** Esempio decorativo accanto a Bleo (dal tablet in su): i passi veri arrivano dal questionario. */
function Etichetta({
  className,
  Icona,
  children,
}: {
  className: string;
  Icona: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <p
      aria-hidden="true"
      className={`absolute hidden items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur sm:inline-flex ${className}`}
    >
      <span className="flex size-6 items-center justify-center rounded-md bg-brand-soft text-brand">
        <Icona className="size-4" />
      </span>
      {children}
    </p>
  );
}
