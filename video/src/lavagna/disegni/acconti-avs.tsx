/**
 * I disegni della lezione 19 («Pagare gli acconti AVS»), vedi
 * src/lezioni/acconti-avs.ts. Fonti: OAVS (artt. 24, 25, 27, 34, 34b, 41bis,
 * 42), promemoria AVS 2.02, pagine dell'IAS sugli acconti e sulla richiesta
 * di adeguamento, informazioni AF 2026 dell'IAS e art. 73 LAF ticinese.
 * Coordinate della tela 1000×700; l'angolo in basso a sinistra (x < 300,
 * y > 480) è della finestra di Bleo, la bussolina aspetta in (200, 450).
 * Niente cifre: date, giorni e percentuali li dice solo la voce (le barre
 * sono solo in proporzione).
 */
import { regolePercorso } from "../../../../src/data/svizzera";
import { Avviso, Compare, Foglio, Freccia, molla, Moneta, Palazzo, Persona, Pillola, Righe, Salvadanaio, Spunta, TEAL_CHIARO, Testo, TINTE, tra } from "../figure";
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

/** I mesi in cui si paga un acconto (dai dati: gennaio, aprile, luglio, ottobre), con la maiuscola. */
const NOMI_MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const MESI_ACCONTI = regolePercorso.accontiAvs.valore.mesi.map((m) => NOMI_MESI[m - 1] ?? "");
/** I tre mesi di ogni trimestre, abbreviati: «gen-mar», … */
const TRIMESTRI = ["gen-mar", "apr-giu", "lug-set", "ott-dic"];

/* ---------------------------------------------------------------------------
 * Figure di questa lezione
 * ------------------------------------------------------------------------- */

/** Un punto su una curva quadratica (per far viaggiare una moneta lungo una freccia). */
function suCurva(p0: [number, number], p1: [number, number], p2: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

/** Un piccolo calendario da muro, centrato in (cx, cy). */
function Calendario({ cx, cy, s = 1, colore = TINTE.accento }: { cx: number; cy: number; s?: number; colore?: string }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-46} y={-42} width={92} height={88} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-46} y={-42} width={92} height={26} rx={12} fill={colore} />
      <rect x={-46} y={-26} width={92} height={10} fill={colore} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={-30 + c * 22} y={-6 + r * 16} width={16} height={10} rx={3} fill={TINTE.tinta} />),
      )}
      <line x1={-24} y1={-50} x2={-24} y2={-34} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
      <line x1={24} y1={-50} x2={24} y2={-34} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
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

/** Una campanella che oscilla: il promemoria. */
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

