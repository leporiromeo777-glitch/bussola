import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PaginaMessaggio } from "@/components/landing/pagina-messaggio";
import { leggiToken } from "@/lib/lista-attesa/validazione";
import { sito } from "@/lib/sito";
import { confermaListaAttesa } from "../azioni";
import { PulsanteConferma } from "./pulsante-conferma";

export const metadata: Metadata = {
  title: "Conferma l'iscrizione",
  // Il token resta fuori dall'intestazione Referer delle pagine successive.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

/**
 * Link dell'email di conferma (double opt-in). Aprire la pagina (GET) non
 * conferma nulla: a confermare è il pulsante (POST con Server Action). Così
 * i filtri antispam che aprono da soli i link delle email (caselle aziendali
 * e scolastiche) non confermano iscrizioni al posto della persona.
 */
export default async function PaginaConferma({ searchParams }: PageProps<"/lista-attesa/conferma">) {
  const token = leggiToken((await searchParams).token);
  if (!token) redirect("/lista-attesa/confermata?esito=link_non_valido");

  return (
    <PaginaMessaggio tono="info" titolo="Conferma l'iscrizione" azioni={false}>
      <p>
        Manca un ultimo passo: premi il pulsante per confermare che vuoi entrare nella lista d&apos;attesa di{" "}
        {sito.nome}.
      </p>
      <p>Se non hai chiesto tu l&apos;iscrizione, chiudi questa pagina: senza conferma non ti scriveremo più.</p>
      <form action={confermaListaAttesa} className="pt-4">
        <input type="hidden" name="token" value={token} />
        <PulsanteConferma />
      </form>
    </PaginaMessaggio>
  );
}
