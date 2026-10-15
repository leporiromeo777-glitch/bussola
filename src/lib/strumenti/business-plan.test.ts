import { describe, expect, it } from "vitest";
import { calcolaBudget, datiBudgetIniziali } from "./budget";
import {
  CAMPI_PIANO,
  campiCompilati,
  campiTroppoLunghi,
  datiPianoIniziali,
  schemaDatiPiano,
  statoLunghezza,
  testoCostiDaBudget,
  testoPrezzoDaTariffa,
  testoRicaviDaBudget,
} from "./business-plan";
import { calcolaTariffa, datiTariffaIniziali } from "./tariffa";

describe("campi del business plan", () => {
  it("11 domande guidate, ognuna con esempio e limite", () => {
    expect(CAMPI_PIANO).toHaveLength(11);
    for (const c of CAMPI_PIANO) {
      expect(c.esempio.length).toBeGreaterThan(10);
      expect(c.esempio.length).toBeLessThanOrEqual(c.consigliati);
    }
    // Il totale consigliato deve stare su una pagina A4 (stima: ~4'000 caratteri in due colonne).
    const totale = CAMPI_PIANO.reduce((s, c) => s + c.consigliati, 0);
    expect(totale).toBeLessThanOrEqual(4_000);
  });

  it("statoLunghezza", () => {
    expect(statoLunghezza("", 100).stato).toBe("vuoto");
    expect(statoLunghezza("a".repeat(50), 100).stato).toBe("ok");
    expect(statoLunghezza("a".repeat(90), 100).stato).toBe("quasi");
    expect(statoLunghezza("a".repeat(101), 100)).toEqual({ caratteri: 101, consigliati: 100, stato: "lungo" });
    expect(statoLunghezza("   ciao   ", 100).caratteri).toBe(4);
  });

  it("conta i campi compilati e quelli troppo lunghi", () => {
    const d = datiPianoIniziali();
    expect(campiCompilati(d)).toBe(0);
    d.campi.idea = "Un'idea";
    d.campi.problema = "x".repeat(400);
    expect(campiCompilati(d)).toBe(2);
    expect(campiTroppoLunghi(d)).toEqual(["problema"]);
  });

  it("schema: ripara dati salvati rovinati", () => {
    const d = schemaDatiPiano.parse({ nomeAttivita: 5, campi: { idea: "ok", problema: 3 } });
    expect(d.nomeAttivita).toBe("");
    expect(d.campi.idea).toBe("ok");
    expect(d.campi.problema).toBe("");
    expect(d.campi.passi).toBe("");
  });
});

describe("importa da tariffa e budget", () => {
  it("prezzo dalla tariffa", () => {
    const esito = calcolaTariffa({ ...datiTariffaIniziali("2026-03-01"), anno: 2026 });
    expect(esito.ok).toBe(true);
    if (!esito.ok) return;
    const testo = testoPrezzoDaTariffa(esito.risultato);
    expect(testo).toContain("CHF 48 all'ora");
    expect(testo).toContain("CHF 48'000");
    expect(testo).toContain("1'125 ore");
    expect(testo).toContain("senza IVA");
  });

  it("costi e ricavi dal budget", () => {
    const dati = {
      ...datiBudgetIniziali("2026-10-15"),
      ricavi: Array.from({ length: 12 }, () => "4'000"),
      iscrizioneRegistro: true,
      costiVariabiliPercento: "10",
      costiFissi: [
        { id: "locali", descrizione: "Locali", importo: "600" },
        { id: "software", descrizione: "Software", importo: "100" },
        { id: "vuoto", descrizione: "Altro", importo: "" },
      ],
      costiAvvio: [{ id: "pc", descrizione: "Computer", importo: "1'500", mese: 0 }],
    };
    const { risultato } = calcolaBudget(dati);
    const costi = testoCostiDaBudget(risultato, dati);
    expect(costi).toContain("Costi fissi CHF 700 al mese (locali, software)");
    expect(costi).toContain("Costi di avvio CHF 1'620 (computer, iscrizione al registro di commercio)");
    expect(costi).toContain("10% dei ricavi");
    const ricavi = testoRicaviDaBudget(risultato);
    expect(ricavi).toContain("nov 2026 – ott 2027");
    expect(ricavi).toContain("CHF 48'000");
    expect(ricavi).toMatch(/Pareggio previsto a \w+ \d{4}|Saldo positivo/);
  });

  it("budget senza pareggio", () => {
    const dati = { ...datiBudgetIniziali("2026-10-15"), costiFissi: [{ id: "f", descrizione: "Fissi", importo: "500" }] };
    expect(testoRicaviDaBudget(calcolaBudget(dati).risultato)).toContain("resta negativo");
  });
});
