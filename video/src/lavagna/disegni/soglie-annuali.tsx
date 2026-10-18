/**
 * I disegni della lezione 23 («A fine anno controlla le soglie»), vedi
 * src/lezioni/soglie-annuali.ts. Fonti: CO artt. 931 e 957, LIVA artt. 10,
 * 14, 21, 34 e 66, OIVA art. 9, pagina dell'AFC sull'assoggettamento, info
 * IVA 02 e lo strumento «I tuoi conti» (src/app/conti). Coordinate della tela
 * 1000×700; l'angolo in basso a sinistra (x < 300, y > 480) è della finestra
 * di Bleo, la bussolina aspetta in (200, 450). Niente cifre: soglie, giorni e
 * mesi li dice solo la voce (i mesi si vedono come caselle, le soglie come
 * linee tratteggiate).
 */
import type { ReactNode } from "react";
import { Compare, Foglio, Freccia, molla, Moneta, Palazzo, Persona, Pillola, Registro, Righe, Spunta, Testo, TINTE, tra, Valigetta } from "../figure";
import { Tela } from "./ditta-individuale";
import { elenco } from "./documenti-sagl";
import { COLORE_TENUE, Righe2 } from "./forme-giuridiche";
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

const POSTO = { x: 200, y: 450 } as const;
const ROSSO_SVIZZERO = "#d52b1e";
const VERDE_TENUE = "#e3f1ea";

/* ---------------------------------------------------------------------------
 * Figure di questa lezione
 * ------------------------------------------------------------------------- */

/** Un bollino rosso con la croce bianca (p da 0 a 1): «no». */
function No({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: number }) {
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

/** La soglia: una linea rossa tratteggiata da x1 a x2. */
function Soglia({ x1, x2, y, opacita = 1, colore = TINTE.rischio }: { x1: number; x2: number; y: number; opacita?: number; colore?: string }) {
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={colore} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" opacity={opacita} />;
}

/** L'etichetta «Soglia» nei colori del rischio. */
function EtichettaSoglia({ x, y }: { x: number; y: number }) {
  return <Pillola x={x} y={y} testo="Soglia" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />;
}

/** Una colonna che cresce dalla base `base` fino a `cima` (p da 0 a 1). */
function Colonna({ x, w, base, cima, p, fondo = TINTE.tinta, bordo = TINTE.tratto }: { x: number; w: number; base: number; cima: number; p: number; fondo?: string; bordo?: string }) {
  const h = (base - cima) * p;
  if (h <= 1) return null;
  return <rect x={x - w / 2} y={base - h} width={w} height={h} rx={12} fill={fondo} stroke={bordo} strokeWidth={6} />;
}

/** Un calendario da muro con dodici caselle (i mesi, senza numeri): l'ultima è quella in evidenza. */
function Calendario({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-64} y={-60} width={128} height={124} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-64} y={-60} width={128} height={34} rx={14} fill={TINTE.accento} />
      <rect x={-64} y={-40} width={128} height={14} fill={TINTE.accento} />
      {Array.from({ length: 12 }, (_, k) => (
        <rect key={k} x={-48 + (k % 4) * 26} y={-12 + Math.floor(k / 4) * 24} width={18} height={14} rx={4} fill={k === 11 ? TINTE.accento : TINTE.tinta} />
      ))}
      <line x1={-32} y1={-70} x2={-32} y2={-50} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
      <line x1={32} y1={-70} x2={32} y2={-50} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

/** Il quadrato rosso con la croce bianca: la Svizzera. */
function Svizzera({ cx, cy, lato = 40 }: { cx: number; cy: number; lato?: number }) {
  const b = lato * 0.19;
  const l = lato * 0.62;
  return (
    <g>
      <rect x={cx - lato / 2} y={cy - lato / 2} width={lato} height={lato} rx={lato * 0.14} fill={ROSSO_SVIZZERO} />
      <rect x={cx - b / 2} y={cy - l / 2} width={b} height={l} fill={TINTE.carta} />
      <rect x={cx - l / 2} y={cy - b / 2} width={l} height={b} fill={TINTE.carta} />
    </g>
  );
}

/** Un mappamondo: l'estero. */
function Mondo({ cx, cy, r = 22 }: { cx: number; cy: number; r?: number }) {
  return (
    <g fill="none" stroke={TINTE.tratto} strokeWidth={4}>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.tinta} />
      <ellipse cx={cx} cy={cy} rx={r * 0.45} ry={r} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} />
      <path d={`M ${cx - r * 0.86} ${cy - r * 0.5} H ${cx + r * 0.86} M ${cx - r * 0.86} ${cy + r * 0.5} H ${cx + r * 0.86}`} strokeWidth={3} />
    </g>
  );
}

/** Una croce bianca su un tondo rosso: le cure mediche. */
function Croce({ cx, cy, r = 30 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.rischio} />
      <rect x={cx - r * 0.23} y={cy - r * 0.6} width={r * 0.46} height={r * 1.2} rx={r * 0.09} fill={TINTE.carta} />
      <rect x={cx - r * 0.6} y={cy - r * 0.23} width={r * 1.2} height={r * 0.46} rx={r * 0.09} fill={TINTE.carta} />
    </g>
  );
}

/** Un libro aperto, centrato in (cx, cy): l'insegnamento, o la contabilità. */
function Libro({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} strokeLinejoin="round">
      <path d="M 0 -26 Q -26 -40 -56 -32 V 30 Q -26 22 0 36 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d="M 0 -26 Q 26 -40 56 -32 V 30 Q 26 22 0 36 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d="M -44 -14 Q -24 -20 -10 -12 M -44 2 Q -24 -4 -10 4 M 10 -12 Q 24 -20 44 -14 M 10 4 Q 24 -4 44 2" fill="none" stroke={TINTE.tinta} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

/** Un pacco regalo con il fiocco, centrato in (cx, cy): i doni. */
function Regalo({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} strokeLinejoin="round">
      {/* il fiocco */}
      <path d="M 0 -26 C -10 -52 -40 -50 -32 -34 C -28 -26 -12 -26 0 -26 Z" fill={TINTE.rischio} />
      <path d="M 0 -26 C 10 -52 40 -50 32 -34 C 28 -26 12 -26 0 -26 Z" fill={TINTE.rischio} />
      {/* la scatola e il coperchio */}
      <rect x={-36} y={-12} width={72} height={50} rx={7} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
      <rect x={-42} y={-28} width={84} height={20} rx={6} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
      {/* il nastro */}
      <rect x={-8} y={-28} width={16} height={66} fill={TINTE.rischio} />
    </g>
  );
}

