/**
 * I disegni del video facoltativo della lezione 21 («Assumere il primo
 * dipendente»), vedi src/lezioni/assicurazioni-previdenza-dipendenti.ts.
 * Fonti: promemoria AVS 2.01, foglio IAS delle aliquote 2026 dei datori di
 * lavoro, LADI art. 3, decreto ticinese sugli assegni familiari 2026, LAINF
 * artt. 1a, 66 e 68-69, LPP artt. 2, 7, 11 e 66, CO artt. 320 e 330b, legge
 * ticinese sul salario minimo, Ufficio delle imposte alla fonte e del bollo.
 * Coordinate della tela 1000×700; l'angolo in basso a sinistra (x < 300,
 * y > 480) è della finestra di Bleo. Niente cifre: percentuali, soglie e
 * importi li dice solo la voce. Il titolare è color accento, il dipendente
 * verde acqua.
 */
import type { ReactNode } from "react";
import { Attrezzo, Compare, Foglio, Freccia, Fumetto, molla, Moneta, Palazzo, Persona, Pillola, Righe, Scudo, Spunta, TEAL_CHIARO, Testo, TINTE, tra } from "../figure";
import { Tela } from "./ditta-individuale";
import { COLORE_TENUE } from "./forme-giuridiche";
import { Camion, Cantiere, Fabbrica } from "./statuto-suva";
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

/** Il titolare (accento) e il dipendente (verde acqua). */
const TU = TINTE.accento;
const DIP = TEAL_CHIARO;

/** Un tondo rosso con la croce a X: «no». */
function No({ cx, cy, r = 22 }: { cx: number; cy: number; r?: number }) {
  const d = r * 0.42;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.rischio} stroke={TINTE.carta} strokeWidth={4} />
      <g stroke={TINTE.carta} strokeWidth={r * 0.3} strokeLinecap="round">
        <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} />
        <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d} />
      </g>
    </g>
  );
}

/** Una moneta che vola da (x0, y0) a (x1, y1) fra i fotogrammi da e a, poi sparisce dentro. */
function MonetaInVolo({ locale, da, a, x0, y0, x1, y1, r = 22 }: { locale: number; da: number; a: number; x0: number; y0: number; x1: number; y1: number; r?: number }) {
  if (locale < da) return null;
  const t = tra(locale, da, a);
  const fuori = tra(locale, a, a + 8);
  if (fuori >= 1) return null;
  const x = x0 + (x1 - x0) * t;
  // Un piccolo arco verso l'alto.
  const y = y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * 50;
  return (
    <g opacity={1 - fuori}>
      <Moneta cx={x} cy={y} r={r * (1 - fuori * 0.5)} />
    </g>
  );
}

/** Una barra divisa a metà: a sinistra il titolare, a destra il dipendente (`p` la fa crescere da sinistra). */
function BarraMeta({ x, y, w, h = 46, p, etichette = false }: { x: number; y: number; w: number; h?: number; p: number; etichette?: boolean }) {
  if (p <= 0) return null;
  const id = `barra-${x}-${y}`;
  const meta = w / 2;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={y - h / 2} width={w * p} height={h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={x} y={y - h / 2} width={w} height={h} rx={h / 2} fill={DIP} />
        <path d={`M ${x + meta} ${y - h / 2} H ${x + h / 2} A ${h / 2} ${h / 2} 0 0 0 ${x + h / 2} ${y + h / 2} H ${x + meta} Z`} fill={TU} />
        <line x1={x + meta} y1={y - h / 2} x2={x + meta} y2={y + h / 2} stroke={TINTE.carta} strokeWidth={5} />
        {etichette ? (
          <g>
            <Testo x={x + meta / 2} y={y + 1} corpo={22} titolo peso={800} colore={TINTE.carta}>
              tu
            </Testo>
            <Testo x={x + meta * 1.5} y={y + 1} corpo={22} titolo peso={800} colore={TINTE.carta}>
              dipendente
            </Testo>
          </g>
        ) : null}
      </g>
    </g>
  );
}

/** Un calendario piccolo, senza numeri, con il nome del mese nella testata (centro in cx, cy). */
function Calendario({ cx, cy, s = 1, mese }: { cx: number; cy: number; s?: number; mese?: string }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-60} y={-52} width={120} height={108} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-60} y={-52} width={120} height={34} rx={14} fill={TINTE.accento} />
      <rect x={-60} y={-30} width={120} height={12} fill={TINTE.accento} />
      {mese ? (
        <Testo x={0} y={-34} corpo={20} titolo peso={800} colore={TINTE.carta}>
          {mese}
        </Testo>
      ) : null}
      {Array.from({ length: 9 }, (_, k) => (
        <rect key={k} x={-42 + (k % 3) * 30} y={-6 + Math.floor(k / 3) * 20} width={22} height={12} rx={4} fill={TINTE.tinta} />
      ))}
    </g>
  );
}

