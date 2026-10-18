import { describe, expect, it } from "vitest";
import { calcolaRiga } from "@/lib/strumenti/documenti";
import { leggiNumero } from "@/lib/strumenti/numeri";
import {
  clientiInOrdine,
  durata,
  importoOre,
  inMinuti,
  intervalloMese,
  meseDi,
  meseValido,
  mesiDaFatturare,
  nomeMese,
  oreDecimali,
  oreEMinuti,
  oreInFattura,
  oreInFatturaEsatte,
  prezzoTesto,
  quantitaOre,
  riepilogoMese,
  spostaMese,
  tariffaVoce,
} from "./ore";
import type { Cliente, VoceOre } from "./tipi";

const cliente = (id: string, nome: string, tariffa: number | null = 120): Cliente => ({
  id,
  nome,
  via: "Via Nassa",
  numero: "5",
  npa: "6900",
  localita: "Lugano",
  paese: "CH",
  email: null,
  tariffa,
});

let contatore = 0;
const voce = (campi: Partial<VoceOre> = {}): VoceOre => ({
  id: `v${++contatore}`,
  clienteId: "a",
  data: "2026-10-15",
  minuti: 60,
  descrizione: "Sviluppo del sito",
  tariffa: null,
  fatturataIl: null,
  ...campi,
});

describe("durate", () => {
  it("ore e minuti diventano minuti, e ritorno", () => {
    expect(inMinuti(1, 20)).toBe(80);
    expect(inMinuti(0, 45)).toBe(45);
    expect(inMinuti(1, 60)).toBeNull();
    expect(inMinuti(-1, 0)).toBeNull();
    expect(inMinuti(1.5, 0)).toBeNull();
    expect(oreEMinuti(80)).toEqual({ ore: 1, minuti: 20 });
  });

  it("scrive la durata come si legge", () => {
    expect(durata(80)).toBe("1 h 20 min");
    expect(durata(45)).toBe("45 min");
    expect(durata(120)).toBe("2 h");
    expect(durata(0)).toBe("0 min");
    expect(durata(1250 * 60 + 5)).toBe("1'250 h 5 min");
  });

  it("in fattura le ore hanno due decimali (centesimi d'ora)", () => {
    expect(oreInFattura(80)).toBe(1.33);
    expect(oreInFattura(90)).toBe(1.5);
    expect(oreInFattura(50)).toBe(0.83);
    expect(oreDecimali(45)).toBe("0.75 h");
  });

  it("riconosce quando le ore in fattura sono esatte (minuti multipli di 3)", () => {
    expect([15, 30, 45, 60, 90, 6, 3].every(oreInFatturaEsatte)).toBe(true);
    expect([10, 20, 40, 50, 80, 1].some(oreInFatturaEsatte)).toBe(false);
    for (let minuti = 1; minuti <= 600; minuti++) expect(oreInFatturaEsatte(minuti)).toBe(minuti % 3 === 0);
  });

  it("la quantità per lo strumento fattura non ha mai tre decimali né separatori", () => {
    for (let minuti = 1; minuti <= 1440 * 3; minuti++) {
      const testo = quantitaOre(minuti);
      expect(testo).toMatch(/^\d+(\.\d{1,2})?$/);
      // Lo strumento la rilegge uguale (1.500 sarebbe millecinquecento).
      expect(leggiNumero(testo)).toBe(oreInFattura(minuti));
    }
  });

  it("il prezzo per lo strumento ha sempre due decimali", () => {
    expect(prezzoTesto(120)).toBe("120.00");
    expect(prezzoTesto(92.5)).toBe("92.50");
    expect(prezzoTesto(1250)).toBe("1250.00");
    expect(prezzoTesto(null)).toBe("");
    expect(leggiNumero(prezzoTesto(1250))).toBe(1250);
  });
});

describe("importi", () => {
  it("ore × tariffa arrotondato al centesimo, come una riga dello strumento fattura", () => {
    expect(importoOre(80, 120)).toBe(159.6);
    expect(importoOre(90, 80)).toBe(120);
    expect(importoOre(20, 95)).toBe(31.35);
    expect(importoOre(60, null)).toBeNull();
    for (const [minuti, tariffa] of [
      [7, 33.33],
      [125, 87.5],
      [1440, 10_000],
      [1, 0.05],
    ] as const) {
      const riga = calcolaRiga({
        id: "r",
        descrizione: "x",
        quantita: quantitaOre(minuti),
        unita: "h",
        prezzo: prezzoTesto(tariffa),
        aliquota: "normale",
      });
      expect(importoOre(minuti, tariffa)).toBe(riga.importo);
    }
  });

  it("vale la tariffa della voce, poi quella del cliente", () => {
    expect(tariffaVoce({ tariffa: 90 }, { tariffa: 120 })).toBe(90);
    expect(tariffaVoce({ tariffa: null }, { tariffa: 120 })).toBe(120);
    expect(tariffaVoce({ tariffa: 0 }, { tariffa: 120 })).toBe(0);
    expect(tariffaVoce({ tariffa: null }, { tariffa: null })).toBeNull();
    expect(tariffaVoce({ tariffa: null }, undefined)).toBeNull();
  });
});

