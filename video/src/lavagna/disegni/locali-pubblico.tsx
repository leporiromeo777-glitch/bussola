/**
 * I disegni della lezione 16 («Aprire un negozio o uno studio»), vedi
 * src/lezioni/locali-pubblico.ts. Fonti: LAN e RLAN, legge edilizia, legge e
 * regolamento sugli impianti pubblicitari, OIP, pagine della Polizia
 * cantonale (patente di vendita distillati, elenco delle autorizzazioni),
 * LEAR. Coordinate della tela 1000×700; l'angolo in basso a sinistra
 * (x < 300, y > 480) è della finestra di Bleo. Niente cifre, solo concetti.
 */
import {
  Avviso,
  Casa,
  Compare,
  Foglio,
  Freccia,
  Fumetto,
  molla,
  Moneta,
  Negozio,
  Palazzo,
  Persona,
  Pillola,
  Righe,
  Spunta,
  TEAL_CHIARO,
  Testo,
  Timbro,
  TINTE,
  tra,
} from "../figure";
import { Tela } from "./ditta-individuale";
import type { ContestoDisegno, Disegno } from "./tipi";

/** Un momento fra due cambi di sottotitolo (`f` da 0 a 1); senza cambi, una frazione della voce. */
function fra(ctx: ContestoDisegno, da: number | null, a: number | null, f: number, riserva: number): number {
  const inizio = da === null ? 0 : ctx.cambi[da];
  const fine = a === null ? ctx.voce : ctx.cambi[a];
  if (inizio === undefined || fine === undefined) return Math.round(ctx.voce * riserva);
  return Math.round(inizio + (fine - inizio) * f);
}

/** Il titolo in alto. */
function Titolo({ locale, fps, testo }: { locale: number; fps: number; testo: string }) {
  return (
    <Compare v={molla(locale, 2, fps)} cx={655} cy={40}>
      <Pillola x={655} y={40} testo={testo} corpo={32} fondo={TINTE.tratto} colore={TINTE.carta} />
    </Compare>
  );
}

/** Un bollino rosso con la croce bianca: «no». */
function No({ cx, cy, r, p = 1 }: { cx: number; cy: number; r: number; p?: number }) {
  if (p <= 0) return null;
  const tondo = Math.min(1, p * 1.6);
  const segno = Math.max(0, (p - 0.4) / 0.6) * r * 0.42;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * (0.6 + 0.4 * tondo)} fill={TINTE.rischio} opacity={tondo} />
      <g stroke={TINTE.carta} strokeWidth={r * 0.2} strokeLinecap="round">
        <line x1={cx - segno} y1={cy - segno} x2={cx + segno} y2={cy + segno} />
        <line x1={cx + segno} y1={cy - segno} x2={cx - segno} y2={cy + segno} />
      </g>
    </g>
  );
}

/** Il cartello rosso «Chiuso», un po' storto. */
function Chiuso({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-8)`}>
      <rect x={-95} y={-38} width={190} height={76} rx={16} fill={TINTE.rischio} />
      <Testo x={0} y={1} corpo={38} titolo peso={800} colore={TINTE.carta}>
        Chiuso
      </Testo>
    </g>
  );
}

/** Una tazzina fumante: il bar. */
function Tazza({ cx, cy, locale }: { cx: number; cy: number; locale: number }) {
  const fumo = Math.sin(locale / 6) * 4;
  return (
    <g>
      {[-22, 8].map((dx) => (
        <path
          key={dx}
          d={`M ${cx + dx} ${cy - 58} q ${10 + fumo} -16 0 -32 q ${-10 - fumo} -16 0 -32`}
          fill="none"
          stroke={TINTE.accento}
          strokeWidth={6}
          strokeLinecap="round"
        />
      ))}
      <path d={`M ${cx + 52} ${cy - 22} q 38 0 38 24 q 0 24 -38 24`} fill="none" stroke={TINTE.tratto} strokeWidth={8} />
      <path d={`M ${cx - 58} ${cy - 38} h 116 v 46 q 0 46 -46 46 h -24 q -46 0 -46 -46 Z`} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={7} strokeLinejoin="round" />
      <rect x={cx - 80} y={cy + 56} width={160} height={14} rx={7} fill={TINTE.tratto} />
    </g>
  );
}

/** Un orologio senza numeri: le tacche e le lancette (la lunga gira con `giro`, da 0 a 1). */
function Orologio({ cx, cy, r, giro }: { cx: number; cy: number; r: number; giro: number }) {
  const lunga = ((-90 + giro * 360) * Math.PI) / 180;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={8} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const dentro = i % 3 === 0 ? r * 0.72 : r * 0.8;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * dentro}
            y1={cy + Math.sin(a) * dentro}
            x2={cx + Math.cos(a) * r * 0.9}
            y2={cy + Math.sin(a) * r * 0.9}
            stroke={i % 3 === 0 ? TINTE.tratto : TINTE.tinta}
            strokeWidth={i % 3 === 0 ? 7 : 5}
            strokeLinecap="round"
          />
        );
      })}
      <line x1={cx} y1={cy} x2={cx + r * 0.42} y2={cy - r * 0.2} stroke={TINTE.tratto} strokeWidth={9} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.cos(lunga) * r * 0.66} y2={cy + Math.sin(lunga) * r * 0.66} stroke={TINTE.accento} strokeWidth={7} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={9} fill={TINTE.accento} />
    </g>
  );
}

/** Un calendario da muro, senza numeri; con `domenica` l'ultima colonna è rossa. */
function Calendario({ cx, cy, s = 1, domenica = false }: { cx: number; cy: number; s?: number; domenica?: boolean }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-74} y={-70} width={148} height={142} rx={16} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-74} y={-70} width={148} height={38} rx={16} fill={TINTE.accento} />
      <rect x={-44} y={-84} width={12} height={28} rx={6} fill={TINTE.tratto} />
      <rect x={32} y={-84} width={12} height={28} rx={6} fill={TINTE.tratto} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}-${c}`} x={-56 + c * 30} y={-18 + r * 28} width={22} height={18} rx={5} fill={domenica && c === 3 ? TINTE.rischio : TINTE.tinta} />
        )),
      )}
    </g>
  );
}

