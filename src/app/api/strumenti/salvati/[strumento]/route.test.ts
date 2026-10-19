import { beforeEach, describe, expect, it, vi } from "vitest";
import { datiBudgetIniziali, type DatiBudget } from "@/lib/strumenti/budget";
import { datiPianoIniziali } from "@/lib/strumenti/business-plan";
import { MESSAGGI_SALVATI } from "@/lib/strumenti/salvati";

vi.mock("server-only", () => ({}));

const UTENTE = "11111111-1111-1111-1111-111111111111";

type Risultato = { data?: unknown; error?: { code?: string } | null };

const stato = vi.hoisted(() => ({
  accesso: "ok" as "ok" | "non_configurato" | "non_collegato",
  /** Risposte del database per «tabella.azione», una dopo l'altra se è un elenco. */
  risposte: {} as Record<string, Risultato | Risultato[]>,
  ordine: [] as string[],
  scritte: [] as { tabella: string; azione: string; righe: unknown; opzioni?: unknown }[],
  filtri: [] as { tabella: string; colonna: string; valore: unknown }[],
}));

function query(tabella: string) {
  let azione = "select";
  const q: Record<string, unknown> = {};
  const stessa = () => q;
  Object.assign(q, {
    select: () => q,
    upsert: (righe: unknown, opzioni?: unknown) => {
      azione = "upsert";
      stato.scritte.push({ tabella, azione, righe, opzioni });
      return q;
    },
    delete: () => {
      azione = "delete";
      return q;
    },
    eq: (colonna: string, valore: unknown) => {
      stato.filtri.push({ tabella, colonna, valore });
      return q;
    },
    single: stessa,
    maybeSingle: stessa,
    then: (ok: (r: Risultato) => unknown, ko: (e: unknown) => unknown) => {
      const chiave = `${tabella}.${azione}`;
      stato.ordine.push(chiave);
      const r = stato.risposte[chiave];
      const risultato = Array.isArray(r) ? r.shift() : r;
      return Promise.resolve(risultato ?? { data: null, error: null }).then(ok, ko);
    },
  });
  return q;
}

vi.mock("@/lib/supabase/richiesta", () => ({
  utenteDaRichiesta: async () =>
    stato.accesso === "ok" ? { ok: true, supabase: { from: query }, user: { id: UTENTE } } : { ok: false, motivo: stato.accesso },
}));

const route = await import("./route");

const budget = (ricavo = "4000"): DatiBudget => ({
  ...datiBudgetIniziali("2026-10-19"),
  ricavi: Array.from({ length: 12 }, () => ricavo),
});

