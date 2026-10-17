import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  IconaCalendario,
  IconaConti,
  IconaDispositivo,
  IconaDocumento,
  IconaEtichetta,
  IconaFattura,
  IconaFotocamera,
  IconaFreccia,
  IconaOrologio,
  IconaPagina,
  IconaPenna,
} from "@/components/strumenti/icone";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { NotaNonConsulenza } from "@/components/strumenti/intestazione";

export const metadata: Metadata = {
  title: "Strumenti",
  description:
    "Tariffa oraria, budget del primo anno, business plan, preventivo e fattura con QR-fattura, documenti per fondare una Sagl, nome della ditta, testi pronti, lettere spiegate e i tuoi conti: strumenti per chi apre una ditta individuale in Ticino.",
};

type Strumento = {
  titolo: string;
  testo: string;
  Icona: ComponentType<{ className?: string }>;
  link: { href: string; etichetta: string }[];
  /** Usa l'intelligenza artificiale: quello che scrivi viene inviato per la risposta. */
  ai?: true;
  /** Salva nel tuo account (serve l'accesso), non solo nel browser. */
  account?: true;
};

const STRUMENTI: Strumento[] = [
  {
    titolo: "Tariffa oraria",
    testo:
      "Quanto chiedere all'ora per avere il reddito che vuoi, dopo costi e contributi AVS. Con la tavola scalare ufficiale.",
    Icona: IconaOrologio,
    link: [{ href: "/strumenti/tariffa", etichetta: "Calcola la tariffa" }],
  },
  {
    titolo: "Budget del primo anno",
    testo: "Ricavi e costi mese per mese, saldo cumulato, mese di pareggio e quanto mettere da parte per AVS e imposte.",
    Icona: IconaCalendario,
    link: [{ href: "/strumenti/budget", etichetta: "Prepara il budget" }],
  },
  {
    titolo: "Business plan di una pagina",
    testo: "Undici domande guidate, con esempi, per mettere la tua idea su un foglio A4 da stampare o mostrare.",
    Icona: IconaPagina,
    link: [{ href: "/strumenti/business-plan", etichetta: "Scrivi il business plan" }],
  },
  {
    titolo: "Preventivo e fattura",
    testo:
      "Preventivi che diventano fatture con un clic, IVA solo se sei iscritto e sezione pagamento con QR-fattura svizzera.",
    Icona: IconaFattura,
    link: [
      { href: "/strumenti/preventivo", etichetta: "Nuovo preventivo" },
      { href: "/strumenti/fattura", etichetta: "Nuova fattura" },
    ],
  },
  {
    titolo: "Fondare una Sagl",
    testo:
      "Per chi parte con dei soci: i dati della società, il capitale e le quote, chi dirige. Scarichi in PDF la scheda per il notaio e una bozza dello statuto, con le fonti di legge.",
    Icona: IconaDocumento,
    link: [{ href: "/strumenti/sagl", etichetta: "Prepara i documenti" }],
  },
  {
    titolo: "Nome della ditta",
    testo:
      "Idee per il nome della tua ditta individuale con il tuo cognome, come vuole la legge, e un primo controllo dei nomi simili nel registro di commercio.",
    Icona: IconaEtichetta,
    link: [{ href: "/strumenti/nome", etichetta: "Trova un nome" }],
    ai: true,
  },
  {
    titolo: "Testi pronti",
    testo:
      "Bleo ti scrive la bio per Instagram, la prima email a un cliente, l'introduzione di un preventivo o la tua attività in breve.",
    Icona: IconaPenna,
    link: [{ href: "/strumenti/testi", etichetta: "Scrivi i testi" }],
    ai: true,
  },
  {
    titolo: "Fotografa la lettera",
    testo:
      "Hai ricevuto una lettera da un ufficio? Fotografala: Bleo ti spiega in parole semplici cos'è, cosa ti chiedono e entro quando.",
    Icona: IconaFotocamera,
    link: [{ href: "/strumenti/lettera", etichetta: "Fotografa una lettera" }],
    ai: true,
  },
  {
    titolo: "I tuoi conti",
    testo:
      "Entrate, uscite e fatture in ordine: fotografa le ricevute o inoltrale per email, Bleo le legge e tu confermi. A fine anno scarichi tutto per il fiduciario.",
    Icona: IconaConti,
    link: [{ href: "/conti", etichetta: "Apri i tuoi conti" }],
    ai: true,
    account: true,
  },
];

export default function PaginaStrumenti() {
  return (
    <>
      <header className="flex max-w-4xl items-end justify-between gap-8">
        <div className="max-w-3xl">
        <p className="text-sm font-semibold text-brand">Strumenti</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          I conti e i documenti per partire
        </h1>
        <p className="mt-4 text-lg text-muted">
          Sono strumenti che compili tu, con i tuoi numeri: ti mostrano le regole generali e le fonti ufficiali, ma non
          sono una consulenza. Puoi stampare tutto o salvarlo come PDF.
        </p>
        </div>
        <ImmagineMascotte nome="scrivania" priority sizes="160px" className="hidden h-auto w-40 shrink-0 sm:block" />
      </header>

      <p className="mt-6 flex max-w-3xl items-start gap-2 rounded-xl border border-border bg-brand-soft p-4 text-sm">
        <IconaDispositivo className="mt-0.5 size-5 shrink-0 text-brand" />
        <span>
          <strong className="font-semibold">I tuoi dati restano su questo dispositivo.</strong> Gli strumenti salvano
          quello che scrivi solo nel tuo browser: Bleo non lo riceve. Se cambi dispositivo o cancelli i dati del
          browser, li perdi. Fanno eccezione gli strumenti segnati «con l&apos;AI»: per risponderti, quello che scrivi
          o fotografi viene inviato all&apos;intelligenza artificiale, senza salvarlo. «I tuoi conti» invece salva le
          voci e le ricevute nel tuo account, perché le ritrovi ovunque.
        </span>
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {STRUMENTI.map(({ titolo, testo, Icona, link, ai, account }) => (
          <li key={titolo} className="flex flex-col rounded-xl border border-border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Icona className="size-5" />
            </span>
            <h2 className="mt-5 flex flex-wrap items-center gap-2 text-lg font-semibold">
              {titolo}
              {ai ? (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">con l&apos;AI</span>
              ) : null}
              {account ? (
                <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-muted">
                  con l&apos;account
                </span>
              ) : null}
            </h2>
            <p className="mt-2 flex-1 text-sm text-muted">{testo}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {link.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex items-center gap-1.5 font-medium text-brand hover:text-brand-strong"
                >
                  {l.etichetta}
                  <IconaFreccia className="size-4" />
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <NotaNonConsulenza className="mt-10 max-w-3xl" />
    </>
  );
}
