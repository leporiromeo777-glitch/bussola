/**
 * I disegni della lezione 17 («Come fare una fattura corretta»), vedi
 * src/lezioni/fatture.ts. Fonti: LIVA artt. 26 e 27, CO artt. 954a e 958f,
 * pagine dell'AFC (numero IVA e IDI) e dell'UST (l'IDI in generale), pagina
 * della SIX sulla QR-fattura. Coordinate della tela 1000×700; l'angolo in
 * basso a sinistra (x < 300, y > 480) è della finestra di Bleo. Niente cifre:
 * i numeri del numero IVA sono puntini, i dieci anni li dice solo la voce.
 */
import { Avviso, Compare, Foglio, Freccia, Fumetto, molla, Moneta, Negozio, Palazzo, Persona, Pillola, Registro, Righe, Spunta, TEAL_CHIARO, Testo, TINTE, tra } from "../figure";
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

/** Un tondo rosso con la croce a X: «no». */
export function No({ cx, cy, r = 22 }: { cx: number; cy: number; r?: number }) {
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

/** Un calendario da muro, senza numeri: il giorno segnato è la scadenza. */
export function Calendario({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-64} y={-60} width={128} height={124} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-64} y={-60} width={128} height={34} rx={14} fill={TINTE.accento} />
      {Array.from({ length: 12 }, (_, k) => (
        <rect key={k} x={-48 + (k % 4) * 26} y={-12 + Math.floor(k / 4) * 24} width={18} height={14} rx={4} fill={k === 9 ? TINTE.rischio : TINTE.tinta} />
      ))}
    </g>
  );
}

/** Un computer portatile. */
export function Computer({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-80} y={-64} width={160} height={104} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-80} y={-64} width={160} height={20} rx={10} fill={TINTE.tinta} />
      <Righe x={-56} y={-24} w={90} n={3} passo={20} />
      <path d="M -102 44 H 102 l -14 16 H -88 Z" fill={TINTE.tratto} />
    </g>
  );
}

/** Una clessidra: «per tanto tempo». */
export function Clessidra({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-34} y={-58} width={68} height={12} rx={6} fill={TINTE.accento} />
      <rect x={-34} y={46} width={68} height={12} rx={6} fill={TINTE.accento} />
      <path d="M -24 -46 H 24 Q 24 -14 4 0 Q 24 14 24 46 H -24 Q -24 14 -4 0 Q -24 -14 -24 -46 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
      <path d="M -14 -30 H 14 Q 10 -14 0 -6 Q -10 -14 -14 -30 Z" fill={TINTE.oro} />
      <path d="M -16 40 Q -10 22 0 18 Q 10 22 16 40 Z" fill={TINTE.oro} />
    </g>
  );
}

/** Una foglia in un tondo: il logo della ditta. */
function Logo({ cx, cy, r = 30 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
      <path
        d={`M ${cx - r * 0.5} ${cy + r * 0.45} Q ${cx - r * 0.55} ${cy - r * 0.5} ${cx + r * 0.5} ${cy - r * 0.5} Q ${cx + r * 0.45} ${cy + r * 0.5} ${cx - r * 0.5} ${cy + r * 0.45} Z`}
        fill={TINTE.ok}
      />
      <path d={`M ${cx - r * 0.42} ${cy + r * 0.38} L ${cx + r * 0.25} ${cy - r * 0.25}`} stroke={TINTE.carta} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

/** La bandiera svizzera. */
export function Bandiera({ cx, cy, lato = 52 }: { cx: number; cy: number; lato?: number }) {
  const b = lato * 0.2;
  const l = lato * 0.62;
  return (
    <g>
      <rect x={cx - lato / 2} y={cy - lato / 2} width={lato} height={lato} rx={lato * 0.14} fill={TINTE.rischio} />
      <rect x={cx - b / 2} y={cy - l / 2} width={b} height={l} fill={TINTE.carta} />
      <rect x={cx - l / 2} y={cy - b / 2} width={l} height={b} fill={TINTE.carta} />
    </g>
  );
}

// Il codice QR: moduli finti ma sempre uguali (generatore con un seme fisso),
// i tre quadrati agli angoli e al centro la croce svizzera della QR-fattura.
const QR_LATO = 25;
const QR_MODULI: readonly (readonly [number, number])[] = (() => {
  const moduli: [number, number][] = [];
  let seme = 17;
  const casuale = () => {
    seme = (seme * 1103515245 + 12345) % 2147483648;
    return seme / 2147483648;
  };
  const inAngolo = (r: number, c: number) => (r < 8 && c < 8) || (r < 8 && c >= QR_LATO - 8) || (r >= QR_LATO - 8 && c < 8);
  const alCentro = (r: number, c: number) => Math.abs(r - 12) <= 3 && Math.abs(c - 12) <= 3;
  for (let r = 0; r < QR_LATO; r++) {
    for (let c = 0; c < QR_LATO; c++) {
      if (inAngolo(r, c) || alCentro(r, c)) continue;
      if (casuale() < 0.5) moduli.push([r, c]);
    }
  }
  return moduli;
})();

function QrCodice({ cx, cy, lato, croce = 1 }: { cx: number; cy: number; lato: number; croce?: number }) {
  const m = lato / QR_LATO;
  const x0 = cx - lato / 2;
  const y0 = cy - lato / 2;
  const nero = "#1c1f24";
  const angoli = [
    [0, 0],
    [0, QR_LATO - 7],
    [QR_LATO - 7, 0],
  ] as const;
  // La croce svizzera: un quadrato nero con il bordo bianco e la croce bianca.
  const lc = m * 7 * (0.9 + 0.1 * croce);
  return (
    <g>
      <rect x={x0 - m} y={y0 - m} width={lato + 2 * m} height={lato + 2 * m} fill={TINTE.carta} />
      {QR_MODULI.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={x0 + c * m} y={y0 + r * m} width={m + 0.3} height={m + 0.3} fill={nero} />
      ))}
      {angoli.map(([r, c]) => (
        <g key={`${r}-${c}`}>
          <rect x={x0 + c * m} y={y0 + r * m} width={7 * m} height={7 * m} fill={nero} />
          <rect x={x0 + (c + 1) * m} y={y0 + (r + 1) * m} width={5 * m} height={5 * m} fill={TINTE.carta} />
          <rect x={x0 + (c + 2) * m} y={y0 + (r + 2) * m} width={3 * m} height={3 * m} fill={nero} />
        </g>
      ))}
      <rect x={cx - lc / 2} y={cy - lc / 2} width={lc} height={lc} fill={TINTE.carta} />
      <rect x={cx - lc * 0.4} y={cy - lc * 0.4} width={lc * 0.8} height={lc * 0.8} fill={nero} />
      <rect x={cx - lc * 0.08} y={cy - lc * 0.27} width={lc * 0.16} height={lc * 0.54} fill={TINTE.carta} />
      <rect x={cx - lc * 0.27} y={cy - lc * 0.08} width={lc * 0.54} height={lc * 0.16} fill={TINTE.carta} />
    </g>
  );
}

