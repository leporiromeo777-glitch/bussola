import type { BetaMessage, BetaTextCitation } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { FrammentoTrovato } from "./frammenti";
import { MESSAGGI } from "./messaggi";
import { testoSemplice } from "./testo-risposta";
import type { BloccoRisposta, CitazioneMappata, FonteCitata } from "./tipi";

const LUNGHEZZA_MASSIMA_CITATO = 300;

export type RispostaInterpretata = {
  risposta: BloccoRisposta[];
  fonti: FonteCitata[];
  senza_risposta: boolean;
  avviso?: string;
};

function indiceDocumento(citazione: BetaTextCitation): number | null {
  return "document_index" in citazione && typeof citazione.document_index === "number"
    ? citazione.document_index
    : null;
}

function accorcia(testo: string): string {
  const pulito = testo.replace(/\s+/g, " ").trim();
  return pulito.length > LUNGHEZZA_MASSIMA_CITATO ? `${pulito.slice(0, LUNGHEZZA_MASSIMA_CITATO - 1)}…` : pulito;
}

/**
 * Trasforma il contenuto della risposta di Claude in blocchi di testo con le
 * citazioni numerate. `document_index` è l'indice del frammento passato come
 * documento; le fonti si numerano nell'ordine in cui vengono citate.
 */
export function mappaCitazioni(
  contenuto: BetaMessage["content"],
  frammenti: FrammentoTrovato[],
): { risposta: BloccoRisposta[]; fonti: FonteCitata[] } {
  const numeri = new Map<string, FonteCitata>();
  const risposta: BloccoRisposta[] = [];

  for (const blocco of contenuto) {
    if (blocco.type !== "text") continue;
    const citazioni: CitazioneMappata[] = [];
    for (const citazione of blocco.citations ?? []) {
      const indice = indiceDocumento(citazione);
      const frammento = indice === null ? undefined : frammenti[indice];
      if (!frammento) continue;
      const fonte = numeri.get(frammento.fonte_id) ?? {
        numero: numeri.size + 1,
        fonte_id: frammento.fonte_id,
        titolo: frammento.titolo,
        url: frammento.url,
        ente: frammento.ente,
        verificato_il: frammento.verificato_il,
      };
      numeri.set(frammento.fonte_id, fonte);
      if (!citazioni.some((c) => c.numero === fonte.numero)) {
        citazioni.push({ ...fonte, citato: accorcia(citazione.cited_text) });
      }
    }
    if (blocco.text || citazioni.length) risposta.push({ testo: blocco.text, citazioni });
  }

  return { risposta, fonti: [...numeri.values()] };
}

/**
 * Interpreta la risposta finale di Claude controllando prima `stop_reason`:
 * rifiuto → messaggio cortese senza fonti; troppo lunga → testo con un avviso.
 * Una risposta senza citazioni conta come "senza risposta" (manca una fonte).
 */
export function interpretaRisposta(
  messaggio: Pick<BetaMessage, "stop_reason" | "content">,
  frammenti: FrammentoTrovato[],
): RispostaInterpretata {
  if (messaggio.stop_reason === "refusal") {
    return { risposta: [{ testo: MESSAGGI.rifiuto, citazioni: [] }], fonti: [], senza_risposta: true };
  }

  const { risposta, fonti } = mappaCitazioni(messaggio.content, frammenti);
  const troncata =
    messaggio.stop_reason === "max_tokens" || messaggio.stop_reason === "model_context_window_exceeded";

  if (!testoSemplice(risposta)) {
    return {
      risposta: [{ testo: troncata ? MESSAGGI.troncata : MESSAGGI.rispostaVuota, citazioni: [] }],
      fonti: [],
      senza_risposta: true,
    };
  }
  return {
    risposta,
    fonti,
    senza_risposta: fonti.length === 0,
    ...(troncata ? { avviso: MESSAGGI.troncata } : {}),
  };
}
