import { describe, expect, it } from "vitest";
import { avsIndipendenti, datiStrumenti, fontiStrumenti, supplementiTicino } from "./svizzera";

describe("dati degli strumenti in svizzera.ts", () => {
  it("ogni fonte degli strumenti ha un URL https", () => {
    for (const f of Object.values(fontiStrumenti)) {
      expect(f.url).toMatch(/^https:\/\//);
      expect(f.titolo.length).toBeGreaterThan(5);
      expect(f.ente.length).toBeGreaterThan(2);
    }
  });

  it("ogni dato ha fonte e data di controllo", () => {
    for (const d of Object.values(datiStrumenti)) {
      expect(d.fonte.url).toMatch(/^https:\/\//);
      expect(d.verificatoIl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("valori della ricerca (15.10.2026)", () => {
    expect(datiStrumenti.guadagnoMassimoAssegniFamiliari.valore).toBe(148_200);
    expect(datiStrumenti.limiteAttivitaAccessoria.valore).toBe(2_500);
    expect(datiStrumenti.qrIid.valore).toEqual({ da: 30_000, a: 31_999 });
    expect(datiStrumenti.importoQr.valore.massimo).toBe(999_999_999.99);
    expect(datiStrumenti.quotaMassimaPilastro3a.valore).toBe(0.2);
    // Supplementi ticinesi usati dalla stima AVS.
    expect(supplementiTicino.speseAmministrative.valore).toBe(0.02);
    expect(supplementiTicino.assegniFamiliari.valore).toBe(0.0085);
    expect(supplementiTicino.assegnoIntegrativo.valore).toBe(0.0015);
    expect(avsIndipendenti[2026].valore).toMatchObject({ limiteInferioreScala: 10_100, limiteSuperioreScala: 60_500, contributoMinimo: 530 });
  });
});
