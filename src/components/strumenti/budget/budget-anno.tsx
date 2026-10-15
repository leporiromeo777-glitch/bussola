"use client";

import { useMemo } from "react";
import { fonti, fontiStrumenti, regole, regolePercorso, tasseRegistroCommercio } from "@/data/svizzera";
import { CHIAVI_ARCHIVIO } from "@/lib/strumenti/archivio";
import {
  calcolaBudget,
  costoIscrizioneRegistro,
  datiBudgetIniziali,
  MESI,
  mesiDaInizio,
  nomeMese,
  schemaDatiBudget,
  type CostoAvvio,
  type DatiBudget,
  type MeseBudget,
  type RigaImporto,
  type RisultatoBudget,
} from "@/lib/strumenti/budget";
import { dataIsoLocale } from "@/lib/strumenti/documenti";
import { importo, numeroBreve } from "@/lib/strumenti/numeri";
import { NotaDatiLocali, PulsanteStampa } from "../dati-locali";
import { DettaglioContributi } from "../dettaglio-contributi";
import { IconaCestino, IconaPiu } from "../icone";
import { nuovoId } from "../id";
import { NotaNonConsulenza } from "../intestazione";
import { OPZIONI_SITUAZIONE } from "../tariffa/calcolatore-tariffa";
import { useArchivio } from "../usa-archivio";
import {
  CampoScelta,
  CampoTesto,
  Caricamento,
  Casella,
  classePulsantePiccolo,
  EtichettaStima,
  FonteLink,
  Fonti,
  Gruppo,
  RiquadroAvviso,
} from "../ui";

const predefinito = () => datiBudgetIniziali(dataIsoLocale(new Date()));

