/**
 * I pezzi dei disegni della lavagna: figure piatte, tratti arrotondati, colori
 * del marchio. Sono gruppi SVG nelle coordinate della tela (1000 × 700).
 * Niente cifre: solo concetti (regola del progetto).
 */
import type { ReactNode } from "react";
import { interpolate, spring } from "remotion";
import { COLORI, TESTO, TITOLI } from "../stile";

export const TINTE = {
  tratto: COLORI.brand,
  tinta: COLORI.brandTenue,
  accento: COLORI.accento,
  crema: "#fbf1e6",
  carta: "#ffffff",
  pelle: "#f6e7d6",
  rischio: "#c0392b",
  rischioTenue: "#fbe4e1",
  oro: "#d29a35",
  ok: COLORI.successo,
} as const;

/** Da 0 a 1 fra due fotogrammi, con una curva morbida. */
export function tra(locale: number, da: number, a: number): number {
  const t = interpolate(locale, [da, a], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** Una molla che parte al fotogramma `da` (0 → 1, con un piccolo rimbalzo). */
export function molla(locale: number, da: number, fps: number, morbida = false): number {
  return spring({
    frame: locale - da,
    fps,
    config: morbida ? { damping: 16, stiffness: 90 } : { damping: 11, stiffness: 150 },
  });
}

/** Comparsa: scala dal centro (cx, cy) e opacità. */
export function Compare({
  v,
  cx,
  cy,
  children,
}: {
  v: number;
  cx: number;
  cy: number;
  children: ReactNode;
}) {
  if (v <= 0.001) return null;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${v}) translate(${-cx} ${-cy})`} opacity={Math.min(1, v * 1.4)}>
      {children}
    </g>
  );
}

export function Testo({
  x,
  y,
  children,
  corpo = 34,
  colore = COLORI.testo,
  peso = 700,
  titolo = false,
  ancora = "middle",
  opacita = 1,
}: {
  x: number;
  y: number;
  children: ReactNode;
  corpo?: number;
  colore?: string;
  peso?: number;
  titolo?: boolean;
  ancora?: "start" | "middle" | "end";
  opacita?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={titolo ? TITOLI : TESTO}
      fontWeight={peso}
      fontSize={corpo}
      fill={colore}
      textAnchor={ancora}
      dominantBaseline="middle"
      opacity={opacita}
      letterSpacing={titolo ? "-0.02em" : undefined}
    >
      {children}
    </text>
  );
}

/** Larghezza approssimata di un testo (per le pillole). */
function larghezzaTesto(testo: string, corpo: number): number {
  return testo.length * corpo * 0.56;
}

/** Un'etichetta in una pillola arrotondata. */
export function Pillola({
  x,
  y,
  testo,
  corpo = 32,
  fondo = TINTE.tinta,
  colore = TINTE.tratto,
  bordo,
}: {
  x: number;
  y: number;
  testo: string;
  corpo?: number;
  fondo?: string;
  colore?: string;
  bordo?: string;
}) {
  const w = larghezzaTesto(testo, corpo) + corpo * 1.3;
  const h = corpo * 1.8;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fondo} stroke={bordo} strokeWidth={bordo ? 4 : 0} />
      <Testo x={x} y={y + 1} corpo={corpo} colore={colore} titolo peso={800}>
        {testo}
      </Testo>
    </g>
  );
}

/**
 * Una persona stilizzata, con i piedi in (x, y). `passo` fa muovere le
 * gambe (radianti), `umore` cambia la bocca.
 */
export function Persona({
  x,
  y,
  s = 1,
  colore = TINTE.tratto,
  passo,
  umore = "felice",
  opacita = 1,
}: {
  x: number;
  y: number;
  s?: number;
  colore?: string;
  passo?: number;
  umore?: "felice" | "preoccupata";
  opacita?: number;
}) {
  const g = passo === undefined ? 0 : Math.sin(passo) * 16;
  const sobbalzo = passo === undefined ? 0 : Math.abs(Math.sin(passo)) * 4;
  return (
    <g transform={`translate(${x} ${y - sobbalzo}) scale(${s})`} opacity={opacita}>
      {/* gambe */}
      <line x1={-12} y1={-58} x2={-12 - g} y2={-4} stroke={colore} strokeWidth={16} strokeLinecap="round" />
      <line x1={12} y1={-58} x2={12 + g} y2={-4} stroke={colore} strokeWidth={16} strokeLinecap="round" />
      {/* corpo e braccia */}
      <line x1={-30} y1={-112} x2={-38 + g * 0.6} y2={-66} stroke={colore} strokeWidth={14} strokeLinecap="round" />
      <line x1={30} y1={-112} x2={38 - g * 0.6} y2={-66} stroke={colore} strokeWidth={14} strokeLinecap="round" />
      <rect x={-32} y={-126} width={64} height={78} rx={28} fill={colore} />
      {/* testa */}
      <circle cx={0} cy={-152} r={28} fill={TINTE.pelle} stroke={colore} strokeWidth={6} />
      <circle cx={-9} cy={-155} r={3.6} fill={COLORI.testo} />
      <circle cx={9} cy={-155} r={3.6} fill={COLORI.testo} />
      {umore === "felice" ? (
        <path d="M -9 -143 Q 0 -134 9 -143" fill="none" stroke={COLORI.testo} strokeWidth={3.5} strokeLinecap="round" />
      ) : (
        <path d="M -8 -138 Q 0 -145 8 -138" fill="none" stroke={COLORI.testo} strokeWidth={3.5} strokeLinecap="round" />
      )}
    </g>
  );
}

/** Un negozietto con la tenda a strisce e la targa (bottom-center in x, y). */
export function Negozio({
  x,
  y,
  s = 1,
  targa,
  targaScala = 1,
}: {
  x: number;
  y: number;
  s?: number;
  targa?: string;
  targaScala?: number;
}) {
  const strisce = 6;
  const w = 220;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2} y={-150} width={w} height={150} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      {/* tenda */}
      {Array.from({ length: strisce }, (_, i) => (
        <path
          key={i}
          d={`M ${-w / 2 - 10 + (i * (w + 20)) / strisce} -150 h ${(w + 20) / strisce} v 26 a ${(w + 20) / strisce / 2} ${(w + 20) / strisce / 2.6} 0 0 1 ${-(w + 20) / strisce} 0 Z`}
          fill={i % 2 === 0 ? TINTE.tratto : TINTE.crema}
          stroke={TINTE.tratto}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ))}
      {/* porta e vetrina */}
      <rect x={18} y={-96} width={52} height={96} rx={8} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} />
      <circle cx={30} cy={-46} r={4} fill={TINTE.tratto} />
      <rect x={-86} y={-96} width={84} height={56} rx={8} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} />
      {/* targa sopra la tenda */}
      {targa ? (
        <g transform={`translate(0 -186) scale(${targaScala})`}>
          <rect x={-w / 2 + 6} y={-26} width={w - 12} height={52} rx={12} fill={TINTE.accento} />
          <Testo x={0} y={1} corpo={30} colore={TINTE.carta} titolo peso={800}>
            {targa}
          </Testo>
        </g>
      ) : null}
    </g>
  );
}

/** Una freccia che si disegna (p da 0 a 1); la punta compare alla fine. */
export function Freccia({
  d,
  p,
  colore = TINTE.tratto,
  spessore = 8,
  tratteggio = false,
  punta = true,
}: {
  d: string;
  p: number;
  colore?: string;
  spessore?: number;
  tratteggio?: boolean;
  /** Senza punta è una linea che si disegna (per esempio una sottolineatura). */
  punta?: boolean;
}) {
  if (p <= 0) return null;
  const id = `punta-${colore.replace("#", "")}`;
  return (
    <g>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX={6} refY={5} markerWidth={4} markerHeight={4} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={colore} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={colore}
        strokeWidth={spessore}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={tratteggio ? undefined : "1 1"}
        strokeDashoffset={tratteggio ? undefined : 1 - p}
        opacity={tratteggio ? p : 1}
        markerEnd={punta && p > 0.96 ? `url(#${id})` : undefined}
      />
    </g>
  );
}

/** Un cerchio con la spunta che si disegna. */
export function Spunta({ cx, cy, r, p, colore = TINTE.ok }: { cx: number; cy: number; r: number; p: number; colore?: string }) {
  if (p <= 0) return null;
  const cerchio = Math.min(1, p * 1.6);
  const segno = Math.max(0, (p - 0.4) / 0.6);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * (0.6 + 0.4 * cerchio)} fill={colore} opacity={cerchio} />
      <path
        d={`M ${cx - r * 0.42} ${cy + r * 0.02} L ${cx - r * 0.1} ${cy + r * 0.34} L ${cx + r * 0.46} ${cy - r * 0.3}`}
        fill="none"
        stroke={TINTE.carta}
        strokeWidth={r * 0.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - segno}
      />
    </g>
  );
}

