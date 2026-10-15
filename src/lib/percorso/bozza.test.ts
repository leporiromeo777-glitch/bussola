import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  analizzaBozza,
  cancellaBozza,
  CHIAVE_BOZZA,
  indiceDiRipresa,
  leggiBozzaGrezza,
  pulisciBozza,
  salvaBozza,
  type Bozza,
} from "./bozza";
import { DOMANDE } from "./domande";
import { VERSIONE_RISPOSTE } from "./risposte";

const completa: Bozza = {
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

const grezza = (dati: object) => JSON.stringify({ versione: VERSIONE_RISPOSTE, ...dati });

describe("bozza del questionario", () => {
  it("tiene solo le risposte valide", () => {
    expect(pulisciBozza({ attivita: "trasporti", cantone: "ZH", soci: 3, inventato: "x" })).toEqual({
      attivita: "trasporti",
    });
    expect(pulisciBozza({ attivita: "altro", attivitaAltro: "toelettatura" })).toEqual({
      attivita: "altro",
      attivitaAltro: "toelettatura",
    });
    expect(pulisciBozza({ attivitaAltro: "x".repeat(500) })).toEqual({});
    expect(pulisciBozza(null)).toEqual({});
    expect(pulisciBozza(["trasporti"])).toEqual({});
  });

  it("legge una bozza valida della versione attuale", () => {
    expect(analizzaBozza(grezza({ indice: 3, bozza: { attivita: "trasporti", cantone: "GR" } }))).toEqual({
      indice: 3,
      bozza: { attivita: "trasporti", cantone: "GR" },
    });
  });

  it("scarta bozze rotte, di un'altra versione o con l'indice fuori dalle domande", () => {
    expect(analizzaBozza(null)).toBeNull();
    expect(analizzaBozza("{rotto")).toBeNull();
    expect(analizzaBozza("[]")).toBeNull();
    expect(analizzaBozza(JSON.stringify({ versione: "2025-01-01", indice: 0, bozza: {} }))).toBeNull();
    expect(analizzaBozza(grezza({ indice: -1, bozza: {} }))).toBeNull();
    expect(analizzaBozza(grezza({ indice: DOMANDE.length, bozza: {} }))).toBeNull();
    expect(analizzaBozza(grezza({ indice: 1.5, bozza: {} }))).toBeNull();
    expect(analizzaBozza(grezza({ indice: "2", bozza: {} }))).toBeNull();
    expect(analizzaBozza(grezza({ indice: 2, bozza: "x" }))).toBeNull();
    expect(analizzaBozza(grezza({ indice: 2 }))).toBeNull();
  });

  it("riprende dalla domanda chiesta solo se le precedenti hanno una risposta", () => {
    expect(indiceDiRipresa(4, completa)).toBe(4);
    expect(indiceDiRipresa(9, completa)).toBe(9);
    // Manca la risposta alla domanda 3 (indice 2): si riparte da lì.
    expect(indiceDiRipresa(6, { ...completa, soci: undefined })).toBe(2);
    // La domanda chiesta può essere ancora senza risposta.
    expect(indiceDiRipresa(3, { attivita: "trasporti", cantone: "TI", soci: "solo" })).toBe(3);
    expect(indiceDiRipresa(3, {})).toBe(0);
    // Fuori dai limiti: si resta tra la prima e l'ultima domanda.
    expect(indiceDiRipresa(-4, completa)).toBe(0);
    expect(indiceDiRipresa(99, completa)).toBe(DOMANDE.length - 1);
  });
});

describe("bozza in sessionStorage", () => {
  const spazio = new Map<string, string>();

  beforeEach(() => {
    spazio.clear();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (k: string) => spazio.get(k) ?? null,
        setItem: (k: string, v: string) => void spazio.set(k, v),
        removeItem: (k: string) => void spazio.delete(k),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("salva, rilegge e cancella", () => {
    salvaBozza({ indice: 2, bozza: { attivita: "trasporti" } });
    expect(analizzaBozza(leggiBozzaGrezza())).toEqual({ indice: 2, bozza: { attivita: "trasporti" } });
    expect(spazio.has(CHIAVE_BOZZA)).toBe(true);
    cancellaBozza();
    expect(leggiBozzaGrezza()).toBeNull();
  });

  it("se il browser non salva, non si rompe nulla", () => {
    vi.stubGlobal("window", {
      get sessionStorage(): Storage {
        throw new Error("SecurityError");
      },
    });
    expect(() => salvaBozza({ indice: 0, bozza: {} })).not.toThrow();
    expect(leggiBozzaGrezza()).toBeNull();
    expect(() => cancellaBozza()).not.toThrow();
  });

  it("sul server (senza window) non fa nulla", () => {
    vi.unstubAllGlobals();
    expect(leggiBozzaGrezza()).toBeNull();
    expect(() => salvaBozza({ indice: 0, bozza: {} })).not.toThrow();
  });
});
