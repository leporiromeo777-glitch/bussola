/**
 * Sezione pagamento della QR-fattura come SVG, con swissqrbill. Nel browser
 * usa il motore SVG del DOM, in Node (test) quello testuale: il risultato è lo
 * stesso testo SVG.
 */
import { SwissQRBill } from "swissqrbill/svg";
import { pagamentoDaDocumento, type Documento } from "./documenti";
import { validaPagamentoQr, type ErroreQr } from "./qr";

export type EsitoSezionePagamento = { ok: true; svg: string } | { ok: false; errori: ErroreQr[] };

/** La sezione pagamento misura 210 × 105 mm: in px CSS (96 dpi). */
const LARGHEZZA_PX = (210 * 96) / 25.4;
const ALTEZZA_PX = (105 * 96) / 25.4;

/**
 * Rende scalabile l'SVG di swissqrbill: toglie larghezza e altezza fisse dal
 * tag principale e aggiunge un viewBox equivalente. Le misure interne restano
 * in mm e si convertono nel sistema di coordinate, quindi a 210 mm di
 * larghezza il disegno è identico all'originale.
 */
export function svgScalabile(svg: string): string {
  const fine = svg.indexOf(">");
  if (!svg.startsWith("<svg") || fine < 0) return svg;
  const apertura = svg
    .slice(0, fine)
    .replace(/\s(width|height|viewBox|preserveAspectRatio)="[^"]*"/g, "")
    .concat(
      ` viewBox="0 0 ${LARGHEZZA_PX.toFixed(3)} ${ALTEZZA_PX.toFixed(3)}" width="100%" height="100%"`,
      ' preserveAspectRatio="xMidYMid meet" role="img" aria-label="Sezione pagamento con codice QR"',
    );
  return `${apertura}${svg.slice(fine)}`;
}

/**
 * Forbici di swissqrbill (11 × 19 px, lame verso il basso), le stesse che la
 * libreria disegna sulla linea verticale tra ricevuta e sezione pagamento.
 */
const FORBICI =
  "M8.55299 18.3969C9.54465 17.5748 9.51074 16.0915 9.08357 14.9829L6.47473 8.02261C7.58167 5.9986 7.26467 3.99833 7.80373 3.99833C8.22582 3.99833 8.13259 4.38482 9.23105 4.32719C10.2854 4.27125 11.0652 3.1711 10.9957 2.13197C11.0025 1.09115 10.2041 0.0130391 9.1056 0.00456339C7.99867 -0.0734135 6.96972 0.858918 6.89683 1.95907C6.70527 3.24907 7.48674 5.53413 5.56613 6.60547C4.09305 5.80705 4.08797 4.38991 4.16255 3.10838C4.22358 2.04552 3.91845 0.76738 2.87424 0.260531C1.87241 -0.229367 0.446794 0.25036 0.139972 1.37594C-0.277034 2.51168 0.250156 4.07122 1.55541 4.34244C2.56233 4.55095 3.03528 3.83729 3.40143 4.1119C3.67774 4.31871 3.5167 5.62906 4.566 7.96667L1.908 15.5033C1.64356 16.456 1.65204 17.6206 2.58776 18.463L5.5424 10.6484L8.55299 18.3969ZM10.1634 2.87953C9.55143 3.97629 7.88849 3.88645 7.56641 2.74731C7.20704 1.71666 8.20887 0.397838 9.32767 0.726697C10.2447 0.919943 10.5821 2.12858 10.1634 2.87953ZM3.36753 2.927C2.94544 4.07122 1.00789 3.87797 0.746835 2.71341C0.479001 1.94042 0.8638 0.836881 1.77409 0.758904C2.88102 0.608036 3.87946 1.90821 3.36753 2.927Z";

/**
 * Aggiunge sopra la sezione pagamento la linea tratteggiata orizzontale con le
 * forbici, che le linee guida SIX chiedono quando la QR-fattura è stampata su
 * carta normale o inviata in PDF (swissqrbill in SVG disegna solo quella
 * verticale tra ricevuta e sezione pagamento). La linea è larga 210 mm e sta
 * sul bordo superiore; le forbici, girate in orizzontale, sono al centro e
 * possono uscire un poco sopra il bordo (overflow visibile).
 */
