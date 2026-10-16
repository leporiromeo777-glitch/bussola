/**
 * «Testi pronti»: cosa riprendere dalle risposte del questionario salvate nel
 * browser, così chi ha già fatto il percorso non riscrive tutto da capo.
 */
import { etichettaRisposta } from "@/lib/percorso/domande";
import type { Risposte } from "@/lib/percorso/risposte";

export type Precompilati = { descrizione: string; luogo: string };

/** Attività (il testo libero per "altro", altrimenti l'etichetta) e Cantone, se è Ticino o Grigioni. */
export function precompilaDaRisposte(risposte: Risposte | null | undefined): Precompilati {
  if (!risposte) return { descrizione: "", luogo: "" };
  const descrizione =
    risposte.attivita === "altro" ? (risposte.attivitaAltro ?? "") : etichettaRisposta("attivita", risposte.attivita);
  const luogo = risposte.cantone === "altro" ? "" : etichettaRisposta("cantone", risposte.cantone);
  return { descrizione, luogo };
}
