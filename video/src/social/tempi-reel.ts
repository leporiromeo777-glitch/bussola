/**
 * Il video verticale del post del giorno (Reel di Instagram e della pagina
 * Facebook): tempi delle parti e mosse della bussolina. Logica pura, la
 * disegna Reel.tsx; le mosse sono quelle dello stile «presentatore»
 * (src/presentatore/coreografia.ts).
 */
import type { PostSocial, SchedaPost } from "../../../src/data/social";
import { ANGOLO_TOCCO, DURATE, manoDestra, nuovaRegia, vai, type Piano, type Punto } from "../presentatore/coreografia";

export const FPS_REEL = 30;
export const LARGHEZZA_REEL = 1080;
export const ALTEZZA_REEL = 1920;

/**
 * Posizioni nel 1080×1920. In alto e in basso Instagram copre il video con
 * nome, didascalia e pulsanti: le schede stanno fra y 280 e ~1230, Bleo in
 * basso a sinistra con la testa sopra la didascalia, la bussolina a destra.
 */
export const GRIGLIA_REEL = {
  margine: 72,
  marchio: { y: 150 },
  /** Copertina, cifra e chiusura: tutta la larghezza. */
  scheda: { x: 72, y: 280, larghezza: 936 },
  /** Elenco: più stretto, a destra resta la corsia della bussolina. */
  elenco: { x: 72, y: 280, larghezza: 820, titolo: 136, riga: 190, spazio: 16 },
  /** Bleo presentatore: il suo riquadro 1080×1080 (vedi griglia.ts), scalato e spostato. */
  bleo: { x: -20, y: 725, scala: 1.15 },
  bussolina: { altezza: 250, riposo: { x: 860, y: 1470 } as Punto },
} as const;

export type ParteReel = {
  scheda: SchedaPost | null;
  /** null: la chiusura con fonte e invito. */
  indice: number;
  inizio: number;
  durata: number;
  /** Elenco: il fotogramma (dall'inizio della parte) in cui compare ogni punto. */
  punti: number[];
};

export type TempiReel = { parti: ParteReel[]; totale: number };

const DURATA_COPERTINA = 120;
const DURATA_CIFRA = 105;
const DURATA_CHIUSURA = 130;
/** Elenco: la scheda entra, poi un punto ogni 48 fotogrammi, poi una pausa per leggere. */
const ELENCO = { primo: 24, passo: 48, coda: 40 } as const;

export function tempiReel(post: PostSocial): TempiReel {
  const parti: ParteReel[] = [];
  let t = 0;
  post.schede.forEach((scheda, indice) => {
    let durata = DURATA_CIFRA;
    let punti: number[] = [];
    if (scheda.tipo === "copertina") durata = DURATA_COPERTINA;
    if (scheda.tipo === "punti") {
      punti = scheda.punti.map((_, k) => ELENCO.primo + k * ELENCO.passo);
      durata = ELENCO.primo + scheda.punti.length * ELENCO.passo + ELENCO.coda;
    }
    parti.push({ scheda, indice, inizio: t, durata, punti });
    t += durata;
  });
  parti.push({ scheda: null, indice: post.schede.length, inizio: t, durata: DURATA_CHIUSURA, punti: [] });
  return { parti, totale: t + DURATA_CHIUSURA };
}

/** Il centro della riga `k` di un elenco (pixel del video). */
export function centroRiga(k: number): Punto {
  const { x, y, larghezza, titolo, riga, spazio } = GRIGLIA_REEL.elenco;
  return { x: x + larghezza, y: y + titolo + k * (riga + spazio) + riga / 2 };
}

