"use server";

import { redirect } from "next/navigation";
import { eliminaAccount } from "@/lib/account/eliminazione";
import { rispostaEliminazione } from "@/lib/account/esiti";
import { utenteCollegato } from "@/lib/percorso/account";

export type StatoEliminazione = { stato: "iniziale" } | { stato: "errore"; messaggio: string };

/**
 * Elimina l'account dell'utente collegato (stessa funzione di DELETE
 * /api/account), chiude la sessione e torna alla pagina iniziale.
 */
export async function eliminaIlMioAccount(): Promise<StatoEliminazione> {
  const collegamento = await utenteCollegato();
  const esito = collegamento.ok ? await eliminaAccount(collegamento.userId) : collegamento;
  const risposta = rispostaEliminazione(esito);
  if (risposta.status !== 204) return { stato: "errore", messaggio: risposta.messaggio };

  if (collegamento.ok) {
    // L'utente non esiste più: si tolgono solo i cookie della sessione.
    await collegamento.supabase.auth.signOut({ scope: "local" }).catch(() => {});
  }
  redirect("/");
}
