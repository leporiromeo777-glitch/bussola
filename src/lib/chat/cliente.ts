import { MESSAGGI } from "./messaggi";
import { LettoreNdjson } from "./ndjson";
import type { EventoChat, QuotaPubblica, ScambioPrecedente } from "./tipi";

export type EventoFine = Extract<EventoChat, { t: "fine" }>;

export type EsitoChiamata =
  | { tipo: "fine"; evento: EventoFine }
  | { tipo: "errore"; messaggio: string; stato?: number; quota?: QuotaPubblica }
  | { tipo: "interrotta" };

type Opzioni = {
  domanda: string;
  /** Scambi precedenti: servono solo senza `conversazioneId` (con la chat, il contesto lo prende il server). */
  cronologia: ScambioPrecedente[];
  /** La chat salvata in cui continuare; senza, il server ne apre una nuova. */
  conversazioneId?: string | null;
  segnale: AbortSignal;
  /** Chiamata per ogni pezzo di testo che arriva. */
  suTesto: (pezzo: string) => void;
  /** Chiamata quando il server dice in quale chat ha salvato la domanda (prima del testo). */
  suConversazione?: (conversazione: { id: string; titolo: string }) => void;
  fetchFn?: typeof fetch;
  indirizzo?: string;
};

/**
 * Manda la domanda a /api/chat e legge la risposta NDJSON man mano che
 * arriva. Restituisce l'evento finale o un errore già pronto da mostrare.
 */
export async function chiediABleo({
  domanda,
  cronologia,
  conversazioneId = null,
  segnale,
  suTesto,
  suConversazione,
  fetchFn = fetch,
  indirizzo = "/api/chat",
}: Opzioni): Promise<EsitoChiamata> {
  let risposta: Response;
  try {
    risposta = await fetchFn(indirizzo, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
      body: JSON.stringify(conversazioneId ? { domanda, conversazioneId } : { domanda, cronologia }),
      signal: segnale,
    });
  } catch {
    return segnale.aborted ? { tipo: "interrotta" } : { tipo: "errore", messaggio: MESSAGGI.rete };
  }

  if (!risposta.ok) {
    const corpo = (await risposta.json().catch(() => null)) as { messaggio?: unknown; quota?: QuotaPubblica } | null;
    return {
      tipo: "errore",
      messaggio: typeof corpo?.messaggio === "string" ? corpo.messaggio : MESSAGGI.erroreGenerico,
      stato: risposta.status,
      ...(corpo?.quota ? { quota: corpo.quota } : {}),
    };
  }
  if (!risposta.body) return { tipo: "errore", messaggio: MESSAGGI.erroreGenerico };

  const lettore = new LettoreNdjson();
  const decodifica = new TextDecoder();
  const flusso = risposta.body.getReader();
  try {
    for (;;) {
      const { value, done } = await flusso.read();
      const eventi = done
        ? [...lettore.aggiungi(decodifica.decode()), ...lettore.chiudi()]
        : lettore.aggiungi(decodifica.decode(value, { stream: true }));
      for (const evento of eventi) {
        if (evento.t === "testo") suTesto(evento.d);
        else if (evento.t === "conversazione") suConversazione?.({ id: evento.id, titolo: evento.titolo });
        else if (evento.t === "fine") return { tipo: "fine", evento };
        else return { tipo: "errore", messaggio: evento.messaggio };
      }
      if (done) return { tipo: "errore", messaggio: MESSAGGI.rispostaInterrotta };
    }
  } catch {
    return segnale.aborted ? { tipo: "interrotta" } : { tipo: "errore", messaggio: MESSAGGI.rispostaInterrotta };
  } finally {
    flusso.cancel().catch(() => {});
  }
}
