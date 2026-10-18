/**
 * I disegni della lezione 10 («Edilizia e trasporti: decide anche la Suva»),
 * vedi src/lezioni/statuto-suva.ts. Fonti: LAINF art. 66, OAINF art. 73 e le
 * pagine della Suva sull'accertamento, sulla decisione e sull'assicurazione
 * per imprenditori; indipendente.ch. L'esempio del gessatore è quello della
 * Suva. Coordinate della tela 1000×700; l'angolo in basso a sinistra
 * (x < 300, y > 480) è della finestra di Bleo. Niente cifre, solo concetti.
 */
import type { ReactNode } from "react";
import { Attrezzo, Avviso, Compare, Foglio, Freccia, Fumetto, molla, Palazzo, Persona, Pillola, Righe, Scudo, Spunta, TEAL_CHIARO, Testo, Timbro, TINTE, tra, Valigetta } from "../figure";
import { Tela } from "./ditta-individuale";
import { elenco } from "./documenti-sagl";
import { Righe2 } from "./forme-giuridiche";
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

const GRIGIO = "#b9bec6";

/** Il casco da cantiere sopra un muretto di mattoni: l'edilizia. */
export function Cantiere({ cx, cy }: { cx: number; cy: number }) {
  const mattoni = [
    [-48, 20],
    [-14, 20],
    [20, 20],
    [-31, 40],
    [3, 40],
    [37, 40],
  ];
  return (
    <g>
      {mattoni.map(([dx, dy]) => (
        <rect key={`${dx}-${dy}`} x={cx + dx - 14} y={cy + dy - 9} width={30} height={18} rx={4} fill={TINTE.rischioTenue} stroke={TINTE.accento} strokeWidth={4} />
      ))}
      <path d={`M ${cx - 40} ${cy - 2} a 40 40 0 0 1 80 0 Z`} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={5} strokeLinejoin="round" />
      <rect x={cx - 54} y={cy - 6} width={108} height={14} rx={7} fill={TINTE.accento} />
      <rect x={cx - 6} y={cy - 44} width={12} height={36} rx={6} fill={TINTE.accento} opacity={0.7} />
    </g>
  );
}

