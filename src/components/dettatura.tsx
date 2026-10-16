"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LINGUA_DETTATURA, messaggioErroreDettatura } from "@/lib/dettatura/testo";

// La Web Speech API non è ancora nei tipi di TypeScript: solo quello che serve qui.
type RisultatoDettatura = { isFinal: boolean; 0: { transcript: string } };
type EventoDettatura = { resultIndex: number; results: ArrayLike<RisultatoDettatura> };
type Riconoscimento = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((evento: EventoDettatura) => void) | null;
  onerror: ((evento: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type CostruttoreRiconoscimento = new () => Riconoscimento;

function costruttore(): CostruttoreRiconoscimento | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: CostruttoreRiconoscimento; webkitSpeechRecognition?: CostruttoreRiconoscimento };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const nessunaIscrizione = () => () => {};

/**
 * Pulsante del microfono: si tocca, si parla, il testo arriva nel campo.
 * Usa il riconoscimento vocale del browser (Chrome, Safari, Edge); dove non
 * c'è (per esempio Firefox) il pulsante non compare. Bleo riceve solo il
 * testo, mai l'audio.
 */
export function PulsanteDettatura({
  onTesto,
  disabilitato = false,
  compatto = false,
}: {
  /** Chiamata con ogni pezzo di frase riconosciuto (definitivo). */
  onTesto: (dettato: string) => void;
  disabilitato?: boolean;
  /**
   * Solo l'icona, tonda, per stare dentro un campo (come nella chat): la frase
   * che si sta riconoscendo e gli errori compaiono in un fumetto sopra.
   */
  compatto?: boolean;
}) {
  const supportata = useSyncExternalStore(
    nessunaIscrizione,
    () => costruttore() !== null,
    () => false,
  );
  const [ascolto, setAscolto] = useState(false);
  const [provvisorio, setProvvisorio] = useState("");
  const [errore, setErrore] = useState("");
  const riconoscimento = useRef<Riconoscimento | null>(null);
  const suTesto = useRef(onTesto);
  useEffect(() => {
    suTesto.current = onTesto;
  }, [onTesto]);
  useEffect(() => () => riconoscimento.current?.abort(), []);

  if (!supportata) return null;

  function avvia() {
    const Costruttore = costruttore();
    if (!Costruttore) return;
    setErrore("");
    setProvvisorio("");
    const r = new Costruttore();
    r.lang = LINGUA_DETTATURA;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (evento) => {
      let inCorso = "";
      for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
        const risultato = evento.results[i];
        if (risultato.isFinal) suTesto.current(risultato[0].transcript);
        else inCorso += risultato[0].transcript;
      }
      setProvvisorio(inCorso);
    };
    r.onerror = (evento) => setErrore(messaggioErroreDettatura(evento.error));
    r.onend = () => {
      setAscolto(false);
      setProvvisorio("");
      riconoscimento.current = null;
    };
    riconoscimento.current = r;
    try {
      r.start();
      setAscolto(true);
    } catch {
      setErrore(messaggioErroreDettatura(""));
    }
  }

  function ferma() {
    riconoscimento.current?.stop();
  }

  const icona = ascolto ? (
    <span aria-hidden="true" className="size-2.5 rounded-full bg-danger motion-safe:animate-pulse" />
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );

  if (compatto) {
    const fumetto = errore || (ascolto ? (provvisorio ? `«${provvisorio}»` : "Ti ascolto…") : "");
    return (
      <div className="relative">
        <button
          type="button"
          onClick={ascolto ? ferma : avvia}
          disabled={disabilitato && !ascolto}
          aria-pressed={ascolto}
          aria-label={ascolto ? "Sto ascoltando: tocca per fermare" : "Dillo a voce"}
          title={ascolto ? "Tocca per fermare" : "Dillo a voce"}
          className={`inline-flex size-10 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
            ascolto ? "bg-danger/10 text-danger" : "text-muted hover:bg-brand-soft hover:text-foreground"
          }`}
        >
          {icona}
        </button>
        <p role="status" aria-live="polite" className="sr-only">
          {ascolto && provvisorio ? `«${provvisorio}»` : ""}
        </p>
        {errore ? (
          <p role="alert" className="sr-only">
            {errore}
          </p>
        ) : null}
        {fumetto ? (
          <p
            aria-hidden="true"
            className={`absolute bottom-full right-0 z-10 mb-2 w-max max-w-64 rounded-xl border border-border bg-card px-3 py-1.5 text-sm shadow-md ${
              errore ? "text-danger" : "text-muted"
            }`}
          >
            {fumetto}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={ascolto ? ferma : avvia}
        disabled={disabilitato && !ascolto}
        aria-pressed={ascolto}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          ascolto
            ? "border-danger bg-danger/10 text-danger"
            : "border-border bg-card text-foreground hover:border-brand hover:text-brand"
        }`}
      >
        {icona}
        {ascolto ? "Sto ascoltando… tocca per fermare" : "Dillo a voce"}
      </button>
      <p role="status" aria-live="polite" className="text-sm text-muted">
        {ascolto && provvisorio ? `«${provvisorio}»` : ""}
      </p>
      {errore ? (
        <p role="alert" className="text-sm text-danger">
          {errore}
        </p>
      ) : null}
    </div>
  );
}
