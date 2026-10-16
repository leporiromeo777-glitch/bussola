"use client";

import { useEffect, useRef, useState } from "react";
import {
  CAPPELLI,
  descriviVestito,
  OCCHIALI,
  SCIARPE,
  type Vestito,
  VESTITO_PREDEFINITO,
} from "@/lib/mascotte/vestito";
import { sito } from "@/lib/sito";
import { Gruppo, salvaVestito, useVestito } from "./guardaroba";
import { MascotteSvg } from "./mascotte-svg";
import type { Scena3d } from "./scena-3d";

type Stato = "attesa" | "pronta" | "non-disponibile";

/** Un ottavo di giro per ogni clic sui pulsanti. */
const PASSO = Math.PI / 4;

/**
 * Bleo e la bussolina in 3D su un piedistallo che si gira, con cappello,
 * occhiali e sciarpa da combinare. Il vestito si salva nel browser ed è lo
 * stesso del percorso. Senza WebGL resta il disegno piatto.
 */
export function Configuratore() {
  const vestito = useVestito();
  return (
    <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
      <Visore3d vestito={vestito} />
      <div>
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
        <Gruppo
          nome="Sciarpa"
          valori={SCIARPE}
          scelto={vestito.sciarpa}
          onScegli={(sciarpa) => salvaVestito({ ...vestito, sciarpa })}
        />
        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <span aria-live="polite">
            {sito.mascotte} {descriviVestito(vestito)}.
          </span>
          <button
            type="button"
            onClick={() => salvaVestito(VESTITO_PREDEFINITO)}
            className="font-medium text-brand underline underline-offset-4 hover:no-underline"
          >
            Togli tutto
          </button>
        </p>
      </div>
    </div>
  );
}

function Visore3d({ vestito }: { vestito: Vestito }) {
  const contenitore = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const scena = useRef<Scena3d | null>(null);
  const ultimoVestito = useRef(vestito);
  const [stato, setStato] = useState<Stato>("attesa");

  useEffect(() => {
    ultimoVestito.current = vestito;
    scena.current?.vesti(vestito);
  }, [vestito]);

  useEffect(() => {
    const div = contenitore.current;
    const canvas = tela.current;
    if (!div || !canvas) return;
    let chiuso = false;
    let visibile = false;

    const aggiornaAttiva = () => scena.current?.attiva(visibile && document.visibilityState === "visible");

    async function carica() {
      try {
        const { creaScena } = await import("./scena-3d");
        if (chiuso || !canvas) return;
        const pocoMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        scena.current = creaScena(canvas, { pocoMovimento });
        scena.current.vesti(ultimoVestito.current);
        aggiornaAttiva();
        setStato("pronta");
      } catch {
        if (!chiuso) setStato("non-disponibile");
      }
    }

    // three.js si scarica solo quando la sezione sta per entrare nello schermo
    let caricamentoAvviato = false;
    const osservatore = new IntersectionObserver(
      ([voce]) => {
        visibile = voce.isIntersecting;
        if (visibile && !caricamentoAvviato) {
          caricamentoAvviato = true;
          void carica();
        }
        aggiornaAttiva();
      },
      { rootMargin: "300px 0px" },
    );
    osservatore.observe(div);
    document.addEventListener("visibilitychange", aggiornaAttiva);

    return () => {
      chiuso = true;
      osservatore.disconnect();
      document.removeEventListener("visibilitychange", aggiornaAttiva);
      scena.current?.dispose();
      scena.current = null;
    };
  }, []);

  const etichetta = `${sito.mascotte} ${descriviVestito(vestito)}, con la bussolina accanto, su un piedistallo che si può girare`;

  return (
    <div>
      <div
        ref={contenitore}
        className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-background/70 to-background/20"
      >
        <canvas
          ref={tela}
          role="img"
          aria-label={etichetta}
          className={`absolute inset-0 size-full cursor-grab touch-pan-y transition-opacity duration-500 data-[trascina]:cursor-grabbing ${
            stato === "pronta" ? "opacity-100" : "opacity-0"
          }`}
        />
        {stato !== "pronta" ? (
          <MascotteSvg vestito={vestito} className="absolute inset-0 m-auto h-3/4 w-auto" />
        ) : null}
      </div>
      {stato === "pronta" ? (
        <div className="mt-3 flex items-center justify-center gap-3">
          <PulsanteGira etichetta="Gira a sinistra" onClick={() => scena.current?.gira(-PASSO)} verso="sinistra" />
          <p className="text-sm text-muted">Trascina per girarlo</p>
          <PulsanteGira etichetta="Gira a destra" onClick={() => scena.current?.gira(PASSO)} verso="destra" />
        </div>
      ) : stato === "non-disponibile" ? (
        <p className="mt-3 text-center text-sm text-muted">
          Il tuo browser non mostra il 3D: ecco {sito.mascotte} disegnato.
        </p>
      ) : null}
    </div>
  );
}

function PulsanteGira({
  etichetta,
  onClick,
  verso,
}: {
  etichetta: string;
  onClick: () => void;
  verso: "sinistra" | "destra";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etichetta}
      title={etichetta}
      className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-brand hover:text-brand"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-5 ${verso === "destra" ? "-scale-x-100" : ""}`}>
        <path
          d="M9 7H4V2M4.5 7A8 8 0 1 1 4 13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
