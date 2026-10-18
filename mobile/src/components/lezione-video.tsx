/**
 * La lezione video di Bleo di un passo, come sul sito: si vede la copertina e
 * il video si scarica solo quando lo avvii. I file stanno sul sito
 * (public/corso/), titoli e durate in ../src/data/corso.ts. I sottotitoli sono
 * già nel video.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { durataBreve, type LezioneCorso, type VideoCorso } from "@/data/corso";
import { ElencoFonti, Scheda, Testo, tocco } from "~/components/ui";
import { SITO_URL } from "~/lib/config";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export function LezioneVideo({ lezione }: { lezione: LezioneCorso }) {
  const c = useColori();
  return (
    <Scheda>
      <Testo variante="forte" colore={c.marchio}>
        Guarda la lezione di Bleo ({durataBreve(lezione.durataSecondi)})
      </Testo>
      <LettoreVideo video={lezione} etichetta={`Lezione ${lezione.numero}: ${lezione.titolo}`} />
      {lezione.approfondimenti?.length ? (
        <View style={{ gap: SPAZIO.s, marginTop: SPAZIO.s }}>
          <Testo variante="forte">Video facoltativi</Testo>
          <Testo variante="piccolo" attenuato>
            Per chi vuole sapere di più.
          </Testo>
          {lezione.approfondimenti.map((a) => (
            <View key={a.id} style={{ gap: SPAZIO.s }}>
              <Testo>
                {a.titolo}{" "}
                <Testo variante="piccolo" attenuato>
                  · {durataBreve(a.durataSecondi)}
                </Testo>
              </Testo>
              <LettoreVideo video={a} etichetta={`Video facoltativo: ${a.titolo}`} />
              <ElencoFonti fonti={a.fonti} verificatoIl={a.verificatoIl} />
            </View>
          ))}
        </View>
      ) : null}
    </Scheda>
  );
}

const QUADRATO: ViewStyle = { width: "100%", aspectRatio: 1, borderRadius: RAGGIO.m, overflow: "hidden", backgroundColor: "#fbfaf7" };

/** La copertina con il tasto play; toccata, lascia il posto al lettore. */
function LettoreVideo({ video, etichetta }: { video: VideoCorso; etichetta: string }) {
  const c = useColori();
  const [avviato, setAvviato] = useState(false);
  if (avviato) {
    return (
      <View style={QUADRATO}>
        <Video uri={`${SITO_URL}${video.video}`} />
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Avvia il video. ${etichetta}`}
      onPress={() => {
        tocco();
        setAvviato(true);
      }}
      style={QUADRATO}
    >
      <Image source={{ uri: `${SITO_URL}${video.poster}` }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.marchio, alignItems: "center", justifyContent: "center" }}
        >
          {/* Il triangolo del play ha il peso a sinistra: spostato di poco a destra sembra centrato. */}
          <Ionicons name="play" size={34} color={c.sulMarchio} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </Pressable>
  );
}

function Video({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => p.play());
  return (
    <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls fullscreenOptions={{ enable: true }} contentFit="contain" />
  );
}
