"use client";

import { useSyncExternalStore } from "react";
import { iscriviti, leggiGrezzo, scriviGrezzo } from "@/lib/percorso/archivio";
import { analizzaLook, CHIAVE_LOOK, datiLook, LOOK, type IdLook } from "@/lib/mascotte/look";
import { CHIAVE_VESTITO } from "@/lib/mascotte/vestito";
import { sito } from "@/lib/sito";
import { ImmagineMascotte } from "./immagine";

/** Look salvato in questo browser (il classico sul server e prima dell'idratazione). */
export function useLook(): IdLook {
  const grezzo = useSyncExternalStore(iscriviti, () => leggiGrezzo(CHIAVE_LOOK), () => null);
  const vecchio = useSyncExternalStore(iscriviti, () => leggiGrezzo(CHIAVE_VESTITO), () => null);
  return analizzaLook(grezzo, vecchio);
}

/** Vesti Bleo: scegli un look tra le immagini della mascotte. */
export function Guardaroba() {
  const scelto = useLook();
  const attuale = datiLook(scelto);
  return (
    <section aria-labelledby="titolo-guardaroba" className="rounded-xl border border-border bg-card p-5 print:hidden">
      <h2 id="titolo-guardaroba" className="text-lg font-semibold">
        Vesti {sito.mascotte}
      </h2>
      <p className="mt-1 text-sm text-muted">Scegli il look che preferisci: la scelta resta in questo browser.</p>
      <div className="mt-3 rounded-lg bg-brand-soft/60 p-2">
        <ImmagineMascotte nome={attuale.immagine} sizes="176px" className="mx-auto h-44 w-auto" />
      </div>
      <p className="mt-2 text-center text-sm font-medium" aria-live="polite">
        {attuale.etichetta}
      </p>
      <fieldset className="mt-3">
        <legend className="sr-only">Look di {sito.mascotte}</legend>
        <div className="grid grid-cols-5 gap-2">
          {LOOK.map((l) => (
            <label
              key={l.id}
              title={l.etichetta}
              className="cursor-pointer rounded-lg border-2 border-transparent bg-brand-soft/40 p-1 has-[:checked]:border-brand has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand"
            >
              <input
                type="radio"
                name="look-mascotte"
                value={l.id}
                checked={scelto === l.id}
                onChange={() => scriviGrezzo(CHIAVE_LOOK, l.id)}
                className="sr-only"
              />
              <ImmagineMascotte nome={l.immagine} sizes="56px" className="mx-auto h-12 w-auto" />
              <span className="sr-only">{l.etichetta}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
