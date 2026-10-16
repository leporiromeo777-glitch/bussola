/**
 * Prepara i file di una lezione in video/public/<id>/ prima del render:
 * copia gli audio delle scene, fa il loop avanti e indietro del video di
 * Bleo che parla, copia le immagini della mascotte e misura le durate.
 *
 *   npm run prepara -- <id-lezione> <cartella-con-i-file>
 *
 * Nella cartella servono: i file audio delle scene (come in src/lezioni/<id>.ts)
 * e clip-parla.mp4 (Bleo che parla, senza audio). Serve ffmpeg nel PATH.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { trovaLezione } from "../src/lezioni";
import type { Durate } from "../src/lezioni/tipi";

const QUI = dirname(fileURLToPath(import.meta.url));
const VIDEO = resolve(QUI, "..");
const MASCOTTE = ["festa.webp", "bussolina.webp"];
const CLIP_SORGENTE = "clip-parla.mp4";

const [id, cartella] = process.argv.slice(2);
if (!id || !cartella) {
  console.error("Uso: npm run prepara -- <id-lezione> <cartella-con-i-file>");
  process.exit(1);
}
const lezione = trovaLezione(id);
const sorgente = resolve(cartella);
const destinazione = join(VIDEO, "public", lezione.id);
mkdirSync(destinazione, { recursive: true });

function richiedi(nome: string): string {
  const percorso = join(sorgente, nome);
  if (!existsSync(percorso)) {
    console.error(`Manca ${nome} in ${sorgente}`);
    process.exit(1);
  }
  return percorso;
}

function ffprobe(file: string, ...argomenti: string[]): string {
  return execFileSync("ffprobe", ["-v", "error", ...argomenti, "-of", "csv=p=0", file], { encoding: "utf8" }).trim();
}

function durata(file: string): number {
  return Number(ffprobe(file, "-show_entries", "format=duration"));
}

/** Le pause della voce, con silencedetect di ffmpeg. */
function pause(file: string): [number, number][] {
  // silencedetect scrive i risultati su stderr.
  const { stderr } = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", file, "-af", "silencedetect=noise=-35dB:d=0.12", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const inizi = [...stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const fini = [...stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return inizi.map((a, i) => [arrotonda(a), arrotonda(fini[i] ?? durata(file))]);
}

function arrotonda(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// 1. Audio delle scene.
const scene = lezione.scene.map((scena) => {
  const file = richiedi(scena.audio);
  copyFileSync(file, join(destinazione, scena.audio));
  return { audio: scena.audio, durata: arrotonda(durata(file)), pause: pause(file) };
});

// 2. Bleo che parla: avanti e poi indietro, così il loop non ha salti.
const clip = richiedi(CLIP_SORGENTE);
const fotogrammi = Number(ffprobe(clip, "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames"));
const uscitaClip = join(destinazione, lezione.clip);
execFileSync(
  "ffmpeg",
  [
    "-v", "error", "-y", "-i", clip,
    "-filter_complex",
    // Il primo e l'ultimo fotogramma del pezzo al contrario si tolgono: sono già nel pezzo in avanti.
    `[0:v]split[a][b];[b]reverse,trim=start_frame=1:end_frame=${fotogrammi - 1},setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1:a=0[v]`,
    "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
    uscitaClip,
  ],
  { stdio: "inherit" },
);

// 3. Immagini della mascotte, dal sito.
mkdirSync(join(VIDEO, "public", "mascotte"), { recursive: true });
for (const nome of MASCOTTE) {
  copyFileSync(join(VIDEO, "..", "public", "mascotte", nome), join(VIDEO, "public", "mascotte", nome));
}

const durate: Durate = { clip: arrotonda(durata(uscitaClip)), scene };
writeFileSync(join(destinazione, "durate.json"), `${JSON.stringify(durate, null, 2)}\n`);

const voce = scene.reduce((s, x) => s + x.durata, 0);
console.log(`Pronto: ${destinazione}`);
console.log(`${scene.length} scene, voce ${voce.toFixed(2)} s, clip in loop ${durate.clip.toFixed(2)} s.`);
