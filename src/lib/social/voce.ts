/**
 * Il testo che Bleo legge nel video del post (video/src/social/Reel.tsx): una
 * frase per scheda, ricavata dalle schede stesse, e la chiusura uguale per
 * tutti. Le voci si generano con lo stesso motore delle lezioni (vedi
 * video/README.md) e stanno in video/sorgenti/social/, con il testo usato in
 * voci.json: se il testo cambia, la voce va rifatta.
 *
 * Per la pronuncia: «Blìo» al posto di Bleo, gli importi in parole
 * («centomila franchi», mai «CHF 100'000», che la voce legge male), le sigle
 * come si dicono («a-vu-esse») e niente parentesi né virgolette.
 */
// Relativo, non «@/»: lo usa anche video/scripts/reel.ts.
import type { PostSocial, SchedaPost } from "../../data/social";

const UNITA = [
  "zero",
  "uno",
  "due",
  "tre",
  "quattro",
  "cinque",
  "sei",
  "sette",
  "otto",
  "nove",
  "dieci",
  "undici",
  "dodici",
  "tredici",
  "quattordici",
  "quindici",
  "sedici",
  "diciassette",
  "diciotto",
  "diciannove",
];
const DECINE = ["", "", "venti", "trenta", "quaranta", "cinquanta", "sessanta", "settanta", "ottanta", "novanta"];

/** Da 0 a 999, in parole (ventuno, ventitré, centottanta). */
function finoAMille(n: number): string {
  const centinaia = Math.floor(n / 100);
  const resto = n % 100;
  let decine: string;
  if (resto < 20) {
    decine = resto === 0 && centinaia ? "" : UNITA[resto];
  } else {
    const u = resto % 10;
    const d = DECINE[Math.floor(resto / 10)];
    // Ventuno e ventotto perdono la vocale; ventitré prende l'accento.
    decine = u === 0 ? d : `${u === 1 || u === 8 ? d.slice(0, -1) : d}${u === 3 ? "tré" : UNITA[u]}`;
  }
  if (!centinaia) return decine;
  const cento = centinaia === 1 ? "cento" : `${UNITA[centinaia]}cento`;
  // Centotto, centottanta: «cento» perde la o davanti a una o.
  return decine.startsWith("o") ? `${cento.slice(0, -1)}${decine}` : `${cento}${decine}`;
}

/** Un numero intero da 0 a 999'999 in parole: 36288 → «trentaseimila duecentottantotto». */
export function numeroInParole(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999) throw new Error(`Numero fuori dai limiti: ${n}`);
  const migliaia = Math.floor(n / 1000);
  const resto = n % 1000;
  if (!migliaia) return finoAMille(n);
  const prima = migliaia === 1 ? "mille" : `${finoAMille(migliaia).replace(/tré$/, "tre")}mila`;
  return resto ? `${prima} ${finoAMille(resto)}` : prima;
}

/** Le sigle e le parole che la voce sbaglia, con come si dicono. */
const PRONUNCIA: readonly [RegExp, string][] = [
  [/\bBleo\b/g, "Blìo"],
  [/AVS\/AI\/IPG/g, "a-vu-esse, a-i e i-pi-gi"],
  [/\bAVS\b/g, "a-vu-esse"],
  [/\bAFC\b/g, "a-effe-ci"],
  [/\bUfficio RC\b/g, "Ufficio del registro di commercio"],
  [/\bUE\/AELS\b/g, "dell'Unione europea o dell'AELS"],
  [/\bQR-fattura\b/g, "fattura cu-erre"],
  [/\bsu selbststaendig-erwerbend\.ch\b/g, "sul sito ufficiale per gli indipendenti"],
  [/\beTax PF\b/g, "i-tax"],
  [/(\d),(\d)/g, "$1 virgola $2"],
  [/(\d)\.(\d)/g, "$1 punto $2"],
  [/%/g, " per cento"],
];

/**
 * Una frase della voce: importi in parole, sigle come si dicono, niente
 * parentesi (sono sigle o esempi da leggere, non da ascoltare) né virgolette.
 */
export function perLaVoce(testo: string): string {
  let t = testo
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[«»"]/g, "")
    .replace(/CHF (\d[\d']*)/g, (_, cifre: string) => `${numeroInParole(Number(cifre.replace(/'/g, "")))} franchi`);
  for (const [cerca, metti] of PRONUNCIA) t = t.replace(cerca, metti);
  return t.replace(/\s+/g, " ").trim();
}

const maiuscola = (t: string) => `${t.charAt(0).toUpperCase()}${t.slice(1)}`;

/** Una frase finita: con la maiuscola e il punto, se non ha già la sua punteggiatura. */
function frase(testo: string): string {
  const t = maiuscola(perLaVoce(testo));
  return /[.!?:]$/.test(t) ? t : `${t}.`;
}

/** Il testo che Bleo legge su una scheda. I punti vanno a capo: la pausa fa comparire il punto successivo. */
export function testoVoceScheda(scheda: SchedaPost): string {
  switch (scheda.tipo) {
    case "copertina":
      // L'occhiello si legge solo quando è Bleo che si presenta.
      return [...(/Bleo/.test(scheda.occhiello) ? [`${perLaVoce(scheda.occhiello)}!`] : []), frase(scheda.titolo)].join(" ");
    case "punti": {
      const titolo = maiuscola(perLaVoce(scheda.titolo)).replace(/[.:]$/, "");
      return [/[?!]$/.test(titolo) ? titolo : `${titolo}:`, ...scheda.punti.map(frase)].join("\n");
    }
    case "cifra":
      // «di cifra d'affari…» continua la cifra; «Sotto questa cifra…» è una frase a sé.
      return /^[A-ZÀ-Ý]/.test(scheda.testo)
        ? `${frase(scheda.cifra)} ${frase(scheda.testo)}`
        : frase(`${scheda.cifra} ${scheda.testo}`);
  }
}

/** La chiusura, uguale in tutti i video. */
export const VOCE_CHIUSURA = "Le fonti ufficiali sono nel post. Ti è stato utile? Iscriviti alla lista d'attesa: il link è nel profilo!";

/** Le frasi del video di un post, una per scheda, in ordine; la chiusura a parte (VOCE_CHIUSURA). */
export function testiVoce(post: PostSocial): string[] {
  return post.schede.map(testoVoceScheda);
}
