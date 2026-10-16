/** Titolo e pulsanti in alto nella scheda «Chiedi a Bleo». */
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text } from "react-native";
import { tocco, type NomeIcona } from "~/components/ui";
import { useChatAperta } from "~/lib/chat";
import { SPAZIO, useColori } from "~/lib/tema";

/** «Bleo», oppure il titolo della chat aperta (su una riga). */
export function TitoloChat() {
  const c = useColori();
  const { titolo } = useChatAperta();
  return (
    <Text
      numberOfLines={1}
      accessibilityRole="header"
      style={{ color: c.testo, fontSize: 17, fontWeight: "600", maxWidth: 240, textAlign: "center" }}
    >
      {titolo || "Bleo"}
    </Text>
  );
}

export function PulsanteIntestazione({
  icona,
  etichetta,
  onPress,
}: {
  icona: NomeIcona;
  etichetta: string;
  onPress: () => void;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={() => {
        tocco();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={etichetta}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: SPAZIO.xs,
        borderRadius: 22,
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <Ionicons name={icona} size={24} color={c.testo} />
    </Pressable>
  );
}
