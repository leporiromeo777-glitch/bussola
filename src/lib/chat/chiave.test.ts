import { describe, expect, it } from "vitest";
import { chiaveAnthropic } from "./chiave";

describe("chiaveAnthropic", () => {
  it("senza chiave la chat resta in modalità demo", () => {
    expect(chiaveAnthropic({})).toBeNull();
    expect(chiaveAnthropic({ ANTHROPIC_API_KEY: "  " })).toBeNull();
  });

  it("usa la chiave impostata da noi", () => {
    expect(chiaveAnthropic({ ANTHROPIC_API_KEY: "sk-ant-nostra" })).toBe("sk-ant-nostra");
    expect(
      chiaveAnthropic({ ANTHROPIC_API_KEY: "sk-ant-nostra", ANTHROPIC_BASE_URL: "https://api.anthropic.com/" }),
    ).toBe("sk-ant-nostra");
    // La chiave del gateway c'è sempre su Netlify, ma non conta se la nostra è diversa.
    expect(chiaveAnthropic({ ANTHROPIC_API_KEY: "sk-ant-nostra", NETLIFY_AI_GATEWAY_KEY: "gw-123" })).toBe(
      "sk-ant-nostra",
    );
  });

  it("ignora la chiave messa dall'AI Gateway di Netlify", () => {
    expect(
      chiaveAnthropic({
        ANTHROPIC_API_KEY: "gw-123",
        ANTHROPIC_BASE_URL: "https://bussola-ticino.netlify.app/.netlify/ai",
        NETLIFY_AI_GATEWAY_KEY: "gw-123",
      }),
    ).toBeNull();
    expect(chiaveAnthropic({ ANTHROPIC_API_KEY: "gw-123", NETLIFY_AI_GATEWAY_KEY: "gw-123" })).toBeNull();
    expect(
      chiaveAnthropic({ ANTHROPIC_API_KEY: "qualcosa", ANTHROPIC_BASE_URL: "https://gateway.example/anthropic" }),
    ).toBeNull();
  });
});
