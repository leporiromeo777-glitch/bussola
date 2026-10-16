import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { IntestazioneStrumento } from "@/components/strumenti/intestazione";
import { classeLink } from "@/components/strumenti/ui";
import { anthropicConfigurato } from "@/lib/chat/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FotografaLettera } from "./fotografa-lettera";

export const metadata: Metadata = {
  title: "Fotografa la lettera",
  description:
    "Hai ricevuto una lettera dalla cassa AVS, dalle contribuzioni o dal Comune? Fotografala: Bleo ti spiega in parole semplici cos'è, cosa ti chiedono e entro quando.",
};

export default async function PaginaLettera() {
  // Al momento della richiesta: dipende dalle variabili d'ambiente del server.
  await connection();
  // Serve Claude e il limite per IP (chiave segreta di Supabase).
  const disponibile = anthropicConfigurato() && createAdminClient() !== null;

  return (
    <div className="mx-auto max-w-2xl">
      <IntestazioneStrumento
        titolo="Fotografa la lettera"
        introduzione={
          <p>
            Ti è arrivata una lettera dalla cassa AVS, dalle contribuzioni, dal Comune o da un&apos;assicurazione e non
            capisci cosa vuole? Fotografala: Bleo ti spiega cos&apos;è, cosa ti chiedono, entro quando e cosa fare.
          </p>
        }
      />

      {disponibile ? (
        <FotografaLettera />
      ) : (
        <section className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-6 text-center sm:flex-row sm:text-left">
          <ImmagineMascotte nome="pensa" sizes="96px" className="h-auto w-24 shrink-0" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Questa funzione non è ancora attiva</h2>
            <p className="mt-2 text-muted">
              Presto potrai fotografare le lettere degli uffici e farle spiegare da Bleo. Nel frattempo, se una lettera
              ti preoccupa, chiama l&apos;ufficio che l&apos;ha scritta: il numero di telefono è di solito in alto.
            </p>
            <p className="mt-3">
              <Link href="/strumenti" className={classeLink}>
                Torna agli strumenti
              </Link>
            </p>
          </div>
        </section>
      )}

      <noscript>
        <p className="mt-6 rounded-lg border border-border bg-card p-4 text-sm">
          Per leggere la lettera serve JavaScript attivo nel browser.
        </p>
      </noscript>
    </div>
  );
}
