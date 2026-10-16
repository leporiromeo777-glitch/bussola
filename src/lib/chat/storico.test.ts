import { describe, expect, it, vi } from "vitest";
import type { MessaggioSalvato } from "./conversazioni";
import { LUNGHEZZA_RISPOSTA_IN_CRONOLOGIA } from "./limiti";
import { MESSAGGI } from "./messaggi";
import {
  conConversazione,
  conversazioneDaRiga,
  cronologiaDaMessaggi,
  domandaGiaSalvata,
  leggiTitolo,
  messaggiDaRighe,
  rigaRispostaBleo,
  scambiDaMessaggi,
} from "./storico";
import type { EventoChat, FonteCitata } from "./tipi";

const FONTE: FonteCitata = {
  numero: 1,
  fonte_id: "avs",
  titolo: "Contributi degli indipendenti",
  url: "https://example.ch/avs",
  ente: "AVS",
  verificato_il: "2026-10-15",
};

let contatore = 0;
const utente = (testo: string): MessaggioSalvato => ({
  id: String(++contatore),
  ruolo: "utente",
  testo,
  creatoIl: "2026-10-16T08:00:00.000Z",
});
const bleo = (testo: string): MessaggioSalvato => ({
  id: String(++contatore),
  ruolo: "bleo",
  testo,
  risposta: [{ testo, citazioni: [] }],
  fonti: [],
  senzaRisposta: false,
  avviso: null,
  creatoIl: "2026-10-16T08:00:01.000Z",
});

describe("righe del database", () => {
  it("conversazioneDaRiga mette la data in ISO 8601", () => {
    expect(
      conversazioneDaRiga({ id: "c1", titolo: "AVS", aggiornata_il: "2026-10-16 10:15:00.123+02" }),
    ).toEqual({ id: "c1", titolo: "AVS", aggiornataIl: "2026-10-16T08:15:00.123Z" });
  });

  it("messaggiDaRighe legge domande e risposte e salta i ruoli sconosciuti", () => {
    const messaggi = messaggiDaRighe([
      {
        id: 7,
        ruolo: "utente",
        testo: "Quanto pago di AVS?",
        risposta: null,
        fonti: null,
        senza_risposta: false,
        avviso: null,
        creato_il: "2026-10-16T08:00:00+00:00",
      },
      {
        id: 8,
        ruolo: "bleo",
        testo: "Circa il 10%.",
        risposta: [{ testo: "Circa il 10%.", citazioni: [] }],
        fonti: [FONTE],
        senza_risposta: false,
        avviso: "Controlla la fonte.",
        creato_il: "2026-10-16T08:00:05+00:00",
      },
      {
        id: 9,
        ruolo: "sistema",
        testo: "?",
        risposta: null,
        fonti: null,
        senza_risposta: null,
        avviso: null,
        creato_il: "2026-10-16T08:00:06+00:00",
      },
      {
        id: 10,
        ruolo: "bleo",
        testo: "Rotta",
        risposta: { non: "un elenco" },
        fonti: "niente",
        senza_risposta: null,
        avviso: null,
        creato_il: "2026-10-16T08:00:07+00:00",
      },
    ]);
    expect(messaggi).toEqual([
      { id: "7", ruolo: "utente", testo: "Quanto pago di AVS?", creatoIl: "2026-10-16T08:00:00.000Z" },
      {
        id: "8",
        ruolo: "bleo",
        testo: "Circa il 10%.",
        risposta: [{ testo: "Circa il 10%.", citazioni: [] }],
        fonti: [FONTE],
        senzaRisposta: false,
        avviso: "Controlla la fonte.",
        creatoIl: "2026-10-16T08:00:05.000Z",
      },
      {
        id: "10",
        ruolo: "bleo",
        testo: "Rotta",
        risposta: [],
        fonti: [],
        senzaRisposta: false,
        avviso: null,
        creatoIl: "2026-10-16T08:00:07.000Z",
      },
    ]);
  });
});

describe("scambi e contesto", () => {
  it("accoppia domande e risposte; una domanda senza risposta resta da sola", () => {
    const messaggi = [utente("A?"), bleo("A."), utente("B?"), utente("C?"), bleo("C.")];
    expect(scambiDaMessaggi(messaggi).map((s) => [s.domanda.testo, s.risposta?.testo ?? null])).toEqual([
      ["A?", "A."],
      ["B?", null],
      ["C?", "C."],
    ]);
    // Una risposta senza domanda prima (non dovrebbe succedere) si ignora.
    expect(scambiDaMessaggi([bleo("Sola.")])).toEqual([]);
  });

  it("cronologiaDaMessaggi tiene gli ultimi scambi completi, con le risposte accorciate", () => {
    const lunga = "x".repeat(LUNGHEZZA_RISPOSTA_IN_CRONOLOGIA + 500);
    const messaggi = [
      utente("1?"),
      bleo("1."),
      utente("2?"),
      bleo(lunga),
      utente("senza risposta?"),
      utente("3?"),
      bleo("3."),
      utente("4?"),
      bleo("4."),
      utente("in corso?"),
    ];
    expect(cronologiaDaMessaggi(messaggi)).toEqual([
      { domanda: "2?", risposta: "x".repeat(LUNGHEZZA_RISPOSTA_IN_CRONOLOGIA) },
      { domanda: "3?", risposta: "3." },
      { domanda: "4?", risposta: "4." },
    ]);
    expect(cronologiaDaMessaggi(messaggi, 1)).toEqual([{ domanda: "4?", risposta: "4." }]);
    expect(cronologiaDaMessaggi(messaggi, 0)).toEqual([]);
    expect(cronologiaDaMessaggi([])).toEqual([]);
  });

  it("domandaGiaSalvata riconosce un «Riprova» della stessa domanda", () => {
    expect(domandaGiaSalvata([utente("A?"), bleo("A."), utente("B?")], " B? ")).toBe(true);
    expect(domandaGiaSalvata([utente("A?"), bleo("A."), utente("B?")], "C?")).toBe(false);
    expect(domandaGiaSalvata([utente("A?"), bleo("A.")], "A?")).toBe(false);
    expect(domandaGiaSalvata([], "A?")).toBe(false);
  });
});

