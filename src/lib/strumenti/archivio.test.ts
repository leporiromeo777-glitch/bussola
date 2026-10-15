import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CHIAVI_ARCHIVIO, codifica, decodifica, VERSIONE_ARCHIVIO } from "./archivio";
import { datiTariffaIniziali, schemaDatiTariffa } from "./tariffa";

const schema = z.object({ nome: z.string() });
const predefinito = () => ({ nome: "predefinito" });

describe("archivio locale", () => {
  it("andata e ritorno", () => {
    const grezzo = codifica({ nome: "Giulia" });
    expect(JSON.parse(grezzo)).toEqual({ v: VERSIONE_ARCHIVIO, dati: { nome: "Giulia" } });
    expect(decodifica(grezzo, schema, predefinito)).toEqual({ nome: "Giulia" });
  });

  it.each([
    ["niente salvato", null],
    ["JSON rotto", "{nome:"],
    ["versione sconosciuta", JSON.stringify({ v: 99, dati: { nome: "x" } })],
    ["senza busta", JSON.stringify({ nome: "x" })],
    ["dati sbagliati", JSON.stringify({ v: VERSIONE_ARCHIVIO, dati: { nome: 3 } })],
    ["null", "null"],
  ])("%s → predefinito", (_, grezzo) => {
    expect(decodifica(grezzo, schema, predefinito)).toEqual({ nome: "predefinito" });
  });

  it("funziona con gli schemi degli strumenti", () => {
    const dati = datiTariffaIniziali("2026-10-15");
    expect(decodifica(codifica(dati), schemaDatiTariffa, () => dati)).toEqual(dati);
  });

  it("chiavi tutte sotto bussola.strumenti.", () => {
    for (const chiave of Object.values(CHIAVI_ARCHIVIO)) expect(chiave).toMatch(/^bussola\.strumenti\./);
  });
});
