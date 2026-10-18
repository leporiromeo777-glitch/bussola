# Bleo per iPhone e Android

L'app di Bleo, fatta con Expo (React Native). Usa le stesse regole, gli
stessi dati con le fonti e gli stessi calcoli del sito (cartella `../src`).

Cosa c'è:

- **Inizio**: avanzamento, prossimo passo e prossime scadenze.
- **Questionario** di 10 domande (si riprende da dove eri).
- **Percorso**: passi da spuntare, avvisi, scadenze con le fonti ufficiali e
  **promemoria sul telefono** una settimana prima di ogni scadenza.
- **Chiedi a Bleo**: la chat con le fonti, con accesso tramite codice via email.
  Nella versione di prova mostra "La chat arriva presto".
- **Conti** (con l'accesso): fotografi una ricevuta o carichi un PDF, Bleo la
  legge e la mette «da confermare»; riepilogo dell'anno, fatture emesse da
  incassare, indirizzo email personale per inoltrare le fatture. In fondo,
  **Calcoli e strumenti**: tariffa oraria e contributi AVS; budget, business
  plan, preventivo e fattura QR si aprono sul sito.
- **Cassetto dei documenti** (con l'accesso, da Conti o Profilo): fotografi
  o carichi in PDF decisione della cassa AVS, numero IVA, polizze, permesso,
  contratti; vedi cosa è scaduto o scade presto e ricevi una notifica 30 e 7
  giorni prima della scadenza (stesso interruttore dei promemoria del
  percorso).
- **Profilo**: vesti Bleo, account (esci, elimina account), privacy,
  impressum, cancella i dati dal telefono.

I dati (risposte, passi fatti, calcoli) restano sul telefono; i conti e le
ricevute stanno nell'account sul sito.

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
  senza accesso, nessuno (tutto resta sul telefono). Con la chat attiva:
  indirizzo email e contenuti dell'utente (le domande), per il
  funzionamento dell'app, non per pubblicità e non venduti. L'account si
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
