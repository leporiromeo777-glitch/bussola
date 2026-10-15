"use client";

import { useMemo } from "react";
import { datiStrumenti, fonti, fontiStrumenti, percentuale, pilastro3a, regole } from "@/data/svizzera";
import { anniDisponibili, type SituazioneAvs } from "@/lib/strumenti/avs";
import { CHIAVI_ARCHIVIO } from "@/lib/strumenti/archivio";
import { dataIsoLocale } from "@/lib/strumenti/documenti";
import { importo, leggiNumero, numeroBreve, numeroSvizzero } from "@/lib/strumenti/numeri";
import {
  CATEGORIE_COSTI,
  calcolaTariffa,
  datiTariffaIniziali,
  schemaDatiTariffa,
  type CategoriaCosto,
  type DatiTariffa,
  type RisultatoTariffa,
} from "@/lib/strumenti/tariffa";
import { NotaDatiLocali, PulsanteStampa } from "../dati-locali";
import { DettaglioContributi } from "../dettaglio-contributi";
import { NotaNonConsulenza } from "../intestazione";
import { useArchivio } from "../usa-archivio";
import {
  CampoScelta,
  CampoTesto,
  Caricamento,
  EtichettaStima,
  FonteLink,
  Fonti,
  Gruppo,
  RigaValore,
  RiquadroAvviso,
} from "../ui";

const predefinito = () => datiTariffaIniziali(dataIsoLocale(new Date()));

export const OPZIONI_SITUAZIONE: { valore: SituazioneAvs; etichetta: string }[] = [
  { valore: "principale", etichetta: "È la mia attività principale" },
  { valore: "accessoria", etichetta: "È accessoria: sul mio salario da dipendente pago già il contributo AVS minimo" },
];

