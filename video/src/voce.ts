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
 * Il testo che legge la voce: `voce` della scena se c'è, se no il sottotitolo
 * con «Blìo» al posto di Bleo (si scrive Bleo, si dice «Blìo»), «esse-a» al
 * posto di SA e «pi-emme-i» al posto di PMI. Le cifre la voce le legge male:
 * vanno scritte in parole nel campo `voce` della scena.
 */
export function testoPerVoce(scena: Scena): string {
  const testo =
    scena.voce ??
    scena.testo
      .replace(/\bBleo\b/g, "Blìo")
      .replace(/\be SA\b/g, "ed esse-a")
      .replace(/\bSA\b/g, "esse-a")
      .replace(/\bPMI\b/g, "pi-emme-i");
  if (/\d|CHF/.test(testo)) {
    throw new Error(`Cifre nel testo della voce di ${scena.audio}: scrivile in parole nel campo «voce» della scena.`);
  }
  return testo;
}
