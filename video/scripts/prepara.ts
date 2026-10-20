/**
 * Prepara i file di una lezione in video/public/<id>/ prima del render:
 * copia gli audio delle scene, fa il loop avanti e indietro del video di
 * Bleo che parla, copia le immagini della mascotte, scarica i caratteri e
 * misura le durate.
 *
 *   npm run prepara -- <id-lezione> <cartella-con-i-file>
 *
 * Nella cartella servono: i file audio delle scene (come in src/lezioni/<id>.ts)
 * e clip-parla.mp4 (Bleo che parla, senza audio). Servono ffmpeg e curl nel PATH.
 *
 * Per lo stile «presentatore» prepara anche, una volta per tutte le lezioni,
 * Bleo presentatore con lo sfondo trasparente (da sorgenti/presentatore/) e
 * la bussolina tagliata a pezzi (scripts/taglia-bussolina.py, serve python3
 * con Pillow e NumPy).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { trovaLezione } from "../src/lezioni";
import type { Durate } from "../src/lezioni/tipi";
import { CLIP_PRESENTATORE } from "../src/presentatore/clip";
import { scaricaCaratteri } from "./caratteri";

const QUI = dirname(fileURLToPath(import.meta.url));
const VIDEO = resolve(QUI, "..");
const MASCOTTE = ["festa.webp", "bussolina.webp"];
const CLIP_SORGENTE = "clip-parla.mp4";
/** Bleo presentatore su sfondo trasparente (VP9 con alfa): saluta, poi indica a destra. */
const PRESENTATORE_SORGENTE = join(VIDEO, "sorgenti", "presentatore", "bleo-presentatore-alpha.webm");
/** Primo fotogramma in cui Bleo indica già a destra: da qui parte il loop. */
const TAGLIO_PRESENTATORE = 56;

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

// 3b. La bussolina tagliata a pezzi per animarla come un burattino (stile «presentatore»).
const tagli = spawnSync(
  "python3",
  [
    join(VIDEO, "scripts", "taglia-bussolina.py"),
    join(VIDEO, "public", "mascotte", "bussolina.webp"),
    join(VIDEO, "public", "bussolina"),
    join(VIDEO, "src", "presentatore", "pezzi-bussolina.json"),
  ],
  { stdio: "inherit" },
);
if (tagli.status !== 0) console.warn("Non sono riuscito a tagliare la bussolina (serve python3 con Pillow e NumPy).");

// 4. Caratteri (Plus Jakarta Sans e Geist), scaricati una volta sola.
scaricaCaratteri(VIDEO);

// 5. Bleo presentatore (stile «presentatore»): il saluto una volta, poi il
//    pezzo in cui indica, avanti e indietro. Il decoder libvpx-vp9 serve per
//    leggere il canale alfa; -auto-alt-ref 0 per poterlo scrivere.
function contaFotogrammi(file: string): number {
  return Number(ffprobe(file, "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames"));
}

function preparaPresentatore(): Durate["presentatore"] {
  if (!existsSync(PRESENTATORE_SORGENTE)) {
    console.warn(`Manca ${PRESENTATORE_SORGENTE}: lo stile «presentatore» non si può fare.`);
    return undefined;
  }
  const cartella = join(VIDEO, "public", CLIP_PRESENTATORE.cartella);
  mkdirSync(cartella, { recursive: true });
  const saluto = join(cartella, CLIP_PRESENTATORE.saluto);
  const indica = join(cartella, CLIP_PRESENTATORE.indica);
  const aggiornato = (f: string) => existsSync(f) && statSync(f).mtimeMs > statSync(PRESENTATORE_SORGENTE).mtimeMs;
  if (!aggiornato(saluto) || !aggiornato(indica)) {
    const totale = contaFotogrammi(PRESENTATORE_SORGENTE);
    const vp9 = ["-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", "-auto-alt-ref", "0", "-row-mt", "1"];
    const ffmpeg = (filtro: string, uscita: string) =>
      execFileSync(
        "ffmpeg",
        ["-v", "error", "-y", "-c:v", "libvpx-vp9", "-i", PRESENTATORE_SORGENTE, "-filter_complex", filtro, "-map", "[v]", ...vp9, uscita],
        { stdio: "inherit" },
      );
    // Il ritaglio sul verde lascia un filo scuro sul bordo: si toglie stringendo
    // l'alfa di un pixel (erosion) e ammorbidendolo appena.
    const bordo = "format=yuva420p,split[c][m];[m]alphaextract,erosion,gblur=sigma=0.7[a];[c][a]alphamerge,format=yuva420p[v]";
    ffmpeg(`[0:v]trim=end_frame=${TAGLIO_PRESENTATORE},setpts=PTS-STARTPTS,${bordo}`, saluto);
    // Come per clip-parla: il primo e l'ultimo fotogramma del pezzo al contrario si tolgono.
    ffmpeg(
      `[0:v]trim=start_frame=${TAGLIO_PRESENTATORE},setpts=PTS-STARTPTS,split[a][b];` +
        `[b]reverse,trim=start_frame=1:end_frame=${totale - TAGLIO_PRESENTATORE - 1},setpts=PTS-STARTPTS[r];` +
        `[a][r]concat=n=2:v=1:a=0,${bordo}`,
      indica,
    );
  }
  const [num, den] = ffprobe(saluto, "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate").split("/").map(Number);
  return { fps: num / (den || 1), saluto: contaFotogrammi(saluto), indica: contaFotogrammi(indica) };
}

const durate: Durate = { clip: arrotonda(durata(uscitaClip)), presentatore: preparaPresentatore(), scene };
writeFileSync(join(destinazione, "durate.json"), `${JSON.stringify(durate, null, 2)}\n`);

const voce = scene.reduce((s, x) => s + x.durata, 0);
console.log(`Pronto: ${destinazione}`);
console.log(`${scene.length} scene, voce ${voce.toFixed(2)} s, clip in loop ${durate.clip.toFixed(2)} s.`);
if (durate.presentatore) {
  const { fps, saluto, indica } = durate.presentatore;
  console.log(`Presentatore: saluto ${(saluto / fps).toFixed(2)} s, loop ${(indica / fps).toFixed(2)} s.`);
}
