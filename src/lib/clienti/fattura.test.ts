import { describe, expect, it } from "vitest";
import { calcolaTotali, controllaDocumento, emittenteVuoto, type Contesto, type Emittente } from "@/lib/strumenti/documenti";
import {
  documentoDaPrecompilazione,
  leggiPrecompilazione,
  percorsoFatturaDaOre,
  periodo,
  precompilaFattura,
  rigaPerVoceAmmessa,
  totalePrecompilazione,
} from "./fattura";
import { RIGHE_MASSIME_FATTURA } from "./limiti";
import { importoOre, riepilogoMese } from "./ore";
import type { Cliente, Precompilazione, VoceOre } from "./tipi";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

const rossi: Cliente = {
  id: "c1",
  nome: "Rossi SA",
  via: "Via Nassa",
  numero: "5",
  npa: "6900",
  localita: "Lugano",
  paese: "CH",
  email: "info@rossi.ch",
  tariffa: 120,
};

const voce = (campi: Partial<VoceOre>): VoceOre => ({
  id: "v",
  clienteId: "c1",
  data: "2026-10-15",
  minuti: 60,
  descrizione: "",
  tariffa: null,
  fatturataIl: null,
  ...campi,
});

const voci = [
  voce({ id: "3", data: "2026-10-20", minuti: 80, descrizione: "Correzioni" }),
  voce({ id: "1", data: "2026-10-02", minuti: 90, descrizione: "Sviluppo del sito" }),
  voce({ id: "2", data: "2026-10-05", minuti: 45, descrizione: "  " }),
];

const emittente: Emittente = {
  ...emittenteVuoto(),
  nome: "Anna Bernasconi",
  via: "Via Cantonale",
  numero: "12",
  npa: "6500",
  localita: "Bellinzona",
  iban: "CH93 0076 2011 6238 5295 7",
};

let n = 0;
const contesto = (): Contesto => ({ id: "ignorato", oggiIso: "2026-10-31", adessoIso: "2026-10-31T10:00:00.000Z", idRiga: () => `r${++n}` });

describe("precompilaFattura", () => {
  it("una riga per voce, dalla più vecchia, con data, descrizione, ore e tariffa del cliente", () => {
    const p = precompilaFattura({ id: ID, cliente: rossi, voci, mese: "2026-10", dettaglio: "voci" });
    expect(p).toEqual({
      id: ID,
      cliente: { nome: "Rossi SA", via: "Via Nassa", numero: "5", npa: "6900", localita: "Lugano", paese: "CH" },
      oggetto: "Ore di lavoro, ottobre 2026",
      periodoPrestazione: "02.10.2026 – 20.10.2026",
      righe: [
        { descrizione: "02.10.2026 – Sviluppo del sito", quantita: "1.5", unita: "h", prezzo: "120.00" },
        { descrizione: "05.10.2026 – Lavoro", quantita: "0.75", unita: "h", prezzo: "120.00" },
        { descrizione: "20.10.2026 – Correzioni", quantita: "1.33", unita: "h", prezzo: "120.00" },
      ],
    });
    // Il totale è quello che si vede nell'elenco delle ore.
    const elenco = riepilogoMese(voci, [rossi]);
    expect(totalePrecompilazione(p)).toEqual({ importo: elenco.totale.importo, senzaPrezzo: 0 });
    expect(totalePrecompilazione(p).importo).toBe(180 + 90 + 159.6);
  });

  it("una riga sola con il totale delle ore, una per tariffa se cambiano", () => {
    const p = precompilaFattura({ id: ID, cliente: rossi, voci, mese: "2026-10", dettaglio: "riepilogo" });
    expect(p.righe).toEqual([{ descrizione: "Lavoro dal 02.10.2026 al 20.10.2026", quantita: "3.58", unita: "h", prezzo: "120.00" }]);
    // 215 min = 3.58 h: la riga sola può differire di qualche centesimo dalla somma delle voci.
    expect(totalePrecompilazione(p).importo).toBe(429.6);

    const miste = [...voci, voce({ data: "2026-10-21", minuti: 30, tariffa: 80 })];
    const q = precompilaFattura({ id: ID, cliente: rossi, voci: miste, mese: "2026-10", dettaglio: "riepilogo" });
    expect(q.righe.map((r) => [r.quantita, r.prezzo])).toEqual([
      ["3.58", "120.00"],
      ["0.5", "80.00"],
    ]);
  });

  it("un giorno solo: periodo e descrizione con quel giorno", () => {
    const p = precompilaFattura({
      id: ID,
      cliente: rossi,
      voci: [voce({ minuti: 30 }), voce({ minuti: 60 })],
      mese: "2026-10",
      dettaglio: "riepilogo",
    });
    expect(p.periodoPrestazione).toBe("15.10.2026");
    expect(p.righe).toEqual([{ descrizione: "Lavoro del 15.10.2026", quantita: "1.5", unita: "h", prezzo: "120.00" }]);
    expect(periodo([])).toBe("");
  });

  it("senza tariffa il prezzo resta da scrivere nello strumento", () => {
    const p = precompilaFattura({ id: ID, cliente: { ...rossi, tariffa: null }, voci, mese: "2026-10", dettaglio: "voci" });
    expect(p.righe.every((r) => r.prezzo === "")).toBe(true);
    expect(totalePrecompilazione(p)).toEqual({ importo: 0, senzaPrezzo: 3 });
  });

  it("una riga per voce solo fino al massimo di righe dello strumento", () => {
    expect(rigaPerVoceAmmessa(RIGHE_MASSIME_FATTURA)).toBe(true);
    expect(rigaPerVoceAmmessa(RIGHE_MASSIME_FATTURA + 1)).toBe(false);
  });
});

