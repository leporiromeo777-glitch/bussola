import { describe, expect, it } from "vitest";
import { TITOLO_MASSIMO, raggruppaChat, titoloDaDomanda, type ConversazioneBreve } from "./conversazioni";

describe("titoloDaDomanda", () => {
  it("usa la domanda intera se è corta, senza spazi doppi né a capo", () => {
    expect(titoloDaDomanda("  Quanto pago   di AVS\ncome indipendente? ")).toBe("Quanto pago di AVS come indipendente?");
  });

  it("una domanda vuota diventa «Nuova chat»", () => {
    expect(titoloDaDomanda("   \n ")).toBe("Nuova chat");
  });

  it("accorcia le domande lunghe a una parola intera, con i puntini", () => {
    const domanda =
      "Faccio siti web e penso di fatturare 30'000 franchi: devo iscrivermi al registro di commercio?";
    const titolo = titoloDaDomanda(domanda);
    expect(titolo.length).toBeLessThanOrEqual(TITOLO_MASSIMO);
    expect(titolo.endsWith("…")).toBe(true);
    expect(titolo).toBe("Faccio siti web e penso di fatturare 30'000 franchi: devo…");
    expect(domanda.startsWith(titolo.slice(0, -1))).toBe(true);
  });

  it("taglia a metà parola solo se la prima parola è lunghissima", () => {
    const titolo = titoloDaDomanda(`${"a".repeat(40)} ${"b".repeat(40)}`);
    expect(titolo).toBe(`${"a".repeat(40)}…`);
    const unaParola = titoloDaDomanda("x".repeat(100));
    expect(unaParola).toBe(`${"x".repeat(TITOLO_MASSIMO - 1)}…`);
    expect(unaParola).toHaveLength(TITOLO_MASSIMO);
  });

  it("tiene esattamente TITOLO_MASSIMO caratteri senza puntini", () => {
    const domanda = "y".repeat(TITOLO_MASSIMO);
    expect(titoloDaDomanda(domanda)).toBe(domanda);
  });
});

describe("raggruppaChat", () => {
  // Ore locali di chi guarda: il test vale in qualunque fuso orario.
  const alle = (giorno: number, ora = 10, mese = 10) => new Date(2026, mese - 1, giorno, ora).toISOString();
  const chat = (id: string, aggiornataIl: string): ConversazioneBreve => ({ id, titolo: `Chat ${id}`, aggiornataIl });
  const OGGI = "2026-10-16";

  it("divide le chat per data, dalla più recente, e salta i gruppi vuoti", () => {
    const gruppi = raggruppaChat(
      [
        chat("prima", alle(1, 10, 9)),
        chat("oggi-mattina", alle(16, 0)),
        chat("ieri", alle(15, 23)),
        chat("settimana", alle(10)),
        chat("oggi-sera", alle(16, 21)),
        chat("mese", alle(20, 10, 9)),
      ],
      OGGI,
    );
    expect(gruppi.map((g) => [g.gruppo, g.chat.map((c) => c.id)])).toEqual([
      ["Oggi", ["oggi-sera", "oggi-mattina"]],
      ["Ieri", ["ieri"]],
      ["Ultimi 7 giorni", ["settimana"]],
      ["Ultimi 30 giorni", ["mese"]],
      ["Prima", ["prima"]],
    ]);
  });

  it("i limiti: mezzanotte è già oggi, 7 e 30 giorni pieni", () => {
    const gruppi = raggruppaChat(
      [
        chat("mezzanotte", new Date(2026, 9, 16, 0, 0, 0).toISOString()),
        chat("ieri-mezzanotte", new Date(2026, 9, 15, 0, 0, 0).toISOString()),
        chat("sette", new Date(2026, 9, 9, 0, 0, 0).toISOString()),
        chat("trenta", new Date(2026, 8, 16, 0, 0, 0).toISOString()),
        chat("trentuno", new Date(2026, 8, 15, 23, 59).toISOString()),
      ],
      OGGI,
    );
    expect(Object.fromEntries(gruppi.map((g) => [g.gruppo, g.chat.map((c) => c.id)]))).toEqual({
      Oggi: ["mezzanotte"],
      Ieri: ["ieri-mezzanotte"],
      "Ultimi 7 giorni": ["sette"],
      "Ultimi 30 giorni": ["trenta"],
      Prima: ["trentuno"],
    });
  });

  it("un elenco vuoto non ha gruppi e l'elenco dato non cambia", () => {
    expect(raggruppaChat([], OGGI)).toEqual([]);
    const elenco = [chat("a", alle(1)), chat("b", alle(16))];
    raggruppaChat(elenco, OGGI);
    expect(elenco.map((c) => c.id)).toEqual(["a", "b"]);
  });
});
