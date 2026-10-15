import { describe, expect, it } from "vitest";
import {
  aggiungiGiorni,
  annoScadenzario,
  dataIsoValida,
  dateScadenza,
  eventiDaScadenze,
  generaIcs,
  nomiCalendario,
  piegaRiga,
  prefissoDate,
  proteggiTesto,
  type EventoCalendario,
} from "./calendario";
import { calcolaPercorso, type Scadenza } from "./regole";
import { VERSIONE_RISPOSTE, type Risposte } from "./risposte";

const ADESSO = new Date("2026-10-15T08:30:05.123Z");

const ticino: Risposte = {
  versione: VERSIONE_RISPOSTE,
  attivita: "digitale_creativo",
  cantone: "TI",
  soci: "solo",
  fatturato: "almeno_100k",
  clienti: "molti",
  impiego: "no",
  avviata: "no",
  permesso: "svizzero_c",
  locali: "no",
  venditaOnline: "no",
};

/** Ricompone le righe piegate (RFC 5545, 3.1). */
function spiega(ics: string): string[] {
  return ics.replace(/\r\n /g, "").split("\r\n");
}

describe("date", () => {
  it("riconosce le date ISO valide", () => {
    expect(dataIsoValida("2027-01-10")).toBe(true);
    expect(dataIsoValida("2028-02-29")).toBe(true);
    expect(dataIsoValida("2027-02-29")).toBe(false);
    expect(dataIsoValida("2027-13-01")).toBe(false);
    expect(dataIsoValida("10.01.2027")).toBe(false);
    expect(dataIsoValida("")).toBe(false);
  });

  it("somma i giorni oltre fine mese, fine anno e anno bisestile", () => {
    expect(aggiungiGiorni("2026-11-01", 30)).toBe("2026-12-01");
    expect(aggiungiGiorni("2026-12-15", 30)).toBe("2027-01-14");
    expect(aggiungiGiorni("2028-02-28", 1)).toBe("2028-02-29");
    expect(aggiungiGiorni("2027-02-28", 1)).toBe("2027-03-01");
    // Cambio dell'ora legale: nessun effetto sulle date.
    expect(aggiungiGiorni("2027-03-27", 1)).toBe("2027-03-28");
    expect(aggiungiGiorni("2027-10-30", 1)).toBe("2027-10-31");
  });

  it("anno dello scadenzario: da ottobre guarda all'anno seguente", () => {
    expect(annoScadenzario(new Date(2026, 9, 15))).toBe(2027);
    expect(annoScadenzario(new Date(2026, 11, 31))).toBe(2027);
    expect(annoScadenzario(new Date(2027, 0, 1))).toBe(2027);
    expect(annoScadenzario(new Date(2027, 8, 30))).toBe(2027);
  });
});

