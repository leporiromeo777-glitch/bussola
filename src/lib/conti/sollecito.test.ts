import { describe, expect, it } from "vitest";
import { fontiSolleciti, regoleSolleciti, VERIFICATO_SOLLECITI } from "@/data/svizzera";
import {
  GIORNI_NUOVO_TERMINE,
  datiDaStrumentoFattura,
  giorniDiRitardo,
  leggiIbanSollecito,
  linkEmail,
  livelloConsigliato,
  nuovoTermineProposto,
  preparaSollecito,
  riferimentoLeggibile,
  testoDaCopiare,
  testoRitardo,
  testoSollecitoInviato,
  type DatiSollecito,
} from "./sollecito";
import type { FatturaEmessa } from "./tipi";

const OGGI = "2026-10-18";

const FATTURA: DatiSollecito["fattura"] = {
  numero: "F-2026-007",
  data: "2026-09-15",
  scadenza: "2026-10-15",
  importo: 1250.5,
  riferimento: null,
  sollecito: null,
};

describe("giorni di ritardo", () => {
  it("contano dal giorno dopo la scadenza, solo se non è pagata", () => {
    const f = (scadenza: string | null, pagataIl: string | null = null) => ({ scadenza, pagataIl });
    expect(giorniDiRitardo(f("2026-10-15"), OGGI)).toBe(3);
    expect(giorniDiRitardo(f("2026-10-17"), OGGI)).toBe(1);
    expect(giorniDiRitardo(f(OGGI), OGGI)).toBe(0);
    expect(giorniDiRitardo(f("2026-10-30"), OGGI)).toBe(0);
    expect(giorniDiRitardo(f(null), OGGI)).toBe(0);
    expect(giorniDiRitardo(f("2026-10-01", "2026-10-10"), OGGI)).toBe(0);
    // Attraverso il cambio dell'ora e la fine dell'anno.
    expect(giorniDiRitardo(f("2026-10-20"), "2026-10-30")).toBe(10);
    expect(giorniDiRitardo(f("2026-12-31"), "2027-01-02")).toBe(2);
  });

  it("si scrivono in italiano semplice", () => {
    expect(testoRitardo(1)).toBe("Scaduta da 1 giorno");
    expect(testoRitardo(12)).toBe("Scaduta da 12 giorni");
  });
});

describe("livello consigliato e sollecito inviato", () => {
  it("prima il promemoria gentile, poi il secondo sollecito", () => {
    expect(livelloConsigliato({ sollecito: null })).toBe(1);
    expect(livelloConsigliato({ sollecito: { livello: 1, inviatoIl: "2026-10-16" } })).toBe(2);
    expect(livelloConsigliato({ sollecito: { livello: 2, inviatoIl: "2026-10-16" } })).toBe(2);
  });

  it("dice quale sollecito è partito e quando", () => {
    expect(testoSollecitoInviato({ livello: 1, inviatoIl: "2026-10-16" })).toBe("1° sollecito inviato il 16.10.2026");
    expect(testoSollecitoInviato({ livello: 2, inviatoIl: "2026-11-02" })).toBe("2° sollecito inviato il 02.11.2026");
  });

  it("propone un nuovo termine tra GIORNI_NUOVO_TERMINE giorni", () => {
    expect(GIORNI_NUOVO_TERMINE).toBe(10);
    expect(nuovoTermineProposto(OGGI)).toBe("2026-10-28");
    expect(nuovoTermineProposto("2026-12-25")).toBe("2027-01-04");
  });
});

