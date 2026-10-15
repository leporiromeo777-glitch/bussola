import { describe, expect, it } from "vitest";
import {
  caratteriNonAmmessi,
  cifraControlloMod10,
  creaRiferimentoQr,
  creaRiferimentoScor,
  eQrIban,
  formattaIban,
  formattaRiferimentoQr,
  formattaRiferimentoScor,
  ibanValido,
  indirizzoCompleto,
  mod97,
  pulisciTestoQr,
  riferimentoQrValido,
  riferimentoScorValido,
  validaIbanPerQr,
  validaImportoQr,
  validaIndirizzoQr,
  validaPagamentoQr,
  type DatiPagamentoQr,
  type IndirizzoStrutturato,
} from "./qr";

// Esempi ufficiali delle linee guida SIX 2.3, allegato A.
const SIX_QR_IBAN_1 = "CH44 3199 9123 0008 8901 2";
const SIX_QRR_1 = "21 00000 00003 13947 14300 09017";
const SIX_QR_IBAN_2 = "CH6431961000004421557";
const SIX_QRR_2 = "000008207791225857421286694";
const SIX_IBAN_SCOR = "CH5800791123000889012";
const SIX_SCOR_1 = "RF18539007547034";
// Esempio 4 delle linee guida: la cifra di controllo non torna con il modulo 97
// (anche swissqrbill lo rifiuta), quindi è un esempio solo grafico: lo usiamo come caso negativo.
const SIX_SCOR_ILLUSTRATIVO = "RF720191230100405JSH0438";
const SIX_IBAN_NON = "CH5204835012345671000";

describe("IBAN", () => {
  it.each([SIX_QR_IBAN_1, SIX_QR_IBAN_2, SIX_IBAN_SCOR, SIX_IBAN_NON, "CH93 0076 2011 6238 5295 7", "de89 3704 0044 0532 0130 00"])(
    "%s è valido (modulo 97)",
    (iban) => expect(ibanValido(iban)).toBe(true),
  );

  it.each(["CH93 0076 2011 6238 5295 8", "CH1409000000304498478", "CH93", "", "XX00 0000 0000 0000 0000 0", "CH93-0076-2011"])(
    "%s non è valido",
    (iban) => expect(ibanValido(iban)).toBe(false),
  );

  it("QR-IBAN: QR-IID tra 30000 e 31999", () => {
    expect(eQrIban(SIX_QR_IBAN_1)).toBe(true); // IID 31999
    expect(eQrIban(SIX_QR_IBAN_2)).toBe(true); // IID 31961
    expect(eQrIban(SIX_IBAN_SCOR)).toBe(false); // IID 00791
    expect(eQrIban("CH93 0076 2011 6238 5295 7")).toBe(false);
    expect(eQrIban("DE89370400440532013000")).toBe(false);
  });

  it("validaIbanPerQr: messaggi in italiano", () => {
    expect(validaIbanPerQr(SIX_QR_IBAN_1)).toEqual({ ok: true, iban: "CH4431999123000889012", qrIban: true });
    expect(validaIbanPerQr(" ch93 0076 2011 6238 5295 7 ")).toEqual({ ok: true, iban: "CH9300762011623852957", qrIban: false });
    const errori = ["", "DE89370400440532013000", "CH93007620116238529", "CH9300762011623852958"].map((i) => validaIbanPerQr(i));
    expect(errori.every((e) => !e.ok)).toBe(true);
    expect(errori.map((e) => (e.ok ? "" : e.errore))).toEqual([
      expect.stringContaining("Scrivi l'IBAN"),
      expect.stringContaining("CH o LI"),
      expect.stringContaining("21 caratteri"),
      expect.stringContaining("non è valido"),
    ]);
  });

  it("formattaIban e mod97", () => {
    expect(formattaIban("CH9300762011623852957")).toBe("CH93 0076 2011 6238 5295 7");
    expect(mod97("ab")).toBe(1011 % 97);
    expect(mod97("1-2")).toBe(-1);
  });
});

