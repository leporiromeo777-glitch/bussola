/**
 * Cosa fa la bussolina, l'aiutante di Bleo, nello stile «presentatore»: una
 * mossa alla volta, a tempo con le scene. Logica pura: dai tempi delle scene
 * e dalle misure delle schede (vedi Presentatore.tsx) calcola le mosse, poi
 * `posa()` dice dov'è e com'è la bussolina in ogni fotogramma.
 *
 * Le posizioni sono quelle dei piedi (in basso al centro), così schiacciarsi
 * e allungarsi parte da terra.
 */
import type { Scena, Schermo } from "../lezioni/tipi";
import { FPS, type Tempi } from "../tempi";
import { PRESENTATORE } from "./griglia";
import PEZZI from "./pezzi-bussolina.json";

export type Punto = { x: number; y: number };

/** Misure di una scheda, prese dal browser: altezza e centro dei numeri dell'elenco (dall'angolo in alto a sinistra). */
export type Misura = { altezza: number; punti: Punto[] };

/** Un gruppo di scene con la stessa scheda (vedi gruppiSchede in componenti/Schede.tsx). */
export type GruppoScene = { chiave: string; scene: number[]; inizio: number; fine: number };

export type Mossa =
  | { tipo: "entra"; inizio: number; durata: number; a: Punto; specchio?: boolean }
  | { tipo: "salta"; inizio: number; durata: number; a: Punto; altezza: number; specchio?: boolean }
  /** Si gira dall'altra parte (specchio: guarda e tocca verso sinistra). */
  | { tipo: "gira"; inizio: number; durata: number; specchio: boolean }
  | { tipo: "tira"; inizio: number; durata: number; a: Punto }
  /** Volo lungo una curva che passa vicino a `controllo` (per girare attorno alle schede). */
  | { tipo: "vola"; inizio: number; durata: number; a: Punto; controllo: Punto }
  | { tipo: "tocca"; inizio: number; durata: number }
  | { tipo: "lancia"; inizio: number; durata: number }
  | { tipo: "scuoti"; inizio: number; durata: number }
  | { tipo: "sparisci"; inizio: number; durata: number }
  | { tipo: "spingi"; inizio: number; durata: number; da: Punto; a: Punto }
  | { tipo: "annuisci"; inizio: number; durata: number }
  /** Cammina a terra (gambe alternate, un saltello per passo). */
  | { tipo: "cammina"; inizio: number; durata: number; a: Punto }
  /** Salti di gioia con le braccia in alto. */
  | { tipo: "festeggia"; inizio: number; durata: number };

/** Una pioggia di stelline e puntini. */
export type Scintilla = { x: number; y: number; inizio: number; raggio: number };

export type Piano = {
  mosse: Mossa[];
  /** Il cartellino con il numero dei punti («3»), alzato sopra la testa. */
  cartellini: { inizio: number; fine: number; testo: string }[];
  /** Il fumetto «!» dell'avviso. */
  allerte: { inizio: number; fine: number }[];
  scintille: Scintilla[];
  /** Fino a quando la bussolina resta in scena (poi c'è la scheda finale). */
  fine: number;
};

/**
 * Le parti del burattino (vedi Bussolina.tsx e scripts/taglia-bussolina.py).
 * Angoli in gradi, in senso orario: il braccio destro parte alzato (0) e con
 * +45 punta a destra; il sinistro parte giù a sinistra e con +90 punta in
 * alto a sinistra; le gambe con un angolo positivo portano il piede a sinistra.
 */
export type Corpo = {
  braccioDx: number;
  braccioSx: number;
  /**
   * Il braccio sinistro è attaccato in basso e corto: per alzarlo la spalla
   * scivola lungo l'anello (gira attorno al centro della cassa), poi il braccio
   * gira sul suo perno.
   */
  spallaSx: number;
  gambaSx: number;
  gambaDx: number;
  /** Lunghezza delle gambe: meno di 1 raccolte, più di 1 allungate. */
  gambe: number;
  /** Apertura degli occhi: 1 normali, ~0 chiusi, più di 1 sgranati. */
  occhi: number;
  /** Occhi chiusi felici (^ ^). */
  felice: boolean;
  /** Dove guarda: spostamento delle pupille, in pixel dell'immagine. */
  sguardo: number;
  bocca: "sorriso" | "oh" | "aperta";
};

