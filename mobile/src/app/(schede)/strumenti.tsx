import { router } from "expo-router";
import { View } from "react-native";
import { ImmagineMascotte } from "~/components/mascotte";
import { RigaMenu, Schermata, Scheda, Separatore, Testo } from "~/components/ui";
import { apriSito } from "~/lib/apri";
import { SPAZIO } from "~/lib/tema";

export default function Strumenti() {
  return (
    <Schermata>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <ImmagineMascotte nome="scrivania" larghezza={96} />
        <Testo attenuato style={{ flex: 1 }}>
          Calcoli veloci con i numeri ufficiali. I dati restano su questo telefono.
        </Testo>
      </View>
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
      <Testo variante="sottotitolo">Sul sito</Testo>
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
    </Schermata>
  );
}
