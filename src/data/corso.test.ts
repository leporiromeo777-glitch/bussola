import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { approfondimentoPerId, durataBreve, LEZIONI, lezionePerPasso, tuttiIVideo } from "./corso";
import { eIdPasso, PASSI } from "./passi";

const PUBLIC = join(__dirname, "..", "..", "public");

/** Durata di un MP4 in secondi, dal box mvhd. */
function durataMp4(file: Buffer): number {
  const i = file.indexOf("mvhd");
  if (i === -1) throw new Error("mvhd non trovato");
  const o = i + 4;
  if (file[o] === 1) return Number(file.readBigUInt64BE(o + 24)) / file.readUInt32BE(o + 20);
  return file.readUInt32BE(o + 16) / file.readUInt32BE(o + 12);
}

describe("il corso di Bleo", () => {
  it("ogni lezione spiega un passo che esiste, nell'ordine del percorso", () => {
    expect(LEZIONI.length).toBeGreaterThan(0);
    for (const l of LEZIONI) {
      expect(eIdPasso(l.passoId)).toBe(true);
      expect(l.numero).toBe(PASSI.findIndex((p) => p.id === l.passoId) + 1);
      expect(lezionePerPasso(l.passoId)).toBe(l);
    }
    expect(new Set(LEZIONI.map((l) => l.passoId)).size).toBe(LEZIONI.length);
  });

  it("ogni video cita fonti ufficiali; quelle di una lezione sono anche fonti del suo passo", () => {
    for (const { passoId, video: l } of tuttiIVideo()) {
      expect(l.fonti.length).toBeGreaterThan(0);
      for (const f of l.fonti) expect(f.url).toMatch(/^https:\/\//);
      expect(l.verificatoIl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Un video facoltativo approfondisce un tema: le sue fonti possono andare oltre il passo.
      if (!LEZIONI.some((lezione) => lezione === l)) continue;
      const passo = PASSI.find((p) => p.id === passoId)!;
      for (const f of l.fonti) expect(passo.fonti.map((x) => x.url), `${l.titolo}: ${f.titolo}`).toContain(f.url);
    }
  });

  it("i video facoltativi hanno un id unico, che comincia con il passo, e file con lo stesso nome", () => {
    const ids = LEZIONI.flatMap((l) => (l.approfondimenti ?? []).map((a) => a.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of LEZIONI) {
      for (const a of l.approfondimenti ?? []) {
        expect(a.id.startsWith(`${l.passoId}-`)).toBe(true);
        expect(a.video).toBe(`/corso/${a.id}.mp4`);
        expect(approfondimentoPerId(a.id)).toEqual({ lezione: l, approfondimento: a });
      }
    }
    expect(approfondimentoPerId("non-esiste")).toBeUndefined();
  });

  it("video, copertina e sottotitoli esistono in public/", () => {
    for (const { video: l } of tuttiIVideo()) {
      expect(l.video).toMatch(/^\/corso\/.+\.mp4$/);
      expect(l.poster).toMatch(/^\/corso\/.+\.jpg$/);
      expect(l.sottotitoli).toMatch(/^\/corso\/.+\.vtt$/);
      for (const percorso of [l.video, l.poster, l.sottotitoli]) {
        expect(existsSync(join(PUBLIC, percorso)), percorso).toBe(true);
      }
    }
  });

  // Legge tutti i video (centinaia di MB): con il disco occupato da un render ci mette più dei 5 s di default.
  it("la durata scritta è quella del video, e il video parte subito (moov prima di mdat)", { timeout: 60_000 }, () => {
    for (const { video: l } of tuttiIVideo()) {
      const file = readFileSync(join(PUBLIC, l.video));
      expect(Math.round(durataMp4(file))).toBe(l.durataSecondi);
      expect(file.indexOf("moov")).toBeLessThan(file.indexOf("mdat"));
    }
  });

  it("i sottotitoli sono WebVTT e finiscono prima della fine del video", () => {
    for (const { video: l } of tuttiIVideo()) {
      const vtt = readFileSync(join(PUBLIC, l.sottotitoli), "utf8");
      expect(vtt.startsWith("WEBVTT")).toBe(true);
      const fini = [...vtt.matchAll(/--> (\d{2}):(\d{2}):(\d{2}\.\d{3})/g)].map(
        ([, h, m, s]) => Number(h) * 3600 + Number(m) * 60 + Number(s),
      );
      expect(fini.length).toBeGreaterThan(0);
      expect(Math.max(...fini)).toBeLessThanOrEqual(l.durataSecondi + 0.5);
      // Il nome si scrive Bleo: «Blìo» è solo la pronuncia della voce.
      expect(vtt).not.toMatch(/Blìo|BLEO/);
    }
  });

  it("durataBreve", () => {
    expect(durataBreve(51.1)).toBe("51 s");
    expect(durataBreve(60)).toBe("1 min");
    expect(durataBreve(80)).toBe("1 min 20 s");
  });
});
