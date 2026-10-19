import { router } from "expo-router";
import { View } from "react-native";
import { SPAZIO } from "~/lib/tema";
import { RigaMenu, Scheda, Separatore } from "./ui";

/**
 * Calcoli e strumenti nell'app: tariffa oraria, contributi AVS, preventivo e
 * fattura, «Fotografa la lettera», nome della ditta, testi pronti, Fondare
 * una Sagl, budget del primo anno e business plan di una pagina.
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
        <Separatore />
        <RigaMenu
          titolo="Nome della ditta"
          sottotitolo="Idee con il tuo cognome e un primo controllo nel registro di commercio"
          icona="pricetag-outline"
          onPress={() => router.push("/strumenti/nome")}
        />
        <Separatore />
        <RigaMenu
          titolo="Testi pronti"
          sottotitolo="Bio per Instagram, prima email a un cliente, la tua attività in breve"
          icona="chatbox-ellipses-outline"
          onPress={() => router.push("/strumenti/testi")}
        />
        <Separatore />
        <RigaMenu
          titolo="Fondare una Sagl"
          sottotitolo="Per chi parte con dei soci: scheda per il notaio e bozza dello statuto"
          icona="people-outline"
          onPress={() => router.push("/strumenti/sagl")}
        />
        <Separatore />
        <RigaMenu
          titolo="Budget del primo anno"
          sottotitolo="Ricavi e costi mese per mese, mese di pareggio, PDF da condividere"
          icona="bar-chart-outline"
          onPress={() => router.push("/strumenti/budget")}
        />
        <Separatore />
        <RigaMenu
          titolo="Business plan di una pagina"
          sottotitolo="Undici domande guidate per un foglio A4 in PDF"
          icona="document-text-outline"
          onPress={() => router.push("/strumenti/business-plan")}
        />
      </Scheda>
    </View>
  );
}