/** Un telefono con il codice QR sullo schermo; `scansione` da 0 a 1 fa scorrere la linea rossa. */
function Telefono({ cx, cy, s = 1, scansione = 0 }: { cx: number; cy: number; s?: number; scansione?: number }) {
  const y = -58 + 116 * (0.5 - 0.5 * Math.cos(scansione * Math.PI * 2));
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-52} y={-96} width={104} height={192} rx={20} fill={TINTE.tratto} />
      <rect x={-42} y={-78} width={84} height={150} rx={8} fill={TINTE.carta} />
      <QrCodice cx={0} cy={-2} lato={66} />
      {scansione > 0 && scansione < 1 ? <line x1={-38} y1={y} x2={38} y2={y} stroke={TINTE.rischio} strokeWidth={4} strokeLinecap="round" /> : null}
      <rect x={-16} y={80} width={32} height={6} rx={3} fill={TINTE.tinta} />
    </g>
  );
}

/** Lo sportello postale: il bancone, il vetro e chi ci lavora (bottom-center in x, y). */
function Sportello({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-76} y={-178} width={152} height={30} rx={10} fill={TINTE.tratto} />
      <rect x={-64} y={-148} width={128} height={104} rx={8} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={6} />
      <Persona x={0} y={-44} s={0.5} colore={TEAL_CHIARO} />
      <rect x={-64} y={-148} width={128} height={104} rx={8} fill="#ffffff" opacity={0.25} />
      <rect x={-84} y={-48} width={168} height={48} rx={10} fill={TINTE.accento} />
      <rect x={-30} y={-58} width={60} height={14} rx={5} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={3} />
    </g>
  );
}

/** Una scatola d'archivio con la targhetta (centro in cx, cy). */
function Archivio({ cx, cy, etichetta }: { cx: number; cy: number; etichetta: string }) {
  return (
    <g>
      <rect x={cx - 100} y={cy - 64} width={200} height={128} rx={16} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={6} />
      <rect x={cx - 110} y={cy - 80} width={220} height={28} rx={10} fill={TINTE.accento} />
      <rect x={cx - 74} y={cy - 26} width={148} height={46} rx={10} fill={TINTE.carta} stroke={TINTE.accento} strokeWidth={4} />
      <Testo x={cx} y={cy - 2} corpo={24} titolo peso={800} colore={TINTE.accento}>
        {etichetta}
      </Testo>
    </g>
  );
}

/** La freccia del mouse: «un clic». */
function Cursore({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 0 0 L 0 44 L 11 33 L 19 52 L 27 48 L 19 30 L 34 30 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
}

/* 2. «Una fattura dice chiaramente chi la manda e a chi va, che lavoro hai fatto e quanto costa. Questa è la base, che tu sia iscritto all'IVA o no.» */
const BASE = { x: 370, y: 96, w: 320, h: 540, etichette: 750 } as const;
const ZONE_BASE = [
  { testo: "Chi la manda", y: 165, riquadro: { x: 384, y: 128, w: 236, h: 76 } },
  { testo: "A chi va", y: 255, riquadro: { x: 444, y: 218, w: 232, h: 76 } },
  { testo: "Che lavoro", y: 385, riquadro: { x: 384, y: 320, w: 292, h: 130 } },
  { testo: "Quanto costa", y: 540, riquadro: { x: 384, y: 504, w: 292, h: 72 } },
] as const;
const faBase: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.7, 0.55),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.2) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.5, 0.8) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const zone = [fra(ctx, null, 0, 0.4, 0.15), fra(ctx, null, 0, 0.85, 0.3), fra(ctx, 0, 1, 0.25, 0.42), fra(ctx, 0, 1, 0.75, 0.56)];
    const base = fra(ctx, 1, null, 0.3, 0.75);
    const spunta = fra(ctx, 1, null, 0.55, 0.82);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cosa dice una fattura" />
        <Compare v={molla(locale, 6, fps, true)} cx={BASE.x + BASE.w / 2} cy={BASE.y + BASE.h / 2}>
          <Foglio x={BASE.x} y={BASE.y} w={BASE.w} h={BASE.h}>
            {/* I riquadri si colorano quando Bleo ne parla. */}
            {ZONE_BASE.map((z, i) => (
              <rect key={z.testo} x={z.riquadro.x} y={z.riquadro.y} width={z.riquadro.w} height={z.riquadro.h} rx={14} fill={TINTE.crema} opacity={tra(locale, zone[i], zone[i] + 8)} />
            ))}
            <circle cx={414} cy={165} r={20} fill={TINTE.accento} />
            <Righe x={446} y={154} w={120} n={2} passo={22} />
            <circle cx={474} cy={255} r={20} fill={TEAL_CHIARO} />
            <Righe x={506} y={244} w={120} n={2} passo={22} />
            {[345, 385, 425].map((y) => (
              <g key={y}>
                <line x1={400} y1={y} x2={560} y2={y} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
                <line x1={604} y1={y} x2={656} y2={y} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
              </g>
            ))}
            <line x1={398} y1={482} x2={662} y2={482} stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" />
            <Testo x={400} y={541} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
              Totale
            </Testo>
            <Moneta cx={630} cy={540} r={24} />
          </Foglio>
        </Compare>
        {ZONE_BASE.map((z, i) => (
          <g key={z.testo}>
            <Freccia d={`M ${BASE.etichette - 12} ${z.y} H ${BASE.x + BASE.w + 8}`} p={tra(locale, zone[i] - 2, zone[i] + 10)} spessore={6} />
            <Compare v={molla(locale, zone[i], fps)} cx={BASE.etichette + 80} cy={z.y}>
              <Testo x={BASE.etichette} y={z.y} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
                {z.testo}
              </Testo>
            </Compare>
          </g>
        ))}
        <Spunta cx={BASE.x + BASE.w - 6} cy={BASE.y + BASE.h - 8} r={30} p={tra(locale, spunta, spunta + 14)} />
        <Compare v={molla(locale, base, fps)} cx={850} cy={620}>
          <Pillola x={850} y={620} testo="La base, per tutti" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Se la tua ditta è iscritta al registro di commercio, in fattura scrivi il suo nome completo e senza cambiarlo, proprio com'è iscritto. Accanto puoi aggiungere un logo o un nome breve.» */
