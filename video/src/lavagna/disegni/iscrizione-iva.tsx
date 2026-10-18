/**
 * I disegni della lezione 14 («IVA: quando e come iscriverti»), vedi
 * src/lezioni/iscrizione-iva.ts. Fonti: LIVA (artt. 10, 11, 14, 21, 26, 27,
 * 34, 66, 86a), OIVA (artt. 9, 76a, 78), pagine dell'AFC e del Portale PMI.
 * Coordinate della tela 1000×700; l'angolo in basso a sinistra (x < 300,
 * y > 480) è della finestra di Bleo, la bussolina aspetta in (200, 450).
 * Niente cifre: soglia, giorni, mesi e aliquote li dice solo la voce (le
 * colonne delle aliquote sono solo in proporzione).
 */
import { aliquoteIva } from "../../../../src/data/svizzera";
import { Avviso, Compare, Esplosione, Foglio, Freccia, Fumetto, Lampadina, molla, Moneta, Palazzo, Persona, Pillola, Righe, Salvadanaio, Spunta, TEAL_CHIARO, Testo, TINTE, tra, Valigetta } from "../figure";
import { Tela } from "./ditta-individuale";
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

/* ---------------------------------------------------------------------------
 * Figure di questa lezione
 * ------------------------------------------------------------------------- */

/** Un tondo rosso con la croce a X: «no». */
function No({ cx, cy, r = 22 }: { cx: number; cy: number; r?: number }) {
  const d = r * 0.42;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.rischio} />
      <g stroke={TINTE.carta} strokeWidth={r * 0.3} strokeLinecap="round">
        <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} />
        <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d} />
      </g>
    </g>
  );
}

/** Una croce bianca su un tondo rosso: le cure mediche. */
function Croce({ cx, cy, r = 22 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.rischio} />
      <rect x={cx - r * 0.23} y={cy - r * 0.6} width={r * 0.46} height={r * 1.2} rx={r * 0.09} fill={TINTE.carta} />
      <rect x={cx - r * 0.6} y={cy - r * 0.23} width={r * 1.2} height={r * 0.46} rx={r * 0.09} fill={TINTE.carta} />
    </g>
  );
}

/** Un pacco: gli acquisti. */
function Pacco({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-58} y={-44} width={116} height={88} rx={10} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={6} />
      <line x1={-58} y1={-16} x2={58} y2={-16} stroke={TINTE.accento} strokeWidth={5} />
      <rect x={-13} y={-44} width={26} height={40} fill={TINTE.oro} opacity={0.75} />
      <rect x={-13} y={-44} width={26} height={40} fill="none" stroke={TINTE.accento} strokeWidth={4} />
    </g>
  );
}

/** Il quadrato rosso con la croce bianca: la Svizzera. */
function Svizzera({ cx, cy, lato = 64 }: { cx: number; cy: number; lato?: number }) {
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
function Mondo({ cx, cy, r = 34 }: { cx: number; cy: number; r?: number }) {
  return (
    <g fill="none" stroke={TINTE.tratto} strokeWidth={5}>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.tinta} />
      <ellipse cx={cx} cy={cy} rx={r * 0.45} ry={r} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} />
      <path d={`M ${cx - r * 0.86} ${cy - r * 0.5} H ${cx + r * 0.86} M ${cx - r * 0.86} ${cy + r * 0.5} H ${cx + r * 0.86}`} strokeWidth={4} />
    </g>
  );
}

/** Un libro aperto: l'insegnamento. */
function Libro({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} strokeLinejoin="round">
      <path d="M 0 -26 Q -26 -40 -56 -32 V 30 Q -26 22 0 36 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d="M 0 -26 Q 26 -40 56 -32 V 30 Q 26 22 0 36 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d="M -44 -14 Q -24 -20 -10 -12 M -44 2 Q -24 -4 -10 4 M 10 -12 Q 24 -20 44 -14 M 10 4 Q 24 -4 44 2" fill="none" stroke={TINTE.tinta} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

/** Una mela: gli alimenti. */
function Mela({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M 0 -18 C -14 -30 -40 -24 -40 2 C -40 26 -18 42 0 34 C 18 42 40 26 40 2 C 40 -24 14 -30 0 -18 Z" fill={TINTE.rischio} />
      <path d="M 0 -18 Q 2 -32 8 -40" fill="none" stroke="#6b4a1f" strokeWidth={5} strokeLinecap="round" />
      <path d="M 6 -30 Q 22 -44 32 -32 Q 18 -24 6 -30 Z" fill={TINTE.ok} />
      <ellipse cx={-18} cy={-4} rx={6} ry={10} fill={TINTE.carta} opacity={0.4} />
    </g>
  );
}

/** Una capsula: i medicinali. */
function Capsula({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-35)`}>
      <path d="M 0 -18 H -26 A 18 18 0 0 0 -26 18 H 0 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      <path d="M 0 -18 H 26 A 18 18 0 0 1 26 18 H 0 Z" fill={TINTE.tratto} stroke={TINTE.tratto} strokeWidth={5} />
    </g>
  );
}

/** Un letto: l'alloggio. */
function Letto({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-60} y={-44} width={12} height={74} rx={6} fill={TINTE.accento} />
      <rect x={-52} y={-2} width={112} height={22} rx={8} fill={TINTE.accento} />
      <rect x={52} y={-12} width={10} height={42} rx={5} fill={TINTE.accento} />
      <rect x={-44} y={-24} width={30} height={20} rx={8} fill={TINTE.carta} stroke={TINTE.accento} strokeWidth={4} />
      <path d="M -10 -2 V -20 Q -10 -26 -4 -26 H 54 Q 60 -26 60 -20 V -2 Z" fill={TINTE.tinta} stroke={TINTE.accento} strokeWidth={4} />
    </g>
  );
}

/** Forchetta e coltello: il ristorante. */
function Posate({ cx, cy, s = 1, colore = TINTE.carta }: { cx: number; cy: number; s?: number; colore?: string }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} stroke={colore} strokeLinecap="round" fill="none">
      <path d="M -18 -34 V -10 Q -18 0 -12 2 V 36" strokeWidth={6} />
      <path d="M -26 -34 V -14 Q -26 -4 -12 -2 Q 2 -4 2 -14 V -34" strokeWidth={5} />
      <path d="M 18 36 V -34 Q 32 -20 30 4 H 18" strokeWidth={6} fill={colore} />
    </g>
  );
}

/** Un cartellino del prezzo con la scritta IVA. */
function Cartellino({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-12)`}>
      <path d="M -58 -28 H 30 L 58 0 L 30 28 H -58 Q -64 28 -64 22 V -22 Q -64 -28 -58 -28 Z" fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={32} cy={0} r={6} fill={TINTE.carta} stroke={TINTE.accento} strokeWidth={4} />
      <Testo x={-16} y={2} corpo={28} titolo peso={800} colore={TINTE.accento}>
        IVA
      </Testo>
    </g>
  );
}

