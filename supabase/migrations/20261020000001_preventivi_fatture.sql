-- Bussola: «Preventivo e fattura» nell'account.
--
-- I preventivi e le fatture degli strumenti /strumenti/preventivo e
-- /strumenti/fattura (e della stessa sezione nell'app), con tutto il loro
-- contenuto, e i dati di chi li emette (nome, indirizzo strutturato, IBAN,
-- numero IVA). Con l'accesso si salvano qui e si vedono sul sito e nel
-- telefono; senza account restano solo nel browser, come prima.
--
-- Il contenuto è il documento dello strumento (tipo Documento in
-- src/lib/strumenti/documenti.ts) in JSON. Il server lo controlla con zod
-- (src/lib/strumenti/account.ts) prima di salvarlo e lo rilegge con lo
-- schema del browser quando lo restituisce. Qui i vincoli che valgono anche
-- per chi scrivesse direttamente con PostgREST: un oggetto JSON non troppo
-- grande, con id, tipo e numero uguali alle colonne.
--
-- La fattura in «I tuoi conti» resta una riga di conti_fatture (numero,
-- cliente, date, importo, riferimento), come prima: la crea solo «Registra
-- in I tuoi conti».
--
-- Tutto punta ad auth.users con "on delete cascade": eliminando l'account si
-- cancella tutto.

-- ---------------------------------------------------------------------------
-- Preventivi e fatture. id: l'id del documento nello strumento (lo stesso nel
-- browser e nell'app), unico per utente: importare due volte gli stessi
-- documenti dal browser non crea doppioni.
-- ---------------------------------------------------------------------------
create table public.preventivi_fatture (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null check (id ~ '^[A-Za-z0-9-]{8,60}$'),
  tipo text not null check (tipo in ('preventivo', 'fattura')),
  numero text not null check (char_length(numero) <= 40),
  -- Data del documento; null finché nello strumento non è una data valida.
  data date check (data between date '2000-01-01' and date '2100-12-31'),
  -- STATI_DOCUMENTO in src/lib/strumenti/account.ts (lo verifica supabase/schema.test.ts):
  -- 'pronto' quando lo strumento non segnala più niente da completare.
  stato text not null check (stato in ('bozza', 'pronto')),
  contenuto jsonb not null,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  primary key (user_id, id),
  constraint preventivi_fatture_contenuto check (
    jsonb_typeof(contenuto) = 'object'
    and octet_length(contenuto::text) <= 500000
    and contenuto ->> 'id' = id
    and contenuto ->> 'tipo' = tipo
    and contenuto ->> 'numero' = numero
  )
);
create index preventivi_fatture_utente on public.preventivi_fatture (user_id, aggiornato_il desc);
alter table public.preventivi_fatture enable row level security;
create policy "preventivi_fatture: propri" on public.preventivi_fatture
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke all on public.preventivi_fatture from anon;

-- Al massimo 2000 documenti per utente (DOCUMENTI_ACCOUNT_MASSIMI in
-- src/lib/strumenti/account.ts). Stessa funzione delle tabelle dei conti.
create trigger limita_preventivi_fatture before insert on public.preventivi_fatture
  for each row execute function public.limita_righe_conti('2000');

-- ---------------------------------------------------------------------------
-- Dati di chi emette i documenti, uno per utente: si usano per i prossimi
-- preventivi e fatture (ogni documento ne tiene una copia nel contenuto).
-- Lunghezze come LUNGHEZZE_EMITTENTE in src/lib/strumenti/documenti.ts.
-- ---------------------------------------------------------------------------
create table public.emittenti (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '' check (char_length(nome) <= 140),
  via text not null default '' check (char_length(via) <= 140),
  numero text not null default '' check (char_length(numero) <= 32),
  npa text not null default '' check (char_length(npa) <= 32),
  localita text not null default '' check (char_length(localita) <= 70),
  paese text not null default 'CH' check (char_length(paese) <= 2),
  email text not null default '' check (char_length(email) <= 200),
  telefono text not null default '' check (char_length(telefono) <= 60),
  iban text not null default '' check (char_length(iban) <= 60),
  iva_iscritto boolean not null default false,
  -- Solo per chi è iscritto all'IVA: CHE-123.456.789 IVA.
  numero_iva text not null default '' check (char_length(numero_iva) <= 40),
  aggiornato_il timestamptz not null default now()
);
alter table public.emittenti enable row level security;
create policy "emittenti: propri" on public.emittenti
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke all on public.emittenti from anon;
