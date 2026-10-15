import { describe, expect, it } from "vitest";
import { DOMANDE, etichettaRisposta } from "./domande";
import {
  ATTIVITA,
  AVVII,
  CANTONI,
  CLIENTI,
  FATTURATI,
  IMPIEGHI,
  leggiRisposte,
  LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO,
  PERMESSI,
  schemaRisposte,
  SI_NO,
  SOCI,
  VERSIONE_RISPOSTE,
  type IdDomanda,
  type Risposte,
} from "./risposte";

const valide: Risposte = {
  versione: VERSIONE_RISPOSTE,
  attivita: "altro",
  attivitaAltro: "  toelettatura per cani  ",
  cantone: "GR",
  soci: "solo",
  fatturato: "non_so",
  clienti: "pochi",
  impiego: "parziale",
  avviata: "meno_3_mesi",
  permesso: "b",
  locali: "si",
  venditaOnline: "no",
};

describe("schema delle risposte", () => {
  it("la versione è una data ISO", () => {
    expect(VERSIONE_RISPOSTE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("accetta risposte complete e toglie gli spazi dal testo libero", () => {
    expect(leggiRisposte(valide)).toEqual({ ...valide, attivitaAltro: "toelettatura per cani" });
  });

  it("scarta il testo libero se l'attività non è «altro» o se è vuoto", () => {
    expect(leggiRisposte({ ...valide, attivita: "trasporti" })).not.toHaveProperty("attivitaAltro");
    expect(leggiRisposte({ ...valide, attivitaAltro: "   " })).not.toHaveProperty("attivitaAltro");
  });

  it("rifiuta testo libero troppo lungo, campi mancanti, valori sconosciuti e altre versioni", () => {
    expect(leggiRisposte({ ...valide, attivitaAltro: "x".repeat(LUNGHEZZA_MASSIMA_ATTIVITA_ALTRO + 1) })).toBeNull();
    const { cantone: _c, ...senzaCantone } = valide;
    void _c;
    expect(leggiRisposte(senzaCantone)).toBeNull();
    expect(leggiRisposte({ ...valide, fatturato: "200k" })).toBeNull();
    expect(leggiRisposte({ ...valide, versione: "2020-01-01" })).toBeNull();
    expect(leggiRisposte(null)).toBeNull();
    expect(leggiRisposte("stringa")).toBeNull();
  });

  it("ignora campi in più (per esempio da versioni future)", () => {
    expect(leggiRisposte({ ...valide, campoNuovo: true })).not.toHaveProperty("campoNuovo");
  });
});

describe("domande del questionario", () => {
  const valoriAttesi: Record<IdDomanda, readonly string[]> = {
    attivita: ATTIVITA,
    cantone: CANTONI,
    soci: SOCI,
    fatturato: FATTURATI,
    clienti: CLIENTI,
    impiego: IMPIEGHI,
    avviata: AVVII,
    permesso: PERMESSI,
    locali: SI_NO,
    venditaOnline: SI_NO,
  };

  it("sono al massimo 10, una per ogni campo dello schema", () => {
    expect(DOMANDE.length).toBeLessThanOrEqual(10);
    const campi = Object.keys(schemaRisposte.shape).filter((k) => k !== "versione" && k !== "attivitaAltro");
    expect(DOMANDE.map((d) => d.id).sort()).toEqual(campi.sort());
  });

  it("ogni domanda ha un perché di una riga e tutte le opzioni dello schema, una volta sola", () => {
    for (const d of DOMANDE) {
      expect(d.perche.length).toBeGreaterThan(20);
      expect(d.perche).not.toContain("\n");
      const valori = d.opzioni.map((o) => o.valore);
      expect(new Set(valori).size).toBe(valori.length);
      expect([...valori].sort()).toEqual([...valoriAttesi[d.id]].sort());
    }
  });

  it("le fasce di fatturato usano le soglie di CHF 100'000 (almeno 100'000)", () => {
    const fatturato = DOMANDE.find((d) => d.id === "fatturato");
    expect(fatturato?.opzioni.map((o) => o.etichetta)).toEqual([
      "Meno di CHF 10'000",
      "Da CHF 10'000 a CHF 60'000",
      "Da CHF 60'000 a meno di CHF 100'000",
      "CHF 100'000 o più",
      "Non lo so ancora",
    ]);
  });

  it("etichettaRisposta restituisce il testo dell'opzione", () => {
    expect(etichettaRisposta("cantone", "TI")).toBe("Ticino");
    expect(etichettaRisposta("permesso", "g")).toBe("Permesso G (frontaliere)");
  });
});
