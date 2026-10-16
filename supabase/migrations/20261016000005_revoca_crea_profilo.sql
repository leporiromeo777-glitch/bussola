-- Bussola: crea_profilo serve solo al trigger su auth.users (avviso del
-- linter di sicurezza di Supabase, 16.10.2026). Una funzione trigger non si
-- può eseguire da sola, ma togliamo comunque il permesso di chiamarla via API.
revoke execute on function public.crea_profilo() from public, anon, authenticated;
