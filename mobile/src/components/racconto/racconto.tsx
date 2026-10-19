/**
 * «Racconta a Bleo» nel questionario dell'app, come sul sito
 * (src/app/questionario/racconto.tsx): scrivi o detti la tua idea, Bleo
 * propone le risposte (POST /api/racconta), tu le controlli e le correggi.
 * Le risposte confermate tornano al questionario con `onConferma`, che le
 * salva con le sue stesse funzioni: questa schermata non scrive niente sul
 * telefono. Il testo resta solo qui finché non chiudi.
 */
import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, BackHandler, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Bozza } from "@/lib/percorso/bozza";
import { controllaTestoRacconto, unisciRacconto } from "@/lib/percorso/racconto-revisione";
import { ImmagineMascotte } from "~/components/mascotte";
import { RevisioneRacconto } from "~/components/racconto/revisione";
import { ScriviRacconto } from "~/components/racconto/scrivi";
import { Pulsante, Schermata, Scheda, Testo } from "~/components/ui";
import { inviaRacconto } from "~/lib/racconto";
import { SPAZIO, useColori } from "~/lib/tema";

type Controllo = { riassunto: string; proposta: Bozza; bozza: Bozza };

export function Racconto({
  bozzaAttuale,
  attivo,
  onNonAttivo,
  onConferma,
  onDomande,
}: {
  /** Le risposte già date nel questionario: quelle che il racconto non dice restano. */
  bozzaAttuale: Bozza;
  /** La funzione è attiva sul sito? false: modalità demo; null: non si sa. */
  attivo: boolean | null;
  onNonAttivo: () => void;
  onConferma: (bozza: Bozza) => void;
  onDomande: () => void;
}) {
  const c = useColori();
  const [testo, setTesto] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [controllo, setControllo] = useState<Controllo | null>(null);
  const invio = useRef<AbortController | null>(null);

  // Chiudendo la schermata si interrompe anche la lettura in corso.
  useEffect(() => () => invio.current?.abort(), []);

  // Tasto Indietro di Android: dal controllo torna al testo, dal testo alle domande.
  useEffect(() => {
    const iscrizione = BackHandler.addEventListener("hardwareBackPress", () => {
      if (inCorso) return true;
      if (controllo) setControllo(null);
      else onDomande();
      return true;
    });
    return () => iscrizione.remove();
  }, [controllo, inCorso, onDomande]);

  async function invia() {
    if (inCorso) return;
    const verifica = controllaTestoRacconto(testo);
    if (!verifica.ok) {
      setErrore(verifica.messaggio);
      return;
    }
    setErrore(null);
    setInCorso(true);
    const segnale = new AbortController();
    invio.current = segnale;
    const esito = await inviaRacconto(verifica.testo, segnale.signal);
    invio.current = null;
    if (segnale.signal.aborted) return;
    setInCorso(false);
    if (esito.ok) {
      const { bozza: proposta, riassunto } = esito.racconto;
      setControllo({ riassunto, proposta, bozza: unisciRacconto(bozzaAttuale, proposta) });
      AccessibilityInfo.announceForAccessibility(`${riassunto} Controlla le risposte proposte.`);
      return;
    }
    if ("annullato" in esito) return;
    setErrore(esito.messaggio);
    // Il sito dice che la funzione è spenta: si mostra il riquadro «non ancora attivo».
    if (esito.motivo === "non_attivo") onNonAttivo();
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.sfondo }}>
      <Stack.Screen options={{ title: "Racconta a Bleo" }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Una schermata nuova per ogni passo: si riparte dall'alto. */}
        <Schermata key={attivo === false ? "spento" : controllo ? "controllo" : "testo"}>
          {attivo === false ? (
            <NonAttivo onDomande={onDomande} />
          ) : controllo ? (
            <RevisioneRacconto
              riassunto={controllo.riassunto}
              proposta={controllo.proposta}
              bozza={controllo.bozza}
              onCambia={(bozza) => setControllo({ ...controllo, bozza })}
              onConferma={() => onConferma(controllo.bozza)}
              onRiscrivi={() => setControllo(null)}
              onDomande={onDomande}
            />
          ) : (
            <ScriviRacconto
              testo={testo}
              onCambia={(t) => {
                setTesto(t);
                if (errore) setErrore(null);
              }}
              inCorso={inCorso}
              errore={errore}
              onInvia={() => void invia()}
              onDomande={onDomande}
            />
          )}
        </Schermata>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function NonAttivo({ onDomande }: { onDomande: () => void }) {
  return (
    <Scheda style={{ alignItems: "center", gap: SPAZIO.m }}>
      <ImmagineMascotte nome="pensa" larghezza={96} />
      <Testo variante="sottotitolo" style={{ textAlign: "center" }}>
        «Racconta a Bleo» non è ancora attivo
      </Testo>
      <Testo attenuato style={{ textAlign: "center" }} accessibilityLiveRegion="polite">
        Presto potrai raccontare la tua idea con parole tue. Per ora rispondi alle domande: ci vogliono pochi minuti.
      </Testo>
      <Pulsante titolo="Rispondi alle domande" icona="arrow-forward" onPress={onDomande} style={{ alignSelf: "stretch" }} />
    </Scheda>
  );
}