/** Un orologio senza numeri: la lancetta lunga gira piano. */
function Orologio({ cx, cy, r = 34, locale }: { cx: number; cy: number; r?: number; locale: number }) {
  const giro = (locale * 4) % 360;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={Math.max(4, r * 0.09)} />
      {[0, 90, 180, 270].map((a) => (
        <line
          key={a}
          x1={cx}
          y1={cy - r * 0.78}
          x2={cx}
          y2={cy - r * 0.9}
          stroke={TINTE.tratto}
          strokeWidth={Math.max(3, r * 0.06)}
          strokeLinecap="round"
          transform={`rotate(${a} ${cx} ${cy})`}
        />
      ))}
      <line x1={cx} y1={cy} x2={cx + r * 0.42} y2={cy} stroke={TINTE.tratto} strokeWidth={Math.max(4, r * 0.09)} strokeLinecap="round" />
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - r * 0.68}
        stroke={TINTE.accento}
        strokeWidth={Math.max(3, r * 0.07)}
        strokeLinecap="round"
        transform={`rotate(${giro} ${cx} ${cy})`}
      />
      <circle cx={cx} cy={cy} r={Math.max(4, r * 0.08)} fill={TINTE.tratto} />
    </g>
  );
}

/** La tessera della cassa malati (angolo in alto a sinistra in x, y). */
function Tessera({ x, y, w = 220, h = 140 }: { x: number; y: number; w?: number; h?: number }) {
  const r = h * 0.16;
  const cx = x + h * 0.31;
  const cy = y + h * 0.71;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h * 0.13} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      <rect x={x + 3} y={y + h * 0.19} width={w - 6} height={h * 0.17} fill={TINTE.tinta} />
      <circle cx={cx} cy={cy} r={r} fill={TINTE.rischio} />
      <rect x={cx - r * 0.23} y={cy - r * 0.6} width={r * 0.46} height={r * 1.2} rx={r * 0.09} fill={TINTE.carta} />
      <rect x={cx - r * 0.6} y={cy - r * 0.23} width={r * 1.2} height={r * 0.46} rx={r * 0.09} fill={TINTE.carta} />
      <Righe x={x + h * 0.6} y={y + h * 0.63} w={w - h * 0.83} n={2} passo={h * 0.17} />
    </g>
  );
}

/** Un permesso per stranieri: una tessera con la lettera grande (angolo in alto a sinistra in x, y). */
function Permesso({ x, y, lettera, colore = TINTE.tratto }: { x: number; y: number; lettera: string; colore?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={76} height={100} rx={12} fill={TINTE.carta} stroke={colore} strokeWidth={5} />
      <rect x={x + 3} y={y + 3} width={70} height={22} rx={9} fill={TINTE.tinta} />
      <Testo x={x + 38} y={y + 64} corpo={46} titolo peso={800} colore={colore}>
        {lettera}
      </Testo>
    </g>
  );
}

/** Una pila di monete viste di lato (base in x, y). */
function Pila({ x, y, n, rx = 40, passo = 18 }: { x: number; y: number; n: number; rx?: number; passo?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const cy = y - i * passo - passo / 2;
        return (
          <g key={i}>
            <rect x={x - rx} y={cy - passo / 2} width={rx * 2} height={passo} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={4} />
            <ellipse cx={x} cy={cy - passo / 2} rx={rx} ry={passo * 0.45} fill="#e8b85a" stroke={TINTE.accento} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
}

/** Una torta divisa a metà: a sinistra il titolare, a destra il dipendente. */
function TortaMeta({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`} fill={TU} />
      <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`} fill={DIP} />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={TINTE.carta} strokeWidth={6} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TINTE.tratto} strokeWidth={5} />
    </g>
  );
}

