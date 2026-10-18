/**
 * «Clienti e ore»: chiamate al sito con il token dell'accesso
 * ("Authorization: Bearer"). I tipi e i calcoli sono quelli del sito
 * (src/lib/clienti). La fattura si apre sul sito, nel browser dell'app.
 */
import { percorsoFatturaDaOre } from "@/lib/clienti/fattura";
import type { Cliente, DettaglioFattura, Mese, RispostaFatturaOre, RispostaOre, VoceOre } from "@/lib/clienti/tipi";
import { apriSito } from "./apri";
import { chiama, type Esito } from "./conti";

export type DatiCliente = {
  nome: string;
  via: string;
  numero: string;
  npa: string;
  localita: string;
  paese: string;
  email: string | null;
  tariffa: number | null;
};

export type DatiVoce = { clienteId: string; data: string; minuti: number; descrizione: string; tariffa: number | null };

function estrai<T, K extends string>(esito: Esito<Record<K, T>>, chiave: K): Esito<T> {
  if (!esito.ok) return esito;
  const valore = esito.dati[chiave];
  return valore ? { ok: true, dati: valore } : { ok: false, messaggio: "Risposta inattesa da Bleo. Riprova tra poco.", stato: null };
}

export function caricaOre(mese: Mese): Promise<Esito<RispostaOre>> {
  return chiama<RispostaOre>(`/api/conti/ore?mese=${encodeURIComponent(mese)}`);
}

export async function creaCliente(dati: DatiCliente): Promise<Esito<Cliente>> {
  return estrai(await chiama<{ cliente: Cliente }>("/api/conti/clienti", { metodo: "POST", corpo: dati }), "cliente");
}

export async function aggiornaCliente(id: string, dati: Partial<DatiCliente>): Promise<Esito<Cliente>> {
  return estrai(
    await chiama<{ cliente: Cliente }>(`/api/conti/clienti/${encodeURIComponent(id)}`, { metodo: "PATCH", corpo: dati }),
    "cliente",
  );
}

export function eliminaCliente(id: string): Promise<Esito<void>> {
  return chiama<void>(`/api/conti/clienti/${encodeURIComponent(id)}`, { metodo: "DELETE" });
}

export async function creaVoce(dati: DatiVoce): Promise<Esito<VoceOre>> {
  return estrai(await chiama<{ voce: VoceOre }>("/api/conti/ore", { metodo: "POST", corpo: dati }), "voce");
}

export async function aggiornaVoce(
  id: string,
  modifiche: Partial<DatiVoce> & { fatturataIl?: string | null },
): Promise<Esito<VoceOre>> {
  return estrai(
    await chiama<{ voce: VoceOre }>(`/api/conti/ore/${encodeURIComponent(id)}`, { metodo: "PATCH", corpo: modifiche }),
    "voce",
  );
}

export function eliminaVoce(id: string): Promise<Esito<void>> {
  return chiama<void>(`/api/conti/ore/${encodeURIComponent(id)}`, { metodo: "DELETE" });
}

/** Segna come fatturate le ore del cliente nel mese e restituisce i dati per lo strumento fattura. */
export function creaFatturaOre(richiesta: { clienteId: string; mese: Mese; dettaglio: DettaglioFattura }): Promise<Esito<RispostaFatturaOre>> {
  return chiama<RispostaFatturaOre>("/api/conti/ore/fattura", { metodo: "POST", corpo: richiesta });
}

/** Toglie il segno «fatturata» alle ore del cliente nel mese fatturate quel giorno. */
export function annullaFatturaOre(clienteId: string, mese: Mese, fatturataIl: string): Promise<Esito<{ voci: number }>> {
  const parametri = `cliente=${encodeURIComponent(clienteId)}&mese=${encodeURIComponent(mese)}&fatturataIl=${encodeURIComponent(fatturataIl)}`;
  return chiama<{ voci: number }>(`/api/conti/ore/fattura?${parametri}`, { metodo: "DELETE" });
}

/** Apre lo strumento fattura del sito con le ore (i dati vanno dopo il «#», come fa il sito). */
export function apriFatturaOre(risposta: RispostaFatturaOre): Promise<void> {
  return apriSito(percorsoFatturaDaOre(risposta.precompilazione));
}
