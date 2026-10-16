import { View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import type { FatturaEmessa, Riepilogo } from "@/lib/conti/tipi";
import { importo } from "@/lib/strumenti/numeri";
import { Pillola, Pulsante, Scheda, Separatore, Testo } from "~/components/ui";
import { SPAZIO, useColori } from "~/lib/tema";

/** Le fatture emesse che aspettano il pagamento. */
export function SezioneFatture({
  fatture,
  riepilogo,
  onSegnaPagata,
}: {
  fatture: readonly FatturaEmessa[];
  riepilogo: Riepilogo;
  onSegnaPagata: (f: FatturaEmessa) => void;
}) {
  const c = useColori();
  const daIncassare = fatture
    .filter((f) => f.stato !== "pagata")
    .sort((a, b) => (a.stato === b.stato ? (a.scadenza ?? a.data).localeCompare(b.scadenza ?? b.data) : a.stato === "scaduta" ? -1 : 1));
  const { fattureAperte: aperte, fattureScadute: scadute } = riepilogo;
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="sottotitolo">Fatture emesse</Testo>
      <Scheda>
        {daIncassare.length === 0 ? (
          <Testo attenuato>Nessuna fattura in attesa di pagamento.</Testo>
        ) : (
          <>
            <Testo attenuato>
              {aperte.numero > 0 ? `Da incassare: ${aperte.numero} (${importo(aperte.importo)}).` : ""}
              {aperte.numero > 0 && scadute.numero > 0 ? " " : ""}
              {scadute.numero > 0 ? `Scadute: ${scadute.numero} (${importo(scadute.importo)}).` : ""}
            </Testo>
            {daIncassare.map((f, i) => (
              <View key={f.id} style={{ gap: SPAZIO.s }}>
                {i > 0 ? <Separatore /> : null}
                <View style={{ flexDirection: "row", gap: SPAZIO.m, paddingTop: SPAZIO.s }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Testo variante="forte">{f.cliente}</Testo>
                    <Testo variante="piccolo" attenuato>
                      Fattura {f.numero} del {dataSvizzera(f.data)}
                      {f.scadenza ? ` · scade il ${dataSvizzera(f.scadenza)}` : ""}
                    </Testo>
                  </View>
                  <Testo variante="forte" style={{ fontVariant: ["tabular-nums"] }}>
                    {importo(f.importo)}
                  </Testo>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPAZIO.s }}>
                  {f.stato === "scaduta" ? (
                    <Pillola testo="Scaduta" tono="accento" />
                  ) : (
                    <Pillola testo="Aperta" tono="marchio" />
                  )}
                  <Pulsante
                    titolo="Segna pagata"
                    variante="secondario"
                    icona="checkmark-done-outline"
                    onPress={() => onSegnaPagata(f)}
                    suggerimento={`Segna pagata oggi la fattura ${f.numero}`}
                  />
                </View>
              </View>
            ))}
          </>
        )}
        {scadute.numero > 0 ? (
          <Testo variante="piccolo" colore={c.accento}>
            Per le fatture scadute puoi mandare un promemoria gentile al cliente.
          </Testo>
        ) : null}
      </Scheda>
    </View>
  );
}
