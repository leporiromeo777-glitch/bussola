import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGGI_TESTI } from "@/lib/testi/richiesta";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));

const UTENTE = "6f2b8d4c-3e5a-4b7c-8d9e-1f2a3b4c5d6e";

const stato = vi.hoisted(() => ({
  anthropic: true,
  admin: true,
  supabase: true,
  esitoLimite: "consentita" as "consentita" | "superato" | "non_disponibile",
  limiti: [] as { ambito: string; utenteId: string | null }[],
  chiamateClaude: 0,
  rispostaClaude: null as unknown,
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
  utenteDaRichiesta: async (request: Request) =>
    request.headers.get("authorization") === "Bearer token-valido"
      ? { ok: true, supabase: {}, user: { id: UTENTE } }
      : { ok: false, motivo: "non_collegato" },
}));
vi.mock("@/lib/limiti/server", () => ({
  controllaLimite: async (ambito: string, opzioni: { utenteId?: string | null } = {}) => {
    stato.limiti.push({ ambito, utenteId: opzioni.utenteId ?? null });
    return stato.esitoLimite;
  },
}));

const { GET, POST } = await import("./route");

const CORPO = { tipo: "breve", descrizione: "Riparo biciclette a Bellinzona.", tono: "amichevole" };

function richiesta(corpo: unknown, token?: string) {
  const intestazioni: Record<string, string> = { "content-type": "application/json" };
  if (token) intestazioni.authorization = `Bearer ${token}`;
  return new Request("https://bleo.example/api/testi", { method: "POST", headers: intestazioni, body: JSON.stringify(corpo) });
}

beforeEach(() => {
  stato.anthropic = true;
  stato.admin = true;
  stato.supabase = true;
  stato.esitoLimite = "consentita";
  stato.limiti = [];
  stato.chiamateClaude = 0;
  stato.rispostaClaude = {
    stop_reason: "end_turn",
    model: "modello-di-prova",
    parsed_output: {
      testi: [
        { titolo: "x", testo: "Riparo biciclette a Bellinzona." },
        { titolo: "y", testo: "Sono un meccanico di biciclette e lavoro a Bellinzona." },
      ],
    },
  };
});

describe("GET /api/testi", () => {
  it("dice se lo strumento è attivo", async () => {
    expect(await (await GET()).json()).toEqual({ attiva: true });
    stato.anthropic = false;
    expect(await (await GET()).json()).toEqual({ attiva: false });
    stato.anthropic = true;
    stato.admin = false;
    expect(await (await GET()).json()).toEqual({ attiva: false });
  });
});

describe("POST /api/testi", () => {
  it("con il token dell'app conta il limite per account e restituisce i testi con i nostri titoli", async () => {
    const risposta = await POST(richiesta(CORPO, "token-valido"));
    expect(risposta.status).toBe(200);
    expect(await risposta.json()).toEqual({
      testi: [
        { titolo: "In una frase", testo: "Riparo biciclette a Bellinzona." },
        { titolo: "In un paragrafo", testo: "Sono un meccanico di biciclette e lavoro a Bellinzona." },
      ],
    });
    expect(stato.limiti).toEqual([{ ambito: "testi", utenteId: UTENTE }]);
  });

  it("senza accesso o con un token non valido conta per connessione", async () => {
    await POST(richiesta(CORPO));
    await POST(richiesta(CORPO, "token-falso"));
    expect(stato.limiti).toEqual([
      { ambito: "testi", utenteId: null },
      { ambito: "testi", utenteId: null },
    ]);
  });

  it("con il limite superato risponde 429 senza chiamare Claude", async () => {
    stato.esitoLimite = "superato";
    const risposta = await POST(richiesta(CORPO, "token-valido"));
    expect(risposta.status).toBe(429);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_TESTI.troppeRichieste });
    expect(stato.chiamateClaude).toBe(0);
  });

  it("se il limite non si può verificare rifiuta", async () => {
    stato.esitoLimite = "non_disponibile";
    const risposta = await POST(richiesta(CORPO));
    expect(risposta.status).toBe(503);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_TESTI.occupato });
  });

  it("una descrizione troppo corta non conta nel limite", async () => {
    const risposta = await POST(richiesta({ ...CORPO, descrizione: "bici" }, "token-valido"));
    expect(risposta.status).toBe(400);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_TESTI.descrizioneCorta });
    expect(stato.limiti).toEqual([]);
  });

  it("senza Claude dice che non è attivo", async () => {
    stato.anthropic = false;
    const risposta = await POST(richiesta(CORPO));
    expect(risposta.status).toBe(503);
    expect(await risposta.json()).toEqual({ messaggio: MESSAGGI_TESTI.nonAttivo });
  });
});