/** Un edificio pubblico con le colonne, centrato in (cx, cy): chi dà i sussidi. */
function Istituzione({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} strokeLinejoin="round">
      <path d="M -46 -16 L 0 -42 L 46 -16 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      <rect x={-46} y={-18} width={92} height={8} fill={TINTE.tratto} />
      {[-32, -11, 11, 32].map((x) => (
        <rect key={x} x={x - 5} y={-10} width={10} height={36} rx={3} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={3} />
      ))}
      <rect x={-52} y={26} width={104} height={10} rx={4} fill={TINTE.tratto} />
    </g>
  );
}

/** Un cartellino del prezzo con scritto «IVA», centrato in (cx, cy). */
function CartellinoIva({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-10)`}>
      <path d="M -52 -28 H 28 L 56 0 L 28 28 H -52 Q -60 28 -60 20 V -20 Q -60 -28 -52 -28 Z" fill={TINTE.accento} />
      <circle cx={30} cy={0} r={7} fill={TINTE.carta} />
      <Testo x={-14} y={2} corpo={30} titolo peso={800} colore={TINTE.carta}>
        IVA
      </Testo>
    </g>
  );
}

/** Uno scontrino con il bordo in basso a zig-zag (angolo in alto a sinistra in x, y). */
function Scontrino({ x, y, w = 80, h = 110 }: { x: number; y: number; w?: number; h?: number }) {
  const denti = 5;
  const d = w / denti;
  let bordo = `M ${x} ${y + 10} q 0 -10 10 -10 H ${x + w - 10} q 10 0 10 10 V ${y + h}`;
  for (let i = 0; i < denti; i++) bordo += ` l ${-d / 2} -9 l ${-d / 2} 9`;
  bordo += " Z";
  return (
    <g>
      <path d={bordo} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
      {[0.24, 0.42, 0.6].map((f) => (
        <line key={f} x1={x + 14} y1={y + h * f} x2={x + w - (f === 0.42 ? 30 : 14)} y2={y + h * f} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
      ))}
      <line x1={x + 14} y1={y + h * 0.78} x2={x + w - 14} y2={y + h * 0.78} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

/** Una fattura: un foglio con le righe e l'importo in fondo (angolo in alto a sinistra in x, y). */
function Fattura({ x, y, w = 120, h = 150 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <Foglio x={x} y={y} w={w} h={h}>
      <Righe x={x + 18} y={y + 52} w={w - 52} n={3} passo={24} />
      <line x1={x + w * 0.45} y1={y + h - 28} x2={x + w - 18} y2={y + h - 28} stroke={TINTE.accento} strokeWidth={9} strokeLinecap="round" />
    </Foglio>
  );
}

/** Una clessidra (p da 0 a 1: la sabbia scende), centrata in (cx, cy). */
function Clessidra({ cx, cy, p, s = 1 }: { cx: number; cy: number; p: number; s?: number }) {
  const sopra = 1 - p;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-46} y={-74} width={92} height={14} rx={7} fill={TINTE.accento} />
      <rect x={-46} y={60} width={92} height={14} rx={7} fill={TINTE.accento} />
      <path d="M -36 -60 H 36 Q 36 -16 6 0 Q 36 16 36 60 H -36 Q -36 16 -6 0 Q -36 -16 -36 -60 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M ${-26 * sopra} ${-8 - 40 * sopra} H ${26 * sopra} L 0 -4 Z`} fill={TINTE.oro} opacity={sopra > 0.02 ? 1 : 0} />
      <path d={`M -32 54 H 32 L ${32 - 22 * (1 - p)} ${54 - 40 * (0.25 + 0.75 * p)} H ${-32 + 22 * (1 - p)} Z`} fill={TINTE.oro} />
      <line x1={0} y1={-4} x2={0} y2={50} stroke={TINTE.oro} strokeWidth={3} opacity={p > 0 && p < 1 ? 1 : 0} />
    </g>
  );
}

/** Una busta chiusa centrata in (cx, cy). */
function Busta({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-50} y={-34} width={100} height={68} rx={10} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d="M -46 -28 L 0 6 L 46 -28" fill="none" stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** Un lucchetto chiuso centrato in (cx, cy): «resti iscritto». */
function Lucchetto({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M -16 -6 V -22 a 16 16 0 0 1 32 0 V -6" fill="none" stroke={TINTE.accento} strokeWidth={8} strokeLinecap="round" />
      <rect x={-26} y={-8} width={52} height={42} rx={10} fill={TINTE.accento} />
      <circle cx={0} cy={10} r={6} fill={TINTE.carta} />
    </g>
  );
}

/** Una campanella che oscilla: l'avviso. */
function Campanella({ cx, cy, s = 1, locale }: { cx: number; cy: number; s?: number; locale: number }) {
  const oscilla = Math.sin(locale / 3) * 14;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(${oscilla} 0 -30)`}>
      <path d="M -26 14 Q -26 -26 0 -28 Q 26 -26 26 14 L 34 22 H -34 Z" fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={0} cy={30} r={8} fill={TINTE.accento} />
      <circle cx={0} cy={-32} r={6} fill={TINTE.accento} />
    </g>
  );
}

/** Uno smartphone centrato in (cx, cy); lo schermo va dentro. */
function Telefono({ cx, cy, w, h, children }: { cx: number; cy: number; w: number; h: number; children?: ReactNode }) {
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={30} fill={TINTE.tratto} />
      <rect x={cx - w / 2 + 12} y={cy - h / 2 + 34} width={w - 24} height={h - 64} rx={12} fill={TINTE.carta} />
      <rect x={cx - 22} y={cy - h / 2 + 14} width={44} height={8} rx={4} fill={TINTE.tinta} />
      {children}
    </g>
  );
}

/** Una lezione del corso: lo schermo di un video con il tasto play, centrato in (cx, cy). */
function SchermoLezione({ cx, cy, w = 170, h = 100 }: { cx: number; cy: number; w?: number; h?: number }) {
  // Il triangolo è centrato nel suo baricentro, per stare in mezzo al tondo.
  const r = h * 0.26;
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={16} fill={TINTE.tratto} />
      <circle cx={cx} cy={cy - 6} r={r} fill={TINTE.carta} />
      <path d={`M ${cx - r * 0.3} ${cy - 6 - r * 0.45} L ${cx + r * 0.6} ${cy - 6} L ${cx - r * 0.3} ${cy - 6 + r * 0.45} Z`} fill={TINTE.tratto} />
      <rect x={cx - w / 2 + 16} y={cy + h / 2 - 16} width={w - 32} height={6} rx={3} fill="#0b4954" />
      <rect x={cx - w / 2 + 16} y={cy + h / 2 - 16} width={(w - 32) * 0.4} height={6} rx={3} fill={TINTE.oro} />
    </g>
  );
}

/** Una freccia piena verso l'alto (entrata) o verso il basso (uscita), centrata in (cx, cy). */
function FrecciaSoldi({ cx, cy, su, s = 1 }: { cx: number; cy: number; su: boolean; s?: number }) {
  const colore = su ? TINTE.ok : TINTE.rischio;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(${su ? 0 : 180})`}>
      <path d="M 0 -34 L 26 -6 H 10 V 32 H -10 V -6 H -26 Z" fill={colore} strokeLinejoin="round" />
    </g>
  );
}

