"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BarraProgresso } from "@/components/percorso/barra-progresso";
import { ElencoAvvisi } from "@/components/percorso/elenco-avvisi";
import { IconaRicomincia, IconaStampa } from "@/components/percorso/icone";
import { NotaInformazione } from "@/components/percorso/nota-informazione";
import { RiquadroScadenze } from "@/components/percorso/riquadro-scadenze";
import { SchedaPasso } from "@/components/percorso/scheda-passo";
import { classeLink, classePulsantePrincipale, classePulsanteSecondario } from "@/components/percorso/stili";
import { useIdratato, usePassiFattiLocali, useRisposteLocali } from "@/components/percorso/usa-archivio";
import { FASI, TITOLI_FASI, VERIFICATO_IL, type IdPasso } from "@/data/passi";
import { dataSvizzera } from "@/data/svizzera";
import {
  analizzaPassiFatti,
  cambiaPasso,
  CHIAVE_PASSI_FATTI,
  leggiGrezzo,
  salvaPassiFattiLocali,
  salvaRisposteLocali,
} from "@/lib/percorso/archivio";
import { DOMANDE, etichettaRisposta } from "@/lib/percorso/domande";
import { avanzamento, calcolaPercorso, prossimoPasso } from "@/lib/percorso/regole";
import type { Risposte } from "@/lib/percorso/risposte";
import { messaggioErrore, type EsitoSalvataggio } from "@/lib/percorso/salvataggio";
import { scegliRisposte, type DatiAccount } from "@/lib/percorso/sincronizza";
import { salvaRisposte } from "../questionario/azioni";
import { segnaPasso, sincronizzaPassi } from "./azioni";

