import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { POST_SOCIAL } from "@/data/social";
import { numeroInParole, perLaVoce, testiVoce, testoVoceScheda, VOCE_CHIUSURA } from "./voce";

describe("numeroInParole", () => {
  it.each([
    [0, "zero"],
    [21, "ventuno"],
    [23, "ventitré"],
    [28, "ventotto"],
    [108, "centotto"],
    [180, "centottanta"],
    [530, "cinquecentotrenta"],
    [541, "cinquecentoquarantuno"],
    [1000, "mille"],
    [2500, "duemila cinquecento"],
    [7373, "settemila trecentosettantatré"],
    [20_000, "ventimila"],
    [23_000, "ventitremila"],
    [36_288, "trentaseimila duecentottantotto"],
    [100_000, "centomila"],
    [500_000, "cinquecentomila"],
  ])("%i → %s", (n, parole) => {
    expect(numeroInParole(n)).toBe(parole);
  });

  it("rifiuta i numeri che non sa leggere", () => {
    expect(() => numeroInParole(1_000_000)).toThrow();
    expect(() => numeroInParole(2.5)).toThrow();
  });
});

describe("perLaVoce", () => {
  it("legge gli importi in parole e le sigle come si dicono", () => {
    expect(perLaVoce("Contributo AVS/AI/IPG: CHF 530 (minimo)")).toBe("Contributo a-vu-esse, a-i e i-pi-gi: cinquecentotrenta franchi");
    expect(perLaVoce("Normale: 8,1%")).toBe("Normale: 8 virgola 1 per cento");
    expect(perLaVoce("Ciao, sono Bleo")).toBe("Ciao, sono Blìo");
  });
});

describe("testiVoce", () => {
  it("una frase per scheda; nelle liste il titolo e ogni punto vanno a capo", () => {
    for (const post of POST_SOCIAL) {
      const testi = testiVoce(post);
      expect(testi).toHaveLength(post.schede.length);
      post.schede.forEach((scheda, i) => {
        if (scheda.tipo === "punti") expect(testi[i].split("\n")).toHaveLength(scheda.punti.length + 1);
      });
    }
  });

  it("niente che la voce legge male: CHF, cifre con l'apostrofo, Bleo, parentesi, virgolette", () => {
    for (const testo of [...POST_SOCIAL.flatMap(testiVoce), VOCE_CHIUSURA]) {
      expect(testo).not.toMatch(/CHF|\d'\d|\bBleo\b|BLEO|[()«»"]/);
    }
  });

  it("la cifra si legge in parole, attaccata al suo testo", () => {
    expect(testoVoceScheda({ tipo: "cifra", cifra: "CHF 100'000", testo: "di cifra d'affari: da qui è obbligatoria." })).toBe(
      "Centomila franchi di cifra d'affari: da qui è obbligatoria.",
    );
    expect(testoVoceScheda({ tipo: "cifra", cifra: "CHF 500'000", testo: "Sotto questa cifra basta poco." })).toBe(
      "Cinquecentomila franchi. Sotto questa cifra basta poco.",
    );
  });
});

describe("voci registrate (video/sorgenti/social)", () => {
  const cartella = "video/sorgenti/social";
  const voci = JSON.parse(readFileSync(`${cartella}/voci.json`, "utf8")) as Record<string, string>;

  it("ogni voce ha il suo file e il testo di adesso: se il post cambia, la voce va rifatta (social/README.md)", () => {
    for (const [file, testo] of Object.entries(voci)) {
      expect(existsSync(`${cartella}/${file}`), file).toBe(true);
      if (file === "chiusura.mp3") {
        expect(testo).toBe(VOCE_CHIUSURA);
        continue;
      }
      const [id, nome] = file.split("/");
      const post = POST_SOCIAL.find((p) => p.id === id);
      expect(post, `${file}: post sconosciuto`).toBeDefined();
      expect(testo, `${file}: il testo del post è cambiato, rifai la voce`).toBe(testiVoce(post!)[Number(nome.slice(0, 2)) - 1]);
    }
  });
});
