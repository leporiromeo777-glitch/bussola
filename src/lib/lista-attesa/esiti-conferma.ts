import type { ArchivioListaAttesa } from "./iscrizione";
import { leggiToken } from "./validazione";

/** Esiti possibili del link di conferma, passati alla pagina come ?esito=. */
export const ESITI_CONFERMA = ["confermata", "gia_confermata", "link_non_valido", "demo", "errore"] as const;

export type EsitoPaginaConferma = (typeof ESITI_CONFERMA)[number];

export function leggiEsito(valore: unknown): EsitoPaginaConferma {
  return ESITI_CONFERMA.find((e) => e === valore) ?? "link_non_valido";
}

/**
 * Conferma l'iscrizione legata al token (pulsante della pagina di conferma)
 * e dice quale esito mostrare. Riconfermare non cambia la data di conferma.
 */
export async function confermaIscrizione(
  tokenGrezzo: unknown,
  archivio: ArchivioListaAttesa | null,
): Promise<EsitoPaginaConferma> {
  const token = leggiToken(tokenGrezzo);
  if (!token) return "link_non_valido";
  if (!archivio) return "demo";
  try {
    const esito = await archivio.conferma(token);
    return esito === "non_trovata" ? "link_non_valido" : esito;
  } catch (errore) {
    console.error("[lista-attesa] conferma non riuscita:", errore instanceof Error ? errore.message : errore);
    return "errore";
  }
}
