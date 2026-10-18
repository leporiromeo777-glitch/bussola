import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { FonteLink, classeLink } from "@/components/strumenti/ui";
import { fonti } from "@/data/svizzera";
import { DOCUMENTI_MASSIMI, GIORNI_AVVISO_DOCUMENTI } from "@/lib/cassetto/limiti";
import { oggiZurigo } from "@/lib/conti/importi";
import { supabaseConfigured } from "@/lib/supabase/env";
import { getUser } from "@/lib/supabase/server";
import { Cassetto } from "./cassetto";

export const metadata: Metadata = {
  title: "Cassetto dei documenti",
  description:
    "I documenti importanti della tua attività in un posto solo: decisione della cassa AVS, numero IVA, polizze, permesso, contratti. Con un promemoria prima che scadano.",
};

export default async function PaginaDocumenti() {
  // Al momento della richiesta: dipende dall'utente collegato e dalle variabili d'ambiente.
  await connection();
  const attivo = supabaseConfigured();
  const user = attivo ? await getUser() : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="flex items-center gap-4">
        <ImmagineMascotte nome="checklist" priority sizes="96px" className="h-auto w-20 shrink-0 sm:w-24" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand">Cassetto dei documenti</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
            I documenti della tua attività, in un posto solo
          </h1>
        </div>
      </header>
      <p className="mt-4 text-muted">
        Decisione della cassa AVS, numero IVA, polizze, permesso, contratti: fotografali o carica il PDF. Se un
        documento scade, scrivi la data: Bleo ti mostra quanto manca e te lo ricorda.
      </p>

      {!attivo ? <NonAncoraAttivo /> : user ? <Cassetto oggi={oggiZurigo()} /> : <Presentazione />}

      <NotaCassetto />
    </div>
  );
}

function NonAncoraAttivo() {
  return (
    <section role="status" className="mt-8 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">Il cassetto dei documenti ha bisogno di un account</h2>
      <p className="mt-2 text-muted">
        Questa è una versione di prova senza account, quindi qui non si possono salvare documenti. Documenti come il
        permesso di soggiorno sono personali: Bleo li tiene solo in un account protetto, mai nel browser.
      </p>
      <Link href="/percorso" className={`${classeLink} mt-4 inline-block font-medium`}>
        Intanto segui il tuo percorso
      </Link>
    </section>
  );
}

function Presentazione() {
  const [primo, secondo] = GIORNI_AVVISO_DOCUMENTI;
  const passi = [
    {
      titolo: "Metti dentro i documenti",
      testo: "Fotografa la decisione della cassa AVS, la polizza o il permesso, oppure carica il PDF che ti hanno mandato.",
    },
    {
      titolo: "Scrivi quando scadono",
      testo: "Vedi subito cosa è scaduto e cosa scade presto, con il numero di giorni che mancano.",
    },
    {
      titolo: "Ricevi un promemoria",
      testo: `Nell'app di Bleo una notifica ${primo} e ${secondo} giorni prima della scadenza. Sul sito scarichi le date nel tuo calendario.`,
    },
  ];
  return (
    <section aria-labelledby="come-funziona" className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 id="come-funziona" className="text-lg font-bold">
        Come funziona
      </h2>
      <ol className="mt-4 space-y-4">
        {passi.map((passo, i) => (
          <li key={passo.titolo} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold">{passo.titolo}</p>
              <p className="text-sm text-muted">{passo.testo}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm text-muted">
        Serve un account: i documenti restano privati, li vedi solo tu e li ritrovi anche sul telefono. Puoi tenere fino
        a {DOCUMENTI_MASSIMI} documenti.
      </p>
      <Link
        href="/accedi?next=/documenti"
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-5 py-2.5 font-medium text-background shadow-sm hover:bg-brand-strong"
      >
        Accedi e inizia
      </Link>
    </section>
  );
}

function NotaCassetto() {
  return (
    <div className="mt-12 space-y-2 border-t border-border pt-6 text-sm text-muted">
      <p>
        Il cassetto è una copia comoda: tieni sempre gli originali. Bleo non controlla i tuoi documenti e non ti dice se
        sono in regola. Per il tuo caso, un fiduciario autorizzato (
        <FonteLink fonte={fonti.albofiduciari} />
        ).
      </p>
      <p>
        I file stanno in un archivio privato e si aprono solo con un link che vale pochi secondi. Se elimini
        l&apos;account cancelliamo anche il cassetto, file compresi. Dettagli nell&apos;
        <Link href="/privacy#cassetto" className={classeLink}>
          informativa sulla privacy
        </Link>
        .
      </p>
    </div>
  );
}