const NOME = "Giardini Rossi";
const NOME_DA = { x: 450, y: 136 } as const;
const NOME_A = { x: 800, y: 172 } as const;
const faNome: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.45, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.35) },
      { tipo: "festeggia", quando: fra(ctx, 1, 2, 0.6, 0.6) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const registro = fra(ctx, null, 0, 0.35, 0.12);
    const nome = fra(ctx, null, 0, 0.8, 0.22);
    const fattura = fra(ctx, 0, 1, 0.1, 0.3);
    const copia = fra(ctx, 0, 1, 0.45, 0.38);
    const uguale = fra(ctx, 1, 2, 0.3, 0.6);
    const logo = fra(ctx, 2, null, 0.3, 0.8);
    const breve = fra(ctx, 2, null, 0.6, 0.88);
    const p = tra(locale, copia, copia + 22);
    const x = NOME_DA.x + (NOME_A.x - NOME_DA.x) * p;
    const y = NOME_DA.y + (NOME_A.y - NOME_DA.y) * p - Math.sin(Math.PI * p) * 50;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il nome della ditta" />
        <Compare v={molla(locale, registro, fps)} cx={450} cy={260}>
          <Registro x={450} y={300} s={1.15} />
          <Righe2 x={450} y={350} righe={["Registro", "di commercio"]} corpo={26} passo={32} />
        </Compare>
        <Compare v={molla(locale, nome, fps)} cx={NOME_DA.x} cy={NOME_DA.y}>
          <Pillola x={NOME_DA.x} y={NOME_DA.y} testo={NOME} corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, fattura, fps)} cx={800} cy={320}>
          <Foglio x={650} y={100} w={300} h={440}>
            <Righe x={680} y={300} w={210} n={3} passo={30} />
          </Foglio>
        </Compare>
        {/* La copia del nome vola dal registro alla fattura, tale e quale. */}
        {p > 0 ? <Pillola x={x} y={y} testo={NOME} corpo={26} fondo={TINTE.accento} colore={TINTE.carta} /> : null}
        <Compare v={molla(locale, uguale, fps)} cx={NOME_A.x} cy={236}>
          <Pillola x={NOME_A.x} y={236} testo="Uguale al registro" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, logo, fps)} cx={712} cy={440}>
          <Logo cx={712} cy={440} r={32} />
        </Compare>
        <Compare v={molla(locale, breve, fps)} cx={850} cy={440}>
          <Pillola x={850} y={440} testo="Nome breve" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, breve + 8, fps)} cx={800} cy={500}>
          <Testo x={800} y={500} corpo={24} titolo peso={800} colore={TINTE.ok}>
            in più, accanto
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/** Una pillola barrata: «questo no». */
function Barrata({ x, y, testo, barra }: { x: number; y: number; testo: string; barra: number }) {
  const w = testo.length * 24 * 0.56 + 24 * 1.3;
  return (
    <g>
      <Pillola x={x} y={y} testo={testo} corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
      {barra > 0 ? (
        <line x1={x - w / 2 + 6} y1={y} x2={x - w / 2 + 6 + (w - 12) * barra} y2={y} stroke={TINTE.rischio} strokeWidth={6} strokeLinecap="round" />
      ) : null}
      {barra >= 1 ? <No cx={x + w / 2 - 4} cy={y - 26} r={16} /> : null}
    </g>
  );
}

