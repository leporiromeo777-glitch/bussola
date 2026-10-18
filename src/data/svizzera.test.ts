import { describe, expect, it } from "vitest";
import {
  avsIndipendenti,
  chf,
  dataSvizzera,
  datiStrumenti,
  fonti,
  fontiPercorso,
  percentuale,
  pilastro3a,
  regole,
  regoleFatture,
  regoleInfortuni,
  regolePercorso,
  regolePrevidenza,
  regoleRegistro,
  tasseRegistroCommercio,
  VERIFICATO_FORME,
  VERIFICATO_INFORTUNI,
  VERIFICATO_REGISTRO,
  VERIFICATO_FATTURE,
  VERIFICATO_PREVIDENZA,
} from "./svizzera";

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
  it("il capitale minimo di Sagl e SA è quello di legge, in formato svizzero", () => {
    expect(regole.capitaleMinimoSagl.valore).toBe(20_000);
    expect(regole.capitaleMinimoSa.valore).toBe(100_000);
    expect(chf(regole.capitaleMinimoSagl.valore)).toBe("CHF 20'000");
    expect(chf(regole.capitaleMinimoSa.valore)).toBe("CHF 100'000");
  });
  it("nella SA alla costituzione si versano almeno CHF 50'000", () => {
    expect(regole.versamentoMinimoSa.valore).toBe(50_000);
    expect(regole.versamentoMinimoSa.fonte).toBe(fonti.co632);
    expect(chf(regole.versamentoMinimoSa.valore)).toBe("CHF 50'000");
  });
  it("le pagine sulle forme giuridiche sono del Portale PMI e hanno una data di controllo", () => {
    for (const f of [fontiPercorso.pmiNomeCollettivo, fontiPercorso.pmiSa, fontiPercorso.pmiScegliereForma, fontiPercorso.pmiSagl]) {
      expect(f.url).toMatch(/^https:\/\/www\.kmu\.admin\.ch\/it\//);
    }
    expect(VERIFICATO_FORME).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("le soglie chiave sono quelle di legge", () => {
    expect(regole.sogliaRegistroCommercio.valore).toBe(100_000);
    expect(regole.sogliaIva.valore).toBe(100_000);
    expect(avsIndipendenti[2026].valore.contributoMinimo).toBe(530);
  });
  it("assicurazione infortuni facoltativa: il guadagno minimo è il 45% (2026) e il 30% (dal 2027) del massimo", () => {
    const massimo = regoleInfortuni.guadagnoMassimoAssicurato.valore;
    expect(massimo).toBe(148_200);
    expect(regoleInfortuni.guadagnoMinimoIndipendenti[2026].valore).toBe(Math.round(massimo * 0.45));
    expect(regoleInfortuni.guadagnoMinimoIndipendenti[2027].valore).toBe(Math.round(massimo * 0.3));
    expect(chf(regoleInfortuni.guadagnoMinimoIndipendenti[2026].valore)).toBe("CHF 66'690");
    expect(regoleInfortuni.guadagnoMinimoIndipendenti[2027].fonte).toBe(fontiPercorso.oainfModifica2027);
    expect(regoleInfortuni.oreSettimanaliNonProfessionali.verificatoIl).toBe(VERIFICATO_INFORTUNI);
  });
  it("registro di commercio: tasse, autenticazione e multa sono quelle delle fonti, con la data di controllo", () => {
    const t = tasseRegistroCommercio.valore;
    expect(t.primaIscrizioneDittaIndividuale + t.perFunzione + t.perDirittoDiFirma).toBe(t.stimaTitolareConFirma);
    expect(regolePercorso.autenticazioneFirmaRcTicino.valore).toBeLessThan(regoleRegistro.autenticazioneFirmaNotaioMassimoFranchi.valore);
    expect(chf(regoleRegistro.multaMancataIscrizioneFranchi.valore)).toBe("CHF 5'000");
    expect(regoleRegistro.multaMancataIscrizioneFranchi.fonte).toBe(fontiPercorso.co940);
    expect(regoleRegistro.fallimentoDopoCancellazioneMesi.valore).toBe(6);
    for (const d of Object.values(regoleRegistro)) expect(d.verificatoIl).toBe(VERIFICATO_REGISTRO);
  });
  it("fatture: numero IVA nel formato dell'AFC, QR-fattura dal 01.10.2022, con la data di controllo", () => {
    expect(regoleFatture.formatoNumeroIva.valore).toMatch(/^CHE-\d{3}\.\d{3}\.\d{3} IVA$/);
    expect(regoleFatture.formatoNumeroIva.fonte).toBe(fontiPercorso.afcIdi);
    expect(dataSvizzera(regoleFatture.qrFatturaDal.valore)).toBe("01.10.2022");
    expect(regoleFatture.qrFatturaDal.fonte).toBe(fonti.six);
    for (const d of Object.values(regoleFatture)) expect(d.verificatoIl).toBe(VERIFICATO_FATTURE);
    expect(datiStrumenti.indirizzoStrutturatoQr.verificatoIl).toBe(VERIFICATO_FATTURE);
    expect(regolePercorso.conservazioneDocumentiAnni.fonte).toBe(fonti.co958f);
  });
  it("previdenza: indennità giornaliera dai 15 ai 65 anni (LAMal) e pilastro 3a con la data di controllo", () => {
    expect(regolePrevidenza.etaIndennitaGiornaliera.valore).toEqual({ da: 15, primaDi: 65 });
    expect(regolePrevidenza.etaIndennitaGiornaliera.fonte).toBe(fontiPercorso.lamal67);
    expect(percentuale(datiStrumenti.quotaMassimaPilastro3a.valore, 0)).toBe("20%");
    for (const d of [regolePrevidenza.etaIndennitaGiornaliera, datiStrumenti.quotaMassimaPilastro3a, pilastro3a[2026], pilastro3a[2027]]) {
      expect(d.verificatoIl).toBe(VERIFICATO_PREVIDENZA);
    }
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
