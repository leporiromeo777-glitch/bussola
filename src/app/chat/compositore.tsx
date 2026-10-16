"use client";

import { useLayoutEffect, useRef, type FormEvent, type KeyboardEvent, type Ref } from "react";
import { PulsanteDettatura } from "@/components/dettatura";
import { LUNGHEZZA_MASSIMA_DOMANDA, LUNGHEZZA_MINIMA_DOMANDA } from "@/lib/chat/limiti";
import { aggiungiDettato } from "@/lib/dettatura/testo";
import { IconaFreccia, IconaStop } from "./icone";

/** Altezza massima del campo: circa 6 righe, poi scorre. */
const ALTEZZA_MASSIMA = 6 * 24 + 16;

/**
 * Il campo della domanda, tondo come in ChatGPT: cresce con il testo (fino a
 * 6 righe), Invio manda e Maiusc+Invio va a capo. Dentro ci sono il microfono
 * e il pulsante tondo per mandare, che durante la risposta diventa «Ferma».
 */
export function Compositore({
  bozza,
  onBozza,
  onInvia,
  onFerma,
  inCorso,
  bloccato,
  grande = false,
  campo,
}: {
  bozza: string;
  onBozza: (testo: string | ((prima: string) => string)) => void;
  onInvia: () => void;
  onFerma: () => void;
  inCorso: boolean;
  /** Quota finita: si può solo leggere. */
  bloccato: boolean;
  /** Schermata iniziale: campo più alto, pulsanti sotto il testo. */
  grande?: boolean;
  campo?: Ref<HTMLTextAreaElement>;
}) {
  const interno = useRef<HTMLTextAreaElement | null>(null);
  const pronta = bozza.trim().length >= LUNGHEZZA_MINIMA_DOMANDA;

  // Il campo cresce con il testo, fino all'altezza massima.
  useLayoutEffect(() => {
    const el = interno.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, ALTEZZA_MASSIMA)}px`;
    el.style.overflowY = el.scrollHeight > ALTEZZA_MASSIMA ? "auto" : "hidden";
  }, [bozza, grande]);

  function alloInvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!inCorso && pronta) onInvia();
  }

  function tasti(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === "Enter" && !evento.shiftKey && !evento.nativeEvent.isComposing) {
      evento.preventDefault();
      if (!inCorso && pronta) onInvia();
    }
  }

  const collega = (el: HTMLTextAreaElement | null) => {
    interno.current = el;
    if (typeof campo === "function") campo(el);
    else if (campo) campo.current = el;
  };

  const pulsanti = (
    <div className="flex shrink-0 items-center gap-1">
      <PulsanteDettatura
        compatto
        onTesto={(dettato) => onBozza((b) => aggiungiDettato(b, dettato, LUNGHEZZA_MASSIMA_DOMANDA))}
        disabilitato={bloccato}
      />
      {inCorso ? (
        <button
          type="button"
          onClick={onFerma}
          aria-label="Ferma la risposta"
          title="Ferma la risposta"
          className="inline-flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-85"
        >
          <IconaStop />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!pronta || bloccato}
          aria-label="Manda la domanda"
          title="Manda (Invio)"
          className="inline-flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-border disabled:text-muted disabled:hover:opacity-100"
        >
          <IconaFreccia />
        </button>
      )}
    </div>
  );

  return (
    <form onSubmit={alloInvio} className="w-full">
      <div
        className={`rounded-[1.75rem] border border-border bg-card shadow-sm transition-colors focus-within:border-brand/60 focus-within:shadow-md ${
          grande ? "px-4 pb-2.5 pt-3" : "flex items-end gap-1 py-1.5 pl-4 pr-1.5"
        }`}
      >
        <label htmlFor="domanda" className="sr-only">
          La tua domanda
        </label>
        <textarea
          id="domanda"
          ref={collega}
          name="domanda"
          rows={grande ? 2 : 1}
          maxLength={LUNGHEZZA_MASSIMA_DOMANDA}
          value={bozza}
          onChange={(e) => onBozza(e.target.value)}
          onKeyDown={tasti}
          disabled={bloccato}
          aria-describedby="nota-chat"
          enterKeyHint="send"
          placeholder={bloccato ? "Hai usato le domande di questo mese" : "Chiedi a Bleo…"}
          className={`block w-full resize-none bg-transparent leading-6 placeholder:text-muted focus-visible:outline-none disabled:cursor-not-allowed ${
            grande ? "min-h-14 px-1 py-1 text-base sm:text-lg" : "min-h-10 flex-1 py-2 text-base"
          }`}
        />
        {grande ? <div className="mt-1 flex justify-end">{pulsanti}</div> : pulsanti}
      </div>
    </form>
  );
}
