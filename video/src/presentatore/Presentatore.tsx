import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { gruppiSchede, Scheda } from "../componenti/Schede";
import type { Durate, Lezione, Schermo } from "../lezioni/tipi";
import type { Tempi } from "../tempi";
import { BleoPresentatore } from "./BleoPresentatore";
import { Bussolina } from "./Bussolina";
import { altoScheda, creaPiano, fondoScheda, posa, spinta, srotolato, TEMPI_SCHEDE, type Misura } from "./coreografia";
import { PRESENTATORE } from "./griglia";
import { Scintille } from "./Scintille";

const USCITA = 8;
const MOLLA = { damping: 14, stiffness: 110, mass: 0.9 };
const { colonna } = PRESENTATORE;

/**
 * Stile «presentatore»: Bleo in primo piano a sinistra che indica le schede a
 * destra; la bussolina le fa comparire (vedi coreografia.ts). Le schede sono
 * le stesse dello stile classico, appoggiate in basso alla linea della mano.
 */
export function Presentatore({ lezione, durate, tempi }: { lezione: Lezione; durate: Durate; tempi: Tempi }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!durate.presentatore) {
    throw new Error("Manca Bleo presentatore: metti il clip in video/sorgenti/presentatore/ e rilancia npm run prepara.");
  }
  const gruppi = gruppiSchede(lezione.scene, tempi.scene);
  const misure = useMisure();
  const piano = creaPiano(lezione.scene, tempi, gruppi, misure.valori);
  const adesso = frame < piano.fine ? posa(piano, frame) : null;

  return (
    <>
      <BleoPresentatore clip={durate.presentatore} />
      {/* Copie invisibili delle schede (nello stato finale del gruppo), per misurarle. */}
      <div ref={misure.rif} style={{ visibility: "hidden" }} aria-hidden>
        {gruppi.map((g) => {
          const ultima = g.scene.at(-1)!;
          return (
            <div
              key={g.chiave}
              data-gruppo={g.chiave}
              style={{ position: "absolute", left: colonna.x, top: 0, width: colonna.larghezza }}
            >
              <Scheda
                schermo={lezione.scene[ultima].schermo}
                locale={1000}
                comparse={g.scene.map((i) => ({ inizio: -1000, schermo: lezione.scene[i].schermo }))}
              />
            </div>
          );
        })}
      </div>
      {gruppi.map((g) => {
        if (frame < g.inizio || frame >= g.fine + USCITA) return null;
        const misura = misure.valori[g.chiave];
        const tipo = lezione.scene[g.scene[0]].schermo.tipo;
        const alto = altoScheda(misura, tipo);
        const altezza = fondoScheda(tipo) - alto;
        const locale = frame - g.inizio;
        const uscita = interpolate(frame, [g.fine, g.fine + USCITA], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // Nell'elenco ogni punto compare quando la bussolina tocca il suo numero.
        const comparse = g.scene.map((i) => ({
          inizio: tempi.scene[i].inizio + TEMPI_SCHEDE.puntoTocco - 4,
          schermo: lezione.scene[i].schermo,
        }));
        const attuale = g.scene.filter((i) => tempi.scene[i].inizio + TEMPI_SCHEDE.puntoTocco <= frame).at(-1) ?? g.scene[0];
        const schermo = lezione.scene[attuale].schermo;
        const entrata = entrataScheda(schermo, locale, fps, altezza);
        return (
          <div
            key={g.chiave}
            style={{ position: "absolute", left: colonna.x, top: alto, width: colonna.larghezza, height: altezza }}
          >
            <div
              style={{
                ...entrata.stile,
                opacity: (entrata.stile.opacity === undefined ? 1 : Number(entrata.stile.opacity)) * (1 - uscita),
                translate: `${-uscita * 40}px 0`,
              }}
            >
              <Scheda schermo={schermo} locale={locale - entrata.ritardo} comparse={comparse} />
            </div>
            {schermo.tipo === "titolo" ? <Rullo locale={locale} altezza={altezza} /> : null}
          </div>
        );
      })}
      <Scintille scintille={piano.scintille} />
      {adesso ? <Bussolina posa={adesso} piano={piano} /> : null}
    </>
  );
}

