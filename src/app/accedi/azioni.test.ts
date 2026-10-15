import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ origin: "https://bussola.example" }) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const stato = vi.hoisted(() => ({
  supabase: null as null | { auth: { signInWithOtp: ReturnType<typeof vi.fn> } },
  consentita: true,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => stato.supabase }));
vi.mock("@/lib/limiti/server", () => ({ richiestaConsentita: async () => stato.consentita }));

const { inviaLinkAccesso } = await import("./azioni");
const { MESSAGGI_ACCESSO } = await import("@/lib/accesso/captcha");

function modulo(campi: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(campi)) form.set(k, v);
  return form;
}

let signInWithOtp: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.unstubAllEnvs();
  signInWithOtp = vi.fn(async () => ({ error: null }));
  stato.supabase = { auth: { signInWithOtp } };
  stato.consentita = true;
});

describe("inviaLinkAccesso", () => {
  it("dopo un'email non valida ripresenta quello che era scritto e conta il tentativo", async () => {
    const esito = await inviaLinkAccesso({ stato: "iniziale" }, modulo({ email: "mario@gmailcom" }));
    expect(esito).toEqual({
      stato: "errore",
      messaggio: "Inserisci un indirizzo email valido.",
      email: "mario@gmailcom",
      emailNonValida: true,
      tentativo: 1,
    });
    const ancora = await inviaLinkAccesso(esito, modulo({ email: "mario@" }));
    expect(ancora.tentativo).toBe(2);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("in modalità demo lo dice senza termini tecnici e tiene l'email", async () => {
    stato.supabase = null;
    const esito = await inviaLinkAccesso({ stato: "iniziale" }, modulo({ email: "mario@example.ch" }));
    expect(esito).toMatchObject({
      stato: "errore",
      messaggio: "L'accesso non è ancora disponibile su questo sito.",
      email: "mario@example.ch",
    });
    expect(esito.emailNonValida).toBeUndefined();
  });

  it("manda il link solo verso un percorso del sito, anche con un next malevolo", async () => {
    const esito = await inviaLinkAccesso({ stato: "iniziale" }, modulo({ email: "mario@example.ch", next: "/\\evil.com" }));
    expect(esito).toEqual({ stato: "inviato" });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "mario@example.ch",
      options: { emailRedirectTo: "https://bussola.example/auth/conferma?next=%2Fquestionario" },
    });
  });

  it("oltre il limite per connessione non chiede il link a Supabase", async () => {
    stato.consentita = false;
    const esito = await inviaLinkAccesso({ stato: "iniziale" }, modulo({ email: "mario@example.ch" }));
    expect(esito).toMatchObject({ stato: "errore", messaggio: MESSAGGI_ACCESSO.troppeRichieste });
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("con Turnstile attivo serve il token, che poi passa a Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "0x4AAA");
    const senza = await inviaLinkAccesso({ stato: "iniziale" }, modulo({ email: "mario@example.ch" }));
    expect(senza).toMatchObject({ stato: "errore", messaggio: MESSAGGI_ACCESSO.captchaMancante });
    expect(signInWithOtp).not.toHaveBeenCalled();

    const con = await inviaLinkAccesso(
      { stato: "iniziale" },
      modulo({ email: "mario@example.ch", next: "/chat", "cf-turnstile-response": "token-1" }),
    );
    expect(con).toEqual({ stato: "inviato" });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "mario@example.ch",
      options: { emailRedirectTo: "https://bussola.example/auth/conferma?next=%2Fchat", captchaToken: "token-1" },
    });
  });

  it("un captcha rifiutato da Supabase ha il suo messaggio", async () => {
    signInWithOtp.mockResolvedValueOnce({ error: { code: "captcha_failed", message: "captcha protection" } });
    const esito = await inviaLinkAccesso({ stato: "iniziale" }, modulo({ email: "mario@example.ch" }));
    expect(esito).toMatchObject({ stato: "errore", messaggio: MESSAGGI_ACCESSO.captchaNonValido });
  });
});
