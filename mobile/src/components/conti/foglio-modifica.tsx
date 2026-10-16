import { Modal, ScrollView, View } from "react-native";
import type { Movimento } from "@/lib/conti/tipi";
import { Pulsante, Testo } from "~/components/ui";
import type { NuovoMovimento } from "~/lib/conti";
import { chiediConferma } from "~/lib/conferma";
import { oggiLocale } from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";
import { bozzaDa, ModuloMovimento } from "./modulo-movimento";

/** Foglio che sale dal basso per correggere un movimento (importo, data, categoria, descrizione). */
export function FoglioModifica({
  movimento,
  onChiudi,
  onSalva,
  onElimina,
}: {
  movimento: Movimento | null;
  onChiudi: () => void;
  onSalva: (movimento: Movimento, modifiche: NuovoMovimento) => Promise<boolean>;
  onElimina: (movimento: Movimento) => void;
}) {
  const c = useColori();

  function chiediElimina(m: Movimento) {
    chiediConferma({
      titolo: "Eliminare questa voce?",
      messaggio: "La togliamo dai tuoi conti, insieme alla ricevuta se c'è.",
      conferma: "Elimina",
      pericolo: true,
      onConferma: () => {
        onChiudi();
        onElimina(m);
      },
    });
  }

  return (
    <Modal
      visible={movimento !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onChiudi}
    >
      {movimento ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: c.sfondo }}
          contentContainerStyle={{ padding: SPAZIO.l, paddingBottom: SPAZIO.xxl * 2, gap: SPAZIO.l }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Testo variante="titolo">Modifica</Testo>
            <Pulsante titolo="Chiudi" variante="testo" onPress={onChiudi} />
          </View>
          <ModuloMovimento
            key={movimento.id}
            iniziale={bozzaDa(movimento, oggiLocale())}
            titoloSalva="Salva le modifiche"
            onSalva={(modifiche) => onSalva(movimento, modifiche)}
            onAnnulla={onChiudi}
          />
          <Pulsante titolo="Elimina questa voce" variante="testo" onPress={() => chiediElimina(movimento)} />
        </ScrollView>
      ) : null}
    </Modal>
  );
}