describe("rigaRispostaBleo", () => {
  it("salva il testo semplice, i blocchi, le fonti e l'avviso", () => {
    const fine = {
      t: "fine" as const,
      risposta: [
        { testo: "Sì, ", citazioni: [] },
        { testo: "se superi la soglia.", citazioni: [{ ...FONTE, citato: "almeno 100 000 franchi" }] },
      ],
      fonti: [FONTE],
      senza_risposta: false,
    };
    expect(rigaRispostaBleo(fine)).toEqual({
      ruolo: "bleo",
      testo: "Sì, se superi la soglia.",
      risposta: fine.risposta,
      fonti: [FONTE],
      senza_risposta: false,
      avviso: null,
    });
    expect(rigaRispostaBleo({ ...fine, avviso: "Attenzione" }).avviso).toBe("Attenzione");
  });
});

describe("leggiTitolo", () => {
  it("ripulisce gli spazi e accetta da 1 a 60 caratteri", () => {
    expect(leggiTitolo({ titolo: "  AVS   e IVA \n" })).toEqual({ ok: true, titolo: "AVS e IVA" });
    expect(leggiTitolo({ titolo: "x".repeat(60) })).toEqual({ ok: true, titolo: "x".repeat(60) });
  });

  it("rifiuta titoli vuoti, troppo lunghi o mancanti", () => {
    for (const corpo of [{ titolo: "   " }, { titolo: "x".repeat(61) }, { titolo: 3 }, {}, null, "AVS"]) {
      expect(leggiTitolo(corpo)).toEqual({ ok: false, messaggio: MESSAGGI.titoloNonValido });
    }
  });
});

describe("conConversazione", () => {
  async function tutti(eventi: AsyncGenerator<EventoChat, void, undefined>) {
    const letti: EventoChat[] = [];
    for await (const e of eventi) letti.push(e);
    return letti;
  }
  async function* risposta(...eventi: EventoChat[]): AsyncGenerator<EventoChat, void, undefined> {
    yield* eventi;
  }
  const FINE: EventoChat = { t: "fine", risposta: [{ testo: "Sì.", citazioni: [] }], fonti: [], senza_risposta: false };
  const CHAT = { id: "c1", titolo: "IVA", aggiornataIl: "2026-10-16T08:00:00.000Z" };

  it("manda prima la chat, poi la risposta, e la salva prima dell'evento finale", async () => {
    const ordine: string[] = [];
    const salva = vi.fn(async () => {
      ordine.push("salvata");
    });
    const eventi = conConversazione(risposta({ t: "testo", d: "Sì." }, FINE), CHAT, salva, () => {});
    for await (const e of eventi) ordine.push(e.t);
    expect(ordine).toEqual(["conversazione", "testo", "salvata", "fine"]);
    expect(salva).toHaveBeenCalledWith(FINE);
  });

  it("dopo un errore non salva nessuna risposta", async () => {
    const salva = vi.fn(async () => {});
    const eventi = await tutti(conConversazione(risposta({ t: "errore", messaggio: "No" }), CHAT, salva, () => {}));
    expect(eventi).toEqual([{ t: "conversazione", id: "c1", titolo: "IVA" }, { t: "errore", messaggio: "No" }]);
    expect(salva).not.toHaveBeenCalled();
  });

  it("un salvataggio non riuscito non blocca la risposta", async () => {
    const registrati: string[] = [];
    const eventi = await tutti(
      conConversazione(
        risposta(FINE),
        CHAT,
        async () => {
          throw new Error("database");
        },
        (contesto) => registrati.push(contesto),
      ),
    );
    expect(eventi.map((e) => e.t)).toEqual(["conversazione", "fine"]);
    expect(registrati).toEqual(["salvataggio della risposta nella chat"]);
  });

  it("senza chat il flusso resta quello di prima", async () => {
    const salva = vi.fn(async () => {});
    expect(await tutti(conConversazione(risposta(FINE), null, salva, () => {}))).toEqual([FINE]);
    expect(salva).not.toHaveBeenCalled();
  });
});
