import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGGI_DOCUMENTI } from "@/lib/strumenti/account";
import { emittenteVuoto, nuovoDocumento, type Documento, type Emittente } from "@/lib/strumenti/documenti";

vi.mock("server-only", () => ({}));

const UTENTE = "11111111-1111-1111-1111-111111111111";
const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

type Risultato = { data?: unknown; error?: { code?: string } | null };

const stato = vi.hoisted(() => ({
  accesso: "ok" as "ok" | "non_configurato" | "non_collegato",
  /** Risposte del database per «tabella.azione». */
  risposte: {} as Record<string, Risultato>,
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
    order: stessa,
    range: stessa,
    overrideTypes: stessa,
    single: stessa,
    maybeSingle: stessa,
    then: (ok: (r: Risultato) => unknown, ko: (e: unknown) => unknown) => {
      stato.ordine.push(`${tabella}.${azione}`);
      return Promise.resolve(stato.risposte[`${tabella}.${azione}`] ?? { data: null, error: null }).then(ok, ko);
    },
  });
  return q;
}

vi.mock("@/lib/supabase/richiesta", () => ({
  utenteDaRichiesta: async () =>
    stato.accesso === "ok" ? { ok: true, supabase: { from: query }, user: { id: UTENTE } } : { ok: false, motivo: stato.accesso },
}));

const elenco = await import("./route");
const singolo = await import("./[id]/route");
const emittenteRoute = await import("../emittente/route");

const emittente: Emittente = {
  ...emittenteVuoto(),
  nome: "Giulia Bernasconi",
  via: "Via Lugano",
  numero: "12",
  npa: "6500",
  localita: "Bellinzona",
  iban: "CH93 0076 2011 6238 5295 7",
};

function fattura(campi: Partial<Documento> = {}): Documento {
  const base = nuovoDocumento("fattura", emittente, [], {
    id: ID,
    oggiIso: "2026-10-19",
    adessoIso: "2026-10-19T10:00:00.000Z",
    idRiga: () => "riga-1",
  });
  return {
    ...base,
    cliente: { nome: "Bar Centrale", via: "Piazza Grande", numero: "1", npa: "6600", localita: "Locarno", paese: "CH" },
    righe: [{ ...base.righe[0], descrizione: "Sito web", prezzo: "1200" }],
    ...campi,
  };
}

const RIGA_EMITTENTE = {
  nome: "Giulia Bernasconi",
  via: "Via Lugano",
  numero: "12",
  npa: "6500",
  localita: "Bellinzona",
  paese: "CH",
  email: "",
  telefono: "",
  iban: "CH93 0076 2011 6238 5295 7",
  iva_iscritto: false,
  numero_iva: "",
};

