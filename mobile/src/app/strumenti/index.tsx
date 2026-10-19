import { View } from "react-native";
import { ImmagineMascotte } from "~/components/mascotte";
import { ElencoStrumenti } from "~/components/strumenti";
import { Schermata, Testo } from "~/components/ui";
import { SPAZIO } from "~/lib/tema";

/** Calcoli e strumenti: si apre dalla pagina Conti e dalla pagina iniziale. */
export default function Strumenti() {
  return (
    <Schermata>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <ImmagineMascotte nome="scrivania" larghezza={96} />
        <Testo attenuato style={{ flex: 1 }}>
          Calcoli veloci con i numeri ufficiali: restano su questo telefono. Preventivi e fatture si salvano nel tuo account.
        </Testo>
      </View>
      <ElencoStrumenti />
    </Schermata>
  );
}