/* ---------------------------------------------------------------------------
 * Le scene
 * ------------------------------------------------------------------------- */

/* 2. «Quando? Alla fine di ogni esercizio, cioè dell'anno della tua contabilità. Tre regole guardano proprio la cifra d'affari di quell'anno: registro di commercio, IVA e contabilità.» */
const CAL = { cx: 450, cy: 250, s: 1.45 } as const;
/** L'ultima casella del calendario (la k = 11), nelle coordinate della tela. */
const ULTIMA = { x: CAL.cx + 39 * CAL.s, y: CAL.cy + 43 * CAL.s } as const;
const TRE = [
  { x: 430, testo: ["Registro", "di commercio"] },
  { x: 650, testo: ["IVA"] },
  { x: 870, testo: ["Contabilità"] },
] as const;
const MONETE_QUANDO = [
  [770, 300],
  [814, 300],
  [858, 300],
  [792, 262],
  [836, 262],
  [814, 224],
] as const;
const sogQuando: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.45, 0.25),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.25) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.8, 0.92) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const calendario = fra(ctx, null, 0, 0.4, 0.04);
    const fine = fra(ctx, 0, 1, 0.45, 0.25);
    const freccia = fra(ctx, 1, 2, 0.1, 0.45);
    const cifra = fra(ctx, 1, 2, 0.3, 0.5);
    const regole = [fra(ctx, 2, null, 0.15, 0.78), fra(ctx, 2, null, 0.5, 0.85), fra(ctx, 2, null, 0.78, 0.92)];
    const impulso = tra(locale, fine, fine + 20);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="A fine esercizio" />
        {/* L'anno della contabilità, con l'ultimo mese in evidenza. */}
        <Compare v={molla(locale, calendario, fps, true)} cx={CAL.cx} cy={CAL.cy}>
          <Calendario cx={CAL.cx} cy={CAL.cy} s={CAL.s} />
        </Compare>
        {impulso > 0 && impulso < 1 ? <circle cx={ULTIMA.x} cy={ULTIMA.y} r={16 + impulso * 40} fill="none" stroke={TINTE.accento} strokeWidth={5} opacity={1 - impulso} /> : null}
        <Compare v={molla(locale, fine, fps)} cx={CAL.cx} cy={400}>
          <Pillola x={CAL.cx} y={400} testo="Fine dell'esercizio" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* La cifra d'affari di quell'anno. */}
        <Freccia d="M 565 255 H 712" p={tra(locale, freccia, freccia + 14)} colore={TINTE.tratto} spessore={7} />
        {MONETE_QUANDO.map(([x, y], k) => (
          <Compare key={`${x}-${y}`} v={molla(locale, cifra + k * 2, fps)} cx={x} cy={y}>
            <Moneta cx={x} cy={y} r={22} />
          </Compare>
        ))}
        <Compare v={molla(locale, cifra + 10, fps)} cx={814} cy={360}>
          <Righe2 x={814} y={356} righe={["Cifra d'affari", "dell'esercizio"]} corpo={24} passo={30} />
        </Compare>
        {/* Le tre regole che la guardano. */}
        {TRE.map((r, i) => (
          <g key={r.x}>
            <Freccia d={`M 814 420 L ${r.x + (814 - r.x) * 0.12} ${462}`} p={tra(locale, regole[i] - 8, regole[i] + 2)} colore={COLORE_TENUE} spessore={5} />
            <Compare v={molla(locale, regole[i], fps)} cx={r.x} cy={540}>
              {i === 0 ? <Registro x={r.x} y={572} s={0.72} /> : i === 1 ? <CartellinoIva cx={r.x} cy={528} s={0.95} /> : <Libro cx={r.x} cy={530} s={0.95} />}
              <Righe2 x={r.x} y={600} righe={[...r.testo]} corpo={24} passo={28} />
            </Compare>
          </g>
        ))}
      </Tela>
    );
  },
};

/* 3. «Cosa sommi? Tutto quello che hai fatturato nell'esercizio, ai clienti in Svizzera e all'estero, senza l'IVA. Conta la cifra d'affari, non l'utile: le spese non le togli.» */
const FATTURE = [360, 520, 680] as const;
const sogSomma: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.85, 0.3),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.85, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.3, 0.75) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const fatture = FATTURE.map((_, i) => fra(ctx, 0, 1, 0.1 + i * 0.22, 0.12 + i * 0.05));
    const somma = fra(ctx, 0, 1, 0.85, 0.3);
    const svizzera = fra(ctx, 1, 2, 0.2, 0.4);
    const estero = fra(ctx, 1, 2, 0.5, 0.48);
    const iva = fra(ctx, 1, 2, 0.8, 0.56);
    const cifra = fra(ctx, 2, null, 0.12, 0.66);
    const utile = fra(ctx, 2, null, 0.35, 0.76);
    const spese = fra(ctx, 2, null, 0.65, 0.88);
    const frecce = tra(locale, somma - 10, somma + 6);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cosa sommi" />
        {/* Le fatture dell'esercizio. */}
        {FATTURE.map((x, i) => (
          <Compare key={x} v={molla(locale, fatture[i], fps)} cx={x + 60} cy={165}>
            <Fattura x={x} y={90} />
          </Compare>
        ))}
        {/* In Svizzera e all'estero. */}
        {[0, 1].map((i) => (
          <Compare key={i} v={molla(locale, svizzera + i * 4, fps)} cx={FATTURE[i] + 114} cy={244}>
            <Svizzera cx={FATTURE[i] + 114} cy={244} lato={38} />
          </Compare>
        ))}
        <Compare v={molla(locale, estero, fps)} cx={FATTURE[2] + 114} cy={244}>
          <Mondo cx={FATTURE[2] + 114} cy={244} r={21} />
        </Compare>
        {/* Si sommano: la cifra d'affari. */}
        <Freccia d="M 420 252 Q 440 300 500 318" p={frecce} colore={TINTE.tratto} spessore={6} />
        <Freccia d="M 580 252 V 300" p={frecce} colore={TINTE.tratto} spessore={6} />
        <Freccia d="M 740 252 Q 720 300 660 318" p={frecce} colore={TINTE.tratto} spessore={6} />
        <Compare v={molla(locale, somma + 6, fps)} cx={580} cy={348}>
          <Pillola x={580} y={348} testo="Cifra d'affari" corpo={30} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {/* Senza l'IVA. */}
        <Compare v={molla(locale, iva, fps)} cx={820} cy={348}>
          <Pillola x={820} y={348} testo="IVA" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <No cx={852} cy={326} r={18} p={tra(locale, iva + 8, iva + 22)} />
        {/* Conta la cifra d'affari, non l'utile. */}
        <Compare v={molla(locale, cifra, fps)} cx={400} cy={460}>
          <Spunta cx={400} cy={460} r={24} p={tra(locale, cifra + 4, cifra + 18)} />
          <Testo x={436} y={461} corpo={30} titolo peso={800} colore={TINTE.tratto} ancora="start">
            La cifra d&apos;affari
          </Testo>
        </Compare>
        <Compare v={molla(locale, utile, fps)} cx={400} cy={536}>
          <No cx={400} cy={536} r={24} p={tra(locale, utile + 4, utile + 18)} />
          <Testo x={436} y={537} corpo={30} titolo peso={800} colore={COLORE_TENUE} ancora="start">
            Non l&apos;utile
          </Testo>
        </Compare>
        {/* Le spese non si tolgono. */}
        <Compare v={molla(locale, spese, fps)} cx={850} cy={500}>
          <Scontrino x={772} y={424} w={74} h={100} />
          <circle cx={902} cy={470} r={28} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={5} />
          <line x1={887} y1={470} x2={917} y2={470} stroke={TINTE.rischio} strokeWidth={8} strokeLinecap="round" />
          <Testo x={850} y={570} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Le spese non le togli
          </Testo>
        </Compare>
        <No cx={926} cy={444} r={17} p={tra(locale, spese + 10, spese + 24)} />
      </Tela>
    );
  },
};

