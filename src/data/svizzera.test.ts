import { describe, expect, it } from "vitest";
import { avsIndipendenti, chf, dataSvizzera, fonti, percentuale, regole } from "./svizzera";

describe("formattazione svizzera", () => {
  it("chf usa l'apostrofo per le migliaia", () => {
    expect(chf(100000)).toBe("CHF 100'000");
    expect(chf(530)).toBe("CHF 530");
    expect(chf(1234.5, 2)).toBe("CHF 1'234.50");
    expect(chf(-2500)).toBe("-CHF 2'500");
  });
  it("percentuale usa la virgola e toglie gli zeri inutili", () => {
    expect(percentuale(0.081)).toBe("8,1%");
    expect(percentuale(0.1)).toBe("10%");
    expect(percentuale(0.05371, 3)).toBe("5,371%");
  });
  it("dataSvizzera", () => {
    expect(dataSvizzera("2026-10-15")).toBe("15.10.2026");
  });
});

describe("dati ufficiali", () => {
  it("ogni fonte ha un URL https", () => {
    for (const f of Object.values(fonti)) expect(f.url).toMatch(/^https:\/\//);
  });
  it("le soglie chiave sono quelle di legge", () => {
    expect(regole.sogliaRegistroCommercio.valore).toBe(100_000);
    expect(regole.sogliaIva.valore).toBe(100_000);
    expect(avsIndipendenti[2026].valore.contributoMinimo).toBe(530);
  });
});

describe("date nei testi", () => {
  it("i dati, i passi e la tavola scalare scrivono le date come gg.mm.aaaa", async () => {
    const svizzera = await import("./svizzera");
    const { PASSI } = await import("./passi");
    const { tavoleScalari } = await import("./avs-tavola-scalare");
    const testo = JSON.stringify([svizzera, PASSI, tavoleScalari]);
    // Niente «1.1.2027» o «2.10.2026»: giorno e mese con due cifre.
    expect(testo.match(/(?<![\d.])\d{1,2}\.\d{1,2}\.\d{4}/g)?.filter((d) => !/^\d{2}\.\d{2}\.\d{4}$/.test(d)) ?? []).toEqual([]);
    expect(testo).toContain("dal 01.10.2022");
  });
});
