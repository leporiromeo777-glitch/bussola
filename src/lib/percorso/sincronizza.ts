/**
 * Quali risposte mostrare quando ci sono sia quelle salvate nel browser sia
 * quelle dell'account, e se bisogna copiare il browser nell'account.
 * Funzione pura: la pagina /percorso la usa a ogni rendering.
 */
import type { IdPasso } from "@/data/passi";
import type { RisposteSalvate } from "./archivio";
import type { Risposte } from "./risposte";

/** Quello che il server sa dell'utente (vuoto se non collegato o in modalità demo). */
export type DatiAccount = {
  collegato: boolean;
  risposte: Risposte | null;
  aggiornatoIl: string | null;
  passiFatti: IdPasso[];
};

export const ACCOUNT_VUOTO: DatiAccount = { collegato: false, risposte: null, aggiornatoIl: null, passiFatti: [] };

export type Scelta = {
  risposte: Risposte | null;
  origine: "account" | "browser" | null;
  /** true se le risposte del browser vanno salvate nell'account (sono più recenti o l'account è vuoto). */
  daCaricare: boolean;
};

function stesseRisposte(a: Risposte, b: Risposte): boolean {
  const chiavi = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Risposte>;
  return [...chiavi].every((k) => a[k] === b[k]);
}

function piuRecente(a: string, b: string | null): boolean {
  if (!b) return true;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(tb)) return true;
  if (Number.isNaN(ta)) return false;
  return ta > tb;
}

export function scegliRisposte(account: DatiAccount, browser: RisposteSalvate | null): Scelta {
  if (!account.collegato) {
    return browser
      ? { risposte: browser.risposte, origine: "browser", daCaricare: false }
      : { risposte: null, origine: null, daCaricare: false };
  }
  if (account.risposte && browser) {
    if (stesseRisposte(account.risposte, browser.risposte)) {
      return { risposte: account.risposte, origine: "account", daCaricare: false };
    }
    return piuRecente(browser.aggiornatoIl, account.aggiornatoIl)
      ? { risposte: browser.risposte, origine: "browser", daCaricare: true }
      : { risposte: account.risposte, origine: "account", daCaricare: false };
  }
  if (account.risposte) return { risposte: account.risposte, origine: "account", daCaricare: false };
  if (browser) return { risposte: browser.risposte, origine: "browser", daCaricare: true };
  return { risposte: null, origine: null, daCaricare: false };
}
