-- Bussola: «Calendario sempre aggiornato».
--
-- Un link personale e segreto (https://<sito>/api/calendario/<token>) che
-- Google Calendar, Apple Calendario o Outlook rileggono da soli: le scadenze
-- del percorso (dalle risposte in questionari) e le votazioni da seguire.
--
-- Il token è casuale (192 bit, src/lib/percorso/abbonamento.ts) e qui c'è
-- solo la sua impronta SHA-256: chi legge il database non può ricostruire il
-- link. Il server legge il calendario con la chiave segreta, cercando
-- l'impronta. Un link per utente: «Rigenera il link» toglie il vecchio e
-- salva il nuovo (nuovo_link_calendario), «Disattiva» lo cancella.
-- Eliminando l'account il link si cancella a cascata.

create table public.link_calendario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  impronta text not null unique check (impronta ~ '^[0-9a-f]{64}$'),
  creato_il timestamptz not null default now(),
  -- Ultima volta che un calendario ha letto il link (lo scrive il server, al più una volta l'ora).
  letto_il timestamptz
);
alter table public.link_calendario enable row level security;

create policy "link_calendario: lettura propria" on public.link_calendario
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "link_calendario: creazione propria" on public.link_calendario
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "link_calendario: revoca propria" on public.link_calendario
  for delete to authenticated using ((select auth.uid()) = user_id);

-- L'utente legge, crea (solo utente e impronta) e cancella; non modifica.
-- Il server con la chiave segreta cerca l'impronta e segna letto_il.
revoke all on public.link_calendario from anon;
revoke insert, update on public.link_calendario from authenticated;
grant select, delete on public.link_calendario to authenticated;
grant insert (user_id, impronta) on public.link_calendario to authenticated;
grant select, update (letto_il) on public.link_calendario to service_role;

-- Le date le decide il database, qualunque sia il client.
create function public.link_calendario_nuovo() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.creato_il := now();
  new.letto_il := null;
  return new;
end;
$$;
create trigger link_calendario_nuovo before insert on public.link_calendario
  for each row execute function public.link_calendario_nuovo();

-- Il link nuovo al posto del vecchio, in una sola transazione: non resta mai
-- un utente con due link, né senza link se qualcosa va storto. Con i
-- permessi di chi chiama (security invoker): valgono la RLS e i grant sopra.
create function public.nuovo_link_calendario(p_impronta text)
returns table (id uuid, creato_il timestamptz)
language plpgsql security invoker set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'utente mancante' using errcode = '42501';
  end if;
  delete from public.link_calendario as l where l.user_id = v_uid;
  return query
    insert into public.link_calendario as l (user_id, impronta)
    values (v_uid, p_impronta)
    returning l.id, l.creato_il;
end;
$$;
revoke execute on function public.nuovo_link_calendario(text) from public, anon;
grant execute on function public.nuovo_link_calendario(text) to authenticated;
revoke execute on function public.link_calendario_nuovo() from public, anon, authenticated;
