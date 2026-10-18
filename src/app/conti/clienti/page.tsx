import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { FonteLink, classeLink } from "@/components/strumenti/ui";
import { dataSvizzera, datiStrumenti, fonti } from "@/data/svizzera";
import { oggiZurigo } from "@/lib/conti/importi";
import { supabaseConfigured } from "@/lib/supabase/env";
import { getUser } from "@/lib/supabase/server";
import { ClientiEOre } from "./clienti-ore";

export const metadata: Metadata = {
  title: "Clienti e ore",
  description:
    "Tieni l'elenco dei tuoi clienti e le ore che lavori per ognuno. A fine mese Bleo ti prepara la fattura con il codice QR.",
};

export default async function PaginaClientiOre() {
  // Al momento della richiesta: dipende dall'utente collegato e dalle variabili d'ambiente.
  await connection();
  const attivo = supabaseConfigured();
  const user = attivo ? await getUser() : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <p className="text-sm">
        <Link href="/conti" className={classeLink}>
          ‹ I tuoi conti
        </Link>
      </p>
      <header className="mt-3 flex items-center gap-4">
        <ImmagineMascotte nome="checklist" priority sizes="96px" className="h-auto w-20 shrink-0 sm:w-24" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand">I tuoi conti</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">Clienti e ore</h1>
        </div>
      </header>
      <p className="mt-4 text-muted">
        Segna le ore che lavori per ogni cliente. A fine mese apri la fattura già pronta, con l&apos;indirizzo del
        cliente e le ore: tu controlli e la mandi.
      </p>

      {!attivo ? <NonAncoraAttivo /> : user ? <ClientiEOre oggi={oggiZurigo()} /> : <Presentazione />}

      <Nota />
    </div>
  );
}

function NonAncoraAttivo() {
  return (
    <section role="status" className="mt-8 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">«Clienti e ore» non è ancora attivo</h2>
      <p className="mt-2 text-muted">
        Questa è una versione di prova senza account: clienti e ore non si possono ancora salvare. Intanto puoi
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
    { titolo: "Aggiungi i clienti", testo: "Nome e indirizzo, come servono nella QR-fattura. Se vuoi, anche la tariffa oraria." },
    { titolo: "Segna le ore", testo: "Giorno, quanto hai lavorato e cosa hai fatto. Dal telefono bastano pochi tocchi." },
    {
      titolo: "Crea la fattura",
      testo: "A fine mese scegli il cliente: la fattura si apre già compilata e le ore restano segnate come fatturate.",
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
      <p className="mt-5 text-sm text-muted">Serve un account, così ritrovi clienti e ore anche sul telefono.</p>
      <Link
        href="/accedi?next=/conti/clienti"
        className="mt-5 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 font-medium text-background shadow-sm hover:bg-brand-strong"
      >
        Accedi e inizia
      </Link>
    </section>
  );
}

function Nota() {
  const indirizzo = datiStrumenti.indirizzoStrutturatoQr;
  return (
    <div className="mt-12 space-y-2 border-t border-border pt-6 text-sm text-muted">
      <p>
        Dal {dataSvizzera(indirizzo.valore)} la QR-fattura accetta solo indirizzi strutturati: per questo via, numero,
        NPA e località del cliente sono campi separati (<FonteLink fonte={indirizzo.fonte} />
        ).
      </p>
      <p>
        Bleo ti aiuta a tenere in ordine ore e fatture, ma non fa la contabilità per te. Per le domande su IVA e imposte
        rivolgiti a un fiduciario autorizzato (<FonteLink fonte={fonti.albofiduciari} />
        ). I dati dei clienti li vedi solo tu: dettagli nell&apos;
        <Link href="/privacy#conti" className={classeLink}>
          informativa sulla privacy
        </Link>
        .
      </p>
    </div>
  );
}
