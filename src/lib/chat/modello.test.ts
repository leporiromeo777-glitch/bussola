import { describe, expect, it } from "vitest";
import { MODELLO_PREDEFINITO, scegliModello, supportaFallback } from "./modello";

describe("scegliModello", () => {
  it("usa claude-opus-5-5 se la variabile manca o è vuota", () => {
    expect(MODELLO_PREDEFINITO).toBe("claude-opus-5-5");
    expect(scegliModello(undefined)).toBe("claude-opus-5-5");
    expect(scegliModello("  ")).toBe("claude-opus-5-5");
    expect(scegliModello(" claude-sonnet-5-5 ")).toBe("claude-sonnet-5-5");
  });
});

describe("supportaFallback", () => {
  it("vale per i modelli che accettano fallbacks: \"default\"", () => {
    for (const modello of ["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]) {
      expect(supportaFallback(modello)).toBe(true);
    }
  });

  it("non vale per gli altri modelli", () => {
    for (const modello of ["claude-haiku-5-5", "claude-sonnet-5", "claude-opus-4-8", "claude-opus-50"]) {
      expect(supportaFallback(modello)).toBe(false);
    }
  });
});
