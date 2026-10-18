-- Bussola: «Clienti e ore» (dentro «I tuoi conti»).
--
-- Una piccola rubrica dei clienti, con l'indirizzo strutturato come lo vuole
-- la QR-fattura (via, numero, NPA, località, paese), e le ore di lavoro per
-- cliente. Da un cliente e un mese si prepara la fattura nello strumento
-- fattura: le ore usate si segnano come fatturate (fatturata_il), così non si
-- fatturano due volte.
--
-- Importi in centesimi interi. Ogni riga punta ad auth.users con
-- "on delete cascade": eliminando l'account si cancella tutto. Cancellando
-- un cliente si cancellano anche le sue ore.

-- ---------------------------------------------------------------------------
-- Clienti. Lunghezze dell'indirizzo come nella QR-fattura (LUNGHEZZE_INDIRIZZO_QR
-- in src/lib/strumenti/qr.ts, lo verifica supabase/schema.test.ts).
-- ---------------------------------------------------------------------------
create table public.conti_clienti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 70),
  via text not null default '' check (char_length(via) <= 70),
  numero text not null default '' check (char_length(numero) <= 16),
  npa text not null default '' check (char_length(npa) <= 16),
  localita text not null default '' check (char_length(localita) <= 35),
  paese text not null default 'CH' check (paese ~ '^[A-Z]{2}$'),
  email text check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- Tariffa oraria predefinita, facoltativa. 1000000 = TARIFFA_MASSIMA (CHF 10'000) in src/lib/clienti/limiti.ts.
  tariffa_centesimi bigint check (tariffa_centesimi between 0 and 1000000),
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  -- Per la chiave esterna delle ore: un'ora appartiene a un cliente dello stesso utente.
  unique (id, user_id)
);
create index conti_clienti_utente on public.conti_clienti (user_id, nome);
alter table public.conti_clienti enable row level security;
create policy "conti_clienti: propri" on public.conti_clienti
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke all on public.conti_clienti from anon;

-- ---------------------------------------------------------------------------
-- Ore di lavoro. minuti: da 1 a 1440 (MINUTI_MASSIMI in src/lib/clienti/limiti.ts).
-- tariffa_centesimi: la tariffa di questa voce; se manca vale quella del
-- cliente. fatturata_il: il giorno in cui la voce è finita in una fattura.
-- ---------------------------------------------------------------------------
create table public.conti_ore (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cliente_id uuid not null,
  data date not null,
  minuti int not null check (minuti between 1 and 1440),
  descrizione text not null default '' check (char_length(descrizione) <= 200),
  tariffa_centesimi bigint check (tariffa_centesimi between 0 and 1000000),
  fatturata_il date,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  -- Il cliente deve essere dello stesso utente: nessuno attacca ore ai clienti di altri.
  constraint conti_ore_cliente_utente foreign key (cliente_id, user_id)
    references public.conti_clienti (id, user_id) on delete cascade
);
create index conti_ore_utente_data on public.conti_ore (user_id, data);
create index conti_ore_cliente_data on public.conti_ore (cliente_id, data);
alter table public.conti_ore enable row level security;
create policy "conti_ore: proprie" on public.conti_ore
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke all on public.conti_ore from anon;

-- Al massimo tante righe per utente (stessa funzione dei conti): nessuno
-- riempie il database scrivendo direttamente con PostgREST.
create trigger limita_conti_clienti before insert on public.conti_clienti
  for each row execute function public.limita_righe_conti('2000');
create trigger limita_conti_ore before insert on public.conti_ore
  for each row execute function public.limita_righe_conti('20000');
