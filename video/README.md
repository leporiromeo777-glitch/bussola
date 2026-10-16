# Il corso di Bleo: le lezioni video

Ogni passo del percorso può avere una lezione di circa un minuto: Bleo parla,
accanto compare il punto chiave e sotto i sottotitoli. I video si fanno con
[Remotion](https://www.remotion.dev/) (React → MP4). Questo progetto è separato
dal sito: ha il suo `package.json` e non entra nel build di Next.

Il video finito, la copertina e i sottotitoli vanno in `public/corso/` del sito.
Gli audio e il video di Bleo **non** si salvano nel repository
(`video/public/` e `video/out/` sono in `.gitignore`).

Servono Node 22, `ffmpeg` e `curl`. La prima volta: `cd video && npm install`.

## Fare una nuova lezione

1. **Scrivi il testo** partendo dal passo in `src/data/passi.ts` e dalle sue
   fonti in `src/data/svizzera.ts`: niente cifre o scadenze a memoria.
   - Aggiungi la lezione in `src/data/corso.ts` (numero = posizione del passo
     nel percorso, titolo, fonti).
   - Crea `video/src/lezioni/<id-passo>.ts` sul modello di
     `ditta-individuale.ts`: una scena per frase, con `audio`, `testo` (il
     sottotitolo, sempre «Bleo») e `schermo` (il punto chiave a destra).
   - Aggiungi la lezione in `video/src/lezioni/index.ts`.
2. **Genera la voce** con Higgsfield (`text2speech_v2`, motore ElevenLabs, voce
   «Dylan»): un file MP3 per scena (`scena-1.mp3`, `scena-2.mp3`, …). Nel testo
   per la voce scrivi «Blìo» al posto di Bleo, così la pronuncia è giusta.
3. **Metti i file in una cartella** `video/sorgenti/<id-passo>/`: gli MP3 delle
   scene e `clip-parla.mp4` (Bleo che parla, quadrato, senza audio; lo stesso
   clip va bene per tutte le lezioni). Le sorgenti restano nel repository, così
   la lezione si può rifare quando cambia una regola. Esempio completo:
   `video/sorgenti/ditta-individuale/`. Poi:

   ```sh
   npm run prepara -- <id-passo> sorgenti/<id-passo>
   ```

   Lo script copia gli audio in `video/public/<id-passo>/`, fa il loop avanti e
   indietro del video di Bleo, scarica i caratteri del sito (Plus Jakarta Sans e
   Geist) e misura durate e pause della voce in `durate.json`.
4. **Fai il render**:

   ```sh
   npm run render -- <id-passo>
   ```

   Scrive `public/corso/<id-passo>.mp4` (H.264, CRF 23), `.jpg` (copertina) e
   `.vtt` (sottotitoli con gli stessi tempi del video), e stampa la durata:
   aggiornala in `durataSecondi` in `src/data/corso.ts` (il test lo controlla).

Per vedere e ritoccare la lezione dal browser: `npm run studio`.

## Come funziona

- La durata di ogni scena è quella del suo audio più una breve pausa
  (`src/tempi.ts`). Le frasi lunghe diventano due sottotitoli, divisi nella pausa
  della voce più vicina.
- Scene vicine con lo stesso elenco (`tipo: "elenco"`) condividono la scheda:
  ogni scena aggiunge un punto.
- Alla fine c'è la scheda «Prossimo passo» con il titolo del passo seguente in
  `src/data/passi.ts`.
- Il browser per il render è quello che Remotion scarica da solo. Per usarne un
  altro: `REMOTION_BROWSER=/percorso/di/chrome npm run render -- <id-passo>`.
- Controlli: `npm run typecheck`.
