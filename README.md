# Bleo

Bleo è un mentore per chi apre un'attività nella Svizzera
italiana. Porta dall'idea alla ditta individuale aperta e alla prima fattura,
con un percorso personale, risposte che citano sempre la fonte ufficiale e
documenti pronti.

Il piano completo è in [`docs/piano.md`](docs/piano.md). La ricerca sulle
fonti ufficiali, con verifica indipendente, è in [`docs/ricerca/`](docs/ricerca/).
Il kit per le settimane 1-2 (interviste, messaggi, social, lettere) è in
[`docs/kit-settimane-1-2/`](docs/kit-settimane-1-2/).

## Cosa c'è

| Parte | Dove | Stato |
|---|---|---|
| Landing con lista d'attesa (doppio opt-in, disiscrizione) | `/`, `src/components/landing`, `src/app/lista-attesa` | pronta |
| Privacy e impressum (bozze da far rivedere) | `/privacy`, `/impressum` | da completare con i dati del titolare |
| Accesso con link via email | `/accedi`, `src/app/auth` | pronto (serve Supabase) |
| Questionario di 5 minuti e percorso personale | `/questionario`, `/percorso`, `src/lib/percorso`, `src/data/passi.ts` | pronto |
| Chat con fonti ufficiali e citazioni | `/chat`, `src/app/api/chat`, `src/lib/chat` | pronta (servono Supabase e Claude) |
| Import delle fonti ufficiali | `scripts/importa-fonti.ts`, `supabase/fonti/elenco.json` | pronto, fonti da ricontrollare a mano |
| Strumenti: tariffa oraria, budget, business plan, preventivo, fattura con QR | `/strumenti`, `src/lib/strumenti` | pronti (dati solo nel browser) |
| «I tuoi conti»: entrate, uscite, fatture emesse, ricevute lette da Claude, email inoltrate, CSV | `/conti`, `src/app/api/conti`, `src/lib/conti` | fase 1 pronta (servono Supabase; Claude e Resend facoltativi) |
| «Clienti e ore»: rubrica dei clienti con indirizzo per la QR-fattura, ore per cliente, fattura del mese già compilata | `/conti/clienti`, `src/app/api/conti/clienti`, `src/app/api/conti/ore`, `src/lib/clienti` | pronta (serve Supabase) |
| Pagamenti (Stripe + TWINT), scadenzario via email | | settimane 12-13 del piano |

Tutti i numeri ufficiali (soglie, aliquote, contributi, uffici) stanno in
[`src/data/svizzera.ts`](src/data/svizzera.ts) e nella tavola scalare AVS in
`src/data/avs-tavola-scalare.ts`, ognuno con la sua fonte e la data di
controllo.

## Avviare in locale

Serve Node.js 22 o più recente.

```bash
npm install
cp .env.example .env.local   # poi compila le variabili che ti servono
npm run dev                  # http://localhost:3000
```

Senza variabili l'app gira in **modalità demo**: landing, questionario,
percorso e strumenti funzionano (i dati restano nel browser); lista d'attesa,
accesso e chat mostrano un avviso.

Controlli:

```bash
npm run typecheck   # tipi delle route + TypeScript
npm test            # Vitest, compreso lo schema SQL su Postgres in memoria
npm run lint
npm run build
```

## Configurare i servizi

### Supabase (database e accesso)

1. Crea un progetto in **Svizzera** (eu-central-2, Zurigo) o **nell'UE**
   (eu-central-1, Francoforte) e indica la scelta in
   `NEXT_PUBLIC_SUPABASE_REGIONE_DATI` (`svizzera` o `ue`): l'informativa
   sulla privacy dice dove sono i dati.
2. Esegui tutte le migrazioni di `supabase/migrations/`, in ordine di nome
   (prima `20261015000000_schema_iniziale.sql`, poi le successive), dal SQL
   editor o con `supabase db push`.
3. In *Authentication > URL Configuration* imposta come Site URL il dominio del
   sito e aggiungi `https://<dominio>/auth/conferma*` tra i Redirect URLs.
4. Lascia il template email "Magic Link" **predefinito** (flusso PKCE): il link
   funziona solo nel browser in cui è stato chiesto, e così deve restare.
   Esiste un template alternativo con
   `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`, che funziona su
   qualsiasi dispositivo, ma è sconsigliato: chi riceve quel link entra
   nell'account di chi l'ha chiesto. Un malintenzionato può mandare il proprio
   link a qualcuno e farlo entrare, senza che se ne accorga, nel proprio account
   (login CSRF). Per questo `/percorso` chiede sempre conferma, mostrando
   l'email dell'account, prima di salvare nell'account le risposte fatte nel
   browser senza accesso.
5. Copia in `.env.local` e nell'hosting `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, e solo lato server
   `SUPABASE_SECRET_KEY`.
