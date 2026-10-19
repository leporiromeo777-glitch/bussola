import { describe, expect, it } from "vitest";
import { LEZIONI } from "@/data/corso";
import { FASI, PASSI } from "@/data/passi";
import { corsoPerFasi, riepilogoCorso } from "./elenco";

describe("corsoPerFasi", () => {
  it("mette tutti i passi in ordine, divisi per fase, con il numero della lezione", () => {
    const fasi = corsoPerFasi();
    const voci = fasi.flatMap((f) => f.voci);
    expect(voci.map((v) => v.passo.id)).toEqual(PASSI.map((p) => p.id));
    expect(voci.map((v) => v.numero)).toEqual(PASSI.map((_, i) => i + 1));
    expect(fasi.map((f) => f.fase)).toEqual(FASI.filter((fase) => PASSI.some((p) => p.fase === fase)));
    for (const f of fasi) {
      expect(f.titolo.length).toBeGreaterThan(0);
      for (const v of f.voci) expect(v.passo.fase).toBe(f.fase);
    }
  });

  it("ogni voce ha la lezione del suo passo, con lo stesso numero", () => {
    for (const v of corsoPerFasi().flatMap((f) => f.voci)) {
      const lezione = LEZIONI.find((l) => l.passoId === v.passo.id);
      expect(v.lezione).toBe(lezione);
      if (v.lezione) expect(v.lezione.numero).toBe(v.numero);
    }
  });

  it("segna come fatte solo le lezioni dei passi fatti", () => {
    const primo = PASSI[0].id;
    const ultimo = PASSI[PASSI.length - 1].id;
    const voci = corsoPerFasi(new Set([primo, ultimo, "passo-che-non-esiste"])).flatMap((f) => f.voci);
    expect(voci.filter((v) => v.fatto).map((v) => v.passo.id)).toEqual([primo, ultimo]);
    expect(corsoPerFasi().flatMap((f) => f.voci).some((v) => v.fatto)).toBe(false);
  });
});

describe("riepilogoCorso", () => {
  it("conta lezioni, video facoltativi e lezioni con il passo fatto", () => {
    const facoltativi = LEZIONI.reduce((n, l) => n + (l.approfondimenti?.length ?? 0), 0);
    expect(riepilogoCorso(corsoPerFasi())).toEqual({ lezioni: LEZIONI.length, videoFacoltativi: facoltativi, fatte: 0 });
    expect(riepilogoCorso(corsoPerFasi(new Set([LEZIONI[0].passoId]))).fatte).toBe(1);
    expect(riepilogoCorso([])).toEqual({ lezioni: 0, videoFacoltativi: 0, fatte: 0 });
  });
});
