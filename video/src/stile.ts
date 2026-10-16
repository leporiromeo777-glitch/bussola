/** Colori e caratteri del marchio, come nel sito (src/app/globals.css). */
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FAMIGLIA_TESTO, FAMIGLIA_TITOLI, fileCaratteri } from "./caratteri";

export const COLORI = {
  sfondo: "#fbfaf7",
  testo: "#1c1f24",
  tenue: "#5d6470",
  card: "#ffffff",
  bordo: "#e4e1da",
  brand: "#0f5e6b",
  brandForte: "#0b4954",
  brandTenue: "#e3f0f1",
  accento: "#9c5c1c",
  accentoTenue: "#fbf1e6",
  successo: "#1d7a46",
  successoTenue: "#e6f2ea",
  /** Il pesca dello sfondo del video di Bleo, per i bordi della sua scheda. */
  pesca: "#eddac6",
} as const;

/** Sfumatura del marchio: dal verde acqua della bussola al rosso dell'ago. */
export const SFUMATURA = "linear-gradient(100deg, #0f5e6b 0%, #1b6f7d 45%, #b5401a 100%)";

export const OMBRA_SCHEDA = "0 34px 70px -30px rgba(28, 31, 36, 0.28), 0 2px 6px rgba(28, 31, 36, 0.05)";

// Il render aspetta che i caratteri siano caricati (loadFont usa delayRender).
for (const c of fileCaratteri()) {
  void loadFont({ family: c.famiglia, url: staticFile(c.file), weight: c.peso, unicodeRange: c.unicodeRange });
}

export const TITOLI = `"${FAMIGLIA_TITOLI}", sans-serif`;
export const TESTO = `"${FAMIGLIA_TESTO}", sans-serif`;

/** Posizioni nel quadrato 1080×1080. */
export const GRIGLIA = {
  margine: 48,
  clip: { x: 48, y: 124, lato: 600 },
  colonna: { x: 604, larghezza: 428 },
  sottotitoli: { alto: 780 },
} as const;
