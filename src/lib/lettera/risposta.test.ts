import { describe, expect, it } from "vitest";
import { MESSAGGI_LETTERA } from "./richiesta";
import { leggiDisponibilitaLettera, leggiRispostaLettera } from "./risposta";
import { pulisciSpiegazione } from "./spiegazione";

const SPIEGAZIONE = pulisciSpiegazione({
  leggibile: true,
  eUnaLettera: true,
  mittente: "Istituto delle assicurazioni sociali",
  cosE: "È la fattura dell'acconto dei contributi AVS.",
  inBreve: "La cassa ti chiede di pagare un acconto.",
  scadenze: [{ data: "31.10.2026", cosa: "Paga l'acconto." }],
  importi: [{ importo: "CHF 1'234.50", cosa: "Acconto del trimestre" }],
  cosaFare: ["Paga con la QR-fattura."],
  quandoChiedereAiuto: null,
});

describe("leggiRispostaLettera", () => {
  it("restituisce la spiegazione mandata dal sito", () => {
    const esito = leggiRispostaLettera(200, { spiegazione: SPIEGAZIONE });
    expect(esito).toEqual({ ok: true, spiegazione: SPIEGAZIONE });
  });

  it("accetta anche le spiegazioni di una lettera che non si legge", () => {
    const illeggibile = pulisciSpiegazione({ leggibile: false, eUnaLettera: true, cosE: "La foto è sfocata." });
    const esito = leggiRispostaLettera(200, { spiegazione: illeggibile });
    expect(esito.ok && esito.spiegazione.stato).toBe("illeggibile");
  });

  it("con una risposta riuscita ma senza spiegazione valida dice che non ha capito", () => {
    expect(leggiRispostaLettera(200, null)).toEqual({ ok: false, messaggio: MESSAGGI_LETTERA.nonCapito, stato: 200 });
    expect(leggiRispostaLettera(200, { spiegazione: { stato: "ok" } })).toMatchObject({ ok: false });
    expect(leggiRispostaLettera(200, { spiegazione: { ...SPIEGAZIONE, stato: "boh" } })).toMatchObject({ ok: false });
  });

  it("mostra il messaggio del sito quando c'è", () => {
    expect(leggiRispostaLettera(429, { messaggio: MESSAGGI_LETTERA.troppeRichieste })).toEqual({
      ok: false,
      messaggio: MESSAGGI_LETTERA.troppeRichieste,
      stato: 429,
    });
    expect(leggiRispostaLettera(503, { messaggio: "  Questa funzione non è ancora attiva.  " })).toMatchObject({
      messaggio: "Questa funzione non è ancora attiva.",
    });
  });

  it("senza messaggio usa un testo di ripiego per lo stato", () => {
    expect(leggiRispostaLettera(413, null)).toMatchObject({ messaggio: MESSAGGI_LETTERA.fileGrande });
    expect(leggiRispostaLettera(429, {})).toMatchObject({ messaggio: MESSAGGI_LETTERA.troppeRichieste });
    expect(leggiRispostaLettera(503, { messaggio: 42 })).toMatchObject({ messaggio: MESSAGGI_LETTERA.occupato });
    expect(leggiRispostaLettera(500, "<html>")).toMatchObject({ messaggio: MESSAGGI_LETTERA.nonCapito });
    expect(leggiRispostaLettera(502, { messaggio: "   " })).toMatchObject({ messaggio: MESSAGGI_LETTERA.nonCapito });
  });
});

describe("leggiDisponibilitaLettera", () => {
  it("legge attiva dal sito", () => {
    expect(leggiDisponibilitaLettera(200, { attiva: true })).toBe(true);
    expect(leggiDisponibilitaLettera(200, { attiva: false })).toBe(false);
  });

  it("se non si sa restituisce null", () => {
    expect(leggiDisponibilitaLettera(405, null)).toBeNull();
    expect(leggiDisponibilitaLettera(200, null)).toBeNull();
    expect(leggiDisponibilitaLettera(200, { attiva: "sì" })).toBeNull();
    expect(leggiDisponibilitaLettera(500, { attiva: true })).toBeNull();
  });
});