/* 4. «Finché non sei iscritto all'IVA, in fattura l'IVA non deve comparire: né l'aliquota, né l'importo. Scrivi solo il prezzo del tuo lavoro. Quando devi iscriverti, lo spiega la lezione ….» */
const faSenzaIva: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.6, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.6, 0.45) + 4 },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.72) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tu = 4;
    const fattura = fra(ctx, null, 0, 0.5, 0.15);
    const iva = fra(ctx, 0, 1, 0.1, 0.3);
    const aliquota = fra(ctx, 0, 1, 0.62, 0.45);
    const importo = fra(ctx, 0, 1, 0.85, 0.55);
    const prezzo = fra(ctx, 1, 2, 0.3, 0.7);
    const quando = fra(ctx, 2, null, 0.3, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Non sei iscritto all'IVA" />
        <Compare v={molla(locale, tu, fps, true)} cx={400} cy={330}>
          <Persona x={400} y={410} s={0.85} colore={TINTE.accento} />
          <Righe2 x={400} y={445} righe={["Non iscritto", "all'IVA"]} corpo={24} passo={30} />
        </Compare>
        <Compare v={molla(locale, quando, fps)} cx={470} cy={210}>
          <Fumetto cx={470} cy={210} r={32}>
            <Testo x={470} y={212} corpo={38} titolo peso={800} colore={TINTE.tratto}>
              ?
            </Testo>
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, fattura, fps)} cx={740} cy={320}>
          <Foglio x={530} y={100} w={420} h={440}>
            <Testo x={560} y={180} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
              Il tuo lavoro
            </Testo>
            <line x1={830} y1={180} x2={900} y2={180} stroke={TINTE.tinta} strokeWidth={12} strokeLinecap="round" />
            <line x1={560} y1={225} x2={760} y2={225} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
            <line x1={556} y1={360} x2={920} y2={360} stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" />
            <Testo x={560} y={420} corpo={30} titolo peso={800} colore={TINTE.tratto} ancora="start">
              Prezzo
            </Testo>
            <Moneta cx={880} cy={420} r={26} />
          </Foglio>
        </Compare>
        <Compare v={molla(locale, iva, fps)} cx={730} cy={292}>
          <Barrata x={640} y={292} testo="Aliquota" barra={tra(locale, aliquota, aliquota + 10)} />
          <Barrata x={812} y={292} testo="Importo IVA" barra={tra(locale, importo, importo + 10)} />
        </Compare>
        <Compare v={molla(locale, prezzo, fps)} cx={740} cy={490}>
          <Pillola x={740} y={490} testo="Solo il prezzo" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, quando + 6, fps)} cx={740} cy={612}>
          <Pillola x={740} y={612} testo="Quando iscriverti: c'è una lezione" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Attenzione: se la scrivi lo stesso, quell'IVA la devi pagare tu alla Confederazione. Se hai sbagliato, correggi: manda al cliente un nuovo documento che annulla la fattura sbagliata.» */
const DOVUTA = { foglio: { x: 350, y: 110, w: 190, h: 220 }, iva: { x: 445, y: 270 }, palazzo: { x: 840, y: 330 } } as const;
const faIvaDovuta: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.55, 0.4) + 4 },
      { tipo: "lancia", quando: fra(ctx, 2, null, 0.4, 0.8) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const fattura = fra(ctx, null, 0, 0.25, 0.1);
    const iva = fra(ctx, null, 0, 0.7, 0.25);
    const palazzo = fra(ctx, 0, 1, 0.3, 0.35);
    const monete = fra(ctx, 0, 1, 0.5, 0.42);
    const paghi = fra(ctx, 0, 1, 0.8, 0.5);
    const correggi = fra(ctx, 1, 2, 0.3, 0.6);
    const vecchia = fra(ctx, 1, 2, 0.6, 0.64);
    const nuovo = fra(ctx, 2, null, 0.08, 0.7);
    const cliente = fra(ctx, 2, null, 0.28, 0.76);
    const annulla = fra(ctx, 2, null, 0.62, 0.84);
    const via = fra(ctx, 2, null, 0.82, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="IVA scritta per errore" />
        {/* La fattura con l'IVA che non doveva esserci. */}
        <Compare v={molla(locale, fattura, fps)} cx={DOVUTA.foglio.x + 95} cy={220}>
          <Foglio x={DOVUTA.foglio.x} y={DOVUTA.foglio.y} w={DOVUTA.foglio.w} h={DOVUTA.foglio.h}>
            <Righe x={DOVUTA.foglio.x + 22} y={DOVUTA.foglio.y + 64} w={110} n={3} passo={26} />
          </Foglio>
        </Compare>
        <Compare v={molla(locale, iva, fps)} cx={DOVUTA.iva.x} cy={DOVUTA.iva.y}>
          <Pillola x={DOVUTA.iva.x} y={DOVUTA.iva.y} testo="IVA" corpo={28} fondo={TINTE.rischio} colore={TINTE.carta} />
          <Avviso x={566} y={136} s={0.8} />
        </Compare>
        <Compare v={molla(locale, palazzo, fps)} cx={DOVUTA.palazzo.x} cy={250}>
          <Palazzo x={DOVUTA.palazzo.x} y={DOVUTA.palazzo.y} s={0.72} />
          <Testo x={DOVUTA.palazzo.x} y={DOVUTA.palazzo.y + 32} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            La Confederazione
          </Testo>
        </Compare>
        {/* Le monete dell'IVA vanno alla Confederazione. */}
        {[0, 1, 2].map((k) => {
          const p = tra(locale, monete + k * 6, monete + k * 6 + 20);
          if (p <= 0) return null;
          const x = DOVUTA.iva.x + 40 + (DOVUTA.palazzo.x - DOVUTA.iva.x - 40) * p;
          const y = DOVUTA.iva.y - 10 + (250 - DOVUTA.iva.y + 10) * p - Math.sin(Math.PI * p) * 70;
          return p >= 1 ? null : <Moneta key={k} cx={x} cy={y} r={20} />;
        })}
        <Compare v={molla(locale, paghi, fps)} cx={650} cy={305}>
          <Pillola x={650} y={305} testo="La paghi tu" corpo={26} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        {/* Correggere: un nuovo documento che annulla la fattura, al cliente. */}
        <Compare v={molla(locale, correggi, fps)} cx={655} cy={420}>
          <Pillola x={655} y={420} testo="Hai sbagliato? Correggi" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, vecchia, fps)} cx={400} cy={545}>
          <g opacity={1 - 0.45 * tra(locale, via, via + 10)}>
            <Foglio x={345} y={478} w={110} h={136}>
              <Righe x={360} y={524} w={60} n={3} passo={22} />
            </Foglio>
          </g>
          {tra(locale, annulla, annulla + 8) > 0 ? <No cx={450} cy={600} r={22} /> : null}
        </Compare>
        <Freccia d="M 534 546 H 474" p={tra(locale, annulla - 6, annulla + 6)} colore={TINTE.rischio} spessore={6} />
        <Compare v={molla(locale, nuovo, fps)} cx={605} cy={540}>
          <Foglio x={545} y={466} w={124} h={152}>
            <Righe x={562} y={510} w={66} n={2} passo={22} />
          </Foglio>
          <Pillola x={607} y={584} testo="Annulla" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Freccia d="M 684 540 Q 740 520 790 560" p={tra(locale, cliente - 8, cliente + 6)} spessore={6} />
        <Compare v={molla(locale, cliente, fps)} cx={860} cy={570}>
          <Persona x={860} y={650} s={0.62} colore={TEAL_CHIARO} />
          <Testo x={860} y={508} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Cliente
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Se invece sei iscritto all'IVA, in fattura servono più dati. Il tuo nome e luogo, con il numero IVA. Il nome e il luogo del cliente. La data o il periodo del lavoro, e cosa hai fatto. E l'importo, con l'aliquota e l'importo dell'IVA.» */
const faElementi = elenco(
  "Se sei iscritto all'IVA",
  ["Tu: nome, luogo, numero IVA", "Il cliente: nome e luogo", "Quando e cosa hai fatto", "Importo, aliquota e IVA"],
  (ctx) => [fra(ctx, 0, 1, 0.1, 0.3), fra(ctx, 1, 2, 0.1, 0.48), fra(ctx, 2, 3, 0.1, 0.62), fra(ctx, 3, null, 0.1, 0.8)],
);

