import { ImageResponse } from "next/og";
import { sito } from "@/lib/sito";

export const alt = `${sito.nome}: dall'idea alla ditta individuale aperta e alla prima fattura, passo per passo`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colori di globals.css (tema chiaro): ImageResponse non legge le variabili CSS.
const COLORI = {
  sfondo: "#fbfaf7",
  testo: "#1c1f24",
  attenuato: "#5d6470",
  brand: "#0f5e6b",
  brandTenue: "#e3f0f1",
  accento: "#d9822b",
  bordo: "#e4e1da",
};

export default function ImmagineOpenGraph() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: COLORI.sfondo,
          color: COLORI.testo,
          borderBottom: `16px solid ${COLORI.brand}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill={COLORI.sfondo} stroke={COLORI.brand} strokeWidth="3" />
            <path d="M16 5.5 19.6 16h-7.2Z" fill={COLORI.accento} />
            <path d="M16 26.5 12.4 16h7.2Z" fill={COLORI.brand} />
            <circle cx="16" cy="16" r="1.8" fill={COLORI.sfondo} />
          </svg>
          <span style={{ fontSize: 44, fontWeight: 600, color: COLORI.brand }}>{sito.nome}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 68, lineHeight: 1.1, fontWeight: 600, letterSpacing: "-0.02em", maxWidth: 1000 }}>
            Dall&apos;idea alla ditta individuale aperta e alla prima fattura.
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: COLORI.attenuato }}>
            Percorso personale, risposte con la fonte ufficiale, documenti pronti.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              display: "flex",
              padding: "10px 22px",
              borderRadius: 999,
              background: COLORI.brandTenue,
              color: COLORI.brand,
              fontSize: 26,
            }}
          >
            Lista d&apos;attesa aperta
          </span>
          <span style={{ fontSize: 26, color: COLORI.attenuato }}>Ticino e Grigioni italiano</span>
        </div>
      </div>
    ),
    size,
  );
}
