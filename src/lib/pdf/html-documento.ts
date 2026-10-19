/**
 * Lo stesso documento di crea-pdf.ts (titoli, paragrafi, elenchi, tabelle,
 * articoli con la norma accanto, riquadri) come pagina HTML A4, per creare il
 * PDF sul telefono con expo-print. Il sito usa crea-pdf.ts (pdf-lib); l'app
 * usa questa pagina, con gli stessi testi, gli stessi colori e lo stesso
 * ordine dei blocchi.
 *
 * Differenza con il PDF del sito: il piè di pagina («Bleo · … non è una
 * consulenza») sta una volta in fondo al documento, perché la stampa del
 * telefono non ripete le righe su ogni pagina.
 *
 * Logica pura, senza browser né Node.
 */
import { escapeHtml } from "../strumenti/stampa-documento";
import type { Blocco, DocumentoPdf } from "./crea-pdf";

/**
 * Margini della pagina in punti tipografici (1/72 di pollice), circa
 * 18 mm in alto e 20 mm ai lati e in basso. Su iPhone expo-print li vuole
 * come opzione (`margins`); su Android valgono quelli del CSS (@page).
 */
export const MARGINI_PDF_PUNTI = { top: 51, right: 57, bottom: 57, left: 57 } as const;

const COLORI = {
  testo: "#1c1f24",
  tenue: "#4d525c",
  marchio: "#0f5e6b",
  accento: "#9c5c1c",
  linea: "#d6d1c9",
  fondoNota: "#edf5f7",
  fondoAvviso: "#fcf2e6",
};

function stile(margineCss: boolean): string {
  const m = MARGINI_PDF_PUNTI;
  // Senza margini nel CSS valgono quelli di chi stampa (su iPhone, l'opzione `margins` di expo-print).
  const pagina = margineCss ? `size: A4; margin: ${m.top}pt ${m.right}pt ${m.bottom}pt ${m.left}pt;` : "size: A4;";
  return `
@page { ${pagina} }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body {
  color: ${COLORI.testo}; font-family: Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.4;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; -webkit-text-size-adjust: 100%;
  overflow-wrap: break-word;
}
.fascia { background: ${COLORI.accento}; color: #ffffff; font-weight: 700; font-size: 12pt; text-align: center; padding: 3mm 4mm; margin: 0 0 6mm; }
h1 { font-size: 20pt; line-height: 1.25; color: ${COLORI.marchio}; margin: 0 0 3mm; }
h2 {
  font-size: 13pt; line-height: 1.3; color: ${COLORI.marchio}; margin: 6mm 0 2.5mm; padding-bottom: 1mm;
  border-bottom: 0.25mm solid ${COLORI.linea}; break-after: avoid; page-break-after: avoid;
}
p { margin: 0 0 2.5mm; white-space: pre-line; }
p.tenue { color: ${COLORI.tenue}; }
ul, ol { margin: 0 0 3mm; padding-left: 6mm; }
li { margin: 0 0 1mm; padding-left: 1mm; overflow-wrap: anywhere; }
li::marker { color: ${COLORI.marchio}; }
table { width: 100%; border-collapse: collapse; margin: 1mm 0 4mm; font-size: 9.5pt; }
th { text-align: left; font-weight: 700; background: ${COLORI.fondoNota}; padding: 1.5mm 1.8mm; }
td { padding: 1.5mm 1.8mm; vertical-align: top; border-bottom: 0.2mm solid ${COLORI.linea}; white-space: pre-line; }
tr { break-inside: avoid; page-break-inside: avoid; }
.articolo { display: flex; gap: 5mm; margin: 3mm 0 3.5mm; break-inside: avoid; page-break-inside: avoid; }
.articolo .testo { flex: 1 1 auto; min-width: 0; }
.articolo h3 { font-size: 11pt; margin: 0 0 1.5mm; }
.articolo p { margin-bottom: 1.2mm; }
.articolo .cpv { display: inline-block; min-width: 4mm; color: ${COLORI.tenue}; }
.articolo .norma { flex: 0 0 40mm; font-size: 8.5pt; line-height: 1.35; color: ${COLORI.tenue}; white-space: pre-line; padding-top: 0.6mm; }
.riquadro { border: 0.3mm solid ${COLORI.marchio}; border-radius: 1.5mm; padding: 3mm 4mm; margin: 3mm 0 4mm; background: ${COLORI.fondoNota}; break-inside: avoid; page-break-inside: avoid; }
.riquadro.avviso { background: ${COLORI.fondoAvviso}; border-color: ${COLORI.accento}; }
.riquadro .titolo { font-weight: 700; color: ${COLORI.marchio}; margin-bottom: 1.5mm; }
.riquadro.avviso .titolo { color: ${COLORI.accento}; }
.riquadro p { font-size: 10pt; }
.riquadro p:last-child { margin-bottom: 0; }
.piede { margin-top: 8mm; padding-top: 2mm; border-top: 0.25mm solid ${COLORI.linea}; font-size: 8pt; font-style: italic; color: ${COLORI.tenue}; }
`;
}

