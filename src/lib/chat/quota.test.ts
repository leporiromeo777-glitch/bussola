import { describe, expect, it } from "vitest";
import {
  DOMANDE_GRATIS_AL_MESE,
  calcolaQuota,
  inizioMese,
  inizioMeseSuccessivo,
  pianoEffettivo,
  quotaPubblica,
} from "./quota";

const ora = (iso: string) => new Date(iso);

describe("inizio del mese nell'ora di Zurigo", () => {
  it("in ora solare (CET, UTC+1) il mese inizia alle 23:00 UTC del giorno prima", () => {
    expect(inizioMese(ora("2026-11-15T10:00:00Z")).toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(inizioMese(ora("2026-01-01T12:00:00Z")).toISOString()).toBe("2025-12-31T23:00:00.000Z");
  });

  it("in ora legale (CEST, UTC+2) il mese inizia alle 22:00 UTC del giorno prima", () => {
    expect(inizioMese(ora("2026-10-15T08:00:00Z")).toISOString()).toBe("2026-09-30T22:00:00.000Z");
    expect(inizioMese(ora("2026-04-02T00:00:00Z")).toISOString()).toBe("2026-03-31T22:00:00.000Z");
  });

  it("la notte del 31 ottobre in UTC è già novembre a Zurigo", () => {
    // 31.10.2026 23:30 UTC = 01.11.2026 00:30 a Zurigo
    const istante = ora("2026-10-31T23:30:00Z");
    expect(inizioMese(istante).toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(inizioMeseSuccessivo(istante).toISOString()).toBe("2026-11-30T23:00:00.000Z");
  });

  it("un minuto prima della mezzanotte di Zurigo è ancora il mese prima", () => {
    // 31.10.2026 23:59 a Zurigo (CET) = 22:59 UTC
    const istante = ora("2026-10-31T22:59:00Z");
    expect(inizioMese(istante).toISOString()).toBe("2026-09-30T22:00:00.000Z");
    expect(inizioMeseSuccessivo(istante).toISOString()).toBe("2026-10-31T23:00:00.000Z");
  });

  it("dicembre passa all'anno successivo", () => {
    expect(inizioMeseSuccessivo(ora("2026-12-20T12:00:00Z")).toISOString()).toBe("2026-12-31T23:00:00.000Z");
  });

  it("il mese del cambio d'ora (marzo) inizia ancora in ora solare", () => {
    expect(inizioMese(ora("2026-03-30T12:00:00Z")).toISOString()).toBe("2026-02-28T23:00:00.000Z");
    expect(inizioMeseSuccessivo(ora("2026-03-30T12:00:00Z")).toISOString()).toBe("2026-03-31T22:00:00.000Z");
  });
});

describe("piano effettivo", () => {
  const adesso = ora("2026-10-19T09:00:00Z");

  it("senza profilo o con un piano sconosciuto vale gratis", () => {
    expect(pianoEffettivo(null, adesso)).toBe("gratis");
    expect(pianoEffettivo({ piano: "premium", piano_scade_il: null }, adesso)).toBe("gratis");
  });

  it("avvio vale fino alla scadenza, poi torna gratis", () => {
    expect(pianoEffettivo({ piano: "avvio", piano_scade_il: "2027-01-19T09:00:00Z" }, adesso)).toBe("avvio");
    expect(pianoEffettivo({ piano: "avvio", piano_scade_il: "2026-10-19T08:59:59Z" }, adesso)).toBe("gratis");
    expect(pianoEffettivo({ piano: "avvio", piano_scade_il: "2026-10-19T09:00:00Z" }, adesso)).toBe("gratis");
  });

  it("avvio senza data di scadenza resta valido", () => {
    expect(pianoEffettivo({ piano: "avvio", piano_scade_il: null }, adesso)).toBe("avvio");
  });

  it("accompagnamento e partner non dipendono dalla scadenza", () => {
    expect(pianoEffettivo({ piano: "accompagnamento", piano_scade_il: "2020-01-01T00:00:00Z" }, adesso)).toBe(
      "accompagnamento",
    );
    expect(pianoEffettivo({ piano: "partner", piano_scade_il: null }, adesso)).toBe("partner");
  });
});

describe("calcolo della quota", () => {
  const adesso = ora("2026-10-19T09:00:00Z");

  it("il piano gratis ha 10 domande al mese", () => {
    const quota = calcolaQuota({ piano: "gratis", piano_scade_il: null }, 3, adesso);
    expect(DOMANDE_GRATIS_AL_MESE).toBe(10);
    expect(quota).toMatchObject({ piano: "gratis", limite: 10, rimanenti: 7, esaurita: false, illimitata: false });
  });

  it("alla decima domanda la quota è esaurita (e non va mai sotto zero)", () => {
    expect(calcolaQuota(null, 10, adesso)).toMatchObject({ rimanenti: 0, esaurita: true });
    expect(calcolaQuota(null, 14, adesso)).toMatchObject({ rimanenti: 0, esaurita: true });
  });

  it("avvio scaduto ricade sul piano gratis con il suo limite", () => {
    const quota = calcolaQuota({ piano: "avvio", piano_scade_il: "2026-10-01T00:00:00Z" }, 12, adesso);
    expect(quota).toMatchObject({ piano: "gratis", esaurita: true, scadenzaPiano: null });
  });

  it("i piani a pagamento non hanno limite", () => {
    for (const piano of ["avvio", "accompagnamento", "partner"]) {
      const quota = calcolaQuota({ piano, piano_scade_il: "2027-01-19T09:00:00Z" }, 250, adesso);
      expect(quota).toMatchObject({ piano, illimitata: true, limite: null, rimanenti: null, esaurita: false });
    }
  });

  it("la versione per il browser usa date AAAA-MM-GG nell'ora di Zurigo", () => {
    const quota = calcolaQuota({ piano: "avvio", piano_scade_il: "2027-01-18T23:30:00Z" }, 0, adesso);
    expect(quotaPubblica(quota)).toEqual({
      piano: "avvio",
      illimitata: true,
      limite: null,
      rimanenti: null,
      rinnovo_il: "2026-11-01",
      piano_scade_il: "2027-01-19",
    });
  });
});
