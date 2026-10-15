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
drop policy "domande: inserimento proprio" on public.domande_chat;