function blocco(b: Blocco): string {
  switch (b.tipo) {
    case "titolo":
      return `<h1>${escapeHtml(b.testo)}</h1>`;
    case "sottotitolo":
      return `<h2>${escapeHtml(b.testo)}</h2>`;
    case "paragrafo":
      return `<p${b.tenue ? ' class="tenue"' : ""}>${escapeHtml(b.testo)}</p>`;
    case "elenco": {
      const tag = b.numerato ? "ol" : "ul";
      return `<${tag}>${b.voci.map((v) => `<li>${escapeHtml(v)}</li>`).join("")}</${tag}>`;
    }
    case "tabella": {
      const totale = b.larghezze.reduce((a, l) => a + l, 0) || 1;
      const colonne = b.larghezze.map((l) => `<col style="width:${((l / totale) * 100).toFixed(2)}%">`).join("");
      const testata = b.colonne.length
        ? `<thead><tr>${b.colonne.map((c) => `<th scope="col">${escapeHtml(c)}</th>`).join("")}</tr></thead>`
        : "";
      const righe = b.righe.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("");
      return `<table><colgroup>${colonne}</colgroup>${testata}<tbody>${righe}</tbody></table>`;
    }
    case "articolo": {
      // Come nel PDF del sito: i commi si numerano solo se sono più di uno.
      const commi = b.commi
        .map((c, i) => `<p>${b.commi.length > 1 ? `<span class="cpv">${i + 1}</span> ` : ""}${escapeHtml(c)}</p>`)
        .join("");
      return (
        `<div class="articolo"><div class="testo"><h3>${escapeHtml(b.titolo)}</h3>${commi}</div>` +
        `<div class="norma">${escapeHtml(b.norma)}</div></div>`
      );
    }
    case "riquadro":
      return (
        `<div class="riquadro ${b.stile}">` +
        (b.titolo ? `<p class="titolo">${escapeHtml(b.titolo)}</p>` : "") +
        `<p>${escapeHtml(b.testo)}</p></div>`
      );
  }
}

/**
 * La pagina HTML del documento. `margineCss` (predefinito true) mette i
 * margini nel CSS, per Android; su iPhone si passa false: il CSS non dice
 * niente sui margini e MARGINI_PDF_PUNTI vanno a expo-print.
 */
export function htmlDocumentoPdf(doc: DocumentoPdf, { margineCss = true }: { margineCss?: boolean } = {}): string {
  const corpo = [
    doc.fascia ? `<div class="fascia">${escapeHtml(doc.fascia)}</div>` : "",
    ...doc.blocchi.map(blocco),
    `<p class="piede">${escapeHtml(doc.piede)}</p>`,
  ].join("");
  return (
    `<!DOCTYPE html><html lang="it-CH"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">` +
    `<title>${escapeHtml(doc.titolo)}</title><style>${stile(margineCss)}</style></head>` +
    `<body>${corpo}</body></html>`
  );
}
