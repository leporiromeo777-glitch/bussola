import type { Metadata } from "next";
import Link from "next/link";
import { PaginaMessaggio } from "@/components/landing/pagina-messaggio";
import { leggiEsito } from "@/lib/lista-attesa/esiti-conferma";
import { MESSAGGIO_DEMO } from "@/lib/lista-attesa/messaggi";

export const metadata: Metadata = {
  title: "Conferma dell'iscrizione",
  robots: { index: false, follow: false },
};

/** Pagina di arrivo dopo il link di conferma (vedi ../conferma/route.ts). Solo lettura. */
export default async function PaginaConfermata({ searchParams }: PageProps<"/lista-attesa/confermata">) {
  const esito = leggiEsito((await searchParams).esito);

  switch (esito) {
    case "confermata":
    case "gia_confermata":
      return (
        <PaginaMessaggio
          tono="ok"
          titolo={esito === "confermata" ? "Grazie, iscrizione confermata!" : "Iscrizione già confermata, tutto a posto"}
        >
          <p>
            Sei nella lista d&apos;attesa. Ti scriviamo quando apre la beta chiusa e al massimo due aggiornamenti al
            mese. Ogni email ha il link per disiscriverti.
          </p>
          <p>Nel frattempo, se ti va, racconta Bussola a chi sta per aprire un&apos;attività.</p>
        </PaginaMessaggio>
      );
    case "link_non_valido":
      return (
        <PaginaMessaggio tono="errore" titolo="Questo link non funziona">
          <p>
            Forse è stato copiato a metà, oppure l&apos;iscrizione è stata cancellata nel frattempo. Prova ad aprirlo
            di nuovo dall&apos;email oppure{" "}
            <Link href="/#lista-attesa" className="text-brand underline underline-offset-2">
              iscriviti di nuovo
            </Link>
            .
          </p>
        </PaginaMessaggio>
      );
    case "demo":
      return (
        <PaginaMessaggio tono="info" titolo="Lista d'attesa non ancora attiva">
          <p>{MESSAGGIO_DEMO}</p>
        </PaginaMessaggio>
      );
    case "errore":
      return (
        <PaginaMessaggio tono="errore" titolo="Non siamo riusciti a confermare">
          <p>Qualcosa non ha funzionato dalla nostra parte. Riapri il link dall&apos;email tra qualche minuto.</p>
        </PaginaMessaggio>
      );
  }
}
