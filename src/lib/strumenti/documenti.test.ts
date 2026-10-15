import { describe, expect, it } from "vitest";
import {
  aggiungiGiorni,
  calcolaRiga,
  calcolaTotali,
  controllaDocumento,
  dataIsoLocale,
  dataIsoValida,
  duplicaDocumento,
  elementiObbligatoriIva,
  emittenteVuoto,
  erroriPagamento,
  normalizzaNumeroIva,
  nuovoDocumento,
  pagamentoDaDocumento,
  preventivoInFattura,
  prossimoNumero,
  riferimentoPerFattura,
  schemaElencoDocumenti,
  type Contesto,
  type Documento,
  type Emittente,
  type Riga,
} from "./documenti";
import { riferimentoQrValido, riferimentoScorValido, validaPagamentoQr } from "./qr";

let contatore = 0;
const contesto = (oggiIso = "2026-10-19"): Contesto => ({
  id: `doc-${++contatore}`,
  oggiIso,
  adessoIso: `${oggiIso}T10:00:00.000Z`,
  idRiga: () => `riga-${++contatore}`,
});

const emittente: Emittente = {
  ...emittenteVuoto(),
  nome: "Giulia Bernasconi",
  via: "Via Lugano",
  numero: "12",
  npa: "6500",
  localita: "Bellinzona",
  email: "giulia@example.ch",
  iban: "CH93 0076 2011 6238 5295 7",
};

const riga = (descrizione: string, quantita: string, prezzo: string, aliquota: Riga["aliquota"] = "normale"): Riga => ({
  id: `r-${descrizione}`,
  descrizione,
  quantita,
  unita: "ore",
  prezzo,
  aliquota,
});

function fattura(modifiche: Partial<Documento> = {}): Documento {
  return {
    ...nuovoDocumento("fattura", emittente, [], contesto()),
    numero: "F-2026-001",
    cliente: { nome: "Bar Centrale", via: "Piazza Grande", numero: "1", npa: "6600", localita: "Locarno", paese: "CH" },
    righe: [riga("Sito web", "1", "1'200"), riga("Fotografie", "2.5", "80")],
    ...modifiche,
  };
}

describe("date", () => {
  it("dataIsoLocale, aggiungiGiorni e validità", () => {
    expect(dataIsoLocale(new Date(2026, 9, 5))).toBe("2026-10-05");
    expect(aggiungiGiorni("2026-10-19", 30)).toBe("2026-11-18");
    expect(aggiungiGiorni("2026-12-15", 30)).toBe("2027-01-14");
    expect(dataIsoValida("2026-02-29")).toBe(false);
    expect(dataIsoValida("2028-02-29")).toBe(true);
    expect(dataIsoValida("19.10.2026")).toBe(false);
  });
});

describe("numerazione", () => {
  it("prossimo numero per tipo e anno", () => {
    const docs = [
      { ...fattura(), numero: "F-2026-001" },
      { ...fattura(), numero: "F-2026-007" },
      { ...fattura(), numero: "F-2025-020" },
      { ...fattura(), numero: "fattura speciale" },
      { ...fattura(), tipo: "preventivo" as const, numero: "P-2026-003" },
    ];
    expect(prossimoNumero("fattura", docs, 2026)).toBe("F-2026-008");
    expect(prossimoNumero("fattura", docs, 2027)).toBe("F-2027-001");
    expect(prossimoNumero("preventivo", docs, 2026)).toBe("P-2026-004");
  });

  it("nuovo documento: data di oggi, scadenza a 30 giorni, una riga vuota", () => {
    const d = nuovoDocumento("preventivo", emittente, [], contesto("2026-10-19"));
    expect(d.numero).toBe("P-2026-001");
    expect(d.data).toBe("2026-10-19");
    expect(d.scadenza).toBe("2026-11-18");
    expect(d.righe).toHaveLength(1);
    expect(d.emittente).toEqual(emittente);
    expect(d.emittente).not.toBe(emittente);
  });
});