function richiesta(metodo: string, corpo?: unknown, tipo = "application/json") {
  return new Request("https://bleo.example/api/strumenti/salvati/budget", {
    method: metodo,
    headers: corpo === undefined ? undefined : { "content-type": tipo },
    body: corpo === undefined ? undefined : typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

const contesto = (strumento: string) => ({ params: Promise.resolve({ strumento }) }) as never;

beforeEach(() => {
  stato.accesso = "ok";
  stato.risposte = {};
  stato.ordine = [];
  stato.scritte = [];
  stato.filtri = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("accesso", () => {
  it("in modalità demo 503, senza accesso 401, con ogni metodo", async () => {
    stato.accesso = "non_configurato";
    const demo = await route.GET(richiesta("GET"), contesto("budget"));
    expect(demo.status).toBe(503);
    expect(await demo.json()).toEqual({ messaggio: MESSAGGI_SALVATI.nonAttivo });
    stato.accesso = "non_collegato";
    expect((await route.GET(richiesta("GET"), contesto("budget"))).status).toBe(401);
    expect((await route.PUT(richiesta("PUT", budget()), contesto("budget"))).status).toBe(401);
    expect((await route.POST(richiesta("POST", budget()), contesto("budget"))).status).toBe(401);
    expect((await route.DELETE(richiesta("DELETE"), contesto("budget"))).status).toBe(401);
    expect(stato.ordine).toEqual([]);
  });

  it("solo budget e business plan: gli altri strumenti 404", async () => {
    for (const metodo of ["GET", "PUT", "POST", "DELETE"] as const) {
      const risposta = await route[metodo](richiesta(metodo, metodo === "GET" || metodo === "DELETE" ? undefined : budget()), contesto("tariffa"));
      expect(risposta.status).toBe(404);
    }
    expect(stato.ordine).toEqual([]);
  });
});

describe("GET /api/strumenti/salvati/[strumento]", () => {
  it("restituisce i dati dell'utente riletti con lo schema dello strumento, senza cache", async () => {
    stato.risposte["strumenti_salvati.select"] = {
      data: { contenuto: { ...budget(), extra: "via" }, aggiornato_il: "2026-10-19T10:00:00+00:00" },
      error: null,
    };
    const risposta = await route.GET(richiesta("GET"), contesto("budget"));
    expect(risposta.status).toBe(200);
    expect(risposta.headers.get("cache-control")).toBe("no-store");
    expect(await risposta.json()).toEqual({ dati: budget(), aggiornatoIl: "2026-10-19T10:00:00+00:00" });
    expect(stato.filtri).toEqual([
      { tabella: "strumenti_salvati", colonna: "user_id", valore: UTENTE },
      { tabella: "strumenti_salvati", colonna: "strumento", valore: "budget" },
    ]);
  });

  it("senza dati salvati null; errore del database 503; migrazione non eseguita «non attivo»", async () => {
    expect(await (await route.GET(richiesta("GET"), contesto("business-plan"))).json()).toEqual({ dati: null, aggiornatoIl: null });
    stato.risposte["strumenti_salvati.select"] = { data: null, error: { code: "XX000" } };
    const errore = await route.GET(richiesta("GET"), contesto("budget"));
    expect(errore.status).toBe(503);
    expect(await errore.json()).toEqual({ messaggio: MESSAGGI_SALVATI.erroreDatabase });
    stato.risposte["strumenti_salvati.select"] = { data: null, error: { code: "PGRST205" } };
    expect(await (await route.GET(richiesta("GET"), contesto("budget"))).json()).toEqual({ messaggio: MESSAGGI_SALVATI.nonAttivo });
  });
});

describe("PUT /api/strumenti/salvati/[strumento]", () => {
  it("salva i dati controllati nella riga dello strumento", async () => {
    stato.risposte["strumenti_salvati.upsert"] = { data: { aggiornato_il: "2026-10-19T10:00:00+00:00" }, error: null };
    const risposta = await route.PUT(richiesta("PUT", budget()), contesto("budget"));
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toEqual({ aggiornatoIl: "2026-10-19T10:00:00+00:00" });
    expect(stato.scritte).toEqual([
      {
        tabella: "strumenti_salvati",
        azione: "upsert",
        righe: expect.objectContaining({ user_id: UTENTE, strumento: "budget", contenuto: budget() }),
        opzioni: { onConflict: "user_id,strumento" },
      },
    ]);
  });

  it("rifiuta dati non validi, il budget al posto del business plan, corpi non JSON o troppo grandi, senza scrivere", async () => {
    expect((await route.PUT(richiesta("PUT", { ...budget(), extra: 1 }), contesto("budget"))).status).toBe(400);
    expect((await route.PUT(richiesta("PUT", budget()), contesto("business-plan"))).status).toBe(400);
    expect((await route.PUT(richiesta("PUT", "ciao", "text/plain"), contesto("budget"))).status).toBe(415);
    expect((await route.PUT(richiesta("PUT", "{rotto"), contesto("budget"))).status).toBe(400);
    const grande = await route.PUT(
      richiesta("PUT", { ...datiPianoIniziali(), nomeAttivita: "x".repeat(210_000) }),
      contesto("business-plan"),
    );
    expect(grande.status).toBe(413);
    expect(await grande.json()).toEqual({ messaggio: MESSAGGI_SALVATI.troppoLungo });
    expect(stato.scritte).toEqual([]);
  });

  it("con un errore del database 503", async () => {
    stato.risposte["strumenti_salvati.upsert"] = { data: null, error: { code: "XX000" } };
    expect((await route.PUT(richiesta("PUT", budget()), contesto("budget"))).status).toBe(503);
  });
});

describe("POST /api/strumenti/salvati/[strumento] (copia dal browser o dal telefono)", () => {
  it("copia nell'account vuoto senza sovrascrivere", async () => {
    stato.risposte["strumenti_salvati.upsert"] = {
      data: [{ contenuto: budget("700"), aggiornato_il: "2026-10-19T10:00:00+00:00" }],
      error: null,
    };
    const risposta = await route.POST(richiesta("POST", budget("700")), contesto("budget"));
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toEqual({ importato: true, dati: budget("700"), aggiornatoIl: "2026-10-19T10:00:00+00:00" });
    expect(stato.scritte[0]).toMatchObject({
      tabella: "strumenti_salvati",
      opzioni: { onConflict: "user_id,strumento", ignoreDuplicates: true },
      righe: { user_id: UTENTE, strumento: "budget", contenuto: budget("700") },
    });
  });

  it("se l'account ha già il suo, lo restituisce e non lo tocca", async () => {
    stato.risposte["strumenti_salvati.upsert"] = { data: [], error: null };
    stato.risposte["strumenti_salvati.select"] = {
      data: { contenuto: budget("50"), aggiornato_il: "2026-10-18T10:00:00+00:00" },
      error: null,
    };
    const risposta = await route.POST(richiesta("POST", budget("700")), contesto("budget"));
    expect(await risposta.json()).toEqual({ importato: false, dati: budget("50"), aggiornatoIl: "2026-10-18T10:00:00+00:00" });
    expect(stato.ordine).toEqual(["strumenti_salvati.upsert", "strumenti_salvati.select"]);
  });

  it("rifiuta dati non validi", async () => {
    expect((await route.POST(richiesta("POST", { nomeAttivita: "Bar" }), contesto("business-plan"))).status).toBe(400);
    expect(stato.scritte).toEqual([]);
  });
});

describe("DELETE /api/strumenti/salvati/[strumento]", () => {
  it("cancella solo la riga dell'utente per quello strumento; 404 se non c'è", async () => {
    stato.risposte["strumenti_salvati.delete"] = [
      { data: [{ strumento: "business-plan" }], error: null },
      { data: [], error: null },
    ];
    expect((await route.DELETE(richiesta("DELETE"), contesto("business-plan"))).status).toBe(204);
    expect(stato.filtri).toEqual([
      { tabella: "strumenti_salvati", colonna: "user_id", valore: UTENTE },
      { tabella: "strumenti_salvati", colonna: "strumento", valore: "business-plan" },
    ]);
    const nessuno = await route.DELETE(richiesta("DELETE"), contesto("business-plan"));
    expect(nessuno.status).toBe(404);
    expect(await nessuno.json()).toEqual({ messaggio: MESSAGGI_SALVATI.nienteDaCancellare });
  });
});
