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
   indietro del video di Bleo (e di Bleo presentatore, vedi sotto), copia le
   immagini della mascotte, scarica i caratteri del sito (Plus Jakarta Sans e
   Geist) e misura durate e pause della voce in `durate.json`.
4. **Fai il render**:

   ```sh
   npm run render -- <id-passo>
   ```

   Scrive `public/corso/<id-passo>.mp4` (H.264, CRF 23), `.jpg` (copertina) e
   `.vtt` (sottotitoli con gli stessi tempi del video), e stampa la durata:
   aggiornala in `durataSecondi` in `src/data/corso.ts` (il test lo controlla).

Per vedere e ritoccare la lezione dal browser: `npm run studio`.

## Due stili

Ogni lezione ha uno stile, `stile` in `video/src/lezioni/<id-passo>.ts`
(se manca: `"classico"`).

- **classico**: Bleo parla in una scheda arrotondata in alto a sinistra, il
  punto chiave compare a destra, i sottotitoli sotto.
- **presentatore**: Bleo in primo piano a sinistra, senza scheda, tagliato in
  vita, che indica a destra. Le schede (le stesse dello stile classico)
  compaiono accanto alla sua mano e le fa comparire la bussolina, il suo
  aiutante, animata solo con il codice (`src/presentatore/coreografia.ts`):
  arriva in volo e srotola il titolo, tocca i punti dell'elenco (con le
  stelline) e alza il cartellino «3», trema con l'ago che gira prima
  dell'avviso, spinge la scheda della fonte e fa sì con la testa. I
  sottotitoli sono una fascia più bassa sopra la pancia di Bleo.

Per ogni lezione c'è anche la composizione nell'altro stile,
`<id-passo>-<stile>` (per esempio `ditta-individuale-presentatore`). Per
provarla senza toccare il sito:

```sh
npm run render -- ditta-individuale presentatore
```

Scrive solo in `video/out/ditta-individuale-presentatore.{mp4,jpg,vtt}`. Per
pubblicare una lezione nello stile presentatore: `stile: "presentatore"` nei
dati della lezione, poi `npm run render -- <id-passo>`.

### Bleo presentatore (sfondo trasparente)

Il clip è in `video/sorgenti/presentatore/` e vale per tutte le lezioni: 6 s,
960×960, 24 fps. Bleo saluta (fino a ~2,3 s), poi abbassa la mano e indica a
destra con l'altro braccio. È stato generato una volta sola su verde croma
(`clip-presentatore-verde.mp4`), poi ritagliato con ffmpeg (VP9 con canale
alfa):

```sh
ffmpeg -i clip-presentatore-verde.mp4 -vf "chromakey=0x06A244:0.10:0.04,format=rgba,geq=r='r(X,Y)':g='min(g(X,Y),max(r(X,Y),b(X,Y)))':b='b(X,Y)':a='alpha(X,Y)',format=yuva420p" -c:v libvpx-vp9 -b:v 0 -crf 28 -auto-alt-ref 0 -row-mt 1 bleo-presentatore-alpha.webm
```

`npm run prepara` ne fa due pezzi in `video/public/presentatore/`:
`saluto.webm` (fotogrammi 0–55, si vede una volta) e `indica.webm` (dal
fotogramma 56, avanti e indietro, in loop). Stringe l'alfa di un pixel per
togliere il filo scuro lasciato dal ritaglio; nel video un'ombra morbida stacca
Bleo dal crema. Per leggere l'alfa ffmpeg deve usare il decoder `libvpx-vp9`
(`-c:v libvpx-vp9` prima di `-i`); Remotion lo mostra con
`<OffthreadVideo transparent>`.

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
