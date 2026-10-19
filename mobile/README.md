# Bleo per iPhone e Android

L'app di Bleo, fatta con Expo (React Native). Usa le stesse regole, gli
stessi dati con le fonti e gli stessi calcoli del sito (cartella `../src`).

Cosa c'è:

- **Inizio**: in cima **Oggi**, il riassunto del giorno: solo quando c'è
  qualcosa, schede dalla più urgente con un'azione ciascuna (fatture scadute
  → «Manda un sollecito», fatture che scadono presto, la prossima scadenza
  del percorso, documenti del cassetto scaduti o in scadenza, ore da
  fatturare → «Crea la fattura», «Quanto mettere da parte», votazioni
  vicine); altrimenti «Tutto in ordine per oggi». Senza accesso solo
  scadenze e votazioni. Si aggiorna tornando su Inizio e tirando giù
  (logica in `src/lib/oggi/`). Sotto: avanzamento, prossimo passo e
  prossime scadenze; da qui il corso, i conti, «Fotografa la lettera» e gli
  strumenti.
- **Questionario** di 10 domande (si riprende da dove eri).
- **Racconta a Bleo** (in cima alla prima domanda del questionario): scrivi
  la tua idea con parole tue (o la detti con il microfono della tastiera),
  Bleo propone le risposte, tu le controlli e le correggi prima di
  confermare; poi ti chiede solo quelle che mancano. Usa la stessa API del
  sito (`/api/racconta`) con gli stessi limiti; con l'accesso il limite
  conta per account. Il testo non si salva.
- **Percorso**: passi da spuntare, avvisi, scadenze con le fonti ufficiali e
  **promemoria sul telefono** una settimana prima di ogni scadenza.
- **Il corso di Bleo** (da Inizio, Percorso e da ogni passo): tutte le
  lezioni video nell'ordine del percorso, con numero, titolo e durata; tocchi
  una lezione e compaiono il video, i video facoltativi, le fonti e il link
  al passo. In verde le lezioni dei passi che hai già fatto. I video si
  scaricano dal sito solo quando li avvii.
- **Fotografa la lettera** (da Inizio e da Calcoli e strumenti): fotografi o
  carichi in PDF una lettera di un ufficio (cassa AVS, contribuzioni,
  Comune...) e Bleo ti spiega cos'è, le scadenze, gli importi, cosa fare e
  quando chiedere aiuto, con la nota che è un'informazione generale. Usa la
  stessa API del sito (`/api/lettera`) con gli stessi limiti; con l'accesso
  il limite conta per account. Funziona anche senza accesso. La lettera non
  si salva: resta nella schermata finché non la chiudi.
- **Chiedi a Bleo**: la chat con le fonti, con accesso tramite codice via email.
  Nella versione di prova mostra "La chat arriva presto".
