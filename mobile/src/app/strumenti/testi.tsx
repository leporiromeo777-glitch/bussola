/**
 * «Testi pronti» nell'app, come sul sito (/strumenti/testi): scegli il tipo
 * di testo, descrivi la tua attività e Bleo scrive un testo da controllare,
 * modificare, copiare o condividere. Stessa API, stessi tipi, toni e lingue,
 * stessi limiti del sito. Cosa fai e dove lavori si riprendono dal
 * questionario, se l'hai fatto. I testi non si salvano.
 */
import { Stack, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, View, type ScrollView } from "react-native";
import { precompilaDaRisposte } from "@/lib/testi/precompila";
import {
  LUNGHEZZA_MASSIMA_CLIENTI,
  LUNGHEZZA_MASSIMA_DESCRIZIONE,
  LUNGHEZZA_MASSIMA_LUOGO,
  LUNGHEZZA_MASSIMA_NOME,
  MESSAGGI_TESTI,
  leggiRichiestaTesti,
  type RichiestaTesti,
  type TestoPronto,
} from "@/lib/testi/richiesta";
import { ETICHETTE_LINGUA, ETICHETTE_TONO, LINGUE, TIPI, TIPI_TESTO, TONI, type Lingua, type TipoTesto, type Tono } from "@/lib/testi/tipi";
import { CampoTesto, Scelta } from "~/components/campi";
import { ImmagineMascotte } from "~/components/mascotte";
import { MessaggioErrore, SceltaSchede, SchermataScorrevole } from "~/components/strumenti-comuni";
import { RisultatoTesti } from "~/components/testi/risultato-testi";
import { Pulsante, Scheda, Schermata, Testo } from "~/components/ui";
import { useRisposte } from "~/lib/stato";
import { scriviTesti, testiPronti } from "~/lib/testi";
import { SPAZIO, useColori } from "~/lib/tema";

const OPZIONI_TIPO = TIPI_TESTO.map((t) => ({ valore: t, etichetta: TIPI[t].etichetta, descrizione: TIPI[t].descrizione }));
const OPZIONI_TONO = TONI.map((t) => ({ valore: t, etichetta: ETICHETTE_TONO[t].etichetta, descrizione: ETICHETTE_TONO[t].descrizione }));
const OPZIONI_LINGUA = LINGUE.map((l) => ({ valore: l, etichetta: ETICHETTE_LINGUA[l] }));

const ESEMPIO_DESCRIZIONE =
  "Per esempio: faccio foto di matrimoni e feste di famiglia, soprattutto all'aperto, con uno stile naturale.";

type Risultato = { richiesta: RichiestaTesti; testi: TestoPronto[] };

