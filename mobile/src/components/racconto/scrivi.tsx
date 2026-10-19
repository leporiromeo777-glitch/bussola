/**
 * Il primo passo di «Racconta a Bleo»: la casella grande dove scrivi (o
 * detti con il microfono della tastiera) la tua idea, con la lista «Cosa
 * dire a Bleo» che si spunta da sola, gli esempi e cosa succede al testo.
 * Gli stessi testi e gli stessi limiti del sito (src/app/questionario/racconto.tsx).
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { DOMANDE } from "@/lib/percorso/domande";
import { LUNGHEZZA_MASSIMA_RACCONTO } from "@/lib/percorso/racconto";
import { VOCI_RACCONTO, vociToccate } from "@/lib/percorso/racconto-checklist";
import { ESEMPI_RACCONTO, TESTI_RACCONTO, contatoreRacconto } from "@/lib/percorso/racconto-revisione";
import { ImmagineMascotte } from "~/components/mascotte";
import { MessaggioRacconto } from "~/components/racconto/messaggio";
import { Pulsante, Scheda, Testo, tocco } from "~/components/ui";
import { apriSito } from "~/lib/apri";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export function ScriviRacconto({
  testo,
  onCambia,
  inCorso,
  errore,
  onInvia,
  onDomande,
}: {
  testo: string;
  onCambia: (testo: string) => void;
  inCorso: boolean;
  errore: string | null;
  onInvia: () => void;
  onDomande: () => void;
}) {
  const c = useColori();
  const contatore = contatoreRacconto(testo.length);

  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
        <ImmagineMascotte nome="pensa" larghezza={72} />
        <Testo variante="titolo" style={{ flex: 1 }}>
          Racconta a Bleo cosa vuoi fare
        </Testo>
      </View>
      <Testo attenuato>{TESTI_RACCONTO.aiuto}</Testo>

      <View style={{ gap: SPAZIO.xs }}>
        <TextInput
          value={testo}
          onChangeText={onCambia}
          multiline
          maxLength={LUNGHEZZA_MASSIMA_RACCONTO}
          editable={!inCorso}
          placeholder={`Per esempio: ${ESEMPI_RACCONTO[0]}`}
          placeholderTextColor={c.attenuato}
          accessibilityLabel="La tua idea, con parole tue"
          accessibilityHint="Puoi anche dettare con il microfono della tastiera"
          textAlignVertical="top"
          autoCapitalize="sentences"
          style={{
            minHeight: 190,
            borderWidth: 1.5,
            borderColor: contatore.alMassimo ? c.accento : c.bordo,
            borderRadius: RAGGIO.m,
            padding: SPAZIO.m,
            paddingTop: SPAZIO.m,
            fontSize: 17,
            lineHeight: 24,
            color: c.testo,
            backgroundColor: c.scheda,
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.s }}>
          <Ionicons name="mic-outline" size={18} color={c.marchio} />
          <Testo variante="piccolo" attenuato style={{ flex: 1 }}>
            Puoi anche dettare con il microfono della tastiera.
          </Testo>
        </View>
        <Testo
          variante="piccolo"
          colore={contatore.alMassimo ? c.accento : c.attenuato}
          accessibilityLiveRegion={contatore.alMassimo ? "polite" : "none"}
          style={{ textAlign: contatore.alMassimo ? "left" : "right" }}
        >
          {contatore.testo}
        </Testo>
      </View>

      {errore ? <MessaggioRacconto testo={errore} /> : null}

      <View style={{ gap: SPAZIO.s }}>
        <Pulsante
          titolo={inCorso ? "Bleo sta leggendo…" : "Fatto, prepara il mio percorso"}
          icona="arrow-forward"
          caricamento={inCorso}
          onPress={onInvia}
          style={{ minHeight: 56 }}
        />
        {inCorso ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.s }} accessibilityLiveRegion="polite">
            <ActivityIndicator color={c.marchio} />
            <Testo variante="piccolo" attenuato style={{ flex: 1 }}>
              Bleo sta leggendo la tua descrizione. Ci vuole qualche secondo: non chiudere questa schermata.
            </Testo>
          </View>
        ) : null}
        <Pulsante
          titolo={`Preferisco rispondere alle ${DOMANDE.length} domande`}
          variante="testo"
          onPress={onDomande}
          disabilitato={inCorso}
        />
      </View>

      <ChecklistRacconto testo={testo} />

      <View style={{ gap: SPAZIO.s }}>
        <Testo variante="forte">Oppure parti da un esempio</Testo>
        {ESEMPI_RACCONTO.slice(1).map((esempio) => (
          <Pressable
            key={esempio}
            onPress={() => {
              tocco();
              onCambia(esempio);
            }}
            disabled={inCorso}
            accessibilityRole="button"
            accessibilityLabel={`Usa l'esempio: ${esempio}`}
            style={({ pressed }) => ({
              minHeight: 48,
              justifyContent: "center",
              borderRadius: RAGGIO.m,
              borderWidth: 1.5,
              borderColor: c.bordo,
              backgroundColor: c.scheda,
              paddingHorizontal: SPAZIO.m,
              paddingVertical: SPAZIO.s,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Testo variante="piccolo" attenuato>
              «{esempio}»
            </Testo>
          </Pressable>
        ))}
      </View>

      <Scheda tenue>
        <Testo variante="forte">Cosa fa Bleo con il tuo racconto</Testo>
        <Testo variante="piccolo">
          Propone le risposte alle {DOMANDE.length} domande solo da quello che scrivi: se una cosa non è chiara non la indovina, te la
          chiede. Prima di salvare controlli e correggi tutto tu. Non è una consulenza sul tuo caso.
        </Testo>
        <Testo variante="forte" style={{ marginTop: SPAZIO.s }}>
          I tuoi dati
        </Testo>
        <Testo variante="piccolo">{TESTI_RACCONTO.privacy}</Testo>
        <Testo variante="piccolo" attenuato>
          Se detti con il microfono, la voce la trasforma in testo la tastiera del telefono (di Apple o di Google), con le
          sue regole: Bleo riceve solo il testo.
        </Testo>
        <Pulsante
          titolo="Informativa sulla privacy"
          variante="testo"
          icona="open-outline"
          onPress={() => void apriSito("/privacy")}
          style={{ alignSelf: "flex-start" }}
        />
      </Scheda>
    </>
  );
}

/** «Cosa dire a Bleo»: le voci si spuntano da sole mentre scrivi o detti (è solo un aiuto, non sono risposte). */
function ChecklistRacconto({ testo }: { testo: string }) {
  const c = useColori();
  const toccate = useMemo(() => vociToccate(testo), [testo]);
  const importantiMancanti = VOCI_RACCONTO.filter((v) => v.importante && !toccate.has(v.id)).length;

  return (
    <Scheda style={{ gap: SPAZIO.s }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: SPAZIO.s }}>
        <Testo variante="sottotitolo">Cosa dire a Bleo</Testo>
        <Testo variante="piccolo" attenuato>
          {toccate.size} di {VOCI_RACCONTO.length}
        </Testo>
      </View>
      <Testo variante="piccolo" attenuato>
        Più cose dici, meno domande ti fa dopo. Le prime quattro sono le più importanti; le voci si spuntano da sole mentre
        scrivi.
      </Testo>
      <View style={{ gap: SPAZIO.s, marginTop: SPAZIO.xs }}>
        {VOCI_RACCONTO.map((voce) => {
          const fatta = toccate.has(voce.id);
          return (
            <View
              key={voce.id}
              accessible
              accessibilityLabel={`${voce.titolo}${voce.importante ? ", importante" : ""}: ${fatta ? "già detto" : "da dire"}. Per esempio ${voce.esempio}`}
              style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "flex-start" }}
            >
              <Ionicons
                name={fatta ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={fatta ? c.marchio : c.bordo}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1 }}>
                <Testo variante={fatta || voce.importante ? "forte" : "corpo"} style={{ fontSize: 15, lineHeight: 21 }}>
                  {voce.titolo}
                  {voce.importante ? <Testo colore={c.marchio}> *</Testo> : null}
                </Testo>
                <Testo variante="piccolo" attenuato>
                  {voce.esempio}
                </Testo>
              </View>
            </View>
          );
        })}
      </View>
      <Testo variante="piccolo" attenuato>
        <Testo variante="piccolo" colore={c.marchio}>
          *
        </Testo>{" "}
        le più importanti
        {testo.trim() && importantiMancanti > 0
          ? ` · ${importantiMancanti === 1 ? "ne manca 1" : `ne mancano ${importantiMancanti}`}`
          : testo.trim()
            ? " · ci sono tutte"
            : ""}
      </Testo>
    </Scheda>
  );
}
