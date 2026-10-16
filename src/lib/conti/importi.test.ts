import { describe, expect, it } from "vitest";
import {
  categoriaPerTipo,
  chf2,
  daCentesimi,
  dataIsoValida,
  dataSvizzeraBreve,
  etichettaCategoria,
  haDueDecimali,
  inCentesimi,
  leggiAnno,
  oggiZurigo,
} from "./importi";
import { CATEGORIE } from "./tipi";

describe("centesimi e franchi", () => {
  it("converte senza errori di virgola mobile", () => {
    expect(inCentesimi(48.5)).toBe(4850);
    expect(inCentesimi(0.1 + 0.2)).toBe(30);
    expect(inCentesimi(1.005)).toBe(101);
    expect(inCentesimi(19.99)).toBe(1999);
    expect(inCentesimi(0)).toBe(0);
    expect(inCentesimi(1e-7)).toBe(0);
    expect(daCentesimi(4850)).toBe(48.5);
    expect(daCentesimi("123456")).toBe(1234.56);
    expect(daCentesimi(BigInt(100))).toBe(1);
  });

  it("andata e ritorno danno lo stesso importo", () => {
    for (const franchi of [0, 0.05, 1.1, 48.5, 999.99, 12345.67, 99_999_999.99]) {
      expect(daCentesimi(inCentesimi(franchi))).toBe(franchi);
    }
  });

  it("riconosce gli importi con più di due decimali", () => {
    expect(haDueDecimali(48.55)).toBe(true);
    expect(haDueDecimali(48.5)).toBe(true);
    expect(haDueDecimali(0.1 + 0.2)).toBe(true);
    expect(haDueDecimali(48.555)).toBe(false);
    expect(haDueDecimali(Number.NaN)).toBe(false);
  });

  it("rifiuta importi non finiti", () => {
    expect(() => inCentesimi(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("formatta alla svizzera", () => {
    expect(chf2(1234.5)).toBe("CHF 1'234.50");
    expect(chf2(20000)).toBe("CHF 20'000.00");
    expect(chf2(-5)).toBe("-CHF 5.00");
  });
});

describe("date", () => {
  it("accetta solo date AAAA-MM-GG esistenti", () => {
    expect(dataIsoValida("2026-10-19")).toBe(true);
    expect(dataIsoValida("2028-02-29")).toBe(true);
    expect(dataIsoValida("2026-02-29")).toBe(false);
    expect(dataIsoValida("2026-13-01")).toBe(false);
    expect(dataIsoValida("19.10.2026")).toBe(false);
    expect(dataIsoValida("2026-10-19T00:00:00Z")).toBe(false);
    expect(dataIsoValida(20261019)).toBe(false);
  });

  it("oggi è il giorno di Zurigo, anche quando a Londra è ancora ieri", () => {
    expect(oggiZurigo(new Date("2026-10-18T22:30:00Z"))).toBe("2026-10-19");
    expect(oggiZurigo(new Date("2026-01-01T12:00:00Z"))).toBe("2026-01-01");
  });

  it("scrive le date alla svizzera", () => {
    expect(dataSvizzeraBreve("2026-10-19")).toBe("19.10.2026");
  });

  it("legge l'anno del parametro", () => {
    expect(leggiAnno("2026")).toBe(2026);
    expect(leggiAnno("26")).toBeNull();
    expect(leggiAnno("2026a")).toBeNull();
    expect(leggiAnno("1999")).toBeNull();
    expect(leggiAnno(undefined)).toBeNull();
  });
});

describe("categorie", () => {
  it("tiene la categoria se va con il tipo, altrimenti «Altre …»", () => {
    expect(categoriaPerTipo("software", "uscita")).toBe("software");
    expect(categoriaPerTipo("software", "entrata")).toBe("altre_entrate");
    expect(categoriaPerTipo("vacanze", "uscita")).toBe("altre_uscite");
    expect(categoriaPerTipo(undefined, "entrata")).toBe("altre_entrate");
  });

  it("ogni categoria ha un'etichetta e gli id sono unici", () => {
    expect(new Set(CATEGORIE.map((c) => c.id)).size).toBe(CATEGORIE.length);
    for (const c of CATEGORIE) expect(etichettaCategoria(c.id)).toBe(c.etichetta);
  });
});
