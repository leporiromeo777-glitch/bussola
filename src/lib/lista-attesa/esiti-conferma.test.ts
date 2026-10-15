import { afterEach, describe, expect, it, vi } from "vitest";
import { ESITI_CONFERMA, confermaIscrizione, leggiEsito } from "./esiti-conferma";
import type { ArchivioListaAttesa, EsitoConferma } from "./iscrizione";

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

describe("confermaIscrizione (pulsante della pagina di conferma)", () => {
  const TOKEN = "3f2b8c1e-7a4d-4f6b-9c2e-1d5a6b7c8d9e";

  function archivio(esito: EsitoConferma | Error) {
    const conferma = vi.fn<ArchivioListaAttesa["conferma"]>(async () => {
      if (esito instanceof Error) throw esito;
      return esito;
    });
    const finto: ArchivioListaAttesa = {
      inserisci: async () => ({ tipo: "nuova", token: TOKEN }),
      segnaInvio: async () => {},
      conferma,
      trova: async () => null,
      cancella: async () => false,
    };
    return { finto, conferma };
  }

  afterEach(() => vi.restoreAllMocks());

  it("conferma con il token in minuscolo e passa l'esito alla pagina", async () => {
    const { finto, conferma } = archivio("confermata");
    expect(await confermaIscrizione(` ${TOKEN.toUpperCase()} `, finto)).toBe("confermata");
    expect(conferma).toHaveBeenCalledWith(TOKEN);
    expect(await confermaIscrizione(TOKEN, archivio("gia_confermata").finto)).toBe("gia_confermata");
  });

  it("un token sconosciuto o malformato è un link non valido, senza toccare il database", async () => {
    expect(await confermaIscrizione(TOKEN, archivio("non_trovata").finto)).toBe("link_non_valido");
    const { finto, conferma } = archivio("confermata");
    for (const v of [null, "", "abc", "' or 1=1 --"]) expect(await confermaIscrizione(v, finto)).toBe("link_non_valido");
    expect(conferma).not.toHaveBeenCalled();
  });

  it("in modalità demo e con il database guasto lo dice", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await confermaIscrizione(TOKEN, null)).toBe("demo");
    expect(await confermaIscrizione(TOKEN, archivio(new Error("giù")).finto)).toBe("errore");
  });
});