/** Il sole (il mattino) e la luna (la sera). */
function Sole({ cx, cy, r = 22 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r * 1.35}
            y1={cy + Math.sin(a) * r * 1.35}
            x2={cx + Math.cos(a) * r * 1.8}
            y2={cy + Math.sin(a) * r * 1.8}
            stroke={TINTE.oro}
            strokeWidth={5}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r} fill={TINTE.oro} />
    </g>
  );
}

function Luna({ cx, cy, r = 24 }: { cx: number; cy: number; r?: number }) {
  return <path d={`M ${cx + r * 0.3} ${cy - r} a ${r} ${r} 0 1 0 ${r * 0.7} ${r * 1.7} a ${r * 0.85} ${r * 0.85} 0 1 1 ${-r * 0.7} ${-r * 1.7} Z`} fill={TINTE.tratto} />;
}

/** Uno stand di vendita: il bancone, due pali e la tenda a strisce (piedi in x, y). */
function Stand({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const w = 200;
  const strisce = 5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2 + 8} y={-150} width={10} height={150} rx={5} fill={TINTE.tratto} />
      <rect x={w / 2 - 18} y={-150} width={10} height={150} rx={5} fill={TINTE.tratto} />
      {Array.from({ length: strisce }, (_, i) => (
        <path
          key={i}
          d={`M ${-w / 2 + (i * w) / strisce} -170 h ${w / strisce} v 24 a ${w / strisce / 2} ${w / strisce / 2.6} 0 0 1 ${-w / strisce} 0 Z`}
          fill={i % 2 === 0 ? TINTE.accento : TINTE.crema}
          stroke={TINTE.tratto}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ))}
      <rect x={-w / 2} y={-66} width={w} height={66} rx={10} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      {[-50, 0, 50].map((dx, i) => (
        <circle key={dx} cx={dx} cy={-80} r={14} fill={i === 1 ? TINTE.oro : TINTE.accento} stroke={TINTE.tratto} strokeWidth={4} />
      ))}
    </g>
  );
}

/** Un cartellino del prezzo: la sigla della moneta e una riga, senza cifre. */
function Cartellino({ cx, cy, s = 1, colore = TINTE.accento }: { cx: number; cy: number; s?: number; colore?: string }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M -40 -20 H 26 L 42 0 L 26 20 H -40 Q -46 20 -46 14 V -14 Q -46 -20 -40 -20 Z" fill={TINTE.carta} stroke={colore} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={28} cy={0} r={4} fill={colore} />
      <Testo x={-12} y={1} corpo={18} titolo peso={800} colore={colore}>
        CHF
      </Testo>
    </g>
  );
}

/** Una pagnotta, un fiore e un quadro: le eccezioni della domenica. */
function Pane({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={52} ry={30} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={5} />
      {[-22, 0, 22].map((dx) => (
        <path key={dx} d={`M ${cx + dx - 8} ${cy - 16} q 8 16 16 32`} stroke={TINTE.accento} strokeWidth={5} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}

function Fiore({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <path d={`M ${cx} ${cy + 4} V ${cy + 46}`} stroke={TINTE.ok} strokeWidth={7} strokeLinecap="round" />
      <path d={`M ${cx} ${cy + 30} q 18 -14 30 -4 q -14 14 -30 4 Z`} fill={TINTE.ok} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <circle key={i} cx={cx + Math.cos(a) * 20} cy={cy - 14 + Math.sin(a) * 20} r={14} fill={TINTE.accento} />;
      })}
      <circle cx={cx} cy={cy - 14} r={12} fill={TINTE.oro} />
      <path d={`M ${cx - 26} ${cy + 40} h 52 l -8 30 h -36 Z`} fill={TINTE.tratto} />
    </g>
  );
}

function Quadro({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 46} y={cy - 40} width={92} height={80} rx={6} fill={TINTE.oro} />
      <rect x={cx - 36} y={cy - 30} width={72} height={60} rx={4} fill={TINTE.crema} />
      <path d={`M ${cx - 32} ${cy + 26} L ${cx - 10} ${cy - 2} L ${cx + 4} ${cy + 12} L ${cx + 16} ${cy} L ${cx + 32} ${cy + 26} Z`} fill={TINTE.tratto} />
      <circle cx={cx + 16} cy={cy - 14} r={8} fill={TINTE.accento} />
    </g>
  );
}

