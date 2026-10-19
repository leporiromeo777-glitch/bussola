/**
 * Risposta di GET /api/nome-ditta e GET /api/testi ({ attiva }): lo
 * strumento con l'AI si può usare? Logica pura, la usa l'app per mostrare
 * subito «non ancora attivo» come fanno le pagine del sito.
 */

/**
 * true o false se il sito lo dice, null se non si sa (sito vecchio, rete
 * assente). Con null l'app lascia provare: se lo strumento è spento lo dirà
 * la risposta all'invio.
 */
export function leggiDisponibilita(stato: number, corpo: unknown): boolean | null {
  if (stato < 200 || stato >= 300 || !corpo || typeof corpo !== "object") return null;
  const attiva = (corpo as { attiva?: unknown }).attiva;
  return typeof attiva === "boolean" ? attiva : null;
}
