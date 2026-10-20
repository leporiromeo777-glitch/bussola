# I post social di Bleo

Ogni giorno esce un post di Bleo su Instagram, sulla pagina Facebook e sul
profilo LinkedIn, da solo e gratis.

- **I post** sono in [`src/data/social.ts`](../src/data/social.ts): un
  carosello al giorno, dal 21.10.2026 al 17.11.2026 (il primo giorno è
  `INIZIO_PIANO`: per spostare tutto basta cambiare quella data). I testi vengono dai passi
  del percorso, le cifre da `src/data/svizzera.ts`, ogni post ha le sue fonti
  ufficiali. I test (`npm test`) controllano che ogni importo in CHF e ogni
  percentuale venga dai dati.
- **Le immagini** sono in questa cartella, `social/<id-del-post>/01.jpg, 02.jpg, …`
  (JPEG 1080×1350). Le fa Remotion con i colori e i caratteri del sito:
  `cd video && npm run social`.
- **La pubblicazione** la fa GitHub Actions ogni giorno alle 17:41 d'inverno e
  alle 18:41 d'estate ([`.github/workflows/social.yml`](../.github/workflows/social.yml),
  script [`scripts/social/pubblica.ts`](../scripts/social/pubblica.ts)). Il
  repository è pubblico, quindi i minuti di GitHub Actions non costano nulla.
  Instagram e Facebook scaricano le immagini da
  `raw.githubusercontent.com`, alla versione del commit.

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
`https://bussola-ticino.netlify.app/lista-attesa?utm_source=instagram` (poi
il dominio definitivo). Nei post di Facebook e LinkedIn il link c'è già, con
`utm_source=facebook` e `utm_source=linkedin`.

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
   `instagram_basic`, `instagram_content_publish`, `business_management`.
   Quando Meta lo chiede, scegli la pagina di Bleo e l'account Instagram.
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
pubblica da solo. Per questo TikTok non è automatico. Le immagini però sono
già pronte: dal telefono le pubblichi in un minuto come carosello di foto,
prendendole da questa cartella su GitHub.

## Provare senza pubblicare

Su GitHub: **Actions → Post social di Bleo → Run workflow**. La casella
«Solo prova» è già spuntata: il workflow mostra testi e immagini e controlla
che chiavi e id funzionino (dice a nome di quale pagina, account e profilo
uscirebbe il post), senza pubblicare nulla. Puoi scegliere il giorno, per
esempio `2026-10-28`. Se il token di Meta non è quello della pagina (per
esempio un token utente, che scade), la prova lo dice.

Per rilanciare un solo social (per esempio dopo un errore), togli la spunta,
scrivi il giorno e in «Social» solo quello da rifare (`linkedin`). Attenzione:
sugli altri il post uscirebbe due volte.

In locale:

```sh
SOCIAL_PROVA=true SOCIAL_DATA=2026-10-28 npm run social:pubblica
```

## Aggiungere post

1. Aggiungi i post in fondo all'elenco di `src/data/social.ts`: la data la
   calcola il piano, un giorno dopo l'ultimo.
   Cifre e scadenze solo dai dati di `src/data/svizzera.ts`; le fonti di un
   post che spiega un passo devono essere fonti di quel passo.
2. Fai le immagini: `cd video && npm run social -- <id> <id> …` (la prima
   volta `npm ci`).
3. Guarda le immagini, poi `npm test`.
4. Commit e merge su `main`.

Quando il piano finisce il workflow fallisce ogni giorno con il messaggio «Il
piano editoriale è finito»: è il promemoria per i post nuovi. Se cambia un
dato in `src/data/svizzera.ts`, rifai le immagini dei post che lo usano.

## Da sapere

- **Variabili.** Oltre a quelle sopra: `SITO_URL` (variabile; se manca si usa
  `https://bussola-ticino.netlify.app`) per i link nei post;
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
