import type { ReactNode } from "react";
import { Text, View, type StyleProp, type TextStyle } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import { CAMPI_PIANO, type DatiPiano } from "@/lib/strumenti/business-plan";
import { SPAZIO } from "~/lib/tema";

/** Colori fissi: il business plan è un foglio bianco anche con il telefono in modalità scura (come il PDF). */
const CARTA = { sfondo: "#ffffff", testo: "#1c1f24", tenue: "#4b515b", vuoto: "#8a909a", linea: "#d6d2c9", marchio: "#0f5e6b", riquadro: "#eef6f7" } as const;

function T({ children, style, tenue }: { children: ReactNode; style?: StyleProp<TextStyle>; tenue?: boolean }) {
  return <Text style={[{ color: tenue ? CARTA.tenue : CARTA.testo, fontSize: 13, lineHeight: 18 }, style]}>{children}</Text>;
}

function Titoletto({ children }: { children: string }) {
  return (
    <T style={{ fontSize: 11, lineHeight: 15, fontWeight: "700", letterSpacing: 0.5, color: CARTA.marchio }}>{children.toUpperCase()}</T>
  );
}

function Risposta({ testo, style }: { testo: string; style?: StyleProp<TextStyle> }) {
  return testo.trim() ? <T style={style}>{testo.trim()}</T> : <T style={[style, { color: CARTA.vuoto }]}>…</T>;
}

/** Anteprima del business plan sul telefono: gli stessi testi del foglio A4 del sito e del PDF. */
export function FoglioPiano({ dati, oggiIso }: { dati: DatiPiano; oggiIso: string }) {
  const [idea, ...altri] = CAMPI_PIANO;
  return (
    <View
      accessibilityLabel="Anteprima del business plan di una pagina"
      style={{ backgroundColor: CARTA.sfondo, borderRadius: 4, borderWidth: 1, borderColor: CARTA.linea, padding: SPAZIO.l, gap: SPAZIO.m }}
    >
      <View style={{ borderBottomWidth: 2, borderBottomColor: CARTA.marchio, paddingBottom: SPAZIO.s, gap: 2 }}>
        <Titoletto>Business plan di una pagina</Titoletto>
        <T style={{ fontSize: 19, lineHeight: 25, fontWeight: "700" }}>{dati.nomeAttivita.trim() || "La mia attività"}</T>
        <T tenue style={{ fontSize: 11 }}>
          {[dati.titolare.trim(), dataSvizzera(oggiIso)].filter(Boolean).join(" · ")}
        </T>
      </View>
      <View style={{ backgroundColor: CARTA.riquadro, borderRadius: 6, padding: SPAZIO.m, gap: 4 }}>
        <Titoletto>{idea.titolo}</Titoletto>
        <Risposta testo={dati.campi.idea} style={{ fontSize: 15, lineHeight: 21, fontWeight: "500" }} />
      </View>
      {altri.map((c) => (
        <View key={c.id} style={{ borderTopWidth: 1, borderTopColor: CARTA.linea, paddingTop: SPAZIO.s, gap: 4 }}>
          <Titoletto>{c.titolo}</Titoletto>
          <Risposta testo={dati.campi[c.id]} />
        </View>
      ))}
      <View style={{ borderTopWidth: 1, borderTopColor: CARTA.linea, paddingTop: SPAZIO.s }}>
        <T tenue style={{ fontSize: 10, lineHeight: 14 }}>
          Preparato con Bleo. Documento compilato da chi lo presenta; i numeri sono stime.
        </T>
      </View>
    </View>
  );
}
