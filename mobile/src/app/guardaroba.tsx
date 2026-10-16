import { Pressable, View } from "react-native";
import { datiLook, LOOK } from "@/lib/mascotte/look";
import { ImmagineMascotte } from "~/components/mascotte";
import { Schermata, Scheda, Testo, tocco } from "~/components/ui";
import { salvaLook, useLook } from "~/lib/stato";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

/** Vesti Bleo: scegli un look tra le immagini della mascotte. */
export default function Guardaroba() {
  const c = useColori();
  const scelto = useLook();
  const attuale = datiLook(scelto);
  return (
    <Schermata>
      <Scheda tenue style={{ alignItems: "center", gap: SPAZIO.s }}>
        <ImmagineMascotte nome={attuale.immagine} larghezza={200} />
        <Testo variante="forte" accessibilityLiveRegion="polite">
          {attuale.etichetta}
        </Testo>
      </Scheda>
      <Testo variante="sottotitolo">Scegli il look</Testo>
      <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: SPAZIO.s }}>
        {LOOK.map((l) => {
          const attivo = l.id === scelto;
          return (
            <Pressable
              key={l.id}
              onPress={() => {
                tocco();
                salvaLook(l.id);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: attivo }}
              accessibilityLabel={l.etichetta}
              style={{
                width: "31%",
                alignItems: "center",
                gap: SPAZIO.xs,
                paddingVertical: SPAZIO.s,
                borderRadius: RAGGIO.m,
                borderWidth: 2,
                borderColor: attivo ? c.marchio : c.bordo,
                backgroundColor: attivo ? c.marchioTenue : c.scheda,
              }}
            >
              <ImmagineMascotte nome={l.immagine} larghezza={64} />
              <Testo variante="piccolo" style={{ textAlign: "center" }}>
                {l.etichetta}
              </Testo>
            </Pressable>
          );
        })}
      </View>
    </Schermata>
  );
}
