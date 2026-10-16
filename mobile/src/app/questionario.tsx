import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Bozza } from "@/lib/percorso/bozza";
import { indiceDiRipresa } from "@/lib/percorso/bozza";
import { DOMANDE, type Opzione } from "@/lib/percorso/domande";
import {
  LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO,
  leggiRisposte,
  VERSIONE_RISPOSTE,
  type IdDomanda,
} from "@/lib/percorso/risposte";
import { BarraProgresso, Pulsante, Schermata, Testo, tocco } from "~/components/ui";
import { cancellaBozza, leggiBozza, salvaBozza, salvaRisposte } from "~/lib/stato";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

function statoIniziale(): { indice: number; bozza: Bozza } {
  const salvata = leggiBozza();
  if (!salvata) return { indice: 0, bozza: {} };
  return { indice: indiceDiRipresa(salvata.indice, salvata.bozza), bozza: salvata.bozza };
}

export default function Questionario() {
  const c = useColori();
  const [{ indice, bozza }, setStato] = useState(statoIniziale);
  const domanda = DOMANDE[indice];
  const scelta = bozza[domanda.id as IdDomanda];
  const ultima = indice === DOMANDE.length - 1;

  function aggiorna(indiceNuovo: number, bozzaNuova: Bozza) {
    setStato({ indice: indiceNuovo, bozza: bozzaNuova });
    salvaBozza({ indice: indiceNuovo, bozza: bozzaNuova });
  }

  function scegli(valore: string) {
    tocco();
    aggiorna(indice, { ...bozza, [domanda.id]: valore });
  }

  function avanti() {
    if (!ultima) {
      aggiorna(indice + 1, bozza);
      return;
    }
    const risposte = leggiRisposte({ versione: VERSIONE_RISPOSTE, ...bozza });
    if (!risposte) {
      // Manca una risposta: torna alla prima senza risposta.
      aggiorna(indiceDiRipresa(DOMANDE.length - 1, bozza), bozza);
      return;
    }
    salvaRisposte(risposte);
    cancellaBozza();
    router.replace("/percorso");
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.sfondo }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Schermata>
          <View style={{ gap: SPAZIO.s }}>
            <Testo variante="piccolo" attenuato>
              Domanda {indice + 1} di {DOMANDE.length}
            </Testo>
            <BarraProgresso fatti={indice} totale={DOMANDE.length} />
          </View>
          <Testo variante="titolo">{domanda.titolo}</Testo>
          <Testo attenuato>{domanda.perche}</Testo>

          <View accessibilityRole="radiogroup" style={{ gap: SPAZIO.s }}>
            {(domanda.opzioni as Opzione[]).map((o) => {
              const attiva = scelta === o.valore;
              return (
                <Pressable
                  key={o.valore}
                  onPress={() => scegli(o.valore)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: attiva }}
                  accessibilityLabel={o.aiuto ? `${o.etichetta}. ${o.aiuto}` : o.etichetta}
                  style={({ pressed }) => ({
                    borderRadius: RAGGIO.m,
                    borderWidth: attiva ? 2 : 1.5,
                    borderColor: attiva ? c.marchio : c.bordo,
                    backgroundColor: attiva ? c.marchioTenue : c.scheda,
                    padding: SPAZIO.l,
                    minHeight: 56,
                    justifyContent: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Testo variante="forte">{o.etichetta}</Testo>
                  {o.aiuto ? (
                    <Testo variante="piccolo" attenuato>
                      {o.aiuto}
                    </Testo>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {domanda.id === "attivita" && scelta === "altro" ? (
            <View style={{ gap: SPAZIO.xs }}>
              <Testo variante="forte">Descrivila in poche parole (facoltativo)</Testo>
              <TextInput
                value={bozza.attivitaAltro ?? ""}
                onChangeText={(t) => aggiorna(indice, { ...bozza, attivitaAltro: t.slice(0, LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO) })}
                maxLength={LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO}
                placeholder="Per esempio: noleggio di biciclette"
                placeholderTextColor={c.attenuato}
                accessibilityLabel="Descrizione dell'attività"
                style={{
                  borderWidth: 1.5,
                  borderColor: c.bordo,
                  borderRadius: RAGGIO.m,
                  padding: SPAZIO.m,
                  fontSize: 16,
                  color: c.testo,
                  backgroundColor: c.scheda,
                }}
              />
            </View>
          ) : null}

          <View style={{ flexDirection: "row", gap: SPAZIO.m }}>
            <Pulsante
              titolo={indice === 0 ? "Chiudi" : "Indietro"}
              variante="secondario"
              style={{ flex: 1 }}
              onPress={() => (indice === 0 ? router.back() : aggiorna(indice - 1, bozza))}
            />
            <Pulsante
              titolo={ultima ? "Vedi il percorso" : "Avanti"}
              disabilitato={!scelta}
              style={{ flex: 1 }}
              onPress={avanti}
            />
          </View>
          <Testo variante="piccolo" attenuato>
            Le risposte restano su questo telefono. Puoi chiudere e riprendere da dove eri.
          </Testo>
        </Schermata>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
