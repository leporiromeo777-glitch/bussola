/**
 * Il percorso nell'account (risposte al questionario e passi fatti) tra il
 * sito e l'app: indirizzo dell'API, forma delle risposte, controlli delle
 * richieste e messaggi. Funzioni pure: le usano la route
 * (src/app/api/percorso) e l'app (mobile/src/lib/percorso-account.ts).
 */
import { z } from "zod";
import { eIdPasso, ID_PASSI, type IdPasso } from "@/data/passi";
import { leggiRisposte, type Risposte } from "./risposte";

/**
 * - GET → PercorsoAccount
 * - PUT { risposte } → PercorsoAccount (dopo il salvataggio)
 * - PATCH { fatti?: IdPasso[], daFare?: IdPasso[] } → PercorsoAccount
 */
export const PERCORSO_API = "/api/percorso";

/** Le risposte valide stanno sotto 1 KB (questionari_risposte_dimensione): 8 KB bastano e avanzano. */
export const CORPO_MASSIMO_PERCORSO = 8_192;

/** Quello che l'account sa del percorso. */
export type PercorsoAccount = {
  /** null se nell'account non ci sono risposte (o sono di una versione vecchia del questionario). */
  risposte: Risposte | null;
  /** Momento dell'ultimo salvataggio delle risposte (ISO), null senza risposte. */
  aggiornatoIl: string | null;
  passiFatti: IdPasso[];
};

/** Passi da segnare come fatti e come di nuovo da fare. */
export type ModifichePassi = { fatti: IdPasso[]; daFare: IdPasso[] };

export const MESSAGGI_PERCORSO = {
  nonAttivo: "Il salvataggio del percorso nell'account non è attivo in questa versione: il percorso resta su questo dispositivo.",
  nonCollegato: "Accedi di nuovo per salvare il percorso nel tuo account.",
  richiestaNonValida: "La richiesta non è valida. Riprova.",
  troppoLungo: "La richiesta è troppo lunga.",
  risposteNonValide: "Le risposte del questionario non sono valide: rifai il questionario e riprova.",
  passiNonValidi: "I passi fatti non sono validi. Riprova.",
  troppiPassi: "Ci sono troppi passi segnati nel tuo account. Togline qualcuno e riprova.",
  erroreDatabase: "Non riesco a salvare nel tuo account adesso. Riprova tra poco.",
} as const;

/** Momento ISO valido (normalizzato), altrimenti null. */
export function momentoIso(valore: unknown): string | null {
  if (typeof valore !== "string") return null;
  const t = Date.parse(valore);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** La risposta delle API, controllata (dal lato di chi la riceve). Null se non ha la forma giusta. */
export function leggiPercorsoAccount(dati: unknown): PercorsoAccount | null {
  if (!dati || typeof dati !== "object") return null;
  const { risposte, aggiornatoIl, passiFatti } = dati as Record<string, unknown>;
  if (!Array.isArray(passiFatti)) return null;
  const valide = risposte === null || risposte === undefined ? null : leggiRisposte(risposte);
  return {
    risposte: valide,
    aggiornatoIl: valide ? momentoIso(aggiornatoIl) : null,
    passiFatti: [...new Set(passiFatti.filter(eIdPasso))],
  };
}

const schemaRichiestaRisposte = z.object({ risposte: z.unknown() });

/** Il corpo di PUT: le risposte del questionario, valide e della versione attuale. */
export function leggiRichiestaRisposte(corpo: unknown): Risposte | null {
  const letto = schemaRichiestaRisposte.safeParse(corpo);
  return letto.success ? leggiRisposte(letto.data.risposte) : null;
}

/** Stessa forma del vincolo passi_completati_id_formato nel database. */
const idPasso = z.string().regex(/^[a-z0-9-]{1,64}$/);
const elencoPassi = z.array(idPasso).max(ID_PASSI.length * 2).default([]);
const schemaModifichePassi = z.object({ fatti: elencoPassi, daFare: elencoPassi }).strict();

/**
 * Il corpo di PATCH. Gli id che questa versione non conosce si ignorano (per
 * esempio un passo tolto dal catalogo); lo stesso passo fatto e da fare
 * insieme non è valido.
 */
export function leggiModifichePassi(corpo: unknown): ModifichePassi | null {
  const letto = schemaModifichePassi.safeParse(corpo);
  if (!letto.success) return null;
  const fatti = [...new Set(letto.data.fatti.filter(eIdPasso))];
  const daFare = [...new Set(letto.data.daFare.filter(eIdPasso))];
  if (fatti.some((id) => daFare.includes(id))) return null;
  return { fatti, daFare };
}
