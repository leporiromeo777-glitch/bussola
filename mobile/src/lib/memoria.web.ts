/** Versione web (solo anteprima nel browser): localStorage. */
const ascoltatori = new Set<() => void>();

function archivio(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function leggi(chiave: string): string | null {
  try {
    return archivio()?.getItem(chiave) ?? null;
  } catch {
    return null;
  }
}

export function scrivi(chiave: string, valore: string | null): void {
  try {
    if (valore === null) archivio()?.removeItem(chiave);
    else archivio()?.setItem(chiave, valore);
  } catch {
    // Niente.
  }
  for (const f of ascoltatori) f();
}

export function iscriviti(f: () => void): () => void {
  ascoltatori.add(f);
  return () => ascoltatori.delete(f);
}

export const archivioAsincrono = {
  getItem: async (chiave: string) => leggi(chiave),
  setItem: async (chiave: string, valore: string) => scrivi(chiave, valore),
  removeItem: async (chiave: string) => scrivi(chiave, null),
};
