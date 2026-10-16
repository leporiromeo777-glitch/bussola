/**
 * Promemoria delle scadenze come notifiche sul telefono (app Bleo): quali
 * date avvisare e quando. Funzione pura: l'app li programma con
 * expo-notifications, qui si decide solo cosa e quando.
 */
import { dataSvizzera } from "@/data/svizzera";
import type { EventoCalendario } from "./calendario";

export type Promemoria = {
  /** Stabile: riprogrammando, la stessa scadenza non si duplica. */
  id: string;
  /** Quando suonare, data e ora locali AAAA-MM-GGTHH:MM. */
  quando: string;
  titolo: string;
  testo: string;
  /** Data della scadenza (AAAA-MM-GG). */
  scadenza: string;
};

/** Quanti giorni prima della scadenza arriva il promemoria. */
export const GIORNI_PRIMA = 7;
/** Ora del promemoria (ora locale del telefono). */
export const ORA_PROMEMORIA = "09:00";
/** iOS tiene al massimo 64 notifiche programmate per app: ne usiamo meno. */
export const MASSIMO_PROMEMORIA = 40;

function giorniPrima(data: string, giorni: number): string {
  const [anno, mese, giorno] = data.split("-").map(Number);
  return new Date(Date.UTC(anno, mese - 1, giorno - giorni)).toISOString().slice(0, 10);
}

/**
 * I promemoria per gli eventi del calendario: una settimana prima alle 9.
 * Se la settimana prima è già passata ma la scadenza no, il promemoria arriva
 * domani alle 9; le scadenze passate si saltano. `oggi` è AAAA-MM-GG locale.
 */
export function pianificaPromemoria(eventi: readonly EventoCalendario[], oggi: string): Promemoria[] {
  const domani = giorniPrima(oggi, -1);
  const promemoria: Promemoria[] = [];
  const visti = new Set<string>();
  for (const evento of [...eventi].sort((a, b) => a.data.localeCompare(b.data))) {
    if (evento.data <= oggi || visti.has(evento.uid)) continue;
    visti.add(evento.uid);
    const giorno = giorniPrima(evento.data, GIORNI_PRIMA) > oggi ? giorniPrima(evento.data, GIORNI_PRIMA) : domani;
    if (giorno > evento.data) continue;
    const mancano = giorno === giorniPrima(evento.data, GIORNI_PRIMA) ? "tra una settimana" : `il ${dataSvizzera(evento.data)}`;
    promemoria.push({
      id: evento.uid,
      quando: `${giorno}T${ORA_PROMEMORIA}`,
      titolo: evento.titolo,
      testo: `Scadenza ${mancano} (${dataSvizzera(evento.data)}). Apri Bleo per i dettagli e la fonte ufficiale.`,
      scadenza: evento.data,
    });
    if (promemoria.length >= MASSIMO_PROMEMORIA) break;
  }
  return promemoria;
}
