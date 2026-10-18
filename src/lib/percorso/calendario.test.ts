import { describe, expect, it } from "vitest";
import {
  aggiungiGiorni,
  annoScadenzario,
  dataIsoValida,
  dateFisseDaOggi,
  dateScadenza,
  eventiDaScadenze,
  generaIcs,
  nomiCalendario,
  piegaRiga,
  prefissoDate,
  proteggiTesto,
  testoDateFisse,
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

  it("acconti cantonali: se tutte le date dell'ultimo anno sono passate, non sono più scadenze", () => {
    const cantonali = trova("acconti-cantonali");
    if (cantonali.calendario.tipo !== "fisse") throw new Error("date fisse attese");
    const date = cantonali.calendario.date;

    const ottobre = dateFisseDaOggi(date, "2026-10-16");
    expect(ottobre).toEqual({
      stato: "da-pubblicare",
      anno: 2026,
      annoProssimo: 2027,
      date: [
        { data: "2026-05-31", etichetta: "1ª rata" },
        { data: "2026-07-31", etichetta: "2ª rata" },
        { data: "2026-09-30", etichetta: "3ª rata" },
      ],
    });
    if (!ottobre) return;
    expect(testoDateFisse(ottobre)).toBe(
      "Le date del 2027 non sono ancora pubblicate: di solito escono a fine anno. Come esempio, i termini del 2026, già passati: 31.05.2026, 31.07.2026, 30.09.2026.",
    );

    // L'anno dopo si parla dell'anno in corso, non di quello passato.
    const marzo2027 = dateFisseDaOggi(date, "2027-03-01");
    expect(marzo2027?.stato === "da-pubblicare" && marzo2027.annoProssimo).toBe(2027);
  });

  it("acconti cantonali: le date future restano scadenze, quelle passate sono segnate", () => {
    const cantonali = trova("acconti-cantonali");
    if (cantonali.calendario.tipo !== "fisse") throw new Error("date fisse attese");
    const giugno = dateFisseDaOggi(cantonali.calendario.date, "2026-06-15");
    expect(giugno?.stato).toBe("pubblicate");
    if (!giugno) return;
    expect(testoDateFisse(giugno)).toBe(
      "Termini di pagamento 2026: 31.05.2026 (già passato), 31.07.2026, 30.09.2026.",
    );
    // Il giorno stesso del termine non è ancora passato.
    expect(dateFisseDaOggi(cantonali.calendario.date, "2026-09-30")?.stato).toBe("pubblicate");
    expect(dateFisseDaOggi(cantonali.calendario.date, "2026-10-01")?.stato).toBe("da-pubblicare");
  });

  it("date fisse: con un anno nuovo pubblicato usa quello, senza date non dice niente", () => {
    const date = [
      { data: "2026-05-31", etichetta: "1ª rata" },
      { data: "2027-05-31", etichetta: "1ª rata" },
    ];
    expect(dateFisseDaOggi(date, "2026-11-20")).toEqual({
      stato: "pubblicate",
      anno: 2027,
      date: [{ data: "2027-05-31", etichetta: "1ª rata", passata: false }],
    });
    expect(dateFisseDaOggi([], "2026-11-20")).toBeNull();
    expect(dateFisseDaOggi(date, "20.11.2026")).toBeNull();
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
      nomeCalendario: "Bleo: scadenze 2027",
      nomeFile: "bleo-scadenze-2027.ics",
    });
    expect(nomiCalendario([], 2027).nomeFile).toBe("bleo-scadenze-2027.ics");
    // Il 15.10.2026 il calendario è del 2027, ma il termine IVA da un inizio al 01.10.2026 cade nel 2026.
    const eventi = eventiDaScadenze(calcolaPercorso(ticino).scadenze, { anno: 2027, inizioAttivita: "2026-10-01" });
    expect(eventi.some((e) => e.data === "2026-10-31")).toBe(true);
    expect(nomiCalendario(eventi, 2027)).toEqual({
      nomeCalendario: "Bleo: scadenze",
      nomeFile: "bleo-scadenze.ics",
    });
    // Un solo evento, ma di un altro anno: niente anno nel nome.
    expect(nomiCalendario([evento("2026-10-31")], 2027).nomeCalendario).toBe("Bleo: scadenze");
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
    const righe = spiega(generaIcs([evento], { adesso: ADESSO, nomeCalendario: "Bleo: scadenze 2027" }));
    expect(righe.slice(0, 6)).toEqual([
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Bleo//Scadenze del percorso//IT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Bleo: scadenze 2027",
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

  it("per i calendari con iscrizione: descrizione e intervallo di aggiornamento, solo se validi", () => {
    const righe = spiega(
      generaIcs([evento], { adesso: ADESSO, descrizioneCalendario: "Scadenze, con fonti", aggiornaOgni: "PT12H" }),
    );
    expect(righe).toContain("X-WR-CALDESC:Scadenze\\, con fonti");
    expect(righe).toContain("REFRESH-INTERVAL;VALUE=DURATION:PT12H");
    expect(righe).toContain("X-PUBLISHED-TTL:PT12H");
    expect(righe.indexOf("X-PUBLISHED-TTL:PT12H")).toBeLessThan(righe.indexOf("BEGIN:VEVENT"));
    for (const sbagliata of ["12 ore", "PT", "P", "PT12H\r\nX-ALTRO:1"]) {
      const ics = generaIcs([evento], { adesso: ADESSO, aggiornaOgni: sbagliata });
      expect(ics).not.toContain("REFRESH-INTERVAL");
    }
    expect(generaIcs([evento], { adesso: ADESSO, aggiornaOgni: "P1D" })).toContain("X-PUBLISHED-TTL:P1D");
    // Senza opzioni il file da scaricare resta com'era.
    const semplice = generaIcs([evento], { adesso: ADESSO });
    expect(semplice).not.toContain("X-WR-CALDESC");
    expect(semplice).not.toContain("REFRESH-INTERVAL");
  });

  it("nessuna riga supera 75 ottetti nel file completo del percorso", () => {
    const eventi = eventiDaScadenze(calcolaPercorso(ticino).scadenze, { anno: 2027, inizioAttivita: "2026-11-02" });
    const ics = generaIcs(eventi, { adesso: ADESSO });
    for (const riga of ics.split("\r\n")) expect(new TextEncoder().encode(riga).length).toBeLessThanOrEqual(75);
    expect(spiega(ics).filter((r) => r === "BEGIN:VEVENT")).toHaveLength(eventi.length);
  });
});