describe("mesi", () => {
  it("riconosce i mesi validi", () => {
    expect(meseValido("2026-10")).toBe(true);
    for (const v of ["2026-13", "2026-00", "26-10", "2026-1", "1999-12", 202610, null]) expect(meseValido(v)).toBe(false);
  });

  it("primo e ultimo giorno, anche a febbraio e negli anni bisestili", () => {
    expect(intervalloMese("2026-10")).toEqual({ inizio: "2026-10-01", fine: "2026-10-31" });
    expect(intervalloMese("2026-02")).toEqual({ inizio: "2026-02-01", fine: "2026-02-28" });
    expect(intervalloMese("2028-02")).toEqual({ inizio: "2028-02-01", fine: "2028-02-29" });
  });

  it("si sposta di mese in mese, anche a cavallo dell'anno", () => {
    expect(spostaMese("2026-01", -1)).toBe("2025-12");
    expect(spostaMese("2026-12", 1)).toBe("2027-01");
    expect(spostaMese("2026-10", 0)).toBe("2026-10");
    expect(spostaMese("2026-10", -22)).toBe("2024-12");
  });

  it("nome del mese in italiano e mese di una data", () => {
    expect(nomeMese("2026-10")).toBe("ottobre 2026");
    expect(nomeMese("2027-01")).toBe("gennaio 2027");
    expect(meseDi("2026-10-19")).toBe("2026-10");
  });

  it("raggruppa le ore da fatturare per mese, dal più recente", () => {
    expect(
      mesiDaFatturare([
        { data: "2026-09-30", minuti: 30 },
        { data: "2026-10-01", minuti: 60 },
        { data: "2026-09-02", minuti: 90 },
      ]),
    ).toEqual([
      { mese: "2026-10", minuti: 60 },
      { mese: "2026-09", minuti: 120 },
    ]);
    expect(mesiDaFatturare([])).toEqual([]);
  });
});

describe("riepilogoMese", () => {
  const rossi = cliente("a", "Rossi SA", 120);
  const bianchi = cliente("b", "bianchi giardini", null);
  const senzaOre = cliente("c", "Nessuna ora");

  it("raggruppa per cliente in ordine di nome, con ore, importi e quanto resta da fatturare", () => {
    const voci = [
      voce({ clienteId: "a", data: "2026-10-02", minuti: 80 }),
      voce({ clienteId: "a", data: "2026-10-20", minuti: 30, tariffa: 100, fatturataIl: "2026-10-31" }),
      voce({ clienteId: "b", data: "2026-10-05", minuti: 120 }),
      voce({ clienteId: "b", data: "2026-10-06", minuti: 60, tariffa: 50 }),
      voce({ clienteId: "zz", data: "2026-10-06", minuti: 600 }),
    ];
    const r = riepilogoMese(voci, [rossi, bianchi, senzaOre]);
    expect(r.gruppi.map((g) => g.cliente.nome)).toEqual(["bianchi giardini", "Rossi SA"]);

    const [b, a] = r.gruppi;
    expect(a.voci.map((v) => v.data)).toEqual(["2026-10-20", "2026-10-02"]);
    expect(a.totale).toEqual({ voci: 2, minuti: 110, importo: 209.6, senzaTariffa: 0 });
    expect(a.daFatturare).toEqual({ voci: 1, minuti: 80, importo: 159.6, senzaTariffa: 0 });
    expect(a.fatturateIl).toEqual(["2026-10-31"]);

    expect(b.totale).toEqual({ voci: 2, minuti: 180, importo: 50, senzaTariffa: 1 });
    expect(b.fatturateIl).toEqual([]);

    expect(r.totale).toEqual({ voci: 4, minuti: 290, importo: 259.6, senzaTariffa: 1 });
    expect(r.daFatturare).toEqual({ voci: 3, minuti: 260, importo: 209.6, senzaTariffa: 1 });
  });

  it("le somme non accumulano errori di arrotondamento", () => {
    const voci = Array.from({ length: 30 }, () => voce({ clienteId: "a", minuti: 20, tariffa: 0.1 }));
    const r = riepilogoMese(voci, [rossi]);
    // 0.33 h × 0.10 = 0.033 → 0.03 per voce.
    expect(r.totale.importo).toBe(0.9);
  });

  it("senza voci non c'è nessun gruppo", () => {
    expect(riepilogoMese([], [rossi])).toEqual({
      gruppi: [],
      totale: { voci: 0, minuti: 0, importo: 0, senzaTariffa: 0 },
      daFatturare: { voci: 0, minuti: 0, importo: 0, senzaTariffa: 0 },
    });
  });

  it("clienti in ordine di nome senza badare alle maiuscole", () => {
    expect(clientiInOrdine([rossi, bianchi, senzaOre]).map((c) => c.nome)).toEqual([
      "bianchi giardini",
      "Nessuna ora",
      "Rossi SA",
    ]);
  });
});
