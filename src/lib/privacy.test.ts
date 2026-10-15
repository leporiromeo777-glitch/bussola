import { describe, expect, it } from "vitest";
import { luogoDatabase } from "./privacy";

describe("luogoDatabase", () => {
  it("indica la Svizzera per la regione di Zurigo", () => {
    expect(luogoDatabase("svizzera")).toBe("in Svizzera (Zurigo)");
    expect(luogoDatabase(" Svizzera ")).toBe("in Svizzera (Zurigo)");
  });

  it("indica l'Unione europea per la regione di Francoforte", () => {
    expect(luogoDatabase("ue")).toBe("nell'Unione europea (Francoforte, Germania)");
  });

  it("senza un valore valido lascia la parte da completare", () => {
    for (const valore of [undefined, "", "zurigo"]) {
      expect(luogoDatabase(valore)).toContain("[da indicare prima del lancio]");
    }
  });
});
