-- Bussola: «Budget del primo anno» e «Business plan di una pagina» nell'account.
--
-- I dati dei due strumenti /strumenti/budget e /strumenti/business-plan (e
-- delle stesse schermate nell'app). Con l'accesso si salvano qui e si vedono
-- sul sito e nel telefono; senza account restano nel browser o sul telefono,
-- come prima.
--
-- Una riga per strumento e per utente (chiave primaria): al massimo due righe
-- a testa. Il contenuto è quello dello strumento in JSON (DatiBudget in
-- src/lib/strumenti/budget.ts, DatiPiano in src/lib/strumenti/business-plan.ts).
-- Il server lo controlla con zod (src/lib/strumenti/salvati.ts) prima di
-- salvarlo e lo rilegge con lo schema dello strumento quando lo restituisce.
-- Qui i vincoli che valgono anche per chi scrivesse direttamente con
-- PostgREST: un oggetto JSON non troppo grande, con la forma dello strumento.
--
-- Tutto punta ad auth.users con "on delete cascade": eliminando l'account si
-- cancella tutto.

create table public.strumenti_salvati (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- STRUMENTI_SALVATI in src/lib/strumenti/salvati.ts (lo verifica supabase/schema.test.ts).
  strumento text not null check (strumento in ('budget', 'business-plan')),
  contenuto jsonb not null,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  primary key (user_id, strumento),
  -- CONTENUTO_STRUMENTO_MASSIMO in src/lib/strumenti/salvati.ts.
  constraint strumenti_salvati_contenuto check (
    jsonb_typeof(contenuto) = 'object'
    and octet_length(contenuto::text) <= 500000
    and (strumento <> 'budget' or (coalesce(jsonb_typeof(contenuto -> 'ricavi'), '') = 'array' and contenuto ? 'meseInizio'))
    and (strumento <> 'business-plan' or coalesce(jsonb_typeof(contenuto -> 'campi'), '') = 'object')
  )
);
alter table public.strumenti_salvati enable row level security;
create policy "strumenti_salvati: propri" on public.strumenti_salvati
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke all on public.strumenti_salvati from anon;