/* 4. «Per la soglia dell'IVA, però, non contano le prestazioni escluse dall'imposta, come molte cure mediche e l'insegnamento. E nemmeno i doni e i sussidi.» */
const CARTE = [
  { x: 410, testo: "Cure mediche" },
  { x: 570, testo: "Insegnamento" },
  { x: 730, testo: "Doni" },
  { x: 890, testo: "Sussidi" },
] as const;
const CARTA = { y: 350, w: 128, h: 118 } as const;
const MONETE_SCATOLA = [
  [578, 214],
  [622, 214],
  [666, 214],
  [710, 214],
  [600, 176],
  [644, 176],
  [688, 176],
] as const;
const sogEscluse: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.65, 0.4),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.65, 0.4) },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.5, 0.9) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const scatola = fra(ctx, null, 0, 0.12, 0.06);
    const escluse = fra(ctx, null, 0, 0.65, 0.4);
    const carte = [fra(ctx, 0, 1, 0.02, 0.5), fra(ctx, 0, 1, 0.5, 0.66), fra(ctx, 1, null, 0.08, 0.8), fra(ctx, 1, null, 0.5, 0.9)];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Per l'IVA non contano" />
        {/* La cifra d'affari che conta per la soglia dell'IVA. */}
        <Compare v={molla(locale, scatola, fps, true)} cx={644} cy={190}>
          <rect x={520} y={110} width={248} height={136} rx={24} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          {MONETE_SCATOLA.map(([x, y]) => (
            <Moneta key={`${x}-${y}`} cx={x} cy={y} r={20} />
          ))}
          <Soglia x1={534} x2={754} y={140} />
          <Testo x={644} y={274} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Per la soglia dell&apos;IVA
          </Testo>
        </Compare>
        {/* Le prestazioni escluse. */}
        <Compare v={molla(locale, escluse, fps)} cx={490} cy={318}>
          <path d={`M ${CARTE[0].x - 56} 330 V 318 H ${CARTE[1].x + 56} V 330`} fill="none" stroke={TINTE.accento} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <Pillola x={490} y={312} testo="Prestazioni escluse" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {CARTE.map((c, i) => (
          <g key={c.x}>
            <Compare v={molla(locale, carte[i], fps)} cx={c.x} cy={CARTA.y + CARTA.h / 2}>
              <rect x={c.x - CARTA.w / 2} y={CARTA.y} width={CARTA.w} height={CARTA.h} rx={20} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
              {i === 0 ? <Croce cx={c.x} cy={CARTA.y + 58} r={32} /> : null}
              {i === 1 ? <Libro cx={c.x} cy={CARTA.y + 60} s={0.86} /> : null}
              {i === 2 ? <Regalo cx={c.x} cy={CARTA.y + 64} s={0.95} /> : null}
              {i === 3 ? (
                <g>
                  <Istituzione cx={c.x - 8} cy={CARTA.y + 62} s={0.82} />
                  <Moneta cx={c.x + 38} cy={CARTA.y + 82} r={16} />
                </g>
              ) : null}
              <Testo x={c.x} y={CARTA.y + CARTA.h + 30} corpo={22} titolo peso={800} colore={TINTE.tratto}>
                {c.testo}
              </Testo>
            </Compare>
            <No cx={c.x + CARTA.w / 2 - 8} cy={CARTA.y + 8} r={20} p={tra(locale, carte[i] + 10, carte[i] + 24)} />
          </g>
        ))}
      </Tela>
    );
  },
};

