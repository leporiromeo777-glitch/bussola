import { describe, expect, it } from "vitest";
import { datiFondazioneIniziali, type DatiFondazione } from "../fondazione-sagl/dati";
import { bozzaStatuto, PASSI_CHECK_LIST, schedaPreparazione } from "../fondazione-sagl/documenti";
import { MARGINI_PDF_PUNTI, htmlDocumentoPdf } from "./html-documento";

function completi(): DatiFondazione {
  const d = datiFondazioneIniziali();
  return {
    ...d,
    ditta: "Rossi & Bianchi Sagl",
    sede: "Bellinzona",
    scopo: "Riparazione di biciclette <e> vendita di accessori.",
    banca: "Banca dello Stato",
    soci: [
      { ...d.soci[0], nome: "Luca Rossi", domicilio: "Bellinzona", quote: 150 },
      { ...d.soci[1], nome: "Sara Bianchi", domicilio: "Giubiasco", quote: 50, inNatura: true },
    ],
  };
}

describe("htmlDocumentoPdf", () => {
  it("è una pagina HTML completa con il titolo, i blocchi e il piè di pagina", () => {
    const doc = schedaPreparazione(completi(), "2026-10-19");
    const html = htmlDocumentoPdf(doc);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain('<html lang="it-CH">');
    expect(html).toContain("<title>Scheda di preparazione - Rossi &amp; Bianchi Sagl</title>");
    expect(html).toContain("<h1>Fondare una Sagl: scheda di preparazione</h1>");
    expect(html).toContain("<h2>1. La società</h2>");
    expect(html).toContain("CHF 15&#39;000.00");
    expect(html).toContain("in natura");
    expect(html).toContain("19.10.2026");
    for (const passo of PASSI_CHECK_LIST) expect(html).toContain(`<li>${passo.replace(/'/g, "&#39;")}</li>`);
    expect(html).toContain('<p class="piede">');
    expect(html).toContain("non una consulenza");
  });

  it("fa l'escape dei testi scritti dall'utente", () => {
    const html = htmlDocumentoPdf(schedaPreparazione(completi(), "2026-10-19"));
    expect(html).toContain("Riparazione di biciclette &lt;e&gt; vendita di accessori.");
    expect(html).not.toContain("<e>");
  });

  it("tabelle: intestazione solo se ci sono colonne, larghezze in percentuale", () => {
    const html = htmlDocumentoPdf({
      titolo: "Prova",
      piede: "piede",
      blocchi: [
        { tipo: "tabella", colonne: [], larghezze: [1, 3], righe: [["Ditta", "Rossi Sagl"]] },
        { tipo: "tabella", colonne: ["Socio", "Quote"], larghezze: [3, 1], righe: [["Luca", "10"]] },
      ],
    });
    expect(html.match(/<thead>/g)).toHaveLength(1);
    expect(html).toContain('<col style="width:25.00%"><col style="width:75.00%">');
    expect(html).toContain('<th scope="col">Socio</th>');
    expect(html).toContain("<td>Rossi Sagl</td>");
  });

  it("la bozza dello statuto ha la fascia, gli articoli con la norma e i commi numerati", () => {
    const html = htmlDocumentoPdf(bozzaStatuto(completi(), "2026-10-19"));
    expect(html).toContain('<div class="fascia">BOZZA da far controllare al notaio - non è un documento ufficiale</div>');
    expect(html).toContain("<h3>Articolo 4 - Capitale sociale</h3>");
    expect(html).toContain('<span class="cpv">1</span> Il capitale sociale ammonta a CHF 20&#39;000.00.');
    expect(html).toContain('<span class="cpv">2</span> Esso è suddiviso in 200 quote');
    expect(html).toContain('<div class="norma">Art. 773 CO\nArt. 774 CO\nArt. 776 cifra 3 CO</div>');
    // Un articolo con un solo comma non ha il numero.
    expect(html).toContain("<h3>Articolo 2 - Sede</h3><p>La sede della società è a Bellinzona.</p>");
    expect(html).toContain('<div class="riquadro avviso"><p class="titolo">Cosa manca in questa bozza</p>');
    expect(html).toContain('<div class="riquadro nota">');
  });

  it("i margini vanno nel CSS (Android) o fuori (iPhone)", () => {
    const doc = bozzaStatuto(completi(), "2026-10-19");
    const m = MARGINI_PDF_PUNTI;
    expect(htmlDocumentoPdf(doc)).toContain(`@page { size: A4; margin: ${m.top}pt ${m.right}pt ${m.bottom}pt ${m.left}pt; }`);
    const senza = htmlDocumentoPdf(doc, { margineCss: false });
    expect(senza).toContain("@page { size: A4; }");
    expect(senza).not.toMatch(/@page \{[^}]*margin/);
  });
});
