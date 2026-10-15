/** Esiti possibili del link di conferma, passati alla pagina come ?esito=. */
export const ESITI_CONFERMA = ["confermata", "gia_confermata", "link_non_valido", "demo", "errore"] as const;

export type EsitoPaginaConferma = (typeof ESITI_CONFERMA)[number];

export function leggiEsito(valore: unknown): EsitoPaginaConferma {
  return ESITI_CONFERMA.find((e) => e === valore) ?? "link_non_valido";
}
