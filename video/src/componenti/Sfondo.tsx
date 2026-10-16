import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORI } from "../stile";

/** Crema del sito con due macchie morbide che si muovono piano. */
export function Sfondo() {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const dx = Math.sin(t / 3) * 18;
  const dy = Math.cos(t / 4) * 14;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORI.sfondo, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 980,
          height: 980,
          left: -170 + dx,
          top: -120 + dy,
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 50%, ${COLORI.brandTenue} 0%, rgba(227, 240, 241, 0.75) 45%, rgba(227, 240, 241, 0) 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 640,
          height: 640,
          right: -220 - dx,
          bottom: -260 + dy,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, rgba(156, 92, 28, 0.10) 0%, rgba(156, 92, 28, 0) 68%)",
        }}
      />
    </AbsoluteFill>
  );
}
