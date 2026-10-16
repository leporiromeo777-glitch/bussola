import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { DOMANDE_ESEMPIO } from "@/app/chat/esempi";
import { titoloDaDomanda, type MessaggioSalvato } from "@/lib/chat/conversazioni";
import { LUNGHEZZA_MINIMA_DOMANDA } from "@/lib/chat/limiti";
import { testoSemplice } from "@/lib/chat/testo-risposta";
import { Compositore } from "~/components/chat/compositore";
import { PulsanteIntestazione, TitoloChat } from "~/components/chat/intestazione";
import { BollaUtente, RispostaBleo, type Turno } from "~/components/chat/messaggi";
import { ImmagineMascotte } from "~/components/mascotte";
import { Pulsante, Schermata, Testo, tocco } from "~/components/ui";
import { tokenAttuale } from "~/lib/api";
import {
  allineaUtente,
  caricaChat,
  chatAperta,
  chiediInChat,
  dimenticaChat,
  nuovaChat,
  registraChat,
  useChatAperta,
} from "~/lib/chat";
import { useSessione } from "~/lib/sessione";
import { supabase } from "~/lib/supabase";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

export default function Chat() {
  const { pronta, sessione } = useSessione();
  const { domanda: domandaIniziale } = useLocalSearchParams<{ domanda?: string }>();
  const utente = sessione?.user.id ?? null;

  // Con un altro accesso la chat aperta prima non vale più.
  useEffect(() => {
    if (pronta) allineaUtente(utente);
  }, [pronta, utente]);

  if (!supabase()) {
    return (
      <Schermata style={{ alignItems: "center", paddingTop: SPAZIO.xxl }}>
        <ImmagineMascotte nome="pensa" larghezza={180} />
        <Testo variante="titolo" style={{ textAlign: "center" }}>
          La chat arriva presto
        </Testo>
        <Testo attenuato style={{ textAlign: "center" }}>
          In questa versione di prova la chat non è ancora attiva. Intanto trovi i passi, le scadenze e le fonti
          ufficiali nel tuo percorso.
        </Testo>
        <Pulsante titolo="Vai al percorso" onPress={() => router.push("/percorso")} />
      </Schermata>
    );
  }
  if (!pronta) return <Schermata>{null}</Schermata>;
  if (!sessione) {
    return (
      <Schermata style={{ alignItems: "center", paddingTop: SPAZIO.xxl }}>
        <ImmagineMascotte nome="pensa" larghezza={180} />
        <Testo variante="titolo" style={{ textAlign: "center" }}>
          Chiedi a Bleo
        </Testo>
        <Testo attenuato style={{ textAlign: "center" }}>
          Rispondo solo con le fonti ufficiali e ti mostro sempre il link. Per fare domande accedi con la tua email: ti
          mando un codice, senza password.
        </Testo>
        <Pulsante titolo="Accedi con la tua email" onPress={() => router.push("/accedi")} />
      </Schermata>
    );
  }
  return <Conversazione domandaIniziale={domandaIniziale} />;
}

/** I messaggi salvati (domanda, risposta, domanda, …) come coppie domanda-risposta. */
function turniDa(messaggi: MessaggioSalvato[]): Turno[] {
  const turni: Turno[] = [];
  for (const m of messaggi) {
    if (m.ruolo === "utente") {
      turni.push({
        chiave: `s-${m.id}`,
        domanda: m.testo,
        stato: "fatto",
        testo: "",
        blocchi: null,
        fonti: [],
        avviso: null,
      });
      continue;
    }
    const risposta = {
      stato: "fatto" as const,
      testo: m.testo || testoSemplice(m.risposta ?? []),
      blocchi: m.risposta?.length ? m.risposta : null,
      fonti: m.fonti ?? [],
      avviso: m.avviso ?? null,
    };
    const ultimo = turni.at(-1);
    if (ultimo && !ultimo.testo && !ultimo.blocchi) Object.assign(ultimo, risposta);
    else turni.push({ chiave: `s-${m.id}`, domanda: "", ...risposta });
  }
  return turni;
}

type StatoChat = { tipo: "pronta" } | { tipo: "carica" } | { tipo: "errore"; messaggio: string; nonEsiste: boolean };

