import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGGI_NOME_DITTA } from "@/lib/nome-ditta/proposte";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));

const UTENTE = "5e1a7c3b-2d4f-4a6b-9c8d-0e1f2a3b4c5d";

const stato = vi.hoisted(() => ({
  anthropic: true,
  admin: true,
  supabase: true,
  esitoLimite: "consentita" as "consentita" | "superato" | "non_disponibile",
  limiti: [] as { ambito: string; utenteId: string | null }[],
  chiamateClaude: 0,
  rispostaClaude: null as unknown,
  zefix: [] as string[],
  accessiLetti: 0,
}));

vi.mock("@/lib/chat/server", () => ({
  anthropicConfigurato: () => stato.anthropic,
  creaClientAnthropic: () =>
    stato.anthropic
      ? {
          beta: {
            messages: {
              parse: async () => {
                stato.chiamateClaude += 1;
                return stato.rispostaClaude;
              },
            },
          },
        }
      : null,
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => (stato.admin ? {} : null) }));
vi.mock("@/lib/supabase/env", () => ({ supabaseConfigured: () => stato.supabase }));
vi.mock("@/lib/supabase/richiesta", () => ({
  utenteDaRichiesta: async (request: Request) => {
    stato.accessiLetti += 1;
    return request.headers.get("authorization") === "Bearer token-valido"
      ? { ok: true, supabase: {}, user: { id: UTENTE } }
      : { ok: false, motivo: "non_collegato" };
  },
}));
vi.mock("@/lib/limiti/server", () => ({
  controllaLimite: async (ambito: string, opzioni: { utenteId?: string | null } = {}) => {
    stato.limiti.push({ ambito, utenteId: opzioni.utenteId ?? null });
    return stato.esitoLimite;
  },
  richiestaConsentita: async (ambito: string, opzioni: { utenteId?: string | null } = {}) => {
    stato.limiti.push({ ambito, utenteId: opzioni.utenteId ?? null });
    return stato.esitoLimite !== "superato";
  },
}));
vi.mock("@/lib/nome-ditta/zefix", async (originale) => ({
  ...(await originale<typeof import("@/lib/nome-ditta/zefix")>()),
  cercaSuZefix: async (nome: string) => {
    stato.zefix.push(nome);
    return { stato: "nessuno" };
  },
}));

const proposte = await import("./route");
const verifica = await import("./verifica/route");

const CORPO = { cognome: "Rossi", attivita: "faccio torte su ordinazione", stile: "semplice" };

function richiesta(url: string, corpo: unknown, token?: string) {
  const intestazioni: Record<string, string> = { "content-type": "application/json" };
  if (token) intestazioni.authorization = `Bearer ${token}`;
  return new Request(`https://bleo.example${url}`, { method: "POST", headers: intestazioni, body: JSON.stringify(corpo) });
}

beforeEach(() => {
  stato.anthropic = true;
  stato.admin = true;
  stato.supabase = true;
  stato.esitoLimite = "consentita";
  stato.limiti = [];
  stato.chiamateClaude = 0;
  stato.zefix = [];
  stato.accessiLetti = 0;
  stato.rispostaClaude = {
    stop_reason: "end_turn",
    model: "modello-di-prova",
    parsed_output: {
      proposte: [
        { nome: "Torte Rossi", perche: "Dice subito cosa fai." },
        // Senza cognome e con una parola da società: si scartano.
        { nome: "Torte di Giulia", perche: "x" },
        { nome: "Rossi Torte SA", perche: "x" },
      ],
    },
  };
});

describe("GET /api/nome-ditta", () => {
  it("dice se le proposte sono attive", async () => {
    expect(await (await proposte.GET()).json()).toEqual({ attiva: true });
    stato.admin = false;
    expect(await (await proposte.GET()).json()).toEqual({ attiva: false });
    stato.admin = true;
    stato.anthropic = false;
    expect(await (await proposte.GET()).json()).toEqual({ attiva: false });
  });
});

