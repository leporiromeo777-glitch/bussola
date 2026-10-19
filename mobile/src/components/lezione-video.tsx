/**
 * La lezione video di Bleo di un passo, come sul sito: si vede la copertina e
 * il video si scarica solo quando lo avvii. I file stanno sul sito
 * (public/corso/), titoli e durate in ../src/data/corso.ts. I sottotitoli sono
 * già nel video. I pezzi (lettore, video facoltativi) servono anche alla
 * schermata del corso (src/app/corso.tsx).
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { durataBreve, type Approfondimento, type LezioneCorso, type VideoCorso } from "@/data/corso";
import { ElencoFonti, Pulsante, Scheda, Testo, tocco } from "~/components/ui";
import { SITO_URL } from "~/lib/config";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export function LezioneVideo({ lezione, conLinkCorso = false }: { lezione: LezioneCorso; conLinkCorso?: boolean }) {
  const c = useColori();
  return (
    <Scheda>
      <Testo variante="forte" colore={c.marchio}>
        Guarda la lezione di Bleo ({durataBreve(lezione.durataSecondi)})
      </Testo>
      <LettoreVideo video={lezione} etichetta={`Lezione ${lezione.numero}: ${lezione.titolo}`} />
      {lezione.approfondimenti?.length ? <VideoFacoltativi approfondimenti={lezione.approfondimenti} /> : null}
      {conLinkCorso ? (
        <Pulsante
          titolo="Tutte le lezioni del corso di Bleo"
          variante="testo"
          icona="chevron-forward"
          onPress={() => router.push("/corso")}
          style={{ alignSelf: "flex-start" }}
        />
      ) : null}
    </Scheda>
  );
}

/**
 * I video facoltativi di una lezione, per chi vuole sapere di più: chiusi,
 * come sul sito; toccandone uno compaiono il lettore e le sue fonti.
 */
export function VideoFacoltativi({ approfondimenti }: { approfondimenti: readonly Approfondimento[] }) {
  return (
    <View style={{ gap: SPAZIO.s, marginTop: SPAZIO.s }}>
      <View>
        <Testo variante="forte">Video facoltativi</Testo>
        <Testo variante="piccolo" attenuato>
          Per chi vuole sapere di più.
        </Testo>
      </View>
      {approfondimenti.map((a) => (
        <VideoFacoltativo key={a.id} approfondimento={a} />
      ))}
    </View>
  );
}

function VideoFacoltativo({ approfondimento: a }: { approfondimento: Approfondimento }) {
  const c = useColori();
  const [aperto, setAperto] = useState(false);
  return (
    <View style={{ borderWidth: 1, borderColor: c.bordo, borderRadius: RAGGIO.m, paddingHorizontal: SPAZIO.m }}>
      <Pressable
        onPress={() => {
          tocco();
          setAperto((v) => !v);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: aperto }}
        accessibilityLabel={`Video facoltativo: ${a.titolo}, ${durataBreve(a.durataSecondi)}`}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: SPAZIO.s,
          minHeight: 48,
          paddingVertical: SPAZIO.s,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Ionicons name="play-circle-outline" size={22} color={c.marchio} />
        <Testo style={{ flex: 1 }} colore={c.marchio}>
          {a.titolo}{" "}
          <Testo variante="piccolo" attenuato>
            · {durataBreve(a.durataSecondi)}
          </Testo>
        </Testo>
        <Ionicons name={aperto ? "chevron-up" : "chevron-down"} size={18} color={c.attenuato} />
      </Pressable>
      {aperto ? (
        <View style={{ gap: SPAZIO.s, paddingBottom: SPAZIO.m }}>
          <LettoreVideo video={a} etichetta={`Video facoltativo: ${a.titolo}`} />
          <ElencoFonti fonti={a.fonti} verificatoIl={a.verificatoIl} />
        </View>
      ) : null}
    </View>
  );
}

const QUADRATO: ViewStyle = { width: "100%", aspectRatio: 1, borderRadius: RAGGIO.m, overflow: "hidden", backgroundColor: "#fbfaf7" };

/** La copertina con il tasto play; toccata, lascia il posto al lettore. */
export function LettoreVideo({ video, etichetta }: { video: VideoCorso; etichetta: string }) {
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