export type Posa = Corpo & {
  x: number;
  y: number;
  /** Gradi. */
  rotazione: number;
  sx: number;
  sy: number;
  /** Scala uniforme (0 = sparita). */
  scala: number;
  /** Rotazione dell'ago, in gradi. */
  ago: number;
  /** Girata verso sinistra (immagine specchiata). */
  specchio?: boolean;
};

/** Ritardi (in fotogrammi dall'inizio della scena) usati sia dalla bussolina sia dalle schede. */
export const TEMPI_SCHEDE = {
  /** Titolo: la bussolina vola dentro, poi tira giù la scheda come un telo. */
  titoloTira: 16,
  titoloDurata: 24,
  /** Elenco: la scheda entra subito, i punti quando la bussolina li tocca. */
  elencoEntra: 8,
  puntoSalto: 12,
  /** Il punto compare nel colpo più forte del tocco. */
  puntoTocco: 16,
  /** Attenzione: la bussolina trema e l'ago gira, poi entra la scheda. */
  attenzioneEntra: 18,
  /** Punto: la bussolina «lancia» la scheda. */
  puntoEntra: 9,
  /** Fonte: la bussolina spinge la scheda da destra come un foglio. */
  fonteSpinge: 6,
  fonteDurata: 24,
  /** Di quanto arriva da destra la scheda della fonte. */
  fonteCorsa: 400,
} as const;

/** Durate (fotogrammi) delle mosse della bussolina. */
export const DURATE = { salto: 12, tocco: 16, lancio: 18, scossa: 34, allerta: 72, annuisci: 22, sparisci: 6, cammina: 32 } as const;

/** Di quanto gira il braccio destro per toccare un numero (punta a destra). */
export const ANGOLO_TOCCO = 45;

const { colonna, bussolina } = PRESENTATORE;
/** Altezza quando fa qualcosa; ferma è un po' più piccola (`bussolina.ferma`). */
const ALTEZZA = bussolina.altezza;
const FERMA = bussolina.ferma / bussolina.altezza;
const LARGHEZZA = ALTEZZA * bussolina.rapporto;
const RIPOSO: Punto = bussolina.riposo;
/** Da pixel dell'immagine (540×720) a pixel del video, quando è grande. */
const K = ALTEZZA / PEZZI.lato[1];

/**
 * Dove arriva la punta della mano destra con il braccio girato di `angolo`,
 * rispetto ai piedi (pixel del video, bussolina grande).
 */
export function manoDestra(angolo: number, altezza: number = ALTEZZA): Punto {
  const [px, py] = PEZZI["braccio-dx"].perno;
  const [, y0, x1] = PEZZI["braccio-dx"].riquadro;
  // La mano: in cima al braccio, un po' prima del bordo destro.
  const mano = { x: x1 - 18, y: y0 + 22 };
  const a = (angolo * Math.PI) / 180;
  const vx = mano.x - px;
  const vy = mano.y - py;
  const rx = px + vx * Math.cos(a) - vy * Math.sin(a);
  const ry = py + vx * Math.sin(a) + vy * Math.cos(a);
  // Più il raggio della mano, nella direzione del braccio.
  const lungo = Math.hypot(rx - px, ry - py);
  const punta = { x: rx + ((rx - px) / lungo) * 20, y: ry + ((ry - py) / lungo) * 20 };
  const k = (K * altezza) / ALTEZZA;
  return { x: (punta.x - PEZZI.lato[0] / 2) * k, y: (punta.y - PEZZI.lato[1]) * k };
}
/** Da dove arriva in volo: fuori dallo schermo, in alto a destra. */
const PARTENZA: Punto = { x: 1200, y: -40 };

/** Dove finisce in basso la scheda. */
export function fondoScheda(tipo: Schermo["tipo"]): number {
  return tipo === "titolo" ? colonna.fondoTitolo : colonna.fondo;
}

/**
 * Dove comincia in alto la scheda. Le scene dello stesso gruppo hanno la
 * stessa misura: quella della scheda finale del gruppo.
 */
export function altoScheda(misura: Misura | undefined, tipo: Schermo["tipo"]): number {
  return fondoScheda(tipo) - (misura?.altezza ?? 400);
}

/** Lo stato del regista mentre mette in fila le mosse: dove si trova la bussolina e cosa ha fatto. */
export type Regia = {
  mosse: Mossa[];
  cartellini: Piano["cartellini"];
  allerte: Piano["allerte"];
  scintille: Scintilla[];
  qui: Punto | null;
};

export function nuovaRegia(): Regia {
  return { mosse: [], cartellini: [], allerte: [], scintille: [], qui: null };
}