- **Conti** (con l'accesso): fotografi una ricevuta o carichi un PDF, Bleo la
  legge e la mette «da confermare»; riepilogo dell'anno, fatture emesse da
  incassare, indirizzo email personale per inoltrare le fatture.
  **Clienti e ore**: rubrica dei clienti, ore segnate in pochi tocchi e, a
  fine mese, «Crea la fattura», che si apre già compilata nell'app.
  **Preventivo e fattura** (con l'accesso): elenco dei documenti, i tuoi
  dati (nome, indirizzo, IBAN, IVA), modifica di cliente, voci e pagamento,
  preventivo trasformato in fattura, anteprima, PDF con la QR-fattura da
  condividere o stampare, «Registra in I tuoi conti». Gli stessi documenti
  si vedono sul sito. In fondo, **Calcoli e strumenti**: tariffa oraria,
  contributi AVS e «Fotografa la lettera» nell'app; budget, business plan,
  Fondare una Sagl, nome della ditta e testi pronti stanno sul sito.
- **Cassetto dei documenti** (con l'accesso, da Conti o Profilo): fotografi
  o carichi in PDF decisione della cassa AVS, numero IVA, polizze, permesso,
  contratti; vedi cosa è scaduto o scade presto e ricevi una notifica 30 e 7
  giorni prima della scadenza (stesso interruttore dei promemoria del
  percorso).
- **Profilo**: vesti Bleo, account (esci, elimina account), privacy,
  impressum, cancella i dati dal telefono.

I dati (risposte, passi fatti, calcoli) restano sul telefono; i conti, le
ricevute, i preventivi e le fatture stanno nell'account sul sito.

Le pagine del sito (strumenti, privacy, impressum) si aprono nel **browser
del telefono** (Safari, Chrome), dove ci sono già i dati che il sito ha
salvato e l'accesso al sito: il browser dentro l'app, su iPhone, non li
condivide con Safari. Le fonti ufficiali, i moduli e i file dei conti e del
cassetto si aprono invece nel browser dentro l'app, per tornare subito
indietro (`src/lib/apri.ts`).

## Provarla sul tuo telefono

Serve Node.js 22 o più recente.

```bash
cd mobile
npm install
npx expo start
```

Installa **Expo Go** dall'App Store o da Google Play e inquadra il codice QR
che compare. Il telefono e il computer devono essere sulla stessa rete Wi-Fi.

## Pubblicare su App Store e Google Play

### 1. Gli account (li apri tu, a tuo nome)

| Account | Costo | Dove |
|---|---|---|
| Expo (build nel cloud, senza Mac) | gratis | https://expo.dev/signup |
| Apple Developer Program | USD 99 all'anno | https://developer.apple.com/programs/enroll/ |
| Google Play Console | USD 25 una volta | https://play.google.com/console/signup |

Da sapere su Google Play: con un account personale nuovo, prima di
pubblicare per tutti devi fare un **test chiuso con almeno 12 persone per 14
giorni di fila**. Conviene iniziarlo subito, con amici e famiglia. Con un
account da organizzazione questo obbligo non c'è, ma serve un numero D-U-N-S
(e quindi un'attività iscritta).

### 2. Il nome del pacchetto

L'app si chiama `ch.bleo.app` (in `app.json`, `ios.bundleIdentifier` e
`android.package`). Dopo la prima pubblicazione **non si può più
cambiare**: se vuoi un altro nome, cambialo prima.

### 3. Le build

```bash
cd mobile
npx eas-cli@latest login          # con il tuo account Expo
npx eas-cli@latest init           # collega la cartella a un progetto Expo
npm run build:prova               # APK Android da installare e provare
npm run build:store               # versioni per App Store e Google Play
```

Alla prima build per iPhone EAS ti chiede di accedere con l'ID Apple e crea
lui certificati e profili. Non serve un Mac.

### 4. Invio agli store

```bash
npm run invia:store
```

Prima, negli store, crea la scheda dell'app:

- **Nome**: Bleo. **Sottotitolo**: "Apri la tua ditta individuale".
- **Descrizione**: Bleo ti accompagna ad aprire la tua ditta individuale in
  Ticino e nel Grigioni italiano: un percorso personale con i passi
  nell'ordine giusto, le scadenze con i promemoria e le fonti ufficiali.
  Informazioni generali, non consulenza.
- **Categoria**: Business (Apple) / Business (Google).
- **Informativa sulla privacy**: https://bussola-ticino.netlify.app/privacy
  (cambia l'indirizzo quando hai il dominio).
- **Schermate**: fai gli screenshot dall'app (iPhone 6,9" e Android).
- **Dati raccolti** (App Privacy di Apple, Sicurezza dei dati di Google):
  senza accesso, solo la foto o il PDF che scegli in «Fotografa la
  lettera» e il testo che scrivi in «Racconta a Bleo», mandati al fornitore
  di AI per la spiegazione o per proporre le risposte e non salvati da
  Bleo (il resto resta sul telefono). Con la chat attiva: indirizzo email e
  contenuti dell'utente (le domande; con i conti e il cassetto, le foto e i
  PDF caricati), per il funzionamento dell'app, non per pubblicità e non
  venduti. L'account si
  elimina dall'app (Profilo → Elimina account).
- **Account di prova per Apple**: quando la chat è attiva, Apple vuole un
  account per provarla; spiega nelle note che l'accesso è con un codice via
  email e dagli un indirizzo che controlli tu.

### 5. Attivare la chat nell'app

Quando la chat funziona sul sito (chiavi Supabase e Claude su Netlify):

1. In Supabase, *Authentication > Email Templates > Magic Link*, aggiungi il
   codice `{{ .Token }}` al testo dell'email, lasciando anche il link (vedi
   il README del sito).
2. In `eas.json`, nel profilo `production` (e `preview`), aggiungi in `env`:
   `"EXPO_PUBLIC_SUPABASE_URL"` e `"EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"`,
   gli stessi valori di `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` su Netlify (sono pubblici).
3. Rifai la build e inviala.

Senza queste due variabili l'app funziona lo stesso, senza account e senza
chat.
