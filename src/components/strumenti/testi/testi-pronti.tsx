"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { PulsanteDettatura } from "@/components/dettatura";
import { ImmagineMascotte } from "@/components/mascotte/immagine";
import { useRisposteLocali } from "@/components/percorso/usa-archivio";
import { IconaCopia, IconaFreccia, IconaSpunta } from "@/components/strumenti/icone";
import { CampoScelta, CampoTesto, classeLink, classePulsantePrincipale, classePulsanteSecondario, classePulsantePiccolo } from "@/components/strumenti/ui";
import { aggiungiDettato } from "@/lib/dettatura/testo";
import { precompilaDaRisposte } from "@/lib/testi/precompila";
import {
  LUNGHEZZA_MASSIMA_CLIENTI,
  LUNGHEZZA_MASSIMA_DESCRIZIONE,
  LUNGHEZZA_MASSIMA_LUOGO,
  LUNGHEZZA_MASSIMA_NOME,
  LUNGHEZZA_MINIMA_DESCRIZIONE,
  MESSAGGI_TESTI,
  type TestoPronto,
} from "@/lib/testi/richiesta";
import { ETICHETTE_LINGUA, ETICHETTE_TONO, LINGUE, TIPI, TIPI_TESTO, TONI, type Lingua, type TipoTesto, type Tono } from "@/lib/testi/tipi";

type Richiesta = {
  tipo: TipoTesto;
  descrizione: string;
  nome: string;
  luogo: string;
  clienti: string;
  tono: Tono;
  lingua: Lingua;
};

type Risultato = { richiesta: Richiesta; testi: TestoPronto[]; versione: number };

const OPZIONI_LINGUA = LINGUE.map((l) => ({ valore: l, etichetta: ETICHETTE_LINGUA[l] }));

const ESEMPIO_DESCRIZIONE =
  "Per esempio: faccio foto di matrimoni e feste di famiglia, soprattutto all'aperto, con uno stile naturale.";

/** Righe del campo di modifica secondo la lunghezza del testo. */
function righePer(testo: string): number {
  const righe = testo.split("\n").reduce((somma, riga) => somma + Math.max(1, Math.ceil(riga.length / 45)), 0);
  return Math.min(14, Math.max(2, righe));
}

/**
 * «Testi pronti»: scegli il tipo di testo, descrivi la tua attività e Bleo
 * scrive un testo da controllare, modificare e copiare.
 */