/* 7. «Il numero IVA è il tuo numero IDI, con la parola IVA alla fine. IDI vuol dire numero d'identificazione delle imprese: ogni impresa attiva in Svizzera ne riceve uno, gratis. Comincia sempre con CHE …» */
const CARTA = { x: 340, y: 150, w: 620, h: 140, cy: 220 } as const;
const PUNTI = [0, 1, 2].flatMap((g) => [0, 1, 2].map((k) => 516 + g * 98 + k * 26));
const SEPARATORI = [0, 1].map((g) => 591 + g * 98);
const IMPRESE = [400, 540, 680] as const;
const faNumeroIva: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.8, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.8, 0.35) },
      { tipo: "festeggia", quando: fra(ctx, 1, 2, 0.85, 0.7) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const carta = fra(ctx, null, 0, 0.12, 0.06);
    const idi = fra(ctx, null, 0, 0.5, 0.22);
    const iva = fra(ctx, null, 0, 0.82, 0.35);
    const nomeIdi = fra(ctx, 0, 1, 0.3, 0.45);
    const imprese = IMPRESE.map((_, i) => fra(ctx, 1, 2, 0.15 + i * 0.18, 0.55 + i * 0.04));
    const gratis = fra(ctx, 1, 2, 0.85, 0.7);
    const che = fra(ctx, 2, null, 0.3, 0.85);
    const alone = tra(locale, che + 4, che + 24);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il numero IVA" />
        <Compare v={molla(locale, carta, fps)} cx={CARTA.x + CARTA.w / 2} cy={CARTA.cy}>
          <rect x={CARTA.x} y={CARTA.y} width={CARTA.w} height={CARTA.h} rx={28} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          {alone > 0 && alone < 1 ? (
            <circle cx={420} cy={CARTA.cy} r={40 + alone * 50} fill="none" stroke={TINTE.rischio} strokeWidth={6} opacity={1 - alone} />
          ) : null}
          <Pillola x={420} y={CARTA.cy} testo="CHE" corpo={34} fondo={TINTE.tratto} colore={TINTE.carta} />
          <line x1={478} y1={CARTA.cy} x2={496} y2={CARTA.cy} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
          {PUNTI.map((x) => (
            <circle key={x} cx={x} cy={CARTA.cy} r={10} fill={TINTE.tratto} opacity={0.75} />
          ))}
          {SEPARATORI.map((x) => (
            <circle key={x} cx={x} cy={CARTA.cy + 10} r={4} fill={TINTE.tratto} />
          ))}
        </Compare>
        <Compare v={molla(locale, iva, fps)} cx={858} cy={CARTA.cy}>
          <Pillola x={858} y={CARTA.cy} testo="IVA" corpo={34} fondo={TINTE.accento} colore={TINTE.carta} />
          <Testo x={858} y={320} corpo={24} peso={700} colore={COLORE_TENUE}>
            alla fine
          </Testo>
        </Compare>
        <Freccia d="M 372 302 V 314 H 776 V 302" p={tra(locale, idi - 4, idi + 12)} spessore={5} punta={false} />
        <Compare v={molla(locale, idi + 6, fps)} cx={574} cy={344}>
          <Testo x={574} y={344} corpo={28} titolo peso={800} colore={TINTE.tratto}>
            Numero IDI
          </Testo>
        </Compare>
        <Compare v={molla(locale, nomeIdi, fps)} cx={574} cy={384}>
          <Testo x={574} y={384} corpo={22} peso={600} colore={COLORE_TENUE}>
            numero d&apos;identificazione delle imprese
          </Testo>
        </Compare>
        {/* Ogni impresa ne riceve uno, gratis. */}
        {IMPRESE.map((x, i) => (
          <Compare key={x} v={molla(locale, imprese[i], fps)} cx={x} cy={590}>
            <Negozio x={x} y={640} s={0.42} />
            <Pillola x={x} y={530} testo="IDI" corpo={18} fondo={TINTE.tratto} colore={TINTE.carta} />
          </Compare>
        ))}
        <Compare v={molla(locale, gratis, fps)} cx={860} cy={585}>
          <Pillola x={860} y={585} testo="Gratis" corpo={30} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, che, fps)} cx={420} cy={100}>
          <Bandiera cx={392} cy={100} lato={48} />
          <Testo x={426} y={101} corpo={24} titolo peso={800} colore={TINTE.rischio} ancora="start">
            Svizzera
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Per farti pagare usa la QR-fattura: ha preso il posto delle vecchie polizze di versamento. In fondo alla fattura c'è la sezione pagamento, con la ricevuta e un codice QR con la croce svizzera.» */
const QR_FOGLIO = { x: 380, y: 90, w: 540, h: 570, taglio: 340, ricevuta: 560 } as const;
const faQr: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.45, 0.8),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.62, 0.42) + 4 },
      { tipo: "lancia", quando: fra(ctx, 2, null, 0.45, 0.8) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const f = QR_FOGLIO;
    const qrFattura = fra(ctx, null, 0, 0.55, 0.18);
    const polizza = fra(ctx, 0, 1, 0.15, 0.28);
    const noPolizza = fra(ctx, 0, 1, 0.62, 0.42);
    const viaPolizza = fra(ctx, 0, 1, 0.82, 0.48);
    const sezione = fra(ctx, 1, 2, 0.08, 0.54);
    const ricevuta = fra(ctx, 2, null, 0.2, 0.7);
    const codice = fra(ctx, 2, null, 0.45, 0.8);
    const croce = fra(ctx, 2, null, 0.78, 0.9);
    const uscita = tra(locale, viaPolizza, viaPolizza + 14);
    const pulsa = 1 + 0.25 * Math.sin(Math.PI * tra(locale, croce, croce + 16));
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La QR-fattura" />
        <Compare v={molla(locale, 6, fps, true)} cx={f.x + f.w / 2} cy={f.y + f.h / 2}>
          <Foglio x={f.x} y={f.y} w={f.w} h={f.h}>
            <rect x={f.x + 26} y={f.y + 34} width={140} height={20} rx={6} fill={TINTE.tratto} />
            <Righe x={f.x + 26} y={f.y + 96} w={300} n={4} passo={32} />
            <line x1={f.x + 420} y1={f.y + 192} x2={f.x + 490} y2={f.y + 192} stroke={TINTE.tinta} strokeWidth={12} strokeLinecap="round" />
          </Foglio>
        </Compare>
        <Compare v={molla(locale, qrFattura, fps)} cx={780} cy={150}>
          <Pillola x={780} y={150} testo="QR-fattura" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* La vecchia polizza di versamento: arriva, viene barrata e se ne va. */}
        {uscita < 1 ? (
          <g transform={`translate(${uscita * 120} ${uscita * 40})`} opacity={1 - uscita}>
            <Compare v={molla(locale, polizza, fps)} cx={650} cy={500}>
              <rect x={400} y={360} width={500} height={280} rx={14} fill="#f6dcae" stroke={TINTE.accento} strokeWidth={5} />
              <Testo x={650} y={400} corpo={26} titolo peso={800} colore={TINTE.accento}>
                Polizza di versamento
              </Testo>
              {[0, 1, 2].map((k) => (
                <rect key={k} x={430} y={440 + k * 50} width={200} height={30} rx={6} fill={TINTE.carta} opacity={0.8} />
              ))}
              {[0, 1].map((k) => (
                <rect key={k} x={680} y={440 + k * 50} width={190} height={30} rx={6} fill={TINTE.carta} opacity={0.8} />
              ))}
              {tra(locale, noPolizza, noPolizza + 6) > 0 ? <No cx={870} cy={380} r={30} /> : null}
            </Compare>
          </g>
        ) : null}
        {/* La sezione pagamento, staccabile, con la ricevuta e il codice QR. */}
        <g opacity={tra(locale, sezione, sezione + 10)}>
          <line x1={f.x + 6} y1={f.taglio} x2={f.x + f.w - 6} y2={f.taglio} stroke={TINTE.tratto} strokeWidth={4} strokeDasharray="12 10" />
          <g transform={`translate(${f.x + 26} ${f.taglio})`}>
            <circle cx={-6} cy={-8} r={7} fill="none" stroke={TINTE.tratto} strokeWidth={4} />
            <circle cx={-6} cy={8} r={7} fill="none" stroke={TINTE.tratto} strokeWidth={4} />
            <path d="M 0 -4 L 22 10 M 0 4 L 22 -10" stroke={TINTE.tratto} strokeWidth={4} strokeLinecap="round" />
          </g>
          <line x1={f.ricevuta} y1={f.taglio + 8} x2={f.ricevuta} y2={f.y + f.h - 10} stroke={TINTE.tratto} strokeWidth={4} strokeDasharray="12 10" />
          <Testo x={745} y={378} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Sezione pagamento
          </Testo>
          <Righe x={762} y={448} w={130} n={5} passo={30} />
        </g>
        <Compare v={molla(locale, ricevuta, fps)} cx={470} cy={480}>
          <rect x={f.x + 10} y={f.taglio + 12} width={f.ricevuta - f.x - 20} height={f.y + f.h - f.taglio - 30} rx={12} fill={TINTE.crema} />
          <Testo x={470} y={378} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Ricevuta
          </Testo>
          <Righe x={404} y={430} w={120} n={5} passo={30} />
        </Compare>
        <Compare v={molla(locale, codice, fps)} cx={655} cy={510}>
          <QrCodice cx={655} cy={510} lato={150} croce={pulsa} />
        </Compare>
      </Tela>
    );
  },
};