describe("riferimento QR (QRR)", () => {
  it("esempio SIX: cifra di controllo 7", () => {
    expect(cifraControlloMod10("21000000000313947143000901")).toBe(7);
    expect(riferimentoQrValido(SIX_QRR_1)).toBe(true);
    expect(riferimentoQrValido(SIX_QRR_2)).toBe(true);
  });

  it("riconosce riferimenti sbagliati", () => {
    expect(riferimentoQrValido("210000000003139471430009018")).toBe(false);
    expect(riferimentoQrValido("21000000000313947143000901")).toBe(false); // 26 cifre
    expect(riferimentoQrValido("21000000000313947143000901A")).toBe(false);
  });

  it("crea un riferimento dal numero della fattura", () => {
    const r = creaRiferimentoQr("F-2026-007")!;
    expect(r).toHaveLength(27);
    expect(r.startsWith("0000000000000000000"))
      .toBe(true);
    expect(r.slice(19, 26)).toBe("2026007");
    expect(riferimentoQrValido(r)).toBe(true);
    expect(creaRiferimentoQr("21000000000313947143000901")).toBe("210000000003139471430009017");
    expect(creaRiferimentoQr("ABC")).toBeNull();
    expect(creaRiferimentoQr("1".repeat(27))).toBeNull();
  });

  it("formatta a gruppi", () => {
    expect(formattaRiferimentoQr("210000000003139471430009017")).toBe(SIX_QRR_1);
  });
});

describe("Creditor Reference (SCOR)", () => {
  it("esempio SIX valido (ISO 11649)", () => {
    expect(riferimentoScorValido(SIX_SCOR_1)).toBe(true);
    expect(riferimentoScorValido("rf18 5390 0754 7034")).toBe(true);
  });

  it("l'esempio grafico RF72… delle linee guida non supera il controllo", () => {
    expect(riferimentoScorValido(SIX_SCOR_ILLUSTRATIVO)).toBe(false);
  });

  it("riconosce riferimenti sbagliati", () => {
    expect(riferimentoScorValido("RF19539007547034")).toBe(false);
    expect(riferimentoScorValido("RF18")).toBe(false);
    expect(riferimentoScorValido("XX18539007547034")).toBe(false);
    expect(riferimentoScorValido("RF18" + "1".repeat(22))).toBe(false);
  });

  it("crea un Creditor Reference", () => {
    expect(creaRiferimentoScor("539007547034")).toBe(SIX_SCOR_1);
    const corretto = creaRiferimentoScor("0191230100405JSH0438")!;
    expect(corretto).toBe("RF240191230100405JSH0438");
    expect(riferimentoScorValido(corretto)).toBe(true);
    const r = creaRiferimentoScor("F-2026-007")!;
    expect(r).toMatch(/^RF\d{2}F2026007$/);
    expect(riferimentoScorValido(r)).toBe(true);
    expect(creaRiferimentoScor("--")).toBeNull();
    expect(creaRiferimentoScor("A".repeat(22))).toBeNull();
    // Controllo con una sola cifra: zero davanti.
    for (const base of ["1", "A1", "2026001", "X", "ZZZ"]) {
      expect(riferimentoScorValido(creaRiferimentoScor(base)!)).toBe(true);
    }
  });

  it("formatta a gruppi di 4", () => {
    expect(formattaRiferimentoScor(SIX_SCOR_1)).toBe("RF18 5390 0754 7034");
  });
});

describe("caratteri e indirizzi", () => {
  it("pulisce apostrofi e trattini tipografici", () => {
    expect(pulisciTestoQr("Sant’Antonino – “Bar”")).toBe("Sant'Antonino - \"Bar\"");
    expect(caratteriNonAmmessi("Sant’Antonino")).toEqual([]);
    expect(caratteriNonAmmessi("Città è più")).toEqual([]);
    expect(caratteriNonAmmessi("Ciao 😀 ✓")).toEqual(["😀", "✓"]);
    expect(caratteriNonAmmessi("Ștefan €")).toEqual([]);
  });

  const indirizzo: IndirizzoStrutturato = {
    nome: "Mario Rossi",
    via: "Via Nassa",
    numero: "5",
    npa: "6900",
    localita: "Lugano",
    paese: "CH",
  };

  it("indirizzo strutturato: NPA, località e paese obbligatori; via facoltativa", () => {
    expect(validaIndirizzoQr(indirizzo)).toEqual({});
    expect(validaIndirizzoQr({ ...indirizzo, via: "", numero: "" })).toEqual({});
    const errori = validaIndirizzoQr({ ...indirizzo, npa: "", localita: " ", paese: "Svizzera", nome: "" });
    expect(Object.keys(errori).sort()).toEqual(["localita", "nome", "npa", "paese"]);
    expect(validaIndirizzoQr({ ...indirizzo, localita: "L".repeat(36) }).localita).toContain("35");
    expect(validaIndirizzoQr({ ...indirizzo, nome: "Mario 😀" }).nome).toContain("non ammesso");
    expect(indirizzoCompleto(indirizzo)).toBe(true);
  });

  it("importo tra 0.01 e 999'999'999.99", () => {
    expect(validaImportoQr(0.01)).toBeNull();
    expect(validaImportoQr(999_999_999.99)).toBeNull();
    expect(validaImportoQr(0)).not.toBeNull();
    expect(validaImportoQr(-5)).not.toBeNull();
    expect(validaImportoQr(1_000_000_000)).not.toBeNull();
    expect(validaImportoQr(Number.NaN)).not.toBeNull();
  });
});

