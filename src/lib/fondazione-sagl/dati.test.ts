import { describe, expect, it } from "vitest";
import { chiDirige, controllaFondazione, datiFondazioneIniziali, nuovoGerenteEsterno, totaleQuote, type DatiFondazione } from "./dati";

/** Due soci, 100 + 100 quote da CHF 100: CHF 20'000. */
function completi(): DatiFondazione {
  const d = datiFondazioneIniziali();
  return {
    ...d,
    ditta: "Rossi & Bianchi Sagl",
    sede: "Bellinzona",
    scopo: "Riparazione di biciclette e vendita di accessori.",
    banca: "Banca dello Stato",
    soci: [
      { ...d.soci[0], nome: "Luca Rossi", domicilio: "Bellinzona", quote: 100 },
      { ...d.soci[1], nome: "Sara Bianchi", domicilio: "Giubiasco", quote: 100 },
    ],
  };
}

const ids = (c: { id: string }[]) => c.map((x) => x.id);

describe("controllaFondazione", () => {
  it("dati completi e coerenti: nessun errore e nessun avviso", () => {
    expect(controllaFondazione(completi())).toEqual({ errori: [], avvisi: [] });
  });

  it("all'inizio mancano ditta, sede, scopo e i nomi dei soci", () => {
    const { errori } = controllaFondazione(datiFondazioneIniziali());
    expect(ids(errori)).toEqual(expect.arrayContaining(["ditta", "sede", "scopo", "nome-socio-1", "quote-socio-1"]));
  });

  it("capitale sotto il minimo di legge", () => {
    const d = { ...completi(), capitale: 10_000 };
    expect(ids(controllaFondazione(d).errori)).toContain("capitale");
  });

  it("quote: valore zero, capitale non divisibile, somma che non torna", () => {
    expect(ids(controllaFondazione({ ...completi(), valoreQuota: 0 }).errori)).toContain("valore");
    expect(ids(controllaFondazione({ ...completi(), valoreQuota: 300 }).errori)).toContain("divisione");
    const d = completi();
    d.soci[1].quote = 50;
    expect(controllaFondazione(d).errori.find((e) => e.id === "totale")?.testo).toBe(
      "Le quote dei soci fanno CHF 15'000.00, ma il capitale è CHF 20'000.00.",
    );
  });

  it("le quote possono valere meno di CHF 100 (basta più di zero)", () => {
    const d = { ...completi(), valoreQuota: 1 };
    d.soci = d.soci.map((s) => ({ ...s, quote: 10_000 }));
    expect(controllaFondazione(d).errori).toEqual([]);
  });

  it("forma giuridica nella ditta: avviso, non errore", () => {
    const { errori, avvisi } = controllaFondazione({ ...completi(), ditta: "Rossi & Bianchi" });
    expect(errori).toEqual([]);
    expect(ids(avvisi)).toEqual(["forma"]);
  });

  it("direzione con gerenti: serve almeno un gerente, anche esterno", () => {
    const d = { ...completi(), direzione: "gerenti" as const };
    expect(ids(controllaFondazione(d).errori)).toContain("gerenti");
    const esterno = { ...nuovoGerenteEsterno("g1"), nome: "Marta Verdi", domicilio: "Lugano" };
    const conEsterno = { ...d, gerentiEsterni: [esterno] };
    expect(controllaFondazione(conEsterno).errori).toEqual([]);
    expect(chiDirige(conEsterno).map((p) => p.nome)).toEqual(["Marta Verdi"]);
  });

  it("nessuno che dirige è domiciliato in Svizzera: avviso", () => {
    const d = completi();
    d.soci = d.soci.map((s) => ({ ...s, domiciliatoInSvizzera: false }));
    expect(ids(controllaFondazione(d).avvisi)).toContain("domicilio");
  });

  it("conferimenti in natura e rinuncia alla revisione: avvisi con la fonte", () => {
    const d = { ...completi(), revisione: "rinuncia" as const };
    d.soci[0].inNatura = true;
    const { avvisi } = controllaFondazione(d);
    expect(ids(avvisi)).toEqual(["natura", "revisione"]);
    expect(avvisi.every((a) => a.fonte?.url.startsWith("https://"))).toBe(true);
  });

  it("totaleQuote", () => {
    expect(totaleQuote(completi())).toBe(200);
  });
});
