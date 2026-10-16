/**
 * Le chat salvate tra il database e le API: righe di chat_conversazioni e
 * chat_messaggi, contesto per Claude dai messaggi salvati, salvataggio della
 * risposta nel flusso NDJSON. Solo funzioni pure, senza Next.js né browser.
 */
import { TITOLO_MASSIMO, type ConversazioneBreve, type MessaggioSalvato } from "./conversazioni";
import { LUNGHEZZA_MASSIMA_DOMANDA, LUNGHEZZA_RISPOSTA_IN_CRONOLOGIA, SCAMBI_PRECEDENTI_MASSIMI } from "./limiti";
import { MESSAGGI } from "./messaggi";
import { testoSemplice } from "./testo-risposta";
import type { BloccoRisposta, EventoChat, FonteCitata, ScambioPrecedente } from "./tipi";

export type MessaggioUtente = Extract<MessaggioSalvato, { ruolo: "utente" }>;
export type MessaggioBleo = Extract<MessaggioSalvato, { ruolo: "bleo" }>;
type EventoFine = Extract<EventoChat, { t: "fine" }>;

/** Colonne lette da chat_conversazioni. */
export const COLONNE_CONVERSAZIONE = "id, titolo, aggiornata_il";
/** Colonne lette da chat_messaggi. */
export const COLONNE_MESSAGGIO = "id, ruolo, testo, risposta, fonti, senza_risposta, avviso, creato_il";

/** Chat mostrate nell'elenco: le più recenti. */
export const CHAT_IN_ELENCO = 200;
/** Lunghezza massima del testo di una risposta salvata (come il vincolo in chat_messaggi). */
export const LUNGHEZZA_MASSIMA_RISPOSTA_SALVATA = 40_000;

export type RigaConversazione = { id: string; titolo: string; aggiornata_il: string };

export type RigaMessaggio = {
  id: number | string;
  ruolo: string;
  testo: string;
  risposta: unknown;
  fonti: unknown;
  senza_risposta: boolean | null;
  avviso: string | null;
  creato_il: string;
};

/** Data ISO 8601 in UTC, qualunque sia il formato di PostgREST. */
function iso(data: string): string {
  const t = new Date(data);
  return Number.isNaN(t.getTime()) ? data : t.toISOString();
}

export function conversazioneDaRiga(riga: RigaConversazione): ConversazioneBreve {
  return { id: riga.id, titolo: riga.titolo, aggiornataIl: iso(riga.aggiornata_il) };
}

/** Un messaggio salvato per le API; null se la riga non ha un ruolo conosciuto. */
export function messaggioDaRiga(riga: RigaMessaggio): MessaggioSalvato | null {
  const base = { id: String(riga.id), testo: riga.testo, creatoIl: iso(riga.creato_il) };
  if (riga.ruolo === "utente") return { ...base, ruolo: "utente" };
  if (riga.ruolo !== "bleo") return null;
  return {
    ...base,
    ruolo: "bleo",
    risposta: Array.isArray(riga.risposta) ? (riga.risposta as BloccoRisposta[]) : [],
    fonti: Array.isArray(riga.fonti) ? (riga.fonti as FonteCitata[]) : [],
    senzaRisposta: riga.senza_risposta === true,
    avviso: riga.avviso ?? null,
  };
}

/** I messaggi in ordine, letti dal database (le righe sconosciute si saltano). */
export function messaggiDaRighe(righe: readonly RigaMessaggio[]): MessaggioSalvato[] {
  return righe.flatMap((r) => {
    const m = messaggioDaRiga(r);
    return m ? [m] : [];
  });
}

export type Scambio = { domanda: MessaggioUtente; risposta: MessaggioBleo | null };

/**
 * Domande e risposte a coppie, in ordine. Una domanda senza risposta (Claude
 * non ha risposto, o chi chiedeva ha interrotto) ha `risposta: null`.
 */
