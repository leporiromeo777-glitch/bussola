"use client";

import { useId, useMemo, useSyncExternalStore } from "react";
import { iscriviti, leggiGrezzo, scriviGrezzo } from "@/lib/percorso/archivio";
import {
  analizzaVestito,
  CAPPELLI,
  CHIAVE_VESTITO,
  OCCHIALI,
  SCIARPE,
  type Vestito,
} from "@/lib/mascotte/vestito";
import { sito } from "@/lib/sito";
import { MascotteSvg } from "./mascotte-svg";

/** Vestito salvato in questo browser (predefinito sul server e prima dell'idratazione). */
export function useVestito(): Vestito {
  const grezzo = useSyncExternalStore(
    iscriviti,
    () => leggiGrezzo(CHIAVE_VESTITO),
    () => null,
  );
  return useMemo(() => analizzaVestito(grezzo), [grezzo]);
}

/** Salva il vestito in questo browser: tutte le mascotte della pagina si aggiornano. */
export function salvaVestito(vestito: Vestito) {
  scriviGrezzo(CHIAVE_VESTITO, JSON.stringify(vestito));
}

/** La mascotte con il vestito scelto in questo browser. */
export function MascotteVestita({ className, bussolina }: { className?: string; bussolina?: boolean }) {
  return <MascotteSvg vestito={useVestito()} bussolina={bussolina} className={className} />;
}

/** Riquadro per vestire la mascotte: anteprima e scelta di cappello, occhiali e sciarpa. */
export function Guardaroba() {
  const vestito = useVestito();
  return (
    <section aria-labelledby="titolo-guardaroba" className="rounded-xl border border-border bg-card p-5 print:hidden">
      <h2 id="titolo-guardaroba" className="text-lg font-semibold">
        Vesti {sito.mascotte}
      </h2>
      <p className="mt-1 text-sm text-muted">Scegli cappello, occhiali e sciarpa: la scelta resta in questo browser.</p>
      <div className="mt-3 rounded-lg bg-brand-soft/60 p-2">
        <MascotteSvg vestito={vestito} className="mx-auto h-44 w-auto" />
      </div>
      <Gruppo
        nome="Cappello"
        valori={CAPPELLI}
        scelto={vestito.cappello}
        onScegli={(cappello) => salvaVestito({ ...vestito, cappello })}
      />
      <Gruppo
        nome="Occhiali"
        valori={OCCHIALI}
        scelto={vestito.occhiali}
        onScegli={(occhiali) => salvaVestito({ ...vestito, occhiali })}
      />
      <Gruppo nome="Sciarpa" valori={SCIARPE} scelto={vestito.sciarpa} onScegli={(sciarpa) => salvaVestito({ ...vestito, sciarpa })} />
    </section>
  );
}

/** Una fila di scelte (radio) per un tipo di accessorio. */
export function Gruppo<T extends string>({
  nome,
  valori,
  scelto,
  onScegli,
}: {
  nome: string;
  valori: Record<T, string>;
  scelto: T;
  onScegli: (valore: T) => void;
}) {
  const id = useId();
  return (
    <fieldset className="mt-4">
      <legend className="text-sm font-medium">{nome}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(valori) as T[]).map((valore) => (
          <label
            key={valore}
            className="cursor-pointer rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-brand has-checked:border-brand has-checked:bg-brand has-checked:text-background has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
          >
            <input
              type="radio"
              name={`${id}-${nome}`}
              value={valore}
              checked={scelto === valore}
              onChange={() => onScegli(valore)}
              className="sr-only"
            />
            {valori[valore]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
