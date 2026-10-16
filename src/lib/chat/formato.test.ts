import { describe, expect, it } from "vitest";
import { formattaData } from "./formato";
import { messaggioQuotaEsaurita } from "./messaggi";

describe("formattaData", () => {
  it("scrive le date nel formato svizzero", () => {
    expect(formattaData("2026-10-19")).toBe("19.10.2026");
  });

  it("legge gli istanti nell'ora di Zurigo", () => {
    expect(formattaData("2026-10-31T23:30:00Z")).toBe("01.11.2026");
    expect(formattaData(new Date("2026-06-30T21:59:00Z"))).toBe("30.06.2026");
  });

  it("restituisce una stringa vuota per date non valide", () => {
    expect(formattaData("non è una data")).toBe("");
  });
});

describe("testi con date", () => {
  it("il messaggio di quota esaurita dice quando ripartono le domande", () => {
    expect(messaggioQuotaEsaurita({ limite: 10, rinnovo_il: "2026-11-01" })).toBe(
      "Hai già usato le 10 domande di questo mese. Durante la prova di Bussola ci sono 10 domande al mese per ogni persona: ricominciano il 01.11.2026.",
    );
    // Niente rimandi a un piano a pagamento, che durante la prova non esiste.
    expect(messaggioQuotaEsaurita({ limite: null, rinnovo_il: "2026-11-01" })).not.toMatch(/pagamento|illimitat/);
    expect(messaggioQuotaEsaurita({ limite: null, rinnovo_il: "2026-11-01" })).toContain("le 10 domande");
  });
});