/** Un interruttore che si accende (`p` da 0 a 1). */
function Interruttore({ cx, cy, p }: { cx: number; cy: number; p: number }) {
  const w = 92;
  const h = 48;
  const colore = p > 0.5 ? TINTE.ok : COLORE_TENUE;
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={h / 2} fill={p > 0.5 ? TINTE.ok : TINTE.tinta} stroke={colore} strokeWidth={4} />
      <circle cx={cx - w / 2 + h / 2 + (w - h) * p} cy={cy} r={h / 2 - 7} fill={TINTE.carta} />
    </g>
  );
}

/** Una tessera (il certificato AVS), angolo in alto a sinistra in (x, y). */
function Tessera({ x, y, w = 110, h = 70 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      <rect x={x + 3} y={y + h * 0.2} width={w - 6} height={h * 0.18} fill={TINTE.tinta} />
      <circle cx={x + h * 0.32} cy={y + h * 0.68} r={h * 0.14} fill={TINTE.accento} />
      <line x1={x + h * 0.62} y1={y + h * 0.66} x2={x + w - 14} y2={y + h * 0.66} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

/** Un computer portatile: l'annuncio online. */
function Computer({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-80} y={-64} width={160} height={104} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-80} y={-64} width={160} height={20} rx={10} fill={TINTE.tinta} />
      <Righe x={-56} y={-24} w={90} n={3} passo={20} />
      <path d="M -102 44 H 102 l -14 16 H -88 Z" fill={TINTE.tratto} />
    </g>
  );
}

/** Un calendario da muro, con i giorni che passano (`p` da 0 a 1 li colora uno alla volta). */
function Calendario({ cx, cy, p = 0, s = 1, colore = TINTE.accento }: { cx: number; cy: number; p?: number; s?: number; colore?: string }) {
  const giorni = 12;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-64} y={-60} width={128} height={124} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-64} y={-60} width={128} height={34} rx={14} fill={colore} />
      {Array.from({ length: giorni }, (_, k) => {
        const r = Math.floor(k / 4);
        const c = k % 4;
        return <rect key={k} x={-48 + c * 26} y={-12 + r * 24} width={18} height={14} rx={4} fill={k < p * giorni ? colore : TINTE.tinta} />;
      })}
    </g>
  );
}

