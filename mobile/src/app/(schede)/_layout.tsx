import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import type { ColorValue } from "react-native";
import type { NomeIcona } from "~/components/ui";
import { aggiornaScadenzeDocumenti, dimenticaScadenzeDocumenti } from "~/lib/cassetto";
import { aggiornaContatore, impostaDaConfermare, useDaConfermare } from "~/lib/conti";
import { riprogrammaNotifiche, togliPromemoriaFatture } from "~/lib/notifiche";
// Il percorso nell'account: si allinea all'accesso, in primo piano e dopo ogni modifica.
import "~/lib/percorso-account";
import { useSessione } from "~/lib/sessione";
import { useColori } from "~/lib/tema";

function icona(nome: NomeIcona, nomeAttivo: NomeIcona) {
  function IconaScheda({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? nomeAttivo : nome} size={24} color={String(color)} />;
  }
  return IconaScheda;
}

export default function Schede() {
  const c = useColori();
  const { pronta, sessione } = useSessione();
  const daConfermare = useDaConfermare();
  const utente = sessione?.user.id ?? null;

  // Il pallino su «Conti»: quante voci aspettano la conferma (solo con l'accesso).
  // Leggendo i conti si aggiornano anche i promemoria delle fatture; senza accesso si tolgono.
  useEffect(() => {
    if (utente) void aggiornaContatore();
    else {
      impostaDaConfermare(null);
      if (pronta) void togliPromemoriaFatture().catch(() => {});
    }
  }, [utente, pronta]);

  // Promemoria dei documenti del cassetto: con l'accesso si rileggono le scadenze
  // (anche dei documenti caricati dal sito); uscendo dall'account si tolgono.
  useEffect(() => {
    if (!pronta) return;
    if (utente) {
      void aggiornaScadenzeDocumenti()
        .then((cambiate) => (cambiate ? riprogrammaNotifiche() : undefined))
        .catch(() => {});
    } else if (dimenticaScadenzeDocumenti()) {
      void riprogrammaNotifiche().catch(() => {});
    }
  }, [pronta, utente]);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.marchio,
        tabBarInactiveTintColor: c.attenuato,
        tabBarStyle: { backgroundColor: c.scheda, borderTopColor: c.bordo },
        headerStyle: { backgroundColor: c.sfondo },
        headerTitleStyle: { color: c.testo, fontWeight: "600" },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: c.sfondo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inizio", headerShown: false, tabBarIcon: icona("home-outline", "home") }} />
      <Tabs.Screen
        name="percorso"
        options={{ title: "Percorso", tabBarIcon: icona("map-outline", "map") }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: "Chiedi a Bleo", tabBarIcon: icona("chatbubbles-outline", "chatbubbles") }}
      />
      <Tabs.Screen
        name="conti"
        options={{
          title: "I tuoi conti",
          tabBarLabel: "Conti",
          tabBarIcon: icona("wallet-outline", "wallet"),
          tabBarBadge: daConfermare ? daConfermare : undefined,
          tabBarBadgeStyle: { backgroundColor: c.accento, color: c.sulMarchio },
          tabBarAccessibilityLabel: daConfermare ? `Conti, ${daConfermare} da confermare` : undefined,
        }}
      />
      <Tabs.Screen name="profilo" options={{ title: "Profilo", tabBarIcon: icona("person-circle-outline", "person-circle") }} />
    </Tabs>
  );
}
