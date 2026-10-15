import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  analizzaPassiFatti,
  analizzaRisposteSalvate,
  cambiaPasso,
  CHIAVE_PASSI_FATTI,
  CHIAVE_RISPOSTE,
  EVENTO_ARCHIVIO,
  iscriviti,
  leggiGrezzo,
  salvaPassiFattiLocali,
  salvaRisposteLocali,
  scriviGrezzo,
  svuotaMemoria,
} from "./archivio";
import { VERSIONE_RISPOSTE, type Risposte } from "./risposte";

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

const salvate = { risposte, aggiornatoIl: "2026-10-15T10:00:00.000Z" };

describe("lettura dei dati salvati", () => {
  it("risposte valide con la data di salvataggio", () => {
    expect(analizzaRisposteSalvate(JSON.stringify(salvate))).toEqual(salvate);
  });

  it("dati assenti, rotti, senza data o di un'altra versione: null", () => {
    expect(analizzaRisposteSalvate(null)).toBeNull();
    expect(analizzaRisposteSalvate("")).toBeNull();
    expect(analizzaRisposteSalvate("{non json")).toBeNull();
    expect(analizzaRisposteSalvate("[]")).toBeNull();
    expect(analizzaRisposteSalvate("null")).toBeNull();
    expect(analizzaRisposteSalvate(JSON.stringify(risposte))).toBeNull();
    expect(analizzaRisposteSalvate(JSON.stringify({ ...salvate, aggiornatoIl: "ieri" }))).toBeNull();
    expect(
      analizzaRisposteSalvate(JSON.stringify({ ...salvate, risposte: { ...risposte, versione: "2025-01-01" } })),
    ).toBeNull();
    expect(
      analizzaRisposteSalvate(JSON.stringify({ ...salvate, risposte: { ...risposte, cantone: "ZH" } })),
    ).toBeNull();
  });

  it("passi fatti: solo id conosciuti, senza doppioni", () => {
    expect(analizzaPassiFatti(JSON.stringify(["nome-ditta", "inventato", "nome-ditta", 3, null, "fatture"]))).toEqual([
      "nome-ditta",
      "fatture",
    ]);
    expect(analizzaPassiFatti(null)).toEqual([]);
    expect(analizzaPassiFatti("rotto")).toEqual([]);
    expect(analizzaPassiFatti(JSON.stringify({ a: 1 }))).toEqual([]);
  });

  it("cambiaPasso aggiunge e toglie", () => {
    expect(cambiaPasso(["nome-ditta"], "fatture", true)).toEqual(["nome-ditta", "fatture"]);
    expect(cambiaPasso(["nome-ditta", "fatture"], "nome-ditta", false)).toEqual(["fatture"]);
    expect(cambiaPasso(new Set(["nome-ditta"]), "nome-ditta", true)).toEqual(["nome-ditta"]);
    expect(cambiaPasso(["sconosciuto"], "fatture", false)).toEqual([]);
  });
});

describe("nel browser", () => {
  const spazio = new Map<string, string>();
  const finestra = new EventTarget() as EventTarget & { localStorage: Storage };

  function spazioFunzionante(): Storage {
    return {
      getItem: (k: string) => spazio.get(k) ?? null,
      setItem: (k: string, v: string) => void spazio.set(k, v),
      removeItem: (k: string) => void spazio.delete(k),
    } as Storage;
  }

  beforeEach(() => {
    spazio.clear();
    svuotaMemoria();
    finestra.localStorage = spazioFunzionante();
    vi.stubGlobal("window", finestra);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    svuotaMemoria();
  });

  it("salva e rilegge risposte (con data) e passi", () => {
    expect(salvaRisposteLocali(risposte, salvate.aggiornatoIl)).toBe(true);
    expect(analizzaRisposteSalvate(leggiGrezzo(CHIAVE_RISPOSTE))).toEqual(salvate);
    expect(salvaPassiFattiLocali(["fatture", "fatture", "inventato"])).toBe(true);
    expect(leggiGrezzo(CHIAVE_PASSI_FATTI)).toBe('["fatture"]');
  });

  it("senza data esplicita usa l'ora attuale", () => {
    salvaRisposteLocali(risposte);
    const letto = analizzaRisposteSalvate(leggiGrezzo(CHIAVE_RISPOSTE));
    expect(Date.parse(letto?.aggiornatoIl ?? "")).not.toBeNaN();
  });

  it("avvisa chi è iscritto, anche quando si cancella", () => {
    const chiamate = vi.fn();
    const disiscrivi = iscriviti(chiamate);
    scriviGrezzo(CHIAVE_RISPOSTE, "x");
    scriviGrezzo(CHIAVE_RISPOSTE, null);
    expect(chiamate).toHaveBeenCalledTimes(2);
    expect(spazio.has(CHIAVE_RISPOSTE)).toBe(false);
    disiscrivi();
    finestra.dispatchEvent(new Event(EVENTO_ARCHIVIO));
    expect(chiamate).toHaveBeenCalledTimes(2);
  });

  it("se il browser non salva (navigazione privata, quota piena) tiene i dati in memoria", () => {
    finestra.localStorage = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    } as unknown as Storage;
    expect(leggiGrezzo(CHIAVE_RISPOSTE)).toBeNull();
    expect(salvaRisposteLocali(risposte, salvate.aggiornatoIl)).toBe(false);
    expect(analizzaRisposteSalvate(leggiGrezzo(CHIAVE_RISPOSTE))).toEqual(salvate);
  });

  it("quando il browser torna a salvare, la copia in memoria lascia il posto allo spazio vero", () => {
    finestra.localStorage = {
      ...spazioFunzionante(),
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    } as Storage;
    scriviGrezzo(CHIAVE_PASSI_FATTI, '["fatture"]');
    expect(leggiGrezzo(CHIAVE_PASSI_FATTI)).toBe('["fatture"]');
    finestra.localStorage = spazioFunzionante();
    scriviGrezzo(CHIAVE_PASSI_FATTI, '["nome-ditta"]');
    expect(spazio.get(CHIAVE_PASSI_FATTI)).toBe('["nome-ditta"]');
    expect(leggiGrezzo(CHIAVE_PASSI_FATTI)).toBe('["nome-ditta"]');
  });
});

describe("sul server (senza window)", () => {
  it("leggere e scrivere non fanno nulla e non lasciano dati condivisi", () => {
    expect(leggiGrezzo(CHIAVE_RISPOSTE)).toBeNull();
    expect(scriviGrezzo(CHIAVE_RISPOSTE, "x")).toBe(false);
    expect(leggiGrezzo(CHIAVE_RISPOSTE)).toBeNull();
    expect(typeof iscriviti(() => {})).toBe("function");
  });
});
