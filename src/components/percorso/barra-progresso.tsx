import { useId } from "react";

/** Barra di avanzamento accessibile (role="progressbar" con testo leggibile). */
export function BarraProgresso({
  valore,
  massimo,
  etichetta,
  testo,
}: {
  valore: number;
  massimo: number;
  etichetta: string;
  /** Testo visibile e letto dagli screen reader, per esempio "3 di 10". */
  testo: string;
}) {
  const id = useId();
  const percentuale = massimo > 0 ? Math.min(100, Math.round((valore / massimo) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span id={id} className="font-medium">
          {etichetta}
        </span>
        <span className="text-muted">{testo}</span>
      </div>
      <div
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={massimo}
        aria-valuenow={valore}
        aria-valuetext={testo}
        className="mt-2 h-2 overflow-hidden rounded-full bg-border print:border print:border-foreground"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300 motion-reduce:transition-none print:bg-foreground"
          style={{ width: `${percentuale}%` }}
        />
      </div>
    </div>
  );
}
