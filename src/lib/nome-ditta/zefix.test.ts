import { describe, expect, it, vi } from "vitest";
import { URL_RICERCA_ZEFIX, cercaSuZefix, corpoRicercaZefix, leggiRispostaZefix, testoRicercaZefix } from "./zefix";

// Forma delle risposte vere di Zefix (ricerca del 16.10.2026, ridotte).
const ditta = (name: string, legalFormId = 1, legalSeat = "Lugano", status = "EXISTIEREND") => ({
  name,
  ehraid: 1,
  uid: "CHE000000000",
  legalSeat,
  legalFormId,
  status,
});
const NESSUN_RISULTATO = {
  error: { code: "API.ZFR.SEARCH.NORESULT", title: "API.SEARCH.TITLE.NORESULT", message: null },
};

describe("ricerca su Zefix: richiesta", () => {
  it("cerca le parole importanti, senza articoli e preposizioni", () => {
    expect(testoRicercaZefix("Caseificio di Rossi G.")).toBe("caseificio rossi g");
    expect(testoRicercaZefix("L'Atelier della Bici di Rossi")).toBe("latelier bici rossi");
    expect(corpoRicercaZefix("Foto Rossi")).toEqual({
      name: "foto rossi",
      languageKey: "it",
      maxEntries: 10,
      deletedFirms: false,
    });
  });
});

describe("ricerca su Zefix: risposta", () => {
  it("nessun risultato (Zefix risponde 404 con un codice)", () => {
    expect(leggiRispostaZefix(404, NESSUN_RISULTATO, "Foto Rossi")).toEqual({ stato: "nessuno" });
  });

  it("errori e risposte strane: non disponibile", () => {
    expect(leggiRispostaZefix(500, { error: { code: "API.ERROR.GENERAL" } }, "x")).toEqual({ stato: "non_disponibile" });
    expect(leggiRispostaZefix(404, null, "x")).toEqual({ stato: "non_disponibile" });
    expect(leggiRispostaZefix(200, { list: "no" }, "x")).toEqual({ stato: "non_disponibile" });
  });

  it("mostra al massimo 3 ditte, con forma giuridica e sede, il nome uguale per primo", () => {
    const esito = leggiRispostaZefix(
      200,
      {
        list: [
          ditta("Estetica Mima di Maria Rossi"),
          ditta("ARCHILAB Gabriele M. Rossi SA", 3, "Pully"),
          ditta("Rossi Estetica Sagl", 4, "Bellinzona"),
          ditta("ESTETICA ROSSI", 1, "Locarno"),
        ],
        hasMoreResults: false,
      },
      "Estetica Rossi",
    );
    expect(esito).toEqual({
      stato: "trovati",
      uguale: true,
      altre: true,
      ditte: [
        { nome: "ESTETICA ROSSI", forma: "Ditta individuale", sede: "Locarno", uguale: true },
        { nome: "Estetica Mima di Maria Rossi", forma: "Ditta individuale", sede: "Lugano", uguale: false },
        { nome: "ARCHILAB Gabriele M. Rossi SA", forma: "Società anonima", sede: "Pully", uguale: false },
      ],
    });
  });

  it("solo ditte simili; forma sconosciuta; ditte non attive escluse", () => {
    const esito = leggiRispostaZefix(
      200,
      { list: [ditta("Foto Rossi Sagl", 99), ditta("Foto Rossi", 1, "Biasca", "GELOESCHT")], hasMoreResults: true },
      "Foto Rossi",
    );
    expect(esito).toEqual({
      stato: "trovati",
      uguale: false,
      altre: true,
      ditte: [{ nome: "Foto Rossi Sagl", forma: null, sede: "Lugano", uguale: false }],
    });
    expect(leggiRispostaZefix(200, { list: [ditta("Foto Rossi", 1, "Biasca", "GELOESCHT")] }, "Foto Rossi")).toEqual({
      stato: "nessuno",
    });
  });
});

describe("cercaSuZefix", () => {
  it("manda la ricerca a Zefix e legge la risposta", async () => {
    const fetch = vi.fn(async () => ({ status: 200, json: async () => ({ list: [ditta("Foto Rossi")] }) }));
    const esito = await cercaSuZefix("Foto Rossi", { fetch });
    expect(esito).toMatchObject({ stato: "trovati", uguale: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(URL_RICERCA_ZEFIX);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({ name: "foto rossi", deletedFirms: false });
  });

  it("non lancia mai: rete giù o JSON rotto diventano «non_disponibile»", async () => {
    const giu = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await cercaSuZefix("Foto Rossi", { fetch: giu })).toEqual({ stato: "non_disponibile" });
    const rotto = vi.fn(async () => ({
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    }));
    expect(await cercaSuZefix("Foto Rossi", { fetch: rotto })).toEqual({ stato: "non_disponibile" });
  });

  it("rinuncia dopo il tempo massimo", async () => {
    const lento = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<never>((_, rifiuta) => init.signal?.addEventListener("abort", () => rifiuta(new Error("abort")))),
    );
    expect(await cercaSuZefix("Foto Rossi", { fetch: lento, tempoMassimoMs: 20 })).toEqual({ stato: "non_disponibile" });
  });

  it("un nome di sole preposizioni non si cerca", async () => {
    const fetch = vi.fn();
    expect(await cercaSuZefix("di e la", { fetch })).toEqual({ stato: "non_disponibile" });
    expect(fetch).not.toHaveBeenCalled();
  });
});