/** Secchio e spazzolone: la pulizia di edifici. */
function Pulizie({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <line x1={cx + 8} y1={cy + 38} x2={cx + 42} y2={cy - 56} stroke={TINTE.accento} strokeWidth={8} strokeLinecap="round" />
      <rect x={cx - 6} y={cy + 32} width={36} height={14} rx={6} fill={TINTE.accento} transform={`rotate(-20 ${cx + 12} ${cy + 39})`} />
      <path d={`M ${cx - 44} ${cy - 6} H ${cx + 20} L ${cx + 12} ${cy + 52} H ${cx - 36} Z`} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M ${cx - 40} ${cy - 6} q 32 -30 56 0`} fill="none" stroke={TINTE.tratto} strokeWidth={5} />
      <ellipse cx={cx - 12} cy={cy - 6} rx={30} ry={7} fill={TINTE.tinta} />
    </g>
  );
}

/** Un camioncino: i trasporti. */
export function Camion({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-56} y={-44} width={70} height={62} rx={8} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d="M 14 -24 H 38 L 54 -4 V 18 H 14 Z" fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 22 -16 H 35 L 44 -4 H 22 Z" fill={TINTE.carta} />
      <circle cx={-32} cy={22} r={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <circle cx={32} cy={22} r={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
    </g>
  );
}

/** Una fabbrica con il tetto a denti e il camino: l'industria. */
export function Fabbrica({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx + 22} y={cy - 62} width={18} height={50} rx={4} fill={TINTE.tratto} />
      <path
        d={`M ${cx - 54} ${cy + 46} V ${cy - 10} L ${cx - 24} ${cy - 30} V ${cy - 10} L ${cx + 6} ${cy - 30} V ${cy - 10} L ${cx + 54} ${cy - 30} V ${cy + 46} Z`}
        fill={TINTE.carta}
        stroke={TINTE.tratto}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      {[-32, -4, 24].map((dx) => (
        <rect key={dx} x={cx + dx} y={cy + 4} width={16} height={16} rx={3} fill={TINTE.tinta} />
      ))}
      <rect x={cx - 10} y={cy + 24} width={20} height={22} rx={3} fill={TINTE.tratto} />
    </g>
  );
}

/** Un abete: i lavori nei boschi. */
function Abete({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 8} y={cy + 30} width={16} height={22} rx={4} fill={TINTE.accento} />
      <path d={`M ${cx} ${cy - 58} L ${cx + 30} ${cy - 16} H ${cx - 30} Z`} fill={TINTE.ok} />
      <path d={`M ${cx} ${cy - 34} L ${cx + 40} ${cy + 8} H ${cx - 40} Z`} fill={TINTE.ok} />
      <path d={`M ${cx} ${cy - 10} L ${cx + 50} ${cy + 34} H ${cx - 50} Z`} fill={TINTE.ok} />
    </g>
  );
}

/** Una croce rossa che si disegna sopra qualcosa (p da 0 a 1). */
function Croce({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: number }) {
  if (p <= 0) return null;
  return (
    <g opacity={p} stroke={TINTE.rischio} strokeWidth={12} strokeLinecap="round">
      <line x1={cx - r} y1={cy - r * 0.7} x2={cx + r} y2={cy + r * 0.7} />
      <line x1={cx + r} y1={cy - r * 0.7} x2={cx - r} y2={cy + r * 0.7} />
    </g>
  );
}

/** Una lente d'ingrandimento: la Suva esamina. */
function Lente({ cx, cy, r = 34 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <line x1={cx + r * 0.7} y1={cy + r * 0.7} x2={cx + r * 1.6} y2={cy + r * 1.6} stroke={TINTE.accento} strokeWidth={14} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill={TINTE.crema} fillOpacity={0.75} stroke={TINTE.accento} strokeWidth={9} />
      <path d={`M ${cx - r * 0.5} ${cy - r * 0.15} a ${r * 0.55} ${r * 0.55} 0 0 1 ${r * 0.4} ${-r * 0.35}`} fill="none" stroke={TINTE.carta} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
}

/** Un piccolo calendario da muro: il termine. */
function Calendario({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-64} y={-60} width={128} height={124} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-64} y={-60} width={128} height={34} rx={14} fill={TINTE.accento} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}-${c}`} x={-48 + c * 26} y={-12 + r * 24} width={18} height={14} rx={4} fill={r === 2 && c === 3 ? TINTE.accento : TINTE.tinta} />
        )),
      )}
    </g>
  );
}

/** Una clessidra: la domanda è in esame. `p` da 0 a 1 svuota la parte di sopra. */
function Clessidra({ cx, cy, p }: { cx: number; cy: number; p: number }) {
  const sopra = 1 - p;
  return (
    <g>
      <rect x={cx - 46} y={cy - 74} width={92} height={14} rx={7} fill={TINTE.accento} />
      <rect x={cx - 46} y={cy + 60} width={92} height={14} rx={7} fill={TINTE.accento} />
      <path d={`M ${cx - 36} ${cy - 60} H ${cx + 36} Q ${cx + 36} ${cy - 16} ${cx + 6} ${cy} Q ${cx + 36} ${cy + 16} ${cx + 36} ${cy + 60} H ${cx - 36} Q ${cx - 36} ${cy + 16} ${cx - 6} ${cy} Q ${cx - 36} ${cy - 16} ${cx - 36} ${cy - 60} Z`} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" />
      {/* sabbia: sopra cala, sotto cresce */}
      <path d={`M ${cx - 26 * sopra} ${cy - 8 - 40 * sopra} H ${cx + 26 * sopra} L ${cx} ${cy - 4} Z`} fill={TINTE.oro} opacity={sopra > 0.02 ? 1 : 0} />
      <path d={`M ${cx - 32} ${cy + 54} H ${cx + 32} L ${cx + 32 - 22 * (1 - p)} ${cy + 54 - 40 * (0.25 + 0.75 * p)} H ${cx - 32 + 22 * (1 - p)} Z`} fill={TINTE.oro} />
      <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 50} stroke={TINTE.oro} strokeWidth={3} opacity={p > 0 && p < 1 ? 1 : 0} />
    </g>
  );
}

