import { describe, expect, it } from "vitest";
import { analizzaLook, datiLook, LOOK, lookDaVestito } from "./look";

describe("look di Bleo", () => {
  it("ogni look ha un id unico e un'immagine", () => {
    expect(new Set(LOOK.map((l) => l.id)).size).toBe(LOOK.length);
    for (const l of LOOK) expect(l.immagine).toBeTruthy();
  });

  it("legge il look salvato e scarta i valori sconosciuti", () => {
    expect(analizzaLook("inverno")).toBe("inverno");
    expect(analizzaLook("pigiama")).toBe("classico");
    expect(analizzaLook(null)).toBe("classico");
  });

  it("senza look usa il vecchio vestito", () => {
    const vecchio = JSON.stringify({ cappello: "nessuno", occhiali: "tondi", sciarpa: "nessuna" });
    expect(analizzaLook(null, vecchio)).toBe("occhiali-tondi");
    expect(lookDaVestito(JSON.stringify({ cappello: "berretto-blu", occhiali: "sole", sciarpa: "verde" }))).toBe("inverno");
    expect(lookDaVestito(JSON.stringify({ cappello: "nessuno", occhiali: "nessuno", sciarpa: "beige" }))).toBe("sciarpa-verde");
    expect(lookDaVestito("non json")).toBe("classico");
  });

  it("datiLook restituisce etichetta e immagine", () => {
    expect(datiLook("classico").immagine).toBe("coppia");
  });
});
