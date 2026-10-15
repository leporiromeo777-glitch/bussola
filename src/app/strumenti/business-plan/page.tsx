import type { Metadata } from "next";
import { PianoUnaPagina } from "@/components/strumenti/business-plan/piano-una-pagina";
import { IntestazioneStrumento } from "@/components/strumenti/intestazione";

export const metadata: Metadata = {
  title: "Business plan di una pagina",
  description:
    "Undici domande guidate, con esempi, per scrivere il business plan della tua attività su un solo foglio A4, da stampare o salvare in PDF.",
};

export default function PaginaBusinessPlan() {
  return (
    <>
      <IntestazioneStrumento
        titolo="Business plan di una pagina"
        introduzione={
          <p>
            Rispondi a undici domande con frasi brevi. Ne esce un foglio A4 da stampare o mostrare a chi ti può aiutare:
            una banca, un ente di sostegno, un socio.
          </p>
        }
      />
      <PianoUnaPagina />
    </>
  );
}
