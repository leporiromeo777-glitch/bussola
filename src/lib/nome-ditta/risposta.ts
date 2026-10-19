/**
 * «Nome della ditta» nell'app: lettura delle risposte di POST
 * /api/nome-ditta (le proposte) e di POST /api/nome-ditta/verifica (il
 * registro di commercio). Logica pura, senza browser né React Native: la usa
 * mobile/src/lib/nome-ditta.ts. Si controlla la forma con zod: se il sito e
 * l'app non sono aggiornati insieme, meglio un messaggio chiaro che una
 * schermata rotta.
 */
import { z } from "zod";
import { MESSAGGI_NOME_DITTA, type Proposta } from "./proposte";
import type { DittaTrovata, EsitoRegistro } from "./zefix";

/** Quando il sito risponde con un errore senza messaggio (come la pagina del sito). */
export const MESSAGGIO_PROPOSTE_NON_RIUSCITE = "Non sono riuscito a proporti nomi. Riprova tra poco.";

const schemaDitta = z.object({
  nome: z.string(),
  forma: z.string().nullable(),
  sede: z.string().nullable(),
  uguale: z.boolean(),
});

/** Forma di EsitoRegistro (zefix.ts). */
export const schemaEsitoRegistro = z.discriminatedUnion("stato", [
  z.object({ stato: z.literal("trovati"), ditte: z.array(schemaDitta), uguale: z.boolean(), altre: z.boolean() }),
  z.object({ stato: z.literal("nessuno") }),
  z.object({ stato: z.literal("non_disponibile") }),
]);

const schemaProposta = z.object({ nome: z.string().min(1), perche: z.string(), registro: schemaEsitoRegistro });

export type PropostaConRegistro = Proposta & { registro: EsitoRegistro };

export type EsitoProposte =
  | { ok: true; proposte: PropostaConRegistro[] }
  | { ok: false; messaggio: string; stato: number };

function oggetto(corpo: unknown): Record<string, unknown> {
  return corpo && typeof corpo === "object" && !Array.isArray(corpo) ? (corpo as Record<string, unknown>) : {};
}

function messaggioDelSito(corpo: Record<string, unknown>): string {
  return typeof corpo.messaggio === "string" ? corpo.messaggio.trim() : "";
}

/**
 * Dalla risposta di POST /api/nome-ditta all'esito da mostrare. Come sul
 * sito: le proposte con una forma sbagliata si saltano; una lista vuota è
 * un esito valido («Nessuna idea valida»).
 */
export function leggiRispostaNomi(stato: number, corpo: unknown): EsitoProposte {
  const o = oggetto(corpo);
  if (stato >= 200 && stato < 300 && Array.isArray(o.proposte)) {
    const proposte = o.proposte.flatMap((p) => {
      const letta = schemaProposta.safeParse(p);
      return letta.success ? [letta.data] : [];
    });
    return { ok: true, proposte };
  }
  const ripiego =
    stato === 429 ? MESSAGGI_NOME_DITTA.troppeRichieste : stato === 503 ? MESSAGGI_NOME_DITTA.occupato : MESSAGGIO_PROPOSTE_NON_RIUSCITE;
  return { ok: false, messaggio: messaggioDelSito(o) || ripiego, stato };
}

/**
 * Dalla risposta di POST /api/nome-ditta/verifica: il registro, oppure
 * «non_disponibile» con il messaggio del sito se c'è. Come sul sito, i
 * controlli sulle regole del nome si mostrano comunque.
 */
export function leggiRispostaVerifica(stato: number, corpo: unknown): { registro: EsitoRegistro; messaggio: string | null } {
  const o = oggetto(corpo);
  if (stato >= 200 && stato < 300) {
    const registro = schemaEsitoRegistro.safeParse(o.registro);
    if (registro.success) return { registro: registro.data, messaggio: null };
    return { registro: { stato: "non_disponibile" }, messaggio: null };
  }
  const messaggio = messaggioDelSito(o) || (stato === 429 ? MESSAGGI_NOME_DITTA.troppiControlli : null);
  return { registro: { stato: "non_disponibile" }, messaggio };
}

/** «(Ditta individuale, Lugano)»: forma e sede di una ditta trovata, se ci sono. */
export function dettagliDitta(ditta: Pick<DittaTrovata, "forma" | "sede">): string {
  const parti = [ditta.forma, ditta.sede].filter(Boolean);
  return parti.length ? `(${parti.join(", ")})` : "";
}
