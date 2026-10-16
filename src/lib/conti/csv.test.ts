import { describe, expect, it } from "vitest";
import { campoCsv, csvConti, importoCsv, nomeFileCsv } from "./csv";
import type { Movimento } from "./tipi";

function mov(campi: Partial<Movimento>): Movimento {
  return {
    id: "a",
    tipo: "uscita",
    data: "2026-03-10",
    importo: 10,
    descrizione: "voce",
    controparte: null,
    categoria: "materiale",
    stato: "confermato",
    origine: "manuale",
    fatturaId: null,
    documentoId: null,
    nota: null,
    ...campi,
  };
}

describe("campoCsv e importoCsv", () => {
  it("mette tra virgolette i campi con ; virgolette o a capo", () => {
    expect(campoCsv("semplice")).toBe("semplice");
    expect(campoCsv("a;b")).toBe('"a;b"');
    expect(campoCsv('Bar "Sole"')).toBe('"Bar ""Sole"""');
    expect(campoCsv("riga\r\nnuova")).toBe('"riga\nnuova"');
  });

  it("disinnesca le formule (CSV injection)", () => {
    expect(campoCsv("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(campoCsv("+41 91 000")).toBe("'+41 91 000");
    expect(campoCsv("-5")).toBe("'-5");
    expect(campoCsv("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("importi con il punto e due decimali, senza apostrofi", () => {
    expect(importoCsv(48.5)).toBe("48.50");
    expect(importoCsv(1234.05)).toBe("1234.05");
    expect(importoCsv(0)).toBe("0.00");
    expect(importoCsv(0.1 + 0.2)).toBe("0.30");
  });
});

describe("csvConti", () => {
  const csv = csvConti(
    [
      mov({ id: "3", data: "2026-05-02", descrizione: "Abbonamento; telefono", categoria: "telefono", importo: 59.9, controparte: "Swisscom" }),
      mov({
        id: "1",
        data: "2026-02-01",
        tipo: "entrata",
        categoria: "vendite",
        importo: 1200,
        origine: "fattura",
        fatturaId: "f",
        descrizione: "Fattura F-1",
      }),
      mov({ id: "4", data: "2026-01-15", stato: "da_confermare", origine: "email", documentoId: "d", descrizione: "Toner" }),
      mov({ id: "5", data: "2026-01-16", stato: "privato", descrizione: "Pizza con amici" }),
      mov({ id: "6", data: "2025-12-30", descrizione: "Anno prima" }),
    ],
    2026,
  );
  const righe = csv.slice(1).split("\r\n");

  it("inizia con il BOM UTF-8 e usa CRLF", () => {
    expect(csv.startsWith("﻿data;tipo;categoria;descrizione;controparte;importo;stato;origine;documento\r\n")).toBe(true);
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("prima i confermati per data, poi quelli da confermare; niente privati né altri anni", () => {
    expect(righe.slice(1, -1)).toEqual([
      "01.02.2026;Entrata;Vendite e lavori;Fattura F-1;;1200.00;Confermato;Fattura emessa;no",
      '02.05.2026;Uscita;Telefono e internet;"Abbonamento; telefono";Swisscom;59.90;Confermato;A mano;no',
      "15.01.2026;Uscita;Materiale e merce;Toner;;10.00;Da confermare;Email;sì",
    ]);
  });

  it("nome del file con l'anno", () => {
    expect(nomeFileCsv(2026)).toBe("bleo-conti-2026.csv");
  });
});
