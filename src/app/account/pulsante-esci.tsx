"use client";

import { esci } from "../accedi/azioni";
import { dimenticaPercorsoLocale } from "@/lib/percorso/archivio";
import { cancellaBozza } from "@/lib/percorso/bozza";

/**
 * "Esci": chiude la sessione e cancella dal browser la copia del percorso
 * (risposte, passi fatti, proprietario e bozza del questionario), così su un
 * computer condiviso chi arriva dopo non la vede e non finisce nel suo account.
 */
export function PulsanteEsci() {
  return (
    <form
      action={esci}
      onSubmit={() => {
        dimenticaPercorsoLocale();
        cancellaBozza();
      }}
      className="mt-8"
    >
      <button type="submit" className="rounded-lg border border-border px-4 py-2 hover:border-brand">
        Esci
      </button>
    </form>
  );
}
