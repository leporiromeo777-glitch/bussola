import { Pressable, TextInput, View } from "react-native";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";
import { Testo, tocco } from "./ui";

/** Campo numerico con etichetta, aiuto ed errore (gli strumenti accettano 48'000, 48 000, 48000). */
export function CampoNumero({
  etichetta,
  valore,
  onCambia,
  aiuto,
  errore,
  prefisso,
}: {
  etichetta: string;
  valore: string;
  onCambia: (v: string) => void;
  aiuto?: string;
  errore?: string;
  prefisso?: string;
}) {
  const c = useColori();
  return (
    <View style={{ gap: SPAZIO.xs }}>
      <Testo variante="forte">{etichetta}</Testo>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: errore ? c.pericolo : c.bordo,
          borderRadius: RAGGIO.m,
          backgroundColor: c.scheda,
          paddingHorizontal: SPAZIO.m,
        }}
      >
        {prefisso ? (
          <Testo attenuato style={{ marginRight: SPAZIO.s }}>
            {prefisso}
          </Testo>
        ) : null}
        <TextInput
          value={valore}
          onChangeText={onCambia}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={c.attenuato}
          accessibilityLabel={etichetta}
          accessibilityHint={aiuto}
          style={{ flex: 1, fontSize: 17, paddingVertical: 12, color: c.testo }}
        />
      </View>
      {errore ? (
        <Testo variante="piccolo" colore={c.pericolo}>
          {errore}
        </Testo>
      ) : aiuto ? (
        <Testo variante="piccolo" attenuato>
          {aiuto}
        </Testo>
      ) : null}
    </View>
  );
}

/** Scelta tra poche opzioni, come pulsanti affiancati. */
export function Scelta<T extends string | number>({
  etichetta,
  opzioni,
  valore,
  onCambia,
}: {
  etichetta: string;
  opzioni: readonly { valore: T; etichetta: string }[];
  valore: T;
  onCambia: (v: T) => void;
}) {
  const c = useColori();
  return (
    <View style={{ gap: SPAZIO.xs }}>
      <Testo variante="forte">{etichetta}</Testo>
      <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: SPAZIO.s }}>
        {opzioni.map((o) => {
          const attiva = o.valore === valore;
          return (
            <Pressable
              key={String(o.valore)}
              onPress={() => {
                tocco();
                onCambia(o.valore);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: attiva }}
              style={{
                minHeight: 44,
                justifyContent: "center",
                paddingHorizontal: SPAZIO.l,
                borderRadius: RAGGIO.pillola,
                borderWidth: 1.5,
                borderColor: attiva ? c.marchio : c.bordo,
                backgroundColor: attiva ? c.marchio : c.scheda,
              }}
            >
              <Testo variante="forte" colore={attiva ? c.sulMarchio : c.testo}>
                {o.etichetta}
              </Testo>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Una riga "etichetta ........ valore" dei risultati. */
export function RigaValore({ etichetta, valore, forte }: { etichetta: string; valore: string; forte?: boolean }) {
  const c = useColori();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: SPAZIO.m,
        paddingVertical: SPAZIO.s,
        borderTopWidth: 1,
        borderTopColor: c.bordo,
      }}
    >
      <Testo variante={forte ? "forte" : "corpo"} attenuato={!forte} style={{ flex: 1 }}>
        {etichetta}
      </Testo>
      <Testo variante="forte" style={{ fontVariant: ["tabular-nums"] }}>
        {valore}
      </Testo>
    </View>
  );
}
