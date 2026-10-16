import { describe, expect, it } from "vitest";
import {
  MESSAGGI_CONTI,
  idValido,
  leggiModificaMovimento,
  leggiNuovaFattura,
  leggiNuovoMovimento,
  leggiPagamentoFattura,
  nomeFilePulito,
  unisciModifica,
} from "./validazione";

const movimento = {
  tipo: "uscita",
  data: "2026-10-16",
  importo: 48.5,
  descrizione: "  Carta per la stampante ",
  controparte: "Migros",
  categoria: "materiale",
};

describe("leggiNuovoMovimento", () => {
  it("accetta un movimento valido e pulisce i testi", () => {
    expect(leggiNuovoMovimento(movimento)).toEqual({
      ok: true,
      dati: { ...movimento, descrizione: "Carta per la stampante" },
    });
  });

  it("la controparte è facoltativa e vuota diventa null", () => {
    const { controparte: _, ...senza } = movimento;
    expect(leggiNuovoMovimento(senza)).toMatchObject({ ok: true, dati: { controparte: null } });
    expect(leggiNuovoMovimento({ ...movimento, controparte: " " })).toMatchObject({ ok: true, dati: { controparte: null } });
  });

  it("rifiuta importi negativi, con tre decimali o come testo", () => {
    for (const importo of [-1, 48.555, "48.50", Number.NaN, 200_000_000]) {
      expect(leggiNuovoMovimento({ ...movimento, importo })).toEqual({ ok: false, messaggio: MESSAGGI_CONTI.importo });
    }
  });

  it("rifiuta date impossibili, descrizioni vuote e categorie del tipo sbagliato", () => {
    expect(leggiNuovoMovimento({ ...movimento, data: "2026-02-30" })).toEqual({ ok: false, messaggio: MESSAGGI_CONTI.data });
    expect(leggiNuovoMovimento({ ...movimento, descrizione: "  " })).toEqual({
      ok: false,
      messaggio: MESSAGGI_CONTI.descrizione,
    });
    expect(leggiNuovoMovimento({ ...movimento, tipo: "entrata" })).toEqual({ ok: false, messaggio: MESSAGGI_CONTI.categoria });
    expect(leggiNuovoMovimento({ ...movimento, categoria: "vacanze" })).toEqual({
      ok: false,
      messaggio: MESSAGGI_CONTI.categoria,
    });
  });

  it("rifiuta campi in più (stato, origine) e corpi strani", () => {
    expect(leggiNuovoMovimento({ ...movimento, stato: "confermato" }).ok).toBe(false);
    expect(leggiNuovoMovimento(null).ok).toBe(false);
    expect(leggiNuovoMovimento([movimento]).ok).toBe(false);
  });
});

describe("leggiModificaMovimento e unisciModifica", () => {
  it("accetta un solo campo e rifiuta una modifica vuota", () => {
    expect(leggiModificaMovimento({ stato: "confermato" })).toEqual({ ok: true, dati: { stato: "confermato" } });
    expect(leggiModificaMovimento({})).toEqual({ ok: false, messaggio: MESSAGGI_CONTI.modificaVuota });
    expect(leggiModificaMovimento({ stato: "da_confermare" }).ok).toBe(false);
    expect(leggiModificaMovimento({ origine: "manuale" }).ok).toBe(false);
  });

  it("cambiando il tipo la categoria torna coerente", () => {
    expect(unisciModifica({ tipo: "uscita", categoria: "software" }, { tipo: "entrata" })).toEqual({
      ok: true,
      dati: { tipo: "entrata", categoria: "altre_entrate" },
    });
    expect(unisciModifica({ tipo: "uscita", categoria: "software" }, { categoria: "vendite" })).toEqual({
      ok: false,
      messaggio: MESSAGGI_CONTI.categoria,
    });
    expect(unisciModifica({ tipo: "uscita", categoria: "software" }, { tipo: "entrata", categoria: "vendite" })).toEqual({
      ok: true,
      dati: { tipo: "entrata", categoria: "vendite" },
    });
  });
});

describe("fatture", () => {
  const fattura = {
    numero: "F-2026-007",
    cliente: "Rossi Sagl",
    data: "2026-10-01",
    scadenza: "2026-10-31",
    importo: 1250,
    riferimento: "RF18 5390 0754 7034",
  };

  it("accetta una fattura valida; scadenza e riferimento facoltativi", () => {
    expect(leggiNuovaFattura(fattura)).toEqual({ ok: true, dati: fattura });
    expect(leggiNuovaFattura({ ...fattura, scadenza: null, riferimento: "" })).toMatchObject({
      ok: true,
      dati: { scadenza: null, riferimento: null },
    });
    const { scadenza: _s, riferimento: _r, ...minima } = fattura;
    expect(leggiNuovaFattura(minima)).toMatchObject({ ok: true, dati: { scadenza: null, riferimento: null } });
  });

  it("rifiuta numero o cliente vuoti e una scadenza prima della data", () => {
    expect(leggiNuovaFattura({ ...fattura, numero: "" })).toEqual({ ok: false, messaggio: MESSAGGI_CONTI.numero });
    expect(leggiNuovaFattura({ ...fattura, cliente: " " })).toEqual({ ok: false, messaggio: MESSAGGI_CONTI.cliente });
    expect(leggiNuovaFattura({ ...fattura, scadenza: "2026-09-30" })).toEqual({
      ok: false,
      messaggio: MESSAGGI_CONTI.scadenza,
    });
  });

  it("pagataIl è una data o null", () => {
    expect(leggiPagamentoFattura({ pagataIl: "2026-10-20" })).toEqual({ ok: true, dati: { pagataIl: "2026-10-20" } });
    expect(leggiPagamentoFattura({ pagataIl: null })).toEqual({ ok: true, dati: { pagataIl: null } });
    expect(leggiPagamentoFattura({}).ok).toBe(false);
    expect(leggiPagamentoFattura({ pagataIl: "ieri" }).ok).toBe(false);
  });
});

describe("altri controlli", () => {
  it("pulisce il nome del file", () => {
    expect(nomeFilePulito("  scontrino\nmigros/../x.jpg ")).toBe("scontrino migros .. x.jpg");
    expect(nomeFilePulito("")).toBeNull();
    expect(nomeFilePulito(42)).toBeNull();
    expect(nomeFilePulito("a".repeat(500))).toHaveLength(200);
  });

  it("riconosce gli uuid", () => {
    expect(idValido("11111111-2222-3333-4444-555555555555")).toBe(true);
    expect(idValido("1; drop table")).toBe(false);
  });
});
