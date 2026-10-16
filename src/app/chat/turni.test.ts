import { describe, expect, it } from "vitest";
import type { MessaggioSalvato } from "@/lib/chat/conversazioni";
import { cronologiaDaTurni, dataLocale, testoDaCopiare, turniDaMessaggi } from "./turni";

const utente = (id: string, testo: string): MessaggioSalvato => ({ id, ruolo: "utente", testo, creatoIl: "2026-10-16T08:00:00.000Z" });
const bleo = (id: string, testo: string): MessaggioSalvato => ({
  id,
  ruolo: "bleo",
  testo,
  risposta: [{ testo, citazioni: [] }],
  fonti: [],
  senzaRisposta: false,
  avviso: null,
  creatoIl: "2026-10-16T08:00:01.000Z",
});

describe("turniDaMessaggi", () => {
  it("mostra le risposte salvate e offre «Riprova» solo per l'ultima domanda senza risposta", () => {
    const turni = turniDaMessaggi([utente("1", "A?"), bleo("2", "A."), utente("3", "B?"), utente("4", "C?")]);
    expect(turni.map((t) => [t.chiave, t.stato, t.azione])).toEqual([
      ["s1", "completo", "nessuna"],
      ["s3", "errore", "nessuna"],
      ["s4", "errore", "riprova"],
    ]);
    expect(turni[0]?.fine?.risposta).toEqual([{ testo: "A.", citazioni: [] }]);
  });
});

describe("cronologiaDaTurni", () => {
  it("rimanda solo gli ultimi 3 scambi completi", () => {
    const turni = turniDaMessaggi([
      utente("1", "1?"),
      bleo("2", "1."),
      utente("3", "2?"),
      bleo("4", "2."),
      utente("5", "3?"),
      bleo("6", "3."),
      utente("7", "4?"),
      bleo("8", "4."),
      utente("9", "senza?"),
    ]);
    expect(cronologiaDaTurni(turni)).toEqual([
      { domanda: "2?", risposta: "2." },
      { domanda: "3?", risposta: "3." },
      { domanda: "4?", risposta: "4." },
    ]);
  });
});

describe("testoDaCopiare", () => {
  it("aggiunge le fonti con i link sotto la risposta", () => {
    const fine = {
      risposta: [{ testo: "Paghi circa il 10%.", citazioni: [] }],
      fonti: [
        {
          numero: 1,
          fonte_id: "avs",
          titolo: "Contributi degli indipendenti",
          url: "https://example.ch/avs",
          ente: "AVS",
          verificato_il: "2026-10-15",
        },
      ],
      senzaRisposta: false,
      avviso: null,
    };
    expect(testoDaCopiare(fine)).toBe(
      "Paghi circa il 10%.\n\nFonti:\n[1] Contributi degli indipendenti (AVS): https://example.ch/avs",
    );
    expect(testoDaCopiare({ ...fine, fonti: [] })).toBe("Paghi circa il 10%.");
  });
});

describe("dataLocale", () => {
  it("scrive la data locale come AAAA-MM-GG", () => {
    expect(dataLocale(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
