/**
 * Dati salvati solo su questo telefono (SQLite, chiave → testo), letti in
 * modo sincrono come il localStorage del sito: così si riusano le stesse
 * chiavi e le stesse funzioni di lettura di src/lib.
 */
import Storage from "expo-sqlite/kv-store";

const ascoltatori = new Set<() => void>();

export function leggi(chiave: string): string | null {
  try {
    return Storage.getItemSync(chiave);
  } catch {
    return null;
  }
}

/** Scrive (o cancella, con null) e avvisa le schermate aperte. */
export function scrivi(chiave: string, valore: string | null): void {
  try {
    if (valore === null) Storage.removeItemSync(chiave);
    else Storage.setItemSync(chiave, valore);
  } catch {
    // Spazio pieno o database non disponibile: non si rompe nulla.
  }
  for (const f of ascoltatori) f();
}

export function iscriviti(f: () => void): () => void {
  ascoltatori.add(f);
  return () => ascoltatori.delete(f);
}

/** Per la sessione di accesso (supabase-js vuole un archivio asincrono). */
export const archivioAsincrono = {
  getItem: (chiave: string) => Storage.getItem(chiave),
  setItem: (chiave: string, valore: string) => Storage.setItem(chiave, valore),
  removeItem: (chiave: string) => Storage.removeItem(chiave),
};
