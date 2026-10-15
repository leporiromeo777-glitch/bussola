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