/** Come entra ogni scheda, e di quanto spostare le sue animazioni interne. */
function entrataScheda(
  schermo: Schermo,
  locale: number,
  fps: number,
  altezza: number,
): { stile: CSSProperties; ritardo: number } {
  switch (schermo.tipo) {
    case "titolo": {
      // Si srotola dall'alto, tirata giù dalla bussolina (l'ombra resta fuori dal ritaglio).
      const q = srotolato(locale);
      return {
        stile: { clipPath: `inset(-90px -90px ${(1 - q) * altezza - q * 100}px -90px)`, opacity: q > 0 ? 1 : 0 },
        ritardo: 6,
      };
    }
    case "elenco": {
      const e = spring({ frame: locale - TEMPI_SCHEDE.elencoEntra, fps, config: MOLLA });
      return {
        stile: {
          opacity: Math.min(e, 1),
          transform: `translateX(${(1 - e) * 70}px) scale(${0.92 + 0.08 * e})`,
          transformOrigin: "left center",
        },
        ritardo: 0,
      };
    }
    case "attenzione": {
      const e = spring({ frame: locale - TEMPI_SCHEDE.attenzioneEntra, fps, config: { damping: 12, stiffness: 130 } });
      return {
        stile: {
          opacity: Math.min(e * 1.5, 1),
          transform: `translateX(${(1 - e) * 160}px) rotate(${(1 - e) * 5}deg)`,
          transformOrigin: "left bottom",
        },
        ritardo: TEMPI_SCHEDE.attenzioneEntra - 4,
      };
    }
    case "punto": {
      // Lanciata dalla bussolina, in alto a sinistra: cresce da quell'angolo.
      const e = spring({ frame: locale - TEMPI_SCHEDE.puntoEntra, fps, config: { damping: 13, stiffness: 150 } });
      return {
        stile: {
          opacity: Math.min(e * 1.6, 1),
          transform: `translate(${(1 - e) * -70}px, ${(1 - e) * -50}px) scale(${0.3 + 0.7 * e})`,
          transformOrigin: "left top",
        },
        ritardo: TEMPI_SCHEDE.puntoEntra,
      };
    }
    case "fonte": {
      // Spinta da destra come un foglio, con la stessa curva della bussolina.
      const q = spinta(locale);
      return {
        stile: { transform: `translateX(${(1 - q) * 620}px) rotate(${(1 - q) * 3}deg)`, transformOrigin: "left bottom" },
        ritardo: TEMPI_SCHEDE.fonteSpinge,
      };
    }
  }
}

/** Il rullo della scheda del titolo: scende con la bussolina, poi sparisce. */
function Rullo({ locale, altezza }: { locale: number; altezza: number }) {
  const q = srotolato(locale);
  const comparsa = interpolate(locale, [TEMPI_SCHEDE.titoloTira - 3, TEMPI_SCHEDE.titoloTira], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fine = TEMPI_SCHEDE.titoloTira + TEMPI_SCHEDE.titoloDurata;
  const via = interpolate(locale, [fine, fine + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (comparsa === 0 || via === 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: -8,
        right: -8,
        top: q * altezza - 9,
        height: 18,
        borderRadius: 9,
        background: "linear-gradient(180deg, #3a95a1 0%, #0f5e6b 55%, #0b4954 100%)",
        boxShadow: "0 6px 14px -4px rgba(11, 73, 84, 0.55)",
        opacity: comparsa * (1 - via),
        transform: `scaleX(${1 - via * 0.3})`,
      }}
    />
  );
}

/**
 * Misura le copie invisibili delle schede a ogni fotogramma (dopo il disegno,
 * prima che il fotogramma venga fotografato) e le aggiorna solo se cambiano.
 */
function useMisure(): { rif: RefObject<HTMLDivElement | null>; valori: Record<string, Misura> } {
  const rif = useRef<HTMLDivElement>(null);
  const [valori, setValori] = useState<Record<string, Misura>>({});
  useLayoutEffect(() => {
    const radice = rif.current;
    if (!radice) return;
    const nuove: Record<string, Misura> = {};
    radice.querySelectorAll<HTMLElement>("[data-gruppo]").forEach((scheda) => {
      const punti = [...scheda.querySelectorAll<HTMLElement>("[data-punto]")].map((li) => {
        const numero = (li.firstElementChild as HTMLElement | null) ?? li;
        const { x, y } = posizioneIn(numero, scheda);
        return { x: x + numero.offsetWidth / 2, y: y + numero.offsetHeight / 2 };
      });
      nuove[scheda.dataset.gruppo!] = { altezza: scheda.offsetHeight, punti };
    });
    if (JSON.stringify(nuove) !== JSON.stringify(valori)) setValori(nuove);
  });
  return { rif, valori };
}

/** Posizione di un elemento dentro un antenato, senza contare le trasformazioni. */
function posizioneIn(elemento: HTMLElement, antenato: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let e: HTMLElement | null = elemento;
  while (e && e !== antenato) {
    x += e.offsetLeft;
    y += e.offsetTop;
    e = e.offsetParent as HTMLElement | null;
  }
  return { x, y };
}
