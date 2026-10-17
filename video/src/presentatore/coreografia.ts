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

export type Punto = { x: number; y: number };

/** Misure di una scheda, prese dal browser: altezza e centro dei numeri dell'elenco (dall'angolo in alto a sinistra). */
export type Misura = { altezza: number; punti: Punto[] };

/** Un gruppo di scene con la stessa scheda (vedi gruppiSchede in componenti/Schede.tsx). */
export type GruppoScene = { chiave: string; scene: number[]; inizio: number; fine: number };

type Mossa =
  | { tipo: "entra"; inizio: number; durata: number; a: Punto }
  | { tipo: "salta"; inizio: number; durata: number; a: Punto; altezza: number }
  | { tipo: "tira"; inizio: number; durata: number; a: Punto }
  /** Volo lungo una curva che passa vicino a `controllo` (per girare attorno alle schede). */
  | { tipo: "vola"; inizio: number; durata: number; a: Punto; controllo: Punto }
  | { tipo: "tocca"; inizio: number; durata: number }
  | { tipo: "lancia"; inizio: number; durata: number }
  | { tipo: "scuoti"; inizio: number; durata: number }
  | { tipo: "sparisci"; inizio: number; durata: number }
  | { tipo: "spingi"; inizio: number; durata: number; da: Punto; a: Punto }
  | { tipo: "annuisci"; inizio: number; durata: number };

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

