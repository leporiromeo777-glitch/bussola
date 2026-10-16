import { PASSI } from "../../../src/data/passi";

/** Titolo del passo che segue `passoId` nell'ordine di PASSI (per la scheda finale). */
export function titoloProssimoPasso(passoId: string): string | undefined {
  const i = PASSI.findIndex((p) => p.id === passoId);
  if (i === -1) throw new Error(`Passo sconosciuto: ${passoId}`);
  return PASSI[i + 1]?.titolo;
}
