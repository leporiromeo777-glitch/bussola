import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { descrizioneCaso, notaAnniSupplementi } from "@/lib/strumenti/avs";
import { nomeMese, type RigaImporto, type RisultatoBudget } from "@/lib/strumenti/budget";
import {
  cifraBudget,
  eMesePareggio,
  fontiBudget,
  notaFabbisogno,
  periodoBudget,
  puntiBudget,
  riquadriBudget,
  righeContributi,
  righeMese,
} from "@/lib/strumenti/budget-vista";
import { CampoNumero, CampoTesto, RigaValore } from "~/components/campi";
import { ElencoFonti, Pillola, Pulsante, Scheda, Separatore, Testo, tocco } from "~/components/ui";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

/** Una scelta tra valori in fila (mesi): frecce grandi a sinistra e a destra, «regolabile» per VoiceOver/TalkBack. */
export function SceltaMese({
  etichetta,
  valore,
  onPrecedente,
  onSuccessivo,
}: {
  etichetta: string;
  valore: string;
  /** null quando non si può andare più indietro. */
  onPrecedente: (() => void) | null;
  onSuccessivo: (() => void) | null;
}) {
  const c = useColori();
  const freccia = (verso: "indietro" | "avanti", azione: (() => void) | null) => (
    <Pressable
      onPress={() => {
        if (!azione) return;
        tocco();
        azione();
      }}
      disabled={!azione}
      accessibilityRole="button"
      accessibilityLabel={verso === "indietro" ? `${etichetta}: mese prima` : `${etichetta}: mese dopo`}
      accessibilityState={{ disabled: !azione }}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: RAGGIO.pillola,
        alignItems: "center",
        justifyContent: "center",
        opacity: !azione ? 0.3 : pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={verso === "indietro" ? "chevron-back" : "chevron-forward"} size={22} color={c.marchio} />
    </Pressable>
  );
  return (
    <View style={{ gap: SPAZIO.xs }}>
      <Testo variante="forte">{etichetta}</Testo>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={etichetta}
        accessibilityValue={{ text: valore }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "increment") onSuccessivo?.();
          if (e.nativeEvent.actionName === "decrement") onPrecedente?.();
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: c.bordo,
          borderRadius: RAGGIO.m,
          backgroundColor: c.scheda,
        }}
      >
        {freccia("indietro", onPrecedente)}
        <Testo variante="forte" style={{ flex: 1, textAlign: "center" }}>
          {valore}
        </Testo>
        {freccia("avanti", onSuccessivo)}
      </View>
    </View>
  );
}

type Voce = RigaImporto & { mese?: number };

/** Le voci di costo: descrizione, importo e (per i costi di avvio) il mese in cui le paghi. */
export function VociBudget<V extends Voce>({
  righe,
  errori,
  chiaveErrore,
  etichettaImporto,
  mesi,
  massimoVoci,
  lunghezze,
  onCambia,
  nuova,
}: {
  righe: V[];
  errori: Record<string, string>;
  chiaveErrore: string;
  etichettaImporto: string;
  /** Le etichette dei 12 mesi, se le voci hanno il mese. */
  mesi?: string[];
  massimoVoci: number;
  lunghezze: { descrizione: number; importo: number };
  onCambia: (righe: V[]) => void;
  nuova: () => V;
}) {
  const cambia = (id: string, modifica: Partial<V>) => onCambia(righe.map((r) => (r.id === id ? { ...r, ...modifica } : r)));
  return (
    <View style={{ gap: SPAZIO.m }}>
      {righe.map((r, i) => (
        <View key={r.id} style={{ gap: SPAZIO.s }}>
          {i > 0 ? <Separatore /> : null}
          <CampoTesto
            etichetta={`Voce ${i + 1}`}
            valore={r.descrizione}
            onCambia={(v) => cambia(r.id, { descrizione: v } as Partial<V>)}
            segnaposto="Descrizione"
            massimo={lunghezze.descrizione}
          />
          <CampoNumero
            etichetta={`${etichettaImporto}${r.descrizione.trim() ? ` (${r.descrizione.trim()})` : ""}`}
            prefisso="CHF"
            valore={r.importo}
            onCambia={(v) => cambia(r.id, { importo: v.slice(0, lunghezze.importo) } as Partial<V>)}
            errore={errori[`${chiaveErrore}.${r.id}`]}
          />
          {mesi ? (
            <SceltaMese
              etichetta="Mese in cui lo paghi"
              valore={mesi[r.mese ?? 0]}
              onPrecedente={(r.mese ?? 0) > 0 ? () => cambia(r.id, { mese: (r.mese ?? 0) - 1 } as Partial<V>) : null}
              onSuccessivo={(r.mese ?? 0) < mesi.length - 1 ? () => cambia(r.id, { mese: (r.mese ?? 0) + 1 } as Partial<V>) : null}
            />
          ) : null}
          <Pulsante
            titolo={`Togli ${r.descrizione.trim() ? `«${r.descrizione.trim()}»` : `la voce ${i + 1}`}`}
            variante="testo"
            icona="trash-outline"
            onPress={() => onCambia(righe.filter((x) => x.id !== r.id))}
            style={{ alignSelf: "flex-start" }}
          />
        </View>
      ))}
      {righe.length < massimoVoci ? (
        <Pulsante titolo="Aggiungi una voce" variante="secondario" icona="add" onPress={() => onCambia([...righe, nuova()])} />
      ) : null}
    </View>
  );
}

