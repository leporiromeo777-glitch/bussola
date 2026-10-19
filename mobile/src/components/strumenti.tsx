import { router } from "expo-router";
import { View } from "react-native";
import { apriSito } from "~/lib/apri";
import { SPAZIO } from "~/lib/tema";
import { RigaMenu, Scheda, Separatore, Testo } from "./ui";

/** Calcoli e strumenti nell'app (tariffa oraria, contributi AVS, preventivo e fattura) e quelli che si aprono sul sito. */
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
        <Separatore />
        <RigaMenu
          titolo="Preventivo e fattura"
          sottotitolo="Con il codice QR, in PDF da mandare al cliente (serve l'accesso)"
          icona="receipt-outline"
          onPress={() => router.push("/fatture")}
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
      </Scheda>
    </View>
  );
}
