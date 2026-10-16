/**
 * I caratteri del sito: Plus Jakarta Sans per i titoli, Geist per il testo.
 * Gli indirizzi dei file vengono da @remotion/google-fonts; scripts/prepara.ts
 * li scarica in public/fonts/, così il render non dipende dalla rete.
 */
import { getInfo as infoGeist } from "@remotion/google-fonts/Geist";
import { getInfo as infoJakarta } from "@remotion/google-fonts/PlusJakartaSans";

/** Il sottoinsieme latin copre l'italiano (à è é ì ò ù « » ·). */
const SOTTOINSIEME = "latin";

const FAMIGLIE = [
  { info: infoJakarta(), pesi: ["700", "800"] },
  { info: infoGeist(), pesi: ["400", "500", "600", "700"] },
] as const;

export type FileCarattere = { famiglia: string; peso: string; url: string; file: string; unicodeRange: string };

export function fileCaratteri(): FileCarattere[] {
  return FAMIGLIE.flatMap(({ info, pesi }) =>
    pesi.map((peso) => {
      const url = (info.fonts.normal as Record<string, Record<string, string>>)[peso][SOTTOINSIEME];
      return {
        famiglia: info.fontFamily,
        peso,
        url,
        file: `fonts/${url.split("/").slice(-3).join("-")}`,
        unicodeRange: (info.unicodeRanges as Record<string, string>)[SOTTOINSIEME],
      };
    }),
  );
}

export const FAMIGLIA_TITOLI = infoJakarta().fontFamily;
export const FAMIGLIA_TESTO = infoGeist().fontFamily;