/* 2. «Prima cosa: annunciati alla tua cassa AVS come datore di lavoro. Dal salario trattieni la parte del dipendente e la versi alla cassa con la tua. Nel …: per AVS, invalidità e perdita di guadagno il …, per la disoccupazione il …. Metà a testa.» */
const BARRE = { x: 575, avs: 440, ad: 530, wAvs: 370, wAd: 124 } as const;
const dipCassa: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.45, 0.2),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.45, 0.2) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.65) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.3, 0.95) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cassa = fra(ctx, null, 0, 0.4, 0.12);
    const datore = fra(ctx, null, 0, 0.72, 0.2);
    const dipendente = fra(ctx, 0, 1, 0.12, 0.3);
    const sua = fra(ctx, 0, 1, 0.45, 0.4);
    const mia = fra(ctx, 0, 1, 0.75, 0.5);
    const avs = fra(ctx, 1, 2, 0.35, 0.62);
    const ad = fra(ctx, 2, 3, 0.25, 0.86);
    const meta = fra(ctx, 3, null, 0.1, 0.93);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Alla cassa AVS" />
        <Compare v={molla(locale, 6, fps, true)} cx={400} cy={230}>
          <Persona x={400} y={300} s={0.8} colore={TU} />
          <Testo x={400} y={330} corpo={24} titolo peso={800} colore={TU}>
            Tu
          </Testo>
        </Compare>
        <Compare v={molla(locale, cassa, fps)} cx={830} cy={230}>
          <Palazzo x={830} y={300} s={0.8} nome="AVS" />
          <Testo x={830} y={330} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            La tua cassa
          </Testo>
        </Compare>
        <Freccia d="M 455 150 Q 600 70 745 140" p={tra(locale, cassa + 4, cassa + 18)} />
        <Compare v={molla(locale, datore, fps)} cx={600} cy={150}>
          <Pillola x={600} y={150} testo="Datore di lavoro" corpo={24} fondo={TINTE.crema} colore={TU} bordo={TU} />
        </Compare>
        <Compare v={molla(locale, dipendente, fps, true)} cx={530} cy={240}>
          <Persona x={530} y={300} s={0.7} colore={DIP} />
          <Testo x={530} y={330} corpo={22} titolo peso={800} colore={DIP}>
            Dipendente
          </Testo>
        </Compare>
        {/* La sua parte (trattenuta dal salario) e la tua vanno alla cassa. */}
        <MonetaInVolo locale={locale} da={sua} a={sua + 22} x0={560} y0={200} x1={812} y1={250} />
        <MonetaInVolo locale={locale} da={mia} a={mia + 22} x0={440} y0={200} x1={812} y1={250} />
        <Compare v={molla(locale, avs - 6, fps)} cx={430} cy={BARRE.avs}>
          <Testo x={325} y={BARRE.avs} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            AVS, AI e IPG
          </Testo>
        </Compare>
        <BarraMeta x={BARRE.x} y={BARRE.avs} w={BARRE.wAvs} p={tra(locale, avs, avs + 20)} etichette />
        <Compare v={molla(locale, ad - 6, fps)} cx={440} cy={BARRE.ad}>
          <Testo x={325} y={BARRE.ad} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Disoccupazione
          </Testo>
        </Compare>
        <BarraMeta x={BARRE.x} y={BARRE.ad} w={BARRE.wAd} p={tra(locale, ad, ad + 14)} />
        <Compare v={molla(locale, meta, fps)} cx={760} cy={615}>
          <Pillola x={760} y={615} testo="Metà a testa" corpo={28} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «I contributi per gli assegni familiari li paghi solo tu. Alla cassa cantonale, nel …, l'… dei salari, più piccoli contributi e spese. Entro il … gennaio dichiari alla cassa i salari dell'anno prima.» */
