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

const UTENTE = "utente-a";
const ALTRO = "utente-b";

function account(risposte: Risposte | null, aggiornatoIl: string | null = "2026-10-15T10:00:00Z"): DatiAccount {
  return {
    collegato: true,
    userId: UTENTE,
    email: "a@example.ch",
    risposte,
    aggiornatoIl: risposte ? aggiornatoIl : null,
    passiFatti: [],
  };
}

const nelBrowser = (risposte: Risposte, aggiornatoIl = "2026-10-15T10:00:00Z") => ({ risposte, aggiornatoIl });

describe("scegliRisposte", () => {
  it("senza accesso: le risposte del browser, mai da caricare", () => {
    expect(scegliRisposte(ACCOUNT_VUOTO, null)).toEqual({
      risposte: null,
      origine: null,
      daCaricare: false,
      daConfermare: false,
      datiDiAltri: false,
    });
    expect(scegliRisposte(ACCOUNT_VUOTO, nelBrowser(base))).toEqual({
      risposte: base,
      origine: "browser",
      daCaricare: false,
      daConfermare: false,
      datiDiAltri: false,
    });
    // Anche se la copia è di un account: senza accesso non si carica nulla.
    expect(scegliRisposte(ACCOUNT_VUOTO, nelBrowser(base), UTENTE).daCaricare).toBe(false);
  });

  it("account vuoto e risposte del browser fatte senza accesso: da caricare solo dopo il sì", () => {
    expect(scegliRisposte(account(null), nelBrowser(base))).toEqual({
      risposte: base,
      origine: "browser",
      daCaricare: true,
      daConfermare: true,
      datiDiAltri: false,
    });
  });

  it("account vuoto e copia dello stesso account: si carica senza chiedere", () => {
    expect(scegliRisposte(account(null), nelBrowser(base), UTENTE)).toEqual({
      risposte: base,
      origine: "browser",
      daCaricare: true,
      daConfermare: false,
      datiDiAltri: false,
    });
  });

  it("copia di un altro account (computer condiviso, login CSRF): non si mostra e non si carica", () => {
    expect(scegliRisposte(account(null), nelBrowser(base), ALTRO)).toEqual({
      risposte: null,
      origine: null,
      daCaricare: false,
      daConfermare: false,
      datiDiAltri: true,
    });
    // Anche se è più recente di quella dell'account.
    expect(
      scegliRisposte(account(base, "2026-10-15T10:00:00Z"), nelBrowser(diverse, "2030-01-01T00:00:00Z"), ALTRO),
    ).toEqual({ risposte: base, origine: "account", daCaricare: false, daConfermare: false, datiDiAltri: true });
  });

  it("con accesso e browser vuoto: le risposte dell'account", () => {
    expect(scegliRisposte(account(base), null)).toMatchObject({ risposte: base, origine: "account", daCaricare: false });
  });

  it("risposte uguali: account, niente da caricare né da confermare", () => {
    expect(scegliRisposte(account(base), nelBrowser({ ...base }, "2030-01-01T00:00:00Z"))).toMatchObject({
      risposte: base,
      origine: "account",
      daCaricare: false,
      daConfermare: false,
    });
  });

  it("risposte diverse: vince la più recente; se viene dal browser senza proprietario, serve il sì", () => {
    expect(
      scegliRisposte(account(base, "2026-10-15T10:00:00Z"), nelBrowser(diverse, "2026-10-15T11:00:00Z"), UTENTE),
    ).toMatchObject({ risposte: diverse, origine: "browser", daCaricare: true, daConfermare: false });
    expect(
      scegliRisposte(account(base, "2026-10-15T10:00:00Z"), nelBrowser(diverse, "2026-10-15T11:00:00Z")),
    ).toMatchObject({ risposte: diverse, origine: "browser", daCaricare: true, daConfermare: true });
    expect(
      scegliRisposte(account(base, "2026-10-15T12:00:00Z"), nelBrowser(diverse, "2026-10-15T11:00:00Z")),
    ).toMatchObject({ risposte: base, origine: "account", daCaricare: false, daConfermare: false });
  });

  it("data dell'account mancante o illeggibile: vince il browser", () => {
    expect(scegliRisposte(account(base, null), nelBrowser(diverse, "2026-10-15T11:00:00Z"), UTENTE).origine).toBe(
      "browser",
    );
    expect(scegliRisposte(account(base, "boh"), nelBrowser(diverse, "2026-10-15T11:00:00Z"), UTENTE).origine).toBe(
      "browser",
    );
  });

  it("il testo libero diverso conta come risposta diversa", () => {
    const a: Risposte = { ...base, attivita: "altro", attivitaAltro: "uno" };
    const b: Risposte = { ...base, attivita: "altro", attivitaAltro: "due" };
    expect(
      scegliRisposte(account(a, "2026-10-15T10:00:00Z"), nelBrowser(b, "2026-10-15T11:00:00Z"), UTENTE).risposte,
    ).toEqual(b);
  });
});
