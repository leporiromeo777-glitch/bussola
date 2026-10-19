import { router } from "expo-router";
import { View } from "react-native";
import { apriSito } from "~/lib/apri";
import { SPAZIO } from "~/lib/tema";
import { RigaMenu, Scheda, Separatore, Testo } from "./ui";

/**
 * Calcoli e strumenti nell'app (tariffa oraria, contributi AVS, preventivo e
 * fattura, «Fotografa la lettera») e quelli che stanno sul sito. Questi si
 * aprono nel browser del telefono (apriSito), dove ci sono già i dati salvati
 * dal sito.
 */
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
        <Separatore />
        <RigaMenu
          titolo="Fotografa la lettera"
          sottotitolo="Una lettera di un ufficio? Bleo ti spiega cos'è, cosa ti chiedono e entro quando"
          icona="mail-open-outline"
          onPress={() => router.push("/strumenti/lettera")}
        />
      </Scheda>
      <Testo variante="etichetta" attenuato style={{ marginTop: SPAZIO.s }}>
        SUL SITO
      </Testo>
      <Testo variante="piccolo" attenuato>
        Si aprono nel browser del telefono, con i dati che hai già salvato lì.
      </Testo>
      <Scheda>
        <RigaMenu
          titolo="Budget del primo anno"
          icona="bar-chart-outline"
          esterno
          onPress={() => void apriSito("/strumenti/budget")}
        />
        <Separatore />
        <RigaMenu
          titolo="Business plan di una pagina"
          icona="document-text-outline"
          esterno
          onPress={() => void apriSito("/strumenti/business-plan")}
        />
        <Separatore />
        <RigaMenu
          titolo="Fondare una Sagl"
          sottotitolo="Per chi parte con dei soci: scheda per il notaio e bozza dello statuto"
          icona="people-outline"
          esterno
          onPress={() => void apriSito("/strumenti/sagl")}
        />
        <Separatore />
        <RigaMenu
          titolo="Nome della ditta"
          sottotitolo="Idee con il tuo cognome e un primo controllo nel registro di commercio"
          icona="pricetag-outline"
          esterno
          onPress={() => void apriSito("/strumenti/nome")}
        />
        <Separatore />
        <RigaMenu
          titolo="Testi pronti"
          sottotitolo="Bio per Instagram, prima email a un cliente, la tua attività in breve"
          icona="chatbox-ellipses-outline"
          esterno
          onPress={() => void apriSito("/strumenti/testi")}
        />
      </Scheda>
    </View>
  );
}
