import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import { precompilaFattura, rigaPerVoceAmmessa, totalePrecompilazione } from "@/lib/clienti/fattura";
import {
  durata,
  importoOre,
  nomeMese,
  oreDecimali,
  oreInFatturaEsatte,
  tariffaVoce,
  type GruppoCliente,
  type Totali,
} from "@/lib/clienti/ore";
import type { DettaglioFattura, Mese, VoceOre } from "@/lib/clienti/tipi";
import { importo } from "@/lib/strumenti/numeri";
import { Scelta } from "~/components/campi";
import { Pillola, Pulsante, Scheda, Separatore, Testo } from "~/components/ui";
import { SPAZIO, useColori } from "~/lib/tema";

/** «12 h 30 min · CHF 1'500.00» (l'importo solo se almeno una voce ha la tariffa). */
export function testoTotali(t: Totali): string {
  return t.voci > t.senzaTariffa ? `${durata(t.minuti)} · ${importo(t.importo)}` : durata(t.minuti);
}

const DETTAGLI = [
  { valore: "voci", etichetta: "Una riga per voce" },
  { valore: "riepilogo", etichetta: "Una riga sola" },
] as const;

/** Le ore di un cliente nel mese, con «Crea la fattura» per quelle da fatturare. */
export function GruppoOre({
  gruppo: g,
  mese,
  attesa,
  onModificaVoce,
  onCreaFattura,
  onTogliSegno,
}: {
  gruppo: GruppoCliente;
  mese: Mese;
  attesa: boolean;
  onModificaVoce: (voce: VoceOre) => void;
  onCreaFattura: (dettaglio: DettaglioFattura, importoOre: number | null) => void;
  onTogliSegno: (giorno: string) => void;
}) {
  const c = useColori();
  const daFatturare = g.voci.filter((v) => !v.fatturataIl);
  const perVoce = rigaPerVoceAmmessa(daFatturare.length);
  const [scelta, setScelta] = useState<DettaglioFattura>("voci");
  const dettaglio: DettaglioFattura = perVoce ? scelta : "riepilogo";
  // La stessa funzione del server: il totale qui è quello della fattura.
  const anteprima = precompilaFattura({ id: "anteprima", cliente: g.cliente, voci: daFatturare, mese, dettaglio });
  const totale = totalePrecompilazione(anteprima);
  const conPrezzo = totale.senzaPrezzo < anteprima.righe.length;

  return (
    <Scheda style={{ gap: SPAZIO.m }}>
      <View style={{ flexDirection: "row", gap: SPAZIO.m, alignItems: "flex-start" }}>
        <Testo variante="sottotitolo" style={{ flex: 1 }}>
          {g.cliente.nome}
        </Testo>
        <Testo variante="forte" style={{ fontVariant: ["tabular-nums"] }}>
          {testoTotali(g.totale)}
        </Testo>
      </View>

      <View>
        {g.voci.map((v, i) => {
          const valore = importoOre(v.minuti, tariffaVoce(v, g.cliente));
          return (
            <View key={v.id}>
              {i > 0 ? <Separatore /> : null}
              <Pressable
                onPress={() => onModificaVoce(v)}
                accessibilityRole="button"
                accessibilityHint="Apre la voce per correggerla o eliminarla"
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPAZIO.m,
                  paddingVertical: SPAZIO.m,
                  minHeight: 52,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Testo variante="forte">
                    {dataSvizzera(v.data)} · {durata(v.minuti)}
                  </Testo>
                  <Testo variante="piccolo" attenuato>
                    {v.descrizione || "Lavoro"}
                    {v.minuti % 60 !== 0 ? ` (${oreDecimali(v.minuti)})` : ""}
                  </Testo>
                  {v.fatturataIl ? <Pillola testo={`Fatturata il ${dataSvizzera(v.fatturataIl)}`} tono="marchio" /> : null}
                </View>
                <Testo variante="forte" style={{ fontVariant: ["tabular-nums"] }}>
                  {valore === null ? "–" : importo(valore)}
                </Testo>
                <Ionicons name="chevron-forward" size={18} color={c.attenuato} />
              </Pressable>
            </View>
          );
        })}
      </View>

      {g.totale.senzaTariffa > 0 ? (
        <Testo variante="piccolo" colore={c.accento}>
          {g.totale.senzaTariffa === 1 ? "Una voce non ha" : `${g.totale.senzaTariffa} voci non hanno`} la tariffa: aggiungila
          al cliente, oppure scrivi il prezzo nella fattura.
        </Testo>
      ) : null}

      <Separatore />
      {daFatturare.length > 0 ? (
        <View style={{ gap: SPAZIO.m }}>
          <Testo variante="forte">
            Da fatturare: {daFatturare.length === 1 ? "1 voce" : `${daFatturare.length} voci`}, {durata(g.daFatturare.minuti)}
          </Testo>
          {perVoce ? (
            <Scelta etichetta="Nella fattura" opzioni={DETTAGLI} valore={dettaglio} onCambia={setScelta} />
          ) : (
            <Testo variante="piccolo" attenuato>
              Sono tante voci: nella fattura va una riga sola con il totale delle ore.
            </Testo>
          )}
          <Testo>
            {conPrezzo
              ? `Importo delle ore: ${importo(totale.importo)}${totale.senzaPrezzo > 0 ? " (più le righe senza tariffa)" : ""}.`
              : "Senza tariffa: i prezzi li scrivi nella fattura."}
          </Testo>
          <Testo variante="piccolo" attenuato>
            {daFatturare.every((v) => oreInFatturaEsatte(v.minuti))
              ? ""
              : "In fattura le ore sono in centesimi d'ora (1 h 20 min = 1.33 h). "}
            Se sei iscritto all&apos;IVA, la fattura aggiunge l&apos;IVA.
          </Testo>
          <Pulsante
            titolo="Crea la fattura"
            icona="qr-code-outline"
            onPress={() => onCreaFattura(dettaglio, conPrezzo ? totale.importo : null)}
            caricamento={attesa}
            suggerimento="Segna le ore come fatturate e apre la fattura già compilata"
          />
        </View>
      ) : (
        <Testo attenuato>Tutte le ore di {nomeMese(mese)} sono fatturate.</Testo>
      )}

      {g.fatturateIl.map((giorno) => {
        const quante = g.voci.filter((v) => v.fatturataIl === giorno).length;
        return (
          <View key={giorno} style={{ gap: SPAZIO.xs }}>
            <Testo variante="piccolo" attenuato>
              {quante === 1 ? "1 voce fatturata" : `${quante} voci fatturate`} il {dataSvizzera(giorno)}.
            </Testo>
            <Pulsante
              titolo="Non l'ho mandata: togli il segno"
              variante="testo"
              onPress={() => onTogliSegno(giorno)}
              disabilitato={attesa}
              style={{ alignSelf: "flex-start" }}
            />
          </View>
        );
      })}
    </Scheda>
  );
}
