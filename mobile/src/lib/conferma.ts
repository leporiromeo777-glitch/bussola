import { Alert, Platform } from "react-native";

/** Chiede conferma prima di un'azione (sul web Alert non mostra pulsanti: si usa confirm). */
export function chiediConferma({
  titolo,
  messaggio,
  conferma,
  pericolo,
  onConferma,
}: {
  titolo: string;
  messaggio: string;
  conferma: string;
  pericolo?: boolean;
  onConferma: () => void;
}): void {
  if (Platform.OS === "web") {
    if (typeof globalThis.confirm !== "function" || globalThis.confirm(`${titolo}\n\n${messaggio}`)) onConferma();
    return;
  }
  Alert.alert(titolo, messaggio, [
    { text: "Annulla", style: "cancel" },
    { text: conferma, style: pericolo ? "destructive" : "default", onPress: onConferma },
  ]);
}

/** Un messaggio con solo «OK». */
export function avvisa(titolo: string, messaggio: string): void {
  if (Platform.OS === "web") {
    if (typeof globalThis.alert === "function") globalThis.alert(`${titolo}\n\n${messaggio}`);
    return;
  }
  Alert.alert(titolo, messaggio);
}
