import { describe, expect, it } from "vitest";
import {
  dataColonna,
  documentiDaImportare,
  documentoDaRiga,
  emittenteCompilato,
  emittenteDaRiga,
  idDocumentoValido,
  leggiDocumento,
  leggiEmittente,
  leggiImportazione,
  lottiImportazione,
  MESSAGGI_DOCUMENTI,
  rigaDocumento,
  rigaEmittente,
  schemaDocumentoRichiesta,
  statoDocumento,
} from "./account";
import { emittenteVuoto, nuovoDocumento, schemaDocumento, type Documento, type Emittente } from "./documenti";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const UTENTE = "11111111-1111-1111-1111-111111111111";

const emittente: Emittente = {
  ...emittenteVuoto(),
  nome: "Giulia Bernasconi",
  via: "Via Lugano",
  numero: "12",
  npa: "6500",
  localita: "Bellinzona",
  iban: "CH93 0076 2011 6238 5295 7",
};

function fattura(campi: Partial<Documento> = {}): Documento {
  const base = nuovoDocumento("fattura", emittente, [], {
    id: ID,
    oggiIso: "2026-10-19",
    adessoIso: "2026-10-19T10:00:00.000Z",
    idRiga: () => "riga-1",
  });
  return {
    ...base,
    cliente: { nome: "Bar Centrale", via: "Piazza Grande", numero: "1", npa: "6600", localita: "Locarno", paese: "CH" },
    righe: [{ ...base.righe[0], descrizione: "Sito web", prezzo: "1200" }],
    ...campi,
  };
}

describe("leggiDocumento (PUT /api/strumenti/documenti/[id])", () => {
  it("accetta il documento dello strumento così com'è", () => {
    const doc = fattura();
    expect(leggiDocumento(doc, ID)).toEqual({ ok: true, dati: doc });
    // Anche un documento appena creato, ancora tutto da compilare.
    const vuoto = nuovoDocumento("preventivo", emittenteVuoto(), [], {
      id: ID,
      oggiIso: "2026-10-19",
      adessoIso: "2026-10-19T10:00:00.000Z",
      idRiga: () => "r1",
    });
    expect(leggiDocumento(vuoto, ID).ok).toBe(true);
  });

  it("rifiuta un id diverso dall'indirizzo, id strani, campi in più o mancanti e testi troppo lunghi", () => {
    const doc = fattura();
    expect(leggiDocumento(doc, "a1b2c3d4-0000")).toEqual({ ok: false, messaggio: MESSAGGI_DOCUMENTI.documentoNonValido });
    expect(leggiDocumento({ ...doc, id: "x" }, "x")).toEqual({ ok: false, messaggio: MESSAGGI_DOCUMENTI.nonTrovato });
    expect(leggiDocumento({ ...doc, segreto: 1 }, ID).ok).toBe(false);
    expect(leggiDocumento({ ...doc, note: undefined }, ID).ok).toBe(false);
    expect(leggiDocumento({ ...doc, note: "x".repeat(1001) }, ID).ok).toBe(false);
    expect(leggiDocumento({ ...doc, righe: Array.from({ length: 101 }, (_, i) => ({ ...doc.righe[0], id: `r${i}` })) }, ID).ok).toBe(
      false,
    );
    expect(leggiDocumento({ ...doc, valuta: "USD" }, ID).ok).toBe(false);
    expect(leggiDocumento({ ...doc, emittente: { ...doc.emittente, ivaIscritto: "sì" } }, ID).ok).toBe(false);
    expect(leggiDocumento("ciao", ID).ok).toBe(false);
  });

  it("ogni documento valido per l'archivio del browser passa anche dalle API (stesse lunghezze)", () => {
    const lungo = fattura({
      numero: "x".repeat(40),
      oggetto: "o".repeat(200),
      note: "n".repeat(1000),
      emittente: { ...emittente, nome: "n".repeat(140), via: "v".repeat(140), iban: "i".repeat(60), numeroIva: "c".repeat(40) },
    });
    const dalBrowser = schemaDocumento.parse(lungo);
    expect(schemaDocumentoRichiesta.safeParse(dalBrowser).success).toBe(true);
  });
});

describe("leggiEmittente", () => {
  it("accetta i dati completi e rifiuta quelli incompleti o troppo lunghi", () => {
    expect(leggiEmittente(emittente)).toEqual({ ok: true, dati: emittente });
    expect(leggiEmittente({ ...emittente, nome: "x".repeat(141) }).ok).toBe(false);
    expect(leggiEmittente({ ...emittente, iban: undefined }).ok).toBe(false);
  });
});

