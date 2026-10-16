import { richiestaConsentita } from "@/lib/limiti/server";
import { MESSAGGI_NOME_DITTA, leggiRichiestaVerifica } from "@/lib/nome-ditta/proposte";
import { cercaSuZefix } from "@/lib/nome-ditta/zefix";

export const maxDuration = 15;

function json(status: number, corpo: Record<string, unknown>) {
  return Response.json(corpo, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/nome-ditta/verifica — { nome } → { registro }.
 * Cerca su Zefix le ditte attive con le stesse parole del nome scritto da
 * chi usa lo strumento. Non usa Claude: funziona anche in modalità demo.
 * Conta nel limite «nomeDitta» della connessione; se il limite non si può
 * verificare la richiesta passa (Zefix è gratuito e ha un tempo massimo).
 */
export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, { messaggio: MESSAGGI_NOME_DITTA.richiestaNonValida });
  }
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return json(400, { messaggio: MESSAGGI_NOME_DITTA.richiestaNonValida });
  }
  const richiesta = leggiRichiestaVerifica(corpo);
  if (!richiesta.ok) return json(400, { messaggio: richiesta.messaggio });

  if (!(await richiestaConsentita("zefix"))) {
    return json(429, { messaggio: MESSAGGI_NOME_DITTA.troppiControlli });
  }

  const registro = await cercaSuZefix(richiesta.dati.nome, { segnale: request.signal });
  return json(200, { registro });
}
