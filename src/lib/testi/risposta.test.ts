import { describe, expect, it } from "vitest";
import { MESSAGGI_TESTI } from "./richiesta";
import { leggiRispostaTesti } from "./risposta";

describe("leggiRispostaTesti", () => {
  it("restituisce i testi del sito", () => {
    const testi = [
      { titolo: "Bio per Instagram", testo: "Riparo bici a Bellinzona 🚲" },
      { titolo: "Descrizione per il sito", testo: "Sono Luca e riparo biciclette." },
    ];
    expect(leggiRispostaTesti(200, { testi })).toEqual({ ok: true, testi });
  });

  it("tiene solo i testi con titolo e testo", () => {
    expect(
      leggiRispostaTesti(200, {
        testi: [{ titolo: "Oggetto", testo: "Ciao" }, { titolo: "Vuoto", testo: "  " }, { testo: "senza titolo" }, null, 3],
      }),
    ).toEqual({ ok: true, testi: [{ titolo: "Oggetto", testo: "Ciao" }] });
  });

  it("senza testi è un errore", () => {
    expect(leggiRispostaTesti(200, { testi: [] })).toEqual({ ok: false, messaggio: MESSAGGI_TESTI.nonRiuscito, stato: 200 });
    expect(leggiRispostaTesti(200, null)).toMatchObject({ ok: false, messaggio: MESSAGGI_TESTI.nonRiuscito });
  });

  it("mostra il messaggio del sito o uno di ripiego", () => {
    expect(leggiRispostaTesti(400, { messaggio: MESSAGGI_TESTI.descrizioneCorta })).toEqual({
      ok: false,
      messaggio: MESSAGGI_TESTI.descrizioneCorta,
      stato: 400,
    });
    expect(leggiRispostaTesti(429, null)).toMatchObject({ messaggio: MESSAGGI_TESTI.troppeRichieste });
    expect(leggiRispostaTesti(503, "<html>")).toMatchObject({ messaggio: MESSAGGI_TESTI.occupato });
    expect(leggiRispostaTesti(502, { messaggio: "" })).toMatchObject({ messaggio: MESSAGGI_TESTI.nonRiuscito });
  });
});
