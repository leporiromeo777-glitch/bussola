import type { Metadata } from "next";
import { connection } from "next/server";
import { IntestazioneStrumento } from "@/components/strumenti/intestazione";
import { TestiPronti } from "@/components/strumenti/testi/testi-pronti";
import { anthropicConfigurato } from "@/lib/chat/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Testi pronti",
  description:
    "Bleo scrive per te la descrizione per il sito o Instagram, la prima email a un cliente, l'introduzione di un preventivo e la tua attività in breve.",
};

export default async function PaginaTesti() {
  // Al momento della richiesta: la disponibilità dipende dalle chiavi del server.
  await connection();
  // Servono Claude e il limite per IP (chiave segreta di Supabase).
  const disponibile = anthropicConfigurato() && createAdminClient() !== null;

  return (
    <>
      <IntestazioneStrumento
        titolo="Testi pronti"
        introduzione={
          <p>
            Dimmi cosa fai e Bleo ti scrive un testo da usare subito: per il sito o Instagram, una prima email a un
            cliente, un preventivo o per spiegare la tua attività in breve. Poi lo controlli, lo cambi e lo copi.
          </p>
        }
      />
      <TestiPronti disponibile={disponibile} />
    </>
  );
}
