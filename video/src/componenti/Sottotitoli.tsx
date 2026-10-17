import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { StileLezione } from "../lezioni/tipi";
import { PRESENTATORE } from "../presentatore/griglia";
import type { Battuta } from "../tempi";
import { COLORI, GRIGLIA, OMBRA_SCHEDA, TESTO } from "../stile";

/** Dove sta il riquadro e quanto è grande il testo, nei due stili. */
const FORMATO: Record<StileLezione, { riquadro: CSSProperties; corpo: number }> = {
  classico: {
    riquadro: {
      left: GRIGLIA.margine,
      right: GRIGLIA.margine,
      top: GRIGLIA.sottotitoli.alto,
      bottom: GRIGLIA.margine,
      padding: "30px 44px 24px",
    },
    corpo: 48,
  },
  // Una fascia più bassa, sopra la pancia di Bleo: non copre il viso, la mano né le schede.
  presentatore: {
    riquadro: {
      left: PRESENTATORE.sottotitoli.lato,
      right: PRESENTATORE.sottotitoli.lato,
      bottom: PRESENTATORE.sottotitoli.fondo,
      minHeight: PRESENTATORE.sottotitoli.altezza,
      boxSizing: "border-box",
      padding: "22px 36px 16px",
    },
    corpo: PRESENTATORE.sottotitoli.corpo,
  },
};

/** Sottotitoli grandi in basso, con l'etichetta «Bleo» e le barrette che si muovono mentre parla. */
export function Sottotitoli({
  battute,
  parla,
  fine,
  stile = "classico",
}: {
  battute: readonly Battuta[];
  parla: boolean;
  fine: number;
  stile?: StileLezione;
}) {
  const { riquadro, corpo } = FORMATO[stile];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const battuta = battute.find((b) => t >= b.inizio && t < b.fine);
  const comparsa = interpolate(frame, [6, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const uscita = interpolate(frame, [fine - 8, fine], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const testoVisibile = battuta
    ? interpolate(t, [battuta.inizio, battuta.inizio + 0.12], [0, 1], { extrapolateRight: "clamp" })
    : 0;
  return (
    <div
      style={{
        position: "absolute",
        ...riquadro,
        borderRadius: 40,
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        border: `1px solid ${COLORI.bordo}`,
        boxShadow: OMBRA_SCHEDA,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: comparsa * uscita,
        transform: `translateY(${(1 - comparsa) * 24}px)`,
      }}
    >
      <Parlante parla={parla} frame={frame} />
      <p
        style={{
          margin: 0,
          fontFamily: TESTO,
          fontWeight: 600,
          fontSize: corpo,
          lineHeight: 1.25,
          letterSpacing: "-0.01em",
          color: COLORI.testo,
          textAlign: "center",
          textWrap: "balance",
          opacity: testoVisibile,
          transform: `translateY(${(1 - testoVisibile) * 6}px)`,
        }}
      >
        {battuta?.testo}
      </p>
    </div>
  );
}

/** L'etichetta sul bordo: chi parla, con quattro barrette che seguono la voce. */
function Parlante({ parla, frame }: { parla: boolean; frame: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: -22,
        left: 40,
        height: 44,
        padding: "0 18px 0 16px",
        borderRadius: 22,
        backgroundColor: COLORI.brand,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 20px -8px rgba(15, 94, 107, 0.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, height: 22 }}>
        {[0, 1, 2, 3].map((i) => {
          const onda = (Math.sin(frame / 2.6 + i * 1.7) + Math.sin(frame / 4.1 + i * 2.9)) / 4 + 0.5;
          const altezza = parla ? 6 + onda * 16 : 6;
          return <div key={i} style={{ width: 5, height: altezza, borderRadius: 3, backgroundColor: COLORI.card }} />;
        })}
      </div>
      <span style={{ fontFamily: TESTO, fontWeight: 700, fontSize: 22, color: COLORI.card }}>Bleo</span>
    </div>
  );
}
