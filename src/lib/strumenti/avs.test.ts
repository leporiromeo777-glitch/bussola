import { describe, expect, it } from "vitest";
import { tavoleScalari } from "@/data/avs-tavola-scalare";
import { avsIndipendenti } from "@/data/svizzera";
import {
  annoPredefinito,
  arrotondaRedditoAvs,
  contributoAvsAiIpg,
  descrizioneCaso,
  eAnnoAvs,
  fasciaPerReddito,
  puntiDiSalto,
  stimaContributi,
} from "./avs";
import { arrotonda } from "./numeri";

describe("contributi AVS/AI/IPG 2026", () => {
  it("esempio della ricerca: reddito AVS CHF 40'000 → 6,728% = CHF 2'691.20", () => {
    const r = contributoAvsAiIpg(40_000, 2026);
    expect(r.caso).toBe("scalare");
    expect(r.tasso).toBeCloseTo(0.06728, 10);
    expect(r.avsAiIpg).toBe(2691.2);
  });

  it("esempio completo Ticino 2026: totale circa CHF 3'145", () => {
    const s = stimaContributi(40_000, 2026);
    expect(s.avsAiIpg).toBe(2691.2);
    expect(s.speseAmministrative).toBe(53.82); // 2% di 2'691.20 ("circa CHF 54")
    expect(s.assegniFamiliari).toBe(340); // 0,85% di 40'000
    expect(s.assegnoIntegrativo).toBe(60); // 0,15% di 40'000
    expect(s.supplementiTicino).toBe(453.82);
    expect(s.totale).toBe(3145.02);
    expect(Math.round(s.totale)).toBe(3145);
  });

  it("sotto CHF 10'100 si paga il contributo minimo di CHF 530", () => {
    for (const reddito of [0, 1, 5_000, 10_099.99]) {
      const r = contributoAvsAiIpg(reddito, 2026);
      expect(r.caso).toBe("minimo");
      expect(r.avsAiIpg).toBe(530);
    }
  });

  it("un reddito negativo (perdita) conta come zero: contributo minimo", () => {
    const s = stimaContributi(-8_000, 2026);
    expect(s.redditoAvs).toBe(0);
    expect(s.avsAiIpg).toBe(530);
    expect(s.speseAmministrative).toBe(10.6);
    expect(s.assegniFamiliari).toBe(0);
    expect(s.assegnoIntegrativo).toBe(0);
    expect(s.totale).toBe(540.6);
    expect(s.tassoEffettivo).toBeNull();
  });

  it("i limiti delle fasce: 'di almeno' compreso, 'inferiore a' escluso", () => {
    expect(contributoAvsAiIpg(10_100, 2026).tasso).toBeCloseTo(0.05371, 10);
    expect(contributoAvsAiIpg(17_599.99, 2026).tasso).toBeCloseTo(0.05371, 10);
    expect(contributoAvsAiIpg(17_600, 2026).tasso).toBeCloseTo(0.05494, 10);
    expect(contributoAvsAiIpg(40_499, 2026).tasso).toBeCloseTo(0.06728, 10);
    expect(contributoAvsAiIpg(40_500, 2026).tasso).toBeCloseTo(0.06976, 10);
    expect(contributoAvsAiIpg(60_499.99, 2026).tasso).toBeCloseTo(0.09321, 10);
  });

  it("da CHF 60'500 il tasso è del 10%", () => {
    const r = contributoAvsAiIpg(60_500, 2026);
    expect(r.caso).toBe("massimo");
    expect(r.avsAiIpg).toBe(6050);
    expect(contributoAvsAiIpg(120_000, 2026).avsAiIpg).toBe(12_000);
  });

  it("ogni fascia della tavola dà il suo tasso esatto", () => {
    for (const f of tavoleScalari[2026].fasce) {
      const r = contributoAvsAiIpg(f.da, 2026);
      expect(r.fascia).toEqual(f);
      expect(r.avsAiIpg).toBe(arrotonda((f.da * f.tassoPercento) / 100, 2));
    }
  });

  it("il reddito si arrotonda ai 100 franchi inferiori (art. 8 cpv. 1 LAVS)", () => {
    expect(arrotondaRedditoAvs(60_499)).toBe(60_400);
    expect(arrotondaRedditoAvs(60_400)).toBe(60_400);
    expect(arrotondaRedditoAvs(60_399.999999)).toBe(60_400);
    expect(arrotondaRedditoAvs(99.99)).toBe(0);
    expect(arrotondaRedditoAvs(-5)).toBe(0);

    const s = stimaContributi(60_499, 2026);
    expect(s.redditoAvs).toBe(60_400);
    expect(s.avsAiIpg).toBe(5629.88); // 60'400 × 9,321%
    expect(s.speseAmministrative).toBe(112.6);
    expect(s.assegniFamiliari).toBe(513.4);
    expect(s.assegnoIntegrativo).toBe(90.6);
    expect(s.totale).toBe(6346.48);
    expect(s.tassoEffettivo).toBeCloseTo(6346.48 / 60_400, 10);

    expect(stimaContributi(17_699, 2026).avsAiIpg).toBe(966.94); // 17'600 × 5,494%
    expect(stimaContributi(60_599, 2026)).toMatchObject({ caso: "massimo", redditoAvs: 60_500, avsAiIpg: 6050 });
    expect(stimaContributi(52_964, 2026).redditoAvs).toBe(52_900);
  });

  it("gli assegni familiari si fermano al guadagno massimo di CHF 148'200", () => {
    const s = stimaContributi(200_000, 2026);
    expect(s.assegniFamiliari).toBe(1259.7); // 0,85% di 148'200
    expect(s.assegnoIntegrativo).toBe(300); // 0,15% di 200'000, senza tetto
    expect(s.avsAiIpg).toBe(20_000);
    expect(s.speseAmministrative).toBe(400);
  });
});

