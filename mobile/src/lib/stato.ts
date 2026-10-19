/**
 * Lo stato salvato sul telefono, letto con le stesse chiavi e le stesse
 * funzioni del sito (src/lib/percorso, src/lib/mascotte): risposte al
 * questionario, passi fatti, bozza, look della mascotte, promemoria.
 * Risposte e passi fatti si cambiano solo con salvaRisposte e segnaPasso:
 * con l'accesso vanno anche nell'account (percorso-locale.ts e
 * percorso-account.ts).
 */
import { useMemo, useSyncExternalStore } from "react";
import type { IdPasso } from "@/data/passi";
import { CHIAVE_SCADENZE_DOCUMENTI } from "@/lib/cassetto/promemoria";
import { analizzaBozza, CHIAVE_BOZZA, type BozzaSalvata } from "@/lib/percorso/bozza";
import {
  analizzaPassiFatti,
  analizzaRisposteSalvate,
  CHIAVE_LINK_CALENDARIO,
  CHIAVE_PASSI_FATTI,
  CHIAVE_RISPOSTE,
  CHIAVE_UTENTE,
  type RisposteSalvate,
} from "@/lib/percorso/archivio";
import { calcolaPercorso, type Percorso } from "@/lib/percorso/regole";
import { VERSIONE_RISPOSTE, type Risposte } from "@/lib/percorso/risposte";
import { analizzaLook, CHIAVE_LOOK, type IdLook } from "@/lib/mascotte/look";
import { CHIAVE_VESTITO } from "@/lib/mascotte/vestito";
import { iscriviti, leggi, scrivi } from "./memoria";
import { cambiaPassoSulTelefono, CHIAVE_IN_SOSPESO, nuoveRisposteSulTelefono } from "./percorso-locale";

/** Promemoria delle scadenze attivi ("si") o no. */
export const CHIAVE_PROMEMORIA = "bleo:app:promemoria";
/** Riassunto del lunedì attivo ("si") o no. */
export const CHIAVE_SETTIMANA = "bleo:app:settimana";

function useGrezzo(chiave: string): string | null {
  return useSyncExternalStore(
    iscriviti,
    () => leggi(chiave),
    () => null,
  );
}

export function useRisposte(): RisposteSalvate | null {
  const grezzo = useGrezzo(CHIAVE_RISPOSTE);
  return useMemo(() => analizzaRisposteSalvate(grezzo), [grezzo]);
}

/** Il percorso personale calcolato dalle risposte, oppure null se il questionario non è fatto. */
export function usePercorso(): { risposte: Risposte; percorso: Percorso } | null {
  const salvate = useRisposte();
  return useMemo(
    () => (salvate ? { risposte: salvate.risposte, percorso: calcolaPercorso(salvate.risposte) } : null),
    [salvate],
  );
}

export function usePassiFatti(): ReadonlySet<string> {
  const grezzo = useGrezzo(CHIAVE_PASSI_FATTI);
  return useMemo(() => new Set(analizzaPassiFatti(grezzo)), [grezzo]);
}

/** Segna un passo fatto o da fare: subito sul telefono, poi (con l'accesso) nell'account. */
export function segnaPasso(id: IdPasso, fatto: boolean): void {
  cambiaPassoSulTelefono(id, fatto);
}

/** Salva le risposte del questionario: subito sul telefono, poi (con l'accesso) nell'account. */
export function salvaRisposte(risposte: Risposte): void {
  nuoveRisposteSulTelefono(risposte);
}

export function leggiBozza(): BozzaSalvata | null {
  return analizzaBozza(leggi(CHIAVE_BOZZA));
}

export function salvaBozza({ indice, bozza }: BozzaSalvata): void {
  scrivi(CHIAVE_BOZZA, JSON.stringify({ versione: VERSIONE_RISPOSTE, indice, bozza }));
}

export function cancellaBozza(): void {
  scrivi(CHIAVE_BOZZA, null);
}

/** Il look di Bleo; chi aveva un vecchio vestito ritrova il look più simile. */
export function useLook(): IdLook {
  const grezzo = useGrezzo(CHIAVE_LOOK);
  const vecchio = useGrezzo(CHIAVE_VESTITO);
  return useMemo(() => analizzaLook(grezzo, vecchio), [grezzo, vecchio]);
}

export function salvaLook(look: IdLook): void {
  scrivi(CHIAVE_LOOK, look);
}

export function usePromemoriaAttivi(): boolean {
  return useGrezzo(CHIAVE_PROMEMORIA) === "si";
}

export function impostaPromemoria(attivi: boolean): void {
  scrivi(CHIAVE_PROMEMORIA, attivi ? "si" : null);
}

/** Promemoria attivi, letti adesso (fuori dalle schermate). */
export function promemoriaAttivi(): boolean {
  return leggi(CHIAVE_PROMEMORIA) === "si";
}

/** Tutto quello che serve per riprogrammare le notifiche, letto adesso dal telefono. */
export function leggiStatoNotifiche(): {
  percorso: Percorso | null;
  fatti: ReadonlySet<string>;
  scadenze: boolean;
  settimana: boolean;
} {
  const salvate = analizzaRisposteSalvate(leggi(CHIAVE_RISPOSTE));
  return {
    percorso: salvate ? calcolaPercorso(salvate.risposte) : null,
    fatti: new Set(analizzaPassiFatti(leggi(CHIAVE_PASSI_FATTI))),
    scadenze: promemoriaAttivi(),
    settimana: leggi(CHIAVE_SETTIMANA) === "si",
  };
}

export function useSettimanaAttiva(): boolean {
  return useGrezzo(CHIAVE_SETTIMANA) === "si";
}

export function impostaSettimana(attiva: boolean): void {
  scrivi(CHIAVE_SETTIMANA, attiva ? "si" : null);
}

/** Cancella dal telefono tutto quello che Bleo ha salvato (anche nomi e scadenze dei documenti del cassetto). */
export function cancellaDatiLocali(): void {
  for (const chiave of [
    CHIAVE_RISPOSTE,
    CHIAVE_PASSI_FATTI,
    CHIAVE_UTENTE,
    CHIAVE_IN_SOSPESO,
    CHIAVE_BOZZA,
    CHIAVE_VESTITO,
    CHIAVE_LOOK,
    CHIAVE_PROMEMORIA,
    CHIAVE_SETTIMANA,
    CHIAVE_LINK_CALENDARIO,
    CHIAVE_SCADENZE_DOCUMENTI,
  ]) {
    scrivi(chiave, null);
  }
}

/** Data di oggi sul telefono, AAAA-MM-GG. */
export function oggiLocale(adesso = new Date()): string {
  return `${adesso.getFullYear()}-${String(adesso.getMonth() + 1).padStart(2, "0")}-${String(adesso.getDate()).padStart(2, "0")}`;
}
