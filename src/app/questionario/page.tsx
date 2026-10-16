import type { Metadata } from "next";
import { connection } from "next/server";
import { leggiDatiAccount } from "@/lib/percorso/account";
import { DOMANDE } from "@/lib/percorso/domande";
import { anthropicConfigurato } from "@/lib/chat/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { InizioQuestionario } from "./inizio";

export const metadata: Metadata = {
  title: "Il tuo percorso in 5 minuti",
  description:
    "Dieci domande per costruire il tuo percorso verso la ditta individuale in Ticino e nel Grigioni italiano: i passi nell'ordine giusto, con i link ufficiali.",
};

export default async function PaginaQuestionario() {
  // Sempre al momento della richiesta: dipende dall'utente collegato.
  await connection();
  const account = await leggiDatiAccount();
  const raccontoDisponibile = anthropicConfigurato() && createAdminClient() !== null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <p className="text-sm font-semibold text-brand">Il tuo percorso</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
        {raccontoDisponibile ? "Costruiamo il tuo percorso" : `${DOMANDE.length} domande, circa 5 minuti`}
      </h1>
      <p className="mt-3 text-muted">
        {raccontoDisponibile
          ? "Raccontaci la tua idea con parole tue, oppure rispondi a 10 domande. "
          : "Se non sai qualcosa, scegli la risposta più vicina. "}
        Alla fine trovi i passi per aprire la tua ditta individuale, nell&apos;ordine giusto e con i link ufficiali.
      </p>
      <p className="mt-2 text-sm text-muted">
        {account.collegato
          ? `Le risposte vengono salvate nel tuo account${account.email ? ` ${account.email}` : ""}, così ritrovi il percorso su ogni dispositivo.`
          : "Le risposte restano solo in questo browser."}
      </p>

      <InizioQuestionario
        account={account}
        // «Racconta a Bleo» serve Claude e il limite per IP (chiave segreta di Supabase).
        raccontoDisponibile={raccontoDisponibile}
      />

      <noscript>
        <p className="mt-6 rounded-lg border border-border bg-card p-4 text-sm">
          Per il questionario serve JavaScript attivo nel browser.
        </p>
      </noscript>
    </div>
  );
}
