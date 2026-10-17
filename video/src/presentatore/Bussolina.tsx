import type { CSSProperties, ReactNode } from "react";
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORI, TITOLI } from "../stile";
import { DIMENSIONI_BUSSOLINA, type Piano, type Posa } from "./coreografia";
import PEZZI from "./pezzi-bussolina.json";

/**
 * La bussolina, l'aiutante di Bleo, come un burattino di carta: i pezzi
 * tagliati da scripts/taglia-bussolina.py (in public/bussolina/), uno sopra
 * l'altro, ognuno che gira attorno al suo perno. Braccia, gambe e ago stanno
 * dietro la cassa, così la radice non si vede mai. Occhi e bocca cambiano
 * (sbattono, si sgranano, «oh», bocca aperta, occhi felici ^ ^).
 */
const [LATO_X, LATO_Y] = PEZZI.lato;
const COLORE_SCURO = "#1d1310";
const COLORE_LINGUA = "#e98b8b";

/** transform-origin di un perno, in percentuale dell'immagine. */
function origine([x, y]: readonly number[]): string {
  return `${(x / LATO_X) * 100}% ${(y / LATO_Y) * 100}%`;
}

function Pezzo({ nome, stile, children }: { nome: string; stile?: CSSProperties; children?: ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, ...stile }}>
      <Img src={staticFile(`bussolina/${nome}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {children}
    </div>
  );
}

export function Bussolina({ posa, piano }: { posa: Posa; piano: Piano }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { altezza, larghezza } = DIMENSIONI_BUSSOLINA;
  const k = altezza / LATO_Y;
  const cartellino = piano.cartellini.find((c) => frame >= c.inizio && frame < Math.min(c.fine, piano.fine) + 6);
  const allerta = piano.allerte.find((a) => frame >= a.inizio && frame < a.fine);
  const gamba = (lato: "sx" | "dx", angolo: number): CSSProperties => ({
    transformOrigin: origine(PEZZI[`gamba-${lato}`].perno),
    transform: `rotate(${angolo}deg) scaleY(${posa.gambe})`,
  });
  const occhio = (lato: "sx" | "dx"): CSSProperties => ({
    transformOrigin: origine(PEZZI[`occhio-${lato}`].centro),
    transform: `translateX(${posa.sguardo * k}px) scaleY(${Math.max(0.06, posa.occhi)}) scaleX(${posa.occhi > 1 ? 1 + (posa.occhi - 1) * 0.6 : 1})`,
    opacity: posa.felice ? 0 : 1,
  });
  const manoDx = PEZZI["braccio-dx"].riquadro;
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
      {/* Dietro la cassa: gambe, braccia e ago. */}
      <Pezzo nome="gamba-sx" stile={gamba("sx", posa.gambaSx)} />
      <Pezzo nome="gamba-dx" stile={gamba("dx", posa.gambaDx)} />
      <div
        style={{ position: "absolute", inset: 0, transformOrigin: origine(PEZZI.corpo.centro), transform: `rotate(${posa.spallaSx}deg)` }}
      >
        <Pezzo
          nome="braccio-sx"
          stile={{ transformOrigin: origine(PEZZI["braccio-sx"].perno), transform: `rotate(${posa.braccioSx}deg)` }}
        />
      </div>
      <Pezzo
        nome="braccio-dx"
        stile={{ transformOrigin: origine(PEZZI["braccio-dx"].perno), transform: `rotate(${posa.braccioDx}deg)` }}
      >
        {cartellino ? (
          <Cartellino
            testo={cartellino.testo}
            su={spring({ frame: frame - cartellino.inizio, fps, config: { damping: 10, stiffness: 160 } })}
            giu={frame >= cartellino.fine ? (frame - cartellino.fine) / 6 : 0}
            mano={{ x: (manoDx[2] - 26) * k, y: (manoDx[1] + 8) * k }}
          />
        ) : null}
      </Pezzo>
      <Pezzo nome="ago" stile={{ transformOrigin: origine(PEZZI.ago.perno), transform: `rotate(${posa.ago}deg)` }} />
      {/* La cassa con il quadrante, poi occhi e bocca. */}
      <Pezzo nome="corpo" />
      <Pezzo nome="occhio-sx" stile={occhio("sx")} />
      <Pezzo nome="occhio-dx" stile={occhio("dx")} />
      <Pezzo nome="bocca" stile={{ opacity: posa.bocca === "sorriso" ? 1 : 0 }} />
      <Viso posa={posa} />
      {allerta ? <Fumetto locale={frame - allerta.inizio} durata={allerta.fine - allerta.inizio} /> : null}
    </div>
  );
}

/** Occhi felici (^ ^) e le bocche aperte, disegnati sopra il quadrante. */
function Viso({ posa }: { posa: Posa }) {
  const [bx, by] = PEZZI.bocca.centro;
  const [bl] = PEZZI.bocca.raggi;
  const largo = bl - 7; // mezza larghezza del sorriso
  return (
    <svg viewBox={`0 0 ${LATO_X} ${LATO_Y}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      {posa.felice
        ? (["occhio-sx", "occhio-dx"] as const).map((nome) => {
            const [cx, cy] = PEZZI[nome].centro;
            return (
              <path
                key={nome}
                d={`M ${cx - 24} ${cy + 8} Q ${cx} ${cy - 26} ${cx + 24} ${cy + 8}`}
                fill="none"
                stroke={COLORE_SCURO}
                strokeWidth={10}
                strokeLinecap="round"
              />
            );
          })
        : null}
      {posa.bocca === "oh" ? (
        <g>
          <ellipse cx={bx} cy={by + 6} rx={19} ry={24} fill={COLORE_SCURO} />
          <ellipse cx={bx} cy={by + 20} rx={11} ry={7} fill={COLORE_LINGUA} />
        </g>
      ) : null}
      {posa.bocca === "aperta" ? (
        <g>
          <path
            d={`M ${bx - largo} ${by - 9} Q ${bx} ${by - 4} ${bx + largo} ${by - 9} Q ${bx + largo - 2} ${by + 22} ${bx} ${by + 24} Q ${bx - largo + 2} ${by + 22} ${bx - largo} ${by - 9} Z`}
            fill={COLORE_SCURO}
            strokeLinejoin="round"
          />
          <ellipse cx={bx} cy={by + 15} rx={largo * 0.5} ry={7} fill={COLORE_LINGUA} />
        </g>
      ) : null}
    </svg>
  );
}

/** Il cartellino con il numero, su un bastoncino tenuto dalla mano destra. */
function Cartellino({ testo, su, giu, mano }: { testo: string; su: number; giu: number; mano: { x: number; y: number } }) {
  const lato = 86;
  const bastone = 34;
  const scala = Math.max(0, Math.min(su, 1.2) * (1 - Math.min(1, giu)));
  return (
    <div
      style={{
        position: "absolute",
        left: mano.x - lato / 2,
        top: mano.y - bastone - lato,
        width: lato,
        height: lato + bastone,
        transform: `scale(${scala})`,
        transformOrigin: "50% 100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: lato / 2 - 3,
          top: lato - 4,
          width: 6,
          height: bastone + 8,
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
