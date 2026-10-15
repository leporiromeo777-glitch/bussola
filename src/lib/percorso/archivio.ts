/**
 * Salvataggio nel browser (localStorage) delle risposte e dei passi fatti.
 * Funziona sempre, anche senza Supabase (modalità demo). Ogni accesso è
 * protetto: in navigazione privata o con lo spazio pieno i dati restano in
 * memoria finché la scheda è aperta, e non si rompe nulla.
 */
import { eIdPasso, type IdPasso } from "@/data/passi";
import { leggiRisposte, type Risposte } from "./risposte";

export const CHIAVE_RISPOSTE = "bussola:percorso:risposte";
export const CHIAVE_PASSI_FATTI = "bussola:percorso:passi-fatti";

/** Evento per avvisare i componenti della stessa scheda (l'evento "storage" arriva solo alle altre). */
export const EVENTO_ARCHIVIO = "bussola:percorso-archivio";

/** Risposte salvate con il momento del salvataggio: vince la più recente tra browser e account. */
export type RisposteSalvate = { risposte: Risposte; aggiornatoIl: string };

type Archivio = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Copia in memoria per quando il browser non salva (solo nel browser, mai sul server). */
const memoria = new Map<string, string | null>();

function nelBrowser(): boolean {
  return typeof window !== "undefined";
}

function archivio(): Archivio | null {
  try {
    return nelBrowser() ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function leggiGrezzo(chiave: string): string | null {
  if (!nelBrowser()) return null;
  if (memoria.has(chiave)) return memoria.get(chiave) ?? null;
  try {
    return archivio()?.getItem(chiave) ?? null;
  } catch {
    return null;
  }
}

/** Scrive (o cancella, con null) e avvisa la pagina. Restituisce false se il browser non salva in modo permanente. */
export function scriviGrezzo(chiave: string, valore: string | null): boolean {
  if (!nelBrowser()) return false;
  let riuscito = false;
  try {
    const a = archivio();
    if (a) {
      if (valore === null) a.removeItem(chiave);
      else a.setItem(chiave, valore);
      riuscito = true;
    }
  } catch {
    riuscito = false;
  }
  if (riuscito) memoria.delete(chiave);
  else memoria.set(chiave, valore);
  try {
    window.dispatchEvent(new Event(EVENTO_ARCHIVIO));
  } catch {
    // Niente da avvisare.
  }
  return riuscito;
}

/** Si iscrive ai cambiamenti (questa scheda e le altre). */
export function iscriviti(callback: () => void): () => void {
  if (!nelBrowser()) return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO_ARCHIVIO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO_ARCHIVIO, callback);
  };
}

/** Solo per i test: svuota la copia in memoria. */
export function svuotaMemoria(): void {
  memoria.clear();
}

/** Risposte salvate, se valide e della versione attuale. */
export function analizzaRisposteSalvate(grezzo: string | null): RisposteSalvate | null {
  if (!grezzo) return null;
  try {
    const dati: unknown = JSON.parse(grezzo);
    if (!dati || typeof dati !== "object") return null;
    const { risposte, aggiornatoIl } = dati as Record<string, unknown>;
    const valide = leggiRisposte(risposte);
    if (!valide || typeof aggiornatoIl !== "string" || Number.isNaN(Date.parse(aggiornatoIl))) return null;
    return { risposte: valide, aggiornatoIl };
  } catch {
    return null;
  }
}

/** Passi fatti salvati: solo id conosciuti, senza doppioni, nell'ordine salvato. */
export function analizzaPassiFatti(grezzo: string | null): IdPasso[] {
  if (!grezzo) return [];
  try {
    const dati: unknown = JSON.parse(grezzo);
    if (!Array.isArray(dati)) return [];
    return [...new Set(dati.filter(eIdPasso))];
  } catch {
    return [];
  }
}

export function salvaRisposteLocali(risposte: Risposte, aggiornatoIl: string = new Date().toISOString()): boolean {
  const salvate: RisposteSalvate = { risposte, aggiornatoIl };
  return scriviGrezzo(CHIAVE_RISPOSTE, JSON.stringify(salvate));
}

export function salvaPassiFattiLocali(passi: Iterable<string>): boolean {
  return scriviGrezzo(CHIAVE_PASSI_FATTI, JSON.stringify([...new Set([...passi].filter(eIdPasso))]));
}

/** Aggiunge o toglie un passo dall'elenco dei fatti; restituisce il nuovo elenco. */
export function cambiaPasso(fatti: Iterable<string>, id: IdPasso, fatto: boolean): IdPasso[] {
  const insieme = new Set([...fatti].filter(eIdPasso));
  if (fatto) insieme.add(id);
  else insieme.delete(id);
  return [...insieme];
}
