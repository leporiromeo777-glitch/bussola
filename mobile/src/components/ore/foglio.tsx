import type { ReactNode } from "react";
import { Modal, ScrollView, View } from "react-native";
import { Pulsante, Testo } from "~/components/ui";
import { SPAZIO, useColori } from "~/lib/tema";

/** Foglio che sale dal basso (come la modifica di un movimento nei conti). */
export function Foglio({
  visibile,
  titolo,
  onChiudi,
  children,
}: {
  visibile: boolean;
  titolo: string;
  onChiudi: () => void;
  children: ReactNode;
}) {
  const c = useColori();
  return (
    <Modal visible={visibile} animationType="slide" presentationStyle="pageSheet" onRequestClose={onChiudi}>
      {visibile ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: c.sfondo }}
          contentContainerStyle={{ padding: SPAZIO.l, paddingBottom: SPAZIO.xxl * 2, gap: SPAZIO.l }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPAZIO.m }}>
            <Testo variante="titolo" style={{ flex: 1 }}>
              {titolo}
            </Testo>
            <Pulsante titolo="Chiudi" variante="testo" onPress={onChiudi} />
          </View>
          {children}
        </ScrollView>
      ) : null}
    </Modal>
  );
}
