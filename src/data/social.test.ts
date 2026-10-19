import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PASSI } from "./passi";
import { HASHTAG_COMUNI, immaginiPost, POST_SOCIAL, postDelGiorno } from "./social";
import {
  aliquoteIva,
  avsIndipendenti,
  chf,
  datiStrumenti,
  percentuale,
  pilastro3a,
  regole,
  regolePercorso,
  supplementiTicino,
  tasseRegistroCommercio,
} from "./svizzera";

const SOCIAL = join(__dirname, "..", "..", "social");

/** Tutti i numeri contenuti nei dati ufficiali, a qualsiasi profondità. */
function numeri(valore: unknown): number[] {
  if (typeof valore === "number") return [valore];
  if (Array.isArray(valore)) return valore.flatMap(numeri);
  if (valore && typeof valore === "object") return Object.values(valore).flatMap(numeri);
  return [];
}

const DATI = [
  regole,
  aliquoteIva,
  tasseRegistroCommercio,
  avsIndipendenti,
  supplementiTicino,
  pilastro3a,
  regolePercorso,
  datiStrumenti,
];
const AMMESSI = new Set(
  numeri(DATI).flatMap((n) => [chf(n), chf(n, 2), percentuale(n, 0), percentuale(n), percentuale(n, 2)]),
);

function testi(post: (typeof POST_SOCIAL)[number]): string[] {
  return [
    post.testo,
    ...post.schede.flatMap((s) =>
      s.tipo === "copertina" ? [s.occhiello, s.titolo] : s.tipo === "punti" ? [s.titolo, ...s.punti] : [s.cifra, s.testo],
    ),
  ];
}

describe("il piano editoriale dei social", () => {
  it("ha un post al giorno, senza buchi", () => {
    expect(POST_SOCIAL.length).toBeGreaterThan(0);
    POST_SOCIAL.forEach((post, i) => {
      expect(post.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (i > 0) {
        const giorno = new Date(`${POST_SOCIAL[i - 1].data}T12:00:00Z`);
        giorno.setUTCDate(giorno.getUTCDate() + 1);
        expect(post.data, post.id).toBe(giorno.toISOString().slice(0, 10));
      }
      expect(postDelGiorno(post.data)).toBe(post);
    });
    expect(postDelGiorno("2000-01-01")).toBeUndefined();
  });

  it("gli id sono unici e vanno bene come nome di cartella", () => {
    for (const post of POST_SOCIAL) expect(post.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(POST_SOCIAL.map((p) => p.id)).size).toBe(POST_SOCIAL.length);
  });

  it("le schede stanno in un carosello: copertina, poi da 1 a 8 schede da 4 punti al massimo", () => {
    for (const post of POST_SOCIAL) {
      const [prima, ...altre] = post.schede;
      expect(prima.tipo, post.id).toBe("copertina");
      expect(altre.length, post.id).toBeGreaterThanOrEqual(1);
      // Con l'immagine finale: al massimo 10, il limite dei caroselli di Instagram.
      expect(immaginiPost(post).length, post.id).toBeLessThanOrEqual(10);
      for (const scheda of altre) {
        expect(scheda.tipo, post.id).not.toBe("copertina");
        if (scheda.tipo === "punti") {
          expect(scheda.punti.length, post.id).toBeGreaterThanOrEqual(1);
          expect(scheda.punti.length, post.id).toBeLessThanOrEqual(4);
          for (const punto of scheda.punti) expect(punto.length, punto).toBeLessThanOrEqual(110);
        }
      }
    }
  });

  it("le fonti sono ufficiali e, se il post spiega un passo, sono fonti di quel passo", () => {
    for (const post of POST_SOCIAL) {
      expect(post.fonti.length, post.id).toBeGreaterThan(0);
      for (const f of post.fonti) expect(f.url).toMatch(/^https:\/\//);
      expect(post.verificatoIl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (!post.passoId) continue;
      const passo = PASSI.find((p) => p.id === post.passoId);
      expect(passo, post.id).toBeDefined();
      for (const f of post.fonti) expect(passo!.fonti.map((x) => x.url), `${post.id}: ${f.titolo}`).toContain(f.url);
    }
  });

  it("ogni importo in CHF e ogni percentuale vengono dai dati ufficiali", () => {
    for (const post of POST_SOCIAL) {
      for (const testo of testi(post)) {
        for (const importo of testo.match(/CHF [\d']+(\.\d{2})?/g) ?? []) expect(AMMESSI, `${post.id}: ${importo}`).toContain(importo);
        for (const p of testo.match(/\d+(,\d+)?%/g) ?? []) expect(AMMESSI, `${post.id}: ${p}`).toContain(p);
      }
    }
  });

  it("il nome si scrive Bleo, mai BLEO", () => {
    for (const post of POST_SOCIAL) {
      for (const testo of testi(post)) expect(testo).not.toMatch(/BLEO|bleo/);
    }
  });

  it("al massimo 5 hashtag per post, senza doppioni", () => {
    for (const post of POST_SOCIAL) {
      const tutti = [...HASHTAG_COMUNI, ...post.hashtag];
      expect(tutti.length, post.id).toBeLessThanOrEqual(5);
      expect(new Set(tutti.map((h) => h.toLowerCase())).size, post.id).toBe(tutti.length);
      for (const h of tutti) expect(h).toMatch(/^#[\p{L}\d]+$/u);
    }
  });

  it("le immagini di ogni post sono in social/<id>/, e nessuna cartella è di troppo", () => {
    for (const post of POST_SOCIAL) {
      for (const nome of immaginiPost(post)) {
        expect(existsSync(join(SOCIAL, post.id, nome)), `social/${post.id}/${nome}`).toBe(true);
      }
      const file = readdirSync(join(SOCIAL, post.id)).filter((f) => f.endsWith(".jpg"));
      expect(file.sort(), post.id).toEqual(immaginiPost(post));
    }
    const cartelle = readdirSync(SOCIAL, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
    expect(cartelle.sort()).toEqual(POST_SOCIAL.map((p) => p.id).sort());
  });
});
