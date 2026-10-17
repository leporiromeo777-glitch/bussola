/**
 * Posizioni dello stile «presentatore» nel quadrato 1080×1080.
 *
 * Il clip di Bleo è 960×960: Bleo va da y 150 (cima della testa) al bordo in
 * basso (tagliato in vita), da x ~50 a ~720 con la mano che indica, che sta
 * fra y ~590 e ~765. Misurando l'alfa di tutti i fotogrammi, Bleo sta sempre
 * fra x 16 e 722 e da y 149 in giù. Con scala 0,78 e x 12 resta tutto dentro
 * (le mani a 24 px dal bordo sinistro), alto 632 px (58% del quadrato); la
 * punta della mano arriva a x ~575 e y 790–928: indica le schede a destra.
 */
export const PRESENTATORE = {
  bleo: { x: 12, y: 331, lato: 749 },
  /**
   * Le schede: a destra della mano, appoggiate in basso alla stessa linea. Il
   * titolo un po' più in alto, così la bussolina che lo srotola non finisce
   * dietro i sottotitoli.
   */
  colonna: { x: 612, larghezza: 420, fondo: 880, fondoTitolo: 820 },
  /** Fascia dei sottotitoli: copre solo la pancia di Bleo, sotto la mano. `cima` = 1080 − fondo − altezza. */
  sottotitoli: { lato: 40, fondo: 20, altezza: 134, corpo: 40, cima: 926 },
  bussolina: {
    /** Altezza quando fa qualcosa, e quando aspetta. */
    altezza: 240,
    ferma: 190,
    /** Proporzioni dell'immagine mascotte/bussolina.webp (540×720). */
    rapporto: 540 / 720,
    /** Dove aspetta (i piedi): sopra la testa di Bleo, accanto alle schede. */
    riposo: { x: 500, y: 405 },
  },
} as const;
