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
  /** Id dell'utente collegato: dice di chi è la copia dei dati nel browser. */
  userId: string | null;
  /** Email dell'account, mostrata prima di salvarci i dati del browser. */
  email: string | null;
  risposte: Risposte | null;
  aggiornatoIl: string | null;
  passiFatti: IdPasso[];
};

export const ACCOUNT_VUOTO: DatiAccount = {
  collegato: false,
  userId: null,
  email: null,
  risposte: null,
  aggiornatoIl: null,
  passiFatti: [],
};

export type Scelta = {
  risposte: Risposte | null;
  origine: "account" | "browser" | null;
  /** true se le risposte del browser vanno salvate nell'account (sono più recenti o l'account è vuoto). */
  daCaricare: boolean;
  /**
   * true se prima di salvarle serve il sì dell'utente: i dati del browser sono
   * stati creati senza accesso e potrebbero essere di un'altra persona.
   */
  daConfermare: boolean;
  /** true se i dati del browser sono la copia di un altro account: non si mostrano e non si caricano. */
  datiDiAltri: boolean;
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

function scelta(risposte: Risposte | null, origine: Scelta["origine"], daCaricare = false): Scelta {
  return { risposte, origine, daCaricare, daConfermare: false, datiDiAltri: false };
}

/**
 * @param proprietario l'account a cui appartiene la copia nel browser
 *   (CHIAVE_UTENTE), oppure null se i dati sono stati creati senza accesso.
 */
export function scegliRisposte(
  account: DatiAccount,
  browser: RisposteSalvate | null,
  proprietario: string | null = null,
): Scelta {
  if (!account.collegato) {
    return browser ? scelta(browser.risposte, "browser") : scelta(null, null);
  }
  if (proprietario !== null && proprietario !== account.userId) {
    // Copia di un altro account (per esempio su un computer condiviso): vale solo l'account collegato.
    return { ...scelta(account.risposte, account.risposte ? "account" : null), datiDiAltri: true };
  }
  let risultato: Scelta;
  if (account.risposte && browser) {
    if (stesseRisposte(account.risposte, browser.risposte)) {
      risultato = scelta(account.risposte, "account");
    } else {
      risultato = piuRecente(browser.aggiornatoIl, account.aggiornatoIl)
        ? scelta(browser.risposte, "browser", true)
        : scelta(account.risposte, "account");
    }
  } else if (account.risposte) {
    risultato = scelta(account.risposte, "account");
  } else if (browser) {
    risultato = scelta(browser.risposte, "browser", true);
  } else {
    risultato = scelta(null, null);
  }
  // Dati creati senza accesso: si caricano nell'account solo dopo un sì esplicito.
  return { ...risultato, daConfermare: risultato.daCaricare && proprietario === null };
}
