import { describe, expect, it } from "vitest";
import { contieneCognome, controllaNome, normalizza, parolaSocieta, parolaTerritorio, parole, pulisciNome } from "./regole";

describe("normalizza e parole", () => {
  it("toglie maiuscole, accenti, apostrofi e punteggiatura", () => {
    expect(normalizza("  Caffè «Dell'Acqua» – Lugano! ")).toBe("caffe dellacqua lugano");
    expect(normalizza("Müller-Strauß")).toBe("muller strauss");
    expect(parole("")).toEqual([]);
    expect(parole("Foto  Rossi")).toEqual(["foto", "rossi"]);
  });
});

describe("contieneCognome", () => {
  it("trova il cognome come parola intera, senza badare a maiuscole e accenti", () => {
    expect(contieneCognome("Fotografia Rossi", "Rossi")).toBe(true);
    expect(contieneCognome("FOTOGRAFIA ROSSI", "rossi")).toBe(true);
    expect(contieneCognome("Pasticceria Nicolò", "Nicolo")).toBe(true);
    expect(contieneCognome("Caseificio di Rossi G.", "Rossi")).toBe(true);
  });

  it("non vale dentro un'altra parola", () => {
    expect(contieneCognome("Gelateria Rossini", "Rossi")).toBe(false);
    expect(contieneCognome("Rossiweb", "Rossi")).toBe(false);
    expect(contieneCognome("Foto Lugano", "Rossi")).toBe(false);
  });

  it("accetta apostrofi e cognomi composti scritti staccati o attaccati", () => {
    expect(contieneCognome("Idraulica Dell'Acqua", "Dell'Acqua")).toBe(true);
    expect(contieneCognome("Idraulica Dell’Acqua", "Dell'Acqua")).toBe(true);
    expect(contieneCognome("Idraulica Dellacqua", "Dell'Acqua")).toBe(true);
    expect(contieneCognome("Idraulica Dell Acqua", "Dell'Acqua")).toBe(true);
    expect(contieneCognome("Studio DeLuca", "De Luca")).toBe(true);
    expect(contieneCognome("Studio De Luca", "DeLuca")).toBe(true);
    expect(contieneCognome("Grafica Rossi-Bianchi", "Rossi-Bianchi")).toBe(true);
  });

  it("un cognome composto va scritto tutto", () => {
    expect(contieneCognome("Grafica Rossi", "Rossi Bianchi")).toBe(false);
    expect(contieneCognome("Studio Luca", "De Luca")).toBe(false);
  });

  it("cognome vuoto: falso", () => {
    expect(contieneCognome("Foto Rossi", "  ")).toBe(false);
    expect(contieneCognome("", "Rossi")).toBe(false);
  });
});

describe("parole vietate o da controllare", () => {
  it("riconosce le parole che fanno pensare a una società", () => {
    expect(parolaSocieta("Rossi Sagl")).toBe("sagl");
    expect(parolaSocieta("Rossi & Co.")).toBe("co");
    expect(parolaSocieta("Rossi e figli")).toBe("figli");
    expect(parolaSocieta("Rossi Sàrl")).toBe("sarl");
    expect(parolaSocieta("Rossi S.A.")).toBe("sa");
    expect(parolaSocieta("Rossi S.a.g.l.")).toBe("sagl");
    expect(parolaSocieta("Caseificio di Rossi G.")).toBe(null);
    expect(parolaSocieta("Rossi SA")).toBe("sa");
    expect(parolaSocieta("Sapori Rossi")).toBe(null);
    expect(parolaSocieta("Beauty Spa Rossi")).toBe(null);
  });

  it("riconosce le parole nazionali e territoriali", () => {
    expect(parolaTerritorio("Swiss Clean Rossi")).toBe("swiss");
    expect(parolaTerritorio("Pulizie ticinesi Rossi")).toBe("ticinesi");
    expect(parolaTerritorio("Rossi Svizzera")).toBe("svizzera");
    expect(parolaTerritorio("Pulizie Rossi Lugano")).toBe(null);
  });

  it("controllaNome riunisce i controlli", () => {
    expect(controllaNome("Rossi Swiss GmbH", "Rossi")).toEqual({ conCognome: true, societa: "gmbh", territorio: "swiss" });
    expect(controllaNome("Pixel Studio", "Rossi")).toEqual({ conCognome: false, societa: null, territorio: null });
  });
});

describe("pulisciNome", () => {
  it("toglie spazi doppi e virgolette intorno", () => {
    expect(pulisciNome("  «Foto   Rossi» ")).toBe("Foto Rossi");
    expect(pulisciNome('"Giardini Rossi"')).toBe("Giardini Rossi");
  });
});
