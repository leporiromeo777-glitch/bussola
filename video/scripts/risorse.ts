/**
 * I file di Bleo presentatore e della bussolina in video/public/, comuni alle
 * lezioni (scripts/prepara.ts) e ai video dei social (scripts/reel.ts).
 * Servono ffmpeg/ffprobe e python3 con Pillow e NumPy.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Durate } from "../src/lezioni/tipi";
import { CLIP_PRESENTATORE } from "../src/presentatore/clip";

/** Primo fotogramma in cui Bleo indica già a destra: da qui parte il loop. */
const TAGLIO_PRESENTATORE = 56;

export function ffprobe(file: string, ...argomenti: string[]): string {
  return execFileSync("ffprobe", ["-v", "error", ...argomenti, "-of", "csv=p=0", file], { encoding: "utf8" }).trim();
}

function contaFotogrammi(file: string): number {
  return Number(ffprobe(file, "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames"));
}

/** La durata di un file audio o video, in secondi. */
export function durataSecondi(file: string): number {
  return Number(ffprobe(file, "-show_entries", "format=duration"));
}

/** Le pause di una voce ([inizio, fine] in secondi), con silencedetect di ffmpeg. */
export function pauseVoce(file: string, soglia = "-30dB", minima = 0.08): [number, number][] {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", `silencedetect=noise=${soglia}:d=${minima}`, "-f", "null", "-"], {
    encoding: "utf8",
  });
  const inizi = [...r.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const fini = [...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return inizi.map((a, i): [number, number] => [a, fini[i] ?? a]);
}

/** Copia in public/mascotte/ le immagini della mascotte del sito. */
export function copiaMascotte(video: string, nomi: readonly string[]) {
  mkdirSync(join(video, "public", "mascotte"), { recursive: true });
  for (const nome of nomi) copyFileSync(join(video, "..", "public", "mascotte", nome), join(video, "public", "mascotte", nome));
}

/**
 * La bussolina tagliata a pezzi per animarla come un burattino (stile
 * «presentatore»), in public/bussolina/. Restituisce false se non riesce.
 */
export function tagliaBussolina(video: string): boolean {
  copiaMascotte(video, ["bussolina.webp"]);
  const tagli = spawnSync(
    "python3",
    [
      join(video, "scripts", "taglia-bussolina.py"),
      join(video, "public", "mascotte", "bussolina.webp"),
      join(video, "public", "bussolina"),
      join(video, "src", "presentatore", "pezzi-bussolina.json"),
    ],
    { stdio: "inherit" },
  );
  if (tagli.status !== 0) console.warn("Non sono riuscito a tagliare la bussolina (serve python3 con Pillow e NumPy).");
  return tagli.status === 0;
}

/**
 * Bleo presentatore: il saluto una volta, poi il pezzo in cui indica, avanti
 * e indietro. Il decoder libvpx-vp9 serve per leggere il canale alfa;
 * -auto-alt-ref 0 per poterlo scrivere. Restituisce i fotogrammi dei due pezzi.
 */
export function preparaPresentatore(video: string): Durate["presentatore"] {
  const sorgente = join(video, "sorgenti", "presentatore", "bleo-presentatore-alpha.webm");
  if (!existsSync(sorgente)) {
    console.warn(`Manca ${sorgente}: lo stile «presentatore» non si può fare.`);
    return undefined;
  }
  const cartella = join(video, "public", CLIP_PRESENTATORE.cartella);
  mkdirSync(cartella, { recursive: true });
  const saluto = join(cartella, CLIP_PRESENTATORE.saluto);
  const indica = join(cartella, CLIP_PRESENTATORE.indica);
  const aggiornato = (f: string) => existsSync(f) && statSync(f).mtimeMs > statSync(sorgente).mtimeMs;
  if (!aggiornato(saluto) || !aggiornato(indica)) {
    const totale = contaFotogrammi(sorgente);
    const vp9 = ["-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", "-auto-alt-ref", "0", "-row-mt", "1"];
    const ffmpeg = (filtro: string, uscita: string) =>
      execFileSync(
        "ffmpeg",
        ["-v", "error", "-y", "-c:v", "libvpx-vp9", "-i", sorgente, "-filter_complex", filtro, "-map", "[v]", ...vp9, uscita],
        { stdio: "inherit" },
      );
    // Il ritaglio sul verde lascia un filo scuro sul bordo: si toglie stringendo
    // l'alfa di un pixel (erosion) e ammorbidendolo appena.
    const bordo = "format=yuva420p,split[c][m];[m]alphaextract,erosion,gblur=sigma=0.7[a];[c][a]alphamerge,format=yuva420p[v]";
    ffmpeg(`[0:v]trim=end_frame=${TAGLIO_PRESENTATORE},setpts=PTS-STARTPTS,${bordo}`, saluto);
    // Il primo e l'ultimo fotogramma del pezzo al contrario si tolgono: sono già nel pezzo in avanti.
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
