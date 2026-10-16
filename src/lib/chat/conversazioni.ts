/**
 * Le chat salvate di «Chiedi a Bleo», come in ChatGPT: tipi condivisi tra il
 * server (/api/chat, /api/chat/conversazioni) e le interfacce del sito e
 * dell'app. Solo tipi e funzioni pure, senza dipendenze da Next.js o dal
 * browser.
 */
import type { BloccoRisposta, FonteCitata } from "./tipi";

/** Una chat nell'elenco. Date in ISO 8601. */
export type ConversazioneBreve = {
  id: string;
  titolo: string;
  aggiornataIl: string;
};

export type MessaggioSalvato =
  | { id: string; ruolo: "utente"; testo: string; creatoIl: string }
  | {
      id: string;
      ruolo: "bleo";
      /** La risposta in testo semplice (serve anche come contesto per le domande successive). */
      testo: string;
      risposta: BloccoRisposta[];
      fonti: FonteCitata[];
      senzaRisposta: boolean;
      avviso: string | null;
      creatoIl: string;
    };

/** GET /api/chat/conversazioni */
export type RispostaElencoChat = { conversazioni: ConversazioneBreve[] };

/** GET /api/chat/conversazioni/[id] */
export type RispostaChat = { conversazione: ConversazioneBreve; messaggi: MessaggioSalvato[] };

/** Lunghezza massima del titolo di una chat. */
export const TITOLO_MASSIMO = 60;

/** Il titolo di una chat nuova: la prima domanda, accorciata a una parola intera. */
export function titoloDaDomanda(domanda: string): string {
  const pulita = domanda.replace(/\s+/g, " ").trim();
  if (pulita.length <= TITOLO_MASSIMO) return pulita || "Nuova chat";
  const taglio = pulita.slice(0, TITOLO_MASSIMO - 1);
  const spazio = taglio.lastIndexOf(" ");
  return `${(spazio > 30 ? taglio.slice(0, spazio) : taglio).trimEnd()}…`;
}

export type GruppoChat = "Oggi" | "Ieri" | "Ultimi 7 giorni" | "Ultimi 30 giorni" | "Prima";

/**
 * Raggruppa le chat per data, dalla più recente, come nella barra laterale di
 * ChatGPT. `oggi` è la data locale AAAA-MM-GG di chi guarda.
 */
export function raggruppaChat(
  chat: readonly ConversazioneBreve[],
  oggi: string,
): { gruppo: GruppoChat; chat: ConversazioneBreve[] }[] {
  const [a, m, g] = oggi.split("-").map(Number);
  const inizioOggi = new Date(a, m - 1, g).getTime();
  const giorno = 86_400_000;
  const gruppi = new Map<GruppoChat, ConversazioneBreve[]>();
  const ordinate = [...chat].sort((x, y) => y.aggiornataIl.localeCompare(x.aggiornataIl));
  for (const c of ordinate) {
    const t = new Date(c.aggiornataIl).getTime();
    const gruppo: GruppoChat =
      t >= inizioOggi
        ? "Oggi"
        : t >= inizioOggi - giorno
          ? "Ieri"
          : t >= inizioOggi - 7 * giorno
            ? "Ultimi 7 giorni"
            : t >= inizioOggi - 30 * giorno
              ? "Ultimi 30 giorni"
              : "Prima";
    gruppi.set(gruppo, [...(gruppi.get(gruppo) ?? []), c]);
  }
  const ordine: GruppoChat[] = ["Oggi", "Ieri", "Ultimi 7 giorni", "Ultimi 30 giorni", "Prima"];
  return ordine.filter((o) => gruppi.has(o)).map((o) => ({ gruppo: o, chat: gruppi.get(o)! }));
}
