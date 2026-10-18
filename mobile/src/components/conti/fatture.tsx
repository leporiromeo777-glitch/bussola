import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Alert, Platform, Switch, View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import { giorniDiRitardo, livelloConsigliato, testoRitardo, testoSollecitoInviato } from "@/lib/conti/sollecito";
import type { FatturaEmessa, Riepilogo } from "@/lib/conti/tipi";
import { importo } from "@/lib/strumenti/numeri";
import { Pillola, Pulsante, Scheda, Separatore, Testo } from "~/components/ui";
import { chiediPermesso, riprogrammaNotifiche } from "~/lib/notifiche";
import { impostaPromemoria, oggiLocale, usePromemoriaAttivi } from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";

/** Le fatture emesse che aspettano il pagamento. */
export function SezioneFatture({
  fatture,
  riepilogo,
  onSegnaPagata,
  onPreparaSollecito,
}: {
  fatture: readonly FatturaEmessa[];
  riepilogo: Riepilogo;
  onSegnaPagata: (f: FatturaEmessa) => void;
  onPreparaSollecito: (f: FatturaEmessa) => void;
}) {
  const c = useColori();
  const oggi = oggiLocale();
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
            {daIncassare.map((f, i) => {
              const ritardo = f.stato === "scaduta" ? giorniDiRitardo(f, oggi) : 0;
              return (
                <View key={f.id} style={{ gap: SPAZIO.s }}>
                  {i > 0 ? <Separatore /> : null}
                  <View style={{ flexDirection: "row", gap: SPAZIO.m, paddingTop: SPAZIO.s }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Testo variante="forte">{f.cliente}</Testo>
                      <Testo variante="piccolo" attenuato>
                        Fattura {f.numero} del {dataSvizzera(f.data)}
                        {f.scadenza ? ` · scade il ${dataSvizzera(f.scadenza)}` : ""}
                      </Testo>
                      {ritardo > 0 ? (
                        <Testo variante="piccolo" colore={c.pericolo} style={{ fontWeight: "600" }}>
                          {testoRitardo(ritardo)}
                        </Testo>
                      ) : null}
                      {f.sollecito ? (
                        <Testo variante="piccolo" attenuato>
                          {testoSollecitoInviato(f.sollecito)}
                        </Testo>
                      ) : null}
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
                  {f.stato === "scaduta" ? (
                    <Pulsante
                      titolo={livelloConsigliato(f) === 2 ? "Prepara il 2° sollecito" : "Prepara il sollecito"}
                      icona="mail-outline"
                      onPress={() => onPreparaSollecito(f)}
                      suggerimento={`Prepara il testo del sollecito per la fattura ${f.numero}`}
                    />
                  ) : null}
                </View>
              );
            })}
          </>
        )}
        {scadute.numero > 0 ? (
          <Testo variante="piccolo" colore={c.accento}>
            Per una fattura scaduta Bleo ti prepara il sollecito: lo controlli e lo mandi tu al cliente.
          </Testo>
        ) : null}
      </Scheda>
      {daIncassare.some((f) => f.scadenza) ? <PromemoriaFatture /> : null}
    </View>
  );
}

/** Lo stesso interruttore dei promemoria delle scadenze (scheda Percorso): vale anche per le fatture. */
function PromemoriaFatture() {
  const c = useColori();
  const attivi = usePromemoriaAttivi();
  const [stato, setStato] = useState("");
  if (Platform.OS === "web") return null;

  async function cambia(valore: boolean) {
    if (valore && !(await chiediPermesso())) {
      Alert.alert("Notifiche spente", "Per ricevere i promemoria, attiva le notifiche di Bleo nelle impostazioni del telefono.");
      return;
    }
    impostaPromemoria(valore);
    await riprogrammaNotifiche().catch(() => 0);
    setStato(
      valore
        ? "Il mattino dopo la scadenza di una fattura non pagata ti mando un avviso."
        : "Promemoria tolti, anche quelli delle scadenze nel Percorso.",
    );
  }

  return (
    <Scheda tenue style={{ gap: SPAZIO.s }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <Ionicons name="notifications-outline" size={22} color={c.marchio} />
        <View style={{ flex: 1 }}>
          <Testo variante="forte">Promemoria sul telefono</Testo>
          <Testo variante="piccolo" attenuato>
            Alle 9 del giorno dopo la scadenza, se la fattura non è ancora pagata. Vale anche per le scadenze del
            Percorso.
          </Testo>
        </View>
        <Switch
          value={attivi}
          onValueChange={(v) => void cambia(v)}
          accessibilityLabel="Promemoria delle fatture e delle scadenze"
          trackColor={{ true: c.marchio }}
        />
      </View>
      {stato ? (
        <Testo variante="piccolo" attenuato accessibilityLiveRegion="polite">
          {stato}
        </Testo>
      ) : null}
    </Scheda>
  );
}
