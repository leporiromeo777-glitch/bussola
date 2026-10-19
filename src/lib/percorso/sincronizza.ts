/**
 * Quali risposte mostrare quando ci sono sia quelle salvate nel browser (o
 * nel telefono) sia quelle dell'account, e se bisogna copiare il browser
 * nell'account. Funzioni pure: la pagina /percorso usa scegliRisposte a ogni
 * rendering; l'app usa le stesse regole con pianoAllineamento, che decide
 * anche cosa fare dei passi fatti e delle modifiche non ancora salvate.
 */
import { eIdPasso, type IdPasso } from "@/data/passi";
import type { ModifichePassi } from "./account-api";
import { cambiaPasso, type RisposteSalvate } from "./archivio";
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

/** true se le due risposte dicono le stesse cose (stesse chiavi, stessi valori). */
export function stesseRisposte(a: Risposte, b: Risposte): boolean {
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

/** true se ogni passo fatto nel browser è già fatto anche nell'account. */
function passiGiaNellAccount(locali: readonly string[], account: readonly string[]): boolean {
  const fatti = new Set<string>(account);
  return locali.every((id) => fatti.has(id));
}

/**
 * @param proprietario l'account a cui appartiene la copia nel browser
 *   (CHIAVE_UTENTE), oppure null se i dati sono stati creati senza accesso.
 * @param passiLocali i passi fatti nel browser: se le risposte sono le stesse
 *   dell'account ma nel browser ci sono passi fatti senza accesso che
 *   l'account non ha, anche questi si caricano solo dopo il sì (altrimenti
 *   la copia dell'account li cancellerebbe).
 */
export function scegliRisposte(
  account: DatiAccount,
  browser: RisposteSalvate | null,
  proprietario: string | null = null,
  passiLocali?: readonly string[],
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
  if (
    proprietario === null &&
    passiLocali &&
    browser &&
    account.risposte &&
    risultato.origine === "account" &&
    stesseRisposte(account.risposte, browser.risposte) &&
    !passiGiaNellAccount(passiLocali, account.passiFatti)
  ) {
    risultato = scelta(browser.risposte, "browser", true);
  }
  // Dati creati senza accesso: si caricano nell'account solo dopo un sì esplicito.
  return { ...risultato, daConfermare: risultato.daCaricare && proprietario === null };
}

/**
 * true se la domanda «salvo nell'account?» riguarda solo i passi fatti: le
 * risposte del browser sono le stesse dell'account.
 */
export function soloPassiDaSalvare(account: DatiAccount, browser: RisposteSalvate | null): boolean {
  return Boolean(account.risposte && browser && stesseRisposte(account.risposte, browser.risposte));
}

/* ------------------------------------------------------------------ */
/* La copia sul telefono (app)                                         */
/* ------------------------------------------------------------------ */

/**
 * Passi cambiati sul telefono e non ancora salvati nell'account di `utente`:
 * id → true (fatto) o false (di nuovo da fare). Restano finché l'account non
 * è uguale: così una modifica fatta senza rete non si perde.
 */
export type PassiInSospeso = { utente: string; passi: Partial<Record<IdPasso, boolean>> };

/** La copia del percorso sul telefono: le chiavi di archivio.ts più le modifiche da mandare. */
export type CopiaLocale = {
  risposte: RisposteSalvate | null;
  passiFatti: IdPasso[];
  /** Di quale account è la copia (CHIAVE_UTENTE); null se è stata creata senza accesso. */
  proprietario: string | null;
  inSospeso: PassiInSospeso | null;
};

export const COPIA_VUOTA: CopiaLocale = { risposte: null, passiFatti: [], proprietario: null, inSospeso: null };

const NESSUNA_MODIFICA: ModifichePassi = { fatti: [], daFare: [] };

type Modifiche = Partial<Record<IdPasso, boolean>>;

/** Le modifiche in sospeso salvate sul telefono, se valide (solo passi conosciuti). */
export function analizzaInSospeso(grezzo: string | null): PassiInSospeso | null {
  if (!grezzo) return null;
  try {
    const dati: unknown = JSON.parse(grezzo);
    if (!dati || typeof dati !== "object") return null;
    const { utente, passi } = dati as Record<string, unknown>;
    if (typeof utente !== "string" || !utente.trim() || !passi || typeof passi !== "object") return null;
    return inSospesoDi(utente, pulisci(passi as Record<string, unknown>));
  } catch {
    return null;
  }
}

/** Testo da salvare per le modifiche in sospeso; null se non ce ne sono. */
export function serializzaInSospeso(inSospeso: PassiInSospeso | null): string | null {
  return inSospeso && Object.keys(inSospeso.passi).length > 0 ? JSON.stringify(inSospeso) : null;
}

function pulisci(passi: Record<string, unknown>): Modifiche {
  const pulite: Modifiche = {};
  for (const [id, fatto] of Object.entries(passi)) if (eIdPasso(id) && typeof fatto === "boolean") pulite[id] = fatto;
  return pulite;
}

function inSospesoDi(utente: string, passi: Modifiche): PassiInSospeso | null {
  return Object.keys(passi).length > 0 ? { utente, passi } : null;
}

function applica(base: readonly IdPasso[], modifiche: Modifiche): IdPasso[] {
  let passi = [...new Set(base)];
  for (const [id, fatto] of Object.entries(modifiche)) {
    if (eIdPasso(id) && typeof fatto === "boolean") passi = cambiaPasso(passi, id, fatto);
  }
  return passi;
}

/** Le modifiche che l'account non ha ancora (quelle già vere nell'account non servono più). */
function ancoraDaMandare(modifiche: Modifiche, account: readonly IdPasso[]): Modifiche {
  const fatti = new Set<string>(account);
  const restano: Modifiche = {};
  for (const [id, fatto] of Object.entries(modifiche)) {
    if (eIdPasso(id) && typeof fatto === "boolean" && fatti.has(id) !== fatto) restano[id] = fatto;
  }
  return restano;
}

function comeModifichePassi(modifiche: Modifiche): ModifichePassi {
  const voci = Object.entries(modifiche) as [IdPasso, boolean][];
  return { fatti: voci.filter(([, f]) => f).map(([id]) => id), daFare: voci.filter(([, f]) => !f).map(([id]) => id) };
}

/** Un passo segnato sul telefono: se la copia è di un account, la modifica resta da mandare. */
export function conPassoCambiato(copia: CopiaLocale, id: IdPasso, fatto: boolean): CopiaLocale {
  const passiFatti = cambiaPasso(copia.passiFatti, id, fatto);
  if (copia.proprietario === null) return { ...copia, passiFatti, inSospeso: null };
  const prima = copia.inSospeso?.utente === copia.proprietario ? copia.inSospeso.passi : {};
  return { ...copia, passiFatti, inSospeso: { utente: copia.proprietario, passi: { ...prima, [id]: fatto } } };
}

/**
 * Nuove risposte al questionario sul telefono, come nel questionario del
 * sito: se la copia è di un altro account (o di un account, e adesso
 * l'accesso non c'è), i suoi passi fatti si tolgono (scartaDatiDiAltri).
 * Con l'accesso la copia diventa dell'account collegato e le risposte vanno
 * nell'account, come sul sito: finire il questionario dopo l'accesso vale
 * come «sì», anche per i passi segnati prima sul telefono.
 *
 * @param utente l'account collegato; null senza accesso; undefined se non si
 *   sa ancora (la copia resta di chi era).
 */
export function conNuoveRisposte(
  copia: CopiaLocale,
  risposte: RisposteSalvate,
  utente: string | null | undefined,
): CopiaLocale {
  let { passiFatti, proprietario, inSospeso } = copia;
  if (utente !== undefined && proprietario !== null && proprietario !== utente) {
    passiFatti = [];
    proprietario = null;
    inSospeso = null;
  }
  if (utente && proprietario === null) {
    proprietario = utente;
    inSospeso = inSospesoDi(utente, Object.fromEntries(passiFatti.map((id) => [id, true])));
  }
  return { risposte, passiFatti, proprietario, inSospeso };
}

/** Che cosa chiedere prima di salvare nell'account la copia creata senza accesso. */
export type DomandaSalvataggio = {
  /** true se le risposte sono le stesse dell'account: si salverebbero solo i passi fatti. */
  soloPassi: boolean;
  /** true se le risposte salvate prima nell'account verrebbero sostituite. */
  sostituisce: boolean;
  /** Quanti passi fatti sul telefono non sono ancora nell'account. */
  passiNuovi: number;
};

export type PianoAllineamento =
  | { tipo: "da_confermare"; domanda: DomandaSalvataggio }
  | {
      tipo: "allinea";
      /** La copia da scrivere sul telefono. */
      copia: CopiaLocale;
      /** Le risposte da salvare nell'account, se ce ne sono. */
      risposte: Risposte | null;
      /** I passi da cambiare nell'account (le modifiche in sospeso della copia). */
      passi: ModifichePassi;
    };

/**
 * Come allineare la copia del telefono e l'account, con le regole del sito
 * (scegliRisposte):
 * - copia di un altro account: si sostituisce con quella dell'account
 *   collegato (o si cancella, se l'account non ha un percorso);
 * - copia creata senza accesso con qualcosa che l'account non ha: serve il
 *   sì (`confermato`); con il sì risposte e passi del telefono vanno
 *   nell'account (i passi si aggiungono, non si tolgono);
 * - risposte del telefono più recenti (copia di questo account): vanno
 *   nell'account;
 * - altrimenti vince l'account (risposte e passi), con sopra le modifiche ai
 *   passi fatte sul telefono e non ancora salvate, che restano da mandare.
 */
export function pianoAllineamento(
  account: DatiAccount,
  copia: CopiaLocale,
  { confermato = false, adesso = new Date().toISOString() }: { confermato?: boolean; adesso?: string } = {},
): PianoAllineamento {
  const utente = account.collegato ? account.userId : null;
  if (!utente) return { tipo: "allinea", copia, risposte: null, passi: NESSUNA_MODIFICA };
  const scelta = scegliRisposte(account, copia.risposte, copia.proprietario, copia.passiFatti);

  if (scelta.datiDiAltri) {
    return { tipo: "allinea", copia: copiaDellAccount(account, utente, {}, adesso), risposte: null, passi: NESSUNA_MODIFICA };
  }

  if (scelta.daConfermare && !confermato) {
    const soloPassi = soloPassiDaSalvare(account, copia.risposte);
    const nellAccount = new Set<string>(account.passiFatti);
    return {
      tipo: "da_confermare",
      domanda: {
        soloPassi,
        sostituisce: account.risposte !== null && !soloPassi,
        passiNuovi: copia.passiFatti.filter((id) => !nellAccount.has(id)).length,
      },
    };
  }

  const proprie: Modifiche =
    copia.proprietario === utente && copia.inSospeso?.utente === utente ? copia.inSospeso.passi : {};

  if (scelta.daCaricare && copia.risposte) {
    // Copia creata senza accesso (con il sì): i passi del telefono si aggiungono a quelli dell'account.
    const desiderate =
      copia.proprietario === null ? (Object.fromEntries(copia.passiFatti.map((id) => [id, true])) as Modifiche) : proprie;
    const daMandare = ancoraDaMandare(desiderate, account.passiFatti);
    return {
      tipo: "allinea",
      copia: {
        risposte: copia.risposte,
        passiFatti: applica(account.passiFatti, daMandare),
        proprietario: utente,
        inSospeso: inSospesoDi(utente, daMandare),
      },
      risposte: soloPassiDaSalvare(account, copia.risposte) ? null : copia.risposte.risposte,
      passi: comeModifichePassi(daMandare),
    };
  }

  // Né il telefono né l'account hanno un percorso da usare: non si tocca niente.
  if (!account.risposte) return { tipo: "allinea", copia, risposte: null, passi: NESSUNA_MODIFICA };

  const nuova = copiaDellAccount(account, utente, proprie, adesso);
  return { tipo: "allinea", copia: nuova, risposte: null, passi: comeModifichePassi(nuova.inSospeso?.passi ?? {}) };
}

/** La copia dell'account, con sopra le modifiche del telefono non ancora salvate (come copiaAccountNelBrowser del sito). */
function copiaDellAccount(account: DatiAccount, utente: string, proprie: Modifiche, adesso: string): CopiaLocale {
  if (!account.risposte) return COPIA_VUOTA;
  const daMandare = ancoraDaMandare(proprie, account.passiFatti);
  return {
    risposte: { risposte: account.risposte, aggiornatoIl: account.aggiornatoIl ?? adesso },
    passiFatti: applica(account.passiFatti, daMandare),
    proprietario: utente,
    inSospeso: inSospesoDi(utente, daMandare),
  };
}

/** Che cosa cambia tra due copie: le risposte (contenuto) e i passi fatti (insieme). */
export function cambiDellaCopia(prima: CopiaLocale, dopo: CopiaLocale): { risposte: boolean; passi: boolean } {
  const risposte =
    (prima.risposte === null) !== (dopo.risposte === null) ||
    (prima.risposte !== null && dopo.risposte !== null && !stesseRisposte(prima.risposte.risposte, dopo.risposte.risposte));
  const a = new Set<string>(prima.passiFatti);
  const b = new Set<string>(dopo.passiFatti);
  const passi = a.size !== b.size || [...a].some((id) => !b.has(id));
  return { risposte, passi };
}
