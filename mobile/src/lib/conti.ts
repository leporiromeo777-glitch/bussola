/**
 * «I tuoi conti»: chiamate al sito con il token dell'accesso
 * ("Authorization: Bearer"). I tipi sono gli stessi del sito
 * (src/lib/conti/tipi.ts). Niente conta finché l'utente non conferma.
 */
import { useSyncExternalStore } from "react";
import {
  CATEGORIE,
  type Casella,
  type CategoriaId,
  type FatturaEmessa,
  type Movimento,
  type RispostaConti,
  type Sollecito,
  type TipoMovimento,
} from "@/lib/conti/tipi";
import { tokenAttuale } from "./api";
import { SITO_URL } from "./config";
import { aggiornaPromemoriaFatture } from "./notifiche";

export type Esito<T> = { ok: true; dati: T } | { ok: false; messaggio: string; stato: number | null };

export type NuovoMovimento = {
  tipo: TipoMovimento;
  data: string;
  importo: number;
  descrizione: string;
  controparte?: string | null;
  categoria: CategoriaId;
};

export type ModificheMovimento = Partial<NuovoMovimento> & { stato?: "confermato" | "privato" };

export type FileRicevuta = {
  tipo: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  /** Base64 senza il prefisso «data:». */
  dati: string;
  nomeFile?: string;
};

const MESSAGGI: Record<number, string> = {
  401: "Accedi di nuovo per vedere i tuoi conti.",
  413: "Il file è troppo grande. Prova con una foto più vicina o con un PDF più leggero.",
  422: "Non riesco a leggere una ricevuta in questo file. Prova con una foto più nitida, con tutta la ricevuta.",
  429: "Hai raggiunto il limite di ricevute per adesso. Riprova più tardi.",
  503: "I conti non sono ancora attivi.",
};

/** Chiamata alle API dei conti sul sito con il token dell'accesso (la usa anche «Clienti e ore»). */
export async function chiama<T>(percorso: string, opzioni: { metodo?: string; corpo?: unknown } = {}): Promise<Esito<T>> {
  const token = await tokenAttuale();
  if (!token) return { ok: false, messaggio: "Accedi per vedere i tuoi conti.", stato: 401 };
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
    return { ok: false, messaggio: "Non riesco a raggiungere Bleo: controlla la connessione e riprova.", stato: null };
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
  if (corpo === null || typeof corpo !== "object") {
    return { ok: false, messaggio: "Risposta inattesa da Bleo. Riprova tra poco.", stato: risposta.status };
  }
  return { ok: true, dati: corpo as T };
}

function estrai<T, K extends string>(esito: Esito<Record<K, T>>, chiave: K): Esito<T> {
  if (!esito.ok) return esito;
  const valore = esito.dati[chiave];
  return valore ? { ok: true, dati: valore } : { ok: false, messaggio: "Risposta inattesa da Bleo. Riprova tra poco.", stato: null };
}

export function caricaConti(anno: number): Promise<Esito<RispostaConti>> {
  return chiama<RispostaConti>(`/api/conti?anno=${anno}`);
}

export async function creaMovimento(movimento: NuovoMovimento): Promise<Esito<Movimento>> {
  return estrai(await chiama<{ movimento: Movimento }>("/api/conti/movimenti", { metodo: "POST", corpo: movimento }), "movimento");
}

export async function aggiornaMovimento(id: string, modifiche: ModificheMovimento): Promise<Esito<Movimento>> {
  return estrai(
    await chiama<{ movimento: Movimento }>(`/api/conti/movimenti/${encodeURIComponent(id)}`, {
      metodo: "PATCH",
      corpo: modifiche,
    }),
    "movimento",
  );
}

export function eliminaMovimento(id: string): Promise<Esito<void>> {
  return chiama<void>(`/api/conti/movimenti/${encodeURIComponent(id)}`, { metodo: "DELETE" });
}

/** Manda la foto o il PDF: Bleo lo legge e lo mette «da confermare». */
export async function inviaRicevuta(file: FileRicevuta): Promise<Esito<Movimento>> {
  return estrai(await chiama<{ movimento: Movimento }>("/api/conti/ricevute", { metodo: "POST", corpo: file }), "movimento");
}

/** Link temporaneo per vedere la ricevuta salvata. */
export async function linkDocumento(id: string): Promise<Esito<string>> {
  return estrai(await chiama<{ url: string }>(`/api/conti/documenti/${encodeURIComponent(id)}`), "url");
}

export async function segnaFattura(id: string, pagataIl: string | null): Promise<Esito<FatturaEmessa>> {
  return estrai(
    await chiama<{ fattura: FatturaEmessa }>(`/api/conti/fatture/${encodeURIComponent(id)}`, {
      metodo: "PATCH",
      corpo: { pagataIl },
    }),
    "fattura",
  );
}

/** Segna il sollecito mandato al cliente (livello e giorno), o lo toglie con null. */
export async function segnaSollecito(id: string, sollecito: Sollecito | null): Promise<Esito<FatturaEmessa>> {
  return estrai(
    await chiama<{ fattura: FatturaEmessa }>(`/api/conti/fatture/${encodeURIComponent(id)}`, {
      metodo: "PATCH",
      corpo: { sollecito },
    }),
    "fattura",
  );
}

export function leggiCasella(): Promise<Esito<Casella>> {
  return chiama<Casella>("/api/conti/casella");
}

/** Crea l'indirizzo personale, o ne fa uno nuovo (il vecchio smette di funzionare). */
export function rigeneraCasella(): Promise<Esito<Casella>> {
  return chiama<Casella>("/api/conti/casella", { metodo: "POST" });
}

// --- Categorie.

export function categoriePerTipo(tipo: TipoMovimento) {
  return CATEGORIE.filter((c) => c.tipo === tipo);
}

export function etichettaCategoria(id: CategoriaId): string {
  return CATEGORIE.find((c) => c.id === id)?.etichetta ?? "Altro";
}

export function annoCorrente(adesso = new Date()): number {
  return adesso.getFullYear();
}

// --- Numero di voci da confermare, per il pallino sulla scheda «Conti».

let daConfermare: number | null = null;
const ascoltatori = new Set<() => void>();

export function impostaDaConfermare(numero: number | null): void {
  if (numero === daConfermare) return;
  daConfermare = numero;
  ascoltatori.forEach((a) => a());
}

function iscrivi(ascoltatore: () => void) {
  ascoltatori.add(ascoltatore);
  return () => {
    ascoltatori.delete(ascoltatore);
  };
}

/** Quante voci dell'anno in corso aspettano la conferma; null se non si sa. */
export function useDaConfermare(): number | null {
  return useSyncExternalStore(
    iscrivi,
    () => daConfermare,
    () => daConfermare,
  );
}

let contatoreInCorso = false;

/**
 * Rilegge il numero di voci da confermare (per il pallino), senza mostrare
 * errori, e intanto aggiorna i promemoria delle fatture non pagate.
 */
export async function aggiornaContatore(): Promise<void> {
  if (contatoreInCorso) return;
  contatoreInCorso = true;
  try {
    const esito = await caricaConti(annoCorrente());
    impostaDaConfermare(esito.ok ? contaDaConfermare(esito.dati.movimenti) : null);
    if (esito.ok) void aggiornaPromemoriaFatture(esito.dati.fatture).catch(() => {});
  } finally {
    contatoreInCorso = false;
  }
}

export function contaDaConfermare(movimenti: readonly Movimento[]): number {
  return movimenti.filter((m) => m.stato === "da_confermare").length;
}
