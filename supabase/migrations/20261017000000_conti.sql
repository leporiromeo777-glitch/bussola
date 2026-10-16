-- Bussola: «I tuoi conti» (fase 1).
--
-- Entrate, uscite e fatture emesse dell'utente, con le ricevute (foto, PDF
-- o allegati delle email inoltrate). Bleo non tiene la contabilità per
-- conto dell'utente: le voci lette da foto o email restano «da_confermare»
-- finché non le conferma lui.
--
-- Importi in centesimi interi. Ogni riga punta ad auth.users con
-- "on delete cascade": eliminando l'account si cancella tutto (i file nello
-- Storage li cancella src/lib/account/eliminazione.ts prima dell'utente).
-- Le scritture che arrivano dalle email (webhook di Resend) passano dal
-- server con la chiave segreta.

-- ---------------------------------------------------------------------------
-- Email ricevute all'indirizzo personale (solo mittente e oggetto: il testo
-- e gli allegati restano da Resend; gli allegati letti vanno nello Storage).
-- Serve anche a non leggere due volte la stessa email se Resend riprova.
-- ---------------------------------------------------------------------------
create table public.conti_email (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resend_id text not null unique check (char_length(resend_id) between 1 and 100),
  mittente text check (char_length(mittente) <= 320),
  oggetto text check (char_length(oggetto) <= 500),
  esito text not null default 'in_corso'
    check (esito in ('in_corso', 'letta', 'conferma_gmail', 'spam', 'limite', 'nessun_documento', 'errore')),
  ricevuta_il timestamptz not null default now()
);
create index conti_email_utente on public.conti_email (user_id, ricevuta_il);
alter table public.conti_email enable row level security;
create policy "conti_email: lettura propria" on public.conti_email
  for select to authenticated using ((select auth.uid()) = user_id);
-- Scrive solo il server (webhook) con la chiave segreta.

-- ---------------------------------------------------------------------------
-- Documenti salvati nello Storage (bucket privato "ricevute").
-- percorso = "<user_id>/<uuid>.<estensione>".
-- ---------------------------------------------------------------------------
create table public.conti_documenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  percorso text not null unique,
  tipo text not null check (tipo in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain')),
  nome_file text check (char_length(nome_file) <= 200),
  byte int not null check (byte between 1 and 3500000),
  origine text not null check (origine in ('foto', 'email')),
  email_id uuid references public.conti_email (id) on delete set null,
  creato_il timestamptz not null default now(),
  constraint conti_documenti_percorso_utente check (
    percorso ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp|pdf|txt)$')
  )
);
create index conti_documenti_utente on public.conti_documenti (user_id);
alter table public.conti_documenti enable row level security;
create policy "conti_documenti: propri" on public.conti_documenti
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Fatture emesse (dallo strumento fattura o a mano). Una per numero.
-- ---------------------------------------------------------------------------
create table public.conti_fatture (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  numero text not null check (char_length(numero) between 1 and 40),
  cliente text not null check (char_length(cliente) between 1 and 140),
  data date not null,
  scadenza date,
  importo_centesimi bigint not null check (importo_centesimi between 0 and 10000000000),
  riferimento text check (char_length(riferimento) <= 40),
  pagata_il date,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  unique (user_id, numero)
);
alter table public.conti_fatture enable row level security;
create policy "conti_fatture: proprie" on public.conti_fatture
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Movimenti: entrate e uscite. Contano nei totali solo quelli "confermato".
-- Le categorie sono quelle di CATEGORIE in src/lib/conti/tipi.ts (lo
-- verifica supabase/schema.test.ts).
-- ---------------------------------------------------------------------------
create table public.conti_movimenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('entrata', 'uscita')),
  data date not null,
  importo_centesimi bigint not null check (importo_centesimi between 0 and 10000000000),
  descrizione text not null default '' check (char_length(descrizione) <= 300),
  controparte text check (char_length(controparte) <= 200),
  categoria text not null check (categoria in (
    'vendite', 'altre_entrate',
    'materiale', 'attrezzatura', 'software', 'telefono', 'trasporti', 'locali', 'assicurazioni',
    'pubblicita', 'formazione', 'banca', 'consulenze', 'pasti', 'altre_uscite'
  )),
  stato text not null default 'da_confermare' check (stato in ('da_confermare', 'confermato', 'privato')),
  origine text not null check (origine in ('fattura', 'email', 'foto', 'manuale')),
  -- Una sola entrata per fattura pagata (unique): segnarla pagata due volte non la raddoppia.
  fattura_id uuid unique references public.conti_fatture (id) on delete cascade,
  documento_id uuid references public.conti_documenti (id) on delete set null,
  nota text check (char_length(nota) <= 500),
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  constraint conti_movimenti_categoria_tipo check (
    (tipo = 'entrata') = (categoria in ('vendite', 'altre_entrate'))
  ),
  constraint conti_movimenti_fattura_origine check ((fattura_id is null) = (origine <> 'fattura'))
);
create index conti_movimenti_utente_data on public.conti_movimenti (user_id, data);
create index conti_movimenti_documento on public.conti_movimenti (documento_id);
alter table public.conti_movimenti enable row level security;
create policy "conti_movimenti: propri" on public.conti_movimenti
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Fattura pagata → entrata confermata (origine "fattura", categoria vendite);
-- non più pagata → l'entrata sparisce. Vale per qualsiasi modo di cambiare la
-- fattura (API, app, SQL), una volta sola per fattura.
create function public.conti_sincronizza_fattura() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.pagata_il is null then
    delete from public.conti_movimenti where fattura_id = new.id;
  else
    insert into public.conti_movimenti
      (user_id, tipo, data, importo_centesimi, descrizione, controparte, categoria, stato, origine, fattura_id)
    values
      (new.user_id, 'entrata', new.pagata_il, new.importo_centesimi, left('Fattura ' || new.numero, 300),
       new.cliente, 'vendite', 'confermato', 'fattura', new.id)
    on conflict (fattura_id) do update
      set data = excluded.data,
          importo_centesimi = excluded.importo_centesimi,
          descrizione = excluded.descrizione,
          controparte = excluded.controparte,
          aggiornato_il = now();
  end if;
  return new;
