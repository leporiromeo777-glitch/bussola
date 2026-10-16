import { describe, expect, it } from "vitest";
import { calcolaPercorso } from "./regole";
import { VERSIONE_RISPOSTE, type Risposte } from "./risposte";
import { GIORNI_SETTIMANA, prossimiLunedi, quando, riassuntoSettimana } from "./settimana";

const risposte: Risposte = {
  versione: VERSIONE_RISPOSTE,
  attivita: "digitale_creativo",
  cantone: "TI",
  soci: "solo",
  fatturato: "da_10k_a_60k",
  clienti: "molti",
  impiego: "no",
  avviata: "no",
  permesso: "svizzero_c",
  locali: "no",
  venditaOnline: "no",
};
const percorso = calcolaPercorso(risposte);

describe("riassuntoSettimana", () => {
  it("suggerisce i primi due passi da fare non ancora fatti", () => {
    const s = riassuntoSettimana(percorso, new Set(), "2027-02-01");
    const daFare = percorso.passi.filter((p) => p.stato === "da_fare");
    expect(s.passi.map((p) => p.passo.id)).toEqual(daFare.slice(0, 2).map((p) => p.passo.id));
    expect(s.testo).toContain(`Questa settimana: «${daFare[0].passo.titolo}».`);

    const fatti = new Set([daFare[0].passo.id]);
    expect(riassuntoSettimana(percorso, fatti, "2027-02-01").passi[0].passo.id).toBe(daFare[1].passo.id);
  });

  it("include solo le scadenze dei prossimi 14 giorni, in ordine, con «tra N giorni»", () => {
    // Acconti AVS: 10 gennaio, aprile, luglio e ottobre.
    const s = riassuntoSettimana(percorso, new Set(), "2027-01-04");
    expect(s.scadenze.length).toBeGreaterThan(0);
    for (const e of s.scadenze) {
      expect(e.traGiorni).toBeGreaterThanOrEqual(0);
      expect(e.traGiorni).toBeLessThanOrEqual(GIORNI_SETTIMANA);
    }
    const date = s.scadenze.map((e) => e.data);
    expect([...date].sort()).toEqual(date);
    expect(s.scadenze[0].data).toBe("2027-01-10");
    expect(s.testo).toContain("Scadenza tra 6 giorni:");
    expect(s.testo).toContain("(10.01.2027)");
  });

  it("guarda anche all'inizio dell'anno dopo (dicembre → gennaio)", () => {
    const s = riassuntoSettimana(percorso, new Set(), "2026-12-30");
    expect(s.scadenze.some((e) => e.data === "2027-01-10")).toBe(true);
  });

  it("niente scadenze vicine e tutto fatto: lo dice", () => {
    const tutti = new Set(percorso.passi.map((p) => p.passo.id));
    const s = riassuntoSettimana(percorso, tutti, "2027-02-15");
    expect(s.passi).toEqual([]);
    if (s.scadenze.length === 0) {
      expect(s.testo).toBe(`Hai fatto tutti i passi da fare. Nessuna scadenza nei prossimi ${GIORNI_SETTIMANA} giorni.`);
    }
  });

  it("è deterministico e non duplica le scadenze", () => {
    const a = riassuntoSettimana(percorso, new Set(), "2027-03-28");
    expect(a).toEqual(riassuntoSettimana(percorso, new Set(), "2027-03-28"));
    expect(new Set(a.scadenze.map((e) => e.uid)).size).toBe(a.scadenze.length);
  });
});

describe("quando", () => {
  it("oggi, domani, tra N giorni", () => {
    expect(quando(0)).toBe("oggi");
    expect(quando(1)).toBe("domani");
    expect(quando(9)).toBe("tra 9 giorni");
  });
});

describe("prossimiLunedi", () => {
  it("dal mercoledì: il lunedì dopo e i successivi", () => {
    expect(prossimiLunedi("2026-10-14", 3)).toEqual(["2026-10-19", "2026-10-26", "2026-11-02"]);
  });

  it("di lunedì salta oggi; di domenica è domani", () => {
    expect(prossimiLunedi("2026-10-19", 1)).toEqual(["2026-10-26"]);
    expect(prossimiLunedi("2026-10-18", 1)).toEqual(["2026-10-19"]);
  });

  it("attraversa la fine dell'anno", () => {
    expect(prossimiLunedi("2026-12-30", 2)).toEqual(["2027-01-04", "2027-01-11"]);
  });
});
