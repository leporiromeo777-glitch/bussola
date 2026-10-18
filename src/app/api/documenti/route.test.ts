import { beforeEach, describe, expect, it, vi } from "vitest";
import { DOCUMENTI_MASSIMI, DURATA_LINK_CASSETTO } from "@/lib/cassetto/limiti";
import { MESSAGGI_CASSETTO } from "@/lib/cassetto/validazione";

vi.mock("server-only", () => ({}));

const UTENTE = "11111111-1111-1111-1111-111111111111";
const ID = "22222222-3333-4444-5555-666666666666";
const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

type Risultato = { data?: unknown; error?: { code?: string } | null; count?: number };

const stato = vi.hoisted(() => ({
  accesso: "ok" as "ok" | "non_configurato" | "non_collegato",
  limite: true,
  /** Risposte del database per «tabella.azione». */
  risposte: {} as Record<string, Risultato>,
  ordine: [] as string[],
  inserite: [] as Record<string, unknown>[],
  aggiornate: [] as Record<string, unknown>[],
  caricati: [] as { bucket: string; percorso: string; tipo: string }[],
  rimossi: [] as { bucket: string; percorsi: string[] }[],
  link: [] as { bucket: string; percorso: string; secondi: number }[],
  erroreStorage: null as { name: string } | null,
}));

