/**
 * Pezzi comuni a «Nome della ditta», «Testi pronti» e «Fondare una Sagl»
 * nell'app: schermata che si può far scorrere da codice, messaggio di
 * errore, scelta a schede con la spiegazione, «Copia», interruttore, note
 * con le fonti e la nota «non è una consulenza» degli strumenti del sito.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { AccessibilityInfo, Pressable, ScrollView, Switch, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { fonti, type Fonte } from "@/data/svizzera";
import { apriLink } from "~/lib/apri";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";
import { ElencoFonti, Pulsante, Scheda, Testo, tocco } from "./ui";

/** Come Schermata, con il riferimento allo ScrollView per portare la vista su un risultato. */
export function SchermataScorrevole({ children, rif }: { children: ReactNode; rif: RefObject<ScrollView | null> }) {
  const c = useColori();
  return (
    <ScrollView
      ref={rif}
      style={{ flex: 1, backgroundColor: c.sfondo }}
      contentContainerStyle={{ padding: SPAZIO.l, paddingBottom: SPAZIO.xxl * 2, gap: SPAZIO.l }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** Un errore da leggere subito (annunciato da VoiceOver e TalkBack). */
export function MessaggioErrore({ testo }: { testo: string }) {
  const c = useColori();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={{
        flexDirection: "row",
        gap: SPAZIO.s,
        padding: SPAZIO.m,
        borderRadius: RAGGIO.m,
        borderWidth: 1.5,
        borderColor: c.pericolo,
        backgroundColor: c.scheda,
      }}
    >
      <Ionicons name="alert-circle-outline" size={20} color={c.pericolo} style={{ marginTop: 1 }} />
      <Testo variante="forte" colore={c.pericolo} style={{ flex: 1 }}>
        {testo}
      </Testo>
    </View>
  );
}

/** Scelta tra poche opzioni, una per riga, con una spiegazione sotto il titolo. */
export function SceltaSchede<T extends string>({
  etichetta,
  opzioni,
  valore,
  onCambia,
  disabilitata,
}: {
  etichetta: string;
  opzioni: readonly { valore: T; etichetta: string; descrizione?: string }[];
  valore: T;
  onCambia: (v: T) => void;
  disabilitata?: boolean;
}) {
  const c = useColori();
  return (
    <View style={{ gap: SPAZIO.xs }}>
      <Testo variante="forte">{etichetta}</Testo>
      <View accessibilityRole="radiogroup" accessibilityLabel={etichetta} style={{ gap: SPAZIO.s }}>
        {opzioni.map((o) => {
          const attiva = o.valore === valore;
          return (
            <Pressable
              key={o.valore}
              onPress={() => {
                tocco();
                onCambia(o.valore);
              }}
              disabled={disabilitata}
              accessibilityRole="radio"
              accessibilityState={{ checked: attiva, disabled: disabilitata }}
              accessibilityLabel={o.descrizione ? `${o.etichetta}. ${o.descrizione}` : o.etichetta}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "flex-start",
                gap: SPAZIO.m,
                minHeight: 48,
                padding: SPAZIO.m,
                borderRadius: RAGGIO.m,
                borderWidth: attiva ? 2 : 1.5,
                borderColor: attiva ? c.marchio : c.bordo,
                backgroundColor: attiva ? c.marchioTenue : c.scheda,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons
                name={attiva ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={attiva ? c.marchio : c.attenuato}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Testo variante="forte">{o.etichetta}</Testo>
                {o.descrizione ? (
                  <Testo variante="piccolo" attenuato>
                    {o.descrizione}
                  </Testo>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Interruttore sì/no con la sua etichetta su tutta la riga (area da toccare ampia). */
export function Interruttore({ etichetta, valore, onCambia }: { etichetta: string; valore: boolean; onCambia: (v: boolean) => void }) {
  const c = useColori();
  return (
    <Pressable
      onPress={() => {
        tocco();
        onCambia(!valore);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: valore }}
      accessibilityLabel={etichetta}
      style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m, minHeight: 44 }}
    >
      <Testo style={{ flex: 1 }}>{etichetta}</Testo>
      <Switch
        value={valore}
        onValueChange={onCambia}
        trackColor={{ true: c.marchio, false: c.bordo }}
        thumbColor="#ffffff"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

/** «Copia»: mette il testo negli appunti e per 2 secondi dice «Copiato». */
export function PulsanteCopia({
  testo,
  descrizione,
  style,
}: {
  testo: string;
  /** Cosa si copia, per VoiceOver e TalkBack (per esempio «il nome Torte Rossi»). */
  descrizione: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColori();
  const [stato, setStato] = useState<"copiato" | "errore" | null>(null);
  useEffect(() => {
    if (stato !== "copiato") return;
    const t = setTimeout(() => setStato(null), 2000);
    return () => clearTimeout(t);
  }, [stato]);

  async function copia() {
    try {
      await Clipboard.setStringAsync(testo);
      setStato("copiato");
      AccessibilityInfo.announceForAccessibility("Copiato.");
    } catch {
      setStato("errore");
    }
  }

  return (
    <View style={[{ gap: SPAZIO.xs }, style]}>
      <Pulsante
        titolo={stato === "copiato" ? "Copiato" : "Copia"}
        variante="secondario"
        icona={stato === "copiato" ? "checkmark" : "copy-outline"}
        onPress={() => void copia()}
        suggerimento={`Copia ${descrizione}`}
        style={{ paddingHorizontal: SPAZIO.l }}
      />
      {stato === "errore" ? (
        <Testo variante="piccolo" colore={c.pericolo} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          Non riesco a copiare: tieni premuto il testo e copialo a mano.
        </Testo>
      ) : null}
    </View>
  );
}

/** Una nota con l'icona «i» e le sue fonti ufficiali. */
export function NotaConFonti({ testo, fonti: elenco, verificatoIl }: { testo: string; fonti: readonly Fonte[]; verificatoIl?: string }) {
  const c = useColori();
  return (
    <Scheda>
      <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
        <Ionicons name="information-circle-outline" size={20} color={c.marchio} style={{ marginTop: 2 }} />
        <Testo style={{ flex: 1 }}>{testo}</Testo>
      </View>
      <ElencoFonti fonti={elenco} verificatoIl={verificatoIl} />
    </Scheda>
  );
}

/** Link a una fonte dentro un testo, come «(art. 772 CO)» sul sito. */
export function LinkFonte({ fonte, testo }: { fonte: Fonte; testo?: string }) {
  const c = useColori();
  return (
    <Text
      onPress={() => void apriLink(fonte.url)}
      accessibilityRole="link"
      accessibilityHint="Apre la pagina ufficiale"
      style={{ color: c.marchio, textDecorationLine: "underline" }}
    >
      {testo ?? fonte.titolo}
    </Text>
  );
}

/** La nota fissa in fondo agli strumenti del sito: compili tu, non è una consulenza. */
export function NotaNonConsulenza() {
  return (
    <Testo variante="piccolo" attenuato>
      È uno strumento che compili tu, con regole generali e fonti ufficiali: non è una consulenza fiscale o giuridica.
      Per il tuo caso personale rivolgiti all&apos;ufficio competente o a un fiduciario autorizzato (
      <LinkFonte fonte={fonti.albofiduciari} />
      ).
    </Testo>
  );
}
