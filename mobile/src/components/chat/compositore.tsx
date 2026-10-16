/**
 * La casella in fondo alla chat: una «pillola» che cresce fino a circa cinque
 * righe, con il pulsante tondo per inviare (o fermare la risposta).
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { LUNGHEZZA_MASSIMA_DOMANDA, LUNGHEZZA_MINIMA_DOMANDA } from "@/lib/chat/limiti";
import { tocco } from "~/components/ui";
import { SPAZIO, useColori } from "~/lib/tema";

const RIGA = 22;
const MARGINE_VERTICALE = 9;
const ALTEZZA_MINIMA = RIGA + MARGINE_VERTICALE * 2;
const ALTEZZA_MASSIMA = RIGA * 5 + MARGINE_VERTICALE * 2;

export function Compositore({
  testo,
  onCambia,
  onInvia,
  onFerma,
  inCorso,
}: {
  testo: string;
  onCambia: (testo: string) => void;
  onInvia: () => void;
  onFerma: () => void;
  inCorso: boolean;
}) {
  const c = useColori();
  // Sul web la casella non cresce da sola: l'altezza segue il contenuto.
  const [altezzaWeb, setAltezzaWeb] = useState(ALTEZZA_MINIMA);
  const pronto = testo.trim().length >= LUNGHEZZA_MINIMA_DOMANDA;
  const attivo = inCorso || pronto;

  return (
    <View style={{ paddingHorizontal: SPAZIO.m, paddingTop: SPAZIO.s, paddingBottom: SPAZIO.s, gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          backgroundColor: c.scheda,
          borderWidth: 1,
          borderColor: c.bordo,
          borderRadius: 26,
          paddingLeft: SPAZIO.l,
          paddingRight: 6,
          paddingVertical: 6,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <TextInput
          value={testo}
          onChangeText={(t) => {
            onCambia(t);
            if (!t) setAltezzaWeb(ALTEZZA_MINIMA);
          }}
          placeholder="Chiedi a Bleo…"
          placeholderTextColor={c.attenuato}
          multiline
          maxLength={LUNGHEZZA_MASSIMA_DOMANDA}
          accessibilityLabel="La tua domanda"
          onContentSizeChange={
            Platform.OS === "web"
              ? (e) => setAltezzaWeb(Math.min(ALTEZZA_MASSIMA, Math.max(ALTEZZA_MINIMA, e.nativeEvent.contentSize.height)))
              : undefined
          }
          onKeyPress={
            Platform.OS === "web"
              ? (e) => {
                  // Sul computer: Invio manda, Maiusc+Invio va a capo.
                  const evento = e.nativeEvent as { key: string; shiftKey?: boolean };
                  if (evento.key === "Enter" && !evento.shiftKey) {
                    e.preventDefault();
                    if (!inCorso && pronto) onInvia();
                  }
                }
              : undefined
          }
          style={{
            flex: 1,
            fontSize: 16,
            lineHeight: RIGA,
            color: c.testo,
            minHeight: ALTEZZA_MINIMA,
            maxHeight: ALTEZZA_MASSIMA,
            height: Platform.OS === "web" ? altezzaWeb : undefined,
            paddingTop: MARGINE_VERTICALE,
            paddingBottom: MARGINE_VERTICALE,
            textAlignVertical: "top",
            ...Platform.select({ web: { outlineWidth: 0 } }),
          }}
        />
        <Pressable
          onPress={() => {
            tocco();
            if (inCorso) onFerma();
            else onInvia();
          }}
          disabled={!attivo}
          accessibilityRole="button"
          accessibilityLabel={inCorso ? "Ferma la risposta" : "Invia la domanda"}
          accessibilityState={{ disabled: !attivo }}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            marginLeft: SPAZIO.s,
            backgroundColor: attivo ? c.testo : c.bordo,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name={inCorso ? "stop" : "arrow-up"} size={inCorso ? 16 : 20} color={attivo ? c.sfondo : c.attenuato} />
        </Pressable>
      </View>
      <Text style={{ color: c.attenuato, fontSize: 12, lineHeight: 16, textAlign: "center" }}>
        Bleo dà informazioni generali con fonti ufficiali, non consulenza.
      </Text>
    </View>
  );
}
