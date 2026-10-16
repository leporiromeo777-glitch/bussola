"use client";

import { useEffect, useRef, useState } from "react";

// Le parole tra *asterischi* si accendono con il colore del marchio.
const FRASI = [
  "Aprire un'attività a vent'anni non dovrebbe sembrare un *labirinto*.",
  "Le regole ci sono, ma sono sparse tra Confederazione, Cantone, AVS e assicurazioni.",
  "Bleo le mette in fila per te: *cosa fare*, *in che ordine*, con il *link ufficiale*.",
  "Così pensi alla tua idea, non alla burocrazia.",
];

const PAROLE = FRASI.map((frase) => {
  let dentro = false;
  return frase.split(" ").map((p) => {
    if (p.startsWith("*")) dentro = true;
    const evidenza = dentro;
    if (p.replace(/[.,:;]+$/, "").endsWith("*")) dentro = false;
    return { testo: p.replaceAll("*", ""), evidenza };
  });
});
const TOTALE = PAROLE.reduce((n, f) => n + f.length, 0);

/**
 * Il manifesto: le parole si accendono mentre scorri (come su tryholo.ai).
 * Le parole ancora spente restano grigie ma leggibili (contrasto AA), e con
 * «riduci movimento» o senza JavaScript sono tutte accese.
 */
export function Manifesto() {
  const contenitore = useRef<HTMLDivElement>(null);
  const [accese, setAccese] = useState(TOTALE);

  useEffect(() => {
    const el = contenitore.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let richiesta = 0;
    const aggiorna = () => {
      richiesta = 0;
      const r = el.getBoundingClientRect();
      const alto = window.innerHeight;
      // 0 quando il testo entra dal basso, 1 quando è a un terzo dello schermo.
      const avanzamento = Math.min(1, Math.max(0, (alto * 0.9 - r.top) / (r.height + alto * 0.25)));
      setAccese(Math.round(avanzamento * TOTALE));
    };
    const suScorrimento = () => {
      if (!richiesta) richiesta = requestAnimationFrame(aggiorna);
    };
    aggiorna();
    window.addEventListener("scroll", suScorrimento, { passive: true });
    window.addEventListener("resize", suScorrimento);
    return () => {
      window.removeEventListener("scroll", suScorrimento);
      window.removeEventListener("resize", suScorrimento);
      cancelAnimationFrame(richiesta);
    };
  }, []);

  let indice = 0;
  return (
    <section aria-label="Perché Bleo" className="py-20 sm:py-28">
      <div ref={contenitore} className="mx-auto max-w-3xl space-y-6 px-4">
        {PAROLE.map((frase, i) => (
          <p
            key={FRASI[i]}
            className="text-2xl font-extrabold leading-snug tracking-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-titoli)" }}
          >
            {frase.map((parola, j) => {
              const accesa = indice++ < accese;
              return (
                <span
                  key={j}
                  className={`transition-colors duration-300 motion-reduce:transition-none ${
                    !accesa ? "text-muted" : parola.evidenza ? "text-brand" : "text-foreground"
                  }`}
                >
                  {parola.testo}{" "}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    </section>
  );
}
