import { describe, expect, it } from "vitest";
import type { EventoCalendario } from "./calendario";
import { MASSIMO_PROMEMORIA, pianificaPromemoria } from "./promemoria";

function evento(data: string, uid = `e-${data}`): EventoCalendario {
  return { uid, data, titolo: `Scadenza ${data}`, descrizione: "" };
}

describe("pianificaPromemoria", () => {
  it("avvisa una settimana prima alle 9", () => {
    const [p] = pianificaPromemoria([evento("2027-03-31")], "2027-01-10");
    expect(p.quando).toBe("2027-03-24T09:00");
    expect(p.testo).toContain("tra una settimana");
    expect(p.testo).toContain("31.03.2027");
  });

  it("salta le scadenze passate e quelle di oggi", () => {
    expect(pianificaPromemoria([evento("2027-01-09"), evento("2027-01-10")], "2027-01-10")).toEqual([]);
  });

  it("se mancano meno di sette giorni avvisa domani", () => {
    const [p] = pianificaPromemoria([evento("2027-01-13")], "2027-01-10");
    expect(p.quando).toBe("2027-01-11T09:00");
    expect(p.testo).toContain("il 13.01.2027");
  });

  it("una scadenza domani: avviso domani stesso", () => {
    const [p] = pianificaPromemoria([evento("2027-01-11")], "2027-01-10");
    expect(p.quando).toBe("2027-01-11T09:00");
  });

  it("ordina per data, non duplica e si ferma al massimo", () => {
    const eventi = Array.from({ length: 60 }, (_, i) =>
      evento(`2027-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`, `e${i}`),
    );
    const piano = pianificaPromemoria([...eventi, eventi[0]], "2026-12-01");
    expect(piano.length).toBe(MASSIMO_PROMEMORIA);
    expect(new Set(piano.map((p) => p.id)).size).toBe(piano.length);
    const date = piano.map((p) => p.scadenza);
    expect([...date].sort()).toEqual(date);
  });
});
