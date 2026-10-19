import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import type { Casella } from "@/lib/conti/tipi";
import { Pulsante, Scheda, Testo } from "~/components/ui";
import { apriNelBrowser, apriSito } from "~/lib/apri";
import { oggiLocale } from "~/lib/stato";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

/** Data e ora ISO → data svizzera nel fuso del telefono. */
function dataLocale(iso: string): string {
  const d = new Date(iso);
  return dataSvizzera(Number.isNaN(d.getTime()) ? iso : oggiLocale(d));
}

const PASSI_GMAIL = [
  "Da un computer apri gmail.com, vai su Impostazioni → «Inoltro e POP/IMAP» e aggiungi l'indirizzo qui sopra come indirizzo di inoltro.",
  "Gmail manda un codice di conferma a questo indirizzo: dopo poco lo vedi comparire qui.",
  "Scrivi il codice in Gmail per confermare.",
  "Crea un filtro per le email con allegati che contengono «fattura», «ricevuta» o «invoice», e scegli «Inoltra a» questo indirizzo.",
];

function Copiabile({ testo, grande, etichetta }: { testo: string; grande?: boolean; etichetta: string }) {
  const c = useColori();
  const [copiato, setCopiato] = useState(false);
  async function copia() {
    await Clipboard.setStringAsync(testo).catch(() => {});
    setCopiato(true);
    setTimeout(() => setCopiato(false), 2000);
  }
  return (
    <View style={{ gap: SPAZIO.s }}>
      <View style={{ backgroundColor: c.marchioTenue, borderRadius: RAGGIO.m, padding: SPAZIO.m }}>
        <Testo
          selectable
          accessibilityLabel={`${etichetta}: ${testo}`}
          style={
            grande
              ? { fontSize: 30, fontWeight: "700", letterSpacing: 2, textAlign: "center", fontVariant: ["tabular-nums"] }
              : { fontSize: 16, fontWeight: "600" }
          }
        >
          {testo}
        </Testo>
      </View>
      <Pulsante
        titolo={copiato ? "Copiato" : "Copia"}
        variante="secondario"
        icona={copiato ? "checkmark" : "copy-outline"}
        onPress={() => void copia()}
        suggerimento={`Copia ${etichetta.toLowerCase()}`}
      />
      <Testo variante="piccolo" attenuato accessibilityLiveRegion="polite">
        {copiato ? `${etichetta} copiato.` : ""}
      </Testo>
    </View>
  );
}

/** «Ricevi le fatture in automatico»: indirizzo personale e inoltro da Gmail. */
export function SezioneCasella({
  casella,
  emailAttiva,
  attesa,
  onRigenera,
}: {
  casella: Casella | null;
  emailAttiva: boolean;
  attesa: boolean;
  onRigenera: () => void;
}) {
  const c = useColori();
  const indirizzo = casella?.indirizzo ?? null;
  const conferma = casella?.confermaGmail ?? null;
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="sottotitolo">Ricevi le fatture in automatico</Testo>
      <Scheda style={{ gap: SPAZIO.m }}>
        {!indirizzo ? (
          <>
            <Testo attenuato>
              La ricezione automatica delle fatture via email non è ancora attiva. Intanto puoi fotografare le ricevute o
              caricare i PDF.
            </Testo>
            {emailAttiva && casella ? (
              <Pulsante titolo="Crea il tuo indirizzo" variante="secondario" caricamento={attesa} onPress={onRigenera} />
            ) : null}
          </>
        ) : (
          <>
            <Testo>
              Inoltra a questo indirizzo personale le fatture e le ricevute che ricevi per email. Bleo le legge e le mette in
              «Da confermare».
            </Testo>
            <Copiabile testo={indirizzo} etichetta="Indirizzo" />
            {conferma?.codice || conferma?.link ? (
              <Scheda evidenziata style={{ gap: SPAZIO.s }}>
                <Testo variante="forte">Codice di conferma di Gmail</Testo>
                <Testo variante="piccolo" attenuato>
                  Arrivato il {dataLocale(conferma.ricevutaIl)}. Scrivilo in Gmail per attivare l&apos;inoltro.
                </Testo>
                {conferma.codice ? <Copiabile testo={conferma.codice} etichetta="Codice" grande /> : null}
                {conferma.link ? (
                  <Pulsante
                    titolo="Oppure conferma con il link di Gmail"
                    variante="testo"
                    icona="open-outline"
                    onPress={() => void apriNelBrowser(conferma.link ?? "")}
                  />
                ) : null}
              </Scheda>
            ) : null}
            <View style={{ gap: SPAZIO.s }}>
              <Testo variante="forte">Come fare con Gmail</Testo>
              {PASSI_GMAIL.map((passo, i) => (
                <View key={passo} style={{ flexDirection: "row", gap: SPAZIO.s }}>
                  <Testo variante="forte" colore={c.marchio} style={{ width: 20 }}>
                    {i + 1}.
                  </Testo>
                  <Testo style={{ flex: 1 }}>{passo}</Testo>
                </View>
              ))}
              <Pulsante
                titolo="Guida completa sul sito"
                variante="testo"
                icona="open-outline"
                onPress={() => void apriSito("/conti")}
                style={{ alignSelf: "flex-start" }}
              />
            </View>
            {casella?.ultimaEmail ? (
              <Testo variante="piccolo" attenuato>
                Ultima email ricevuta il {dataLocale(casella.ultimaEmail)}.
              </Testo>
            ) : null}
            <Testo variante="piccolo" attenuato>
              Le voci arrivate per email non contano finché non le confermi tu.
            </Testo>
            <Pulsante
              titolo="Cambia indirizzo"
              variante="testo"
              caricamento={attesa}
              onPress={onRigenera}
              suggerimento="Crea un indirizzo nuovo: quello vecchio smette di funzionare"
              style={{ alignSelf: "flex-start" }}
            />
          </>
        )}
      </Scheda>
    </View>
  );
}
