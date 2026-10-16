import * as WebBrowser from "expo-web-browser";
import { SITO_URL } from "./config";

/** Apre una pagina (fonte ufficiale, modulo) nel browser dentro l'app. */
export async function apriLink(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
  } catch {
    // Nessun browser disponibile: niente da fare.
  }
}

/** Una pagina del sito di Bleo (privacy, impressum...). */
export function apriSito(percorso: string): Promise<void> {
  return apriLink(`${SITO_URL}${percorso}`);
}