describe("totali", () => {
  it("senza IVA: somma delle righe, IVA ignorata anche se impostata sulle righe", () => {
    const t = calcolaTotali(fattura());
    expect(t.righe.map((r) => r.importo)).toEqual([1200, 200]);
    expect(t.imponibile).toBe(1400);
    expect(t.iva).toEqual([]);
    expect(t.totale).toBe(1400);
  });

  it("quantità decimali e prezzi con centesimi senza errori di arrotondamento", () => {
    expect(calcolaRiga(riga("x", "3", "0.10")).importo).toBe(0.3);
    expect(calcolaRiga(riga("x", "1.5", "33.33")).importo).toBe(50);
    expect(calcolaRiga(riga("x", "7", "19.99")).importo).toBe(139.93);
    expect(calcolaRiga(riga("x", "-1", "10")).valida).toBe(false);
    expect(calcolaRiga(riga("x", "1", "abc")).importo).toBe(0);
  });

  it("con IVA: imposta per aliquota da svizzera.ts (8,1% e 2,6%)", () => {
    const d = fattura({
      emittente: { ...emittente, ivaIscritto: true, numeroIva: "CHE-123.456.789 IVA" },
      righe: [riga("Consulenza", "10", "100"), riga("Libro", "2", "25", "ridotta"), riga("Stampa", "1", "33.35")],
    });
    const t = calcolaTotali(d);
    expect(t.imponibile).toBe(1083.35);
    expect(t.iva).toEqual([
      { aliquota: "normale", tasso: 0.081, base: 1033.35, imposta: 83.7 }, // 83.70135
      { aliquota: "ridotta", tasso: 0.026, base: 50, imposta: 1.3 },
    ]);
    expect(t.totaleIva).toBe(85);
    expect(t.totale).toBe(1168.35);
  });

  it("arrotondamento ai 5 centesimi solo in CHF", () => {
    const righe = [riga("x", "1", "10.02")];
    expect(calcolaTotali(fattura({ righe, arrotonda5: true }))).toMatchObject({ totaleLordo: 10.02, arrotondamento: -0.02, totale: 10 });
    expect(calcolaTotali(fattura({ righe: [riga("x", "1", "10.03")], arrotonda5: true })).totale).toBe(10.05);
    expect(calcolaTotali(fattura({ righe, arrotonda5: true, valuta: "EUR" })).totale).toBe(10.02);
    expect(calcolaTotali(fattura({ righe, arrotonda5: false })).arrotondamento).toBe(0);
  });

  it("sconto con prezzo negativo", () => {
    const t = calcolaTotali(fattura({ righe: [riga("Lavoro", "1", "500"), riga("Sconto", "1", "-50")] }));
    expect(t.totale).toBe(450);
  });
});

describe("numero IVA", () => {
  it.each([
    ["CHE-123.456.789 IVA", "CHE-123.456.789 IVA"],
    ["che123456789", "CHE-123.456.789 IVA"],
    ["CHE 123 456 789 MWST", "CHE-123.456.789 IVA"],
    ["CHE-123.456.789", "CHE-123.456.789 IVA"],
  ])("%s → %s", (testo, atteso) => expect(normalizzaNumeroIva(testo)).toBe(atteso));

  it.each(["", "CHE-123.456.78", "123.456.789", "CHE-123.456.789 XYZ"])("%s non valido", (testo) =>
    expect(normalizzaNumeroIva(testo)).toBeNull(),
  );
});

