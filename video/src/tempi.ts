/**
 * Tempi della lezione: quando inizia ogni scena e quando cambia ogni
 * sottotitolo. Logica pura, usata dal video (Remotion) e da scripts/render.ts
 * per scrivere i sottotitoli WebVTT con gli stessi tempi.
 */
import type { Durate, Lezione } from "./lezioni/tipi";

export const FPS = 30;
export const LATO = 1080;
/** Secondi prima della prima frase, per far entrare il titolo. */
export const ATTESA_INIZIALE = 0.3;
/** Secondi di silenzio dopo ogni frase. */
export const PAUSA = 0.35;
/** Secondi della scheda finale «Prossimo passo». */
export const DURATA_FINE = 2;
/** Oltre questa lunghezza una frase si divide in due sottotitoli. */
export const MAX_CARATTERI = 80;

export type TempoScena = {
  /** Primo frame della scena. */
  inizio: number;
  /** Frame della scena, pausa compresa. */
  durata: number;
  /** Frame in cui Bleo parla (dall'inizio della scena). */
  voce: number;
};

/** Un sottotitolo, con i tempi in secondi dall'inizio del video. */
export type Battuta = { inizio: number; fine: number; testo: string };

export type Tempi = {
  scene: TempoScena[];
  /** Primo frame della scheda finale. */
  inizioFine: number;
  /** Frame totali del video. */
  totale: number;
  battute: Battuta[];
};

export function calcolaTempi(lezione: Lezione, durate: Durate): Tempi {
  if (durate.scene.length !== lezione.scene.length) {
    throw new Error(
      `La lezione ${lezione.id} ha ${lezione.scene.length} scene ma le durate sono ${durate.scene.length}: rilancia npm run prepara.`,
    );
  }
  const scene: TempoScena[] = [];
  const battute: Battuta[] = [];
  let frame = Math.round(ATTESA_INIZIALE * FPS);
  lezione.scene.forEach((scena, i) => {
    const misura = durate.scene[i];
    if (misura.audio !== scena.audio) {
      throw new Error(`Scena ${i + 1}: atteso ${scena.audio}, misurato ${misura.audio}. Rilancia npm run prepara.`);
    }
    const durata = Math.ceil((misura.durata + PAUSA) * FPS);
    scene.push({ inizio: frame, durata, voce: Math.ceil(misura.durata * FPS) });
    const inizioS = frame / FPS;
    const fineS = (frame + durata) / FPS;
    const parti = dividiFrasi(scena.testo);
    const cambi = tempiCambi(parti, misura.durata, misura.pause);
    parti.forEach((testo, j) => {
      battute.push({
        inizio: j === 0 ? inizioS : inizioS + cambi[j - 1],
        fine: j === parti.length - 1 ? fineS : inizioS + cambi[j],
        testo,
      });
    });
    frame += durata;
  });
  const fine = Math.round(DURATA_FINE * FPS);
  return { scene, inizioFine: frame, totale: frame + fine, battute };
}

/** Divide un testo in frasi; quelle troppo lunghe alla virgola (o ai due punti) più vicina al centro. */
export function dividiFrasi(testo: string, max = MAX_CARATTERI): string[] {
  const frasi = testo
    .split(/(?<=[.!?…])\s+/)
    .map((f) => f.trim())
    .filter(Boolean);
  return frasi.flatMap((f) => dividiLunga(f, max));
}

function dividiLunga(frase: string, max: number): string[] {
  if (frase.length <= max) return [frase];
  const meta = frase.length / 2;
  let migliore = -1;
  for (const m of frase.matchAll(/[,:;]\s/g)) {
    const pos = (m.index ?? 0) + 1;
    if (migliore === -1 || Math.abs(pos - meta) < Math.abs(migliore - meta)) migliore = pos;
  }
  if (migliore === -1) return [frase];
  return [...dividiLunga(frase.slice(0, migliore).trim(), max), ...dividiLunga(frase.slice(migliore).trim(), max)];
}

/**
 * I secondi (dall'inizio della frase audio) in cui passare da una parte alla
 * successiva. Stima in proporzione ai caratteri, poi si aggancia alla pausa
 * della voce più vicina, se ce n'è una a meno di 0,8 s.
 */
export function tempiCambi(parti: readonly string[], durata: number, pause: Durate["scene"][number]["pause"]): number[] {
  const totale = parti.reduce((s, p) => s + p.length, 0);
  // Solo le pause in mezzo alla frase, non il silenzio iniziale o finale.
  const interne = pause.filter(([a, b]) => a > 0.05 && b < durata - 0.05);
  const usate = new Set<number>();
  const cambi: number[] = [];
  let caratteri = 0;
  let precedente = 0;
  for (let j = 0; j < parti.length - 1; j++) {
    caratteri += parti[j].length;
    const stima = (durata * caratteri) / totale;
    let scelto = stima;
    let distanza = 0.8;
    let pausaScelta = -1;
    interne.forEach(([a, b], k) => {
      const centro = (a + b) / 2;
      const d = Math.abs(centro - stima);
      if (!usate.has(k) && d < distanza && centro > precedente) {
        distanza = d;
        scelto = centro;
        pausaScelta = k;
      }
    });
    if (pausaScelta !== -1) usate.add(pausaScelta);
    precedente = Math.max(scelto, precedente + 0.2);
    cambi.push(precedente);
  }
  return cambi;
}

/** Sottotitoli WebVTT (tempi hh:mm:ss.mmm). */
export function formattaVtt(battute: readonly Battuta[]): string {
  const ora = (s: number) => {
    const ms = Math.round(s * 1000);
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const sec = Math.floor((ms % 60_000) / 1000);
    const resto = ms % 1000;
    const due = (n: number) => String(n).padStart(2, "0");
    return `${due(h)}:${due(m)}:${due(sec)}.${String(resto).padStart(3, "0")}`;
  };
  const blocchi = battute.map((b, i) => `${i + 1}\n${ora(b.inizio)} --> ${ora(b.fine)}\n${b.testo}`);
  return `WEBVTT\n\n${blocchi.join("\n\n")}\n`;
}
