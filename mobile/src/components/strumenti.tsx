import { router } from "expo-router";
import { View } from "react-native";
import { apriSito } from "~/lib/apri";
import { SPAZIO } from "~/lib/tema";
import { RigaMenu, Scheda, Separatore, Testo } from "./ui";

/** Calcoli nell'app (tariffa oraria, contributi AVS) e strumenti che si aprono sul sito. */
export function ElencoStrumenti() {
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Scheda>
        <RigaMenu
          titolo="Tariffa oraria"
          sottotitolo="Quanto chiedere all'ora per arrivare al reddito che ti serve"
          icona="time-outline"
          onPress={() => router.push("/strumenti/tariffa")}
        />
        <Separatore />
        <RigaMenu
          titolo="Contributi AVS"
          sottotitolo="Quanto paghi di AVS, AI e IPG come indipendente in Ticino"
          icona="shield-checkmark-outline"
          onPress={() => router.push("/strumenti/contributi")}
        />
      </Scheda>
      <Testo variante="etichetta" attenuato style={{ marginTop: SPAZIO.s }}>
        SUL SITO
      </Testo>
      <Scheda>
        <RigaMenu
          titolo="Budget dei primi 12 mesi"
          icona="bar-chart-outline"
          esterno
          onPress={() => void apriSito("/strumenti/budget")}
        />
        <Separatore />
        <RigaMenu
          titolo="Business plan"
          icona="document-text-outline"
          esterno
          onPress={() => void apriSito("/strumenti/business-plan")}
        />
        <Separatore />
        <RigaMenu titolo="Preventivo" icona="create-outline" esterno onPress={() => void apriSito("/strumenti/preventivo")} />
        <Separatore />
        <RigaMenu
          titolo="Fattura con codice QR"
          icona="qr-code-outline"
          esterno
          onPress={() => void apriSito("/strumenti/fattura")}
        />
      </Scheda>
    </View>
  );
}
