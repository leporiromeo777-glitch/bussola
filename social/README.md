# I post social di Bleo

Ogni giorno escono da soli e gratis due contenuti di Bleo: a pranzo un
**video** (Reel) su Instagram e sulla pagina Facebook, la sera un
**carosello** di immagini su Instagram, sulla pagina Facebook e sul profilo
LinkedIn. Poi Bleo legge le statistiche e scrive quali post vanno meglio e
perché ([`analisi.md`](analisi.md)).

- **I post** sono in [`src/data/social.ts`](../src/data/social.ts): un
  carosello al giorno, dal 21.10.2026 al 17.11.2026 (il primo giorno è
  `INIZIO_PIANO`: per spostare tutto basta cambiare quella data). I testi vengono dai passi
  del percorso, le cifre da `src/data/svizzera.ts`, ogni post ha le sue fonti
  ufficiali. I test (`npm test`) controllano che ogni importo in CHF e ogni
  percentuale venga dai dati.
- **Le immagini** sono in questa cartella, `social/<id-del-post>/01.jpg, 02.jpg, …`
  (JPEG 1080×1350). Le fa Remotion con i colori e i caratteri del sito:
  `cd video && npm run social`.
- **Il video** (1080×1920, circa 30 secondi) lo fa Remotion al momento,
  dalle stesse schede: Bleo presentatore saluta e indica, la bussolina
  entra, tocca i punti uno a uno e fa festa sulla cifra, mentre **Bleo legge
  le schede con la sua voce** (vedi sotto). Ogni scheda dura quanto la sua
  frase e ogni punto compare quando Bleo lo dice. Sotto, musica ed effetti
  fatti dal codice ([`video/scripts/audio-reel.py`](../video/scripts/audio-reel.py)):
  una marimba allegra e, a tempo con le animazioni, un soffio a ogni cambio
  di scheda, un «pop» per ogni punto, le scintille, il ticchettio della cifra
  che sale e una piccola festa. Volume finale -14 LUFS. In locale:
  `cd video && npm run reel -- <id-del-post>` (serve anche `ffmpeg` e Python
  con Pillow e NumPy). Composizione in
  [`video/src/social/Reel.tsx`](../video/src/social/Reel.tsx), tempi e mosse in
  [`tempi-reel.ts`](../video/src/social/tempi-reel.ts). Il video non va nel
  repository: GitHub lo tiene due settimane tra i file dell'esecuzione
  («Artifacts»).
- **La pubblicazione** la fa GitHub Actions
  ([`.github/workflows/social.yml`](../.github/workflows/social.yml), script
  [`scripts/social/pubblica.ts`](../scripts/social/pubblica.ts)): il video
  dalle 13 e il carosello dalle 18, ora svizzera. GitHub ritarda gli orari
  programmati anche di ore, o li salta: per questo il workflow parte ogni ora
  e il primo passo ([`scripts/social/turno.ts`](../scripts/social/turno.ts))
  decide se è il momento e se il post manca ancora su qualche social. Di
  solito escono poco dopo le 13 e le 18. Il repository è pubblico, quindi i
  minuti di GitHub Actions non costano nulla. Instagram e Facebook scaricano
  le immagini da `raw.githubusercontent.com`, alla versione del commit; il
  video invece lo carica lo script.

Ogni pubblicazione finisce in [`storico.json`](storico.json) (giorno, post,
social, formato, id e ora), che il workflow salva nel repository: un post già
uscito su un social non viene pubblicato una seconda volta, nemmeno se rilanci
il workflow a mano. Il video esce solo su Instagram e Facebook: sul profilo
LinkedIn basta un post al giorno.

Il workflow pianificato parte solo dal branch `main`: i post escono dopo il
merge. Un social senza credenziali viene saltato, quindi si possono collegare
uno alla volta.

## Prima di cominciare

I post invitano a iscriversi alla lista d'attesa. Controlla che la lista
salvi davvero le iscrizioni: serve il database Supabase attivo e
l'informativa sulla privacy completa (vedi il README principale). Altrimenti
resta in modalità demo e chi arriva dai social non viene salvato.

Nella bio di Instagram metti il link con la provenienza, così la lista
d'attesa sa da dove arriva chi si iscrive:
`https://bleo.ch/lista-attesa?utm_source=instagram`. Nei post di Facebook e
LinkedIn il link c'è già, con `utm_source=facebook` e `utm_source=linkedin`.

## Collegare Instagram e la pagina Facebook

Serve una volta sola, circa 30 minuti. Ti servono una **pagina Facebook** di
Bleo e un **account Instagram professionale** (Business o Creator) collegato
alla pagina. I nomi dei menu di Meta cambiano spesso: se non trovi una voce,
cercala con le parole chiave indicate.

1. Su [developers.facebook.com](https://developers.facebook.com/apps) crea
   un'app di tipo **Business**. Aggiungi i prodotti per gestire la pagina e
   Instagram con l'accesso tramite Facebook («Facebook Login for Business»,
   «Instagram API with Facebook login»).
