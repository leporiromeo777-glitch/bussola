/**
 * La copia del percorso su questo telefono: risposte, passi fatti e di
 * quale account è la copia (le stesse chiavi del sito, src/lib/percorso/
 * archivio.ts), più le modifiche ai passi non ancora salvate nell'account.
 * Qui solo la memoria del telefono: l'account sta in percorso-account.ts,
 * che viene avvisato a ogni modifica.
 */
import type { IdPasso } from "@/data/passi";
import {
  analizzaPassiFatti,
  analizzaProprietario,
  analizzaRisposteSalvate,
  CHIAVE_PASSI_FATTI,
  CHIAVE_RISPOSTE,
  CHIAVE_UTENTE,
} from "@/lib/percorso/archivio";
import type { Risposte } from "@/lib/percorso/risposte";
import {
  analizzaInSospeso,
  conNuoveRisposte,
  conPassoCambiato,
  serializzaInSospeso,
  stesseRisposte,
  type CopiaLocale,
} from "@/lib/percorso/sincronizza";
import { leggi, scrivi } from "./memoria";

/** Modifiche ai passi fatte sul telefono e non ancora salvate nell'account (solo nell'app). */
export const CHIAVE_IN_SOSPESO = "bleo:app:percorso:in-sospeso";

/** L'account collegato: null senza accesso, undefined finché non si sa (appena aperta l'app). */
let utenteAttuale: string | null | undefined;

export function impostaUtentePercorso(utente: string | null): void {
  utenteAttuale = utente;
}

const ascoltatori = new Set<() => void>();

/** Avvisa a ogni modifica fatta sul telefono (passo segnato, questionario finito). */
export function suModificaPercorso(ascoltatore: () => void): () => void {
  ascoltatori.add(ascoltatore);
  return () => {
    ascoltatori.delete(ascoltatore);
  };
}

function avvisa() {
  for (const a of ascoltatori) a();
}

export function leggiCopiaLocale(): CopiaLocale {
  return {
    risposte: analizzaRisposteSalvate(leggi(CHIAVE_RISPOSTE)),
    passiFatti: analizzaPassiFatti(leggi(CHIAVE_PASSI_FATTI)),
    proprietario: analizzaProprietario(leggi(CHIAVE_UTENTE)),
    inSospeso: analizzaInSospeso(leggi(CHIAVE_IN_SOSPESO)),
  };
}

/** Scrive la copia; tocca solo le chiavi che cambiano davvero (così le schermate non si ridisegnano per niente). */
export function scriviCopiaLocale(copia: CopiaLocale): void {
  const prima = leggiCopiaLocale();
  const stesseSalvate =
    prima.risposte === copia.risposte ||
    (prima.risposte !== null &&
      copia.risposte !== null &&
      prima.risposte.aggiornatoIl === copia.risposte.aggiornatoIl &&
      stesseRisposte(prima.risposte.risposte, copia.risposte.risposte));
  if (!stesseSalvate) scrivi(CHIAVE_RISPOSTE, copia.risposte ? JSON.stringify(copia.risposte) : null);
  if (prima.passiFatti.join(",") !== copia.passiFatti.join(",")) {
    scrivi(CHIAVE_PASSI_FATTI, copia.passiFatti.length > 0 || leggi(CHIAVE_PASSI_FATTI) !== null ? JSON.stringify(copia.passiFatti) : null);
  }
  if (prima.proprietario !== copia.proprietario) scrivi(CHIAVE_UTENTE, copia.proprietario);
  const inSospeso = serializzaInSospeso(copia.inSospeso);
  if (leggi(CHIAVE_IN_SOSPESO) !== inSospeso) scrivi(CHIAVE_IN_SOSPESO, inSospeso);
}

/** Un passo segnato come fatto o da fare: subito sul telefono, poi (con l'accesso) nell'account. */
export function cambiaPassoSulTelefono(id: IdPasso, fatto: boolean): void {
  scriviCopiaLocale(conPassoCambiato(leggiCopiaLocale(), id, fatto));
  avvisa();
}

/** Le risposte del questionario appena finito: subito sul telefono, poi (con l'accesso) nell'account. */
export function nuoveRisposteSulTelefono(risposte: Risposte): void {
  const salvate = { risposte, aggiornatoIl: new Date().toISOString() };
  scriviCopiaLocale(conNuoveRisposte(leggiCopiaLocale(), salvate, utenteAttuale));
  avvisa();
}

/** Toglie dal telefono la copia del percorso (risposte, passi fatti, proprietario, modifiche da mandare). */
export function dimenticaCopiaLocale(): void {
  for (const chiave of [CHIAVE_RISPOSTE, CHIAVE_PASSI_FATTI, CHIAVE_UTENTE, CHIAVE_IN_SOSPESO]) {
    if (leggi(chiave) !== null) scrivi(chiave, null);
  }
}
