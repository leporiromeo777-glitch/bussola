import { describe, expect, it } from "vitest";
import { MINUTI_MASSIMI, TARIFFA_MASSIMA } from "./limiti";
import {
  emailValida,
  leggiAnnullaFattura,
  leggiMese,
  leggiModificaCliente,
  leggiModificaVoce,
  leggiNuovaVoce,
  leggiNuovoCliente,
  leggiRichiestaFattura,
  MESSAGGI_ORE,
  modificaAmmessaSuFatturata,
} from "./validazione";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("leggiNuovoCliente", () => {
  it("basta il nome: il resto ha valori predefiniti", () => {
    expect(leggiNuovoCliente({ nome: "  Rossi   SA " })).toEqual({
      ok: true,
      dati: { nome: "Rossi SA", via: "", numero: "", npa: "", localita: "", paese: "CH", email: null, tariffa: null },
    });
  });

  it("accetta un cliente completo e pulisce i testi come per la QR-fattura", () => {
    expect(
      leggiNuovoCliente({
        nome: "Caffè dell’Arte – Sagl",
        via: "Via Nassa",
        numero: "5a",
        npa: "6900",
        localita: "Lugano",
        paese: "ch",
        email: " info@arte.ch ",
        tariffa: 92.5,
      }),
    ).toEqual({
      ok: true,
      dati: {
        nome: "Caffè dell'Arte - Sagl",
        via: "Via Nassa",
        numero: "5a",
        npa: "6900",
        localita: "Lugano",
        paese: "CH",
        email: "info@arte.ch",
        tariffa: 92.5,
      },
    });
  });

  it("email e tariffa vuote diventano null", () => {
    expect(leggiNuovoCliente({ nome: "Rossi", email: "", tariffa: null })).toMatchObject({
      ok: true,
      dati: { email: null, tariffa: null },
    });
  });

  it("rifiuta nome vuoto, campi troppo lunghi, caratteri che la QR-fattura non accetta", () => {
    expect(leggiNuovoCliente({ nome: "   " })).toEqual({ ok: false, messaggio: MESSAGGI_ORE.nome });
    expect(leggiNuovoCliente({})).toMatchObject({ ok: false });
    expect(leggiNuovoCliente({ nome: "x".repeat(71) })).toEqual({
      ok: false,
      messaggio: "Il nome può avere al massimo 70 caratteri.",
    });
    expect(leggiNuovoCliente({ nome: "Rossi", localita: "x".repeat(36) })).toEqual({
      ok: false,
      messaggio: "La località può avere al massimo 35 caratteri.",
    });
    expect(leggiNuovoCliente({ nome: "Rossi 🙂" })).toEqual({
      ok: false,
      messaggio: "Il nome contiene un carattere che la QR-fattura non accetta.",
    });
  });

  it("rifiuta paese, email e tariffa sbagliati e campi in più", () => {
    expect(leggiNuovoCliente({ nome: "Rossi", paese: "Svizzera" })).toEqual({ ok: false, messaggio: MESSAGGI_ORE.paese });
    expect(leggiNuovoCliente({ nome: "Rossi", email: "rossi@" })).toEqual({ ok: false, messaggio: MESSAGGI_ORE.email });
    for (const tariffa of [-1, 80.555, "80", TARIFFA_MASSIMA + 1, Number.NaN]) {
      expect(leggiNuovoCliente({ nome: "Rossi", tariffa })).toEqual({ ok: false, messaggio: MESSAGGI_ORE.tariffa });
    }
    expect(leggiNuovoCliente({ nome: "Rossi", user_id: ID }).ok).toBe(false);
    expect(leggiNuovoCliente(null).ok).toBe(false);
    expect(leggiNuovoCliente([{ nome: "Rossi" }]).ok).toBe(false);
  });

  it("controlla le email come il database", () => {
    expect(emailValida("a@b.ch")).toBe(true);
    expect(emailValida("a b@c.ch")).toBe(false);
    expect(emailValida("a@b")).toBe(false);
    expect(emailValida(`${"a".repeat(250)}@b.ch`)).toBe(false);
  });
});

describe("leggiModificaCliente", () => {
  it("cambia solo i campi indicati", () => {
    expect(leggiModificaCliente({ tariffa: 100 })).toEqual({ ok: true, dati: { tariffa: 100 } });
    expect(leggiModificaCliente({ email: "", tariffa: null })).toEqual({ ok: true, dati: { email: null, tariffa: null } });
  });

  it("rifiuta una modifica vuota o un nome vuoto", () => {
    expect(leggiModificaCliente({})).toEqual({ ok: false, messaggio: MESSAGGI_ORE.modificaVuota });
    expect(leggiModificaCliente({ nome: "" })).toEqual({ ok: false, messaggio: MESSAGGI_ORE.nome });
  });
});

