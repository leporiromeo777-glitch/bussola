/**
 * Il risultato di «Testi pronti»: un riquadro per ogni testo, da modificare,
 * copiare o condividere, come sulla pagina del sito; poi «Rifai» per
 * un'altra versione.
 */
import { Share, TextInput, View } from "react-native";
import type { TestoPronto } from "@/lib/testi/richiesta";
import { ETICHETTE_LINGUA, ETICHETTE_TONO, TIPI, type Lingua, type TipoTesto, type Tono } from "@/lib/testi/tipi";
import { PulsanteCopia } from "~/components/strumenti-comuni";
import { Pulsante, Scheda, Testo } from "~/components/ui";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

/**
 * Altezza del campo secondo la lunghezza del testo (circa 34 caratteri per
 * riga sul telefono), così si legge tutto senza scorrere dentro il campo.
 */
function altezzaPer(testo: string): number {
  const righe = testo.split("\n").reduce((somma, riga) => somma + Math.max(1, Math.ceil(riga.length / 34)), 0);
  return Math.max(2, righe) * 23 + 2 * SPAZIO.m + 4;
}

/** Il titolo della parte «Oggetto» dell'email: va come oggetto quando si condivide il testo per email. */
const TITOLO_OGGETTO = TIPI.email.parti[0].titolo;

export function RisultatoTesti({
  tipo,
  tono,
  lingua,
  testi,
  inCorso,
  onModifica,
  onRifai,
  onCambiaDati,
}: {
  tipo: TipoTesto;
  tono: Tono;
  lingua: Lingua;
  testi: TestoPronto[];
  inCorso: boolean;
  onModifica: (indice: number, testo: string) => void;
  onRifai: () => void;
  onCambiaDati: () => void;
}) {
  const c = useColori();
  const oggetto = tipo === "email" ? testi.find((t) => t.titolo === TITOLO_OGGETTO)?.testo : undefined;

  async function condividi(testo: TestoPronto) {
    try {
      // Su iPhone l'oggetto dell'email si usa se condividi il testo con Mail.
      await Share.share({ message: testo.testo }, oggetto && testo.titolo !== TITOLO_OGGETTO ? { subject: oggetto } : undefined);
    } catch {
      // Condivisione chiusa o non disponibile: niente da fare.
    }
  }

  return (
    <View style={{ gap: SPAZIO.m }}>
      <View style={{ gap: SPAZIO.xs }}>
        <Testo variante="titolo">{TIPI[tipo].etichetta}</Testo>
        <Testo attenuato>
          {ETICHETTE_TONO[tono].etichetta} · {ETICHETTE_LINGUA[lingua]}. Puoi modificare il testo qui sotto prima di copiarlo.
        </Testo>
      </View>

      {testi.map((testo, indice) => (
        <Scheda key={`${indice}-${testo.titolo}`} style={{ gap: SPAZIO.s }}>
          <Testo variante="sottotitolo">{testo.titolo}</Testo>
          <TextInput
            value={testo.testo}
            onChangeText={(t) => onModifica(indice, t)}
            multiline
            scrollEnabled={false}
            accessibilityLabel={testo.titolo}
            accessibilityHint="Puoi modificare il testo prima di copiarlo"
            style={{
              fontSize: 16,
              lineHeight: 23,
              color: c.testo,
              backgroundColor: c.sfondo,
              borderWidth: 1.5,
              borderColor: c.bordo,
              borderRadius: RAGGIO.m,
              paddingHorizontal: SPAZIO.m,
              paddingTop: SPAZIO.m,
              paddingBottom: SPAZIO.m,
              minHeight: altezzaPer(testo.testo),
              textAlignVertical: "top",
            }}
          />
          <Testo variante="piccolo" attenuato style={{ fontVariant: ["tabular-nums"] }}>
            {testo.testo.length} caratteri
          </Testo>
          <View style={{ flexDirection: "row", gap: SPAZIO.s, alignItems: "flex-start" }}>
            <PulsanteCopia testo={testo.testo} descrizione={`«${testo.titolo}»`} style={{ flex: 1 }} />
            <Pulsante
              titolo="Condividi"
              variante="secondario"
              icona="share-outline"
              onPress={() => void condividi(testo)}
              suggerimento={`Condividi «${testo.titolo}» con un'altra app`}
              style={{ flex: 1, paddingHorizontal: SPAZIO.l }}
            />
          </View>
        </Scheda>
      ))}

      <Scheda tenue>
        <Testo>
          Controlla sempre il testo prima di usarlo: deve dire solo cose vere. Sostituisci le parti tra [parentesi quadre] con i
          tuoi dati.
        </Testo>
      </Scheda>

      <View style={{ gap: SPAZIO.s }}>
        <Pulsante
          titolo={inCorso ? "Bleo sta scrivendo…" : "Rifai: un'altra versione"}
          variante="secondario"
          icona="refresh-outline"
          caricamento={inCorso}
          onPress={onRifai}
        />
        <Testo variante="piccolo" attenuato>
          La nuova versione sostituisce questa: copia prima quello che vuoi tenere.
        </Testo>
        <Pulsante titolo="Cambia i dati o il tipo di testo" variante="testo" icona="create-outline" onPress={onCambiaDati} disabilitato={inCorso} />
      </View>
    </View>
  );
}