/* 9. «Nel codice ci sono tutti i dati del pagamento. Il cliente lo scansiona con l'app della banca, oppure paga allo sportello postale. Gli indirizzi vanno scritti a campi separati: via e numero, NPA e località.» */
const CAMPI = [
  { x: 360, w: 250, testo: "Via e numero" },
  { x: 630, w: 120, testo: "NPA" },
  { x: 770, w: 190, testo: "Località" },
] as const;
const faPaga: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.72, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const codice = fra(ctx, null, 0, 0.2, 0.08);
    const dati = fra(ctx, null, 0, 0.7, 0.2);
    const telefono = fra(ctx, 0, 1, 0.15, 0.32);
    const scansione = fra(ctx, 0, 1, 0.45, 0.4);
    const pagato = fra(ctx, 0, 1, 0.9, 0.46);
    const oppure = fra(ctx, 1, 2, 0.1, 0.5);
    const sportello = fra(ctx, 1, 2, 0.3, 0.54);
    const indirizzo = fra(ctx, 2, null, 0.05, 0.64);
    const divisi = fra(ctx, 2, null, 0.55, 0.78);
    const separati = tra(locale, divisi, divisi + 16);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Come si paga" />
        <Compare v={molla(locale, codice, fps)} cx={440} cy={230}>
          <QrCodice cx={440} cy={225} lato={140} />
        </Compare>
        <Compare v={molla(locale, dati, fps)} cx={440} cy={340}>
          <Righe2 x={440} y={335} righe={["Tutti i dati", "del pagamento"]} corpo={24} passo={30} />
        </Compare>
        <Compare v={molla(locale, telefono, fps)} cx={640} cy={225}>
          <Telefono cx={640} cy={225} s={0.95} scansione={tra(locale, scansione, scansione + 30)} />
          <Spunta cx={690} cy={150} r={24} p={tra(locale, pagato, pagato + 12)} />
          <Righe2 x={640} y={335} righe={["App della", "banca"]} corpo={24} passo={30} />
        </Compare>
        <Compare v={molla(locale, oppure, fps)} cx={760} cy={225}>
          <Testo x={758} y={225} corpo={24} titolo peso={800} colore={COLORE_TENUE}>
            oppure
          </Testo>
        </Compare>
        <Compare v={molla(locale, sportello, fps)} cx={890} cy={220}>
          <Sportello x={890} y={300} s={0.82} />
          <Righe2 x={890} y={335} righe={["Sportello", "postale"]} corpo={24} passo={30} />
        </Compare>
        {/* L'indirizzo in un campo solo si divide in campi separati. */}
        <Compare v={molla(locale, indirizzo, fps)} cx={660} cy={520}>
          <Testo x={360} y={452} corpo={24} titolo peso={800} colore={COLORE_TENUE} ancora="start">
            Indirizzo
          </Testo>
          <g opacity={1 - separati}>
            <rect x={360} y={482} width={600} height={74} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
            <line x1={384} y1={519} x2={880} y2={519} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
          </g>
          <g opacity={separati}>
            {CAMPI.map((c) => (
              <g key={c.testo}>
                <rect x={c.x} y={482} width={c.w} height={74} rx={14} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} />
                <Testo x={c.x + c.w / 2} y={520} corpo={24} titolo peso={800} colore={TINTE.tratto}>
                  {c.testo}
                </Testo>
              </g>
            ))}
          </g>
        </Compare>
        <Compare v={molla(locale, divisi + 14, fps)} cx={660} cy={612}>
          <Pillola x={660} y={612} testo="Campi separati" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Scrivi sempre entro quando va pagata. E tieni una copia di ogni fattura, su carta o in digitale: è un documento della tua contabilità, da conservare per … anni. Della contabilità parliamo nel prossimo passo.» */
