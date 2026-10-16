import { describe, expect, it } from "vitest";
import { LettoreNdjson, flussoNdjson, rigaEvento } from "./ndjson";
import type { EventoChat } from "./tipi";

describe("LettoreNdjson", () => {
  it("ricompone righe tagliate tra un pezzo e l'altro", () => {
    const testo = rigaEvento({ t: "testo", d: "Ciao, è così" }) + rigaEvento({ t: "errore", messaggio: "No" });
    const lettore = new LettoreNdjson();
    const eventi = [...lettore.aggiungi(testo.slice(0, 7)), ...lettore.aggiungi(testo.slice(7, 30)), ...lettore.aggiungi(testo.slice(30))];
    expect(eventi).toEqual([
      { t: "testo", d: "Ciao, è così" },
      { t: "errore", messaggio: "No" },
    ]);
    expect(lettore.chiudi()).toEqual([]);
  });

  it("legge l'ultima riga senza a capo e ignora righe non valide", () => {
    const lettore = new LettoreNdjson();
    expect(lettore.aggiungi('non json\n{"t":"sconosciuto"}\n{"t":"testo","d":1}\n{"t":"testo","d":"x"}')).toEqual([]);
    expect(lettore.chiudi()).toEqual([{ t: "testo", d: "x" }]);
  });

  it("legge l'evento della chat salvata solo se ha id e titolo", () => {
    const lettore = new LettoreNdjson();
    expect(
      lettore.aggiungi('{"t":"conversazione","id":"c1"}\n{"t":"conversazione","id":"c1","titolo":"AVS"}\n'),
    ).toEqual([{ t: "conversazione", id: "c1", titolo: "AVS" }]);
  });
});

describe("flussoNdjson", () => {
  async function leggiTutto(flusso: ReadableStream<Uint8Array>) {
    return new Response(flusso).text();
  }

  it("scrive un evento per riga", async () => {
    async function* eventi(): AsyncGenerator<EventoChat, void, undefined> {
      yield { t: "testo", d: "A" };
      yield { t: "fine", risposta: [], fonti: [], senza_risposta: true };
    }
    expect(await leggiTutto(flussoNdjson(eventi(), "errore"))).toBe(
      '{"t":"testo","d":"A"}\n{"t":"fine","risposta":[],"fonti":[],"senza_risposta":true}\n',
    );
  });

  it("un errore imprevisto diventa un evento di errore", async () => {
    const segnalati: unknown[] = [];
    async function* eventi(): AsyncGenerator<EventoChat, void, undefined> {
      yield { t: "testo", d: "A" };
      throw new Error("guasto");
    }
    const testo = await leggiTutto(flussoNdjson(eventi(), "Qualcosa non ha funzionato.", (e) => segnalati.push(e)));
    expect(testo).toBe('{"t":"testo","d":"A"}\n{"t":"errore","messaggio":"Qualcosa non ha funzionato."}\n');
    expect(segnalati).toHaveLength(1);
  });

  it("se il browser chiude la connessione, il generatore viene fermato", async () => {
    let chiuso = false;
    async function* eventi(): AsyncGenerator<EventoChat, void, undefined> {
      try {
        for (;;) yield { t: "testo", d: "x" };
      } finally {
        chiuso = true;
      }
    }
    const lettore = flussoNdjson(eventi(), "errore").getReader();
    await lettore.read();
    await lettore.cancel();
    expect(chiuso).toBe(true);
  });
});
