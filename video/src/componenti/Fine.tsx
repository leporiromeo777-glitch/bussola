import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORI, TESTO, TITOLI } from "../stile";
import { Marchio } from "./Marchio";
import { Sfondo } from "./Sfondo";

/** Scheda finale: Bleo che festeggia e il titolo del prossimo passo. */
export function Fine({ prossimoPasso }: { prossimoPasso?: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dissolvenza = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const bleo = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 120 } });
  const testo = spring({ frame: frame - 10, fps, config: { damping: 15, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ opacity: dissolvenza }}>
      <Sfondo />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          padding: "0 90px",
          textAlign: "center",
          fontFamily: TESTO,
        }}
      >
        <Img
          src={staticFile("mascotte/festa.webp")}
          style={{
            width: 400,
            height: "auto",
            transform: `translateY(${(1 - bleo) * 60}px) scale(${0.8 + 0.2 * bleo})`,
            opacity: Math.min(bleo, 1),
          }}
        />
        <div style={{ opacity: Math.min(testo, 1), transform: `translateY(${(1 - testo) * 30}px)`, marginTop: 28 }}>
          {prossimoPasso ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: 999,
                  backgroundColor: COLORI.accentoTenue,
                  color: COLORI.accento,
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                Prossimo passo
              </span>
              <h2
                style={{
                  margin: "22px 0 0",
                  fontFamily: TITOLI,
                  fontWeight: 800,
                  fontSize: 64,
                  lineHeight: 1.06,
                  letterSpacing: "-0.03em",
                  color: COLORI.testo,
                  textWrap: "balance",
                }}
              >
                {prossimoPasso}
              </h2>
            </>
          ) : (
            <h2 style={{ margin: 0, fontFamily: TITOLI, fontWeight: 800, fontSize: 64, color: COLORI.testo }}>
              Hai finito il corso!
            </h2>
          )}
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 56,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: Math.min(testo, 1),
        }}
      >
        <Marchio altezza={56} />
      </div>
    </AbsoluteFill>
  );
}
