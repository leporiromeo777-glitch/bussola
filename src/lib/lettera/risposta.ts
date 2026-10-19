/**
 * «Fotografa la lettera» nell'app: lettura della risposta di POST
 * /api/lettera e di GET /api/lettera (la funzione è attiva?). Logica pura,
 * senza browser né React Native: la usa mobile/src/lib/lettera.ts.
 */
import { z } from "zod";
import { MESSAGGI_LETTERA } from "./richiesta";
import type { SpiegazioneLettera } from "./spiegazione";

/** Messaggio quando la richiesta non arriva al sito (rete assente, server irraggiungibile). */
export const MESSAGGIO_SENZA_CONNESSIONE = "Non riesco a raggiungere Bleo: controlla la connessione e riprova.";

/** Messaggio quando la richiesta dura troppo (il server smette dopo 60 secondi). */
export const MESSAGGIO_TROPPO_LENTO = "Bleo ci sta mettendo troppo. Riprova tra poco, magari con una foto più leggera.";

/**
 * Forma della spiegazione che manda il sito (pulisciSpiegazione in
 * spiegazione.ts). Si controlla lo stesso: se il sito e l'app non sono
 * aggiornati insieme, meglio un messaggio chiaro che una schermata rotta.
 */
const schemaSpiegazione = z.object({
  stato: z.enum(["ok", "illeggibile", "nonLettera"]),
  mittente: z.string().nullable(),
  cosE: z.string(),
  inBreve: z.string(),
  scadenze: z.array(z.object({ data: z.string(), eData: z.boolean(), cosa: z.string() })),
  importi: z.array(z.object({ importo: z.string(), cosa: z.string() })),
  cosaFare: z.array(z.string()),
  quandoChiedereAiuto: z.string().nullable(),
});

export type EsitoLettera =
  | { ok: true; spiegazione: SpiegazioneLettera }
  | { ok: false; messaggio: string; stato: number };

/** Messaggio di ripiego per uno stato HTTP, se il corpo non ne porta uno. */
function messaggioPerStato(stato: number): string {
  if (stato === 413) return MESSAGGI_LETTERA.fileGrande;
  if (stato === 415) return MESSAGGI_LETTERA.tipoNonValido;
  if (stato === 429) return MESSAGGI_LETTERA.troppeRichieste;
  if (stato === 503) return MESSAGGI_LETTERA.occupato;
  return MESSAGGI_LETTERA.nonCapito;
}

/**
 * Dalla risposta di POST /api/lettera (stato HTTP e corpo JSON già letto,
 * null se non era JSON) all'esito da mostrare: la spiegazione oppure il
 * messaggio del sito, o uno di ripiego in italiano semplice.
 */
export function leggiRispostaLettera(stato: number, corpo: unknown): EsitoLettera {
  const oggetto = corpo && typeof corpo === "object" && !Array.isArray(corpo) ? (corpo as Record<string, unknown>) : {};
  if (stato >= 200 && stato < 300) {
    const spiegazione = schemaSpiegazione.safeParse(oggetto.spiegazione);
    if (spiegazione.success) return { ok: true, spiegazione: spiegazione.data };
    return { ok: false, messaggio: MESSAGGI_LETTERA.nonCapito, stato };
  }
  const messaggio = typeof oggetto.messaggio === "string" ? oggetto.messaggio.trim() : "";
  return { ok: false, messaggio: messaggio || messaggioPerStato(stato), stato };
}

/**
 * Dalla risposta di GET /api/lettera: true o false se il sito lo dice,
 * null se non si sa (sito vecchio, rete assente). Con null l'app lascia
 * provare: se la funzione è spenta lo dirà la risposta all'invio.
 */
export function leggiDisponibilitaLettera(stato: number, corpo: unknown): boolean | null {
  if (stato < 200 || stato >= 300 || !corpo || typeof corpo !== "object") return null;
  const attiva = (corpo as { attiva?: unknown }).attiva;
  return typeof attiva === "boolean" ? attiva : null;
}
