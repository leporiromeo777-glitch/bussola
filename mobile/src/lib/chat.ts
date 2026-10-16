/**
 * «Chiedi a Bleo»: le chat salvate (elenco, apertura, nome, eliminazione) e
 * la domanda in una chat, con il token dell'accesso ("Authorization: Bearer").
 * I tipi sono quelli del sito (src/lib/chat/conversazioni.ts).
 */
import { useSyncExternalStore } from "react";
import { chiediABleo, type EsitoChiamata } from "@/lib/chat/cliente";
import type { ConversazioneBreve, RispostaChat, RispostaElencoChat } from "@/lib/chat/conversazioni";
import { fetchConToken, tokenAttuale, URL_CHAT } from "./api";
import { SITO_URL } from "./config";

export type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string; stato: number | null };

const MESSAGGI: Record<number, string> = {
  401: "Accedi di nuovo per vedere le tue chat.",
  404: "Questa chat non c'è più.",
  503: "La chat non è ancora attiva.",
};
const SENZA_RETE = "Non riesco a raggiungere Bleo: controlla la connessione e riprova.";
const INATTESA = "Risposta inattesa da Bleo. Riprova tra poco.";

async function chiama<T>(percorso: string, opzioni: { metodo?: string; corpo?: unknown } = {}): Promise<Esito<T>> {
  const token = await tokenAttuale();
  if (!token) return { ok: false, messaggio: "Accedi per vedere le tue chat.", stato: 401 };
  const intestazioni: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (opzioni.corpo !== undefined) intestazioni["Content-Type"] = "application/json";
  let risposta: Response;
  try {
    risposta = await fetch(`${SITO_URL}${percorso}`, {
      method: opzioni.metodo ?? "GET",
      headers: intestazioni,
      body: opzioni.corpo === undefined ? undefined : JSON.stringify(opzioni.corpo),
    });
  } catch {
    return { ok: false, messaggio: SENZA_RETE, stato: null };
  }
  if (risposta.status === 204) return { ok: true, dati: undefined as T };
  const corpo = (await risposta.json().catch(() => null)) as unknown;
  if (!risposta.ok) {
    const messaggio = (corpo as { messaggio?: unknown } | null)?.messaggio;
    return {
      ok: false,
      messaggio:
        typeof messaggio === "string" && messaggio.trim()
          ? messaggio
          : (MESSAGGI[risposta.status] ?? "Qualcosa non ha funzionato. Riprova tra poco."),
      stato: risposta.status,
    };
  }
  if (corpo === null || typeof corpo !== "object") return { ok: false, messaggio: INATTESA, stato: risposta.status };
  return { ok: true, dati: corpo as T };
}

const percorsoChat = (id: string) => `/api/chat/conversazioni/${encodeURIComponent(id)}`;

/** Le chat salvate, dalla più recente. */
export async function caricaElencoChat(): Promise<Esito<ConversazioneBreve[]>> {
  const esito = await chiama<RispostaElencoChat>("/api/chat/conversazioni");
  if (!esito.ok) return esito;
  return Array.isArray(esito.dati.conversazioni)
    ? { ok: true, dati: esito.dati.conversazioni }
    : { ok: false, messaggio: INATTESA, stato: null };
}

/** Una chat con tutti i messaggi, in ordine. */
export async function caricaChat(id: string): Promise<Esito<RispostaChat>> {
  const esito = await chiama<RispostaChat>(percorsoChat(id));
  if (!esito.ok) return esito;
  return esito.dati.conversazione && Array.isArray(esito.dati.messaggi)
    ? esito
    : { ok: false, messaggio: INATTESA, stato: null };
}

export async function rinominaChat(id: string, titolo: string): Promise<Esito<ConversazioneBreve>> {
  const esito = await chiama<{ conversazione: ConversazioneBreve }>(percorsoChat(id), {
    metodo: "PATCH",
    corpo: { titolo },
  });
  if (!esito.ok) return esito;
  return esito.dati.conversazione
    ? { ok: true, dati: esito.dati.conversazione }
    : { ok: false, messaggio: INATTESA, stato: null };
}

export function eliminaChat(id: string): Promise<Esito<void>> {
  return chiama<void>(percorsoChat(id), { metodo: "DELETE" });
}

// --- La domanda.

type Domanda = {
  domanda: string;
  /** La chat aperta; senza, il server ne crea una nuova. */
  conversazioneId: string | null;
  token: string;
  segnale: AbortSignal;
  suTesto: (pezzo: string) => void;
  /** Il primo evento del server: la chat (nuova o già aperta) con il suo titolo. */
  suConversazione: (chat: { id: string; titolo: string }) => void;
};

/**
 * Manda la domanda a /api/chat con chiediABleo (src/lib/chat/cliente.ts).
 * Con una chat aperta manda il suo id e niente cronologia: il server la
 * ricostruisce da solo. Il primo evento NDJSON {"t":"conversazione"} lo
 * legge `osservaConversazione`, perché il lettore condiviso tiene solo gli
 * eventi testo/fine/errore.
 */
export async function chiediInChat({
  domanda,
  conversazioneId,
  token,
  segnale,
  suTesto,
  suConversazione,
}: Domanda): Promise<EsitoChiamata> {
  const conToken = fetchConToken(token);
  let vista = false;
  const avvisa = (chat: { id: string; titolo: string }) => {
    if (vista) return;
    vista = true;
    suConversazione(chat);
  };
  const fetchChat: typeof fetch = async (url, init) => {
    const risposta = await conToken(url, { ...init, body: corpoConChat(init?.body, conversazioneId) });
    return osservaConversazione(risposta, avvisa);
  };
  // Oggetto a parte (non letterale): se cliente.ts impara `conversazioneId` e
  // `suConversazione`, li usa; se toglie `cronologia`, il tipo resta valido.
  const opzioni = {
    domanda,
    cronologia: [],
    conversazioneId: conversazioneId ?? undefined,
    suConversazione: avvisa,
    segnale,
    suTesto,
    fetchFn: fetchChat,
    indirizzo: URL_CHAT,
  };
  return chiediABleo(opzioni);
}

