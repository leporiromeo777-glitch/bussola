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
