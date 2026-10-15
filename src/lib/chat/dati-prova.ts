/** Dati di prova condivisi dai test della chat (non usati dall'app). */
import type { BetaTextBlock } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { FrammentoTrovato } from "./frammenti";

/** Frammento di prova, come lo restituisce public.cerca_frammenti. */
export function frammento(parziale: Partial<FrammentoTrovato> & Pick<FrammentoTrovato, "frammento_id" | "fonte_id">) {
  return {
    titolo: `Titolo ${parziale.fonte_id}`,
    url: `https://www.esempio.admin.ch/${parziale.fonte_id}`,
    ente: "Ente di prova",
    verificato_il: "2026-10-15",
    titolo_sezione: null,
    testo: `Testo del frammento ${parziale.frammento_id}.`,
    punteggio: 0.5,
    ...parziale,
  } satisfies FrammentoTrovato;
}

/** Blocco di testo di Claude con citazioni ai documenti indicati (indice del documento). */
export function testoCitato(text: string, documenti: number[] = []): BetaTextBlock {
  return {
    type: "text",
    text,
    citations: documenti.length
      ? documenti.map((document_index) => ({
          type: "char_location" as const,
          cited_text: `passaggio citato dal documento ${document_index}`,
          document_index,
          document_title: null,
          start_char_index: 0,
          end_char_index: 10,
          file_id: null,
        }))
      : null,
  };
}
