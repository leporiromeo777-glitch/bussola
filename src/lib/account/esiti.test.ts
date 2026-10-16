import { describe, expect, it } from "vitest";
import { MESSAGGI_ACCOUNT, rispostaEliminazione } from "./esiti";

describe("rispostaEliminazione", () => {
  it("account eliminato: 204 senza corpo", () => {
    expect(rispostaEliminazione({ ok: true })).toEqual({ status: 204 });
  });

  it("senza accesso 401, in modalità demo 503, errore 500", () => {
    expect(rispostaEliminazione({ ok: false, motivo: "non_collegato" })).toEqual({
      status: 401,
      messaggio: MESSAGGI_ACCOUNT.nonCollegato,
    });
    expect(rispostaEliminazione({ ok: false, motivo: "non_configurato" })).toEqual({
      status: 503,
      messaggio: MESSAGGI_ACCOUNT.nonConfigurato,
    });
    expect(rispostaEliminazione({ ok: false, motivo: "errore" })).toEqual({
      status: 500,
      messaggio: MESSAGGI_ACCOUNT.errore,
    });
  });
});
