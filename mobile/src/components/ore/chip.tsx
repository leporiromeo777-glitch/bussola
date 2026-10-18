import { Pressable, View } from "react-native";
import { Testo, tocco } from "~/components/ui";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

/** Una fila di scelte rapide (durate, giorni): pulsanti a pillola alti almeno 44 punti. */
export function RigaChip({
  etichetta,
  opzioni,
  attiva,
  onScegli,
}: {
  etichetta: string;
  opzioni: readonly { chiave: string; testo: string }[];
  attiva?: string | null;
  onScegli: (chiave: string) => void;
}) {
  const c = useColori();
  return (
    <View accessibilityLabel={etichetta} style={{ flexDirection: "row", flexWrap: "wrap", gap: SPAZIO.s }}>
      {opzioni.map((o) => {
        const scelta = o.chiave === attiva;
        return (
          <Pressable
            key={o.chiave}
            onPress={() => {
              tocco();
              onScegli(o.chiave);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: scelta }}
            accessibilityLabel={`${etichetta}: ${o.testo}`}
            style={({ pressed }) => ({
              minHeight: 44,
              minWidth: 44,
              justifyContent: "center",
              paddingHorizontal: SPAZIO.m,
              borderRadius: RAGGIO.pillola,
              borderWidth: 1.5,
              borderColor: scelta ? c.marchio : c.bordo,
              backgroundColor: scelta ? c.marchioTenue : c.scheda,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Testo variante="forte" colore={scelta ? c.marchio : c.testo}>
              {o.testo}
            </Testo>
          </Pressable>
        );
      })}
    </View>
  );
}