/** Una busta da lettera (angolo in alto a sinistra in x, y). */
function Busta({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d={`M ${x + 8} ${y + 10} L ${x + w / 2} ${y + h * 0.58} L ${x + w - 8} ${y + 10}`} fill="none" stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** Tre monete impilate. */
function Pila({ cx, cy, r = 24 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <Moneta cx={cx - r * 0.6} cy={cy + r * 0.5} r={r} />
      <Moneta cx={cx + r * 0.6} cy={cy + r * 0.5} r={r} />
      <Moneta cx={cx} cy={cy - r * 0.45} r={r} />
    </g>
  );
}

/* ---------------------------------------------------------------------------
 * Le scene
 * ------------------------------------------------------------------------- */

/* 2. «Chi è iscritto all'IVA la aggiunge ai suoi prezzi e la incassa dai clienti. Poi la versa alla Confederazione, ma prima toglie l'IVA che ha pagato sui suoi acquisti: si chiama imposta precedente.» */
const RIGA_PERSONE = 300;
const CONTO = { x: 380, y: 392, w: 320, h: 236 } as const;
const ivaComeFunziona: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.5),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.5) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.3, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const clienti = fra(ctx, null, 0, 0.25, 0.12);
    const prezzo = fra(ctx, null, 0, 0.5, 0.25);
    const incassa = fra(ctx, null, 0, 0.8, 0.35);
    const versa = fra(ctx, 0, 1, 0.3, 0.5);
    const acquisti = fra(ctx, 1, 2, 0.2, 0.65);
    const togli = fra(ctx, 1, 2, 0.6, 0.72);
    const precedente = fra(ctx, 2, null, 0.2, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Come funziona l'IVA" />
        {/* Tu, al centro. */}
        <Compare v={molla(locale, 6, fps, true)} cx={640} cy={240}>
          <Persona x={640} y={RIGA_PERSONE} s={0.72} colore={TINTE.accento} />
          <Pillola x={640} y={RIGA_PERSONE + 36} testo="Tu" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* I clienti pagano il prezzo con l'IVA. */}
        <Compare v={molla(locale, clienti, fps, true)} cx={875} cy={240}>
          <Persona x={848} y={RIGA_PERSONE} s={0.62} colore={TEAL_CHIARO} />
          <Persona x={904} y={RIGA_PERSONE} s={0.62} colore={TEAL_CHIARO} />
          <Pillola x={875} y={RIGA_PERSONE + 36} testo="Clienti" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 810 236 H 702" p={tra(locale, prezzo, prezzo + 12)} colore={TINTE.ok} />
        <Compare v={molla(locale, prezzo, fps)} cx={756} cy={160}>
          <Moneta cx={756} cy={196} r={18} />
          <Testo x={756} y={150} corpo={24} titolo peso={800} colore={TINTE.ok}>
            Prezzo + IVA
          </Testo>
        </Compare>
        {/* Gli acquisti: l'IVA pagata ai fornitori. */}
        <Compare v={molla(locale, acquisti, fps, true)} cx={420} cy={240}>
          <Pacco cx={420} cy={246} s={0.9} />
          <Testo x={420} y={RIGA_PERSONE + 36} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Acquisti
          </Testo>
        </Compare>
        <Freccia d="M 580 236 H 488" p={tra(locale, acquisti + 4, acquisti + 16)} colore={TINTE.accento} />
        <Compare v={molla(locale, acquisti + 6, fps)} cx={532} cy={160}>
          <Moneta cx={532} cy={196} r={18} />
          <Testo x={532} y={150} corpo={24} titolo peso={800} colore={TINTE.accento}>
            IVA pagata
          </Testo>
        </Compare>
        {/* Il conto: IVA incassata meno IVA pagata. */}
        <Compare v={molla(locale, incassa, fps)} cx={CONTO.x + CONTO.w / 2} cy={CONTO.y + CONTO.h / 2}>
          <Foglio x={CONTO.x} y={CONTO.y} w={CONTO.w} h={CONTO.h} />
          <Moneta cx={CONTO.x + 40} cy={CONTO.y + 58} r={16} />
          <Testo x={CONTO.x + 68} y={CONTO.y + 60} corpo={28} titolo peso={800} colore={TINTE.ok} ancora="start">
            IVA incassata
          </Testo>
        </Compare>
        <Compare v={molla(locale, togli, fps)} cx={CONTO.x + 150} cy={CONTO.y + 116}>
          <Moneta cx={CONTO.x + 40} cy={CONTO.y + 114} r={16} />
          <Testo x={CONTO.x + 68} y={CONTO.y + 116} corpo={28} titolo peso={800} colore={TINTE.accento} ancora="start">
            − IVA pagata
          </Testo>
        </Compare>
        <Compare v={molla(locale, precedente, fps)} cx={CONTO.x + 160} cy={CONTO.y + 186}>
          <Freccia d={`M ${CONTO.x + 30} ${CONTO.y + 186} Q ${CONTO.x + 14} ${CONTO.y + 160} ${CONTO.x + 26} ${CONTO.y + 136}`} p={tra(locale, precedente + 4, precedente + 14)} colore={TINTE.accento} spessore={6} />
          <Pillola x={CONTO.x + 172} y={CONTO.y + 186} testo="Imposta precedente" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* Alla Confederazione. */}
        <Freccia d={`M ${CONTO.x + CONTO.w + 10} ${CONTO.y + 70} Q 790 470 818 540`} p={tra(locale, versa, versa + 14)} />
        <Compare v={molla(locale, versa, fps, true)} cx={880} cy={560}>
          <Palazzo x={880} y={610} s={0.6} />
          <Testo x={880} y={648} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Confederazione
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 3. «L'iscrizione è obbligatoria da … di cifra d'affari all'anno. Conta il totale delle tue fatture senza IVA, in Svizzera e all'estero: non il guadagno. Non contano le prestazioni escluse dall'IVA, come molte cure mediche e l'insegnamento.» */
const BARRA = { x: 360, y: 108, w: 600, h: 40, soglia: 0.72 } as const;
const ivaSoglia: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.75, 0.3),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "festeggia", quando: fra(ctx, null, 0, 0.8, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.75, 0.6) },
      { tipo: "scuoti", quando: fra(ctx, 2, 3, 0.4, 0.75) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const barra = fra(ctx, null, 0, 0.1, 0.05);
    const soglia = fra(ctx, null, 0, 0.35, 0.15);
    const obbligo = fra(ctx, null, 0, 0.75, 0.3);
    const fatture = fra(ctx, 0, 1, 0.3, 0.4);
    const svizzera = fra(ctx, 1, 2, 0.15, 0.52);
    const estero = fra(ctx, 1, 2, 0.4, 0.58);
    const guadagno = fra(ctx, 1, 2, 0.75, 0.65);
    const escluse = fra(ctx, 2, 3, 0.3, 0.75);
    const cure = fra(ctx, 3, null, 0.25, 0.85);
    const scuola = fra(ctx, 3, null, 0.6, 0.92);
    const riempi = tra(locale, barra + 4, obbligo);
    const xSoglia = BARRA.x + BARRA.w * BARRA.soglia;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La soglia" />
        <Compare v={molla(locale, barra, fps, true)} cx={BARRA.x + BARRA.w / 2} cy={BARRA.y + 40}>
          <rect x={BARRA.x} y={BARRA.y} width={BARRA.w} height={BARRA.h} rx={BARRA.h / 2} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <rect
            x={BARRA.x + 5}
            y={BARRA.y + 5}
            width={Math.max(0, (BARRA.w - 10) * 0.9 * riempi)}
            height={BARRA.h - 10}
            rx={(BARRA.h - 10) / 2}
            fill={riempi * 0.9 > BARRA.soglia ? TINTE.ok : TINTE.tinta}
          />
          <Testo x={BARRA.x} y={BARRA.y + 78} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Cifra d'affari annua
          </Testo>
        </Compare>
        <Compare v={molla(locale, soglia, fps)} cx={xSoglia} cy={BARRA.y + 20}>
          <line x1={xSoglia} y1={BARRA.y - 14} x2={xSoglia} y2={BARRA.y + BARRA.h + 14} stroke={TINTE.rischio} strokeWidth={7} strokeLinecap="round" />
          <Testo x={xSoglia - 14} y={BARRA.y - 22} corpo={22} titolo peso={800} colore={TINTE.rischio} ancora="end">
            Soglia
          </Testo>
        </Compare>
        <Compare v={molla(locale, obbligo, fps)} cx={860} cy={BARRA.y + 80}>
          <Pillola x={860} y={BARRA.y + 80} testo="IVA obbligatoria" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Conta: le fatture senza IVA, in Svizzera e all'estero; non il guadagno. */}
        <Compare v={molla(locale, fatture, fps)} cx={430} cy={330}>
          <Foglio x={372} y={262} w={84} h={104} />
          <Foglio x={402} y={248} w={84} h={104}>
            <Righe x={418} y={290} w={46} n={3} passo={20} />
          </Foglio>
          <Testo x={430} y={400} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Fatture senza IVA
          </Testo>
        </Compare>
        <Compare v={molla(locale, svizzera, fps)} cx={622} cy={310}>
          <Svizzera cx={622} cy={310} lato={60} />
        </Compare>
        <Compare v={molla(locale, estero, fps)} cx={702} cy={310}>
          <Mondo cx={702} cy={310} r={32} />
        </Compare>
        <Compare v={molla(locale, Math.max(svizzera, estero - 6), fps)} cx={662} cy={400}>
          <Testo x={662} y={400} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Svizzera ed estero
          </Testo>
        </Compare>
        <Compare v={molla(locale, guadagno, fps)} cx={880} cy={330}>
          <Salvadanaio x={880} y={372} s={0.72} colore={COLORE_TENUE} />
          <No cx={930} cy={286} r={22} />
          <Testo x={880} y={400} corpo={22} titolo peso={800} colore={TINTE.rischio}>
            Non il guadagno
          </Testo>
        </Compare>
        {/* Non contano: le prestazioni escluse. */}
        <Compare v={molla(locale, escluse, fps)} cx={470} cy={560}>
          <Pillola x={470} y={560} testo="Escluse dall'IVA" corpo={26} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Compare v={molla(locale, cure, fps)} cx={700} cy={560}>
          <Croce cx={700} cy={540} r={34} />
          <Testo x={700} y={612} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Cure mediche
          </Testo>
        </Compare>
        <Compare v={molla(locale, scuola, fps)} cx={870} cy={560}>
          <Libro cx={870} cy={540} s={0.85} />
          <Testo x={870} y={612} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Insegnamento
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Quando inizia l'obbligo? Se all'avvio è prevedibile che superi la soglia entro … mesi, sei assoggettato da subito, da quando inizi l'attività.» */
const ASSE = { x0: 400, x1: 900, y: 520, sogliaY: 300 } as const;
const ivaDaSubito: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.3, 0.75),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.4, 0.15) + 4 },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.7, 0.5) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.3, 0.75) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const domanda = fra(ctx, null, 0, 0.2, 0.08);
    const avvio = fra(ctx, 0, 1, 0.05, 0.3);
    const mesi = fra(ctx, 0, 1, 0.25, 0.35);
    const previsione = fra(ctx, 0, 1, 0.45, 0.42);
    const subito = fra(ctx, 1, null, 0.25, 0.75);
    const linea = tra(locale, previsione, previsione + 30);
    const via = tra(locale, subito - 10, subito);
    // Dove la previsione supera la soglia (frazione della linea).
    const yPartenza = ASSE.y - 24;
    const yArrivo = 200;
    const fSoglia = (yPartenza - ASSE.sogliaY) / (yPartenza - yArrivo);
    const xSoglia = ASSE.x0 + (ASSE.x1 - ASSE.x0) * fSoglia;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Da subito" />
        <g opacity={1 - via}>
          <Compare v={molla(locale, domanda, fps)} cx={500} cy={200}>
            <Fumetto cx={500} cy={190} r={46}>
              <Testo x={500} y={193} corpo={54} titolo peso={800} colore={TINTE.tratto}>
                ?
              </Testo>
            </Fumetto>
          </Compare>
        </g>
        {/* L'asse del tempo, con i mesi dopo l'avvio. */}
        <Compare v={molla(locale, avvio, fps, true)} cx={650} cy={ASSE.y}>
          <line x1={ASSE.x0 - 20} y1={ASSE.y} x2={ASSE.x1 + 50} y2={ASSE.y} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
          <line x1={ASSE.x0} y1={ASSE.y} x2={ASSE.x0} y2={ASSE.y - 84} stroke={subito <= locale ? TINTE.ok : TINTE.accento} strokeWidth={7} strokeLinecap="round" />
          <path d={`M ${ASSE.x0} ${ASSE.y - 84} h 52 l -12 16 l 12 16 h -52 Z`} fill={subito <= locale ? TINTE.ok : TINTE.accento} />
          <Testo x={ASSE.x0 - 14} y={ASSE.y - 44} corpo={24} titolo peso={800} colore={TINTE.accento} ancora="end">
            Avvio
          </Testo>
        </Compare>
        {Array.from({ length: 12 }, (_, k) => {
          const x = ASSE.x0 + ((k + 1) * (ASSE.x1 - ASSE.x0)) / 12;
          return (
            <Compare key={k} v={molla(locale, mesi + k * 2, fps)} cx={x} cy={ASSE.y}>
              <line x1={x} y1={ASSE.y - 10} x2={x} y2={ASSE.y + 10} stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" />
            </Compare>
          );
        })}
        <Compare v={molla(locale, mesi + 24, fps)} cx={650} cy={ASSE.y + 50}>
          <path d={`M ${ASSE.x0 + 6} ${ASSE.y + 26} Q ${ASSE.x0 + 6} ${ASSE.y + 40} ${ASSE.x0 + 22} ${ASSE.y + 40} H ${ASSE.x1 - 16} Q ${ASSE.x1} ${ASSE.y + 40} ${ASSE.x1} ${ASSE.y + 26}`} fill="none" stroke={TINTE.accento} strokeWidth={5} strokeLinecap="round" />
          <Testo x={680} y={ASSE.y + 72} corpo={24} titolo peso={800} colore={TINTE.accento}>
            I mesi dopo l'avvio
          </Testo>
        </Compare>
        {/* La soglia e la previsione che la supera. */}
        <Compare v={molla(locale, previsione - 6, fps, true)} cx={650} cy={ASSE.sogliaY}>
          <line x1={ASSE.x0 - 20} y1={ASSE.sogliaY} x2={ASSE.x1 + 50} y2={ASSE.sogliaY} stroke={TINTE.rischio} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" />
          <Testo x={ASSE.x1 + 50} y={ASSE.sogliaY + 28} corpo={22} titolo peso={800} colore={TINTE.rischio} ancora="end">
            Soglia
          </Testo>
        </Compare>
        <Freccia d={`M ${ASSE.x0} ${yPartenza} L ${ASSE.x1} ${yArrivo}`} p={linea} colore={TINTE.ok} spessore={7} />
        <Compare v={molla(locale, previsione + 34, fps)} cx={ASSE.x1 - 20} cy={yArrivo - 34}>
          <Testo x={ASSE.x1 + 20} y={yArrivo - 30} corpo={22} titolo peso={800} colore={TINTE.ok} ancora="end">
            Previsione
          </Testo>
        </Compare>
        {linea > fSoglia ? <circle cx={xSoglia} cy={ASSE.sogliaY} r={11} fill={TINTE.rischio} /> : null}
        <Esplosione cx={xSoglia} cy={ASSE.sogliaY} p={tra(locale, previsione + 30 * fSoglia, previsione + 30 * fSoglia + 22)} r={56} />
        {/* Assoggettato da subito: dall'avvio. */}
        <Compare v={molla(locale, subito, fps)} cx={560} cy={170}>
          <Pillola x={560} y={170} testo="IVA da subito" corpo={30} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Freccia d={`M 470 200 Q ${ASSE.x0 - 4} 260 ${ASSE.x0 + 10} ${ASSE.y - 104}`} p={tra(locale, subito + 6, subito + 18)} colore={TINTE.ok} spessore={7} />
      </Tela>
    );
  },
};

