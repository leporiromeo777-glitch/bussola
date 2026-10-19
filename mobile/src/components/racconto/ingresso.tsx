/**
 * L'invito a «Racconta a Bleo» in cima alla prima domanda del questionario,
 * e l'avviso che compare dopo, quando il questionario riparte con le
 * risposte confermate.
 */
import { View } from "react-native";
import { ImmagineMascotte } from "~/components/mascotte";
import { Pulsante, Scheda, Testo } from "~/components/ui";
import { SPAZIO } from "~/lib/tema";

/** `attivo` false: la funzione è spenta sul sito (modalità demo); null: non si sa, si lascia provare. */
export function IngressoRacconto({ attivo, onApri }: { attivo: boolean | null; onApri: () => void }) {
  return (
    <Scheda tenue style={{ gap: SPAZIO.m }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <ImmagineMascotte nome="pensa" larghezza={64} />
        {attivo === false ? (
          <View style={{ flex: 1, gap: 2 }} accessibilityLiveRegion="polite">
            <Testo variante="forte">«Racconta a Bleo» arriva presto</Testo>
            <Testo variante="piccolo" attenuato>
              Potrai scrivere o dettare la tua idea e Bleo proporrà le risposte. Per ora rispondi alle domande qui sotto:
              ci vogliono pochi minuti.
            </Testo>
          </View>
        ) : (
          <View style={{ flex: 1, gap: 2 }}>
            <Testo variante="forte">Preferisci raccontarlo con parole tue?</Testo>
            <Testo variante="piccolo" attenuato>
              Scrivi o detta la tua idea: Bleo propone le risposte, tu le controlli e ti chiede solo quello che manca.
            </Testo>
          </View>
        )}
      </View>
      {attivo === false ? null : (
        <Pulsante
          titolo="Racconta a Bleo"
          icona="chatbubble-ellipses-outline"
          onPress={onApri}
          suggerimento="Scrivi o detta la tua idea invece di rispondere alle domande una per una"
        />
      )}
    </Scheda>
  );
}

/** Dopo la conferma, se mancano ancora delle risposte. */
export function AvvisoDaRacconto() {
  return (
    <Scheda tenue>
      <Testo variante="piccolo">
        Ho messo nel questionario le risposte che hai confermato: ti chiedo solo quelle che mancano. Con «Indietro» puoi
        ricontrollarle e correggerle.
      </Testo>
    </Scheda>
  );
}
