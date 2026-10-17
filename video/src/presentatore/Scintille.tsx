import { useCurrentFrame } from "remotion";
import type { Scintilla } from "./coreografia";

/** Colori del marchio: verde acqua della bussola, rosso dell'ago, ocra dell'accento. */
const COLORI = ["#0f5e6b", "#b5401a", "#d29a35", "#2f8c99"];
const DURATA = 30;
const PEZZI = 12;

/** Stellina a quattro punte, centrata in 0,0 e grande 2×2. */
const STELLA = "M0,-1 C0.12,-0.12 0.12,-0.12 1,0 C0.12,0.12 0.12,0.12 0,1 C-0.12,0.12 -0.12,0.12 -1,0 C-0.12,-0.12 -0.12,-0.12 0,-1Z";

/** Piccole esplosioni di stelline e puntini quando la bussolina fa comparire qualcosa. */
export function Scintille({ scintille }: { scintille: readonly Scintilla[] }) {
  const frame = useCurrentFrame();
  const attive = scintille.filter((s) => frame >= s.inizio && frame < s.inizio + DURATA);
  if (attive.length === 0) return null;
  return (
    <svg width={1080} height={1080} viewBox="0 0 1080 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {attive.map((s) => {
        const t = (frame - s.inizio) / DURATA;
        const via = 1 - (1 - t) ** 3;
        return (
          <g key={`${s.x}-${s.y}-${s.inizio}`} transform={`translate(${s.x} ${s.y})`}>
            <circle
              r={s.raggio * 0.75 * via}
              fill="none"
              stroke="#2f8c99"
              strokeWidth={6 * (1 - t)}
              opacity={0.5 * (1 - t)}
            />
            {Array.from({ length: PEZZI }, (_, k) => {
              const angolo = (k / PEZZI) * Math.PI * 2 + 0.3;
              const distanza = s.raggio * (k % 2 === 0 ? 1 : 0.72) * via;
              const grandezza = Math.sin(Math.PI * Math.min(1, t * 1.3));
              const colore = COLORI[k % COLORI.length];
              const x = Math.cos(angolo) * distanza;
              const y = Math.sin(angolo) * distanza;
              return k % 2 === 0 ? (
                <path
                  key={k}
                  d={STELLA}
                  fill={colore}
                  transform={`translate(${x} ${y}) rotate(${t * 140}) scale(${16 * grandezza})`}
                  opacity={1 - t * t}
                />
              ) : (
                <circle key={k} cx={x} cy={y} r={7 * grandezza} fill={colore} opacity={1 - t * t} />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