export type Posa = {
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
const DURATE = { salto: 12, tocco: 14, lancio: 18, scossa: 32, allerta: 72, annuisci: 22, sparisci: 6 } as const;

const { colonna, bussolina } = PRESENTATORE;
/** Altezza quando fa qualcosa; ferma è un po' più piccola (`bussolina.ferma`). */
const ALTEZZA = bussolina.altezza;
const FERMA = bussolina.ferma / bussolina.altezza;
const LARGHEZZA = ALTEZZA * bussolina.rapporto;
const RIPOSO: Punto = bussolina.riposo;
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

export function creaPiano(
  scene: readonly Scena[],
  tempi: Tempi,
  gruppi: readonly GruppoScene[],
  misure: Readonly<Record<string, Misura>>,
): Piano {
  const mosse: Mossa[] = [];
  const cartellini: Piano["cartellini"] = [];
  const allerte: Piano["allerte"] = [];
  const scintille: Scintilla[] = [];
  let qui: Punto | null = null;

  const vai = (a: Punto, inizio: number, durata: number = DURATE.salto, altezza = 90) => {
    if (qui === null) {
      mosse.push({ tipo: "entra", inizio, durata, a });
    } else if (Math.hypot(a.x - qui.x, a.y - qui.y) > 4) {
      mosse.push({ tipo: "salta", inizio, durata, a, altezza });
    }
    qui = a;
  };
  const aRiposo = () => qui !== null && qui.x === RIPOSO.x && qui.y === RIPOSO.y;

  gruppi.forEach((g) => {
    const s = g.inizio;
    const misura = misure[g.chiave];
    const schermo = scene[g.scene[0]].schermo;
    const alto = altoScheda(misura, schermo.tipo);
    const basso = fondoScheda(schermo.tipo);
    const destra = colonna.x + colonna.larghezza;
    switch (schermo.tipo) {
      case "titolo": {
        // Prende il rullo con le mani (a 2/3 dell'altezza) e lo tira giù.
        const x = destra - LARGHEZZA * 0.42;
        const mani = ALTEZZA * 0.36;
        vai({ x, y: alto + mani }, s, TEMPI_SCHEDE.titoloTira);
        const giu = { x, y: basso + mani };
        mosse.push({ tipo: "tira", inizio: s + TEMPI_SCHEDE.titoloTira, durata: TEMPI_SCHEDE.titoloDurata, a: giu });
        qui = giu;
        // Torna al suo posto girando fuori a destra e sopra la scheda, così non copre il titolo.
        mosse.push({
          tipo: "vola",
          inizio: s + TEMPI_SCHEDE.titoloTira + TEMPI_SCHEDE.titoloDurata + 6,
          durata: 22,
          a: RIPOSO,
          controllo: { x: 1500, y: 40 },
        });
        qui = RIPOSO;
        break;
      }
      case "elenco": {
        // Il «lancio» (si allunga dopo 4 fotogrammi) coincide con l'entrata della scheda.
        if (aRiposo()) mosse.push({ tipo: "lancia", inizio: s + TEMPI_SCHEDE.elencoEntra - 5, durata: DURATE.lancio });
        else vai(RIPOSO, s);
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
            cartellini.push({ inizio: ultima, fine: Infinity, testo: String(sc.punti.length) });
          }
          for (let k = visibili; k < sc.visibili; k++) {
            const passo = (k - visibili) * 30;
            const centro = misura?.punti[k] ?? { x: 56, y: 120 + 80 * k };
            // La mano alzata (a destra dell'immagine) tocca il bordo del numero.
            const piedi = { x: colonna.x + centro.x - 26 - LARGHEZZA * 0.47 + 6, y: alto + centro.y + ALTEZZA * 0.49 };
            vai(piedi, t + passo, TEMPI_SCHEDE.puntoSalto, 60);
            mosse.push({ tipo: "tocca", inizio: t + passo + TEMPI_SCHEDE.puntoSalto, durata: DURATE.tocco });
            scintille.push({ x: colonna.x + centro.x, y: alto + centro.y, inizio: t + passo + TEMPI_SCHEDE.puntoTocco, raggio: 92 });
            const c = cartellini.at(-1);
            if (c && c.fine === Infinity) c.fine = t + passo + 2;
          }
          visibili = Math.max(visibili, sc.visibili);
        });
        break;
      }
      case "attenzione": {
        // Se deve prima tornare al suo posto, trema appena arrivata.
        const t = aRiposo() ? s + 2 : s + DURATE.salto;
        vai(RIPOSO, s, DURATE.salto, 110);
        mosse.push({ tipo: "scuoti", inizio: t, durata: DURATE.scossa });
        allerte.push({ inizio: t + 1, fine: t + DURATE.allerta });
        break;
      }
      case "punto": {
        if (!aRiposo()) vai(RIPOSO, s);
        mosse.push({ tipo: "lancia", inizio: s + TEMPI_SCHEDE.puntoEntra - 5, durata: DURATE.lancio });
        scintille.push({ x: colonna.x + 6, y: alto + 6, inizio: s + TEMPI_SCHEDE.puntoEntra + 5, raggio: 80 });
        break;
      }
      case "fonte": {
        mosse.push({ tipo: "sparisci", inizio: s, durata: DURATE.sparisci });
        if (qui) scintille.push({ x: qui.x, y: qui.y - ALTEZZA * FERMA * 0.5, inizio: s + 3, raggio: 70 });
        // Spinge la scheda dall'angolo in basso a destra, davanti alla scheda
        // (così si vede tutta mentre spinge); poi si sposta sull'angolo in alto.
        const piedi = Math.min(basso + ALTEZZA * 0.12, PRESENTATORE.sottotitoli.cima - 6);
        const a = { x: destra - LARGHEZZA * 0.4, y: piedi };
        const da = { x: a.x + TEMPI_SCHEDE.fonteCorsa, y: piedi };
        mosse.push({ tipo: "spingi", inizio: s + TEMPI_SCHEDE.fonteSpinge, durata: TEMPI_SCHEDE.fonteDurata, da, a });
        qui = a;
        // Poi salta sull'angolo in alto a destra della scheda e fa sì con la testa.
        const sopra = { x: destra - LARGHEZZA * 0.6, y: alto + 14 };
        const t = s + TEMPI_SCHEDE.fonteSpinge + TEMPI_SCHEDE.fonteDurata + 4;
        // Esce un attimo a destra e torna sopra la scheda, senza passare sul testo.
        mosse.push({ tipo: "vola", inizio: t, durata: 20, a: sopra, controllo: { x: 1400, y: alto + (basso - alto) * 0.5 } });
        qui = sopra;
        mosse.push({ tipo: "annuisci", inizio: t + 22, durata: DURATE.annuisci });
        break;
      }
    }
  });
  return { mosse, cartellini, allerte, scintille, fine: tempi.inizioFine };
}

const limita = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const mescola = (a: number, b: number, t: number) => a + (b - a) * t;
const dolce = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const frena = (t: number) => 1 - (1 - t) ** 3;

/**
 * Dove sta la bussolina e com'è al fotogramma `f`; null se non è (ancora) in
 * scena. Quando fa qualcosa (o tiene il cartellino) è grande, quando aspetta
 * si rimpicciolisce un po'.
 */
export function posa(piano: Piano, f: number): Posa | null {
  const p = posaBase(piano, f);
  return p && { ...p, scala: p.scala * taglia(piano, f) };
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
  const t = f - atterrata;
  const molla = t >= 0 && t < 20 ? Math.exp(-t / 4.5) * Math.cos(t * 0.8) : 0;
  return {
    x: qui.x,
    y: qui.y + Math.sin(f / 9) * 7 * calma - 4 * calma,
    rotazione: Math.sin(f / 14) * 3 * calma,
    sx: 1 + 0.17 * molla,
    sy: 1 - 0.17 * molla,
    scala: 1,
    ago: agoCalmo(f),
  };
}

/** L'ago oscilla sempre un poco, come una vera bussola. */
function agoCalmo(f: number): number {
  return Math.sin(f / 6) * 5 + Math.sin(f / 2.7) * 2;
}

