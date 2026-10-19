"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ArchivioAccount, type Chiamata, type StatoArchivio } from "@/lib/strumenti/archivio-account";

/*
 * Preventivi e fatture nell'account, sul sito: un solo archivio per la
 * pagina (resta passando dal preventivo alla fattura), con le chiamate alle
 * API fatte con i cookie della sessione. Prima di chiudere o nascondere la
 * pagina le modifiche in sospeso partono subito (keepalive).
 */

const MESSAGGIO_RETE = "Non riesco a raggiungere Bleo: controlla la connessione. Riprovo da solo.";
const MESSAGGIO_GENERICO = "Qualcosa non ha funzionato. Riprova tra poco.";

const chiamaSito: Chiamata = async <T,>(
  percorso: string,
  opzioni: { metodo?: string; corpo?: unknown; keepalive?: boolean } = {},
) => {
  let risposta: Response;
  try {
    const corpo = opzioni.corpo === undefined ? undefined : JSON.stringify(opzioni.corpo);
    risposta = await fetch(percorso, {
      method: opzioni.metodo ?? "GET",
      headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: corpo,
      cache: "no-store",
      // keepalive accetta corpi piccoli (64 KB): oltre, la richiesta parte normale.
      keepalive: Boolean(opzioni.keepalive && corpo && corpo.length < 60_000),
    });
  } catch {
    return { ok: false, messaggio: MESSAGGIO_RETE, stato: null };
  }
  if (risposta.status === 204) return { ok: true, dati: undefined as T };
  const corpo = (await risposta.json().catch(() => null)) as unknown;
  if (!risposta.ok) {
    const messaggio = (corpo as { messaggio?: unknown } | null)?.messaggio;
    return {
      ok: false,
      messaggio: typeof messaggio === "string" && messaggio ? messaggio : MESSAGGIO_GENERICO,
      stato: risposta.status,
    };
  }
  return { ok: true, dati: corpo as T };
};

let archivio: ArchivioAccount | null = null;

/** L'archivio dell'account per questa pagina (creato alla prima richiesta). */
export function archivioDelSito(): ArchivioAccount {
  if (archivio) return archivio;
  const nuovo = new ArchivioAccount(chiamaSito);
  archivio = nuovo;
  const salvaSubito = () => {
    if (nuovo.inAttesa()) void nuovo.salva({ keepalive: true });
  };
  window.addEventListener("pagehide", salvaSubito);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") salvaSubito();
  });
  // Modifiche non ancora salvate: il browser chiede conferma prima di chiudere la pagina.
  window.addEventListener("beforeunload", (evento) => {
    if (!nuovo.inAttesa()) return;
    salvaSubito();
    evento.preventDefault();
  });
  return nuovo;
}

const nessunaIscrizione = () => () => {};
const nessunoStato = () => null;

/**
 * Lo stato dell'archivio dell'account (null sul server, durante
 * l'idratazione o se `attivo` è false). La prima volta legge i documenti.
 */
export function useArchivioAccount(attivo: boolean): { stato: StatoArchivio | null; archivio: ArchivioAccount | null } {
  const a = attivo && typeof window !== "undefined" ? archivioDelSito() : null;
  const stato = useSyncExternalStore(a ? a.iscrivi : nessunaIscrizione, a ? a.istantanea : nessunoStato, nessunoStato);
  useEffect(() => {
    if (a) void a.carica();
  }, [a]);
  return { stato, archivio: a };
}
