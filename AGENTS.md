<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Bleo: regole del progetto

Bleo è un mentore AI per chi apre un'attività in Svizzera italiana (prima la
ditta individuale, poi la Sagl). Il piano completo è in `docs/piano.md`.

## Regole sul contenuto (non negoziabili)
- Testi dell'interfaccia e documenti in italiano semplice, per un ventenne alla
  prima esperienza. Formato svizzero: `CHF 20'000`, date `19.10.2026`.
- Ogni cifra, soglia, scadenza o nome di ufficio mostrato all'utente viene da
  un dato con fonte ufficiale (URL) e data di controllo: `src/data/` per le
  regole e i link, la tabella `fonti` per la chat. Niente numeri a memoria.
- Bleo dà informazioni generali con fonti, non consulenza personalizzata:
  niente dichiarazioni d'imposta né contabilità per conto dei clienti (LFid
  ticinese). Nei casi complessi rimanda a un fiduciario autorizzato.
- La chat risponde solo dalle fonti verificate e mostra sempre il link; se non
  sa, lo dice e propone un professionista.

## Tecnica
- Next.js 16 (App Router, `src/`). Le API cambiano: leggi la guida in
  `node_modules/next/dist/docs/` prima di usare una funzione che non conosci.
  `middleware` ora si chiama `proxy` (`src/proxy.ts`). `cacheComponents` è
  spento di proposito: le pagine che leggono i cookie sono dinamiche.
- Supabase: client in `src/lib/supabase/` (`server.ts` per l'utente con RLS,
  `admin.ts` con chiave segreta solo lato server, `client.ts` nel browser).
  Schema in `supabase/migrations/`. Se le variabili mancano i client
  restituiscono `null`: l'app deve restare usabile in modalità demo.
- Claude API con `@anthropic-ai/sdk`; modello da `ANTHROPIC_MODEL`
  (predefinito `claude-opus-5-5`).
- Logica pura (regole del percorso, calcoli) in `src/lib/` con test Vitest
  accanto (`*.test.ts`).

## Comandi
- `npm run typecheck` (genera i tipi delle route e lancia tsc)
- `npm test` (Vitest)
- `npm run lint`
- `npm run build`