/** Va in `a`: la prima volta entra in volo, poi con un salto (se non è già lì). */
export function vai(r: Regia, a: Punto, inizio: number, durata: number = DURATE.salto, altezza = 90, specchio?: boolean) {
  if (r.qui === null) {
    r.mosse.push({ tipo: "entra", inizio, durata, a, specchio });
  } else if (Math.hypot(a.x - r.qui.x, a.y - r.qui.y) > 4) {
    r.mosse.push({ tipo: "salta", inizio, durata, a, altezza, specchio });
  } else if (specchio !== undefined) {
    r.mosse.push({ tipo: "gira", inizio, durata: 1, specchio });
  }
  r.qui = a;
}

const aRiposo = (r: Regia) => r.qui !== null && r.qui.x === RIPOSO.x && r.qui.y === RIPOSO.y;

export function creaPiano(
  scene: readonly Scena[],
  tempi: Tempi,
  gruppi: readonly GruppoScene[],
  misure: Readonly<Record<string, Misura>>,
): Piano {
  const r = nuovaRegia();
  gruppi.forEach((g) => gruppoPresentatore(r, g, scene, tempi, misure));
  return { ...r, fine: tempi.inizioFine };
}

/** Le mosse della bussolina per un gruppo di scene nello stile «presentatore». */
export function gruppoPresentatore(
  r: Regia,
  g: GruppoScene,
  scene: readonly Scena[],
  tempi: Tempi,
  misure: Readonly<Record<string, Misura>>,
) {
  const s = g.inizio;
  const misura = misure[g.chiave];
  const schermo = scene[g.scene[0]].schermo;
  const alto = altoScheda(misura, schermo.tipo);
  const basso = fondoScheda(schermo.tipo);
  const destra = colonna.x + colonna.larghezza;
  switch (schermo.tipo) {
    case "titolo": {
      // Si appende al rullo con le mani in alto e lo tira giù.
      const x = destra - LARGHEZZA * 0.42;
      const mani = -manoDestra(POSE_TIRA.braccioDx).y;
      vai(r, { x, y: alto + mani }, s, TEMPI_SCHEDE.titoloTira);
      const giu = { x, y: basso + mani };
      r.mosse.push({ tipo: "tira", inizio: s + TEMPI_SCHEDE.titoloTira, durata: TEMPI_SCHEDE.titoloDurata, a: giu });
      r.qui = giu;
      // Torna al suo posto girando fuori a destra e sopra la scheda, così non copre il titolo.
      r.mosse.push({
        tipo: "vola",
        inizio: s + TEMPI_SCHEDE.titoloTira + TEMPI_SCHEDE.titoloDurata + 6,
        durata: 22,
        a: RIPOSO,
        controllo: { x: 1500, y: 40 },
      });
      r.qui = RIPOSO;
      break;
    }
    case "elenco": {
      // Il «lancio» (si allunga dopo 4 fotogrammi) coincide con l'entrata della scheda.
      if (aRiposo(r)) r.mosse.push({ tipo: "lancia", inizio: s + TEMPI_SCHEDE.elencoEntra - 5, durata: DURATE.lancio });
      else vai(r, RIPOSO, s);
      let visibili = 0;
      g.scene.forEach((i) => {
        const sc = scene[i].schermo;
        if (sc.tipo !== "elenco") return;
        const t = tempi.scene[i].inizio;
        if (sc.visibili === 0) {
          // «Ricorda tre cose»: il cartellino con il numero sale sull'ultima frase della scena.
          const fine = t + tempi.scene[i].durata;
          const battute = tempi.battute.filter((b) => b.inizio * FPS >= t - 1 && b.inizio * FPS < fine);
          const ultima = battute.length > 1 ? Math.round(battute.at(-1)!.inizio * FPS) : t + 20;
          r.cartellini.push({ inizio: ultima, fine: Infinity, testo: String(sc.punti.length) });
        }
        for (let k = visibili; k < sc.visibili; k++) {
          const passo = (k - visibili) * 30;
          const centro = misura?.punti[k] ?? { x: 56, y: 120 + 80 * k };
          // Il braccio destro scende a destra e la mano tocca il bordo del numero.
          const mano = manoDestra(ANGOLO_TOCCO);
          const piedi = { x: colonna.x + centro.x - 26 - mano.x + 4, y: alto + centro.y - mano.y };
          vai(r, piedi, t + passo, TEMPI_SCHEDE.puntoSalto, 60);
          r.mosse.push({ tipo: "tocca", inizio: t + passo + TEMPI_SCHEDE.puntoSalto, durata: DURATE.tocco });
          r.scintille.push({ x: colonna.x + centro.x, y: alto + centro.y, inizio: t + passo + TEMPI_SCHEDE.puntoTocco, raggio: 92 });
          const c = r.cartellini.at(-1);
          if (c && c.fine === Infinity) c.fine = t + passo + 2;
        }
        visibili = Math.max(visibili, sc.visibili);
      });
      break;
    }
    case "attenzione": {
      // Se deve prima tornare al suo posto, trema appena arrivata.
      const t = aRiposo(r) ? s + 2 : s + DURATE.salto;
      vai(r, RIPOSO, s, DURATE.salto, 110);
      r.mosse.push({ tipo: "scuoti", inizio: t, durata: DURATE.scossa });
      r.allerte.push({ inizio: t + 1, fine: Math.min(t + DURATE.allerta, g.fine) });
      break;
    }
    case "punto": {
      if (!aRiposo(r)) vai(r, RIPOSO, s);
      r.mosse.push({ tipo: "lancia", inizio: s + TEMPI_SCHEDE.puntoEntra - 5, durata: DURATE.lancio });
      r.scintille.push({ x: colonna.x + 6, y: alto + 6, inizio: s + TEMPI_SCHEDE.puntoEntra + 5, raggio: 80 });
      break;
    }
    case "fonte": {
      r.mosse.push({ tipo: "sparisci", inizio: s, durata: DURATE.sparisci });
      if (r.qui) r.scintille.push({ x: r.qui.x, y: r.qui.y - ALTEZZA * FERMA * 0.5, inizio: s + 3, raggio: 70 });
      // Spinge la scheda dall'angolo in alto a destra: il corpo resta sopra la
      // scheda (sopra il testo), il braccio sinistro teso contro il bordo e i
      // piedi sul margine bianco in cima.
      const a = { x: destra - LARGHEZZA * 0.17, y: alto + 50 };
      const da = { x: a.x + TEMPI_SCHEDE.fonteCorsa, y: a.y };
      r.mosse.push({ tipo: "spingi", inizio: s + TEMPI_SCHEDE.fonteSpinge, durata: TEMPI_SCHEDE.fonteDurata, da, a });
      r.qui = a;
      // Poi un saltello sul bordo in alto della scheda e fa sì con la testa.
      const sopra = { x: destra - LARGHEZZA * 0.6, y: alto + 14 };
      const t = s + TEMPI_SCHEDE.fonteSpinge + TEMPI_SCHEDE.fonteDurata + 4;
      vai(r, sopra, t, 14, 60);
      r.mosse.push({ tipo: "annuisci", inizio: t + 16, durata: DURATE.annuisci });
      // Poi passeggia sul bordo della scheda e alla fine fa festa (sull'ultima frase).
      const fineScena = g.fine;
      const passeggia = t + 16 + DURATE.annuisci + 10;
      const piu = { x: sopra.x - 150, y: sopra.y };
      if (passeggia + DURATE.cammina < fineScena - 40) {
        r.mosse.push({ tipo: "cammina", inizio: passeggia, durata: DURATE.cammina, a: piu });
        r.qui = piu;
      }
      const ultima = tempi.battute.filter((b) => b.inizio * FPS >= s - 1 && b.inizio * FPS < fineScena).at(-1);
      const festa = Math.max(
        passeggia + DURATE.cammina + 4,
        ultima && ultima.inizio * FPS > s + 1 ? Math.round(ultima.inizio * FPS) : fineScena - 60,
      );
      if (fineScena - 4 - festa >= 30) r.mosse.push({ tipo: "festeggia", inizio: festa, durata: fineScena - 4 - festa });
      break;
    }
  }
}

