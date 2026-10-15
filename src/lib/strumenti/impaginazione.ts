/**
 * Impaginazione della fattura in stampa: quante pagine A4 servono perché la
 * sezione pagamento della QR-fattura (ricevuta + sezione pagamento, 210 × 105
 * mm) stia sul bordo inferiore dell'ultima pagina, come chiedono le linee
 * guida SIX (cap. 3): «the payment part must be positioned on the lower edge
 * of the QR-bill». Se sotto il contenuto non restano 105 mm, la sezione va in
 * fondo a una pagina in più.
 *
 * Il foglio stampato ha margini di pagina a zero e il corpo ha i suoi margini
 * interni, ripetuti su ogni pagina (box-decoration-break: clone). Il browser
 * non allunga il corpo per i margini ripetuti né per le righe spinte alla
 * pagina dopo: se le pagine fossero poche, il testo finirebbe sopra la sezione
 * pagamento. Per questo la simulazione è prudente: in caso di dubbio conta
 * una pagina in più (la sezione finisce comunque in fondo a una pagina).
 *
 * Tutte le misure sono in millimetri, prese sul foglio senza interruzioni di
 * pagina (con gli stili di stampa).
 */

/** Altezza del foglio A4 e della sezione pagamento con ricevuta (linee guida SIX, cap. 3). */
export const ALTEZZA_A4_MM = 297;
export const ALTEZZA_SEZIONE_PAGAMENTO_MM = 105;

/** Un pezzo del corpo che non si spezza tra due pagine (una riga della tabella, il totale, un paragrafo). */
export type BloccoStampa = {
  /** Distanza dall'inizio del foglio, senza interruzioni di pagina. */
  alto: number;
  altezza: number;
  /** Riga della tabella delle voci: se va a capo pagina, l'intestazione della tabella si ripete sopra. */
  inTabella: boolean;
};

export type OpzioniImpaginazione = {
  altezzaPagina?: number;
  /** Margine interno in alto e in basso del corpo, ripetuto su ogni pagina. */
  margineSopra: number;
  margineSotto: number;
  /** Intestazione della tabella, ripetuta sulle pagine dove la tabella continua. */
  altezzaIntestazioneTabella: number;
  /** 0 se il documento non ha la sezione pagamento. */
  altezzaSezionePagamento?: number;
  /** Margine di sicurezza per gli arrotondamenti del browser. */
  tolleranza?: number;
};

/**
 * Simula l'impaginazione dei blocchi e restituisce il numero di pagine del
 * foglio, con la sezione pagamento in fondo all'ultima.
 */
export function pagineDelFoglio(
  blocchi: readonly BloccoStampa[],
  {
    altezzaPagina = ALTEZZA_A4_MM,
    margineSopra,
    margineSotto,
    altezzaIntestazioneTabella,
    altezzaSezionePagamento = ALTEZZA_SEZIONE_PAGAMENTO_MM,
    tolleranza = 1,
  }: OpzioniImpaginazione,
): number {
  const fineContenuto = altezzaPagina - margineSotto - tolleranza;
  let pagina = 0;
  // Dove finisce il contenuto sulla pagina corrente.
  let y = margineSopra;
  let inCimaAllaPagina = true;
  // Fine del blocco precedente nel foglio senza interruzioni (per gli spazi tra i blocchi).
  let finePrecedente = margineSopra;

  const nuovaPagina = (inTabella: boolean) => {
    pagina++;
    y = margineSopra + (inTabella ? altezzaIntestazioneTabella : 0);
    inCimaAllaPagina = true;
  };

  for (const b of blocchi) {
    if (b.altezza <= 0) continue;
    // Lo spazio tra due blocchi resta anche dopo un cambio di pagina: prudente.
    const spazio = Math.max(0, b.alto - finePrecedente);
    finePrecedente = Math.max(finePrecedente, b.alto + b.altezza);
    if (!inCimaAllaPagina && y + spazio + b.altezza > fineContenuto) nuovaPagina(b.inTabella);
    let inizio = y + spazio;
    // Un blocco più alto di una pagina si spezza comunque.
    let resto = b.altezza;
    for (let giri = 0; inizio + resto > fineContenuto && giri < 1000; giri++) {
      resto -= Math.max(0, fineContenuto - inizio);
      nuovaPagina(b.inTabella);
      inizio = y;
    }
    y = inizio + resto;
    inCimaAllaPagina = false;
  }

  if (altezzaSezionePagamento > 0 && y + margineSotto + tolleranza > altezzaPagina - altezzaSezionePagamento) {
    // Non c'è posto sotto il contenuto: la sezione va in fondo alla pagina dopo.
    pagina++;
  }
  return pagina + 1;
}
