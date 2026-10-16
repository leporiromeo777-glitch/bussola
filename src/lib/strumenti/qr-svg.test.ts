import { describe, expect, it } from "vitest";
import { emittenteVuoto, nuovoDocumento, type Documento } from "./documenti";
import { conLineaDiTaglio, sezionePagamentoSvg, svgScalabile } from "./qr-svg";

function fattura(modifiche: Partial<Documento> = {}): Documento {
  const base = nuovoDocumento(
    "fattura",
    {
      ...emittenteVuoto(),
      nome: "Giulia Bernasconi",
      via: "Via Lugano",
      numero: "12",
      npa: "6500",
      localita: "Bellinzona",
      iban: "CH58 0079 1123 0008 8901 2",
    },
    [],
    { id: "f1", oggiIso: "2026-10-19", adessoIso: "2026-10-19T10:00:00Z", idRiga: () => "r1" },
  );
  return {
    ...base,
    cliente: { nome: "Bar Centrale", via: "Piazza Grande", numero: "1", npa: "6600", localita: "Locarno", paese: "CH" },
    righe: [{ ...base.righe[0], descrizione: "Sito web", quantita: "1", prezzo: "1'949.75" }],
    ...modifiche,
  };
}

describe("svgScalabile", () => {
  it("sostituisce larghezza e altezza fisse con un viewBox", () => {
    const fuori = svgScalabile('<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="105mm"><rect width="100%"/></svg>');
    expect(fuori).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 793\.701 396\.850" width="100%" height="100%"/);
    expect(fuori).toContain('<rect width="100%"/>');
    expect(fuori.match(/width=/g)).toHaveLength(2);
  });
  it("funziona anche con un ordine diverso degli attributi", () => {
    expect(svgScalabile('<svg height="105mm" width="210mm" xmlns="x"></svg>')).toBe(
      '<svg xmlns="x" viewBox="0 0 793.701 396.850" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Sezione pagamento con codice QR"></svg>',
    );
  });
  it("lascia stare un testo che non è un SVG", () => {
    expect(svgScalabile("<div>")).toBe("<div>");
  });
});

describe("conLineaDiTaglio", () => {
  it("aggiunge in cima la linea tratteggiata di 210 mm con le forbici, sopra il resto del disegno", () => {
    const fuori = conLineaDiTaglio('<svg xmlns="x" width="210mm" height="105mm"><rect width="100%"/><svg><path/></svg></svg>');
    expect(fuori).toMatch(/^<svg xmlns="x" width="210mm" height="105mm" overflow="visible">/);
    expect(fuori).toContain('<line data-linea-taglio="" x1="0" y1="0.5" x2="793.701" y2="0.5" stroke-width="1" stroke="black" stroke-dasharray="3" />');
    expect(fuori).toMatch(/<g data-forbici="" transform="translate\(387\.350 6\.000\) rotate\(-90\)"><path d="M8\.55299/);
    // Linea e forbici dopo lo sfondo bianco e dentro l'SVG principale.
    expect(fuori.indexOf("data-linea-taglio")).toBeGreaterThan(fuori.indexOf("<rect"));
    expect(fuori.endsWith("</g></svg>")).toBe(true);
    expect(fuori.indexOf("<svg><path/></svg>")).toBeLessThan(fuori.indexOf("data-linea-taglio"));
  });
  it("lascia stare un testo che non è un SVG", () => {
    expect(conLineaDiTaglio("<div></div>")).toBe("<div></div>");
  });
});

describe("sezionePagamentoSvg", () => {
  it("crea la sezione pagamento in italiano con importo, IBAN e riferimento RF", () => {
    const esito = sezionePagamentoSvg(fattura());
    expect(esito.ok).toBe(true);
    if (!esito.ok) return;
    expect(esito.svg.startsWith("<svg")).toBe(true);
    expect(esito.svg).toContain("Sezione pagamento");
    expect(esito.svg).toContain("Ricevuta");
    expect(esito.svg).toContain("1 949.75");
    expect(esito.svg).toContain("CH58 0079 1123 0008 8901 2");
    expect(esito.svg).toMatch(/RF\d\d F202 6001/);
    expect(esito.svg).toContain("Bar Centrale");
  });

  it("ha la linea di taglio orizzontale con le forbici, oltre a quella verticale", () => {
    const esito = sezionePagamentoSvg(fattura());
    expect(esito.ok).toBe(true);
    if (!esito.ok) return;
    expect(esito.svg).toContain("data-linea-taglio");
    expect(esito.svg).toContain("data-forbici");
    expect(esito.svg).toMatch(/^<svg[^>]*overflow="visible"[^>]*viewBox="0 0 793\.701 396\.850"/);
    expect(esito.svg.match(/stroke-dasharray/g)).toHaveLength(2);
  });

  it("con un QR-IBAN usa il riferimento QR", () => {
    const esito = sezionePagamentoSvg(fattura({ emittente: { ...fattura().emittente, iban: "CH44 3199 9123 0008 8901 2" } }));
    expect(esito.ok).toBe(true);
    if (esito.ok) expect(esito.svg).toMatch(/00 00000 00000 00000 00202 6001\d/);
  });

  it("dice cosa manca invece di rompersi", () => {
    const esito = sezionePagamentoSvg(fattura({ emittente: { ...fattura().emittente, iban: "", npa: "" } }));
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errori[0].campo).toBe("iban");
    const zero = sezionePagamentoSvg(fattura({ righe: [] }));
    expect(zero.ok).toBe(false);
    if (!zero.ok) expect(zero.errori.map((e) => e.campo)).toContain("importo");
  });
});