export function conLineaDiTaglio(svg: string): string {
  const fine = svg.indexOf(">");
  const chiusura = svg.lastIndexOf("</svg>");
  if (!svg.startsWith("<svg") || fine < 0 || chiusura < fine) return svg;
  const y = 0.5; // a mezzo pixel dal bordo: la linea di 1 px resta tutta dentro
  const centroX = LARGHEZZA_PX / 2;
  // Ruotate di -90°, le forbici occupano 19 × 11 px: si centrano sulla linea.
  const forbici =
    `<g data-forbici="" transform="translate(${(centroX - 9.5).toFixed(3)} ${(y + 5.5).toFixed(3)}) rotate(-90)">` +
    `<path d="${FORBICI}" fill="black" /></g>`;
  const linea = `<line data-linea-taglio="" x1="0" y1="${y}" x2="${LARGHEZZA_PX.toFixed(3)}" y2="${y}" stroke-width="1" stroke="black" stroke-dasharray="3" />`;
  const apertura = svg.slice(0, fine).replace(/\soverflow="[^"]*"/g, "").concat(' overflow="visible"');
  return `${apertura}${svg.slice(fine, chiusura)}${linea}${forbici}${svg.slice(chiusura)}`;
}

/** SVG della sezione pagamento per una fattura, o l'elenco di cosa manca. */
export function sezionePagamentoSvg(doc: Documento): EsitoSezionePagamento {
  const pagamento = pagamentoDaDocumento(doc);
  if (!pagamento.ok) return pagamento;
  const valido = validaPagamentoQr(pagamento.dati);
  if (!valido.ok) return valido;
  try {
    const svg = new SwissQRBill(valido.dati, { language: "IT" }).toString();
    return { ok: true, svg: svgScalabile(conLineaDiTaglio(svg)) };
  } catch (errore) {
    return {
      ok: false,
      errori: [
        {
          campo: "qr",
          messaggio: `La sezione pagamento non si può creare (${errore instanceof Error ? errore.message : "errore sconosciuto"}).`,
        },
      ],
    };
  }
}

/** Pixel CSS (96 per pollice) per unità di misura SVG. */
const PX_PER_UNITA: Record<string, number> = { "": 1, px: 1, mm: 96 / 25.4, cm: 96 / 2.54, in: 96, pt: 96 / 72, pc: 16 };

function lunghezzaInPx(valore: string | undefined): number | null {
  if (valore === undefined) return 0;
  const m = /^\s*(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(px|mm|cm|in|pt|pc)?\s*$/i.exec(valore);
  return m ? Number(m[1]) * PX_PER_UNITA[(m[2] ?? "").toLowerCase()] : null;
}

/**
 * Lo stesso disegno senza <svg> dentro l'<svg>: ognuno diventa un gruppo
 * spostato di x e y (le misure interne restano quelle). swissqrbill annida
 * gli <svg> per ricevuta, sezione pagamento e codice QR; non tutti i motori
 * SVG li disegnano bene (per esempio react-native-svg nell'app). Se un
 * <svg> annidato ha una posizione che non si sa convertire, il testo resta
 * com'era.
 */
export function svgSenzaAnnidati(svg: string): string {
  const inizio = svg.indexOf(">") + 1;
  const fine = svg.lastIndexOf("</svg>");
  if (!svg.startsWith("<svg") || inizio <= 0 || fine < inizio) return svg;
  let convertibile = true;
  const interno = svg
    .slice(inizio, fine)
    .replace(/<svg\b([^>]*?)(\/?)>/g, (_tutto, attributi: string, chiuso: string) => {
      const x = lunghezzaInPx(/\sx="([^"]*)"/.exec(attributi)?.[1]);
      const y = lunghezzaInPx(/\sy="([^"]*)"/.exec(attributi)?.[1]);
      if (x === null || y === null) convertibile = false;
      return `<g transform="translate(${(x ?? 0).toFixed(3)} ${(y ?? 0).toFixed(3)})"${chiuso}>`;
    })
    .replace(/<\/svg>/g, "</g>");
  return convertibile ? `${svg.slice(0, inizio)}${interno}${svg.slice(fine)}` : svg;
}