export default function TestiPronti() {
  const c = useColori();
  const scorri = useRef<ScrollView>(null);
  const invio = useRef<AbortController | null>(null);
  const salvate = useRisposte();
  const precompilati = precompilaDaRisposte(salvate?.risposte);

  const [attivo, setAttivo] = useState<boolean | null>(null);
  const [tipo, setTipo] = useState<TipoTesto>("social");
  // null = non ancora toccato: vale quello ripreso dal questionario.
  const [descrizioneScritta, setDescrizione] = useState<string | null>(null);
  const [luogoScritto, setLuogo] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [clienti, setClienti] = useState("");
  const [tono, setTono] = useState<Tono>("amichevole");
  const [lingua, setLingua] = useState<Lingua>("it");

  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [risultato, setRisultato] = useState<Risultato | null>(null);
  const [mostraModulo, setMostraModulo] = useState(true);

  const descrizione = descrizioneScritta ?? precompilati.descrizione;
  const luogo = luogoScritto ?? precompilati.luogo;
  const ripresaDalQuestionario = descrizioneScritta === null && precompilati.descrizione !== "";

  useEffect(() => {
    let valido = true;
    void testiPronti().then((v) => {
      if (valido) setAttivo(v);
    });
    return () => {
      valido = false;
      invio.current?.abort();
    };
  }, []);

  async function chiedi(richiesta: RichiestaTesti) {
    invio.current?.abort();
    const questo = new AbortController();
    invio.current = questo;
    setErrore(null);
    setInCorso(true);
    const esito = await scriviTesti(richiesta, questo.signal);
    if (invio.current !== questo) return;
    invio.current = null;
    setInCorso(false);
    if (esito.ok) {
      setRisultato({ richiesta, testi: esito.testi });
      setMostraModulo(false);
      scorri.current?.scrollTo({ y: 0, animated: false });
      AccessibilityInfo.announceForAccessibility("Il testo è pronto.");
      return;
    }
    if ("annullata" in esito) return;
    setErrore(esito.messaggio);
    if (esito.messaggio === MESSAGGI_TESTI.nonAttivo) setAttivo(false);
  }

  function invia() {
    if (inCorso) return;
    const controllo = leggiRichiestaTesti({ tipo, descrizione, nome, luogo, clienti, tono, lingua, rifai: false });
    if (!controllo.ok) {
      const vuota = descrizione.trim() === "";
      setErrore(vuota ? MESSAGGI_TESTI.descrizioneMancante : controllo.messaggio);
      return;
    }
    void chiedi(controllo.dati);
  }

  if (attivo === false) return <NonAttivo />;

  return (
    <SchermataScorrevole rif={scorri}>
      <Stack.Screen options={{ title: "Testi pronti" }} />
      {risultato && !mostraModulo ? (
        <>
          <RisultatoTesti
            tipo={risultato.richiesta.tipo}
            tono={risultato.richiesta.tono}
            lingua={risultato.richiesta.lingua}
            testi={risultato.testi}
            inCorso={inCorso}
            onModifica={(indice, testo) =>
              setRisultato((prima) =>
                prima ? { ...prima, testi: prima.testi.map((t, i) => (i === indice ? { ...t, testo } : t)) } : prima,
              )
            }
            onRifai={() => void chiedi({ ...risultato.richiesta, rifai: true })}
            onCambiaDati={() => {
              setMostraModulo(true);
              scorri.current?.scrollTo({ y: 0, animated: false });
            }}
          />
          {errore ? <MessaggioErrore testo={errore} /> : null}
        </>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
            <ImmagineMascotte nome="scrivania" larghezza={88} />
            <Testo attenuato style={{ flex: 1 }}>
              Dimmi cosa fai e Bleo ti scrive un testo da usare subito: per il sito o Instagram, una prima email a un cliente,
              un preventivo o per spiegare la tua attività in breve. Poi lo controlli, lo cambi e lo copi.
            </Testo>
          </View>

          <Testo variante="sottotitolo">1. Che testo ti serve?</Testo>
          <SceltaSchede etichetta="Tipo di testo" opzioni={OPZIONI_TIPO} valore={tipo} onCambia={setTipo} disabilitata={inCorso} />

          <Testo variante="sottotitolo">2. Parlami della tua attività</Testo>
          <CampoTesto
            etichetta="Cosa fai?"
            valore={descrizione}
            onCambia={setDescrizione}
            aiuto={
              ripresaDalQuestionario
                ? "L'ho ripreso dal tuo questionario: aggiungi qualche dettaglio su cosa fai di preciso e come lavori."
                : "Con parole tue. Bleo usa solo quello che scrivi qui: niente viene inventato."
            }
            segnaposto={ESEMPIO_DESCRIZIONE}
            righe={4}
            massimo={LUNGHEZZA_MASSIMA_DESCRIZIONE}
          />
          <CampoTesto
            etichetta="Il tuo nome o il nome della ditta (facoltativo)"
            valore={nome}
            onCambia={setNome}
            segnaposto="Per esempio: Sara Bernasconi Fotografia"
            massimo={LUNGHEZZA_MASSIMA_NOME}
            maiuscole="words"
          />
          <CampoTesto
            etichetta="Dove lavori (facoltativo)"
            valore={luogo}
            onCambia={setLuogo}
            segnaposto="Per esempio: Lugano e dintorni"
            massimo={LUNGHEZZA_MASSIMA_LUOGO}
          />
          <CampoTesto
            etichetta="Chi sono i tuoi clienti (facoltativo)"
            valore={clienti}
            onCambia={setClienti}
            segnaposto="Per esempio: coppie che si sposano, famiglie"
            righe={2}
            massimo={LUNGHEZZA_MASSIMA_CLIENTI}
          />

          <Testo variante="sottotitolo">3. Come deve suonare?</Testo>
          <SceltaSchede etichetta="Tono" opzioni={OPZIONI_TONO} valore={tono} onCambia={setTono} disabilitata={inCorso} />
          <Scelta etichetta="Lingua del testo" opzioni={OPZIONI_LINGUA} valore={lingua} onCambia={setLingua} />

          {errore ? <MessaggioErrore testo={errore} /> : null}
          <Pulsante
            titolo={inCorso ? "Bleo sta scrivendo…" : "Scrivi il testo"}
            icona="arrow-forward"
            caricamento={inCorso}
            onPress={invia}
            style={{ minHeight: 56 }}
          />
          {inCorso ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.s }} accessibilityLiveRegion="polite">
              <ActivityIndicator color={c.marchio} />
              <Testo variante="piccolo" attenuato style={{ flex: 1 }}>
                Bleo sta scrivendo il testo: non chiudere questa schermata.
              </Testo>
            </View>
          ) : null}
          {risultato ? (
            <Pulsante
              titolo="Torna al testo di prima"
              variante="testo"
              icona="arrow-undo-outline"
              onPress={() => {
                setErrore(null);
                setMostraModulo(false);
                scorri.current?.scrollTo({ y: 0, animated: false });
              }}
              disabilitato={inCorso}
            />
          ) : null}
          <Testo variante="piccolo" attenuato>
            Quello che scrivi lo legge l&apos;intelligenza artificiale che usa Bleo (Claude, di Anthropic) solo per scrivere il
            testo: noi non lo salviamo. Non scrivere dati personali come indirizzo, telefono o numero AVS.
          </Testo>
        </>
      )}
    </SchermataScorrevole>
  );
}

function NonAttivo() {
  return (
    <Schermata>
      <Stack.Screen options={{ title: "Testi pronti" }} />
      <Scheda style={{ alignItems: "center", gap: SPAZIO.m }}>
        <ImmagineMascotte nome="pensa" larghezza={96} />
        <Testo variante="sottotitolo" style={{ textAlign: "center" }}>
          Ci stiamo ancora lavorando
        </Testo>
        <Testo attenuato style={{ textAlign: "center" }}>
          «Testi pronti» non è ancora attivo. Presto Bleo potrà scrivere per te la descrizione per il sito o Instagram, la
          prima email a un cliente e l&apos;introduzione dei tuoi preventivi.
        </Testo>
        <Pulsante titolo="Intanto guarda gli altri strumenti" variante="secondario" onPress={() => router.back()} />
      </Scheda>
    </Schermata>
  );
}
