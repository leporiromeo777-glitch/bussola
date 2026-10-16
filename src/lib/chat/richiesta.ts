import { z } from "zod";
import {
  LUNGHEZZA_MASSIMA_DOMANDA,
  LUNGHEZZA_MASSIMA_RISPOSTA_PRECEDENTE,
  LUNGHEZZA_MINIMA_DOMANDA,
  SCAMBI_PRECEDENTI_MASSIMI,
} from "./limiti";

/** Forma di un uuid (gli id delle chat). */
export const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** true se il valore ha la forma di un id di chat. */
export function idChatValido(valore: unknown): valore is string {
  return typeof valore === "string" && FORMA_UUID.test(valore);
}

/**
 * Corpo della richiesta POST /api/chat. Con `conversazioneId` la domanda va
 * in quella chat e il contesto lo prende il server dai messaggi salvati
 * (`cronologia` si ignora); senza, il server apre una chat nuova e usa
 * `cronologia` se c'è (client che non conoscono le chat salvate).
 */
export const schemaRichiesta = z.object({
  conversazioneId: z
    .string({ error: "La chat non è valida." })
    .regex(FORMA_UUID, { error: "La chat non è valida." })
    .nullable()
    .default(null),
  domanda: z
    .string({ error: "Scrivi la tua domanda." })
    .trim()
    .min(LUNGHEZZA_MINIMA_DOMANDA, { error: "La domanda è troppo corta: scrivi almeno qualche parola." })
    .max(LUNGHEZZA_MASSIMA_DOMANDA, {
      error: `La domanda è troppo lunga: al massimo ${LUNGHEZZA_MASSIMA_DOMANDA} caratteri.`,
    }),
  cronologia: z
    .array(
      z.object({
        domanda: z.string().trim().max(LUNGHEZZA_MASSIMA_DOMANDA),
        risposta: z.string().trim().max(LUNGHEZZA_MASSIMA_RISPOSTA_PRECEDENTE),
      }),
      { error: "La conversazione precedente non è valida." },
    )
    .max(SCAMBI_PRECEDENTI_MASSIMI, { error: `Si possono mandare al massimo ${SCAMBI_PRECEDENTI_MASSIMI} scambi precedenti.` })
    .default([]),
});

export type RichiestaChat = z.infer<typeof schemaRichiesta>;

/** Valida il corpo; in caso di errore restituisce un messaggio in italiano da mostrare. */
export function leggiRichiesta(corpo: unknown): { ok: true; dati: RichiestaChat } | { ok: false; messaggio: string } {
  const esito = schemaRichiesta.safeParse(corpo);
  if (esito.success) return { ok: true, dati: esito.data };
  const primo = esito.error.issues[0];
  if (primo?.path[0] === "domanda" || primo?.path[0] === "conversazioneId") return { ok: false, messaggio: primo.message };
  if (primo?.path[0] === "cronologia") {
    return {
      ok: false,
      messaggio:
        primo.path.length === 1 ? primo.message : "La conversazione precedente non è valida: ricarica la pagina.",
    };
  }
  return { ok: false, messaggio: "La richiesta non è valida." };
}
