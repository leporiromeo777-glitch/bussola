import { describe, expect, it } from "vitest";
import { chiediABleo } from "./cliente";
import { MESSAGGI } from "./messaggi";
import { rigaEvento } from "./ndjson";

/** Risposta in streaming divisa in pezzi scelti dal test. */
function rispostaAPezzi(pezzi: string[], init?: ResponseInit) {
  const codifica = new TextEncoder();
  const corpo = new ReadableStream<Uint8Array>({
    start(controllo) {
      for (const pezzo of pezzi) controllo.enqueue(codifica.encode(pezzo));
      controllo.close();
    },
  });
  return new Response(corpo, init);
}

const fetchCon = (risposta: Response | (() => never)) =>
  (async () => (typeof risposta === "function" ? risposta() : risposta)) as unknown as typeof fetch;

describe("chiediABleo", () => {
  it("passa i pezzi di testo e restituisce l'evento finale", async () => {
    const righe =
      rigaEvento({ t: "testo", d: "Ciao" }) +
      rigaEvento({ t: "testo", d: " è" }) +
      rigaEvento({ t: "fine", risposta: [{ testo: "Ciao è", citazioni: [] }], fonti: [], senza_risposta: true });
    const testi: string[] = [];
    const esito = await chiediABleo({
      domanda: "Domanda?",
      cronologia: [],
      segnale: new AbortController().signal,
      suTesto: (d) => testi.push(d),
      fetchFn: fetchCon(rispostaAPezzi([righe.slice(0, 5), righe.slice(5, 23), righe.slice(23)])),
    });
    expect(testi).toEqual(["Ciao", " è"]);
    expect(esito).toMatchObject({ tipo: "fine", evento: { t: "fine", senza_risposta: true } });
  });

  it("mostra il messaggio del server per gli errori HTTP (per esempio quota esaurita)", async () => {
    const quota = { piano: "gratis", illimitata: false, limite: 10, rimanenti: 0, rinnovo_il: "2026-11-01", piano_scade_il: null };
    const esito = await chiediABleo({
      domanda: "Domanda?",
      cronologia: [],
      segnale: new AbortController().signal,
      suTesto: () => {},
      fetchFn: fetchCon(Response.json({ messaggio: "Hai finito le domande.", quota }, { status: 429 })),
    });
    expect(esito).toEqual({ tipo: "errore", messaggio: "Hai finito le domande.", stato: 429, quota });
  });

  it("se il flusso finisce senza evento finale lo segnala", async () => {
    const esito = await chiediABleo({
      domanda: "Domanda?",
      cronologia: [],
      segnale: new AbortController().signal,
      suTesto: () => {},
      fetchFn: fetchCon(rispostaAPezzi([rigaEvento({ t: "testo", d: "a metà" })])),
    });
    expect(esito).toEqual({ tipo: "errore", messaggio: MESSAGGI.rispostaInterrotta });
  });

  it("distingue la rete assente dall'interruzione voluta", async () => {
    const guasto = fetchCon(() => {
      throw new TypeError("Failed to fetch");
    });
    const base = { domanda: "Domanda?", cronologia: [], suTesto: () => {}, fetchFn: guasto };
    expect(await chiediABleo({ ...base, segnale: new AbortController().signal })).toEqual({
      tipo: "errore",
      messaggio: MESSAGGI.rete,
    });
    const interrotto = new AbortController();
    interrotto.abort();
    expect(await chiediABleo({ ...base, segnale: interrotto.signal })).toEqual({ tipo: "interrotta" });
  });
});
