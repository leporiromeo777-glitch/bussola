import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { raggruppaChat, TITOLO_MASSIMO, type ConversazioneBreve } from "@/lib/chat/conversazioni";
import { ImmagineMascotte } from "~/components/mascotte";
import { Pulsante, Testo, tocco } from "~/components/ui";
import {
  aggiornaTitolo,
  apriChat,
  caricaElencoChat,
  chatEliminata,
  eliminaChat,
  nuovaChat,
  rinominaChat,
  useChatAperta,
  type Esito,
} from "~/lib/chat";
import { chiediConferma } from "~/lib/conferma";
import { useSessione } from "~/lib/sessione";
import { oggiLocale } from "~/lib/stato";
import { RAGGIO, SPAZIO, useColori } from "~/lib/tema";

function chiudi() {
  if (router.canGoBack()) router.back();
  else router.replace("/chat");
}

type Stato =
  | { tipo: "carica" }
  | { tipo: "pronto"; chat: ConversazioneBreve[] }
  | { tipo: "errore"; messaggio: string; stato: number | null };

function statoDa(esito: Esito<ConversazioneBreve[]>): Stato {
  return esito.ok ? { tipo: "pronto", chat: esito.dati } : { tipo: "errore", messaggio: esito.messaggio, stato: esito.stato };
}