/** Una moneta senza cifre. */
export function Moneta({ cx, cy, r = 30 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={TINTE.accento} strokeWidth={3} opacity={0.6} />
      <path d={`M ${cx - r * 0.5} ${cy - r * 0.55} a ${r} ${r} 0 0 1 ${r * 0.5} -${r * 0.2}`} stroke={TINTE.carta} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
    </g>
  );
}

/** Un foglio con l'angolo piegato; il contenuto va dentro. */
export function Foglio({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children?: ReactNode }) {
  const piega = 44;
  return (
    <g>
      <path
        d={`M ${x} ${y + 16} q 0 -16 16 -16 H ${x + w - piega} L ${x + w} ${y + piega} V ${y + h - 16} q 0 16 -16 16 H ${x + 16} q -16 0 -16 -16 Z`}
        fill={TINTE.carta}
        stroke={TINTE.tratto}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path d={`M ${x + w - piega} ${y} V ${y + piega} H ${x + w}`} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" />
      {children}
    </g>
  );
}

/** Righe di testo finto (per i fogli). */
export function Righe({ x, y, w, n, passo = 26 }: { x: number; y: number; w: number; n: number; passo?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={x} y1={y + i * passo} x2={x + w * (i % 3 === 2 ? 0.6 : 1)} y2={y + i * passo} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
      ))}
    </g>
  );
}