function Conversazione({ domandaIniziale }: { domandaIniziale?: string }) {
  const c = useColori();
  const navigation = useNavigation();
  const altezzaIntestazione = useHeaderHeight();
  const chat = useChatAperta();
  const [testo, setTesto] = useState(domandaIniziale ?? "");
  const [turni, setTurni] = useState<Turno[]>([]);
  const [inCorso, setInCorso] = useState(false);
  const [stato, setStato] = useState<StatoChat>(chat.id ? { tipo: "carica" } : { tipo: "pronta" });
  const [versioneMostrata, setVersioneMostrata] = useState(chat.versione);
  const [tentativo, setTentativo] = useState(0);
  const scorri = useRef<ScrollView>(null);
  const segui = useRef(true);
  const annulla = useRef<AbortController | null>(null);
  const prossimoId = useRef(1);

  // Una nuova domanda da un passo del percorso (anche con la chat già aperta) va nel campo.
  const [ultimaIniziale, setUltimaIniziale] = useState(domandaIniziale);
  if (domandaIniziale !== ultimaIniziale) {
    setUltimaIniziale(domandaIniziale);
    if (domandaIniziale) setTesto(domandaIniziale);
  }

  // Un'altra chat (dall'elenco) o una chat nuova: si svuota lo schermo.
  if (chat.versione !== versioneMostrata) {
    setVersioneMostrata(chat.versione);
    setTurni([]);
    setInCorso(false);
    setStato(chat.id ? { tipo: "carica" } : { tipo: "pronta" });
  }

  // ...e si ferma la risposta in corso; una chat salvata si carica dal sito.
  useEffect(() => {
    annulla.current?.abort();
    annulla.current = null;
    const { id, versione } = chatAperta();
    if (!id) return;
    let attiva = true;
    void caricaChat(id).then((esito) => {
      if (!attiva) return;
      if (esito.ok) {
        segui.current = true;
        setTurni(turniDa(esito.dati.messaggi));
        setStato({ tipo: "pronta" });
        registraChat(versione, id, esito.dati.conversazione.titolo || null);
      } else {
        setStato({ tipo: "errore", messaggio: esito.messaggio, nonEsiste: esito.stato === 404 });
      }
    });
    return () => {
      attiva = false;
    };
  }, [chat.versione, tentativo]);

  useEffect(() => () => annulla.current?.abort(), []);

  // In alto: ☰ per l'elenco delle chat, il titolo, ✎ per una chat nuova.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <TitoloChat />,
      headerTitleAlign: "center",
      headerLeft: () => (
        <PulsanteIntestazione icona="menu" etichetta="Le tue chat" onPress={() => router.push("/chat-elenco")} />
      ),
      headerRight: () => <PulsanteIntestazione icona="create-outline" etichetta="Nuova chat" onPress={nuovaChat} />,
    });
    return () =>
      navigation.setOptions({
        headerTitle: undefined,
        headerTitleAlign: undefined,
        headerLeft: undefined,
        headerRight: undefined,
      });
  }, [navigation]);

  function aggiorna(chiave: string, modifica: (t: Turno) => Turno) {
    setTurni((tutti) => tutti.map((t) => (t.chiave === chiave ? modifica(t) : t)));
  }

  async function invia(domanda: string) {
    const pulita = domanda.trim();
    if (pulita.length < LUNGHEZZA_MINIMA_DOMANDA || inCorso || annulla.current) return;
    const controllo = new AbortController();
    annulla.current = controllo;
    const chiave = `n-${prossimoId.current++}`;
    setTurni((tutti) => [
      ...tutti,
      { chiave, domanda: pulita, stato: "in-corso", testo: "", blocchi: null, fonti: [], avviso: null },
    ]);
    setTesto("");
    setInCorso(true);
    segui.current = true;

    const token = await tokenAttuale();
    if (!token) {
      annulla.current = null;
      setInCorso(false);
      setTurni((tutti) => tutti.filter((t) => t.chiave !== chiave));
      setTesto(pulita);
      router.push("/accedi");
      return;
    }
    const { id, versione } = chatAperta();
    const esito = await chiediInChat({
      domanda: pulita,
      conversazioneId: id,
      token,
      segnale: controllo.signal,
      suTesto: (pezzo) => aggiorna(chiave, (t) => ({ ...t, testo: t.testo + pezzo })),
      suConversazione: (nuova) => registraChat(versione, nuova.id, nuova.titolo || titoloDaDomanda(pulita)),
    });
    // Nel frattempo si è aperta un'altra chat: questa risposta non conta più.
    if (annulla.current !== controllo) return;
    annulla.current = null;
    setInCorso(false);

    if (esito.tipo === "fine") {
      const { risposta, fonti, avviso } = esito.evento;
      aggiorna(chiave, (t) => ({
        ...t,
        stato: "fatto",
        testo: testoSemplice(risposta) || t.testo,
        blocchi: risposta.length > 0 ? risposta : null,
        fonti,
        avviso: avviso ?? null,
      }));
    } else if (esito.tipo === "errore") {
      let messaggio = esito.messaggio;
      if (esito.stato === 404 && id) {
        dimenticaChat(versione);
        messaggio = "Questa chat non c'è più. Tocca «Riprova»: la domanda partirà in una chat nuova.";
      }
      aggiorna(chiave, (t) => ({ ...t, stato: "errore", testo: messaggio, blocchi: null }));
    } else {
      aggiorna(chiave, (t) => ({ ...t, stato: "interrotta" }));
    }
  }

  function riprova(turno: Turno) {
    if (inCorso) return;
    setTurni((tutti) => tutti.filter((t) => t.chiave !== turno.chiave));
    void invia(turno.domanda);
  }

  const vuota = stato.tipo === "pronta" && turni.length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.sfondo }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={altezzaIntestazione}
    >
      <ScrollView
        ref={scorri}
        style={{ flex: 1 }}
        contentContainerStyle={
          stato.tipo !== "pronta" || vuota
            ? { flexGrow: 1, justifyContent: "center", padding: SPAZIO.l }
            : { padding: SPAZIO.l, paddingBottom: SPAZIO.xl, gap: SPAZIO.xl }
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        scrollEventThrottle={32}
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          segui.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
        }}
        onContentSizeChange={() => {
          if (segui.current) scorri.current?.scrollToEnd({ animated: !inCorso });
        }}
      >
        {stato.tipo === "carica" ? (
          <ActivityIndicator color={c.marchio} accessibilityLabel="Carico la chat" />
        ) : stato.tipo === "errore" ? (
          <View style={{ alignItems: "center", gap: SPAZIO.m }}>
            <ImmagineMascotte nome="pensa" larghezza={120} />
            <Testo style={{ textAlign: "center" }}>{stato.messaggio}</Testo>
            {stato.nonEsiste ? null : (
              <Pulsante
                titolo="Riprova"
                icona="refresh"
                onPress={() => {
                  setStato({ tipo: "carica" });
                  setTentativo((n) => n + 1);
                }}
              />
            )}
            <Pulsante titolo="Nuova chat" variante="secondario" onPress={nuovaChat} />
          </View>
        ) : vuota ? (
          <Benvenuto onScegli={(d) => void invia(d)} />
        ) : (
          turni.map((t) => (
            <View key={t.chiave} style={{ gap: SPAZIO.l }}>
              {t.domanda ? <BollaUtente testo={t.domanda} /> : null}
              {t.stato === "fatto" && !t.testo && !t.blocchi ? null : (
                <RispostaBleo turno={t} onRiprova={() => riprova(t)} />
              )}
            </View>
          ))
        )}
      </ScrollView>
      <Compositore
        testo={testo}
        onCambia={setTesto}
        onInvia={() => void invia(testo)}
        onFerma={() => annulla.current?.abort()}
        inCorso={inCorso}
      />
    </KeyboardAvoidingView>
  );
}

