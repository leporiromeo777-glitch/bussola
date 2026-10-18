/**
 * «I tuoi conti»: promemoria sul telefono per le fatture emesse non pagate.
 * Il mattino dopo la scadenza (alle 9, come i promemoria del percorso) l'app
 * avvisa: «La fattura … è scaduta ieri». Funzione pura: l'app li programma
 * con expo-notifications (mobile/src/lib/notifiche.ts), qui si decide solo
 * cosa e quando.
 */
import { dataSvizzera } from "@/data/svizzera";
import { ORA_PROMEMORIA, type Promemoria } from "@/lib/percorso/promemoria";
import { aggiungiGiorni } from "./importi";
import type { FatturaEmessa } from "./tipi";

/** Gli id dei promemoria delle fatture iniziano così: l'app li riconosce tra gli altri. */
export const PREFISSO_PROMEMORIA_FATTURA = "fattura-";

/**
 * Quante fatture tenere programmate al massimo. iOS tiene al massimo 64
 * notifiche per app: con i 40 promemoria del percorso e i 4 riassunti del
 * lunedì si resta sotto.
 */
export const MASSIMO_PROMEMORIA_FATTURE = 15;

/**
 * Un promemoria per ogni fattura non pagata con la scadenza: il giorno dopo
 * la scadenza alle 9. Si saltano quelli già passati (`adesso` è data e ora
 * locali del telefono, AAAA-MM-GGTHH:MM). L'id è stabile: riprogrammando,
 * la stessa fattura non si duplica.
 */
export function pianificaPromemoriaFatture(
  fatture: readonly Pick<FatturaEmessa, "id" | "numero" | "cliente" | "scadenza" | "pagataIl">[],
  adesso: string,
): Promemoria[] {
  const piano: Promemoria[] = [];
  const visti = new Set<string>();
  for (const f of fatture) {
    if (f.pagataIl || !f.scadenza || visti.has(f.id)) continue;
    visti.add(f.id);
    const quando = `${aggiungiGiorni(f.scadenza, 1)}T${ORA_PROMEMORIA}`;
    if (quando <= adesso.slice(0, 16)) continue;
    piano.push({
      id: `${PREFISSO_PROMEMORIA_FATTURA}${f.id}`,
      quando,
      titolo: `La fattura ${f.numero} è scaduta ieri`,
      testo: `Fattura per ${f.cliente}, da pagare entro il ${dataSvizzera(f.scadenza)}. Se il pagamento non è ancora arrivato, in «I tuoi conti» Bleo ti prepara il sollecito.`,
      scadenza: f.scadenza,
    });
  }
  return piano.sort((a, b) => a.quando.localeCompare(b.quando)).slice(0, MASSIMO_PROMEMORIA_FATTURE);
}