export function Casa({ x, y, s = 1, colore = TINTE.tratto }: { x: number; y: number; s?: number; colore?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -52 -10 V -62 L 0 -104 L 52 -62 V -10 Z" fill={TINTE.carta} stroke={colore} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -66 -56 L 0 -112 L 66 -56" fill="none" stroke={colore} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={-14} y={-48} width={28} height={38} rx={5} fill={TINTE.tinta} stroke={colore} strokeWidth={5} />
      <line x1={-62} y1={-10} x2={62} y2={-10} stroke={colore} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
}

export function Auto({ x, y, s = 1, colore = TINTE.tratto }: { x: number; y: number; s?: number; colore?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -62 -26 V -46 Q -62 -54 -54 -56 L -34 -60 L -20 -84 Q -16 -90 -8 -90 H 28 Q 36 -90 40 -84 L 52 -60 Q 64 -58 64 -46 V -26 Z" fill={TINTE.carta} stroke={colore} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -24 -60 L -12 -80 H 10 V -60 Z M 18 -60 V -80 H 30 L 40 -60 Z" fill={TINTE.tinta} stroke={colore} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={-34} cy={-24} r={14} fill={TINTE.carta} stroke={colore} strokeWidth={6} />
      <circle cx={36} cy={-24} r={14} fill={TINTE.carta} stroke={colore} strokeWidth={6} />
    </g>
  );
}

/** Il salvadanaio: i risparmi. */
export function Salvadanaio({ x, y, s = 1, colore = TINTE.tratto }: { x: number; y: number; s?: number; colore?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-40} y={-24} width={14} height={20} rx={6} fill={colore} />
      <rect x={22} y={-24} width={14} height={20} rx={6} fill={colore} />
      <ellipse cx={0} cy={-52} rx={60} ry={42} fill={TINTE.carta} stroke={colore} strokeWidth={6} />
      <path d="M -26 -92 L -18 -112 L -6 -94" fill={TINTE.carta} stroke={colore} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={58} cy={-52} rx={12} ry={15} fill={TINTE.tinta} stroke={colore} strokeWidth={5} />
      <circle cx={30} cy={-64} r={4} fill={colore} />
      <line x1={-14} y1={-92} x2={10} y2={-92} stroke={colore} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
}

/** Una cassaforte che si apre (apertura da 0 a 1): dentro è vuota. */
export function Cassaforte({ x, y, lato, apertura }: { x: number; y: number; lato: number; apertura: number }) {
  // La porta gira sul cardine a sinistra: si accorcia e si vede il retro.
  const sx = Math.cos(apertura * Math.PI * 0.85);
  return (
    <g>
      <rect x={x - 8} y={y - 8} width={lato + 16} height={lato + 16} rx={26} fill={TINTE.tratto} />
      {/* interno vuoto */}
      <rect x={x + 14} y={y + 14} width={lato - 28} height={lato - 28} rx={14} fill="#f3efe7" />
      <line x1={x + 14} y1={y + lato * 0.62} x2={x + lato - 14} y2={y + lato * 0.62} stroke="#dcd5c8" strokeWidth={5} />
      <rect x={x + lato * 0.6} y={y + lato - 40} width={lato * 0.24} height={12} rx={6} fill="#e4ddd0" opacity={0.6} />
      {/* piedini */}
      <rect x={x + 14} y={y + lato + 6} width={36} height={18} rx={6} fill={TINTE.tratto} />
      <rect x={x + lato - 50} y={y + lato + 6} width={36} height={18} rx={6} fill={TINTE.tratto} />
      {/* porta */}
      <g transform={`translate(${x} ${y}) scale(${sx} 1)`}>
        <rect x={0} y={0} width={lato} height={lato} rx={22} fill={sx > 0 ? "#1b6f7d" : "#0b4954"} stroke={TINTE.tratto} strokeWidth={6} />
        {sx > 0 ? (
          <g>
            <circle cx={lato * 0.55} cy={lato * 0.5} r={lato * 0.2} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={6} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line
                key={i}
                x1={lato * 0.55}
                y1={lato * 0.5}
                x2={lato * 0.55 + Math.cos((i * Math.PI) / 3) * lato * 0.15}
                y2={lato * 0.5 + Math.sin((i * Math.PI) / 3) * lato * 0.15}
                stroke={TINTE.tratto}
                strokeWidth={5}
                strokeLinecap="round"
              />
            ))}
            <rect x={lato * 0.86} y={lato * 0.36} width={14} height={lato * 0.28} rx={7} fill={TINTE.tinta} />
          </g>
        ) : null}
      </g>
    </g>
  );
}

