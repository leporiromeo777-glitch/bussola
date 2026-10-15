import { describe, expect, it } from "vitest";
import type { Blocco } from "./blocchi";
import { dividiInFrammenti, spezza } from "./frammenti";

const paragrafo = (lunghezza: number, lettera = "a"): Blocco => ({
  tipo: "paragrafo",
  testo: `${lettera.repeat(lunghezza - 1)}.`,
});
const titolo = (testo: string, livello = 2): Blocco => ({ tipo: "titolo", livello, testo });

describe("dividiInFrammenti", () => {
  it("chiude un frammento a ogni titolo e ricorda il titolo della sezione", () => {
    const frammenti = dividiInFrammenti([
      titolo("Ditta individuale", 1),
      titolo("Vantaggi"),
      paragrafo(600, "v"),
      titolo("Svantaggi"),
      paragrafo(700, "s"),
    ]);
    expect(frammenti.map((f) => [f.posizione, f.titolo_sezione, f.testo.length])).toEqual([
      [1, "Vantaggi", 600],
      [2, "Svantaggi", 700],
    ]);
  });

  it("senza titoli il primo frammento non ha sezione", () => {
    expect(dividiInFrammenti([paragrafo(500)])).toEqual([{ posizione: 1, titolo_sezione: null, testo: paragrafo(500).testo }]);
  });

  it("unisce paragrafi fino a circa 1'000 caratteri e non supera i 1'500", () => {
    const blocchi = Array.from({ length: 10 }, () => paragrafo(400));
    const frammenti = dividiInFrammenti([titolo("Contributi"), ...blocchi]);
    expect(frammenti.length).toBeGreaterThan(1);
    for (const f of frammenti) {
      expect(f.testo.length).toBeLessThanOrEqual(1_500);
      expect(f.titolo_sezione).toBe("Contributi");
    }
    expect(frammenti[0]?.testo.length).toBeGreaterThanOrEqual(1_000);
  });

  it("una sezione molto corta continua nella successiva, con il titolo dentro il testo", () => {
    const frammenti = dividiInFrammenti([titolo("Natura giuridica"), paragrafo(80, "n"), titolo("Nome"), paragrafo(300, "x")]);
    expect(frammenti).toHaveLength(1);
    expect(frammenti[0]?.titolo_sezione).toBe("Natura giuridica");
    expect(frammenti[0]?.testo).toContain("\nNome\n");
  });

  it("i punti degli elenchi diventano righe con il trattino", () => {
    const frammenti = dividiInFrammenti([
      { tipo: "paragrafo", testo: "Servono:" },
      { tipo: "punto", testo: "un documento d'identità" },
      { tipo: "punto", testo: "la firma autenticata" },
    ]);
    expect(frammenti[0]?.testo).toBe("Servono:\n- un documento d'identità\n- la firma autenticata");
  });

  it("divide per frasi un paragrafo più lungo del massimo", () => {
    const frase = `Parola ${"parola ".repeat(39).trim()}.`; // ~280 caratteri
    const lungo: Blocco = { tipo: "paragrafo", testo: Array.from({ length: 12 }, () => frase).join(" ") };
    const frammenti = dividiInFrammenti([lungo]);
    expect(frammenti.length).toBeGreaterThan(2);
    for (const f of frammenti) {
      expect(f.testo.length).toBeLessThanOrEqual(1_500);
      expect(f.testo.endsWith(".")).toBe(true);
    }
  });
});

describe("spezza", () => {
  it("lascia intatto un testo corto", () => {
    expect(spezza("Breve.", 100)).toEqual(["Breve."]);
  });

  it("taglia sugli spazi una frase senza punti", () => {
    const pezzi = spezza("abc ".repeat(100).trim(), 50);
    expect(pezzi.every((p) => p.length <= 50)).toBe(true);
    expect(pezzi.join(" ")).toBe("abc ".repeat(100).trim());
  });
});
