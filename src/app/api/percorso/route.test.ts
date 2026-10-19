import { beforeEach, describe, expect, it, vi } from "vitest";
import { leggiPercorsoAccount, MESSAGGI_PERCORSO } from "@/lib/percorso/account-api";
import { VERSIONE_REGOLE } from "@/lib/percorso/regole";
import { VERSIONE_RISPOSTE } from "@/lib/percorso/risposte";

vi.mock("server-only", () => ({}));

const UTENTE = "11111111-1111-1111-1111-111111111111";
const RISPOSTE = {
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

type Risultato = { data?: unknown; error?: { code?: string } | null };

const stato = vi.hoisted(() => ({
  accesso: "ok" as "ok" | "non_configurato" | "non_collegato",
  questionario: null as { risposte: unknown; aggiornato_il: string } | null,
  passi: [] as { passo_id: string }[],
  /** Errori del database per «tabella.azione». */
  errori: {} as Record<string, { code?: string }>,
  operazioni: [] as { tabella: string; azione: string; righe?: unknown; opzioni?: unknown; filtri: [string, unknown][] }[],
}));

function query(tabella: string) {
  let azione = "select";
  let righe: unknown;
  let opzioni: unknown;
  const filtri: [string, unknown][] = [];
  const q: Record<string, unknown> = {};
  Object.assign(q, {
    select: () => q,
    upsert: (r: unknown, o?: unknown) => {
      azione = "upsert";
      righe = r;
      opzioni = o;
      return q;
    },
    delete: () => {
      azione = "delete";
      return q;
    },
    eq: (colonna: string, valore: unknown) => {
      filtri.push([colonna, valore]);
      return q;
    },
    in: (colonna: string, valori: unknown) => {
      filtri.push([colonna, valori]);
      return q;
    },
    maybeSingle: () => q,
    then: (ok: (r: Risultato) => unknown, ko: (e: unknown) => unknown) => {
      stato.operazioni.push({ tabella, azione, righe, opzioni, filtri });
      const errore = stato.errori[`${tabella}.${azione}`];
      let risultato: Risultato = { data: null, error: errore ?? null };
      if (!errore && azione === "select") {
        risultato = { data: tabella === "questionari" ? stato.questionario : stato.passi, error: null };
      }
      if (!errore && azione === "upsert" && tabella === "questionari") {
        const riga = righe as { risposte: unknown; aggiornato_il: string };
        stato.questionario = { risposte: riga.risposte, aggiornato_il: riga.aggiornato_il };
      }
      if (!errore && azione === "upsert" && tabella === "passi_completati") {
        for (const r of righe as { passo_id: string }[]) {
          if (!stato.passi.some((p) => p.passo_id === r.passo_id)) stato.passi.push({ passo_id: r.passo_id });
        }
      }
      if (!errore && azione === "delete") {
        const via = (filtri.find(([c]) => c === "passo_id")?.[1] ?? []) as string[];
        stato.passi = stato.passi.filter((p) => !via.includes(p.passo_id));
      }
      return Promise.resolve(risultato).then(ok, ko);
    },
  });
  return q;
}

vi.mock("@/lib/supabase/richiesta", () => ({
  utenteDaRichiesta: async () =>
    stato.accesso === "ok" ? { ok: true, supabase: { from: query }, user: { id: UTENTE } } : { ok: false, motivo: stato.accesso },
}));

const { GET, PATCH, PUT } = await import("./route");

function richiesta(metodo: string, corpo?: unknown, tipo = "application/json") {
  return new Request("https://bleo.example/api/percorso", {
    method: metodo,
    headers: corpo === undefined ? undefined : { "content-type": tipo, authorization: "Bearer token-di-prova" },
    body: corpo === undefined ? undefined : typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

beforeEach(() => {
  stato.accesso = "ok";
  stato.questionario = null;
  stato.passi = [];
  stato.errori = {};
  stato.operazioni = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("accesso", () => {
  it("in modalità demo 503, senza accesso 401, senza toccare il database", async () => {
    stato.accesso = "non_configurato";
    const demo = await GET(richiesta("GET"));
    expect(demo.status).toBe(503);
    expect(await demo.json()).toEqual({ messaggio: MESSAGGI_PERCORSO.nonAttivo });
    stato.accesso = "non_collegato";
    const senza = await GET(richiesta("GET"));
    expect(senza.status).toBe(401);
    expect(await senza.json()).toEqual({ messaggio: MESSAGGI_PERCORSO.nonCollegato });
    expect((await PUT(richiesta("PUT", { risposte: RISPOSTE }))).status).toBe(401);
    expect((await PATCH(richiesta("PATCH", { fatti: ["fatture"] }))).status).toBe(401);
    expect(stato.operazioni).toEqual([]);
  });
});

describe("GET /api/percorso", () => {
  it("account vuoto: niente risposte e niente passi, senza cache", async () => {
    const risposta = await GET(richiesta("GET"));
    expect(risposta.status).toBe(200);
    expect(risposta.headers.get("cache-control")).toBe("no-store");
    expect(await risposta.json()).toEqual({ risposte: null, aggiornatoIl: null, passiFatti: [] });
  });

  it("risposte e passi dell'utente; passi sconosciuti e risposte di una versione vecchia si saltano", async () => {
    stato.questionario = { risposte: RISPOSTE, aggiornato_il: "2026-10-17T08:00:00.123456+00:00" };
    stato.passi = [{ passo_id: "fatture" }, { passo_id: "passo-tolto" }, { passo_id: "nome-ditta" }];
    const corpo = await (await GET(richiesta("GET"))).json();
    expect(corpo).toEqual({ risposte: RISPOSTE, aggiornatoIl: "2026-10-17T08:00:00.123Z", passiFatti: ["fatture", "nome-ditta"] });
    expect(leggiPercorsoAccount(corpo)).toEqual(corpo);
    // Solo le righe dell'utente (oltre alla RLS).
    expect(stato.operazioni.every((o) => o.filtri.some(([c, v]) => c === "user_id" && v === UTENTE))).toBe(true);

    stato.questionario = { risposte: { ...RISPOSTE, versione: "2020-01-01" }, aggiornato_il: "2026-10-17T08:00:00Z" };
    expect(await (await GET(richiesta("GET"))).json()).toMatchObject({ risposte: null, aggiornatoIl: null });
  });

  it("se una lettura non riesce: 503, mai un account vuoto", async () => {
    stato.questionario = { risposte: RISPOSTE, aggiornato_il: "2026-10-17T08:00:00Z" };
    stato.errori["passi_completati.select"] = { code: "08006" };
    const risposta = await GET(richiesta("GET"));
    expect(risposta.status).toBe(503);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_PERCORSO.erroreDatabase });
  });
});

describe("PUT /api/percorso", () => {
  it("salva le risposte valide con la versione delle regole e restituisce il percorso", async () => {
    stato.passi = [{ passo_id: "fatture" }];
    const risposta = await PUT(richiesta("PUT", { risposte: { ...RISPOSTE, attivitaAltro: "da togliere" } }));
    expect(risposta.status).toBe(200);
    const corpo = await risposta.json();
    expect(corpo).toMatchObject({ risposte: RISPOSTE, passiFatti: ["fatture"] });
    expect(typeof corpo.aggiornatoIl).toBe("string");
    const scrittura = stato.operazioni.find((o) => o.azione === "upsert");
    expect(scrittura).toMatchObject({
      tabella: "questionari",
      righe: { user_id: UTENTE, risposte: RISPOSTE, versione_regole: VERSIONE_REGOLE },
      opzioni: { onConflict: "user_id" },
    });
  });

  it("rifiuta risposte non valide, corpi non JSON e troppo lunghi", async () => {
    const nonValide = await PUT(richiesta("PUT", { risposte: { ...RISPOSTE, cantone: "ZH" } }));
    expect(nonValide.status).toBe(400);
    expect(await nonValide.json()).toEqual({ messaggio: MESSAGGI_PERCORSO.risposteNonValide });
    expect((await PUT(richiesta("PUT", { risposte: { ...RISPOSTE, versione: "vecchia" } }))).status).toBe(400);
    expect((await PUT(richiesta("PUT", RISPOSTE))).status).toBe(400);
    expect((await PUT(richiesta("PUT", "{rotto"))).status).toBe(400);
    expect((await PUT(richiesta("PUT", { risposte: RISPOSTE }, "text/plain"))).status).toBe(415);
    const lungo = await PUT(richiesta("PUT", { risposte: RISPOSTE, riempi: "x".repeat(9_000) }));
    expect(lungo.status).toBe(413);
    expect(stato.operazioni).toEqual([]);
  });

  it("errore del database: 503", async () => {
    stato.errori["questionari.upsert"] = { code: "23514" };
    expect((await PUT(richiesta("PUT", { risposte: RISPOSTE }))).status).toBe(503);
  });
});

describe("PATCH /api/percorso", () => {
  it("segna passi fatti (senza doppioni) e da fare, e restituisce il percorso", async () => {
    stato.passi = [{ passo_id: "nome-ditta" }];
    const risposta = await PATCH(richiesta("PATCH", { fatti: ["fatture", "fatture"], daFare: ["nome-ditta"] }));
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toEqual({ risposte: null, aggiornatoIl: null, passiFatti: ["fatture"] });
    const cancellazione = stato.operazioni.find((o) => o.azione === "delete");
    expect(cancellazione?.filtri).toEqual([
      ["user_id", UTENTE],
      ["passo_id", ["nome-ditta"]],
    ]);
    expect(stato.operazioni.find((o) => o.azione === "upsert")).toMatchObject({
      tabella: "passi_completati",
      righe: [{ user_id: UTENTE, passo_id: "fatture" }],
      opzioni: { onConflict: "user_id,passo_id", ignoreDuplicates: true },
    });
  });

  it("un solo campo basta; passi che il sito non conosce si ignorano", async () => {
    const risposta = await PATCH(richiesta("PATCH", { fatti: ["passo-del-futuro", "fatture"] }));
    expect(await risposta.json()).toMatchObject({ passiFatti: ["fatture"] });
    expect(stato.operazioni.some((o) => o.azione === "delete")).toBe(false);
  });

  it("rifiuta forme sbagliate: stesso passo fatto e da fare, id non validi, campi in più, elenchi lunghi", async () => {
    for (const corpo of [
      { fatti: ["fatture"], daFare: ["fatture"] },
      { fatti: ["Fatture!"] },
      { fatti: "fatture" },
      { fatti: [], altro: true },
      { fatti: Array.from({ length: 100 }, (_, i) => `passo-${i}`) },
    ]) {
      const risposta = await PATCH(richiesta("PATCH", corpo));
      expect(risposta.status).toBe(400);
      expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_PERCORSO.passiNonValidi });
    }
    expect(stato.operazioni).toEqual([]);
  });

  it("troppi passi nell'account (trigger): 409", async () => {
    stato.errori["passi_completati.upsert"] = { code: "54000" };
    const risposta = await PATCH(richiesta("PATCH", { fatti: ["fatture"] }));
    expect(risposta.status).toBe(409);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_PERCORSO.troppiPassi });
  });
});
