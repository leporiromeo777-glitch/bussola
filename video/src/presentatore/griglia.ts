/**
 * Posizioni dello stile «presentatore» nel quadrato 1080×1080.
 *
 * Il clip di Bleo è 960×960: Bleo va da y 150 (cima della testa) al bordo in
 * basso (tagliato in vita), da x ~50 a ~720 con la mano che indica, che sta
 * fra y ~590 e ~765. Con scala 0,8 Bleo è alto 648 px (60% del quadrato), la
 * punta della mano arriva a x ~550 e y 790–925: indica le schede a destra.
 */
export const PRESENTATORE = {
  bleo: { x: -24, y: 312, lato: 768 },
  /**
   * Le schede: a destra della mano, appoggiate in basso alla stessa linea. Il
   * titolo un po' più in alto, così la bussolina che lo srotola non finisce
   * dietro i sottotitoli.
   */
  colonna: { x: 592, larghezza: 440, fondo: 880, fondoTitolo: 824 },
  /** Fascia dei sottotitoli: copre solo la pancia di Bleo, sotto la mano. */
  sottotitoli: { lato: 40, fondo: 24, altezza: 138, corpo: 40 },
  bussolina: {
    altezza: 170,
    /** Proporzioni dell'immagine mascotte/bussolina.webp (540×720). */
    rapporto: 540 / 720,
    /** Dove aspetta (i piedi): sopra la testa di Bleo, accanto alle schede. */
    riposo: { x: 480, y: 345 },
  },
} as const;
