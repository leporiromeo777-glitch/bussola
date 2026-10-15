import { describe, expect, it } from "vitest";
import { normalizzaProvenienza, provenienzaDaParametri, provenienzaDaUrl } from "./provenienza";

describe("normalizzaProvenienza", () => {
  it("restituisce null per valori vuoti o non testuali", () => {
    for (const v of [undefined, null, "", "   ", 3, {}]) expect(normalizzaProvenienza(v)).toBeNull();
  });

  it("toglie caratteri di controllo e spazi doppi", () => {
    expect(normalizzaProvenienza("  insta\u0000gram \n story ")).toBe("insta gram story");
  });

  it("taglia a 60 caratteri senza spezzare le emoji", () => {
    expect(normalizzaProvenienza("a".repeat(80))).toHaveLength(60);
    const conEmoji = normalizzaProvenienza("🧭".repeat(70)) ?? "";
    expect(Array.from(conEmoji)).toHaveLength(60);
    expect(conEmoji).toBe("🧭".repeat(60));
  });
});

describe("provenienzaDaParametri", () => {
  it("preferisce utm_source a ref", () => {
    expect(provenienzaDaParametri(new URLSearchParams("ref=amico&utm_source=instagram"))).toBe("instagram");
  });

  it("usa ref se manca utm_source", () => {
    expect(provenienzaDaParametri(new URLSearchParams("ref=volantino-usi"))).toBe("volantino-usi");
  });

  it("restituisce null senza parametri utili", () => {
    expect(provenienzaDaParametri(new URLSearchParams("utm_source=&x=1"))).toBeNull();
  });
});

describe("provenienzaDaUrl", () => {
  it("legge i parametri da un URL completo (es. Referer)", () => {
    expect(provenienzaDaUrl("https://bussola.example/?utm_source=tiktok#lista-attesa")).toBe("tiktok");
  });

  it("restituisce null per URL mancanti o non validi", () => {
    expect(provenienzaDaUrl(null)).toBeNull();
    expect(provenienzaDaUrl("non è un url")).toBeNull();
  });
});
