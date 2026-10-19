/**
 * Pagine fuori dall'app, in due modi:
 * - `apriLink`: nel browser dentro l'app (un foglio sopra l'app, si chiude con
 *   «Fine»). Per le fonti ufficiali, i moduli e i file con un link firmato:
 *   si leggono e si torna subito all'app.
 * - `apriSito` / `apriNelBrowser`: nel browser del telefono (Safari, Chrome).
 *   Per gli strumenti e le pagine del sito di Bleo: lì ci sono già i dati che
 *   il sito ha salvato nel browser (budget, business plan, fatture...) e
 *   l'accesso al sito. Su iPhone il browser dentro l'app non li condivide con
 *   Safari: ripartiresti ogni volta da zero.
 * Se un giorno l'app risponderà ai link del sito (universal link / app link),
 * `Linking.openURL` sul sito riaprirebbe l'app: allora qui servirà un'altra strada.
 */
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { SITO_URL } from "./config";

/** Apre una pagina (fonte ufficiale, modulo, file) nel browser dentro l'app. */
export async function apriLink(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
  } catch {
    // Nessun browser disponibile: niente da fare.
  }
}

/** Apre una pagina nel browser del telefono, con i dati e gli accessi che ci sono già; se non si può, nel browser dell'app. */
export async function apriNelBrowser(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    await apriLink(url);
  }
}

/** Uno strumento o una pagina del sito di Bleo (budget, business plan, privacy...), nel browser del telefono. */
export function apriSito(percorso: string): Promise<void> {
  return apriNelBrowser(`${SITO_URL}${percorso}`);
}

/**
 * Una pagina breve del sito da leggere senza lasciare l'app, per esempio
 * l'informativa sulla privacy mentre fai l'accesso: non servono i dati del browser.
 */
export function leggiSitoNellApp(percorso: string): Promise<void> {
  return apriLink(`${SITO_URL}${percorso}`);
}
