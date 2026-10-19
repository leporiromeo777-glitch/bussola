/**
 * Il controllo di «Racconta a Bleo»: il riassunto di Bleo e le 10 domande
 * con la risposta proposta (o «Da rispondere»). Tocchi una riga e scegli
 * un'altra risposta; niente si salva finché non confermi.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import type { Bozza } from "@/lib/percorso/bozza";
import { DOMANDE } from "@/lib/percorso/domande";
import {
  cambiaRisposta,
  messaggioRevisione,
  riepilogoRevisione,
  vociRevisione,
  type VoceRevisione,
} from "@/lib/percorso/racconto-revisione";
import { LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO, type IdDomanda } from "@/lib/percorso/risposte";
import { ImmagineMascotte } from "~/components/mascotte";
import { NotaInformazione, Pulsante, Testo, tocco } from "~/components/ui";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export function RevisioneRacconto({
  riassunto,
  proposta,
  bozza,
  onCambia,
  onConferma,
  onRiscrivi,
  onDomande,
}: {
  riassunto: string;
  /** Le risposte capite dal racconto (per contarle). */
  proposta: Bozza;
  /** Le risposte da controllare: quelle del racconto sopra quelle che c'erano già. */
  bozza: Bozza;
  onCambia: (bozza: Bozza) => void;
  onConferma: () => void;
  onRiscrivi: () => void;
  onDomande: () => void;
}) {
  const [aperta, setAperta] = useState<IdDomanda | null>(null);
  const riepilogo = riepilogoRevisione(proposta, bozza);
  const voci = vociRevisione(bozza);
  const capitoPoco = riepilogo.capite === 0;

  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPAZIO.m }}>
        <ImmagineMascotte nome="checklist" larghezza={72} />
        <View style={{ flex: 1, gap: SPAZIO.xs }}>
          <Testo variante="sottotitolo">{riassunto}</Testo>
          <Testo attenuato>{messaggioRevisione(riepilogo)}</Testo>
        </View>
      </View>

      {capitoPoco ? (
        <View style={{ gap: SPAZIO.s }}>
          <Pulsante titolo="Riscrivi la descrizione" icona="create-outline" onPress={onRiscrivi} style={{ minHeight: 56 }} />
          <Pulsante titolo={`Rispondi alle ${DOMANDE.length} domande`} variante="secondario" onPress={onDomande} />
        </View>
      ) : (
        <>
          <View style={{ gap: SPAZIO.s }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: SPAZIO.s }}>
              <Testo variante="sottotitolo">Controlla le risposte</Testo>
              <Testo variante="piccolo" attenuato>
                {DOMANDE.length - riepilogo.mancanti} di {DOMANDE.length}
              </Testo>
            </View>
            {voci.map((voce) => (
              <RigaRevisione
                key={voce.id}
                voce={voce}
                aperta={aperta === voce.id}
                altro={bozza.attivitaAltro ?? ""}
                onApri={() => setAperta(aperta === voce.id ? null : voce.id)}
                onScegli={(valore) => {
                  tocco();
                  onCambia(cambiaRisposta(bozza, voce.id, valore));
                  // Con «Altro» la riga resta aperta per descrivere l'attività.
                  if (!(voce.id === "attivita" && valore === "altro")) setAperta(null);
                }}
                onAltro={(testo) => onCambia({ ...bozza, attivitaAltro: testo.slice(0, LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO) })}
              />
            ))}
          </View>

          <View style={{ gap: SPAZIO.s }}>
            <Pulsante
              titolo={
                riepilogo.mancanti === 0
                  ? "Conferma e vedi il percorso"
                  : riepilogo.mancanti === 1
                    ? "Conferma e rispondi a quella che manca"
                    : `Conferma e rispondi alle ${riepilogo.mancanti} che mancano`
              }
              icona="arrow-forward"
              onPress={onConferma}
              style={{ minHeight: 56 }}
            />
            <Pulsante titolo="Riscrivi la descrizione" variante="secondario" onPress={onRiscrivi} />
            <Testo variante="piccolo" attenuato>
              Finché non confermi non cambia niente. Dopo puoi sempre correggere le risposte rifacendo il questionario.
            </Testo>
          </View>
        </>
      )}
      <NotaInformazione />
    </>
  );
}