export function BudgetAnno() {
  const [dati, aggiorna] = useArchivio(CHIAVI_ARCHIVIO.budget, schemaDatiBudget, predefinito);
  const esito = useMemo(() => (dati ? calcolaBudget(dati) : null), [dati]);
  if (!dati || !esito) return <Caricamento />;

  const { errori, risultato } = esito;
  const imposta = <K extends keyof DatiBudget>(campo: K, valore: DatiBudget[K]) => aggiorna((d) => ({ ...d, [campo]: valore }));
  const mesi = mesiDaInizio(dati.meseInizio);
  const annoInizio = Number(dati.meseInizio.slice(0, 4));
  const meseInizio = Number(dati.meseInizio.slice(5, 7));

  return (
    <div className="mt-8 space-y-6">
      <NotaDatiLocali chiavi={[CHIAVI_ARCHIVIO.budget]} />

      <form className="space-y-6 print:hidden" onSubmit={(e) => e.preventDefault()} noValidate>
        <Gruppo legenda="1. Da quando parti">
          <div className="grid gap-4 sm:grid-cols-3">
            <CampoScelta
              id="mese-inizio"
              etichetta="Primo mese"
              valore={String(meseInizio)}
              onCambia={(v) => imposta("meseInizio", `${annoInizio}-${v.padStart(2, "0")}`)}
              opzioni={MESI.map((m, i) => ({ valore: String(i + 1), etichetta: m }))}
            />
            <CampoScelta
              id="anno-inizio"
              etichetta="Anno"
              valore={String(annoInizio)}
              onCambia={(v) => imposta("meseInizio", `${v}-${String(meseInizio).padStart(2, "0")}`)}
              opzioni={[annoInizio - 1, annoInizio, annoInizio + 1, annoInizio + 2].map((a) => ({ valore: String(a), etichetta: String(a) }))}
            />
            <CampoScelta
              id="situazione-budget"
              etichetta="La tua attività indipendente"
              valore={dati.situazione}
              onCambia={(v) => imposta("situazione", v)}
              opzioni={OPZIONI_SITUAZIONE}
            />
          </div>
        </Gruppo>

        <Gruppo
          legenda="2. Ricavi previsti, mese per mese"
          descrizione="Quanto pensi di incassare ogni mese, senza IVA. Nei primi mesi di solito si incassa meno: sii prudente."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {mesi.map((m, i) => (
              <CampoTesto
                key={m.etichetta}
                id={`ricavi-${i}`}
                etichetta={nomeMese(m)}
                prefisso="CHF"
                numerico
                placeholder="0"
                valore={dati.ricavi[i] ?? ""}
                onCambia={(v) => aggiorna((d) => ({ ...d, ricavi: d.ricavi.map((r, j) => (j === i ? v : r)) }))}
                errore={errori[`ricavi.${i}`]}
              />
            ))}
          </div>
          <button
            type="button"
            className={`${classePulsantePiccolo} mt-4`}
            onClick={() => aggiorna((d) => ({ ...d, ricavi: d.ricavi.map(() => d.ricavi[0]) }))}
          >
            Copia il primo mese in tutti i mesi
          </button>
        </Gruppo>

        <Gruppo legenda="3. Costi di avvio (una volta sola)" descrizione="Quello che compri o paghi per partire. Scegli in che mese lo paghi.">
          <ElencoRighe
            prefissoId="avvio"
            righe={dati.costiAvvio}
            errori={errori}
            chiaveErrore="costiAvvio"
            etichettaImporto="Importo"
            conMese={mesi.map((m) => m.etichetta)}
            onCambia={(costiAvvio) => imposta("costiAvvio", costiAvvio as CostoAvvio[])}
            nuova={() => ({ id: nuovoId(), descrizione: "", importo: "", mese: 0 })}
          />
          <Casella
            id="iscrizione-registro"
            className="mt-6"
            etichetta={`Mi iscrivo al registro di commercio (${importo(costoIscrizioneRegistro(), 0)} nel primo mese)`}
            selezionata={dati.iscrizioneRegistro}
            onCambia={(v) => imposta("iscrizioneRegistro", v)}
            aiuto={
              <>
                Facoltativa sotto {importo(regole.sogliaRegistroCommercio.valore, 0)} di cifra d&apos;affari annua.{" "}
                {importo(tasseRegistroCommercio.valore.stimaTitolareConFirma, 0)} di tasse per il titolare con firma
                individuale (<FonteLink fonte={tasseRegistroCommercio.fonte} />) +{" "}
                {importo(regolePercorso.autenticazioneFirmaRcTicino.valore, 0)} per l&apos;autenticazione della firma (
                <FonteLink fonte={regolePercorso.autenticazioneFirmaRcTicino.fonte} />
                ). {regolePercorso.autenticazioneFirmaRcTicino.nota}
              </>
            }
          />
        </Gruppo>

        <Gruppo legenda="4. Costi fissi, al mese" descrizione="Si pagano ogni mese anche se incassi poco. Lascia vuoto quello che non hai.">
          <ElencoRighe
            prefissoId="fisso"
            righe={dati.costiFissi}
            errori={errori}
            chiaveErrore="costiFissi"
            etichettaImporto="Al mese"
            onCambia={(costiFissi) => imposta("costiFissi", costiFissi)}
            nuova={() => ({ id: nuovoId(), descrizione: "", importo: "" })}
          />
        </Gruppo>

        <Gruppo legenda="5. Costi variabili, prelievi e riserve">
          <div className="grid gap-4 sm:grid-cols-3">
            <CampoTesto
              id="variabili"
              etichetta="Costi variabili (% dei ricavi)"
              suffisso="%"
              numerico
              placeholder="0"
              valore={dati.costiVariabiliPercento}
              onCambia={(v) => imposta("costiVariabiliPercento", v)}
              errore={errori.costiVariabiliPercento}
              aiuto="Costi che crescono con le vendite: materiale, merce, commissioni."
            />
            <CampoTesto
              id="prelievi"
              etichetta="Prelievi privati al mese"
              prefisso="CHF"
              numerico
              placeholder="0"
              valore={dati.prelieviMensili}
              onCambia={(v) => imposta("prelieviMensili", v)}
              errore={errori.prelieviMensili}
              aiuto="Quello che prendi per vivere: affitto, cassa malati, spesa…"
            />
            <CampoTesto
              id="riserva-budget"
              etichetta="Riserva per le imposte"
              suffisso="%"
              numerico
              placeholder="vuoto"
              valore={dati.riservaImpostePercento}
              onCambia={(v) => imposta("riservaImpostePercento", v)}
              errore={errori.riservaImpostePercento}
              aiuto={
                <>
                  Percentuale del risultato dopo i contributi, scelta da te. Per farti un&apos;idea:{" "}
                  <FonteLink fonte={fontiStrumenti.afcCalcolatoreImposte} />.
                </>
              }
            />
          </div>
        </Gruppo>
      </form>

      {Object.keys(errori).length > 0 ? (
        <p role="alert" className="rounded-xl border border-danger bg-card p-4 text-sm print:hidden">
          Alcuni campi non sono numeri validi: per ora li contiamo come zero. Correggili per un budget giusto.
        </p>
      ) : null}

      {risultato.vuoto ? (
        <p className="rounded-xl border border-border bg-card p-6 text-muted print:hidden">
          Inserisci i ricavi previsti e i costi: qui vedrai il saldo mese per mese e il mese di pareggio.
        </p>
      ) : (
        <Risultati r={risultato} />
      )}

      <NotaNonConsulenza />
    </div>
  );
}

