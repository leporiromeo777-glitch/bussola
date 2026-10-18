import { describe, expect, it } from "vitest";
import { generaIcs } from "@/lib/percorso/calendario";
import { GIORNI_IN_SCADENZA } from "./limiti";
import {
  badgeScadenza,
  contaDaGuardare,
  daGuardare,
  eventiDocumenti,
  giorniTra,
  isoDaDataScritta,
  raggruppaDocumenti,
  statoScadenza,
  testoDataScadenza,
} from "./scadenze";
import type { TipoDocumento } from "./tipi";

const OGGI = "2026-10-19";

function doc(id: string, scadeIl: string | null, titolo = `Documento ${id}`, tipo: TipoDocumento = "altro") {
  return { id, titolo, tipo, scadeIl };
}

describe("giorniTra", () => {
  it("conta i giorni di calendario, anche a cavallo dell'ora legale e degli anni", () => {
    expect(giorniTra("2026-10-19", "2026-10-19")).toBe(0);
    expect(giorniTra("2026-10-19", "2026-10-20")).toBe(1);
    expect(giorniTra("2026-10-20", "2026-10-19")).toBe(-1);
    expect(giorniTra("2026-03-28", "2026-03-30")).toBe(2);
    expect(giorniTra("2026-12-31", "2027-01-01")).toBe(1);
    expect(giorniTra("2028-02-28", "2028-03-01")).toBe(2);
  });
});

describe("statoScadenza e badgeScadenza", () => {
  it("senza data o con una data non valida: nessuna scadenza, nessun badge", () => {
    expect(statoScadenza(null, OGGI)).toEqual({ tipo: "nessuna" });
    expect(statoScadenza("2026-02-31", OGGI)).toEqual({ tipo: "nessuna" });
    expect(badgeScadenza(null, OGGI)).toBeNull();
  });

  it("il giorno della scadenza vale ancora: «Scade oggi», poi «Scaduto»", () => {
    expect(badgeScadenza("2026-10-19", OGGI)).toEqual({ testo: "Scade oggi", tono: "attenzione" });
    expect(badgeScadenza("2026-10-18", OGGI)).toEqual({ testo: "Scaduto", tono: "pericolo" });
    expect(statoScadenza("2026-10-09", OGGI)).toEqual({ tipo: "scaduto", giorni: 10 });
  });

  it("«Scade domani» e «Scade tra N giorni» fino al primo promemoria", () => {
    expect(badgeScadenza("2026-10-20", OGGI)?.testo).toBe("Scade domani");
    expect(badgeScadenza("2026-10-31", OGGI)?.testo).toBe("Scade tra 12 giorni");
    expect(statoScadenza("2026-11-18", OGGI)).toEqual({ tipo: "in_scadenza", giorni: GIORNI_IN_SCADENZA });
  });

  it("più avanti: la data in formato svizzero, tono neutro", () => {
    expect(statoScadenza("2026-11-19", OGGI)).toEqual({ tipo: "valido", giorni: 31 });
    expect(badgeScadenza("2027-03-05", OGGI)).toEqual({ testo: "Scade il 05.03.2027", tono: "neutro" });
  });

  it("testoDataScadenza e daGuardare", () => {
    expect(testoDataScadenza("2026-10-01", OGGI)).toBe("Scaduto il 01.10.2026");
    expect(testoDataScadenza("2027-01-31", OGGI)).toBe("Scade il 31.01.2027");
    expect(testoDataScadenza(null, OGGI)).toBe("Senza scadenza");
    expect(daGuardare("2026-10-01", OGGI)).toBe(true);
    expect(daGuardare("2026-11-18", OGGI)).toBe(true);
    expect(daGuardare("2026-11-19", OGGI)).toBe(false);
    expect(daGuardare(null, OGGI)).toBe(false);
  });
});

describe("raggruppaDocumenti", () => {
  const documenti = [
    doc("senza-b", null, "Zeta contratto"),
    doc("lontano", "2028-01-01"),
    doc("presto", "2026-11-01"),
    doc("scaduto", "2026-09-30"),
    doc("senza-a", null, "Autorizzazione"),
    doc("vicino", "2027-01-15"),
    doc("oggi", OGGI),
  ];

  it("prima i documenti da guardare (scaduti e in scadenza), dal più vecchio", () => {
    const { daGuardare: urgenti } = raggruppaDocumenti(documenti, OGGI);
    expect(urgenti.map((d) => d.id)).toEqual(["scaduto", "oggi", "presto"]);
  });

  it("poi quelli con una scadenza (la più vicina prima) e quelli senza, per titolo", () => {
    const { altri } = raggruppaDocumenti(documenti, OGGI);
    expect(altri.map((d) => d.id)).toEqual(["vicino", "lontano", "senza-a", "senza-b"]);
  });

  it("contaDaGuardare conta scaduti e in scadenza", () => {
    expect(contaDaGuardare(documenti, OGGI)).toBe(3);
    expect(contaDaGuardare([], OGGI)).toBe(0);
  });
});

describe("eventiDocumenti", () => {
  it("solo le scadenze da oggi in poi, in ordine, con uid stabile", () => {
    const eventi = eventiDocumenti(
      [doc("b", "2027-03-01", "Permesso B", "permesso"), doc("a", "2026-09-01"), doc("c", null), doc("d", OGGI, "Polizza RC", "polizza")],
      OGGI,
      "https://bleo.example/documenti",
    );
    expect(eventi.map((e) => e.uid)).toEqual(["cassetto-d@bleo", "cassetto-b@bleo"]);
    expect(eventi[1]).toMatchObject({
      data: "2027-03-01",
      titolo: "Scade: Permesso B",
      url: "https://bleo.example/documenti",
    });
    expect(eventi[1].descrizione).toContain("Permesso di soggiorno");
  });

  it("nel file di calendario c'è un avviso 30 e uno 7 giorni prima", () => {
    const ics = generaIcs(eventiDocumenti([doc("x", "2027-03-01", "Polizza")], OGGI), {
      adesso: new Date("2026-10-19T08:00:00Z"),
      giorniPreavviso: [30, 7],
    });
    expect(ics).toContain("TRIGGER:-P30D");
    expect(ics).toContain("TRIGGER:-P7D");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });
});

describe("isoDaDataScritta", () => {
  it("legge le date scritte come in Svizzera", () => {
    expect(isoDaDataScritta("19.10.2026")).toBe("2026-10-19");
    expect(isoDaDataScritta(" 1.2.2027 ")).toBe("2027-02-01");
    expect(isoDaDataScritta("29/02/2028")).toBe("2028-02-29");
  });

  it("rifiuta date che non esistono o scritte in un altro modo", () => {
    for (const testo of ["29.02.2027", "31.04.2027", "2027-01-31", "19.10.26", "", "domani"]) {
      expect(isoDaDataScritta(testo)).toBeNull();
    }
  });
});