describe("leggiImportazione (POST /api/strumenti/documenti)", () => {
  it("tiene i documenti validi, salta i rovinati e gli id ripetuti", () => {
    const altro = fattura({ id: "a1b2c3d4-0000-4000-8000-000000000001", numero: "F-2026-002" });
    const letta = leggiImportazione({ documenti: [fattura(), { id: "rotto" }, fattura({ numero: "doppione" }), altro] });
    expect(letta).toEqual({ ok: true, dati: { documenti: [fattura(), altro], scartati: 2, emittente: null } });
  });

  it("legge i dati dell'emittente se ci sono e rifiuta corpi non validi", () => {
    expect(leggiImportazione({ documenti: [], emittente })).toEqual({
      ok: true,
      dati: { documenti: [], scartati: 0, emittente },
    });
    expect(leggiImportazione({ documenti: [], emittente: { nome: 1 } }).ok).toBe(false);
    expect(leggiImportazione({ documenti: Array.from({ length: 26 }, () => fattura()) }).ok).toBe(false);
    expect(leggiImportazione({ documenti: [], altro: true }).ok).toBe(false);
    expect(leggiImportazione(null).ok).toBe(false);
  });
});

describe("righe del database", () => {
  it("la riga prende tipo, numero, data e stato dal contenuto", () => {
    const doc = fattura();
    expect(rigaDocumento(UTENTE, doc, "2026-10-19T11:00:00.000Z")).toEqual({
      user_id: UTENTE,
      id: ID,
      tipo: "fattura",
      numero: doc.numero,
      data: "2026-10-19",
      stato: "pronto",
      contenuto: doc,
      aggiornato_il: "2026-10-19T11:00:00.000Z",
    });
    expect(rigaDocumento(UTENTE, fattura({ data: "" }), "x")).toMatchObject({ data: null, stato: "bozza" });
  });

  it("stato: pronto solo quando lo strumento non segnala più niente", () => {
    expect(statoDocumento(fattura())).toBe("pronto");
    expect(statoDocumento(fattura({ cliente: { ...fattura().cliente, nome: "" } }))).toBe("bozza");
    expect(statoDocumento(fattura({ emittente: { ...emittente, iban: "" } }))).toBe("bozza");
  });

  it("dataColonna tiene solo date valide e plausibili", () => {
    expect(dataColonna("2026-10-19")).toBe("2026-10-19");
    expect(dataColonna("2026-02-30")).toBeNull();
    expect(dataColonna("1899-01-01")).toBeNull();
    expect(dataColonna("")).toBeNull();
  });

  it("documentoDaRiga legge il contenuto come il browser e scarta quello che non torna", () => {
    const doc = fattura();
    expect(documentoDaRiga({ id: ID, contenuto: doc })).toEqual(doc);
    expect(documentoDaRiga({ id: "altro-id-0000", contenuto: doc })).toBeNull();
    expect(documentoDaRiga({ id: ID, contenuto: "testo" })).toBeNull();
    // Un campo rovinato torna al valore iniziale, come nel browser.
    expect(documentoDaRiga({ id: ID, contenuto: { ...doc, valuta: "USD" } })?.valuta).toBe("CHF");
  });

  it("emittente: andata e ritorno dalla riga", () => {
    const riga = rigaEmittente(UTENTE, { ...emittente, ivaIscritto: true, numeroIva: "CHE-123.456.789 IVA" }, "adesso");
    expect(riga).toMatchObject({ user_id: UTENTE, iva_iscritto: true, numero_iva: "CHE-123.456.789 IVA", aggiornato_il: "adesso" });
    expect(emittenteDaRiga(riga)).toEqual({ ...emittente, ivaIscritto: true, numeroIva: "CHE-123.456.789 IVA" });
    expect(emittenteDaRiga({ ...riga, paese: "" }).paese).toBe("CH");
  });
});

describe("importazione dal browser", () => {
  it("documentiDaImportare: solo quelli non ancora nell'account, con un id accettato", () => {
    const locali = [fattura(), fattura({ id: "a1b2c3d4-0000-4000-8000-000000000002" }), fattura({ id: "corto" })];
    const daImportare = documentiDaImportare(locali, [{ id: ID }], () => "nuovo-id-0001");
    expect(daImportare.map((d) => d.id)).toEqual(["a1b2c3d4-0000-4000-8000-000000000002", "nuovo-id-0001"]);
    expect(idDocumentoValido("nuovo-id-0001")).toBe(true);
    expect(idDocumentoValido("corto")).toBe(false);
  });

  it("lottiImportazione divide per numero e per peso, senza perdere documenti", () => {
    const tanti = Array.from({ length: 60 }, (_, i) => fattura({ id: `doc-0000-${String(i).padStart(4, "0")}` }));
    const lotti = lottiImportazione(tanti);
    expect(lotti.map((l) => l.length)).toEqual([25, 25, 10]);
    expect(lotti.flat()).toEqual(tanti);
    const peso = JSON.stringify(tanti[0]).length;
    expect(lottiImportazione(tanti.slice(0, 5), 25, peso * 2).map((l) => l.length)).toEqual([2, 2, 1]);
    expect(lottiImportazione([])).toEqual([]);
  });

  it("emittenteCompilato: vuoto (con il paese predefinito) non conta", () => {
    expect(emittenteCompilato(emittenteVuoto())).toBe(false);
    expect(emittenteCompilato(null)).toBe(false);
    expect(emittenteCompilato({ ...emittenteVuoto(), iban: "CH93" })).toBe(true);
  });
});