/* 5. «Prima soglia, il registro di commercio. Se nell'ultimo esercizio sei arrivato ad almeno …, iscriverti diventa obbligatorio. Come si fa, te l'ho spiegato nella lezione ….» */
const RC = { x: 740, w: 120, base: 560, soglia: 330, cima: 250 } as const;
const sogRegistro: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.15, 0.6),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.15, 0.6) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.35, 0.86) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const registro = fra(ctx, null, 0, 0.25, 0.06);
    const soglia = fra(ctx, 0, 1, 0.05, 0.22);
    const cresce = fra(ctx, 0, 1, 0.3, 0.3);
    const obbligo = fra(ctx, 1, 2, 0.15, 0.6);
    const lezione = fra(ctx, 2, null, 0.3, 0.85);
    const p = tra(locale, cresce, cresce + 48);
    const supera = RC.base - (RC.base - RC.cima) * p <= RC.soglia;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il registro di commercio" />
        <Compare v={molla(locale, registro, fps, true)} cx={430} cy={210}>
          <Registro x={430} y={262} s={1.4} />
          <Righe2 x={430} y={300} righe={["Registro", "di commercio"]} corpo={26} passo={32} />
        </Compare>
        {/* La cifra d'affari dell'ultimo esercizio sale fino alla soglia. */}
        <Compare v={molla(locale, 4, fps, true)} cx={RC.x} cy={RC.base}>
          <line x1={600} y1={RC.base} x2={940} y2={RC.base} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
          <Testo x={RC.x} y={RC.base + 34} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Ultimo esercizio
          </Testo>
        </Compare>
        <g opacity={tra(locale, soglia, soglia + 10)}>
          <Soglia x1={600} x2={940} y={RC.soglia} />
          <EtichettaSoglia x={880} y={RC.soglia - 30} />
        </g>
        <Colonna x={RC.x} w={RC.w} base={RC.base} cima={RC.cima} p={p} />
        {supera ? <circle cx={RC.x} cy={RC.soglia} r={11} fill={TINTE.rischio} /> : null}
        {/* Diventa obbligatorio. */}
        <Freccia d={`M ${RC.x - 30} ${RC.cima - 18} Q 640 170 540 196`} p={tra(locale, obbligo - 6, obbligo + 10)} colore={TINTE.accento} spessore={7} />
        <Compare v={molla(locale, obbligo + 6, fps)} cx={430} cy={392}>
          <Pillola x={430} y={392} testo="Obbligatoria" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* Come si fa: nella sua lezione. */}
        <Compare v={molla(locale, lezione, fps)} cx={470} cy={540}>
          <SchermoLezione cx={470} cy={520} />
          <Testo x={470} y={604} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Rivedi la lezione
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Poi l'IVA. Se non eri assoggettato dall'inizio, lo diventi alla fine dell'esercizio in cui hai raggiunto …. Da lì hai … giorni per annunciarti all'AFC: è nella lezione ….» */
const ANNI = { a: [340, 630], b: [660, 950], y: 116, h: 210, soglia: 196 } as const;
const sogIva: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.62, 0.5),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.62, 0.5) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.62, 0.9) + 10 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const anni = fra(ctx, null, 0, 0.4, 0.03);
    const soglia = fra(ctx, 0, 1, 0.15, 0.12);
    const senza = fra(ctx, 0, 1, 0.45, 0.18);
    const cresce = fra(ctx, 1, 2, 0.05, 0.28);
    const fine = fra(ctx, 1, 2, 0.62, 0.5);
    const clessidra = fra(ctx, 2, null, 0.12, 0.68);
    const busta = fra(ctx, 2, null, 0.42, 0.8);
    const afc = fra(ctx, 2, null, 0.62, 0.88);
    const [a0, a1] = ANNI.a;
    const [b0, b1] = ANNI.b;
    const base = ANNI.y + ANNI.h - 14;
    const cima = ANNI.y + 24;
    const linea = tra(locale, cresce, cresce + 50);
    // Dove la linea passa la soglia, nel primo esercizio.
    const fSoglia = (base - ANNI.soglia) / (base - cima);
    const xSoglia = a0 + 16 + (a1 - a0 - 32) * fSoglia;
    const dopo = fine <= locale;
    const volo = tra(locale, busta, busta + 20);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="L'IVA" />
        {/* Due esercizi: quello in cui raggiungi la soglia e quello dopo. */}
        <Compare v={molla(locale, anni, fps, true)} cx={(a0 + a1) / 2} cy={ANNI.y + ANNI.h / 2}>
          <rect x={a0} y={ANNI.y} width={a1 - a0} height={ANNI.h} rx={18} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <Testo x={(a0 + a1) / 2} y={ANNI.y + ANNI.h + 30} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Questo esercizio
          </Testo>
        </Compare>
        <Compare v={molla(locale, anni + 6, fps, true)} cx={(b0 + b1) / 2} cy={ANNI.y + ANNI.h / 2}>
          <rect x={b0} y={ANNI.y} width={b1 - b0} height={ANNI.h} rx={18} fill={dopo ? VERDE_TENUE : TINTE.carta} stroke={dopo ? TINTE.ok : TINTE.tratto} strokeWidth={5} />
          <Testo x={(b0 + b1) / 2} y={ANNI.y + ANNI.h + 30} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Il prossimo
          </Testo>
        </Compare>
        <g opacity={tra(locale, soglia, soglia + 10)}>
          <Soglia x1={a0 + 10} x2={b1 - 10} y={ANNI.soglia} />
          <Testo x={b1 - 16} y={ANNI.soglia - 20} corpo={20} titolo peso={800} colore={TINTE.rischio} ancora="end">
            Soglia
          </Testo>
        </g>
        {/* All'inizio non eri assoggettato. */}
        <Compare v={molla(locale, senza, fps)} cx={400} cy={150}>
          <Pillola x={400} y={152} testo="IVA" corpo={22} fondo={TINTE.carta} colore={COLORE_TENUE} bordo={COLORE_TENUE} />
        </Compare>
        <No cx={426} cy={134} r={14} p={tra(locale, senza + 6, senza + 18)} />
        {/* La cifra d'affari cresce e raggiunge la soglia. */}
        <Freccia d={`M ${a0 + 16} ${base} L ${a1 - 16} ${cima}`} p={linea} colore={TINTE.accento} spessore={7} punta={false} />
        {linea > fSoglia ? <circle cx={xSoglia} cy={ANNI.soglia} r={11} fill={TINTE.rischio} /> : null}
        {/* Alla fine dell'esercizio: IVA da qui. */}
        <Compare v={molla(locale, fine + 4, fps)} cx={645} cy={ANNI.y + ANNI.h / 2}>
          <line x1={645} y1={ANNI.y - 8} x2={645} y2={ANNI.y + ANNI.h + 8} stroke={TINTE.ok} strokeWidth={8} strokeLinecap="round" />
        </Compare>
        <Compare v={molla(locale, fine, fps)} cx={805} cy={262}>
          <Pillola x={805} y={262} testo="IVA da qui" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Poi il tempo per annunciarti all'AFC. */}
        <Compare v={molla(locale, clessidra, fps)} cx={420} cy={520}>
          <Clessidra cx={420} cy={520} s={0.78} p={tra(locale, clessidra + 6, ctx.durata)} />
        </Compare>
        <Freccia d="M 480 520 H 520" p={tra(locale, busta - 6, busta + 4)} colore={TINTE.tratto} spessore={6} />
        {busta <= locale ? <Busta cx={560 + volo * 170} cy={520 - Math.sin(volo * Math.PI) * 40} s={0.72} /> : null}
        <Compare v={molla(locale, afc, fps)} cx={840} cy={560}>
          <Palazzo x={840} y={628} s={0.7} nome="AFC" />
        </Compare>
        <Compare v={molla(locale, afc + 6, fps)} cx={600} cy={612}>
          <Pillola x={600} y={612} testo="Annuncio all'AFC" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Il primo anno, se hai iniziato a metà anno, per l'IVA la cifra d'affari si riporta su un anno intero. Per esempio, … in sei mesi valgono come …: la soglia è raggiunta.» */