function posaInMossa(m: Mossa, da: Punto, u: number, f: number): Posa {
  const base: Posa = { x: da.x, y: da.y, rotazione: 0, sx: 1, sy: 1, scala: 1, ago: agoCalmo(f) };
  const arco = Math.sin(Math.PI * u);
  switch (m.tipo) {
    case "entra": {
      // Arriva in volo da in alto a destra lungo una curva, girando su sé stessa.
      const e = frena(u);
      const c = { x: m.a.x + 320, y: m.a.y - 560 };
      const x = (1 - e) ** 2 * PARTENZA.x + 2 * (1 - e) * e * c.x + e * e * m.a.x;
      const y = (1 - e) ** 2 * PARTENZA.y + 2 * (1 - e) * e * c.y + e * e * m.a.y;
      return { ...base, x, y, rotazione: -60 * (1 - e), sx: 1 - 0.1 * arco, sy: 1 + 0.14 * arco, scala: 0.7 + 0.3 * e };
    }
    case "salta": {
      const e = dolce(u);
      const x = mescola(da.x, m.a.x, e);
      const y = mescola(da.y, m.a.y, e) - m.altezza * 4 * u * (1 - u);
      const verso = limita((m.a.x - da.x) / 25, -10, 10);
      // Si schiaccia per partire, si allunga in aria.
      const carica = u < 0.18 ? Math.sin((u / 0.18) * Math.PI) : 0;
      return {
        ...base,
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
      return { ...base, x, y, rotazione: limita(dx / 60, -18, 18) * arco, sx: 1 - 0.08 * arco, sy: 1 + 0.12 * arco };
    }
    case "tira": {
      // Scende tirando il rullo: tesa e un po' allungata.
      const e = dolce(u);
      return {
        ...base,
        x: mescola(da.x, m.a.x, e) + Math.sin(u * Math.PI * 3) * 3,
        y: mescola(da.y, m.a.y, e),
        rotazione: Math.sin(u * Math.PI * 2) * 5,
        sx: 1 - 0.06 * arco,
        sy: 1 + 0.08 * arco,
      };
    }
    case "tocca": {
      // Uno slancio verso il numero e indietro.
      const colpo = Math.sin(Math.PI * Math.min(1, u * 1.6)) * (u < 0.625 ? 1 : 0);
      return { ...base, x: da.x + 24 * colpo, rotazione: 15 * colpo, sx: 1 + 0.1 * colpo, sy: 1 - 0.1 * colpo };
    }
    case "lancia": {
      // Si carica (schiacciata), poi si allunga verso la scheda come per lanciarla.
      const carica = u < 0.3 ? Math.sin((u / 0.3) * (Math.PI / 2)) : Math.max(0, 1 - (u - 0.3) / 0.15);
      const slancio = u < 0.3 ? 0 : Math.sin(limita((u - 0.3) / 0.7) * Math.PI);
      return {
        ...base,
        y: da.y - 22 * slancio,
        rotazione: 10 * slancio - 4 * carica,
        sx: 1 + 0.14 * carica - 0.08 * slancio,
        sy: 1 - 0.16 * carica + 0.12 * slancio,
      };
    }
    case "scuoti": {
      // Trema tutta e l'ago gira veloce (due giri, dietro la cassa quando punta in basso).
      const smorza = 1 - u * u;
      const t = u * m.durata;
      return {
        ...base,
        x: da.x + Math.sin(t * 2.2) * 12 * smorza,
        y: da.y - Math.abs(Math.sin(t * 1.1)) * 10 * smorza,
        rotazione: Math.sin(t * 1.7) * 16 * smorza,
        sx: 1 + Math.sin(t * 2.2) * 0.07 * smorza,
        sy: 1 - Math.sin(t * 2.2) * 0.07 * smorza,
        ago: 1080 * frena(Math.min(1, u * 1.1)) + agoCalmo(f) * (1 - smorza),
      };
    }
    case "sparisci": {
      const e = u * u;
      return { ...base, rotazione: 120 * e, scala: Math.max(0.001, 1 - e), sx: 1 + 0.15 * arco, sy: 1 - 0.15 * arco };
    }
    case "spingi": {
      // Segue il bordo destro della scheda, inclinata in avanti come chi spinge.
      const e = frena(u);
      return {
        ...base,
        x: mescola(m.da.x, m.a.x, e),
        y: m.a.y,
        rotazione: -14 * (1 - u * 0.6),
        sx: 1.07 - 0.05 * u,
        sy: 0.94 + 0.04 * u,
        scala: limita(u * 5, 0.001, 1),
      };
    }
    case "annuisci": {
      // Due piccoli sì: si abbassa e torna su, con un rimbalzo.
      const s = Math.sin(u * Math.PI * 2) ** 2;
      return { ...base, y: da.y, sx: 1 + 0.07 * s, sy: 1 - 0.1 * s, rotazione: 5 * s };
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