6. Protezione dagli abusi del link di accesso (prima del lancio):
   - In *Authentication > Attack Protection* attiva il CAPTCHA con
     **Cloudflare Turnstile** e incolla la chiave segreta del widget creato su
     Cloudflare. Metti la chiave del sito in `NEXT_PUBLIC_TURNSTILE_SITE_KEY`:
     il modulo di accesso mostra la verifica e passa il token a Supabase.
     Attiva le due cose insieme: con il CAPTCHA acceso su Supabase ma senza
     chiave del sito nell'app nessuno riesce ad accedere.
   - In *Authentication > SMTP Settings* configura un tuo SMTP (per esempio
     quello di Resend): con il servizio email predefinito Supabase manda
     pochissime email all'ora per tutto il progetto. Poi in
     *Authentication > Rate Limits* alza il limite di email all'ora a un
     valore adatto al lancio.
   - L'app limita anche, per connessione, le richieste di link e le
     iscrizioni alla lista d'attesa (`LIMITI_RICHIESTE` in
     `src/lib/limiti/richieste.ts`, tabella `limiti_richieste` con
     un'impronta dell'IP, mai l'IP in chiaro). Serve `SUPABASE_SECRET_KEY`.
7. App per telefono (`mobile/`): accede con il **codice numerico** ricevuto
   per email (`signInWithOtp` + `verifyOtp` di supabase-js). Nel template
   "Magic Link" aggiungi quindi anche il codice `{{ .Token }}`, **lasciando il
   link** com'è (il sito continua a usare il link), per esempio
   `<p>Oppure scrivi questo codice nell'app: <strong>{{ .Token }}</strong></p>`.
   L'app chiama le API del sito (`POST /api/chat`, `GET /api/quota`,
   `DELETE /api/account`) mandando l'access token della sua sessione Supabase
   in `Authorization: Bearer <access_token>` invece dei cookie; la RLS vale
   come sul sito. `DELETE /api/account` (e "Elimina account" in `/account`)
   cancella l'utente con `SUPABASE_SECRET_KEY`; i suoi dati si cancellano a
   cascata.

### Fonti della chat

```bash
npm run fonti:importa                                  # tutte le fonti
npm run fonti:importa -- --solo ahv-2-02-indipendenti  # una sola
```

L'elenco è in `supabase/fonti/elenco.json`. Prima della beta ogni fonte va
aperta e ricontrollata a mano, poi ogni mese. La procedura è in
[`docs/fonti.md`](docs/fonti.md).

### Claude (chat)

Imposta `ANTHROPIC_API_KEY` (solo lato server). Il modello predefinito è
`claude-sonnet-5-5`; si cambia con `ANTHROPIC_MODEL`. La chat passa a Claude i
frammenti delle fonti come documenti con citazioni, usa il fallback lato server
in caso di rifiuto e risponde solo da quei documenti.

### Email (conferma della lista d'attesa)

Facoltativo: con `RESEND_API_KEY` ed `EMAIL_MITTENTE` (dominio verificato su
Resend) parte l'email di conferma con il link per disiscriversi. Senza, le
iscrizioni vengono salvate lo stesso.

### «I tuoi conti» (ricevute e email inoltrate)

