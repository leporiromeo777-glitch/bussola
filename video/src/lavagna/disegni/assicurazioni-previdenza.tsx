/**
 * I disegni della lezione 21 («Malattia e pensione: ci pensi tu»), vedi
 * src/lezioni/assicurazioni-previdenza.ts. Fonti: promemoria AVS 2.02, LAMal
 * (artt. 1a e 67), LPP (artt. 4 e 44), OPP 3 (artt. 1 e 7), importi UFAS
 * 2026 e 2027, pagine del Portale PMI (assicurazioni sociali, indennità
 * giornaliera, disoccupazione). Coordinate della tela 1000×700; l'angolo in
 * basso a sinistra (x < 300, y > 480) è della finestra di Bleo. Niente cifre:
 * età, percentuali e importi li dice solo la voce.
 */
import type { ReactNode } from "react";
import { Compare, Foglio, Freccia, Lampadina, molla, Moneta, Palazzo, Persona, Pillola, Righe, Salvadanaio, Scudo, Spunta, TEAL_CHIARO, Testo, TINTE, tra, Valigetta } from "../figure";
import { Tela } from "./ditta-individuale";
import { COLORE_TENUE } from "./forme-giuridiche";
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

/** Una croce bianca su un tondo rosso: le cure. */
function Croce({ cx, cy, r = 22 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.rischio} />
      <rect x={cx - r * 0.23} y={cy - r * 0.6} width={r * 0.46} height={r * 1.2} rx={r * 0.09} fill={TINTE.carta} />
      <rect x={cx - r * 0.6} y={cy - r * 0.23} width={r * 1.2} height={r * 0.46} rx={r * 0.09} fill={TINTE.carta} />
    </g>
  );
}

/** La tessera della cassa malati (angolo in alto a sinistra in x, y). */
function Tessera({ x, y, w = 220, h = 140 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h * 0.13} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={x + 3} y={y + h * 0.19} width={w - 6} height={h * 0.17} fill={TINTE.tinta} />
      <Croce cx={x + h * 0.31} cy={y + h * 0.71} r={h * 0.16} />
      <Righe x={x + h * 0.6} y={y + h * 0.63} w={w - h * 0.83} n={2} passo={h * 0.17} />
    </g>
  );
}

