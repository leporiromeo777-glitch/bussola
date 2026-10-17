import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORI, TESTO, TITOLI } from "../stile";
import { Marchio } from "./Marchio";
import { Sfondo } from "./Sfondo";

/**
 * Scheda finale: Bleo che festeggia e il titolo del prossimo passo. Con
 * `salta` (stile «presentatore») Bleo e la bussolina fanno dei saltelli.
 */
export function Fine({ prossimoPasso, salta = false }: { prossimoPasso?: string; salta?: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dissolvenza = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const bleo = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 120 } });
  const saltello = salta ? saltelli(frame - 12) : { y: 0, sx: 1, sy: 1 };
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
            transform: salta
              ? `translateY(${(1 - bleo) * 60 + saltello.y}px) scale(${(0.8 + 0.2 * bleo) * saltello.sx}, ${(0.8 + 0.2 * bleo) * saltello.sy})`
              : `translateY(${(1 - bleo) * 60}px) scale(${0.8 + 0.2 * bleo})`,
            transformOrigin: salta ? "center bottom" : undefined,
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
                  letterSpacing: "-0.02em",
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

/** Saltelli di gioia: su e giù ogni 16 fotogrammi, schiacciati quando toccano terra. */
function saltelli(t: number): { y: number; sx: number; sy: number } {
  if (t < 0) return { y: 0, sx: 1, sy: 1 };
  const periodo = 16;
  const u = (t % periodo) / periodo;
  const altezza = 34 * Math.exp(-t / 70);
  const y = -Math.sin(Math.PI * u) * altezza;
  // Vicino a terra (inizio e fine del salto) si schiaccia, in aria si allunga.
  const terra = Math.max(0, 1 - Math.min(u, 1 - u) * 6);
  const schiaccia = (terra * 0.08 - Math.sin(Math.PI * u) * 0.04) * (altezza / 34);
  return { y, sx: 1 + schiaccia, sy: 1 - schiaccia };
}
