-- Bussola: schema iniziale.
-- Da eseguire su un progetto Supabase in Svizzera (eu-central-2, Zurigo) o
-- nell'UE (eu-central-1, Francoforte), dal SQL editor o con `supabase db push`.

create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- Lista d'attesa (landing page). Scrive solo il server con la chiave segreta.
-- ---------------------------------------------------------------------------
create table public.lista_attesa (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nome text,
  cantone text,
  situazione text check (situazione in ('idea', 'in_apertura', 'aperta_da_poco', 'fiduciario', 'altro')),
  consenso_email boolean not null default false,
  token_conferma uuid not null default gen_random_uuid(),
  confermato_il timestamptz,
  provenienza text,
  creato_il timestamptz not null default now(),
  constraint lista_attesa_email_formato check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
create unique index lista_attesa_email_unica on public.lista_attesa (lower(email));
alter table public.lista_attesa enable row level security;
-- Nessuna policy: anon e utenti non leggono né scrivono; solo la chiave segreta.

-- ---------------------------------------------------------------------------
-- Profili utente (1:1 con auth.users) e piano.
-- ---------------------------------------------------------------------------
create table public.profili (
  id uuid primary key references auth.users (id) on delete cascade,
  piano text not null default 'gratis' check (piano in ('gratis', 'avvio', 'accompagnamento', 'partner')),
  piano_scade_il timestamptz,
  creato_il timestamptz not null default now()
);
alter table public.profili enable row level security;
create policy "profilo: lettura propria" on public.profili
  for select to authenticated using ((select auth.uid()) = id);
-- Il piano lo cambia solo il server (pagamenti), quindi niente update per l'utente.

create function public.crea_profilo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profili (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger crea_profilo_dopo_registrazione
  after insert on auth.users
  for each row execute function public.crea_profilo();

-- ---------------------------------------------------------------------------
-- Questionario e percorso. Le risposte sono salvate; il percorso si ricalcola
-- dal codice (src/lib/percorso) così le regole aggiornate valgono per tutti.
-- ---------------------------------------------------------------------------
create table public.questionari (
  user_id uuid primary key references auth.users (id) on delete cascade,
  risposte jsonb not null,
  versione_regole text not null,
  aggiornato_il timestamptz not null default now()
);
alter table public.questionari enable row level security;
create policy "questionario: proprio" on public.questionari
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table public.passi_completati (
  user_id uuid not null references auth.users (id) on delete cascade,
  passo_id text not null,
  completato_il timestamptz not null default now(),
  primary key (user_id, passo_id)
);
alter table public.passi_completati enable row level security;
create policy "passi: propri" on public.passi_completati
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Base di fonti ufficiali. Ogni fonte ha una data di controllo: va
-- ricontrollata ogni mese (vedi docs/fonti.md).
-- ---------------------------------------------------------------------------
create table public.fonti (
  id text primary key,                       -- es. 'ahv-2-02-indipendenti'
  url text not null unique,
  titolo text not null,
  ente text not null,                        -- es. 'Centro d''informazione AVS/AI'
  livello text not null check (livello in ('federale', 'cantonale', 'comunale', 'altro')),
  cantone text,                              -- 'TI', 'GR' o null se federale
  argomenti text[] not null default '{}',
  lingua text not null default 'it',
  verificato_il date not null,
  verificato_da text not null,
  attiva boolean not null default true,
  aggiornato_il timestamptz not null default now()
);

create table public.frammenti_fonti (
  id bigint generated always as identity primary key,
  fonte_id text not null references public.fonti (id) on delete cascade,
  posizione int not null,
  titolo_sezione text,
  testo text not null,
  ricerca tsvector generated always as (
    setweight(to_tsvector('italian', coalesce(titolo_sezione, '')), 'A') ||
    setweight(to_tsvector('italian', testo), 'B')
  ) stored,
  embedding extensions.vector(1024),         -- per la ricerca semantica (fase successiva)
  unique (fonte_id, posizione)
);
create index frammenti_fonti_ricerca on public.frammenti_fonti using gin (ricerca);

alter table public.fonti enable row level security;
alter table public.frammenti_fonti enable row level security;
-- Le fonti sono informazioni pubbliche: chiunque può leggere quelle attive.
create policy "fonti: lettura pubblica" on public.fonti
  for select to anon, authenticated using (attiva);
create policy "frammenti: lettura pubblica" on public.frammenti_fonti
  for select to anon, authenticated
  using (exists (select 1 from public.fonti f where f.id = fonte_id and f.attiva));

-- Ricerca testuale in italiano sui frammenti delle fonti attive.
create function public.cerca_frammenti(domanda text, quanti int default 8)
returns table (
  frammento_id bigint,
  fonte_id text,
  titolo text,
  url text,
  ente text,
  verificato_il date,
  titolo_sezione text,
  testo text,
  punteggio real
)
language sql stable set search_path = '' as $$
  with q as (
    -- wq: tutte le parole (AND); oq: almeno una parola (OR), dai lessemi già normalizzati.
    select websearch_to_tsquery('italian', domanda) as wq,
           nullif(array_to_string(array(
             select quote_literal(lexeme) from unnest(to_tsvector('italian', domanda))
           ), ' | '), '')::tsquery as oq
  )
  select fr.id, f.id, f.titolo, f.url, f.ente, f.verificato_il, fr.titolo_sezione, fr.testo,
         greatest(ts_rank_cd(fr.ricerca, q.wq), ts_rank_cd(fr.ricerca, q.oq) * 0.5) as punteggio
  from public.frammenti_fonti fr
  join public.fonti f on f.id = fr.fonte_id and f.attiva
  cross join q
  where q.oq is not null and (fr.ricerca @@ q.wq or fr.ricerca @@ q.oq)
  order by punteggio desc
  limit least(greatest(quanti, 1), 20);
$$;
grant execute on function public.cerca_frammenti(text, int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Domande alla chat: servono per la quota mensile del piano gratis e per
-- capire quali fonti mancano ("ogni domanda arricchisce la base di fonti").
-- Si salva la domanda, non dati personali aggiuntivi.
-- ---------------------------------------------------------------------------
create table public.domande_chat (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  domanda text not null,
  fonti_citate text[] not null default '{}',
  senza_risposta boolean not null default false,
  creato_il timestamptz not null default now()
);
create index domande_chat_utente_mese on public.domande_chat (user_id, creato_il);
alter table public.domande_chat enable row level security;
create policy "domande: lettura propria" on public.domande_chat
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "domande: inserimento proprio" on public.domande_chat
  for insert to authenticated with check ((select auth.uid()) = user_id);
