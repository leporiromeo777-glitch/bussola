"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CHIAVI_ARCHIVIO } from "@/lib/strumenti/archivio";
import { calcolaBudget } from "@/lib/strumenti/budget";
import {
  CAMPI_PIANO,
  campiCompilati,
  campiTroppoLunghi,
  MASSIMO_ASSOLUTO,
  statoLunghezza,
  testoCostiDaBudget,
  testoPrezzoDaTariffa,
  testoRicaviDaBudget,
  type CampoPiano,
  type DatiPiano,
} from "@/lib/strumenti/business-plan";
import { dataIsoLocale } from "@/lib/strumenti/documenti";
import { calcolaTariffa, datiTariffaIniziali, schemaDatiTariffa } from "@/lib/strumenti/tariffa";
import { dataSvizzera, fonti } from "@/data/svizzera";
import { PulsanteStampa } from "../dati-locali";
import { NotaNonConsulenza } from "../intestazione";
import {
  CaricamentoStrumento,
  ErroreStrumento,
  NotaStrumento,
  useStrumentoSalvato,
  type AccessoStrumento,
} from "../salvati/strumento-account";
import { useArchivio, useArchivioPresente, useOggi } from "../usa-archivio";
import { CampoArea, CampoTesto, Caricamento, classeLink, classePulsantePiccolo, FonteLink, Gruppo } from "../ui";

const predefinitoTariffa = () => datiTariffaIniziali(dataIsoLocale(new Date()));

/**
 * Business plan di una pagina. Con l'accesso (`accesso` «collegato») i dati,
 * e il budget da cui importare i numeri, stanno nell'account; senza, nel
 * browser. La tariffa resta sempre nel browser.
 */
