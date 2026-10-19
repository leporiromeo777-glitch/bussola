/** Il messaggio di errore di «Racconta a Bleo» (rete assente, limite raggiunto, testo troppo corto…). */
import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";
import { Testo } from "~/components/ui";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export function MessaggioRacconto({ testo }: { testo: string }) {
  const c = useColori();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={{
        flexDirection: "row",
        gap: SPAZIO.s,
        padding: SPAZIO.m,
        borderRadius: RAGGIO.m,
        borderWidth: 1.5,
        borderColor: c.pericolo,
        backgroundColor: c.scheda,
      }}
    >
      <Ionicons name="alert-circle-outline" size={20} color={c.pericolo} style={{ marginTop: 1 }} />
      <Testo variante="forte" colore={c.pericolo} style={{ flex: 1 }}>
        {testo}
      </Testo>
    </View>
  );
}