const limita = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const mescola = (a: number, b: number, t: number) => a + (b - a) * t;
const dolce = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const frena = (t: number) => 1 - (1 - t) ** 3;
/** Molla smorzata dopo un colpo: parte da 1, oscilla e si ferma. */
const molla = (t: number, durata = 4.5, frequenza = 0.8) => (t >= 0 && t < 24 ? Math.exp(-t / durata) * Math.cos(t * frequenza) : 0);

/** Le braccia alzate per appendersi al rullo del titolo. */
const POSE_TIRA = { braccioDx: -20, braccioSx: 45, spallaSx: 55 } as const;

/**
 * Dove sta la bussolina e com'è al fotogramma `f`; null se non è (ancora) in
 * scena. Quando fa qualcosa (o tiene il cartellino) è grande, quando aspetta
 * si rimpicciolisce un po'.
 */
export function posa(piano: Piano, f: number): Posa | null {
  const p = posaBase(piano, f);
  if (!p) return null;
  const tiene = piano.cartellini.find((c) => f >= c.inizio && f < Math.min(c.fine, piano.fine));
  const ferma = !piano.mosse.some((m) => f >= m.inizio && f < m.inizio + m.durata);
  // Con il cartellino: il braccio destro lo tiene su e lo scuote un po', l'altro sul fianco.
  const cartellino =
    tiene && ferma
      ? { braccioDx: -6 + Math.sin(f / 2.2) * 6 * Math.max(0.3, 1 - (f - tiene.inizio) / 30), braccioSx: -30, bocca: "aperta" as const }
      : {};
  let specchio = false;
  for (const m of piano.mosse) {
    if (f < m.inizio) break;
    if ("specchio" in m && m.specchio !== undefined) specchio = m.specchio;
  }
  return { ...p, ...cartellino, scala: p.scala * taglia(piano, f), specchio };
}