export function scambiDaMessaggi(messaggi: readonly MessaggioSalvato[]): Scambio[] {
  const scambi: Scambio[] = [];
  for (const m of messaggi) {
    if (m.ruolo === "utente") scambi.push({ domanda: m, risposta: null });
    else {
      const ultimo = scambi.at(-1);
      if (ultimo && ultimo.risposta === null) ultimo.risposta = m;
    }
  }
  return scambi;
}

/**
 * Il contesto per Claude dai messaggi salvati: gli ultimi scambi completi,
 * con le risposte accorciate come faceva il sito.
 */
export function cronologiaDaMessaggi(
  messaggi: readonly MessaggioSalvato[],
  massimo = SCAMBI_PRECEDENTI_MASSIMI,
): ScambioPrecedente[] {
  if (massimo <= 0) return [];
  return scambiDaMessaggi(messaggi)
    .filter((s): s is { domanda: MessaggioUtente; risposta: MessaggioBleo } => s.risposta !== null)
    .slice(-massimo)
    .map((s) => ({
      domanda: s.domanda.testo.slice(0, LUNGHEZZA_MASSIMA_DOMANDA),
      risposta: s.risposta.testo.slice(0, LUNGHEZZA_RISPOSTA_IN_CRONOLOGIA),
    }));
}

/**
 * true se la domanda è già l'ultimo messaggio della chat, senza risposta:
 * è un «Riprova» e non si salva due volte.
 */
export function domandaGiaSalvata(messaggi: readonly MessaggioSalvato[], domanda: string): boolean {
  const ultimo = messaggi.at(-1);
  return ultimo?.ruolo === "utente" && ultimo.testo.trim() === domanda.trim();
}

/** La risposta di Bleo come riga di chat_messaggi (senza chat e utente). */
export function rigaRispostaBleo(fine: EventoFine) {
  return {
    ruolo: "bleo" as const,
    testo: testoSemplice(fine.risposta).slice(0, LUNGHEZZA_MASSIMA_RISPOSTA_SALVATA),
    risposta: fine.risposta,
    fonti: fine.fonti,
    senza_risposta: fine.senza_risposta,
    avviso: fine.avviso ?? null,
  };
}

/** Il nuovo titolo di PATCH /api/chat/conversazioni/[id], ripulito dagli spazi. */
export function leggiTitolo(corpo: unknown): { ok: true; titolo: string } | { ok: false; messaggio: string } {
  const valore = typeof corpo === "object" && corpo !== null ? (corpo as { titolo?: unknown }).titolo : undefined;
  if (typeof valore !== "string") return { ok: false, messaggio: MESSAGGI.titoloNonValido };
  const titolo = valore.replace(/\s+/g, " ").trim();
  if (titolo.length < 1 || titolo.length > TITOLO_MASSIMO) return { ok: false, messaggio: MESSAGGI.titoloNonValido };
  return { ok: true, titolo };
}

/**
 * Aggiunge al flusso della risposta la chat salvata: prima l'evento
 * "conversazione", poi gli eventi di Bleo; la risposta finale si salva nella
 * chat prima di mandarla, così chi riapre la chat la ritrova. Un salvataggio
 * non riuscito non blocca la risposta. Senza chat (tabelle non ancora create
 * o errore) il flusso resta quello di prima.
 */
export async function* conConversazione(
  eventi: AsyncGenerator<EventoChat, void, undefined>,
  conversazione: ConversazioneBreve | null,
  salvaRisposta: (fine: EventoFine) => Promise<void>,
  registraErrore: (contesto: string, errore: unknown) => void,
): AsyncGenerator<EventoChat, void, undefined> {
  if (!conversazione) {
    yield* eventi;
    return;
  }
  yield { t: "conversazione", id: conversazione.id, titolo: conversazione.titolo };
  for await (const evento of eventi) {
    if (evento.t === "fine") {
      try {
        await salvaRisposta(evento);
      } catch (errore) {
        registraErrore("salvataggio della risposta nella chat", errore);
      }
    }
    yield evento;
  }
}
