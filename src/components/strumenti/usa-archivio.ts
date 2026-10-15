"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { z } from "zod";
import { CHIAVI_ARCHIVIO, codifica, decodifica } from "@/lib/strumenti/archivio";
import { dataIsoLocale } from "@/lib/strumenti/documenti";

/*
 * Archivio nel browser con useSyncExternalStore: sul server e durante
 * l'idratazione il valore è null (dati non ancora letti), poi arriva quello
 * salvato. Così niente differenze tra HTML del server e del browser.
 *
 * Se localStorage non è disponibile (navigazione privata, spazio pieno,
 * blocchi del browser) i dati restano in memoria finché la pagina è aperta.
 */

type Voce = { grezzo: string | null; valore: unknown };

const cache = new Map<string, Voce>();
const memoria = new Map<string, string | null>();
const ascoltatori = new Map<string, Set<() => void>>();
let localStorageOk: boolean | null = null;

function storageDisponibile(): boolean {
  if (localStorageOk !== null) return localStorageOk;
  try {
    const prova = "bussola.strumenti.__prova__";
    window.localStorage.setItem(prova, "1");
    window.localStorage.removeItem(prova);
    localStorageOk = true;
  } catch {
    localStorageOk = false;
  }
  return localStorageOk;
}

function leggiGrezzo(chiave: string): string | null {
  if (memoria.has(chiave)) return memoria.get(chiave) ?? null;
  let grezzo: string | null = null;
  if (storageDisponibile()) {
    try {
      grezzo = window.localStorage.getItem(chiave);
    } catch {
      grezzo = null;
    }
  }
  memoria.set(chiave, grezzo);
  return grezzo;
}

function scriviGrezzo(chiave: string, grezzo: string | null) {
  memoria.set(chiave, grezzo);
  if (!storageDisponibile()) return;
  try {
    if (grezzo === null) window.localStorage.removeItem(chiave);
    else window.localStorage.setItem(chiave, grezzo);
  } catch {
    // Spazio pieno: il valore resta in memoria per questa sessione.
  }
}

function notifica(chiave: string) {
  ascoltatori.get(chiave)?.forEach((f) => f());
}

let ascoltoAltreSchede = false;
function ascoltaAltreSchede() {
  if (ascoltoAltreSchede || typeof window === "undefined") return;
  ascoltoAltreSchede = true;
  // Un'altra scheda ha salvato: aggiorna anche questa.
  window.addEventListener("storage", (evento) => {
    if (!evento.key || !evento.key.startsWith("bussola.strumenti.")) return;
    memoria.set(evento.key, evento.newValue);
    cache.delete(evento.key);
    notifica(evento.key);
  });
}

function iscrivi(chiave: string, callback: () => void) {
  ascoltaAltreSchede();
  let insieme = ascoltatori.get(chiave);
  if (!insieme) {
    insieme = new Set();
    ascoltatori.set(chiave, insieme);
  }
  insieme.add(callback);
  return () => {
    insieme.delete(callback);
  };
}

function leggi<T>(chiave: string, schema: z.ZodType<T>, predefinito: () => T): T {
  const grezzo = leggiGrezzo(chiave);
  const voce = cache.get(chiave);
  if (voce && voce.grezzo === grezzo) return voce.valore as T;
  const valore = decodifica(grezzo, schema, predefinito);
  cache.set(chiave, { grezzo, valore });
  return valore;
}

function salva<T>(chiave: string, valore: T) {
  const grezzo = codifica(valore);
  scriviGrezzo(chiave, grezzo);
  cache.set(chiave, { grezzo, valore });
  notifica(chiave);
}

/**
 * Valore salvato nel browser e funzione per aggiornarlo. Il valore è null
 * finché la pagina non è idratata.
 */
export function useArchivio<T>(
  chiave: string,
  schema: z.ZodType<T>,
  predefinito: () => T,
): [T | null, (aggiornamento: T | ((precedente: T) => T)) => void] {
  const valore = useSyncExternalStore(
    useCallback((cb: () => void) => iscrivi(chiave, cb), [chiave]),
    () => leggi(chiave, schema, predefinito),
    () => null,
  );
  const aggiorna = useCallback(
    (aggiornamento: T | ((precedente: T) => T)) => {
      const precedente = leggi(chiave, schema, predefinito);
      const nuovo =
        typeof aggiornamento === "function" ? (aggiornamento as (p: T) => T)(precedente) : aggiornamento;
      salva(chiave, nuovo);
    },
    [chiave, schema, predefinito],
  );
  return [valore, aggiorna];
}

/** true se per questa chiave c'è qualcosa di salvato (per es. per importare da un altro strumento). */
export function useArchivioPresente(chiave: string): boolean {
  return useSyncExternalStore(
    useCallback((cb: () => void) => iscrivi(chiave, cb), [chiave]),
    () => leggiGrezzo(chiave) !== null,
    () => false,
  );
}

/** Cancella i dati di uno strumento (torna ai valori iniziali). */
export function cancellaArchivio(chiave: string) {
  scriviGrezzo(chiave, null);
  cache.delete(chiave);
  notifica(chiave);
}

/** Cancella tutti i dati degli strumenti salvati su questo dispositivo. */
export function cancellaTuttiGliStrumenti() {
  for (const chiave of Object.values(CHIAVI_ARCHIVIO)) cancellaArchivio(chiave);
}

const nessunaIscrizione = () => () => {};

/** true se il browser salva davvero (localStorage); null prima dell'idratazione. */
export function useSalvataggioAttivo(): boolean | null {
  return useSyncExternalStore(nessunaIscrizione, storageDisponibile, () => null);
}

/** Data di oggi (AAAA-MM-GG, ora locale) nel browser; null sul server. */
export function useOggi(): string | null {
  return useSyncExternalStore(nessunaIscrizione, () => dataIsoLocale(new Date()), () => null);
}
