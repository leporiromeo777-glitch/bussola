import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJhLWRpLXByb3Zh";
const UTENTE = { id: "11111111-1111-1111-1111-111111111111" };

const stato = vi.hoisted(() => ({
  clientCookie: null as unknown,
  getUserBearer: null as unknown as ReturnType<typeof vi.fn>,
  creati: [] as { url: string; chiave: string; opzioni: unknown }[],
}));
vi.mock("./server", () => ({ createClient: async () => stato.clientCookie }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: (url: string, chiave: string, opzioni: unknown) => {
    stato.creati.push({ url, chiave, opzioni });
    return { auth: { getUser: stato.getUserBearer } };
  },
}));

const { utenteDaRichiesta } = await import("./richiesta");

function richiesta(authorization?: string) {
  return new Request("https://bussola.example/api/chat", {
    method: "POST",
    headers: authorization === undefined ? {} : { authorization },
  });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://progetto.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_prova");
  stato.creati = [];
  stato.getUserBearer = vi.fn(async () => ({ data: { user: UTENTE }, error: null }));
  stato.clientCookie = { auth: { getUser: async () => ({ data: { user: UTENTE }, error: null }) } };
});

describe("utenteDaRichiesta", () => {
  it("senza Authorization usa la sessione con i cookie, come prima", async () => {
    const esito = await utenteDaRichiesta(richiesta());
    expect(esito).toEqual({ ok: true, supabase: stato.clientCookie, user: UTENTE });
    expect(stato.creati).toEqual([]);
  });

  it("con i cookie ma senza sessione: non collegato", async () => {
    stato.clientCookie = { auth: { getUser: async () => ({ data: { user: null }, error: new Error("no") }) } };
    expect(await utenteDaRichiesta(richiesta())).toEqual({ ok: false, motivo: "non_collegato" });
  });

  it("con il token Bearer: client con la chiave pubblica e il JWT, token verificato da Supabase Auth", async () => {
    const esito = await utenteDaRichiesta(richiesta(`Bearer ${JWT}`));
    expect(esito.ok && esito.user).toEqual(UTENTE);
    expect(stato.getUserBearer).toHaveBeenCalledWith(JWT);
    expect(stato.creati).toEqual([
      {
        url: "https://progetto.supabase.co",
        chiave: "sb_publishable_prova",
        opzioni: {
          global: { headers: { Authorization: `Bearer ${JWT}` } },
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        },
      },
    ]);
  });

  it("un token scaduto o falso non passa, e non si ripiega sui cookie", async () => {
    stato.getUserBearer = vi.fn(async () => ({ data: { user: null }, error: new Error("jwt expired") }));
    expect(await utenteDaRichiesta(richiesta(`Bearer ${JWT}`))).toEqual({ ok: false, motivo: "non_collegato" });
    expect(await utenteDaRichiesta(richiesta("Bearer niente"))).toEqual({ ok: false, motivo: "non_collegato" });
  });

  it("senza Supabase configurato: modalità demo, in entrambi i modi", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    stato.clientCookie = null;
    expect(await utenteDaRichiesta(richiesta())).toEqual({ ok: false, motivo: "non_configurato" });
    expect(await utenteDaRichiesta(richiesta(`Bearer ${JWT}`))).toEqual({ ok: false, motivo: "non_configurato" });
    expect(stato.creati).toEqual([]);
  });
});