function query(tabella: string) {
  let azione = "select";
  const q: Record<string, unknown> = {};
  const stessa = () => q;
  Object.assign(q, {
    select: (_colonne?: string, opzioni?: { head?: boolean }) => {
      if (azione === "select" && opzioni?.head) azione = "count";
      return q;
    },
    insert: (riga: Record<string, unknown>) => {
      azione = "insert";
      stato.inserite.push(riga);
      return q;
    },
    update: (riga: Record<string, unknown>) => {
      azione = "update";
      stato.aggiornate.push(riga);
      return q;
    },
    delete: () => {
      azione = "delete";
      return q;
    },
    eq: stessa,
    order: stessa,
    limit: stessa,
    not: stessa,
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

const supabase = {
  from: query,
  storage: {
    from: (bucket: string) => ({
      upload: async (percorso: string, _byte: Uint8Array, opzioni: { contentType: string }) => {
        stato.ordine.push("storage.upload");
        stato.caricati.push({ bucket, percorso, tipo: opzioni.contentType });
        return { data: stato.erroreStorage ? null : { path: percorso }, error: stato.erroreStorage };
      },
      remove: async (percorsi: string[]) => {
        stato.ordine.push("storage.remove");
        stato.rimossi.push({ bucket, percorsi });
        return { data: [], error: stato.erroreStorage };
      },
      createSignedUrl: async (percorso: string, secondi: number) => {
        stato.link.push({ bucket, percorso, secondi });
        return { data: { signedUrl: `https://storage.example/${percorso}?token=x` }, error: null };
      },
    }),
  },
};

vi.mock("@/lib/supabase/richiesta", () => ({
  utenteDaRichiesta: async () =>
    stato.accesso === "ok" ? { ok: true, supabase, user: { id: UTENTE } } : { ok: false, motivo: stato.accesso },
}));
vi.mock("@/lib/limiti/server", () => ({ richiestaConsentita: async () => stato.limite }));

const elenco = await import("./route");
const singolo = await import("./[id]/route");
const file = await import("./[id]/file/route");

const RIGA = {
  id: ID,
  titolo: "Polizza RC",
  tipo: "polizza",
  scade_il: "2027-01-31",
  nota: null,
  tipo_file: "image/png",
  nome_file: "polizza.png",
  byte: 70,
  creato_il: "2026-10-19T08:00:00+00:00",
  aggiornato_il: "2026-10-19T08:00:00+00:00",
};

function richiesta(metodo: string, corpo?: unknown, tipo = "application/json") {
  return new Request("https://bleo.example/api/documenti", {
    method: metodo,
    headers: corpo === undefined ? undefined : { "content-type": tipo },
    body: corpo === undefined ? undefined : typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

const contesto = (id: string) => ({ params: Promise.resolve({ id }) });

const nuovo = (campi: Record<string, unknown> = {}) => ({
  titolo: "Polizza RC",
  tipo: "polizza",
  scadeIl: "2027-01-31",
  file: { tipo: "image/png", dati: PNG, nomeFile: "polizza.png" },
  ...campi,
});

beforeEach(() => {
  stato.accesso = "ok";
  stato.limite = true;
  stato.risposte = {
    "cassetto_documenti.count": { count: 3, error: null },
    "cassetto_documenti.insert": { data: RIGA, error: null },
    "cassetto_documenti.select": { data: [RIGA], error: null },
  };
  stato.ordine = [];
  stato.inserite = [];
  stato.aggiornate = [];
  stato.caricati = [];
  stato.rimossi = [];
  stato.link = [];
  stato.erroreStorage = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("accesso", () => {
  it("in modalità demo 503, senza accesso 401", async () => {
    stato.accesso = "non_configurato";
    const demo = await elenco.GET(richiesta("GET"));
    expect(demo.status).toBe(503);
    expect(await demo.json()).toEqual({ messaggio: MESSAGGI_CASSETTO.nonAttivo });
    stato.accesso = "non_collegato";
    expect((await elenco.POST(richiesta("POST", nuovo()))).status).toBe(401);
    expect((await file.GET(richiesta("GET"), contesto(ID) as never)).status).toBe(401);
  });
});

describe("GET /api/documenti", () => {
  it("restituisce i documenti dell'utente nel formato delle API, senza cache", async () => {
    const risposta = await elenco.GET(richiesta("GET"));
    expect(risposta.status).toBe(200);
    expect(risposta.headers.get("cache-control")).toBe("no-store");
    expect(await risposta.json()).toMatchObject({
      documenti: [{ id: ID, titolo: "Polizza RC", scadeIl: "2027-01-31", file: { tipo: "image/png", byte: 70 } }],
    });
  });
});

describe("POST /api/documenti", () => {
  it("carica il file nella cartella dell'utente del bucket cassetto, con un nome casuale, poi salva la riga", async () => {
    const risposta = await elenco.POST(richiesta("POST", nuovo()));
    expect(risposta.status).toBe(201);
    expect(await risposta.json()).toMatchObject({ documento: { id: ID, titolo: "Polizza RC" } });
    expect(stato.caricati).toHaveLength(1);
    expect(stato.caricati[0].bucket).toBe("cassetto");
    expect(stato.caricati[0].tipo).toBe("image/png");
    expect(stato.caricati[0].percorso).toMatch(new RegExp(`^${UTENTE}/[0-9a-f-]{36}\\.png$`));
    expect(stato.inserite[0]).toMatchObject({
      user_id: UTENTE,
      titolo: "Polizza RC",
      tipo: "polizza",
      scade_il: "2027-01-31",
      nota: null,
      percorso: stato.caricati[0].percorso,
      tipo_file: "image/png",
      nome_file: "polizza.png",
      byte: 70,
    });
    expect(stato.ordine).toEqual(["cassetto_documenti.count", "storage.upload", "cassetto_documenti.insert"]);
  });

  it("rifiuta corpi non JSON, campi non validi e file che non corrispondono, senza caricare niente", async () => {
    expect((await elenco.POST(richiesta("POST", "ciao", "text/plain"))).status).toBe(415);
    expect((await elenco.POST(richiesta("POST", "{rotto"))).status).toBe(400);
    const senzaTitolo = await elenco.POST(richiesta("POST", nuovo({ titolo: "" })));
    expect(senzaTitolo.status).toBe(400);
    expect(await senzaTitolo.json()).toEqual({ messaggio: MESSAGGI_CASSETTO.titolo });
    expect((await elenco.POST(richiesta("POST", nuovo({ file: { tipo: "application/pdf", dati: PNG } })))).status).toBe(415);
    expect(stato.caricati).toEqual([]);
  });

  it("con il cassetto pieno 409, prima di caricare il file", async () => {
    stato.risposte["cassetto_documenti.count"] = { count: DOCUMENTI_MASSIMI, error: null };
    const risposta = await elenco.POST(richiesta("POST", nuovo()));
    expect(risposta.status).toBe(409);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_CASSETTO.troppi });
    expect(stato.caricati).toEqual([]);
  });

  it("con troppi caricamenti dalla stessa connessione 429", async () => {
    stato.limite = false;
    expect((await elenco.POST(richiesta("POST", nuovo()))).status).toBe(429);
    expect(stato.caricati).toEqual([]);
  });

  it("se la riga non si salva cancella il file appena caricato", async () => {
    stato.risposte["cassetto_documenti.insert"] = { data: null, error: { code: "54000" } };
    const risposta = await elenco.POST(richiesta("POST", nuovo()));
    expect(risposta.status).toBe(409);
    expect(stato.rimossi).toEqual([{ bucket: "cassetto", percorsi: [stato.caricati[0].percorso] }]);
  });

  it("se lo Storage non risponde: 503 e nessuna riga", async () => {
    stato.erroreStorage = { name: "StorageUnknownError" };
    expect((await elenco.POST(richiesta("POST", nuovo()))).status).toBe(503);
    expect(stato.inserite).toEqual([]);
  });
});

describe("PATCH e DELETE /api/documenti/[id]", () => {
  it("un id strano è 404 senza toccare il database", async () => {
    expect((await singolo.PATCH(richiesta("PATCH", { titolo: "x" }), contesto("../altro") as never)).status).toBe(404);
    expect((await singolo.DELETE(richiesta("DELETE"), contesto("1 or 1=1") as never)).status).toBe(404);
    expect(stato.ordine).toEqual([]);
  });

  it("la modifica cambia solo nome, tipo, scadenza e nota", async () => {
    stato.risposte["cassetto_documenti.update"] = { data: { ...RIGA, titolo: "Polizza RC 2027", scade_il: null }, error: null };
    const risposta = await singolo.PATCH(richiesta("PATCH", { titolo: "Polizza RC 2027", scadeIl: null }), contesto(ID) as never);
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toMatchObject({ documento: { titolo: "Polizza RC 2027", scadeIl: null } });
    expect(Object.keys(stato.aggiornate[0]).sort()).toEqual(["aggiornato_il", "scade_il", "titolo"]);
    const conFile = await singolo.PATCH(richiesta("PATCH", { percorso: `${UTENTE}/x.pdf` }), contesto(ID) as never);
    expect(conFile.status).toBe(400);
  });

  it("l'eliminazione cancella prima il file e poi la riga", async () => {
    stato.risposte["cassetto_documenti.select"] = { data: { percorso: `${UTENTE}/${ID}.png` }, error: null };
    const risposta = await singolo.DELETE(richiesta("DELETE"), contesto(ID) as never);
    expect(risposta.status).toBe(204);
    expect(stato.rimossi).toEqual([{ bucket: "cassetto", percorsi: [`${UTENTE}/${ID}.png`] }]);
    expect(stato.ordine).toEqual(["cassetto_documenti.select", "storage.remove", "cassetto_documenti.delete"]);
  });

  it("se il file non si cancella la riga resta (si può riprovare)", async () => {
    stato.risposte["cassetto_documenti.select"] = { data: { percorso: `${UTENTE}/${ID}.png` }, error: null };
    stato.erroreStorage = { name: "StorageUnknownError" };
    const risposta = await singolo.DELETE(richiesta("DELETE"), contesto(ID) as never);
    expect(risposta.status).toBe(503);
    expect(stato.ordine).not.toContain("cassetto_documenti.delete");
  });

  it("un documento che non c'è (o di un altro utente, nascosto dalla RLS) è 404", async () => {
    stato.risposte["cassetto_documenti.select"] = { data: null, error: null };
    expect((await singolo.DELETE(richiesta("DELETE"), contesto(ID) as never)).status).toBe(404);
    expect((await file.GET(richiesta("GET"), contesto(ID) as never)).status).toBe(404);
    expect(stato.rimossi).toEqual([]);
  });
});

describe("GET /api/documenti/[id]/file", () => {
  it(`dà un link temporaneo di ${DURATA_LINK_CASSETTO} secondi`, async () => {
    stato.risposte["cassetto_documenti.select"] = { data: { percorso: `${UTENTE}/${ID}.png` }, error: null };
    const risposta = await file.GET(richiesta("GET"), contesto(ID) as never);
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toEqual({ url: `https://storage.example/${UTENTE}/${ID}.png?token=x` });
    expect(stato.link).toEqual([{ bucket: "cassetto", percorso: `${UTENTE}/${ID}.png`, secondi: DURATA_LINK_CASSETTO }]);
  });
});