const MESI = { x: 350, passo: 50, w: 44, h: 40, y1: 128, y2: 250 } as const;
const BARRE7 = { base: 610, soglia: 430, a: 520, b: 760, w: 120 } as const;
const sogPrimoAnno: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.35, 0.3),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.35, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.2, 0.9) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const mesi = fra(ctx, null, 0, 0.1, 0.02);
    const meta = fra(ctx, null, 0, 0.55, 0.12);
    const intero = fra(ctx, 0, 1, 0.35, 0.3);
    const grafico = fra(ctx, 1, 2, 0, 0.5);
    const barraA = fra(ctx, 1, 2, 0.12, 0.55);
    const barraB = fra(ctx, 1, 2, 0.55, 0.72);
    const raggiunta = fra(ctx, 2, null, 0.15, 0.9);
    const centro = MESI.x + (MESI.passo * 12 - (MESI.passo - MESI.w)) / 2;
    const pB = tra(locale, barraB, barraB + 34);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il primo anno" />
        {/* Un anno di dodici mesi: l'attività parte a metà. */}
        {Array.from({ length: 12 }, (_, k) => {
          const x = MESI.x + k * MESI.passo;
          const attivo = k >= 6 && locale >= meta + (k - 6) * 3;
          return (
            <Compare key={k} v={molla(locale, mesi + k * 2, fps)} cx={x + MESI.w / 2} cy={MESI.y1 + MESI.h / 2}>
              <rect
                x={x}
                y={MESI.y1}
                width={MESI.w}
                height={MESI.h}
                rx={9}
                fill={attivo ? TINTE.accento : TINTE.carta}
                stroke={attivo ? TINTE.accento : COLORE_TENUE}
                strokeWidth={4}
                strokeDasharray={attivo ? undefined : "8 6"}
              />
            </Compare>
          );
        })}
        <Compare v={molla(locale, meta + 10, fps)} cx={centro + 150} cy={MESI.y1 + 70}>
          <Testo x={MESI.x + 9 * MESI.passo - 3} y={MESI.y1 + 68} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Da metà anno
          </Testo>
        </Compare>
        {/* Si riporta su un anno intero. */}
        <Freccia d={`M ${centro} ${MESI.y1 + 88} V ${MESI.y2 - 12}`} p={tra(locale, intero - 8, intero + 4)} colore={TINTE.tratto} spessore={6} />
        {Array.from({ length: 12 }, (_, k) => {
          const x = MESI.x + k * MESI.passo;
          return (
            <Compare key={k} v={molla(locale, intero + 6 + k * 2, fps)} cx={x + MESI.w / 2} cy={MESI.y2 + MESI.h / 2}>
              <rect x={x} y={MESI.y2} width={MESI.w} height={MESI.h} rx={9} fill={TINTE.ok} />
            </Compare>
          );
        })}
        <Compare v={molla(locale, intero + 26, fps)} cx={centro} cy={MESI.y2 + 68}>
          <Testo x={centro} y={MESI.y2 + 68} corpo={22} titolo peso={800} colore={TINTE.ok}>
            Su un anno intero
          </Testo>
        </Compare>
        {/* L'esempio: metà soglia in sei mesi vale la soglia intera. */}
        <Compare v={molla(locale, grafico, fps, true)} cx={640} cy={BARRE7.base}>
          <line x1={420} y1={BARRE7.base} x2={900} y2={BARRE7.base} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
        </Compare>
        <g opacity={tra(locale, grafico, grafico + 10)}>
          <Soglia x1={420} x2={900} y={BARRE7.soglia} />
          <EtichettaSoglia x={420} y={BARRE7.soglia - 30} />
        </g>
        <Colonna x={BARRE7.a} w={BARRE7.w} base={BARRE7.base} cima={BARRE7.base - (BARRE7.base - BARRE7.soglia) / 2} p={tra(locale, barraA, barraA + 24)} fondo={TINTE.crema} bordo={TINTE.accento} />
        <Compare v={molla(locale, barraA + 8, fps)} cx={BARRE7.a} cy={BARRE7.base + 32}>
          <Testo x={BARRE7.a} y={BARRE7.base + 32} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Sei mesi
          </Testo>
        </Compare>
        <Freccia d={`M ${BARRE7.a + 70} ${BARRE7.base - 120} Q 640 ${BARRE7.base - 190} ${BARRE7.b - 70} ${BARRE7.soglia + 30}`} p={tra(locale, barraB - 10, barraB + 6)} colore={TINTE.tratto} spessore={6} />
        <Colonna x={BARRE7.b} w={BARRE7.w} base={BARRE7.base} cima={BARRE7.soglia} p={pB} fondo={VERDE_TENUE} bordo={TINTE.ok} />
        <Compare v={molla(locale, barraB + 8, fps)} cx={BARRE7.b} cy={BARRE7.base + 32}>
          <Testo x={BARRE7.b} y={BARRE7.base + 32} corpo={24} titolo peso={800} colore={TINTE.ok}>
            Un anno intero
          </Testo>
        </Compare>
        {/* La soglia è raggiunta. */}
        <Spunta cx={BARRE7.b} cy={BARRE7.soglia} r={26} p={tra(locale, raggiunta, raggiunta + 16)} />
        <Compare v={molla(locale, raggiunta + 6, fps)} cx={BARRE7.b + 30} cy={BARRE7.soglia - 54}>
          <Pillola x={BARRE7.b + 40} y={BARRE7.soglia - 54} testo="Soglia raggiunta" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Terza soglia, la contabilità. Da … nell'ultimo esercizio non basta più quella semplificata: serve quella completa. Parlane con un fiduciario autorizzato e rivedi la lezione ….» */
