import type { Metadata } from "next";
import { GestioneDocumenti } from "@/components/strumenti/documenti/gestione-documenti";
import { IntestazioneStrumento } from "@/components/strumenti/intestazione";
import { supabaseConfigured } from "@/lib/supabase/env";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Preventivo",
  description:
    "Prepara un preventivo per i tuoi clienti, con IVA solo se sei iscritto, e trasformalo in fattura con QR-fattura con un clic.",
};

export default async function PaginaPreventivo({ searchParams }: PageProps<"/strumenti/preventivo">) {
  const { doc } = await searchParams;
  // Con l'accesso i preventivi stanno nell'account (anche nell'app); senza, nel browser.
  const accesso = supabaseConfigured() ? ((await getUser()) ? "collegato" : "ospite") : null;
  return (
    <>
      <IntestazioneStrumento
        titolo="Preventivo"
        introduzione={
          <p>
            Scrivi cosa offri e a che prezzo. Quando il cliente accetta, trasformi il preventivo in fattura con un clic.
          </p>
        }
      />
      <GestioneDocumenti tipo="preventivo" idIniziale={typeof doc === "string" ? doc : null} accesso={accesso} />
    </>
  );
}