describe("testo del sollecito", () => {
  it("primo sollecito: gentile, con numero, data, importo in CHF, scadenza e nuovo termine", () => {
    const t = preparaSollecito({ livello: 1, fattura: FATTURA, nuovoTermine: "2026-10-28", firma: "Mario Bianchi" });
    expect(t.oggetto).toBe("Promemoria di pagamento: fattura F-2026-007");
    expect(t.testo).toContain("la fattura n. F-2026-007 del 15.09.2026, di CHF 1'250.50, da pagare entro il 15.10.2026");
    expect(t.testo).toContain("le chiedo gentilmente di pagarla entro il 28.10.2026");
    expect(t.testo).toContain("Trova i dati per il pagamento sulla fattura.");
    expect(t.testo).toContain("Se ha già pagato nel frattempo, non tenga conto di questo messaggio.");
    expect(t.testo.endsWith("Cordiali saluti\nMario Bianchi")).toBe(true);
    // Il primo non parla di interessi.
    expect(t.testo).not.toMatch(/interess/i);
    expect(t.testo).not.toMatch(/undefined|null|NaN/);
  });

  it("con l'IBAN e il riferimento QR mette i dati per il pagamento", () => {
    const t = preparaSollecito({
      livello: 1,
      fattura: { ...FATTURA, riferimento: "210000000003139471430009017" },
      nuovoTermine: "2026-10-28",
      iban: "CH93 0076 2011 6238 5295 7",
      firma: "Mario Bianchi",
    });
    expect(t.testo).toContain(
      [
        "Dati per il pagamento:",
        "IBAN: CH93 0076 2011 6238 5295 7",
        "A favore di: Mario Bianchi",
        "Importo: CHF 1'250.50",
        "Riferimento: 21 00000 00003 13947 14300 09017",
      ].join("\n"),
    );
  });

  it("senza IBAN rimanda alla sezione pagamento della fattura, con il riferimento", () => {
    const t = preparaSollecito({ livello: 1, fattura: { ...FATTURA, riferimento: "RF18539007547034" }, nuovoTermine: "2026-10-28" });
    expect(t.testo).toContain("nella sezione pagamento con il codice QR (riferimento RF18 5390 0754 7034)");
    expect(t.testo.endsWith("Cordiali saluti")).toBe(true);
  });

  it("con l'IBAN ma senza riferimento indica il motivo del pagamento", () => {
    const t = preparaSollecito({ livello: 1, fattura: FATTURA, nuovoTermine: "2026-10-28", iban: "CH93 0076 2011 6238 5295 7" });
    expect(t.testo).toContain("Motivo del pagamento: fattura F-2026-007");
    expect(t.testo).not.toContain("A favore di");
  });

  it("secondo sollecito: più deciso, ricorda il primo e gli interessi di mora della legge", () => {
    const t = preparaSollecito({
      livello: 2,
      fattura: { ...FATTURA, sollecito: { livello: 1, inviatoIl: "2026-10-16" } },
      nuovoTermine: "2026-10-28",
    });
    expect(t.oggetto).toBe("Secondo sollecito di pagamento: fattura F-2026-007");
    expect(t.testo).toContain(
      "il 16.10.2026 le ho mandato un promemoria per la fattura n. F-2026-007 del 15.09.2026, di CHF 1'250.50, scaduta il 15.10.2026. Ad oggi il pagamento non è ancora arrivato.",
    );
    expect(t.testo).toContain("La prego di pagare l'importo entro il 28.10.2026.");
    expect(t.testo).toContain(
      "Le ricordo che per i pagamenti in ritardo la legge prevede interessi di mora del 5% all'anno (art. 104 del Codice delle obbligazioni): se il pagamento non arriva entro questo termine, mi riservo di chiederli.",
    );
  });

  it("secondo sollecito senza un primo segnato", () => {
    const t = preparaSollecito({ livello: 2, fattura: FATTURA, nuovoTermine: "2026-10-28" });
    expect(t.testo).toContain(
      "La fattura n. F-2026-007 del 15.09.2026, di CHF 1'250.50, è scaduta il 15.10.2026. Ad oggi il pagamento non è ancora arrivato.",
    );
  });

  it("il tasso viene dal dato con la fonte (art. 104 CO), controllato oggi", () => {
    expect(regoleSolleciti.interesseMora.valore).toBe(0.05);
    expect(regoleSolleciti.interesseMora.fonte).toBe(fontiSolleciti.co104);
    expect(regoleSolleciti.interesseMora.fonte.url).toBe("https://www.fedlex.admin.ch/eli/cc/27/317_321_377/it#art_104");
    expect(regoleSolleciti.moraDopoScadenzaGiorni.fonte.url).toMatch(/#art_102$/);
    expect(regoleSolleciti.esecuzione.fonte.url).toMatch(/^https:\/\/www\.ch\.ch\/it\//);
    for (const d of Object.values(regoleSolleciti)) expect(d.verificatoIl).toBe(VERIFICATO_SOLLECITI);
    expect(VERIFICATO_SOLLECITI).toBe("2026-10-18");
  });

  it("testo da copiare e link per l'email", () => {
    const t = { oggetto: "Promemoria: fattura F-1", testo: "Buongiorno,\n\nriga & altro?" };
    expect(testoDaCopiare(t)).toBe("Oggetto: Promemoria: fattura F-1\n\nBuongiorno,\n\nriga & altro?");
    const link = linkEmail(t);
    expect(link).toBe("mailto:?subject=Promemoria%3A%20fattura%20F-1&body=Buongiorno%2C%0D%0A%0D%0Ariga%20%26%20altro%3F");
    const url = new URL(link);
    expect(url.searchParams.get("body")).toBe("Buongiorno,\r\n\r\nriga & altro?");
  });
});

describe("dati per il pagamento", () => {
  it("riferimento QR e SCOR a gruppi, il resto com'è", () => {
    expect(riferimentoLeggibile("210000000003139471430009017")).toBe("21 00000 00003 13947 14300 09017");
    expect(riferimentoLeggibile("rf18539007547034")).toBe("RF18 5390 0754 7034");
    expect(riferimentoLeggibile(" ABC-12 ")).toBe("ABC-12");
  });

  it("controlla l'IBAN scritto dall'utente", () => {
    expect(leggiIbanSollecito("")).toEqual({ iban: null, errore: null });
    expect(leggiIbanSollecito("ch9300762011623852957")).toEqual({ iban: "CH93 0076 2011 6238 5295 7", errore: null });
    expect(leggiIbanSollecito("CH93 0076 2011 6238 5295 8").errore).toMatch(/IBAN/);
  });

  it("prende IBAN e nome dallo strumento fattura: prima la stessa fattura, poi l'emittente salvato", () => {
    const documenti = [
      { tipo: "preventivo", numero: "F-2026-007", emittente: { nome: "Preventivo", iban: "CH00" } },
      { tipo: "fattura", numero: "F-2026-007", emittente: { nome: "Mario Bianchi", iban: "CH93 0076 2011 6238 5295 7" } },
    ];
    const salvato = { nome: "Ditta Bianchi", iban: "CH56 0483 5012 3456 7800 9" };
    expect(datiDaStrumentoFattura("F-2026-007", documenti, salvato)).toEqual({
      iban: "CH93 0076 2011 6238 5295 7",
      firma: "Mario Bianchi",
    });
    expect(datiDaStrumentoFattura("F-2026-008", documenti, salvato)).toEqual({
      iban: "CH56 0483 5012 3456 7800 9",
      firma: "Ditta Bianchi",
    });
    expect(datiDaStrumentoFattura("F-2026-008", null, null)).toEqual({ iban: "", firma: "" });
  });
});

describe("tipi", () => {
  it("FatturaEmessa porta riferimento e sollecito", () => {
    const f: FatturaEmessa = {
      id: "f1",
      numero: "F-1",
      cliente: "Rossi SA",
      data: "2026-09-01",
      scadenza: "2026-10-01",
      importo: 100,
      stato: "scaduta",
      pagataIl: null,
      riferimento: null,
      sollecito: { livello: 1, inviatoIl: "2026-10-05" },
    };
    expect(livelloConsigliato(f)).toBe(2);
  });
});
