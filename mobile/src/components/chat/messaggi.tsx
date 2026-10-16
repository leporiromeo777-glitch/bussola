/**
 * I messaggi della chat, come nelle app di chat: la domanda in una bolla a
 * destra, la risposta di Bleo a sinistra senza bolla, con le fonti sotto.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { formattaData } from "@/lib/chat/formato";
import { strutturaRisposta, type Parte } from "@/lib/chat/testo-risposta";
import type { BloccoRisposta, FonteCitata } from "@/lib/chat/tipi";
import { ImmagineMascotte } from "~/components/mascotte";
import { tocco } from "~/components/ui";
import { apriLink } from "~/lib/apri";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export type StatoRisposta = "in-corso" | "fatto" | "errore" | "interrotta";

export type Turno = {
  chiave: string;
  domanda: string;
  stato: StatoRisposta;
  /** Il testo che arriva man mano, la risposta finita o il messaggio d'errore. */
  testo: string;
  /** I pezzi con le citazioni, quando la risposta è finita. */
  blocchi: BloccoRisposta[] | null;
  fonti: FonteCitata[];
  avviso: string | null;
};

export function BollaUtente({ testo }: { testo: string }) {
  const c = useColori();
  return (
    <View
      style={{
        alignSelf: "flex-end",
        maxWidth: "85%",
        backgroundColor: c.marchioTenue,
        borderRadius: 20,
        borderBottomRightRadius: 6,
        paddingHorizontal: SPAZIO.l,
        paddingVertical: 10,
      }}
    >
      <Text selectable style={{ color: c.testo, fontSize: 16, lineHeight: 22 }}>
        {testo}
      </Text>
    </View>
  );
}

