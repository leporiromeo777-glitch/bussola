import { describe, expect, it } from "vitest";
import { VERSIONE_RISPOSTE, type Risposte } from "./risposte";
import { ACCOUNT_VUOTO, scegliRisposte, type DatiAccount } from "./sincronizza";

const base: Risposte = {
  versione: VERSIONE_RISPOSTE,
  attivita: "digitale_creativo",
  cantone: "TI",
  soci: "solo",
  fatturato: "da_10k_a_60k",
  clienti: "molti",
  impiego: "no",
  avviata: "no",
  permesso: "svizzero_c",
  locali: "no",
  venditaOnline: "no",
};
const diverse: Risposte = { ...base, fatturato: "almeno_100k" };

function account(risposte: Risposte | null, aggiornatoIl: string | null = "2026-10-15T10:00:00Z"): DatiAccount {
  return { collegato: true, risposte, aggiornatoIl: risposte ? aggiornatoIl : null, passiFatti: [] };
}

describe("scegliRisposte", () => {
  it("senza accesso: le risposte del browser, mai da caricare", () => {
    expect(scegliRisposte(ACCOUNT_VUOTO, null)).toEqual({ risposte: null, origine: null, daCaricare: false });
    expect(scegliRisposte(ACCOUNT_VUOTO, { risposte: base, aggiornatoIl: "2026-10-15T10:00:00Z" })).toEqual({
      risposte: base,
      origine: "browser",
      daCaricare: false,
    });
  });

  it("con accesso e account vuoto: carica le risposte del browser", () => {
    expect(scegliRisposte(account(null), { risposte: base, aggiornatoIl: "2026-10-15T10:00:00Z" })).toEqual({
      risposte: base,
      origine: "browser",
      daCaricare: true,
    });
  });

  it("con accesso e browser vuoto: le risposte dell'account", () => {
    expect(scegliRisposte(account(base), null)).toEqual({ risposte: base, origine: "account", daCaricare: false });
  });

  it("risposte uguali: account, niente da caricare", () => {
    expect(scegliRisposte(account(base), { risposte: { ...base }, aggiornatoIl: "2030-01-01T00:00:00Z" })).toEqual({
      risposte: base,
      origine: "account",
      daCaricare: false,
    });
  });

  it("risposte diverse: vince la più recente", () => {
    expect(
      scegliRisposte(account(base, "2026-10-15T10:00:00Z"), {
        risposte: diverse,
        aggiornatoIl: "2026-10-15T11:00:00Z",
      }),
    ).toEqual({ risposte: diverse, origine: "browser", daCaricare: true });
    expect(
      scegliRisposte(account(base, "2026-10-15T12:00:00Z"), {
        risposte: diverse,
        aggiornatoIl: "2026-10-15T11:00:00Z",
      }),
    ).toEqual({ risposte: base, origine: "account", daCaricare: false });
  });

  it("data dell'account mancante o illeggibile: vince il browser", () => {
    expect(
      scegliRisposte(account(base, null), { risposte: diverse, aggiornatoIl: "2026-10-15T11:00:00Z" }).origine,
    ).toBe("browser");
    expect(
      scegliRisposte(account(base, "boh"), { risposte: diverse, aggiornatoIl: "2026-10-15T11:00:00Z" }).origine,
    ).toBe("browser");
  });

  it("il testo libero diverso conta come risposta diversa", () => {
    const a: Risposte = { ...base, attivita: "altro", attivitaAltro: "uno" };
    const b: Risposte = { ...base, attivita: "altro", attivitaAltro: "due" };
    expect(
      scegliRisposte(account(a, "2026-10-15T10:00:00Z"), { risposte: b, aggiornatoIl: "2026-10-15T11:00:00Z" })
        .risposte,
    ).toEqual(b);
  });
});
