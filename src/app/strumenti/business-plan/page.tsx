import type { Metadata } from "next";
import { PianoUnaPagina } from "@/components/strumenti/business-plan/piano-una-pagina";
import { IntestazioneStrumento } from "@/components/strumenti/intestazione";
import { supabaseConfigured } from "@/lib/supabase/env";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Business plan di una pagina",
  description:
    "Undici domande guidate, con esempi, per scrivere il business plan della tua attività su un solo foglio A4, da stampare o salvare in PDF.",
};

export default async function PaginaBusinessPlan() {
  // Con l'accesso i dati stanno nell'account (anche nell'app); senza accesso restano nel browser,
  // con un invito ad accedere; senza Supabase solo nel browser. getUser legge sempre i cookie:
  // la pagina è dinamica anche se Supabase non era configurato durante la build.
  const utente = await getUser();
  const accesso = supabaseConfigured() ? (utente ? "collegato" : "ospite") : null;
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
      <PianoUnaPagina accesso={accesso} />
    </>
  );
}