describe("validaPagamentoQr", () => {
  const creditore: IndirizzoStrutturato = {
    nome: "Giulia Bernasconi",
    via: "Via Lugano",
    numero: "12",
    npa: "6500",
    localita: "Bellinzona",
    paese: "CH",
  };
  const debitore: IndirizzoStrutturato = { nome: "Studio Verdi", via: "Piazza Grande", numero: "1", npa: "6600", localita: "Locarno", paese: "ch" };
  const base: DatiPagamentoQr = {
    iban: SIX_IBAN_SCOR,
    riferimento: { tipo: "SCOR", valore: SIX_SCOR_1 },
    importo: 1949.75,
    valuta: "CHF",
    creditore,
    debitore,
    messaggio: "Fattura F-2026-001",
  };

  it("IBAN normale con SCOR: dati pronti per swissqrbill", () => {
    const esito = validaPagamentoQr(base);
    expect(esito.ok).toBe(true);
    if (!esito.ok) return;
    expect(esito.dati).toEqual({
      currency: "CHF",
      amount: 1949.75,
      reference: SIX_SCOR_1,
      message: "Fattura F-2026-001",
      creditor: { account: "CH5800791123000889012", name: "Giulia Bernasconi", address: "Via Lugano", buildingNumber: "12", zip: "6500", city: "Bellinzona", country: "CH" },
      debtor: { name: "Studio Verdi", address: "Piazza Grande", buildingNumber: "1", zip: "6600", city: "Locarno", country: "CH" },
    });
  });

  it("IBAN normale senza riferimento (NON) e senza debitore", () => {
    const esito = validaPagamentoQr({ ...base, iban: SIX_IBAN_NON, riferimento: { tipo: "NON", valore: "" }, debitore: undefined });
    expect(esito.ok).toBe(true);
    if (esito.ok) {
      expect(esito.dati.reference).toBeUndefined();
      expect(esito.dati.debtor).toBeUndefined();
    }
  });

  it("QR-IBAN con riferimento QR valido", () => {
    const esito = validaPagamentoQr({ ...base, iban: SIX_QR_IBAN_1, riferimento: { tipo: "QRR", valore: SIX_QRR_1 }, valuta: "EUR" });
    expect(esito.ok).toBe(true);
    if (esito.ok) expect(esito.dati.reference).toBe("210000000003139471430009017");
  });

  it("QR-IBAN senza riferimento QR: errore", () => {
    for (const riferimento of [
      { tipo: "SCOR" as const, valore: SIX_SCOR_1 },
      { tipo: "NON" as const, valore: "" },
      { tipo: "QRR" as const, valore: "210000000003139471430009018" },
    ]) {
      const esito = validaPagamentoQr({ ...base, iban: SIX_QR_IBAN_1, riferimento });
      expect(esito.ok).toBe(false);
      if (!esito.ok) expect(esito.errori[0].campo).toBe("riferimento");
    }
  });

  it("riferimento QR con IBAN normale: errore", () => {
    const esito = validaPagamentoQr({ ...base, riferimento: { tipo: "QRR", valore: SIX_QRR_1 } });
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errori[0].messaggio).toContain("solo con un QR-IBAN");
  });

  it("SCOR sbagliato, importo zero, valuta e indirizzo incompleto", () => {
    const esito = validaPagamentoQr({
      ...base,
      riferimento: { tipo: "SCOR", valore: "RF00123" },
      importo: 0,
      valuta: "USD" as "CHF",
      creditore: { ...creditore, npa: "" },
      messaggio: "x".repeat(141),
    });
    expect(esito.ok).toBe(false);
    if (!esito.ok) {
      expect(esito.errori.map((e) => e.campo).sort()).toEqual(
        ["creditore.npa", "importo", "messaggio", "riferimento", "valuta"].sort(),
      );
    }
  });
});
