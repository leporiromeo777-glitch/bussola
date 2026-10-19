import { describe, expect, it } from "vitest";
import type { IdPasso } from "@/data/passi";
import { VERSIONE_RISPOSTE, type Risposte } from "./risposte";
import {
  ACCOUNT_VUOTO,
  analizzaInSospeso,
  cambiDellaCopia,
  conNuoveRisposte,
  conPassoCambiato,
  COPIA_VUOTA,
  pianoAllineamento,
  scegliRisposte,
  serializzaInSospeso,
  soloPassiDaSalvare,
  type CopiaLocale,
  type DatiAccount,
} from "./sincronizza";

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

describe("scegliRisposte con i passi fatti nel browser", () => {
  const conPassi = (passiFatti: IdPasso[]): DatiAccount => ({ ...account(base), passiFatti });

  it("risposte uguali e passi fatti senza accesso che l'account non ha: da caricare dopo il sì", () => {
    expect(scegliRisposte(conPassi(["riconoscimento-avs"]), nelBrowser(base), null, ["riconoscimento-avs", "nome-ditta"])).toEqual({
      risposte: base,
      origine: "browser",
      daCaricare: true,
      daConfermare: true,
      datiDiAltri: false,
    });
    expect(soloPassiDaSalvare(conPassi([]), nelBrowser(base))).toBe(true);
  });

  it("passi già tutti nell'account, o copia di questo account: come prima", () => {
    expect(scegliRisposte(conPassi(["riconoscimento-avs"]), nelBrowser(base), null, ["riconoscimento-avs"])).toMatchObject({
      origine: "account",
      daCaricare: false,
    });
    expect(scegliRisposte(conPassi([]), nelBrowser(base), UTENTE, ["riconoscimento-avs"])).toMatchObject({
      origine: "account",
      daCaricare: false,
    });
  });

  it("account più recente con risposte diverse: vince l'account anche con passi nel browser (come sul sito)", () => {
    expect(
      scegliRisposte(account(base, "2026-10-15T12:00:00Z"), nelBrowser(diverse, "2026-10-15T11:00:00Z"), null, [
        "riconoscimento-avs",
      ]),
    ).toMatchObject({ risposte: base, origine: "account", daCaricare: false, daConfermare: false });
    expect(soloPassiDaSalvare(account(base), nelBrowser(diverse))).toBe(false);
  });
});

describe("modifiche in sospeso", () => {
  it("si leggono solo con un utente e passi conosciuti, e si salvano solo se ce ne sono", () => {
    const testo = serializzaInSospeso({ utente: UTENTE, passi: { "riconoscimento-avs": true, "nome-ditta": false } });
    expect(analizzaInSospeso(testo)).toEqual({ utente: UTENTE, passi: { "riconoscimento-avs": true, "nome-ditta": false } });
    expect(analizzaInSospeso(JSON.stringify({ utente: UTENTE, passi: { inventato: true, "riconoscimento-avs": "si" } }))).toBeNull();
    expect(analizzaInSospeso(JSON.stringify({ utente: "", passi: { "riconoscimento-avs": true } }))).toBeNull();
    expect(analizzaInSospeso("{rotto")).toBeNull();
    expect(analizzaInSospeso(null)).toBeNull();
    expect(serializzaInSospeso({ utente: UTENTE, passi: {} })).toBeNull();
    expect(serializzaInSospeso(null)).toBeNull();
  });
});

const ADESSO = "2026-10-19T12:00:00.000Z";

function copia(campi: Partial<CopiaLocale> = {}): CopiaLocale {
  return { ...COPIA_VUOTA, risposte: nelBrowser(base), ...campi };
}

function conto(risposte: Risposte | null, passiFatti: IdPasso[] = [], aggiornatoIl = "2026-10-15T10:00:00Z"): DatiAccount {
  return { ...account(risposte, aggiornatoIl), passiFatti };
}