describe("controlli", () => {
  it("documento completo senza problemi", () => {
    expect(controllaDocumento(fattura())).toEqual([]);
  });

  it("segnala i dati mancanti", () => {
    const campi = controllaDocumento(
      fattura({
        numero: "",
        cliente: { ...fattura().cliente, nome: "" },
        emittente: { ...emittente, nome: "", ivaIscritto: true, numeroIva: "123" },
        righe: [riga("", "1", "100")],
        scadenza: "2026-01-01",
        valuta: "EUR",
      }),
    ).map((p) => p.campo);
    expect(campi).toEqual(
      expect.arrayContaining(["emittente.nome", "emittente.numeroIva", "valuta", "numero", "scadenza", "cliente.nome", "righe.r-.descrizione"]),
    );
  });

  it("fattura: controlla anche la sezione pagamento", () => {
    const campi = (d: Documento) => controllaDocumento(d).map((p) => p.campo);
    // Senza IBAN: il PDF uscirebbe senza conto e senza QR.
    const senzaIban = controllaDocumento(fattura({ emittente: { ...emittente, iban: "" } }));
    expect(senzaIban).toContainEqual({ campo: "pagamento.iban", messaggio: "Scrivi l'IBAN del conto su cui vuoi ricevere i pagamenti." });
    // IBAN che non vale per la QR-fattura (non CH/LI) o sbagliato.
    expect(campi(fattura({ emittente: { ...emittente, iban: "DE89 3704 0044 0532 0130 00" } }))).toContain("pagamento.iban");
    expect(campi(fattura({ emittente: { ...emittente, iban: "CH93 0076 2011 6238 5295 8" } }))).toContain("pagamento.iban");
    // QR-IBAN con un numero senza cifre: nessun riferimento QR possibile.
    expect(campi(fattura({ numero: "Logo-Bar", emittente: { ...emittente, iban: "CH44 3199 9123 0008 8901 2" } }))).toContain(
      "pagamento.riferimento",
    );
    // QR-IBAN con un riferimento scritto a mano sbagliato.
    expect(
      campi(fattura({ riferimento: "manuale", riferimentoManuale: "123", emittente: { ...emittente, iban: "CH44 3199 9123 0008 8901 2" } })),
    ).toContain("pagamento.riferimento");
    // Importo zero.
    expect(campi(fattura({ righe: [riga("Omaggio", "1", "0")] }))).toContain("pagamento.importo");
    // Carattere non ammesso nel tuo nome: il messaggio dice in quale campo.
    const emoji = controllaDocumento(fattura({ emittente: { ...emittente, nome: "Giulia 😀" } }));
    const problemaNome = emoji.find((p) => p.campo === "pagamento.creditore.nome");
    expect(problemaNome?.messaggio).toContain("Il tuo indirizzo nella QR-fattura (nome)");
    expect(problemaNome?.messaggio).toContain("😀");
    // Nome o località mancanti si segnalano una volta sola, con il messaggio chiaro.
    const senzaNome = campi(fattura({ emittente: { ...emittente, nome: "", npa: "" } }));
    expect(senzaNome).toContain("emittente.nome");
    expect(senzaNome).toContain("emittente.localita");
    expect(senzaNome).not.toContain("pagamento.creditore.nome");
    expect(senzaNome).not.toContain("pagamento.creditore.npa");
    // Il preventivo non ha la sezione pagamento: l'IBAN non serve.
    expect(controllaDocumento({ ...fattura({ emittente: { ...emittente, iban: "" } }), tipo: "preventivo" })).toEqual([]);
    expect(erroriPagamento(fattura())).toEqual([]);
  });

  it("senza righe compilate", () => {
    expect(controllaDocumento(fattura({ righe: [riga("", "1", "")] })).map((p) => p.campo)).toContain("righe");
  });

  it("elementi dell'art. 26 LIVA", () => {
    const senzaIva = elementiObbligatoriIva(fattura());
    expect(senzaIva.find((e) => e.id === "fornitore")?.ok).toBe(false);
    expect(senzaIva.find((e) => e.id === "imposta")?.ok).toBe(false);
    const conIva = elementiObbligatoriIva(
      fattura({ emittente: { ...emittente, ivaIscritto: true, numeroIva: "CHE-123.456.789 IVA" } }),
    );
    expect(conIva.every((e) => e.ok)).toBe(true);
    expect(conIva).toHaveLength(6);
  });
});