const dipAssegni: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.6, 0.3) + 4 },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.45) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.75, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const solo = fra(ctx, null, 0, 0.55, 0.3);
    const cassa = fra(ctx, 0, 1, 0.2, 0.36);
    const versa = fra(ctx, 0, 1, 0.55, 0.45);
    const piccoli = fra(ctx, 1, 2, 0.15, 0.58);
    const gennaio = fra(ctx, 2, null, 0.2, 0.78);
    const salari = fra(ctx, 2, null, 0.55, 0.86);
    const invio = fra(ctx, 2, null, 0.8, 0.93);
    const sale = tra(locale, invio, invio + 16);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Assegni familiari" />
        <Compare v={molla(locale, 6, fps, true)} cx={400} cy={240}>
          <Persona x={400} y={310} s={0.8} colore={TU} />
        </Compare>
        <Compare v={molla(locale, 12, fps, true)} cx={540} cy={250}>
          <Persona x={540} y={310} s={0.7} colore={DIP} />
        </Compare>
        <Compare v={molla(locale, solo, fps)} cx={455} cy={190}>
          <Moneta cx={455} cy={190} r={26} />
        </Compare>
        <Compare v={molla(locale, solo + 6, fps)} cx={596} cy={236}>
          <No cx={596} cy={236} r={22} />
        </Compare>
        <Compare v={molla(locale, solo + 10, fps)} cx={470} cy={360}>
          <Pillola x={470} y={360} testo="Paghi solo tu" corpo={26} fondo={TU} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, cassa, fps)} cx={830} cy={250}>
          <Palazzo x={830} y={320} s={0.82} />
          <Testo x={830} y={352} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Cassa cantonale
          </Testo>
        </Compare>
        <Freccia d="M 490 175 Q 620 110 735 190" p={tra(locale, versa - 10, versa + 4)} colore={TU} />
        <MonetaInVolo locale={locale} da={versa} a={versa + 22} x0={455} y0={190} x1={810} y1={262} />
        {/* Più piccoli contributi e le spese della cassa. */}
        <Compare v={molla(locale, piccoli, fps)} cx={470} cy={458}>
          <Moneta cx={352} cy={448} r={16} />
          <Moneta cx={372} cy={468} r={16} />
          <Moneta cx={392} cy={448} r={16} />
          <Testo x={420} y={442} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Piccoli contributi
          </Testo>
          <Testo x={420} y={474} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
            e spese della cassa
          </Testo>
        </Compare>
        {/* A gennaio: i salari dell'anno prima vanno alla cassa. */}
        <Compare v={molla(locale, gennaio, fps)} cx={700} cy={545}>
          <Calendario cx={700} cy={545} mese="gennaio" />
        </Compare>
        <g transform={`translate(0 ${-sale * 120})`} opacity={1 - tra(locale, invio + 12, invio + 22)}>
          <Compare v={molla(locale, salari, fps)} cx={860} cy={545}>
            <Foglio x={800} y={475} w={120} h={140}>
              <Testo x={850} y={510} corpo={22} titolo peso={800} colore={TINTE.tratto}>
                Salari
              </Testo>
              <Righe x={818} y={545} w={84} n={3} passo={22} />
            </Foglio>
          </Compare>
        </g>
        <Freccia d="M 860 465 V 392" p={tra(locale, invio - 6, invio + 6)} />
        <Spunta cx={930} cy={168} r={26} p={tra(locale, invio + 18, invio + 30)} />
      </Tela>
    );
  },
};