describe("conPassoCambiato", () => {
  it("senza proprietario cambia solo il telefono", () => {
    expect(conPassoCambiato(copia(), "riconoscimento-avs", true)).toEqual(copia({ passiFatti: ["riconoscimento-avs"] }));
  });

  it("con un proprietario la modifica resta da mandare (l'ultima vince)", () => {
    const prima = copia({ proprietario: UTENTE, passiFatti: ["riconoscimento-avs"] });
    const dopo = conPassoCambiato(conPassoCambiato(prima, "nome-ditta", true), "riconoscimento-avs", false);
    expect(dopo.passiFatti).toEqual(["nome-ditta"]);
    expect(dopo.inSospeso).toEqual({ utente: UTENTE, passi: { "nome-ditta": true, "riconoscimento-avs": false } });
    // Modifiche rimaste di un altro utente: non si tengono.
    const vecchie = copia({ proprietario: UTENTE, inSospeso: { utente: ALTRO, passi: { "nome-ditta": true } } });
    expect(conPassoCambiato(vecchie, "riconoscimento-avs", true).inSospeso).toEqual({
      utente: UTENTE,
      passi: { "riconoscimento-avs": true },
    });
  });
});

describe("conNuoveRisposte (questionario finito sul telefono)", () => {
  const nuove = nelBrowser(diverse, ADESSO);

  it("senza accesso e copia senza proprietario: cambiano solo le risposte", () => {
    const prima = copia({ passiFatti: ["riconoscimento-avs"] });
    expect(conNuoveRisposte(prima, nuove, null)).toEqual({ ...prima, risposte: nuove });
  });

  it("copia di un account e adesso senza accesso (o con un altro): via passi e proprietario, come sul sito", () => {
    const prima = copia({
      proprietario: UTENTE,
      passiFatti: ["riconoscimento-avs"],
      inSospeso: { utente: UTENTE, passi: { "riconoscimento-avs": true } },
    });
    expect(conNuoveRisposte(prima, nuove, null)).toEqual({ ...COPIA_VUOTA, risposte: nuove });
    expect(conNuoveRisposte(prima, nuove, ALTRO)).toEqual({ ...COPIA_VUOTA, risposte: nuove, proprietario: ALTRO });
  });

  it("con l'accesso la copia diventa dell'account e i passi del telefono restano da mandare", () => {
    expect(conNuoveRisposte(copia({ passiFatti: ["riconoscimento-avs"] }), nuove, UTENTE)).toEqual({
      risposte: nuove,
      passiFatti: ["riconoscimento-avs"],
      proprietario: UTENTE,
      inSospeso: { utente: UTENTE, passi: { "riconoscimento-avs": true } },
    });
  });

  it("utente non ancora noto: la copia resta di chi era", () => {
    const prima = copia({ proprietario: UTENTE, passiFatti: ["riconoscimento-avs"] });
    expect(conNuoveRisposte(prima, nuove, undefined)).toEqual({ ...prima, risposte: nuove });
  });
});

