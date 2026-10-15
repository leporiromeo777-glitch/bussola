import { describe, expect, it } from "vitest";
import {
  articoloNumero,
  arrotonda,
  arrotonda5Centesimi,
  arrotondaPerEccesso,
  daCentesimi,
  importo,
  inCentesimi,
  leggiNumero,
  limita,
  numeroBreve,
  numeroSvizzero,
} from "./numeri";

describe("leggiNumero", () => {
  it.each([
    ["1200", 1200],
    ["1'200", 1200],
    ["1’200", 1200],
    ["1 200", 1200],
    ["1'200.50", 1200.5],
    ["1200,50", 1200.5],
    ["1.200,50", 1200.5],
    ["1,200.50", 1200.5],
    ["1.200.000", 1_200_000],
    ["CHF 80", 80],
    ["8,1%", 8.1],
    [".5", 0.5],
    ["-250", -250],
    ["−250", -250],
    ["  42  ", 42],
    ["0", 0],
    // Migliaia all'italiana con un solo punto.
    ["1.500", 1500],
    ["60.000", 60_000],
    ["-2.000", -2000],
    ["CHF 2.000", 2000],
    // Decimali veri: restano decimali.
    ["0.125", 0.125],
    ["1.50", 1.5],
    ["12.5", 12.5],
    ["1500.50", 1500.5],
    ["1500,50", 1500.5],
    ["1'500", 1500],
    ["1 500", 1500],
    ["1\u00a0500", 1500],
    ["1\u202f500", 1500],
  ])("legge %s come %s", (testo, atteso) => {
    expect(leggiNumero(testo)).toBe(atteso);
  });

  it.each(["", "   ", "abc", "1,2,3", "12a", "1.2.3", "-", "1e5", null, undefined])(
    "restituisce null per %s",
    (testo) => {
      expect(leggiNumero(testo as string)).toBeNull();
    },
  );
});

describe("arrotondamenti", () => {
  it("arrotonda senza errori di virgola mobile", () => {
    expect(arrotonda(1.005, 2)).toBe(1.01);
    expect(arrotonda(2691.2000000000003, 2)).toBe(2691.2);
    expect(arrotonda(-1.005, 2)).toBe(-1.01);
    expect(arrotonda(53.824, 2)).toBe(53.82);
    expect(arrotonda(0.000001, 2)).toBe(0);
    expect(arrotonda(1e21, 2)).toBe(1e21);
  });

  it("centesimi interi", () => {
    expect(inCentesimi(19.99)).toBe(1999);
    expect(inCentesimi(0.1 + 0.2)).toBe(30);
    expect(daCentesimi(1999)).toBe(19.99);
  });

  it("arrotondamento ai 5 centesimi", () => {
    expect(arrotonda5Centesimi(10.02)).toBe(10);
    expect(arrotonda5Centesimi(10.025)).toBe(10.05);
    expect(arrotonda5Centesimi(10.03)).toBe(10.05);
    expect(arrotonda5Centesimi(10.07)).toBe(10.05);
    expect(arrotonda5Centesimi(10.08)).toBe(10.1);
    expect(arrotonda5Centesimi(1081.0)).toBe(1081);
    expect(arrotonda5Centesimi(-10.03)).toBe(-10.05);
  });

  it("per eccesso", () => {
    expect(arrotondaPerEccesso(78.01)).toBe(79);
    expect(arrotondaPerEccesso(78)).toBe(78);
    expect(arrotondaPerEccesso(78.000000001)).toBe(78);
    expect(arrotondaPerEccesso(12.01, 0.05)).toBe(12.05);
  });

  it("limita", () => {
    expect(limita(5, 0, 3)).toBe(3);
    expect(limita(-1, 0, 3)).toBe(0);
  });
});

describe("formato svizzero", () => {
  it("numeroSvizzero", () => {
    expect(numeroSvizzero(1234567.891, 2)).toBe("1'234'567.89");
    expect(numeroSvizzero(999)).toBe("999");
    expect(numeroSvizzero(-1500)).toBe("-1'500");
    expect(numeroSvizzero(1.005, 2)).toBe("1.01");
  });
  it("importo", () => {
    expect(importo(2691.2)).toBe("CHF 2'691.20");
    expect(importo(100_000, 0)).toBe("CHF 100'000");
    expect(importo(-12.5)).toBe("-CHF 12.50");
    expect(importo(10, 2, "EUR")).toBe("EUR 10.00");
  });
});

describe("numeroBreve", () => {
  it("toglie gli zeri inutili e usa la virgola", () => {
    expect(numeroBreve(45)).toBe("45");
    expect(numeroBreve(45.0)).toBe("45");
    expect(numeroBreve(7.5)).toBe("7,5");
    expect(numeroBreve(1125)).toBe("1'125");
    expect(numeroBreve(43.6)).toBe("43,6");
    expect(numeroBreve(15.25, 2)).toBe("15,25");
    expect(numeroBreve(15.2, 2)).toBe("15,2");
    expect(numeroBreve(100, 2)).toBe("100");
  });
});

describe("articoloNumero", () => {
  it.each([
    ["8,3%", "l'"],
    ["11,2%", "l'"],
    ["1,5%", "l'"],
    ["80%", "l'"],
    ["0,5%", "lo "],
    ["10%", "il "],
    ["9,4%", "il "],
    ["18%", "il "],
    ["111%", "il "],
  ])("%s → %s", (testo, atteso) => expect(articoloNumero(testo)).toBe(atteso));
});
