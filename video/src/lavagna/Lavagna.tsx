import { Loop, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { gruppiSchede } from "../componenti/Schede";
import type { Durate, Lezione } from "../lezioni/tipi";
import { Bussolina } from "../presentatore/Bussolina";
import { posa } from "../presentatore/coreografia";
import { Scintille } from "../presentatore/Scintille";
import { COLORI, TITOLI } from "../stile";
import { FPS, type Tempi } from "../tempi";
import { chiaveScena, contestoScena, pianoLavagna } from "./coreografia";
import { DISEGNI } from "./disegni";
import { SchedaHtml } from "./disegni/ditta-individuale";
import { molla, tra } from "./figure";
import { LAVAGNA } from "./griglia";

/** Intervalli di fotogrammi [da, a) in cui la lavagna è in scena (nel misto non sempre). */
export type Segmenti = readonly (readonly [number, number])[];
const SEMPRE: Segmenti = [[0, Infinity]];
const DISSOLVENZA = 10;

/**
 * Stile «lavagna»: Bleo parla in una finestra rotonda in basso a sinistra;
 * sulla lavagna un disegno animato per ogni scena (vedi disegni/), i tre
 * cerchi dell'elenco e la bussolina che indica, tocca e festeggia.
 */
export function Lavagna({ lezione, durate, tempi, parla }: { lezione: Lezione; durate: Durate; tempi: Tempi; parla: boolean }) {
  const frame = useCurrentFrame();
  const piano = pianoLavagna(lezione, tempi);
  const adesso = frame < piano.fine ? posa(piano, frame) : null;
  return (
    <>
      <Puntini opacita={1} />
      <DisegniLavagna lezione={lezione} tempi={tempi} />
      <Contatore lezione={lezione} tempi={tempi} />
      <BleoFinestra src={`${lezione.id}/${lezione.clip}`} durataLoop={Math.floor(durate.clip * FPS)} parla={parla} comparsa={1} />
      <Scintille scintille={piano.scintille} />
      {adesso ? <Bussolina posa={adesso} piano={piano} altezza={LAVAGNA.bussolina.altezza} /> : null}
    </>
  );
}

/** La carta della lavagna: puntini leggeri. */
export function Puntini({ opacita }: { opacita: number }) {
  if (opacita <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        top: 104,
        opacity: opacita,
        backgroundImage: "radial-gradient(circle, rgba(15, 94, 107, 0.16) 2.2px, transparent 2.8px)",
        backgroundSize: "32px 32px",
        backgroundPosition: "8px 8px",
      }}
    />
  );
}

