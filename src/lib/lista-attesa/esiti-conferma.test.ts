import { describe, expect, it } from "vitest";
import { ESITI_CONFERMA, leggiEsito } from "./esiti-conferma";

describe("leggiEsito", () => {
  it("riconosce gli esiti previsti", () => {
    for (const esito of ESITI_CONFERMA) expect(leggiEsito(esito)).toBe(esito);
  });

  it("tratta valori mancanti o inventati come link non valido", () => {
    for (const v of [undefined, "", "CONFERMATA", "<script>", ["confermata"]]) {
      expect(leggiEsito(v)).toBe("link_non_valido");
    }
  });
});
