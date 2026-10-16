"use client";

/** Chiamate della pagina /conti alle API /api/conti (con i cookie della sessione). */

export type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string; stato: number | null };

const MESSAGGIO_RETE = "Non riesco a raggiungere Bleo: controlla la connessione e riprova.";
const MESSAGGIO_GENERICO = "Qualcosa non ha funzionato. Riprova tra poco.";

export async function chiama<T>(url: string, opzioni: { metodo?: string; corpo?: unknown } = {}): Promise<Esito<T>> {
  let risposta: Response;
  try {
    risposta = await fetch(url, {
      method: opzioni.metodo ?? "GET",
      headers: opzioni.corpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: opzioni.corpo === undefined ? undefined : JSON.stringify(opzioni.corpo),
      cache: "no-store",
    });
  } catch {
    return { ok: false, messaggio: MESSAGGIO_RETE, stato: null };
  }
  if (risposta.status === 204) return { ok: true, dati: undefined as T };
  const corpo = (await risposta.json().catch(() => null)) as unknown;
  if (!risposta.ok) {
    const messaggio = (corpo as { messaggio?: unknown } | null)?.messaggio;
    return {
      ok: false,
      messaggio: typeof messaggio === "string" && messaggio ? messaggio : MESSAGGIO_GENERICO,
      stato: risposta.status,
    };
  }
  return { ok: true, dati: corpo as T };
}