describe("POST /api/nome-ditta", () => {
  it("senza accesso conta il limite per connessione e restituisce le proposte valide con il registro", async () => {
    const risposta = await proposte.POST(richiesta("/api/nome-ditta", CORPO));
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toEqual({
      proposte: [{ nome: "Torte Rossi", perche: "Dice subito cosa fai.", registro: { stato: "nessuno" } }],
    });
    expect(stato.limiti).toEqual([{ ambito: "nomeDitta", utenteId: null }]);
    expect(stato.zefix).toEqual(["Torte Rossi"]);
  });

  it("con il token dell'app conta il limite per account", async () => {
    const risposta = await proposte.POST(richiesta("/api/nome-ditta", CORPO, "token-valido"));
    expect(risposta.status).toBe(200);
    expect(stato.limiti).toEqual([{ ambito: "nomeDitta", utenteId: UTENTE }]);
  });

  it("con un token non valido conta per connessione, senza rifiutare", async () => {
    const risposta = await proposte.POST(richiesta("/api/nome-ditta", CORPO, "token-falso"));
    expect(risposta.status).toBe(200);
    expect(stato.limiti).toEqual([{ ambito: "nomeDitta", utenteId: null }]);
  });

  it("senza Supabase non cerca l'accesso", async () => {
    stato.supabase = false;
    await proposte.POST(richiesta("/api/nome-ditta", CORPO, "token-valido"));
    expect(stato.accessiLetti).toBe(0);
    expect(stato.limiti).toEqual([{ ambito: "nomeDitta", utenteId: null }]);
  });

  it("con il limite superato risponde 429 senza chiamare Claude", async () => {
    stato.esitoLimite = "superato";
    const risposta = await proposte.POST(richiesta("/api/nome-ditta", CORPO, "token-valido"));
    expect(risposta.status).toBe(429);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_NOME_DITTA.troppeRichieste });
    expect(stato.chiamateClaude).toBe(0);
  });

  it("se il limite non si può verificare rifiuta (ogni chiamata a Claude costa)", async () => {
    stato.esitoLimite = "non_disponibile";
    const risposta = await proposte.POST(richiesta("/api/nome-ditta", CORPO));
    expect(risposta.status).toBe(503);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_NOME_DITTA.occupato });
    expect(stato.chiamateClaude).toBe(0);
  });

  it("una richiesta non valida non conta nel limite", async () => {
    const risposta = await proposte.POST(richiesta("/api/nome-ditta", { cognome: "", attivita: "torte" }, "token-valido"));
    expect(risposta.status).toBe(400);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_NOME_DITTA.cognomeMancante });
    expect(stato.limiti).toEqual([]);
    expect(stato.accessiLetti).toBe(0);
  });

  it("senza Claude dice che non è attivo", async () => {
    stato.anthropic = false;
    const risposta = await proposte.POST(richiesta("/api/nome-ditta", CORPO));
    expect(risposta.status).toBe(503);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_NOME_DITTA.nonAttivo });
    expect(stato.limiti).toEqual([]);
  });
});

describe("POST /api/nome-ditta/verifica", () => {
  it("cerca nel registro e con il token conta per account", async () => {
    const risposta = await verifica.POST(richiesta("/api/nome-ditta/verifica", { nome: "Torte Rossi" }, "token-valido"));
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toEqual({ registro: { stato: "nessuno" } });
    expect(stato.limiti).toEqual([{ ambito: "zefix", utenteId: UTENTE }]);
  });

  it("senza accesso conta per connessione e funziona anche senza Claude", async () => {
    stato.anthropic = false;
    const risposta = await verifica.POST(richiesta("/api/nome-ditta/verifica", { nome: "Torte Rossi" }));
    expect(risposta.status).toBe(200);
    expect(stato.limiti).toEqual([{ ambito: "zefix", utenteId: null }]);
  });

  it("con troppi controlli risponde 429", async () => {
    stato.esitoLimite = "superato";
    const risposta = await verifica.POST(richiesta("/api/nome-ditta/verifica", { nome: "Torte Rossi" }, "token-valido"));
    expect(risposta.status).toBe(429);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_NOME_DITTA.troppiControlli });
    expect(stato.zefix).toEqual([]);
  });

  it("un nome vuoto non conta nel limite", async () => {
    const risposta = await verifica.POST(richiesta("/api/nome-ditta/verifica", { nome: " " }));
    expect(risposta.status).toBe(400);
    expect(stato.limiti).toEqual([]);
  });
});
