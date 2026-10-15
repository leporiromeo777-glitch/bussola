import { describe, expect, it } from "vitest";
import { interpretaRisposta, mappaCitazioni } from "./citazioni";
import { frammento, testoCitato } from "./dati-prova";
import { MESSAGGI } from "./messaggi";

const frammenti = [
  frammento({ frammento_id: 1, fonte_id: "iva", titolo: "Assoggettamento all'IVA", ente: "AFC" }),
  frammento({ frammento_id: 2, fonte_id: "iva" }),
  frammento({ frammento_id: 3, fonte_id: "avs", titolo: "Contributi degli indipendenti", verificato_il: "2026-09-30" }),
];

describe("mappaCitazioni", () => {
  it("numera le fonti nell'ordine in cui vengono citate, una sola volta per fonte", () => {
    const { risposta, fonti } = mappaCitazioni(
      [
        { type: "thinking", thinking: "", signature: "x" },
        testoCitato("Sì. "),
        testoCitato("Gli indipendenti pagano i contributi AVS", [2]),
        testoCitato(" e l'IVA scatta da una certa cifra d'affari", [0, 1]),
        testoCitato("."),
      ],
      frammenti,
    );
    expect(fonti.map((f) => [f.numero, f.fonte_id])).toEqual([
      [1, "avs"],
      [2, "iva"],
    ]);
    expect(risposta.map((b) => [b.testo, b.citazioni.map((c) => c.numero)])).toEqual([
      ["Sì. ", []],
      ["Gli indipendenti pagano i contributi AVS", [1]],
      [" e l'IVA scatta da una certa cifra d'affari", [2]],
      [".", []],
    ]);
    expect(risposta[1]?.citazioni[0]).toMatchObject({
      fonte_id: "avs",
      titolo: "Contributi degli indipendenti",
      url: "https://www.esempio.admin.ch/avs",
      verificato_il: "2026-09-30",
      citato: "passaggio citato dal documento 2",
    });
  });

  it("ignora citazioni a documenti che non esistono", () => {
    const { risposta, fonti } = mappaCitazioni([testoCitato("Testo", [7])], frammenti);
    expect(fonti).toEqual([]);
    expect(risposta).toEqual([{ testo: "Testo", citazioni: [] }]);
  });
});

describe("interpretaRisposta", () => {
  it("con citazioni: risposta con fonti, non è 'senza risposta'", () => {
    const esito = interpretaRisposta(
      { stop_reason: "end_turn", content: [testoCitato("L'IVA è obbligatoria da CHF 100'000.", [0])] },
      frammenti,
    );
    expect(esito.senza_risposta).toBe(false);
    expect(esito.fonti).toHaveLength(1);
    expect(esito.avviso).toBeUndefined();
  });

  it("senza citazioni conta come domanda senza fonte", () => {
    const esito = interpretaRisposta(
      { stop_reason: "end_turn", content: [testoCitato("Non ho una fonte verificata su questo.")] },
      frammenti,
    );
    expect(esito).toMatchObject({ senza_risposta: true, fonti: [] });
  });

  it("un rifiuto diventa un messaggio cortese, senza il testo parziale", () => {
    const esito = interpretaRisposta(
      { stop_reason: "refusal", content: [testoCitato("Testo parziale", [0])] },
      frammenti,
    );
    expect(esito).toEqual({
      risposta: [{ testo: MESSAGGI.rifiuto, citazioni: [] }],
      fonti: [],
      senza_risposta: true,
    });
  });

  it("una risposta interrotta per lunghezza tiene il testo e aggiunge un avviso", () => {
    const esito = interpretaRisposta(
      { stop_reason: "max_tokens", content: [testoCitato("Prima parte della risposta", [2])] },
      frammenti,
    );
    expect(esito.risposta[0]?.testo).toBe("Prima parte della risposta");
    expect(esito.avviso).toBe(MESSAGGI.troncata);
  });

  it("una risposta vuota dà un messaggio fisso", () => {
    expect(interpretaRisposta({ stop_reason: "end_turn", content: [] }, frammenti).risposta).toEqual([
      { testo: MESSAGGI.rispostaVuota, citazioni: [] },
    ]);
    expect(interpretaRisposta({ stop_reason: "max_tokens", content: [] }, frammenti).risposta).toEqual([
      { testo: MESSAGGI.troncata, citazioni: [] },
    ]);
  });
});
