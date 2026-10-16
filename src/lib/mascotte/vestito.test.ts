import { describe, expect, it } from "vitest";
import { analizzaVestito, descriviVestito, VESTITO_PREDEFINITO } from "./vestito";

describe("analizzaVestito", () => {
  it("senza dati o con dati rotti usa il vestito predefinito", () => {
    expect(analizzaVestito(null)).toEqual(VESTITO_PREDEFINITO);
    expect(analizzaVestito("non json")).toEqual(VESTITO_PREDEFINITO);
    expect(analizzaVestito("42")).toEqual(VESTITO_PREDEFINITO);
  });

  it("tiene i valori conosciuti e scarta gli altri uno per uno", () => {
    expect(analizzaVestito(JSON.stringify({ cappello: "berretto-blu", occhiali: "sole", sciarpa: "beige" }))).toEqual({
      cappello: "berretto-blu",
      occhiali: "sole",
      sciarpa: "beige",
    });
    expect(analizzaVestito(JSON.stringify({ cappello: "corona", occhiali: "vista", sciarpa: "toString" }))).toEqual({
      cappello: "nessuno",
      occhiali: "vista",
      sciarpa: "nessuna",
    });
  });
});

describe("descriviVestito", () => {
  it("descrive gli accessori in italiano", () => {
    expect(descriviVestito(VESTITO_PREDEFINITO)).toBe("senza accessori");
    expect(descriviVestito({ cappello: "pescatore", occhiali: "nessuno", sciarpa: "nessuna" })).toBe(
      "con cappello da pescatore",
    );
    expect(descriviVestito({ cappello: "berretto-blu", occhiali: "sole", sciarpa: "beige" })).toBe(
      "con berretto blu, occhiali da sole e sciarpa beige",
    );
  });
});
