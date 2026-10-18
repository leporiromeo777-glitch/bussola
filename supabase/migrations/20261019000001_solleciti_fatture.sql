-- Bussola: «I tuoi conti», sollecito di pagamento delle fatture scadute.
--
-- Per ogni fattura emessa si ricorda l'ultimo sollecito che l'utente ha
-- segnato come inviato: il giorno e il livello (1 = promemoria gentile,
-- 2 = sollecito più deciso, con gli interessi di mora). Così Bleo propone il
-- livello giusto la volta dopo e l'elenco mostra «Sollecito inviato il …».
-- Il testo del sollecito lo manda l'utente con la sua email o un'altra app:
-- nel database non c'è.
--
-- Le righe restano protette dalla policy «conti_fatture: proprie» (RLS,
-- user_id = auth.uid()): ognuno segna i solleciti solo sulle sue fatture.
-- Le colonne nuove non toccano il trigger conti_sincronizza_fattura, che
-- guarda solo pagamento, importo, numero e cliente.

alter table public.conti_fatture
  add column sollecito_il date,
  -- 1 e 2 = LIVELLI_SOLLECITO in src/lib/conti/tipi.ts (lo verifica supabase/schema.test.ts).
  add column sollecito_livello smallint,
  add constraint conti_fatture_sollecito check (
    (sollecito_il is null) = (sollecito_livello is null)
    and (sollecito_livello is null or sollecito_livello in (1, 2))
    and (sollecito_il is null or sollecito_il >= data)
  );
