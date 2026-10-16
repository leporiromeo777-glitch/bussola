/**
 * Chiamate al sito di Bleo con il token dell'accesso fatto nell'app
 * ("Authorization: Bearer"): chat e cancellazione dell'account.
 */
import { SITO_URL } from "./config";
import { supabase } from "./supabase";

/** Il token di accesso attuale (rinnovato da supabase-js se scaduto), oppure null. */
export async function tokenAttuale(): Promise<string | null> {
  const client = supabase();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}

/** fetch che aggiunge il token: da passare a chiediABleo (src/lib/chat/cliente.ts). */
export function fetchConToken(token: string): typeof fetch {
  return (url, init) => {
    const intestazioni = new Headers(init?.headers);
    intestazioni.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...init, headers: intestazioni });
  };
}

export const URL_CHAT = `${SITO_URL}/api/chat`;

/** Elimina l'account sul sito e poi esce anche sul telefono. */
export async function eliminaAccount(): Promise<{ ok: true } | { ok: false; messaggio: string }> {
  const token = await tokenAttuale();
  if (!token) return { ok: false, messaggio: "Non hai fatto l'accesso." };
  let risposta: Response;
  try {
    risposta = await fetch(`${SITO_URL}/api/account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return { ok: false, messaggio: "Non riesco a raggiungere Bleo: controlla la connessione e riprova." };
  }
  if (risposta.status !== 204) {
    const corpo = (await risposta.json().catch(() => null)) as { messaggio?: unknown } | null;
    return {
      ok: false,
      messaggio: typeof corpo?.messaggio === "string" ? corpo.messaggio : "Non è stato possibile eliminare l'account.",
    };
  }
  await supabase()?.auth.signOut({ scope: "local" });
  return { ok: true };
}
