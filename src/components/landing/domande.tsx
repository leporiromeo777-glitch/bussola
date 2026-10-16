import Link from "next/link";
import type { ReactNode } from "react";
import { sito, valoreSegnaposto } from "@/lib/sito";
import { IconaFrecciaGiu } from "./icone";
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
        La beta chiusa è prevista per dicembre 2026, con 30–50 persone invitate dalla lista d&apos;attesa. Se entri in
        lista ti scriviamo quando parte.
      </>
    ),
  },
  {
    domanda: "Chi c'è dietro?",
    risposta: (
      <>
        {valoreSegnaposto(sito.titolare.nome) ? (
          <>
            Bussola è un progetto indipendente, nato da chi sta affrontando adesso gli stessi passi e costruisce il
            prodotto con l&apos;aiuto dell&apos;intelligenza artificiale.
          </>
        ) : (
          <>
            Bussola è un progetto di {sito.titolare.nome}, che sta affrontando adesso gli stessi passi e costruisce il
            prodotto con l&apos;aiuto dell&apos;intelligenza artificiale.
          </>
        )}{" "}
        Ogni fonte ufficiale viene controllata una per una prima di essere usata e ricontrollata ogni mese. Indirizzo e contatti sono nell&apos;
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
        Per ora Bussola è pensato per la Svizzera italiana: Ticino e Grigioni italiano. Molte regole sono federali, ma
        quelle cantonali cambiano da un Cantone all&apos;altro: il resto della Svizzera arriverà dopo. Se sei in un
        altro Cantone iscriviti comunque: ci aiuta a capire dove andare.
      </>
    ),
  },
  {
    domanda: "Sostituisce il fiduciario?",
    risposta: (
      <>
        No. Bussola ti dà informazioni generali con la fonte ufficiale e ti aiuta a preparare i documenti, ma non
        compila dichiarazioni d&apos;imposta e non tiene la contabilità per te. Quando il tuo caso è particolare te lo
        dice e ti consiglia di rivolgerti a un fiduciario autorizzato.
      </>
    ),
  },
  {
    domanda: "Che dati raccogliete?",
    risposta: (
      <>
        Per la lista d&apos;attesa solo la tua email e, se vuoi, nome, Cantone e situazione. Li usiamo per scriverti
        quando apre la beta e per capire chi è interessato; non li vendiamo a nessuno. Tutti i dettagli sono
        nell&apos;
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
    <Sezione id="domande" sopratitolo="Domande frequenti" titolo="Domande e risposte">
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {DOMANDE.map(({ domanda, risposta }) => (
          <details key={domanda} className="group px-5 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium [&::-webkit-details-marker]:hidden">
              {domanda}
              <IconaFrecciaGiu className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-5 text-muted">{risposta}</p>
          </details>
        ))}
      </div>
    </Sezione>
  );
}