export function TestiPronti({ disponibile }: { disponibile: boolean }) {
  const id = useId();
  const salvate = useRisposteLocali();
  const precompilati = precompilaDaRisposte(salvate?.risposte);

  const [tipo, setTipo] = useState<TipoTesto>("social");
  // null = non ancora toccato: vale quello ripreso dal questionario.
  const [descrizioneScritta, setDescrizione] = useState<string | null>(null);
  const [luogoScritto, setLuogo] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [clienti, setClienti] = useState("");
  const [tono, setTono] = useState<Tono>("amichevole");
  const [lingua, setLingua] = useState<Lingua>("it");

  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [risultato, setRisultato] = useState<Risultato | null>(null);
  const [copiato, setCopiato] = useState<{ indice: number; ok: boolean } | null>(null);

  const controllo = useRef<AbortController | null>(null);
  const titoloRisultato = useRef<HTMLHeadingElement>(null);

  const descrizione = descrizioneScritta ?? precompilati.descrizione;
  const luogo = luogoScritto ?? precompilati.luogo;
  const ripresaDalQuestionario = descrizioneScritta === null && precompilati.descrizione !== "";

  useEffect(() => () => controllo.current?.abort(), []);
  // A ogni nuovo testo il fuoco va al risultato (su telefono è sotto il modulo).
  const versione = risultato?.versione;
  useEffect(() => {
    if (versione) titoloRisultato.current?.focus();
  }, [versione]);

  if (!disponibile) return <NonAttivo />;

  async function chiedi(richiesta: Richiesta, rifai: boolean) {
    controllo.current?.abort();
    const questo = new AbortController();
    controllo.current = questo;
    setErrore(null);
    setCopiato(null);
    setInCorso(true);
    try {
      const risposta = await fetch("/api/testi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...richiesta, rifai }),
        signal: questo.signal,
      });
      const corpo = (await risposta.json().catch(() => null)) as { testi?: unknown; messaggio?: unknown } | null;
      const testi = Array.isArray(corpo?.testi)
        ? (corpo.testi as unknown[]).filter(
            (t): t is TestoPronto =>
              !!t && typeof (t as TestoPronto).titolo === "string" && typeof (t as TestoPronto).testo === "string",
          )
        : [];
      if (!risposta.ok || testi.length === 0) {
        setErrore(typeof corpo?.messaggio === "string" ? corpo.messaggio : MESSAGGI_TESTI.nonRiuscito);
        return;
      }
      setRisultato((prima) => ({ richiesta, testi, versione: (prima?.versione ?? 0) + 1 }));
    } catch {
      if (questo.signal.aborted) return;
      setErrore("Non riesco a raggiungere Bleo: controlla la connessione e riprova.");
    } finally {
      if (controllo.current === questo) {
        controllo.current = null;
        setInCorso(false);
      }
    }
  }

  function invia(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const pulita = descrizione.trim();
    if (pulita.length < LUNGHEZZA_MINIMA_DESCRIZIONE) {
      setErrore(pulita ? MESSAGGI_TESTI.descrizioneCorta : MESSAGGI_TESTI.descrizioneMancante);
      return;
    }
    void chiedi({ tipo, descrizione: pulita, nome: nome.trim(), luogo: luogo.trim(), clienti: clienti.trim(), tono, lingua }, false);
  }

  function modifica(indice: number, testo: string) {
    setCopiato(null);
    setRisultato((prima) =>
      prima ? { ...prima, testi: prima.testi.map((t, i) => (i === indice ? { ...t, testo } : t)) } : prima,
    );
  }

  async function copia(indice: number) {
    const testo = risultato?.testi[indice]?.testo ?? "";
    try {
      await navigator.clipboard.writeText(testo);
      setCopiato({ indice, ok: true });
    } catch {
      setCopiato({ indice, ok: false });
    }
  }

  const tipoRisultato = risultato ? TIPI[risultato.richiesta.tipo] : null;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <form onSubmit={invia} noValidate className="grid gap-6">
        <fieldset className="min-w-0">
          <legend className="text-lg font-semibold">1. Che testo ti serve?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {TIPI_TESTO.map((valore) => {
              const definizione = TIPI[valore];
              const scelto = tipo === valore;
              return (
                <label
                  key={valore}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                    scelto ? "border-brand bg-brand-soft" : "border-border bg-card hover:border-brand"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-tipo`}
                    value={valore}
                    checked={scelto}
                    onChange={() => setTipo(valore)}
                    className="mt-1 size-4 shrink-0 accent-[var(--brand)]"
                  />
                  <span>
                    <span className="block font-medium">{definizione.etichetta}</span>
                    <span className="mt-0.5 block text-sm text-muted">{definizione.descrizione}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="grid min-w-0 gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
          <legend className="float-left w-full text-lg font-semibold">2. Parlami della tua attività</legend>
          <div className="clear-left">
            <label htmlFor={`${id}-descrizione`} className="block text-sm font-medium">
              Cosa fai?
            </label>
            <p id={`${id}-descrizione-aiuto`} className="mt-1 text-sm text-muted">
              {ripresaDalQuestionario
                ? "L'ho ripreso dal tuo questionario: aggiungi qualche dettaglio su cosa fai di preciso e come lavori."
                : "Con parole tue, scritte o a voce. Bleo usa solo quello che scrivi qui: niente viene inventato."}
            </p>
            <textarea
              id={`${id}-descrizione`}
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              aria-describedby={`${id}-descrizione-aiuto`}
              rows={4}
              maxLength={LUNGHEZZA_MASSIMA_DESCRIZIONE}
              placeholder={ESEMPIO_DESCRIZIONE}
              className="mt-2 block w-full min-w-0 resize-y rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted/70"
            />
            <div className="mt-2">
              <PulsanteDettatura
                onTesto={(dettato) =>
                  setDescrizione((prima) => aggiungiDettato(prima ?? descrizione, dettato, LUNGHEZZA_MASSIMA_DESCRIZIONE))
                }
                disabilitato={inCorso}
              />
            </div>
          </div>
          <CampoTesto
            id={`${id}-nome`}
            etichetta="Il tuo nome o il nome della ditta (facoltativo)"
            valore={nome}
            onCambia={setNome}
            maxLength={LUNGHEZZA_MASSIMA_NOME}
            autoComplete="organization"
            placeholder="Per esempio: Sara Bernasconi Fotografia"
          />
          <CampoTesto
            id={`${id}-luogo`}
            etichetta="Dove lavori (facoltativo)"
            valore={luogo}
            onCambia={setLuogo}
            maxLength={LUNGHEZZA_MASSIMA_LUOGO}
            placeholder="Per esempio: Lugano e dintorni"
          />
          <CampoTesto
            id={`${id}-clienti`}
            etichetta="Chi sono i tuoi clienti (facoltativo)"
            valore={clienti}
            onCambia={setClienti}
            maxLength={LUNGHEZZA_MASSIMA_CLIENTI}
            placeholder="Per esempio: coppie che si sposano, famiglie"
          />
        </fieldset>

        <fieldset className="grid min-w-0 gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
          <legend className="float-left w-full text-lg font-semibold">3. Come deve suonare?</legend>
          <fieldset className="clear-left min-w-0">
            <legend className="text-sm font-medium">Tono</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {TONI.map((valore) => {
                const scelto = tono === valore;
                return (
                  <label
                    key={valore}
                    className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-colors ${
                      scelto ? "border-brand bg-brand-soft" : "border-border bg-background hover:border-brand"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <input
                        type="radio"
                        name={`${id}-tono`}
                        value={valore}
                        checked={scelto}
                        onChange={() => setTono(valore)}
                        className="size-4 shrink-0 accent-[var(--brand)]"
                      />
                      {ETICHETTE_TONO[valore].etichetta}
                    </span>
                    <span className="mt-1 text-sm text-muted">{ETICHETTE_TONO[valore].descrizione}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <CampoScelta id={`${id}-lingua`} etichetta="Lingua del testo" valore={lingua} onCambia={setLingua} opzioni={OPZIONI_LINGUA} />
        </fieldset>

        {errore ? (
          <p role="alert" className="font-medium text-danger">
            {errore}
          </p>
        ) : null}

        <div>
          <button type="submit" disabled={inCorso} className={`${classePulsantePrincipale} w-full sm:w-auto`}>
            {inCorso ? "Bleo sta scrivendo…" : "Scrivi il testo"}
            <IconaFreccia className="size-4" />
          </button>
          <p className="mt-3 text-xs text-muted">
            Quello che scrivi lo legge l&apos;intelligenza artificiale che usa Bleo (Claude, di Anthropic) solo per
            scrivere il testo: noi non lo salviamo. Non scrivere dati personali come indirizzo, telefono o numero AVS.
          </p>
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {inCorso ? "Bleo sta scrivendo il testo." : ""}
        </p>
      </form>

      <section aria-labelledby={`${id}-risultato`} className="min-w-0 lg:sticky lg:top-6">
        {risultato && tipoRisultato ? (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 id={`${id}-risultato`} ref={titoloRisultato} tabIndex={-1} className="text-xl font-semibold outline-none">
              {tipoRisultato.etichetta}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {ETICHETTE_TONO[risultato.richiesta.tono].etichetta} · {ETICHETTE_LINGUA[risultato.richiesta.lingua]}.
              Puoi modificare il testo qui sotto prima di copiarlo.
            </p>
            <div className="mt-4 grid gap-5">
              {risultato.testi.map((testo, indice) => (
                <div key={`${risultato.versione}-${testo.titolo}`}>
                  <div className="flex items-end justify-between gap-3">
                    <label htmlFor={`${id}-testo-${indice}`} className="font-medium">
                      {testo.titolo}
                    </label>
                    <button type="button" onClick={() => void copia(indice)} className={classePulsantePiccolo}>
                      {copiato?.indice === indice && copiato.ok ? (
                        <IconaSpunta className="size-4 text-brand" />
                      ) : (
                        <IconaCopia className="size-4" />
                      )}
                      {copiato?.indice === indice && copiato.ok ? "Copiato" : "Copia"}
                      <span className="sr-only"> «{testo.titolo}»</span>
                    </button>
                  </div>
                  <textarea
                    id={`${id}-testo-${indice}`}
                    value={testo.testo}
                    onChange={(e) => modifica(indice, e.target.value)}
                    rows={righePer(testo.testo)}
                    aria-describedby={`${id}-conta-${indice}`}
                    className="mt-2 block w-full min-w-0 resize-y rounded-lg border border-border bg-background px-3 py-2 leading-relaxed text-foreground"
                  />
                  <p id={`${id}-conta-${indice}`} className="mt-1 text-xs text-muted tabular-nums">
                    {testo.testo.length} caratteri
                  </p>
                  {copiato?.indice === indice && !copiato.ok ? (
                    <p role="alert" className="mt-1 text-sm text-danger">
                      Non riesco a copiare: seleziona il testo e copialo a mano.
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            <p role="status" aria-live="polite" className="sr-only">
              {copiato?.ok ? "Testo copiato." : ""}
            </p>
            <div className="mt-5 rounded-lg bg-brand-soft p-3 text-sm">
              Controlla sempre il testo prima di usarlo: deve dire solo cose vere. Sostituisci le parti tra [parentesi
              quadre] con i tuoi dati.
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => void chiedi(risultato.richiesta, true)}
                disabled={inCorso}
                className={classePulsanteSecondario}
              >
                {inCorso ? "Bleo sta scrivendo…" : "Rifai: un'altra versione"}
              </button>
              <p className="text-xs text-muted">La nuova versione sostituisce questa: copia prima quello che vuoi tenere.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-xl border border-dashed border-border p-4 sm:p-6">
            <ImmagineMascotte nome="scrivania" sizes="80px" className="h-auto w-16 shrink-0 sm:w-20" />
            <div>
              <h2 id={`${id}-risultato`} className="font-semibold">
                Qui arriva il tuo testo
              </h2>
              <p className="mt-1 text-sm text-muted">
                Scegli il tipo, scrivi cosa fai e tocca «Scrivi il testo». Poi lo puoi cambiare e copiare.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function NonAttivo() {
  return (
    <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-7">
      <ImmagineMascotte nome="pensa" sizes="96px" className="h-auto w-20 shrink-0 sm:w-24" />
      <div>
        <h2 className="text-xl font-semibold">Ci stiamo ancora lavorando</h2>
        <p className="mt-2 text-muted">
          «Testi pronti» non è ancora attivo. Presto Bleo potrà scrivere per te la descrizione per il sito o Instagram,
          la prima email a un cliente e l&apos;introduzione dei tuoi preventivi.
        </p>
        <p className="mt-3">
          <Link href="/strumenti" className={classeLink}>
            Intanto guarda gli altri strumenti
          </Link>
        </p>
      </div>
    </div>
  );
}
