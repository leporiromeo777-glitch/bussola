import { describe, expect, it } from "vitest";
import { aggiungiDettato, messaggioErroreDettatura } from "./testo";

describe("aggiungiDettato", () => {
  it("con il campo vuoto mette la maiuscola", () => {
    expect(aggiungiDettato("", "voglio aprire un bar")).toBe("Voglio aprire un bar");
  });

  it("continua la frase con uno spazio, senza maiuscola", () => {
    expect(aggiungiDettato("Voglio aprire", "un bar a Bellinzona")).toBe("Voglio aprire un bar a Bellinzona");
  });

  it("dopo un punto comincia una frase nuova", () => {
    expect(aggiungiDettato("Faccio grafica.", "lavoro anche al 60%")).toBe("Faccio grafica. Lavoro anche al 60%");
  });

  it("toglie spazi doppi e ignora un dettato vuoto", () => {
    expect(aggiungiDettato("Ciao  ", "  come   va ")).toBe("Ciao come va");
    expect(aggiungiDettato("Ciao", "   ")).toBe("Ciao");
  });

  it("non supera il massimo di caratteri", () => {
    expect(aggiungiDettato("abc", "defgh", 6)).toBe("abc de");
  });
});

describe("messaggioErroreDettatura", () => {
  it("spiega il permesso negato, il silenzio e la rete", () => {
    expect(messaggioErroreDettatura("not-allowed")).toMatch(/permesso/);
    expect(messaggioErroreDettatura("no-speech")).toMatch(/Non ho sentito/);
    expect(messaggioErroreDettatura("network")).toMatch(/connessione/);
  });

  it("interruzione voluta: nessun messaggio; errori sconosciuti: messaggio generico", () => {
    expect(messaggioErroreDettatura("aborted")).toBe("");
    expect(messaggioErroreDettatura("boh")).toMatch(/non ha funzionato/);
  });
});
