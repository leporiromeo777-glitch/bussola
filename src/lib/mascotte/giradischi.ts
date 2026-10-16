/**
 * Il piedistallo girevole della mascotte 3D: angolo, inerzia dopo il
 * trascinamento, rotazione lenta quando nessuno lo tocca e giri a scatti dai
 * pulsanti. Logica pura, senza three.js: la scena legge solo `angolo`.
 */

export type Giradischi = {
  /** Angolo attuale in radianti. */
  angolo: number;
  /** Velocità in radianti al secondo (inerzia dopo il trascinamento). */
  velocita: number;
  /** Angolo da raggiungere dopo un pulsante, oppure null. */
  obiettivo: number | null;
  /** true mentre il dito o il mouse tiene il piedistallo. */
  trascinando: boolean;
  /** Secondi passati dall'ultimo tocco: la rotazione lenta riparte dopo una pausa. */
  fermoDa: number;
};

/** Radianti per pixel trascinato: un trascinamento su tutta la larghezza fa circa un giro. */
export const RADIANTI_PER_PIXEL = 0.012;
/** Rotazione lenta, in radianti al secondo. */
export const VELOCITA_AUTOMATICA = 0.35;
/** Pausa dopo un tocco prima che la rotazione lenta riparta, in secondi. */
export const PAUSA_AUTOMATICA = 2.5;
/** Quanto in fretta l'inerzia si spegne (per secondo). */
const ATTRITO = 3.2;
/** Sotto questa velocità l'inerzia si considera finita. */
const VELOCITA_MINIMA = 0.02;
/** Velocità massima dopo un lancio, per non far girare il piedistallo all'impazzata. */
const VELOCITA_MASSIMA = 12;

export function nuovoGiradischi(angolo = 0): Giradischi {
  return { angolo, velocita: 0, obiettivo: null, trascinando: false, fermoDa: 0 };
}

export function iniziaTrascinamento(g: Giradischi): Giradischi {
  return { ...g, trascinando: true, velocita: 0, obiettivo: null, fermoDa: 0 };
}

/** Il dito si è spostato di `dx` pixel in `dt` secondi. */
export function trascina(g: Giradischi, dx: number, dt: number): Giradischi {
  const delta = dx * RADIANTI_PER_PIXEL;
  const velocita = dt > 0 ? limita(delta / dt, VELOCITA_MASSIMA) : g.velocita;
  return { ...g, angolo: g.angolo + delta, velocita, fermoDa: 0 };
}

export function finisciTrascinamento(g: Giradischi): Giradischi {
  return { ...g, trascinando: false, fermoDa: 0 };
}

/** Gira di `passo` radianti con un'animazione (pulsanti e tastiera). */
export function giraDi(g: Giradischi, passo: number): Giradischi {
  const base = g.obiettivo ?? g.angolo;
  return { ...g, obiettivo: base + passo, velocita: 0, fermoDa: 0 };
}

/**
 * Avanza di `dt` secondi. Con `automatico` il piedistallo gira piano quando
 * nessuno lo tocca da un po' (spento per chi chiede meno movimento).
 */
export function avanza(g: Giradischi, dt: number, automatico: boolean): Giradischi {
  if (g.trascinando || dt <= 0) return g;

  if (g.obiettivo !== null) {
    const mancano = g.obiettivo - g.angolo;
    if (Math.abs(mancano) < 0.001) return { ...g, angolo: g.obiettivo, obiettivo: null, fermoDa: 0 };
    // avvicinamento morbido: copre circa il 99% della distanza in mezzo secondo
    const frazione = 1 - Math.exp(-9 * dt);
    return { ...g, angolo: g.angolo + mancano * frazione, fermoDa: 0 };
  }

  if (Math.abs(g.velocita) > VELOCITA_MINIMA) {
    const velocita = g.velocita * Math.exp(-ATTRITO * dt);
    return { ...g, angolo: g.angolo + g.velocita * dt, velocita, fermoDa: 0 };
  }

  const fermoDa = g.fermoDa + dt;
  const angolo = automatico && fermoDa > PAUSA_AUTOMATICA ? g.angolo + VELOCITA_AUTOMATICA * dt : g.angolo;
  return { ...g, angolo, velocita: 0, fermoDa };
}

/** true se il piedistallo si sta ancora muovendo (serve per sapere se ridisegnare). */
export function inMovimento(g: Giradischi, automatico: boolean): boolean {
  return (
    g.trascinando ||
    g.obiettivo !== null ||
    Math.abs(g.velocita) > VELOCITA_MINIMA ||
    automatico
  );
}

function limita(valore: number, massimo: number): number {
  return Math.max(-massimo, Math.min(massimo, valore));
}