export function Percorso({
  account,
  accessoDisponibile,
  annoScadenze,
}: {
  account: DatiAccount;
  accessoDisponibile: boolean;
  annoScadenze: number;
}) {
  const idratato = useIdratato();
  const locali = useRisposteLocali();
  const passiLocali = usePassiFattiLocali();
  const scelta = scegliRisposte(account, locali);
  const risposte = scelta.risposte;

  // Collegato: i passi fatti dell'account (aggiornati subito, poi salvati). Senza accesso: quelli del browser,
  // con una copia in memoria se il browser non salva.
  const [fattiAccount, setFattiAccount] = useState<IdPasso[]>(account.passiFatti);
  const [fattiInMemoria, setFattiInMemoria] = useState<IdPasso[] | null>(null);
  const fatti = useMemo(() => {
    if (!account.collegato) return fattiInMemoria ?? passiLocali;
    // Finché il percorso del browser non è nell'account, mostra anche i passi fatti nel browser.
    return scelta.daCaricare ? [...new Set([...fattiAccount, ...passiLocali])] : fattiAccount;
  }, [account.collegato, fattiAccount, fattiInMemoria, passiLocali, scelta.daCaricare]);
  const insiemeFatti = useMemo(() => new Set<string>(fatti), [fatti]);

  const [annuncio, setAnnuncio] = useState("");
  const [avvisoSalvataggio, setAvvisoSalvataggio] = useState<string | null>(null);
  const sincronizzato = useRef(false);

  // Dopo l'accesso: copia nell'account il percorso fatto nel browser, oppure copia l'account nel browser.
  useEffect(() => {
    if (!account.collegato || !idratato || sincronizzato.current) return;
    if (scelta.daCaricare && locali) {
      sincronizzato.current = true;
      const daCopiare = passiLocali;
      void (async () => {
        try {
          const esito = await salvaRisposte(locali.risposte);
          const esitoPassi = esito.ok ? await sincronizzaPassi(daCopiare) : esito;
          if (esito.ok && esitoPassi.ok) {
            setFattiAccount((attuali) => [...new Set([...attuali, ...daCopiare])]);
            setAnnuncio("Ho salvato il percorso nel tuo account.");
          } else {
            setAvvisoSalvataggio(messaggioErrore(esitoPassi.ok ? esito : esitoPassi));
          }
        } catch {
          setAvvisoSalvataggio(messaggioErrore({ ok: false, motivo: "errore" }));
        }
      })();
    } else if (scelta.origine === "account" && scelta.risposte) {
      sincronizzato.current = true;
      salvaRisposteLocali(scelta.risposte, account.aggiornatoIl ?? undefined);
      salvaPassiFattiLocali(account.passiFatti);
    }
  }, [account, idratato, locali, passiLocali, scelta.daCaricare, scelta.origine, scelta.risposte]);

  const percorso = useMemo(() => (risposte ? calcolaPercorso(risposte) : null), [risposte]);

  if (!risposte || !percorso) {
    return idratato || account.collegato ? <SenzaRisposte /> : <Caricamento />;
  }

  function cambia(id: IdPasso, titolo: string, fatto: boolean) {
    const nuovi = cambiaPasso(fatti, id, fatto);
    const salvatoNelBrowser = salvaPassiFattiLocali(nuovi);
    setAnnuncio(fatto ? `«${titolo}»: fatto.` : `«${titolo}»: di nuovo da fare.`);
    if (!account.collegato) {
      setFattiInMemoria(salvatoNelBrowser ? null : nuovi);
      if (!salvatoNelBrowser) {
        setAvvisoSalvataggio(
          "Il browser non permette di salvare i dati (per esempio in navigazione privata): i passi fatti restano finché la pagina è aperta.",
        );
      }
      return;
    }
    setFattiAccount(nuovi);
    // Se l'account non salva, la casella torna com'era (anche nel browser), così mostra lo stato vero.
    const annulla = (esito: EsitoSalvataggio) => {
      setFattiAccount((attuali) => cambiaPasso(attuali, id, !fatto));
      salvaPassiFattiLocali(cambiaPasso(analizzaPassiFatti(leggiGrezzo(CHIAVE_PASSI_FATTI)), id, !fatto));
      setAvvisoSalvataggio(
        !esito.ok && esito.motivo === "non_collegato"
          ? "La sessione è scaduta: accedi di nuovo per salvare i passi fatti."
          : `Non sono riuscito a salvare «${titolo}» nel tuo account: riprova tra poco.`,
      );
    };
    void segnaPasso(id, fatto)
      .then((esito) => {
        if (!esito.ok) annulla(esito);
      })
      .catch(() => annulla({ ok: false, motivo: "errore" }));
  }

  const { fatti: numeroFatti, totale } = avanzamento(percorso, insiemeFatti);
  const prossimo = prossimoPasso(percorso, insiemeFatti);
  const pertinenti = percorso.passi.filter((p) => p.stato !== "non_serve");
  const nonServono = percorso.passi.filter((p) => p.stato === "non_serve");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-brand">Il tuo percorso</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {risposte.soci === "con_soci"
            ? "I passi per partire con i tuoi soci"
            : "Dalla tua idea alla ditta individuale aperta"}
        </h1>
        <p className="mt-3 text-muted">
          I passi qui sotto sono in ordine. Spunta quelli fatti:{" "}
          {account.collegato ? "li salviamo nel tuo account." : "restano in questo browser."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 print:hidden">
          <Link href="/questionario" className={`${classePulsanteSecondario} text-sm`}>
            <IconaRicomincia className="size-4" />
            Rifai il questionario
          </Link>
          <button type="button" onClick={() => window.print()} className={`${classePulsanteSecondario} text-sm`}>
            <IconaStampa className="size-4" />
            Stampa
          </button>
        </div>
      </header>

      <div className="mt-6 max-w-3xl space-y-4">
        <NotaInformazione />
        <RiepilogoRisposte risposte={risposte} />
      </div>

      <div className="mt-6 max-w-3xl rounded-xl border border-border bg-card p-4 sm:p-5">
        <BarraProgresso
          valore={numeroFatti}
          massimo={totale}
          etichetta="Passi da fare completati"
          testo={`${numeroFatti} di ${totale}`}
        />
        <p className="mt-3 text-sm">
          {prossimo ? (
            <>
              Prossimo passo:{" "}
              <a href={`#passo-${prossimo.passo.id}`} className={classeLink}>
                {prossimo.passo.titolo}
              </a>
            </>
          ) : (
            "Hai completato tutti i passi da fare. Restano le scadenze di ogni anno."
          )}
        </p>
      </div>

      {!account.collegato && accessoDisponibile ? (
        <p className="mt-4 max-w-3xl text-sm text-muted print:hidden">
          Il percorso è salvato solo in questo browser.{" "}
          <Link href="/accedi?next=/percorso" className={classeLink}>
            Accedi per ritrovarlo su tutti i tuoi dispositivi
          </Link>
          .
        </p>
      ) : null}

      {avvisoSalvataggio ? (
        <p role="alert" className="mt-4 max-w-3xl rounded-lg border border-border bg-card p-3 text-sm text-danger">
          {avvisoSalvataggio}
        </p>
      ) : null}
      <p role="status" aria-live="polite" className="sr-only">
        {annuncio}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] print:block">
        <div className="space-y-10">
          <ElencoAvvisi avvisi={percorso.avvisi} verificatoIl={VERIFICATO_IL} />

          {FASI.map((fase) => {
            const passi = pertinenti.filter((p) => p.passo.fase === fase);
            if (passi.length === 0) return null;
            const idTitolo = `fase-${FASI.indexOf(fase)}`;
            return (
              <section key={fase} aria-labelledby={idTitolo}>
                <h2 id={idTitolo} className="text-xl font-semibold tracking-tight">
                  {TITOLI_FASI[fase]}
                </h2>
                <ol className="mt-4 space-y-3">
                  {passi.map((voce) => (
                    <SchedaPasso
                      key={voce.passo.id}
                      voce={voce}
                      fatto={insiemeFatti.has(voce.passo.id)}
                      prossimo={prossimo?.passo.id === voce.passo.id}
                      onCambia={(fatto) => cambia(voce.passo.id as IdPasso, voce.passo.titolo, fatto)}
                    />
                  ))}
                </ol>
              </section>
            );
          })}

          {nonServono.length > 0 ? (
            <details className="rounded-xl border border-border bg-card p-4 print:hidden">
              <summary className="cursor-pointer font-medium">
                Passi che per ora non ti riguardano ({nonServono.length})
              </summary>
              <ul className="mt-3 space-y-3">
                {nonServono.map((voce) => (
                  <li key={voce.passo.id} className="text-sm">
                    <p className="font-medium">{voce.passo.titolo}</p>
                    <p className="text-muted">{voce.perche}</p>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>

        <aside className="space-y-6 print:mt-10 lg:sticky lg:top-6 lg:self-start" aria-label="Scadenze e aiuto">
          <RiquadroScadenze scadenze={percorso.scadenze} anno={annoScadenze} verificatoIl={VERIFICATO_IL} />
          <section aria-labelledby="titolo-aiuto" className="rounded-xl border border-border bg-card p-5 print:hidden">
            <h2 id="titolo-aiuto" className="text-lg font-semibold">
              Hai un dubbio?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Chiedi a Bussola: risponde solo con le fonti ufficiali. Per il tuo caso personale, rivolgiti
              all&apos;ufficio competente o a un fiduciario autorizzato.
            </p>
            <Link href="/chat" className={`${classePulsantePrincipale} mt-4 w-full text-sm`}>
              Chiedi a Bussola
            </Link>
          </section>
        </aside>
      </div>

      <p className="mt-10 max-w-3xl text-xs text-muted">
        Regole del percorso aggiornate il {dataSvizzera(VERIFICATO_IL)} (versione {percorso.versioneRegole}). Le fonti
        ufficiali vengono ricontrollate ogni mese.
      </p>
    </div>
  );
}

function RiepilogoRisposte({ risposte }: { risposte: Risposte }) {
  return (
    <details className="rounded-xl border border-border bg-card p-4 text-sm print:block">
      <summary className="cursor-pointer font-medium print:list-none">Le tue risposte</summary>
      <dl className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
        {DOMANDE.map((d) => (
          <div key={d.id} className="contents">
            <dt className="text-muted">{d.breve}</dt>
            <dd>
              {etichettaRisposta(d.id, risposte[d.id])}
              {d.id === "attivita" && risposte.attivitaAltro ? `: ${risposte.attivitaAltro}` : ""}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function Caricamento() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16" aria-busy="true">
      <p role="status" className="text-muted motion-safe:animate-pulse">
        Sto caricando il tuo percorso…
      </p>
    </div>
  );
}

function SenzaRisposte() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:py-24">
      <p className="text-sm font-semibold text-brand">Il tuo percorso</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        Prima rispondi a 10 domande
      </h1>
      <p className="mt-4 text-lg text-muted">
        In circa 5 minuti costruiamo i tuoi passi per aprire la ditta individuale, nell&apos;ordine giusto e con i link
        ufficiali.
      </p>
      <Link href="/questionario" className={`${classePulsantePrincipale} mt-8`}>
        Inizia il questionario
      </Link>
    </div>
  );
}