/** Da FERMA a 1: cresce poco prima di ogni mossa e torna piccola poco dopo. */
function taglia(piano: Piano, f: number): number {
  const finestra = (inizio: number, fine: number) =>
    dolce(limita((f - (inizio - 8)) / 8)) * dolce(limita((fine + 12 - f) / 12));
  let attiva = 0;
  for (const m of piano.mosse) attiva = Math.max(attiva, finestra(m.inizio, m.inizio + m.durata));
  for (const c of piano.cartellini) attiva = Math.max(attiva, finestra(c.inizio, Math.min(c.fine, piano.fine)));
  return FERMA + (1 - FERMA) * attiva;
}

function posaBase(piano: Piano, f: number): Posa | null {
  const prima = piano.mosse[0];
  if (!prima || f < prima.inizio) return null;
  let qui: Punto = PARTENZA;
  let finita = prima.inizio;
  let atterrata = -Infinity;
  let sparita = false;
  for (const m of piano.mosse) {
    if (f < m.inizio) break;
    const u = limita((f - m.inizio) / m.durata);
    if (f < m.inizio + m.durata) return posaInMossa(m, qui, u, f);
    // Mossa finita: la bussolina resta dove l'ha lasciata.
    if ("a" in m) qui = m.a;
    if (m.tipo === "salta" || m.tipo === "entra" || m.tipo === "spingi" || m.tipo === "vola") atterrata = m.inizio + m.durata;
    sparita = m.tipo === "sparisci";
    finita = m.inizio + m.durata;
  }
  if (sparita) return null;
  // Fra una mossa e l'altra: galleggia piano (su e giù, un po' inclinata).
  const calma = limita((f - finita) / 14);
  const atterra = molla(f - atterrata);
  return {
    ...riposo(f, calma),
    x: qui.x,
    y: qui.y + Math.sin(f / 9) * 7 * calma - 4 * calma,
    rotazione: Math.sin(f / 14) * 3 * calma,
    sx: 1 + 0.17 * atterra,
    sy: 1 - 0.17 * atterra,
    gambe: 1 - 0.12 * Math.max(0, atterra),
    scala: 1,
    ago: agoCalmo(f),
  };
}

/** L'ago oscilla sempre un poco, come una vera bussola. */
function agoCalmo(f: number): number {
  return Math.sin(f / 6) * 5 + Math.sin(f / 2.7) * 2;
}

/**
 * Sbatte gli occhi ogni 2–4 secondi, mai a ritmo fisso: 1 aperti, ~0 chiusi.
 * (Gli intervalli vengono da una sequenza fissa, così ogni render è uguale.)
 */
export function palpebre(f: number): number {
  let t = 25;
  for (let k = 1; t <= f + 8; k++) {
    const d = f - t;
    if (d >= 0 && d < 7) return 1 - 0.92 * Math.sin((d / 7) * Math.PI);
    t += 60 + ((k * 37) % 61);
  }
  return 1;
}

