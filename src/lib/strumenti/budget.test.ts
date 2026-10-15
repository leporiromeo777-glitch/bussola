import { describe, expect, it } from "vitest";
import { tasseRegistroCommercio } from "@/data/svizzera";
import { stimaContributi } from "./avs";
import {
  annoAvsPerPeriodo,
  calcolaBudget,
  datiBudgetIniziali,
  meseSuccessivo,
  mesiDaInizio,
  nomeMese,
  schemaDatiBudget,
  type DatiBudget,
} from "./budget";

function dati(modifiche: Partial<DatiBudget> = {}): DatiBudget {
  return { ...datiBudgetIniziali("2026-12-10"), ...modifiche };
}

const tutti = (valore: string) => Array.from({ length: 12 }, () => valore);

describe("calendario", () => {
  it("meseSuccessivo", () => {
    expect(meseSuccessivo("2026-10-15")).toBe("2026-11");
    expect(meseSuccessivo("2026-12-31")).toBe("2027-01");
  });

  it("12 mesi a cavallo dell'anno", () => {
    const mesi = mesiDaInizio("2026-11");
    expect(mesi).toHaveLength(12);
    expect(mesi[0]).toEqual({ anno: 2026, mese: 11, etichetta: "nov 2026" });
    expect(mesi[2]).toEqual({ anno: 2027, mese: 1, etichetta: "gen 2027" });
    expect(mesi[11]).toEqual({ anno: 2027, mese: 10, etichetta: "ott 2027" });
    expect(nomeMese(mesi[3])).toBe("febbraio 2027");
  });

  it("anno AVS: quello con più mesi, a pari merito il più recente", () => {
    expect(annoAvsPerPeriodo("2026-11")).toEqual({ anno: 2027, approssimato: false });
    expect(annoAvsPerPeriodo("2026-03")).toEqual({ anno: 2026, approssimato: false });
    expect(annoAvsPerPeriodo("2026-07")).toEqual({ anno: 2027, approssimato: false });
    expect(annoAvsPerPeriodo("2026-06")).toEqual({ anno: 2026, approssimato: false });
    expect(annoAvsPerPeriodo("2028-01")).toEqual({ anno: 2027, approssimato: true });
    expect(annoAvsPerPeriodo("2024-01")).toEqual({ anno: 2026, approssimato: true });
  });
});

