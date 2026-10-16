import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from "react-native";
import { chiediABleo } from "@/lib/chat/cliente";
import { LUNGHEZZA_MASSIMA_DOMANDA, LUNGHEZZA_MINIMA_DOMANDA, SCAMBI_PRECEDENTI_MASSIMI } from "@/lib/chat/limiti";
import type { FonteCitata, ScambioPrecedente } from "@/lib/chat/tipi";
import { ImmagineMascotte } from "~/components/mascotte";
import { NotaInformazione, Pulsante, Schermata, Scheda, Testo } from "~/components/ui";
import { fetchConToken, tokenAttuale, URL_CHAT } from "~/lib/api";
import { apriLink } from "~/lib/apri";
import { useSessione } from "~/lib/sessione";
import { supabase } from "~/lib/supabase";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

type Messaggio = {
  id: number;
  domanda: string;
  risposta: string;
  fonti: FonteCitata[];
  stato: "in-corso" | "fatto" | "errore";
  avviso?: string;
};

const ESEMPI = [
  "Devo iscrivermi al registro di commercio?",
  "Quanto pago di AVS come indipendente?",
  "Quando devo registrarmi per l'IVA?",
];

export default function Chat() {
  const { pronta, sessione } = useSessione();
  const { domanda: domandaIniziale } = useLocalSearchParams<{ domanda?: string }>();

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

function Conversazione({ domandaIniziale }: { domandaIniziale?: string }) {
  const c = useColori();
  const [testo, setTesto] = useState(domandaIniziale ?? "");
  const [messaggi, setMessaggi] = useState<Messaggio[]>([]);
  const [inCorso, setInCorso] = useState(false);
  const scorri = useRef<ScrollViewInstance>(null);
  const annulla = useRef<AbortController | null>(null);
  const prossimoId = useRef(1);

  // Una nuova domanda da un passo del percorso (anche con la chat già aperta) va nel campo.
  const [ultimaIniziale, setUltimaIniziale] = useState(domandaIniziale);
  if (domandaIniziale !== ultimaIniziale) {
    setUltimaIniziale(domandaIniziale);
    if (domandaIniziale) setTesto(domandaIniziale);
  }
  useEffect(() => () => annulla.current?.abort(), []);

  function aggiorna(id: number, modifica: (m: Messaggio) => Messaggio) {
    setMessaggi((tutti) => tutti.map((m) => (m.id === id ? modifica(m) : m)));
  }

  async function invia(domanda: string) {
    const pulita = domanda.trim();
    if (pulita.length < LUNGHEZZA_MINIMA_DOMANDA || inCorso) return;
    const token = await tokenAttuale();
    if (!token) {
      router.push("/accedi");
      return;
    }
    const cronologia: ScambioPrecedente[] = messaggi
      .filter((m) => m.stato === "fatto" && m.risposta)
      .slice(-SCAMBI_PRECEDENTI_MASSIMI)
      .map((m) => ({ domanda: m.domanda, risposta: m.risposta }));
    const id = prossimoId.current++;
    setMessaggi((tutti) => [...tutti, { id, domanda: pulita, risposta: "", fonti: [], stato: "in-corso" }]);
    setTesto("");
    setInCorso(true);
    const controllo = new AbortController();
    annulla.current = controllo;
    const esito = await chiediABleo({
      domanda: pulita,
      cronologia,
      segnale: controllo.signal,
      suTesto: (pezzo) => aggiorna(id, (m) => ({ ...m, risposta: m.risposta + pezzo })),
      fetchFn: fetchConToken(token),
      indirizzo: URL_CHAT,
    });
    setInCorso(false);
    if (esito.tipo === "fine") {
      const { risposta, fonti, avviso } = esito.evento;
      aggiorna(id, (m) => ({
        ...m,
        risposta: risposta.map((b) => b.testo).join("") || m.risposta,
        fonti,
        avviso,
        stato: "fatto",
      }));
    } else if (esito.tipo === "errore") {
      aggiorna(id, (m) => ({ ...m, risposta: esito.messaggio, stato: "errore" }));
    } else {
      aggiorna(id, (m) => ({ ...m, stato: "errore", risposta: m.risposta || "Domanda annullata." }));
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.sfondo }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scorri}
        contentContainerStyle={{ padding: SPAZIO.l, gap: SPAZIO.l }}
        onContentSizeChange={() => scorri.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messaggi.length === 0 ? (
          <View style={{ gap: SPAZIO.m }}>
            <Testo attenuato>
              Fai una domanda sull&apos;apertura della tua attività. Rispondo solo con le fonti ufficiali; se non lo so,
              te lo dico.
            </Testo>
            {ESEMPI.map((e) => (
              <Pulsante key={e} titolo={e} variante="secondario" onPress={() => void invia(e)} />
            ))}
          </View>
        ) : null}
        {messaggi.map((m) => (
          <View key={m.id} style={{ gap: SPAZIO.s }}>
            <View
              style={{
                alignSelf: "flex-end",
                maxWidth: "85%",
                backgroundColor: c.marchio,
                borderRadius: RAGGIO.l,
                padding: SPAZIO.m,
              }}
            >
              <Text style={{ color: c.sulMarchio, fontSize: 16, lineHeight: 22 }}>{m.domanda}</Text>
            </View>
            <Scheda style={{ maxWidth: "95%" }}>
              <Testo colore={m.stato === "errore" ? c.pericolo : undefined}>
                {m.risposta || (m.stato === "in-corso" ? "Cerco nelle fonti ufficiali…" : "")}
              </Testo>
              {m.avviso ? (
                <Testo variante="piccolo" attenuato>
                  {m.avviso}
                </Testo>
              ) : null}
              {m.fonti.length > 0 ? (
                <View style={{ gap: SPAZIO.xs }}>
                  <Testo variante="etichetta" attenuato>
                    FONTI
                  </Testo>
                  {m.fonti.map((f) => (
                    <Pressable
                      key={f.fonte_id}
                      onPress={() => void apriLink(f.url)}
                      accessibilityRole="link"
                      style={{ flexDirection: "row", gap: 6, paddingVertical: 4 }}
                    >
                      <Text style={{ color: c.attenuato, fontSize: 14 }}>[{f.numero}]</Text>
                      <Text style={{ flex: 1, color: c.marchio, fontSize: 14, lineHeight: 20 }}>
                        {f.titolo} ({f.ente})
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Scheda>
          </View>
        ))}
        {messaggi.length > 0 ? <NotaInformazione /> : null}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          gap: SPAZIO.s,
          padding: SPAZIO.m,
          borderTopWidth: 1,
          borderTopColor: c.bordo,
          backgroundColor: c.scheda,
          alignItems: "flex-end",
        }}
      >
        <TextInput
          value={testo}
          onChangeText={setTesto}
          placeholder="Scrivi la tua domanda"
          placeholderTextColor={c.attenuato}
          multiline
          maxLength={LUNGHEZZA_MASSIMA_DOMANDA}
          accessibilityLabel="La tua domanda"
          style={{
            flex: 1,
            maxHeight: 120,
            minHeight: 44,
            borderWidth: 1.5,
            borderColor: c.bordo,
            borderRadius: RAGGIO.m,
            paddingHorizontal: SPAZIO.m,
            paddingVertical: 10,
            fontSize: 16,
            color: c.testo,
            backgroundColor: c.sfondo,
          }}
        />
        <Pressable
          onPress={() => (inCorso ? annulla.current?.abort() : void invia(testo))}
          accessibilityRole="button"
          accessibilityLabel={inCorso ? "Ferma la risposta" : "Invia la domanda"}
          disabled={!inCorso && testo.trim().length < LUNGHEZZA_MINIMA_DOMANDA}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: c.marchio,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed || (!inCorso && testo.trim().length < LUNGHEZZA_MINIMA_DOMANDA) ? 0.5 : 1,
          })}
        >
          <Ionicons name={inCorso ? "stop" : "arrow-up"} size={22} color={c.sulMarchio} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