/** Il corpo quando aspetta: braccia che dondolano sfasate, sguardo che gira, occhi che sbattono. */
function riposo(f: number, calma = 1): Corpo {
  return {
    braccioDx: Math.sin(f / 11) * 8 * calma,
    braccioSx: Math.sin(f / 13 + 1.3) * 7 * calma,
    spallaSx: 0,
    gambaSx: Math.sin(f / 17) * 2 * calma,
    gambaDx: Math.sin(f / 17 + 2) * 2 * calma,
    gambe: 1,
    occhi: palpebre(f),
    felice: false,
    // Si guarda intorno: le pupille vanno da una parte all'altra, piano.
    sguardo: (Math.sin(f / 41) * 12 + Math.sin(f / 13) * 3) * calma,
    bocca: "sorriso",
  };
}

/** In volo: braccia che sbattono come alucce, gambe che penzolano indietro. */
function volo(f: number, verso: number): Corpo {
  const ali = Math.sin(f * 1.5);
  return {
    braccioDx: -15 + ali * 30,
    braccioSx: 40 - ali * 30,
    spallaSx: 30,
    gambaSx: limita(verso, -1, 1) * 16 + Math.sin(f * 0.7) * 7,
    gambaDx: limita(verso, -1, 1) * 16 + Math.sin(f * 0.7 + 1.2) * 7,
    gambe: 1.05,
    occhi: 1,
    felice: false,
    sguardo: limita(verso, -1, 1) * -6,
    bocca: "aperta",
  };
}

