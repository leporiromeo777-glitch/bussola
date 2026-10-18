import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, View } from "react-native";
import { dataSvizzera } from "@/data/svizzera";
import type { Casella, FatturaEmessa, Movimento, RispostaConti } from "@/lib/conti/tipi";
import { SezioneCasella } from "~/components/conti/casella-email";
import { SezioneFatture } from "~/components/conti/fatture";
import { FoglioModifica } from "~/components/conti/foglio-modifica";
import { bozzaDa, ModuloMovimento } from "~/components/conti/modulo-movimento";
import { SezioneRiepilogo } from "~/components/conti/riepilogo";
import { RigaMovimento, SchedaDaConfermare } from "~/components/conti/scheda-movimento";
import { ImmagineMascotte } from "~/components/mascotte";
import { ElencoStrumenti } from "~/components/strumenti";
import { Pulsante, RigaMenu, Schermata, Scheda, Separatore, Testo } from "~/components/ui";
import { apriSito } from "~/lib/apri";
import {
  aggiornaMovimento,
  annoCorrente,
  caricaConti,
  contaDaConfermare,
  creaMovimento,
  eliminaMovimento,
  impostaDaConfermare,
  inviaRicevuta,
  leggiCasella,
  rigeneraCasella,
  segnaFattura,
  type NuovoMovimento,
} from "~/lib/conti";
import { avvisa, chiediConferma } from "~/lib/conferma";
import { scattaFoto, scegliFoto, scegliPdf, type SceltaFile } from "~/lib/ricevute";
import { useSessione } from "~/lib/sessione";
import { oggiLocale } from "~/lib/stato";
import { supabase } from "~/lib/supabase";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

const ANNI_INDIETRO = 5;

export default function Conti() {
  const { pronta, sessione } = useSessione();

  if (!supabase()) {
    return (
      <Schermata>
        <Presentazione />
        <Scheda tenue>
          <Testo>In questa versione di prova i conti non sono ancora attivi.</Testo>
        </Scheda>
        <CalcoliEStrumenti />
        <NotaConti />
      </Schermata>
    );
  }
  if (!pronta) return <Schermata>{null}</Schermata>;
  if (!sessione) {
    return (
      <Schermata>
        <Presentazione />
        <Pulsante titolo="Accedi" icona="arrow-forward" onPress={() => router.push("/accedi")} />
        <Testo variante="piccolo" attenuato>
          Ti basta l&apos;email: ti mando un codice, senza password.
        </Testo>
        <CalcoliEStrumenti />
        <NotaConti />
      </Schermata>
    );
  }
  return <ContiUtente />;
}

function Presentazione() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m }}>
      <ImmagineMascotte nome="scrivania" larghezza={96} />
      <View style={{ flex: 1, gap: SPAZIO.xs }}>
        <Testo variante="sottotitolo">Entrate e uscite in ordine</Testo>
        <Testo attenuato>
          Fotografi le ricevute e inoltri le fatture: Bleo le legge e le mette in ordine. Decidi sempre tu cosa conta per la
          ditta.
        </Testo>
      </View>
    </View>
  );
}

function CalcoliEStrumenti() {
  return (
    <View style={{ gap: SPAZIO.s }}>
      <Testo variante="sottotitolo">Calcoli e strumenti</Testo>
      <ElencoStrumenti />
    </View>
  );
}

function NotaConti() {
  return (
    <Testo variante="piccolo" attenuato>
      Bleo ti aiuta a tenere in ordine i tuoi conti, ma non fa la contabilità né la dichiarazione d&apos;imposta al posto tuo.
      Per le domande fiscali rivolgiti a un fiduciario autorizzato.
    </Testo>
  );
}

type Errore = { messaggio: string; stato: number | null };

