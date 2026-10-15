import { load, type CheerioAPI } from "cheerio";
import { isTag, isText, type AnyNode } from "domhandler";
import { haContenuto, normalizzaSpazi, type Blocco } from "./blocchi";

/** Dove cercare il contenuto principale, in ordine di preferenza. */
const CONTENITORI_PRINCIPALI = [
  "main",
  "[role=main]",
  "article",
  "#content",
  "#main-content",
  "#maincontent",
  ".main-content",
];

/** Elementi che non sono mai contenuto: si tolgono ovunque. */
const DA_TOGLIERE = [
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "canvas",
  "iframe",
  "object",
  "nav",
  "aside",
  "form",
  "select",
  "input",
  "textarea",
  "dialog",
  "[hidden]",
  "[aria-hidden=true]",
  "[role=navigation]",
  "[role=search]",
  "[role=dialog]",
  "[id*=cookie i]",
  "[class*=cookie i]",
  "[id*=consent i]",
  "[class*=consent i]",
  "[class*=breadcrumb i]",
  ".sr-only",
  ".visually-hidden",
  ".visuallyhidden",
].join(",");

/** Intestazione e piè di pagina del sito: si tolgono solo fuori dal contenuto principale. */
const CORNICE_SITO = "header, footer, [role=banner], [role=contentinfo]";

const TITOLI = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const CELLE = new Set(["td", "th"]);
const BLOCCHI = new Set([
  "address", "article", "blockquote", "dd", "details", "div", "dl", "dt", "fieldset",
  "figcaption", "figure", "footer", "header", "hr", "li", "main", "ol", "p", "pre",
  "section", "summary", "table", "tbody", "thead", "tfoot", "tr", "ul", "caption",
]);

export type TestoPagina = { titolo: string | null; blocchi: Blocco[] };

/**
 * Estrae il testo utile di una pagina HTML: toglie menu, intestazioni,
 * banner dei cookie e moduli, preferisce `main`/`article`/`#content`, e
 * restituisce titoli, paragrafi e punti degli elenchi in ordine.
 */
export function estraiTestoHtml(html: string): TestoPagina {
  const $ = load(html);
  // Mai togliere un contenitore del contenuto (es. <body class="cookie-banner-visible">).
  $(DA_TOGLIERE)
    .filter((_, el) => !$(el).is("html, body, main, article") && $(el).find("main, article").length === 0)
    .remove();
  // I pulsanti si tolgono, tranne quelli delle fisarmoniche che contengono il titolo della sezione.
  $("button")
    .filter((_, el) => $(el).find("h1, h2, h3, h4, h5, h6").length === 0)
    .remove();
  const radice = trovaRadice($);
  if (radice.is("body")) radice.find(CORNICE_SITO).remove();
  const titolo =
    normalizzaSpazi(radice.find("h1").first().text()) || normalizzaSpazi($("title").first().text()) || null;

  const blocchi: Blocco[] = [];
  let riga = "";
  let tipoRiga: "paragrafo" | "punto" = "paragrafo";

  const chiudiRiga = () => {
    const testo = normalizzaSpazi(riga)
      .replace(/(\s*\|\s*)+/g, " | ")
      .replace(/^\s*\|\s*|\s*\|\s*$/g, "")
      .trim();
    if (haContenuto(testo)) blocchi.push({ tipo: tipoRiga, testo });
    riga = "";
    tipoRiga = "paragrafo";
  };

  const visita = (nodo: AnyNode) => {
    if (isText(nodo)) {
      riga += nodo.data;
      return;
    }
    if (!isTag(nodo)) return;
    const nome = nodo.name.toLowerCase();

    if (TITOLI.has(nome)) {
      chiudiRiga();
      const testo = normalizzaSpazi($(nodo).text());
      if (haContenuto(testo)) blocchi.push({ tipo: "titolo", livello: Number(nome[1]), testo });
      return;
    }
    if (nome === "br") {
      riga += " ";
      return;
    }
    if (CELLE.has(nome)) {
      for (const figlio of nodo.children) visita(figlio);
      riga += " | ";
      return;
    }
    if (BLOCCHI.has(nome)) {
      chiudiRiga();
      if (nome === "li") tipoRiga = "punto";
      for (const figlio of nodo.children) visita(figlio);
      chiudiRiga();
      return;
    }
    // Elementi in linea (a, span, strong, em, abbr...): il testo continua.
    for (const figlio of nodo.children) visita(figlio);
  };

  for (const nodo of radice.contents().toArray()) visita(nodo);
  chiudiRiga();

  return { titolo, blocchi: togliRipetizioni(blocchi) };
}

function trovaRadice($: CheerioAPI) {
  for (const selettore of CONTENITORI_PRINCIPALI) {
    const trovato = $(selettore).first();
    if (trovato.length && haContenuto(normalizzaSpazi(trovato.text()))) return trovato;
  }
  return $("body").first();
}

/** Alcuni siti ripetono lo stesso titolo (versione mobile e desktop): si tiene il primo. */
function togliRipetizioni(blocchi: Blocco[]): Blocco[] {
  return blocchi.filter((blocco, i) => {
    const precedente = blocchi[i - 1];
    return !precedente || precedente.tipo !== blocco.tipo || precedente.testo !== blocco.testo;
  });
}
