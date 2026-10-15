import { describe, expect, it } from "vitest";
import { DESTINAZIONE_PREDEFINITA, destinazioneInterna } from "./destinazione";

describe("destinazioneInterna", () => {
  it.each([
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\\evil%2Ecom",
    "/\\1572395042",
    "/\\/evil.com",
    "//evil.com",
    "///evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    " /percorso",
    null,
    undefined,
    42,
  ])("rifiuta %j e torna al questionario", (valore) => {
    expect(destinazioneInterna(valore)).toBe(DESTINAZIONE_PREDEFINITA);
  });

  it("tiene i percorsi interni con query e ancora", () => {
    expect(destinazioneInterna("/percorso?x=1#a")).toBe("/percorso?x=1#a");
    expect(destinazioneInterna("/chat")).toBe("/chat");
    expect(destinazioneInterna("/")).toBe("/");
  });

  it("un backslash codificato due volte resta un percorso del nostro sito", () => {
    // searchParams.get decodifica una volta sola: %255C arriva come %5C e non è un backslash.
    expect(destinazioneInterna("/%5Cevil.com")).toBe("/%5Cevil.com");
    expect(new URL(destinazioneInterna("/%5Cevil.com"), "https://bussola.ch").host).toBe("bussola.ch");
  });

  it("normalizza i percorsi con punti senza uscire dal sito", () => {
    expect(destinazioneInterna("/a/../chat")).toBe("/chat");
  });

  it("accetta una destinazione predefinita diversa", () => {
    expect(destinazioneInterna("//evil.com", "/chat")).toBe("/chat");
  });
});