/** Quanto si vede la scena `i` al fotogramma `f` (0 → 1), dentro i segmenti in cui c'è la lavagna. */
export function presenzaScena(tempi: Tempi, i: number, f: number, segmenti: Segmenti): number {
  const { inizio, durata } = tempi.scene[i];
  let v = 0;
  for (const [a0, b0] of segmenti) {
    const a = Math.max(a0, inizio);
    const b = Math.min(b0, inizio + durata);
    if (b <= a) continue;
    // Entra con una dissolvenza; esce dopo la fine, mentre entra la scena dopo.
    const dentro = interpolate(f, [a, a + DISSOLVENZA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const fuori = interpolate(f, [b, b + DISSOLVENZA], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    v = Math.max(v, Math.min(dentro, fuori));
  }
  return v;
}

/** I disegni delle scene, ognuno nel suo tempo. */
export function DisegniLavagna({ lezione, tempi, segmenti = SEMPRE }: { lezione: Lezione; tempi: Tempi; segmenti?: Segmenti }) {
  const frame = useCurrentFrame();
  const { tela } = LAVAGNA;
  return (
    <div style={{ position: "absolute", left: tela.x, top: tela.y, width: tela.larghezza, height: tela.altezza }}>
      {lezione.scene.map((scena, i) => {
        const v = presenzaScena(tempi, i, frame, segmenti);
        if (v <= 0) return null;
        const locale = frame - tempi.scene[i].inizio;
        const disegno = scena.disegno ? DISEGNI[scena.disegno] : undefined;
        const uscita = frame >= tempi.scene[i].inizio + tempi.scene[i].durata ? 1 - v : 0;
        return (
          <div
            key={scena.audio}
            style={{ position: "absolute", inset: 0, opacity: v, transform: `translateX(${-uscita * 60}px)` }}
          >
            {disegno ? (
              <disegno.Figura locale={locale} ctx={contestoScena(tempi, i)} schermo={scena.schermo} />
            ) : (
              <SchedaHtml schermo={scena.schermo} v={molla(locale, 4, FPS, true)} locale={locale} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * I cerchi numerati dell'elenco («tre cose»), in alto a destra: compaiono
 * quando Bleo li annuncia e si riempiono uno per scena, al momento chiave.
 */
export function Contatore({ lezione, tempi, segmenti = SEMPRE }: { lezione: Lezione; tempi: Tempi; segmenti?: Segmenti }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const gruppo = gruppiSchede(lezione.scene, tempi.scene).find(
    (g) => lezione.scene[g.scene[0]].schermo.tipo === "elenco" && frame >= g.inizio && frame < g.fine + DISSOLVENZA,
  );
  if (!gruppo) return null;
  const v = Math.max(...gruppo.scene.map((i) => presenzaScena(tempi, i, frame, segmenti)));
  if (v <= 0) return null;
  const primo = lezione.scene[gruppo.scene[0]].schermo;
  if (primo.tipo !== "elenco") return null;
  const comparsa = gruppo.inizio + (primo.visibili === 0 ? chiaveScena(lezione, tempi, gruppo.scene[0]) : 0);
  // Quando si riempie ogni cerchio: al momento chiave della scena che lo aggiunge.
  const pieni = primo.punti.map((_, k) => {
    const i = gruppo.scene.find((j) => {
      const s = lezione.scene[j].schermo;
      return s.tipo === "elenco" && s.visibili > k;
    });
    return i === undefined ? Infinity : tempi.scene[i].inizio + chiaveScena(lezione, tempi, i);
  });
  const { tela, contatore } = LAVAGNA;
  const passo = 78;
  return (
    <svg
      viewBox={`0 0 ${tela.larghezza} ${tela.altezza}`}
      width={tela.larghezza}
      height={tela.altezza}
      style={{ position: "absolute", left: tela.x, top: tela.y, opacity: v, overflow: "visible" }}
    >
      {primo.punti.map((_, k) => {
        const cx = contatore.x - 30 - (primo.punti.length - 1 - k) * passo;
        const cy = contatore.y;
        const su = spring({ frame: frame - comparsa - k * 4, fps, config: { damping: 11, stiffness: 150 } });
        const pieno = frame >= pieni[k] ? molla(frame, pieni[k], fps) : 0;
        if (su <= 0.01) return null;
        return (
          <g key={k} transform={`translate(${cx} ${cy}) scale(${Math.max(0, su) * (1 + 0.15 * Math.sin(Math.min(1, pieno) * Math.PI))})`}>
            <circle r={30} fill={pieno > 0.5 ? COLORI.brand : COLORI.card} stroke={pieno > 0.5 ? COLORI.brand : "#b9b2a6"} strokeWidth={4} strokeDasharray={pieno > 0.5 ? undefined : "7 6"} />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={TITOLI}
              fontWeight={800}
              fontSize={30}
              fill={pieno > 0.5 ? COLORI.card : "#9a9387"}
              y={1}
            >
              {k + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Bleo nella finestra rotonda: testa e petto dal clip in cui parla, un anello
 * verde acqua che pulsa piano mentre parla. `comparsa` da 0 a 1.
 */
export function BleoFinestra({
  src,
  durataLoop,
  parla,
  comparsa,
  dissolvenza = false,
}: {
  src: string;
  durataLoop: number;
  parla: boolean;
  comparsa: number;
  /** Nel misto: niente molla all'inizio, compare in dissolvenza (comparsa = opacità). */
  dissolvenza?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { cx, cy, r } = LAVAGNA.cerchio;
  const { inquadratura } = LAVAGNA;
  const entra = dissolvenza ? 1 : spring({ frame, fps, config: { damping: 13, stiffness: 120 } }) * comparsa;
  const opacita = dissolvenza ? comparsa : Math.min(1, entra * 1.5);
  if (entra <= 0.001 || opacita <= 0.001) return null;
  const scala = r / inquadratura.r;
  const voce = parla ? (Math.sin(frame / 2.4) * 0.5 + 0.5) * (Math.sin(frame / 5.3) * 0.3 + 0.7) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        transform: `scale(${entra})`,
        opacity: opacita,
      }}
    >
      {/* L'alone che pulsa con la voce */}
      <div
        style={{
          position: "absolute",
          inset: -10 - voce * 8,
          borderRadius: "50%",
          backgroundColor: "rgba(15, 94, 107, 0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          backgroundColor: COLORI.pesca,
          boxShadow: `0 0 0 ${10 + voce * 2}px ${COLORI.brand}, 0 24px 40px -14px rgba(15, 94, 107, 0.55)`,
        }}
      >
        <Loop durationInFrames={durataLoop}>
          <OffthreadVideo
            src={staticFile(src)}
            muted
            style={{
              position: "absolute",
              width: 960 * scala,
              height: 960 * scala,
              left: -(inquadratura.cx - inquadratura.r) * scala,
              top: -(inquadratura.cy - inquadratura.r) * scala,
              maxWidth: "none",
            }}
          />
        </Loop>
      </div>
    </div>
  );
}

/** La lavagna appare (0 → 1) e se ne va (1 → 0) con i passaggi del misto. */
export function apparizione(f: number, segmenti: Segmenti): number {
  let v = 0;
  for (const [a, b] of segmenti) v = Math.max(v, tra(f, a - 4, a + 10) * (1 - tra(f, b - 4, b + 10)));
  return v;
}