/* 5. «Se la superi più tardi, lo sei dalla fine dell'anno contabile in cui l'hai raggiunta. E se hai iniziato a metà anno, la cifra d'affari si calcola come su un anno intero.» */
const ANNI = { y: 150, h: 150, a: [380, 640], b: [660, 920], sogliaY: 196 } as const;
const ANNO_INTERO = { x0: 400, x1: 920, y: 452, h: 50 } as const;
const ivaPiuTardi: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.4),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.6, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const anno = fra(ctx, null, 0, 0.1, 0.05);
    const cresce = fra(ctx, null, 0, 0.3, 0.1);
    const fine = fra(ctx, 0, 1, 0.4, 0.4);
    const meta = fra(ctx, 1, 2, 0.3, 0.6);
    const intero = fra(ctx, 2, null, 0.3, 0.8);
    const linea = tra(locale, cresce, cresce + 34);
    const allunga = tra(locale, intero, intero + 22);
    const [a0, a1] = ANNI.a;
    const [b0, b1] = ANNI.b;
    const base = ANNI.y + ANNI.h - 12;
    // Raggiunge la soglia a circa tre quarti del primo anno.
    const fSoglia = (base - ANNI.sogliaY) / (base - (ANNI.y + 22));
    const xSoglia = a0 + 14 + (a1 - a0 - 28) * fSoglia;
    const metaX = (ANNO_INTERO.x0 + ANNO_INTERO.x1) / 2;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Più tardi" />
        {/* Due anni contabili: in quello in cui raggiungi la soglia e in quello dopo. */}
        <Compare v={molla(locale, anno, fps, true)} cx={(a0 + a1) / 2} cy={ANNI.y + ANNI.h / 2}>
          <rect x={a0} y={ANNI.y} width={a1 - a0} height={ANNI.h} rx={18} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <Testo x={(a0 + a1) / 2} y={ANNI.y + ANNI.h + 30} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Quest'anno
          </Testo>
        </Compare>
        <Compare v={molla(locale, anno + 6, fps, true)} cx={(b0 + b1) / 2} cy={ANNI.y + ANNI.h / 2}>
          <rect x={b0} y={ANNI.y} width={b1 - b0} height={ANNI.h} rx={18} fill={fine <= locale ? "#e3f1ea" : TINTE.carta} stroke={fine <= locale ? TINTE.ok : TINTE.tratto} strokeWidth={5} />
          <Testo x={(b0 + b1) / 2} y={ANNI.y + ANNI.h + 30} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            L'anno dopo
          </Testo>
        </Compare>
        <Compare v={molla(locale, cresce - 4, fps)} cx={650} cy={ANNI.sogliaY}>
          <line x1={a0 + 8} y1={ANNI.sogliaY} x2={b1 - 8} y2={ANNI.sogliaY} stroke={TINTE.rischio} strokeWidth={4} strokeDasharray="12 10" strokeLinecap="round" />
          <Testo x={b1 - 14} y={ANNI.sogliaY - 18} corpo={20} titolo peso={800} colore={TINTE.rischio} ancora="end">
            Soglia
          </Testo>
        </Compare>
        <Freccia d={`M ${a0 + 14} ${base} L ${a1 - 14} ${ANNI.y + 22}`} p={linea} colore={TINTE.accento} spessore={7} punta={false} />
        {linea > fSoglia ? <circle cx={xSoglia} cy={ANNI.sogliaY} r={10} fill={TINTE.rischio} /> : null}
        {/* Dalla fine di quell'anno: obbligo IVA. */}
        <Compare v={molla(locale, fine, fps)} cx={650} cy={108}>
          <Pillola x={650} y={108} testo="IVA da qui" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, fine + 4, fps)} cx={650} cy={ANNI.y + ANNI.h / 2}>
          <line x1={650} y1={ANNI.y - 12} x2={650} y2={ANNI.y + ANNI.h + 8} stroke={TINTE.ok} strokeWidth={8} strokeLinecap="round" />
        </Compare>
        {/* Iniziato a metà anno: si calcola come su un anno intero. */}
        <Compare v={molla(locale, meta, fps, true)} cx={metaX} cy={ANNO_INTERO.y}>
          <rect x={ANNO_INTERO.x0} y={ANNO_INTERO.y - ANNO_INTERO.h / 2} width={ANNO_INTERO.x1 - ANNO_INTERO.x0} height={ANNO_INTERO.h} rx={16} fill={TINTE.carta} stroke={COLORE_TENUE} strokeWidth={4} strokeDasharray="12 9" />
          <rect x={metaX} y={ANNO_INTERO.y - ANNO_INTERO.h / 2} width={ANNO_INTERO.x1 - metaX} height={ANNO_INTERO.h} rx={16} fill={TINTE.accento} />
          <Testo x={(metaX + ANNO_INTERO.x1) / 2} y={ANNO_INTERO.y + 2} corpo={24} titolo peso={800} colore={TINTE.carta}>
            Da metà anno
          </Testo>
          <Testo x={ANNO_INTERO.x0 + 16} y={ANNO_INTERO.y - ANNO_INTERO.h / 2 - 22} corpo={22} titolo peso={800} colore={COLORE_TENUE} ancora="start">
            Un anno
          </Testo>
        </Compare>
        <Compare v={molla(locale, intero, fps)} cx={metaX} cy={ANNO_INTERO.y + 80}>
          <rect
            x={ANNO_INTERO.x1 - (ANNO_INTERO.x1 - metaX) * (1 + allunga)}
            y={ANNO_INTERO.y + ANNO_INTERO.h / 2 + 22}
            width={(ANNO_INTERO.x1 - metaX) * (1 + allunga)}
            height={ANNO_INTERO.h}
            rx={16}
            fill={TINTE.ok}
            opacity={0.9}
          />
          <Freccia d={`M ${metaX - 10} ${ANNO_INTERO.y + 72} H ${metaX - 10 - 200 * allunga}`} p={allunga > 0.05 ? 1 : 0} colore={TINTE.carta} spessore={6} />
          <Testo x={metaX} y={ANNO_INTERO.y + 150} corpo={24} titolo peso={800} colore={TINTE.ok}>
            Si calcola su un anno intero
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Da quando sei assoggettato, hai … giorni per annunciarti all'AFC, l'Amministrazione federale delle contribuzioni. Lo fai online, anche in italiano. Tieni pronti il tuo numero AVS e la cifra d'affari prevista per il primo anno.» */
const ivaAnnuncio: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.3),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.6) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.7, 0.9) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const calendario = fra(ctx, null, 0, 0.15, 0.08);
    const afc = fra(ctx, null, 0, 0.6, 0.3);
    const nome = fra(ctx, 0, 1, 0.2, 0.45);
    const online = fra(ctx, 1, 2, 0.2, 0.55);
    const avs = fra(ctx, 2, null, 0.35, 0.75);
    const cifra = fra(ctx, 2, null, 0.7, 0.88);
    const giorni = tra(locale, calendario + 6, afc + 10);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="L'annuncio all'AFC" />
        <Compare v={molla(locale, calendario, fps)} cx={440} cy={230}>
          <Calendario cx={440} cy={226} p={giorni} />
          <Testo x={440} y={316} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Il termine
          </Testo>
        </Compare>
        <Freccia d="M 524 226 H 690" p={tra(locale, afc - 10, afc + 2)} />
        <Compare v={molla(locale, afc, fps)} cx={790} cy={230}>
          <Palazzo x={790} y={300} s={0.75} nome="AFC" />
        </Compare>
        <Compare v={molla(locale, nome, fps)} cx={790} cy={350}>
          <Righe2 x={790} y={338} righe={["Amministrazione federale", "delle contribuzioni"]} corpo={24} passo={30} />
        </Compare>
        <Compare v={molla(locale, online, fps)} cx={520} cy={490}>
          <Computer cx={520} cy={478} s={0.72} />
          <Pillola x={520} y={584} testo="Online, anche in italiano" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, avs, fps)} cx={820} cy={460}>
          <Tessera x={680} y={428} w={100} h={64} />
          <Testo x={798} y={462} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Numero AVS
          </Testo>
        </Compare>
        <Compare v={molla(locale, cifra, fps)} cx={820} cy={570}>
          <rect x={710} y={526} width={60} height={82} rx={10} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={720 + k * 15} y={592 - (k + 1) * 16} width={11} height={(k + 1) * 16} rx={3} fill={TINTE.accento} />
          ))}
          <Testo x={798} y={552} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Cifra d'affari
          </Testo>
          <Testo x={798} y={582} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
            prevista
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Sotto la soglia puoi iscriverti lo stesso, per scelta. Conviene soprattutto se lavori per imprese iscritte all'IVA o per l'estero, o se all'inizio investi molto. Però poi metti l'IVA nei prezzi, fai i rendiconti e resti iscritto almeno un anno.» */
const COLONNE_SCELTA = [445, 655, 865] as const;
const ivaVolontaria: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.5, 0.15),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "festeggia", quando: fra(ctx, null, 0, 0.55, 0.15) + 6 },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.5) },
      { tipo: "scuoti", quando: fra(ctx, 2, 3, 0.3, 0.62) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const scelta = fra(ctx, null, 0, 0.2, 0.05);
    const acceso = fra(ctx, null, 0, 0.55, 0.15);
    const conviene = fra(ctx, 0, 1, 0.05, 0.3);
    const imprese = fra(ctx, 0, 1, 0.4, 0.38);
    const estero = fra(ctx, 0, 1, 0.8, 0.45);
    const spese = fra(ctx, 1, 2, 0.3, 0.55);
    const pero = fra(ctx, 2, 3, 0.05, 0.62);
    const prezzi = fra(ctx, 2, 3, 0.4, 0.65);
    const rendiconti = fra(ctx, 3, null, 0.15, 0.78);
    const anno = fra(ctx, 3, null, 0.6, 0.9);
    const [x1, x2, x3] = COLONNE_SCELTA;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Iscriversi per scelta" />
        <Compare v={molla(locale, scelta, fps)} cx={560} cy={132}>
          <Interruttore cx={400} cy={132} p={tra(locale, acceso, acceso + 10)} />
          <Testo x={466} y={134} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Puoi iscriverti per scelta
          </Testo>
        </Compare>
        <Compare v={molla(locale, conviene, fps)} cx={420} cy={205}>
          <Testo x={360} y={205} corpo={26} titolo peso={800} colore={TINTE.ok} ancora="start">
            Conviene se:
          </Testo>
        </Compare>
        <Compare v={molla(locale, imprese, fps)} cx={x1} cy={290}>
          <Palazzo x={x1 - 10} y={318} s={0.42} />
          <Spunta cx={x1 + 40} cy={262} r={18} p={tra(locale, imprese + 6, imprese + 16)} />
          <Testo x={x1} y={350} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Clienti con l'IVA
          </Testo>
        </Compare>
        <Compare v={molla(locale, estero, fps)} cx={x2} cy={290}>
          <Mondo cx={x2} cy={282} r={34} />
          <Testo x={x2} y={350} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Per l'estero
          </Testo>
        </Compare>
        <Compare v={molla(locale, spese, fps)} cx={x3} cy={290}>
          <Pila cx={x3 - 34} cy={284} r={20} />
          <Valigetta x={x3 + 36} y={312} s={0.6} />
          <Testo x={x3} y={350} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Grandi investimenti
          </Testo>
        </Compare>
        <Compare v={molla(locale, pero, fps)} cx={400} cy={425}>
          <Testo x={360} y={425} corpo={26} titolo peso={800} colore={TINTE.accento} ancora="start">
            Però poi:
          </Testo>
        </Compare>
        <Compare v={molla(locale, prezzi, fps)} cx={x1} cy={510}>
          <Cartellino cx={x1} cy={506} s={0.85} />
          <Testo x={x1} y={578} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            IVA nei prezzi
          </Testo>
        </Compare>
        <Compare v={molla(locale, rendiconti, fps)} cx={x2} cy={510}>
          <Foglio x={x2 - 36} y={462} w={72} h={90}>
            <Righe x={x2 - 22} y={496} w={40} n={3} passo={18} />
          </Foglio>
          <Testo x={x2} y={578} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            I rendiconti
          </Testo>
        </Compare>
        <Compare v={molla(locale, anno, fps)} cx={x3} cy={510}>
          <Calendario cx={x3} cy={506} s={0.66} p={tra(locale, anno + 4, anno + 30)} />
          <Testo x={x3} y={578} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Almeno un anno
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Le aliquote, in vigore dal …, sono tre. Normale: …. Ridotta: …, per esempio per gli alimenti e i medicinali; al ristorante però vale la normale. Per l'alloggio: ….» */
const BASE_ALIQUOTE = 500;
const ALTEZZA_NORMALE = 300;
/** Le colonne sono in proporzione alle aliquote vere (i numeri li dice la voce). */
const COLONNE_ALIQUOTE = [
  { x: 440, chiave: "normale", nome: "Normale", colore: TINTE.tratto },
  { x: 650, chiave: "ridotta", nome: "Ridotta", colore: TINTE.ok },
  { x: 860, chiave: "alloggio", nome: "Alloggio", colore: TINTE.oro },
] as const;
const ivaAliquote: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.3),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.3, 0.45) },
      { tipo: "lancia", quando: fra(ctx, 2, 3, 0.5, 0.65) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.5, 0.9) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tre = fra(ctx, null, 0, 0.3, 0.08);
    const tempi = [fra(ctx, 0, 1, 0.1, 0.25), fra(ctx, 1, 2, 0.1, 0.38), fra(ctx, 3, null, 0.2, 0.8)];
    const alimenti = fra(ctx, 1, 2, 0.5, 0.45);
    const medicinali = fra(ctx, 1, 2, 0.8, 0.5);
    const ristorante = fra(ctx, 2, 3, 0.3, 0.6);
    const normale = aliquoteIva.valore.normale;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Tre aliquote" />
        <Compare v={molla(locale, tre, fps, true)} cx={650} cy={BASE_ALIQUOTE}>
          <line x1={350} y1={BASE_ALIQUOTE} x2={950} y2={BASE_ALIQUOTE} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
          {COLONNE_ALIQUOTE.map((c) => (
            <rect key={c.chiave} x={c.x - 65} y={BASE_ALIQUOTE - 60} width={130} height={60} rx={14} fill="none" stroke={COLORE_TENUE} strokeWidth={4} strokeDasharray="10 8" />
          ))}
        </Compare>
        {COLONNE_ALIQUOTE.map((c, i) => {
          const h = (ALTEZZA_NORMALE * aliquoteIva.valore[c.chiave]) / normale;
          const cresce = tra(locale, tempi[i], tempi[i] + 16);
          return (
            <g key={c.chiave}>
              {cresce > 0 ? <rect x={c.x - 65} y={BASE_ALIQUOTE - h * cresce} width={130} height={h * cresce} rx={14} fill={c.colore} /> : null}
              <Compare v={molla(locale, tempi[i], fps)} cx={c.x} cy={BASE_ALIQUOTE + 36}>
                <Testo x={c.x} y={BASE_ALIQUOTE + 36} corpo={28} titolo peso={800} colore={c.colore === TINTE.oro ? TINTE.accento : c.colore}>
                  {c.nome}
                </Testo>
              </Compare>
            </g>
          );
        })}
        {/* Normale: quasi tutto, e anche il ristorante. */}
        <Compare v={molla(locale, tempi[0] + 14, fps)} cx={440} cy={160}>
          <Valigetta x={440} y={182} s={0.8} />
        </Compare>
        <Compare v={molla(locale, ristorante, fps)} cx={440} cy={330}>
          <circle cx={440} cy={330} r={44} fill={TINTE.carta} opacity={0.2} />
          <Posate cx={440} cy={330} s={1.1} />
        </Compare>
        {/* Ridotta: alimenti e medicinali. */}
        <Compare v={molla(locale, alimenti, fps)} cx={615} cy={360}>
          <Mela cx={615} cy={356} s={0.85} />
        </Compare>
        <Compare v={molla(locale, medicinali, fps)} cx={690} cy={360}>
          <Capsula cx={690} cy={360} s={1} />
        </Compare>
        {/* Alloggio: l'albergo. */}
        <Compare v={molla(locale, tempi[2] + 12, fps)} cx={860} cy={310}>
          <Letto cx={860} cy={318} s={0.95} />
        </Compare>
      </Tela>
    );
  },
};

