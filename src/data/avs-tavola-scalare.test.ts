import { describe, expect, it } from "vitest";
import { anniTavola, parametriAnno, tavoleScalari } from "./avs-tavola-scalare";

describe("tavola scalare AVS/AI/IPG", () => {
  for (const anno of anniTavola) {
    const tavola = tavoleScalari[anno];
    const parametri = parametriAnno(anno).valore;

    describe(String(anno), () => {
      it("parte dal limite inferiore e arriva al limite superiore di svizzera.ts", () => {
        expect(tavola.fasce[0].da).toBe(parametri.limiteInferioreScala);
        expect(tavola.fasce.at(-1)?.a).toBe(parametri.limiteSuperioreScala);
      });

      it("ha 17 fasce contigue, senza buchi né sovrapposizioni", () => {
        expect(tavola.fasce).toHaveLength(17);
        for (let i = 1; i < tavola.fasce.length; i++) {
          expect(tavola.fasce[i].da).toBe(tavola.fasce[i - 1].a);
          expect(tavola.fasce[i].a).toBeGreaterThan(tavola.fasce[i].da);
        }
      });

      it("ha tassi crescenti, dal tasso minimo fino a meno del 10%", () => {
        expect(tavola.fasce[0].tassoPercento / 100).toBeCloseTo(parametri.tassoMinimoScala, 10);
        for (let i = 1; i < tavola.fasce.length; i++) {
          expect(tavola.fasce[i].tassoPercento).toBeGreaterThan(tavola.fasce[i - 1].tassoPercento);
        }
        expect(tavola.fasce.at(-1)!.tassoPercento / 100).toBeLessThan(parametri.tassoMassimo);
      });

      it("cita una fonte https e una data di controllo", () => {
        expect(tavola.fonte.url).toMatch(/^https:\/\//);
        expect(tavola.verificatoIl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  }

  it("2026: la fascia di CHF 40'000 ha il tasso 6,728% del promemoria 2.02", () => {
    const fascia = tavoleScalari[2026].fasce.find((f) => f.da <= 40_000 && 40_000 < f.a);
    expect(fascia).toEqual({ da: 38_000, a: 40_500, tassoPercento: 6.728 });
  });

  it("2027: ogni tasso è la somma AVS + AI + IPG delle ordinanze", () => {
    for (const f of tavoleScalari[2027].fasce) {
      expect(f.parti).toBeDefined();
      const somma = f.parti!.avs + f.parti!.ai + f.parti!.ipg;
      expect(f.tassoPercento).toBeCloseTo(somma, 9);
    }
    // Prima fascia: 4,35% AVS + 0,752% AI + 0,269% IPG = 5,371%.
    expect(tavoleScalari[2027].fasce[0].tassoPercento).toBe(5.371);
  });

  it("2027: i tassi per fascia sono gli stessi del 2026, cambiano solo i limiti", () => {
    const tassi2026 = tavoleScalari[2026].fasce.map((f) => f.tassoPercento);
    const tassi2027 = tavoleScalari[2027].fasce.map((f) => f.tassoPercento);
    expect(tassi2027).toEqual(tassi2026);
  });
});
