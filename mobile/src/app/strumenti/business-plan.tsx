import { router } from "expo-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { AccessibilityInfo, View } from "react-native";
import { fonti } from "@/data/svizzera";
import { CHIAVI_ARCHIVIO, decodifica } from "@/lib/strumenti/archivio";
import { calcolaBudget } from "@/lib/strumenti/budget";
import {
  CAMPI_PIANO,
  campiCompilati,
  campiTroppoLunghi,
  LUNGHEZZA_NOME_PIANO,
  MASSIMO_ASSOLUTO,
  statoLunghezza,
  testoCostiDaBudget,
  testoPrezzoDaTariffa,
  testoRicaviDaBudget,
  type CampoPiano,
} from "@/lib/strumenti/business-plan";
import { htmlBusinessPlan, nomeFilePiano } from "@/lib/strumenti/stampa-piani";
import { calcolaTariffa, datiTariffaIniziali, schemaDatiTariffa } from "@/lib/strumenti/tariffa";
import { CampoTesto } from "~/components/campi";
import { Foglio } from "~/components/ore/foglio";
import { FoglioPiano } from "~/components/piani/foglio-piano";
import { AttesaPiano, ErrorePiano, NotaPiano, RicominciaPiano } from "~/components/piani/stato";
import { ElencoFonti, NotaInformazione, Pulsante, Schermata, Scheda, Testo } from "~/components/ui";
import { avvisa, chiediConferma } from "~/lib/conferma";
import { iscriviti, leggi } from "~/lib/memoria";
import { condividiPdfPiano, PDF_DISPONIBILE, stampaPdfPiano, usePiano, type VistaPiano } from "~/lib/piani";
import { oggiLocale } from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";

/**
 * «Business plan di una pagina»: undici domande guidate, con esempi, per un
 * foglio A4 da condividere in PDF. Senza accesso resta sul telefono; con
 * l'accesso sta nell'account, come sul sito. Prezzo, costi e ricavi si
 * possono prendere dalla tariffa (sul telefono) e dal budget.
 */
export default function BusinessPlan() {
  const v = usePiano("business-plan");
  if (v.modo === "attesa") return <AttesaPiano strumento="business-plan" />;
  if (v.modo === "errore") return <ErrorePiano strumento="business-plan" v={v} />;
  return <ModuloPiano v={v} />;
}

/** I testi da importare in prezzo, costi e ricavi (solo dagli strumenti già compilati). */
function useImportabili(sulTelefono: boolean): Partial<Record<CampoPiano, string>> {
  const tariffaGrezza = useSyncExternalStore(
    iscriviti,
    () => leggi(CHIAVI_ARCHIVIO.tariffa),
    () => null,
  );
  // Il budget sta dove sta il business plan: nell'account o sul telefono.
  const budget = usePiano("budget", { soloTelefono: sulTelefono });
  const pronto = budget.modo === "telefono" || budget.modo === "account";
  const datiBudget = pronto && budget.presente ? budget.dati : null;
  return useMemo(() => {
    const voci: Partial<Record<CampoPiano, string>> = {};
    if (tariffaGrezza !== null) {
      const t = calcolaTariffa(decodifica(tariffaGrezza, schemaDatiTariffa, () => datiTariffaIniziali(oggiLocale())));
      if (t.ok) voci.prezzo = testoPrezzoDaTariffa(t.risultato);
    }
    if (datiBudget) {
      const b = calcolaBudget(datiBudget).risultato;
      if (!b.vuoto) {
        voci.costi = testoCostiDaBudget(b, datiBudget);
        voci.ricavi = testoRicaviDaBudget(b);
      }
    }
    return voci;
  }, [tariffaGrezza, datiBudget]);
}

