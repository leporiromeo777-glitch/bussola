/**
 * «La tua settimana»: i prossimi passi da fare e le scadenze dei prossimi 14
 * giorni, in poche righe. Funzione pura (niente data di sistema): la usano
 * la pagina del percorso e la notifica del lunedì nell'app.
 */
import { dataSvizzera } from "@/data/svizzera";
import { annoScadenzario, eventiDaScadenze, type EventoCalendario } from "./calendario";
import type { PassoPercorso, Percorso } from "./regole";

/** Quanti giorni avanti guardare per le scadenze. */
export const GIORNI_SETTIMANA = 14;
/** Quanti passi suggerire per la settimana. */
export const PASSI_SETTIMANA = 2;

export type ScadenzaVicina = EventoCalendario & { traGiorni: number };

export type Settimana = {
  passi: PassoPercorso[];
  scadenze: ScadenzaVicina[];
  /** Una o due frasi, per una notifica o un'email. */
  testo: string;
};

function giorniTra(da: string, a: string): number {
  const [a1, m1, g1] = da.split("-").map(Number);
  const [a2, m2, g2] = a.split("-").map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, g2) - Date.UTC(a1, m1 - 1, g1)) / 86_400_000);
}

/** «oggi», «domani», «tra 5 giorni». */
export function quando(traGiorni: number): string {
  if (traGiorni <= 0) return "oggi";
  if (traGiorni === 1) return "domani";
  return `tra ${traGiorni} giorni`;
}

/** Il riassunto della settimana che comincia `oggi` (AAAA-MM-GG). */
export function riassuntoSettimana(percorso: Percorso, fatti: ReadonlySet<string>, oggi: string): Settimana {
  const passi = percorso.passi
    .filter((p) => p.stato === "da_fare" && !fatti.has(p.passo.id))
    .slice(0, PASSI_SETTIMANA);

  const [anno, mese] = oggi.split("-").map(Number);
  const annoCalendario = annoScadenzario(new Date(Date.UTC(anno, mese - 1, 15)));
  const visti = new Set<string>();
  const scadenze = [annoCalendario - 1, annoCalendario, annoCalendario + 1]
    .flatMap((a) => eventiDaScadenze(percorso.scadenze, { anno: a }))
    .map((e) => ({ ...e, traGiorni: giorniTra(oggi, e.data) }))
    .filter((e) => e.traGiorni >= 0 && e.traGiorni <= GIORNI_SETTIMANA)
    .filter((e) => (visti.has(e.uid) ? false : (visti.add(e.uid), true)))
    .sort((a, b) => a.data.localeCompare(b.data));

  const frasi: string[] = [];
  if (passi.length > 0) frasi.push(`Questa settimana: «${passi[0].passo.titolo}».`);
  else frasi.push("Hai fatto tutti i passi da fare.");
  const prima = scadenze[0];
  if (prima) {
    frasi.push(`Scadenza ${quando(prima.traGiorni)}: ${prima.titolo} (${dataSvizzera(prima.data)}).`);
  } else if (passi.length === 0) {
    frasi.push(`Nessuna scadenza nei prossimi ${GIORNI_SETTIMANA} giorni.`);
  }
  return { passi, scadenze, testo: frasi.join(" ") };
}

/** I prossimi `quanti` lunedì dopo `oggi` (AAAA-MM-GG), escluso oggi: per la notifica del lunedì. */
export function prossimiLunedi(oggi: string, quanti: number): string[] {
  const [anno, mese, giorno] = oggi.split("-").map(Number);
  const base = Date.UTC(anno, mese - 1, giorno);
  const giornoSettimana = new Date(base).getUTCDay(); // 0 domenica, 1 lunedì
  const primo = ((8 - giornoSettimana) % 7) || 7;
  return Array.from({ length: quanti }, (_, i) =>
    new Date(base + (primo + i * 7) * 86_400_000).toISOString().slice(0, 10),
  );
}