1. Esegui la migrazione `20261017000000_conti.sql` (crea le tabelle `conti_*`,
   il bucket privato `ricevute` dello Storage con le sue regole e aggiorna la
   pulizia giornaliera). Servono `SUPABASE_SECRET_KEY` (limiti, indirizzi
   email, cancellazione dei file con l'account) e, per leggere le ricevute,
   `ANTHROPIC_API_KEY`. Il modello si cambia con `ANTHROPIC_MODEL_RICEVUTE`
   (predefinito lo stesso modello economico di «Racconta a Bleo»: le email
   arrivano da sole e conta il costo).
   Senza Claude le ricevute si salvano lo stesso e i campi li scrive l'utente.
2. Ricezione delle email (facoltativa), con Resend:
   - in *Emails > Receiving* prendi il dominio `<id>.resend.app` (oppure
     configura un tuo dominio con il record MX) e mettilo in
     `RESEND_DOMINIO_RICEZIONE`;
   - in *Webhooks > Add Webhook* crea un webhook con URL
     `https://<dominio del sito>/api/conti/email-in` e solo l'evento
     `email.received`; copia il segreto di firma (`whsec_…`) in
     `RESEND_WEBHOOK_SECRET`;
   - `RESEND_API_KEY` deve poter leggere le email ricevute (API
     `GET /emails/receiving/{id}` e `/attachments`): usa una chiave con
     accesso completo, non solo «invio».
   Ogni utente riceve un indirizzo `ricevute-<codice>@<dominio>`; la pagina
   `/conti` spiega come inoltrare da Gmail (con il codice di conferma
   mostrato da Bleo) e da Outlook. Il webhook verifica la firma (Svix),
   risponde subito e legge al massimo 5 allegati per email dopo la risposta
   (`after()`), entro `maxDuration = 60` secondi: verifica che il piano
   dell'hosting lo consenta.
3. Le app usano le stesse API con `Authorization: Bearer`. `DELETE
   /api/account` cancella anche i file dello Storage prima dell'utente.
4. «Clienti e ore» (`/conti/clienti`): esegui la migrazione
   `20261019000005_clienti_ore.sql` (tabelle `conti_clienti` e `conti_ore`
   con RLS). «Crea la fattura» segna come fatturate le ore del cliente nel
   mese (`fatturata_il`) e apre lo strumento fattura con i dati dopo il «#»
   (`/strumenti/fattura#ore=…`): il browser non manda quella parte al server
   e la fattura resta nel browser come le altre. L'app apre lo stesso link
   nel browser.

### Dati del titolare

Prima di pubblicare compila `NEXT_PUBLIC_SITO_URL`,
`NEXT_PUBLIC_TITOLARE_NOME`, `NEXT_PUBLIC_TITOLARE_INDIRIZZO` e
`NEXT_PUBLIC_TITOLARE_EMAIL`: servono per l'impressum (LCSl), l'informativa
privacy (LPD) e per attivare TWINT su Stripe. Finché uno di questi tre dati
manca (o è vuoto), la lista d'attesa non salva iscrizioni e non manda email:
il mittente deve essere identificabile.

### Informativa sulla privacy

Finché l'informativa (`/privacy`) ha parti tra parentesi quadre, la lista
d'attesa non salva le iscrizioni: resta in modalità demo e il server scrive
nei log cosa manca. Prima di aprirla:

- compila i dati del titolare e `NEXT_PUBLIC_SUPABASE_REGIONE_DATI`;
- pubblica su Vercel o Netlify (il fornitore si riconosce da solo nella
  build);
- in `src/lib/privacy.ts` scrivi per quanto tempo hosting e database tengono
  i log e conferma le clausole contrattuali standard di Supabase, Anthropic
  e Resend, che al 15.10.2026 non sono certificati Swiss-U.S. Data Privacy
  Framework (Vercel e Netlify sì). Ricontrolla l'elenco su
  https://www.dataprivacyframework.gov/list prima del lancio.

## Pubblicare

Funziona su Netlify o Vercel come un normale progetto Next.js. Imposta le
variabili d'ambiente **prima** della build: ogni modifica a una variabile
arriva al sito solo con una nuova build. La route della chat ha
`maxDuration = 60` secondi: verifica che il piano dell'hosting lo consenta per
le funzioni con streaming.

Netlify: `netlify.toml` fissa il comando di build e dichiara il runtime
Next.js (`@netlify/plugin-nextjs`, senza versione: Netlify usa l'ultima). Senza
questa dichiarazione un sito creato via API pubblica i file così come sono,
senza pagine dinamiche. Per le build automatiche a ogni push collega il
repository in *Project configuration > Build & deploy > Continuous
deployment*.

## App per iPhone e Android

In [`mobile/`](mobile/) c'è l'app Expo, con le stesse regole e gli stessi
dati del sito. Come provarla e pubblicarla su App Store e Google Play:
[`mobile/README.md`](mobile/README.md).

## Struttura

```
src/app/            pagine e route (App Router di Next.js 16)
src/components/     componenti della landing, del percorso e degli strumenti
src/lib/            logica pura con i test accanto (*.test.ts)
src/data/           dati ufficiali con fonte e data di controllo
supabase/           migrazioni, test dello schema, elenco delle fonti
scripts/            import delle fonti
mobile/             app per iPhone e Android (Expo)
docs/               piano, ricerca, kit settimane 1-2, guida alle fonti
```

Le regole per chi lavora sul codice (anche per gli agenti AI) sono in
[`AGENTS.md`](AGENTS.md).

## Limiti da conoscere

- Bleo dà **informazioni generali con fonti**, non consulenza. In Ticino la
  consulenza fiscale e aziendale per conto di terzi richiede l'autorizzazione
  LFid: prima del lancio va chiesto l'accertamento all'autorità di vigilanza
  (lettera in `docs/kit-settimane-1-2/`).
- Privacy e impressum sono bozze: vanno fatte rivedere da un giurista.
- Le fonti importate automaticamente vanno ricontrollate a mano.
- Il nome è **Bleo** (attività e mascotte) dal 16.10.2026; prima il nome
  provvisorio era "Bussola", scartato per conflitti di dominio e marchio
  (`docs/ricerca/concorrenti-nome.md`). Prima del lancio: registrare
  bleo.ch e bleo.swiss e depositare il marchio presso l'IPI.
