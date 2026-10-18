import { describe, expect, it } from "vitest";
import { VOTAZIONI, type Votazione } from "@/data/votazioni";
import { dataIsoValida, generaIcs } from "@/lib/percorso/calendario";
import { pianificaPromemoria } from "@/lib/percorso/promemoria";
import { etichettaLivello, eventiVotazioni, votazioniInArrivo } from "./votazioni";

function votazione(id: string, data: string): Votazione {
  return {
    id,
    data,
    livello: "federale",
    oggetto: `Oggetto ${id}`,
    titoloBreve: `Tema ${id}`,
    cosaCambia: "Cambia qualcosa.",
    chiRiguarda: "Chi è iscritto all'IVA.",
    fonti: [{ titolo: "Fonte", url: "https://www.fedlex.admin.ch/eli/fga/2026/1/it", ente: "Confederazione (Fedlex)" }],
    verificatoIl: "2026-10-18",
  };
}

describe("i dati delle votazioni", () => {
  it("ogni votazione ha id unico, data valida, fonte ufficiale e data di controllo", () => {
    expect(new Set(VOTAZIONI.map((v) => v.id)).size).toBe(VOTAZIONI.length);
    for (const v of VOTAZIONI) {
      expect(v.id.startsWith(`${v.data}-`)).toBe(true);
      expect(dataIsoValida(v.data)).toBe(true);
      // Si vota di domenica.
      expect(new Date(`${v.data}T12:00:00Z`).getUTCDay()).toBe(0);
      expect(v.fonti.length).toBeGreaterThan(0);
      for (const f of v.fonti) expect(f.url).toMatch(/^https:\/\/(www\.)?(fedlex\.admin\.ch|ti\.ch|admin\.ch|bk\.admin\.ch)\//);
      expect(dataIsoValida(v.verificatoIl)).toBe(true);
      expect(v.verificatoIl <= v.data).toBe(true);
    }
  });

  it("l'aumento dell'IVA per l'AVS: le cifre del decreto federale del 19.06.2026", () => {
    const iva = VOTAZIONI.find((v) => v.id === "2026-11-29-iva-avs");
    expect(iva?.cosaCambia).toContain("aliquota IVA normale di 0,4 punti percentuali");
    expect(iva?.cosaCambia).toContain("per l'alloggio di 0,2 punti");
    expect(iva?.fonti[0].url).toBe("https://www.fedlex.admin.ch/eli/fga/2026/1757/it");
  });
});

describe("votazioniInArrivo", () => {
  const elenco = [votazione("b", "2027-03-07"), votazione("a", "2026-11-29"), votazione("c", "2026-09-27")];

  it("tiene quelle da oggi in poi, dalla più vicina", () => {
    expect(votazioniInArrivo(elenco, "2026-10-18").map((v) => v.id)).toEqual(["a", "b"]);
  });

  it("il giorno del voto la votazione c'è ancora, il giorno dopo no", () => {
    expect(votazioniInArrivo(elenco, "2026-11-29").map((v) => v.id)).toEqual(["a", "b"]);
    expect(votazioniInArrivo(elenco, "2026-11-30").map((v) => v.id)).toEqual(["b"]);
  });
});

describe("eventiVotazioni", () => {
  it("un evento per votazione, con il link alla fonte e il promemoria «Si vota»", () => {
    const [e] = eventiVotazioni([votazione("a", "2026-11-29")]);
    expect(e).toMatchObject({ uid: "votazione-a@bussola", data: "2026-11-29", titolo: "Votazione federale: Tema a", genere: "votazione" });
    expect(e.descrizione).toContain("https://www.fedlex.admin.ch/eli/fga/2026/1/it");
    expect(generaIcs([e], { adesso: new Date("2026-10-18T10:00:00Z") })).toContain("DTSTART;VALUE=DATE:20261129");
    const [p] = pianificaPromemoria([e], "2026-10-18");
    expect(p.quando).toBe("2026-11-22T09:00");
    expect(p.testo).toBe("Si vota tra una settimana (29.11.2026). Apri Bleo per i dettagli e la fonte ufficiale.");
  });

  it("le etichette dei livelli", () => {
    expect(etichettaLivello("cantonale")).toBe("Votazione cantonale");
    expect(etichettaLivello("comunale")).toBe("Votazione comunale");
  });
});
