import { Loop, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORI, GRIGLIA } from "../stile";

/** Parte del video sorgente (960×960) da mostrare: Bleo e la bussolina, un po' più vicini. */
const RITAGLIO = { x: 70, y: 90, lato: 860, sorgente: 960 };

/**
 * Bleo che parla, nella sua scheda arrotondata con il bordo bianco: il pesca
 * del video diventa il colore della scheda. Il video va in loop (avanti e
 * indietro, vedi scripts/prepara.ts).
 */
export function ClipBleo({ src, durataLoop }: { src: string; durataLoop: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrata = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const { x, y, lato } = GRIGLIA.clip;
  const scala = lato / RITAGLIO.lato;
  // Un respiro lentissimo: la scheda non sembra mai ferma.
  const respiro = 1 + Math.sin(frame / 45) * 0.006;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: lato,
        height: lato,
        borderRadius: 64,
        overflow: "hidden",
        backgroundColor: COLORI.pesca,
        boxShadow: `0 0 0 10px ${COLORI.card}, 0 50px 90px -40px rgba(15, 94, 107, 0.45)`,
        opacity: entrata,
        transform: `scale(${(0.9 + entrata * 0.1) * respiro})`,
      }}
    >
      <Loop durationInFrames={durataLoop}>
        <OffthreadVideo
          src={staticFile(src)}
          muted
          style={{
            position: "absolute",
            width: RITAGLIO.sorgente * scala,
            height: RITAGLIO.sorgente * scala,
            left: -RITAGLIO.x * scala,
            top: -RITAGLIO.y * scala,
            maxWidth: "none",
          }}
        />
      </Loop>
      {/* Bordo interno morbido: il video si fonde con la scheda. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 64,
          boxShadow: `inset 0 0 40px 10px ${COLORI.pesca}`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