/** Un rullo da pittore (il gessatore), con il manico in (x, y). */
function Rullo({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x + 12} y2={y - 52} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
      <path d={`M ${x + 12} ${y - 52} H ${x + 36} V ${y - 62}`} fill="none" stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" />
      <rect x={x + 6} y={y - 80} width={62} height={20} rx={10} fill={TINTE.carta} stroke={TINTE.accento} strokeWidth={5} />
    </g>
  );
}

/** Un piccolo documento (fattura, contratto…), con il contenuto facoltativo. */
function Doc({ x, y, w = 96, h = 124, children }: { x: number; y: number; w?: number; h?: number; children?: ReactNode }) {
  return (
    <Foglio x={x} y={y} w={w} h={h}>
      <Righe x={x + 14} y={y + 46} w={w - 40} n={3} passo={22} />
      {children}
    </Foglio>
  );
}

/** Una firma a ghirigoro. */
function Firma({ x, y, colore = TINTE.accento }: { x: number; y: number; colore?: string }) {
  return <path d={`M ${x} ${y} q 8 -18 14 0 q 6 16 14 -2 q 8 -18 16 2 q 4 8 12 -2`} fill="none" stroke={colore} strokeWidth={4} strokeLinecap="round" />;
}

/* 2. «Il controllo vale nei settori in cui la Suva assicura per legge i lavoratori. Per esempio edilizia e installazioni, pulizia di edifici, trasporti, industria e lavori nei boschi.» */
const SETTORI = [
  { x: 370, testo: "Edilizia", figura: <Cantiere cx={370} cy={465} /> },
  { x: 510, testo: "Pulizie", figura: <Pulizie cx={515} cy={460} /> },
  { x: 650, testo: "Trasporti", figura: <Camion cx={650} cy={470} /> },
  { x: 790, testo: "Industria", figura: <Fabbrica cx={790} cy={465} /> },
  { x: 930, testo: "Boschi", figura: <Abete cx={930} cy={465} /> },
];
const suvaSettori: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.55, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.55, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.8, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const scudo = fra(ctx, null, 0, 0.5, 0.25);
    const legge = fra(ctx, null, 0, 0.75, 0.35);
    const tempi = [fra(ctx, 0, 1, 0.25, 0.45), fra(ctx, 0, 1, 0.7, 0.55), fra(ctx, 1, null, 0.1, 0.65), fra(ctx, 1, null, 0.38, 0.75), fra(ctx, 1, null, 0.7, 0.85)];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="I settori della Suva" />
        {[430, 520, 610].map((x, i) => (
          <Compare key={x} v={molla(locale, 6 + i * 4, fps)} cx={x} cy={240}>
            <Persona x={x} y={300} s={0.62} colore={i === 1 ? TEAL_CHIARO : i === 2 ? TINTE.accento : TINTE.tratto} />
          </Compare>
        ))}
        <Compare v={molla(locale, scudo, fps)} cx={760} cy={205}>
          <Scudo x={760} y={215} s={1.4} />
        </Compare>
        <Compare v={molla(locale, legge, fps)} cx={600} cy={350}>
          <Pillola x={600} y={350} testo="Assicurati per legge" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {SETTORI.map((s, i) => (
          <Compare key={s.testo} v={molla(locale, tempi[i], fps)} cx={s.x} cy={480}>
            {s.figura}
            <Testo x={s.x} y={560} corpo={24} titolo peso={800} colore={TINTE.tratto}>
              {s.testo}
            </Testo>
          </Compare>
        ))}
      </Tela>
    );
  },
};