describe("calcolaBudget", () => {
  it("budget vuoto: nessun risultato da mostrare, nessun avviso", () => {
    const { risultato, errori } = calcolaBudget(dati());
    expect(errori).toEqual({});
    expect(risultato.vuoto).toBe(true);
    expect(risultato.avvisi).toEqual([]);
  });

  it("calcola risultato, accantonamenti, flusso e cumulato mese per mese", () => {
    const d = dati({
      meseInizio: "2027-01",
      ricavi: tutti("5'000"),
      costiVariabiliPercento: "10",
      costiFissi: [{ id: "locali", descrizione: "Locali", importo: "500" }],
      costiAvvio: [{ id: "pc", descrizione: "Computer", importo: "2'400", mese: 0 }],
      prelieviMensili: "2'500",
      riservaImpostePercento: "10",
    });
    const { risultato: r, errori } = calcolaBudget(d);
    expect(errori).toEqual({});
    expect(r.mesi[0]).toMatchObject({ ricavi: 5000, costiVariabili: 500, costiFissi: 500, costiAvvio: 2400, risultato: 1600 });
    expect(r.mesi[1].risultato).toBe(4000);
    expect(r.totali.ricavi).toBe(60_000);
    expect(r.totali.risultato).toBe(4000 * 12 - 2400);

    // AVS 2027 sul risultato dei 12 mesi (45'600).
    const avs = stimaContributi(45_600, 2027);
    expect(r.annoAvs).toBe(2027);
    expect(r.contributi.totale).toBe(avs.totale);
    expect(r.totali.accantonamentoAvs).toBeCloseTo(avs.totale, 2);

    // Riserva imposte: 10% del risultato dopo i contributi.
    expect(r.riservaImposte).toBeCloseTo((45_600 - avs.totale) * 0.1, 2);
    expect(r.totali.accantonamentoImposte).toBeCloseTo(r.riservaImposte, 2);

    // Flusso e cumulato coerenti.
    let cumulato = 0;
    for (const m of r.mesi) {
      expect(m.flusso).toBeCloseTo(m.risultato - m.accantonamentoAvs - m.accantonamentoImposte - m.prelievi, 2);
      cumulato += m.flusso;
      expect(m.cumulato).toBeCloseTo(cumulato, 2);
    }
  });

  it("mese di pareggio: primo mese da cui il cumulato resta >= 0", () => {
    const ricavi = ["0", "0", "1000", "3000", "3000", "3000", "3000", "3000", "3000", "3000", "3000", "3000"];
    const { risultato: r } = calcolaBudget(
      dati({ meseInizio: "2027-01", ricavi, costiFissi: [{ id: "f", descrizione: "Fissi", importo: "1000" }] }),
    );
    // Senza AVS il cumulato sarebbe −1000, −2000, −2000, 0, 2000, …; con l'accantonamento AVS il pareggio arriva un po' dopo.
    expect(r.mesePareggio).not.toBeNull();
    const i = r.mesePareggio!;
    expect(r.mesi[i].cumulato).toBeGreaterThanOrEqual(0);
    expect(r.mesi[i - 1].cumulato).toBeLessThan(0);
    for (let j = i; j < 12; j++) expect(r.mesi[j].cumulato).toBeGreaterThanOrEqual(0);
    expect(r.pareggioSubito).toBe(false);
    expect(r.fabbisognoMassimo).toBeGreaterThan(2000);
    expect(r.meseFabbisogno).toBe(2);
  });

  it("un cumulato che torna negativo sposta il pareggio", () => {
    const { risultato: r } = calcolaBudget(
      dati({
        meseInizio: "2027-01",
        situazione: "accessoria",
        ricavi: tutti("100"),
        costiAvvio: [{ id: "x", descrizione: "Macchina", importo: "500", mese: 5 }],
      }),
    );
    // 12 × 100 − 500 = 700 ≤ 2'500: attività accessoria senza contributi.
    expect(r.contributi.totale).toBe(0);
    // Cumulato: 100, 200, … 500, poi all'indice 5: 600 − 500 = 100 >= 0. Mai negativo.
    expect(r.mesePareggio).toBe(0);
    expect(r.pareggioSubito).toBe(true);
    const { risultato: r2 } = calcolaBudget(
      dati({
        meseInizio: "2027-01",
        situazione: "accessoria",
        ricavi: tutti("100"),
        costiAvvio: [{ id: "x", descrizione: "Macchina", importo: "900", mese: 5 }],
      }),
    );
    // Indice 5: 600 − 900 = −300; indice 8: 900 − 900 = 0 → pareggio a settembre.
    expect(r2.mesePareggio).toBe(8);
    expect(r2.pareggioSubito).toBe(false);
  });

  it("nessun pareggio nei 12 mesi", () => {
    const { risultato: r } = calcolaBudget(
      dati({ ricavi: tutti("500"), costiFissi: [{ id: "f", descrizione: "Fissi", importo: "1000" }] }),
    );
    expect(r.mesePareggio).toBeNull();
    expect(r.avvisi.some((a) => a.id === "perdita")).toBe(true);
    // Con una perdita si conta il contributo minimo.
    expect(r.contributi.caso).toBe("minimo");
  });

  it("iscrizione al registro di commercio: tassa nel primo mese, da svizzera.ts", () => {
    const { risultato: r } = calcolaBudget(dati({ iscrizioneRegistro: true, ricavi: tutti("1000") }));
    expect(r.tassaRegistro).toBe(tasseRegistroCommercio.valore.stimaTitolareConFirma);
    expect(r.mesi[0].costiAvvio).toBe(120);
    expect(r.mesi[1].costiAvvio).toBe(0);
  });

  it("avvisa da CHF 100'000 di ricavi nei 12 mesi", () => {
    const { risultato: r } = calcolaBudget(dati({ ricavi: tutti("8'500") }));
    expect(r.totali.ricavi).toBe(102_000);
    const avviso = r.avvisi.find((a) => a.id === "soglia-iva-registro");
    expect(avviso?.testo).toContain("12 mesi");
    const { risultato: sotto } = calcolaBudget(dati({ ricavi: tutti("8'000") }));
    expect(sotto.avvisi.find((a) => a.id === "soglia-iva-registro")).toBeUndefined();
  });

  it("segnala i campi sbagliati e li conta come zero", () => {
    const ricavi = tutti("1000");
    ricavi[3] = "mille";
    const { errori, risultato } = calcolaBudget(
      dati({ ricavi, costiVariabiliPercento: "150", prelieviMensili: "-5", riservaImpostePercento: "99" }),
    );
    expect(Object.keys(errori).sort()).toEqual(
      ["costiVariabiliPercento", "prelieviMensili", "ricavi.3", "riservaImpostePercento"].sort(),
    );
    expect(risultato.mesi[3].ricavi).toBe(0);
    expect(risultato.totali.ricavi).toBe(11_000);
  });
});

describe("schemaDatiBudget", () => {
  it("ripara dati salvati rovinati", () => {
    const d = schemaDatiBudget.parse({ ...dati(), meseInizio: "2027-13", ricavi: ["1", "2"], costiFissi: "x" });
    expect(d.meseInizio).toBe("2027-01");
    expect(d.ricavi).toHaveLength(12);
    expect(d.ricavi[1]).toBe("2");
    expect(d.costiFissi).toEqual([]);
  });
});
