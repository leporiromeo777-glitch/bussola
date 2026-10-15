/**
 * Un pezzo di testo estratto da una pagina ufficiale, prima della divisione
 * in frammenti. I titoli servono a dare un nome alla sezione di ogni
 * frammento (`titolo_sezione` nella tabella `frammenti_fonti`).
 */
export type Blocco =
  | { tipo: "titolo"; livello: number; testo: string }
  | { tipo: "paragrafo"; testo: string }
  | { tipo: "punto"; testo: string };

/** Spazi multipli, a capo e spazi non separabili diventano uno spazio solo. */
export function normalizzaSpazi(testo: string): string {
  return testo
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** true se il testo contiene almeno due lettere o due cifre (scarta "|", "»", "·"...). */
export function haContenuto(testo: string): boolean {
  return (testo.match(/\p{L}/gu) ?? []).length >= 2 || (testo.match(/\d/g) ?? []).length >= 2;
}
