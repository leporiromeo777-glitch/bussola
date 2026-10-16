import { describe, expect, it } from "vitest";
import { leggiRichiesta } from "./richiesta";

describe("leggiRichiesta", () => {
  it("accetta una domanda valida, la ripulisce e mette la cronologia vuota", () => {
    expect(leggiRichiesta({ domanda: "  Devo iscrivermi all'IVA?  " })).toEqual({
      ok: true,
      dati: { conversazioneId: null, domanda: "Devo iscrivermi all'IVA?", cronologia: [] },
    });
  });

  it("accetta l'id di una chat salvata e rifiuta id con un'altra forma", () => {
    const id = "0b7c6f5e-4d3c-4b2a-9e8f-1a2b3c4d5e6f";
    expect(leggiRichiesta({ domanda: "E nei Grigioni?", conversazioneId: id })).toEqual({
      ok: true,
      dati: { conversazioneId: id, domanda: "E nei Grigioni?", cronologia: [] },
    });
    expect(leggiRichiesta({ domanda: "E nei Grigioni?", conversazioneId: null })).toMatchObject({
      ok: true,
      dati: { conversazioneId: null },
    });
    for (const sbagliato of ["1", "../altro", 42]) {
      expect(leggiRichiesta({ domanda: "E nei Grigioni?", conversazioneId: sbagliato })).toEqual({
        ok: false,
        messaggio: "La chat non è valida.",
      });
    }
  });

  it("rifiuta domande troppo corte o troppo lunghe con un messaggio in italiano", () => {
    const corta = leggiRichiesta({ domanda: " ok " });
    expect(corta).toEqual({ ok: false, messaggio: "La domanda è troppo corta: scrivi almeno qualche parola." });
    const lunga = leggiRichiesta({ domanda: "a".repeat(1_001) });
    expect(lunga).toEqual({ ok: false, messaggio: "La domanda è troppo lunga: al massimo 1000 caratteri." });
    expect(leggiRichiesta({})).toEqual({ ok: false, messaggio: "Scrivi la tua domanda." });
  });

  it("accetta al massimo 3 scambi precedenti", () => {
    const scambio = { domanda: "D", risposta: "R" };
    expect(leggiRichiesta({ domanda: "Domanda?", cronologia: [scambio, scambio, scambio] }).ok).toBe(true);
    expect(leggiRichiesta({ domanda: "Domanda?", cronologia: [scambio, scambio, scambio, scambio] })).toEqual({
      ok: false,
      messaggio: "Si possono mandare al massimo 3 scambi precedenti.",
    });
  });

  it("rifiuta corpi non validi senza messaggi tecnici", () => {
    expect(leggiRichiesta(null)).toEqual({ ok: false, messaggio: "La richiesta non è valida." });
    expect(leggiRichiesta({ domanda: "Domanda?", cronologia: [{ domanda: 1 }] })).toEqual({
      ok: false,
      messaggio: "La conversazione precedente non è valida: ricarica la pagina.",
    });
  });
});
