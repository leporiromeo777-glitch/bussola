import { useMemo, useState } from "react";
import { View } from "react-native";
import { fonti, fontiStrumenti, regole, regolePercorso, regoleRegistro, tasseRegistroCommercio } from "@/data/svizzera";
import type { SituazioneAvs } from "@/lib/strumenti/avs";
import {
  calcolaBudget,
  costoIscrizioneRegistro,
  LUNGHEZZE_BUDGET,
  mesiDaInizio,
  nomeMese,
  type DatiBudget,
} from "@/lib/strumenti/budget";
import { importo } from "@/lib/strumenti/numeri";
import { htmlBudget, nomeFilePiano } from "@/lib/strumenti/stampa-piani";
import { CampoNumero, Scelta } from "~/components/campi";
import { RigaCasella } from "~/components/fatture/modulo-emittente";
import { ContributiBudget, MesiBudget, RiepilogoBudget, SceltaMese, VociBudget } from "~/components/piani/budget";
import { AttesaPiano, ErrorePiano, NotaPiano, RicominciaPiano } from "~/components/piani/stato";
import { ElencoFonti, NotaInformazione, Pulsante, Schermata, Scheda, Testo } from "~/components/ui";
import { avvisa } from "~/lib/conferma";
import { condividiPdfPiano, nuovoIdVoce, PDF_DISPONIBILE, stampaPdfPiano, usePiano, type VistaPiano } from "~/lib/piani";
import { oggiLocale } from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";

const SITUAZIONI: { valore: SituazioneAvs; etichetta: string }[] = [
  { valore: "principale", etichetta: "Principale" },
  { valore: "accessoria", etichetta: "Accessoria" },
];

/** Primo e ultimo mese da cui può partire il budget (come lo accetta il sito: anno a 4 cifre). */
const PRIMO_MESE = 2000 * 12;
const ULTIMO_MESE = 2099 * 12 + 11;

/**
 * «Budget del primo anno»: dodici mesi di ricavi e costi, saldo cumulato,
 * mese di pareggio e accantonamenti per AVS e imposte. Senza accesso resta
 * sul telefono; con l'accesso sta nell'account, come sul sito.
 */
export default function Budget() {
  const v = usePiano("budget");
  if (v.modo === "attesa") return <AttesaPiano strumento="budget" />;
  if (v.modo === "errore") return <ErrorePiano strumento="budget" v={v} />;
  return <ModuloBudget v={v} />;
}

