/**
 * La voce di Bleo nelle lezioni: ElevenLabs, voce «Alberto Loco» della Voice
 * Library (giovane, sicura), scelta il 17.10.2026 fra le voci maschili
 * italiane giovani. La usa scripts/voce.ts.
 */
import type { Scena } from "./lezioni/tipi";

export const VOCE_BLEO = {
  nome: "Alberto Loco",
  voiceId: "gRvYX74pTqIZPvUtIqog",
  modello: "eleven_multilingual_v2",
  formato: "mp3_44100_128",
  /** Un po' meno stabile e più espressiva del predefinito: suona più giovane. */
  impostazioni: { stability: 0.4, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
} as const;

/**
 * Come la voce deve dire le parole che legge male: si scrive Bleo, si dice
 * «Blìo»; le sigle lettera per lettera (Sagl non è una parola).
 */
const PRONUNCE: readonly [RegExp, string][] = [
  [/\bBleo\b/g, "Blìo"],
  [/\bSagl\b/g, "esse-a-gi-elle"],
  [/\be SA\b/g, "ed esse-a"],
  [/\bSA\b/g, "esse-a"],
  [/\bPMI\b/g, "pi-emme-i"],
];

/**
 * Il testo che legge la voce: `voce` della scena se c'è, se no il sottotitolo,
 * con le pronunce qui sopra. Le cifre la voce le legge male: vanno scritte in
 * parole nel campo `voce` della scena.
 */
export function testoPerVoce(scena: Scena): string {
  const testo = PRONUNCE.reduce((t, [parola, pronuncia]) => t.replace(parola, pronuncia), scena.voce ?? scena.testo);
  if (/\d|CHF/.test(testo)) {
    throw new Error(`Cifre nel testo della voce di ${scena.audio}: scrivile in parole nel campo «voce» della scena.`);
  }
  return testo;
}