/** Le bandierine dell'inaugurazione, appese fra due punti. */
function Festone({ x1, x2, y, p }: { x1: number; x2: number; y: number; p: number }) {
  const n = 7;
  const colori = [TINTE.accento, TINTE.oro, TINTE.tratto];
  return (
    <g>
      <path d={`M ${x1} ${y} Q ${(x1 + x2) / 2} ${y + 40} ${x2} ${y}`} fill="none" stroke={TINTE.tratto} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        if (t > p) return null;
        const bx = x1 + (x2 - x1) * t;
        const by = y + 40 * 2 * t * (1 - t) * 1.0;
        return <path key={i} d={`M ${bx - 13} ${by} H ${bx + 13} L ${bx} ${by + 28} Z`} fill={colori[i % 3]} />;
      })}
    </g>
  );
}

/** Un palloncino con il filo. */
function Palloncino({ cx, cy, colore, locale }: { cx: number; cy: number; colore: string; locale: number }) {
  const dondola = Math.sin(locale / 14 + cx) * 4;
  return (
    <g transform={`translate(${dondola} 0)`}>
      <path d={`M ${cx} ${cy + 36} q -8 30 4 60`} fill="none" stroke={TINTE.tratto} strokeWidth={3} />
      <ellipse cx={cx} cy={cy} rx={26} ry={32} fill={colore} />
      <path d={`M ${cx - 5} ${cy + 32} h 10 l -5 8 Z`} fill={colore} />
    </g>
  );
}

/** Una bottiglia (superalcolico o vino), con l'etichetta. */
function Bottiglia({ cx, base, alta = false, colore }: { cx: number; base: number; alta?: boolean; colore: string }) {
  const h = alta ? 190 : 170;
  const w = alta ? 60 : 56;
  return (
    <g>
      <path
        d={`M ${cx - w / 2} ${base - 10} V ${base - h * 0.55} Q ${cx - w / 2} ${base - h * 0.7} ${cx - 12} ${base - h * 0.75} V ${base - h} H ${cx + 12} V ${base - h * 0.75} Q ${cx + w / 2} ${base - h * 0.7} ${cx + w / 2} ${base - h * 0.55} V ${base - 10} Q ${cx + w / 2} ${base} ${cx + w / 2 - 10} ${base} H ${cx - w / 2 + 10} Q ${cx - w / 2} ${base} ${cx - w / 2} ${base - 10} Z`}
        fill={colore}
        stroke={TINTE.tratto}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <rect x={cx - 14} y={base - h - 12} width={28} height={16} rx={4} fill={TINTE.tratto} />
      <rect x={cx - w / 2 + 6} y={base - h * 0.45} width={w - 12} height={h * 0.25} rx={6} fill={TINTE.crema} />
    </g>
  );
}

/** Un boccale di birra con la schiuma. */
function Boccale({ cx, base }: { cx: number; base: number }) {
  return (
    <g>
      <path d={`M ${cx + 34} ${base - 92} q 34 0 34 30 q 0 30 -34 30`} fill="none" stroke={TINTE.tratto} strokeWidth={8} />
      <rect x={cx - 40} y={base - 112} width={76} height={112} rx={12} fill={TINTE.oro} stroke={TINTE.tratto} strokeWidth={6} />
      <path d={`M ${cx - 44} ${base - 106} q 0 -24 20 -22 q 8 -14 24 -6 q 14 -10 26 4 q 14 4 10 24 Z`} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
      {[-18, 4].map((dx) => (
        <line key={dx} x1={cx + dx} y1={base - 80} x2={cx + dx} y2={base - 24} stroke={TINTE.crema} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      ))}
    </g>
  );
}