type RigaModificabile = RigaImporto & { mese?: number };

function ElencoRighe({
  prefissoId,
  righe,
  errori,
  chiaveErrore,
  etichettaImporto,
  conMese,
  onCambia,
  nuova,
}: {
  prefissoId: string;
  righe: RigaModificabile[];
  errori: Record<string, string>;
  chiaveErrore: string;
  etichettaImporto: string;
  conMese?: string[];
  onCambia: (righe: RigaModificabile[]) => void;
  nuova: () => RigaModificabile;
}) {
  const cambia = (id: string, modifica: Partial<RigaModificabile>) =>
    onCambia(righe.map((r) => (r.id === id ? { ...r, ...modifica } : r)));
  return (
    <div>
      <ul className="space-y-4">
        {righe.map((r, i) => (
          <li
            key={r.id}
            className={`grid gap-3 border-b border-border pb-4 last:border-0 ${conMese ? "sm:grid-cols-[minmax(0,1fr)_9rem_9rem_auto]" : "sm:grid-cols-[minmax(0,1fr)_10rem_auto]"} sm:items-end`}
          >
            <CampoTesto
              id={`${prefissoId}-descrizione-${r.id}`}
              etichetta={`Voce ${i + 1}`}
              valore={r.descrizione}
              onCambia={(v) => cambia(r.id, { descrizione: v })}
              placeholder="Descrizione"
              maxLength={120}
            />
            <CampoTesto
              id={`${prefissoId}-importo-${r.id}`}
              etichetta={etichettaImporto}
              prefisso="CHF"
              numerico
              placeholder="0"
              valore={r.importo}
              onCambia={(v) => cambia(r.id, { importo: v })}
              errore={errori[`${chiaveErrore}.${r.id}`]}
            />
            {conMese ? (
              <CampoScelta
                id={`${prefissoId}-mese-${r.id}`}
                etichetta="Mese"
                valore={String(r.mese ?? 0)}
                onCambia={(v) => cambia(r.id, { mese: Number(v) })}
                opzioni={conMese.map((m, j) => ({ valore: String(j), etichetta: m }))}
              />
            ) : null}
            <button
              type="button"
              className={`${classePulsantePiccolo} justify-self-start sm:mb-1.5`}
              onClick={() => onCambia(righe.filter((x) => x.id !== r.id))}
            >
              <IconaCestino className="size-4" />
              <span>
                Togli<span className="sr-only"> la voce {r.descrizione || i + 1}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={`${classePulsantePiccolo} mt-4`} onClick={() => onCambia([...righe, nuova()])}>
        <IconaPiu className="size-4" />
        Aggiungi una voce
      </button>
    </div>
  );
}

const RIGHE_TABELLA: { chiave: keyof MeseBudget; etichetta: string; segno?: "-" | "="; forte?: boolean }[] = [
  { chiave: "ricavi", etichetta: "Ricavi" },
  { chiave: "costiVariabili", etichetta: "Costi variabili", segno: "-" },
  { chiave: "costiFissi", etichetta: "Costi fissi", segno: "-" },
  { chiave: "costiAvvio", etichetta: "Costi di avvio", segno: "-" },
  { chiave: "risultato", etichetta: "Risultato dell'attività", segno: "=", forte: true },
  { chiave: "accantonamentoAvs", etichetta: "Da parte per AVS e supplementi", segno: "-" },
  { chiave: "accantonamentoImposte", etichetta: "Da parte per le imposte", segno: "-" },
  { chiave: "prelievi", etichetta: "Prelievi privati", segno: "-" },
  { chiave: "flusso", etichetta: "Saldo del mese", segno: "=", forte: true },
  { chiave: "cumulato", etichetta: "Saldo cumulato", forte: true },
];

function Valore({ n }: { n: number }) {
  return <span className={n < 0 ? "text-danger" : undefined}>{importo(n, 0).replace("CHF ", "")}</span>;
}

function Risultati({ r }: { r: RisultatoBudget }) {
  // Le righe sempre a zero (per es. niente costi variabili) non servono.
  const righe = RIGHE_TABELLA.filter((riga) => riga.forte || r.mesi.some((m) => (m[riga.chiave] as number) !== 0));
  const pareggio =
    r.mesePareggio === null
      ? "Non nei 12 mesi"
      : r.pareggioSubito
        ? "Dal primo mese"
        : nomeMese(r.mesi[r.mesePareggio]);

  return (
    <section aria-labelledby="titolo-risultati-budget" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titolo-risultati-budget" className="text-2xl font-semibold">
          Il tuo primo anno, {r.mesi[0].etichetta} – {r.mesi[11].etichetta}
        </h2>
        <EtichettaStima />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Ricavi {importo(r.totali.ricavi, 0)}, saldo dopo 12 mesi {importo(r.mesi[11].cumulato, 0)}, pareggio: {pareggio}.
      </p>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
        <Riquadro etichetta="Ricavi in 12 mesi" valore={importo(r.totali.ricavi, 0)} />
        <Riquadro
          etichetta="Risultato dell'attività"
          nota="Prima di AVS, imposte e prelievi"
          valore={importo(r.totali.risultato, 0)}
          negativo={r.totali.risultato < 0}
        />
        <Riquadro etichetta="Mese di pareggio" nota="Da qui il saldo cumulato resta positivo" valore={pareggio} />
        <Riquadro
          etichetta="Saldo dopo 12 mesi"
          nota={r.fabbisognoMassimo > 0 && r.meseFabbisogno !== null ? `Punto più basso: ${importo(-r.fabbisognoMassimo, 0)} a ${nomeMese(r.mesi[r.meseFabbisogno])}` : "Mai sotto zero"}
          valore={importo(r.mesi[11].cumulato, 0)}
          negativo={r.mesi[11].cumulato < 0}
        />
      </dl>
      {r.fabbisognoMassimo > 0 ? (
        <p className="text-sm text-muted">
          Nel mese peggiore il saldo cumulato scende a {importo(-r.fabbisognoMassimo, 0)}: è la riserva (risparmi o altri
          soldi) che ti serve per coprire i mesi in rosso.
        </p>
      ) : null}

      {r.avvisi.map((a) => (
        <RiquadroAvviso key={a.id} avviso={a} />
      ))}

      {/* Tabella: schermi larghi e stampa. */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block print:block print:overflow-visible">
        <table className="w-full border-collapse text-right text-xs tabular-nums print:text-[6.5pt]">
          <caption className="sr-only">Budget mese per mese, in franchi</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="sticky left-0 bg-card px-2 py-2 text-left font-semibold print:static">
                CHF
              </th>
              {r.mesi.map((m, i) => (
                <th
                  key={m.etichetta}
                  scope="col"
                  className={`whitespace-nowrap px-1.5 py-2 font-semibold print:px-1 ${i === r.mesePareggio && !r.pareggioSubito ? "bg-brand-soft" : ""}`}
                >
                  {m.etichetta}
                </th>
              ))}
              <th scope="col" className="px-2 py-2 font-semibold print:px-1">
                Totale
              </th>
            </tr>
          </thead>
          <tbody>
            {righe.map((riga) => (
              <tr key={riga.chiave} className={`border-b border-border last:border-0 ${riga.forte ? "font-semibold" : ""}`}>
                <th scope="row" className="sticky left-0 min-w-[9rem] bg-card px-2 py-1.5 text-left font-normal print:static print:min-w-0">
                  {riga.segno ? <span aria-hidden="true" className="mr-1 text-muted">{riga.segno}</span> : null}
                  <span className={riga.forte ? "font-semibold" : ""}>{riga.etichetta}</span>
                </th>
                {r.mesi.map((m, i) => (
                  <td
                    key={m.etichetta}
                    className={`px-1.5 py-1.5 print:px-1 ${i === r.mesePareggio && !r.pareggioSubito ? "bg-brand-soft" : ""}`}
                  >
                    <Valore n={m[riga.chiave] as number} />
                  </td>
                ))}
                <td className="px-2 py-1.5 print:px-1">
                  {riga.chiave === "cumulato" ? <Valore n={r.mesi[11].cumulato} /> : <Valore n={r.totali[riga.chiave as keyof typeof r.totali]} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Telefono: un mese sotto l'altro. */}
      <ol className="space-y-3 md:hidden print:hidden">
        {r.mesi.map((m, i) => (
          <li key={m.etichetta} className="rounded-xl border border-border bg-card p-4">
            <h3 className="flex items-center justify-between font-semibold">
              {nomeMese(m)}
              {i === r.mesePareggio && !r.pareggioSubito ? (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">Pareggio</span>
              ) : null}
            </h3>
            <dl className="mt-2 divide-y divide-border text-sm">
              {righe.filter((riga) => riga.forte || (m[riga.chiave] as number) !== 0).map((riga) => (
                <div key={riga.chiave} className={`flex justify-between gap-4 py-1.5 ${riga.forte ? "font-semibold" : ""}`}>
                  <dt>
                    {riga.segno ? <span aria-hidden="true" className="mr-1 text-muted">{riga.segno}</span> : null}
                    {riga.etichetta}
                  </dt>
                  <dd className="tabular-nums">
                    <Valore n={m[riga.chiave] as number} />
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
        <DettaglioContributi stima={r.contributi} titolo={`Contributi sociali sui 12 mesi (tavola ${r.annoAvs})`} />
        <div className="space-y-3 text-sm text-muted">
          <h3 className="font-semibold text-foreground">Cosa considera questo budget</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Gli accantonamenti per AVS e imposte sono 1/12 della stima annua ogni mese: la cassa chiede acconti
              trimestrali, le imposte arrivano dopo, ma i soldi vanno messi da parte mentre incassi.
            </li>
            <li>
              I contributi sono stimati sui 12 mesi con la tavola {r.annoAvs}
              {r.annoAvsApprossimato ? " (la più vicina che abbiamo)" : ""}: la cassa calcola per anno civile, sul reddito
              effettivo.
            </li>
            <li>
              Tutti i costi contano nell&apos;anno in cui li paghi. Nella contabilità vera alcuni acquisti si ammortizzano
              su più anni: per il tuo caso, da verificare con un fiduciario.
            </li>
            {r.riservaPercento !== null ? (
              <li>
                Riserva imposte: {numeroBreve(r.riservaPercento, 2)}% del risultato dopo i contributi = {importo(r.riservaImposte, 0)},
                percentuale scelta da te.
              </li>
            ) : (
              <li>Non hai indicato una riserva per le imposte: le imposte non sono nel saldo.</li>
            )}
            <li>Importi senza IVA.</li>
          </ul>
          <Fonti fonti={[fonti.avsPromemoria202, fonti.liva10, fonti.co931]} />
        </div>
      </div>

      <PulsanteStampa />
    </section>
  );
}

function Riquadro({ etichetta, valore, nota, negativo = false }: { etichetta: string; valore: string; nota?: string; negativo?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 break-inside-avoid">
      <dt className="text-sm text-muted">{etichetta}</dt>
      <dd className={`mt-1 text-xl font-semibold tabular-nums ${negativo ? "text-danger" : ""}`}>{valore}</dd>
      {nota ? <dd className="mt-1 text-xs text-muted">{nota}</dd> : null}
    </div>
  );
}
