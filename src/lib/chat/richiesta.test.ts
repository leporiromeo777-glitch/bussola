import { describe, expect, it } from "vitest";
import { leggiRichiesta } from "./richiesta";

describe("leggiRichiesta", () => {
  it("accetta una domanda valida, la ripulisce e mette la cronologia vuota", () => {
    expect(leggiRichiesta({ domanda: "  Devo iscrivermi all'IVA?  " })).toEqual({
      ok: true,
      dati: { domanda: "Devo iscrivermi all'IVA?", cronologia: [] },
    });
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
