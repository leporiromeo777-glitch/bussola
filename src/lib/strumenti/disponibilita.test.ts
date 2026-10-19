import { describe, expect, it } from "vitest";
import { leggiDisponibilita } from "./disponibilita";

describe("leggiDisponibilita", () => {
  it("legge true e false dal sito", () => {
    expect(leggiDisponibilita(200, { attiva: true })).toBe(true);
    expect(leggiDisponibilita(200, { attiva: false })).toBe(false);
  });

  it("restituisce null se non si sa", () => {
    expect(leggiDisponibilita(404, { attiva: true })).toBeNull();
    expect(leggiDisponibilita(500, null)).toBeNull();
    expect(leggiDisponibilita(200, null)).toBeNull();
    expect(leggiDisponibilita(200, { attiva: "sì" })).toBeNull();
    expect(leggiDisponibilita(200, "attiva")).toBeNull();
  });
});