/* 4. «Poi gli infortuni: assicurare i dipendenti è obbligatorio. Nei settori della Suva, come edilizia, trasporti e industria, li assicura la Suva. Negli altri l'assicuratore lo scegli tu, anche una cassa malati.» */
const SETTORI: { x: number; testo: string; figura: (x: number) => ReactNode }[] = [
  { x: 372, testo: "Edilizia", figura: (x) => <Cantiere cx={x} cy={430} /> },
  { x: 476, testo: "Trasporti", figura: (x) => <Camion cx={x} cy={438} s={0.82} /> },
  { x: 580, testo: "Industria", figura: (x) => <Fabbrica cx={x} cy={430} /> },
];
const dipInfortuni: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.75, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.2) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.75, 0.6) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.85, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const obbligo = fra(ctx, null, 0, 0.55, 0.18);
    const settori = fra(ctx, 0, 1, 0.05, 0.3);
    const tempi = [fra(ctx, 0, 1, 0.45, 0.38), fra(ctx, 1, 2, 0.1, 0.48), fra(ctx, 1, 2, 0.35, 0.53)];
    const suva = fra(ctx, 1, 2, 0.72, 0.6);
    const altri = fra(ctx, 2, null, 0.1, 0.7);
    const assicurazione = fra(ctx, 2, null, 0.3, 0.76);
    const scegli = fra(ctx, 2, null, 0.45, 0.8);
    const cassaMalati = fra(ctx, 2, null, 0.72, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Infortuni" />
        <Compare v={molla(locale, 6, fps, true)} cx={450} cy={210}>
          <Persona x={450} y={290} s={0.78} colore={DIP} />
        </Compare>
        <Compare v={molla(locale, obbligo, fps)} cx={545} cy={170}>
          <Scudo x={545} y={180} s={0.95} />
        </Compare>
        <Compare v={molla(locale, obbligo + 8, fps)} cx={770} cy={200}>
          <Pillola x={770} y={200} testo="Obbligatoria" corpo={30} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* I settori della Suva, a sinistra. */}
        <Compare v={molla(locale, settori, fps)} cx={476} cy={345}>
          <Testo x={476} y={345} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Settori della Suva
          </Testo>
        </Compare>
        {SETTORI.map((s, i) => (
          <Compare key={s.testo} v={molla(locale, tempi[i], fps)} cx={s.x} cy={450}>
            {s.figura(s.x)}
            <Testo x={s.x} y={507} corpo={20} titolo peso={800} colore={COLORE_TENUE}>
              {s.testo}
            </Testo>
          </Compare>
        ))}
        <Compare v={molla(locale, suva, fps)} cx={476} cy={585}>
          <Pillola x={476} y={585} testo="Suva" corpo={30} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <line x1={648} y1={330} x2={648} y2={620} stroke={COLORE_TENUE} strokeWidth={4} strokeDasharray="10 10" strokeLinecap="round" opacity={0.45 * tra(locale, altri - 10, altri)} />
        {/* Negli altri settori, a destra. */}
        <Compare v={molla(locale, altri, fps)} cx={815} cy={345}>
          <Testo x={815} y={345} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Negli altri settori
          </Testo>
        </Compare>
        <Compare v={molla(locale, assicurazione, fps)} cx={740} cy={455}>
          <Palazzo x={740} y={500} s={0.5} colore={TINTE.accento} />
          <Testo x={740} y={524} corpo={20} titolo peso={800} colore={COLORE_TENUE}>
            Assicurazione
          </Testo>
        </Compare>
        <Compare v={molla(locale, cassaMalati, fps)} cx={890} cy={460}>
          <Tessera x={832} y={418} w={116} h={76} />
          <Testo x={890} y={524} corpo={20} titolo peso={800} colore={COLORE_TENUE}>
            Cassa malati
          </Testo>
        </Compare>
        <Compare v={molla(locale, scegli, fps)} cx={815} cy={585}>
          <Pillola x={815} y={585} testo="La scegli tu" corpo={28} fondo={TU} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «La cassa pensione è obbligatoria se il dipendente ha più di … anni, e da te guadagna più di … all'anno nel …, o di … nel …. Allora ti affili a un istituto di previdenza e paghi almeno metà dei contributi.» */
const GRAFICO = { base: 320, soglia: 232, salita: 26, barra: { x: 620, w: 84, cima: 132 } } as const;
const dipLpp: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.8, 0.25) },
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.5, 0.45) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.8, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const eta = fra(ctx, null, 0, 0.72, 0.25);
    const grafico = fra(ctx, 0, 1, 0.02, 0.32);
    const soglia = fra(ctx, 0, 1, 0.22, 0.38);
    const cresce = fra(ctx, 0, 1, 0.32, 0.42);
    const sale = fra(ctx, 0, 1, 0.68, 0.55);
    const istituto = fra(ctx, 1, null, 0.2, 0.72);
    const torta = fra(ctx, 1, null, 0.62, 0.86);
    const salita = tra(locale, sale, sale + 16) * GRAFICO.salita;
    const ySoglia = GRAFICO.soglia - salita;
    const h = (GRAFICO.base - GRAFICO.barra.cima) * tra(locale, cresce, cresce + 24);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cassa pensione" />
        <Compare v={molla(locale, 6, fps, true)} cx={410} cy={240}>
          <Persona x={410} y={320} s={0.85} colore={DIP} />
        </Compare>
        <Spunta cx={478} cy={150} r={24} p={tra(locale, eta + 4, eta + 16)} />
        <Compare v={molla(locale, eta, fps)} cx={410} cy={358}>
          <Pillola x={410} y={358} testo="Ha l'età minima" corpo={22} fondo={TINTE.crema} colore={TINTE.ok} bordo={TINTE.ok} />
        </Compare>
        {/* Il salario annuo sopra la soglia d'entrata. */}
        <Compare v={molla(locale, grafico, fps, true)} cx={750} cy={GRAFICO.base}>
          <line x1={560} y1={GRAFICO.base} x2={950} y2={GRAFICO.base} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
          <Testo x={662} y={GRAFICO.base + 28} corpo={22} titolo peso={800} colore={DIP}>
            Salario annuo
          </Testo>
        </Compare>
        {h > 0 ? <rect x={GRAFICO.barra.x} y={GRAFICO.base - h} width={GRAFICO.barra.w} height={h} rx={12} fill={DIP} /> : null}
        <g opacity={tra(locale, soglia, soglia + 10)}>
          <line x1={560} y1={ySoglia} x2={950} y2={ySoglia} stroke={TINTE.accento} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" />
          <Testo x={848} y={ySoglia - 20} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Soglia d'entrata
          </Testo>
        </g>
        <Freccia d="M 778 266 V 216" p={tra(locale, sale, sale + 12)} colore={TINTE.accento} spessore={7} />
        <Compare v={molla(locale, sale + 10, fps)} cx={805} cy={276}>
          <Testo x={792} y={276} corpo={20} titolo peso={800} colore={TINTE.accento} ancora="start">
            poi sale
          </Testo>
        </Compare>
        <Spunta cx={GRAFICO.barra.x + GRAFICO.barra.w / 2} cy={GRAFICO.barra.cima - 34} r={24} p={tra(locale, cresce + 26, cresce + 38)} />
        {/* L'istituto di previdenza e i contributi: almeno metà li paghi tu. */}
        <Compare v={molla(locale, istituto, fps)} cx={450} cy={540}>
          <Palazzo x={450} y={598} s={0.7} />
          <Testo x={450} y={628} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Istituto di previdenza
          </Testo>
        </Compare>
        <Freccia d="M 712 525 Q 620 488 530 525" p={tra(locale, torta - 4, torta + 10)} />
        <Compare v={molla(locale, torta, fps)} cx={800} cy={520}>
          <TortaMeta cx={800} cy={512} r={66} />
          <Pillola x={800} y={622} testo="Almeno metà la paghi tu" corpo={22} fondo={TU} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Il contratto di lavoro vale anche a voce. Ma se assumi per più di un mese, entro il primo mese dai al dipendente per iscritto: nomi, inizio, funzione, salario e ore alla settimana.» */