function posaInMossa(m: Mossa, da: Punto, u: number, f: number): Posa {
  const base: Posa = { ...riposo(f), x: da.x, y: da.y, rotazione: 0, sx: 1, sy: 1, scala: 1, ago: agoCalmo(f) };
  const arco = Math.sin(Math.PI * u);
  const t = u * m.durata;
  switch (m.tipo) {
    case "gira":
      return base;
    case "entra": {
      // Arriva in volo da in alto a destra lungo una curva, sbattendo le braccia.
      const e = frena(u);
      const c = { x: m.a.x + 320, y: m.a.y - 560 };
      const x = (1 - e) ** 2 * PARTENZA.x + 2 * (1 - e) * e * c.x + e * e * m.a.x;
      const y = (1 - e) ** 2 * PARTENZA.y + 2 * (1 - e) * e * c.y + e * e * m.a.y;
      return {
        ...base,
        ...volo(f, -1),
        x,
        y,
        rotazione: -30 * (1 - e),
        sx: 1 - 0.1 * arco,
        sy: 1 + 0.14 * arco,
        scala: 0.7 + 0.3 * e,
      };
    }
    case "salta": {
      const e = dolce(u);
      const x = mescola(da.x, m.a.x, e);
      const y = mescola(da.y, m.a.y, e) - m.altezza * 4 * u * (1 - u);
      const verso = limita((m.a.x - da.x) / 25, -10, 10);
      // Si schiaccia per partire (gambe piegate), si allunga in aria (gambe raccolte), braccia su.
      const carica = u < 0.18 ? Math.sin((u / 0.18) * Math.PI) : 0;
      return {
        ...base,
        ...volo(f, verso / 10),
        braccioDx: -25 + Math.sin(f * 1.5) * 18 * arco,
        braccioSx: 45 - Math.sin(f * 1.5) * 16 * arco,
        spallaSx: 35 * arco,
        gambe: 1 - 0.18 * arco + 0.08 * carica,
        gambaSx: verso * 1.6 * arco + 10 * arco,
        gambaDx: verso * 1.6 * arco - 10 * arco,
        x,
        y,
        rotazione: verso * arco,
        sx: 1 + 0.12 * carica - 0.08 * arco,
        sy: 1 - 0.14 * carica + 0.12 * arco,
      };
    }
    case "vola": {
      const e = dolce(u);
      const x = (1 - e) ** 2 * da.x + 2 * (1 - e) * e * m.controllo.x + e * e * m.a.x;
      const y = (1 - e) ** 2 * da.y + 2 * (1 - e) * e * m.controllo.y + e * e * m.a.y;
      // Inclinata nel verso del volo, allungata in aria.
      const dx = 2 * (1 - e) * (m.controllo.x - da.x) + 2 * e * (m.a.x - m.controllo.x);
      return {
        ...base,
        ...volo(f, dx / 300),
        x,
        y,
        rotazione: limita(dx / 60, -18, 18) * arco,
        sx: 1 - 0.08 * arco,
        sy: 1 + 0.12 * arco,
      };
    }
    case "tira": {
      // Appesa al rullo con le braccia in alto: due strattoni verso il basso,
      // il corpo che si piega all'indietro e le gambe che puntano.
      const e = dolce(u);
      const strappo = Math.sin(u * Math.PI * 2) ** 2;
      return {
        ...base,
        braccioDx: POSE_TIRA.braccioDx + 14 * strappo,
        braccioSx: POSE_TIRA.braccioSx - 22 * strappo,
        spallaSx: POSE_TIRA.spallaSx,
        gambaSx: 14 + 8 * strappo,
        gambaDx: -14 - 8 * strappo,
        gambe: 1.04,
        occhi: 1 - 0.45 * strappo,
        bocca: strappo > 0.3 ? "oh" : "aperta",
        x: mescola(da.x, m.a.x, e) + Math.sin(u * Math.PI * 3) * 3,
        y: mescola(da.y, m.a.y, e) + 8 * strappo,
        rotazione: -7 * strappo,
        sx: 1 - 0.05 * arco + 0.04 * strappo,
        sy: 1 + 0.07 * arco - 0.05 * strappo,
      };
    }
    case "tocca": {
      // Si piega in avanti, carica il braccio e colpisce il numero; poi sorride.
      const carica = u < 0.25 ? Math.sin((u / 0.25) * (Math.PI / 2)) : 0;
      const colpo = u < 0.25 ? 0 : u < 0.4 ? dolce((u - 0.25) / 0.15) : 1 - dolce(limita((u - 0.7) / 0.3));
      const rimbalzo = u > 0.4 ? molla(t - 0.4 * m.durata, 2.5, 1.4) : 0;
      return {
        ...base,
        braccioDx: -25 * carica + (ANGOLO_TOCCO + 6 * rimbalzo) * colpo,
        braccioSx: -15 * colpo,
        gambaSx: 6 * colpo,
        gambaDx: -4 * colpo,
        bocca: "aperta",
        felice: u > 0.45 && u < 0.85,
        rotazione: 6 * colpo - 4 * carica,
        sx: 1 + 0.06 * colpo,
        sy: 1 - 0.06 * colpo,
      };
    }
    case "lancia": {
      // Carica il braccio all'indietro (schiacciata), poi lo lancia avanti verso la scheda.
      const carica = u < 0.3 ? Math.sin((u / 0.3) * (Math.PI / 2)) : Math.max(0, 1 - (u - 0.3) / 0.15);
      const slancio = u < 0.3 ? 0 : Math.sin(limita((u - 0.3) / 0.7) * Math.PI);
      return {
        ...base,
        braccioDx: -40 * carica + 75 * slancio,
        braccioSx: 20 * carica - 10 * slancio,
        gambaSx: 8 * slancio,
        gambaDx: -8 * slancio,
        gambe: 1 - 0.1 * carica,
        bocca: slancio > 0.2 ? "aperta" : "sorriso",
        y: da.y - 22 * slancio,
        rotazione: 10 * slancio - 6 * carica,
        sx: 1 + 0.14 * carica - 0.08 * slancio,
        sy: 1 - 0.16 * carica + 0.12 * slancio,
      };
    }
    case "scuoti": {
      // Spavento: occhi sgranati, bocca a «oh», braccia in alto, trema tutta;
      // l'ago fa tre giri (dietro la cassa quando punta in basso) e si ferma con un rimbalzo.
      const smorza = 1 - u * u;
      const giri = 1080 * frena(limita(u / 0.7));
      const assesta = u > 0.7 ? 22 * molla((u - 0.7) * m.durata, 3, 1.1) : 0;
      return {
        ...base,
        braccioDx: -28 + Math.sin(t * 2.6) * 12 * smorza,
        braccioSx: 48 + Math.sin(t * 2.6 + 1) * 14 * smorza,
        spallaSx: 50,
        gambaSx: Math.sin(t * 3) * 8 * smorza + 6,
        gambaDx: Math.sin(t * 3 + 1.5) * 8 * smorza - 6,
        occhi: 1.25,
        sguardo: Math.sin(t * 1.3) * 5 * smorza,
        bocca: "oh",
        x: da.x + Math.sin(t * 2.2) * 12 * smorza,
        y: da.y - Math.abs(Math.sin(t * 1.1)) * 10 * smorza,
        rotazione: Math.sin(t * 1.7) * 14 * smorza,
        sx: 1 + Math.sin(t * 2.2) * 0.07 * smorza,
        sy: 1 - Math.sin(t * 2.2) * 0.07 * smorza,
        ago: giri + assesta + agoCalmo(f) * (1 - smorza),
      };
    }
    case "sparisci": {
      const e = u * u;
      return {
        ...base,
        braccioDx: -30 * u,
        braccioSx: 50 * u,
        spallaSx: 40 * u,
        occhi: 0.1,
        bocca: "oh",
        rotazione: 120 * e,
        scala: Math.max(0.001, 1 - e),
        sx: 1 + 0.15 * arco,
        sy: 1 - 0.15 * arco,
      };
    }
    case "spingi": {
      // Cammina spingendo il bordo destro della scheda: piegata in avanti, il
      // braccio sinistro teso contro la scheda, gambe alternate e un saltello per passo.
      const e = frena(u);
      const passo = Math.sin((t / 5) * Math.PI);
      return {
        ...base,
        braccioDx: -40 + passo * 6,
        braccioSx: 42 + passo * 4,
        gambaSx: 20 * passo,
        gambaDx: -20 * passo,
        gambe: 1 - 0.06 * Math.abs(passo),
        occhi: 0.75,
        bocca: "oh",
        x: mescola(m.da.x, m.a.x, e),
        y: m.a.y - Math.abs(passo) * 7,
        rotazione: -13 * (1 - u * 0.5),
        sx: 1.05 - 0.04 * u,
        sy: 0.95 + 0.04 * u,
        scala: limita(u * 5, 0.001, 1),
      };
    }
    case "cammina": {
      // Due passi e mezzo: gambe alternate, braccia che dondolano al contrario, un saltello per passo.
      const e = dolce(u);
      const passo = Math.sin((t / 6) * Math.PI);
      const verso = Math.sign(m.a.x - da.x) || 1;
      return {
        ...base,
        braccioDx: -passo * 18,
        braccioSx: passo * 18,
        gambaSx: 18 * passo,
        gambaDx: -18 * passo,
        sguardo: verso * 6,
        bocca: "aperta",
        x: mescola(da.x, m.a.x, e),
        y: mescola(da.y, m.a.y, e) - Math.abs(passo) * 9,
        rotazione: verso * 6 + passo * 3,
        sx: 1 - 0.03 * Math.abs(passo),
        sy: 1 + 0.03 * Math.abs(passo),
      };
    }
    case "annuisci": {
      // Due piccoli sì a occhi chiusi, contenta.
      const s = Math.sin(u * Math.PI * 2) ** 2;
      return {
        ...base,
        braccioDx: 18 * s,
        braccioSx: -12 * s,
        felice: true,
        bocca: "aperta",
        y: da.y,
        sx: 1 + 0.07 * s,
        sy: 1 - 0.1 * s,
        rotazione: 5 * s,
      };
    }
    case "festeggia": {
      // Saltelli con le braccia in alto e le gambe che scalciano; schiacciata quando atterra.
      const n = Math.max(2, Math.min(3, Math.round(m.durata / 18)));
      const periodo = m.durata / n;
      const v = (t % periodo) / periodo;
      const su = Math.sin(Math.PI * v);
      const terra = Math.max(0, 1 - Math.min(v, 1 - v) * 5);
      return {
        ...base,
        braccioDx: -30 + Math.sin(t * 0.9) * 14,
        braccioSx: 50 - Math.sin(t * 0.9) * 16,
        spallaSx: 55,
        gambaSx: 22 * Math.sin(v * Math.PI * 2),
        gambaDx: -22 * Math.sin(v * Math.PI * 2),
        gambe: 1 - 0.15 * su,
        felice: su > 0.3,
        bocca: "aperta",
        y: da.y - 46 * su,
        rotazione: Math.sin(t / periodo * Math.PI) * 6,
        sx: 1 + 0.1 * terra - 0.06 * su,
        sy: 1 - 0.12 * terra + 0.1 * su,
      };
    }
  }
}

/** Quanto è srotolata la scheda del titolo (da 0 a 1), dall'inizio del gruppo. */
export function srotolato(locale: number): number {
  return dolce(limita((locale - TEMPI_SCHEDE.titoloTira) / TEMPI_SCHEDE.titoloDurata));
}

/** Quanto è entrata la scheda della fonte (da 0 a 1), dall'inizio del gruppo: la stessa curva della bussolina che spinge. */
export function spinta(locale: number): number {
  return frena(limita((locale - TEMPI_SCHEDE.fonteSpinge) / TEMPI_SCHEDE.fonteDurata));
}

export const DIMENSIONI_BUSSOLINA = { altezza: ALTEZZA, larghezza: LARGHEZZA };