/* 3. «Perché questo controllo? Da dipendente sei assicurato contro gli infortuni per legge: ci pensa chi ti dà lavoro. Da indipendente no: dell'assicurazione ti occupi tu.» */
const suvaPerche: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.6, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.6, 0.4) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.25, 0.75) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const dipendente = fra(ctx, 0, 1, 0.1, 0.25);
    const scudo = fra(ctx, 0, 1, 0.65, 0.4);
    const datore = fra(ctx, 1, 2, 0.3, 0.55);
    const indipendente = fra(ctx, 2, null, 0.08, 0.7);
    const no = fra(ctx, 2, null, 0.3, 0.78);
    const tu = fra(ctx, 2, null, 0.7, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Perché il controllo" />
        <line x1={660} y1={130} x2={660} y2={520} stroke={TINTE.tinta} strokeWidth={5} strokeDasharray="4 14" strokeLinecap="round" opacity={tra(locale, indipendente - 10, indipendente)} />
        {/* Dipendente: lo assicura chi gli dà lavoro. */}
        <Compare v={molla(locale, dipendente, fps)} cx={480} cy={360}>
          <Palazzo x={400} y={400} s={0.7} />
          <Persona x={550} y={400} s={0.85} colore={TEAL_CHIARO} />
          <Pillola x={480} y={460} testo="Dipendente" corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, scudo, fps)} cx={550} cy={180}>
          <Scudo x={550} y={190} s={1.05} />
        </Compare>
        <Freccia d="M 410 250 Q 420 180 480 182" p={tra(locale, datore, datore + 14)} />
        {/* Indipendente: nessuna assicurazione d'obbligo, ci pensa da solo. */}
        <Compare v={molla(locale, indipendente, fps)} cx={820} cy={360}>
          <Persona x={800} y={400} s={0.85} colore={TINTE.accento} />
          <Valigetta x={878} y={400} s={0.8} />
          <Pillola x={820} y={460} testo="Indipendente" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={820} cy={180}>
          <g opacity={0.45}>
            <Scudo x={820} y={190} s={1.05} colore={GRIGIO} />
          </g>
          <Croce cx={820} cy={180} r={42} p={tra(locale, no + 6, no + 14)} />
        </Compare>
        <Compare v={molla(locale, tu, fps)} cx={820} cy={545}>
          <Pillola x={820} y={545} testo="Te ne occupi tu" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Non devi andare tu alla Suva. Presenti la domanda di riconoscimento alla cassa AVS, come tutti. Per questi settori la cassa la inoltra alla Suva, che esamina il tuo caso.» */
const suvaDomanda: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.6, 0.15) },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.5) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.8, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const diretta = fra(ctx, null, 0, 0.2, 0.08);
    const no = fra(ctx, null, 0, 0.6, 0.18);
    const domanda = fra(ctx, 0, 1, 0.25, 0.35);
    const cassa = fra(ctx, 0, 1, 0.6, 0.5);
    const inoltra = fra(ctx, 1, null, 0.3, 0.7);
    const esamina = fra(ctx, 1, null, 0.75, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Prima la cassa AVS" />
        <Compare v={molla(locale, 4, fps)} cx={380} cy={350}>
          <Persona x={380} y={440} s={0.9} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, 8, fps)} cx={860} cy={350}>
          <Palazzo x={860} y={430} s={0.85} nome="Suva" />
        </Compare>
        {/* La strada diretta alla Suva: non serve. */}
        <path d="M 420 250 Q 640 60 820 250" fill="none" stroke={TINTE.tratto} strokeWidth={7} strokeDasharray="6 16" strokeLinecap="round" opacity={0.6 * tra(locale, diretta, diretta + 12)} />
        <Croce cx={626} cy={156} r={30} p={tra(locale, no, no + 8)} />
        <Compare v={molla(locale, domanda, fps)} cx={480} cy={340}>
          <Doc x={436} y={280} w={88} h={112} />
        </Compare>
        <Freccia d="M 532 340 Q 560 330 580 352" p={tra(locale, cassa - 10, cassa + 2)} />
        <Compare v={molla(locale, cassa, fps)} cx={645} cy={360}>
          <Palazzo x={645} y={430} s={0.7} nome="AVS" colore={TINTE.accento} />
          <Pillola x={645} y={476} testo="Cassa AVS" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 708 360 Q 745 340 780 360" p={tra(locale, inoltra, inoltra + 14)} />
        <Compare v={molla(locale, esamina, fps)} cx={930} cy={210}>
          <Lente cx={930} cy={210} r={34} />
        </Compare>
        <Compare v={molla(locale, esamina + 6, fps)} cx={860} cy={476}>
          <Pillola x={860} y={476} testo="Esamina il caso" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Per la Suva sei indipendente se lavori a tuo nome e per conto tuo, per i tuoi clienti. Se il rischio economico è tuo. E se non dipendi dall'organizzazione di un'altra impresa.» */
const suvaCriteri = elenco(
  "Indipendente per la Suva",
  ["A tuo nome, per conto tuo", "Per i tuoi clienti", "Il rischio economico è tuo", "Non dipendi da un'altra impresa"],
  (ctx) => [fra(ctx, null, 0, 0.45, 0.2), fra(ctx, 0, 1, 0.2, 0.42), fra(ctx, 1, 2, 0.3, 0.58), fra(ctx, 2, null, 0.3, 0.78)],
);