export default function ElencoChat() {
  const c = useColori();
  const { pronta, sessione } = useSessione();
  const aperta = useChatAperta();
  const [stato, setStato] = useState<Stato>({ tipo: "carica" });
  const [aggiorna, setAggiorna] = useState(false);
  const [scelta, setScelta] = useState<ConversazioneBreve | null>(null);

  const carica = useCallback(async () => {
    const esito = await caricaElencoChat();
    setStato(statoDa(esito));
  }, []);

  const conAccesso = pronta && sessione !== null;
  useEffect(() => {
    if (!conAccesso) return;
    let attivo = true;
    void caricaElencoChat().then((esito) => {
      if (attivo) setStato(statoDa(esito));
    });
    return () => {
      attivo = false;
    };
  }, [conAccesso]);

  async function tiraGiu() {
    setAggiorna(true);
    await carica();
    setAggiorna(false);
  }

  function cambiaChat(modifica: (chat: ConversazioneBreve[]) => ConversazioneBreve[]) {
    setStato((s) => (s.tipo === "pronto" ? { ...s, chat: modifica(s.chat) } : s));
  }

  const intestazione = (
    <Stack.Screen
      options={{
        headerRight: () => (
          <Pressable
            onPress={chiudi}
            accessibilityRole="button"
            hitSlop={8}
            style={{ paddingHorizontal: SPAZIO.m, minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: c.marchio, fontSize: 16, fontWeight: "600" }}>Chiudi</Text>
          </Pressable>
        ),
      }}
    />
  );

  if (!pronta) return intestazione;
  if (!sessione) {
    return (
      <View style={{ flex: 1, backgroundColor: c.sfondo, padding: SPAZIO.l, gap: SPAZIO.l, alignItems: "center" }}>
        {intestazione}
        <ImmagineMascotte nome="pensa" larghezza={140} style={{ marginTop: SPAZIO.xl }} />
        <Testo attenuato style={{ textAlign: "center" }}>
          Accedi con la tua email per ritrovare qui le tue chat con Bleo.
        </Testo>
        <Pulsante titolo="Accedi con la tua email" onPress={() => router.replace("/accedi")} />
      </View>
    );
  }

  const sezioni =
    stato.tipo === "pronto"
      ? raggruppaChat(stato.chat, oggiLocale()).map((g) => ({ titolo: g.gruppo, data: g.chat }))
      : [];

  return (
    <View style={{ flex: 1, backgroundColor: c.sfondo }}>
      {intestazione}
      <View style={{ paddingHorizontal: SPAZIO.l, paddingTop: SPAZIO.s, paddingBottom: SPAZIO.s }}>
        <Pressable
          onPress={() => {
            tocco();
            nuovaChat();
            chiudi();
          }}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: SPAZIO.m,
            minHeight: 48,
            paddingHorizontal: SPAZIO.l,
            borderRadius: RAGGIO.pillola,
            backgroundColor: c.marchio,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="create-outline" size={20} color={c.sulMarchio} />
          <Text style={{ color: c.sulMarchio, fontSize: 16, fontWeight: "600" }}>Nuova chat</Text>
        </Pressable>
      </View>

      {stato.tipo === "carica" ? (
        <View style={{ flex: 1, alignItems: "center", paddingTop: SPAZIO.xxl }}>
          <ActivityIndicator color={c.marchio} accessibilityLabel="Carico le tue chat" />
        </View>
      ) : stato.tipo === "errore" ? (
        <View style={{ alignItems: "center", gap: SPAZIO.m, padding: SPAZIO.l }}>
          <Testo style={{ textAlign: "center" }}>{stato.messaggio}</Testo>
          {stato.stato === 401 ? (
            <Pulsante titolo="Accedi di nuovo" onPress={() => router.replace("/accedi")} />
          ) : (
            <Pulsante
              titolo="Riprova"
              icona="refresh"
              variante="secondario"
              onPress={() => {
                setStato({ tipo: "carica" });
                void carica();
              }}
            />
          )}
        </View>
      ) : (
        <SectionList
          sections={sezioni}
          keyExtractor={(chat) => chat.id}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={aggiorna} onRefresh={() => void tiraGiu()} tintColor={c.marchio} />}
          contentContainerStyle={{ paddingHorizontal: SPAZIO.s, paddingBottom: SPAZIO.xxl, flexGrow: 1 }}
          renderSectionHeader={({ section }) => (
            <Text
              accessibilityRole="header"
              style={{
                color: c.attenuato,
                fontSize: 13,
                fontWeight: "600",
                paddingHorizontal: SPAZIO.m,
                paddingTop: SPAZIO.l,
                paddingBottom: SPAZIO.xs,
              }}
            >
              {section.titolo}
            </Text>
          )}
          renderItem={({ item }) => (
            <RigaChat
              chat={item}
              aperta={item.id === aperta.id}
              onApri={() => {
                apriChat(item.id, item.titolo);
                chiudi();
              }}
              onAzioni={() => setScelta(item)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", gap: SPAZIO.m, padding: SPAZIO.xl }}>
              <ImmagineMascotte nome="bussolina" larghezza={110} />
              <Testo variante="forte" style={{ textAlign: "center" }}>
                Ancora nessuna chat
              </Testo>
              <Testo attenuato style={{ textAlign: "center" }}>
                Le tue domande a Bleo restano qui, così puoi riprenderle quando vuoi.
              </Testo>
            </View>
          }
        />
      )}

      <FoglioAzioni
        chat={scelta}
        onChiudi={() => setScelta(null)}
        onRinominata={(nuova) => {
          cambiaChat((tutte) => tutte.map((x) => (x.id === nuova.id ? nuova : x)));
          aggiornaTitolo(nuova.id, nuova.titolo);
        }}
        onEliminata={(id) => {
          cambiaChat((tutte) => tutte.filter((x) => x.id !== id));
          chatEliminata(id);
        }}
      />
    </View>
  );
}

function RigaChat({
  chat,
  aperta,
  onApri,
  onAzioni,
}: {
  chat: ConversazioneBreve;
  aperta: boolean;
  onApri: () => void;
  onAzioni: () => void;
}) {
  const c = useColori();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: RAGGIO.m,
        backgroundColor: aperta ? c.marchioTenue : "transparent",
      }}
    >
      <Pressable
        onPress={onApri}
        onLongPress={() => {
          tocco();
          onAzioni();
        }}
        accessibilityRole="button"
        accessibilityHint="Apre la chat. Tieni premuto per rinominarla o eliminarla."
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 48,
          justifyContent: "center",
          paddingLeft: SPAZIO.m,
          paddingVertical: SPAZIO.s,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text numberOfLines={1} style={{ color: c.testo, fontSize: 16, fontWeight: aperta ? "600" : "400" }}>
          {chat.titolo || "Chat senza titolo"}
        </Text>
      </Pressable>
      <Pressable
        onPress={onAzioni}
        accessibilityRole="button"
        accessibilityLabel={`Altre azioni per «${chat.titolo}»`}
        hitSlop={4}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={c.attenuato} />
      </Pressable>
    </View>
  );
}

