"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  analizzaPassiFatti,
  analizzaRisposteSalvate,
  CHIAVE_PASSI_FATTI,
  CHIAVE_RISPOSTE,
  iscriviti,
  leggiGrezzo,
} from "@/lib/percorso/archivio";

function useValoreLocale(chiave: string): string | null {
  return useSyncExternalStore(
    iscriviti,
    () => leggiGrezzo(chiave),
    () => null,
  );
}

/** Risposte salvate in questo browser (null sul server e prima dell'idratazione). */
export function useRisposteLocali() {
  const grezzo = useValoreLocale(CHIAVE_RISPOSTE);
  return useMemo(() => analizzaRisposteSalvate(grezzo), [grezzo]);
}

/** Passi fatti salvati in questo browser. */
export function usePassiFattiLocali() {
  const grezzo = useValoreLocale(CHIAVE_PASSI_FATTI);
  return useMemo(() => analizzaPassiFatti(grezzo), [grezzo]);
}

const nessunaIscrizione = () => () => {};

/** false durante il rendering sul server e l'idratazione, poi true: distingue "nessun dato" da "non ancora letto". */
export function useIdratato(): boolean {
  return useSyncExternalStore(
    nessunaIscrizione,
    () => true,
    () => false,
  );
}
