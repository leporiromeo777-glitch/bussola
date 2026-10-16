import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { fonti } from "@/data/svizzera";
import type { ConversazioneBreve } from "@/lib/chat/conversazioni";
import { elencoChat } from "@/lib/chat/conversazioni-server";
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

  if (!attiva) return <AvvisoDemo />;
  if (!user) return <InvitoAccesso domanda={domandaIniziale} />;

  let quota: QuotaPubblica | null = null;
  let elenco: ConversazioneBreve[] = [];
  const supabase = await createClient();
  if (supabase) {
    const [letta, chat] = await Promise.all([leggiQuota(supabase, user.id), elencoChat(supabase)]);
    quota = letta ? quotaPubblica(letta) : null;
    // Senza le tabelle delle chat (migrazione non ancora eseguita) l'elenco resta vuoto.
    elenco = chat ?? [];
  }

  return (
    <>
      <Chat
        quotaIniziale={quota}
        esempi={DOMANDE_ESEMPIO}
        domandaIniziale={domandaIniziale}
        elencoIniziale={elenco}
        linkAlbo={fonti.albofiduciari.url}
      />
      <noscript>
        <p className="m-4 rounded-lg border border-border bg-card p-4 text-sm">
          Per usare la chat serve JavaScript attivo nel browser.
        </p>
      </noscript>
    </>
  );
}

/** Stessa schermata d'inizio della chat (mascotte e saluto al centro), per chi non può ancora chiedere. */
function SchermataInizio({ immagine, titolo, children }: { immagine: "coppia" | "pensa"; titolo: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 sm:py-16">
      <ImmagineMascotte nome={immagine} priority sizes="112px" className="h-auto w-20 sm:w-24" />
      <h1 className="mt-3 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">{titolo}</h1>
      <p className="mt-2 max-w-md text-center text-muted">
        Raccontami cosa vuoi fare, con parole tue: ti dico cosa fare e in che ordine. Rispondo solo con le fonti
        ufficiali verificate e ti mostro sempre il link.
      </p>
      {children}
      <p className="mt-8 max-w-xl text-center text-xs leading-relaxed text-muted">
        Bleo è un&apos;intelligenza artificiale (Claude, di Anthropic), non un fiduciario: dà informazioni generali,
        non consulenza. Per il tuo caso personale trovi un professionista nell&apos;
        <a
          href={fonti.albofiduciari.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          albo dei fiduciari autorizzati
        </a>
        . Dettagli nell&apos;
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          informativa privacy
        </Link>
        .
      </p>
    </div>
  );
}

function AvvisoDemo() {
  return (
    <SchermataInizio immagine="pensa" titolo="Chiedi a Bleo">
      <div role="status" className="mt-8 w-full rounded-[1.75rem] border border-border bg-card p-5 text-center shadow-sm">
        <h2 className="text-lg font-bold">La chat non è ancora attiva</h2>
        <p className="mt-2 text-muted">
          Questa è una versione di prova: mancano le chiavi di configurazione (Supabase e Claude), quindi la chat non
          può rispondere. Nel frattempo puoi seguire i passi del tuo percorso.
        </p>
        <Link
          href="/percorso"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-foreground px-5 font-semibold text-background hover:opacity-85"
        >
          Vai al tuo percorso
        </Link>
      </div>
    </SchermataInizio>
  );
}

function InvitoAccesso({ domanda }: { domanda: string }) {
  const accedi = (d: string) => `/accedi?next=${encodeURIComponent(d ? `/chat?domanda=${encodeURIComponent(d)}` : "/chat")}`;
  return (
    <SchermataInizio immagine="coppia" titolo="Cosa vuoi sapere?">
      <div className="mt-8 w-full rounded-[1.75rem] border border-border bg-card p-5 text-center shadow-sm">
        <h2 className="text-lg font-bold">Accedi per fare le tue domande</h2>
        <p className="mt-2 text-muted">
          Durante la prova hai {DOMANDE_GRATIS_AL_MESE} domande al mese, e le tue chat restano salvate nel tuo
          account. Niente password: ricevi un link via email.
        </p>
        <Link
          href={accedi(domanda)}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-foreground px-5 font-semibold text-background hover:opacity-85"
        >
          Accedi e chiedi
        </Link>
      </div>
      <section aria-labelledby="titolo-esempi" className="mt-6 w-full">
        <h2 id="titolo-esempi" className="mb-2 text-center text-sm font-semibold text-muted">
          Per esempio puoi chiedere
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {DOMANDE_ESEMPIO.map((esempio) => (
            <li key={esempio} className="flex">
              <Link
                href={accedi(esempio)}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-snug text-muted transition-colors hover:border-brand hover:text-foreground"
              >
                {esempio}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SchermataInizio>
  );
}
