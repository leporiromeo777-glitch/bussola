import { describe, expect, it } from "vitest";
import { LUNGHEZZA_MASSIMA_TOKEN, leggiAutorizzazione } from "./bearer";

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJhLWRpLXByb3Zh";

describe("leggiAutorizzazione", () => {
  it("senza intestazione vale la sessione con i cookie", () => {
    expect(leggiAutorizzazione(null)).toEqual({ tipo: "cookie" });
    expect(leggiAutorizzazione(undefined)).toEqual({ tipo: "cookie" });
  });

  it("legge il token Bearer, con maiuscole e spazi qualsiasi", () => {
    expect(leggiAutorizzazione(`Bearer ${JWT}`)).toEqual({ tipo: "bearer", token: JWT });
    expect(leggiAutorizzazione(`bearer   ${JWT} `)).toEqual({ tipo: "bearer", token: JWT });
    expect(leggiAutorizzazione(`BEARER\t${JWT}`)).toEqual({ tipo: "bearer", token: JWT });
  });

  it("un'intestazione presente ma sbagliata non ripiega sui cookie", () => {
    for (const valore of [
      "",
      "Bearer",
      "Bearer ",
      `Basic ${JWT}`,
      JWT,
      `Bearer ${JWT} altro`,
      "Bearer non-un-jwt",
      "Bearer a.b",
      "Bearer a.b.c.d",
      "Bearer a+b.c/d.e=",
    ]) {
      expect(leggiAutorizzazione(valore), valore).toEqual({ tipo: "non_valida" });
    }
  });

  it("rifiuta token troppo lunghi", () => {
    const lungo = `a.${"b".repeat(LUNGHEZZA_MASSIMA_TOKEN)}.c`;
    expect(leggiAutorizzazione(`Bearer ${lungo}`)).toEqual({ tipo: "non_valida" });
  });
});
