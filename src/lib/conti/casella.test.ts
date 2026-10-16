import { describe, expect, it } from "vitest";
import {
  LUNGHEZZA_TOKEN,
  dominioRicezione,
  indirizzoCasella,
  indirizzoNudo,
  nuovoToken,
  tokenDaDestinatari,
  tokenValido,
} from "./casella";

const TOKEN = "k3m7q2xw5vbn4hjd6tyrz2pqaa";

describe("token", () => {
  it("è lungo, casuale e in base32 minuscolo", () => {
    const token = nuovoToken();
    expect(token).toHaveLength(LUNGHEZZA_TOKEN);
    expect(LUNGHEZZA_TOKEN).toBeGreaterThanOrEqual(20);
    expect(tokenValido(token)).toBe(true);
    expect(token).toMatch(/^[a-z2-7]+$/);
    expect(new Set(Array.from({ length: 50 }, () => nuovoToken())).size).toBe(50);
  });

  it("usa tutti i 32 caratteri in modo uniforme", () => {
    const tutti = nuovoToken((b) => b.map((_, i) => i * 8 + 3));
    expect(tutti).toBe("dlt3dlt3dlt3dlt3dlt3dlt3dl");
    expect(nuovoToken((b) => b.fill(255))).toBe("7".repeat(LUNGHEZZA_TOKEN));
  });
});

describe("dominio e indirizzo", () => {
  it("legge il dominio di ricezione", () => {
    expect(dominioRicezione(" Abc123.Resend.App ")).toBe("abc123.resend.app");
    expect(dominioRicezione("@ricevute.bleo.ch")).toBe("ricevute.bleo.ch");
    expect(dominioRicezione("")).toBeNull();
    expect(dominioRicezione(undefined)).toBeNull();
    expect(dominioRicezione("non un dominio")).toBeNull();
  });

  it("compone l'indirizzo", () => {
    expect(indirizzoCasella(TOKEN, "abc123.resend.app")).toBe(`ricevute-${TOKEN}@abc123.resend.app`);
  });

  it("toglie il nome davanti all'indirizzo", () => {
    expect(indirizzoNudo("Mario Rossi <Mario.Rossi@Gmail.com>")).toBe("mario.rossi@gmail.com");
    expect(indirizzoNudo("info@shop.ch")).toBe("info@shop.ch");
    expect(indirizzoNudo("niente")).toBeNull();
  });
});

describe("tokenDaDestinatari", () => {
  const dominio = "abc123.resend.app";

  it("trova la casella anche se nel «To» c'è il destinatario originale (inoltro di Gmail)", () => {
    expect(tokenDaDestinatari(["mario@gmail.com", `ricevute-${TOKEN}@${dominio}`], dominio)).toBe(TOKEN);
    expect(tokenDaDestinatari([`Bleo <RICEVUTE-${TOKEN.toUpperCase()}@ABC123.resend.app>`], dominio)).toBe(TOKEN);
  });

  it("ignora altri domini, altri prefissi e token non validi", () => {
    expect(tokenDaDestinatari([`ricevute-${TOKEN}@altro.resend.app`], dominio)).toBeNull();
    expect(tokenDaDestinatari([`fatture-${TOKEN}@${dominio}`], dominio)).toBeNull();
    expect(tokenDaDestinatari([`ricevute-corto@${dominio}`], dominio)).toBeNull();
    expect(tokenDaDestinatari([`ricevute-${TOKEN}0@${dominio}`], dominio)).toBeNull();
    expect(tokenDaDestinatari([42, null], dominio)).toBeNull();
  });
});
