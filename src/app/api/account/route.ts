import { eliminaAccount } from "@/lib/account/eliminazione";
import { rispostaEliminazione, type EsitoEliminazione } from "@/lib/account/esiti";
import { utenteDaRichiesta } from "@/lib/supabase/richiesta";

/**
 * DELETE /api/account — elimina per sempre l'account di chi chiede, con i
 * suoi dati (linee guida App Store 5.1.1(v)). Vale il token
 * `Authorization: Bearer` dell'app oppure la sessione del sito (cookie).
 * 204 senza corpo; 401 senza accesso; 503 in modalità demo; 500 se non riesce.
 * Dopo il 204 l'app deve chiudere la sessione anche sul telefono.
 */
export async function DELETE(request: Request) {
  const utente = await utenteDaRichiesta(request);
  const esito: EsitoEliminazione = utente.ok ? await eliminaAccount(utente.user.id) : utente;
  const risposta = rispostaEliminazione(esito);
  if (risposta.status === 204) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  return Response.json(
    { messaggio: risposta.messaggio },
    { status: risposta.status, headers: { "Cache-Control": "no-store" } },
  );
}