/* 6. «Attenzione al subappalto. La Suva fa questo esempio: un gessatore rifà il soffitto di una famiglia, ma manda la fattura all'impresa che gli ha dato il lavoro. Così è considerato dipendente di quell'impresa.» */
const suvaSubappalto: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.3, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.5, 0.08) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.5, 0.65) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.4, 0.88) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const avviso = fra(ctx, null, 0, 0.3, 0.06);
    const gessatore = fra(ctx, 0, 1, 0.35, 0.25);
    const casa = fra(ctx, 0, 1, 0.75, 0.38);
    const fattura = fra(ctx, 1, 2, 0.15, 0.5);
    const impresa = fra(ctx, 1, 2, 0.5, 0.62);
    const dipendente = fra(ctx, 2, null, 0.25, 0.85);
    const rosso = tra(locale, dipendente, dipendente + 10);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il subappalto" />
        <Compare v={molla(locale, avviso, fps)} cx={470} cy={42}>
          <Avviso x={470} y={44} s={0.6} />
        </Compare>
        {/* La casa della famiglia, con il soffitto da rifare. */}
        <Compare v={molla(locale, casa, fps)} cx={420} cy={380}>
          <g transform="translate(420 455) scale(1.4) translate(-420 -455)">
            <path d="M 368 445 V 393 L 420 351 L 472 393 V 445 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
            <path d="M 354 399 L 420 343 L 486 399" fill="none" stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            <line x1={378} y1={398} x2={462} y2={398} stroke={TINTE.oro} strokeWidth={6} strokeLinecap="round" />
            <line x1={358} y1={445} x2={482} y2={445} stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" />
          </g>
          {[392, 420, 448].map((x, i) => (
            <Persona key={x} x={x} y={448} s={0.26 + (i === 1 ? 0 : 0.04)} colore={i === 1 ? TEAL_CHIARO : TINTE.tratto} />
          ))}
          <Righe2 x={420} y={500} righe={["Famiglia"]} corpo={24} />
        </Compare>
        {/* Il gessatore, con il rullo. */}
        <Compare v={molla(locale, gessatore, fps)} cx={620} cy={380}>
          <Persona x={620} y={460} s={0.82} colore={TINTE.accento} contorno={rosso > 0.5 ? TINTE.rischio : undefined} />
          <Rullo x={652} y={372} />
          <Righe2 x={620} y={500} righe={["Gessatore"]} corpo={24} colore={TINTE.accento} />
        </Compare>
        {/* La fattura va all'impresa, non alla famiglia. */}
        <Compare v={molla(locale, fattura, fps)} cx={735} cy={210}>
          <Doc x={700} y={150} w={72} h={92} />
        </Compare>
        <Freccia d="M 780 196 Q 850 190 866 262" p={tra(locale, fattura + 8, fattura + 22)} colore={TINTE.accento} />
        <Compare v={molla(locale, impresa, fps)} cx={870} cy={370}>
          <Palazzo x={870} y={450} s={0.85} />
          <Righe2 x={870} y={500} righe={["Impresa"]} corpo={24} />
        </Compare>
        <Compare v={molla(locale, dipendente, fps)} cx={650} cy={590}>
          <Pillola x={650} y={590} testo="Dipendente dell'impresa" corpo={28} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «In subappalto sei indipendente solo in casi eccezionali: se hai un posto di lavoro attrezzato, macchine o veicoli, il materiale pagato da te, dei dipendenti fissi. O se lavori regolarmente anche per clienti tuoi.» */
const suvaEccezioni = elenco(
  "Le eccezioni",
  ["Un posto di lavoro attrezzato", "Macchine, veicoli, materiale", "Dei dipendenti fissi", "O anche clienti tuoi"],
  (ctx) => [fra(ctx, 0, 1, 0.35, 0.3), fra(ctx, 1, 2, 0.15, 0.45), fra(ctx, 1, 2, 0.8, 0.65), fra(ctx, 2, null, 0.3, 0.85)],
);

