import { describe, expect, it } from "vitest";
import { eIdPasso, FASI, ID_PASSI, PASSI, TITOLI_FASI, trovaPasso } from "./passi";
import { fonti, fontiPercorso, regoleDichiarazione, regolePercorso, ufficiPercorso, VERIFICATO_DICHIARAZIONE } from "./svizzera";

describe("catalogo dei passi", () => {
  it("id unici, brevi e stabili (minuscole e trattini)", () => {
    expect(new Set(ID_PASSI).size).toBe(PASSI.length);
    for (const id of ID_PASSI) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("ogni fase ha un titolo e almeno un passo, e i passi sono in ordine di fase", () => {
    for (const fase of FASI) {
      expect(TITOLI_FASI[fase]).toBeTruthy();
      expect(PASSI.some((p) => p.fase === fase)).toBe(true);
    }
    const indici = PASSI.map((p) => FASI.indexOf(p.fase));
    expect(indici).toEqual([...indici].sort((a, b) => a - b));
  });

  it("ogni passo ha testi, cosa fare, link ufficiale https e fonti verificate", () => {
    for (const p of PASSI) {
      expect(p.titolo.length).toBeGreaterThan(5);
      expect(p.descrizione.length).toBeGreaterThan(30);
      expect(p.cosaFare.length).toBeGreaterThan(0);
      expect(p.link.url).toMatch(/^https:\/\//);
      expect(p.link.etichetta.length).toBeGreaterThan(3);
      expect(p.fonti.length).toBeGreaterThan(0);
      for (const f of p.fonti) {
        expect(f.url).toMatch(/^https:\/\//);
        expect(f.titolo).toBeTruthy();
        expect(f.ente).toBeTruthy();
      }
      expect(p.verificatoIl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.domandaChat.endsWith("?")).toBe(true);
    }
  });

  it("«cosa fare» sono azioni, non letture: nessun punto comincia con «Leggi»", () => {
    for (const passo of PASSI) {
      for (const c of passo.cosaFare) expect(c, passo.id).not.toMatch(/^Leggi\b/);
    }
  });

  it("il link principale di ogni passo è anche tra le sue fonti o viene da una fonte ufficiale", () => {
    const tutteLeFonti = new Set([...Object.values(fonti), ...Object.values(fontiPercorso)].map((f) => f.url));
    for (const p of PASSI) expect(tutteLeFonti.has(p.link.url)).toBe(true);
  });

  it("i costi noti hanno una fonte", () => {
    const conCosto = PASSI.filter((p) => "costoNoto" in p);
    expect(conCosto.map((p) => p.id)).toEqual(["autorizzazione-esercizio-pubblico", "autorizzazione-sanitaria", "iscrizione-rc"]);
    for (const p of conCosto) {
      if ("costoNoto" in p) expect(p.costoNoto.fonte.url).toMatch(/^https:\/\//);
    }
  });

  it("le cifre nei testi vengono da svizzera.ts e sono in formato svizzero", () => {
    const rc = trovaPasso("iscrizione-rc");
    expect(rc?.costoNoto?.testo).toBe(
      "CHF 120 di tasse federali (CHF 80 + CHF 20 + CHF 20), più l'autenticazione della firma",
    );
    expect(rc?.cosaFare.join(" ")).toContain(`CHF ${regolePercorso.autenticazioneFirmaRcTicino.valore}`);
    expect(trovaPasso("iscrizione-iva")?.cosaFare.join(" ")).toContain("normale 8,1%, ridotta 2,6%, alloggio 3,8%");
    expect(trovaPasso("soci-forma-giuridica")?.descrizione).toContain("CHF 20'000");
    expect(trovaPasso("aiuto")?.descrizione).toContain("15 ore in 2 anni");
    const locali = trovaPasso("locali-pubblico")?.cosaFare.join(" ");
    expect(locali).toContain("dalle 06.00 alle 19.00, il sabato fino alle 18.30");
    expect(locali).toContain("almeno 30 giorni prima (tassa da CHF 300)");
    expect(locali).toContain("fino a 0,5 m²");
    const sanitaria = trovaPasso("autorizzazione-sanitaria");
    expect(sanitaria?.costoNoto?.testo).toBe(
      "Tassa di autorizzazione: da CHF 400 a CHF 600; per le professioni con formazione accademica da CHF 600 a CHF 1'200",
    );
    expect(sanitaria?.cosaFare.join(" ")).toContain("Via Orico 5, 6501 Bellinzona");
    expect(trovaPasso("acconti-imposte")?.cosaFare.join(" ")).toContain(
      ufficiPercorso.esazioneCondoniTicino.valore.email,
    );
    // Nessun importo scritto con il punto o la virgola come separatore delle migliaia.
    const testi = PASSI.flatMap((p) => [p.descrizione, ...p.cosaFare]).join(" ");
    expect(testi).not.toMatch(/CHF \d{1,3}[.,]\d{3}/);
  });

  it("eIdPasso e trovaPasso", () => {
    expect(eIdPasso("nome-ditta")).toBe(true);
    expect(eIdPasso("inventato")).toBe(false);
    expect(eIdPasso(42)).toBe(false);
    expect(trovaPasso("fatture")?.fase).toBe("primi mesi");
    expect(trovaPasso("inventato")).toBeUndefined();
  });
});

describe("dati aggiunti per il percorso in svizzera.ts", () => {
  it("ogni fonte del percorso ha un URL https e un ente", () => {
    for (const f of Object.values(fontiPercorso)) {
      expect(f.url).toMatch(/^https:\/\//);
      expect(f.ente).toBeTruthy();
    }
  });

  it("i valori chiave sono quelli della ricerca", () => {
    expect(regolePercorso.attivitaAccessoriaAvs.valore).toBe(2_500);
    expect(regolePercorso.sogliaAccontiAvs.valore).toBe(0.75);
    expect(regolePercorso.interesseMoraAvs.valore).toBe(0.05);
    expect(regolePercorso.variazioneRedditoIas.valore).toBe(0.25);
    expect(regolePercorso.accontiAvs.valore).toEqual({ giorno: 10, mesi: [1, 4, 7, 10] });
    expect(regolePercorso.ifdRataUnicaTicino.valore).toEqual({ giorno: 31, mese: 3 });
    expect(regolePercorso.accontiCantonaliTicino[2026]?.valore).toEqual(["2026-05-31", "2026-07-31", "2026-09-30"]);
    expect(regolePercorso.accontiCantonaliTicino[2027]).toBeUndefined();
    expect(regolePercorso.conservazioneDocumentiAnni.valore).toBe(10);
    expect(regolePercorso.fondounimpresa.valore).toEqual({ oreMassime: 15, anniMassimi: 2 });
  });

  it("dichiarazione d'imposta: perdite, termine 2025 e ufficio vengono dai dati verificati", () => {
    expect(regoleDichiarazione.perditeEserciziPrecedenti.valore).toBe(7);
    expect(regolePercorso.termineDichiarazioneTicino2025.valore).toBe("2026-04-30");
    expect(regolePercorso.termineDichiarazioneTicino2025.verificatoIl).toBe(VERIFICATO_DICHIARAZIONE);
    const p = trovaPasso("dichiarazione-imposte");
    expect(p?.descrizione).toContain(`perdite dei ${regoleDichiarazione.perditeEserciziPrecedenti.valore} esercizi`);
    expect(p?.cosaFare.join(" ")).toContain(ufficiPercorso.tassazioneTicino.valore.nome);
    expect(p?.verificatoIl).toBe(VERIFICATO_DICHIARAZIONE);
  });
});