/** Il foglio con «Rinomina» ed «Elimina» (e la casella per il nuovo nome). */
function FoglioAzioni({
  chat,
  onChiudi,
  onRinominata,
  onEliminata,
}: {
  chat: ConversazioneBreve | null;
  onChiudi: () => void;
  onRinominata: (chat: ConversazioneBreve) => void;
  onEliminata: (id: string) => void;
}) {
  const c = useColori();
  const margini = useSafeAreaInsets();
  const [modo, setModo] = useState<"azioni" | "rinomina">("azioni");
  const [nome, setNome] = useState("");
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  // Ogni volta che si apre per una chat, si riparte dai pulsanti.
  const [perChat, setPerChat] = useState<string | null>(null);
  const idChat = chat?.id ?? null;
  if (idChat !== perChat) {
    setPerChat(idChat);
    setModo("azioni");
    setNome(chat?.titolo ?? "");
    setErrore(null);
    setOccupato(false);
  }

  async function salvaNome() {
    if (!chat) return;
    const titolo = nome.replace(/\s+/g, " ").trim();
    if (!titolo) return;
    if (titolo === chat.titolo) {
      onChiudi();
      return;
    }
    setOccupato(true);
    setErrore(null);
    const esito = await rinominaChat(chat.id, titolo);
    setOccupato(false);
    if (!esito.ok) {
      setErrore(esito.messaggio);
      return;
    }
    onRinominata(esito.dati);
    onChiudi();
  }

  function chiediElimina() {
    if (!chat) return;
    const daEliminare = chat;
    chiediConferma({
      titolo: "Eliminare questa chat?",
      messaggio: `«${daEliminare.titolo}» sparisce per sempre, con tutte le risposte.`,
      conferma: "Elimina",
      pericolo: true,
      onConferma: () => {
        void (async () => {
          setOccupato(true);
          setErrore(null);
          const esito = await eliminaChat(daEliminare.id);
          setOccupato(false);
          if (!esito.ok && esito.stato !== 404) {
            setErrore(esito.messaggio);
            return;
          }
          onEliminata(daEliminare.id);
          onChiudi();
        })();
      },
    });
  }

  return (
    <Modal visible={chat !== null} transparent animationType="fade" onRequestClose={onChiudi}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <Pressable
          onPress={onChiudi}
          accessibilityRole="button"
          accessibilityLabel="Chiudi"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" }}
        />
        <View
          style={{
            backgroundColor: c.scheda,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: SPAZIO.l,
            paddingBottom: SPAZIO.l + Math.max(margini.bottom, SPAZIO.s),
            gap: SPAZIO.m,
          }}
        >
          <Text numberOfLines={1} style={{ color: c.attenuato, fontSize: 14, textAlign: "center" }}>
            {chat?.titolo}
          </Text>
          {modo === "azioni" ? (
            <View style={{ gap: SPAZIO.xs }}>
              <VoceFoglio icona="pencil-outline" titolo="Rinomina" onPress={() => setModo("rinomina")} />
              <VoceFoglio
                icona="trash-outline"
                titolo="Elimina"
                pericolo
                caricamento={occupato}
                onPress={chiediElimina}
              />
              <Pulsante titolo="Annulla" variante="testo" onPress={onChiudi} />
            </View>
          ) : (
            <View style={{ gap: SPAZIO.m }}>
              <Testo variante="forte">Nuovo nome</Testo>
              <TextInput
                value={nome}
                onChangeText={setNome}
                autoFocus
                selectTextOnFocus
                maxLength={TITOLO_MASSIMO}
                returnKeyType="done"
                onSubmitEditing={() => void salvaNome()}
                accessibilityLabel="Nuovo nome della chat"
                style={{
                  minHeight: 48,
                  borderWidth: 1.5,
                  borderColor: c.bordo,
                  borderRadius: RAGGIO.m,
                  paddingHorizontal: SPAZIO.m,
                  fontSize: 16,
                  color: c.testo,
                  backgroundColor: c.sfondo,
                }}
              />
              <View style={{ flexDirection: "row", gap: SPAZIO.s }}>
                <Pulsante titolo="Annulla" variante="secondario" onPress={onChiudi} style={{ flex: 1 }} />
                <Pulsante
                  titolo="Salva"
                  onPress={() => void salvaNome()}
                  caricamento={occupato}
                  disabilitato={!nome.trim()}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
          {errore ? <Testo colore={c.pericolo}>{errore}</Testo> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function VoceFoglio({
  icona,
  titolo,
  onPress,
  pericolo,
  caricamento,
}: {
  icona: "pencil-outline" | "trash-outline";
  titolo: string;
  onPress: () => void;
  pericolo?: boolean;
  caricamento?: boolean;
}) {
  const c = useColori();
  const colore = pericolo ? c.pericolo : c.testo;
  return (
    <Pressable
      onPress={onPress}
      disabled={caricamento}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: SPAZIO.m,
        minHeight: 52,
        paddingHorizontal: SPAZIO.m,
        borderRadius: RAGGIO.m,
        backgroundColor: pressed ? c.marchioTenue : "transparent",
      })}
    >
      {caricamento ? <ActivityIndicator color={colore} /> : <Ionicons name={icona} size={22} color={colore} />}
      <Text style={{ color: colore, fontSize: 17, fontWeight: "500" }}>{titolo}</Text>
    </Pressable>
  );
}