describe("da preventivo a fattura", () => {
  it("copia cliente e righe, nuovo numero di fattura, collegamento al preventivo", () => {
    const preventivo = { ...fattura(), tipo: "preventivo" as const, numero: "P-2026-004" };
    const esistenti = [preventivo, { ...fattura(), numero: "F-2026-002" }];
    const f = preventivoInFattura(preventivo, esistenti, contesto("2026-11-02"));
    expect(f.tipo).toBe("fattura");
    expect(f.numero).toBe("F-2026-003");
    expect(f.daPreventivo).toBe("P-2026-004");
    expect(f.data).toBe("2026-11-02");
    expect(f.scadenza).toBe("2026-12-02");
    expect(f.cliente).toEqual(preventivo.cliente);
    expect(f.righe.map((r) => r.descrizione)).toEqual(preventivo.righe.map((r) => r.descrizione));
    expect(f.righe[0].id).not.toBe(preventivo.righe[0].id);
    expect(f.id).not.toBe(preventivo.id);
  });

  it("duplica mantiene il tipo", () => {
    const d = duplicaDocumento(fattura(), [fattura()], contesto());
    expect(d.tipo).toBe("fattura");
    expect(d.numero).toBe("F-2026-002");
  });
});

describe("sezione pagamento", () => {
  it("IBAN normale: riferimento RF creato dal numero", () => {
    const r = riferimentoPerFattura(fattura());
    expect(r.ok && r.tipo).toBe("SCOR");
    if (r.ok) expect(riferimentoScorValido(r.valore)).toBe(true);
  });

  it("IBAN normale senza riferimento", () => {
    expect(riferimentoPerFattura(fattura({ riferimento: "nessuno" }))).toEqual({ ok: true, tipo: "NON", valore: "" });
  });

  it("QR-IBAN: riferimento QR creato dal numero", () => {
    const d = fattura({ emittente: { ...emittente, iban: "CH44 3199 9123 0008 8901 2" } });
    const r = riferimentoPerFattura(d);
    expect(r.ok && r.tipo).toBe("QRR");
    if (r.ok) expect(riferimentoQrValido(r.valore)).toBe(true);
  });

  it("QR-IBAN con numero senza cifre: errore chiaro", () => {
    const r = riferimentoPerFattura(fattura({ numero: "ABC", emittente: { ...emittente, iban: "CH4431999123000889012" } }));
    expect(r.ok).toBe(false);
  });

  it("dati completi validi per swissqrbill, con il cliente come debitore", () => {
    const p = pagamentoDaDocumento(fattura());
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.dati.importo).toBe(1400);
    expect(p.dati.debitore?.nome).toBe("Bar Centrale");
    expect(p.dati.messaggio).toBe("Fattura F-2026-001");
    const v = validaPagamentoQr(p.dati);
    expect(v.ok).toBe(true);
  });

  it("cliente senza NPA: niente debitore nella sezione", () => {
    const p = pagamentoDaDocumento(fattura({ cliente: { ...fattura().cliente, npa: "" } }));
    expect(p.ok && p.dati.debitore).toBeUndefined();
  });

  it("IBAN sbagliato", () => {
    const p = pagamentoDaDocumento(fattura({ emittente: { ...emittente, iban: "CH00 1234" } }));
    expect(p.ok).toBe(false);
  });
});

describe("schemaElencoDocumenti", () => {
  it("tiene i documenti buoni e scarta quelli rovinati", () => {
    const buono = fattura();
    const elenco = schemaElencoDocumenti.parse([buono, { id: "x" }, null, { ...buono, id: "y", valuta: "USD", righe: "?" }]);
    expect(elenco).toHaveLength(2);
    expect(elenco[0]).toEqual(buono);
    expect(elenco[1].valuta).toBe("CHF");
    expect(elenco[1].righe).toEqual([]);
    expect(schemaElencoDocumenti.parse("non un elenco")).toEqual([]);
  });
});
