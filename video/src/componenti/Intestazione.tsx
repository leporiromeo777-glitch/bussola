import { interpolate, useCurrentFrame } from "remotion";
import type { TempoScena } from "../tempi";
import { COLORI, GRIGLIA, TESTO } from "../stile";
import { Marchio } from "./Marchio";

/** In alto: il marchio a sinistra, a destra una barretta per scena che si riempie. */
export function Intestazione({ scene, numero }: { scene: readonly TempoScena[]; numero: number }) {
  const frame = useCurrentFrame();
  const entrata = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: GRIGLIA.margine,
        right: GRIGLIA.margine,
        top: 40,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: entrata,
        transform: `translateY(${(1 - entrata) * -12}px)`,
      }}
    >
      <Marchio altezza={46} />
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: TESTO, fontWeight: 600, fontSize: 22, color: COLORI.tenue }}>Lezione {numero}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {scene.map((s) => {
            const pieno = interpolate(frame, [s.inizio, s.inizio + s.durata], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={s.inizio}
                style={{ width: 30, height: 8, borderRadius: 4, backgroundColor: COLORI.bordo, overflow: "hidden" }}
              >
                <div style={{ width: `${pieno * 100}%`, height: "100%", backgroundColor: COLORI.brand }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