/** Uno strumento di lavoro (chiave inglese) su un cartello piantato sulla linea. */
export function Cartello({ x, y, children }: { x: number; y: number; children?: ReactNode }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 90} stroke={TINTE.accento} strokeWidth={8} strokeLinecap="round" />
      <rect x={x - 46} y={y - 176} width={92} height={92} rx={20} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={6} />
      {children}
    </g>
  );
}

export function Attrezzo({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(-40)`}>
      <rect x={-7} y={-6} width={14} height={44} rx={7} fill={TINTE.accento} />
      <path d="M -18 -30 a 20 20 0 1 0 36 0 l -10 6 l -8 -10 l -8 10 Z" fill={TINTE.accento} />
    </g>
  );
}

/** Un fumetto rotondo con dentro qualcosa («?» o una lampadina). */
export function Fumetto({ cx, cy, r = 40, children }: { cx: number; cy: number; r?: number; children: ReactNode }) {
  return (
    <g>
      <circle cx={cx - r * 0.55} cy={cy + r * 1.18} r={r * 0.14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} />
      <circle cx={cx - r * 0.3} cy={cy + r * 0.95} r={r * 0.2} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      {children}
    </g>
  );
}

export function Lampadina({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = -Math.PI / 2 + (i - 2) * 0.55;
        return (
          <line key={i} x1={Math.cos(a) * 26} y1={Math.sin(a) * 26 - 4} x2={Math.cos(a) * 36} y2={Math.sin(a) * 36 - 4} stroke={TINTE.oro} strokeWidth={5} strokeLinecap="round" />
        );
      })}
      <path d="M -14 10 a 18 18 0 1 1 28 0 l -3 8 h -22 Z" fill="#ffd866" stroke={TINTE.accento} strokeWidth={4} strokeLinejoin="round" />
      <rect x={-9} y={18} width={18} height={9} rx={3} fill={TINTE.accento} />
    </g>
  );
}

export function Valigetta({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -16 -56 v -10 q 0 -8 8 -8 h 16 q 8 0 8 8 v 10" fill="none" stroke={TINTE.accento} strokeWidth={6} />
      <rect x={-46} y={-58} width={92} height={58} rx={10} fill={TINTE.accento} />
      <line x1={-46} y1={-34} x2={46} y2={-34} stroke="#7a4512" strokeWidth={4} />
    </g>
  );
}

/** Un timbro rotondo con la spunta e una piccola persona: «è la tua». */
export function Timbro({ cx, cy, r = 54 }: { cx: number; cy: number; r?: number }) {
  return (
    <g transform={`rotate(-12 ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TINTE.ok} strokeWidth={7} />
      <circle cx={cx} cy={cy} r={r - 12} fill={TINTE.ok} opacity={0.12} />
      <circle cx={cx - 12} cy={cy - 14} r={11} fill={TINTE.ok} />
      <path d={`M ${cx - 30} ${cy + 24} q 18 -32 36 0`} fill={TINTE.ok} />
      <path d={`M ${cx + 6} ${cy + 4} l 10 12 l 20 -26`} fill="none" stroke={TINTE.ok} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** Stelline che esplodono (p da 0 a 1). */
export function Esplosione({ cx, cy, p, r = 70 }: { cx: number; cy: number; p: number; r?: number }) {
  if (p <= 0 || p >= 1) return null;
  const colori = [TINTE.tratto, "#b5401a", TINTE.oro, "#2f8c99"];
  const via = 1 - (1 - p) ** 3;
  return (
    <g>
      {Array.from({ length: 10 }, (_, k) => {
        const a = (k / 10) * Math.PI * 2 + 0.3;
        const d = r * (k % 2 ? 0.7 : 1) * via;
        const g = Math.sin(Math.PI * Math.min(1, p * 1.3));
        return k % 2 ? (
          <circle key={k} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d} r={7 * g} fill={colori[k % 4]} opacity={1 - p * p} />
        ) : (
          <path
            key={k}
            d="M0,-1 C0.12,-0.12 0.12,-0.12 1,0 C0.12,0.12 0.12,0.12 0,1 C-0.12,0.12 -0.12,0.12 -1,0 C-0.12,-0.12 -0.12,-0.12 0,-1Z"
            fill={colori[k % 4]}
            transform={`translate(${cx + Math.cos(a) * d} ${cy + Math.sin(a) * d}) rotate(${p * 140}) scale(${16 * g})`}
            opacity={1 - p * p}
          />
        );
      })}
    </g>
  );
}