/* 9. «Se sei iscritto, in fattura metti il tuo numero IVA, l'aliquota e l'importo dell'IVA: lo vediamo nella lezione sulle fatture. Se non sei iscritto, invece, l'IVA in fattura non la puoi scrivere.» */
const FATTURA_SI = { x: 350, y: 100, w: 290, h: 320 } as const;
const FATTURA_NO = { x: 690, y: 100, w: 270, h: 320 } as const;
const RIGHE_SI = [
  { y: 236, testo: "Numero IVA" },
  { y: 296, testo: "Aliquota" },
  { y: 356, testo: "Importo IVA" },
] as const;
const ivaFattura: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.3),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.7, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 0, 1, 0.75, 0.6) + 6 },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.55, 0.88) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const iscritto = fra(ctx, null, 0, 0.15, 0.05);
    const righe = [fra(ctx, null, 0, 0.65, 0.3), fra(ctx, 0, 1, 0.1, 0.4), fra(ctx, 0, 1, 0.3, 0.48)];
    const lezione = fra(ctx, 0, 1, 0.65, 0.6);
    const nonIscritto = fra(ctx, 1, null, 0.15, 0.7);
    const vietato = fra(ctx, 1, null, 0.6, 0.88);
    const barra = tra(locale, vietato, vietato + 10);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="In fattura" />
        <Compare v={molla(locale, iscritto, fps, true)} cx={FATTURA_SI.x + FATTURA_SI.w / 2} cy={FATTURA_SI.y + FATTURA_SI.h / 2}>
          <Foglio x={FATTURA_SI.x} y={FATTURA_SI.y} w={FATTURA_SI.w} h={FATTURA_SI.h}>
            <Righe x={FATTURA_SI.x + 28} y={FATTURA_SI.y + 50} w={150} n={3} passo={24} />
          </Foglio>
          <Pillola x={FATTURA_SI.x + FATTURA_SI.w / 2} y={FATTURA_SI.y + FATTURA_SI.h + 44} testo="Iscritto" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {RIGHE_SI.map((r, i) => (
          <Compare key={r.testo} v={molla(locale, righe[i], fps)} cx={FATTURA_SI.x + 120} cy={r.y}>
            <Testo x={FATTURA_SI.x + 28} y={r.y} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {r.testo}
            </Testo>
            <Spunta cx={FATTURA_SI.x + FATTURA_SI.w - 40} cy={r.y} r={18} p={tra(locale, righe[i] + 4, righe[i] + 14)} />
          </Compare>
        ))}
        <Compare v={molla(locale, lezione, fps)} cx={FATTURA_SI.x + FATTURA_SI.w / 2} cy={572}>
          <Pillola x={FATTURA_SI.x + FATTURA_SI.w / 2 + 30} y={572} testo="Lezione sulle fatture" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
          <circle cx={FATTURA_SI.x} cy={572} r={20} fill={TINTE.tratto} />
          <path d={`M ${FATTURA_SI.x - 7} 562 L ${FATTURA_SI.x + 9} 572 L ${FATTURA_SI.x - 7} 582 Z`} fill={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, nonIscritto, fps, true)} cx={FATTURA_NO.x + FATTURA_NO.w / 2} cy={FATTURA_NO.y + FATTURA_NO.h / 2}>
          <Foglio x={FATTURA_NO.x} y={FATTURA_NO.y} w={FATTURA_NO.w} h={FATTURA_NO.h}>
            <Righe x={FATTURA_NO.x + 28} y={FATTURA_NO.y + 50} w={140} n={3} passo={24} />
          </Foglio>
          <Testo x={FATTURA_NO.x + FATTURA_NO.w / 2} y={FATTURA_NO.y + 210} corpo={64} titolo peso={800} colore={COLORE_TENUE}>
            IVA
          </Testo>
          <Pillola x={FATTURA_NO.x + FATTURA_NO.w / 2} y={FATTURA_NO.y + FATTURA_NO.h + 44} testo="Non iscritto" corpo={26} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Freccia
          d={`M ${FATTURA_NO.x + 60} ${FATTURA_NO.y + 238} L ${FATTURA_NO.x + FATTURA_NO.w - 60} ${FATTURA_NO.y + 182}`}
          p={barra}
          colore={TINTE.rischio}
          spessore={10}
          punta={false}
        />
        <Compare v={molla(locale, vietato + 8, fps)} cx={FATTURA_NO.x + FATTURA_NO.w - 40} cy={FATTURA_NO.y + 140}>
          <No cx={FATTURA_NO.x + FATTURA_NO.w - 40} cy={FATTURA_NO.y + 140} r={26} />
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Per calcolare l'IVA da versare c'è un metodo più semplice, l'aliquota saldo: moltiplichi la cifra d'affari, IVA compresa, per l'aliquota del tuo settore. Non calcoli l'imposta precedente, e il rendiconto lo fai ogni … mesi invece che ogni …. In fattura, però, metti sempre l'aliquota di legge.» */
const CONTO_Y = 270;
const ivaAliquotaSaldo: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.85, 0.5),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "festeggia", quando: fra(ctx, null, 0, 0.7, 0.2) + 6 },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.85, 0.5) },
      { tipo: "lancia", quando: fra(ctx, 2, 3, 0.5, 0.75) },
      { tipo: "scuoti", quando: fra(ctx, 3, null, 0.3, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const semplice = fra(ctx, null, 0, 0.55, 0.15);
    const cifra = fra(ctx, 0, 1, 0.1, 0.3);
    const per = fra(ctx, 0, 1, 0.45, 0.4);
    const settore = fra(ctx, 0, 1, 0.55, 0.42);
    const uguale = fra(ctx, 0, 1, 0.9, 0.5);
    const niente = fra(ctx, 1, 2, 0.3, 0.6);
    const semestre = fra(ctx, 2, 3, 0.4, 0.75);
    const fattura = fra(ctx, 3, null, 0.3, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="L'aliquota saldo" />
        <Compare v={molla(locale, semplice, fps)} cx={480} cy={140}>
          <Lampadina cx={380} cy={142} s={1.1} />
          <Testo x={424} y={146} corpo={30} titolo peso={800} colore={TINTE.accento} ancora="start">
            Un metodo più semplice
          </Testo>
        </Compare>
        <Compare v={molla(locale, cifra, fps)} cx={430} cy={CONTO_Y}>
          <Pila cx={430} cy={CONTO_Y} r={22} />
          <Righe2 x={430} y={CONTO_Y + 66} righe={["Cifra d'affari", "con l'IVA"]} corpo={24} passo={30} />
        </Compare>
        <Compare v={molla(locale, per, fps)} cx={548} cy={CONTO_Y + 6}>
          <Testo x={548} y={CONTO_Y + 6} corpo={56} titolo peso={800} colore={TINTE.tratto}>
            ×
          </Testo>
        </Compare>
        <Compare v={molla(locale, settore, fps)} cx={662} cy={CONTO_Y}>
          <Valigetta x={662} y={CONTO_Y + 30} s={0.95} />
          <Righe2 x={662} y={CONTO_Y + 66} righe={["Aliquota", "del settore"]} corpo={24} passo={30} />
        </Compare>
        <Compare v={molla(locale, uguale, fps)} cx={770} cy={CONTO_Y + 6}>
          <Testo x={770} y={CONTO_Y + 6} corpo={56} titolo peso={800} colore={TINTE.tratto}>
            =
          </Testo>
        </Compare>
        <Compare v={molla(locale, uguale + 6, fps)} cx={880} cy={CONTO_Y}>
          <Moneta cx={880} cy={CONTO_Y - 4} r={34} />
          <Righe2 x={880} y={CONTO_Y + 66} righe={["IVA", "da versare"]} corpo={24} passo={30} colore={TINTE.ok} />
        </Compare>
        <Compare v={molla(locale, niente, fps)} cx={520} cy={470}>
          <Pillola x={500} y={470} testo="Imposta precedente" corpo={24} fondo={TINTE.carta} colore={COLORE_TENUE} bordo={COLORE_TENUE} />
          <line x1={378} y1={470} x2={622} y2={470} stroke={TINTE.rischio} strokeWidth={6} strokeLinecap="round" />
          <No cx={668} cy={470} r={22} />
        </Compare>
        <Compare v={molla(locale, semestre, fps)} cx={860} cy={470}>
          <Calendario cx={860} cy={456} s={0.8} p={tra(locale, semestre + 4, semestre + 24) * 0.5} colore={TINTE.ok} />
          <Testo x={860} y={538} corpo={24} titolo peso={800} colore={TINTE.ok}>
            Ogni semestre
          </Testo>
        </Compare>
        <Compare v={molla(locale, fattura, fps)} cx={600} cy={620}>
          <Foglio x={372} y={584} w={56} h={70}>
            <Righe x={384} y={612} w={28} n={2} passo={16} />
          </Foglio>
          <Pillola x={662} y={620} testo="In fattura: l'aliquota di legge" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 11. «L'aliquota saldo va chiesta entro … giorni da quando ricevi il numero IVA. Altrimenti resti al metodo effettivo per almeno … anni interi. Nello stesso termine puoi chiedere anche il rendiconto annuale: uno solo all'anno, con degli acconti.» */
const ANNI_EFFETTIVO_X = [610, 720, 830] as const;
const ivaTermine: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.25),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.25) },
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.2, 0.4) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 1, 2, 0.6, 0.75) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const subito = fra(ctx, null, 0, 0.12, 0.04);
    const numero = fra(ctx, null, 0, 0.5, 0.18);
    const termine = fra(ctx, null, 0, 0.7, 0.26);
    const perso = fra(ctx, 0, 1, 0.05, 0.38);
    const anni = [fra(ctx, 0, 1, 0.45, 0.45), fra(ctx, 0, 1, 0.6, 0.48), fra(ctx, 0, 1, 0.75, 0.51)];
    const annuale = fra(ctx, 1, 2, 0.45, 0.72);
    const acconti = fra(ctx, 2, null, 0.6, 0.9);
    const giorni = tra(locale, termine, termine + 40);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il termine" />
        <Compare v={molla(locale, subito, fps)} cx={450} cy={200}>
          <Avviso x={386} y={204} s={0.9} />
          <Righe2 x={500} y={186} righe={["Chiedila", "in tempo"]} corpo={30} passo={36} colore={TINTE.rischio} />
        </Compare>
        <Compare v={molla(locale, numero, fps)} cx={660} cy={210}>
          <Busta x={600} y={162} w={120} h={84} />
          <Testo x={660} y={276} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Numero IVA
          </Testo>
        </Compare>
        <Freccia d="M 732 204 H 786" p={tra(locale, termine - 8, termine + 2)} />
        <Compare v={molla(locale, termine, fps)} cx={866} cy={204}>
          <Calendario cx={866} cy={200} s={0.85} p={giorni} colore={TINTE.rischio} />
          <Testo x={866} y={276} corpo={22} titolo peso={800} colore={TINTE.rischio}>
            Il termine
          </Testo>
        </Compare>
        {/* Termine perso: anni con il metodo effettivo. */}
        <Compare v={molla(locale, perso, fps)} cx={440} cy={392}>
          <No cx={366} cy={392} r={22} />
          <Righe2 x={460} y={378} righe={["Termine", "perso"]} corpo={24} passo={30} colore={TINTE.rischio} />
        </Compare>
        {ANNI_EFFETTIVO_X.map((x, i) => (
          <Compare key={x} v={molla(locale, anni[i], fps)} cx={x} cy={390}>
            <Calendario cx={x} cy={388} s={0.6} p={1} colore={TINTE.tratto} />
          </Compare>
        ))}
        <Compare v={molla(locale, anni[2] + 6, fps)} cx={720} cy={456}>
          <Testo x={720} y={456} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Metodo effettivo
          </Testo>
        </Compare>
        {/* Il rendiconto annuale, con gli acconti. */}
        <Compare v={molla(locale, annuale, fps)} cx={560} cy={580}>
          <Foglio x={380} y={530} w={74} h={96}>
            <Righe x={394} y={566} w={40} n={3} passo={18} />
          </Foglio>
          <Testo x={474} y={562} corpo={26} titolo peso={800} colore={TINTE.ok} ancora="start">
            Rendiconto annuale
          </Testo>
          <Testo x={474} y={600} corpo={22} peso={600} colore={COLORE_TENUE} ancora="start">
            una volta all'anno
          </Testo>
        </Compare>
        <Compare v={molla(locale, acconti, fps)} cx={880} cy={580}>
          {[830, 880, 930].map((x) => (
            <Moneta key={x} cx={x} cy={566} r={20} />
          ))}
          <Testo x={880} y={616} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Acconti
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_ISCRIZIONE_IVA: Record<string, Disegno> = {
  "iva-come-funziona": ivaComeFunziona,
  "iva-soglia": ivaSoglia,
  "iva-da-subito": ivaDaSubito,
  "iva-piu-tardi": ivaPiuTardi,
  "iva-annuncio": ivaAnnuncio,
  "iva-volontaria": ivaVolontaria,
  "iva-aliquote": ivaAliquote,
  "iva-fattura": ivaFattura,
  "iva-aliquota-saldo": ivaAliquotaSaldo,
  "iva-termine": ivaTermine,
};