function ModuloPiano({ v }: { v: Extract<VistaPiano<"business-plan">, { modo: "telefono" | "account" }> }) {
  const c = useColori();
  const { dati, aggiorna } = v;
  const importabili = useImportabili(v.modo === "telefono");
  const [anteprima, setAnteprima] = useState(false);
  const [attesa, setAttesa] = useState<"pdf" | "stampa" | null>(null);

  const compilati = campiCompilati(dati);
  const lunghi = campiTroppoLunghi(dati);
  const impostaCampo = (id: CampoPiano, valore: string) => aggiorna((d) => ({ ...d, campi: { ...d.campi, [id]: valore } }));

  const importa = (id: CampoPiano, testo: string, titolo: string) => {
    const fatto = () => {
      impostaCampo(id, testo);
      AccessibilityInfo.announceForAccessibility(`Testo importato in «${titolo}».`);
    };
    const attuale = dati.campi[id].trim();
    if (!attuale || attuale === testo) return fatto();
    chiediConferma({
      titolo: `Sostituire «${titolo}»?`,
      messaggio: "Il campo ha già del testo. Lo sostituisco con i numeri importati?",
      conferma: "Sostituisci",
      onConferma: fatto,
    });
  };

  const conPdf = (azione: "pdf" | "stampa") => {
    const esegui = async () => {
      setAttesa(azione);
      const pagina = { html: htmlBusinessPlan(dati, { oggiIso: oggiLocale() }), nomeFile: nomeFilePiano("business-plan", dati.nomeAttivita) };
      try {
        if (azione === "pdf") await condividiPdfPiano(pagina);
        else await stampaPdfPiano(pagina);
      } catch {
        if (azione === "pdf") avvisa("PDF non creato", "Non sono riuscito a creare o condividere il PDF. Riprova tra poco.");
      } finally {
        setAttesa(null);
      }
    };
    if (lunghi.length === 0) return void esegui();
    chiediConferma({
      titolo: "Alcune risposte sono lunghe",
      messaggio: "Sono più lunghe del consigliato: nel PDF potrebbero non stare su una pagina. Vuoi crearlo lo stesso?",
      conferma: "Crea il PDF",
      onConferma: () => void esegui(),
    });
  };

  const pulsantiPdf = PDF_DISPONIBILE ? (
    <View style={{ gap: SPAZIO.s }}>
      <Pulsante titolo="Condividi il PDF" icona="share-outline" caricamento={attesa === "pdf"} disabilitato={attesa !== null} onPress={() => conPdf("pdf")} />
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
  );

  return (
    <Schermata>
      <Testo attenuato>
        Rispondi a undici domande con frasi brevi. Ne esce un foglio A4 da mostrare a chi ti può aiutare: una banca, un ente di
        sostegno, un socio.
      </Testo>
      <NotaPiano strumento="business-plan" v={v} />

      <Scheda>
        <Testo variante="sottotitolo">La tua attività</Testo>
        <CampoTesto
          etichetta="Nome dell'attività"
          valore={dati.nomeAttivita}
          onCambia={(x) => aggiorna((d) => ({ ...d, nomeAttivita: x }))}
          segnaposto="Per esempio: Siti Rossi"
          aiuto="Il nome di una ditta individuale deve contenere il tuo cognome."
          massimo={LUNGHEZZA_NOME_PIANO}
        />
        <ElencoFonti fonti={[fonti.co945]} />
        <CampoTesto
          etichetta="Nome e cognome"
          valore={dati.titolare}
          onCambia={(x) => aggiorna((d) => ({ ...d, titolare: x }))}
          maiuscole="words"
          massimo={LUNGHEZZA_NOME_PIANO}
        />
      </Scheda>

      <Testo variante="piccolo" attenuato>
        {compilati} di {CAMPI_PIANO.length} domande compilate. Scrivi frasi brevi: tutto deve stare su una pagina.
      </Testo>
      {Object.keys(importabili).length === 0 ? (
        <Scheda tenue>
          <Testo variante="piccolo">Compila la tariffa o il budget per importare i numeri qui.</Testo>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPAZIO.s }}>
            <Pulsante titolo="Tariffa oraria" variante="testo" icona="time-outline" onPress={() => router.push("/strumenti/tariffa")} />
            <Pulsante titolo="Budget" variante="testo" icona="bar-chart-outline" onPress={() => router.push("/strumenti/budget")} />
          </View>
        </Scheda>
      ) : null}

      {CAMPI_PIANO.map((campo) => {
        const stato = statoLunghezza(dati.campi[campo.id], campo.consigliati);
        const daImportare = importabili[campo.id];
        return (
          <Scheda key={campo.id} evidenziata={campo.id === "idea"}>
            <CampoTesto
              etichetta={campo.titolo}
              valore={dati.campi[campo.id]}
              onCambia={(x) => impostaCampo(campo.id, x)}
              aiuto={campo.domanda}
              segnaposto={`Esempio: ${campo.esempio}`}
              righe={campo.righe}
              massimo={campo.consigliati * MASSIMO_ASSOLUTO}
            />
            <Testo
              variante="piccolo"
              colore={stato.stato === "lungo" ? c.pericolo : stato.stato === "quasi" ? c.accento : c.attenuato}
              accessibilityLabel={`${stato.caratteri} caratteri su ${stato.consigliati} consigliati${stato.stato === "lungo" ? ": troppo lungo per una pagina" : ""}`}
            >
              {stato.caratteri} / {stato.consigliati} caratteri
              {stato.stato === "lungo" ? ": troppo lungo per una pagina" : ""}
            </Testo>
            {daImportare ? (
              <Pulsante
                titolo={`Usa i numeri ${campo.id === "prezzo" ? "della tariffa" : "del budget"}`}
                variante="secondario"
                icona="download-outline"
                onPress={() => importa(campo.id, daImportare, campo.titolo)}
              />
            ) : null}
          </Scheda>
        );
      })}

      {lunghi.length > 0 ? (
        <Testo variante="piccolo" colore={c.pericolo}>
          Alcune risposte sono più lunghe del consigliato: nel PDF potrebbero non stare su una pagina.
        </Testo>
      ) : null}
      <Pulsante titolo="Anteprima della pagina" variante="secondario" icona="eye-outline" onPress={() => setAnteprima(true)} />
      {pulsantiPdf}

      <RicominciaPiano strumento="business-plan" v={v} />
      <NotaInformazione />

      <Foglio visibile={anteprima} titolo="Anteprima" onChiudi={() => setAnteprima(false)}>
        <FoglioPiano dati={dati} oggiIso={oggiLocale()} />
        {pulsantiPdf}
      </Foglio>
    </Schermata>
  );
}
