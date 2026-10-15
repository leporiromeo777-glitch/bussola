import { describe, expect, it } from "vitest";
import { frammento } from "./dati-prova";
import { leggiFrammenti, raggruppaPerFonte } from "./frammenti";

describe("leggiFrammenti", () => {
  it("accetta le righe della ricerca (anche con numeri come stringhe) e scarta quelle malformate", () => {
    const righe = [
      { ...frammento({ frammento_id: 1, fonte_id: "a" }), frammento_id: "1", punteggio: "0.3" },
      { fonte_id: "b" },
      null,
    ];
    expect(leggiFrammenti(righe)).toEqual([{ ...frammento({ frammento_id: 1, fonte_id: "a" }), punteggio: 0.3 }]);
    expect(leggiFrammenti(null)).toEqual([]);
  });
});

describe("raggruppaPerFonte", () => {
  it("tiene i migliori e li raggruppa per fonte nell'ordine del frammento migliore", () => {
    const trovati = [
      frammento({ frammento_id: 1, fonte_id: "iva", punteggio: 0.9 }),
      frammento({ frammento_id: 2, fonte_id: "avs", punteggio: 0.8 }),
      frammento({ frammento_id: 3, fonte_id: "iva", punteggio: 0.7 }),
      frammento({ frammento_id: 4, fonte_id: "rc", punteggio: 0.6 }),
      frammento({ frammento_id: 5, fonte_id: "avs", punteggio: 0.5 }),
      frammento({ frammento_id: 1, fonte_id: "iva", punteggio: 0.9 }),
    ];
    expect(raggruppaPerFonte(trovati).map((f) => f.frammento_id)).toEqual([1, 3, 2, 5, 4]);
    expect(raggruppaPerFonte(trovati, 3).map((f) => f.frammento_id)).toEqual([1, 3, 2]);
  });

  it("con nessun frammento restituisce un elenco vuoto", () => {
    expect(raggruppaPerFonte([])).toEqual([]);
  });
});