const PUNTI_SCRITTI = ["Nomi", "Inizio", "Funzione", "Salario", "Ore alla settimana"] as const;
const FOGLIO_CONTRATTO = { x: 630, y: 96, w: 330, h: 520 } as const;
const dipContratto: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.3, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "festeggia", quando: fra(ctx, null, 0, 0.75, 0.2) + 4 },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.3, 0.5) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.92, 0.95) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const parlano = fra(ctx, null, 0, 0.25, 0.08);
    const vale = fra(ctx, null, 0, 0.7, 0.18);
    const mese = fra(ctx, 0, 1, 0.35, 0.3);
    const foglio = fra(ctx, 1, 2, 0.25, 0.5);
    const punti = PUNTI_SCRITTI.map((_, i) => fra(ctx, 2, null, 0.04 + i * 0.18, 0.66 + i * 0.06));
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il contratto" />
        <Compare v={molla(locale, 6, fps, true)} cx={400} cy={250}>
          <Persona x={400} y={330} s={0.8} colore={TU} />
        </Compare>
        <Compare v={molla(locale, 10, fps, true)} cx={530} cy={260}>
          <Persona x={530} y={330} s={0.75} colore={DIP} />
        </Compare>
        <Compare v={molla(locale, parlano, fps)} cx={430} cy={118}>
          <Fumetto cx={430} cy={118} r={34}>
            {[-12, 0, 12].map((d) => (
              <circle key={d} cx={430 + d} cy={118} r={5} fill={TINTE.tratto} />
            ))}
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, parlano + 8, fps)} cx={566} cy={130}>
          <Fumetto cx={566} cy={130} r={30}>
            {[-10, 0, 10].map((d) => (
              <circle key={d} cx={566 + d} cy={130} r={4.5} fill={TINTE.tratto} />
            ))}
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, vale, fps)} cx={465} cy={380}>
          <Pillola x={465} y={380} testo="Vale anche a voce" corpo={24} fondo={TINTE.crema} colore={TINTE.ok} bordo={TINTE.ok} />
        </Compare>
        <Compare v={molla(locale, mese, fps)} cx={465} cy={540}>
          <Calendario cx={465} cy={530} s={0.95} />
          <Testo x={465} y={612} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Entro il primo mese
          </Testo>
        </Compare>
        <Freccia d="M 530 500 Q 580 470 622 470" p={tra(locale, foglio - 8, foglio + 4)} />
        <Compare v={molla(locale, foglio, fps, true)} cx={FOGLIO_CONTRATTO.x + FOGLIO_CONTRATTO.w / 2} cy={FOGLIO_CONTRATTO.y + FOGLIO_CONTRATTO.h / 2}>
          <Foglio x={FOGLIO_CONTRATTO.x} y={FOGLIO_CONTRATTO.y} w={FOGLIO_CONTRATTO.w} h={FOGLIO_CONTRATTO.h}>
            <Testo x={FOGLIO_CONTRATTO.x + 136} y={FOGLIO_CONTRATTO.y + 56} corpo={30} titolo peso={800} colore={TINTE.tratto}>
              Per iscritto
            </Testo>
            {PUNTI_SCRITTI.map((testo, i) => {
              const y = FOGLIO_CONTRATTO.y + 140 + i * 78;
              return (
                <g key={testo} opacity={tra(locale, punti[i], punti[i] + 6)}>
                  <Spunta cx={FOGLIO_CONTRATTO.x + 40} cy={y} r={18} p={tra(locale, punti[i], punti[i] + 12)} />
                  <Testo x={FOGLIO_CONTRATTO.x + 72} y={y} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
                    {testo}
                  </Testo>
                </g>
              );
            })}
          </Foglio>
        </Compare>
      </Tela>
    );
  },
};

