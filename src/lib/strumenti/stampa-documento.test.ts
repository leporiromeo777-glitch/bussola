import { describe, expect, it } from "vitest";
import { emittenteVuoto, nuovoDocumento, type Documento } from "./documenti";
import { escapeHtml, htmlDocumento, nomeFilePdf, righeIndirizzo, vistaDocumento } from "./stampa-documento";

function fattura(campi: Partial<Documento> = {}): Documento {
  const base = nuovoDocumento(
    "fattura",
    {
      ...emittenteVuoto(),
      nome: "Giulia Bernasconi",
      via: "Via Lugano",
      numero: "12",
      npa: "6500",
      localita: "Bellinzona",
      email: "giulia@example.ch",
      iban: "CH58 0079 1123 0008 8901 2",
    },
    [],
    { id: "f1-000000", oggiIso: "2026-10-19", adessoIso: "2026-10-19T10:00:00Z", idRiga: () => "r1" },
  );
  return {
    ...base,
    numero: "F-2026-001",
    cliente: { nome: "Bar Centrale", via: "Piazza Grande", numero: "1", npa: "6600", localita: "Locarno", paese: "CH" },
    righe: [
      { ...base.righe[0], descrizione: "Sito web", quantita: "1", prezzo: "1'949.75" },
      { id: "r2", descrizione: "Ore di assistenza", quantita: "2.5", unita: "h", prezzo: "80", aliquota: "normale" },
      { id: "r3", descrizione: "", quantita: "1", unita: "", prezzo: "", aliquota: "normale" },
    ],
    ...campi,
  };
}

describe("vistaDocumento", () => {
  it("prepara i testi della fattura come l'anteprima del sito", () => {
    const v = vistaDocumento(fattura({ oggetto: "Sito per il bar", periodoPrestazione: "ottobre 2026", note: "Grazie!" }));
    expect(v.titolo).toBe("Fattura");
    expect(v.emittente).toEqual({ nome: "Giulia Bernasconi", righe: ["Via Lugano 12", "6500 Bellinzona", "giulia@example.ch"] });
    expect(v.dettagli).toEqual([
      { etichetta: "Numero", valore: "F-2026-001" },
      { etichetta: "Data", valore: "19.10.2026" },
      { etichetta: "Da pagare entro il", valore: "18.11.2026" },
    ]);
    expect(v.cliente).toEqual({ nome: "Bar Centrale", righe: ["Piazza Grande 1", "6600 Locarno"] });
    expect(v.prestazione).toBe("Prestazione: ottobre 2026");
    expect(v.colonne).toEqual(["Descrizione", "Quantità", "Prezzo", "Importo"]);
    // La voce vuota non si stampa.
    expect(v.righe).toEqual([
      { id: "r1", descrizione: "Sito web", quantita: "1", prezzo: "1'949.75", iva: null, importo: "1'949.75" },
      { id: "r2", descrizione: "Ore di assistenza", quantita: "2.50 h", prezzo: "80.00", iva: null, importo: "200.00" },
    ]);
    expect(v.totali).toEqual([{ etichetta: "Totale", valore: "CHF 2'149.75", forte: true }]);
    expect(v.chiusura).toBe("Da pagare entro il 18.11.2026 sul conto CH58 0079 1123 0008 8901 2, intestato a Giulia Bernasconi.");
  });

  it("con l'IVA: numero IVA, colonna IVA, imponibile e imposta per aliquota", () => {
    const doc = fattura();
    const v = vistaDocumento({ ...doc, emittente: { ...doc.emittente, ivaIscritto: true, numeroIva: "che 123 456 789" } });
    expect(v.emittente.righe).toContain("CHE-123.456.789 IVA");
    expect(v.colonne).toEqual(["Descrizione", "Quantità", "Prezzo", "IVA", "Importo"]);
    expect(v.righe[0].iva).toBe("8,1%");
    expect(v.totali.map((t) => t.etichetta)).toEqual(["Totale senza IVA", "IVA 8,1% su 2'149.75", "Totale IVA inclusa"]);
  });

  it("preventivo: validità invece del pagamento, arrotondamento se chiesto", () => {
    const v = vistaDocumento(fattura({ tipo: "preventivo", numero: "P-2026-001", arrotonda5: true, righe: [{ id: "r", descrizione: "x", quantita: "1", unita: "", prezzo: "10.02", aliquota: "normale" }] }));
    expect(v.titolo).toBe("Preventivo");
    expect(v.dettagli[2]).toEqual({ etichetta: "Valido fino al", valore: "18.11.2026" });
    expect(v.chiusura).toBe("Questo preventivo è valido fino al 18.11.2026.");
    expect(v.totali).toEqual([
      { etichetta: "Arrotondamento", valore: "-CHF 0.02" },
      { etichetta: "Totale", valore: "CHF 10.00", forte: true },
    ]);
  });

  it("righeIndirizzo: il paese solo se non è la Svizzera", () => {
    expect(righeIndirizzo({ nome: "", via: "Via Roma", numero: "", npa: "22100", localita: "Como", paese: "it" })).toEqual([
      "Via Roma",
      "22100 Como",
      "IT",
    ]);
  });
});

describe("htmlDocumento", () => {
  it("pagina A4 con la sezione pagamento della QR-fattura in fondo", () => {
    const html = htmlDocumento(fattura());
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("@page { size: A4; margin: 0; }");
    expect(html).toContain('<div class="foglio una-pagina">');
    expect(html).toMatch(/<div class="pagamento"><svg [^>]*aria-label="Sezione pagamento con codice QR"/);
    expect(html).toContain("<title>Fattura F-2026-001</title>");
    expect(html).not.toContain('<div class="pagina-pagamento">');
  });

  it("documento lungo: la sezione pagamento va su una pagina sua", () => {
    const html = htmlDocumento(fattura(), { impaginazione: "pagina-separata" });
    expect(html).toContain('<div class="foglio">');
    expect(html).toMatch(/<\/div><div class="pagina-pagamento"><div class="pagamento"><svg/);
  });

  it("preventivi e fatture incomplete escono senza sezione pagamento", () => {
    expect(htmlDocumento(fattura({ tipo: "preventivo" }))).not.toContain('<div class="pagamento">');
    const senzaIban = fattura();
    expect(htmlDocumento({ ...senzaIban, emittente: { ...senzaIban.emittente, iban: "" } })).not.toContain('<div class="pagamento">');
  });

  it("i testi scritti dall'utente non diventano HTML", () => {
    const html = htmlDocumento(
      fattura({ tipo: "preventivo", cliente: { ...fattura().cliente, nome: '<img src=x onerror="alert(1)">' }, note: "</style><script>x</script>" }),
    );
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(escapeHtml(`a&b<'"`)).toBe("a&amp;b&lt;&#39;&quot;");
  });
});

describe("nomeFilePdf", () => {
  it("tipo e numero, solo caratteri sicuri", () => {
    expect(nomeFilePdf({ tipo: "fattura", numero: "F-2026-001" })).toBe("Fattura F-2026-001.pdf");
    expect(nomeFilePdf({ tipo: "preventivo", numero: "P/2026 è 3" })).toBe("Preventivo P-2026-e-3.pdf");
    expect(nomeFilePdf({ tipo: "fattura", numero: "../" })).toBe("Fattura.pdf");
  });
});