describe("date delle scadenze", () => {
  const scadenze = calcolaPercorso(ticino).scadenze;
  const trova = (id: string) => scadenze.find((s) => s.id === id) as Scadenza;

  it("acconti AVS 2027: 10.1, 10.4, 10.7, 10.10", () => {
    expect(dateScadenza(trova("acconti-avs"), 2027).map((d) => d.data)).toEqual([
      "2027-01-10",
      "2027-04-10",
      "2027-07-10",
      "2027-10-10",
    ]);
  });

  it("IFD 2027: 31.3", () => {
    expect(dateScadenza(trova("ifd"), 2027)).toEqual([{ data: "2027-03-31", etichetta: "rata unica" }]);
  });

  it("acconti cantonali: solo le date pubblicate per quell'anno", () => {
    expect(dateScadenza(trova("acconti-cantonali"), 2026).map((d) => d.data)).toEqual([
      "2026-05-31",
      "2026-07-31",
      "2026-09-30",
    ]);
    expect(dateScadenza(trova("acconti-cantonali"), 2027)).toEqual([]);
  });

  it("annuncio IVA: 30 giorni dalla data di inizio indicata, niente senza data valida", () => {
    const iva = trova("annuncio-iva");
    expect(dateScadenza(iva, 2027, "2026-12-15")).toEqual([
      { data: "2027-01-14", etichetta: "30 giorni dopo l'inizio del 15.12.2026" },
    ]);
    expect(dateScadenza(iva, 2027)).toEqual([]);
    expect(dateScadenza(iva, 2027, "2026-02-30")).toEqual([]);
  });

  it("la dichiarazione non ha una data fissa", () => {
    expect(dateScadenza(trova("dichiarazione"), 2027)).toEqual([]);
  });

  it("eventi 2027 ordinati per data, con UID stabili e fonte nella descrizione", () => {
    const eventi = eventiDaScadenze(scadenze, { anno: 2027, inizioAttivita: "2027-02-01" });
    expect(eventi.map((e) => e.data)).toEqual([
      "2027-01-10",
      "2027-03-03",
      "2027-03-31",
      "2027-04-10",
      "2027-07-10",
      "2027-10-10",
    ]);
    expect(eventi[0]).toMatchObject({
      uid: "acconti-avs-2027-01-10@bussola",
      titolo: "Acconto AVS (4° trimestre dell'anno prima)",
      url: "https://www.ahv-iv.ch/p/2.02.i",
    });
    expect(eventi[0].descrizione).toContain("Fonte: Promemoria 2.02");
    expect(eventi[1].titolo).toBe("Annuncio all'IVA (30 giorni dopo l'inizio del 01.02.2027)");
    expect(new Set(eventi.map((e) => e.uid)).size).toBe(eventi.length);
  });
});

describe("anno del riquadro e del file", () => {
  const evento = (data: string): EventoCalendario => ({ uid: data, data, titolo: "x", descrizione: "y" });

  it("il termine IVA dall'inizio si legge «Entro il …», le altre date «Nel {anno}: …»", () => {
    const scadenze = calcolaPercorso(ticino).scadenze;
    const iva = scadenze.find((s) => s.id === "annuncio-iva");
    const avs = scadenze.find((s) => s.id === "acconti-avs");
    if (!iva || !avs) throw new Error("scadenze mancanti");
    expect(prefissoDate(iva, 2027)).toBe("Entro il ");
    expect(prefissoDate(avs, 2027)).toBe("Nel 2027: ");
  });

  it("con l'anno nel nome solo se tutte le date sono di quell'anno", () => {
    expect(nomiCalendario([evento("2027-01-10"), evento("2027-04-10")], 2027)).toEqual({
      nomeCalendario: "Bussola: scadenze 2027",
      nomeFile: "bussola-scadenze-2027.ics",
    });
    expect(nomiCalendario([], 2027).nomeFile).toBe("bussola-scadenze-2027.ics");
    // Il 15.10.2026 il calendario è del 2027, ma il termine IVA da un inizio al 01.10.2026 cade nel 2026.
    const eventi = eventiDaScadenze(calcolaPercorso(ticino).scadenze, { anno: 2027, inizioAttivita: "2026-10-01" });
    expect(eventi.some((e) => e.data === "2026-10-31")).toBe(true);
    expect(nomiCalendario(eventi, 2027)).toEqual({
      nomeCalendario: "Bussola: scadenze",
      nomeFile: "bussola-scadenze.ics",
    });
    // Un solo evento, ma di un altro anno: niente anno nel nome.
    expect(nomiCalendario([evento("2026-10-31")], 2027).nomeCalendario).toBe("Bussola: scadenze");
  });
});

