import { beforeEach, describe, expect, it, vi } from "vitest";
import { LIMITI_RICHIESTE, chiaveLimite, chiaveLimiteUtente } from "@/lib/limiti/richieste";
import { LUNGHEZZA_MASSIMA_RACCONTO, MESSAGGI_RACCONTO } from "@/lib/percorso/racconto";

vi.mock("server-only", () => ({}));

const SEGRETO = "sb_secret_prova";
const IP = "203.0.113.7";
const UTENTE = { id: "11111111-2222-3333-4444-555555555555" };
const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJhLWRpLXByb3Zh";
const TESTO = "Voglio fare il fotografo a Lugano nel fine settimana. Ho già un lavoro al 60% e sono svizzero.";

/** Risposta di Claude già letta con lo structured output. */
const OUTPUT = {
  attivita: "digitale_creativo",
  attivitaAltro: null,
  cantone: "TI",
  soci: null,
  fatturato: null,
  clienti: null,
  impiego: "parziale",
  avviata: null,
  permesso: "svizzero_c",
  locali: null,
  venditaOnline: null,
  riassunto: "Ho capito: vuoi fare il fotografo a Lugano nel fine settimana, accanto al tuo lavoro al 60%.",
};

const stato = vi.hoisted(() => ({
  anthropic: true,
  /** Chiavi contate dal limite, nell'ordine. */
  limiti: [] as { chiave: string; massimo: number; finestra: number }[],
  consentita: true as boolean,
  erroreLimite: null as { code: string; message: string } | null,
  intestazioni: new Headers(),
  /** Sessione del sito con i cookie: l'utente collegato o nessuno. */
  utenteCookie: null as { id: string } | null,
  /** Token Bearer validi per Supabase Auth. */
  tokenValidi: new Map<string, { id: string }>(),
  chiamateClaude: [] as { parametri: Record<string, unknown>; opzioni: Record<string, unknown> }[],
  rispostaClaude: null as unknown,
}));

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/headers", () => ({ headers: async () => stato.intestazioni }));
vi.mock("@/lib/chat/server", () => ({
  anthropicConfigurato: () => stato.anthropic,
  creaClientAnthropic: () =>
    stato.anthropic
      ? {
          beta: {
            messages: {
              parse: async (parametri: Record<string, unknown>, opzioni: Record<string, unknown>) => {
                stato.chiamateClaude.push({ parametri, opzioni });
                return stato.rispostaClaude;
              },
            },
          },
        }
      : null,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () =>
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
      ? {
          rpc: async (_funzione: string, argomenti: { p_chiave: string; p_massimo: number; p_finestra_secondi: number }) => {
            stato.limiti.push({
              chiave: argomenti.p_chiave,
              massimo: argomenti.p_massimo,
              finestra: argomenti.p_finestra_secondi,
            });
            return stato.erroreLimite ? { data: null, error: stato.erroreLimite } : { data: stato.consentita, error: null };
          },
        }
      : null,
}));
// L'accesso si verifica con il codice vero (src/lib/supabase/richiesta.ts): finti solo i client di Supabase.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () =>
        stato.utenteCookie
          ? { data: { user: stato.utenteCookie }, error: null }
          : { data: { user: null }, error: new Error("nessuna sessione") },
    },
  }),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async (token: string) => {
        const utente = stato.tokenValidi.get(token);
        return utente ? { data: { user: utente }, error: null } : { data: { user: null }, error: new Error("jwt expired") };
      },
    },
  }),
}));

const { GET, POST } = await import("./route");

