import type { Metadata } from "next";
import { ComeFunziona } from "@/components/landing/come-funziona";
import { CosaNonE } from "@/components/landing/cosa-non-e";
import { Domande } from "@/components/landing/domande";
import { Hero } from "@/components/landing/hero";
import { ListaAttesa } from "@/components/landing/lista-attesa";
import { Prezzi } from "@/components/landing/prezzi";
import { Problema } from "@/components/landing/problema";
import { sito } from "@/lib/sito";

const titolo = `${sito.nome}: dall'idea alla ditta individuale aperta, passo per passo`;
const descrizione =
  "Percorso personale, risposte con la fonte ufficiale e documenti pronti per aprire la tua ditta individuale in Ticino e nel Grigioni italiano. Entra nella lista d'attesa.";

export const metadata: Metadata = {
  title: { absolute: titolo },
  description: descrizione,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_CH",
    url: "/",
    siteName: sito.nome,
    title: titolo,
    description: descrizione,
  },
  twitter: { card: "summary_large_image", title: titolo, description: descrizione },
};

export default function PaginaIniziale() {
  return (
    <>
      <Hero />
      <Problema />
      <ComeFunziona />
      <CosaNonE />
      <Prezzi />
      <Domande />
      <ListaAttesa />
    </>
  );
}
