import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { RESEND_ENDPOINT, creaInvioEmail, emailConfigurata } = await import("./resend");

const messaggio = {
  a: "giulia@example.ch",
  oggetto: "Conferma",
  html: "<p>Ciao</p>",
  testo: "Ciao",
  intestazioni: { "List-Unsubscribe": "<https://bussola.example/x>" },
  chiaveIdempotenza: "lista-attesa-conferma/abc",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("creaInvioEmail", () => {
  it("è null se manca la chiave o il mittente", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_MITTENTE", "Bussola <ciao@bussola.example>");
    expect(creaInvioEmail()).toBeNull();
    expect(emailConfigurata()).toBe(false);

    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_MITTENTE", "");
    expect(creaInvioEmail()).toBeNull();
  });

  it("chiama l'API REST di Resend con il formato previsto", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_MITTENTE", "Bussola <ciao@bussola.example>");
    const fetchFinto = vi.fn(async () => new Response(JSON.stringify({ id: "1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchFinto);

    const invia = creaInvioEmail();
    expect(emailConfigurata()).toBe(true);
    expect(await invia!(messaggio)).toBe(true);

    expect(fetchFinto).toHaveBeenCalledOnce();
    const [url, init] = fetchFinto.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(RESEND_ENDPOINT);
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer re_test",
      "Content-Type": "application/json",
      "Idempotency-Key": "lista-attesa-conferma/abc",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      from: "Bussola <ciao@bussola.example>",
      to: "giulia@example.ch",
      subject: "Conferma",
      html: "<p>Ciao</p>",
      text: "Ciao",
      headers: { "List-Unsubscribe": "<https://bussola.example/x>" },
    });
  });

  it("restituisce false (senza lanciare) se Resend risponde con un errore o la rete cade", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_MITTENTE", "Bussola <ciao@bussola.example>");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 422 })));
    expect(await creaInvioEmail()!(messaggio)).toBe(false);

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    expect(await creaInvioEmail()!(messaggio)).toBe(false);

    expect(JSON.stringify(log.mock.calls)).not.toContain("giulia@example.ch");
  });
});