export function AvatarBleo({ dimensione = 30 }: { dimensione?: number }) {
  const c = useColori();
  return (
    <View
      style={{
        width: dimensione,
        height: dimensione,
        borderRadius: dimensione / 2,
        backgroundColor: c.marchioTenue,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Solo la testa di Bleo, presa dall'immagine «coppia». */}
      <ImmagineMascotte
        nome="coppia"
        larghezza={dimensione * 2.3}
        style={{ position: "absolute", left: dimensione * (0.5 - 0.375 * 2.3), top: dimensione * (0.56 - 0.31 * 2.3) }}
      />
    </View>
  );
}

/** Il testo da copiare: la risposta e, sotto, le fonti con il link. */
function testoDaCopiare(turno: Turno): string {
  const fonti = turno.fonti.map((f) => `[${f.numero}] ${f.titolo} (${f.ente}): ${f.url}`);
  return fonti.length > 0 ? `${turno.testo.trim()}\n\nFonti:\n${fonti.join("\n")}` : turno.testo.trim();
}

export function RispostaBleo({ turno, onRiprova }: { turno: Turno; onRiprova: () => void }) {
  const c = useColori();
  const [copiato, setCopiato] = useState(false);
  useEffect(() => {
    if (!copiato) return;
    const t = setTimeout(() => setCopiato(false), 1800);
    return () => clearTimeout(t);
  }, [copiato]);

  const errore = turno.stato === "errore";
  const haTesto = turno.testo.trim().length > 0;
  const copiabile = !errore && turno.stato !== "in-corso" && haTesto;

  async function copia() {
    if (!copiabile) return;
    tocco();
    await Clipboard.setStringAsync(testoDaCopiare(turno)).catch(() => {});
    setCopiato(true);
  }

  return (
    <View style={{ flexDirection: "row", gap: SPAZIO.m, alignItems: "flex-start" }}>
      <AvatarBleo />
      <View style={{ flex: 1, gap: SPAZIO.s, paddingTop: 3 }}>
        {turno.stato === "in-corso" && !haTesto ? (
          <View style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "center", minHeight: 24 }}>
            <ActivityIndicator size="small" color={c.attenuato} />
            <Text style={{ color: c.attenuato, fontSize: 15 }}>Cerco nelle fonti ufficiali…</Text>
          </View>
        ) : errore ? (
          <Text style={{ color: c.pericolo, fontSize: 16, lineHeight: 23 }}>{turno.testo}</Text>
        ) : (
          <Pressable onLongPress={() => void copia()} delayLongPress={400} disabled={!copiabile}>
            <TestoRisposta
              blocchi={turno.blocchi ?? [{ testo: turno.testo, citazioni: [] }]}
              fonti={turno.fonti}
            />
          </Pressable>
        )}

        {turno.stato === "interrotta" ? (
          <Text style={{ color: c.attenuato, fontSize: 14, fontStyle: "italic" }}>Hai fermato la risposta.</Text>
        ) : null}
        {turno.avviso ? <Text style={{ color: c.attenuato, fontSize: 14, lineHeight: 20 }}>{turno.avviso}</Text> : null}
        {turno.fonti.length > 0 ? <FontiRisposta fonti={turno.fonti} /> : null}

        {copiabile || errore || turno.stato === "interrotta" ? (
          <View style={{ flexDirection: "row", gap: SPAZIO.xs, marginLeft: -SPAZIO.s }}>
            {copiabile ? (
              <AzionePiccola
                icona={copiato ? "checkmark" : "copy-outline"}
                etichetta={copiato ? "Copiato" : "Copia"}
                onPress={() => void copia()}
              />
            ) : null}
            {errore || turno.stato === "interrotta" ? (
              <AzionePiccola icona="refresh" etichetta="Riprova" onPress={onRiprova} forte />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function AzionePiccola({
  icona,
  etichetta,
  onPress,
  forte,
}: {
  icona: "copy-outline" | "checkmark" | "refresh";
  etichetta: string;
  onPress: () => void;
  forte?: boolean;
}) {
  const c = useColori();
  const colore = forte ? c.marchio : c.attenuato;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etichetta === "Copia" ? "Copia la risposta" : etichetta}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        minHeight: 36,
        paddingHorizontal: SPAZIO.s,
        borderRadius: RAGGIO.pillola,
        backgroundColor: pressed ? c.marchioTenue : "transparent",
      })}
    >
      <Ionicons name={icona} size={16} color={colore} />
      <Text style={{ color: colore, fontSize: 14, fontWeight: forte ? "600" : "500" }}>{etichetta}</Text>
    </Pressable>
  );
}

/** Paragrafi, elenchi, **grassetto** e i numeri [1] delle fonti (che aprono la fonte). */
function TestoRisposta({ blocchi, fonti }: { blocchi: BloccoRisposta[]; fonti: FonteCitata[] }) {
  const c = useColori();
  const elementi = strutturaRisposta(blocchi);
  const stile = { color: c.testo, fontSize: 16, lineHeight: 24 } as const;
  return (
    <View style={{ gap: SPAZIO.s }}>
      {elementi.map((elemento, i) =>
        elemento.tipo === "elenco" ? (
          <View key={i} style={{ gap: SPAZIO.xs }}>
            {elemento.punti.map((punto, j) => (
              <View key={j} style={{ flexDirection: "row", gap: SPAZIO.s, paddingLeft: SPAZIO.xs }}>
                <Text style={stile}>•</Text>
                <Text style={[stile, { flex: 1 }]}>
                  <Parti parti={punto} fonti={fonti} />
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text key={i} style={stile}>
            <Parti parti={elemento.parti} fonti={fonti} />
          </Text>
        ),
      )}
    </View>
  );
}

function Parti({ parti, fonti }: { parti: Parte[]; fonti: FonteCitata[] }) {
  const c = useColori();
  return parti.map((parte, i) => {
    if (parte.tipo === "testo") {
      return (
        <Text key={i} style={parte.grassetto ? { fontWeight: "700" } : undefined}>
          {parte.testo}
        </Text>
      );
    }
    return (
      <Text key={i}>
        {parte.citazioni.map((citazione) => {
          const url = fonti.find((f) => f.numero === citazione.numero)?.url ?? citazione.url;
          return (
            <Text
              key={citazione.numero}
              onPress={() => void apriLink(url)}
              accessibilityRole="link"
              accessibilityLabel={`Fonte ${citazione.numero}: ${citazione.titolo}`}
              style={{ color: c.marchio, fontSize: 13, fontWeight: "700" }}
            >
              {" "}[{citazione.numero}]
            </Text>
          );
        })}
      </Text>
    );
  });
}

function FontiRisposta({ fonti }: { fonti: FonteCitata[] }) {
  const c = useColori();
  return (
    <View
      style={{
        gap: 2,
        marginTop: SPAZIO.xs,
        paddingTop: SPAZIO.s,
        borderTopWidth: 1,
        borderTopColor: c.bordo,
      }}
    >
      <Text style={{ color: c.attenuato, fontSize: 13, fontWeight: "600", letterSpacing: 0.3 }}>FONTI</Text>
      {fonti.map((f) => (
        <Pressable
          key={`${f.numero}-${f.fonte_id}`}
          onPress={() => void apriLink(f.url)}
          accessibilityRole="link"
          accessibilityHint="Apre la pagina ufficiale"
          style={({ pressed }) => ({
            flexDirection: "row",
            gap: 6,
            paddingVertical: 5,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ color: c.marchio, fontSize: 14, fontWeight: "700", lineHeight: 20 }}>[{f.numero}]</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.marchio, fontSize: 14, lineHeight: 20 }}>{f.titolo}</Text>
            <Text style={{ color: c.attenuato, fontSize: 13, lineHeight: 18 }}>
              {f.ente}
              {f.verificato_il ? ` · controllata il ${formattaData(f.verificato_il)}` : ""}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
