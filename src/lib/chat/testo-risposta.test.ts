import { describe, expect, it } from "vitest";
import { strutturaRisposta, testoSemplice } from "./testo-risposta";
import type { CitazioneMappata } from "./tipi";

const cit = (numero: number): CitazioneMappata => ({
  numero,
  fonte_id: `f${numero}`,
  titolo: `Fonte ${numero}`,
  url: `https://esempio.ch/${numero}`,
  ente: "Ente",
  verificato_il: "2026-10-15",
  citato: "passaggio",
});

describe("strutturaRisposta", () => {
  it("unisce i blocchi divisi dalle citazioni e mette i numeri dopo il testo citato", () => {
    const elementi = strutturaRisposta([
      { testo: "Sì: ", citazioni: [] },
      { testo: "l'iscrizione è obbligatoria da CHF 100'000", citazioni: [cit(1)] },
      { testo: ".", citazioni: [] },
    ]);
    expect(elementi).toEqual([
      {
        tipo: "paragrafo",
        parti: [
          { tipo: "testo", testo: "Sì: ", grassetto: false },
          { tipo: "testo", testo: "l'iscrizione è obbligatoria da CHF 100'000", grassetto: false },
          { tipo: "citazioni", citazioni: [cit(1)] },
          { tipo: "testo", testo: ".", grassetto: false },
        ],
      },
    ]);
  });

  it("riconosce gli elenchi puntati anche quando il trattino è in un blocco separato", () => {
    const elementi = strutturaRisposta([
      { testo: "Due cose:\n\n- ", citazioni: [] },
      { testo: "l'AVS", citazioni: [cit(1)] },
      { testo: "\n- ", citazioni: [] },
      { testo: "l'IVA", citazioni: [cit(2)] },
      { testo: "\n\nChiedi a un fiduciario.", citazioni: [] },
    ]);
    expect(elementi.map((e) => e.tipo)).toEqual(["paragrafo", "elenco", "paragrafo"]);
    const elenco = elementi[1];
    expect(elenco?.tipo === "elenco" && elenco.punti).toEqual([
      [
        { tipo: "testo", testo: "l'AVS", grassetto: false },
        { tipo: "citazioni", citazioni: [cit(1)] },
      ],
      [
        { tipo: "testo", testo: "l'IVA", grassetto: false },
        { tipo: "citazioni", citazioni: [cit(2)] },
      ],
    ]);
  });

  it("gestisce il grassetto anche tra blocchi diversi e i titoli con #", () => {
    const elementi = strutturaRisposta([
      { testo: "## In breve\nÈ **importante", citazioni: [] },
      { testo: " davvero** ricordarlo.", citazioni: [] },
    ]);
    expect(elementi).toEqual([
      { tipo: "paragrafo", parti: [{ tipo: "testo", testo: "In breve", grassetto: true }] },
      {
        tipo: "paragrafo",
        parti: [
          { tipo: "testo", testo: "È ", grassetto: false },
          { tipo: "testo", testo: "importante", grassetto: true },
          { tipo: "testo", testo: " davvero", grassetto: true },
          { tipo: "testo", testo: " ricordarlo.", grassetto: false },
        ],
      },
    ]);
  });

  it("se il testo citato finisce con un a capo, il numero resta sulla riga del testo", () => {
    const elementi = strutturaRisposta([{ testo: "Frase citata.\n", citazioni: [cit(3)] }, { testo: "Altra riga.", citazioni: [] }]);
    expect(elementi[0]).toEqual({
      tipo: "paragrafo",
      parti: [
        { tipo: "testo", testo: "Frase citata.", grassetto: false },
        { tipo: "citazioni", citazioni: [cit(3)] },
      ],
    });
  });

  it("unisce numeri vicini senza doppioni e non cambia i dati di partenza", () => {
    const blocchi = [
      { testo: "A", citazioni: [cit(1)] },
      { testo: "", citazioni: [cit(1), cit(2)] },
    ];
    const elementi = strutturaRisposta(blocchi);
    const parti = elementi[0]?.tipo === "paragrafo" ? elementi[0].parti : [];
    expect(parti.at(-1)).toEqual({ tipo: "citazioni", citazioni: [cit(1), cit(2)] });
    expect(blocchi[0]?.citazioni).toHaveLength(1);
  });

  it("una risposta vuota non produce elementi", () => {
    expect(strutturaRisposta([{ testo: "\n\n", citazioni: [] }])).toEqual([]);
  });
});

describe("testoSemplice", () => {
  it("unisce i testi dei blocchi", () => {
    expect(testoSemplice([{ testo: " Sì, ", citazioni: [] }, { testo: "certo. ", citazioni: [cit(1)] }])).toBe("Sì, certo.");
  });
});
