"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ArchivioStrumento, type StatoStrumento } from "@/lib/strumenti/archivio-salvati";
import type { DatiStrumento, StrumentoSalvato } from "@/lib/strumenti/salvati";
import { chiamaSito } from "../documenti/usa-archivio-account";

/*
 * Budget e business plan nell'account, sul sito: un archivio per strumento e
 * per pagina (il business plan legge anche quello del budget), con le
 * chiamate alle API fatte con i cookie della sessione. Prima di chiudere o
 * nascondere la pagina le modifiche in sospeso partono subito (keepalive).
 */

const archivi = new Map<StrumentoSalvato, ArchivioStrumento<StrumentoSalvato>>();

/** L'archivio dell'account di uno strumento per questa pagina (creato alla prima richiesta). */
export function archivioStrumentoDelSito<S extends StrumentoSalvato>(strumento: S): ArchivioStrumento<S> {
  const esistente = archivi.get(strumento);
  if (esistente) return esistente as unknown as ArchivioStrumento<S>;
  const nuovo = new ArchivioStrumento(strumento, chiamaSito);
  archivi.set(strumento, nuovo as unknown as ArchivioStrumento<StrumentoSalvato>);
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
 * Lo stato dell'archivio dell'account di uno strumento (null sul server,
 * durante l'idratazione o se `attivo` è false). La prima volta legge i dati.
 */
export function useStrumentoAccount<S extends StrumentoSalvato>(
  strumento: S,
  attivo: boolean,
): { stato: StatoStrumento<DatiStrumento[S]> | null; archivio: ArchivioStrumento<S> | null } {
  const a = attivo && typeof window !== "undefined" ? archivioStrumentoDelSito(strumento) : null;
  const stato = useSyncExternalStore(a ? a.iscrivi : nessunaIscrizione, a ? a.istantanea : nessunoStato, nessunoStato);
  useEffect(() => {
    if (a) void a.carica();
  }, [a]);
  return { stato, archivio: a };
}
