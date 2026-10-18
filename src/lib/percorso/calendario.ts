/**
 * Scadenze del percorso in un file di calendario (.ics, RFC 5545) da
 * importare in Google Calendar, Apple Calendario o Outlook. Tutto lato
 * client, con funzioni pure: eventi di un giorno intero, righe con CRLF,
 * testi con virgole, punti e virgola e a capo protetti, righe lunghe piegate
 * a 75 ottetti.
 */
import { dataSvizzera } from "@/data/svizzera";
import type { Scadenza } from "./regole";

export type EventoCalendario = {
  /** Identificatore stabile: reimportando il file l'evento si aggiorna invece di duplicarsi. */
  uid: string;
  /** Data ISO AAAA-MM-GG. */
  data: string;
  titolo: string;
  descrizione: string;
  url?: string;
  /** Per il testo dei promemoria; se manca è una scadenza. */
  genere?: "scadenza" | "votazione";
};

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** true se la stringa è una data ISO AAAA-MM-GG esistente (niente 31 febbraio). */
export function dataIsoValida(data: string): boolean {
  const parti = DATA_ISO.exec(data);
  if (!parti) return false;
  const [anno, mese, giorno] = parti.slice(1).map(Number);
  const d = new Date(Date.UTC(anno, mese - 1, giorno));
  return d.getUTCFullYear() === anno && d.getUTCMonth() === mese - 1 && d.getUTCDate() === giorno;
}

/** Somma giorni a una data ISO, in UTC (nessun problema di ora legale). */
export function aggiungiGiorni(data: string, giorni: number): string {
  const [anno, mese, giorno] = data.split("-").map(Number);
  const d = new Date(Date.UTC(anno, mese - 1, giorno + giorni));
  return d.toISOString().slice(0, 10);
}

function dataIso(anno: number, mese: number, giorno: number): string {
  return `${String(anno).padStart(4, "0")}-${String(mese).padStart(2, "0")}-${String(giorno).padStart(2, "0")}`;
}

/**
 * L'anno da mettere nel calendario: da ottobre in poi si guarda già all'anno
 * seguente (il 15.10.2026 dà 2027), prima si resta nell'anno in corso.
 */
export function annoScadenzario(oggi: Date): number {
  return oggi.getMonth() >= 9 ? oggi.getFullYear() + 1 : oggi.getFullYear();
}

/** Le date di una scadenza per l'anno scelto (per la lista a schermo e per il calendario). */
export function dateScadenza(
  scadenza: Scadenza,
  anno: number,
  inizioAttivita?: string,
): { data: string; etichetta: string }[] {
  const regola = scadenza.calendario;
  switch (regola.tipo) {
    case "annuale":
      return regola.date
        .map((d) => ({ data: dataIso(anno, d.mese, d.giorno), etichetta: d.etichetta }))
        .filter((d) => dataIsoValida(d.data));
    case "fisse":
      return regola.date.filter((d) => dataIsoValida(d.data) && Number(d.data.slice(0, 4)) === anno);
    case "dopo-inizio":
      if (!inizioAttivita || !dataIsoValida(inizioAttivita)) return [];
      return [
        {
          data: aggiungiGiorni(inizioAttivita, regola.giorni),
          etichetta: `${regola.giorni} giorni dopo l'inizio del ${dataSvizzera(inizioAttivita)}`,
        },
      ];
    case "nessuna":
      return [];
  }
}

/**
 * Date fisse di una scadenza (per esempio i termini degli acconti cantonali,
 * fissati ogni anno da un decreto) viste da oggi:
 * - "pubblicate": l'ultimo anno disponibile ha ancora date future; quelle già
 *   passate sono segnate;
 * - "da-pubblicare": tutte le date dell'ultimo anno disponibile sono passate.
 *   Non sono più scadenze: si mostrano solo come esempio e si dice che quelle
 *   dell'anno seguente non sono ancora uscite.
 */
export type DateFisse =
  | { stato: "pubblicate"; anno: number; date: { data: string; etichetta: string; passata: boolean }[] }
  | { stato: "da-pubblicare"; anno: number; annoProssimo: number; date: { data: string; etichetta: string }[] };

export function dateFisseDaOggi(
  date: readonly { data: string; etichetta: string }[],
  oggi: string,
): DateFisse | null {
  const valide = date.filter((d) => dataIsoValida(d.data)).sort((a, b) => a.data.localeCompare(b.data));
  const ultima = valide.at(-1);
  if (!ultima || !dataIsoValida(oggi)) return null;
  const anno = Number(ultima.data.slice(0, 4));
  const dellAnno = valide.filter((d) => Number(d.data.slice(0, 4)) === anno);
  // Una data è passata dal giorno dopo: il giorno stesso si può ancora pagare.
  const passata = (data: string) => data < oggi;
  if (dellAnno.every((d) => passata(d.data))) {
    return {
      stato: "da-pubblicare",
      anno,
      annoProssimo: Math.max(anno + 1, Number(oggi.slice(0, 4))),
      date: dellAnno.map(({ data, etichetta }) => ({ data, etichetta })),
    };
  }
  return { stato: "pubblicate", anno, date: dellAnno.map((d) => ({ ...d, passata: passata(d.data) })) };
}

