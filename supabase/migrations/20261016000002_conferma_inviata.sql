-- Bussola: quando è partita l'ultima email di conferma (revisioni SEC-05 e F7).
--
-- Serve a rimandare il link a chi si iscrive di nuovo senza aver confermato
-- (al massimo una volta ogni 24 ore) e a distinguere le iscrizioni a cui la
-- conferma è stata spedita da quelle salvate senza email (invio non
-- configurato): solo le prime, se non confermate, si cancellano dopo 30
-- giorni (vedi la migrazione di pulizia dei dati).
alter table public.lista_attesa add column conferma_inviata_il timestamptz;
