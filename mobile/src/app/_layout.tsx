import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { configuraNotifiche } from "~/lib/notifiche";
import { useColori } from "~/lib/tema";

configuraNotifiche();

export default function Radice() {
  const c = useColori();
  const scuro = useColorScheme() === "dark";
  return (
    <>
      <StatusBar style={scuro ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.sfondo },
          headerTintColor: c.marchio,
          headerTitleStyle: { color: c.testo, fontWeight: "600" },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: c.sfondo },
        }}
      >
        <Stack.Screen name="(schede)" options={{ headerShown: false }} />
        <Stack.Screen name="questionario" options={{ title: "Questionario", presentation: "fullScreenModal" }} />
        <Stack.Screen name="passo/[id]" options={{ title: "" }} />
        <Stack.Screen name="strumenti/index" options={{ title: "Calcoli e strumenti" }} />
        <Stack.Screen name="strumenti/tariffa" options={{ title: "Tariffa oraria" }} />
        <Stack.Screen name="strumenti/contributi" options={{ title: "Contributi AVS" }} />
        <Stack.Screen name="strumenti/lettera" options={{ title: "Fotografa la lettera" }} />
        <Stack.Screen name="strumenti/budget" options={{ title: "Budget del primo anno" }} />
        <Stack.Screen name="strumenti/business-plan" options={{ title: "Business plan" }} />
        <Stack.Screen name="corso" options={{ title: "Il corso di Bleo" }} />
        <Stack.Screen name="clienti-ore" options={{ title: "Clienti e ore" }} />
        <Stack.Screen name="fatture/index" options={{ title: "Preventivo e fattura" }} />
        <Stack.Screen name="fatture/[id]" options={{ title: "" }} />
        <Stack.Screen name="fatture/profilo" options={{ title: "I tuoi dati" }} />
        <Stack.Screen name="accedi" options={{ title: "Accedi", presentation: "modal" }} />
        <Stack.Screen
          name="chat-elenco"
          options={{ title: "Le tue chat", presentation: "modal", headerBackVisible: false, headerLeft: () => null }}
        />
        <Stack.Screen name="guardaroba" options={{ title: "Vesti Bleo" }} />
        <Stack.Screen name="documenti" options={{ title: "Cassetto dei documenti" }} />
      </Stack>
    </>
  );
}
