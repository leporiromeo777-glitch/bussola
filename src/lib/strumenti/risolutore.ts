/**
 * Risolutore per la circolarità "i contributi AVS dipendono dall'utile":
 * trova il più piccolo utile x tale che f(x) >= obiettivo, quando f è
 * continua e crescente tra un punto di salto e il successivo ma può scendere
 * di colpo su un punto di salto (per es. all'inizio di una nuova fascia della
 * tavola scalare il tasso cresce e il netto cala di qualche franco).
 *
 * Metodo: si scorrono i tratti dal più basso; nel primo tratto in cui
 * l'obiettivo è raggiungibile si cerca il punto con la bisezione.
 *
 * Con `blocco` (per es. 100, perché il reddito AVS si arrotonda ai 100
 * franchi inferiori) dentro un tratto f è a dente di sega: cresce dentro ogni
 * blocco e cala un po' all'inizio del blocco dopo, ma il massimo di ogni
 * blocco cresce da un blocco all'altro. Prima si cerca con la bisezione il
 * primo blocco in cui l'obiettivo è raggiungibile, poi il punto dentro il
 * blocco.
 */

import { arrotonda } from "./numeri";

export type OpzioniRisolutore = {
  /** Precisione della bisezione, in franchi. */
  tolleranza?: number;
  /** Da dove partire a cercare (predefinito 0). */
  da?: number;
  /** Oltre questo valore si rinuncia (obiettivo irraggiungibile). */
  massimo?: number;
  /**
   * Larghezza dei gradini di f dentro un tratto (in franchi): f cresce dentro
   * ogni blocco [k × blocco, (k + 1) × blocco) e il suo massimo cresce da un
   * blocco al successivo.
   */
  blocco?: number;
};

export function minimoPerObiettivo(
  f: (x: number) => number,
  obiettivo: number,
  puntiDiSalto: readonly number[],
  { tolleranza = 0.001, da = 0, massimo = 1e9, blocco }: OpzioniRisolutore = {},
): number | null {
  const punti = [...new Set([da, ...puntiDiSalto.filter((p) => p > da && p < massimo), massimo])].sort((a, b) => a - b);

  for (let i = 0; i < punti.length - 1; i++) {
    const inizio = punti[i];
    const fine = punti[i + 1];
    if (f(inizio) >= obiettivo) return inizio;
    // Ultimo centesimo prima del salto successivo (gli importi sono al centesimo).
    const quasiFine = arrotonda(fine - 0.01, 2);
    if (quasiFine <= inizio || f(quasiFine) < obiettivo) continue;

    let basso = inizio;
    let alto = quasiFine;
    if (blocco && blocco > 0) {
      // Ultimo centesimo del blocco k dentro il tratto: lì f ha il massimo del blocco.
      const fineBlocco = (k: number) => arrotonda(Math.min(fine, (k + 1) * blocco) - 0.01, 2);
      // Primo blocco con f(fineBlocco) >= obiettivo: il predicato è monotono.
      let kBasso = Math.floor(inizio / blocco);
      let kAlto = Math.ceil(fine / blocco) - 1;
      while (kBasso < kAlto) {
        const k = Math.floor((kBasso + kAlto) / 2);
        if (f(fineBlocco(k)) >= obiettivo) kAlto = k;
        else kBasso = k + 1;
      }
      basso = Math.max(inizio, kAlto * blocco);
      alto = fineBlocco(kAlto);
      if (f(basso) >= obiettivo) return basso;
    }
    // f(basso) < obiettivo <= f(alto), f crescente in mezzo: bisezione fino alla tolleranza.
    for (let passo = 0; passo < 200 && alto - basso > tolleranza; passo++) {
      const medio = (basso + alto) / 2;
      if (f(medio) >= obiettivo) alto = medio;
      else basso = medio;
    }
    return alto;
  }
  return null;
}

/**
 * Come sopra, ma il risultato è arrotondato per eccesso al centesimo e
 * verificato: f(risultato) >= obiettivo.
 */
export function minimoInCentesimi(
  f: (x: number) => number,
  obiettivo: number,
  puntiDiSalto: readonly number[],
  opzioni: OpzioniRisolutore = {},
): number | null {
  let da = opzioni.da ?? 0;
  for (let tentativo = 0; tentativo < 5; tentativo++) {
    const grezzo = minimoPerObiettivo(f, obiettivo, puntiDiSalto, { ...opzioni, da });
    if (grezzo === null) return null;
    let x = Math.ceil(grezzo * 100 - 1e-6) / 100;
    // Gli arrotondamenti al centesimo dentro f possono chiedere qualche centesimo in più…
    for (let i = 0; i < 100 && f(x) < obiettivo; i++) x = arrotonda(x + 0.01, 2);
    // …o bastarne qualcuno in meno.
    for (let i = 0; i < 100 && x - 0.01 >= da && f(arrotonda(x - 0.01, 2)) >= obiettivo; i++) x = arrotonda(x - 0.01, 2);
    if (f(x) >= obiettivo) return x;
    // Raro: arrotondando si è finiti oltre un salto. Si riparte da lì.
    da = x;
  }
  return null;
}
