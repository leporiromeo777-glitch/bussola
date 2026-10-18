import { describe, expect, it } from "vitest";
import { aggiornamentoVoce, clienteDaRiga, colonneCliente, rigaNuovaVoce, rigaNuovoCliente, voceDaRiga } from "./righe";

const UTENTE = "11111111-1111-1111-1111-111111111111";

describe("righe di clienti e ore", () => {
  it("dal database ai tipi delle API: centesimi in franchi, date senza ora", () => {
    expect(
      clienteDaRiga({
        id: "c",
        nome: "Rossi SA",
        via: "",
        numero: "",
        npa: "6900",
        localita: "Lugano",
        paese: "CH",
        email: null,
        tariffa_centesimi: "9250",
      }),
    ).toMatchObject({ tariffa: 92.5, email: null });
    expect(
      voceDaRiga({
        id: "v",
        cliente_id: "c",
        data: "2026-10-19T00:00:00",
        minuti: 90,
        descrizione: "",
        tariffa_centesimi: null,
        fatturata_il: "2026-10-31",
      }),
    ).toEqual({ id: "v", clienteId: "c", data: "2026-10-19", minuti: 90, descrizione: "", tariffa: null, fatturataIl: "2026-10-31" });
  });

  it("dalle API al database: franchi in centesimi, solo i campi presenti", () => {
    expect(colonneCliente({ tariffa: 92.5 })).toEqual({ tariffa_centesimi: 9250 });
    expect(colonneCliente({ email: null, tariffa: null })).toEqual({ email: null, tariffa_centesimi: null });
    expect(
      rigaNuovoCliente(UTENTE, {
        nome: "Rossi",
        via: "Via Nassa",
        numero: "5",
        npa: "6900",
        localita: "Lugano",
        paese: "CH",
        email: null,
        tariffa: 120,
      }),
    ).toEqual({
      user_id: UTENTE,
      nome: "Rossi",
      via: "Via Nassa",
      numero: "5",
      npa: "6900",
      localita: "Lugano",
      paese: "CH",
      email: null,
      tariffa_centesimi: 12000,
    });
    expect(rigaNuovaVoce(UTENTE, { clienteId: "c", data: "2026-10-19", minuti: 30, descrizione: "", tariffa: 0.1 })).toEqual({
      user_id: UTENTE,
      cliente_id: "c",
      data: "2026-10-19",
      minuti: 30,
      descrizione: "",
      tariffa_centesimi: 10,
    });
    expect(aggiornamentoVoce({ fatturataIl: null }, "adesso")).toEqual({ aggiornato_il: "adesso", fatturata_il: null });
    expect(aggiornamentoVoce({ minuti: 45, tariffa: null }, "adesso")).toEqual({
      aggiornato_il: "adesso",
      minuti: 45,
      tariffa_centesimi: null,
    });
  });
});
