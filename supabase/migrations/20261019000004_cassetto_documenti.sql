-- Bussola: «Cassetto dei documenti».
--
-- I documenti importanti dell'attività (decisione della cassa AVS, numero
-- IVA, estratto del registro di commercio, polizze, permesso di soggiorno,
-- contratti, autorizzazioni) con la data di scadenza, per i promemoria.
-- Separato dalle ricevute di «I tuoi conti» (conti_documenti, bucket
-- "ricevute"): tabella e bucket propri.
--
-- Documenti personali e delicati (un permesso di soggiorno): bucket privato
-- con una cartella per utente, RLS sulla tabella e sullo Storage, link
-- temporanei di 60 secondi (src/lib/cassetto/limiti.ts). La riga punta ad
-- auth.users con "on delete cascade"; i file li cancella
-- src/lib/account/eliminazione.ts prima dell'utente.

create table public.cassetto_documenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titolo text not null check (char_length(titolo) between 1 and 120),
  -- I tipi di TIPI_DOCUMENTO in src/lib/cassetto/tipi.ts (lo verifica supabase/schema.test.ts).
  tipo text not null check (tipo in (
    'decisione_avs', 'numero_iva', 'estratto_rc', 'polizza', 'permesso', 'contratto', 'autorizzazione', 'altro'
  )),
  scade_il date check (scade_il between date '2000-01-01' and date '2100-12-31'),
  nota text check (char_length(nota) <= 500),
  -- "<user_id>/<uuid>.<estensione>" nel bucket "cassetto".
  percorso text not null unique,
  tipo_file text not null check (tipo_file in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  nome_file text check (char_length(nome_file) <= 200),
  byte int not null check (byte between 1 and 3500000),
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  constraint cassetto_documenti_percorso_utente check (
    percorso ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$')
  )
);
create index cassetto_documenti_utente on public.cassetto_documenti (user_id, scade_il);
alter table public.cassetto_documenti enable row level security;
create policy "cassetto_documenti: propri" on public.cassetto_documenti
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Dopo il caricamento si cambiano solo nome, tipo, scadenza e nota: il file
-- (percorso, tipo, peso) resta quello caricato.
revoke update on public.cassetto_documenti from anon, authenticated;
grant update (titolo, tipo, scade_il, nota, aggiornato_il) on public.cassetto_documenti to authenticated;

-- Al massimo 100 documenti per utente (DOCUMENTI_MASSIMI in src/lib/cassetto/limiti.ts,
-- lo verifica supabase/schema.test.ts). Stessa funzione delle tabelle dei conti.
create trigger limita_cassetto_documenti before insert on public.cassetto_documenti
  for each row execute function public.limita_righe_conti('100');

-- ---------------------------------------------------------------------------
-- Storage: bucket privato "cassetto". Ogni utente vede, carica e cancella
-- solo i file nella sua cartella "<user_id>/". Stessi limiti delle ricevute:
-- foto (ridotte in JPEG da sito e app) e PDF fino a 3,5 MB.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cassetto', 'cassetto', false, 3500000,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "cassetto: lettura propria" on storage.objects
  for select to authenticated
  using (bucket_id = 'cassetto' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cassetto: caricamento proprio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cassetto' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "cassetto: cancellazione propria" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cassetto' and (storage.foldername(name))[1] = (select auth.uid())::text);