const faCopie: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.3, 0.7),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.7, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 1, 2, 0.55, 0.72) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const riga = fra(ctx, null, 0, 0.35, 0.16);
    const calendario = fra(ctx, null, 0, 0.62, 0.26);
    const entro = fra(ctx, null, 0, 0.85, 0.34);
    const carta = fra(ctx, 0, 1, 0.25, 0.44);
    const digitale = fra(ctx, 0, 1, 0.72, 0.54);
    const archivio = fra(ctx, 1, 2, 0.25, 0.66);
    const dentro = fra(ctx, 1, 2, 0.45, 0.72);
    const tempo = fra(ctx, 1, 2, 0.82, 0.8);
    const prossimo = fra(ctx, 2, null, 0.3, 0.9);
    const cade = tra(locale, dentro, dentro + 16);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Scadenza e copie" />
        <Compare v={molla(locale, 6, fps, true)} cx={460} cy={215}>
          <Foglio x={360} y={100} w={200} h={230}>
            <Righe x={382} y={150} w={120} n={3} passo={28} />
            <rect x={378} y={262} width={150} height={36} rx={10} fill={TINTE.accento} opacity={tra(locale, riga, riga + 8)} />
          </Foglio>
        </Compare>
        <Freccia d="M 540 280 Q 590 270 630 240" p={tra(locale, calendario - 8, calendario + 4)} spessore={6} />
        <Compare v={molla(locale, calendario, fps)} cx={720} cy={200}>
          <Calendario cx={720} cy={196} s={0.95} />
        </Compare>
        <Compare v={molla(locale, entro, fps)} cx={735} cy={312}>
          <Pillola x={735} y={312} testo="Da pagare entro il" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {/* La copia: su carta o in digitale. */}
        <Compare v={molla(locale, carta, fps)} cx={415} cy={520}>
          <rect x={372} y={438} width={110} height={136} rx={14} fill={TINTE.tinta} />
          <Foglio x={360} y={426} w={110} h={136}>
            <Righe x={376} y={474} w={60} n={3} passo={22} />
          </Foglio>
          <Testo x={418} y={598} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Su carta
          </Testo>
        </Compare>
        <Compare v={molla(locale, digitale, fps)} cx={590} cy={520}>
          <Computer cx={592} cy={506} s={0.62} />
          <Testo x={592} y={598} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            In digitale
          </Testo>
        </Compare>
        <Compare v={molla(locale, archivio, fps)} cx={830} cy={520}>
          <Archivio cx={830} cy={528} etichetta="Contabilità" />
        </Compare>
        {cade > 0 && cade < 1 ? (
          <g transform={`translate(${830 - 50} ${400 + cade * 90})`} opacity={1 - cade * 0.6}>
            <Foglio x={0} y={0} w={64} h={80} />
          </g>
        ) : null}
        <Compare v={molla(locale, tempo, fps)} cx={962} cy={398}>
          <Clessidra cx={962} cy={398} s={0.62} />
        </Compare>
        <Compare v={molla(locale, prossimo, fps)} cx={700} cy={652}>
          <Pillola x={700} y={652} testo="Prossimo passo: la contabilità" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 11. «Bleo ha uno strumento, «Preventivo e fattura». Prepari il preventivo e, quando il cliente accetta, lo trasformi in fattura con un clic. L'IVA compare solo se sei iscritto, e la sezione pagamento con il codice QR si crea da sola.» */
