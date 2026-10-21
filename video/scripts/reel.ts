/**
 * Fa il video verticale (Reel) del post del giorno, da pubblicare insieme al
 * carosello (scripts/social/pubblica.ts nella cartella principale):
 *
 *   npm run reel                  il post di oggi (ora svizzera; SOCIAL_DATA=AAAA-MM-GG per un altro giorno)
 *   npm run reel -- <id-post>     un post preciso
 *
 * Scrive out/reel-<id>.mp4: H.264 1080×1920 a 30 fps con audio AAC 48 kHz,
 * come chiedono i Reel di Instagram e Facebook. Musica ed effetti li fa
 * scripts/audio-reel.py, a tempo con le animazioni (suoniReel). Servono curl,
 * ffmpeg e python3 con Pillow e NumPy (vedi scripts/risorse.ts). Il browser è
 * quello che Remotion scarica da solo; per usarne un altro:
 * REMOTION_BROWSER=/percorso/di/chrome.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { POST_SOCIAL, postDelGiorno } from "../../src/data/social";
import { scaricaCaratteri } from "./caratteri";
import { FPS_REEL, pianoReel, suoniReel, tempiReel } from "../src/social/tempi-reel";
import { copiaMascotte, preparaPresentatore, tagliaBussolina } from "./risorse";

const QUI = dirname(fileURLToPath(import.meta.url));
const VIDEO = resolve(QUI, "..");

const [richiesto] = process.argv.slice(2);
const oggi = process.env.SOCIAL_DATA?.trim() || new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich" }).format(new Date());
const post = richiesto ? POST_SOCIAL.find((p) => p.id === richiesto) : postDelGiorno(oggi);
if (!post) {
  if (richiesto) {
    console.error(`Post sconosciuto: ${richiesto}. Gli id sono in src/data/social.ts.`);
    process.exit(1);
  }
  console.log(`Nessun post per il ${oggi}: niente video.`);
  process.exit(0);
}

// Caratteri, mascotte, bussolina a pezzi e Bleo presentatore in public/ prima del bundle, che li copia.
scaricaCaratteri(VIDEO);
copiaMascotte(VIDEO, ["bussolina.webp"]);
if (!tagliaBussolina(VIDEO)) process.exit(1);
const clip = preparaPresentatore(VIDEO) ?? null;

// Musica ed effetti in public/audio/ (anche questi prima del bundle). Se non
// riesce, il video esce muto invece di non uscire.
const tempi = tempiReel(post);
const suoni = { fps: FPS_REEL, fotogrammi: tempi.totale, seme: post.id, suoni: suoniReel(tempi, pianoReel(tempi)) };
const fileSuoni = join(VIDEO, "out", `suoni-${post.id}.json`);
const audio = `audio/reel-${post.id}.wav`;
mkdirSync(join(VIDEO, "out"), { recursive: true });
mkdirSync(join(VIDEO, "public", "audio"), { recursive: true });
writeFileSync(fileSuoni, JSON.stringify(suoni));
const sintesi = spawnSync("python3", [join(VIDEO, "scripts", "audio-reel.py"), fileSuoni, join(VIDEO, "public", audio)], {
  stdio: "inherit",
});
if (sintesi.status !== 0) console.warn("Non sono riuscito a fare l'audio (serve python3 con NumPy): il video esce muto.");

const uscita = join(VIDEO, "out", `reel-${post.id}.mp4`);
mkdirSync(dirname(uscita), { recursive: true });
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const serveUrl = await bundle({ entryPoint: join(VIDEO, "src", "index.ts") });
const inputProps = { postId: post.id, clip, audio: sintesi.status === 0 ? audio : null };
const composition = await selectComposition({ serveUrl, id: "reel", inputProps, browserExecutable });
await renderMedia({
  composition,
  serveUrl,
  inputProps,
  codec: "h264",
  crf: 20,
  pixelFormat: "yuv420p",
  imageFormat: "jpeg",
  jpegQuality: 92,
  enforceAudioTrack: true,
  audioBitrate: "128k",
  // Facebook vuole un fotogramma chiave almeno ogni 2-5 secondi.
  gopSize: composition.fps * 2,
  outputLocation: uscita,
  browserExecutable,
});
console.log(`Fatto: video/out/reel-${post.id}.mp4 (${(composition.durationInFrames / composition.fps).toFixed(1)} s)`);