export function PianoUnaPagina({ accesso = null }: { accesso?: AccessoStrumento }) {
  const s = useStrumentoSalvato("business-plan", accesso);
  const { dati, aggiorna } = s;
  const b = useStrumentoSalvato("budget", s.collegato ? "collegato" : null);
  const budget = b.dati;
  const budgetSalvato = b.presente;
  const [tariffa] = useArchivio(CHIAVI_ARCHIVIO.tariffa, schemaDatiTariffa, predefinitoTariffa);
  const tariffaSalvata = useArchivioPresente(CHIAVI_ARCHIVIO.tariffa);
  const oggi = useOggi();
  const [annuncio, setAnnuncio] = useState("");

  const importabili = useMemo(() => {
    const voci: Partial<Record<CampoPiano, string>> = {};
    if (tariffa && tariffaSalvata) {
      const t = calcolaTariffa(tariffa);
      if (t.ok) voci.prezzo = testoPrezzoDaTariffa(t.risultato);
    }
    if (budget && budgetSalvato) {
      const b = calcolaBudget(budget).risultato;
      if (!b.vuoto) {
        voci.costi = testoCostiDaBudget(b, budget);
        voci.ricavi = testoRicaviDaBudget(b);
      }
    }
    return voci;
  }, [tariffa, budget, tariffaSalvata, budgetSalvato]);

  if (s.errore && s.archivio) return <ErroreStrumento s={s} />;
  if (!dati) return s.collegato ? <CaricamentoStrumento strumento="business-plan" /> : <Caricamento />;

  const impostaCampo = (id: CampoPiano, valore: string) => aggiorna((d) => ({ ...d, campi: { ...d.campi, [id]: valore } }));
  const importa = (id: CampoPiano, testo: string, titolo: string) => {
    const attuale = dati.campi[id].trim();
    if (attuale && attuale !== testo && !window.confirm(`Il campo «${titolo}» ha già del testo. Lo sostituisco con i numeri importati?`)) {
      return;
    }
    impostaCampo(id, testo);
    setAnnuncio(`Testo importato in «${titolo}».`);
  };
  const compilati = campiCompilati(dati);
  const lunghi = campiTroppoLunghi(dati);

  return (
    <div className="mt-8 space-y-6">
      <NotaStrumento s={s} />
      <p className="sr-only" role="status" aria-live="polite">
        {annuncio}
      </p>

      <form className="space-y-6 print:hidden" onSubmit={(e) => e.preventDefault()} noValidate>
        <Gruppo legenda="La tua attività">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTesto
              id="nome-attivita"
              etichetta="Nome dell'attività"
              valore={dati.nomeAttivita}
              onCambia={(v) => aggiorna((d) => ({ ...d, nomeAttivita: v }))}
              maxLength={120}
              placeholder="Per esempio: Siti Rossi"
              aiuto={
                <>
                  Il nome di una ditta individuale deve contenere il tuo cognome (<FonteLink fonte={fonti.co945} />).
                </>
              }
            />
            <CampoTesto
              id="titolare"
              etichetta="Nome e cognome"
              valore={dati.titolare}
              onCambia={(v) => aggiorna((d) => ({ ...d, titolare: v }))}
              maxLength={120}
              autoComplete="name"
            />
          </div>
        </Gruppo>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {compilati} di {CAMPI_PIANO.length} domande compilate. Scrivi frasi brevi: tutto deve stare su una pagina.
          </p>
          {Object.keys(importabili).length === 0 ? (
            <p className="text-sm text-muted">
              Compila la <Link href="/strumenti/tariffa" className={classeLink}>tariffa</Link> o il{" "}
              <Link href="/strumenti/budget" className={classeLink}>budget</Link> per importare i numeri qui.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CAMPI_PIANO.map((c) => {
            const stato = statoLunghezza(dati.campi[c.id], c.consigliati);
            const daImportare = importabili[c.id];
            return (
              <div key={c.id} className={`rounded-xl border border-border bg-card p-4 ${c.id === "idea" ? "md:col-span-2" : ""}`}>
                <CampoArea
                  id={`piano-${c.id}`}
                  etichetta={<span className="text-base font-semibold">{c.titolo}</span>}
                  aiuto={c.domanda}
                  valore={dati.campi[c.id]}
                  onCambia={(v) => impostaCampo(c.id, v)}
                  placeholder={`Esempio: ${c.esempio}`}
                  righe={c.righe}
                  maxLength={c.consigliati * MASSIMO_ASSOLUTO}
                  dopo={
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span
                        className={
                          stato.stato === "lungo" ? "font-medium text-danger" : stato.stato === "quasi" ? "text-accent" : "text-muted"
                        }
                      >
                        {stato.caratteri} / {stato.consigliati} caratteri
                        {stato.stato === "lungo" ? ": troppo lungo per una pagina" : ""}
                      </span>
                      {daImportare ? (
                        <button type="button" className={classePulsantePiccolo} onClick={() => importa(c.id, daImportare, c.titolo)}>
                          Usa i numeri {c.id === "prezzo" ? "della tariffa" : "del budget"}
                        </button>
                      ) : null}
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      </form>

      <section aria-labelledby="titolo-anteprima" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h2 id="titolo-anteprima" className="text-xl font-semibold">
            Anteprima della pagina
          </h2>
          <PulsanteStampa />
        </div>
        {lunghi.length > 0 ? (
          <p className="text-sm text-danger print:hidden">
            Alcune risposte sono più lunghe del consigliato: in stampa potrebbero non stare su una pagina.
          </p>
        ) : null}
        <FoglioPiano dati={dati} oggi={oggi} />
      </section>

      <NotaNonConsulenza className="print:hidden" />
    </div>
  );
}

/** Il foglio A4: anteprima a schermo (carta bianca) e unica cosa stampata. */
function FoglioPiano({ dati, oggi }: { dati: DatiPiano; oggi: string | null }) {
  const [idea, ...altri] = CAMPI_PIANO;
  return (
    <article
      aria-label="Business plan di una pagina"
      className="mx-auto max-w-[210mm] rounded-xl border border-border bg-white p-6 [overflow-wrap:anywhere] text-[13px] leading-snug text-[#1c1f24] shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:text-[9pt] print:shadow-none"
    >
      <header className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#0f5e6b] pb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0f5e6b]">Business plan di una pagina</p>
          <h2 className="text-xl font-semibold print:text-[15pt]">{dati.nomeAttivita.trim() || "La mia attività"}</h2>
        </div>
        <p className="text-right text-[11px] text-[#4b515b]">
          {dati.titolare.trim() ? <span className="block">{dati.titolare}</span> : null}
          {oggi ? dataSvizzera(oggi) : null}
        </p>
      </header>

      <section className="mt-3 rounded-md bg-[#eef6f7] p-3 break-inside-avoid">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#0f5e6b]">{idea.titolo}</h3>
        <p className="mt-1 text-[15px] font-medium whitespace-pre-line print:text-[11pt]">
          {dati.campi.idea.trim() || <span className="text-[#8a909a]">…</span>}
        </p>
      </section>

      <div className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2 print:grid-cols-2">
        {altri.map((c) => (
          <section key={c.id} className="border-t border-[#d6d2c9] pt-2 break-inside-avoid">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#0f5e6b]">{c.titolo}</h3>
            <p className="mt-1 whitespace-pre-line">{dati.campi[c.id].trim() || <span className="text-[#8a909a]">…</span>}</p>
          </section>
        ))}
      </div>

      <footer className="mt-4 border-t border-[#d6d2c9] pt-2 text-[10px] text-[#4b515b]">
        Preparato con Bleo. Documento compilato da chi lo presenta; i numeri sono stime.
      </footer>
    </article>
  );
}
