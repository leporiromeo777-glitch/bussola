import { router } from "expo-router";
import { useMemo } from "react";
import { RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LEZIONI } from "@/data/corso";
import { dataSvizzera } from "@/data/svizzera";
import { annoScadenzario, eventiDaScadenze } from "@/lib/percorso/calendario";
import { avanzamento, prossimoPasso } from "@/lib/percorso/regole";
import { ImmagineMascotte } from "~/components/mascotte";
import { SezioneOggi } from "~/components/oggi/sezione-oggi";
import {
  BarraProgresso,
  NotaInformazione,
  Pulsante,
  RigaMenu,
  Schermata,
  Scheda,
  Separatore,
  Testo,
} from "~/components/ui";
import { useDaConfermare } from "~/lib/conti";
import { useOggi } from "~/lib/oggi";
import { oggiLocale, usePassiFatti, usePercorso } from "~/lib/stato";
import { SPAZIO, useColori } from "~/lib/tema";

export default function Inizio() {
  const c = useColori();
  const dati = usePercorso();
  const fatti = usePassiFatti();
  const statoOggi = useOggi();

  const prossimeScadenze = useMemo(() => {
    if (!dati) return [];
    const oggi = oggiLocale();
    const anno = annoScadenzario(new Date());
    return [
      ...eventiDaScadenze(dati.percorso.scadenze, { anno: anno - 1 }),
      ...eventiDaScadenze(dati.percorso.scadenze, { anno }),
    ]
      .filter((e) => e.data >= oggi)
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 3);
  }, [dati]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.sfondo }}>
      <Schermata
        refreshControl={<RefreshControl refreshing={statoOggi.aggiornando} onRefresh={statoOggi.aggiorna} tintColor={c.marchio} />}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
          <ImmagineMascotte nome="coppia" larghezza={112} />
          <View style={{ flex: 1, gap: SPAZIO.xs }}>
            <Testo variante="titolo">Ciao, sono Bleo</Testo>
            <Testo attenuato>Si dice «Blìo». Ti accompagno passo per passo ad aprire la tua attività.</Testo>
          </View>
        </View>

        <SezioneOggi stato={statoOggi} percorso={dati?.percorso ?? null} />

        {!dati ? (
          <Scheda evidenziata>
            <Testo variante="sottotitolo">Da dove parto?</Testo>
            <Testo>
              Rispondi a 10 domande in circa 5 minuti: ti preparo i passi per aprire la ditta individuale, nell&apos;ordine
              giusto e con i link ufficiali.
            </Testo>
            <Pulsante titolo="Inizia il questionario" icona="arrow-forward" onPress={() => router.push("/questionario")} />
          </Scheda>
        ) : (
          <>
            <Avanzamento fatti={avanzamento(dati.percorso, fatti)} />
            <Prossimo voce={prossimoPasso(dati.percorso, fatti)} />
            <Scheda>
              <Testo variante="sottotitolo">Prossime scadenze</Testo>
              {prossimeScadenze.length === 0 ? (
                <Testo attenuato>Nessuna scadenza con data nei prossimi mesi.</Testo>
              ) : (
                prossimeScadenze.map((e) => (
                  <View key={e.uid} style={{ flexDirection: "row", gap: SPAZIO.m, paddingVertical: SPAZIO.xs }}>
                    <Testo variante="forte" colore={c.marchio} style={{ width: 92 }}>
                      {dataSvizzera(e.data)}
                    </Testo>
                    <Testo style={{ flex: 1 }}>{e.titolo}</Testo>
                  </View>
                ))
              )}
              <Pulsante titolo="Tutte le scadenze" variante="testo" onPress={() => router.push("/percorso")} />
            </Scheda>
          </>
        )}

        <Scheda style={{ paddingVertical: SPAZIO.xs }}>
          <RigaMenu
            titolo="Il corso di Bleo"
            sottotitolo={`${LEZIONI.length} video brevi, uno per ogni passo`}
            icona="school-outline"
            onPress={() => router.push("/corso")}
          />
        </Scheda>
        <ContiEStrumenti />
        <NotaInformazione />
      </Schermata>
    </SafeAreaView>
  );
}

function ContiEStrumenti() {
  const daConfermare = useDaConfermare();
  return (
    <Scheda>
      <RigaMenu
        titolo="I tuoi conti"
        sottotitolo={
          daConfermare
            ? daConfermare === 1
              ? "1 voce da confermare"
              : `${daConfermare} voci da confermare`
            : "Ricevute, entrate e uscite in ordine"
        }
        icona="wallet-outline"
        onPress={() => router.push("/conti")}
      />
      <Separatore />
      <RigaMenu
        titolo="Fotografa la lettera"
        sottotitolo="Bleo ti spiega le lettere degli uffici"
        icona="mail-open-outline"
        onPress={() => router.push("/strumenti/lettera")}
      />
      <Separatore />
      <RigaMenu
        titolo="Calcoli e strumenti"
        sottotitolo="Tariffa oraria, contributi AVS, fattura con codice QR"
        icona="calculator-outline"
        onPress={() => router.push("/strumenti")}
      />
    </Scheda>
  );
}

function Avanzamento({ fatti }: { fatti: { fatti: number; totale: number } }) {
  const finito = fatti.totale > 0 && fatti.fatti === fatti.totale;
  return (
    <Scheda>
      <Testo variante="sottotitolo">Il tuo percorso</Testo>
      <BarraProgresso fatti={fatti.fatti} totale={fatti.totale} />
      <Testo attenuato>
        {finito ? "Hai fatto tutti i passi: complimenti!" : `${fatti.fatti} passi fatti su ${fatti.totale}`}
      </Testo>
      {finito ? <ImmagineMascotte nome="festa" larghezza={160} style={{ alignSelf: "center" }} /> : null}
    </Scheda>
  );
}

function Prossimo({ voce }: { voce: ReturnType<typeof prossimoPasso> }) {
  if (!voce) return null;
  return (
    <Scheda evidenziata>
      <Testo variante="etichetta" attenuato>
        PROSSIMO PASSO
      </Testo>
      <Testo variante="sottotitolo">{voce.passo.titolo}</Testo>
      <Testo attenuato>{voce.perche}</Testo>
      <Pulsante
        titolo="Cosa fare"
        icona="arrow-forward"
        onPress={() => router.push({ pathname: "/passo/[id]", params: { id: voce.passo.id } })}
      />
    </Scheda>
  );
}
