import { useColorScheme } from "react-native";

/** Gli stessi colori del sito (src/app/globals.css), chiari e scuri. */
export const COLORI = {
  chiaro: {
    sfondo: "#fbfaf7",
    testo: "#1c1f24",
    attenuato: "#5d6470",
    scheda: "#ffffff",
    bordo: "#e4e1da",
    marchio: "#0f5e6b",
    marchioForte: "#0b4954",
    marchioTenue: "#e3f0f1",
    sulMarchio: "#ffffff",
    accento: "#9c5c1c",
    pericolo: "#b42318",
    successo: "#1d7a46",
  },
  scuro: {
    sfondo: "#111417",
    testo: "#eceae5",
    attenuato: "#a3a9b3",
    scheda: "#181c20",
    bordo: "#2b3036",
    marchio: "#5fb4c0",
    marchioForte: "#86cbd4",
    marchioTenue: "#16343a",
    sulMarchio: "#111417",
    accento: "#f0a35a",
    pericolo: "#f97066",
    successo: "#4cc382",
  },
} as const;

export type Colori = { [K in keyof typeof COLORI.chiaro]: string };

export function useColori(): Colori {
  return useColorScheme() === "dark" ? COLORI.scuro : COLORI.chiaro;
}

export const SPAZIO = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const RAGGIO = { s: 8, m: 12, l: 16, pillola: 999 } as const;
