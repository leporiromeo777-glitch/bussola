import { afterEach, describe, expect, it, vi } from "vitest";
import { datiTitolareIncompleti, indirizzoMancante, valoreSegnaposto } from "./sito";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("valoreSegnaposto", () => {
  it("riconosce i segnaposto tra parentesi quadre e i valori vuoti", () => {
    expect(valoreSegnaposto("[Nome e cognome del titolare]")).toBe(true);
    expect(valoreSegnaposto("  [email di contatto] ")).toBe(true);
    expect(valoreSegnaposto("")).toBe(true);
    expect(valoreSegnaposto("   ")).toBe(true);
    expect(valoreSegnaposto("Maria Esempio")).toBe(false);
  });
});

describe("datiTitolareIncompleti", () => {
  const completo = { nome: "Maria Esempio", indirizzo: "Via Esempio 1, 6900 Lugano", email: "ciao@example.ch" };

  it("è false se nome ed email sono compilati, anche senza indirizzo", () => {
    expect(datiTitolareIncompleti(completo)).toBe(false);
    expect(datiTitolareIncompleti({ ...completo, indirizzo: "" })).toBe(false);
    expect(datiTitolareIncompleti({ ...completo, nome: "[Nome e cognome del titolare]" })).toBe(true);
    expect(datiTitolareIncompleti({ ...completo, email: " " })).toBe(true);
  });
});

describe("indirizzoMancante", () => {
  it("è true finché l'indirizzo è vuoto o un segnaposto", () => {
    const completo = { nome: "Maria Esempio", indirizzo: "Via Esempio 1, 6900 Lugano", email: "ciao@example.ch" };
    expect(indirizzoMancante(completo)).toBe(false);
    expect(indirizzoMancante({ ...completo, indirizzo: "[Via e numero, NPA Località]" })).toBe(true);
    expect(indirizzoMancante({ ...completo, indirizzo: " " })).toBe(true);
  });
});

describe("sito.titolare dalle variabili d'ambiente", () => {
  it("una variabile vuota (come in .env.example) usa i valori predefiniti", async () => {
    vi.stubEnv("NEXT_PUBLIC_TITOLARE_NOME", "");
    vi.stubEnv("NEXT_PUBLIC_TITOLARE_INDIRIZZO", "  ");
    vi.stubEnv("NEXT_PUBLIC_TITOLARE_EMAIL", "");
    vi.stubEnv("NEXT_PUBLIC_SITO_URL", "");
    const { sito, titolareIncompleto, indirizzoTitolareMancante } = await import("./sito");
    // Nome ed email del titolare sono predefiniti nel codice; l'indirizzo manca ancora.
    expect(sito.titolare).toEqual({
      nome: "Romeo Lepori",
      indirizzo: "[Via e numero, NPA Località]",
      email: "romeolepori@gmail.com",
    });
    expect(sito.url).toBe("http://localhost:3000");
    expect(titolareIncompleto).toBe(false);
    expect(indirizzoTitolareMancante).toBe(true);
  });

  it("con i dati compilati il titolare è completo", async () => {
    vi.stubEnv("NEXT_PUBLIC_TITOLARE_NOME", " Maria Esempio ");
    vi.stubEnv("NEXT_PUBLIC_TITOLARE_INDIRIZZO", "Via Esempio 1, 6900 Lugano");
    vi.stubEnv("NEXT_PUBLIC_TITOLARE_EMAIL", "ciao@example.ch");
    const { sito, titolareIncompleto } = await import("./sito");
    expect(sito.titolare.nome).toBe("Maria Esempio");
    expect(titolareIncompleto).toBe(false);
  });
});
