/**
 * «Cassetto dei documenti»: i promemoria sul telefono prima che un documento
 * scada (30 e 7 giorni prima, alle 9). Funzioni pure: l'app li programma con
 * expo-notifications insieme a quelli delle scadenze del percorso, qui si
 * decide solo cosa e quando.
 *
 * Sul telefono si tengono solo id, titolo e data di scadenza dei documenti
 * (per riprogrammare i promemoria anche senza rete): mai i file.
 */
import { z } from "zod";
import { dataSvizzera } from "@/data/svizzera";
import { aggiungiGiorni, dataIsoValida } from "@/lib/percorso/calendario";
import { MASSIMO_PROMEMORIA, ORA_PROMEMORIA, type Promemoria } from "@/lib/percorso/promemoria";
import { DOCUMENTI_MASSIMI, GIORNI_AVVISO_DOCUMENTI, LUNGHEZZE_CASSETTO } from "./limiti";

/** Quello che serve per un promemoria: niente file, niente note. */
export type ScadenzaDocumento = { id: string; titolo: string; scadeIl: string };

/** Chiave sul telefono (archivio dell'app) con le scadenze dei documenti dell'account. */
export const CHIAVE_SCADENZE_DOCUMENTI = "bleo:app:scadenze-documenti";

/** Prefisso degli id dei promemoria dei documenti (per riconoscerli tra le notifiche programmate). */
export const PREFISSO_PROMEMORIA_DOCUMENTO = "documento-";

/**
 * I promemoria dei documenti: GIORNI_AVVISO_DOCUMENTI giorni prima della
 * scadenza, alle ORA_PROMEMORIA. Solo quelli ancora da venire rispetto ad
 * `adesso` (data e ora locali, AAAA-MM-GGTHH:MM); un documento ripetuto conta
 * una volta. Ordinati per data.
 */
export function pianificaPromemoriaDocumenti(documenti: readonly ScadenzaDocumento[], adesso: string): Promemoria[] {
  const visti = new Set<string>();
  const promemoria: Promemoria[] = [];
  for (const documento of documenti) {
    if (visti.has(documento.id) || !dataIsoValida(documento.scadeIl)) continue;
    visti.add(documento.id);
    for (const giorni of GIORNI_AVVISO_DOCUMENTI) {
      const quando = `${aggiungiGiorni(documento.scadeIl, -giorni)}T${ORA_PROMEMORIA}`;
      if (quando <= adesso) continue;
      promemoria.push({
        id: `${PREFISSO_PROMEMORIA_DOCUMENTO}${documento.id}-${giorni}`,
        quando,
        titolo: `«${documento.titolo}» scade tra ${giorni} giorni`,
        testo: `Scade il ${dataSvizzera(documento.scadeIl)}. Apri il cassetto dei documenti di Bleo per vederlo e ricordati di rinnovarlo per tempo.`,
        scadenza: documento.scadeIl,
      });
    }
  }
  return promemoria.sort((a, b) => a.quando.localeCompare(b.quando) || a.id.localeCompare(b.id));
}

/**
 * Unisce più elenchi di promemoria (scadenze del percorso, documenti) senza
 * doppioni e tiene i primi `massimo` in ordine di tempo: iOS tiene al massimo
 * 64 notifiche programmate per app, e ogni volta che l'app riprogramma
 * arrivano quelli successivi.
 */
export function unisciPromemoria(elenchi: readonly (readonly Promemoria[])[], massimo = MASSIMO_PROMEMORIA): Promemoria[] {
  const visti = new Set<string>();
  const tutti: Promemoria[] = [];
  for (const elenco of elenchi) {
    for (const p of elenco) {
      if (visti.has(p.id)) continue;
      visti.add(p.id);
      tutti.push(p);
    }
  }
  return tutti.sort((a, b) => a.quando.localeCompare(b.quando)).slice(0, Math.max(0, massimo));
}

const schemaScadenze = z
  .array(
    z.object({
      id: z.string().min(1).max(64),
      titolo: z.string().min(1).max(LUNGHEZZE_CASSETTO.titolo),
      scadeIl: z.string().refine(dataIsoValida),
    }),
  )
  .max(DOCUMENTI_MASSIMI);

/** Le scadenze salvate sul telefono; [] se mancano o non sono valide. */
export function analizzaScadenzeDocumenti(grezzo: string | null): ScadenzaDocumento[] {
  if (!grezzo) return [];
  try {
    const letto = schemaScadenze.safeParse(JSON.parse(grezzo));
    return letto.success ? letto.data : [];
  } catch {
    return [];
  }
}

/** Dai documenti dell'account a quello che si salva sul telefono: solo quelli con una scadenza. */
export function scadenzeDaDocumenti(
  documenti: readonly { id: string; titolo: string; scadeIl: string | null }[],
): ScadenzaDocumento[] {
  return documenti
    .filter((d): d is typeof d & { scadeIl: string } => Boolean(d.scadeIl && dataIsoValida(d.scadeIl)))
    .slice(0, DOCUMENTI_MASSIMI)
    .map((d) => ({ id: d.id, titolo: d.titolo.slice(0, LUNGHEZZE_CASSETTO.titolo), scadeIl: d.scadeIl }));
}
