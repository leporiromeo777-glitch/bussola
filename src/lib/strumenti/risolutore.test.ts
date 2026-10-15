import { describe, expect, it } from "vitest";
import { minimoInCentesimi, minimoPerObiettivo } from "./risolutore";

// Funzione a tratti: crescente, con un calo di 10 a x = 100 (come un cambio di fascia).
const conSalto = (x: number) => (x < 100 ? x : x - 10);

describe("minimoPerObiettivo", () => {
  it("funzione continua: trova la radice", () => {
    const x = minimoPerObiettivo((v) => v * 0.9, 45, []);
    expect(x).toBeCloseTo(50, 2);
  });

  it("con un calo: prende la soluzione più bassa", () => {
    // Obiettivo 95: vale sia x≈95 (prima del salto) sia x≈105 (dopo). Serve 95.
    expect(minimoPerObiettivo(conSalto, 95, [100])).toBeCloseTo(95, 2);
  });

  it("obiettivo raggiunto solo dopo il salto", () => {
    expect(minimoPerObiettivo(conSalto, 99.995, [100])).toBeCloseTo(109.995, 2);
  });

  it("obiettivo già soddisfatto all'inizio di un tratto", () => {
    expect(minimoPerObiettivo((v) => (v < 100 ? 0 : 500), 200, [100])).toBe(100);
  });

  it("obiettivo irraggiungibile", () => {
    expect(minimoPerObiettivo(() => 0, 1, [], { massimo: 1000 })).toBeNull();
  });

  it("parte da `da`", () => {
    expect(minimoPerObiettivo((v) => v, 10, [], { da: 50 })).toBe(50);
  });
});

describe("minimoInCentesimi", () => {
  it("arrotonda al centesimo per eccesso e verifica", () => {
    const f = (v: number) => Math.round(v * 0.9 * 100) / 100;
    const x = minimoInCentesimi(f, 45.01, [])!;
    expect(f(x)).toBeGreaterThanOrEqual(45.01);
    expect(f(Math.round(x * 100 - 1) / 100)).toBeLessThan(45.01);
  });

  it("con un calo resta sotto il salto", () => {
    expect(minimoInCentesimi(conSalto, 95, [100])).toBe(95);
  });
});

describe("con blocchi (reddito arrotondato ai 100 franchi)", () => {
  // Come il netto della tariffa: x meno l'11,2% di x arrotondato ai 100 inferiori.
  // Dentro ogni blocco cresce, all'inizio del blocco dopo cala di 11.20.
  const denteDiSega = (x: number) => Math.round((x - 0.112 * Math.floor(x / 100) * 100) * 100) / 100;

  it("trova il primo blocco in cui l'obiettivo è raggiungibile", () => {
    for (let obiettivo = 50; obiettivo < 20_000; obiettivo += 37.37) {
      const x = minimoInCentesimi(denteDiSega, obiettivo, [], { blocco: 100, massimo: 1e6 })!;
      expect(denteDiSega(x)).toBeGreaterThanOrEqual(obiettivo);
      expect(denteDiSega(Math.round(x * 100 - 1) / 100)).toBeLessThan(obiettivo);
      for (let k = 0; (k + 1) * 100 <= x; k++) expect(denteDiSega(k * 100 + 99.99)).toBeLessThan(obiettivo);
    }
  });

  it("a cavallo di un blocco: l'inizio del blocco se basta", () => {
    // denteDiSega(199.99) = 188.79, denteDiSega(200) = 177.6: obiettivo 188.79 → 199.99.
    expect(minimoInCentesimi(denteDiSega, 188.79, [], { blocco: 100 })).toBe(199.99);
    // Obiettivo 188.80: nel blocco 100-199 non basta; nel blocco dopo serve 211.20.
    expect(minimoInCentesimi(denteDiSega, 188.8, [], { blocco: 100 })).toBe(211.2);
  });

  it("rispetta i punti di salto e `da`", () => {
    const conSaltoEBlocchi = (x: number) => (x < 1_000 ? denteDiSega(x) : denteDiSega(x) - 50);
    const x = minimoInCentesimi(conSaltoEBlocchi, 870, [1_000], { blocco: 100 })!;
    expect(conSaltoEBlocchi(x)).toBeGreaterThanOrEqual(870);
    for (let k = 0; (k + 1) * 100 <= x; k++) expect(conSaltoEBlocchi(k * 100 + 99.99)).toBeLessThan(870);
    expect(minimoPerObiettivo(denteDiSega, 10, [], { blocco: 100, da: 250 })).toBe(250);
  });
});