/** La chat vuota: Bleo, un saluto e qualche domanda di esempio. */
function Benvenuto({ onScegli }: { onScegli: (domanda: string) => void }) {
  const c = useColori();
  return (
    <View style={{ alignItems: "center", gap: SPAZIO.l, paddingVertical: SPAZIO.l }}>
      <ImmagineMascotte nome="coppia" larghezza={96} />
      <Text
        accessibilityRole="header"
        style={{ color: c.testo, fontSize: 26, lineHeight: 32, fontWeight: "700", textAlign: "center" }}
      >
        Cosa vuoi sapere?
      </Text>
      <View style={{ alignSelf: "stretch", gap: SPAZIO.s, marginTop: SPAZIO.xs }}>
        {DOMANDE_ESEMPIO.map((domanda) => (
          <Pressable
            key={domanda}
            onPress={() => {
              tocco();
              onScegli(domanda);
            }}
            accessibilityRole="button"
            accessibilityHint="Manda questa domanda a Bleo"
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: c.bordo,
              borderRadius: RAGGIO.l,
              paddingHorizontal: SPAZIO.l,
              paddingVertical: SPAZIO.m,
              backgroundColor: pressed ? c.marchioTenue : c.scheda,
            })}
          >
            <Text numberOfLines={2} style={{ color: c.testo, fontSize: 15, lineHeight: 21 }}>
              {domanda}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