/** Le date fisse in una frase, per il riquadro delle scadenze. */
export function testoDateFisse(date: DateFisse): string {
  if (date.stato === "da-pubblicare") {
    return (
      `Le date del ${date.annoProssimo} non sono ancora pubblicate: di solito escono a fine anno. ` +
      `Come esempio, i termini del ${date.anno}, già passati: ${date.date.map((d) => dataSvizzera(d.data)).join(", ")}.`
    );
  }
  const elenco = date.date.map((d) => `${dataSvizzera(d.data)}${d.passata ? " (già passato)" : ""}`).join(", ");
  return `Termini di pagamento ${date.anno}: ${elenco}.`;
}

/** Gli eventi del calendario, in ordine di data. */
export function eventiDaScadenze(
  scadenze: readonly Scadenza[],
  opzioni: { anno: number; inizioAttivita?: string },
): EventoCalendario[] {
  const eventi: EventoCalendario[] = [];
  for (const scadenza of scadenze) {
    for (const { data, etichetta } of dateScadenza(scadenza, opzioni.anno, opzioni.inizioAttivita)) {
      const fonte = scadenza.fonti[0];
      const righe = [
        scadenza.quando,
        scadenza.dettaglio,
        fonte ? `Fonte: ${fonte.titolo} (${fonte.ente}), ${fonte.url}` : undefined,
        "Promemoria di Bleo: informazione generale, verifica sempre con l'ufficio competente.",
      ].filter((riga): riga is string => Boolean(riga));
      eventi.push({
        uid: `${scadenza.id}-${data}@bussola`,
        data,
        titolo: etichetta
          ? `${scadenza.titoloEvento ?? scadenza.titolo} (${etichetta})`
          : (scadenza.titoloEvento ?? scadenza.titolo),
        descrizione: righe.join("\n"),
        url: fonte?.url,
      });
    }
  }
  return eventi.sort((a, b) => a.data.localeCompare(b.data) || a.uid.localeCompare(b.uid));
}

/** Come si presenta la data di una scadenza nel riquadro: "Entro il …" per i termini dall'inizio, "Nel 2027: …" per le altre. */
export function prefissoDate(scadenza: Scadenza, anno: number): string {
  return scadenza.calendario.tipo === "dopo-inizio" ? "Entro il " : `Nel ${anno}: `;
}

/**
 * Nome del calendario e del file .ics: con l'anno solo se tutte le date sono
 * di quell'anno. Il termine IVA calcolato dalla data di inizio può cadere in
 * un altro anno (per esempio a ottobre, quando il calendario è già dell'anno
 * seguente).
 */
export function nomiCalendario(
  eventi: readonly EventoCalendario[],
  anno: number,
): { nomeCalendario: string; nomeFile: string } {
  const soloQuellAnno = eventi.every((e) => e.data.slice(0, 4) === String(anno));
  return soloQuellAnno
    ? { nomeCalendario: `Bleo: scadenze ${anno}`, nomeFile: `bleo-scadenze-${anno}.ics` }
    : { nomeCalendario: "Bleo: scadenze", nomeFile: "bleo-scadenze.ics" };
}

/** Protegge un valore TEXT (RFC 5545, 3.3.11): \ ; , e gli a capo. */
export function proteggiTesto(testo: string): string {
  return testo
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

const codificatore = new TextEncoder();

/**
 * Piega una riga lunga (RFC 5545, 3.1): al massimo 75 ottetti per riga, le
 * righe di continuazione iniziano con uno spazio. Non spezza mai un carattere
 * UTF-8 a metà.
 */
export function piegaRiga(riga: string): string {
  const pezzi: string[] = [];
  let corrente = "";
  let ottetti = 0;
  let limite = 75;
  for (const carattere of riga) {
    const n = codificatore.encode(carattere).length;
    if (ottetti + n > limite) {
      pezzi.push(corrente);
      corrente = carattere;
      ottetti = n;
      limite = 74; // lo spazio iniziale conta come primo ottetto
    } else {
      corrente += carattere;
      ottetti += n;
    }
  }
  pezzi.push(corrente);
  return pezzi.join("\r\n ");
}

function dataIcs(data: string): string {
  return data.replace(/-/g, "");
}

function istanteIcs(istante: Date): string {
  return istante
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

/** Il file .ics completo (righe CRLF, termina con CRLF). */
export function generaIcs(
  eventi: readonly EventoCalendario[],
  opzioni: { adesso: Date; nomeCalendario?: string; giorniPreavviso?: number },
): string {
  const preavviso = opzioni.giorniPreavviso ?? 7;
  const righe: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bleo//Scadenze del percorso//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${proteggiTesto(opzioni.nomeCalendario ?? "Bleo: scadenze")}`,
  ];
  const timbro = istanteIcs(opzioni.adesso);
  for (const evento of eventi) {
    if (!dataIsoValida(evento.data)) continue;
    righe.push(
      "BEGIN:VEVENT",
      `UID:${evento.uid}`,
      `DTSTAMP:${timbro}`,
      `DTSTART;VALUE=DATE:${dataIcs(evento.data)}`,
      `DTEND;VALUE=DATE:${dataIcs(aggiungiGiorni(evento.data, 1))}`,
      `SUMMARY:${proteggiTesto(evento.titolo)}`,
      `DESCRIPTION:${proteggiTesto(evento.descrizione)}`,
      ...(evento.url ? [`URL:${evento.url}`] : []),
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${proteggiTesto(evento.titolo)}`,
      `TRIGGER:-P${preavviso}D`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  righe.push("END:VCALENDAR");
  return righe.map(piegaRiga).join("\r\n") + "\r\n";
}
