# Bussola

Bussola (nome provvisorio) è un mentore per chi apre un'attività nella Svizzera
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

1. Crea un progetto in una **regione UE** (per esempio Zurigo o Francoforte).
2. Esegui la migrazione `supabase/migrations/20261015000000_schema_iniziale.sql`
   dal SQL editor (o con `supabase db push`).
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
`claude-opus-5-5`; si cambia con `ANTHROPIC_MODEL`. La chat passa a Claude i
frammenti delle fonti come documenti con citazioni, usa il fallback lato server
in caso di rifiuto e risponde solo da quei documenti.

### Email (conferma della lista d'attesa)

Facoltativo: con `RESEND_API_KEY` ed `EMAIL_MITTENTE` (dominio verificato su
Resend) parte l'email di conferma con il link per disiscriversi. Senza, le
iscrizioni vengono salvate lo stesso.

### Dati del titolare

Prima di pubblicare compila `NEXT_PUBLIC_SITO_URL`,
`NEXT_PUBLIC_TITOLARE_NOME`, `NEXT_PUBLIC_TITOLARE_INDIRIZZO` e
`NEXT_PUBLIC_TITOLARE_EMAIL`: servono per l'impressum (LCSl), l'informativa
privacy (LPD) e per attivare TWINT su Stripe.

## Pubblicare

Funziona su Netlify o Vercel come un normale progetto Next.js. Imposta le
variabili d'ambiente **prima** della build. La route della chat ha
`maxDuration = 60` secondi: verifica che il piano dell'hosting lo consenta per
le funzioni con streaming.

## Struttura

```
src/app/            pagine e route (App Router di Next.js 16)
src/components/     componenti della landing, del percorso e degli strumenti
src/lib/            logica pura con i test accanto (*.test.ts)
src/data/           dati ufficiali con fonte e data di controllo
supabase/           migrazioni, test dello schema, elenco delle fonti
scripts/            import delle fonti
docs/               piano, ricerca, kit settimane 1-2, guida alle fonti
```

Le regole per chi lavora sul codice (anche per gli agenti AI) sono in
[`AGENTS.md`](AGENTS.md).

## Limiti da conoscere

- Bussola dà **informazioni generali con fonti**, non consulenza. In Ticino la
  consulenza fiscale e aziendale per conto di terzi richiede l'autorizzazione
  LFid: prima del lancio va chiesto l'accertamento all'autorità di vigilanza
  (lettera in `docs/kit-settimane-1-2/`).
- Privacy e impressum sono bozze: vanno fatte rivedere da un giurista.
- Le fonti importate automaticamente vanno ricontrollate a mano.
- Il nome "Bussola" ha conflitti (dominio occupato, marchio simile attivo):
  vedi `docs/ricerca/concorrenti-nome.md`.
