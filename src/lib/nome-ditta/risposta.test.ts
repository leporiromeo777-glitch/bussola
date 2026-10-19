import { describe, expect, it } from "vitest";
import { MESSAGGI_NOME_DITTA } from "./proposte";
import { MESSAGGIO_PROPOSTE_NON_RIUSCITE, dettagliDitta, leggiRispostaNomi, leggiRispostaVerifica } from "./risposta";

const TROVATI = {
  stato: "trovati",
  ditte: [{ nome: "Torte Rossi", forma: "Ditta individuale", sede: "Lugano", uguale: true }],
  uguale: true,
  altre: false,
} as const;

describe("leggiRispostaNomi", () => {
  it("restituisce le proposte con il registro", () => {
    const corpo = {
      proposte: [
        { nome: "Torte Rossi", perche: "Dice cosa fai.", registro: TROVATI },
        { nome: "Dolci Rossi", perche: "Breve.", registro: { stato: "nessuno" } },
      ],
    };
    expect(leggiRispostaNomi(200, corpo)).toEqual({ ok: true, proposte: corpo.proposte });
  });

  it("salta le proposte con una forma sbagliata, come il sito", () => {
    const esito = leggiRispostaNomi(200, {
      proposte: [
        { nome: "Torte Rossi", perche: "Ok.", registro: { stato: "nessuno" } },
        { nome: "Senza registro", perche: "x" },
        { nome: "Registro strano", perche: "x", registro: { stato: "forse" } },
        { nome: "", perche: "x", registro: { stato: "nessuno" } },
        "testo",
        null,
      ],
    });
    expect(esito).toEqual({ ok: true, proposte: [{ nome: "Torte Rossi", perche: "Ok.", registro: { stato: "nessuno" } }] });
  });

  it("una lista vuota è un esito valido", () => {
    expect(leggiRispostaNomi(200, { proposte: [] })).toEqual({ ok: true, proposte: [] });
  });

  it("mostra il messaggio del sito o uno di ripiego", () => {
    expect(leggiRispostaNomi(400, { messaggio: MESSAGGI_NOME_DITTA.cognomeMancante })).toEqual({
      ok: false,
      messaggio: MESSAGGI_NOME_DITTA.cognomeMancante,
      stato: 400,
    });
    expect(leggiRispostaNomi(429, null)).toMatchObject({ ok: false, messaggio: MESSAGGI_NOME_DITTA.troppeRichieste });
    expect(leggiRispostaNomi(503, "<html>")).toMatchObject({ ok: false, messaggio: MESSAGGI_NOME_DITTA.occupato });
    expect(leggiRispostaNomi(500, { messaggio: "  " })).toMatchObject({ ok: false, messaggio: MESSAGGIO_PROPOSTE_NON_RIUSCITE });
    expect(leggiRispostaNomi(200, { proposte: "no" })).toMatchObject({ ok: false, stato: 200 });
  });
});

describe("leggiRispostaVerifica", () => {
  it("restituisce il registro", () => {
    expect(leggiRispostaVerifica(200, { registro: TROVATI })).toEqual({ registro: TROVATI, messaggio: null });
    expect(leggiRispostaVerifica(200, { registro: { stato: "nessuno" } })).toEqual({
      registro: { stato: "nessuno" },
      messaggio: null,
    });
  });

  it("con una risposta strana il registro non è disponibile", () => {
    expect(leggiRispostaVerifica(200, { registro: { stato: "trovati" } })).toEqual({
      registro: { stato: "non_disponibile" },
      messaggio: null,
    });
    expect(leggiRispostaVerifica(500, null)).toEqual({ registro: { stato: "non_disponibile" }, messaggio: null });
  });

  it("con un errore mostra il messaggio del sito", () => {
    expect(leggiRispostaVerifica(400, { messaggio: MESSAGGI_NOME_DITTA.nomeDittaMancante })).toEqual({
      registro: { stato: "non_disponibile" },
      messaggio: MESSAGGI_NOME_DITTA.nomeDittaMancante,
    });
    expect(leggiRispostaVerifica(429, null).messaggio).toBe(MESSAGGI_NOME_DITTA.troppiControlli);
  });
});

describe("dettagliDitta", () => {
  it("unisce forma e sede tra parentesi", () => {
    expect(dettagliDitta({ forma: "Ditta individuale", sede: "Lugano" })).toBe("(Ditta individuale, Lugano)");
    expect(dettagliDitta({ forma: null, sede: "Lugano" })).toBe("(Lugano)");
    expect(dettagliDitta({ forma: null, sede: null })).toBe("");
  });
});