const CONT = { x: 420, w: 110, base: 590, bassa: 470, alta: 250, cima: 190 } as const;
const sogContabilita: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.3, 0.6),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.3, 0.6) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.62, 0.9) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const grafico = fra(ctx, null, 0, 0.3, 0.04);
    const cresce = fra(ctx, 0, 1, 0.08, 0.2);
    const semplice = fra(ctx, 0, 1, 0.45, 0.36);
    const nonBasta = fra(ctx, 0, 1, 0.85, 0.48);
    const completa = fra(ctx, 1, 2, 0.3, 0.6);
    const fiduciario = fra(ctx, 2, null, 0.15, 0.72);
    const lezione = fra(ctx, 2, null, 0.62, 0.9);
    const p = tra(locale, cresce, cresce + 50);
    const supera = CONT.base - (CONT.base - CONT.cima) * p <= CONT.alta;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La contabilità" />
        {/* L'ultimo esercizio, più su della terza soglia. */}
        <Compare v={molla(locale, grafico, fps, true)} cx={CONT.x} cy={CONT.base}>
          <line x1={340} y1={CONT.base} x2={560} y2={CONT.base} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
          <Testo x={CONT.x} y={CONT.base + 32} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Ultimo esercizio
          </Testo>
        </Compare>
        <g opacity={tra(locale, grafico, grafico + 10)}>
          <Soglia x1={340} x2={560} y={CONT.bassa} colore={COLORE_TENUE} opacita={0.6} />
          <Soglia x1={340} x2={560} y={CONT.alta} />
          <EtichettaSoglia x={530} y={CONT.alta - 28} />
        </g>
        <Colonna x={CONT.x} w={CONT.w} base={CONT.base} cima={CONT.cima} p={p} />
        {supera ? <circle cx={CONT.x} cy={CONT.alta} r={11} fill={TINTE.rischio} /> : null}
        {/* La semplificata non basta più… */}
        <Compare v={molla(locale, semplice, fps)} cx={670} cy={220}>
          <Foglio x={600} y={110} w={140} h={186}>
            <FrecciaSoldi cx={640} cy={196} su s={0.7} />
            <FrecciaSoldi cx={700} cy={196} su={false} s={0.7} />
            <line x1={670} y1={160} x2={670} y2={270} stroke={TINTE.tinta} strokeWidth={4} />
          </Foglio>
          <Pillola x={670} y={334} testo="Semplificata" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <No cx={734} cy={120} r={24} p={tra(locale, nonBasta, nonBasta + 14)} />
        {/* …serve la completa. */}
        <Freccia d="M 752 220 H 798" p={tra(locale, completa - 8, completa + 2)} colore={TINTE.tratto} spessore={7} />
        <Compare v={molla(locale, completa, fps)} cx={876} cy={240}>
          <Registro x={876} y={292} s={1.05} />
          <Pillola x={876} y={334} testo="Completa" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* Con un fiduciario autorizzato, e la sua lezione. */}
        <Compare v={molla(locale, fiduciario, fps)} cx={690} cy={540}>
          <Persona x={690} y={598} s={0.88} colore={TINTE.tratto} />
          <Valigetta x={744} y={590} s={0.6} />
          <Pillola x={690} y={640} testo="Fiduciario autorizzato" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, lezione, fps)} cx={880} cy={540}>
          <SchermoLezione cx={880} cy={520} w={150} h={88} />
          <Testo x={880} y={594} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Rivedi la lezione
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 9. «E se sei iscritto all'IVA e scendi sotto la soglia? Se prevedi di restarci anche l'anno dopo, puoi chiedere all'AFC di uscire. Hai … giorni dalla fine dell'anno: se non lo chiedi, resti iscritto.» */
const SOTTO = { base: 390, soglia: 210, w: 86, prima: 395, ora: 530, dopo: 668 } as const;
const sogSotto: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.6, 0.5),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.6, 0.5) },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.62, 0.86) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const grafico = fra(ctx, null, 0, 0.1, 0.03);
    const prima = fra(ctx, null, 0, 0.2, 0.06);
    const scende = fra(ctx, null, 0, 0.55, 0.15);
    const dopo = fra(ctx, 0, 1, 0.25, 0.32);
    const chiedi = fra(ctx, 0, 1, 0.6, 0.5);
    const termine = fra(ctx, 1, null, 0.08, 0.64);
    const resti = fra(ctx, 1, null, 0.62, 0.86);
    const volo = tra(locale, chiedi, chiedi + 22);
    // La colonna di quest'anno: prima alta come l'anno prima, poi scende sotto la soglia.
    const giu = tra(locale, scende, scende + 26);
    const cimaOra = 170 + (300 - 170) * giu;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Sotto la soglia IVA" />
        <Compare v={molla(locale, grafico, fps, true)} cx={532} cy={SOTTO.base}>
          <line x1={336} y1={SOTTO.base} x2={728} y2={SOTTO.base} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
        </Compare>
        <g opacity={tra(locale, grafico, grafico + 10)}>
          <Soglia x1={336} x2={728} y={SOTTO.soglia} />
          <Testo x={722} y={SOTTO.soglia - 20} corpo={20} titolo peso={800} colore={TINTE.rischio} ancora="end">
            Soglia
          </Testo>
        </g>
        {/* Prima eri sopra, ed eri iscritto. */}
        <Colonna x={SOTTO.prima} w={SOTTO.w} base={SOTTO.base} cima={150} p={tra(locale, prima, prima + 20)} />
        <Compare v={molla(locale, prima + 14, fps)} cx={SOTTO.prima} cy={124}>
          <Pillola x={SOTTO.prima} y={124} testo="IVA" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Quest'anno sei sotto. */}
        {prima + 10 <= locale ? <Colonna x={SOTTO.ora} w={SOTTO.w} base={SOTTO.base} cima={cimaOra} p={tra(locale, prima + 10, prima + 30)} /> : null}
        {scende + 24 <= locale ? <FrecciaSoldi cx={SOTTO.ora} cy={262} su={false} s={0.6 * tra(locale, scende + 24, scende + 34)} /> : null}
        {/* E prevedi di restarci anche l'anno dopo. */}
        <Compare v={molla(locale, dopo, fps)} cx={SOTTO.dopo} cy={350}>
          <rect x={SOTTO.dopo - SOTTO.w / 2} y={300} width={SOTTO.w} height={SOTTO.base - 300} rx={12} fill={TINTE.carta} stroke={COLORE_TENUE} strokeWidth={5} strokeDasharray="12 8" />
        </Compare>
        {[
          { x: SOTTO.prima, testo: "Prima", t: prima },
          { x: SOTTO.ora, testo: "Quest'anno", t: prima + 10 },
          { x: SOTTO.dopo, testo: "L'anno dopo", t: dopo },
        ].map((e) => (
          <Compare key={e.testo} v={molla(locale, e.t + 6, fps)} cx={e.x} cy={SOTTO.base + 28}>
            <Testo x={e.x} y={SOTTO.base + 28} corpo={20} titolo peso={800} colore={TINTE.tratto}>
              {e.testo}
            </Testo>
          </Compare>
        ))}
        {/* Chiedi all'AFC di uscire. */}
        {chiedi <= locale && volo < 1 ? <Busta cx={SOTTO.dopo + 40 + volo * 180} cy={250 - Math.sin(volo * Math.PI) * 50} s={0.62} /> : null}
        <Compare v={molla(locale, chiedi - 10, fps)} cx={870} cy={260}>
          <Palazzo x={870} y={334} s={0.78} nome="AFC" />
        </Compare>
        <Compare v={molla(locale, chiedi + 18, fps)} cx={870} cy={376}>
          <Pillola x={870} y={378} testo="Chiedi di uscire" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Dalla fine dell'anno, entro il termine. */}
        <Compare v={molla(locale, termine, fps)} cx={470} cy={540}>
          <Calendario cx={400} cy={536} s={0.62} />
          <Clessidra cx={520} cy={536} s={0.64} p={tra(locale, termine + 8, ctx.durata)} />
          <Pillola x={466} y={624} testo="Dalla fine dell'anno" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* Se non lo chiedi, resti iscritto. */}
        <Compare v={molla(locale, resti, fps)} cx={820} cy={560}>
          <Pillola x={790} y={530} testo="IVA" corpo={30} fondo={TINTE.ok} colore={TINTE.carta} />
          <Lucchetto cx={862} cy={526} s={0.9} />
          <Pillola x={820} y={612} testo="Se no, resti iscritto" corpo={22} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Ti aiuta lo strumento di Bleo «I tuoi conti»: il riepilogo dell'anno mostra le entrate confermate, e Bleo ti avvisa quando si avvicinano alla soglia dell'IVA. Conta però la cifra d'affari vera: controlla che ci siano tutte le fatture.» */