/** Un orologio con la lancetta che gira. */
function Orologio({ cx, cy, r = 34, locale }: { cx: number; cy: number; r?: number; locale: number }) {
  const giro = (locale * 6) % 360;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.48} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.7} stroke={TINTE.accento} strokeWidth={5} strokeLinecap="round" transform={`rotate(${giro} ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={5} fill={TINTE.tratto} />
    </g>
  );
}

/** Una bilancia a due piatti; `pende` da -1 (sinistra giù) a 1 (destra giù). */
function Bilancia({ cx, cy, pende, sinistra, destra }: { cx: number; cy: number; pende: number; sinistra: string; destra: string }) {
  const a = pende * 9;
  const rad = (a * Math.PI) / 180;
  const braccio = 150;
  const sx = cx - Math.cos(rad) * braccio;
  const sy = cy - 90 - Math.sin(rad) * braccio;
  const dx = cx + Math.cos(rad) * braccio;
  const dy = cy - 90 + Math.sin(rad) * braccio;
  const Piatto = ({ x, y, testo, colore }: { x: number; y: number; testo: string; colore: string }) => (
    <g>
      <line x1={x} y1={y} x2={x - 40} y2={y + 54} stroke={TINTE.tratto} strokeWidth={4} />
      <line x1={x} y1={y} x2={x + 40} y2={y + 54} stroke={TINTE.tratto} strokeWidth={4} />
      <path d={`M ${x - 62} ${y + 54} H ${x + 62} Q ${x + 52} ${y + 82} ${x} ${y + 82} Q ${x - 52} ${y + 82} ${x - 62} ${y + 54} Z`} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
      <Pillola x={x} y={y + 112} testo={testo} corpo={24} fondo={colore} colore={TINTE.carta} />
    </g>
  );
  return (
    <g>
      <path d={`M ${cx - 60} ${cy + 40} H ${cx + 60} L ${cx + 30} ${cy + 18} H ${cx - 30} Z`} fill={TINTE.tratto} />
      <rect x={cx - 7} y={cy - 96} width={14} height={120} rx={7} fill={TINTE.tratto} />
      <line x1={sx} y1={sy} x2={dx} y2={dy} stroke={TINTE.tratto} strokeWidth={9} strokeLinecap="round" />
      <circle cx={cx} cy={cy - 90} r={11} fill={TINTE.accento} />
      <Piatto x={sx} y={sy} testo={sinistra} colore={TEAL_CHIARO} />
      <Piatto x={dx} y={dy} testo={destra} colore={TINTE.tratto} />
    </g>
  );
}

/* 2. «Gli acconti sono contributi provvisori. La cassa di compensazione li fissa sul reddito che prevedi per quest'anno, con le indicazioni che le dai tu.» */
const aavsCosa: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.75, 0.6),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.35, 0.12) },
      { tipo: "festeggia", quando: fra(ctx, 0, 1, 0.8, 0.62) + 6 },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.4, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const provvisori = fra(ctx, null, 0, 0.3, 0.1);
    const reddito = fra(ctx, 0, 1, 0.3, 0.4);
    const cassa = fra(ctx, 0, 1, 0.55, 0.5);
    const acconti = fra(ctx, 0, 1, 0.8, 0.62);
    const indicazioni = fra(ctx, 1, null, 0.2, 0.8);
    const viaggio = tra(locale, indicazioni + 4, indicazioni + 30);
    const [fx, fy] = suCurva([500, 440], [550, 380], [600, 440], viaggio);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cosa sono gli acconti" />
        <Compare v={molla(locale, provvisori, fps)} cx={655} cy={135}>
          <Pillola x={655} y={135} testo="Contributi provvisori" corpo={30} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* Tu, con il reddito che prevedi. */}
        <Compare v={molla(locale, reddito, fps)} cx={430} cy={420}>
          <Persona x={430} y={540} s={0.95} colore={TINTE.accento} />
          <circle cx={492} cy={318} r={7} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} />
          <circle cx={508} cy={296} r={11} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} />
          <ellipse cx={540} cy={250} rx={66} ry={46} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <Moneta cx={518} cy={252} r={20} />
          <Moneta cx={560} cy={246} r={20} />
          <Pillola x={430} y={592} testo="Reddito previsto" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {/* La cassa li fissa. */}
        <Compare v={molla(locale, cassa, fps)} cx={690} cy={440}>
          <Palazzo x={690} y={540} s={0.85} nome="AVS" />
          <Testo x={690} y={590} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            La cassa
          </Testo>
        </Compare>
        <Freccia d="M 760 420 Q 800 380 830 400" p={tra(locale, acconti - 10, acconti + 2)} colore={TINTE.accento} />
        <Compare v={molla(locale, acconti, fps)} cx={895} cy={430}>
          <Foglio x={835} y={330} w={120} h={170}>
            {[0, 1, 2, 3].map((i) => (
              <Moneta key={i} cx={870 + (i % 2) * 48} cy={392 + Math.floor(i / 2) * 50} r={18} />
            ))}
          </Foglio>
          <Testo x={895} y={530} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Acconti
          </Testo>
        </Compare>
        {/* Le tue indicazioni, alla cassa. */}
        <Freccia d="M 500 440 Q 550 380 600 440" p={tra(locale, indicazioni - 6, indicazioni + 6)} colore={TINTE.tratto} spessore={6} />
        {viaggio > 0 && viaggio < 1 ? (
          <g transform={`translate(${fx} ${fy}) rotate(-8)`}>
            <rect x={-16} y={-20} width={32} height={40} rx={5} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} />
            <line x1={-8} y1={-6} x2={8} y2={-6} stroke={TINTE.tinta} strokeWidth={4} strokeLinecap="round" />
            <line x1={-8} y1={4} x2={8} y2={4} stroke={TINTE.tinta} strokeWidth={4} strokeLinecap="round" />
          </g>
        ) : null}
        <Compare v={molla(locale, indicazioni + 8, fps)} cx={590} cy={362}>
          <Testo x={590} y={362} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Le tue indicazioni
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Si pagano ogni trimestre, entro dieci giorni dalla fine: … aprile, … luglio e … ottobre. L'ultimo trimestre, entro … gennaio dell'anno dopo.» */
const BARRA = { y: 300, h: 56, inizio: 340, largo: 128, passo: 136 } as const;
const aavsDate: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.5, 0.8),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.2, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.55, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const barra = fra(ctx, null, 0, 0.15, 0.08);
    const entro = fra(ctx, null, 0, 0.75, 0.25);
    // Aprile, luglio e ottobre nella seconda frase, gennaio nella terza.
    const pagamenti = [fra(ctx, 0, 1, 0.12, 0.38), fra(ctx, 0, 1, 0.45, 0.48), fra(ctx, 0, 1, 0.8, 0.58), fra(ctx, 1, null, 0.45, 0.8)];
    const annoDopo = fra(ctx, 1, null, 0.2, 0.72);
    // Il primo acconto (gennaio) è per l'ultimo trimestre dell'anno prima: qui va in fondo.
    const ordine = [1, 2, 3, 0];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Ogni trimestre" />
        {/* L'anno in quattro trimestri, e un pezzo dell'anno dopo. */}
        {TRIMESTRI.map((t, i) => {
          const x = BARRA.inizio + i * BARRA.passo;
          const v = tra(locale, barra + i * 4, barra + i * 4 + 10);
          return (
            <g key={t} opacity={v}>
              <rect x={x} y={BARRA.y} width={BARRA.largo} height={BARRA.h} rx={14} fill={i % 2 === 0 ? TINTE.tinta : "#d7ecef"} stroke={TINTE.tratto} strokeWidth={4} />
              <Testo x={x + BARRA.largo / 2} y={BARRA.y + BARRA.h / 2 + 1} corpo={24} titolo peso={800} colore={TINTE.tratto}>
                {t}
              </Testo>
            </g>
          );
        })}
        <g opacity={tra(locale, annoDopo - 6, annoDopo + 6)}>
          <line x1={884} y1={BARRA.y - 50} x2={884} y2={BARRA.y + BARRA.h + 20} stroke={TINTE.tratto} strokeWidth={5} strokeDasharray="10 10" strokeLinecap="round" />
          <rect x={896} y={BARRA.y} width={90} height={BARRA.h} rx={14} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={4} strokeDasharray="10 8" />
          <Righe2 x={941} y={BARRA.y + 16} righe={["Anno", "dopo"]} corpo={20} passo={24} colore={TINTE.accento} />
        </g>
        {/* Un acconto alla fine di ogni trimestre. */}
        {ordine.map((m, i) => {
          const t = pagamenti[i];
          const x = i < 3 ? BARRA.inizio + (i + 1) * BARRA.passo - 4 : 920;
          const cade = tra(locale, t, t + 12);
          return (
            <g key={m}>
              {cade > 0 ? <Moneta cx={x} cy={170 + cade * 92} r={24} /> : null}
              <Compare v={molla(locale, t + 8, fps)} cx={x} cy={420}>
                <line x1={x} y1={BARRA.y + BARRA.h + 4} x2={x} y2={398} stroke={TINTE.accento} strokeWidth={5} strokeLinecap="round" />
                <Pillola x={x} y={420} testo={MESI_ACCONTI[m] ?? ""} corpo={22} fondo={TINTE.accento} colore={TINTE.carta} />
              </Compare>
            </g>
          );
        })}
        <Compare v={molla(locale, entro, fps)} cx={640} cy={530}>
          <Pillola x={640} y={530} testo="Entro dieci giorni dalla fine del trimestre" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Conta il giorno in cui i soldi arrivano alla cassa, non quello in cui paghi. Se un acconto arriva più di … giorni dopo la fine del trimestre, paghi interessi di mora …, dalla fine del trimestre.» */
const LINEA = { y: 470, da: 360, a: 960, fine: 420, arrivo: 880 } as const;
const aavsRitardo: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.4, 0.8),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.3, 0.15) },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.45, 0.82) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const parti = fra(ctx, null, 0, 0.05, 0.02);
    const viaggio = tra(locale, parti + 8, fra(ctx, null, 0, 0.55, 0.2));
    const arriva = fra(ctx, null, 0, 0.6, 0.22);
    const linea = fra(ctx, 0, 1, 0.1, 0.4);
    const tardi = fra(ctx, 0, 1, 0.6, 0.55);
    const interessi = fra(ctx, 1, null, 0.15, 0.7);
    const dallaFine = fra(ctx, 1, null, 0.6, 0.88);
    const [mx, my] = suCurva([480, 220], [630, 120], [775, 220], viaggio);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Paga in tempo" />
        {/* Tu paghi, la cassa riceve. */}
        <Compare v={molla(locale, parti, fps)} cx={410} cy={250}>
          <Persona x={410} y={330} s={0.8} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, parti + 4, fps)} cx={850} cy={250}>
          <Palazzo x={850} y={330} s={0.8} nome="AVS" />
        </Compare>
        <Freccia d="M 480 220 Q 630 120 775 220" p={tra(locale, parti + 6, parti + 20)} colore={TINTE.tinta} spessore={6} tratteggio punta={false} />
        {viaggio > 0 ? <Moneta cx={mx} cy={my} r={24} /> : null}
        <Spunta cx={942} cy={196} r={24} p={tra(locale, arriva, arriva + 14)} />
        <Compare v={molla(locale, arriva + 4, fps)} cx={630} cy={292}>
          <Pillola x={630} y={292} testo="Conta l'arrivo" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* La linea del tempo: fine del trimestre, arrivo in ritardo. */}
        <g opacity={tra(locale, linea - 4, linea + 8)}>
          <line x1={LINEA.da} y1={LINEA.y} x2={LINEA.a} y2={LINEA.y} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
          <Calendario cx={LINEA.fine} cy={LINEA.y - 62} s={0.7} />
          <line x1={LINEA.fine} y1={LINEA.y - 14} x2={LINEA.fine} y2={LINEA.y + 14} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
          <Righe2 x={LINEA.fine + 6} y={LINEA.y + 42} righe={["Fine del", "trimestre"]} corpo={22} passo={26} />
        </g>
        <Compare v={molla(locale, tardi, fps)} cx={LINEA.arrivo} cy={LINEA.y}>
          <Moneta cx={LINEA.arrivo} cy={LINEA.y - 44} r={22} />
          <line x1={LINEA.arrivo} y1={LINEA.y - 14} x2={LINEA.arrivo} y2={LINEA.y + 14} stroke={TINTE.rischio} strokeWidth={6} strokeLinecap="round" />
          <Righe2 x={LINEA.arrivo} y={LINEA.y + 42} righe={["Arriva", "troppo tardi"]} corpo={22} passo={26} colore={TINTE.rischio} />
          <Orologio cx={LINEA.arrivo - 110} cy={LINEA.y - 50} r={26} locale={locale} />
        </Compare>
        {/* Gli interessi contano dalla fine del trimestre. */}
        {interessi > 0 ? (
          <rect
            x={LINEA.fine}
            y={LINEA.y - 7}
            width={(LINEA.arrivo - LINEA.fine) * tra(locale, interessi, interessi + 20)}
            height={14}
            rx={7}
            fill={TINTE.rischio}
          />
        ) : null}
        <Compare v={molla(locale, interessi + 10, fps)} cx={650} cy={590}>
          <Pillola x={650} y={590} testo="Interessi di mora" corpo={28} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, dallaFine, fps)} cx={650} cy={645}>
          <Testo x={650} y={645} corpo={24} titolo peso={800} colore={TINTE.rischio}>
            dalla fine del trimestre
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Se il tuo reddito cambia molto, anche a fine anno, avvisa subito la cassa: così adegua gli acconti. Alla cassa ticinese conta una variazione di più o meno il …. Nella sua richiesta online scrivi l'utile previsto: fatturato meno spese.» */
const aavsCambia: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.4),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.5, 0.12) },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.38) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.7, 0.9) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const grafico = fra(ctx, null, 0, 0.15, 0.04);
    const salto = tra(locale, fra(ctx, null, 0, 0.45, 0.1), fra(ctx, null, 0, 0.85, 0.18));
    const avvisa = fra(ctx, 0, 1, 0.2, 0.3);
    const adegua = fra(ctx, 0, 1, 0.7, 0.4);
    const quarto = fra(ctx, 1, 2, 0.4, 0.55);
    const modulo = fra(ctx, 2, null, 0.15, 0.75);
    const utile = fra(ctx, 2, null, 0.6, 0.88);
    const busta = tra(locale, avvisa + 4, avvisa + 24);
    const [bx, by] = suCurva([600, 200], [690, 130], [770, 200], busta);
    // Il reddito: piatto, poi sale (o scende, tratteggiato).
    const sx = 360;
    const sy = 270;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il reddito cambia?" />
        <g opacity={tra(locale, grafico - 4, grafico + 8)}>
          <line x1={sx} y1={sy} x2={sx + 220} y2={sy} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
          <line x1={sx} y1={sy} x2={sx} y2={sy - 170} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
          <Testo x={sx + 110} y={sy + 30} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Reddito
          </Testo>
        </g>
        {locale >= grafico ? (
          <g>
            <path
              d={`M ${sx + 14} ${sy - 70} H ${sx + 110} L ${sx + 110 + 90} ${sy - 70 - 80 * salto}`}
              fill="none"
              stroke={TINTE.accento}
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={tra(locale, grafico, grafico + 8)}
            />
            <path
              d={`M ${sx + 110} ${sy - 70} L ${sx + 110 + 90} ${sy - 70 + 50 * salto}`}
              fill="none"
              stroke={TINTE.accento}
              strokeWidth={6}
              strokeDasharray="10 10"
              strokeLinecap="round"
              opacity={0.7 * salto}
            />
          </g>
        ) : null}
        {/* Avvisi la cassa, che adegua gli acconti. */}
        <Compare v={molla(locale, avvisa, fps)} cx={850} cy={220}>
          <Palazzo x={850} y={300} s={0.8} nome="AVS" />
        </Compare>
        {busta > 0 && busta < 1 ? <Busta cx={bx} cy={by} s={0.55} /> : null}
        <Compare v={molla(locale, adegua, fps)} cx={850} cy={336}>
          <Pillola x={850} y={336} testo="Adegua gli acconti" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* In Ticino: più o meno un quarto. */}
        <Compare v={molla(locale, quarto, fps)} cx={500} cy={414}>
          <path d="M 330 434 L 350 394 L 370 434 Z" fill={TINTE.accento} />
          <path d="M 378 394 L 398 434 L 418 394 Z" fill={TINTE.accento} />
          <Righe2 x={570} y={400} righe={["Alla cassa ticinese:", "più o meno un quarto"]} corpo={24} passo={28} />
        </Compare>
        {/* La richiesta online, con l'utile previsto. */}
        <Compare v={molla(locale, modulo, fps)} cx={760} cy={565}>
          <rect x={560} y={475} width={400} height={180} rx={18} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <path d="M 563 519 V 493 q 0 -15 15 -15 H 942 q 15 0 15 15 V 519 Z" fill={TINTE.tratto} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={584 + i * 20} cy={498} r={6} fill={i === 0 ? TINTE.accento : TINTE.tinta} />
          ))}
          <Testo x={590} y={553} corpo={22} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Utile previsto
          </Testo>
          <rect x={590} y={575} width={340} height={44} rx={10} fill="none" stroke={TINTE.tinta} strokeWidth={4} />
        </Compare>
        <Compare v={molla(locale, utile, fps)} cx={760} cy={597}>
          <Testo x={760} y={598} corpo={22} titolo peso={800} colore={TINTE.accento}>
            fatturato meno spese
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «I contributi definitivi arrivano dopo, con la tassazione: l'autorità fiscale manda alla cassa i dati del tuo reddito. La cassa calcola i contributi veri e li confronta con gli acconti pagati.» */
const aavsDefinitivi: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.6, 0.85),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.45) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.65, 0.88) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tassazione = fra(ctx, null, 0, 0.55, 0.2);
    const fisco = fra(ctx, 0, 1, 0.12, 0.35);
    const invia = fra(ctx, 0, 1, 0.45, 0.45);
    const bilancia = fra(ctx, 1, null, 0.25, 0.7);
    const confronto = fra(ctx, 1, null, 0.6, 0.85);
    const viaggio = tra(locale, invia, invia + 24);
    const [fx, fy] = suCurva([520, 190], [640, 110], [760, 190], viaggio);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="I contributi definitivi" />
        <Compare v={molla(locale, fisco, fps)} cx={420} cy={220}>
          <Palazzo x={420} y={300} s={0.75} nome="Fisco" />
        </Compare>
        <Compare v={molla(locale, tassazione, fps)} cx={400} cy={360}>
          <Pillola x={420} y={345} testo="Tassazione" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 520 190 Q 640 110 760 190" p={tra(locale, invia - 6, invia + 8)} colore={TINTE.tinta} spessore={6} tratteggio punta={false} />
        {viaggio > 0 && viaggio < 1 ? (
          <g transform={`translate(${fx} ${fy})`}>
            <Foglio x={-34} y={-44} w={68} h={88}>
              <Righe x={-22} y={-12} w={40} n={3} passo={16} />
            </Foglio>
          </g>
        ) : null}
        <Compare v={molla(locale, invia - 4, fps)} cx={850} cy={220}>
          <Palazzo x={850} y={300} s={0.75} nome="AVS" />
        </Compare>
        <Spunta cx={935} cy={150} r={22} p={tra(locale, invia + 24, invia + 36)} />
        <Compare v={molla(locale, invia + 18, fps)} cx={640} cy={240}>
          <Testo x={640} y={240} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            I dati del reddito
          </Testo>
        </Compare>
        {/* La cassa confronta: acconti e contributi definitivi. */}
        <Compare v={molla(locale, bilancia, fps)} cx={640} cy={520}>
          <Bilancia cx={640} cy={560} pende={tra(locale, confronto, confronto + 20) * 0.9} sinistra="Acconti" destra="Definitivi" />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Se hai pagato troppo, la cassa ti restituisce la differenza, con un interesse. Se hai pagato troppo poco, ti manda la fattura del conguaglio: da pagare entro … giorni dalla sua data. Non ce la fai? Chiedi una dilazione: gli interessi però restano.» */
const aavsConguaglio: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.45),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "festeggia", quando: fra(ctx, null, 0, 0.6, 0.2) + 6 },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.45) },
      { tipo: "scuoti", quando: fra(ctx, 2, 3, 0.4, 0.7) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const troppo = fra(ctx, null, 0, 0.1, 0.03);
    const rimborso = fra(ctx, null, 0, 0.45, 0.14);
    const interesse = fra(ctx, null, 0, 0.8, 0.25);
    const poco = fra(ctx, 0, 1, 0.1, 0.32);
    const fattura = fra(ctx, 0, 1, 0.55, 0.42);
    const data = fra(ctx, 1, 2, 0.3, 0.55);
    const nonCeLaFai = fra(ctx, 2, 3, 0.2, 0.68);
    const dilazione = fra(ctx, 3, null, 0.15, 0.78);
    const restano = fra(ctx, 3, null, 0.6, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il conguaglio" />
        {/* Hai pagato troppo: ti restituisce la differenza. */}
        <Compare v={molla(locale, troppo, fps)} cx={470} cy={130}>
          <Pillola x={470} y={130} testo="Pagato troppo" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.ok} />
        </Compare>
        <Compare v={molla(locale, rimborso, fps)} cx={470} cy={280}>
          <Salvadanaio x={460} y={350} s={1} />
        </Compare>
        {[0, 1].map((i) => {
          const cade = tra(locale, rimborso + 6 + i * 6, rimborso + 18 + i * 6);
          return cade > 0 && cade < 1 ? <Moneta key={i} cx={452 + i * 4} cy={180 + cade * 70} r={18} /> : null;
        })}
        <Compare v={molla(locale, interesse, fps)} cx={470} cy={398}>
          <Pillola x={470} y={398} testo="+ un interesse" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Hai pagato troppo poco: la fattura del conguaglio. */}
        <Compare v={molla(locale, poco, fps)} cx={810} cy={130}>
          <Pillola x={810} y={130} testo="Troppo poco" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, fattura, fps)} cx={800} cy={270}>
          <Foglio x={740} y={180} w={130} h={170}>
            <Righe x={756} y={232} w={84} n={3} passo={24} />
            <Moneta cx={806} cy={318} r={18} />
          </Foglio>
          <Testo x={805} y={378} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Conguaglio
          </Testo>
        </Compare>
        <Compare v={molla(locale, data, fps)} cx={920} cy={240}>
          <Calendario cx={920} cy={240} s={0.62} />
        </Compare>
        <Compare v={molla(locale, data + 6, fps)} cx={810} cy={420}>
          <Testo x={810} y={420} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            dalla data della fattura
          </Testo>
        </Compare>
        <line x1={340} y1={470} x2={960} y2={470} stroke={TINTE.tinta} strokeWidth={4} strokeDasharray="10 12" strokeLinecap="round" opacity={tra(locale, nonCeLaFai - 8, nonCeLaFai)} />
        {/* Non ce la fai? Una dilazione, ma gli interessi restano. */}
        <Compare v={molla(locale, nonCeLaFai, fps)} cx={450} cy={535}>
          <Pillola x={450} y={535} testo="Non ce la fai?" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, dilazione, fps)} cx={770} cy={535}>
          <Pillola x={650} y={535} testo="Dilazione" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
          {[0, 1, 2, 3].map((i) => (
            <Moneta key={i} cx={760 + i * 56} cy={535} r={18} />
          ))}
        </Compare>
        <Compare v={molla(locale, restano, fps)} cx={760} cy={610}>
          <Pillola x={760} y={610} testo="Gli interessi restano" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Attenzione alla trappola: se gli acconti restano sotto il … dei definitivi, sulla differenza paghi interessi di mora. Per il … si contano dal …, anche se la fattura arriva dopo e la paghi in tempo.» */
const BARRE = { x: 400, w: 520 } as const;
const ANNI = [
  { x: 360, righe: ["Anno dei", "contributi"] },
  { x: 560, righe: ["Anno", "dopo"] },
] as const;
const aavsTrappola: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.62),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.2, 0.05) + 4 },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.42) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.6, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const definitivi = fra(ctx, null, 0, 0.3, 0.12);
    const acconti = fra(ctx, null, 0, 0.55, 0.2);
    const soglia = fra(ctx, null, 0, 0.8, 0.28);
    const differenza = fra(ctx, 0, 1, 0.2, 0.4);
    const anni = fra(ctx, 1, 2, 0.05, 0.56);
    const gennaio = fra(ctx, 1, 2, 0.6, 0.66);
    const fattura = fra(ctx, 2, null, 0.3, 0.85);
    const quota = 0.62;
    const tre = BARRE.x + BARRE.w * 0.75;
    const fineAcconti = BARRE.x + BARRE.w * quota;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La trappola" />
        <Compare v={molla(locale, definitivi, fps)} cx={360} cy={110}>
          <Avviso x={355} y={118} s={0.8} />
        </Compare>
        {/* Le due barre: i definitivi e gli acconti, troppo corti. */}
        <g opacity={tra(locale, definitivi - 4, definitivi + 6)}>
          <Testo x={BARRE.x} y={112} corpo={22} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Contributi definitivi
          </Testo>
          <rect x={BARRE.x} y={130} width={BARRE.w * tra(locale, definitivi, definitivi + 14)} height={44} rx={12} fill={TINTE.tratto} />
        </g>
        <g opacity={tra(locale, acconti - 4, acconti + 6)}>
          <Testo x={BARRE.x} y={210} corpo={22} titolo peso={800} colore={TEAL_CHIARO} ancora="start">
            Acconti pagati
          </Testo>
          <rect x={BARRE.x} y={228} width={BARRE.w * quota * tra(locale, acconti, acconti + 14)} height={44} rx={12} fill={TEAL_CHIARO} />
        </g>
        <g opacity={tra(locale, soglia - 4, soglia + 8)}>
          <line x1={tre} y1={120} x2={tre} y2={290} stroke={TINTE.accento} strokeWidth={5} strokeDasharray="10 8" strokeLinecap="round" />
          <Testo x={tre} y={312} corpo={22} titolo peso={800} colore={TINTE.accento}>
            tre quarti
          </Testo>
        </g>
        {/* La differenza, con gli interessi. */}
        <Compare v={molla(locale, differenza, fps)} cx={(fineAcconti + BARRE.x + BARRE.w) / 2} cy={250}>
          <rect x={fineAcconti + 4} y={228} width={BARRE.x + BARRE.w - fineAcconti - 4} height={44} rx={12} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={4} strokeDasharray="8 6" />
        </Compare>
        <Compare v={molla(locale, differenza + 10, fps)} cx={800} cy={360}>
          <Pillola x={800} y={360} testo="Interessi di mora" corpo={24} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        {/* Da quando: il primo gennaio del secondo anno dopo. */}
        {ANNI.map((a, i) => (
          <Compare key={a.x} v={molla(locale, anni + i * 5, fps)} cx={a.x + 95} cy={500}>
            <rect x={a.x} y={468} width={190} height={64} rx={14} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={4} />
            <Righe2 x={a.x + 95} y={488} righe={[...a.righe]} corpo={22} passo={24} />
          </Compare>
        ))}
        <Compare v={molla(locale, gennaio, fps)} cx={760} cy={430}>
          <Calendario cx={770} cy={420} s={0.6} colore={TINTE.rischio} />
          <Testo x={810} y={422} corpo={22} titolo peso={800} colore={TINTE.rischio} ancora="start">
            primo gennaio
          </Testo>
        </Compare>
        {gennaio > 0 ? <rect x={760} y={480} width={190 * tra(locale, gennaio + 6, gennaio + 22)} height={40} rx={12} fill={TINTE.rischio} /> : null}
        <Compare v={molla(locale, gennaio + 16, fps)} cx={855} cy={500}>
          <Testo x={855} y={501} corpo={22} titolo peso={800} colore={TINTE.carta}>
            Interessi
          </Testo>
        </Compare>
        {/* Anche se la fattura arriva dopo e la paghi in tempo. */}
        <Compare v={molla(locale, fattura, fps)} cx={760} cy={605}>
          <Foglio x={600} y={565} w={64} h={84}>
            <Righe x={612} y={598} w={36} n={2} passo={18} />
          </Foglio>
          <Spunta cx={656} cy={640} r={18} p={tra(locale, fattura + 8, fattura + 20)} />
          <Righe2 x={820} y={592} righe={["Fattura pagata in tempo:", "interessi lo stesso"]} corpo={22} passo={28} colore={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

/* 9. «In Ticino, con la cassa cantonale, paghi anche due contributi sul reddito soggetto AVS. Lo … per gli assegni familiari e lo … per l'assegno integrativo: sono le aliquote del ….» */
const PILA = { x: 580, w: 130, base: 520 } as const;
const aavsTicino: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.5, 0.7),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.1) },
      { tipo: "festeggia", quando: fra(ctx, 1, 2, 0.75, 0.75) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cassa = fra(ctx, null, 0, 0.3, 0.06);
    const avs = fra(ctx, 0, 1, 0.3, 0.3);
    const af = fra(ctx, 1, 2, 0.15, 0.55);
    const afi = fra(ctx, 1, 2, 0.6, 0.68);
    const anno = fra(ctx, 2, null, 0.3, 0.9);
    const hAvs = 210;
    const hAf = 34;
    const hAfi = 16;
    const crescita = (da: number) => tra(locale, da, da + 14);
    const yAvs = PILA.base - hAvs * crescita(avs);
    const yAf = yAvs - hAf * crescita(af);
    const yAfi = yAf - hAfi * crescita(afi);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="In Ticino, in più" />
        <Compare v={molla(locale, cassa, fps)} cx={420} cy={300}>
          <Palazzo x={420} y={380} s={0.85} nome="IAS" />
          <Righe2 x={420} y={414} righe={["Cassa", "cantonale"]} corpo={24} passo={28} />
        </Compare>
        {/* La pila: AVS, poi assegni familiari e assegno integrativo. */}
        {avs > 0 ? (
          <g>
            <rect x={PILA.x} y={yAvs} width={PILA.w} height={PILA.base - yAvs} rx={12} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={4} />
            <Testo x={PILA.x + PILA.w / 2} y={(yAvs + PILA.base) / 2} corpo={28} titolo peso={800} colore={TINTE.tratto} opacita={crescita(avs)}>
              AVS
            </Testo>
          </g>
        ) : null}
        {af > 0 ? <rect x={PILA.x} y={yAf} width={PILA.w} height={yAvs - yAf} rx={10} fill={TINTE.accento} /> : null}
        {afi > 0 ? <rect x={PILA.x} y={yAfi} width={PILA.w} height={yAf - yAfi} rx={8} fill={TINTE.oro} /> : null}
        <Compare v={molla(locale, avs + 8, fps)} cx={645} cy={560}>
          <Testo x={645} y={560} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Sul reddito soggetto AVS
          </Testo>
        </Compare>
        <Compare v={molla(locale, af + 6, fps)} cx={840} cy={PILA.base - hAvs - hAf / 2}>
          <line x1={PILA.x + PILA.w + 6} y1={PILA.base - hAvs - hAf / 2} x2={724} y2={PILA.base - hAvs - hAf / 2} stroke={TINTE.accento} strokeWidth={4} />
          <Righe2 x={846} y={PILA.base - hAvs - hAf / 2 - 2} righe={["+ Assegni familiari"]} corpo={22} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, afi + 6, fps)} cx={850} cy={PILA.base - hAvs - hAf - hAfi / 2 - 40}>
          <path
            d={`M ${PILA.x + PILA.w + 6} ${PILA.base - hAvs - hAf - hAfi / 2} Q 730 ${PILA.base - hAvs - hAf - 40} 740 ${PILA.base - hAvs - hAf - 50}`}
            fill="none"
            stroke={TINTE.oro}
            strokeWidth={4}
          />
          <Righe2 x={856} y={PILA.base - hAvs - hAf - 52} righe={["+ Assegno integrativo"]} corpo={22} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, anno, fps)} cx={860} cy={420}>
          <Calendario cx={860} cy={420} s={0.75} />
          <Testo x={860} y={480} corpo={20} titolo peso={800} colore={TINTE.tratto}>
            aliquote dell'anno
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Nel tuo percorso, il riquadro «Scadenze da ricordare» ha le quattro date: le scarichi nel calendario, con un promemoria una settimana prima.» */
const aavsScadenze: Disegno = {
  chiave: (ctx) => fra(ctx, 0, null, 0.4, 0.7),
  bussolina: (ctx) => ({
    posto: POSTO,
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 0, null, 0.7, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const riquadro = fra(ctx, null, 0, 0.2, 0.08);
    const righe = [0.35, 0.5, 0.65, 0.8].map((f) => fra(ctx, null, 0, f, f * 0.45));
    const scarica = fra(ctx, 0, null, 0.2, 0.6);
    const telefono = fra(ctx, 0, null, 0.35, 0.68);
    const campanella = fra(ctx, 0, null, 0.65, 0.85);
    // Le date in ordine di calendario: gennaio, aprile, luglio, ottobre.
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il tuo percorso" />
        {/* Il riquadro del percorso. */}
        <Compare v={molla(locale, riquadro, fps)} cx={500} cy={360}>
          <rect x={340} y={110} width={330} height={480} rx={24} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <Calendario cx={384} cy={160} s={0.45} />
          <Righe2 x={515} y={148} righe={["Scadenze", "da ricordare"]} corpo={24} passo={28} />
        </Compare>
        {MESI_ACCONTI.map((mese, i) => (
          <Compare key={mese} v={molla(locale, righe[i], fps)} cx={505} cy={250 + i * 70}>
            <line x1={364} y1={214 + i * 70} x2={646} y2={214 + i * 70} stroke={TINTE.tinta} strokeWidth={3} />
            <Moneta cx={392} cy={250 + i * 70} r={18} />
            <Testo x={424} y={251 + i * 70} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {mese}
            </Testo>
          </Compare>
        ))}
        <Compare v={molla(locale, scarica, fps)} cx={505} cy={550}>
          <rect x={385} y={526} width={240} height={48} rx={24} fill={TINTE.accento} />
          <path d="M 418 538 V 558 M 408 550 L 418 560 L 428 550" fill="none" stroke={TINTE.carta} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <Testo x={525} y={551} corpo={22} titolo peso={800} colore={TINTE.carta}>
            Scarica
          </Testo>
        </Compare>
        <Freccia d="M 640 520 Q 700 520 735 470" p={tra(locale, telefono - 10, telefono + 2)} colore={TINTE.accento} />
        {/* Il calendario del telefono, con il promemoria. */}
        <Compare v={molla(locale, telefono, fps)} cx={850} cy={360}>
          <rect x={750} y={150} width={200} height={380} rx={34} fill={TINTE.tratto} />
          <rect x={764} y={186} width={172} height={318} rx={18} fill={TINTE.carta} />
          <rect x={824} y={164} width={52} height={10} rx={5} fill={COLORE_TENUE} />
          <Calendario cx={850} cy={270} s={1.1} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={784 + i * 36} y={360} width={26} height={26} rx={7} fill={i % 2 === 0 ? TINTE.accento : TINTE.tinta} />
          ))}
        </Compare>
        {campanella > 0 ? (
          <Compare v={molla(locale, campanella, fps)} cx={850} cy={450}>
            <Campanella cx={850} cy={450} s={1} locale={locale} />
          </Compare>
        ) : null}
        <Compare v={molla(locale, campanella + 6, fps)} cx={850} cy={590}>
          <Pillola x={850} y={590} testo="Promemoria" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_ACCONTI_AVS: Record<string, Disegno> = {
  "aavs-cosa": aavsCosa,
  "aavs-date": aavsDate,
  "aavs-ritardo": aavsRitardo,
  "aavs-cambia": aavsCambia,
  "aavs-definitivi": aavsDefinitivi,
  "aavs-conguaglio": aavsConguaglio,
  "aavs-trappola": aavsTrappola,
  "aavs-ticino": aavsTicino,
  "aavs-scadenze": aavsScadenze,
};
