import { Loop, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Durate } from "../lezioni/tipi";
import { CLIP_PRESENTATORE } from "./clip";
import { PRESENTATORE } from "./griglia";

/**
 * Bleo in primo piano a sinistra, senza scheda, sullo sfondo del marchio:
 * all'inizio saluta (una volta), poi indica a destra (in loop avanti e
 * indietro). Il video ha lo sfondo trasparente (VP9 con alfa), per questo
 * `transparent`. Un'ombra morbida lo stacca dal crema e nasconde il leggero
 * bordo scuro del ritaglio.
 */
export function BleoPresentatore({ clip }: { clip: NonNullable<Durate["presentatore"]> }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const saluto = Math.round((clip.saluto / clip.fps) * fps);
  const indica = Math.round((clip.indica / clip.fps) * fps);
  const entrata = spring({ frame, fps, config: { damping: 15, stiffness: 110 } });
  // Un respiro lentissimo, dal basso: non sembra mai incollato.
  const respiro = 1 + Math.sin(frame / 40) * 0.005;
  const { x, y, lato } = PRESENTATORE.bleo;
  const video = { width: "100%", height: "100%" } as const;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: lato,
        height: lato,
        opacity: Math.min(1, entrata * 1.4),
        transform: `translateY(${(1 - entrata) * 90}px) scale(${respiro})`,
        transformOrigin: "50% 100%",
        filter: "drop-shadow(0 18px 26px rgba(15, 94, 107, 0.22)) drop-shadow(0 1px 2px rgba(28, 31, 36, 0.12))",
      }}
    >
      <Sequence durationInFrames={saluto} name="Bleo saluta">
        <OffthreadVideo src={staticFile(`${CLIP_PRESENTATORE.cartella}/${CLIP_PRESENTATORE.saluto}`)} muted transparent style={video} />
      </Sequence>
      <Sequence from={saluto} name="Bleo indica">
        <Loop durationInFrames={indica}>
          <OffthreadVideo src={staticFile(`${CLIP_PRESENTATORE.cartella}/${CLIP_PRESENTATORE.indica}`)} muted transparent style={video} />
        </Loop>
      </Sequence>
    </div>
  );
}