describe("attività accessoria", () => {
  it("fino a CHF 2'500 i contributi si pagano solo su richiesta", () => {
    const s = stimaContributi(2_500, 2026, "accessoria");
    expect(s.caso).toBe("suRichiesta");
    expect(s.totale).toBe(0);
  });

  it("sopra CHF 2'500 e sotto il limite inferiore: tasso più basso invece del minimo", () => {
    const s = stimaContributi(5_000, 2026, "accessoria");
    expect(s.caso).toBe("tassoMinimoAccessoria");
    expect(s.avsAiIpg).toBe(268.55); // 5'000 × 5,371%
  });

  it("dal limite inferiore in su vale la tavola normale", () => {
    expect(stimaContributi(40_000, 2026, "accessoria").avsAiIpg).toBe(2691.2);
  });
});

describe("contributi 2027 (testo provvisorio)", () => {
  const p = avsIndipendenti[2027].valore;
  it("contributo minimo CHF 541 sotto CHF 10'300", () => {
    expect(contributoAvsAiIpg(10_299, 2027)).toMatchObject({ caso: "minimo", avsAiIpg: 541 });
    expect(p.contributoMinimo).toBe(541);
  });
  it("le fasce si spostano: CHF 40'000 è nella fascia 39'000–41'500", () => {
    const r = contributoAvsAiIpg(40_000, 2027);
    expect(r.fascia).toMatchObject({ da: 39_000, a: 41_500, tassoPercento: 6.728 });
    expect(r.avsAiIpg).toBe(2691.2);
  });
  it("da CHF 61'500 il 10%", () => {
    expect(contributoAvsAiIpg(61_499, 2027).caso).toBe("scalare");
    expect(contributoAvsAiIpg(61_500, 2027)).toMatchObject({ caso: "massimo", avsAiIpg: 6150 });
  });
});

describe("utilità", () => {
  it("fasciaPerReddito fuori tavola", () => {
    expect(fasciaPerReddito(5_000, 2026)).toBeNull();
    expect(fasciaPerReddito(60_500, 2026)).toBeNull();
  });

  it("puntiDiSalto contiene limiti e tetto AF, ordinati", () => {
    const punti = puntiDiSalto(2026);
    expect(punti[0]).toBe(10_100);
    expect(punti).toContain(60_500);
    expect(punti).toContain(148_200);
    expect([...punti].sort((a, b) => a - b)).toEqual(punti);
    expect(puntiDiSalto(2026, "accessoria")).toContain(2_500.01);
  });

  it("annoPredefinito", () => {
    expect(annoPredefinito("2026-10-15")).toBe(2027);
    expect(annoPredefinito("2026-03-01")).toBe(2026);
    expect(annoPredefinito("2025-05-01")).toBe(2026);
    expect(annoPredefinito("2030-05-01")).toBe(2027);
    expect(eAnnoAvs(2026)).toBe(true);
    expect(eAnnoAvs(2025)).toBe(false);
  });

  it("descrizioneCaso in formato svizzero", () => {
    expect(descrizioneCaso(stimaContributi(5_000, 2026))).toContain("CHF 10'100");
    expect(descrizioneCaso(stimaContributi(5_000, 2026))).toContain("CHF 530");
    expect(descrizioneCaso(stimaContributi(80_000, 2026))).toContain("CHF 60'500");
  });
});
