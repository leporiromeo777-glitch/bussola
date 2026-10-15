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
