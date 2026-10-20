/**
 * Fa il video verticale (Reel) del post del giorno, da pubblicare insieme al
 * carosello (scripts/social/pubblica.ts nella cartella principale):
 *
 *   npm run reel                  il post di oggi (ora svizzera; SOCIAL_DATA=AAAA-MM-GG per un altro giorno)
 *   npm run reel -- <id-post>     un post preciso
 *
 * Scrive out/reel-<id>.mp4: H.264 1080×1920 a 30 fps, con una traccia audio
 * muta (AAC 48 kHz: Facebook la vuole), come chiedono i Reel di Instagram e
 * Facebook. Servono curl, ffmpeg e python3
 * con Pillow e NumPy (vedi scripts/risorse.ts). Il browser è quello che
 * Remotion scarica da solo; per usarne un altro: REMOTION_BROWSER=/percorso/di/chrome.
 */
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { POST_SOCIAL, postDelGiorno } from "../../src/data/social";
import { scaricaCaratteri } from "./caratteri";
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

const uscita = join(VIDEO, "out", `reel-${post.id}.mp4`);
mkdirSync(dirname(uscita), { recursive: true });
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const serveUrl = await bundle({ entryPoint: join(VIDEO, "src", "index.ts") });
const inputProps = { postId: post.id, clip };
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
