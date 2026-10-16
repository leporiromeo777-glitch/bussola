-- Bussola: le chat salvate di «Chiedi a Bleo», come in ChatGPT.
--
-- Ogni chat (chat_conversazioni) tiene le domande dell'utente e le risposte
-- di Bleo con le fonti (chat_messaggi), così si può riaprirla. L'utente le
-- legge, le rinomina e le cancella; le scrive il server con il client
-- dell'utente (RLS), dopo aver contato la domanda con prenota_domanda.
-- domande_chat resta com'è: conta la quota e il registro delle fonti.
--
-- Conservazione: una chat senza attività da 12 mesi si cancella nella
-- pulizia notturna (come le domande in domande_chat). Ogni riga punta ad
-- auth.users con "on delete cascade": eliminando l'account si cancella tutto.

-- ---------------------------------------------------------------------------
-- Le chat. aggiornata_il = ultimo messaggio (lo aggiorna il trigger sotto).
-- ---------------------------------------------------------------------------
create table public.chat_conversazioni (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- 60 = TITOLO_MASSIMO in src/lib/chat/conversazioni.ts (lo verifica supabase/schema.test.ts).
  titolo text not null check (char_length(titolo) between 1 and 60),
  creata_il timestamptz not null default now(),
  aggiornata_il timestamptz not null default now()
);
create index chat_conversazioni_utente on public.chat_conversazioni (user_id, aggiornata_il desc);
-- Per la pulizia notturna.
create index chat_conversazioni_aggiornata on public.chat_conversazioni (aggiornata_il);
alter table public.chat_conversazioni enable row level security;

create policy "chat_conversazioni: lettura propria" on public.chat_conversazioni
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "chat_conversazioni: creazione propria" on public.chat_conversazioni
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "chat_conversazioni: modifica propria" on public.chat_conversazioni
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "chat_conversazioni: cancellazione propria" on public.chat_conversazioni
  for delete to authenticated using ((select auth.uid()) = user_id);

-- L'utente cambia solo il titolo; le date le mette il database.
revoke all on public.chat_conversazioni from anon;
revoke insert, update on public.chat_conversazioni from authenticated;
grant insert (user_id, titolo), update (titolo) on public.chat_conversazioni to authenticated;

-- ---------------------------------------------------------------------------
-- I messaggi: la domanda ("utente") e la risposta di Bleo ("bleo") con i
-- blocchi citati, le fonti, se mancava una fonte e l'eventuale avviso.
-- user_id è sempre quello della chat (trigger sotto).
-- ---------------------------------------------------------------------------
create table public.chat_messaggi (
  id bigint generated always as identity primary key,
  conversazione_id uuid not null references public.chat_conversazioni (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  ruolo text not null check (ruolo in ('utente', 'bleo')),
  testo text not null,
  risposta jsonb,
  fonti jsonb,
  senza_risposta boolean not null default false,
  avviso text check (char_length(avviso) <= 1000),
  creato_il timestamptz not null default now(),
  -- La domanda come in domande_chat (1-1000 caratteri); la risposta resta sotto 8000 token di Claude.
  constraint chat_messaggi_testo_lunghezza check (
    case ruolo when 'utente' then char_length(testo) between 1 and 1000 else char_length(testo) <= 40000 end
  ),
  -- Blocchi e fonti solo nelle risposte, sempre come elenchi.
  constraint chat_messaggi_risposta check (
    case ruolo
      when 'utente' then risposta is null and fonti is null and avviso is null and not senza_risposta
      else jsonb_typeof(risposta) = 'array' and jsonb_typeof(fonti) = 'array'
    end
  ),
  constraint chat_messaggi_dimensione check (
    coalesce(octet_length(risposta::text), 0) + coalesce(octet_length(fonti::text), 0) <= 500000
  )
);
create index chat_messaggi_conversazione on public.chat_messaggi (conversazione_id, id);
create index chat_messaggi_utente on public.chat_messaggi (user_id);
alter table public.chat_messaggi enable row level security;

create policy "chat_messaggi: lettura propria" on public.chat_messaggi
  for select to authenticated using ((select auth.uid()) = user_id);
-- Il server scrive con il client dell'utente, solo nelle sue chat (trigger sotto).
create policy "chat_messaggi: creazione propria" on public.chat_messaggi
  for insert to authenticated with check ((select auth.uid()) = user_id);
-- Nessuna modifica né cancellazione diretta: si cancella la chat intera.
revoke all on public.chat_messaggi from anon;
revoke insert, update, delete on public.chat_messaggi from authenticated;
grant insert (conversazione_id, user_id, ruolo, testo, risposta, fonti, senza_risposta, avviso)
  on public.chat_messaggi to authenticated;

-- ---------------------------------------------------------------------------
-- Date e proprietario decisi dal database, qualunque sia il client.
-- ---------------------------------------------------------------------------

-- Una chat nuova parte adesso: nessuno la sottrae alla pulizia con date finte.
create function public.chat_conversazione_nuova() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.creata_il := now();
  new.aggiornata_il := now();
  return new;
end;
$$;
create trigger chat_conversazione_nuova before insert on public.chat_conversazioni
  for each row execute function public.chat_conversazione_nuova();

-- Chi modifica una chat cambia solo il titolo. aggiornata_il lo sposta solo
-- il trigger dei messaggi (pg_trigger_depth() > 1).
create function public.chat_conversazione_modifica() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.id := old.id;
  new.user_id := old.user_id;
  new.creata_il := old.creata_il;
  if pg_trigger_depth() <= 1 then
    new.aggiornata_il := old.aggiornata_il;
  end if;
  return new;
end;
$$;
create trigger chat_conversazione_modifica before update on public.chat_conversazioni
  for each row execute function public.chat_conversazione_modifica();

-- Un messaggio appartiene a chi possiede la chat: user_id deve coincidere.
-- security definer: vede la chat anche se il client non può leggerla, per
-- rifiutare con un errore chiaro invece di accettare.
create function public.chat_messaggio_nuovo() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_proprietario uuid;
begin
  select user_id into v_proprietario from public.chat_conversazioni where id = new.conversazione_id;
  if v_proprietario is null or v_proprietario <> new.user_id then
    raise exception 'chat di un altro utente' using errcode = '42501';
  end if;
  new.creato_il := now();
  return new;
end;
$$;
create trigger chat_messaggio_nuovo before insert on public.chat_messaggi
  for each row execute function public.chat_messaggio_nuovo();

-- Ogni messaggio porta la chat in cima all'elenco.
create function public.chat_messaggio_aggiorna_chat() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.chat_conversazioni set aggiornata_il = now() where id = new.conversazione_id;
  return null;
end;
$$;
create trigger chat_messaggio_aggiorna_chat after insert on public.chat_messaggi
  for each row execute function public.chat_messaggio_aggiorna_chat();

-- Al massimo tante righe per utente (stessa funzione dei conti): nessuno
-- riempie il database scrivendo direttamente con PostgREST.
create trigger limita_chat_conversazioni before insert on public.chat_conversazioni
  for each row execute function public.limita_righe_conti('2000');
create trigger limita_chat_messaggi before insert on public.chat_messaggi
  for each row execute function public.limita_righe_conti('20000');

-- ---------------------------------------------------------------------------
-- Pulizia giornaliera: in più le chat senza attività da 12 mesi (i messaggi
-- se ne vanno con la chat). Stesso corpo di 20261017000000_conti.sql, più
-- l'ultima riga.
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

  -- Chat salvate: 12 mesi dopo l'ultimo messaggio, come le domande.
  delete from public.chat_conversazioni
   where aggiornata_il < now() - interval '12 months';
end;
$$;
