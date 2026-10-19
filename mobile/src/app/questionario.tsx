import { Stack, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Bozza } from "@/lib/percorso/bozza";
import { indiceDiRipresa } from "@/lib/percorso/bozza";
import { DOMANDE, type Opzione } from "@/lib/percorso/domande";
import { esitoRevisione, prossimaDaRispondere } from "@/lib/percorso/racconto-revisione";
import {
  LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO,
  leggiRisposte,
  VERSIONE_RISPOSTE,
  type IdDomanda,
  type Risposte,
} from "@/lib/percorso/risposte";
import { NotaSalvataggioQuestionario } from "~/components/percorso-account";
import { AvvisoDaRacconto, IngressoRacconto } from "~/components/racconto/ingresso";
import { Racconto } from "~/components/racconto/racconto";
import { BarraProgresso, Pulsante, Schermata, Testo, tocco } from "~/components/ui";
import { useRaccontoAttivo } from "~/lib/racconto";
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
  // «Racconta a Bleo»: aperto, e se le risposte vengono dal racconto (allora «Avanti» salta quelle già date).
  const [racconto, setRacconto] = useState(false);
  const [daRacconto, setDaRacconto] = useState(false);
  const [raccontoAttivo, setRaccontoAttivo] = useRaccontoAttivo();

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
      aggiorna(daRacconto ? prossimaDaRispondere(indice, bozza) : indice + 1, bozza);
      return;
    }
    const risposte = leggiRisposte({ versione: VERSIONE_RISPOSTE, ...bozza });
    if (!risposte) {
      // Manca una risposta: torna alla prima senza risposta.
      aggiorna(indiceDiRipresa(DOMANDE.length - 1, bozza), bozza);
      return;
    }
    concludi(risposte);
  }

  /** Fine del questionario: salva le risposte e apre il percorso (anche da «Racconta a Bleo»). */
  function concludi(risposte: Risposte) {
    salvaRisposte(risposte);
    cancellaBozza();
    router.replace("/percorso");
  }

  /** Le risposte confermate in «Racconta a Bleo» entrano nel questionario come se le avessi date tu. */
  function confermaRacconto(confermata: Bozza) {
    setRacconto(false);
    const esito = esitoRevisione(confermata);
    if (esito.completa) {
      concludi(esito.risposte);
      return;
    }
    setDaRacconto(true);
    aggiorna(esito.indice, confermata);
  }

  if (racconto) {
    return (
      <Racconto
        bozzaAttuale={bozza}
        attivo={raccontoAttivo}
        onNonAttivo={() => setRaccontoAttivo(false)}
        onConferma={confermaRacconto}
        onDomande={() => setRacconto(false)}
      />
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.sfondo }}>
      <Stack.Screen options={{ title: "Questionario" }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Schermata>
          {daRacconto ? (
            <AvvisoDaRacconto />
          ) : indice === 0 ? (
            <IngressoRacconto attivo={raccontoAttivo} onApri={() => setRacconto(true)} />
          ) : null}
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
          <NotaSalvataggioQuestionario />
        </Schermata>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