describe("link verso lo strumento fattura", () => {
  const p = precompilaFattura({ id: ID, cliente: rossi, voci, mese: "2026-10", dettaglio: "voci" });

  it("i dati vanno dopo il «#» e tornano uguali", () => {
    const percorso = percorsoFatturaDaOre(p);
    expect(percorso.startsWith("/strumenti/fattura#ore=")).toBe(true);
    expect(percorso).not.toContain("?");
    expect(leggiPrecompilazione(new URL(`https://bleo.example${percorso}`).hash)).toEqual({ ok: true, dati: p });
  });

  it("caratteri speciali (accenti, &, +, #) passano senza rovinarsi", () => {
    const strano: Precompilazione = {
      ...p,
      cliente: { ...p.cliente, nome: "Café & Più + Co #1" },
      righe: [{ descrizione: "Città: 50% + 20% = 70% & co.", quantita: "1", unita: "h", prezzo: "10.00" }],
    };
    const hash = new URL(`https://bleo.example${percorsoFatturaDaOre(strano)}`).hash;
    expect(leggiPrecompilazione(hash)).toEqual({ ok: true, dati: strano });
  });

  it("senza ore nel link: null; dati rovinati o non validi: errore", () => {
    expect(leggiPrecompilazione("")).toBeNull();
    expect(leggiPrecompilazione("#riepilogo")).toBeNull();
    expect(leggiPrecompilazione("#ore=%7Bnon-json")).toEqual({ ok: false });
    const conIban = { ...p, emittente: { iban: "CH00" } };
    expect(leggiPrecompilazione(`#ore=${encodeURIComponent(JSON.stringify(conIban))}`)).toEqual({ ok: false });
    const lungo = { ...p, cliente: { ...p.cliente, localita: "x".repeat(36) } };
    expect(leggiPrecompilazione(`#ore=${encodeURIComponent(JSON.stringify(lungo))}`)).toEqual({ ok: false });
    const troppe = { ...p, righe: Array.from({ length: RIGHE_MASSIME_FATTURA + 1 }, () => p.righe[0]) };
    expect(leggiPrecompilazione(`#ore=${encodeURIComponent(JSON.stringify(troppe))}`)).toEqual({ ok: false });
    const vuota = { ...p, righe: [] };
    expect(leggiPrecompilazione(`#ore=${encodeURIComponent(JSON.stringify(vuota))}`)).toEqual({ ok: false });
  });
});

describe("documentoDaPrecompilazione", () => {
  const p = precompilaFattura({ id: ID, cliente: rossi, voci, mese: "2026-10", dettaglio: "voci" });

  it("una fattura nuova con i tuoi dati, il cliente e le righe delle ore", () => {
    const doc = documentoDaPrecompilazione(p, emittente, [], contesto());
    expect(doc).toMatchObject({
      id: ID,
      tipo: "fattura",
      numero: "F-2026-001",
      data: "2026-10-31",
      scadenza: "2026-11-30",
      emittente,
      cliente: p.cliente,
      oggetto: "Ore di lavoro, ottobre 2026",
      periodoPrestazione: "02.10.2026 – 20.10.2026",
    });
    expect(doc.righe.map((r) => [r.descrizione, r.quantita, r.unita, r.prezzo, r.aliquota])).toEqual(
      p.righe.map((r) => [r.descrizione, r.quantita, r.unita, r.prezzo, "normale"]),
    );
    expect(new Set(doc.righe.map((r) => r.id)).size).toBe(doc.righe.length);
    // Pronta da stampare: niente da completare, totale come nell'elenco delle ore.
    expect(controllaDocumento(doc)).toEqual([]);
    expect(calcolaTotali(doc).totale).toBe(totalePrecompilazione(p).importo);
    expect(calcolaTotali(doc).totale).toBe((importoOre(90, 120) ?? 0) + (importoOre(45, 120) ?? 0) + (importoOre(80, 120) ?? 0));
  });

  it("il numero segue le fatture che ci sono già", () => {
    const prima = documentoDaPrecompilazione({ ...p, id: "altra-fattura-1" }, emittente, [], contesto());
    const doc = documentoDaPrecompilazione(p, emittente, [prima], contesto());
    expect(doc.numero).toBe("F-2026-002");
  });

  it("con l'IVA lo strumento aggiunge l'imposta sopra l'importo delle ore", () => {
    const doc = documentoDaPrecompilazione(p, { ...emittente, ivaIscritto: true, numeroIva: "CHE-123.456.789 IVA" }, [], contesto());
    const totali = calcolaTotali(doc);
    expect(totali.imponibile).toBe(totalePrecompilazione(p).importo);
    expect(totali.totaleIva).toBeGreaterThan(0);
  });
});