describe("pianoAllineamento", () => {
  it("senza accesso non fa niente", () => {
    const c = copia({ passiFatti: ["riconoscimento-avs"] });
    expect(pianoAllineamento(ACCOUNT_VUOTO, c)).toEqual({ tipo: "allinea", copia: c, risposte: null, passi: { fatti: [], daFare: [] } });
  });

  it("telefono vuoto: il percorso dell'account arriva sul telefono (accesso da un telefono nuovo)", () => {
    expect(pianoAllineamento(conto(base, ["riconoscimento-avs"]), COPIA_VUOTA, { adesso: ADESSO })).toEqual({
      tipo: "allinea",
      copia: {
        risposte: nelBrowser(base),
        passiFatti: ["riconoscimento-avs"],
        proprietario: UTENTE,
        inSospeso: null,
      },
      risposte: null,
      passi: { fatti: [], daFare: [] },
    });
  });

  it("telefono e account vuoti: niente da fare", () => {
    expect(pianoAllineamento(conto(null), COPIA_VUOTA)).toEqual({
      tipo: "allinea",
      copia: COPIA_VUOTA,
      risposte: null,
      passi: { fatti: [], daFare: [] },
    });
  });

  it("copia fatta senza accesso e account vuoto: prima il sì, poi risposte e passi vanno nell'account", () => {
    const c = copia({ passiFatti: ["riconoscimento-avs"] });
    expect(pianoAllineamento(conto(null), c)).toEqual({
      tipo: "da_confermare",
      domanda: { soloPassi: false, sostituisce: false, passiNuovi: 1 },
    });
    expect(pianoAllineamento(conto(null), c, { confermato: true })).toEqual({
      tipo: "allinea",
      copia: {
        risposte: c.risposte,
        passiFatti: ["riconoscimento-avs"],
        proprietario: UTENTE,
        inSospeso: { utente: UTENTE, passi: { "riconoscimento-avs": true } },
      },
      risposte: base,
      passi: { fatti: ["riconoscimento-avs"], daFare: [] },
    });
  });

  it("copia senza accesso più recente di un account con altre risposte: la domanda dice che le sostituisce", () => {
    const c = copia({ risposte: nelBrowser(diverse, "2026-10-16T10:00:00Z"), passiFatti: ["nome-ditta"] });
    const account = conto(base, ["riconoscimento-avs"]);
    expect(pianoAllineamento(account, c)).toEqual({
      tipo: "da_confermare",
      domanda: { soloPassi: false, sostituisce: true, passiNuovi: 1 },
    });
    // Con il sì: risposte del telefono, passi dell'account più quelli del telefono (si aggiunge, non si toglie).
    const piano = pianoAllineamento(account, c, { confermato: true });
    expect(piano).toMatchObject({
      tipo: "allinea",
      risposte: diverse,
      passi: { fatti: ["nome-ditta"], daFare: [] },
      copia: { passiFatti: ["riconoscimento-avs", "nome-ditta"], proprietario: UTENTE },
    });
  });

  it("stesse risposte e passi fatti senza accesso: si chiede solo per i passi, le risposte non si rimandano", () => {
    const c = copia({ passiFatti: ["riconoscimento-avs", "nome-ditta"] });
    const account = conto(base, ["riconoscimento-avs"]);
    expect(pianoAllineamento(account, c)).toEqual({
      tipo: "da_confermare",
      domanda: { soloPassi: true, sostituisce: false, passiNuovi: 1 },
    });
    expect(pianoAllineamento(account, c, { confermato: true })).toMatchObject({
      tipo: "allinea",
      risposte: null,
      passi: { fatti: ["nome-ditta"], daFare: [] },
      copia: { passiFatti: ["riconoscimento-avs", "nome-ditta"], proprietario: UTENTE, inSospeso: { utente: UTENTE } },
    });
  });

  it("copia senza accesso e account più recente con altre risposte: vince l'account senza chiedere (come sul sito)", () => {
    const c = copia({ risposte: nelBrowser(diverse, "2026-10-14T10:00:00Z"), passiFatti: ["nome-ditta"] });
    expect(pianoAllineamento(conto(base, ["riconoscimento-avs"]), c, { adesso: ADESSO })).toEqual({
      tipo: "allinea",
      copia: { risposte: nelBrowser(base), passiFatti: ["riconoscimento-avs"], proprietario: UTENTE, inSospeso: null },
      risposte: null,
      passi: { fatti: [], daFare: [] },
    });
  });

  it("copia di un altro account: si sostituisce con quella dell'account collegato, o si cancella", () => {
    const c = copia({
      risposte: nelBrowser(diverse, "2030-01-01T00:00:00Z"),
      proprietario: ALTRO,
      passiFatti: ["nome-ditta"],
      inSospeso: { utente: ALTRO, passi: { "nome-ditta": true } },
    });
    expect(pianoAllineamento(conto(base, ["riconoscimento-avs"]), c)).toEqual({
      tipo: "allinea",
      copia: { risposte: nelBrowser(base), passiFatti: ["riconoscimento-avs"], proprietario: UTENTE, inSospeso: null },
      risposte: null,
      passi: { fatti: [], daFare: [] },
    });
    expect(pianoAllineamento(conto(null), c)).toEqual({
      tipo: "allinea",
      copia: COPIA_VUOTA,
      risposte: null,
      passi: { fatti: [], daFare: [] },
    });
  });

  it("copia di questo account: le modifiche dal sito arrivano, quelle del telefono non ancora salvate restano", () => {
    const c = copia({
      proprietario: UTENTE,
      passiFatti: ["riconoscimento-avs", "nome-ditta"],
      inSospeso: { utente: UTENTE, passi: { "nome-ditta": true } },
    });
    // Sul sito: «riconoscimento-avs» tolto, «fatture» aggiunto.
    expect(pianoAllineamento(conto(base, ["fatture"]), c, { adesso: ADESSO })).toEqual({
      tipo: "allinea",
      copia: {
        risposte: nelBrowser(base),
        passiFatti: ["fatture", "nome-ditta"],
        proprietario: UTENTE,
        inSospeso: { utente: UTENTE, passi: { "nome-ditta": true } },
      },
      risposte: null,
      passi: { fatti: ["nome-ditta"], daFare: [] },
    });
  });

  it("modifiche già vere nell'account non si rimandano", () => {
    const c = copia({
      proprietario: UTENTE,
      passiFatti: [],
      inSospeso: { utente: UTENTE, passi: { "riconoscimento-avs": false, "nome-ditta": true } },
    });
    expect(pianoAllineamento(conto(base, ["nome-ditta"]), c)).toMatchObject({
      copia: { passiFatti: ["nome-ditta"], inSospeso: null },
      passi: { fatti: [], daFare: [] },
    });
  });

  it("risposte del telefono più recenti (copia di questo account): vanno nell'account senza chiedere", () => {
    const c = copia({
      risposte: nelBrowser(diverse, "2026-10-16T10:00:00Z"),
      proprietario: UTENTE,
      passiFatti: ["riconoscimento-avs"],
      inSospeso: { utente: UTENTE, passi: { "riconoscimento-avs": true } },
    });
    expect(pianoAllineamento(conto(base, []), c)).toEqual({
      tipo: "allinea",
      copia: { ...c },
      risposte: diverse,
      passi: { fatti: ["riconoscimento-avs"], daFare: [] },
    });
  });

  it("risposte del sito più recenti: vincono anche su quelle cambiate sul telefono prima", () => {
    const c = copia({ risposte: nelBrowser(diverse, "2026-10-15T09:00:00Z"), proprietario: UTENTE });
    expect(pianoAllineamento(conto(base, [], "2026-10-15T10:00:00Z"), c)).toMatchObject({
      copia: { risposte: { risposte: base, aggiornatoIl: "2026-10-15T10:00:00Z" } },
      risposte: null,
    });
  });
});

describe("cambiDellaCopia", () => {
  it("guarda il contenuto delle risposte e l'insieme dei passi, non l'ordine o il momento", () => {
    const a = copia({ passiFatti: ["riconoscimento-avs", "nome-ditta"] });
    expect(cambiDellaCopia(a, { ...a, risposte: nelBrowser({ ...base }, ADESSO), passiFatti: ["nome-ditta", "riconoscimento-avs"] })).toEqual({
      risposte: false,
      passi: false,
    });
    expect(cambiDellaCopia(a, { ...a, risposte: nelBrowser(diverse) })).toEqual({ risposte: true, passi: false });
    expect(cambiDellaCopia(a, { ...a, risposte: null, passiFatti: [] })).toEqual({ risposte: true, passi: true });
  });
});
