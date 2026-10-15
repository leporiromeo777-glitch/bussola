import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { dettagliErrore, messaggioErrore } from "./errori";
import { MESSAGGI } from "./messaggi";

const intestazioni = new Headers({ "request-id": "req_123" });

describe("messaggioErrore", () => {
  it("traduce gli errori dell'API in messaggi italiani, senza testo grezzo", () => {
    expect(messaggioErrore(new Anthropic.RateLimitError(429, {}, "rate limited", intestazioni))).toBe(
      MESSAGGI.troppeRichieste,
    );
    expect(messaggioErrore(new Anthropic.AuthenticationError(401, {}, "invalid x-api-key", intestazioni))).toBe(
      MESSAGGI.configurazioneErrata,
    );
    expect(messaggioErrore(new Anthropic.InternalServerError(529, {}, "overloaded", intestazioni))).toBe(
      MESSAGGI.servizioOccupato,
    );
    expect(messaggioErrore(new Anthropic.BadRequestError(400, {}, "bad", intestazioni))).toBe(MESSAGGI.erroreGenerico);
    expect(messaggioErrore(new Anthropic.APIConnectionError({ message: "ECONNRESET" }))).toBe(MESSAGGI.connessione);
    expect(messaggioErrore(new Error("boom"))).toBe(MESSAGGI.erroreGenerico);
  });

  it("restituisce null se la richiesta è stata interrotta da chi chiedeva", () => {
    expect(messaggioErrore(new Anthropic.APIUserAbortError())).toBeNull();
    expect(messaggioErrore(Object.assign(new Error("aborted"), { name: "AbortError" }))).toBeNull();
  });
});

describe("dettagliErrore", () => {
  it("per i log tiene tipo, stato e request id", () => {
    expect(dettagliErrore(new Anthropic.RateLimitError(429, {}, "x", intestazioni))).toEqual({
      tipo: "RateLimitError",
      status: 429,
      request_id: "req_123",
    });
  });
});
