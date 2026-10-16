import { Img, staticFile } from "remotion";
import { COLORI, TITOLI } from "../stile";

/** Il marchio: la bussolina e la scritta Bleo. */
export function Marchio({ altezza = 44 }: { altezza?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: altezza * 0.28 }}>
      <Img src={staticFile("mascotte/bussolina.webp")} style={{ height: altezza * 1.1, width: "auto" }} />
      <span
        style={{
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: altezza * 0.82,
          letterSpacing: "-0.02em",
          color: COLORI.brand,
          lineHeight: 1,
        }}
      >
        Bleo
      </span>
    </div>
  );
}
