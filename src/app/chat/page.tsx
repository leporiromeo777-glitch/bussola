import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { fonti } from "@/data/svizzera";
import { DOMANDE_GRATIS_AL_MESE, quotaPubblica } from "@/lib/chat/quota";
import { anthropicConfigurato, leggiQuota } from "@/lib/chat/server";
import type { QuotaPubblica } from "@/lib/chat/tipi";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createClient, getUser } from "@/lib/supabase/server";
import { Chat } from "./chat";
import { DOMANDE_ESEMPIO } from "./esempi";

export const metadata: Metadata = {
  title: "Chiedi a Bleo",
  description:
    "Fai una domanda sull'apertura della tua ditta individuale: Bleo risponde solo con fonti ufficiali verificate e ti mostra sempre il link.",
};

export default async function PaginaChat({ searchParams }: PageProps<"/chat">) {
  // Sempre al momento della richiesta: dipende dall'utente collegato e dalle variabili d'ambiente.
  await connection();
  const { domanda } = await searchParams;
  // Domanda precompilata dai link "Chiedi a Bleo" del percorso: solo testo, troncato.
  const domandaIniziale = typeof domanda === "string" ? domanda.trim().slice(0, 1000) : "";
  const attiva = supabaseConfigured() && anthropicConfigurato();
  const user = attiva ? await getUser() : null;

  let quota: QuotaPubblica | null = null;
  if (user) {
    const supabase = await createClient();
    const letta = supabase ? await leggiQuota(supabase, user.id) : null;
    quota = letta ? quotaPubblica(letta) : null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="flex items-center gap-4">
        <ImmagineMascotte nome="pensa" priority sizes="96px" className="h-auto w-20 shrink-0" />
        <h1 className="text-2xl font-semibold sm:text-3xl">Chiedi a Bleo</h1>
      </div>
      <p className="mt-2 max-w-2xl text-muted">
        Rispondo solo con le fonti ufficiali che abbiamo verificato e ti mostro sempre il link: è informazione
        generale con fonti ufficiali, non consulenza.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Stai parlando con un&apos;intelligenza artificiale (Claude, di Anthropic), non con un fiduciario. Salviamo la
        tua domanda per contare le domande del mese e per capire quali fonti mancano; non la usiamo per addestrare
        modelli. Per il tuo caso personale trovi un professionista nell&apos;
        <a
          href={fonti.albofiduciari.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline underline-offset-2"
        >
          albo dei fiduciari autorizzati
        </a>
        . Dettagli nell&apos;
        <Link href="/privacy" className="text-brand underline underline-offset-2">
          informativa privacy
        </Link>
        .
      </p>

      {!attiva ? <AvvisoDemo /> : user ? <Chat quotaIniziale={quota} esempi={DOMANDE_ESEMPIO} domandaIniziale={domandaIniziale} /> : <InvitoAccesso domanda={domandaIniziale} />}

      <noscript>
        <p className="mt-6 rounded-lg border border-border bg-card p-4 text-sm">
          Per usare la chat serve JavaScript attivo nel browser.
        </p>
      </noscript>
    </div>
  );
}

function AvvisoDemo() {
  return (
    <div role="status" className="mt-8 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">La chat non è ancora attiva</h2>
      <p className="mt-2 text-muted">
        Questa è una versione di prova: mancano le chiavi di configurazione (Supabase e Claude), quindi la chat non
        può rispondere. Nel frattempo puoi seguire i passi del tuo percorso.
      </p>
      <Link href="/percorso" className="mt-4 inline-block font-medium text-brand underline underline-offset-2">
        Vai al tuo percorso
      </Link>
    </div>
  );
}

function InvitoAccesso({ domanda }: { domanda: string }) {
  const destinazione = domanda ? `/chat?domanda=${encodeURIComponent(domanda)}` : "/chat";
  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">Accedi per fare le tue domande</h2>
      <p className="mt-2 text-muted">
        Durante la prova hai {DOMANDE_GRATIS_AL_MESE} domande al mese. Niente password: ricevi un link via email.
      </p>
      <Link
        href={`/accedi?next=${encodeURIComponent(destinazione)}`}
        className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 font-medium text-background hover:bg-brand-strong"
      >
        Accedi e chiedi
      </Link>
      <h3 className="mt-6 text-sm font-semibold text-muted">Per esempio puoi chiedere</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {DOMANDE_ESEMPIO.map((domanda) => (
          <li key={domanda}>{domanda}</li>
        ))}
      </ul>
    </div>
  );
}