function ContiUtente() {
  const c = useColori();
  const [anno, setAnno] = useState(annoCorrente());
  const [dati, setDati] = useState<RispostaConti | null>(null);
  const [casella, setCasella] = useState<Casella | null>(null);
  const [errore, setErrore] = useState<Errore | null>(null);
  const [aggiornando, setAggiornando] = useState(false);
  const [lettura, setLettura] = useState(false);
  const [avvisoLettura, setAvvisoLettura] = useState("");
  const [attesaCasella, setAttesaCasella] = useState(false);
  const [inModifica, setInModifica] = useState<Movimento | null>(null);
  const [aggiungi, setAggiungi] = useState(false);
  const [tuttiMovimenti, setTuttiMovimenti] = useState(false);
  const richiesta = useRef(0);
  /** Modifiche in corso: finché ce ne sono, una lettura dal server non sovrascrive le voci già cambiate qui. */
  const inCorso = useRef(0);

  const carica = useCallback(
    async (modo: "silenzioso" | "tirato" = "silenzioso") => {
      const numero = ++richiesta.current;
      if (modo === "tirato") setAggiornando(true);
      const [conti, cas] = await Promise.all([caricaConti(anno), leggiCasella()]);
      if (numero !== richiesta.current) return;
      setAggiornando(false);
      if (conti.ok) {
        if (inCorso.current === 0) setDati(conti.dati);
        setErrore(null);
      } else {
        setErrore({ messaggio: conti.messaggio, stato: conti.stato });
      }
      if (cas.ok) setCasella(cas.dati);
    },
    [anno],
  );

  // Aggiorna ogni volta che la scheda torna in primo piano (e quando cambia l'anno).
  useFocusEffect(
    useCallback(() => {
      void carica();
    }, [carica]),
  );

  // Il pallino sulla scheda segue le voci da confermare dell'anno in corso.
  useEffect(() => {
    if (dati && dati.riepilogo.anno === annoCorrente()) impostaDaConfermare(contaDaConfermare(dati.movimenti));
  }, [dati]);

  function cambiaAnno(nuovo: number) {
    richiesta.current++;
    setDati(null);
    setErrore(null);
    setAnno(nuovo);
  }

  /** Esegue una modifica ottimistica e poi rilegge i conti dal server. */
  async function conModifica<T>(azione: () => Promise<T>): Promise<T> {
    inCorso.current++;
    try {
      return await azione();
    } finally {
      inCorso.current--;
      void carica();
    }
  }

  function sostituisci(id: string, nuovo: Movimento | null) {
    setDati((d) =>
      d && {
        ...d,
        movimenti: nuovo ? d.movimenti.map((m) => (m.id === id ? nuovo : m)) : d.movimenti.filter((m) => m.id !== id),
      },
    );
  }

  async function decidi(m: Movimento, stato: "confermato" | "privato") {
    sostituisci(m.id, { ...m, stato });
    const esito = await conModifica(() => aggiornaMovimento(m.id, { stato }));
    if (!esito.ok) {
      sostituisci(m.id, m);
      avvisa("Non è stato possibile salvare", esito.messaggio);
      return;
    }
    sostituisci(m.id, esito.dati);
  }

  async function salvaModifica(m: Movimento, modifiche: NuovoMovimento): Promise<boolean> {
    const ottimista: Movimento = { ...m, ...modifiche, controparte: modifiche.controparte ?? null };
    sostituisci(m.id, ottimista);
    setInModifica(null);
    const esito = await conModifica(() => aggiornaMovimento(m.id, modifiche));
    if (!esito.ok) {
      sostituisci(m.id, m);
      avvisa("Non è stato possibile salvare", esito.messaggio);
      return false;
    }
    sostituisci(m.id, esito.dati);
    return true;
  }

  async function elimina(m: Movimento) {
    const indice = dati?.movimenti.findIndex((x) => x.id === m.id) ?? -1;
    sostituisci(m.id, null);
    const esito = await conModifica(() => eliminaMovimento(m.id));
    if (!esito.ok) {
      setDati((d) => {
        if (!d || d.movimenti.some((x) => x.id === m.id)) return d;
        const movimenti = [...d.movimenti];
        movimenti.splice(indice < 0 ? 0 : indice, 0, m);
        return { ...d, movimenti };
      });
      avvisa("Non è stato possibile eliminare", esito.messaggio);
    }
  }

  async function aggiungiAMano(nuovo: NuovoMovimento): Promise<boolean> {
    const esito = await conModifica(() => creaMovimento(nuovo));
    if (!esito.ok) {
      avvisa("Non è stato possibile aggiungere", esito.messaggio);
      return false;
    }
    if (Number(esito.dati.data.slice(0, 4)) === anno) setDati((d) => d && { ...d, movimenti: [esito.dati, ...d.movimenti] });
    setAvvisoLettura(`Aggiunto: ${esito.dati.descrizione}, ${dataSvizzera(esito.dati.data)}.`);
    return true;
  }

  function segnaPagata(f: FatturaEmessa) {
    const oggi = oggiLocale();
    chiediConferma({
      titolo: "Segnare la fattura come pagata?",
      messaggio: `Fattura ${f.numero} di ${f.cliente}, pagata oggi ${dataSvizzera(oggi)}.`,
      conferma: "Sì, è pagata",
      onConferma: () => void conferma(),
    });
    async function conferma() {
      const cambia = (nuova: FatturaEmessa) =>
        setDati((d) => d && { ...d, fatture: d.fatture.map((x) => (x.id === f.id ? nuova : x)) });
      cambia({ ...f, stato: "pagata", pagataIl: oggi });
      const esito = await conModifica(() => segnaFattura(f.id, oggi));
      if (!esito.ok) {
        cambia(f);
        avvisa("Non è stato possibile salvare", esito.messaggio);
        return;
      }
      cambia(esito.dati);
    }
  }

  async function leggiRicevuta(scegli: () => Promise<SceltaFile>) {
    setAvvisoLettura("");
    const scelta = await scegli();
    if (!scelta.ok) {
      if (!scelta.annullato) avvisa("Ricevuta non caricata", scelta.messaggio);
      return;
    }
    setLettura(true);
    inCorso.current++;
    const esito = await inviaRicevuta(scelta.file);
    inCorso.current--;
    setLettura(false);
    if (!esito.ok) {
      avvisa("Ricevuta non letta", esito.messaggio);
      return;
    }
    const m = esito.dati;
    const annoRicevuta = Number(m.data.slice(0, 4));
    if (annoRicevuta && annoRicevuta !== anno) {
      setAvvisoLettura(`La ricevuta è del ${dataSvizzera(m.data)}: ti mostro i conti del ${annoRicevuta}. Controlla e conferma.`);
      cambiaAnno(annoRicevuta);
      return;
    }
    setDati((d) => d && { ...d, movimenti: [m, ...d.movimenti.filter((x) => x.id !== m.id)] });
    setAvvisoLettura("Fatto! Controlla i dati qui sotto, in «Da confermare».");
    void carica();
  }

  function cambiaIndirizzo() {
    const nuovo = !casella?.indirizzo;
    chiediConferma({
      titolo: nuovo ? "Creare il tuo indirizzo?" : "Cambiare indirizzo?",
      messaggio: nuovo
        ? "Ti creo un indirizzo personale a cui inoltrare fatture e ricevute."
        : "Ti creo un indirizzo nuovo. Quello vecchio smette di funzionare: ricordati di cambiarlo anche nell'inoltro di Gmail.",
      conferma: nuovo ? "Crea" : "Cambia",
      onConferma: () => void rigenera(),
    });
    async function rigenera() {
      setAttesaCasella(true);
      const esito = await rigeneraCasella();
      setAttesaCasella(false);
      if (esito.ok) setCasella(esito.dati);
      else avvisa("Non è stato possibile", esito.messaggio);
    }
  }

  const tirato = <RefreshControl refreshing={aggiornando} onRefresh={() => void carica("tirato")} tintColor={c.marchio} />;

  if (!dati) {
    return (
      <Schermata refreshControl={tirato}>
        <SceltaAnno anno={anno} onCambia={cambiaAnno} />
        {errore ? (
          <ErroreConti errore={errore} onRiprova={() => void carica("tirato")} />
        ) : (
          <View style={{ paddingVertical: SPAZIO.xxl, alignItems: "center", gap: SPAZIO.m }}>
            <ActivityIndicator color={c.marchio} />
            <Testo attenuato>Carico i tuoi conti…</Testo>
          </View>
        )}
        {avvisoLettura ? <Testo accessibilityLiveRegion="polite">{avvisoLettura}</Testo> : null}
        <CalcoliEStrumenti />
        <NotaConti />
      </Schermata>
    );
  }

  const daConfermare = dati.movimenti
    .filter((m) => m.stato === "da_confermare")
    .sort((a, b) => b.data.localeCompare(a.data));
  const decisi = dati.movimenti.filter((m) => m.stato !== "da_confermare").sort((a, b) => b.data.localeCompare(a.data));
  const decisiVisibili = tuttiMovimenti ? decisi : decisi.slice(0, 10);

  return (
    <Schermata refreshControl={tirato}>
      <SceltaAnno anno={anno} onCambia={cambiaAnno} />
      {errore ? <ErroreConti errore={errore} onRiprova={() => void carica("tirato")} /> : null}

      <Scheda evidenziata style={{ gap: SPAZIO.m }}>
        {dati.funzioni.lettura ? (
          <>
            <Pulsante
              titolo="Fotografa una ricevuta"
              icona="camera-outline"
              onPress={() => void leggiRicevuta(scattaFoto)}
              disabilitato={lettura}
              style={{ minHeight: 60 }}
            />
            <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
              <Pulsante
                titolo="Dalla galleria"
                variante="secondario"
                icona="images-outline"
                onPress={() => void leggiRicevuta(scegliFoto)}
                disabilitato={lettura}
                style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
              />
              <Pulsante
                titolo="Un PDF"
                variante="secondario"
                icona="document-outline"
                onPress={() => void leggiRicevuta(scegliPdf)}
                disabilitato={lettura}
                style={{ flex: 1, paddingHorizontal: SPAZIO.m }}
              />
            </View>
            {lettura ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.s, justifyContent: "center" }}
                accessibilityLiveRegion="polite"
              >
                <ActivityIndicator color={c.marchio} />
                <Testo>Bleo sta leggendo la ricevuta…</Testo>
              </View>
            ) : (
              <Testo variante="piccolo" attenuato>
                Bleo legge importo, data e fornitore. Poi controlli e confermi tu.
              </Testo>
            )}
          </>
        ) : (
          <Testo attenuato>
            La lettura automatica delle ricevute non è ancora attiva. Intanto puoi aggiungere entrate e uscite a mano, qui
            sotto.
          </Testo>
        )}
        {avvisoLettura ? (
          <Testo variante="forte" colore={c.marchio} accessibilityLiveRegion="polite">
            {avvisoLettura}
          </Testo>
        ) : null}
      </Scheda>

      <View style={{ gap: SPAZIO.s }}>
        <Testo variante="sottotitolo">
          Da confermare{daConfermare.length > 0 ? ` (${daConfermare.length})` : ""}
        </Testo>
        {daConfermare.length === 0 ? (
          <Scheda tenue>
            <Testo>Niente da confermare. Quando Bleo legge una ricevuta o una fattura, la trovi qui.</Testo>
          </Scheda>
        ) : (
          <>
            <Testo variante="piccolo" attenuato>
              Queste voci non contano finché non le confermi.
            </Testo>
            {daConfermare.map((m) => (
              <SchedaDaConfermare key={m.id} movimento={m} onDecidi={(x, s) => void decidi(x, s)} onModifica={setInModifica} />
            ))}
          </>
        )}
      </View>

      <SezioneRiepilogo riepilogo={dati.riepilogo} />

      <SezioneFatture fatture={dati.fatture} riepilogo={dati.riepilogo} onSegnaPagata={segnaPagata} />

      <Scheda>
        <RigaMenu
          titolo="Clienti e ore"
          sottotitolo="Segna le ore per cliente e crea la fattura a fine mese"
          icona="timer-outline"
          onPress={() => router.push("/clienti-ore")}
        />
      </Scheda>

      <Scheda>
        <Pressable
          onPress={() => setAggiungi((a) => !a)}
          accessibilityRole="button"
          accessibilityState={{ expanded: aggiungi }}
          style={{ flexDirection: "row", alignItems: "center", gap: SPAZIO.m, minHeight: 44 }}
        >
          <Ionicons name="add-circle-outline" size={24} color={c.marchio} />
          <View style={{ flex: 1 }}>
            <Testo variante="forte">Aggiungi a mano</Testo>
            <Testo variante="piccolo" attenuato>
              Un&apos;entrata o un&apos;uscita senza ricevuta da fotografare
            </Testo>
          </View>
          <Ionicons name={aggiungi ? "chevron-up" : "chevron-down"} size={18} color={c.attenuato} />
        </Pressable>
        {aggiungi ? (
          <View style={{ paddingTop: SPAZIO.m }}>
            <ModuloMovimento iniziale={bozzaDa(null, oggiLocale())} titoloSalva="Aggiungi" onSalva={aggiungiAMano} />
          </View>
        ) : null}
      </Scheda>

      {decisi.length > 0 ? (
        <View style={{ gap: SPAZIO.s }}>
          <Testo variante="sottotitolo">Movimenti del {anno}</Testo>
          <Scheda style={{ gap: 0 }}>
            {decisiVisibili.map((m, i) => (
              <View key={m.id}>
                {i > 0 ? <Separatore /> : null}
                <RigaMovimento movimento={m} onModifica={setInModifica} />
              </View>
            ))}
            {decisi.length > decisiVisibili.length || tuttiMovimenti ? (
              <Pulsante
                titolo={tuttiMovimenti ? "Mostra meno" : `Mostra tutti (${decisi.length})`}
                variante="testo"
                onPress={() => setTuttiMovimenti((t) => !t)}
              />
            ) : null}
          </Scheda>
        </View>
      ) : null}

      <SezioneCasella casella={casella} emailAttiva={dati.funzioni.email} attesa={attesaCasella} onRigenera={cambiaIndirizzo} />

      <View style={{ gap: SPAZIO.s }}>
        <Testo variante="sottotitolo">Scarica per il fiduciario</Testo>
        <Scheda>
          <Testo>
            Sul sito scarichi entrate, uscite e fatture dell&apos;anno in un file da dare al fiduciario. Accedi con la stessa
            email.
          </Testo>
          <Pulsante titolo="Apri sul sito" variante="secondario" icona="open-outline" onPress={() => void apriSito("/conti")} />
        </Scheda>
      </View>

      <CalcoliEStrumenti />
      <NotaConti />

      <FoglioModifica
        movimento={inModifica}
        onChiudi={() => setInModifica(null)}
        onSalva={salvaModifica}
        onElimina={(m) => void elimina(m)}
      />
    </Schermata>
  );
}

