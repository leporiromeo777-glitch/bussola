import { z } from "zod";

/** Quanti frammenti chiedere a public.cerca_frammenti e passare a Claude. */
export const FRAMMENTI_PER_DOMANDA = 8;

/** Una riga restituita da public.cerca_frammenti (vedi la migrazione dello schema). */
export const schemaFrammentoTrovato = z.object({
  frammento_id: z.coerce.number(),
  fonte_id: z.string(),
  titolo: z.string(),
  url: z.string(),
  ente: z.string(),
  verificato_il: z.string(),
  titolo_sezione: z.string().nullable(),
  testo: z.string(),
  punteggio: z.coerce.number(),
});

export type FrammentoTrovato = z.infer<typeof schemaFrammentoTrovato>;

/** Valida le righe della ricerca; quelle malformate si scartano. */
export function leggiFrammenti(righe: unknown): FrammentoTrovato[] {
  if (!Array.isArray(righe)) return [];
  return righe.flatMap((riga) => {
    const esito = schemaFrammentoTrovato.safeParse(riga);
    return esito.success ? [esito.data] : [];
  });
}

/**
 * Tiene i primi `quanti` frammenti per punteggio e li raggruppa per fonte:
 * le fonti nell'ordine del loro frammento migliore, dentro ogni fonte i
 * frammenti per punteggio. Senza doppioni.
 */
export function raggruppaPerFonte(frammenti: FrammentoTrovato[], quanti = FRAMMENTI_PER_DOMANDA): FrammentoTrovato[] {
  const visti = new Set<number>();
  const migliori: FrammentoTrovato[] = [];
  for (const frammento of [...frammenti].sort((a, b) => b.punteggio - a.punteggio)) {
    if (migliori.length >= quanti) break;
    if (visti.has(frammento.frammento_id)) continue;
    visti.add(frammento.frammento_id);
    migliori.push(frammento);
  }

  const perFonte = new Map<string, FrammentoTrovato[]>();
  for (const frammento of migliori) {
    const gruppo = perFonte.get(frammento.fonte_id);
    if (gruppo) gruppo.push(frammento);
    else perFonte.set(frammento.fonte_id, [frammento]);
  }
  return [...perFonte.values()].flat();
}