2. Nelle impostazioni di base dell'app inserisci l'URL dell'informativa sulla
   privacy (`https://bussola-ticino.netlify.app/privacy`), un'icona e una
   categoria, poi passa l'app in modalità **Live**. In modalità sviluppo i
   post li vedi solo tu.
3. Apri il [Graph API Explorer](https://developers.facebook.com/tools/explorer/),
   scegli l'app e genera un token utente con questi permessi:
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`,
   `instagram_basic`, `instagram_content_publish`, `business_management` e,
   per le statistiche, `instagram_manage_insights`, `read_insights`,
   `pages_manage_engagement`. Se un permesso non compare nell'elenco,
   aggiungilo prima ai casi d'uso dell'app (pannello dell'app → «Casi d'uso»
   → «Personalizza»). Quando Meta lo chiede, scegli la pagina di Bleo e
   l'account Instagram.
4. Nel [debugger dei token](https://developers.facebook.com/tools/debug/accesstoken/)
   incolla il token e premi **Estendi token d'accesso**: diventa un token di
   60 giorni.
5. Torna nel Graph API Explorer con il token esteso e chiedi `me/accounts`.
   Della pagina di Bleo copia `id` e `access_token`. Questo token della
   pagina **non scade**: controllalo nel debugger («Scade: mai»).
6. Chiedi `<id-della-pagina>?fields=instagram_business_account` e copia l'id
   di Instagram.
7. Su GitHub, nel repository: **Settings → Secrets and variables → Actions**.
   - Scheda *Secrets*: `META_PAGE_TOKEN` = il token della pagina.
   - Scheda *Variables*: `FACEBOOK_PAGE_ID` e `INSTAGRAM_USER_ID`.

Se Meta risponde che mancano dei permessi per Instagram, aggiungi anche
`ads_management` e `ads_read` al punto 3: servono quando il tuo account ha un
ruolo nel Business Manager della pagina.

## Collegare il profilo LinkedIn

1. Su [linkedin.com/developers](https://www.linkedin.com/developers/apps)
   crea un'app. LinkedIn chiede di associarla a una pagina aziendale: va bene
   una pagina di Bleo, anche appena creata.
2. Nella scheda **Products** aggiungi «Share on LinkedIn» e «Sign In with
   LinkedIn using OpenID Connect».
3. Nella scheda **Auth**, con lo strumento per generare i token OAuth 2.0,
   crea un token con i permessi `openid`, `profile` e `w_member_social`.
4. Su GitHub aggiungi il secret `LINKEDIN_TOKEN`.

Il token di LinkedIn **dura 60 giorni** e per le app come questa LinkedIn non
dà un modo per rinnovarlo da solo. Quando scade il workflow fallisce, GitHub
ti manda un'email e rifai il punto 3.

## TikTok

Con l'API ufficiale di TikTok, finché l'app non supera la revisione di TikTok
(«audit») i post restano privati. La revisione è pensata per app usate da
altre persone, con le schermate che TikTok impone, non per un programma che
pubblica da solo. Per questo TikTok non è automatico. Video e immagini però
sono già pronti: il video lo scarichi dalla pagina dell'esecuzione del
workflow su GitHub («Artifacts»), le immagini da questa cartella, e dal
telefono li pubblichi in un minuto.

## La voce di Bleo nei video

È la stessa voce delle lezioni: Higgsfield, `text2speech_v2` con motore
ElevenLabs e voce «Dylan» (vedi `video/README.md`). Una frase per scheda più
una chiusura uguale per tutti, in `video/sorgenti/social/<id-post>/01.mp3,
02.mp3, …` e `video/sorgenti/social/chiusura.mp3`; i testi usati sono in
`voci.json`. Costa circa 0,3 crediti a frase.

Il testo lo ricava il codice dalle schede ([`src/lib/social/voce.ts`](../src/lib/social/voce.ts)):
«Blìo» al posto di Bleo, gli importi in parole («centomila franchi»), le
sigle come si dicono («a-vu-esse») e niente parentesi. Per un post nuovo o
cambiato:

1. `cd video && npm run voci`: elenca le frasi da fare, con il testo.
2. Genera ogni frase con la voce «Dylan» e salvala con il nome indicato.
3. `npm run voci -- --registra`, poi `npm test` dalla cartella principale.

Se un post non ha tutte le sue voci, o il testo è cambiato dopo la
registrazione, il video esce lo stesso con la sola musica, e `npm test`
segnala le voci da rifare.

## Statistiche e analisi

Ogni sera, dopo il carosello, il workflow legge da Instagram e Facebook le
statistiche dei post usciti negli ultimi 28 giorni
([`scripts/social/aggiorna-statistiche.ts`](../scripts/social/aggiorna-statistiche.ts)):
persone raggiunte, mi piace, commenti, condivisioni, salvataggi e, per i
video, quanto li guardano e quanti li saltano nei primi 3 secondi. Le salva in
[`statistiche.json`](statistiche.json) e riscrive [`analisi.md`](analisi.md)
([`src/lib/social/analisi.ts`](../src/lib/social/analisi.ts)):

- ogni post confrontato con gli altri dello stesso social e formato (indice
  1,00 = nella media), con il perché più probabile: visto da pochi ma utile
  (il gancio non funziona), visto da tanti ma ignorato (contenuto poco
  utile), saltato all'inizio (il video non aggancia) e così via;
- carosello e video a confronto;
- cosa hanno in comune i post migliori (copertina con una domanda, cifra
  grande, argomento, giorno).

Salvare e condividere valgono più di un «mi piace»: dicono che il post è
utile. I primi 2 giorni di un post non contano (i numeri crescono ancora) e
con pochi post i confronti sono solo indicativi.

Per LinkedIn l'API non dà le statistiche dei profili personali: si guardano
nell'app di LinkedIn.

Le statistiche richiedono i permessi `instagram_manage_insights`,
`read_insights` e `pages_manage_engagement`. Se hai collegato Meta senza,
rifai i punti 3–5 di «Collegare Instagram e la pagina Facebook» e aggiorna
il secret `META_PAGE_TOKEN`. Finché mancano, i post escono lo stesso e il
riassunto del workflow lo dice.

**Post nuovi dai risultati.** Ogni lunedì una routine di Claude legge
l'analisi, spiega cosa è andato bene e male e riscrive i post della
settimana dopo (e, verso la fine del piano, ne aggiunge di nuovi) più
simili a quelli andati meglio, sempre con cifre e fonti da
`src/data/svizzera.ts`. Rifà immagini e test e apre una pull request: la
controlli e fai il merge.

## Provare senza pubblicare

Su GitHub: **Actions → Post social di Bleo → Run workflow**. La casella
«Solo prova» è già spuntata: il workflow mostra testi e immagini e controlla
che chiavi e id funzionino (dice a nome di quale pagina, account e profilo
uscirebbe il post), senza pubblicare nulla. Puoi scegliere il formato
(carosello o video) e il giorno, per esempio `2026-10-28`. Con il video, la
prova lo crea davvero: lo trovi in fondo alla pagina dell'esecuzione
(«Artifacts»). Se il token di Meta non è quello della pagina (per esempio un
token utente, che scade), la prova lo dice.

Per rilanciare dopo un errore, togli la spunta e scrivi il giorno: i social
dove il post è già uscito vengono saltati (lo dice `storico.json`). Se hai
cancellato un post dal social e vuoi che esca di nuovo, spunta anche
«Ripubblica»: il workflow chiede a Meta quali post di quel giorno non ci sono
più e ripubblica solo quelli.

In locale:

```sh
SOCIAL_PROVA=true SOCIAL_DATA=2026-10-28 npm run social:pubblica
(cd video && SOCIAL_DATA=2026-10-28 npm run reel)
SOCIAL_PROVA=true SOCIAL_FORMATO=video SOCIAL_DATA=2026-10-28 npm run social:pubblica
```

## Aggiungere post

1. Aggiungi i post in fondo all'elenco di `src/data/social.ts`: la data la
   calcola il piano, un giorno dopo l'ultimo.
   Cifre e scadenze solo dai dati di `src/data/svizzera.ts`; le fonti di un
   post che spiega un passo devono essere fonti di quel passo.
2. Fai le immagini: `cd video && npm run social -- <id> <id> …` (la prima
   volta `npm ci`). Il video lo fa il workflow ogni giorno; per vederlo prima:
   `npm run reel -- <id>`.
3. Guarda immagini e video, poi `npm test`.
4. Commit e merge su `main`.

Quando il piano finisce il workflow fallisce ogni giorno con il messaggio «Il
piano editoriale è finito»: è il promemoria per i post nuovi. Se cambia un
dato in `src/data/svizzera.ts`, rifai le immagini dei post che lo usano.

## Da sapere

- **Variabili.** Oltre a quelle sopra: `SITO_URL` (variabile; se manca si usa
  `https://bleo.ch`) per i link nei post;
  `META_GRAPH_VERSIONE` e `LINKEDIN_VERSIONE` per cambiare la versione delle
  API. Quelle predefinite sono in `scripts/social/configurazione.ts`: Meta
  tiene ogni versione circa due anni, LinkedIn circa uno. Quando una versione
  non è più valida, il workflow fallisce con l'errore dell'API.
- **Pause di GitHub.** In un repository pubblico GitHub sospende i workflow
  pianificati dopo 60 giorni senza attività nel repository. Se succede,
  riattivalo da **Actions**.
- **Errori.** Se un social non riesce, gli altri escono lo stesso; il
  workflow finisce in rosso e GitHub ti manda un'email. Il riassunto di ogni
  esecuzione è nella pagina del workflow.