/** In cima: i quattro numeri del primo anno, aggiornati mentre scrivi. */
export function RiepilogoBudget({ r }: { r: RisultatoBudget }) {
  const c = useColori();
  const riquadri = riquadriBudget(r);
  const fabbisogno = notaFabbisogno(r);
  return (
    <Scheda evidenziata>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: SPAZIO.s }}>
        <Testo variante="etichetta" attenuato style={{ flex: 1 }}>
          IL TUO PRIMO ANNO, {periodoBudget(r).toUpperCase()}
        </Testo>
        <Pillola testo="Stima" tono="accento" />
      </View>
      <View accessibilityLiveRegion="polite">
        {riquadri.map((q) => (
          <View key={q.etichetta} style={{ paddingVertical: SPAZIO.s, borderTopWidth: 1, borderTopColor: c.bordo, gap: 2 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: SPAZIO.m }}>
              <Testo attenuato style={{ flex: 1 }}>
                {q.etichetta}
              </Testo>
              <Testo variante="forte" colore={q.negativo ? c.pericolo : undefined} style={{ fontVariant: ["tabular-nums"] }}>
                {q.valore}
              </Testo>
            </View>
            {q.nota ? (
              <Testo variante="piccolo" attenuato>
                {q.nota}
              </Testo>
            ) : null}
          </View>
        ))}
      </View>
      {fabbisogno ? <Testo variante="piccolo">{fabbisogno}</Testo> : null}
    </Scheda>
  );
}

/** Mese per mese: si apre a richiesta, un mese sotto l'altro come sul sito da telefono. */
export function MesiBudget({ r }: { r: RisultatoBudget }) {
  const c = useColori();
  const [aperto, setAperto] = useState(false);
  return (
    <View style={{ gap: SPAZIO.m }}>
      <Pulsante
        titolo={aperto ? "Nascondi il mese per mese" : "Mostra il mese per mese"}
        variante="secondario"
        icona={aperto ? "chevron-up" : "chevron-down"}
        onPress={() => setAperto(!aperto)}
      />
      {aperto
        ? r.mesi.map((m, i) => (
            <Scheda key={m.etichetta}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: SPAZIO.s }}>
                <Testo variante="forte" accessibilityRole="header">
                  {nomeMese(m)}
                </Testo>
                {eMesePareggio(r, i) ? <Pillola testo="Pareggio" tono="marchio" /> : null}
              </View>
              {righeMese(r, m).map((riga) => {
                const n = m[riga.chiave];
                return (
                  <View
                    key={riga.chiave}
                    style={{ flexDirection: "row", justifyContent: "space-between", gap: SPAZIO.m, paddingVertical: 4, borderTopWidth: 1, borderTopColor: c.bordo }}
                  >
                    <Testo variante={riga.forte ? "forte" : "piccolo"} attenuato={!riga.forte} style={{ flex: 1 }}>
                      {riga.segno ? `${riga.segno} ` : ""}
                      {riga.etichetta}
                    </Testo>
                    <Testo
                      variante={riga.forte ? "forte" : "piccolo"}
                      colore={n < 0 ? c.pericolo : undefined}
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {cifraBudget(n)}
                    </Testo>
                  </View>
                );
              })}
            </Scheda>
          ))
        : null}
    </View>
  );
}

/** I contributi sociali stimati sui 12 mesi e le note, con le fonti. */
export function ContributiBudget({ r }: { r: RisultatoBudget }) {
  return (
    <>
      <Scheda>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: SPAZIO.s }}>
          <Testo variante="sottotitolo" style={{ flex: 1 }}>
            Contributi sociali sui 12 mesi (tavola {r.annoAvs})
          </Testo>
          <Pillola testo="Stima" tono="accento" />
        </View>
        <Testo variante="piccolo" attenuato>
          {descrizioneCaso(r.contributi)}
        </Testo>
        {righeContributi(r.contributi).map((riga) => (
          <View key={riga.etichetta}>
            <RigaValore etichetta={riga.etichetta} valore={riga.valore} forte={riga.forte} />
            {riga.nota ? (
              <Testo variante="piccolo" attenuato style={{ marginTop: -4, paddingBottom: SPAZIO.xs }}>
                {riga.nota}
              </Testo>
            ) : null}
          </View>
        ))}
        <Testo variante="piccolo" attenuato>
          {notaAnniSupplementi(r.annoAvs)}
        </Testo>
      </Scheda>
      <Scheda>
        <Testo variante="sottotitolo">Cosa considera questo budget</Testo>
        {puntiBudget(r).map((p) => (
          <View key={p} style={{ flexDirection: "row", gap: SPAZIO.s }}>
            <Testo attenuato>•</Testo>
            <Testo variante="piccolo" style={{ flex: 1 }}>
              {p}
            </Testo>
          </View>
        ))}
        <ElencoFonti fonti={fontiBudget(r)} />
      </Scheda>
    </>
  );
}
