/**
 * Genera la voce di Bleo per le scene di una lezione con ElevenLabs: un MP3
 * per scena in sorgenti/<id-lezione>/, con il nome di `audio` della scena.
 *
 *   npm run voce -- <id-lezione> [numeri delle scene]
 *
 * Senza numeri rifà tutte le scene, con i numeri (per esempio `5 6`) solo
 * quelle. Serve la chiave in ELEVENLABS_API_KEY (permesso «Text to Speech»).
 * Voce, modello e impostazioni sono in src/voce.ts; il testo letto è quello
 * di testoPerVoce(). Poi: npm run prepara -- <id-lezione> sorgenti/<id-lezione>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { trovaLezione } from "../src/lezioni";
import { testoPerVoce, VOCE_BLEO } from "../src/voce";

const QUI = dirname(fileURLToPath(import.meta.url));
const VIDEO = resolve(QUI, "..");

const [id, ...numeri] = process.argv.slice(2);
if (!id) {
  console.error("Uso: npm run voce -- <id-lezione> [numeri delle scene]");
  process.exit(1);
}
const chiave = process.env.ELEVENLABS_API_KEY;
if (!chiave) {
  console.error("Manca ELEVENLABS_API_KEY.");
  process.exit(1);
}
const lezione = trovaLezione(id);
// Tutti i testi subito: se una scena ha cifre si ferma prima di spendere caratteri.
const testi = lezione.scene.map(testoPerVoce);
const scelte = numeri.length > 0 ? numeri.map(Number) : lezione.scene.map((_, i) => i + 1);
for (const n of scelte) {
  if (!Number.isInteger(n) || n < 1 || n > lezione.scene.length) {
    console.error(`Scena ${n} sconosciuta: la lezione ne ha ${lezione.scene.length}.`);
    process.exit(1);
  }
}

const cartella = join(VIDEO, "sorgenti", lezione.id);
mkdirSync(cartella, { recursive: true });
let caratteri = 0;
for (const n of scelte) {
  const i = n - 1;
  const risposta = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOCE_BLEO.voiceId}?output_format=${VOCE_BLEO.formato}`,
    {
      method: "POST",
      headers: { "xi-api-key": chiave, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: testi[i],
        model_id: VOCE_BLEO.modello,
        voice_settings: VOCE_BLEO.impostazioni,
        // Le frasi vicine aiutano a tenere lo stesso tono fra una scena e l'altra.
        previous_text: testi[i - 1],
        next_text: testi[i + 1],
      }),
    },
  );
  if (!risposta.ok) {
    console.error(`Scena ${n}: errore ${risposta.status} da ElevenLabs: ${await risposta.text()}`);
    process.exit(1);
  }
  const file = join(cartella, lezione.scene[i].audio);
  writeFileSync(file, Buffer.from(await risposta.arrayBuffer()));
  caratteri += Number(risposta.headers.get("character-cost") ?? 0);
  console.log(`Scena ${n}: ${file}`);
}
console.log(`Fatto, con la voce ${VOCE_BLEO.nome}. Caratteri conteggiati da ElevenLabs: ${caratteri}.`);