function ModuloBudget({ v }: { v: Extract<VistaPiano<"budget">, { modo: "telefono" | "account" }> }) {
  const c = useColori();
  const { dati, aggiorna } = v;
  const { errori, risultato: r } = useMemo(() => calcolaBudget(dati), [dati]);
  const [attesa, setAttesa] = useState<"pdf" | "stampa" | null>(null);

  const imposta = <K extends keyof DatiBudget>(campo: K, valore: DatiBudget[K]) => aggiorna((d) => ({ ...d, [campo]: valore }));
  const mesi = mesiDaInizio(dati.meseInizio);
  const indiceInizio = Number(dati.meseInizio.slice(0, 4)) * 12 + Number(dati.meseInizio.slice(5, 7)) - 1;
  const spostaInizio = (passo: number) => {
    const n = Math.min(ULTIMO_MESE, Math.max(PRIMO_MESE, indiceInizio + passo));
    imposta("meseInizio", `${Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, "0")}`);
  };
  const L = LUNGHEZZE_BUDGET;
  const autenticazione = regolePercorso.autenticazioneFirmaRcTicino;

  const conPdf = (azione: "pdf" | "stampa") => {
    void (async () => {
      setAttesa(azione);
      const pagina = { html: htmlBudget(dati, r, { oggiIso: oggiLocale() }), nomeFile: nomeFilePiano("budget"), orizzontale: true };
      try {
        if (azione === "pdf") await condividiPdfPiano(pagina);
        else await stampaPdfPiano(pagina);
      } catch {
        // Chiudere la stampa senza stampare non è un errore da mostrare.
        if (azione === "pdf") avvisa("PDF non creato", "Non sono riuscito a creare o condividere il PDF. Riprova tra poco.");
      } finally {
        setAttesa(null);
      }
    })();
  };

  return (
    <Schermata>
      <Testo attenuato>
        Dodici mesi di ricavi e costi, per vedere quando l&apos;attività si ripaga e quanta riserva ti serve per i mesi
        difficili. È una stima.
      </Testo>
      <NotaPiano strumento="budget" v={v} />

      {r.vuoto ? (
        <Scheda tenue>
          <Testo>Inserisci i ricavi previsti e i costi: qui vedrai il saldo mese per mese e il mese di pareggio.</Testo>
        </Scheda>
      ) : (
        <RiepilogoBudget r={r} />
      )}
      {Object.keys(errori).length > 0 ? (
        <Scheda style={{ borderColor: c.pericolo, borderWidth: 2 }}>
          <Testo accessibilityLiveRegion="polite">
            Alcuni campi non sono numeri validi: per ora li contiamo come zero. Correggili per un budget giusto.
          </Testo>
        </Scheda>
      ) : null}
      {!r.vuoto
        ? r.avvisi.map((a) => (
            <Scheda key={a.id} style={a.livello === "attenzione" ? { borderColor: c.accento, borderWidth: 2 } : undefined}>
              <Testo variante="forte">{a.titolo}</Testo>
              <Testo>{a.testo}</Testo>
              <ElencoFonti fonti={a.fonti} />
            </Scheda>
          ))
        : null}

      <Testo variante="sottotitolo">1. Da quando parti</Testo>
      <SceltaMese
        etichetta="Primo mese"
        valore={nomeMese(mesi[0])}
        onPrecedente={indiceInizio > PRIMO_MESE ? () => spostaInizio(-1) : null}
        onSuccessivo={indiceInizio < ULTIMO_MESE ? () => spostaInizio(1) : null}
      />
      <Scelta
        etichetta="La tua attività indipendente è"
        opzioni={SITUAZIONI}
        valore={dati.situazione}
        onCambia={(situazione) => imposta("situazione", situazione)}
      />

      <Testo variante="sottotitolo">2. Ricavi previsti, mese per mese</Testo>
      <Testo variante="piccolo" attenuato>
        Quanto pensi di incassare ogni mese, senza IVA. Nei primi mesi di solito si incassa meno: sii prudente.
      </Testo>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPAZIO.m }}>
        {mesi.map((m, i) => (
          <View key={m.etichetta} style={{ flexBasis: "45%", flexGrow: 1 }}>
            <CampoNumero
              etichetta={nomeMese(m)}
              prefisso="CHF"
              valore={dati.ricavi[i] ?? ""}
              onCambia={(valore) =>
                aggiorna((d) => ({ ...d, ricavi: d.ricavi.map((x, j) => (j === i ? valore.slice(0, L.importo) : x)) }))
              }
              errore={errori[`ricavi.${i}`]}
            />
          </View>
        ))}
      </View>
      <Pulsante
        titolo="Copia il primo mese in tutti i mesi"
        variante="secondario"
        icona="copy-outline"
        onPress={() => aggiorna((d) => ({ ...d, ricavi: d.ricavi.map(() => d.ricavi[0]) }))}
      />

      <Testo variante="sottotitolo">3. Costi di avvio (una volta sola)</Testo>
      <Testo variante="piccolo" attenuato>
        Quello che compri o paghi per partire. Scegli in che mese lo paghi.
      </Testo>
      <VociBudget
        righe={dati.costiAvvio}
        errori={errori}
        chiaveErrore="costiAvvio"
        etichettaImporto="Importo"
        mesi={mesi.map((m) => m.etichetta)}
        massimoVoci={L.righe}
        lunghezze={L}
        onCambia={(costiAvvio) => imposta("costiAvvio", costiAvvio)}
        nuova={() => ({ id: nuovoIdVoce(), descrizione: "", importo: "", mese: 0 })}
      />
      <Scheda>
        <RigaCasella
          etichetta={`Mi iscrivo al registro di commercio (${importo(costoIscrizioneRegistro(), 0)} nel primo mese)`}
          spuntata={dati.iscrizioneRegistro}
          onCambia={(si) => imposta("iscrizioneRegistro", si)}
        />
        <Testo variante="piccolo" attenuato>
          Facoltativa sotto {importo(regole.sogliaRegistroCommercio.valore, 0)} di cifra d&apos;affari annua.{" "}
          {importo(tasseRegistroCommercio.valore.stimaTitolareConFirma, 0)} di tasse per il titolare con firma individuale +{" "}
          {importo(autenticazione.valore, 0)} per l&apos;autenticazione della firma. {autenticazione.nota} Dal notaio al massimo{" "}
          {importo(regoleRegistro.autenticazioneFirmaNotaioMassimoFranchi.valore, 0)}.
        </Testo>
        <ElencoFonti
          fonti={[
            fonti.co931,
            tasseRegistroCommercio.fonte,
            autenticazione.fonte,
            regoleRegistro.autenticazioneFirmaNotaioMassimoFranchi.fonte,
          ]}
        />
      </Scheda>

      <Testo variante="sottotitolo">4. Costi fissi, al mese</Testo>
      <Testo variante="piccolo" attenuato>
        Si pagano ogni mese anche se incassi poco. Lascia vuoto quello che non hai.
      </Testo>
      <VociBudget
        righe={dati.costiFissi}
        errori={errori}
        chiaveErrore="costiFissi"
        etichettaImporto="Al mese"
        massimoVoci={L.righe}
        lunghezze={L}
        onCambia={(costiFissi) => imposta("costiFissi", costiFissi)}
        nuova={() => ({ id: nuovoIdVoce(), descrizione: "", importo: "" })}
      />

      <Testo variante="sottotitolo">5. Costi variabili, prelievi e riserve</Testo>
      <CampoNumero
        etichetta="Costi variabili (% dei ricavi)"
        aiuto="Costi che crescono con le vendite: materiale, merce, commissioni."
        valore={dati.costiVariabiliPercento}
        onCambia={(x) => imposta("costiVariabiliPercento", x.slice(0, L.importo))}
        errore={errori.costiVariabiliPercento}
      />
      <CampoNumero
        etichetta="Prelievi privati al mese"
        prefisso="CHF"
        aiuto="Quello che prendi per vivere: affitto, cassa malati, spesa…"
        valore={dati.prelieviMensili}
        onCambia={(x) => imposta("prelieviMensili", x.slice(0, L.importo))}
        errore={errori.prelieviMensili}
      />
      <CampoNumero
        etichetta="Riserva per le imposte (%)"
        aiuto="Percentuale del risultato dopo i contributi, scelta da te. Lascia vuoto se non vuoi contarla."
        valore={dati.riservaImpostePercento}
        onCambia={(x) => imposta("riservaImpostePercento", x.slice(0, L.importo))}
        errore={errori.riservaImpostePercento}
      />
      <Testo variante="piccolo" attenuato>
        Per farti un&apos;idea delle imposte:
      </Testo>
      <ElencoFonti fonti={[fontiStrumenti.afcCalcolatoreImposte]} />

      {!r.vuoto ? (
        <>
          <Testo variante="sottotitolo">Il tuo primo anno</Testo>
          <MesiBudget r={r} />
          <ContributiBudget r={r} />
          {PDF_DISPONIBILE ? (
            <View style={{ gap: SPAZIO.s }}>
              <Pulsante
                titolo="Condividi il PDF"
                icona="share-outline"
                caricamento={attesa === "pdf"}
                disabilitato={attesa !== null}
                onPress={() => conPdf("pdf")}
              />
              <Pulsante
                titolo="Stampa o guarda il PDF"
                variante="secondario"
                icona="print-outline"
                caricamento={attesa === "stampa"}
                disabilitato={attesa !== null}
                onPress={() => conPdf("stampa")}
              />
            </View>
          ) : (
            <Testo variante="piccolo" attenuato>
              Il PDF si crea nell&apos;app sul telefono.
            </Testo>
          )}
        </>
      ) : null}

      <RicominciaPiano strumento="budget" v={v} />
      <NotaInformazione />
      <ElencoFonti fonti={[fonti.albofiduciari]} />
    </Schermata>
  );
}