/* 8. «Prepara le prove: contratti, offerte e fatture ai clienti, il sito o i biglietti da visita. Nell'edilizia anche le fatture di attrezzi e materiale, nei trasporti il contratto del veicolo. Se la Suva ti chiede i documenti, hai … giorni per mandarli.» */
const suvaProve: Disegno = {
  chiave: (ctx) => fra(ctx, 3, null, 0.5, 0.88),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.15) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.45) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.6, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const contratti = fra(ctx, null, 0, 0.35, 0.1);
    const fatture = fra(ctx, null, 0, 0.7, 0.18);
    const sito = fra(ctx, 0, 1, 0.15, 0.27);
    const biglietti = fra(ctx, 0, 1, 0.6, 0.33);
    const edilizia = fra(ctx, 1, 2, 0.3, 0.45);
    const trasporti = fra(ctx, 2, 3, 0.25, 0.62);
    const termine = fra(ctx, 3, null, 0.35, 0.82);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Le prove" />
        <Compare v={molla(locale, contratti, fps)} cx={380} cy={190}>
          <Doc x={332} y={110} w={96} h={124}>
            <Firma x={350} y={212} />
          </Doc>
          <Righe2 x={380} y={270} righe={["Contratti"]} corpo={22} />
        </Compare>
        <Compare v={molla(locale, fatture, fps)} cx={520} cy={190}>
          <Doc x={472} y={110} w={96} h={124}>
            <rect x={530} y={200} width={24} height={20} rx={4} fill={TINTE.accento} />
          </Doc>
          <Righe2 x={520} y={270} righe={["Offerte", "e fatture"]} corpo={22} passo={28} />
        </Compare>
        <Compare v={molla(locale, sito, fps)} cx={690} cy={180}>
          <rect x={615} y={118} width={150} height={112} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <rect x={615} y={118} width={150} height={24} rx={12} fill={TINTE.tratto} />
          <circle cx={632} cy={130} r={4} fill={TINTE.carta} />
          <circle cx={646} cy={130} r={4} fill={TINTE.carta} />
          <rect x={632} y={156} width={52} height={52} rx={8} fill={TINTE.tinta} />
          <Righe x={696} y={166} w={52} n={3} passo={18} />
          <Righe2 x={690} y={270} righe={["Il sito"]} corpo={22} />
        </Compare>
        <Compare v={molla(locale, biglietti, fps)} cx={870} cy={180}>
          <g transform="rotate(-8 870 176)">
            <rect x={806} y={140} width={128} height={74} rx={10} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
            <circle cx={836} cy={176} r={14} fill={TINTE.accento} />
            <line x1={860} y1={168} x2={914} y2={168} stroke={TINTE.accento} strokeWidth={7} strokeLinecap="round" />
            <line x1={860} y1={188} x2={900} y2={188} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
          </g>
          <Righe2 x={870} y={270} righe={["Biglietti"]} corpo={22} />
        </Compare>
        {/* Nell'edilizia: attrezzi e materiale. */}
        <Compare v={molla(locale, edilizia, fps)} cx={450} cy={420}>
          <Attrezzo cx={400} cy={404} />
          <Cantiere cx={492} cy={410} />
          <Righe2 x={450} y={500} righe={["Edilizia:", "attrezzi e materiale"]} corpo={22} passo={28} colore={TINTE.accento} />
        </Compare>
        {/* Nei trasporti: il veicolo. */}
        <Compare v={molla(locale, trasporti, fps)} cx={680} cy={420}>
          <Camion cx={665} cy={420} s={1.1} />
          <Doc x={744} y={326} w={58} h={74} />
          <Righe2 x={680} y={500} righe={["Trasporti:", "il veicolo"]} corpo={22} passo={28} colore={TINTE.accento} />
        </Compare>
        {/* Il termine per mandare i documenti alla Suva. */}
        <Compare v={molla(locale, termine, fps)} cx={880} cy={420}>
          <Calendario cx={880} cy={412} s={0.85} />
          <Righe2 x={880} y={500} righe={["Mandali", "in tempo"]} corpo={22} passo={28} colore={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 9. «Alla fine la Suva decide, d'accordo con la cassa AVS. Le decisioni possibili sono tre: indipendente, dipendente o doppio statuto. Cioè indipendente per alcuni lavori e dipendente per altri.» */
const DECISIONI = [
  { x: 420, testo: "Indipendente", corpo: 24 },
  { x: 640, testo: "Dipendente", corpo: 24 },
  { x: 860, testo: "Doppio statuto", corpo: 22 },
];
const suvaDecisione: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.4, 0.8),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.75, 0.25) },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.4, 0.8) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const avs = fra(ctx, null, 0, 0.6, 0.2);
    const accordo = fra(ctx, null, 0, 0.8, 0.27);
    const carte = [fra(ctx, 0, 1, 0.35, 0.45), fra(ctx, 0, 1, 0.58, 0.55), fra(ctx, 0, 1, 0.82, 0.65)];
    const doppio = fra(ctx, 1, null, 0.35, 0.8);
    const luce = tra(locale, doppio, doppio + 10);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La decisione" />
        <Compare v={molla(locale, 4, fps)} cx={500} cy={220}>
          <Palazzo x={500} y={290} s={0.72} nome="Suva" />
        </Compare>
        <Compare v={molla(locale, avs, fps)} cx={800} cy={220}>
          <Palazzo x={800} y={290} s={0.72} nome="AVS" colore={TINTE.accento} />
        </Compare>
        <Freccia d="M 580 214 H 718" p={tra(locale, accordo, accordo + 10)} />
        <Freccia d="M 720 250 H 582" p={tra(locale, accordo + 4, accordo + 14)} colore={TINTE.accento} />
        <Compare v={molla(locale, accordo + 8, fps)} cx={650} cy={320}>
          <Pillola x={650} y={320} testo="D'accordo" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {DECISIONI.map((d, i) => {
          const evidenza = i === 2 ? luce : 0;
          return (
            <Compare key={d.testo} v={molla(locale, carte[i], fps)} cx={d.x} cy={450}>
              <rect
                x={d.x - 100}
                y={380}
                width={200}
                height={140}
                rx={20}
                fill={evidenza > 0.5 ? TINTE.crema : TINTE.carta}
                stroke={evidenza > 0.5 ? TINTE.accento : TINTE.tratto}
                strokeWidth={5 + evidenza * 3}
              />
              {i === 0 ? <Valigetta x={d.x} y={448} s={0.7} /> : null}
              {i === 1 ? <Persona x={d.x} y={460} s={0.42} colore={TEAL_CHIARO} /> : null}
              {i === 2 ? (
                <g>
                  <Valigetta x={d.x - 40} y={448} s={0.55} />
                  <Persona x={d.x + 40} y={460} s={0.38} colore={TEAL_CHIARO} />
                </g>
              ) : null}
              <Testo x={d.x} y={492} corpo={d.corpo} titolo peso={800} colore={TINTE.tratto}>
                {d.testo}
              </Testo>
            </Compare>
          );
        })}
        <Compare v={molla(locale, doppio + 6, fps)} cx={860} cy={560}>
          <Righe2 x={860} y={556} righe={["Dipende dal lavoro"]} corpo={24} colore={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 10. «La decisione vale anche per il passato: se sei dipendente, i committenti devono assicurarti anche per i lavori già fatti. Non sei d'accordo? Parlane prima con l'agenzia Suva. Puoi fare opposizione scritta entro … giorni.» */
const suvaPassato: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.6, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.45, 0.15) },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.6, 0.45) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.7, 0.92) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const passato = fra(ctx, null, 0, 0.35, 0.12);
    const committenti = fra(ctx, 0, 1, 0.15, 0.32);
    const scudo = fra(ctx, 0, 1, 0.6, 0.45);
    const dubbio = fra(ctx, 1, 2, 0.2, 0.6);
    const suva = fra(ctx, 2, 3, 0.2, 0.72);
    const termine = fra(ctx, 3, null, 0.3, 0.86);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Anche per il passato" />
        {/* I lavori già fatti: la decisione torna indietro fino a loro. */}
        <Compare v={molla(locale, 4, fps)} cx={463} cy={260}>
          {[350, 430, 510].map((x) => (
            <Doc key={x} x={x} y={208} w={66} h={84} />
          ))}
          <Righe2 x={463} y={330} righe={["Lavori già fatti"]} corpo={22} />
        </Compare>
        <Freccia d="M 610 196 Q 480 96 350 184" p={tra(locale, passato, passato + 14)} colore={TINTE.accento} />
        <Compare v={molla(locale, committenti, fps)} cx={860} cy={260}>
          <Palazzo x={860} y={330} s={0.75} />
          <Pillola x={860} y={375} testo="Committenti" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 796 272 Q 750 250 704 254" p={tra(locale, scudo - 10, scudo + 2)} />
        <Compare v={molla(locale, scudo, fps)} cx={645} cy={245}>
          <Scudo x={645} y={258} s={0.95} />
        </Compare>
        {/* Non sei d'accordo: prima ne parli con la Suva, poi c'è l'opposizione. */}
        <Compare v={molla(locale, dubbio, fps)} cx={400} cy={540}>
          <Persona x={400} y={630} s={0.8} colore={TINTE.accento} />
          <Fumetto cx={472} cy={446} r={34}>
            <Testo x={472} y={448} corpo={40} titolo peso={800} colore={TINTE.rischio}>
              ?
            </Testo>
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, suva, fps)} cx={680} cy={470}>
          <Pillola x={680} y={470} testo="Parlane con la Suva" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, termine, fps)} cx={720} cy={580}>
          <Doc x={560} y={520} w={84} h={108}>
            <Firma x={576} y={606} />
          </Doc>
          <Calendario cx={720} cy={580} s={0.62} />
          <Righe2 x={850} y={570} righe={["Opposizione", "scritta"]} corpo={24} passo={30} colore={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 11. «E mentre aspetti? Se un committente ti chiede una conferma, spiegagli che la domanda è in esame: la conferma arriva solo dopo il sì della Suva. Intanto fatti confermare l'incarico per iscritto.» */
const suvaAttesa: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.6, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.75, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.7, 0.88) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const persone = 4;
    const domanda = fra(ctx, 0, 1, 0.2, 0.2);
    const esame = fra(ctx, 0, 1, 0.75, 0.4);
    const si = fra(ctx, 1, 2, 0.6, 0.62);
    const incarico = fra(ctx, 2, null, 0.3, 0.78);
    const sabbia = Math.min(1, Math.max(0, (locale - esame) / Math.max(1, si - esame)));
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Mentre aspetti" />
        <Compare v={molla(locale, persone, fps)} cx={400} cy={250}>
          <Persona x={400} y={340} s={0.85} colore={TINTE.accento} />
          <Righe2 x={400} y={378} righe={["Tu"]} corpo={22} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, persone + 6, fps)} cx={580} cy={250}>
          <Persona x={580} y={340} s={0.85} colore={TEAL_CHIARO} />
          <Righe2 x={580} y={378} righe={["Committente"]} corpo={22} colore={TEAL_CHIARO} />
        </Compare>
        <Compare v={molla(locale, domanda, fps)} cx={640} cy={130}>
          <Fumetto cx={650} cy={120} r={38}>
            <Testo x={650} y={122} corpo={42} titolo peso={800} colore={TINTE.rischio}>
              ?
            </Testo>
          </Fumetto>
        </Compare>
        {/* La domanda è in esame: la sabbia scende fino al sì della Suva. */}
        <Compare v={molla(locale, esame, fps)} cx={830} cy={230}>
          <Clessidra cx={830} cy={220} p={sabbia} />
          <Pillola x={830} y={330} testo="In esame" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <g opacity={tra(locale, si, si + 8)}>
          <Timbro cx={922} cy={150} r={40} />
        </g>
        {/* Intanto: l'incarico confermato per iscritto. */}
        <Compare v={molla(locale, incarico, fps)} cx={600} cy={520}>
          <Doc x={430} y={440} w={110} h={140}>
            <Firma x={452} y={552} />
          </Doc>
          <Spunta cx={530} cy={575} r={26} p={tra(locale, incarico + 8, incarico + 20)} />
          <Pillola x={760} y={510} testo="Incarico per iscritto" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_STATUTO_SUVA: Record<string, Disegno> = {
  "suva-settori": suvaSettori,
  "suva-perche": suvaPerche,
  "suva-domanda": suvaDomanda,
  "suva-criteri": suvaCriteri,
  "suva-subappalto": suvaSubappalto,
  "suva-eccezioni": suvaEccezioni,
  "suva-prove": suvaProve,
  "suva-decisione": suvaDecisione,
  "suva-passato": suvaPassato,
  "suva-attesa": suvaAttesa,
};