function richiesta(corpo: unknown, intestazioni: Record<string, string> = {}) {
  return new Request("https://bleo.example/api/racconta", {
    method: "POST",
    headers: { "content-type": "application/json", ...intestazioni },
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

async function leggi(risposta: Response) {
  return { stato: risposta.status, corpo: (await risposta.json()) as Record<string, unknown> };
}

const chiaveConnessione = () => chiaveLimite("racconto", IP, SEGRETO);
const chiaveAccount = (id: string) => chiaveLimiteUtente("racconto", id, SEGRETO);

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://progetto.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_prova");
  vi.stubEnv("SUPABASE_SECRET_KEY", SEGRETO);
  vi.stubEnv("ANTHROPIC_MODEL_RACCONTO", "");
  stato.anthropic = true;
  stato.limiti = [];
  stato.consentita = true;
  stato.erroreLimite = null;
  stato.intestazioni = new Headers({ "x-nf-client-connection-ip": IP });
  stato.utenteCookie = null;
  stato.tokenValidi = new Map([[JWT, UTENTE]]);
  stato.chiamateClaude = [];
  stato.rispostaClaude = { stop_reason: "end_turn", parsed_output: OUTPUT, model: "claude-haiku-5-5" };
});

describe("GET /api/racconta", () => {
  it("dice se la funzione è attiva: servono Claude e la chiave segreta per il limite", async () => {
    expect(await leggi(await GET())).toEqual({ stato: 200, corpo: { attiva: true } });

    stato.anthropic = false;
    expect((await leggi(await GET())).corpo).toEqual({ attiva: false });

    stato.anthropic = true;
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect((await leggi(await GET())).corpo).toEqual({ attiva: false });
  });

  it("non si mette in cache", async () => {
    expect((await GET()).headers.get("cache-control")).toBe("no-store");
  });
});

describe("POST /api/racconta: richieste non valide", () => {
  it("senza Claude (modalità demo) dice che la funzione non è attiva, senza contare il limite", async () => {
    stato.anthropic = false;
    expect(await leggi(await POST(richiesta({ testo: TESTO })))).toEqual({
      stato: 503,
      corpo: { messaggio: MESSAGGI_RACCONTO.nonAttivo },
    });
    expect(stato.limiti).toEqual([]);
  });

  it("rifiuta tipo, JSON e testo non validi prima del limite e di Claude", async () => {
    const sbagliato = new Request("https://bleo.example/api/racconta", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: TESTO,
    });
    expect((await POST(sbagliato)).status).toBe(415);
    expect((await POST(richiesta("{non json"))).status).toBe(400);
    expect(await leggi(await POST(richiesta({ testo: "breve" })))).toEqual({
      stato: 400,
      corpo: { messaggio: MESSAGGI_RACCONTO.testoCorto },
    });
    expect(await leggi(await POST(richiesta({ testo: "a".repeat(LUNGHEZZA_MASSIMA_RACCONTO + 1) })))).toEqual({
      stato: 400,
      corpo: { messaggio: MESSAGGI_RACCONTO.testoLungo },
    });
    expect(stato.limiti).toEqual([]);
    expect(stato.chiamateClaude).toEqual([]);
  });
});

