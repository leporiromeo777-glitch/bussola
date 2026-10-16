import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import type { NomeIcona } from "~/components/ui";
import { useColori } from "~/lib/tema";

function icona(nome: NomeIcona, nomeAttivo: NomeIcona) {
  function IconaScheda({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? nomeAttivo : nome} size={24} color={String(color)} />;
  }
  return IconaScheda;
}

export default function Schede() {
  const c = useColori();
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
        name="strumenti"
        options={{ title: "Strumenti", tabBarIcon: icona("calculator-outline", "calculator") }}
      />
      <Tabs.Screen name="profilo" options={{ title: "Profilo", tabBarIcon: icona("person-circle-outline", "person-circle") }} />
    </Tabs>
  );
}
