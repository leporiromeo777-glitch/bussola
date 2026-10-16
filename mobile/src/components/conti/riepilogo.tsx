import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import type { AvvisoConti, Riepilogo } from "@/lib/conti/tipi";
import { importo } from "@/lib/strumenti/numeri";
import { MESI, MESI_BREVI } from "@/lib/strumenti/budget";
import { RigaValore } from "~/components/campi";
import { Scheda, Testo } from "~/components/ui";
import { apriLink } from "~/lib/apri";
import { etichettaCategoria } from "~/lib/conti";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

const ALTEZZA_BARRE = 110;

/** Entrate e uscite mese per mese, con semplici barre. */
function BarreMensili({ perMese }: { perMese: Riepilogo["perMese"] }) {
  const c = useColori();
  const mesi = Array.from({ length: 12 }, (_, i) => perMese.find((p) => p.mese === i + 1) ?? { mese: i + 1, entrate: 0, uscite: 0 });
  const massimo = Math.max(1, ...mesi.map((m) => Math.max(m.entrate, m.uscite)));
  const altezza = (valore: number) => (valore > 0 ? Math.max(2, Math.round((valore / massimo) * ALTEZZA_BARRE)) : 0);
  return (
    <View style={{ gap: SPAZIO.s }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: ALTEZZA_BARRE, gap: 2 }}>
        {mesi.map((m) => (
          <View
            key={m.mese}
            accessible
            accessibilityLabel={`${MESI[m.mese - 1]}: entrate ${importo(m.entrate)}, uscite ${importo(m.uscite)}`}
            style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 1 }}
          >
            <View style={{ width: "40%", height: altezza(m.entrate), backgroundColor: c.successo, borderRadius: 2 }} />
            <View style={{ width: "40%", height: altezza(m.uscite), backgroundColor: c.accento, borderRadius: 2 }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 2 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {mesi.map((m) => (
          <Text key={m.mese} style={{ flex: 1, textAlign: "center", fontSize: 10, color: c.attenuato }}>
            {MESI_BREVI[m.mese - 1].charAt(0).toUpperCase()}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: SPAZIO.l }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Legenda colore={c.successo} testo="Entrate" />
        <Legenda colore={c.accento} testo="Uscite" />
      </View>
    </View>
  );
}

function Legenda({ colore, testo }: { colore: string; testo: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.xs }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colore }} />
      <Testo variante="piccolo" attenuato>
        {testo}
      </Testo>
    </View>
  );
}

function CategoriePrincipali({ perCategoria }: { perCategoria: Riepilogo["perCategoria"] }) {
  const c = useColori();
  const prime = [...perCategoria].filter((p) => p.importo > 0).sort((a, b) => b.importo - a.importo).slice(0, 5);
  if (prime.length === 0) return null;
  const massimo = prime[0].importo;
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="forte">Dove vanno e da dove arrivano i soldi</Testo>
      {prime.map((p) => (
        <View key={p.categoria} accessible accessibilityLabel={`${etichettaCategoria(p.categoria)}: ${importo(p.importo)}`} style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: SPAZIO.s }}>
            <Testo variante="piccolo" style={{ flex: 1 }}>
              {etichettaCategoria(p.categoria)}
            </Testo>
            <Testo variante="piccolo" style={{ fontVariant: ["tabular-nums"] }}>
              {importo(p.importo)}
            </Testo>
          </View>
          <View style={{ height: 8, borderRadius: RAGGIO.pillola, backgroundColor: c.marchioTenue, overflow: "hidden" }}>
            <View
              style={{ width: `${Math.max(2, Math.round((p.importo / massimo) * 100))}%`, height: "100%", backgroundColor: c.marchio }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Un avviso di Bleo sui conti, con i link alle fonti ufficiali. */
function Avviso({ avviso }: { avviso: AvvisoConti }) {
  const c = useColori();
  return (
    <Scheda style={{ borderColor: c.accento, borderWidth: 2 }}>
      <Testo>{avviso.testo}</Testo>
      {avviso.fonti.length > 0 ? (
        <View style={{ gap: SPAZIO.xs }}>
          <Testo variante="etichetta" attenuato>
            {avviso.fonti.length === 1 ? "FONTE UFFICIALE" : "FONTI UFFICIALI"}
          </Testo>
          {avviso.fonti.map((f) => (
            <Pressable
              key={f.url}
              onPress={() => void apriLink(f.url)}
              accessibilityRole="link"
              accessibilityHint="Apre la pagina ufficiale"
              style={{ flexDirection: "row", gap: 6, alignItems: "flex-start", paddingVertical: 4 }}
            >
              <Ionicons name="open-outline" size={16} color={c.marchio} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, color: c.marchio, fontSize: 14, lineHeight: 20 }}>{f.titolo}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Scheda>
  );
}

export function SezioneRiepilogo({ riepilogo }: { riepilogo: Riepilogo }) {
  const vuoto = riepilogo.entrate === 0 && riepilogo.uscite === 0;
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="sottotitolo">Riepilogo {riepilogo.anno}</Testo>
      <Scheda style={{ gap: SPAZIO.m }}>
        <View>
          <RigaValore etichetta="Entrate" valore={importo(riepilogo.entrate)} />
          <RigaValore etichetta="Uscite" valore={importo(riepilogo.uscite)} />
          <RigaValore etichetta={riepilogo.risultato < 0 ? "Risultato (perdita)" : "Risultato"} valore={importo(riepilogo.risultato)} forte />
        </View>
        <Testo variante="piccolo" attenuato>
          Contano solo le voci che hai confermato.
        </Testo>
        {vuoto ? (
          <Testo attenuato>Quando confermi entrate e uscite, qui vedi i mesi e le categorie.</Testo>
        ) : (
          <>
            <BarreMensili perMese={riepilogo.perMese} />
            <CategoriePrincipali perCategoria={riepilogo.perCategoria} />
          </>
        )}
      </Scheda>
      {riepilogo.avvisi.map((a) => (
        <Avviso key={a.id} avviso={a} />
      ))}
    </View>
  );
}