/** Il corpo JSON della domanda con l'id della chat (e senza cronologia, se c'è la chat). */
function corpoConChat(corpo: BodyInit | null | undefined, conversazioneId: string | null): BodyInit | null | undefined {
  if (typeof corpo !== "string") return corpo;
  try {
    const dati = JSON.parse(corpo) as Record<string, unknown>;
    if (conversazioneId) {
      dati.conversazioneId = conversazioneId;
      delete dati.cronologia;
    }
    return JSON.stringify(dati);
  } catch {
    return corpo;
  }
}

type Lettore = { read: () => Promise<{ done: boolean; value?: Uint8Array }>; cancel: (motivo?: unknown) => Promise<void> };

/**
 * Lascia passare la risposta così com'è, ma legge la prima riga NDJSON: se è
 * {"t":"conversazione","id":…,"titolo":…} chiama `suConversazione`.
 */
function osservaConversazione(
  risposta: Response,
  suConversazione: (chat: { id: string; titolo: string }) => void,
): Response {
  const flusso = risposta.ok ? risposta.body : null;
  if (!flusso) return risposta;
  const decodifica = new TextDecoder();
  let primaRiga = "";
  let finito = false;
  const leggi = (pezzo: Uint8Array) => {
    if (finito) return;
    primaRiga += decodifica.decode(pezzo, { stream: true });
    const fine = primaRiga.indexOf("\n");
    if (fine < 0) return;
    finito = true;
    try {
      const evento = JSON.parse(primaRiga.slice(0, fine)) as { t?: unknown; id?: unknown; titolo?: unknown };
      if (evento.t === "conversazione" && typeof evento.id === "string" && evento.id) {
        suConversazione({ id: evento.id, titolo: typeof evento.titolo === "string" ? evento.titolo : "" });
      }
    } catch {
      // Non è la riga della chat: niente da fare.
    }
  };
  const corpo = {
    getReader(): Lettore {
      const lettore = flusso.getReader();
      return {
        async read() {
          const parte = await lettore.read();
          if (!parte.done && parte.value) leggi(parte.value);
          return parte;
        },
        cancel: (motivo?: unknown) => lettore.cancel(motivo),
      };
    },
  };
  return new Proxy(risposta, {
    get(bersaglio, chiave) {
      if (chiave === "body") return corpo;
      const valore: unknown = Reflect.get(bersaglio, chiave, bersaglio);
      return typeof valore === "function" ? (valore as (...a: unknown[]) => unknown).bind(bersaglio) : valore;
    },
  });
}

// --- La chat aperta, ricordata finché l'app è aperta (anche cambiando scheda).

export type ChatAperta = {
  id: string | null;
  titolo: string | null;
  /** Cambia quando si apre un'altra chat o una chat nuova: la schermata ricarica. */
  versione: number;
};

let aperta: ChatAperta = { id: null, titolo: null, versione: 0 };
let utenteChat: string | null | undefined;
const ascoltatori = new Set<() => void>();

function imposta(nuova: ChatAperta) {
  aperta = nuova;
  ascoltatori.forEach((a) => a());
}

function iscrivi(ascoltatore: () => void) {
  ascoltatori.add(ascoltatore);
  return () => {
    ascoltatori.delete(ascoltatore);
  };
}

export function useChatAperta(): ChatAperta {
  return useSyncExternalStore(
    iscrivi,
    () => aperta,
    () => aperta,
  );
}

export function chatAperta(): ChatAperta {
  return aperta;
}

/** Apre una chat salvata. */
export function apriChat(id: string, titolo: string | null = null): void {
  if (id === aperta.id) return;
  imposta({ id, titolo, versione: aperta.versione + 1 });
}

/** Comincia una chat nuova (ferma la risposta in corso). */
export function nuovaChat(): void {
  imposta({ id: null, titolo: null, versione: aperta.versione + 1 });
}

/**
 * La chat creata dal server con la prima domanda, o il titolo aggiornato.
 * Non ricarica la schermata; vale solo se nel frattempo non si è aperta un'altra chat.
 */
export function registraChat(versione: number, id: string, titolo: string | null): void {
  if (versione !== aperta.versione) return;
  if (id === aperta.id && (titolo === null || titolo === aperta.titolo)) return;
  imposta({ id, titolo: titolo || aperta.titolo, versione });
}

/** Il server non conosce più la chat: la prossima domanda ne apre una nuova, senza svuotare lo schermo. */
export function dimenticaChat(versione: number): void {
  if (versione !== aperta.versione || aperta.id === null) return;
  imposta({ id: null, titolo: null, versione });
}

/** Dopo «Rinomina» nell'elenco. */
export function aggiornaTitolo(id: string, titolo: string): void {
  if (aperta.id === id && aperta.titolo !== titolo) imposta({ ...aperta, titolo });
}

/** Dopo «Elimina» nell'elenco: se era aperta, si riparte da una chat nuova. */
export function chatEliminata(id: string): void {
  if (aperta.id === id) nuovaChat();
}

/** Con un altro accesso (o dopo l'uscita) la chat aperta non vale più. */
export function allineaUtente(utente: string | null): void {
  if (utenteChat === utente) return;
  const primaVolta = utenteChat === undefined;
  utenteChat = utente;
  if (!primaVolta) nuovaChat();
}