export function CalcolatoreTariffa() {
  const [dati, aggiorna] = useArchivio(CHIAVI_ARCHIVIO.tariffa, schemaDatiTariffa, predefinito);
  const esito = useMemo(() => (dati ? calcolaTariffa(dati) : null), [dati]);

  if (!dati || !esito) return <Caricamento />;

  const imposta = <K extends keyof DatiTariffa>(campo: K, valore: DatiTariffa[K]) =>
    aggiorna((d) => ({ ...d, [campo]: valore }));
  const impostaCosto = (id: CategoriaCosto, valore: string) =>
    aggiorna((d) => ({ ...d, costiFissi: { ...d.costiFissi, [id]: valore } }));
  const errori = esito.ok ? {} : esito.errori;
  const sommaCosti = CATEGORIE_COSTI.reduce((s, c) => s + Math.max(0, leggiNumero(dati.costiFissi[c.id]) ?? 0), 0);
  const limiti3a = pilastro3a[dati.anno].valore;

  return (
    <div className="mt-8 space-y-6">
      <NotaDatiLocali chiavi={[CHIAVI_ARCHIVIO.tariffa]} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
        <form className="space-y-6 print:hidden" onSubmit={(e) => e.preventDefault()} noValidate>
          <Gruppo legenda="1. Il reddito che vuoi" descrizione="Quanto vuoi guadagnare per te in un anno, dopo i costi e i contributi AVS, prima delle imposte.">
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoTesto
                id="reddito"
                etichetta="Reddito annuo per te"
                prefisso="CHF"
                numerico
                valore={dati.redditoDesiderato}
                onCambia={(v) => imposta("redditoDesiderato", v)}
                errore={errori.redditoDesiderato}
                aiuto="Per esempio quanto ti serve per vivere in un anno."
                className="sm:col-span-2"
              />
              <CampoScelta
                id="anno"
                etichetta="Anno dei contributi AVS"
                valore={String(dati.anno)}
                onCambia={(v) => imposta("anno", Number(v) as DatiTariffa["anno"])}
                opzioni={anniDisponibili.map((a) => ({ valore: String(a), etichetta: String(a) }))}
              />
              <CampoScelta
                id="situazione"
                etichetta="La tua attività indipendente"
                valore={dati.situazione}
                onCambia={(v) => imposta("situazione", v)}
                opzioni={OPZIONI_SITUAZIONE}
              />
            </div>
          </Gruppo>

          <Gruppo
            legenda="2. Il tuo tempo"
            descrizione="Non tutte le ore di lavoro si possono fatturare: amministrazione, ricerca di clienti, offerte, formazione e spostamenti le paghi tu. Conta solo le ore che un cliente ti paga."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoTesto
                id="vacanza"
                etichetta="Settimane di vacanza all'anno"
                suffisso="settimane"
                numerico
                valore={dati.settimaneVacanza}
                onCambia={(v) => imposta("settimaneVacanza", v)}
                errore={errori.settimaneVacanza}
              />
              <CampoTesto
                id="assenze"
                etichetta="Giorni di malattia e festivi all'anno"
                suffisso="giorni"
                numerico
                valore={dati.giorniAssenza}
                onCambia={(v) => imposta("giorniAssenza", v)}
                errore={errori.giorniAssenza}
              />
              <CampoTesto
                id="giorni-settimana"
                etichetta="Giorni di lavoro a settimana"
                suffisso="giorni"
                numerico
                valore={dati.giorniLavorativiSettimana}
                onCambia={(v) => imposta("giorniLavorativiSettimana", v)}
                errore={errori.giorniLavorativiSettimana}
              />
              <CampoTesto
                id="ore-fatturabili"
                etichetta="Ore fatturabili a settimana"
                suffisso="ore"
                numerico
                valore={dati.oreFatturabiliSettimana}
                onCambia={(v) => imposta("oreFatturabiliSettimana", v)}
                errore={errori.oreFatturabiliSettimana}
                aiuto="Solo le ore che un cliente ti paga."
              />
              <CampoTesto
                id="ore-giornata"
                etichetta="Ore in una giornata fatturata"
                suffisso="ore"
                numerico
                valore={dati.oreGiornata}
                onCambia={(v) => imposta("oreGiornata", v)}
                errore={errori.oreGiornata}
                aiuto="Serve per la tariffa a giornata."
              />
            </div>
            <p className="mt-4 text-sm text-muted">I valori iniziali sono solo esempi: mettici i tuoi.</p>
          </Gruppo>

          <Gruppo
            legenda="3. Costi fissi dell'attività, all'anno"
            descrizione="Lascia vuoto quello che non hai. Per un costo mensile moltiplica per 12 (CHF 50 al mese = CHF 600)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {CATEGORIE_COSTI.map((c) => (
                <CampoTesto
                  key={c.id}
                  id={`costo-${c.id}`}
                  etichetta={c.etichetta}
                  prefisso="CHF"
                  numerico
                  placeholder="0"
                  valore={dati.costiFissi[c.id]}
                  onCambia={(v) => impostaCosto(c.id, v)}
                  errore={errori[`costiFissi.${c.id}`]}
                  aiuto={c.esempio}
                />
              ))}
            </div>
            <p className="mt-4 text-sm font-medium">Totale costi fissi: {importo(sommaCosti, 0)} all&apos;anno</p>
          </Gruppo>

          <Gruppo legenda="4. Facoltativo: previdenza e imposte">
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoTesto
                id="pilastro3a"
                etichetta="Versamento nel pilastro 3a, all'anno"
                prefisso="CHF"
                numerico
                placeholder="0"
                valore={dati.pilastro3a}
                onCambia={(v) => imposta("pilastro3a", v)}
                errore={errori.pilastro3a}
                aiuto={
                  <>
                    Nel {dati.anno}, senza cassa pensione, al massimo il{" "}
                    {percentuale(datiStrumenti.quotaMassimaPilastro3a.valore)} del reddito da attività lucrativa e non
                    più di {importo(limiti3a.senzaCassaPensione, 0)}. <FonteLink fonte={pilastro3a[dati.anno].fonte} />
                  </>
                }
              />
              <CampoTesto
                id="riserva"
                etichetta="Riserva per le imposte"
                suffisso="%"
                numerico
                placeholder="vuoto"
                valore={dati.riservaImpostePercento}
                onCambia={(v) => imposta("riservaImpostePercento", v)}
                errore={errori.riservaImpostePercento}
                aiuto={
                  <>
                    Percentuale dell&apos;utile dopo i contributi che metti da parte. Bussola non calcola le imposte:
                    per farti un&apos;idea della percentuale usa il <FonteLink fonte={fontiStrumenti.afcCalcolatoreImposte} />{" "}
                    dell&apos;AFC.
                  </>
                }
              />
            </div>
          </Gruppo>
        </form>

        <div>
          {esito.ok ? (
            <Risultato r={esito.risultato} />
          ) : (
            <div role="alert" className="rounded-xl border border-danger bg-card p-5">
              <h2 className="font-semibold">Controlla i campi segnati</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {Object.values(esito.errori).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {esito.ok ? <RiepilogoStampa dati={dati} r={esito.risultato} /> : null}
      <NotaNonConsulenza />
    </div>
  );
}

function Risultato({ r }: { r: RisultatoTariffa }) {
  const parti = [
    { etichetta: "Costi fissi", valore: r.costiFissi, colore: "bg-muted" },
    { etichetta: "Contributi sociali", valore: r.contributi.totale, colore: "bg-accent" },
    { etichetta: "Riserva imposte", valore: r.riservaImposte, colore: "bg-danger" },
    { etichetta: "Pilastro 3a", valore: r.pilastro3a, colore: "bg-success" },
    { etichetta: "Reddito per te", valore: r.reddito, colore: "bg-brand" },
  ].filter((p) => p.valore > 0);
  const totale = parti.reduce((s, p) => s + p.valore, 0) || 1;

  return (
    <section aria-labelledby="titolo-risultato" className="space-y-4">
      <div className="rounded-xl border border-brand bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="titolo-risultato" className="font-semibold">
            La tua tariffa minima
          </h2>
          <EtichettaStima />
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          Tariffa minima {importo(r.tariffaOrariaArrotondata, 0)} all&apos;ora, fatturato necessario {importo(r.fatturato, 0)}.
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-brand">
          {importo(r.tariffaOrariaArrotondata, 0)}
          <span className="text-lg font-medium text-muted"> all&apos;ora</span>
        </p>
        <dl className="mt-3 divide-y divide-border text-sm">
          <RigaValore
            etichetta={`A giornata (${numeroBreve(r.oreGiornata)} ore)`}
            valore={importo(r.tariffaGiornaliera, 0)}
          />
          <RigaValore etichetta="Fatturato necessario all'anno" valore={importo(r.fatturato, 0)} forte />
          <RigaValore
            etichetta="Ore fatturabili all'anno"
            nota={`${numeroBreve(r.settimaneLavorative)} settimane di lavoro`}
            valore={numeroSvizzero(r.oreFatturabiliAnno)}
          />
        </dl>
        <p className="mt-3 text-xs text-muted">
          Arrotondata per eccesso al franco. Importi senza IVA. È il minimo per coprire i tuoi numeri: confrontalo con i
          prezzi del tuo settore.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-semibold">Dove vanno i soldi del fatturato</h3>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-border" aria-hidden="true">
          {parti.map((p) => (
            <span key={p.etichetta} className={p.colore} style={{ width: `${(p.valore / totale) * 100}%` }} />
          ))}
        </div>
        <dl className="mt-3 divide-y divide-border text-sm">
          {parti.map((p) => (
            <RigaValore
              key={p.etichetta}
              etichetta={
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className={`size-2.5 rounded-full ${p.colore}`} />
                  {p.etichetta}
                </span>
              }
              valore={importo(p.valore, 0)}
            />
          ))}
          <RigaValore etichetta="Fatturato" valore={importo(r.fatturato, 0)} forte />
        </dl>
        {r.riservaPercento !== null ? (
          <p className="mt-2 text-xs text-muted">
            Riserva imposte: {numeroBreve(r.riservaPercento)}% di {importo(r.utileDopoContributi, 0)} (utile dopo i
            contributi), percentuale scelta da te.
          </p>
        ) : null}
      </div>

      {r.avvisi.map((a) => (
        <RiquadroAvviso key={a.id} avviso={a} />
      ))}

      <DettaglioContributi stima={r.contributi} />

      <div className="flex flex-wrap gap-3">
        <PulsanteStampa />
      </div>
    </section>
  );
}

/** Solo in stampa: i dati inseriti, perché il modulo non si stampa. */
function RiepilogoStampa({ dati, r }: { dati: DatiTariffa; r: RisultatoTariffa }) {
  return (
    <section className="hidden break-inside-avoid rounded-xl border border-border p-4 text-sm print:block">
      <h2 className="font-semibold">Dati inseriti</h2>
      <dl className="mt-2 grid grid-cols-2 gap-x-8">
        <RigaValore etichetta="Reddito annuo per te" valore={importo(r.reddito, 0)} />
        <RigaValore etichetta="Anno dei contributi" valore={String(r.anno)} />
        <RigaValore etichetta="Settimane di vacanza" valore={dati.settimaneVacanza || "0"} />
        <RigaValore etichetta="Giorni di malattia e festivi" valore={dati.giorniAssenza || "0"} />
        <RigaValore etichetta="Giorni di lavoro a settimana" valore={dati.giorniLavorativiSettimana} />
        <RigaValore etichetta="Ore fatturabili a settimana" valore={dati.oreFatturabiliSettimana} />
        {CATEGORIE_COSTI.filter((c) => r.costiPerCategoria[c.id] > 0).map((c) => (
          <RigaValore key={c.id} etichetta={c.etichetta} valore={importo(r.costiPerCategoria[c.id], 0)} />
        ))}
        {r.pilastro3a > 0 ? <RigaValore etichetta="Pilastro 3a" valore={importo(r.pilastro3a, 0)} /> : null}
      </dl>
      <p className="mt-3 text-xs">
        Stima indicativa preparata con Bussola. Soglia IVA e registro di commercio: {importo(regole.sogliaIva.valore, 0)}.
      </p>
      <Fonti fonti={[fonti.avsPromemoria202, fonti.liva10, fonti.co931]} />
    </section>
  );
}
