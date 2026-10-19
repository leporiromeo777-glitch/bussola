import { useMemo, type ReactNode } from "react";
import { Text, View, type StyleProp, type TextStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import type { Documento } from "@/lib/strumenti/documenti";
import { sezionePagamentoSvg, svgSenzaAnnidati } from "@/lib/strumenti/qr-svg";
import { vistaDocumento } from "@/lib/strumenti/stampa-documento";
import { SPAZIO } from "~/lib/tema";

/** Colori fissi: il documento è un foglio bianco anche con il telefono in modalità scura. */
const CARTA = { sfondo: "#ffffff", testo: "#1c1f24", tenue: "#4b515b", linea: "#d6d2c9", marchio: "#0f5e6b" } as const;

function T({ children, style, tenue }: { children: ReactNode; style?: StyleProp<TextStyle>; tenue?: boolean }) {
  return <Text style={[{ color: tenue ? CARTA.tenue : CARTA.testo, fontSize: 12, lineHeight: 16 }, style]}>{children}</Text>;
}

/**
 * Anteprima del documento sul telefono, con gli stessi testi del PDF
 * (vistaDocumento) e, per la fattura, la sezione pagamento con il codice QR
 * (lo stesso SVG del PDF e del sito).
 */
export function AnteprimaDocumento({ doc }: { doc: Documento }) {
  const v = useMemo(() => vistaDocumento(doc), [doc]);
  const pagamento = useMemo(() => (doc.tipo === "fattura" ? sezionePagamentoSvg(doc) : null), [doc]);
  const svg = useMemo(() => (pagamento?.ok ? svgSenzaAnnidati(pagamento.svg) : null), [pagamento]);

  return (
    <View
      accessibilityLabel={`Anteprima: ${v.titolo} ${doc.numero}`}
      style={{ backgroundColor: CARTA.sfondo, borderRadius: 4, borderWidth: 1, borderColor: CARTA.linea, overflow: "hidden" }}
    >
      <View style={{ padding: SPAZIO.l, gap: SPAZIO.l }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: SPAZIO.m }}>
          <View style={{ flexShrink: 1, minWidth: 140 }}>
            <T style={{ fontWeight: "700", fontSize: 14 }}>{v.emittente.nome}</T>
            {v.emittente.righe.map((r) => (
              <T key={r}>{r}</T>
            ))}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <T style={{ fontSize: 20, lineHeight: 26, fontWeight: "700", color: CARTA.marchio }}>{v.titolo}</T>
            {v.dettagli.map((d) => (
              <T key={d.etichetta}>
                <T tenue>{d.etichetta} </T>
                {d.valore}
              </T>
            ))}
          </View>
        </View>

        <View style={{ alignSelf: "flex-end", minWidth: "50%" }}>
          <T tenue style={{ fontSize: 10, letterSpacing: 0.5 }}>
            PER
          </T>
          <T style={{ fontWeight: "600" }}>{v.cliente.nome}</T>
          {v.cliente.righe.map((r) => (
            <T key={r}>{r}</T>
          ))}
        </View>

        {v.oggetto || v.prestazione ? (
          <View>
            {v.oggetto ? <T style={{ fontWeight: "700" }}>{v.oggetto}</T> : null}
            {v.prestazione ? <T>{v.prestazione}</T> : null}
          </View>
        ) : null}

        <View>
          <View style={{ borderBottomWidth: 2, borderBottomColor: CARTA.testo, paddingBottom: 4, flexDirection: "row" }}>
            <T tenue style={{ flex: 1, fontSize: 10 }}>
              DESCRIZIONE
            </T>
            <T tenue style={{ fontSize: 10 }}>
              IMPORTO
            </T>
          </View>
          {v.righe.length === 0 ? (
            <T tenue style={{ paddingVertical: 6 }}>
              Le voci appariranno qui.
            </T>
          ) : (
            v.righe.map((r) => (
              <View key={r.id} style={{ borderBottomWidth: 1, borderBottomColor: CARTA.linea, paddingVertical: 6, gap: 2 }}>
                <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
                  <T style={{ flex: 1 }}>{r.descrizione || " "}</T>
                  <T style={{ fontVariant: ["tabular-nums"] }}>{r.importo}</T>
                </View>
                <T tenue style={{ fontSize: 11 }}>
                  {r.quantita} × {r.prezzo}
                  {r.iva ? ` · IVA ${r.iva}` : ""}
                </T>
              </View>
            ))
          )}
        </View>

        <View style={{ alignSelf: "flex-end", minWidth: "70%", gap: 2 }}>
          {v.totali.map((t) => (
            <View
              key={t.etichetta}
              style={[
                { flexDirection: "row", justifyContent: "space-between", gap: SPAZIO.m },
                t.forte ? { borderTopWidth: 2, borderTopColor: CARTA.testo, paddingTop: 4, marginTop: 2 } : null,
              ]}
            >
              <T style={t.forte ? { fontWeight: "700", fontSize: 14 } : undefined}>{t.etichetta}</T>
              <T style={[{ fontVariant: ["tabular-nums"] }, t.forte ? { fontWeight: "700", fontSize: 14 } : {}]}>{t.valore}</T>
            </View>
          ))}
        </View>

        {v.note ? <T>{v.note}</T> : null}
        {v.chiusura ? <T>{v.chiusura}</T> : null}
      </View>

      {svg ? (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel="Sezione pagamento con codice QR"
          style={{ width: "100%", aspectRatio: 2, backgroundColor: CARTA.sfondo }}
        >
          <SvgXml xml={svg} width="100%" height="100%" />
        </View>
      ) : pagamento && !pagamento.ok ? (
        <View style={{ borderTopWidth: 2, borderTopColor: CARTA.linea, borderStyle: "dashed", padding: SPAZIO.l, gap: 4 }}>
          <T style={{ fontWeight: "600" }}>Qui apparirà la sezione pagamento con il codice QR. Manca ancora:</T>
          {pagamento.errori.map((e) => (
            <T key={`${e.campo}-${e.messaggio}`} tenue>
              • {e.messaggio}
            </T>
          ))}
        </View>
      ) : null}
    </View>
  );
}