describe("POST /api/racconta: limite delle richieste", () => {
  it("senza accesso conta per connessione, con lo stesso limite di sempre", async () => {
    const { stato: codice, corpo } = await leggi(await POST(richiesta({ testo: TESTO })));
    expect(codice).toBe(200);
    expect(corpo).toEqual({
      bozza: { attivita: "digitale_creativo", cantone: "TI", impiego: "parziale", permesso: "svizzero_c" },
      riassunto: OUTPUT.riassunto,
    });
    expect(stato.limiti).toEqual([
      {
        chiave: chiaveConnessione(),
        massimo: LIMITI_RICHIESTE.racconto.massimo,
        finestra: LIMITI_RICHIESTE.racconto.finestraSecondi,
      },
    ]);
  });

  it("con il token dell'app (Bearer) conta per account, con lo stesso limite", async () => {
    expect((await POST(richiesta({ testo: TESTO }, { authorization: `Bearer ${JWT}` }))).status).toBe(200);
    expect(stato.limiti).toEqual([
      {
        chiave: chiaveAccount(UTENTE.id),
        massimo: LIMITI_RICHIESTE.racconto.massimo,
        finestra: LIMITI_RICHIESTE.racconto.finestraSecondi,
      },
    ]);
    expect(stato.limiti[0].chiave.startsWith("racconto:u:")).toBe(true);
  });

  it("con l'accesso al sito (cookie) conta per account anche lì", async () => {
    stato.utenteCookie = UTENTE;
    expect((await POST(richiesta({ testo: TESTO }))).status).toBe(200);
    expect(stato.limiti.map((l) => l.chiave)).toEqual([chiaveAccount(UTENTE.id)]);
  });

  it("un token scaduto, falso o scritto male non apre un limite nuovo: conta per connessione", async () => {
    stato.utenteCookie = UTENTE; // con un'intestazione Authorization non si ripiega sui cookie
    for (const autorizzazione of [
      "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWxzbyJ9.ZmFsc28",
      "Bearer niente",
      "Token qualcosa",
      "",
    ]) {
      expect((await POST(richiesta({ testo: TESTO }, { authorization: autorizzazione }))).status).toBe(200);
    }
    expect(stato.limiti.map((l) => l.chiave)).toEqual(Array(4).fill(chiaveConnessione()));
  });

  it("senza Supabase pubblico (modalità demo) non prova a leggere l'accesso", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect((await POST(richiesta({ testo: TESTO }, { authorization: `Bearer ${JWT}` }))).status).toBe(200);
    expect(stato.limiti.map((l) => l.chiave)).toEqual([chiaveConnessione()]);
  });

  it("al limite superato risponde 429 senza chiamare Claude, con o senza accesso", async () => {
    stato.consentita = false;
    expect(await leggi(await POST(richiesta({ testo: TESTO })))).toEqual({
      stato: 429,
      corpo: { messaggio: MESSAGGI_RACCONTO.troppeRichieste },
    });
    expect((await POST(richiesta({ testo: TESTO }, { authorization: `Bearer ${JWT}` }))).status).toBe(429);
    expect(stato.chiamateClaude).toEqual([]);
  });

  it("se il limite non si può verificare rifiuta la richiesta (ogni chiamata a Claude costa)", async () => {
    stato.erroreLimite = { code: "57014", message: "timeout" };
    expect(await leggi(await POST(richiesta({ testo: TESTO })))).toEqual({
      stato: 503,
      corpo: { messaggio: MESSAGGI_RACCONTO.occupato },
    });

    stato.erroreLimite = null;
    stato.intestazioni = new Headers(); // IP sconosciuto
    expect((await POST(richiesta({ testo: TESTO }))).status).toBe(503);

    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect((await POST(richiesta({ testo: TESTO }, { authorization: `Bearer ${JWT}` }))).status).toBe(503);
    expect(stato.chiamateClaude).toEqual([]);
  });
});

describe("POST /api/racconta: Claude", () => {
  it("manda il racconto tra i segnaposto con il modello di «Racconta a Bleo»", async () => {
    vi.stubEnv("ANTHROPIC_MODEL_RACCONTO", "claude-modello-di-prova");
    await POST(richiesta({ testo: `  ${TESTO}  ` }));
    const [chiamata] = stato.chiamateClaude;
    expect(chiamata.parametri.model).toBe("claude-modello-di-prova");
    expect(chiamata.parametri.messages).toEqual([{ role: "user", content: `<racconto>\n${TESTO}\n</racconto>` }]);
  });

  it("se Claude rifiuta o la risposta non si legge, dice che non ha capito", async () => {
    stato.rispostaClaude = { stop_reason: "refusal", parsed_output: null, model: "claude-haiku-5-5" };
    expect(await leggi(await POST(richiesta({ testo: TESTO })))).toEqual({
      stato: 502,
      corpo: { messaggio: MESSAGGI_RACCONTO.nonCapito },
    });
  });
});
