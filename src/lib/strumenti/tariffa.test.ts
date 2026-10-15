import { describe, expect, it } from "vitest";
import { stimaContributi } from "./avs";
import { arrotonda } from "./numeri";
import { calcolaTariffa, datiTariffaIniziali, schemaDatiTariffa, type DatiTariffa } from "./tariffa";

function dati(modifiche: Partial<DatiTariffa> = {}): DatiTariffa {
  return { ...datiTariffaIniziali("2026-03-01"), anno: 2026, ...modifiche };
}

function ok(d: DatiTariffa) {
  const esito = calcolaTariffa(d);
  if (!esito.ok) throw new Error(JSON.stringify(esito.errori));
  return esito.risultato;
}

const netto = (utile: number, anno: 2026 | 2027 = 2026, situazione: "principale" | "accessoria" = "principale") =>
  arrotonda(utile - stimaContributi(utile, anno, situazione).totale);

describe("calcolaTariffa", () => {
  it("valori di esempio: CHF 48'000 netti, 45 settimane da 25 ore", () => {
    const r = ok(dati());
    // Nella fascia 50'500–53'000 (8,209%): netto = U × (1 − 0,08209 × 1,02 − 0,0085 − 0,0015).
    const fattore = 1 - 0.08209 * 1.02 - 0.0085 - 0.0015;
    expect(r.utilePrimaDeiContributi).toBeCloseTo(48_000 / fattore, 1);
    expect(r.contributi.fascia).toMatchObject({ da: 50_500, a: 53_000 });
    expect(netto(r.utilePrimaDeiContributi)).toBeGreaterThanOrEqual(48_000);
    expect(r.settimaneLavorative).toBe(45);
    expect(r.oreFatturabiliAnno).toBe(1125);
    expect(r.fatturato).toBe(r.utilePrimaDeiContributi); // costi a zero
    expect(r.tariffaOraria).toBeCloseTo(r.fatturato / 1125, 2);
    expect(r.tariffaOrariaArrotondata).toBe(48);
    expect(r.tariffaGiornaliera).toBe(Math.ceil((r.fatturato / 1125) * 8));
    expect(r.avvisi).toEqual([]);
  });

  it("trova il più piccolo utile anche quando il netto cala all'inizio di una fascia", () => {
    // A CHF 53'000 il tasso passa da 8,209% a 8,58%: il netto scende sotto i 48'000.
    expect(netto(52_999.99)).toBeGreaterThan(48_000);
    expect(netto(53_000)).toBeLessThan(48_000);
    const r = ok(dati({ redditoDesiderato: "48000" }));
    expect(r.utilePrimaDeiContributi).toBeLessThan(53_000);
  });

  it.each([0, 500, 9_000, 20_000, 37_700, 37_800, 54_000, 90_000, 140_000, 250_000])(
    "per un reddito di CHF %i l'utile trovato è il minimo",
    (reddito) => {
      const r = ok(dati({ redditoDesiderato: String(reddito) }));
      const u = r.utilePrimaDeiContributi;
      expect(netto(u)).toBeGreaterThanOrEqual(reddito);
      expect(netto(u - 0.01)).toBeLessThan(reddito);
      // Nessun utile più basso (controllo a passi di CHF 25) raggiunge l'obiettivo.
      for (let x = 0; x < u - 0.01; x += 25) expect(netto(x)).toBeLessThan(reddito);
    },
  );

  it("reddito zero: serve comunque coprire il contributo minimo", () => {
    const r = ok(dati({ redditoDesiderato: "0" }));
    // U − 530 − 10.60 − 1% di U = 0  →  U = 540.60 / 0,99
    expect(r.utilePrimaDeiContributi).toBeCloseTo(540.6 / 0.99, 1);
    expect(r.contributi.caso).toBe("minimo");
  });

  it("attività accessoria sotto CHF 2'500: nessun contributo", () => {
    const r = ok(dati({ situazione: "accessoria", redditoDesiderato: "2000" }));
    expect(r.utilePrimaDeiContributi).toBe(2000);
    expect(r.contributi.totale).toBe(0);
  });

  it("riserva per le imposte: percentuale dell'utile dopo i contributi", () => {
    const r = ok(dati({ redditoDesiderato: "40'000", riservaImpostePercento: "20" }));
    expect(r.utileDopoContributi).toBe(50_000);
    expect(r.riservaImposte).toBe(10_000);
    expect(netto(r.utilePrimaDeiContributi)).toBeGreaterThanOrEqual(50_000);
  });

  it("pilastro 3a e costi fissi entrano nel fatturato", () => {
    const r = ok(
      dati({
        redditoDesiderato: "40000",
        pilastro3a: "3'000",
        costiFissi: { ...dati().costiFissi, locali: "6'000", software: "1'200", altro: "800" },
      }),
    );
    expect(r.costiFissi).toBe(8_000);
    expect(r.utileDopoContributi).toBe(43_000);
    expect(r.fatturato).toBeCloseTo(r.utilePrimaDeiContributi + 8_000, 2);
    // Ripartizione: costi + contributi + riserva + 3a + reddito = fatturato.
    const somma = r.costiFissi + r.contributi.totale + r.riservaImposte + r.pilastro3a + r.reddito;
    expect(r.fatturato - somma).toBeGreaterThanOrEqual(0);
    expect(r.fatturato - somma).toBeLessThan(0.05);
  });

  it("avvisa da CHF 100'000 di fatturato (IVA e registro di commercio)", () => {
    const r = ok(dati({ redditoDesiderato: "85'000", costiFissi: { ...dati().costiFissi, locali: "12000" } }));
    expect(r.fatturato).toBeGreaterThanOrEqual(100_000);
    const avviso = r.avvisi.find((a) => a.id === "soglia-iva-registro");
    expect(avviso).toBeDefined();
    expect(avviso!.testo).toContain("CHF 100'000");
    expect(avviso!.fonti.map((f) => f.url).join(" ")).toContain("fedlex.admin.ch");
  });

  it("avvisa se il 3a supera il massimo dell'anno", () => {
    const r = ok(dati({ pilastro3a: "40000", redditoDesiderato: "100000" }));
    expect(r.avvisi.some((a) => a.id === "pilastro-3a-massimo")).toBe(true);
  });

  it("anno 2027 con le fasce spostate", () => {
    const r = ok(dati({ anno: 2027 }));
    expect(r.anno).toBe(2027);
    expect(netto(r.utilePrimaDeiContributi, 2027)).toBeGreaterThanOrEqual(48_000);
  });

  it("segnala i campi sbagliati", () => {
    const esito = calcolaTariffa(
      dati({ redditoDesiderato: "", oreFatturabiliSettimana: "0", riservaImpostePercento: "120", pilastro3a: "abc" }),
    );
    expect(esito.ok).toBe(false);
    if (esito.ok) return;
    expect(Object.keys(esito.errori).sort()).toEqual(
      ["oreFatturabiliSettimana", "pilastro3a", "redditoDesiderato", "riservaImpostePercento"].sort(),
    );
  });

  it("segnala quando vacanze e assenze occupano tutto l'anno", () => {
    const esito = calcolaTariffa(dati({ settimaneVacanza: "40", giorniAssenza: "60" }));
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errori.giorniAssenza).toBeDefined();
  });

  it("segnala costi negativi", () => {
    const esito = calcolaTariffa(dati({ costiFissi: { ...dati().costiFissi, veicolo: "-100" } }));
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.errori["costiFissi.veicolo"]).toBeDefined();
  });
});

describe("schemaDatiTariffa", () => {
  it("accetta i dati salvati e ripara quelli rovinati", () => {
    const buoni = dati();
    expect(schemaDatiTariffa.parse(buoni)).toEqual(buoni);
    const rovinati = schemaDatiTariffa.parse({ ...buoni, anno: 1999, situazione: "boh", costiFissi: 3 });
    expect(rovinati.anno).toBe(2027);
    expect(rovinati.situazione).toBe("principale");
    expect(rovinati.costiFissi.locali).toBe("");
  });
});
