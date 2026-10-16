import { ImmagineMascotte } from "@/components/mascotte/immagine";
import Link from "next/link";
import type { ReactNode } from "react";
import { sito, valoreSegnaposto } from "@/lib/sito";
import { Sezione } from "./sezione";

const classeLink = "text-brand underline underline-offset-2 hover:text-brand-strong";

const DOMANDE: { domanda: string; risposta: ReactNode }[] = [
  {
    domanda: "È gratis?",
    risposta: (
      <>
        Entrare nella lista d&apos;attesa è gratis e non ti impegna a nulla. Al lancio ci sarà un piano gratuito
        (questionario, checklist di base, 10 domande al mese) e un piano a pagamento per il percorso completo: i
        prezzi previsti sono qui sopra e possono ancora cambiare.
      </>
    ),
  },
  {
    domanda: "Quando posso usarlo?",
    risposta: (
      <>
        Il questionario, la checklist e gli strumenti li puoi già provare gratis, in versione di prova. La beta
        chiusa con la chat e il percorso completo è prevista per dicembre 2026, con 30–50 persone invitate dalla
        lista d&apos;attesa: se entri in lista ti scriviamo quando parte.
      </>
    ),
  },
  {
    domanda: "Chi c'è dietro?",
    risposta: (
      <>
        {valoreSegnaposto(sito.titolare.nome) ? (
          <>
            Bleo è un progetto indipendente, nato da chi sta affrontando adesso gli stessi passi e costruisce il
            prodotto con l&apos;aiuto dell&apos;intelligenza artificiale.
          </>
        ) : (
          <>
            Bleo è un progetto di {sito.titolare.nome}, che sta affrontando adesso gli stessi passi e costruisce il
            prodotto con l&apos;aiuto dell&apos;intelligenza artificiale.
          </>
        )}{" "}
        Ogni fonte ufficiale viene scelta una per una e il suo contenuto controllato prima di essere usata; è previsto un nuovo controllo ogni mese. I contatti sono nell&apos;
        <Link href="/impressum" className={classeLink}>
          impressum
        </Link>
        .
      </>
    ),
  },
  {
    domanda: "Funziona anche fuori dal Ticino?",
    risposta: (
      <>
        Per ora Bleo è pensato per la Svizzera italiana: Ticino e Grigioni italiano. Molte regole sono federali, ma
        quelle cantonali cambiano da un Cantone all&apos;altro: il resto della Svizzera arriverà dopo. Se sei in un
        altro Cantone iscriviti comunque: ci aiuta a capire dove andare.
      </>
    ),
  },
  {
    domanda: "Sostituisce il fiduciario?",
    risposta: (
      <>
        No. Bleo ti dà informazioni generali con la fonte ufficiale e strumenti che compili tu (tariffa, budget, preventivo, fattura), ma non
        compila dichiarazioni d&apos;imposta e non tiene la contabilità per te. Quando il tuo caso è particolare te lo
        dice e ti consiglia di rivolgerti a un fiduciario autorizzato.
      </>
    ),
  },
  {
    domanda: "Che dati raccogliete?",
    risposta: (
      <>
        Per la lista d&apos;attesa la tua email e, se vuoi, nome, Cantone e situazione, più il link da cui arrivi e
        la data del consenso. Questionario e strumenti restano nel tuo browser, a meno che tu non acceda con un
        account. Non vendiamo i dati a nessuno. Tutti i dettagli sono nell&apos;
        <Link href="/privacy" className={classeLink}>
          informativa sulla privacy
        </Link>
        .
      </>
    ),
  },
];

export function Domande() {
  return (
    <Sezione
      id="domande"
      sopratitolo="FAQ"
      titolo="Domande frequenti"
      illustrazione={<ImmagineMascotte nome="pensa" sizes="176px" className="h-auto w-full" />}
    >
      <div className="mx-auto max-w-2xl space-y-3">
        {DOMANDE.map(({ domanda, risposta }) => (
          <details key={domanda} className="group rounded-2xl border border-border bg-card px-5 shadow-sm sm:px-6">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
              {domanda}
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-lg leading-none text-background transition-transform group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="pb-5 text-muted">{risposta}</p>
          </details>
        ))}
      </div>
    </Sezione>
  );
}
