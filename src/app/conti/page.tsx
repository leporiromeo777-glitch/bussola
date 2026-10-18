import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { FonteLink, classeLink } from "@/components/strumenti/ui";
import { fonti, regolePercorso } from "@/data/svizzera";
import { oggiZurigo } from "@/lib/conti/importi";
import { LETTURE_AL_GIORNO } from "@/lib/conti/limiti";
import { supabaseConfigured } from "@/lib/supabase/env";
import { getUser } from "@/lib/supabase/server";
import { Conti } from "./conti";

export const metadata: Metadata = {
  title: "I tuoi conti",
  description:
    "Entrate, uscite e fatture della tua ditta individuale in ordine: fotografa le ricevute o inoltrale per email, Bleo le legge e tu confermi.",
};

export default async function PaginaConti() {
  // Al momento della richiesta: dipende dall'utente collegato e dalle variabili d'ambiente.
  await connection();
  const attivo = supabaseConfigured();
  const user = attivo ? await getUser() : null;
  const oggi = oggiZurigo();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="flex items-center gap-4">
        <ImmagineMascotte nome="scrivania" priority sizes="96px" className="h-auto w-20 shrink-0 sm:w-24" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand">I tuoi conti</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
            Entrate, uscite e fatture in ordine
          </h1>
        </div>
      </header>
      <p className="mt-4 text-muted">
        Fotografa le ricevute o inoltrale per email: Bleo le legge e te le prepara. Tu controlli e confermi, una per
        una. Così a fine anno hai tutto pronto per il fiduciario.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/documenti" className={`${classeLink} font-medium`}>
          Cassetto dei documenti
        </Link>
        : decisione della cassa AVS, numero IVA, polizze e permesso in un posto solo, con le scadenze.
      </p>

      {!attivo ? <NonAncoraAttivo /> : user ? <Conti oggi={oggi} /> : <Presentazione />}

      <NotaConti />
    </div>
  );
}

function NonAncoraAttivo() {
  return (
    <section role="status" className="mt-8 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">«I tuoi conti» non è ancora attivo</h2>
      <p className="mt-2 text-muted">
        Questa è una versione di prova senza account: i conti non si possono ancora salvare. Nel frattempo puoi
        preparare le fatture con lo strumento fattura, che le tiene nel tuo browser.
      </p>
      <Link href="/strumenti/fattura" className={`${classeLink} mt-4 inline-block font-medium`}>
        Vai allo strumento fattura
      </Link>
    </section>
  );
}

function Presentazione() {
  const passi = [
    {
      titolo: "Fotografa o inoltra",
      testo: "Scatta una foto allo scontrino, carica il PDF o inoltra l'email della fattura al tuo indirizzo personale.",
    },
    {
      titolo: "Bleo legge",
      testo: "Trova data, importo, negozio e categoria. Quello che legge resta «da confermare»: non conta finché non dici sì.",
    },
    {
      titolo: "Tu confermi",
      testo: "Con un tocco: «Sì, è della ditta» oppure «No, è privato». Vedi entrate, uscite e fatture da incassare.",
    },
    {
      titolo: "Scarichi per il fiduciario",
      testo: "A fine anno scarichi tutto in un file che si apre con Excel.",
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
        Serve un account, così i conti restano tuoi e li ritrovi anche sul telefono. Bleo legge al massimo{" "}
        {LETTURE_AL_GIORNO} ricevute al giorno per persona.
      </p>
      <Link
        href="/accedi?next=/conti"
        className="mt-5 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 font-medium text-background shadow-sm hover:bg-brand-strong"
      >
        Accedi e inizia
      </Link>
    </section>
  );
}

function NotaConti() {
  const anni = regolePercorso.conservazioneDocumentiAnni;
  return (
    <div className="mt-12 space-y-2 border-t border-border pt-6 text-sm text-muted">
      <p>
        Bleo ti aiuta a tenere in ordine i tuoi conti, ma i conti li tieni tu: Bleo non fa la contabilità né la
        dichiarazione d&apos;imposta per te. Per le domande fiscali rivolgiti a un fiduciario autorizzato (
        <FonteLink fonte={fonti.albofiduciari} />
        ).
      </p>
      <p>
        I documenti della contabilità (ricevute, fatture, estratti) vanno conservati per {anni.valore} anni (
        <FonteLink fonte={anni.fonte} />
        ). Bleo non li conserva per te così a lungo: se elimini l&apos;account cancelliamo tutto, quindi scarica
        prima i conti e tieni una copia delle ricevute. Dettagli nell&apos;
        <Link href="/privacy#conti" className={classeLink}>
          informativa sulla privacy
        </Link>
        .
      </p>
    </div>
  );
}
