import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leggiElenco } from "./elenco";

const voce = {
  id: "ahv-2-02-indipendenti",
  url: "https://www.ahv-iv.ch/p/2.02.i",
  titolo: "Contributi degli indipendenti",
  ente: "Centro d'informazione AVS/AI",
  livello: "federale",
  cantone: null,
  argomenti: ["avs"],
  verificato_il: "2026-10-15",
  verificato_da: "test",
};

describe("leggiElenco", () => {
  it("accetta una voce valida e mette attiva = true se manca", () => {
    const esito = leggiElenco([voce]);
    expect(esito.ok && esito.fonti[0]?.attiva).toBe(true);
  });

  it("rifiuta id non validi, URL non https, date sbagliate e campi sconosciuti", () => {
    const esito = leggiElenco([
      { ...voce, id: "Con Spazi" },
      { ...voce, id: "b", url: "http://esempio.ch" },
      { ...voce, id: "c", url: "https://c.ch", verificato_il: "15.10.2026" },
      { ...voce, id: "d", url: "https://d.ch", extra: true },
    ]);
    expect(esito.ok).toBe(false);
    if (!esito.ok) {
      expect(esito.errori.some((e) => e.startsWith("0.id"))).toBe(true);
      expect(esito.errori.some((e) => e.startsWith("1.url"))).toBe(true);
      expect(esito.errori.some((e) => e.startsWith("2.verificato_il"))).toBe(true);
      expect(esito.errori.some((e) => e.startsWith("3"))).toBe(true);
    }
  });

  it("segnala id o URL doppi e fonti federali con cantone", () => {
    const esito = leggiElenco([voce, { ...voce, url: "https://altro.ch" }, { ...voce, id: "x", cantone: "TI" }]);
    expect(esito.ok).toBe(false);
    if (!esito.ok) {
      expect(esito.errori.join("\n")).toContain("Doppione (id:ahv-2-02-indipendenti)");
      expect(esito.errori.join("\n")).toContain("Doppione (url:https://www.ahv-iv.ch/p/2.02.i)");
      expect(esito.errori.join("\n")).toContain("federale non ha cantone");
    }
  });

  it("supabase/fonti/elenco.json è valido", () => {
    const json: unknown = JSON.parse(readFileSync(new URL("../../../supabase/fonti/elenco.json", import.meta.url), "utf8"));
    const esito = leggiElenco(json);
    expect(esito.ok ? [] : esito.errori).toEqual([]);
    if (esito.ok) expect(esito.fonti.length).toBeGreaterThanOrEqual(6);
  });
});
