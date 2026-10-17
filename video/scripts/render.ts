/**
 * Fa il video di una lezione e i file per il sito:
 *
 *   npm run render -- <id-lezione> [classico|presentatore]
 *
 * Scrive in public/corso/ del sito: <id>.mp4, <id>.jpg (copertina) e <id>.vtt
 * (sottotitoli). Prima serve npm run prepara (vedi README.md).
 * Con uno stile diverso da quello della lezione è una prova: i file restano
 * in video/out/ (<id>-<stile>.*) e il sito non cambia.
 * Il browser è quello che Remotion scarica da solo; per usarne un altro:
 * REMOTION_BROWSER=/percorso/di/chrome npm run render -- <id-lezione>
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lezionePerPasso } from "../../src/data/corso";
import { trovaLezione } from "../src/lezioni";
import { STILI, type Durate, type StileLezione } from "../src/lezioni/tipi";
import { calcolaTempi, formattaVtt, FPS } from "../src/tempi";

const QUI = dirname(fileURLToPath(import.meta.url));
const VIDEO = resolve(QUI, "..");
const SITO = join(VIDEO, "..", "public", "corso");
const OUT = join(VIDEO, "out");
const REMOTION = join(VIDEO, "node_modules", ".bin", "remotion");
/** Copertina: il titolo è entrato e Bleo sorride con gli occhi aperti (vedi `copertina` in src/Lezione.tsx). */
const SECONDI_COPERTINA: Record<StileLezione, number> = { classico: 2, presentatore: 2.5, lavagna: 2.5, misto: 2.5 };

const [id, stileRichiesto] = process.argv.slice(2);
if (!id || (stileRichiesto && !STILI.includes(stileRichiesto as StileLezione))) {
  console.error(`Uso: npm run render -- <id-lezione> [${STILI.join("|")}]`);
  process.exit(1);
}
const lezione = trovaLezione(id);
const proprio = lezione.stile ?? "classico";
const stile = (stileRichiesto as StileLezione | undefined) ?? proprio;
/** Lo stile della lezione va sul sito; l'altro è solo una prova in video/out/. */
const pubblica = stile === proprio;
const composizione = pubblica ? lezione.id : `${lezione.id}-${stile}`;
const fileDurate = join(VIDEO, "public", lezione.id, "durate.json");
if (!existsSync(fileDurate)) {
  console.error(`Manca ${fileDurate}: lancia prima npm run prepara -- ${lezione.id} <cartella>.`);
  process.exit(1);
}
const durate = JSON.parse(readFileSync(fileDurate, "utf8")) as Durate;
const tempi = calcolaTempi(lezione, durate);
mkdirSync(OUT, { recursive: true });
mkdirSync(SITO, { recursive: true });

// REMOTION_BROWSER, se c'è, lo legge remotion.config.ts.
const remotion = (...argomenti: string[]) => execFileSync(REMOTION, argomenti, { cwd: VIDEO, stdio: "inherit" });

const mp4 = join(OUT, `${composizione}.mp4`);
const jpg = join(OUT, `${composizione}.jpg`);
const vtt = join(OUT, `${composizione}.vtt`);

remotion("render", "src/index.ts", composizione, mp4);
remotion(
  "still",
  "src/index.ts",
  composizione,
  jpg,
  `--frame=${Math.round(SECONDI_COPERTINA[stile] * FPS)}`,
  `--props=${JSON.stringify({ copertina: true })}`,
  "--image-format=jpeg",
  "--jpeg-quality=85",
);
writeFileSync(vtt, formattaVtt(tempi.battute));

if (pubblica) for (const file of [mp4, jpg, vtt]) copyFileSync(file, join(SITO, file.split("/").at(-1)!));

const secondi = Number(
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], { encoding: "utf8" }),
);
const mb = (f: string) => (statSync(f).size / 1024 / 1024).toFixed(2);
console.log(pubblica ? `\nFatto: public/corso/${lezione.id}.{mp4,jpg,vtt}` : `\nProva (sito non toccato): video/out/${composizione}.{mp4,jpg,vtt}`);
console.log(`Durata ${secondi.toFixed(2)} s, video ${mb(mp4)} MB, copertina ${mb(jpg)} MB.`);

const corso = lezionePerPasso(lezione.id);
if (pubblica && corso && corso.durataSecondi !== Math.round(secondi)) {
  console.warn(`Attenzione: in src/data/corso.ts durataSecondi è ${corso.durataSecondi}, il video dura ${Math.round(secondi)} s.`);
}
