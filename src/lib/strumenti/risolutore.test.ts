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
