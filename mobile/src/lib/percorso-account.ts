/**
 * «Il percorso nell'account»: con l'accesso, le risposte al questionario e
 * i passi fatti sono quelli dell'account, gli stessi del sito. La copia sul
 * telefono si scrive subito (percorso-locale.ts); all'account si manda
 * appena si può, con le API del sito (`/api/percorso`, "Authorization:
 * Bearer"), e dopo un errore di rete si riprova da solo. Le regole per
 * unire telefono e account sono quelle del sito (src/lib/percorso/
 * sincronizza.ts): una copia fatta senza accesso va nell'account solo dopo
 * il sì dell'utente.
 *
 * Si allinea all'accesso, quando l'app torna in primo piano, dopo ogni
 * modifica e quando tiri giù la schermata del percorso. Uscendo
 * dall'account la copia sul telefono si cancella, come sul sito.
 * Senza Supabase (versione di prova) non fa niente: tutto resta sul telefono.
 */
import type { Session } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { CHIAVE_BOZZA } from "@/lib/percorso/bozza";
import { CHIAVE_LINK_CALENDARIO } from "@/lib/percorso/archivio";
import { MESSAGGI_PERCORSO } from "@/lib/percorso/account-api";
import { SincronizzazionePercorso, type StatoSincronizzazione } from "@/lib/percorso/sincronizzazione";
import type { Chiamata } from "@/lib/strumenti/archivio-account";
import { tokenAttuale } from "./api";
import { SITO_URL } from "./config";
import { leggi, scrivi } from "./memoria";
import { riprogrammaNotifiche } from "./notifiche";
import {
  dimenticaCopiaLocale,
  impostaUtentePercorso,
  leggiCopiaLocale,
  scriviCopiaLocale,
  suModificaPercorso,
} from "./percorso-locale";
import { CHIAVE_SETTIMANA, promemoriaAttivi } from "./stato";
import { supabase } from "./supabase";

const MESSAGGI: Record<number, string> = {
  401: MESSAGGI_PERCORSO.nonCollegato,
  503: "Non riesco a salvare nel tuo account adesso. Riprovo da solo.",
};

const chiamaPercorso: Chiamata = async <T,>(percorso: string, opzioni: { metodo?: string; corpo?: unknown } = {}) => {
  const token = await tokenAttuale();
  if (!token) return { ok: false, messaggio: MESSAGGI[401], stato: 401 };
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
    return { ok: false, messaggio: "Non riesco a raggiungere Bleo: controlla la connessione. Riprovo da solo.", stato: null };
  }
  const corpo = (await risposta.json().catch(() => null)) as unknown;
  if (!risposta.ok) {
    const messaggio = (corpo as { messaggio?: unknown } | null)?.messaggio;
    return {
      ok: false,
      messaggio:
        typeof messaggio === "string" && messaggio.trim()
          ? messaggio
          : (MESSAGGI[risposta.status] ?? "Qualcosa non ha funzionato. Riprovo tra poco."),
      stato: risposta.status,
    };
  }
  return { ok: true, dati: corpo as T };
};

/** Scadenze e riassunto del lunedì nascono da risposte e passi fatti: se cambiano dall'account, si rifanno. */
function dopoCambio() {
  if (promemoriaAttivi() || leggi(CHIAVE_SETTIMANA) === "si") void riprogrammaNotifiche().catch(() => {});
}

/** Una sola per tutta l'app. */
export const sincronizzazionePercorso = new SincronizzazionePercorso({
  chiama: chiamaPercorso,
  leggiCopia: leggiCopiaLocale,
  scriviCopia: scriviCopiaLocale,
  dopoCambio,
});

suModificaPercorso(() => sincronizzazionePercorso.modificaLocale());

/** true mentre si esce dall'account: un rinnovo del token in quel momento non deve far ripartire niente. */
let inUscita = false;

function aggiornaUtente(sessione: Session | null) {
  if (inUscita) return;
  const utente = sessione?.user ? { id: sessione.user.id, email: sessione.user.email ?? null } : null;
  impostaUtentePercorso(utente?.id ?? null);
  sincronizzazionePercorso.impostaUtente(utente);
}

const client = supabase();
if (client) {
  void client.auth.getSession().then(({ data }) => aggiornaUtente(data.session));
  // Niente chiamate a Supabase qui dentro: la sincronizzazione parte con un timer.
  client.auth.onAuthStateChange((_evento, sessione) => aggiornaUtente(sessione));
  // Di ritorno in primo piano: le modifiche fatte sul sito arrivano, quelle in sospeso partono.
  AppState.addEventListener("change", (stato) => {
    if (stato === "active") void sincronizzazionePercorso.sincronizza();
  });
} else {
  impostaUtentePercorso(null);
}

/** Lo stato del percorso nell'account (fase, domanda, errori). */
export function useStatoPercorsoAccount(): StatoSincronizzazione {
  return useSyncExternalStore(
    sincronizzazionePercorso.iscrivi,
    sincronizzazionePercorso.istantanea,
    sincronizzazionePercorso.istantanea,
  );
}

/** Rilegge l'account adesso (per «tira giù per aggiornare»). */
export function aggiornaPercorsoDallAccount(): Promise<void> {
  return sincronizzazionePercorso.sincronizza();
}

/**
 * Prima di uscire: prova a mandare quello che manca (per qualche secondo al
 * massimo). true se sul telefono non resta niente che l'account non ha.
 */
export async function prontoPerUscire(): Promise<boolean> {
  if (!sincronizzazionePercorso.daSalvare()) return true;
  await Promise.race([
    sincronizzazionePercorso.sincronizza(),
    new Promise<void>((fatto) => setTimeout(fatto, 6_000)),
  ]);
  return !sincronizzazionePercorso.daSalvare();
}

/**
 * Toglie dal telefono la copia del percorso, la bozza del questionario e il
 * link del calendario, come «Esci» sul sito, e rifà i promemoria.
 */
export function dimenticaPercorsoDelTelefono(): void {
  sincronizzazionePercorso.azzera();
  impostaUtentePercorso(null);
  dimenticaCopiaLocale();
  for (const chiave of [CHIAVE_BOZZA, CHIAVE_LINK_CALENDARIO]) if (leggi(chiave) !== null) scrivi(chiave, null);
  void riprogrammaNotifiche().catch(() => {});
}

/** «Esci»: via la copia del percorso dal telefono (come sul sito), poi fuori dall'account. */
export async function esciDallAccount(): Promise<void> {
  inUscita = true;
  try {
    dimenticaPercorsoDelTelefono();
    await supabase()?.auth.signOut({ scope: "local" });
  } finally {
    inUscita = false;
  }
}
