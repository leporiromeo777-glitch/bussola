"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Guardaroba } from "@/components/mascotte/guardaroba";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { BarraProgresso } from "@/components/percorso/barra-progresso";
import { ElencoAvvisi } from "@/components/percorso/elenco-avvisi";
import { IconaRicomincia, IconaStampa } from "@/components/percorso/icone";
import { FasiPercorso } from "@/components/percorso/fasi-percorso";
import { NotaInformazione } from "@/components/percorso/nota-informazione";
import { ProssimoPasso, type UltimoFatto } from "@/components/percorso/prossimo-passo";
import { RiquadroScadenze } from "@/components/percorso/riquadro-scadenze";
import { RiquadroSettimana } from "@/components/percorso/riquadro-settimana";
import { RiquadroVotazioni } from "@/components/percorso/riquadro-votazioni";
import { SchedaPasso } from "@/components/percorso/scheda-passo";
import { classeLink, classePulsantePrincipale, classePulsanteSecondario } from "@/components/percorso/stili";
import {
  useIdratato,
  usePassiFattiLocali,
  useProprietarioLocale,
  useRisposteLocali,
} from "@/components/percorso/usa-archivio";
import { FASI, TITOLI_FASI, VERIFICATO_IL, type IdPasso } from "@/data/passi";
import { dataSvizzera } from "@/data/svizzera";
import {
  analizzaPassiFatti,
  cambiaPasso,
  CHIAVE_PASSI_FATTI,
  dimenticaPercorsoLocale,
  impostaProprietario,
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

/** Copia nel browser i dati dell'account (o svuota il browser se l'account non ha ancora un percorso). */
function copiaAccountNelBrowser(account: DatiAccount) {
  if (!account.risposte) {
    dimenticaPercorsoLocale();
    return;
  }
  salvaRisposteLocali(account.risposte, account.aggiornatoIl ?? undefined);
  salvaPassiFattiLocali(account.passiFatti);
  impostaProprietario(account.userId);
}

/** Salva nell'account le risposte e i passi fatti nel browser. */
async function salvaNellAccount(risposte: Risposte, passi: IdPasso[]): Promise<EsitoSalvataggio> {
  try {
    const esito = await salvaRisposte(risposte);
    return esito.ok ? await sincronizzaPassi(passi) : esito;
  } catch {
    return { ok: false, motivo: "errore" };
  }
}

type StatoCaricamento = "in_corso" | "fatto" | "rifiutato" | null;

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
  const proprietario = useProprietarioLocale();
  const scelta = scegliRisposte(account, locali, proprietario);
  const risposte = scelta.risposte;

  // Dati del browser creati senza accesso: finché l'utente non dice "Salva" restano solo nel browser,
  // anche da collegati (potrebbero essere di un'altra persona, o l'account potrebbe non essere il suo).
  const [caricamento, setCaricamento] = useState<StatoCaricamento>(null);
  const inAttesaDelSi = account.collegato && scelta.daConfermare && caricamento !== "fatto";
  const conAccount = account.collegato && !inAttesaDelSi;

  // Con l'account: i passi fatti dell'account (aggiornati subito, poi salvati). Senza: quelli del browser,
  // con una copia in memoria se il browser non salva.
  const [fattiAccount, setFattiAccount] = useState<IdPasso[]>(account.passiFatti);
  const [fattiInMemoria, setFattiInMemoria] = useState<IdPasso[] | null>(null);
  const fatti = useMemo(() => {
    if (!conAccount) return fattiInMemoria ?? passiLocali;
    // Finché il percorso del browser non è nell'account, mostra anche i passi fatti nel browser.
    return scelta.daCaricare ? [...new Set([...fattiAccount, ...passiLocali])] : fattiAccount;
  }, [conAccount, fattiAccount, fattiInMemoria, passiLocali, scelta.daCaricare]);
  const insiemeFatti = useMemo(() => new Set<string>(fatti), [fatti]);

  const [annuncio, setAnnuncio] = useState("");
  const [ultimoFatto, setUltimoFatto] = useState<UltimoFatto>(null);
  const [avvisoSalvataggio, setAvvisoSalvataggio] = useState<string | null>(null);
  const sincronizzato = useRef(false);

  /** Copia nell'account il percorso del browser. `manuale`: dopo il "Salva" dell'utente, che può riprovare. */
  function caricaNellAccount(manuale: boolean) {
    if (!locali || sincronizzato.current) return;
    sincronizzato.current = true;
    const daCopiare = passiLocali;
    setCaricamento("in_corso");
    setAvvisoSalvataggio(null);
    void salvaNellAccount(locali.risposte, daCopiare).then((esito) => {
      if (esito.ok) {
        impostaProprietario(account.userId);
        setFattiAccount((attuali) => [...new Set([...attuali, ...daCopiare])]);
        setCaricamento("fatto");
        setAnnuncio("Ho salvato il percorso nel tuo account.");
      } else {
        if (manuale) sincronizzato.current = false;
        setCaricamento(null);
        setAvvisoSalvataggio(messaggioErrore(esito));
      }
    });
  }
  const caricaDaSolo = useEffectEvent(() => caricaNellAccount(false));

  // Dopo l'accesso: allinea browser e account.
  useEffect(() => {
    if (!account.collegato || !idratato || sincronizzato.current) return;
    if (scelta.datiDiAltri) {
      // Nel browser c'è la copia di un altro account: non si carica, si sostituisce con questo.
      sincronizzato.current = true;
      copiaAccountNelBrowser(account);
    } else if (scelta.daCaricare && locali) {
      // Dati di questo account modificati nel browser: si caricano da soli. Dati senza proprietario: si aspetta il sì.
      if (!scelta.daConfermare) caricaDaSolo();
    } else if (scelta.origine === "account" && scelta.risposte) {
      sincronizzato.current = true;
      copiaAccountNelBrowser(account);
    }
  }, [
    account,
    idratato,
    locali,
    scelta.daCaricare,
    scelta.daConfermare,
    scelta.datiDiAltri,
    scelta.origine,
    scelta.risposte,
  ]);

  const percorso = useMemo(() => (risposte ? calcolaPercorso(risposte) : null), [risposte]);

  if (!risposte || !percorso) {
    return idratato || account.collegato ? <SenzaRisposte /> : <Caricamento />;
  }

  function cambia(id: IdPasso, titolo: string, fatto: boolean) {
    const nuovi = cambiaPasso(fatti, id, fatto);
    const salvatoNelBrowser = salvaPassiFattiLocali(nuovi);
    setAnnuncio(fatto ? `«${titolo}»: fatto.` : `«${titolo}»: di nuovo da fare.`);
    if (!conAccount) {
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
  const daFare = percorso.passi.filter((p) => p.stato === "da_fare");
  const numeroProssimo = prossimo ? daFare.findIndex((p) => p.passo.id === prossimo.passo.id) + 1 : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <ImmagineMascotte nome="coppia" priority sizes="96px" className="h-auto w-20 shrink-0 print:hidden sm:w-24" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand">Il tuo percorso</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              {risposte.soci === "con_soci"
                ? "I passi per partire con i tuoi soci"
                : "Dalla tua idea alla ditta individuale aperta"}
            </h1>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
          <Link href="/questionario" className={`${classePulsanteSecondario} px-4 py-2 text-sm`}>
            <IconaRicomincia className="size-4" />
            Rifai il questionario
          </Link>
          <button type="button" onClick={() => window.print()} className={`${classePulsanteSecondario} px-4 py-2 text-sm`}>
            <IconaStampa className="size-4" />
            Stampa
          </button>
        </div>
      </header>

      <div className="mt-6">
        <BarraProgresso
          valore={numeroFatti}
          massimo={totale}
          etichetta="Passi fatti"
          testo={`${numeroFatti} di ${totale}`}
        />
        <p className="mt-2 text-sm text-muted">
          {conAccount ? "Salviamo i passi fatti nel tuo account." : "I passi fatti restano in questo browser."}
          {!account.collegato && accessoDisponibile ? (
            <>
              {" "}
              <Link href="/accedi?next=/percorso" className={`${classeLink} print:hidden`}>
                Accedi per ritrovarli su tutti i tuoi dispositivi
              </Link>
              .
            </>
          ) : null}
        </p>
      </div>

      {inAttesaDelSi ? (
        <ConfermaSalvataggio
          email={account.email}
          sostituisce={account.risposte !== null}
          stato={caricamento}
          onSalva={() => caricaNellAccount(true)}
          onRifiuta={() => setCaricamento("rifiutato")}
        />
      ) : null}
      {caricamento === "fatto" ? (
        <p className="mt-6 max-w-3xl rounded-lg border border-border bg-card p-3 text-sm print:hidden">
          Fatto: il percorso è salvato nel tuo account{account.email ? ` ${account.email}` : ""}.
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

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] print:block">
        <div className="space-y-10">
          <ProssimoPasso
            voce={prossimo}
            numero={numeroProssimo}
            totale={totale}
            ultimoFatto={ultimoFatto}
            onFatto={() => {
              if (!prossimo) return;
              cambia(prossimo.passo.id as IdPasso, prossimo.passo.titolo, true);
              setUltimoFatto({ id: prossimo.passo.id, titolo: prossimo.passo.titolo });
            }}
            onAnnulla={() => {
              if (!ultimoFatto) return;
              cambia(ultimoFatto.id as IdPasso, ultimoFatto.titolo, false);
              setUltimoFatto(null);
            }}
          />
          <NotaInformazione compatta />

          <div className="space-y-4">
            <h2 className="text-xl font-extrabold tracking-tight">Tutti i tuoi passi</h2>
            <FasiPercorso passi={pertinenti} fatti={insiemeFatti} faseAttuale={prossimo?.passo.fase} />
          </div>

          <ElencoAvvisi avvisi={percorso.avvisi} verificatoIl={VERIFICATO_IL} />

          {FASI.map((fase) => {
            const passi = pertinenti.filter((p) => p.passo.fase === fase);
            if (passi.length === 0) return null;
            const idTitolo = `fase-${FASI.indexOf(fase)}`;
            // Come nelle fasi in alto: contano solo i passi da fare, non i facoltativi.
            const daFareFase = passi.filter((p) => p.stato === "da_fare");
            const fattiFase = daFareFase.filter((p) => insiemeFatti.has(p.passo.id)).length;
            return (
              <section key={fase} aria-labelledby={idTitolo} className="scroll-mt-24">
                <h2
                  id={idTitolo}
                  className="flex scroll-mt-24 items-baseline justify-between gap-3 text-xl font-extrabold tracking-tight break-after-avoid"
                >
                  {TITOLI_FASI[fase]}
                  {daFareFase.length > 0 ? (
                    <span className="text-sm font-medium text-muted">
                      {fattiFase} di {daFareFase.length} fatti
                    </span>
                  ) : null}
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
            <details className="rounded-2xl border border-border bg-card p-4 print:hidden">
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

          <RiepilogoRisposte risposte={risposte} />
        </div>

        <aside className="space-y-6 print:mt-10 lg:sticky lg:top-24 lg:self-start" aria-label="Scadenze, votazioni e aiuto">
          <RiquadroSettimana percorso={percorso} fatti={insiemeFatti} />
          <RiquadroScadenze scadenze={percorso.scadenze} anno={annoScadenze} verificatoIl={VERIFICATO_IL} />
          <RiquadroVotazioni />
          <section aria-labelledby="titolo-aiuto" className="rounded-2xl border border-border bg-card p-5 print:hidden">
            <h2 id="titolo-aiuto" className="text-lg font-bold">
              Hai un dubbio?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Chiedi a Bleo: risponde solo con le fonti ufficiali. Per il tuo caso personale, rivolgiti
              all&apos;ufficio competente o a un fiduciario autorizzato.
            </p>
            <Link href="/chat" className={`${classePulsantePrincipale} mt-4 w-full text-sm`}>
              Chiedi a Bleo
            </Link>
          </section>
          <details className="group rounded-2xl border border-border bg-card print:hidden">
            <summary className="cursor-pointer list-none p-5 font-bold [&::-webkit-details-marker]:hidden">
              Vesti Bleo <span className="font-normal text-muted">(scegli il look)</span>
            </summary>
            <div className="px-2 pb-2">
              <Guardaroba />
            </div>
          </details>
        </aside>
      </div>

      <p className="mt-10 max-w-3xl text-xs text-muted">
        Regole del percorso aggiornate il {dataSvizzera(VERIFICATO_IL)} (versione {percorso.versioneRegole}). Le fonti
        ufficiali vengono ricontrollate ogni mese.
      </p>
    </div>
  );
}

/** Chiede prima di salvare nell'account le risposte create in questo browser senza accesso. */
function ConfermaSalvataggio({
  email,
  sostituisce,
  stato,
  onSalva,
  onRifiuta,
}: {
  email: string | null;
  sostituisce: boolean;
  stato: StatoCaricamento;
  onSalva: () => void;
  onRifiuta: () => void;
}) {
  const inCorso = stato === "in_corso";
  if (stato === "rifiutato") {
    return (
      <p className="mt-6 max-w-3xl rounded-lg border border-border bg-card p-3 text-sm print:hidden">
        Il percorso resta solo in questo browser: non l&apos;ho salvato nel tuo account
        {email ? ` ${email}` : ""}.{" "}
        <button type="button" onClick={onSalva} className={classeLink}>
          Salvalo nell&apos;account
        </button>
      </p>
    );
  }
  return (
    <section
      aria-labelledby="titolo-conferma-account"
      className="mt-6 max-w-3xl rounded-xl border-2 border-brand bg-card p-5 print:hidden"
    >
      <h2 id="titolo-conferma-account" className="text-lg font-semibold text-balance">
        Vuoi salvare nel tuo account {email ? <strong className="break-all">{email}</strong> : null} le risposte di
        questo browser?
      </h2>
      <p className="mt-2 text-sm">
        Hai risposto al questionario in questo browser senza accedere. Se le salvi, ritrovi il percorso e i passi fatti
        su tutti i tuoi dispositivi.
        {sostituisce ? " Le risposte salvate prima nell'account verranno sostituite." : ""}
      </p>
      <p className="mt-2 text-sm text-muted">
        Se non riconosci questo indirizzo email, scegli «No» ed{" "}
        <Link href="/account" className={classeLink}>
          esci dall&apos;account
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onSalva} disabled={inCorso} className={`${classePulsantePrincipale} text-sm`}>
          {inCorso ? "Sto salvando…" : "Salva"}
        </button>
        <button type="button" onClick={onRifiuta} disabled={inCorso} className={`${classePulsanteSecondario} text-sm`}>
          No
        </button>
      </div>
    </section>
  );
}

function RiepilogoRisposte({ risposte }: { risposte: Risposte }) {
  const elenco = (classe: string) => (
    <dl className={classe}>
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
  );
  return (
    <>
      <details className="rounded-xl border border-border bg-card p-4 text-sm print:hidden">
        <summary className="cursor-pointer font-medium">Le tue risposte</summary>
        {elenco("mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]")}
      </details>
      {/* Un <details> chiuso non stampa il contenuto: sulla carta le risposte ci sono sempre. */}
      <section className="hidden rounded-xl border border-border p-4 text-sm break-inside-avoid print:block">
        <h2 className="font-medium">Le tue risposte</h2>
        {elenco("mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1")}
      </section>
    </>
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
      <ImmagineMascotte nome="checklist" priority sizes="160px" className="mb-6 h-auto w-36" />
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
