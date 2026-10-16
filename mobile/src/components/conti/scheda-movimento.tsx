import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import type { Movimento } from "@/lib/conti/tipi";
import { importo } from "@/lib/strumenti/numeri";
import { Pillola, Pulsante, Scheda, Testo } from "~/components/ui";
import { apriLink } from "~/lib/apri";
import { etichettaCategoria, linkDocumento } from "~/lib/conti";
import { avvisa } from "~/lib/conferma";
import { SPAZIO, useColori } from "~/lib/tema";

const ORIGINI = { fattura: "Da una tua fattura", email: "Arrivata per email", foto: "Dalla tua foto", manuale: "Scritta da te" } as const;

/** Apre la ricevuta salvata con un link temporaneo. */
function VediRicevuta({ documentoId }: { documentoId: string }) {
  const [attesa, setAttesa] = useState(false);
  async function apri() {
    setAttesa(true);
    const esito = await linkDocumento(documentoId);
    setAttesa(false);
    if (esito.ok) await apriLink(esito.dati);
    else avvisa("Non riesco ad aprire la ricevuta", esito.messaggio);
  }
  return (
    <Pulsante
      titolo="Vedi ricevuta"
      variante="testo"
      icona="document-attach-outline"
      caricamento={attesa}
      onPress={() => void apri()}
      style={{ alignSelf: "flex-start" }}
    />
  );
}

function Intestazione({ m }: { m: Movimento }) {
  const c = useColori();
  return (
    <View style={{ flexDirection: "row", gap: SPAZIO.m, alignItems: "flex-start" }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Testo variante="forte">{m.controparte || m.descrizione}</Testo>
        <Testo variante="piccolo" attenuato>
          {dataSvizzera(m.data)} · {etichettaCategoria(m.categoria)}
        </Testo>
      </View>
      <Testo
        variante="forte"
        colore={m.tipo === "entrata" ? c.successo : c.testo}
        style={{ fontVariant: ["tabular-nums"] }}
        accessibilityLabel={`${m.tipo === "entrata" ? "Entrata" : "Uscita"} di ${importo(m.importo)}`}
      >
        {m.tipo === "entrata" ? "+" : "−"}
        {importo(m.importo)}
      </Testo>
    </View>
  );
}

/** Una voce letta da Bleo che aspetta la tua conferma. */
export function SchedaDaConfermare({
  movimento: m,
  onDecidi,
  onModifica,
}: {
  movimento: Movimento;
  onDecidi: (m: Movimento, stato: "confermato" | "privato") => void;
  onModifica: (m: Movimento) => void;
}) {
  const c = useColori();
  return (
    <Scheda style={{ gap: SPAZIO.m }}>
      <Intestazione m={m} />
      {m.controparte && m.descrizione ? <Testo variante="piccolo">{m.descrizione}</Testo> : null}
      <Pillola testo={ORIGINI[m.origine]} />
      {m.nota ? (
        <View style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "flex-start" }}>
          <Ionicons name="alert-circle-outline" size={18} color={c.accento} style={{ marginTop: 2 }} />
          <Testo variante="piccolo" colore={c.accento} style={{ flex: 1 }}>
            {m.nota}
          </Testo>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPAZIO.s }}>
        {m.documentoId ? <VediRicevuta documentoId={m.documentoId} /> : null}
        <Pulsante
          titolo="Modifica"
          variante="testo"
          icona="create-outline"
          onPress={() => onModifica(m)}
          style={{ alignSelf: "flex-start" }}
        />
      </View>
      <Pulsante titolo="Sì, è della ditta" icona="checkmark" onPress={() => onDecidi(m, "confermato")} />
      <Pulsante
        titolo="No, è privato"
        variante="secondario"
        onPress={() => onDecidi(m, "privato")}
        suggerimento="La voce resta fuori dai conti della ditta"
      />
    </Scheda>
  );
}

/** Riga compatta di un movimento già deciso: si tocca per correggerlo. */
export function RigaMovimento({ movimento: m, onModifica }: { movimento: Movimento; onModifica: (m: Movimento) => void }) {
  const c = useColori();
  return (
    <Pressable
      onPress={() => onModifica(m)}
      accessibilityRole="button"
      accessibilityHint="Apre la modifica"
      style={({ pressed }) => ({ paddingVertical: SPAZIO.s, gap: SPAZIO.xs, opacity: pressed ? 0.6 : 1 })}
    >
      <Intestazione m={m} />
      <View style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "center" }}>
        {m.stato === "privato" ? <Pillola testo="Privato, fuori dai conti" /> : null}
        {m.documentoId ? <Ionicons name="attach" size={16} color={c.attenuato} accessibilityLabel="Con ricevuta" /> : null}
      </View>
    </Pressable>
  );
}
