/**
 * Lo stato salvato sul telefono, letto con le stesse chiavi e le stesse
 * funzioni del sito (src/lib/percorso, src/lib/mascotte): risposte al
 * questionario, passi fatti, bozza, vestito della mascotte, promemoria.
 */
import { useMemo, useSyncExternalStore } from "react";
import type { IdPasso } from "@/data/passi";
import { analizzaBozza, CHIAVE_BOZZA, type BozzaSalvata } from "@/lib/percorso/bozza";
import {
  analizzaPassiFatti,
  analizzaRisposteSalvate,
  cambiaPasso,
  CHIAVE_PASSI_FATTI,
  CHIAVE_RISPOSTE,
  type RisposteSalvate,
} from "@/lib/percorso/archivio";
import { calcolaPercorso, type Percorso } from "@/lib/percorso/regole";
import { VERSIONE_RISPOSTE, type Risposte } from "@/lib/percorso/risposte";
import { analizzaVestito, CHIAVE_VESTITO, type Vestito } from "@/lib/mascotte/vestito";
import { iscriviti, leggi, scrivi } from "./memoria";

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

export function segnaPasso(id: IdPasso, fatto: boolean): void {
  const attuali = analizzaPassiFatti(leggi(CHIAVE_PASSI_FATTI));
  scrivi(CHIAVE_PASSI_FATTI, JSON.stringify(cambiaPasso(attuali, id, fatto)));
}

export function salvaRisposte(risposte: Risposte): void {
  scrivi(CHIAVE_RISPOSTE, JSON.stringify({ risposte, aggiornatoIl: new Date().toISOString() }));
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

export function useVestito(): Vestito {
  const grezzo = useGrezzo(CHIAVE_VESTITO);
  return useMemo(() => analizzaVestito(grezzo), [grezzo]);
}

export function salvaVestito(vestito: Vestito): void {
  scrivi(CHIAVE_VESTITO, JSON.stringify(vestito));
}

export function usePromemoriaAttivi(): boolean {
  return useGrezzo(CHIAVE_PROMEMORIA) === "si";
}

export function impostaPromemoria(attivi: boolean): void {
  scrivi(CHIAVE_PROMEMORIA, attivi ? "si" : null);
}

export function useSettimanaAttiva(): boolean {
  return useGrezzo(CHIAVE_SETTIMANA) === "si";
}

export function impostaSettimana(attiva: boolean): void {
  scrivi(CHIAVE_SETTIMANA, attiva ? "si" : null);
}

/** Cancella dal telefono tutto quello che Bleo ha salvato. */
export function cancellaDatiLocali(): void {
  for (const chiave of [CHIAVE_RISPOSTE, CHIAVE_PASSI_FATTI, CHIAVE_BOZZA, CHIAVE_VESTITO, CHIAVE_PROMEMORIA, CHIAVE_SETTIMANA]) {
    scrivi(chiave, null);
  }
}

/** Data di oggi sul telefono, AAAA-MM-GG. */
export function oggiLocale(adesso = new Date()): string {
  return `${adesso.getFullYear()}-${String(adesso.getMonth() + 1).padStart(2, "0")}-${String(adesso.getDate()).padStart(2, "0")}`;
}