/** Un termometro con il mercurio rosso: la malattia. */
function Termometro({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(18)`}>
      <rect x={-16} y={-92} width={32} height={132} rx={16} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      {[-66, -46, -26, -6].map((y) => (
        <line key={y} x1={4} y1={y} x2={12} y2={y} stroke={TINTE.tratto} strokeWidth={4} strokeLinecap="round" />
      ))}
      <rect x={-6} y={-50} width={12} height={92} rx={6} fill={TINTE.rischio} />
      <circle cx={0} cy={52} r={26} fill={TINTE.rischio} stroke={TINTE.tratto} strokeWidth={6} />
      <circle cx={-8} cy={44} r={6} fill={TINTE.carta} opacity={0.6} />
    </g>
  );
}

/** Un ombrello aperto: l'assicurazione contro la disoccupazione. */
function Ombrello({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <line x1={0} y1={-72} x2={0} y2={-88} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
      <path
        d="M -84 0 Q -82 -70 0 -74 Q 82 -70 84 0 Q 63 -16 42 0 Q 21 -16 0 0 Q -21 -16 -42 0 Q -63 -16 -84 0 Z"
        fill={TEAL_CHIARO}
        stroke={TINTE.tratto}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path d="M 0 -74 Q -22 -40 -42 0 M 0 -74 Q 22 -40 42 0" fill="none" stroke={TINTE.tratto} strokeWidth={4} opacity={0.6} />
      <path d="M 0 0 V 72 q 0 18 -16 18 q -14 0 -14 -14" fill="none" stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

/** Un lucchetto chiuso: «vincolato». */
function Lucchetto({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M -17 -8 V -26 a 17 17 0 0 1 34 0 V -8" fill="none" stroke={TINTE.tratto} strokeWidth={8} strokeLinecap="round" />
      <rect x={-28} y={-12} width={56} height={44} rx={9} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={5} />
      <circle cx={0} cy={5} r={6} fill={TINTE.accento} />
      <rect x={-2.5} y={7} width={5} height={13} rx={2.5} fill={TINTE.accento} />
    </g>
  );
}

/** Una colonna: un pilastro della previdenza (in basso al centro in x, y). */
function Colonna({ x, y, h, piena, colore }: { x: number; y: number; h: number; piena: boolean; colore: string }) {
  const w = 76;
  return (
    <g>
      <rect x={x - w / 2 - 12} y={y - h} width={w + 24} height={20} rx={6} fill={piena ? colore : TINTE.carta} stroke={colore} strokeWidth={5} strokeDasharray={piena ? undefined : "12 8"} />
      <rect x={x - w / 2} y={y - h + 20} width={w} height={h - 40} fill={piena ? colore : TINTE.carta} stroke={colore} strokeWidth={5} strokeDasharray={piena ? undefined : "12 8"} />
      {piena
        ? [-18, 0, 18].map((d) => <line key={d} x1={x + d} y1={y - h + 34} x2={x + d} y2={y - 34} stroke={TINTE.carta} strokeWidth={4} opacity={0.35} />)
        : null}
      <rect x={x - w / 2 - 12} y={y - 20} width={w + 24} height={20} rx={6} fill={piena ? colore : TINTE.carta} stroke={colore} strokeWidth={5} strokeDasharray={piena ? undefined : "12 8"} />
    </g>
  );
}

/** Una persona anziana con il bastone: la pensione (piedi in x, y). */
function Anziano({ x, y, s = 1, colore = TINTE.tratto }: { x: number; y: number; s?: number; colore?: string }) {
  return (
    <g>
      <Persona x={x} y={y} s={s} colore={colore} inclinata={6} />
      <line x1={x + 52 * s} y1={y - 104 * s} x2={x + 62 * s} y2={y} stroke={TINTE.accento} strokeWidth={8 * s} strokeLinecap="round" />
      <path d={`M ${x + 52 * s} ${y - 104 * s} q -2 -14 -16 -12`} fill="none" stroke={TINTE.accento} strokeWidth={8 * s} strokeLinecap="round" />
    </g>
  );
}

/** Lo schermo di un computer, con dentro qualcosa (centro in cx, cy). */
function Schermo({ cx, cy, w = 220, h = 140, children }: { cx: number; cy: number; w?: number; h?: number; children?: ReactNode }) {
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={cx - w / 2 + 3} y={cy - h / 2 + 3} width={w - 6} height={22} rx={10} fill={TINTE.tinta} />
      <path d={`M ${cx - 16} ${cy + h / 2} l -8 26 h 48 l -8 -26 Z`} fill={TINTE.tratto} />
      <rect x={cx - 50} y={cy + h / 2 + 24} width={100} height={10} rx={5} fill={TINTE.tratto} />
      {children}
    </g>
  );
}

/** Una pila di monete viste di lato (base in x, y): `n` anche frazionario, la moneta in cima entra piano. */
function Pila({ x, y, n, rx = 46, passo = 20, opacita = 1 }: { x: number; y: number; n: number; rx?: number; passo?: number; opacita?: number }) {
  const intere = Math.floor(n);
  const resto = n - intere;
  const monete = Array.from({ length: intere + (resto > 0.01 ? 1 : 0) }, (_, i) => i);
  return (
    <g opacity={opacita}>
      {monete.map((i) => {
        const cy = y - i * passo - passo / 2;
        const entra = i === intere ? resto : 1;
        return (
          <g key={i} opacity={entra} transform={`translate(0 ${(1 - entra) * -30})`}>
            <rect x={x - rx} y={cy - passo / 2} width={rx * 2} height={passo} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={4} />
            <ellipse cx={x} cy={cy - passo / 2} rx={rx} ry={passo * 0.45} fill="#e8b85a" stroke={TINTE.accento} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
}

/** Un calendario piccolo, senza numeri: «ogni anno». */
function Calendario({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-56} y={-50} width={112} height={104} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-56} y={-50} width={112} height={30} rx={14} fill={TINTE.accento} />
      <rect x={-56} y={-30} width={112} height={10} fill={TINTE.accento} />
      {Array.from({ length: 9 }, (_, k) => (
        <rect key={k} x={-40 + (k % 3) * 30} y={-8 + Math.floor(k / 3) * 20} width={20} height={12} rx={4} fill={TINTE.tinta} />
      ))}
    </g>
  );
}

/* 2. «L'AVS la paghi comunque, e degli infortuni abbiamo già parlato. Però da indipendente non sei assicurato contro la disoccupazione. E la cassa pensione, per te, non è obbligatoria.» */
const SCHEDA = { x: 520, w: 445, h: 112, icona: 584, testo: 648 } as const;
const RIGHE_QUADRO = [175, 320, 465] as const;
function Scheda({ cy, titolo, sotto, colore, children }: { cy: number; titolo: string; sotto: string; colore: string; children: ReactNode }) {
  return (
    <g>
      <rect x={SCHEDA.x} y={cy - SCHEDA.h / 2} width={SCHEDA.w} height={SCHEDA.h} rx={24} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      {children}
      <Testo x={SCHEDA.testo} y={cy - 18} corpo={32} titolo peso={800} colore={TINTE.tratto} ancora="start">
        {titolo}
      </Testo>
      <Testo x={SCHEDA.testo} y={cy + 22} corpo={25} titolo peso={800} colore={colore} ancora="start">
        {sotto}
      </Testo>
    </g>
  );
}
const prevQuadro: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.45, 0.55),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.45, 0.55) + 4 },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.4, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const avs = fra(ctx, null, 0, 0.12, 0.08);
    const disoccupazione = fra(ctx, 0, 1, 0.35, 0.5);
    const no = fra(ctx, 0, 1, 0.6, 0.6);
    const pensione = fra(ctx, 1, null, 0.3, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Da indipendente" />
        <Compare v={molla(locale, 6, fps, true)} cx={390} cy={380}>
          <Persona x={390} y={440} s={1.05} colore={TINTE.accento} />
          <Valigetta x={455} y={430} s={0.55} />
        </Compare>
        <Compare v={molla(locale, avs, fps)} cx={SCHEDA.x + SCHEDA.w / 2} cy={RIGHE_QUADRO[0]}>
          <Scheda cy={RIGHE_QUADRO[0]} titolo="AVS" sotto="La paghi sempre" colore={TINTE.ok}>
            <Spunta cx={SCHEDA.icona} cy={RIGHE_QUADRO[0]} r={32} p={tra(locale, avs + 4, avs + 16)} />
          </Scheda>
        </Compare>
        <Compare v={molla(locale, disoccupazione, fps)} cx={SCHEDA.x + SCHEDA.w / 2} cy={RIGHE_QUADRO[1]}>
          <Scheda cy={RIGHE_QUADRO[1]} titolo="Disoccupazione" sotto="Non sei assicurato" colore={TINTE.rischio}>
            <Ombrello cx={SCHEDA.icona} cy={RIGHE_QUADRO[1] + 10} s={0.42} />
          </Scheda>
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={SCHEDA.icona + 24} cy={RIGHE_QUADRO[1] + 26}>
          <No cx={SCHEDA.icona + 24} cy={RIGHE_QUADRO[1] + 26} r={17} />
        </Compare>
        <Compare v={molla(locale, pensione, fps)} cx={SCHEDA.x + SCHEDA.w / 2} cy={RIGHE_QUADRO[2]}>
          <Scheda cy={RIGHE_QUADRO[2]} titolo="Cassa pensione" sotto="Non obbligatoria" colore={TINTE.accento}>
            <Palazzo x={SCHEDA.icona} y={RIGHE_QUADRO[2] + 34} s={0.34} colore={TINTE.accento} />
          </Scheda>
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Se ti ammali, l'assicurazione obbligatoria della cassa malati paga le cure. Ma il guadagno che perdi, se non puoi lavorare, non te lo paga. Per quello c'è l'indennità giornaliera per malattia.» */
const prevMalattia: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.55, 0.55),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.75, 0.3) },
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.55, 0.55) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.45, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cassa = fra(ctx, null, 0, 0.4, 0.2);
    const cure = fra(ctx, null, 0, 0.8, 0.3);
    const guadagno = fra(ctx, 0, 1, 0.15, 0.45);
    const no = fra(ctx, 0, 1, 0.7, 0.6);
    const indennita = fra(ctx, 1, null, 0.35, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Se ti ammali" />
        <Compare v={molla(locale, 6, fps)} cx={420} cy={220}>
          <Termometro cx={420} cy={210} s={1.05} />
          <Testo x={420} y={330} corpo={28} titolo peso={800} colore={TINTE.rischio}>
            Una malattia
          </Testo>
        </Compare>
        <Freccia d="M 500 210 Q 545 190 590 205" p={tra(locale, cassa - 8, cassa + 4)} />
        <Compare v={molla(locale, cassa, fps)} cx={740} cy={210}>
          <Tessera x={620} y={140} w={240} h={150} />
          <Testo x={740} y={330} corpo={28} titolo peso={800} colore={TINTE.tratto}>
            La cassa malati
          </Testo>
        </Compare>
        <Spunta cx={880} cy={150} r={32} p={tra(locale, cure, cure + 14)} />
        <Compare v={molla(locale, cure + 6, fps)} cx={740} cy={372}>
          <Testo x={740} y={372} corpo={26} titolo peso={800} colore={TINTE.ok}>
            paga le cure
          </Testo>
        </Compare>
        <Compare v={molla(locale, guadagno, fps)} cx={620} cy={465}>
          <Moneta cx={400} cy={465} r={30} />
          <Moneta cx={428} cy={452} r={30} />
          <Testo x={478} y={467} corpo={30} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Il guadagno che perdi
          </Testo>
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={890} cy={465}>
          <No cx={890} cy={465} r={30} />
        </Compare>
        <Compare v={molla(locale, indennita, fps)} cx={640} cy={580}>
          <Scudo x={430} y={584} s={0.62} />
          <Pillola x={680} y={580} testo="Indennità giornaliera" corpo={30} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «È facoltativa: la puoi stipulare se hai almeno … anni e non ancora …. Puoi farla anche con un assicuratore diverso dalla tua cassa malati.» */
const ETA = { y: 290, da: 470, a: 860 } as const;
const prevIndennita: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.55, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.55, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 0, null, 0.55, 0.75) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const facoltativa = fra(ctx, null, 0, 0.1, 0.06);
    const fascia = fra(ctx, null, 0, 0.5, 0.3);
    const fine = fra(ctx, null, 0, 0.8, 0.42);
    const cassa = fra(ctx, 0, null, 0.2, 0.6);
    const altro = fra(ctx, 0, null, 0.5, 0.75);
    const larga = tra(locale, fascia, fine + 6);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Indennità giornaliera" />
        <Compare v={molla(locale, facoltativa, fps)} cx={655} cy={118}>
          <Pillola x={655} y={118} testo="Facoltativa" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* L'età: una linea, con la fascia in cui la puoi stipulare. */}
        <Compare v={molla(locale, 8, fps, true)} cx={650} cy={ETA.y}>
          <line x1={340} y1={ETA.y} x2={960} y2={ETA.y} stroke={COLORE_TENUE} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
          <Persona x={ETA.da} y={ETA.y - 6} s={0.52} colore={TEAL_CHIARO} />
          <Persona x={665} y={ETA.y - 6} s={0.66} colore={TEAL_CHIARO} />
          <Anziano x={ETA.a} y={ETA.y - 6} s={0.62} colore={TEAL_CHIARO} />
        </Compare>
        {larga > 0 ? (
          <g>
            <rect x={ETA.da} y={ETA.y - 9} width={(ETA.a - ETA.da) * larga} height={18} rx={9} fill={TINTE.ok} />
            <circle cx={ETA.da} cy={ETA.y} r={13} fill={TINTE.ok} stroke={TINTE.carta} strokeWidth={4} />
          </g>
        ) : null}
        <Compare v={molla(locale, fine, fps)} cx={ETA.a} cy={ETA.y}>
          <circle cx={ETA.a} cy={ETA.y} r={13} fill={TINTE.ok} stroke={TINTE.carta} strokeWidth={4} />
        </Compare>
        <Compare v={molla(locale, fascia + 4, fps)} cx={ETA.da} cy={ETA.y + 36}>
          <Testo x={ETA.da} y={ETA.y + 36} corpo={22} titolo peso={800} colore={TINTE.ok}>
            età minima
          </Testo>
        </Compare>
        <Compare v={molla(locale, fine + 4, fps)} cx={ETA.a} cy={ETA.y + 36}>
          <Testo x={ETA.a} y={ETA.y + 36} corpo={22} titolo peso={800} colore={TINTE.ok}>
            età massima
          </Testo>
        </Compare>
        {/* Con chi: la tua cassa malati o un altro assicuratore. */}
        <Compare v={molla(locale, cassa, fps)} cx={450} cy={490}>
          <Tessera x={360} y={430} w={180} h={115} />
          <Testo x={450} y={580} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            La tua cassa malati
          </Testo>
        </Compare>
        <Compare v={molla(locale, altro - 4, fps)} cx={615} cy={490}>
          <Testo x={615} y={490} corpo={26} titolo peso={800} colore={COLORE_TENUE}>
            oppure
          </Testo>
        </Compare>
        <Compare v={molla(locale, altro, fps)} cx={775} cy={490}>
          <Palazzo x={775} y={548} s={0.62} colore={TINTE.accento} />
          <Testo x={775} y={580} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Un altro assicuratore
          </Testo>
        </Compare>
        <Spunta cx={880} cy={438} r={26} p={tra(locale, altro + 8, altro + 20)} />
      </Tela>
    );
  },
};

/* 5. «Il Portale PMI della Confederazione la consiglia a chi lavora in proprio. La offrono le casse malati e le assicurazioni: chiedi più offerte e confronta premi e prestazioni.» */
const prevOfferte: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "festeggia", quando: fra(ctx, null, 0, 0.6, 0.3) + 6 },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.35, 0.8) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const portale = fra(ctx, null, 0, 0.15, 0.08);
    const proprio = fra(ctx, null, 0, 0.6, 0.3);
    const casse = fra(ctx, 0, 1, 0.3, 0.5);
    const assicurazioni = fra(ctx, 0, 1, 0.7, 0.6);
    const offerte = fra(ctx, 1, null, 0.15, 0.7);
    const confronta = fra(ctx, 1, null, 0.55, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="È consigliata" />
        <Compare v={molla(locale, portale, fps)} cx={450} cy={200}>
          <Schermo cx={450} cy={190} w={220} h={140}>
            <Lampadina cx={450} cy={198} s={1.25} />
          </Schermo>
          <Testo x={450} y={332} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Portale PMI
          </Testo>
        </Compare>
        <Freccia d="M 580 190 Q 625 170 668 190" p={tra(locale, proprio - 8, proprio + 4)} />
        <Compare v={molla(locale, proprio, fps)} cx={780} cy={240}>
          <Persona x={770} y={280} s={0.8} colore={TINTE.accento} />
          <Spunta cx={850} cy={150} r={28} p={tra(locale, proprio + 6, proprio + 18)} />
          <Testo x={780} y={318} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Chi lavora in proprio
          </Testo>
        </Compare>
        <Compare v={molla(locale, casse, fps)} cx={420} cy={470}>
          <Tessera x={350} y={420} w={140} h={90} />
          <Testo x={420} y={545} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Casse malati
          </Testo>
        </Compare>
        <Compare v={molla(locale, assicurazioni, fps)} cx={575} cy={470}>
          <Palazzo x={575} y={512} s={0.5} />
          <Testo x={575} y={545} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Assicurazioni
          </Testo>
        </Compare>
        {/* Più offerte, una dietro l'altra. */}
        {[0, 1, 2].map((i) => (
          <Compare key={i} v={molla(locale, offerte + i * 5, fps)} cx={735 + i * 60} cy={490}>
            <g transform={`rotate(${(i - 1) * 6} ${735 + i * 60} 490)`}>
              <Foglio x={680 + i * 60} y={415} w={110} h={145}>
                <Righe x={700 + i * 60} y={470} w={60} n={2} passo={22} />
                <Moneta cx={712 + i * 60} cy={530} r={13} />
                <Scudo x={760 + i * 60} y={530} s={0.28} />
              </Foglio>
            </g>
          </Compare>
        ))}
        <Compare v={molla(locale, confronta, fps)} cx={745} cy={615}>
          <Pillola x={745} y={615} testo="Confronta premi e prestazioni" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Per la pensione, in Svizzera ci sono tre pilastri: l'AVS, la cassa pensione e la previdenza privata. Da indipendente il primo è obbligatorio, gli altri due li scegli tu.» */
const COLONNE = [440, 650, 860] as const;
const TEMPIO = { tetto: 92, trave: 190, base: 462 } as const;
const prevPilastri: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.35, 0.8),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.1, 0.45) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.35, 0.8) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const colonne = [fra(ctx, 0, 1, 0.05, 0.4), fra(ctx, 0, 1, 0.35, 0.5), fra(ctx, 0, 1, 0.7, 0.6)];
    const obbligo = fra(ctx, 1, null, 0.3, 0.8);
    const scegli = fra(ctx, 1, null, 0.7, 0.9);
    const dopo = tra(locale, obbligo, obbligo + 8) > 0.5;
    const etichette = [["AVS"], ["Cassa", "pensione"], ["Previdenza", "privata"]];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="I tre pilastri" />
        <Compare v={molla(locale, 6, fps, true)} cx={650} cy={TEMPIO.trave}>
          <path d={`M 330 ${TEMPIO.trave} L 650 ${TEMPIO.tetto} L 970 ${TEMPIO.trave} Z`} fill={TINTE.crema} stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" />
          <Testo x={650} y={TEMPIO.trave - 30} corpo={26} titolo peso={800} colore={TINTE.accento}>
            La tua pensione
          </Testo>
          <rect x={340} y={TEMPIO.trave} width={620} height={22} rx={6} fill={TINTE.tratto} />
          <rect x={330} y={TEMPIO.base} width={640} height={18} rx={6} fill={TINTE.tratto} />
        </Compare>
        {COLONNE.map((x, i) => (
          <Compare key={x} v={molla(locale, colonne[i], fps)} cx={x} cy={TEMPIO.base}>
            <Colonna
              x={x}
              y={TEMPIO.base}
              h={TEMPIO.base - TEMPIO.trave - 22}
              piena={i === 0 || !dopo}
              colore={dopo ? (i === 0 ? TINTE.ok : TINTE.accento) : TINTE.tratto}
            />
            {etichette[i].map((riga, k) => (
              <Testo key={riga} x={x} y={TEMPIO.base + 44 + k * 30} corpo={24} titolo peso={800} colore={TINTE.tratto}>
                {riga}
              </Testo>
            ))}
          </Compare>
        ))}
        <Spunta cx={COLONNE[0]} cy={330} r={30} p={tra(locale, obbligo + 4, obbligo + 16)} />
        <Compare v={molla(locale, obbligo + 4, fps)} cx={COLONNE[0]} cy={590}>
          <Pillola x={COLONNE[0]} y={590} testo="Obbligatorio" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, scegli, fps)} cx={755} cy={590}>
          <Pillola x={755} y={590} testo="Li scegli tu" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Per la cassa pensione puoi assicurarti a titolo facoltativo: presso l'istituto della tua professione o quello dei tuoi dipendenti. Se non puoi, c'è l'istituto collettore.» */
const prevLpp: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.5) },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.45, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const facoltativa = fra(ctx, null, 0, 0.7, 0.35);
    const professione = fra(ctx, 0, 1, 0.3, 0.5);
    const dipendenti = fra(ctx, 0, 1, 0.75, 0.65);
    const collettore = fra(ctx, 1, null, 0.45, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cassa pensione" />
        <Compare v={molla(locale, 6, fps, true)} cx={410} cy={350}>
          <Persona x={410} y={420} s={0.95} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, facoltativa, fps)} cx={410} cy={466}>
          <Pillola x={410} y={466} testo="Facoltativa" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Freccia d="M 470 250 Q 510 205 550 215" p={tra(locale, professione - 8, professione + 4)} />
        <Compare v={molla(locale, professione, fps)} cx={630} cy={250}>
          <Palazzo x={630} y={300} s={0.6} />
          <Valigetta x={630} y={268} s={0.42} />
          <Testo x={630} y={336} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            La tua professione
          </Testo>
        </Compare>
        <Compare v={molla(locale, dipendenti - 4, fps)} cx={748} cy={250}>
          <Testo x={748} y={250} corpo={22} titolo peso={800} colore={COLORE_TENUE}>
            oppure
          </Testo>
        </Compare>
        <Compare v={molla(locale, dipendenti, fps)} cx={865} cy={250}>
          <Palazzo x={865} y={300} s={0.6} />
          <Persona x={850} y={296} s={0.24} colore={TEAL_CHIARO} />
          <Persona x={880} y={296} s={0.24} colore={TEAL_CHIARO} />
          <Testo x={865} y={336} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            I tuoi dipendenti
          </Testo>
        </Compare>
        <Freccia d="M 485 370 Q 540 505 655 528" p={tra(locale, collettore - 10, collettore + 2)} tratteggio colore={COLORE_TENUE} />
        <Compare v={molla(locale, collettore - 6, fps)} cx={575} cy={575}>
          <Testo x={575} y={575} corpo={22} titolo peso={800} colore={COLORE_TENUE}>
            se non puoi
          </Testo>
        </Compare>
        <Compare v={molla(locale, collettore, fps)} cx={780} cy={520}>
          <Palazzo x={780} y={580} s={0.6} colore={TEAL_CHIARO} />
          <Testo x={780} y={616} corpo={24} titolo peso={800} colore={TEAL_CHIARO}>
            Istituto collettore
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Poi c'è il pilastro …: un risparmio vincolato per la pensione. Quello che versi lo puoi dedurre dal reddito, nella dichiarazione d'imposta.» */
const prev3a: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 0, null, 0.55, 0.8) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const moneta = fra(ctx, null, 0, 0.3, 0.15);
    const vincolato = fra(ctx, null, 0, 0.6, 0.3);
    const pensione = fra(ctx, null, 0, 0.85, 0.42);
    const dichiarazione = fra(ctx, 0, null, 0.2, 0.6);
    const deduci = fra(ctx, 0, null, 0.5, 0.75);
    const cade = tra(locale, moneta, moneta + 14);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il terzo pilastro" />
        {cade > 0 && cade < 1 ? <Moneta cx={462} cy={90 + 80 * cade} r={24} /> : null}
        <Compare v={molla(locale, 6, fps, true)} cx={470} cy={260}>
          <Salvadanaio x={470} y={330} s={1.45} />
        </Compare>
        <Compare v={molla(locale, vincolato, fps)} cx={452} cy={258}>
          <Lucchetto cx={452} cy={256} s={1.05} />
        </Compare>
        <Compare v={molla(locale, vincolato + 4, fps)} cx={470} cy={378}>
          <Pillola x={470} y={378} testo="Vincolato" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Freccia d="M 640 250 Q 690 225 735 240" p={tra(locale, pensione - 8, pensione + 4)} />
        <Compare v={molla(locale, pensione, fps)} cx={830} cy={260}>
          <Anziano x={825} y={330} s={0.85} colore={TEAL_CHIARO} />
          <Testo x={830} y={372} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Per la pensione
          </Testo>
        </Compare>
        <Compare v={molla(locale, dichiarazione, fps)} cx={450} cy={530}>
          <Foglio x={385} y={445} w={130} h={170}>
            <Righe x={405} y={500} w={80} n={3} passo={24} />
          </Foglio>
          <Spunta cx={505} cy={595} r={24} p={tra(locale, deduci, deduci + 14)} />
        </Compare>
        <Compare v={molla(locale, deduci, fps)} cx={720} cy={515}>
          <Testo x={560} y={500} corpo={30} titolo peso={800} colore={TINTE.ok} ancora="start">
            Lo deduci dal reddito
          </Testo>
          <Testo x={560} y={540} corpo={24} peso={600} colore={COLORE_TENUE} ancora="start">
            nella dichiarazione d&apos;imposta
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 9. «Senza cassa pensione puoi dedurre fino al … del reddito da lavoro. Al massimo … nel … e … nel ….» */
const REDDITO = { x: 340, y: 150, w: 600, h: 56 } as const;
const PILA = { x: 780, y: 590, passo: 22, n: 9 } as const;
const prev3aSenza: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 0, null, 0.5, 0.75) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const reddito = fra(ctx, null, 0, 0.35, 0.15);
    const parte = fra(ctx, null, 0, 0.62, 0.3);
    const nelSalvadanaio = fra(ctx, null, 0, 0.85, 0.42);
    const massimo = fra(ctx, 0, null, 0.08, 0.55);
    const riempi = tra(locale, massimo, massimo + 40);
    const tetto = PILA.y - PILA.n * PILA.passo - 14;
    const fetta = tra(locale, parte, parte + 12);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Senza cassa pensione" />
        <Compare v={molla(locale, reddito, fps)} cx={REDDITO.x + REDDITO.w / 2} cy={REDDITO.y + REDDITO.h / 2}>
          <Testo x={REDDITO.x} y={REDDITO.y - 26} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Il tuo reddito da lavoro
          </Testo>
          <rect x={REDDITO.x} y={REDDITO.y} width={REDDITO.w} height={REDDITO.h} rx={REDDITO.h / 2} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} />
          {fetta > 0 ? (
            <rect x={REDDITO.x + 5} y={REDDITO.y + 5} width={(REDDITO.w / 5 - 5) * fetta} height={REDDITO.h - 10} rx={(REDDITO.h - 10) / 2} fill={TINTE.ok} />
          ) : null}
        </Compare>
        <Compare v={molla(locale, parte + 6, fps)} cx={REDDITO.x + 60} cy={REDDITO.y + REDDITO.h + 34}>
          <Testo x={REDDITO.x + 6} y={REDDITO.y + REDDITO.h + 34} corpo={24} titolo peso={800} colore={TINTE.ok} ancora="start">
            Al massimo una parte
          </Testo>
        </Compare>
        <Freccia d={`M ${REDDITO.x + 60} ${REDDITO.y + REDDITO.h + 60} Q ${REDDITO.x + 70} 320 ${REDDITO.x + 110} 350`} p={tra(locale, nelSalvadanaio - 8, nelSalvadanaio + 4)} colore={TINTE.ok} />
        <Compare v={molla(locale, nelSalvadanaio, fps)} cx={500} cy={470}>
          <Salvadanaio x={500} y={540} s={1.15} />
        </Compare>
        {/* Il massimo dell'anno: la pila cresce fino al tetto rosso e si ferma. */}
        <Freccia d="M 610 470 Q 650 450 690 470" p={tra(locale, massimo - 6, massimo + 6)} />
        <Compare v={molla(locale, massimo, fps)} cx={PILA.x} cy={PILA.y - 100}>
          <Pila x={PILA.x} y={PILA.y} n={PILA.n * riempi} passo={PILA.passo} />
          <line x1={PILA.x - 80} y1={tetto} x2={PILA.x + 80} y2={tetto} stroke={TINTE.rischio} strokeWidth={8} strokeLinecap="round" />
          <Pillola x={PILA.x} y={tetto - 40} testo="Il massimo dell'anno" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Compare v={molla(locale, massimo + 10, fps)} cx={920} cy={530}>
          <Calendario cx={920} cy={530} s={0.62} />
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Se invece hai una cassa pensione, per esempio da un lavoro da dipendente, il massimo è più basso: … nel … e … nel ….» */
const PILE = { senza: 690, con: 870, y: 600, passo: 20 } as const;
const prev3aCon: Disegno = {
  chiave: (ctx) => fra(ctx, 0, null, 0.3, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.45, 0.25) },
      { tipo: "scuoti", quando: fra(ctx, 0, null, 0.3, 0.6) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cassa = fra(ctx, null, 0, 0.2, 0.1);
    const dipendente = fra(ctx, null, 0, 0.65, 0.3);
    const pile = fra(ctx, 0, null, 0.05, 0.55);
    const basso = fra(ctx, 0, null, 0.3, 0.65);
    const tettoSenza = PILE.y - 10 * PILE.passo - 12;
    const tettoCon = PILE.y - 2 * PILE.passo - 12;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Con cassa pensione" />
        <Compare v={molla(locale, cassa, fps)} cx={440} cy={240}>
          <Palazzo x={440} y={300} s={0.62} />
          <Pillola x={440} y={340} testo="Cassa pensione" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, dipendente, fps)} cx={440} cy={520}>
          <Persona x={430} y={600} s={0.78} colore={TEAL_CHIARO} />
          <Valigetta x={492} y={580} s={0.48} />
          <Testo x={440} y={630} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Da dipendente
          </Testo>
        </Compare>
        <Compare v={molla(locale, pile, fps)} cx={PILE.senza} cy={PILE.y - 100}>
          <Pila x={PILE.senza} y={PILE.y} n={10} passo={PILE.passo} rx={42} opacita={0.45} />
          <line x1={PILE.senza - 70} y1={tettoSenza} x2={PILE.senza + 70} y2={tettoSenza} stroke={TINTE.rischio} strokeWidth={7} strokeLinecap="round" strokeDasharray="14 10" opacity={0.7} />
          <Testo x={PILE.senza} y={PILE.y + 30} corpo={22} titolo peso={800} colore={COLORE_TENUE}>
            Senza
          </Testo>
        </Compare>
        <Compare v={molla(locale, pile + 8, fps)} cx={PILE.con} cy={PILE.y - 40}>
          <Pila x={PILE.con} y={PILE.y} n={2 * tra(locale, pile + 8, pile + 24)} passo={PILE.passo} rx={42} />
          <line x1={PILE.con - 70} y1={tettoCon} x2={PILE.con + 70} y2={tettoCon} stroke={TINTE.rischio} strokeWidth={8} strokeLinecap="round" />
          <Testo x={PILE.con} y={PILE.y + 30} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Con cassa pensione
          </Testo>
        </Compare>
        <Freccia d={`M ${PILE.senza + 60} ${tettoSenza} Q ${PILE.con} ${tettoSenza} ${PILE.con} ${tettoCon - 30}`} p={tra(locale, basso, basso + 14)} colore={TINTE.rischio} />
        <Compare v={molla(locale, basso + 6, fps)} cx={PILE.con} cy={tettoSenza - 50}>
          <Pillola x={PILE.con} y={tettoSenza - 50} testo="Più basso" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

/* 11. «E la disoccupazione? Da indipendente non puoi assicurarti, nemmeno volontariamente. Se l'attività va male, contano solo i contributi pagati prima da dipendente. L'indennità ti spetta solo se sono abbastanza.» */
const CONTRIBUTI = { x: 650, y: 610, passo: 18 } as const;
const prevDisoccupazione: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.3, 0.3) + 4 },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.6, 0.65) },
      { tipo: "lancia", quando: fra(ctx, 2, null, 0.45, 0.88) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const ombrello = fra(ctx, null, 0, 0.5, 0.06);
    const no = fra(ctx, 0, 1, 0.3, 0.3);
    const nemmeno = fra(ctx, 0, 1, 0.75, 0.4);
    const dipendente = fra(ctx, 1, 2, 0.3, 0.55);
    const contributi = fra(ctx, 1, 2, 0.6, 0.65);
    const indennita = fra(ctx, 2, null, 0.4, 0.88);
    const n = 5 * tra(locale, contributi, contributi + 30);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="E la disoccupazione?" />
        <Compare v={molla(locale, 6, fps, true)} cx={420} cy={330}>
          <Persona x={420} y={400} s={0.95} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, ombrello, fps)} cx={620} cy={210}>
          <Ombrello cx={620} cy={210} s={1.05} />
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={700} cy={268}>
          <No cx={700} cy={268} r={30} />
        </Compare>
        <Compare v={molla(locale, nemmeno, fps)} cx={790} cy={350}>
          <Pillola x={790} y={350} testo="Nemmeno volontariamente" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Compare v={molla(locale, dipendente, fps)} cx={450} cy={560}>
          <Palazzo x={450} y={600} s={0.52} colore={TEAL_CHIARO} />
          <Testo x={450} y={636} corpo={22} titolo peso={800} colore={TEAL_CHIARO}>
            Prima, da dipendente
          </Testo>
        </Compare>
        <Freccia d="M 510 540 Q 555 515 595 535" p={tra(locale, contributi - 8, contributi + 4)} />
        <Compare v={molla(locale, contributi, fps)} cx={CONTRIBUTI.x} cy={CONTRIBUTI.y - 40}>
          <Pila x={CONTRIBUTI.x} y={CONTRIBUTI.y} n={n} passo={CONTRIBUTI.passo} rx={40} />
          <Testo x={CONTRIBUTI.x} y={CONTRIBUTI.y + 26} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Contributi
          </Testo>
        </Compare>
        <Freccia d="M 710 545 Q 750 520 790 530" p={tra(locale, indennita - 8, indennita + 4)} />
        <Compare v={molla(locale, indennita, fps)} cx={860} cy={545}>
          <Spunta cx={860} cy={520} r={34} p={tra(locale, indennita + 4, indennita + 16)} />
          <Testo x={860} y={584} corpo={26} titolo peso={800} colore={TINTE.ok}>
            Indennità
          </Testo>
          <Testo x={860} y={614} corpo={22} titolo peso={800} colore={COLORE_TENUE}>
            solo se bastano
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_ASSICURAZIONI_PREVIDENZA: Record<string, Disegno> = {
  "prev-quadro": prevQuadro,
  "prev-malattia": prevMalattia,
  "prev-indennita": prevIndennita,
  "prev-offerte": prevOfferte,
  "prev-pilastri": prevPilastri,
  "prev-lpp": prevLpp,
  "prev-3a": prev3a,
  "prev-3a-senza": prev3aSenza,
  "prev-3a-con": prev3aCon,
  "prev-disoccupazione": prevDisoccupazione,
};