const faStrumento: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.5, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.48) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.6, 0.88) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const computer = fra(ctx, null, 0, 0.3, 0.08);
    const viaComputer = fra(ctx, 0, 1, 0.05, 0.22);
    const preventivo = fra(ctx, 0, 1, 0.15, 0.25);
    const accetta = fra(ctx, 0, 1, 0.8, 0.38);
    const clic = fra(ctx, 1, 2, 0.25, 0.46);
    const fattura = fra(ctx, 1, 2, 0.55, 0.52);
    const iva = fra(ctx, 2, 3, 0.3, 0.66);
    const qr = fra(ctx, 3, null, 0.4, 0.8);
    const pronta = fra(ctx, 3, null, 0.72, 0.9);
    const esce = tra(locale, viaComputer, viaComputer + 12);
    const premuto = 1 - 0.12 * Math.sin(Math.PI * tra(locale, clic + 8, clic + 16));
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Preventivo e fattura" />
        {esce < 1 ? (
          <g opacity={1 - esce}>
            <Compare v={molla(locale, computer, fps)} cx={640} cy={260}>
              <Computer cx={640} cy={250} s={1.35} />
              <Testo x={640} y={360} corpo={26} titolo peso={800} colore={TINTE.tratto}>
                Uno strumento di Bleo
              </Testo>
            </Compare>
          </g>
        ) : null}
        <Compare v={molla(locale, preventivo, fps)} cx={440} cy={225}>
          <Foglio x={350} y={110} w={180} h={230}>
            <Testo x={422} y={152} corpo={20} titolo peso={800} colore={TINTE.tratto}>
              Preventivo
            </Testo>
            <Righe x={370} y={196} w={120} n={4} passo={28} />
          </Foglio>
        </Compare>
        <Compare v={molla(locale, accetta, fps)} cx={440} cy={370}>
          <Spunta cx={520} cy={330} r={26} p={tra(locale, accetta, accetta + 12)} />
          <Testo x={440} y={384} corpo={22} titolo peso={800} colore={TINTE.ok}>
            Il cliente accetta
          </Testo>
        </Compare>
        <Freccia d="M 548 230 H 696" p={tra(locale, clic, clic + 12)} />
        <Compare v={molla(locale, clic, fps)} cx={622} cy={180}>
          <Pillola x={612} y={180} testo="Un clic" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
          <g transform={`translate(650 250) scale(${premuto}) translate(-650 -250)`}>
            <Cursore x={640} y={246} s={0.9} />
          </g>
        </Compare>
        <Compare v={molla(locale, fattura, fps)} cx={825} cy={280}>
          <Foglio x={715} y={100} w={220} h={360}>
            <Testo x={808} y={142} corpo={22} titolo peso={800} colore={TINTE.tratto}>
              Fattura
            </Testo>
            <Righe x={735} y={186} w={150} n={3} passo={28} />
          </Foglio>
        </Compare>
        <Compare v={molla(locale, qr, fps)} cx={825} cy={392}>
          <line x1={721} y1={334} x2={929} y2={334} stroke={TINTE.tratto} strokeWidth={3} strokeDasharray="10 8" />
          <QrCodice cx={786} cy={396} lato={84} />
          <Righe x={846} y={370} w={64} n={3} passo={24} />
        </Compare>
        <Compare v={molla(locale, iva, fps)} cx={640} cy={540}>
          <Pillola x={640} y={540} testo="IVA solo se sei iscritto" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, pronta, fps)} cx={640} cy={614}>
          <Pillola x={640} y={614} testo="Sezione pagamento pronta" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_FATTURE: Record<string, Disegno> = {
  "fa-base": faBase,
  "fa-nome": faNome,
  "fa-senza-iva": faSenzaIva,
  "fa-iva-dovuta": faIvaDovuta,
  "fa-elementi": faElementi,
  "fa-numero-iva": faNumeroIva,
  "fa-qr": faQr,
  "fa-paga": faPaga,
  "fa-copie": faCopie,
  "fa-strumento": faStrumento,
};
