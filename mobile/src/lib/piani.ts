/**
 * «Budget del primo anno» e «Business plan di una pagina» nell'app.
 *
 * - Senza accesso (o nella versione di prova) i dati restano su questo
 *   telefono, come gli altri calcoli, con le stesse chiavi del sito
 *   (src/lib/strumenti/archivio.ts).
 * - Con l'accesso stanno nell'account (le stesse API del sito, con
 *   "Authorization: Bearer"): sono gli stessi sul sito e sul telefono. Le
 *   modifiche si salvano da sole dopo una breve pausa
 *   (src/lib/strumenti/archivio-salvati.ts). Quello che c'era sul telefono
 *   si può copiare nell'account una volta.
 *
 * Calcoli, controlli e testi sono quelli del sito (src/lib/strumenti). Il PDF
 * si crea sul telefono con expo-print (HTML di src/lib/strumenti/stampa-piani.ts)
 * e si condivide con expo-sharing: non passa dai server di Bleo.
 */
import { Directory, File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { AppState, Platform } from "react-native";
import { codifica, decodifica } from "@/lib/strumenti/archivio";
import type { Chiamata, ErroreArchivio } from "@/lib/strumenti/archivio-account";
import { ArchivioStrumento, type StatoStrumento } from "@/lib/strumenti/archivio-salvati";
import { CHIAVI_STRUMENTI, datiIniziali, SCHEMI_STRUMENTI, type DatiStrumento, type StrumentoSalvato } from "@/lib/strumenti/salvati";
import { A4_PUNTI } from "@/lib/strumenti/stampa-documento";
import { A4_ORIZZONTALE_PUNTI } from "@/lib/strumenti/stampa-piani";
import { tokenAttuale } from "./api";
import { SITO_URL } from "./config";
import { iscriviti, leggi, scrivi } from "./memoria";
import { useSessione } from "./sessione";
import { oggiLocale } from "./stato";
import { supabase } from "./supabase";

const MESSAGGI: Record<number, string> = {
  401: "Accedi di nuovo per salvare budget e business plan nel tuo account.",
  413: "Sono troppi dati per salvarli: togli qualche voce o accorcia i testi.",
  503: "Il salvataggio di budget e business plan nell'account non è ancora attivo.",
};

const chiamaApp: Chiamata = async <T,>(percorso: string, opzioni: { metodo?: string; corpo?: unknown } = {}) => {
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
  return { ok: true, dati: corpo as T };
};

/** Gli archivi dell'account, uno per strumento (il business plan legge anche quello del budget). */
const archivi = {
  budget: new ArchivioStrumento("budget", chiamaApp, { oggi: () => oggiLocale() }),
  "business-plan": new ArchivioStrumento("business-plan", chiamaApp, { oggi: () => oggiLocale() }),
};

export function archivioPiano<S extends StrumentoSalvato>(strumento: S): ArchivioStrumento<S> {
  return archivi[strumento] as unknown as ArchivioStrumento<S>;
}

// Uscendo dall'account (o entrando con un altro) si dimentica tutto; andando in
// secondo piano si salva subito quello che manca.
let utenteAttuale: string | null | undefined;
supabase()?.auth.onAuthStateChange((_evento, sessione) => {
  const utente = sessione?.user.id ?? null;
  if (utenteAttuale !== undefined && utente !== utenteAttuale) for (const a of Object.values(archivi)) a.azzera();
  utenteAttuale = utente;
});
AppState.addEventListener("change", (stato) => {
  if (stato === "active") return;
  for (const a of Object.values(archivi)) if (a.inAttesa()) void a.salva();
});

/* ------------------------------------------------------------------ */
/* Sul telefono                                                        */
/* ------------------------------------------------------------------ */

const predefinito = <S extends StrumentoSalvato>(strumento: S) => () => datiIniziali(strumento, oggiLocale());

function leggiSulTelefono<S extends StrumentoSalvato>(strumento: S): DatiStrumento[S] {
  return decodifica(leggi(CHIAVI_STRUMENTI[strumento]), SCHEMI_STRUMENTI[strumento], predefinito(strumento));
}

/** I dati salvati su questo telefono e se c'è qualcosa di salvato. */
function useSulTelefono<S extends StrumentoSalvato>(strumento: S) {
  const chiave = CHIAVI_STRUMENTI[strumento];
  const grezzo = useSyncExternalStore(
    iscriviti,
    () => leggi(chiave),
    () => null,
  );
  const dati = useMemo(
    () => decodifica(grezzo, SCHEMI_STRUMENTI[strumento], predefinito(strumento)),
    [grezzo, strumento],
  );
  const aggiorna = useCallback(
    (modifica: (precedente: DatiStrumento[S]) => DatiStrumento[S]) => scrivi(chiave, codifica(modifica(leggiSulTelefono(strumento)))),
    [chiave, strumento],
  );
  const togli = useCallback(() => scrivi(chiave, null), [chiave]);
  return { dati, presente: grezzo !== null, aggiorna, togli };
}

/* ------------------------------------------------------------------ */
/* Telefono o account                                                  */
/* ------------------------------------------------------------------ */

type Comune<S extends StrumentoSalvato> = {
  dati: DatiStrumento[S];
  aggiorna: (modifica: (precedente: DatiStrumento[S]) => DatiStrumento[S]) => void;
  /** true se c'è qualcosa di salvato (per importarlo in un altro strumento). */
  presente: boolean;
  /** «Ricomincia da zero». */
  ricomincia: () => void;
};

export type VistaPiano<S extends StrumentoSalvato> =
  | { modo: "attesa" }
  | { modo: "errore"; errore: ErroreArchivio; riprova: () => void; usaTelefono: () => void }
  | (Comune<S> & {
      modo: "telefono";
      /** «prova»: versione senza account; «ospite»: senza accesso; «scelta»: l'account non rispondeva. */
      motivo: "prova" | "ospite" | "scelta";
    })
  | (Comune<S> & {
      modo: "account";
      stato: StatoStrumento<DatiStrumento[S]>;
      archivio: ArchivioStrumento<S>;
      /** Quello che c'è su questo telefono, salvato prima dell'accesso (null se niente). */
      sulTelefono: DatiStrumento[S] | null;
      togliDalTelefono: () => void;
    });

/**
 * Il budget o il business plan da mostrare: dall'account con l'accesso,
 * altrimenti da questo telefono. `soloTelefono` lo tiene sul telefono (per
 * esempio il budget letto dal business plan quando il piano è sul telefono).
 */
export function usePiano<S extends StrumentoSalvato>(strumento: S, { soloTelefono = false }: { soloTelefono?: boolean } = {}): VistaPiano<S> {
  const { pronta, sessione } = useSessione();
  const [sceltoTelefono, setSceltoTelefono] = useState(false);
  const telefono = useSulTelefono(strumento);
  const archivio = archivioPiano(strumento);
  const stato = useSyncExternalStore(archivio.iscrivi, archivio.istantanea, archivio.istantanea);
  const conAccount = Boolean(supabase()) && Boolean(sessione) && !sceltoTelefono && !soloTelefono;

  // A ogni ritorno sulla schermata si rilegge: le modifiche fatte sul sito si vedono subito.
  useFocusEffect(
    useCallback(() => {
      if (!conAccount) return;
      if (archivio.istantanea().caricamento === "pronto") void archivio.carica({ forza: true });
      else void archivio.carica();
    }, [conAccount, archivio]),
  );

  if (!supabase() || soloTelefono || sceltoTelefono || (pronta && !sessione)) {
    return {
      modo: "telefono",
      motivo: !supabase() ? "prova" : sceltoTelefono ? "scelta" : "ospite",
      dati: telefono.dati,
      aggiorna: telefono.aggiorna,
      presente: telefono.presente,
      ricomincia: telefono.togli,
    };
  }
  if (!pronta) return { modo: "attesa" };
  if (stato.caricamento === "errore" && stato.errore) {
    return {
      modo: "errore",
      errore: stato.errore,
      riprova: () => void archivio.carica(),
      usaTelefono: () => setSceltoTelefono(true),
    };
  }
  if (stato.caricamento !== "pronto" || !stato.dati) return { modo: "attesa" };
  return {
    modo: "account",
    dati: stato.dati,
    aggiorna: (modifica) => archivio.aggiorna(modifica),
    presente: stato.nellAccount,
    ricomincia: () => archivio.cancella(),
    stato,
    archivio,
    sulTelefono: telefono.presente ? telefono.dati : null,
    togliDalTelefono: telefono.togli,
  };
}

/** Id casuale per le voci del budget (stessa forma di quelli del sito). */
export function nuovoIdVoce(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  const pezzo = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  return `${Date.now().toString(36)}-${pezzo()}-${pezzo()}`;
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

/** Sul web (anteprima di sviluppo) PDF e condivisione non ci sono. */
export const PDF_DISPONIBILE = Platform.OS !== "web";

export type PaginaPdf = { html: string; nomeFile: string; orizzontale?: boolean };

function cancellaSenzaErrori(voce: File | Directory) {
  try {
    if (voce.exists) voce.delete();
  } catch {
    // Resta nella cache: il telefono la svuota da solo.
  }
}

/** Crea il PDF A4 nella cache del telefono, con il nome giusto («Budget del primo anno.pdf»). */
export async function creaPdfPiano({ html, nomeFile, orizzontale = false }: PaginaPdf): Promise<string> {
  const pagina = orizzontale ? A4_ORIZZONTALE_PUNTI : A4_PUNTI;
  const risultato = await Print.printToFileAsync({
    html,
    width: pagina.larghezza,
    height: pagina.altezza,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  try {
    // I PDF di prima non servono più: ne resta uno, con il nome giusto.
    const base = new Directory(Paths.cache, "pdf-bleo-piani");
    cancellaSenzaErrori(base);
    const cartella = new Directory(base, `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
    cartella.create({ intermediates: true, idempotent: true });
    const conNome = new File(cartella, nomeFile);
    await new File(risultato.uri).move(conNome);
    return conNome.uri;
  } catch {
    // Se il nome non si può cambiare, il PDF va bene lo stesso.
    return risultato.uri;
  }
}

/** Crea il PDF e apre la condivisione (email, messaggi, File…). */
export async function condividiPdfPiano(pagina: PaginaPdf): Promise<void> {
  const uri = await creaPdfPiano(pagina);
  if (!(await Sharing.isAvailableAsync())) throw new Error("condivisione non disponibile");
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: pagina.nomeFile.replace(/\.pdf$/, ""),
  });
}

/** Crea il PDF e apre la stampa del telefono (con l'anteprima delle pagine). */
export async function stampaPdfPiano(pagina: PaginaPdf): Promise<void> {
  const uri = await creaPdfPiano(pagina);
  await Print.printAsync({ uri, orientation: pagina.orizzontale ? Print.Orientation.landscape : Print.Orientation.portrait });
}