/** Un paio di forbici: il parrucchiere. */
function Forbici({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-20)`}>
      {/* due lame aperte a V, i manici ad anello a sinistra */}
      <path d="M -8 -6 L 78 -40 Q 84 -38 80 -32 L 8 8 Z" fill={TINTE.tratto} />
      <path d="M -8 6 L 78 40 Q 84 38 80 32 L 8 -8 Z" fill={TINTE.tratto} />
      <path d="M -8 -6 L -22 -14" stroke={TINTE.accento} strokeWidth={9} strokeLinecap="round" />
      <path d="M -8 6 L -22 14" stroke={TINTE.accento} strokeWidth={9} strokeLinecap="round" />
      <ellipse cx={-40} cy={-22} rx={20} ry={15} fill="none" stroke={TINTE.accento} strokeWidth={8} />
      <ellipse cx={-40} cy={22} rx={20} ry={15} fill="none" stroke={TINTE.accento} strokeWidth={8} />
      <circle cx={0} cy={0} r={6} fill={TINTE.crema} stroke={TINTE.tratto} strokeWidth={3} />
    </g>
  );
}

/* 2. «Cosa fai nel tuo locale? Se servi cibi o bevande … è un esercizio pubblico: … lezione 4. Qui parliamo di negozi e di studi.» */
const locQuale: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.3, 0.8),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.3, 0.8) + 14 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const bar = fra(ctx, 0, 1, 0.25, 0.3);
    const esercizio = fra(ctx, 1, 2, 0.35, 0.55);
    const qui = fra(ctx, 2, null, 0.2, 0.8);
    const domanda = molla(locale, 6, fps) * (1 - tra(locale, bar - 6, bar + 4));
    const spento = 1 - 0.55 * tra(locale, qui, qui + 12);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Che locale è?" />
        <Compare v={domanda} cx={640} cy={320}>
          <Fumetto cx={640} cy={300} r={80}>
            <Testo x={640} y={304} corpo={96} titolo peso={800} colore={TINTE.accento}>
              ?
            </Testo>
          </Fumetto>
        </Compare>
        <g opacity={spento}>
          <Compare v={molla(locale, bar, fps)} cx={470} cy={280}>
            <Tazza cx={470} cy={270} locale={locale} />
            <Pillola x={470} y={390} testo="Bar o ristorante" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
          </Compare>
          <Compare v={molla(locale, esercizio, fps)} cx={470} cy={470}>
            <Pillola x={470} y={470} testo="Esercizio pubblico" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
            <Testo x={470} y={530} corpo={26} colore={TINTE.accento}>
              un'altra lezione
            </Testo>
          </Compare>
        </g>
        <Compare v={molla(locale, qui, fps)} cx={810} cy={360}>
          <Negozio x={810} y={420} s={0.85} targa="Negozio" />
          <Pillola x={810} y={480} testo="Negozio o studio" corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, qui + 10, fps)} cx={810} cy={560}>
          <Pillola x={810} y={560} testo="Questa lezione" corpo={28} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Un negozio è ogni locale aperto al pubblico dove vendi prodotti al dettaglio. Conta anche uno stand, o un angolo vendita …» */
const locNegozio: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.2, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.2, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.3, 0.6) + 6 },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.4, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const negozio = fra(ctx, 0, 1, 0.1, 0.3);
    const cliente = fra(ctx, 0, 1, 0.45, 0.4);
    const dettaglio = fra(ctx, 0, 1, 0.7, 0.45);
    const stand = fra(ctx, 1, 2, 0.2, 0.6);
    const angolo = fra(ctx, 2, null, 0.3, 0.85);
    const cammina = tra(locale, cliente, cliente + 40);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cos'è un negozio" />
        <Compare v={molla(locale, negozio, fps)} cx={480} cy={330}>
          <Negozio x={480} y={430} targa="Negozio" />
        </Compare>
        <Compare v={molla(locale, cliente, fps)} cx={640} cy={380}>
          <Persona x={680 - cammina * 40} y={430} s={0.55} colore={TEAL_CHIARO} passo={cammina < 1 ? locale / 3 : undefined} />
        </Compare>
        <Compare v={molla(locale, dettaglio, fps)} cx={480} cy={490}>
          <Pillola x={480} y={490} testo="Vendita al dettaglio" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, stand, fps)} cx={830} cy={230}>
          <Stand x={830} y={290} s={0.85} />
          <Pillola x={830} y={340} testo="Stand" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, angolo, fps)} cx={830} cy={560}>
          <Casa x={830} y={600} s={1.1} />
          <Cartellino cx={856} cy={556} s={0.6} />
          <Pillola x={830} y={640} testo="Angolo vendita" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Dal lunedì al venerdì … il sabato … Il giovedì puoi restare aperto fino alle … se è festivo, il Cantone sceglie un altro giorno.» */
const RIGHE_ORARI = [
  { y: 300, etichetta: "Lunedì-venerdì", fine: 860, colore: TINTE.tratto, cambio: 0 },
  { y: 400, etichetta: "Sabato", fine: 838, colore: TEAL_CHIARO, cambio: 1 },
  { y: 500, etichetta: "Giovedì", fine: 930, colore: TINTE.accento, cambio: 2 },
] as const;
const INIZIO_BARRA = 600;
const locOrari: Disegno = {
  chiave: (ctx) => fra(ctx, 2, 3, 0.4, 0.7),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 2, 3, 0.4, 0.7) + 10 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const festivo = fra(ctx, 3, null, 0.2, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Gli orari" />
        <Compare v={molla(locale, 4, fps)} cx={400} cy={180}>
          <Orologio cx={400} cy={180} r={70} giro={locale / 90} />
        </Compare>
        <Compare v={molla(locale, 10, fps)} cx={780} cy={190}>
          <Sole cx={INIZIO_BARRA + 10} cy={190} />
          <Freccia d={`M ${INIZIO_BARRA + 60} 190 H 890`} p={tra(locale, 14, 34)} colore={TINTE.tinta} spessore={7} />
          <Luna cx={935} cy={190} />
        </Compare>
        {RIGHE_ORARI.map((r, i) => {
          const da = i === 0 ? fra(ctx, 0, 1, 0.1, 0.25) : fra(ctx, r.cambio, r.cambio + 1, 0.1, 0.3 + i * 0.2);
          const lungo = tra(locale, da + 4, da + 22);
          return (
            <Compare key={r.etichetta} v={molla(locale, da, fps)} cx={440} cy={r.y}>
              <Pillola x={440} y={r.y} testo={r.etichetta} corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} />
              <rect x={INIZIO_BARRA} y={r.y - 18} width={Math.max(36, (r.fine - INIZIO_BARRA) * lungo)} height={36} rx={18} fill={r.colore} />
              {i === 2 ? (
                <g opacity={tra(locale, da + 18, da + 26)}>
                  <Luna cx={r.fine + 34} cy={r.y} r={20} />
                </g>
              ) : null}
            </Compare>
          );
        })}
        <Compare v={molla(locale, festivo, fps)} cx={470} cy={610}>
          <Calendario cx={470} cy={610} s={0.75} />
        </Compare>
        <Freccia d="M 540 610 H 585" p={tra(locale, festivo + 6, festivo + 14)} />
        <Compare v={molla(locale, festivo + 10, fps)} cx={790} cy={610}>
          <Pillola x={790} y={610} testo="Festivo? Un altro giorno" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «La domenica e nei festivi i negozi restano chiusi. … eccezioni … panetterie, fiorai e gallerie d'arte … non serve nessuna domanda.» */
const ECCEZIONI = [
  { x: 690, etichetta: "Pane" },
  { x: 810, etichetta: "Fiori" },
  { x: 930, etichetta: "Arte" },
] as const;
const locDomenica: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.3, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.6, 0.2) },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.4, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const chiuso = fra(ctx, null, 0, 0.45, 0.2);
    const eccezioni = fra(ctx, 0, 1, 0.2, 0.4);
    const icone = fra(ctx, 1, 2, 0.15, 0.55);
    const libere = fra(ctx, 2, null, 0.2, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Domenica e festivi" />
        <Compare v={molla(locale, 4, fps)} cx={470} cy={170}>
          <Calendario cx={470} cy={170} domenica />
        </Compare>
        <Compare v={molla(locale, 8, fps, true)} cx={470} cy={430}>
          <Negozio x={470} y={480} s={0.95} />
        </Compare>
        <Compare v={molla(locale, chiuso, fps)} cx={470} cy={420}>
          <Chiuso cx={470} cy={420} s={0.9} />
        </Compare>
        <Compare v={molla(locale, eccezioni, fps)} cx={810} cy={150}>
          <Pillola x={810} y={150} testo="Eccezioni di legge" corpo={28} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {ECCEZIONI.map((e, i) => {
          const da = icone + i * 8;
          return (
            <Compare key={e.etichetta} v={molla(locale, da, fps)} cx={e.x} cy={290}>
              {i === 0 ? <Pane cx={e.x} cy={290} /> : i === 1 ? <Fiore cx={e.x} cy={262} /> : <Quadro cx={e.x} cy={285} />}
              <Testo x={e.x} y={370} corpo={26} titolo peso={800} colore={TINTE.accento}>
                {e.etichetta}
              </Testo>
            </Compare>
          );
        })}
        <Spunta cx={680} cy={480} r={30} p={tra(locale, libere, libere + 14)} />
        <Compare v={molla(locale, libere + 6, fps)} cx={830} cy={480}>
          <Pillola x={830} y={480} testo="Senza domanda" corpo={28} fondo={TINTE.crema} colore={TINTE.ok} bordo={TINTE.ok} />
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Vuoi restare aperto più a lungo per un'inaugurazione …? Serve un'autorizzazione del Cantone: … per scritto … La tassa … multa.» */
const locDeroga: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.2) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.5) + 6 },
      { tipo: "scuoti", quando: fra(ctx, 3, null, 0.4, 0.85) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const festa = fra(ctx, null, 0, 0.3, 0.12);
    const cantone = fra(ctx, 0, 1, 0.2, 0.3);
    const domanda = fra(ctx, 1, 2, 0.15, 0.45);
    const tassa = fra(ctx, 2, 3, 0.25, 0.65);
    const multa = fra(ctx, 3, null, 0.4, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Fuori orario" />
        <Compare v={molla(locale, 4, fps, true)} cx={440} cy={400}>
          <Negozio x={440} y={460} />
        </Compare>
        <Festone x1={318} x2={562} y={252} p={tra(locale, festa, festa + 20)} />
        <Compare v={molla(locale, festa + 10, fps)} cx={350} cy={210}>
          <Palloncino cx={336} cy={196} colore={TINTE.accento} locale={locale} />
          <Palloncino cx={382} cy={214} colore={TINTE.oro} locale={locale} />
        </Compare>
        <Compare v={molla(locale, festa + 14, fps)} cx={440} cy={520}>
          <Pillola x={440} y={520} testo="Inaugurazione" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, cantone, fps)} cx={850} cy={290}>
          <Palazzo x={850} y={330} s={0.85} />
          <Pillola x={850} y={378} testo="Cantone" corpo={28} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, domanda, fps)} cx={630} cy={175}>
          <Foglio x={580} y={110} w={100} h={130}>
            <Righe x={594} y={156} w={60} n={3} passo={24} />
          </Foglio>
        </Compare>
        <Freccia d="M 690 200 Q 735 205 760 240" p={tra(locale, domanda + 8, domanda + 18)} />
        <Compare v={molla(locale, domanda + 10, fps)} cx={640} cy={330}>
          <Calendario cx={640} cy={335} s={0.6} />
        </Compare>
        <Compare v={molla(locale, tassa, fps)} cx={850} cy={460}>
          <Moneta cx={822} cy={458} r={26} />
          <Moneta cx={878} cy={458} r={26} />
        </Compare>
        <Compare v={molla(locale, multa, fps)} cx={720} cy={600}>
          <g transform="rotate(-6 720 600)">
            <rect x={625} y={562} width={190} height={76} rx={16} fill={TINTE.rischio} />
            <Testo x={720} y={601} corpo={38} titolo peso={800} colore={TINTE.carta}>
              Multa
            </Testo>
          </g>
          <Avviso x={880} y={600} s={0.9} />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Se cambi il suo uso … serve la licenza edilizia del Municipio. … trasformazioni importanti, non … manutenzione. E la domanda la firma anche il proprietario.» */
const locLicenza: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.3, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.2) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.3, 0.4) + 8 },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.3, 0.85) + 10 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const casa = fra(ctx, null, 0, 0.3, 0.08);
    const cambio = fra(ctx, 0, 1, 0.35, 0.25);
    const licenza = fra(ctx, 1, 2, 0.15, 0.4);
    const trasforma = fra(ctx, 2, 3, 0.1, 0.55);
    const manutenzione = fra(ctx, 2, 3, 0.55, 0.65);
    const proprietario = fra(ctx, 3, null, 0.15, 0.8);
    const parlane = fra(ctx, 3, null, 0.55, 0.9);
    const firma = tra(locale, proprietario + 10, proprietario + 30);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il locale" />
        <Compare v={molla(locale, casa, fps)} cx={390} cy={260}>
          <Casa x={390} y={320} s={1.2} />
          <Pillola x={390} y={362} testo="Appartamento" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} />
        </Compare>
        <Freccia d="M 490 270 H 575" p={tra(locale, cambio - 6, cambio + 6)} colore={TINTE.accento} />
        <Compare v={molla(locale, cambio, fps)} cx={680} cy={270}>
          <Negozio x={680} y={330} s={0.8} />
          <Pillola x={680} y={362} testo="Negozio" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, licenza, fps)} cx={900} cy={210}>
          <Foglio x={840} y={110} w={120} h={180}>
            <Testo x={892} y={174} corpo={22} titolo peso={800} colore={TINTE.tratto}>
              Licenza
            </Testo>
            <Righe x={858} y={202} w={70} n={1} />
          </Foglio>
          <g opacity={tra(locale, licenza + 8, licenza + 14)}>
            <Timbro cx={900} cy={250} r={26} />
          </g>
          <Pillola x={900} y={330} testo="Municipio" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, trasforma, fps)} cx={520} cy={460}>
          <Pillola x={520} y={460} testo="Trasformazione importante" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
          <Timbro cx={760} cy={460} r={28} />
        </Compare>
        <Compare v={molla(locale, manutenzione, fps)} cx={490} cy={540}>
          <Pillola x={490} y={540} testo="Semplice manutenzione" corpo={26} fondo={TINTE.carta} colore={TINTE.tratto} bordo={TINTE.tinta} />
          <No cx={700} cy={540} r={26} />
        </Compare>
        <Compare v={molla(locale, proprietario, fps)} cx={820} cy={600}>
          <Persona x={820} y={650} s={0.7} colore={TINTE.accento} />
        </Compare>
        <Freccia d="M 836 512 Q 870 440 892 368" p={firma} colore={TINTE.accento} spessore={6} />
        <Compare v={molla(locale, proprietario + 8, fps)} cx={820} cy={680}>
          <Pillola x={820} y={680} testo="Proprietario" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, parlane, fps)} cx={935} cy={600}>
          <Persona x={935} y={650} s={0.7} colore={TEAL_CHIARO} />
          <Fumetto cx={890} cy={500} r={28}>
            {[-10, 0, 10].map((dx) => (
              <circle key={dx} cx={890 + dx} cy={500} r={4} fill={TINTE.tratto} />
            ))}
          </Fumetto>
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Per un'insegna che si vede dalla strada serve l'autorizzazione del Municipio. Non serve per le scritte sulla vetrina, né per una piccola targa … in italiano …» */
const locInsegna: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "tocca", quando: fra(ctx, 0, 1, 0.2, 0.2) + 10, bersaglio: { x: 387, y: 318 } },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.5, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const insegna = fra(ctx, 0, 1, 0.1, 0.2);
    const municipio = fra(ctx, 0, 1, 0.55, 0.3);
    const vetrina = fra(ctx, 1, 2, 0.25, 0.45);
    const targa = fra(ctx, 1, 2, 0.7, 0.55);
    const piccola = fra(ctx, 2, 3, 0.2, 0.65);
    const lingua = fra(ctx, 3, null, 0.2, 0.85);
    const lampeggia = locale > piccola && locale < piccola + 40 ? 0.5 + 0.5 * Math.sin((locale - piccola) / 3) : 0;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="L'insegna" />
        <Compare v={molla(locale, 4, fps, true)} cx={520} cy={430}>
          <Negozio x={520} y={560} s={1.3} />
        </Compare>
        {/* L'insegna sopra la tenda. */}
        <Compare v={molla(locale, insegna, fps)} cx={520} cy={318}>
          <rect x={385} y={284} width={270} height={68} rx={16} fill={TINTE.accento} />
          <Testo x={520} y={319} corpo={38} titolo peso={800} colore={TINTE.carta}>
            Insegna
          </Testo>
        </Compare>
        <Freccia d="M 660 300 Q 760 250 828 214" p={tra(locale, municipio - 4, municipio + 8)} />
        <Compare v={molla(locale, municipio, fps)} cx={890} cy={200}>
          <Foglio x={835} y={110} w={110} h={150}>
            <Righe x={850} y={156} w={60} n={2} passo={24} />
          </Foglio>
          <g opacity={tra(locale, municipio + 8, municipio + 14)}>
            <Timbro cx={890} cy={220} r={28} />
          </g>
          <Pillola x={890} y={292} testo="Municipio" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {/* Le scritte sulla vetrina e la targa piccola: libere. */}
        <g opacity={tra(locale, vetrina, vetrina + 10)}>
          <Testo x={462} y={472} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Aperto
          </Testo>
        </g>
        <Compare v={molla(locale, targa, fps)} cx={636} cy={464}>
          <rect x={617} y={450} width={38} height={28} rx={6} fill={TINTE.crema} stroke={lampeggia > 0 ? TINTE.accento : TINTE.tratto} strokeWidth={4 + lampeggia * 3} />
          <line x1={625} y1={464} x2={647} y2={464} stroke={TINTE.tratto} strokeWidth={4} strokeLinecap="round" />
        </Compare>
        <Spunta cx={722} cy={400} r={22} p={tra(locale, vetrina, vetrina + 12)} />
        <g opacity={tra(locale, vetrina + 4, vetrina + 12)}>
          <Testo x={754} y={401} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Scritte in vetrina
          </Testo>
        </g>
        <Spunta cx={722} cy={460} r={22} p={tra(locale, targa, targa + 12)} />
        <g opacity={tra(locale, targa + 4, targa + 12)}>
          <Testo x={754} y={461} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Targa piccola
          </Testo>
        </g>
        <g opacity={tra(locale, piccola, piccola + 10)}>
          <Testo x={754} y={492} corpo={20} colore={TINTE.accento} ancora="start">
            non luminosa
          </Testo>
          <Testo x={754} y={518} corpo={20} colore={TINTE.accento} ancora="start">
            solo nome e logo
          </Testo>
        </g>
        <Compare v={molla(locale, lingua, fps)} cx={830} cy={600}>
          <rect x={690} y={540} width={280} height={120} rx={18} fill={TINTE.crema} stroke={TINTE.tratto} strokeWidth={5} />
          <Testo x={830} y={584} corpo={40} titolo peso={800} colore={TINTE.tratto}>
            Benvenuti
          </Testo>
          <Testo x={830} y={630} corpo={22} colore={TINTE.tratto} opacita={0.75}>
            Welcome · Willkommen
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 9. «Ogni merce deve avere il suo prezzo in franchi, sulla merce o vicino. In vetrina … da fuori. Per servizi … indica i prezzi con un listino.» */
const MERCI = [
  { x: 390, colore: TINTE.accento },
  { x: 480, colore: TEAL_CHIARO },
  { x: 570, colore: TINTE.oro },
] as const;
const locPrezzi: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.3, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "tocca", quando: fra(ctx, 1, 2, 0.3, 0.4) + 8, bersaglio: { x: 348, y: 296 } },
      { tipo: "festeggia", quando: fra(ctx, 4, null, 0.3, 0.9) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const scaffale = fra(ctx, null, 0, 0.4, 0.08);
    const merci = fra(ctx, 0, 1, 0.15, 0.2);
    const cartellini = fra(ctx, 0, 1, 0.65, 0.3);
    const vicino = fra(ctx, 1, 2, 0.2, 0.4);
    const vetrina = fra(ctx, 2, 3, 0.15, 0.55);
    const servizi = fra(ctx, 3, 4, 0.2, 0.75);
    const listino = fra(ctx, 4, null, 0.15, 0.88);
    const pulsa = locale > vicino && locale < vicino + 30 ? 1 + 0.12 * Math.sin((locale - vicino) / 2.5) : 1;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="I prezzi" />
        {/* Lo scaffale con le merci e i cartellini. */}
        <Compare v={molla(locale, scaffale, fps, true)} cx={480} cy={260}>
          <rect x={330} y={140} width={300} height={14} rx={7} fill={TINTE.tratto} />
          <rect x={330} y={262} width={300} height={14} rx={7} fill={TINTE.tratto} />
          <rect x={336} y={140} width={10} height={170} rx={5} fill={TINTE.tratto} />
          <rect x={614} y={140} width={10} height={170} rx={5} fill={TINTE.tratto} />
        </Compare>
        {MERCI.map((m, i) => (
          <Compare key={m.x} v={molla(locale, merci + i * 5, fps)} cx={m.x} cy={230}>
            {i === 0 ? (
              <path d={`M ${m.x - 22} 262 q -10 -40 10 -70 h 24 q 20 30 10 70 Z`} fill={m.colore} stroke={TINTE.tratto} strokeWidth={4} />
            ) : i === 1 ? (
              <rect x={m.x - 32} y={202} width={64} height={60} rx={8} fill={m.colore} stroke={TINTE.tratto} strokeWidth={4} />
            ) : (
              <g>
                <path d={`M ${m.x - 30} 262 l 6 -54 h 48 l 6 54 Z`} fill={m.colore} stroke={TINTE.tratto} strokeWidth={4} strokeLinejoin="round" />
                <path d={`M ${m.x - 12} 208 q 12 -24 24 0`} fill="none" stroke={TINTE.tratto} strokeWidth={4} />
              </g>
            )}
          </Compare>
        ))}
        {MERCI.map((m, i) => (
          <Compare key={`c${m.x}`} v={molla(locale, cartellini + i * 5, fps) * pulsa} cx={m.x} cy={296}>
            <Cartellino cx={m.x} cy={296} s={0.85} />
          </Compare>
        ))}
        {/* La vetrina, letta da fuori. */}
        <Compare v={molla(locale, vetrina, fps)} cx={820} cy={280}>
          <rect x={690} y={150} width={260} height={250} rx={16} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={7} />
          <line x1={712} y1={180} x2={760} y2={228} stroke={TINTE.carta} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
          <path d="M 790 360 l 10 -80 h 60 l 10 80 Z" fill={TINTE.accento} stroke={TINTE.tratto} strokeWidth={4} strokeLinejoin="round" />
          <path d="M 812 280 q 18 -30 36 0" fill="none" stroke={TINTE.tratto} strokeWidth={5} />
          <Cartellino cx={760} cy={330} s={1.05} />
        </Compare>
        <Compare v={molla(locale, vetrina + 10, fps)} cx={830} cy={560}>
          <Persona x={830} y={640} s={0.75} colore={TEAL_CHIARO} />
        </Compare>
        {/* Il listino dei servizi. */}
        <Compare v={molla(locale, servizi, fps)} cx={600} cy={560}>
          <Forbici cx={620} cy={560} s={1} />
        </Compare>
        <Compare v={molla(locale, listino, fps)} cx={430} cy={560}>
          <Foglio x={340} y={460} w={180} h={200}>
            <Testo x={420} y={500} corpo={26} titolo peso={800} colore={TINTE.tratto}>
              Listino
            </Testo>
            {[540, 580, 620].map((y) => (
              <g key={y}>
                <line x1={360} y1={y} x2={430} y2={y} stroke={TINTE.tinta} strokeWidth={9} strokeLinecap="round" />
                <Testo x={478} y={y + 1} corpo={18} titolo peso={800} colore={TINTE.accento}>
                  CHF
                </Testo>
              </g>
            ))}
          </Foglio>
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Vendi superalcolici …? Serve la patente di vendita distillati della Polizia cantonale. La chiedi almeno … giorni prima. Per la birra … non serve.» */
const locDistillati: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.2) },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.4) + 6 },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.3, 0.85) + 10 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const bottiglie = fra(ctx, null, 0, 0.15, 0.06);
    const livello = tra(locale, bottiglie + 14, fra(ctx, null, 0, 0.8, 0.3));
    const patente = fra(ctx, 0, 1, 0.25, 0.4);
    const prima = fra(ctx, 1, 2, 0.2, 0.6);
    const birra = fra(ctx, 2, null, 0.2, 0.85);
    const soglia = 300;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Superalcolici" />
        <Compare v={molla(locale, bottiglie, fps)} cx={450} cy={300}>
          <Bottiglia cx={400} base={400} alta colore={TINTE.oro} />
          <Bottiglia cx={490} base={400} colore="#7a2a3a" />
        </Compare>
        {/* Il misuratore dell'alcol: supera la linea rossa. */}
        <Compare v={molla(locale, bottiglie + 6, fps)} cx={590} cy={300}>
          <rect x={572} y={200} width={36} height={200} rx={18} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <rect x={578} y={394 - 188 * (0.15 + 0.7 * livello)} width={24} height={188 * (0.15 + 0.7 * livello)} rx={12} fill={TINTE.accento} />
          <line x1={556} y1={soglia} x2={624} y2={soglia} stroke={TINTE.rischio} strokeWidth={6} strokeLinecap="round" />
        </Compare>
        <Compare v={molla(locale, patente, fps)} cx={790} cy={200}>
          <Foglio x={730} y={100} w={120} h={170}>
            <Testo x={782} y={164} corpo={22} titolo peso={800} colore={TINTE.tratto}>
              Patente
            </Testo>
            <Righe x={748} y={192} w={70} n={1} />
          </Foglio>
          <g opacity={tra(locale, patente + 8, patente + 14)}>
            <Timbro cx={790} cy={236} r={24} />
          </g>
        </Compare>
        <Compare v={molla(locale, patente + 8, fps)} cx={790} cy={300}>
          <Pillola x={790} y={300} testo="Polizia cantonale" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, prima, fps)} cx={790} cy={455}>
          <Calendario cx={790} cy={460} s={0.7} />
          <Freccia d="M 870 470 Q 900 420 862 392" p={tra(locale, prima + 6, prima + 16)} colore={TINTE.accento} spessore={6} />
          <Pillola x={790} y={548} testo="Prima di vendere" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, birra, fps)} cx={410} cy={570}>
          <Boccale cx={400} base={630} />
        </Compare>
        <Spunta cx={500} cy={505} r={24} p={tra(locale, birra + 8, birra + 20)} />
        <Compare v={molla(locale, birra + 12, fps)} cx={600} cy={640}>
          <Pillola x={600} y={640} testo="Birra: senza patente" corpo={24} fondo={TINTE.crema} colore={TINTE.ok} bordo={TINTE.ok} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_LOCALI_PUBBLICO: Record<string, Disegno> = {
  "loc-quale": locQuale,
  "loc-negozio": locNegozio,
  "loc-orari": locOrari,
  "loc-domenica": locDomenica,
  "loc-deroga": locDeroga,
  "loc-licenza": locLicenza,
  "loc-insegna": locInsegna,
  "loc-prezzi": locPrezzi,
  "loc-distillati": locDistillati,
};