function RigaRevisione({
  voce,
  aperta,
  altro,
  onApri,
  onScegli,
  onAltro,
}: {
  voce: VoceRevisione;
  aperta: boolean;
  altro: string;
  onApri: () => void;
  onScegli: (valore: string) => void;
  onAltro: (testo: string) => void;
}) {
  const c = useColori();
  const manca = voce.valore === null;
  return (
    <View
      style={{
        borderRadius: RAGGIO.m,
        borderWidth: aperta ? 2 : 1.5,
        borderColor: aperta ? c.marchio : manca ? c.accento : c.bordo,
        backgroundColor: c.scheda,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onApri}
        accessibilityRole="button"
        accessibilityLabel={`${voce.breve}: ${voce.risposta ?? "da rispondere"}`}
        accessibilityHint={aperta ? "Chiude le risposte possibili" : "Mostra le risposte possibili per cambiarla"}
        accessibilityState={{ expanded: aperta }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: SPAZIO.m,
          minHeight: 60,
          paddingHorizontal: SPAZIO.m,
          paddingVertical: SPAZIO.s,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons
          name={manca ? "help-circle-outline" : "checkmark-circle"}
          size={22}
          color={manca ? c.accento : c.marchio}
        />
        <View style={{ flex: 1 }}>
          <Testo variante="piccolo" attenuato>
            {voce.breve}
          </Testo>
          <Testo variante="forte" colore={manca ? c.accento : undefined}>
            {voce.risposta ?? "Da rispondere"}
          </Testo>
        </View>
        <Testo variante="piccolo" colore={c.marchio} style={{ fontWeight: "600" }}>
          {aperta ? "Chiudi" : manca ? "Rispondi" : "Cambia"}
        </Testo>
        <Ionicons name={aperta ? "chevron-up" : "chevron-down"} size={18} color={c.marchio} />
      </Pressable>

      {aperta ? (
        <View style={{ paddingHorizontal: SPAZIO.m, paddingBottom: SPAZIO.m, gap: SPAZIO.s }}>
          <Testo variante="forte">{voce.titolo}</Testo>
          <View accessibilityRole="radiogroup" style={{ gap: SPAZIO.s }}>
            {voce.opzioni.map((o) => {
              const attiva = voce.valore === o.valore;
              return (
                <Pressable
                  key={o.valore}
                  onPress={() => onScegli(o.valore)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: attiva }}
                  accessibilityLabel={o.aiuto ? `${o.etichetta}. ${o.aiuto}` : o.etichetta}
                  style={({ pressed }) => ({
                    borderRadius: RAGGIO.m,
                    borderWidth: attiva ? 2 : 1.5,
                    borderColor: attiva ? c.marchio : c.bordo,
                    backgroundColor: attiva ? c.marchioTenue : c.sfondo,
                    paddingHorizontal: SPAZIO.m,
                    paddingVertical: SPAZIO.s,
                    minHeight: 48,
                    justifyContent: "center",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Testo variante="forte">{o.etichetta}</Testo>
                  {o.aiuto ? (
                    <Testo variante="piccolo" attenuato>
                      {o.aiuto}
                    </Testo>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          {voce.id === "attivita" && voce.valore === "altro" ? (
            <View style={{ gap: SPAZIO.xs }}>
              <Testo variante="forte">Descrivila in poche parole (facoltativo)</Testo>
              <TextInput
                value={altro}
                onChangeText={onAltro}
                maxLength={LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO}
                placeholder="Per esempio: noleggio di biciclette"
                placeholderTextColor={c.attenuato}
                accessibilityLabel="Descrizione dell'attività"
                style={{
                  borderWidth: 1.5,
                  borderColor: c.bordo,
                  borderRadius: RAGGIO.m,
                  padding: SPAZIO.m,
                  fontSize: 16,
                  color: c.testo,
                  backgroundColor: c.sfondo,
                }}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
