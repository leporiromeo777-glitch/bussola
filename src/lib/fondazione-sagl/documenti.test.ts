import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { creaPdf, righeDi, type Blocco, type DocumentoPdf } from "../pdf/crea-pdf";
import { datiFondazioneIniziali, type DatiFondazione } from "./dati";
import { bozzaStatuto, nomeFilePdfFondazione, PASSI_CHECK_LIST, schedaPreparazione } from "./documenti";

function completi(): DatiFondazione {
  const d = datiFondazioneIniziali();
  return {
    ...d,
    ditta: "Rossi & Bianchi Sagl",
    sede: "Bellinzona",
    scopo: "Riparazione di biciclette e vendita di accessori.",
    banca: "Banca dello Stato",
    soci: [
      { ...d.soci[0], nome: "Luca Rossi", domicilio: "Bellinzona", quote: 150 },
      { ...d.soci[1], nome: "Sara Bianchi", domicilio: "Giubiasco", quote: 50, inNatura: true },
    ],
  };
}

/** Tutto il testo del documento, per cercarci dentro. */
function testo(doc: DocumentoPdf): string {
  const parti = (b: Blocco): string[] => {
    switch (b.tipo) {
      case "elenco":
        return [...b.voci];
      case "tabella":
        return [...b.colonne, ...b.righe.flat()];
      case "articolo":
        return [b.titolo, ...b.commi, b.norma];
      case "riquadro":
        return [b.titolo ?? "", b.testo];
      default:
        return [b.testo];
    }
  };
  return [doc.fascia ?? "", ...doc.blocchi.flatMap(parti), doc.piede].join("\n");
}

describe("scheda di preparazione", () => {
  const scheda = schedaPreparazione(completi(), "2026-10-17");
  const t = testo(scheda);

  it("contiene i dati, le quote in CHF e la data in formato svizzero", () => {
    expect(t).toContain("Rossi & Bianchi Sagl");
    expect(t).toContain("CHF 15'000.00");
    expect(t).toContain("CHF 5'000.00");
    expect(t).toContain("in natura");
    expect(t).toContain("17.10.2026");
  });

  it("riporta gli avvisi (conferimento in natura) e i passi della check list", () => {
    expect(t).toContain("conferimento in natura");
    for (const passo of PASSI_CHECK_LIST) expect(t).toContain(passo);
  });

  it("cita le fonti ufficiali con il link e dice che non è una consulenza", () => {
    expect(t).toContain("https://www.kmu.admin.ch/it/check-list-creare-una-ditta-individuale-una-sagl-o-una-sa");
    expect(t).toContain("art_809");
    expect(t).toContain("non una consulenza");
  });
});

describe("bozza dello statuto", () => {
  it("ha la fascia BOZZA, il contenuto obbligatorio e la norma di ogni articolo", () => {
    const bozza = bozzaStatuto(completi(), "2026-10-17");
    const t = testo(bozza);
    expect(bozza.fascia).toContain("BOZZA");
    expect(t).toContain("Sotto la ditta Rossi & Bianchi Sagl esiste una società a garanzia limitata");
    expect(t).toContain("La sede della società è a Bellinzona.");
    expect(t).toContain("Il capitale sociale ammonta a CHF 20'000.00.");
    expect(t).toContain("200 quote sociali con un valore nominale di CHF 100.00 ciascuna");
    expect(t).toContain("I soci esercitano in comune la gestione della società.");
    for (const n of ["Art. 776 cifra 1 CO", "Art. 776 cifra 2 CO", "Art. 776 cifra 3 CO", "Art. 776 cifra 4 CO"]) expect(t).toContain(n);
  });

  it("con i gerenti, la gestione è affidata a loro", () => {
    const t = testo(bozzaStatuto({ ...completi(), direzione: "gerenti" }, "2026-10-17"));
    expect(t).toContain("affidata a uno o più gerenti, nominati dall'assemblea dei soci");
  });

  it("i campi vuoti restano tra parentesi quadre, da completare", () => {
    const t = testo(bozzaStatuto(datiFondazioneIniziali(), "2026-10-17"));
    expect(t).toContain("[ditta] Sagl");
    expect(t).toContain("[Comune]");
  });
});

describe("PDF", () => {
  it("scheda e bozza diventano PDF validi, con il titolo nei metadati", async () => {
    for (const doc of [schedaPreparazione(completi(), "2026-10-17"), bozzaStatuto(completi(), "2026-10-17")]) {
      const byte = await creaPdf(doc);
      expect(new TextDecoder().decode(byte.slice(0, 5))).toBe("%PDF-");
      const letto = await PDFDocument.load(byte);
      expect(letto.getPageCount()).toBeGreaterThanOrEqual(1);
      expect(letto.getTitle()).toBe(doc.titolo);
    }
  });

  it("i simboli che Helvetica non conosce non rompono il PDF", async () => {
    const byte = await creaPdf({ titolo: "Prova", blocchi: [{ tipo: "paragrafo", testo: "Freccia → e emoji 🚲 e «virgolette» àèìòù" }], piede: "piede" });
    expect(byte.length).toBeGreaterThan(500);
  });

  it("gli a capo restano a capo", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    expect(righeDi("Art. 773 CO\nArt. 774 CO", font, 9, 200)).toEqual(["Art. 773 CO", "Art. 774 CO"]);
  });

  it("un testo lungo va su più pagine", async () => {
    const lungo = Array.from({ length: 120 }, (_, i) => `Riga numero ${i + 1} di un elenco molto lungo.`);
    const byte = await creaPdf({ titolo: "Lungo", blocchi: [{ tipo: "elenco", voci: lungo, numerato: true }], piede: "piede" });
    expect((await PDFDocument.load(byte)).getPageCount()).toBeGreaterThan(1);
  });
});

describe("nomeFilePdfFondazione", () => {
  it("usa la ditta in minuscolo, senza accenti né simboli", () => {
    expect(nomeFilePdfFondazione("scheda", "Rossi & Bianchi Sagl")).toBe("scheda-fondazione-rossi-bianchi-sagl.pdf");
    expect(nomeFilePdfFondazione("statuto", "Caffè Già Sàrl")).toBe("bozza-statuto-caffe-gia-sarl.pdf");
  });

  it("senza ditta il file si chiama «sagl»", () => {
    expect(nomeFilePdfFondazione("scheda", "  ")).toBe("scheda-fondazione-sagl.pdf");
    expect(nomeFilePdfFondazione("statuto", "«»")).toBe("bozza-statuto-sagl.pdf");
  });
});