/* 7. «In Ticino c'è anche un salario minimo per legge. Nel … va da … a … lordi all'ora, secondo il settore. Nel … da … a …. Non vale, per esempio, per gli apprendisti.» */
const SCALA = { y: 340, da: 600, a: 950, banda: 46 } as const;
const dipSalario: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.12) },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.3) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.6, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const legge = fra(ctx, null, 0, 0.55, 0.12);
    const banda = fra(ctx, 0, 1, 0.25, 0.3);
    const settori = fra(ctx, 0, 1, 0.65, 0.45);
    const sale = fra(ctx, 1, 2, 0.2, 0.62);
    const apprendista = fra(ctx, 2, null, 0.25, 0.82);
    const no = fra(ctx, 2, null, 0.55, 0.9);
    const spostamento = tra(locale, sale, sale + 20) * 70;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Salario minimo" />
        <Compare v={molla(locale, 6, fps)} cx={440} cy={200}>
          <Orologio cx={440} cy={196} r={72} locale={locale} />
          <Moneta cx={510} cy={262} r={30} />
        </Compare>
        <Compare v={molla(locale, legge, fps)} cx={445} cy={340}>
          <Pillola x={445} y={340} testo="Per legge, in Ticino" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {/* La scala dei salari all'ora: più a destra, più alto. */}
        <Compare v={molla(locale, banda - 6, fps, true)} cx={775} cy={SCALA.y}>
          <Freccia d={`M ${SCALA.da} ${SCALA.y} H ${SCALA.a}`} p={1} />
          <Testo x={775} y={SCALA.y + 32} corpo={20} titolo peso={800} colore={COLORE_TENUE}>
            Lordo, all'ora
          </Testo>
        </Compare>
        <Compare v={molla(locale, banda, fps)} cx={720} cy={244}>
          <Testo x={720 + spostamento} y={196} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Secondo il settore
          </Testo>
          <rect x={650 + spostamento} y={244 - SCALA.banda / 2} width={140} height={SCALA.banda} rx={SCALA.banda / 2} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} />
          <line x1={650 + spostamento} y1={268} x2={650 + spostamento} y2={SCALA.y - 6} stroke={TINTE.tratto} strokeWidth={4} strokeDasharray="6 6" />
          <line x1={790 + spostamento} y1={268} x2={790 + spostamento} y2={SCALA.y - 6} stroke={TINTE.tratto} strokeWidth={4} strokeDasharray="6 6" />
        </Compare>
        {[0, 1, 2, 3].map((k) => (
          <Compare key={k} v={molla(locale, settori + k * 4, fps)} cx={672 + k * 32 + spostamento} cy={244}>
            <circle cx={672 + k * 32 + spostamento} cy={244} r={9} fill={[TINTE.tratto, DIP, TINTE.accento, TINTE.oro][k]} />
          </Compare>
        ))}
        <Freccia d="M 740 290 Q 775 300 800 290" p={tra(locale, sale, sale + 14)} colore={TINTE.accento} spessore={7} />
        <Compare v={molla(locale, sale + 12, fps)} cx={915} cy={244}>
          <Testo x={872} y={244} corpo={22} titolo peso={800} colore={TINTE.accento} ancora="start">
            poi sale
          </Testo>
        </Compare>
        {/* Le eccezioni, per esempio gli apprendisti. */}
        <Compare v={molla(locale, apprendista, fps, true)} cx={460} cy={540}>
          <Persona x={460} y={600} s={0.6} colore={DIP} />
          <Attrezzo cx={532} cy={576} />
          <Testo x={460} y={628} corpo={22} titolo peso={800} colore={DIP}>
            Apprendista
          </Testo>
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={600} cy={520}>
          <Orologio cx={600} cy={520} r={30} locale={locale} />
          <No cx={624} cy={544} r={16} />
        </Compare>
        <Compare v={molla(locale, no + 6, fps)} cx={810} cy={532}>
          <Pillola x={810} y={532} testo="Ci sono eccezioni" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Il dipendente non ha il permesso di domicilio, per esempio ha un permesso B o G? Allora dal salario trattieni l'imposta alla fonte. Prima apri una partita fiscale all'Ufficio delle imposte alla fonte e del bollo.» */
