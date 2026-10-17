import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORI, TITOLI } from "../stile";
import { DIMENSIONI_BUSSOLINA, type Piano, type Posa } from "./coreografia";

const IMMAGINE = "mascotte/bussolina.webp";
/**
 * Nell'immagine (540×720) l'ago occupa la parte sopra il 24,4% dell'altezza;
 * gira attorno alla sua base, al 43% della larghezza.
 */
const TAGLIO_AGO = 24.4;
const PERNO_AGO = "43% 24.7%";
/** La mano alzata (a destra nell'immagine). */
const MANO = { x: 0.89, y: 0.5 };

/**
 * La bussolina, l'aiutante di Bleo, nella posa del fotogramma. L'ago è un
 * pezzo a parte dietro la cassa, così può girare (e sparisce dietro quando
 * punta in basso). Con il cartellino («3») o il fumetto «!» quando servono.
 */
export function Bussolina({ posa, piano }: { posa: Posa; piano: Piano }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { altezza, larghezza } = DIMENSIONI_BUSSOLINA;
  const cartellino = piano.cartellini.find((c) => frame >= c.inizio && frame < Math.min(c.fine, piano.fine) + 6);
  const allerta = piano.allerte.find((a) => frame >= a.inizio && frame < a.fine);
  const immagine = { position: "absolute", left: 0, top: 0, width: larghezza, height: altezza } as const;
  return (
    <div
      style={{
        position: "absolute",
        left: posa.x - larghezza / 2,
        top: posa.y - altezza,
        width: larghezza,
        height: altezza,
        transform: `rotate(${posa.rotazione}deg) scale(${posa.sx * posa.scala}, ${posa.sy * posa.scala})`,
        transformOrigin: "50% 100%",
        filter: "drop-shadow(0 10px 12px rgba(15, 94, 107, 0.28))",
      }}
    >
      <Img
        src={staticFile(IMMAGINE)}
        style={{
          ...immagine,
          clipPath: `inset(0 0 ${100 - TAGLIO_AGO}% 0)`,
          transform: `rotate(${posa.ago}deg)`,
          transformOrigin: PERNO_AGO,
        }}
      />
      <Img src={staticFile(IMMAGINE)} style={{ ...immagine, clipPath: `inset(${TAGLIO_AGO}% 0 0 0)` }} />
      {cartellino ? (
        <Cartellino
          testo={cartellino.testo}
          su={spring({ frame: frame - cartellino.inizio, fps, config: { damping: 10, stiffness: 160 } })}
          giu={frame >= cartellino.fine ? (frame - cartellino.fine) / 6 : 0}
          frame={frame}
          mano={{ x: larghezza * MANO.x, y: altezza * MANO.y }}
        />
      ) : null}
      {allerta ? <Fumetto locale={frame - allerta.inizio} durata={allerta.fine - allerta.inizio} /> : null}
    </div>
  );
}

/** Il cartellino con il numero, alzato con la mano su un bastoncino. */
function Cartellino({
  testo,
  su,
  giu,
  frame,
  mano,
}: {
  testo: string;
  su: number;
  giu: number;
  frame: number;
  mano: { x: number; y: number };
}) {
  const lato = 86;
  const bastone = 38;
  const scala = Math.max(0, Math.min(su, 1.2) * (1 - Math.min(1, giu)));
  return (
    <div
      style={{
        position: "absolute",
        left: mano.x - lato / 2,
        top: mano.y - bastone - lato,
        width: lato,
        height: lato + bastone,
        transform: `scale(${scala}) rotate(${Math.sin(frame / 7) * 6}deg)`,
        transformOrigin: "50% 100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: lato / 2 - 3,
          top: lato - 4,
          width: 6,
          height: bastone + 4,
          borderRadius: 3,
          backgroundColor: "#8a5a2b",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          height: lato,
          borderRadius: lato / 2,
          backgroundColor: COLORI.brand,
          border: `4px solid ${COLORI.card}`,
          boxSizing: "border-box",
          boxShadow: "0 8px 18px -6px rgba(15, 94, 107, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 48,
          color: COLORI.card,
          lineHeight: 1,
        }}
      >
        {testo}
      </div>
    </div>
  );
}

/** Il fumetto «!» sopra la testa, quando arriva l'avviso. */
function Fumetto({ locale, durata }: { locale: number; durata: number }) {
  const { fps } = useVideoConfig();
  const su = spring({ frame: locale, fps, config: { damping: 9, stiffness: 180 } });
  const via = Math.min(1, Math.max(0, (locale - (durata - 8)) / 8));
  const lato = 76;
  return (
    <div
      style={{
        position: "absolute",
        left: -lato * 0.55,
        top: -lato * 0.35,
        width: lato,
        height: lato,
        transform: `scale(${Math.max(0, su * (1 - via))}) rotate(${Math.sin(locale / 3) * 8 * Math.max(0, 1 - locale / 30)}deg)`,
        transformOrigin: "80% 100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 4,
          bottom: -7,
          width: 22,
          height: 22,
          backgroundColor: COLORI.accento,
          transform: "rotate(45deg)",
          borderRadius: 3,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: lato / 2,
          backgroundColor: COLORI.accento,
          border: `4px solid ${COLORI.card}`,
          boxSizing: "border-box",
          boxShadow: "0 8px 18px -6px rgba(156, 92, 28, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 46,
          color: COLORI.card,
          lineHeight: 1,
        }}
      >
        !
      </div>
    </div>
  );
}
