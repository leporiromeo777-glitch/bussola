/**
 * Mattoncini dell'interfaccia: testi, schede, pulsanti, caselle, fonti.
 * Colori del sito, testi grandi abbastanza e aree da toccare di almeno 44 punti.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import type { Fonte } from "@/data/svizzera";
import { dataSvizzera } from "@/data/svizzera";
import { apriLink } from "~/lib/apri";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export type NomeIcona = ComponentProps<typeof Ionicons>["name"];

export function tocco(): void {
  if (Platform.OS !== "web") void Haptics.selectionAsync().catch(() => {});
}

/** Contenitore di una schermata che scorre. */
export function Schermata({
  children,
  style,
  refreshControl,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Per «tira giù per aggiornare». */
  refreshControl?: ComponentProps<typeof ScrollView>["refreshControl"];
}) {
  const c = useColori();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.sfondo }}
      refreshControl={refreshControl}
      contentContainerStyle={[{ padding: SPAZIO.l, paddingBottom: SPAZIO.xxl * 2, gap: SPAZIO.l }, style]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const VARIANTI = StyleSheet.create({
  titolo: { fontSize: 26, fontWeight: "700", lineHeight: 32 },
  sottotitolo: { fontSize: 19, fontWeight: "600", lineHeight: 25 },
  corpo: { fontSize: 16, lineHeight: 23 },
  forte: { fontSize: 16, lineHeight: 23, fontWeight: "600" },
  piccolo: { fontSize: 14, lineHeight: 20 },
  etichetta: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
});

export function Testo({
  children,
  variante = "corpo",
  attenuato,
  colore,
  style,
  ...resto
}: {
  children: ReactNode;
  variante?: keyof typeof VARIANTI;
  attenuato?: boolean;
  colore?: string;
  style?: StyleProp<TextStyle>;
} & Omit<ComponentProps<typeof Text>, "style">) {
  const c = useColori();
  return (
    <Text
      style={[VARIANTI[variante], { color: colore ?? (attenuato ? c.attenuato : c.testo) }, style]}
      accessibilityRole={variante === "titolo" || variante === "sottotitolo" ? "header" : undefined}
      {...resto}
    >
      {children}
    </Text>
  );
}

export function Scheda({
  children,
  evidenziata,
  tenue,
  style,
}: {
  children: ReactNode;
  evidenziata?: boolean;
  tenue?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColori();
  return (
    <View
      style={[
        {
          backgroundColor: tenue ? c.marchioTenue : c.scheda,
          borderRadius: RAGGIO.l,
          borderWidth: tenue ? 0 : evidenziata ? 2 : StyleSheet.hairlineWidth * 2,
          borderColor: evidenziata ? c.marchio : c.bordo,
          padding: SPAZIO.l,
          gap: SPAZIO.s,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Pulsante({
  titolo,
  onPress,
  variante = "principale",
  icona,
  disabilitato,
  caricamento,
  suggerimento,
  style,
}: {
  titolo: string;
  onPress: () => void;
  variante?: "principale" | "secondario" | "testo" | "pericolo";
  icona?: NomeIcona;
  disabilitato?: boolean;
  caricamento?: boolean;
  /** Spiegazione per VoiceOver/TalkBack, se il titolo non basta. */
  suggerimento?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColori();
  const pieno = variante === "principale" || variante === "pericolo";
  const sfondo = variante === "principale" ? c.marchio : variante === "pericolo" ? c.pericolo : "transparent";
  const testo = pieno ? c.sulMarchio : variante === "testo" ? c.marchio : c.testo;
  const spento = disabilitato || caricamento;
  return (
    <Pressable
      onPress={() => {
        tocco();
        onPress();
      }}
      disabled={spento}
      accessibilityRole="button"
      accessibilityState={{ disabled: spento, busy: caricamento }}
      accessibilityHint={suggerimento}
      style={({ pressed }) => [
        {
          minHeight: 48,
          borderRadius: RAGGIO.pillola,
          paddingHorizontal: variante === "testo" ? SPAZIO.s : SPAZIO.xl,
          paddingVertical: SPAZIO.m,
          backgroundColor: sfondo,
          borderWidth: variante === "secondario" ? 1.5 : 0,
          borderColor: c.bordo,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: SPAZIO.s,
          opacity: spento ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {caricamento ? <ActivityIndicator color={testo} /> : null}
      <Text style={{ color: testo, fontSize: 16, fontWeight: "600", textAlign: "center", flexShrink: 1 }}>{titolo}</Text>
      {icona && !caricamento ? <Ionicons name={icona} size={18} color={testo} /> : null}
    </Pressable>
  );
}

export function Pillola({ testo, tono = "neutro" }: { testo: string; tono?: "marchio" | "neutro" | "accento" }) {
  const c = useColori();
  const colori =
    tono === "marchio"
      ? { sfondo: c.marchioTenue, testo: c.marchio, bordo: c.marchioTenue }
      : tono === "accento"
        ? { sfondo: "transparent", testo: c.accento, bordo: c.accento }
        : { sfondo: "transparent", testo: c.attenuato, bordo: c.bordo };
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: RAGGIO.pillola,
        paddingHorizontal: 10,
        paddingVertical: 3,
        backgroundColor: colori.sfondo,
        borderWidth: 1,
        borderColor: colori.bordo,
      }}
    >
      <Text style={{ color: colori.testo, fontSize: 12, fontWeight: "600" }}>{testo}</Text>
    </View>
  );
}

/** Casella "fatto" grande da toccare. */
export function Casella({
  spuntata,
  onCambia,
  etichetta,
}: {
  spuntata: boolean;
  onCambia: (spuntata: boolean) => void;
  etichetta: string;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={() => {
        tocco();
        onCambia(!spuntata);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: spuntata }}
      accessibilityLabel={etichetta}
      hitSlop={10}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: spuntata ? c.marchio : c.bordo,
        backgroundColor: spuntata ? c.marchio : c.scheda,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {spuntata ? <Ionicons name="checkmark" size={20} color={c.sulMarchio} /> : null}
    </Pressable>
  );
}

export function BarraProgresso({ fatti, totale }: { fatti: number; totale: number }) {
  const c = useColori();
  const quota = totale > 0 ? fatti / totale : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: totale, now: fatti, text: `${fatti} passi fatti su ${totale}` }}
      style={{ height: 10, borderRadius: 5, backgroundColor: c.marchioTenue, overflow: "hidden" }}
    >
      <View style={{ width: `${Math.round(quota * 100)}%`, height: "100%", backgroundColor: c.marchio }} />
    </View>
  );
}

/** Le fonti ufficiali con il link e la data di controllo. */
export function ElencoFonti({ fonti, verificatoIl }: { fonti: readonly Fonte[]; verificatoIl?: string }) {
  const c = useColori();
  if (fonti.length === 0) return null;
  return (
    <View style={{ gap: SPAZIO.xs }}>
      <Testo variante="etichetta" attenuato>
        {fonti.length === 1 ? "FONTE UFFICIALE" : "FONTI UFFICIALI"}
      </Testo>
      {fonti.map((f) => (
        <Pressable
          key={f.url}
          onPress={() => void apriLink(f.url)}
          accessibilityRole="link"
          accessibilityHint="Apre la pagina ufficiale"
          style={{ flexDirection: "row", gap: 6, alignItems: "flex-start", paddingVertical: 4 }}
        >
          <Ionicons name="open-outline" size={16} color={c.marchio} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, color: c.marchio, fontSize: 14, lineHeight: 20 }}>
            {f.titolo} <Text style={{ color: c.attenuato }}>({f.ente})</Text>
          </Text>
        </Pressable>
      ))}
      {verificatoIl ? (
        <Testo variante="piccolo" attenuato>
          Controllato il {dataSvizzera(verificatoIl)}
        </Testo>
      ) : null}
    </View>
  );
}

/** Una riga da toccare (menu del profilo, elenco strumenti). */
export function RigaMenu({
  titolo,
  sottotitolo,
  icona,
  onPress,
  esterno,
}: {
  titolo: string;
  sottotitolo?: string;
  icona: NomeIcona;
  onPress: () => void;
  esterno?: boolean;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={esterno ? "link" : "button"}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: SPAZIO.m,
        paddingVertical: SPAZIO.m,
        minHeight: 52,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: c.marchioTenue,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icona} size={20} color={c.marchio} />
      </View>
      <View style={{ flex: 1 }}>
        <Testo variante="forte">{titolo}</Testo>
        {sottotitolo ? (
          <Testo variante="piccolo" attenuato>
            {sottotitolo}
          </Testo>
        ) : null}
      </View>
      <Ionicons name={esterno ? "open-outline" : "chevron-forward"} size={18} color={c.attenuato} />
    </Pressable>
  );
}

export function Separatore() {
  const c = useColori();
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: c.bordo }} />;
}

/** Riga di avvertenza in fondo alle schermate con informazioni. */
export function NotaInformazione() {
  return (
    <Testo variante="piccolo" attenuato>
      Bleo dà informazioni generali con le fonti ufficiali, non consulenza fiscale o giuridica personalizzata. Per i
      casi particolari rivolgiti a un fiduciario autorizzato.
    </Testo>
  );
}