function SceltaAnno({ anno, onCambia }: { anno: number; onCambia: (anno: number) => void }) {
  const c = useColori();
  const massimo = annoCorrente();
  const minimo = massimo - ANNI_INDIETRO;
  const freccia = (verso: -1 | 1) => {
    const nuovo = anno + verso;
    const spenta = nuovo < minimo || nuovo > massimo;
    return (
      <Pressable
        onPress={() => onCambia(nuovo)}
        disabled={spenta}
        accessibilityRole="button"
        accessibilityLabel={verso < 0 ? `Anno precedente, ${nuovo}` : `Anno seguente, ${nuovo}`}
        accessibilityState={{ disabled: spenta }}
        hitSlop={8}
        style={{
          width: 44,
          height: 44,
          borderRadius: RAGGIO.pillola,
          alignItems: "center",
          justifyContent: "center",
          opacity: spenta ? 0.3 : 1,
        }}
      >
        <Ionicons name={verso < 0 ? "chevron-back" : "chevron-forward"} size={22} color={c.marchio} />
      </Pressable>
    );
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPAZIO.s }}>
      {freccia(-1)}
      <Testo variante="titolo" style={{ minWidth: 80, textAlign: "center" }} accessibilityLabel={`Conti del ${anno}`}>
        {anno}
      </Testo>
      {freccia(1)}
    </View>
  );
}

function ErroreConti({ errore, onRiprova }: { errore: Errore; onRiprova: () => void }) {
  const c = useColori();
  if (errore.stato === 503) {
    return (
      <Scheda tenue>
        <Testo>I conti non sono ancora attivi. Torna a trovarci presto.</Testo>
      </Scheda>
    );
  }
  return (
    <Scheda style={{ borderColor: c.pericolo, borderWidth: 2 }}>
      <Testo accessibilityLiveRegion="polite">{errore.messaggio}</Testo>
      {errore.stato === 401 ? (
        <Pulsante titolo="Accedi di nuovo" onPress={() => router.push("/accedi")} />
      ) : (
        <Pulsante titolo="Riprova" variante="secondario" icona="refresh" onPress={onRiprova} />
      )}
    </Scheda>
  );
}