const TEL = { cx: 450, cy: 330, w: 210, h: 390 } as const;
/** Le colonne del grafico «Mese per mese», in proporzione (senza cifre). */
const COLONNE = [0.35, 0.5, 0.42, 0.62, 0.55, 0.7, 0.6, 0.78, 0.66, 0.85, 0.74, 0.9] as const;
const sogStrumento: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.25, 0.55),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.4, 0.08) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.8, 0.95) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const telefono = fra(ctx, null, 0, 0.3, 0.06);
    const riepilogo = fra(ctx, 0, 1, 0.15, 0.25);
    const entrate = fra(ctx, 0, 1, 0.45, 0.32);
    const avviso = fra(ctx, 1, 2, 0.25, 0.55);
    const vera = fra(ctx, 2, null, 0.1, 0.72);
    const spunte = [fra(ctx, 2, null, 0.45, 0.82), fra(ctx, 2, null, 0.6, 0.87), fra(ctx, 2, null, 0.75, 0.92)];
    const alto = TEL.cy - TEL.h / 2;
    const barra = { x: TEL.cx - 78, y: alto + 150, w: 156 } as const;
    const riempi = 0.86 * tra(locale, entrate, entrate + 40) + 0.06 * tra(locale, avviso - 10, avviso + 10);
    const xSoglia = barra.x + barra.w * 0.96;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Lo strumento di Bleo" />
        <Compare v={molla(locale, telefono, fps, true)} cx={TEL.cx} cy={TEL.cy}>
          <Telefono cx={TEL.cx} cy={TEL.cy} w={TEL.w} h={TEL.h}>
            <Testo x={TEL.cx} y={alto + 62} corpo={22} titolo peso={800} colore={TINTE.tratto}>
              I tuoi conti
            </Testo>
          </Telefono>
        </Compare>
        {/* Il riepilogo dell'anno: le entrate confermate. */}
        <Compare v={molla(locale, riepilogo, fps)} cx={TEL.cx} cy={alto + 130}>
          <Testo x={barra.x} y={alto + 112} corpo={20} titolo peso={800} colore={TINTE.ok} ancora="start">
            Entrate
          </Testo>
          <rect x={barra.x} y={barra.y - 12} width={barra.w} height={24} rx={12} fill="#eceef1" />
          {riempi > 0.01 ? <rect x={barra.x} y={barra.y - 12} width={barra.w * riempi} height={24} rx={12} fill={TINTE.ok} /> : null}
          <line x1={xSoglia} y1={barra.y - 22} x2={xSoglia} y2={barra.y + 22} stroke={TINTE.rischio} strokeWidth={4} strokeDasharray="6 5" strokeLinecap="round" />
        </Compare>
        {/* Mese per mese. */}
        <line x1={TEL.cx - 80} y1={alto + 318} x2={TEL.cx + 80} y2={alto + 318} stroke={TINTE.tinta} strokeWidth={4} opacity={tra(locale, entrate, entrate + 8)} />
        {COLONNE.map((h, k) => {
          const p = tra(locale, entrate + 6 + k * 2, entrate + 20 + k * 2);
          const alt = 100 * h * p;
          return alt > 1 ? <rect key={k} x={TEL.cx - 78 + k * 13.4} y={alto + 316 - alt} width={9} height={alt} rx={3} fill={k % 2 ? TINTE.tratto : TINTE.ok} opacity={0.85} /> : null;
        })}
        {/* L'avviso: ti avvicini alla soglia dell'IVA. */}
        <Freccia d={`M ${TEL.cx + TEL.w / 2 + 8} ${alto + 150} Q 600 ${alto + 120} 618 ${alto + 90}`} p={tra(locale, avviso - 8, avviso + 4)} colore={TINTE.accento} spessore={6} />
        <Compare v={molla(locale, avviso, fps)} cx={740} cy={alto + 62}>
          <rect x={620} y={alto + 12} width={260} height={100} rx={22} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
          <Campanella cx={668} cy={alto + 64} s={0.78} locale={locale} />
          <Righe2 x={780} y={alto + 48} righe={["Ti avvicini", "alla soglia IVA"]} corpo={22} passo={30} colore={TINTE.accento} />
        </Compare>
        {/* Conta la cifra d'affari vera: tutte le fatture. */}
        {[0, 1, 2].map((i) => (
          <Compare key={i} v={molla(locale, vera + i * 5, fps)} cx={700 + i * 80} cy={430}>
            <Fattura x={646 + i * 80} y={350 + (i % 2) * 14} w={104} h={132} />
          </Compare>
        ))}
        {spunte.map((t, i) => (
          <Spunta key={i} cx={698 + i * 80} cy={514 + (i % 2) * 14} r={20} p={tra(locale, t, t + 14)} />
        ))}
        <Compare v={molla(locale, vera + 16, fps)} cx={780} cy={594}>
          <Pillola x={780} y={596} testo="Tutte le fatture?" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 11. «Ricapitoliamo. Somma la cifra d'affari. Confrontala con le soglie. Se ne hai raggiunta una, agisci in tempo: per l'IVA hai … giorni. E rifallo ogni anno.» */
const sogRoutine = elenco(
  "Ogni fine esercizio",
  ["Somma la cifra d'affari", "Confrontala con le soglie", "Soglia raggiunta? Agisci", "Rifallo ogni anno"],
  (ctx) => [fra(ctx, 0, 1, 0.05, 0.1), fra(ctx, 1, 2, 0.05, 0.27), fra(ctx, 2, 3, 0.05, 0.45), fra(ctx, 3, null, 0.05, 0.85)],
);

export const DISEGNI_SOGLIE_ANNUALI: Record<string, Disegno> = {
  "sog-quando": sogQuando,
  "sog-somma": sogSomma,
  "sog-escluse": sogEscluse,
  "sog-registro": sogRegistro,
  "sog-iva": sogIva,
  "sog-primo-anno": sogPrimoAnno,
  "sog-contabilita": sogContabilita,
  "sog-sotto": sogSotto,
  "sog-strumento": sogStrumento,
  "sog-routine": sogRoutine,
};
