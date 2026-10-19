import { describe, expect, it } from "vitest";
import { AVVISO, immaginiPost, POST_SOCIAL } from "@/data/social";
import {
  didascalia,
  LIMITI_DIDASCALIA,
  linkListaAttesa,
  oggiInSvizzera,
  PIATTAFORME,
  testiAlternativi,
  testoLinkedIn,
} from "./post";

const SITO = "https://bleo.example.ch";
const post = POST_SOCIAL.find((p) => p.id === "registro-di-commercio")!;

describe("oggiInSvizzera", () => {
  it("usa il giorno di Zurigo, non quello UTC", () => {
    // 23:30 UTC del 20 ottobre è già il 21 in Svizzera (UTC+2 in estate).
    expect(oggiInSvizzera(new Date("2026-10-20T23:30:00Z"))).toBe("2026-10-21");
    // 23:30 UTC del 20 novembre è il 21 anche in inverno (UTC+1).
    expect(oggiInSvizzera(new Date("2026-11-20T23:30:00Z"))).toBe("2026-11-21");
    expect(oggiInSvizzera(new Date("2026-11-20T22:30:00Z"))).toBe("2026-11-20");
  });
});

describe("linkListaAttesa", () => {
  it("porta alla lista d'attesa con la provenienza", () => {
    expect(linkListaAttesa(SITO, "facebook")).toBe("https://bleo.example.ch/lista-attesa?utm_source=facebook");
    expect(linkListaAttesa(`${SITO}/`, "linkedin")).toBe("https://bleo.example.ch/lista-attesa?utm_source=linkedin");
  });
});

describe("testoLinkedIn", () => {
  it("mette la barra davanti ai caratteri riservati", () => {
    expect(testoLinkedIn("LAINF (art. 4) #1 a_b")).toBe("LAINF \\(art. 4\\) \\#1 a\\_b");
    expect(testoLinkedIn("@[x]{y}<z>|*~\\")).toBe("\\@\\[x\\]\\{y\\}\\<z\\>\\|\\*\\~\\\\");
    expect(testoLinkedIn("Niente da cambiare: CHF 100'000, «sì».")).toBe("Niente da cambiare: CHF 100'000, «sì».");
  });
});

describe("didascalia", () => {
  it("ha testo, fonti con il link e data di controllo, avviso, invito e hashtag", () => {
    const testo = didascalia(post, "facebook", SITO);
    expect(testo.startsWith(post.testo)).toBe(true);
    expect(testo).toContain("Fonti (controllate il 15.10.2026):");
    for (const f of post.fonti) expect(testo).toContain(f.url);
    expect(testo).toContain(AVVISO);
    expect(testo).toContain(`${SITO}/lista-attesa?utm_source=facebook`);
    expect(testo.split("\n").at(-1)).toBe("#Ticino #DittaIndividuale #MettersiInProprio #RegistroDiCommercio #Svizzera");
  });

  it("su Instagram rimanda al link nella bio", () => {
    const testo = didascalia(post, "instagram", SITO);
    expect(testo).toContain("Iscriviti alla lista d'attesa: link nella bio.");
    expect(testo).not.toContain("/lista-attesa");
  });

  it("su LinkedIn protegge i caratteri riservati ma non gli hashtag", () => {
    const testo = didascalia(post, "linkedin", SITO);
    expect(testo).toContain("utm\\_source=linkedin");
    expect(testo).not.toMatch(/[^\\][()]/);
    expect(testo.split("\n").at(-1)).toMatch(/^#Ticino /);
  });

  it("resta nei limiti di ogni social per tutti i post", () => {
    for (const p of POST_SOCIAL) {
      for (const piattaforma of PIATTAFORME) {
        expect(didascalia(p, piattaforma, SITO).length, `${p.id} su ${piattaforma}`).toBeLessThanOrEqual(
          LIMITI_DIDASCALIA[piattaforma],
        );
      }
    }
  });
});

describe("testiAlternativi", () => {
  it("descrive ogni immagine, compresa quella finale", () => {
    for (const p of POST_SOCIAL) {
      const testi = testiAlternativi(p);
      expect(testi.length, p.id).toBe(immaginiPost(p).length);
      for (const t of testi) expect(t.length).toBeGreaterThan(0);
    }
    expect(testiAlternativi(post)[0]).toBe("Registro di commercio: Devo iscrivermi al registro di commercio?");
  });
});