describe("leggiNuovaVoce", () => {
  const voce = { clienteId: ID, data: "2026-10-19", minuti: 90, descrizione: "  Sviluppo  del sito ", tariffa: 120 };

  it("accetta una voce valida e pulisce la descrizione", () => {
    expect(leggiNuovaVoce(voce)).toEqual({ ok: true, dati: { ...voce, descrizione: "Sviluppo del sito" } });
  });

  it("descrizione e tariffa sono facoltative", () => {
    expect(leggiNuovaVoce({ clienteId: ID, data: "2026-10-19", minuti: 30 })).toEqual({
      ok: true,
      dati: { clienteId: ID, data: "2026-10-19", minuti: 30, descrizione: "", tariffa: null },
    });
  });

  it("rifiuta durate fuori dai limiti o non intere", () => {
    for (const minuti of [0, -5, 1.5, MINUTI_MASSIMI + 1, "60"]) {
      expect(leggiNuovaVoce({ ...voce, minuti })).toEqual({ ok: false, messaggio: MESSAGGI_ORE.durata });
    }
    expect(leggiNuovaVoce({ ...voce, minuti: MINUTI_MASSIMI }).ok).toBe(true);
  });

  it("rifiuta cliente, data e descrizione non validi, e campi in più", () => {
    expect(leggiNuovaVoce({ ...voce, clienteId: "1; drop table" })).toEqual({ ok: false, messaggio: MESSAGGI_ORE.cliente });
    expect(leggiNuovaVoce({ ...voce, data: "2026-02-30" })).toEqual({ ok: false, messaggio: MESSAGGI_ORE.data });
    expect(leggiNuovaVoce({ ...voce, descrizione: "x".repeat(201) })).toEqual({
      ok: false,
      messaggio: MESSAGGI_ORE.descrizione,
    });
    expect(leggiNuovaVoce({ ...voce, fatturataIl: "2026-10-19" }).ok).toBe(false);
  });
});

describe("leggiModificaVoce", () => {
  it("anche solo il segno «fatturata», da togliere o da mettere", () => {
    expect(leggiModificaVoce({ fatturataIl: null })).toEqual({ ok: true, dati: { fatturataIl: null } });
    expect(leggiModificaVoce({ fatturataIl: "2026-10-31" })).toEqual({ ok: true, dati: { fatturataIl: "2026-10-31" } });
    expect(leggiModificaVoce({})).toEqual({ ok: false, messaggio: MESSAGGI_ORE.modificaVuota });
  });

  it("su una voce fatturata si cambia solo il segno", () => {
    expect(modificaAmmessaSuFatturata({ fatturataIl: null })).toBe(true);
    expect(modificaAmmessaSuFatturata({ minuti: 30 })).toBe(false);
    expect(modificaAmmessaSuFatturata({ fatturataIl: null, minuti: 30 })).toBe(false);
  });
});

describe("mese e fattura", () => {
  it("leggiMese: predefinito senza parametro, errore se non valido", () => {
    expect(leggiMese(null, "2026-10")).toEqual({ ok: true, dati: "2026-10" });
    expect(leggiMese("2026-09", "2026-10")).toEqual({ ok: true, dati: "2026-09" });
    expect(leggiMese("2026-9", "2026-10")).toEqual({ ok: false, messaggio: MESSAGGI_ORE.mese });
  });

  it("leggiRichiestaFattura", () => {
    expect(leggiRichiestaFattura({ clienteId: ID, mese: "2026-10", dettaglio: "voci" })).toEqual({
      ok: true,
      dati: { clienteId: ID, mese: "2026-10", dettaglio: "voci" },
    });
    expect(leggiRichiestaFattura({ clienteId: ID, mese: "2026-10", dettaglio: "tutto" }).ok).toBe(false);
    expect(leggiRichiestaFattura({ clienteId: ID, mese: "ottobre", dettaglio: "voci" })).toEqual({
      ok: false,
      messaggio: MESSAGGI_ORE.mese,
    });
  });

  it("leggiAnnullaFattura", () => {
    const parametri = (o: Record<string, string>) => new URLSearchParams(o);
    expect(leggiAnnullaFattura(parametri({ cliente: ID, mese: "2026-10", fatturataIl: "2026-10-31" }))).toEqual({
      ok: true,
      dati: { clienteId: ID, mese: "2026-10", fatturataIl: "2026-10-31" },
    });
    expect(leggiAnnullaFattura(parametri({ cliente: ID, mese: "2026-10" })).ok).toBe(false);
    expect(leggiAnnullaFattura(parametri({ cliente: "x", mese: "2026-10", fatturataIl: "2026-10-31" })).ok).toBe(false);
  });
});