end;
$$;
create trigger conti_sincronizza_fattura
  after insert or update of pagata_il, importo_centesimi, numero, cliente on public.conti_fatture
  for each row execute function public.conti_sincronizza_fattura();

-- ---------------------------------------------------------------------------
-- Casella: l'indirizzo personale ricevute-<token>@<dominio di ricezione>.
-- Il token è casuale (base32 minuscolo) e si può rigenerare. Scrive solo il
-- server con la chiave segreta: l'utente legge.
-- ---------------------------------------------------------------------------
create table public.conti_caselle (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token text not null unique check (token ~ '^[a-z2-7]{24,64}$'),
  conferma_codice text check (conferma_codice ~ '^[0-9]{4,12}$'),
  conferma_link text check (char_length(conferma_link) <= 2000 and conferma_link like 'https://%'),
  conferma_ricevuta_il timestamptz,
  ultima_email_il timestamptz,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);
alter table public.conti_caselle enable row level security;
create policy "conti_caselle: lettura propria" on public.conti_caselle
  for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Letture con Claude (foto, PDF, email): al massimo 50 al giorno per utente.
-- ---------------------------------------------------------------------------
create table public.conti_letture (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  creato_il timestamptz not null default now()
);
create index conti_letture_utente on public.conti_letture (user_id, creato_il);
alter table public.conti_letture enable row level security;
-- Nessuna policy: si scrive solo con prenota_lettura_conti.

-- Conta una lettura e dice se è consentita (true) o se il limite del giorno
-- (ora di Zurigo) è raggiunto (false). Un utente collegato conta sempre per
-- sé; il server con la chiave segreta indica l'utente (email ricevute).
create function public.prenota_lettura_conti(p_user_id uuid default null) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := coalesce(auth.uid(), p_user_id);
  v_usate int;
begin
  if v_uid is null then
    raise exception 'utente mancante' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('conti_letture:' || v_uid::text, 0));
  select count(*) into v_usate
    from public.conti_letture
   where user_id = v_uid
     and creato_il >= (date_trunc('day', now() at time zone 'Europe/Zurich') at time zone 'Europe/Zurich');
  -- 50 = LETTURE_AL_GIORNO in src/lib/conti/limiti.ts (lo verifica supabase/schema.test.ts).
  if v_usate >= 50 then
    return false;
  end if;
  insert into public.conti_letture (user_id) values (v_uid);
  return true;
end;
$$;
revoke execute on function public.prenota_lettura_conti(uuid) from public, anon;
grant execute on function public.prenota_lettura_conti(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Al massimo tante righe per utente: nessuno riempie il database scrivendo
-- direttamente con PostgREST.
-- ---------------------------------------------------------------------------
create function public.limita_righe_conti() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_righe int;
begin
  perform pg_advisory_xact_lock(hashtextextended(tg_table_name || ':' || new.user_id::text, 0));
  execute format('select count(*) from %I.%I where user_id = $1', tg_table_schema, tg_table_name)
    into v_righe using new.user_id;
  if v_righe >= tg_argv[0]::int then
    raise exception 'troppe righe in %', tg_table_name using errcode = '54000';
  end if;
  return new;
end;
$$;
create trigger limita_conti_movimenti before insert on public.conti_movimenti
  for each row execute function public.limita_righe_conti('20000');
create trigger limita_conti_fatture before insert on public.conti_fatture
  for each row execute function public.limita_righe_conti('5000');
create trigger limita_conti_documenti before insert on public.conti_documenti
  for each row execute function public.limita_righe_conti('10000');

-- ---------------------------------------------------------------------------
-- Storage: bucket privato "ricevute". Ogni utente vede, carica e cancella
-- solo i file nella sua cartella "<user_id>/". Limiti come «Fotografa la
-- lettera» (src/lib/lettera/richiesta.ts): PDF fino a 3,5 MB.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ricevute', 'ricevute', false, 3500000,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
)
on conflict (id) do nothing;

create policy "ricevute: lettura propria" on storage.objects
  for select to authenticated
  using (bucket_id = 'ricevute' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "ricevute: caricamento proprio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ricevute' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "ricevute: cancellazione propria" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ricevute' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Pulizia giornaliera: in più i contatori delle letture (servono un giorno).
-- Stesso corpo di 20261016000004_pulizia_dati.sql, più l'ultima riga.
-- ---------------------------------------------------------------------------
create or replace function public.pulisci_dati() returns void
language plpgsql set search_path = '' as $$
begin
  -- Domande alla chat: 12 mesi. La quota guarda solo il mese corrente.
  delete from public.domande_chat
   where creato_il < now() - interval '12 months';

  -- Iscrizioni mai confermate: 30 giorni dopo l'ultima email di conferma.
  delete from public.lista_attesa
   where confermato_il is null
     and conferma_inviata_il is not null
     and conferma_inviata_il < now() - interval '30 days';

  -- Contatori del limite per connessione: servono per un'ora, si tengono al più un giorno.
  delete from public.limiti_richieste
   where creato_il < now() - interval '1 day';

  -- Contatori delle letture dei conti: servono per il giorno in corso.
  delete from public.conti_letture
   where creato_il < now() - interval '2 days';
end;
$$;