const dipFonte: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.55, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.7, 0.3) },
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.55, 0.5) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.85, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const domicilio = fra(ctx, null, 0, 0.3, 0.12);
    const b = fra(ctx, null, 0, 0.62, 0.25);
    const g = fra(ctx, null, 0, 0.8, 0.32);
    const salario = fra(ctx, 0, 1, 0.1, 0.4);
    const imposta = fra(ctx, 0, 1, 0.3, 0.45);
    const trattieni = fra(ctx, 0, 1, 0.55, 0.52);
    const ufficio = fra(ctx, 1, null, 0.25, 0.7);
    const partita = fra(ctx, 1, null, 0.08, 0.66);
    const fatto = fra(ctx, 1, null, 0.8, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Imposta alla fonte" />
        <Compare v={molla(locale, 6, fps, true)} cx={400} cy={240}>
          <Persona x={400} y={320} s={0.85} colore={DIP} />
        </Compare>
        <Compare v={molla(locale, domicilio, fps)} cx={480} cy={360}>
          <Testo x={480} y={360} corpo={20} titolo peso={800} colore={COLORE_TENUE}>
            Senza permesso di domicilio
          </Testo>
        </Compare>
        <Compare v={molla(locale, b, fps)} cx={508} cy={200}>
          <Permesso x={470} y={150} lettera="B" />
        </Compare>
        <Compare v={molla(locale, g, fps)} cx={596} cy={200}>
          <Permesso x={558} y={150} lettera="G" colore={DIP} />
        </Compare>
        {/* Dal salario, una parte va all'imposta alla fonte. */}
        <Compare v={molla(locale, salario, fps)} cx={735} cy={260}>
          <Pila x={735} y={300} n={5} />
          <Testo x={735} y={330} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Salario
          </Testo>
        </Compare>
        <Compare v={molla(locale, imposta, fps)} cx={885} cy={245}>
          <rect x={822} y={196} width={128} height={100} rx={18} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
          <Testo x={886} y={232} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Imposta
          </Testo>
          <Testo x={886} y={262} corpo={22} titolo peso={800} colore={TINTE.accento}>
            alla fonte
          </Testo>
        </Compare>
        <MonetaInVolo locale={locale} da={trattieni} a={trattieni + 22} x0={735} y0={196} x1={886} y1={246} r={20} />
        {/* Prima: la partita fiscale all'Ufficio delle imposte alla fonte e del bollo. */}
        <Compare v={molla(locale, partita, fps)} cx={900} cy={540}>
          <Foglio x={840} y={466} w={120} h={142}>
            <Righe x={858} y={520} w={84} n={3} passo={24} />
          </Foglio>
          <Testo x={900} y={630} corpo={20} titolo peso={800} colore={TINTE.tratto}>
            Partita fiscale
          </Testo>
        </Compare>
        <Compare v={molla(locale, ufficio, fps)} cx={600} cy={545}>
          <Palazzo x={430} y={612} s={0.7} />
          <Testo x={508} y={540} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Ufficio delle imposte
          </Testo>
          <Testo x={508} y={574} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
            alla fonte e del bollo
          </Testo>
        </Compare>
        <Spunta cx={952} cy={470} r={22} p={tra(locale, fatto, fatto + 12)} />
      </Tela>
    );
  },
};

export const DISEGNI_PRIMO_DIPENDENTE: Record<string, Disegno> = {
  "dip-cassa": dipCassa,
  "dip-assegni": dipAssegni,
  "dip-infortuni": dipInfortuni,
  "dip-lpp": dipLpp,
  "dip-contratto": dipContratto,
  "dip-salario": dipSalario,
  "dip-fonte": dipFonte,
};
