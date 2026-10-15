"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render(contenitore: HTMLElement, opzioni: { sitekey: string; language?: string; action?: string }): string;
  remove(idWidget: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

/**
 * Verifica anti-robot di Cloudflare Turnstile. Dentro un <form> aggiunge il
 * campo nascosto "cf-turnstile-response" con il token da passare al server.
 * Si ridisegna a ogni montaggio, così dopo un errore il token è nuovo
 * (ogni token vale una volta sola).
 */
export function CampoTurnstile({ chiaveSito, azione }: { chiaveSito: string; azione?: string }) {
  const contenitore = useRef<HTMLDivElement>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const elemento = contenitore.current;
    if (!pronto || !elemento || !window.turnstile) return;
    const id = window.turnstile.render(elemento, { sitekey: chiaveSito, language: "it", action: azione });
    return () => window.turnstile?.remove(id);
  }, [pronto, chiaveSito, azione]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setPronto(true)}
      />
      <div ref={contenitore} className="min-h-[65px]" />
    </>
  );
}