function richiesta(metodo: string, corpo?: unknown, tipo = "application/json") {
  return new Request("https://bleo.example/api/strumenti/documenti", {
    method: metodo,
    headers: corpo === undefined ? undefined : { "content-type": tipo },
    body: corpo === undefined ? undefined : typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

const contesto = (id: string) => ({ params: Promise.resolve({ id }) }) as never;

beforeEach(() => {
  stato.accesso = "ok";
  stato.risposte = {};
  stato.ordine = [];
  stato.scritte = [];
  stato.filtri = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("accesso", () => {
  it("in modalità demo 503, senza accesso 401, su tutte le route", async () => {
    stato.accesso = "non_configurato";
    const demo = await elenco.GET(richiesta("GET"));
    expect(demo.status).toBe(503);
    expect(await demo.json()).toEqual({ messaggio: MESSAGGI_DOCUMENTI.nonAttivo });
    stato.accesso = "non_collegato";
    expect((await elenco.GET(richiesta("GET"))).status).toBe(401);
    expect((await elenco.POST(richiesta("POST", { documenti: [] }))).status).toBe(401);
    expect((await singolo.PUT(richiesta("PUT", fattura()), contesto(ID))).status).toBe(401);
    expect((await singolo.DELETE(richiesta("DELETE"), contesto(ID))).status).toBe(401);
    expect((await emittenteRoute.PUT(richiesta("PUT", emittente))).status).toBe(401);
    expect(stato.ordine).toEqual([]);
  });
});

describe("GET /api/strumenti/documenti", () => {
  it("restituisce i documenti validi dell'utente e i suoi dati, senza cache", async () => {
    stato.risposte["preventivi_fatture.select"] = {
      data: [
        { id: ID, contenuto: fattura() },
        { id: "rovinato-0001", contenuto: "non un documento" },
        { id: "altro-id-0001", contenuto: fattura() },
      ],
      error: null,
    };
    stato.risposte["emittenti.select"] = { data: RIGA_EMITTENTE, error: null };
    const risposta = await elenco.GET(richiesta("GET"));
    expect(risposta.status).toBe(200);
    expect(risposta.headers.get("cache-control")).toBe("no-store");
    expect(await risposta.json()).toEqual({ documenti: [fattura()], emittente });
    expect(stato.filtri).toContainEqual({ tabella: "preventivi_fatture", colonna: "user_id", valore: UTENTE });
  });

  it("senza dati salvati: elenco vuoto ed emittente null; errore del database 503", async () => {
    stato.risposte["preventivi_fatture.select"] = { data: [], error: null };
    expect(await (await elenco.GET(richiesta("GET"))).json()).toEqual({ documenti: [], emittente: null });
    stato.risposte["preventivi_fatture.select"] = { data: null, error: { code: "XX000" } };
    expect((await elenco.GET(richiesta("GET"))).status).toBe(503);
    // Migrazione non ancora eseguita: «non ancora attivo».
    stato.risposte["preventivi_fatture.select"] = { data: null, error: { code: "PGRST205" } };
    const senzaTabella = await elenco.GET(richiesta("GET"));
    expect(senzaTabella.status).toBe(503);
    expect(await senzaTabella.json()).toEqual({ messaggio: MESSAGGI_DOCUMENTI.nonAttivo });
  });
});

describe("PUT /api/strumenti/documenti/[id]", () => {
  it("salva il documento controllato, con numero, data e stato presi dal contenuto", async () => {
    stato.risposte["preventivi_fatture.upsert"] = { data: { id: ID, stato: "pronto" }, error: null };
    const risposta = await singolo.PUT(richiesta("PUT", fattura()), contesto(ID));
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toEqual({ id: ID, stato: "pronto" });
    expect(stato.scritte).toEqual([
      {
        tabella: "preventivi_fatture",
        azione: "upsert",
        righe: expect.objectContaining({
          user_id: UTENTE,
          id: ID,
          tipo: "fattura",
          numero: "F-2026-001",
          data: "2026-10-19",
          stato: "pronto",
          contenuto: fattura(),
        }),
        opzioni: { onConflict: "user_id,id" },
      },
    ]);
  });

  it("rifiuta id diversi, documenti non validi, corpi non JSON o troppo grandi, senza scrivere", async () => {
    expect((await singolo.PUT(richiesta("PUT", fattura()), contesto("a1b2c3d4-9999"))).status).toBe(400);
    expect((await singolo.PUT(richiesta("PUT", fattura()), contesto("x"))).status).toBe(404);
    expect((await singolo.PUT(richiesta("PUT", { ...fattura(), valuta: "USD" }), contesto(ID))).status).toBe(400);
    expect((await singolo.PUT(richiesta("PUT", "ciao", "text/plain"), contesto(ID))).status).toBe(415);
    expect((await singolo.PUT(richiesta("PUT", "{rotto"), contesto(ID))).status).toBe(400);
    const grande = await singolo.PUT(richiesta("PUT", { ...fattura(), note: "x".repeat(260_000) }), contesto(ID));
    expect(grande.status).toBe(413);
    expect(await grande.json()).toEqual({ messaggio: MESSAGGI_DOCUMENTI.troppoLungo });
    expect(stato.scritte).toEqual([]);
  });

  it("con troppi documenti 409, con un altro errore del database 503", async () => {
    stato.risposte["preventivi_fatture.upsert"] = { data: null, error: { code: "54000" } };
    const troppi = await singolo.PUT(richiesta("PUT", fattura()), contesto(ID));
    expect(troppi.status).toBe(409);
    expect(await troppi.json()).toEqual({ messaggio: MESSAGGI_DOCUMENTI.troppi });
    stato.risposte["preventivi_fatture.upsert"] = { data: null, error: { code: "XX000" } };
    expect((await singolo.PUT(richiesta("PUT", fattura()), contesto(ID))).status).toBe(503);
  });
});

describe("DELETE /api/strumenti/documenti/[id]", () => {
  it("cancella solo il documento dell'utente; 404 se non c'è", async () => {
    stato.risposte["preventivi_fatture.delete"] = { data: [{ id: ID }], error: null };
    expect((await singolo.DELETE(richiesta("DELETE"), contesto(ID))).status).toBe(204);
    expect(stato.filtri).toEqual([
      { tabella: "preventivi_fatture", colonna: "user_id", valore: UTENTE },
      { tabella: "preventivi_fatture", colonna: "id", valore: ID },
    ]);
    stato.risposte["preventivi_fatture.delete"] = { data: [], error: null };
    expect((await singolo.DELETE(richiesta("DELETE"), contesto(ID))).status).toBe(404);
  });
});

describe("POST /api/strumenti/documenti (importazione dal browser)", () => {
  it("inserisce senza sovrascrivere e dice quali c'erano già; l'emittente solo se manca", async () => {
    const secondo = fattura({ id: "a1b2c3d4-0000-4000-8000-000000000002", numero: "F-2026-002", aggiornatoIl: "2026-10-01T08:00:00.000Z" });
    stato.risposte["preventivi_fatture.upsert"] = { data: [{ id: secondo.id }], error: null };
    stato.risposte["emittenti.upsert"] = { data: [{ user_id: UTENTE }], error: null };
    const risposta = await elenco.POST(richiesta("POST", { documenti: [fattura(), secondo, { id: "rotto" }], emittente }));
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toEqual({ importati: [secondo.id], giaPresenti: [ID], scartati: 1, emittente: true });
    const [documenti, dati] = stato.scritte;
    expect(documenti.opzioni).toEqual({ onConflict: "user_id,id", ignoreDuplicates: true });
    expect(documenti.righe).toEqual([
      expect.objectContaining({ id: ID, user_id: UTENTE, aggiornato_il: "2026-10-19T10:00:00.000Z", creato_il: "2026-10-19T10:00:00.000Z" }),
      expect.objectContaining({ id: secondo.id, numero: "F-2026-002", aggiornato_il: "2026-10-01T08:00:00.000Z" }),
    ]);
    expect(dati).toMatchObject({ tabella: "emittenti", opzioni: { onConflict: "user_id", ignoreDuplicates: true } });
    expect(dati.righe).toMatchObject({ user_id: UTENTE, nome: "Giulia Bernasconi", iban: emittente.iban });
  });

  it("rifiuta corpi non validi o troppi documenti alla volta", async () => {
    expect((await elenco.POST(richiesta("POST", { documenti: Array.from({ length: 26 }, () => fattura()) }))).status).toBe(400);
    expect((await elenco.POST(richiesta("POST", { documenti: [], emittente: { nome: 3 } }))).status).toBe(400);
    expect((await elenco.POST(richiesta("POST", "{rotto"))).status).toBe(400);
    expect(stato.scritte).toEqual([]);
  });
});

describe("PUT /api/strumenti/emittente", () => {
  it("salva i dati dell'emittente e li restituisce", async () => {
    stato.risposte["emittenti.upsert"] = { data: RIGA_EMITTENTE, error: null };
    const risposta = await emittenteRoute.PUT(richiesta("PUT", emittente));
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toEqual({ emittente });
    expect(stato.scritte[0]).toMatchObject({ tabella: "emittenti", opzioni: { onConflict: "user_id" } });
    expect((await emittenteRoute.PUT(richiesta("PUT", { ...emittente, iban: 5 }))).status).toBe(400);
  });
});