/** Le mosse della bussolina: entra sulla copertina, tocca i punti, salta accanto alle cifre, fa festa alla fine. */
export function pianoReel(tempi: TempiReel): Piano {
  const r = nuovaRegia();
  const { riposo } = GRIGLIA_REEL.bussolina;
  for (const parte of tempi.parti) {
    const s = parte.inizio;
    const scheda = parte.scheda;
    if (scheda?.tipo === "copertina") {
      vai(r, riposo, s + 30, 20);
      r.mosse.push({ tipo: "annuisci", inizio: s + 70, durata: DURATE.annuisci });
    } else if (scheda?.tipo === "punti") {
      // Dalla sua corsia a destra, girata verso sinistra, tocca il bordo di ogni punto quando compare.
      const mano = manoDestra(ANGOLO_TOCCO);
      parte.punti.forEach((comparsa, k) => {
        const bordo = centroRiga(k);
        const piedi = { x: bordo.x + mano.x + 6, y: bordo.y - mano.y };
        vai(r, piedi, s + comparsa - 12, 12, 70, true);
        r.mosse.push({ tipo: "tocca", inizio: s + comparsa, durata: DURATE.tocco });
        r.scintille.push({ x: bordo.x, y: bordo.y, inizio: s + comparsa + 4, raggio: 90 });
      });
      vai(r, riposo, s + parte.durata - 18, 14, 90, false);
    } else if (scheda?.tipo === "cifra") {
      r.cartellini.push({ inizio: s + 12, fine: s + 60, testo: "!" });
      r.mosse.push({ tipo: "festeggia", inizio: s + 62, durata: 34 });
      r.scintille.push({ x: LARGHEZZA_REEL / 2, y: 560, inizio: s + 50, raggio: 140 });
    } else {
      // Chiusura: salta accanto all'invito e fa festa fino alla fine.
      const sopra = { x: 870, y: 1190 };
      vai(r, sopra, s + 24, 16, 120);
      r.mosse.push({ tipo: "festeggia", inizio: s + 48, durata: parte.durata - 52 });
      r.scintille.push({ x: sopra.x, y: sopra.y - 120, inizio: s + 44, raggio: 110 });
    }
  }
  return { ...r, fine: tempi.totale };
}

/** Un suono del video, a un fotogramma preciso (li suona scripts/audio-reel.py). */
export type SuonoReel = {
  tipo: "passaggio" | "entra" | "punto" | "scintilla" | "conta" | "cifra" | "festa";
  fotogramma: number;
  /** Punto: quale (la nota sale a ogni punto). */
  indice?: number;
  /** Conta: per quanti fotogrammi ticchetta. */
  durata?: number;
};

/** Il fotogramma (dall'inizio della cifra) in cui il numero comincia e finisce di salire (vedi Reel.tsx). */
export const CONTA = { da: 10, a: 48 } as const;

/**
 * I suoni del video, legati alle animazioni: un soffio a ogni cambio di
 * scheda, un «pop» quando compare un punto, le scintille, il ticchettio
 * mentre la cifra sale e una piccola festa quando la bussolina festeggia.
 */
export function suoniReel(tempi: TempiReel, piano: Piano): SuonoReel[] {
  const suoni: SuonoReel[] = [];
  for (const parte of tempi.parti) {
    // Il soffio parte un attimo prima, mentre la scheda vecchia esce.
    suoni.push({ tipo: "passaggio", fotogramma: Math.max(0, parte.inizio - (parte.indice ? 6 : 0)) });
    parte.punti.forEach((comparsa, k) => suoni.push({ tipo: "punto", fotogramma: parte.inizio + comparsa, indice: k }));
    if (parte.scheda?.tipo === "cifra" && numeroDaContare(parte.scheda.cifra)) {
      suoni.push({ tipo: "conta", fotogramma: parte.inizio + CONTA.da, durata: CONTA.a - CONTA.da });
      suoni.push({ tipo: "cifra", fotogramma: parte.inizio + CONTA.a });
    }
  }
  for (const m of piano.mosse) {
    if (m.tipo === "entra") suoni.push({ tipo: "entra", fotogramma: m.inizio });
    if (m.tipo === "festeggia") suoni.push({ tipo: "festa", fotogramma: m.inizio });
  }
  for (const sc of piano.scintille) suoni.push({ tipo: "scintilla", fotogramma: sc.inizio });
  return suoni.sort((a, b) => a.fotogramma - b.fotogramma);
}

/** «CHF 100'000» → { prima: "CHF ", numero: 100000, dopo: "" }; null se non c'è un numero da far salire. */
export function numeroDaContare(cifra: string): { prima: string; numero: number; dopo: string } | null {
  const m = /^(\D*?)(\d[\d']*)(.*)$/.exec(cifra);
  if (!m) return null;
  return { prima: m[1], numero: Number(m[2].replace(/'/g, "")), dopo: m[3] };
}

/** 100000 → «100'000», come chf() in src/data/svizzera.ts. */
export function conApostrofi(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}
