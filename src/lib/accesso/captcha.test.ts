import { describe, expect, it } from "vitest";
import { CAMPO_CAPTCHA, MESSAGGI_ACCESSO, leggiCaptcha, messaggioErroreInvio } from "./captcha";

function modulo(campi: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(campi)) form.set(k, v);
  return form;
}

describe("leggiCaptcha", () => {
  it("senza chiave del sito la verifica è spenta (modalità demo e sviluppo)", () => {
    expect(leggiCaptcha(modulo({}), undefined)).toEqual({ ok: true, token: undefined });
    expect(leggiCaptcha(modulo({}), "")).toEqual({ ok: true, token: undefined });
  });

  it("con la chiave del sito il token è obbligatorio", () => {
    expect(leggiCaptcha(modulo({}), "0x4AAA")).toEqual({ ok: false, messaggio: MESSAGGI_ACCESSO.captchaMancante });
    expect(leggiCaptcha(modulo({ [CAMPO_CAPTCHA]: "  " }), "0x4AAA").ok).toBe(false);
    expect(leggiCaptcha(modulo({ [CAMPO_CAPTCHA]: "token-turnstile" }), "0x4AAA")).toEqual({
      ok: true,
      token: "token-turnstile",
    });
  });
});

describe("messaggioErroreInvio", () => {
  it("spiega un captcha rifiutato e per il resto resta generico", () => {
    expect(messaggioErroreInvio("captcha_failed")).toBe(MESSAGGI_ACCESSO.captchaNonValido);
    expect(messaggioErroreInvio("over_email_send_rate_limit")).toBe(MESSAGGI_ACCESSO.invioNonRiuscito);
    expect(messaggioErroreInvio(undefined)).toBe(MESSAGGI_ACCESSO.invioNonRiuscito);
  });
});