describe("testo e righe iCalendar", () => {
  it("protegge barre, punti e virgola, virgole e a capo", () => {
    expect(proteggiTesto("a,b;c\\d\ne\r\nf")).toBe("a\\,b\\;c\\\\d\\ne\\nf");
    expect(proteggiTesto("CHF 1'000: 8,1%")).toBe("CHF 1'000: 8\\,1%");
  });

  it("non piega le righe corte", () => {
    expect(piegaRiga("SUMMARY:Breve")).toBe("SUMMARY:Breve");
    const settantacinque = "X".repeat(75);
    expect(piegaRiga(settantacinque)).toBe(settantacinque);
  });

  it("piega a 75 ottetti, con lo spazio iniziale nelle righe seguenti", () => {
    const riga = "D".repeat(200);
    const piegata = piegaRiga(riga);
    const pezzi = piegata.split("\r\n");
    expect(pezzi[0]).toHaveLength(75);
    for (const p of pezzi.slice(1)) {
      expect(p.startsWith(" ")).toBe(true);
      expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
    }
    expect(piegata.replace(/\r\n /g, "")).toBe(riga);
  });

  it("non spezza a metà i caratteri UTF-8 (à, °, emoji)", () => {
    const riga = `DESCRIPTION:${"à°".repeat(40)}🙂fine`;
    const piegata = piegaRiga(riga);
    for (const p of piegata.split("\r\n")) {
      expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
      expect(p).not.toContain("�");
    }
    expect(piegata.replace(/\r\n /g, "")).toBe(riga);
  });
});

describe("file .ics", () => {
  const evento: EventoCalendario = {
    uid: "prova-2027-01-10@bussola",
    data: "2027-01-10",
    titolo: "Acconto AVS, 1° trimestre; prova",
    descrizione: "Riga uno\nRiga due, con virgola",
    url: "https://www.ahv-iv.ch/p/2.02.i",
  };

  it("usa CRLF ovunque e termina con CRLF", () => {
    const ics = generaIcs([evento], { adesso: ADESSO });
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("ha intestazione, evento di un giorno intero e promemoria", () => {
    const righe = spiega(generaIcs([evento], { adesso: ADESSO, nomeCalendario: "Bussola: scadenze 2027" }));
    expect(righe.slice(0, 6)).toEqual([
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Bussola//Scadenze del percorso//IT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Bussola: scadenze 2027",
    ]);
    expect(righe).toContain("UID:prova-2027-01-10@bussola");
    expect(righe).toContain("DTSTAMP:20261015T083005Z");
    expect(righe).toContain("DTSTART;VALUE=DATE:20270110");
    expect(righe).toContain("DTEND;VALUE=DATE:20270111");
    expect(righe).toContain("SUMMARY:Acconto AVS\\, 1° trimestre\\; prova");
    expect(righe).toContain("DESCRIPTION:Riga uno\\nRiga due\\, con virgola");
    expect(righe).toContain("URL:https://www.ahv-iv.ch/p/2.02.i");
    expect(righe).toContain("TRIGGER:-P7D");
    expect(righe.filter((r) => r === "BEGIN:VEVENT")).toHaveLength(1);
    expect(righe.filter((r) => r === "END:VEVENT")).toHaveLength(1);
  });

  it("fine anno: l'evento del 31 dicembre finisce il 1° gennaio", () => {
    const righe = spiega(generaIcs([{ ...evento, data: "2027-12-31" }], { adesso: ADESSO }));
    expect(righe).toContain("DTEND;VALUE=DATE:20280101");
  });

  it("salta gli eventi con date non valide e accetta un calendario vuoto", () => {
    const righe = spiega(generaIcs([{ ...evento, data: "2027-02-30" }], { adesso: ADESSO }));
    expect(righe).not.toContain("BEGIN:VEVENT");
    expect(spiega(generaIcs([], { adesso: ADESSO })).at(-2)).toBe("END:VCALENDAR");
  });

  it("nessuna riga supera 75 ottetti nel file completo del percorso", () => {
    const eventi = eventiDaScadenze(calcolaPercorso(ticino).scadenze, { anno: 2027, inizioAttivita: "2026-11-02" });
    const ics = generaIcs(eventi, { adesso: ADESSO });
    for (const riga of ics.split("\r\n")) expect(new TextEncoder().encode(riga).length).toBeLessThanOrEqual(75);
    expect(spiega(ics).filter((r) => r === "BEGIN:VEVENT")).toHaveLength(eventi.length);
  });
});
