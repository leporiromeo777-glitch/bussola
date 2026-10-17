/**
 * Posizioni dello stile «lavagna» nel quadrato 1080×1080.
 *
 * In alto l'intestazione, in basso i sottotitoli (come nello stile
 * «presentatore», così nel misto non si spostano). Bleo parla in una
 * finestra rotonda in basso a sinistra, sopra i sottotitoli; tutto il resto è
 * la lavagna, dove i disegni spiegano quello che dice.
 */
export const LAVAGNA = {
  /** La lavagna: i disegni hanno coordinate da 0 a 1000 × 0 a 700 qui dentro. */
  tela: { x: 40, y: 120, larghezza: 1000, altezza: 700 },
  /**
   * La finestra di Bleo (centro e raggio). Nella tela, l'angolo in basso a
   * sinistra (x < 300, y > 480) resta libero per lei.
   */
  cerchio: { cx: 180, cy: 760, r: 140 },
  /** Parte del clip di Bleo che parla (960×960) da mostrare nel cerchio: testa e petto, senza bussola. */
  inquadratura: { cx: 355, cy: 450, r: 310 },
  /** I tre cerchi «tre cose», in alto a destra della tela (coordinate della tela). */
  contatore: { x: 980, y: 40 },
  /** La bussolina sulla lavagna: un po' più piccola che nel presentatore. */
  bussolina: { altezza: 210 },
} as const;

/** Da coordinate della tela a coordinate del video. */
export function suTela(x: number, y: number): { x: number; y: number } {
  return { x: LAVAGNA.tela.x + x, y: LAVAGNA.tela.y + y };
}
