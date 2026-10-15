"use client";

import { useState } from "react";
import { IconaDispositivo, IconaStampa } from "./icone";
import { cancellaArchivio, useSalvataggioAttivo } from "./usa-archivio";
import { classePulsantePiccolo, classePulsanteSecondario } from "./ui";

/**
 * "I tuoi dati restano su questo dispositivo", con il pulsante per cancellarli.
 * Se il browser non permette di salvare, lo dice.
 */
export function NotaDatiLocali({ chiavi, etichettaCancella = "Cancella i dati di questo strumento" }: { chiavi: string[]; etichettaCancella?: string }) {
  const attivo = useSalvataggioAttivo();
  const [conferma, setConferma] = useState(false);
  const [cancellati, setCancellati] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-brand-soft p-4 text-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
      <p className="flex items-start gap-2">
        <IconaDispositivo className="mt-0.5 size-5 shrink-0 text-brand" />
        <span>
          <strong className="font-semibold">I tuoi dati restano su questo dispositivo.</strong>{" "}
          {attivo === false
            ? "Questo browser non permette di salvarli: restano solo finché la pagina è aperta."
            : "Li salviamo solo nel tuo browser, mentre scrivi: Bussola non li riceve."}
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2" aria-live="polite">
        {cancellati ? <span className="text-muted">Dati cancellati.</span> : null}
        {conferma ? (
          <>
            <button
              type="button"
              className={`${classePulsantePiccolo} border-danger text-danger`}
              onClick={() => {
                chiavi.forEach(cancellaArchivio);
                setConferma(false);
                setCancellati(true);
              }}
            >
              Sì, cancella
            </button>
            <button type="button" className={classePulsantePiccolo} onClick={() => setConferma(false)}>
              Annulla
            </button>
          </>
        ) : (
          <button
            type="button"
            className={classePulsantePiccolo}
            onClick={() => {
              setCancellati(false);
              setConferma(true);
            }}
          >
            {etichettaCancella}
          </button>
        )}
      </div>
    </div>
  );
}

/** Apre la finestra di stampa del browser (da lì anche "Salva come PDF"). */
export function PulsanteStampa({ etichetta = "Stampa o salva PDF", className = classePulsanteSecondario }: { etichetta?: string; className?: string }) {
  return (
    <button type="button" className={`${className} print:hidden`} onClick={() => window.print()}>
      <IconaStampa className="size-4" />
      {etichetta}
    </button>
  );
}
