import { describe, expect, it } from "vitest";
import { DOMANDE } from "./domande";
import { VOCI_RACCONTO, vociToccate } from "./racconto-checklist";

describe("checklist di «Racconta a Bleo»", () => {
  it("ha una voce per ogni domanda del questionario", () => {
    expect(VOCI_RACCONTO.map((v) => v.id).sort()).toEqual(DOMANDE.map((d) => d.id).sort());
  });

  it("testo vuoto: niente spuntato", () => {
    expect(vociToccate("").size).toBe(0);
  });

  it("riconosce un racconto completo", () => {
    const testo =
      "Voglio fare il fotografo per matrimoni a Lugano, da solo. Lavoro già al 60% come impiegato e sono svizzero. " +
      "Penso di incassare circa 20'000 franchi il primo anno, con clienti privati. Non ho ancora iniziato, lavoro da casa e non vendo online.";
    expect(vociToccate(testo)).toEqual(new Set(VOCI_RACCONTO.map((v) => v.id)));
  });

  it("ignora maiuscole e accenti", () => {
    const t = vociToccate("HO GIÀ I PRIMI CLIENTI A BELLINZONA");
    expect(t.has("avviata")).toBe(true);
    expect(t.has("cantone")).toBe(true);
    expect(t.has("clienti")).toBe(true);
  });

  it("non spunta il Cantone per parole che lo contengono", () => {
    expect(vociToccate("faccio torte buonissime").has("cantone")).toBe(false);
  });

  it("le prime quattro voci sono le importanti", () => {
    expect(VOCI_RACCONTO.filter((v) => v.importante).map((v) => v.id)).toEqual(["attivita", "cantone", "soci", "impiego"]);
  });
});
