-- Bussola: tutte le migrazioni in ordine, per un progetto Supabase nuovo.
-- File generato da scripts/genera-sql-completo.mjs: non modificarlo a mano,
-- cambia le migrazioni in supabase/migrations/ e rigeneralo.

-- ===========================================================================
-- 20261015000000_schema_iniziale.sql
-- ===========================================================================

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

-- ===========================================================================
-- 20261016000000_quota_chat_atomica.sql
-- ===========================================================================

-- Bussola: quota della chat atomica (revisione SEC-01).
--
-- Prima la quota si controllava all'inizio e la domanda si registrava solo
-- alla fine, dopo la risposta di Claude: richieste parallele o interrotte a
-- metà non venivano contate. Ora la domanda si prenota (e quindi conta)
-- prima di chiamare Claude, sotto un lock per utente, e l'utente non scrive
-- più direttamente in domande_chat.

-- Prenota una domanda per l'utente collegato. Restituisce l'id della riga,
-- oppure null se la quota gratuita del mese è esaurita.
create function public.prenota_domanda(p_domanda text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_piano text;
  v_scade timestamptz;
  v_usate int;
  v_id bigint;
begin
  if v_uid is null then
    raise exception 'non autenticato' using errcode = '42501';
  end if;
  if p_domanda is null or char_length(p_domanda) not between 1 and 1000 then
    raise exception 'domanda non valida' using errcode = '22023';
  end if;

  -- Un lock per utente fino alla fine della transazione: le richieste
  -- parallele dello stesso utente passano una alla volta.
  perform pg_advisory_xact_lock(hashtextextended('domande_chat:' || v_uid::text, 0));

  -- Stessa regola di pianoEffettivo in src/lib/chat/quota.ts: "avvio" scaduto vale come "gratis".
  select piano, piano_scade_il into v_piano, v_scade from public.profili where id = v_uid;
  if coalesce(v_piano, 'gratis') = 'gratis'
     or (v_piano = 'avvio' and v_scade is not null and v_scade <= now()) then
    select count(*) into v_usate
      from public.domande_chat
     where user_id = v_uid
       and creato_il >= (date_trunc('month', now() at time zone 'Europe/Zurich') at time zone 'Europe/Zurich');
    -- 10 = DOMANDE_GRATIS_AL_MESE in src/lib/chat/quota.ts (lo verifica supabase/schema.test.ts).
    if v_usate >= 10 then
      return null;
    end if;
  end if;

  insert into public.domande_chat (user_id, domanda) values (v_uid, p_domanda) returning id into v_id;
  return v_id;
end;
$$;

-- Completa la riga prenotata con l'esito della risposta. Tiene solo le fonti
-- che esistono davvero (al massimo 20), così il registro non si può falsare.
create function public.chiudi_domanda(p_id bigint, p_fonti text[], p_senza boolean) returns void
language sql security definer set search_path = '' as $$
  update public.domande_chat
     set fonti_citate = array(
           select t.fonte
             from unnest(p_fonti[1:20]) with ordinality as t(fonte, n)
            where exists (select 1 from public.fonti f where f.id = t.fonte)
            order by t.n
         ),
         senza_risposta = coalesce(p_senza, false)
   where id = p_id and user_id = auth.uid();
$$;

revoke execute on function public.prenota_domanda(text) from public, anon;
revoke execute on function public.chiudi_domanda(bigint, text[], boolean) from public, anon;
grant execute on function public.prenota_domanda(text) to authenticated;
grant execute on function public.chiudi_domanda(bigint, text[], boolean) to authenticated;

-- Niente più insert diretti dell'utente: solo prenota_domanda.
-- Annullare una prenotazione (errore vero del modello o della ricerca) lo fa
-- solo il server con la chiave segreta: una funzione per l'utente
-- servirebbe ad azzerarsi la quota.
-- (alter invece di drop: stesso effetto, la policy non ammette più nessuna
-- riga; così la migrazione passa anche dove i drop chiedono una conferma.)
alter policy "domande: inserimento proprio" on public.domande_chat with check (false);

-- ===========================================================================
-- 20261016000001_limite_richieste.sql
-- ===========================================================================

-- Bussola: limite di richieste per connessione (revisione SEC-04).
--
-- Le azioni pubbliche che mandano email (iscrizione alla lista d'attesa,
-- link di accesso) partono dal nostro server: senza un limite uno script può
-- far partire migliaia di email. Qui si contano le richieste per chiave
-- (ambito + impronta HMAC dell'indirizzo IP, mai l'IP in chiaro) in una
-- finestra di tempo. Le righe vecchie si cancellano subito per la stessa
-- chiave e ogni giorno con public.pulisci_dati (migrazione successiva).

create table public.limiti_richieste (
  id bigint generated always as identity primary key,
  chiave text not null check (char_length(chiave) between 1 and 200),
  creato_il timestamptz not null default now()
);
create index limiti_richieste_chiave on public.limiti_richieste (chiave, creato_il);
alter table public.limiti_richieste enable row level security;
-- Nessuna policy: anon e utenti non leggono né scrivono; solo la chiave segreta.

-- Conta una richiesta per la chiave. true = consentita (e registrata),
-- false = limite raggiunto nella finestra.
create function public.consuma_limite(p_chiave text, p_massimo int, p_finestra_secondi int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_da timestamptz := now() - make_interval(secs => greatest(p_finestra_secondi, 1));
  v_usate int;
begin
  -- Le richieste con la stessa chiave passano una alla volta.
  perform pg_advisory_xact_lock(hashtextextended('limiti_richieste:' || p_chiave, 0));
  delete from public.limiti_richieste where chiave = p_chiave and creato_il < v_da;
  select count(*) into v_usate from public.limiti_richieste where chiave = p_chiave;
  if v_usate >= p_massimo then
    return false;
  end if;
  insert into public.limiti_richieste (chiave) values (p_chiave);
  return true;
end;
$$;

revoke execute on function public.consuma_limite(text, int, int) from public, anon, authenticated;
grant execute on function public.consuma_limite(text, int, int) to service_role;

-- ===========================================================================
-- 20261016000002_conferma_inviata.sql
-- ===========================================================================

-- Bussola: quando è partita l'ultima email di conferma (revisioni SEC-05 e F7).
--
-- Serve a rimandare il link a chi si iscrive di nuovo senza aver confermato
-- (al massimo una volta ogni 24 ore) e a distinguere le iscrizioni a cui la
-- conferma è stata spedita da quelle salvate senza email (invio non
-- configurato): solo le prime, se non confermate, si cancellano dopo 30
-- giorni (vedi la migrazione di pulizia dei dati).
alter table public.lista_attesa add column conferma_inviata_il timestamptz;

-- ===========================================================================
-- 20261016000003_vincoli_scrittura_utente.sql
-- ===========================================================================

-- Bussola: vincoli sulle tabelle che l'utente può scrivere (revisione SEC-06).
--
-- Con la chiave publishable (pubblica) e il proprio JWT, un utente collegato
-- può scrivere direttamente con PostgREST, senza passare dalle validazioni
-- dell'app. Questi vincoli tengono le righe nella forma e nella dimensione
-- che l'app usa davvero, così nessuno può riempire il database.
-- domande_chat si scrive ormai solo con prenota_domanda e chiudi_domanda.

alter table public.domande_chat
  add constraint domande_chat_domanda_lunghezza check (char_length(domanda) between 1 and 1000),
  add constraint domande_chat_fonti_massimo check (cardinality(fonti_citate) <= 20);

-- Gli id dei passi in src/data/passi.ts: minuscole, cifre e trattini.
alter table public.passi_completati
  add constraint passi_completati_id_formato check (passo_id ~ '^[a-z0-9-]{1,64}$');

-- Le risposte valide del questionario stanno sotto 1 KB.
alter table public.questionari
  add constraint questionari_risposte_oggetto check (jsonb_typeof(risposte) = 'object'),
  add constraint questionari_risposte_dimensione check (octet_length(risposte::text) <= 4096),
  add constraint questionari_versione_lunghezza check (char_length(versione_regole) <= 32);

-- Al massimo 100 passi completati per utente (i passi reali sono poco più di 20).
create function public.limita_passi() returns trigger
language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('passi_completati:' || new.user_id::text, 0));
  if (select count(*) from public.passi_completati where user_id = new.user_id) >= 100 then
    raise exception 'troppi passi completati' using errcode = '54000';
  end if;
  return new;
end;
$$;
create trigger limita_passi before insert on public.passi_completati
  for each row execute function public.limita_passi();

-- ===========================================================================
-- 20261016000004_pulizia_dati.sql
-- ===========================================================================

-- Bussola: cancellazione automatica dei dati scaduti (revisioni SEC-10 e F14).
--
-- L'informativa privacy promette dei tempi di conservazione: qui un job
-- giornaliero (pg_cron) li rispetta. La logica sta in public.pulisci_dati,
-- così si può provare a mano e nei test:
--   select public.pulisci_dati();
-- Ultime esecuzioni del job:
--   select * from cron.job_run_details order by start_time desc limit 5;

create function public.pulisci_dati() returns void
language plpgsql set search_path = '' as $$
begin
  -- Domande alla chat: 12 mesi. La quota guarda solo il mese corrente.
  delete from public.domande_chat
   where creato_il < now() - interval '12 months';

  -- Iscrizioni mai confermate: 30 giorni dopo l'ultima email di conferma.
  -- Solo quelle a cui la conferma è partita davvero: le iscrizioni salvate
  -- quando l'invio delle email non era attivo (conferma_inviata_il null)
  -- sono valide anche senza conferma e restano.
  delete from public.lista_attesa
   where confermato_il is null
     and conferma_inviata_il is not null
     and conferma_inviata_il < now() - interval '30 days';

  -- Contatori del limite per connessione: servono per un'ora, si tengono al più un giorno.
  delete from public.limiti_richieste
   where creato_il < now() - interval '1 day';
end;
$$;

-- La esegue solo il job (proprietario del database), non gli utenti.
revoke execute on function public.pulisci_dati() from public, anon, authenticated;

-- Ogni giorno alle 03:17 (UTC, l'ora del database su Supabase).
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('pulizia-dati', '17 3 * * *', $$select public.pulisci_dati()$$);

-- ===========================================================================
-- 20261016000005_revoca_crea_profilo.sql
-- ===========================================================================

-- Bussola: crea_profilo serve solo al trigger su auth.users (avviso del
-- linter di sicurezza di Supabase, 16.10.2026). Una funzione trigger non si
-- può eseguire da sola, ma togliamo comunque il permesso di chiamarla via API.
revoke execute on function public.crea_profilo() from public, anon, authenticated;

-- ===========================================================================
-- 20261017000000_conti.sql
-- ===========================================================================

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

-- ===========================================================================
-- 20261018000000_chat_conversazioni.sql
-- ===========================================================================

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

-- ===========================================================================
-- 20261019000003_calendario_abbonamento.sql
-- ===========================================================================

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
