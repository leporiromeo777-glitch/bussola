/**
 * I disegni del video facoltativo della lezione 17 («Se il cliente non
 * paga»), vedi src/lezioni/fatture-mancato-pagamento.ts: la scadenza, il
 * sollecito, la mora con gli interessi, la domanda d'esecuzione, le spese, il
 * precetto con l'opposizione e il rigetto. Fonti: ch.ch, CO artt. 102 e 104,
 * LEF, OTLEF art. 16, pagine ticinesi della Sezione di esecuzione e
 * fallimento. Coordinate della tela 1000×700; l'angolo in basso a sinistra
 * (x < 300, y > 480) è della finestra di Bleo. Niente cifre: importi, giorni
 * e tassi li dicono la voce e i sottotitoli.
 */
import { Casa, Compare, Foglio, Freccia, Fumetto, molla, Moneta, Palazzo, Persona, Pillola, Righe, Spunta, TEAL_CHIARO, Testo, TINTE, tra } from "../figure";
import { Tela } from "./ditta-individuale";
import { Bandiera, Calendario, Clessidra, Computer, No } from "./fatture";
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

/** Una busta chiusa (centro in cx, cy, larga w): il sollecito, la domanda spedita. */
function Busta({ cx, cy, w = 90, colore = TINTE.tratto }: { cx: number; cy: number; w?: number; colore?: string }) {
  const h = w * 0.66;
  const x = cx - w / 2;
  const y = cy - h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={w * 0.09} fill={TINTE.carta} stroke={colore} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M ${x + 4} ${y + 5} L ${cx} ${cy + h * 0.08} L ${x + w - 4} ${y + 5}`} fill="none" stroke={colore} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** L'Ufficio d'esecuzione: un palazzo con la bandiera svizzera sul tetto (piedi in x, y). */
function Ufficio({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g>
      <line x1={x} y1={y - 196 * s} x2={x} y2={y - 262 * s} stroke={TINTE.tratto} strokeWidth={6 * s} strokeLinecap="round" />
      <Bandiera cx={x + 22 * s} cy={y - 244 * s} lato={38 * s} />
      <Palazzo x={x} y={y} s={s} />
    </g>
  );
}

/** Il tribunale: frontone, colonne e gradini (piedi in x, y). */
function Tribunale({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-110} y={-26} width={220} height={26} rx={8} fill={TINTE.tratto} />
      <rect x={-96} y={-44} width={192} height={20} rx={6} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} />
      {[-66, -22, 22, 66].map((cx) => (
        <rect key={cx} x={cx - 12} y={-150} width={24} height={106} rx={6} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      ))}
      <rect x={-104} y={-168} width={208} height={20} rx={6} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} />
      <path d="M -112 -168 L 0 -226 L 112 -168 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={0} cy={-188} r={12} fill={TINTE.accento} />
    </g>
  );
}

/**
 * Il martelletto del giudice sul suo blocchetto (centro della testa in cx, cy):
 * la testa è perpendicolare al manico; `colpo` da 0 a 1 lo alza e lo riabbassa.
 */
function Martelletto({ cx, cy, s = 1, colpo = 0 }: { cx: number; cy: number; s?: number; colpo?: number }) {
  const angolo = -22 * Math.sin(Math.PI * colpo);
  const legno = "#a0612a";
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-46} y={40} width={92} height={16} rx={8} fill={legno} />
      <g transform={`rotate(${angolo} 52 52)`}>
        <line x1={0} y1={0} x2={56} y2={56} stroke={legno} strokeWidth={12} strokeLinecap="round" />
        <g transform="rotate(-45)">
          <rect x={-38} y={-16} width={76} height={32} rx={10} fill={TINTE.accento} />
          <rect x={-28} y={-18} width={8} height={36} rx={3} fill={legno} />
          <rect x={20} y={-18} width={8} height={36} rx={3} fill={legno} />
        </g>
      </g>
    </g>
  );
}

/** Un sigillo rotondo: il documento ufficiale. */
function Sigillo({ cx, cy, r = 16 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.accento} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={TINTE.carta} strokeWidth={r * 0.14} />
    </g>
  );
}

/** Un piccolo documento con l'angolo piegato (centro in cx, cy): la fattura, il precetto. */
function Fatturina({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M -26 -34 H 12 L 26 -20 V 34 H -26 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 12 -34 V -20 H 26" fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={4} strokeLinejoin="round" />
      <line x1={-15} y1={-10} x2={10} y2={-10} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
      <line x1={-15} y1={4} x2={10} y2={4} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
      <line x1={-15} y1={18} x2={0} y2={18} stroke={TINTE.accento} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

/** Il cartello di stop: «l'esecuzione si ferma». */
function Stop({ cx, cy, r = 46 }: { cx: number; cy: number; r?: number }) {
  const punti = (raggio: number) =>
    Array.from({ length: 8 }, (_, k) => {
      const a = Math.PI / 8 + (k * Math.PI) / 4;
      return `${cx + Math.cos(a) * raggio},${cy + Math.sin(a) * raggio}`;
    }).join(" ");
  return (
    <g>
      <polygon points={punti(r)} fill={TINTE.carta} />
      <polygon points={punti(r * 0.9)} fill={TINTE.rischio} />
      <Testo x={cx} y={cy + 2} corpo={r * 0.5} titolo peso={800} colore={TINTE.carta}>
        STOP
      </Testo>
    </g>
  );
}

/** Una stampante con il foglio che esce. */
function Stampante({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-30} y={-52} width={60} height={30} rx={4} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} />
      <rect x={-52} y={-26} width={104} height={50} rx={12} fill={TINTE.tratto} />
      <circle cx={34} cy={-8} r={5} fill={TINTE.oro} />
      <path d="M -32 14 H 32 V 52 Q 32 56 28 56 H -28 Q -32 56 -32 52 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} />
      <line x1={-20} y1={30} x2={20} y2={30} stroke={TINTE.tinta} strokeWidth={6} strokeLinecap="round" />
      <line x1={-20} y1={43} x2={8} y2={43} stroke={TINTE.tinta} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
}

/** Un foglio con la firma che si disegna (`firma` da 0 a 1). */
function FoglioFirmato({ cx, cy, s = 1, firma }: { cx: number; cy: number; s?: number; firma: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <Foglio x={-46} y={-60} w={92} h={120}>
        <Righe x={-30} y={-28} w={52} n={2} passo={20} />
      </Foglio>
      {firma > 0 ? (
        <path
          d="M -30 34 q 8 -18 14 -2 q 6 14 12 -4 q 6 -16 12 2 q 4 10 14 -2"
          fill="none"
          stroke={TINTE.accento}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - firma}
        />
      ) : null}
    </g>
  );
}

/** Una pila di monete, che cresce con `n` (da 0 a `massimo`). */
function Pila({ cx, base, n, r = 28 }: { cx: number; base: number; n: number; r?: number }) {
  return (
    <g>
      {Array.from({ length: Math.floor(n) }, (_, k) => (
        <ellipse key={k} cx={cx} cy={base - k * 14} rx={r} ry={r * 0.42} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={4} />
      ))}
    </g>
  );
}

/** Un tondo con il segno di percentuale (senza cifre). */
function Percento({ cx, cy, r = 40 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.accento} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.17} fill="none" stroke={TINTE.carta} strokeWidth={r * 0.1} />
      <circle cx={cx + r * 0.3} cy={cy + r * 0.3} r={r * 0.17} fill="none" stroke={TINTE.carta} strokeWidth={r * 0.1} />
      <line x1={cx + r * 0.38} y1={cy - r * 0.44} x2={cx - r * 0.38} y2={cy + r * 0.44} stroke={TINTE.carta} strokeWidth={r * 0.12} strokeLinecap="round" />
    </g>
  );
}

/** Un oggetto che vola da (x0, y0) a (x1, y1) con un arco alto `arco` (p da 0 a 1). */
function inVolo(p: number, x0: number, y0: number, x1: number, y1: number, arco: number): { x: number; y: number } {
  return { x: x0 + (x1 - x0) * p, y: y0 + (y1 - y0) * p - Math.sin(Math.PI * p) * arco };
}

/* 2. «Tutto comincia dalla fattura: scrivi sempre entro quando va pagata. Lo strumento di Bleo «Preventivo e fattura» ha già la riga «Da pagare entro il». E se la registri in «I tuoi conti», vedi quali fatture sono scadute.» */
const CONTI = { x: 640, y: 392, w: 320, h: 250 } as const;
const RIGHE_CONTI = [
  { testo: "Aperta", fondo: TINTE.tinta, colore: TINTE.tratto },
  { testo: "Pagata", fondo: TINTE.ok, colore: TINTE.carta },
  { testo: "Scaduta", fondo: TINTE.rischio, colore: TINTE.carta },
] as const;
const fnpScadenza: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.75, 0.25) },
      { tipo: "festeggia", quando: fra(ctx, 0, 1, 0.75, 0.6) },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.85, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const riga = fra(ctx, null, 0, 0.4, 0.12);
    const calendario = fra(ctx, null, 0, 0.62, 0.2);
    const entro = fra(ctx, null, 0, 0.82, 0.26);
    const computer = fra(ctx, 0, 1, 0.12, 0.35);
    const strumento = fra(ctx, 0, 1, 0.35, 0.45);
    const giaRiga = fra(ctx, 0, 1, 0.72, 0.55);
    const conti = fra(ctx, 1, null, 0.12, 0.72);
    const righe = [fra(ctx, 1, null, 0.3, 0.78), fra(ctx, 1, null, 0.45, 0.82), fra(ctx, 1, null, 0.68, 0.88)];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La scadenza in fattura" />
        <Compare v={molla(locale, 6, fps, true)} cx={450} cy={215}>
          <Foglio x={350} y={100} w={200} h={232}>
            <Testo x={372} y={140} corpo={22} titolo peso={800} colore={TINTE.tratto} ancora="start">
              Fattura
            </Testo>
            <Righe x={372} y={182} w={120} n={3} passo={26} />
            <rect x={368} y={268} width={150} height={36} rx={10} fill={TINTE.accento} opacity={tra(locale, riga, riga + 8)} />
          </Foglio>
        </Compare>
        <Freccia d="M 530 286 Q 590 280 630 246" p={tra(locale, calendario - 8, calendario + 4)} spessore={6} />
        <Compare v={molla(locale, calendario, fps)} cx={730} cy={196}>
          <Calendario cx={730} cy={190} s={0.95} />
        </Compare>
        <Compare v={molla(locale, entro, fps)} cx={740} cy={300}>
          <Pillola x={740} y={300} testo="Da pagare entro il" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {/* Lo strumento «Preventivo e fattura»: la riga c'è già. */}
        <Compare v={molla(locale, computer, fps)} cx={470} cy={500}>
          <Computer cx={470} cy={500} s={0.95} />
          <rect x={414} y={506} width={110} height={18} rx={9} fill={TINTE.accento} opacity={tra(locale, giaRiga, giaRiga + 8)} />
        </Compare>
        <Spunta cx={560} cy={448} r={24} p={tra(locale, giaRiga + 4, giaRiga + 18)} />
        <Compare v={molla(locale, strumento, fps)} cx={470} cy={620}>
          <Pillola x={470} y={620} testo="Preventivo e fattura" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* «I tuoi conti»: le fatture registrate, e quella scaduta. */}
        <Compare v={molla(locale, conti, fps, true)} cx={CONTI.x + CONTI.w / 2} cy={CONTI.y + CONTI.h / 2}>
          <rect x={CONTI.x} y={CONTI.y} width={CONTI.w} height={CONTI.h} rx={22} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <path d={`M ${CONTI.x} ${CONTI.y + 22} q 0 -22 22 -22 H ${CONTI.x + CONTI.w - 22} q 22 0 22 22 V ${CONTI.y + 52} H ${CONTI.x} Z`} fill={TINTE.tratto} />
          <Testo x={CONTI.x + CONTI.w / 2} y={CONTI.y + 28} corpo={24} titolo peso={800} colore={TINTE.carta}>
            I tuoi conti
          </Testo>
        </Compare>
        {RIGHE_CONTI.map((r, i) => {
          const y = CONTI.y + 92 + i * 56;
          const scaduta = i === RIGHE_CONTI.length - 1;
          return (
            <Compare key={r.testo} v={molla(locale, righe[i], fps)} cx={CONTI.x + CONTI.w / 2} cy={y}>
              {scaduta ? <rect x={CONTI.x + 10} y={y - 24} width={CONTI.w - 20} height={48} rx={14} fill={TINTE.rischioTenue} /> : null}
              <line x1={CONTI.x + 28} y1={y} x2={CONTI.x + 140} y2={y} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
              <Pillola x={CONTI.x + 238} y={y} testo={r.testo} corpo={20} fondo={r.fondo} colore={r.colore} />
            </Compare>
          );
        })}
      </Tela>
    );
  },
};

/* 3. «Il giorno è passato e i soldi non arrivano? Di solito si manda prima un sollecito: un promemoria per ricordare al cliente di pagare. Non è obbligatorio, ma è l'uso.» */
const TU = { x: 400, y: 450 } as const;
const CLIENTE = { x: 860, y: 450 } as const;
const fnpSollecito: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.55),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.6, 0.2) },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.35) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.7, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const calendario = fra(ctx, null, 0, 0.15, 0.06);
    const passato = fra(ctx, null, 0, 0.45, 0.14);
    const domanda = fra(ctx, null, 0, 0.75, 0.2);
    const busta = fra(ctx, 0, 1, 0.25, 0.3);
    const etichetta = fra(ctx, 0, 1, 0.6, 0.38);
    const volo = tra(locale, fra(ctx, 1, 2, 0.05, 0.5), fra(ctx, 1, 2, 0.55, 0.62));
    const ricorda = fra(ctx, 1, 2, 0.7, 0.68);
    const facoltativo = fra(ctx, 2, null, 0.15, 0.82);
    const uso = fra(ctx, 2, null, 0.6, 0.92);
    const b = inVolo(volo, 500, 310, 770, 310, 30);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il sollecito" />
        <Compare v={molla(locale, 6, fps, true)} cx={TU.x} cy={TU.y - 80}>
          <Persona x={TU.x} y={TU.y} s={0.9} colore={TINTE.accento} />
          <Testo x={TU.x} y={TU.y + 32} corpo={26} titolo peso={800} colore={TINTE.accento}>
            Tu
          </Testo>
        </Compare>
        <Compare v={molla(locale, 10, fps, true)} cx={CLIENTE.x} cy={CLIENTE.y - 80}>
          <Persona x={CLIENTE.x} y={CLIENTE.y} s={0.9} colore={TEAL_CHIARO} />
          <Testo x={CLIENTE.x} y={CLIENTE.y + 32} corpo={26} titolo peso={800} colore={TEAL_CHIARO}>
            Il cliente
          </Testo>
        </Compare>
        {/* Il giorno di pagamento è passato. */}
        <Compare v={molla(locale, calendario, fps)} cx={630} cy={160}>
          <Calendario cx={630} cy={160} s={0.8} />
          <No cx={676} cy={122} r={24 * tra(locale, passato, passato + 8) + 0.01} />
        </Compare>
        <Compare v={molla(locale, domanda, fps)} cx={470} cy={200}>
          <Fumetto cx={470} cy={200} r={34}>
            <Testo x={470} y={202} corpo={40} titolo peso={800} colore={TINTE.tratto}>
              ?
            </Testo>
          </Fumetto>
        </Compare>
        {/* Il sollecito vola dal tu al cliente. */}
        <Compare v={molla(locale, busta, fps)} cx={b.x} cy={b.y}>
          <Busta cx={b.x} cy={b.y} w={86} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, etichetta, fps)} cx={635} cy={400}>
          <Pillola x={635} y={400} testo="Sollecito" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, ricorda, fps)} cx={910} cy={200}>
          <Fumetto cx={905} cy={200} r={36}>
            <Moneta cx={905} cy={200} r={20} />
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, facoltativo, fps)} cx={520} cy={600}>
          <Pillola x={520} y={600} testo="Non è obbligatorio" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, uso, fps)} cx={820} cy={600}>
          <Pillola x={820} y={600} testo="Ma è l'uso" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Per la legge, se il cliente deve già pagare, è «in mora» da quando gli chiedi di pagare, per esempio con il sollecito. Se il giorno per pagare l'avevate stabilito insieme, è in mora appena quel giorno passa. E chi è in mora con un pagamento deve anche gli interessi: il … all'anno.» */
const LINEA = { x0: 330, x1: 960, mora: 640 } as const;
function Mora({ y, p, v }: { y: number; p: number; v: number }) {
  return (
    <g>
      {p > 0 ? <rect x={LINEA.mora} y={y - 24} width={(LINEA.x1 - LINEA.mora) * p} height={48} rx={14} fill={TINTE.rischioTenue} /> : null}
      <Compare v={v} cx={810} cy={y}>
        <Pillola x={810} y={y} testo="In mora" corpo={24} fondo={TINTE.rischio} colore={TINTE.carta} />
      </Compare>
    </g>
  );
}
const fnpMora: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.75, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.2) },
      { tipo: "scuoti", quando: fra(ctx, 2, 3, 0.75, 0.6) },
      { tipo: "festeggia", quando: fra(ctx, 4, null, 0.6, 0.95) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    // Prima riga: il debito da pagare, poi il sollecito, e da lì la mora.
    const linea1 = fra(ctx, null, 0, 0.2, 0.05);
    const fattura = fra(ctx, null, 0, 0.55, 0.1);
    const sollecito = fra(ctx, 0, 1, 0.45, 0.25);
    const mora1 = fra(ctx, 0, 1, 0.62, 0.3);
    // Seconda riga: il giorno stabilito insieme, e la mora appena passa.
    const linea2 = fra(ctx, 1, 2, 0.1, 0.42);
    const giorno = fra(ctx, 1, 2, 0.4, 0.46);
    const insieme = fra(ctx, 1, 2, 0.7, 0.5);
    const mora2 = fra(ctx, 2, 3, 0.35, 0.6);
    // Gli interessi.
    const interessi = fra(ctx, 3, 4, 0.2, 0.72);
    const pila = fra(ctx, 3, 4, 0.35, 0.76);
    const percento = fra(ctx, 4, null, 0.15, 0.9);
    const anno = fra(ctx, 4, null, 0.55, 0.95);
    const monete = 1 + 4 * tra(locale, pila, pila + 50) + (locale >= percento ? 1 : 0);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="In mora" />
        {/* Prima riga. */}
        <Freccia d={`M ${LINEA.x0} 250 H ${LINEA.x1}`} p={tra(locale, linea1, linea1 + 18)} colore={TINTE.tratto} spessore={6} />
        <Mora y={250} p={tra(locale, mora1, mora1 + 20)} v={molla(locale, mora1 + 10, fps)} />
        <Compare v={molla(locale, fattura, fps)} cx={400} cy={250}>
          <Fatturina cx={400} cy={250} />
          <Testo x={400} y={312} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Da pagare
          </Testo>
        </Compare>
        <Compare v={molla(locale, sollecito, fps)} cx={570} cy={250}>
          <Busta cx={570} cy={250} w={78} colore={TINTE.accento} />
          <Testo x={570} y={196} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Sollecito
          </Testo>
        </Compare>
        {/* Seconda riga. */}
        <Freccia d={`M ${LINEA.x0} 440 H ${LINEA.x1}`} p={tra(locale, linea2, linea2 + 18)} colore={TINTE.tratto} spessore={6} />
        <Mora y={440} p={tra(locale, mora2, mora2 + 20)} v={molla(locale, mora2 + 10, fps)} />
        <Compare v={molla(locale, giorno, fps)} cx={570} cy={440}>
          <Calendario cx={570} cy={440} s={0.55} />
        </Compare>
        <Compare v={molla(locale, insieme, fps)} cx={540} cy={380}>
          <Pillola x={540} y={378} testo="Stabilito insieme" corpo={20} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* Gli interessi di mora. */}
        <Compare v={molla(locale, percento, fps)} cx={400} cy={600}>
          <Percento cx={400} cy={600} r={40} />
        </Compare>
        {locale >= pila ? <Pila cx={500} base={636} n={monete} /> : null}
        <Compare v={molla(locale, interessi, fps)} cx={730} cy={590}>
          <Pillola x={730} y={590} testo="Interessi di mora" corpo={26} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, anno, fps)} cx={730} cy={656}>
          <Pillola x={730} y={656} testo="Ogni anno" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Se il cliente continua a non pagare, puoi chiedere un'esecuzione. La domanda va all'Ufficio d'esecuzione dove abita il cliente, o dove ha sede la sua società. In Ticino la puoi compilare online su EasyGov: poi la stampi, la firmi e la spedisci.» */
const LUOGO = { x: 590, y: 96, w: 380, h: 346 } as const;
const PASSI_POSTA = [
  { x: 640, testo: "Stampa" },
  { x: 780, testo: "Firma" },
  { x: 920, testo: "Spedisci" },
] as const;
const fnpDomanda: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.95, 0.95) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tu = 6;
    const domanda = fra(ctx, null, 0, 0.55, 0.15);
    const luogo = fra(ctx, 0, 1, 0.05, 0.25);
    const casa = fra(ctx, 0, 1, 0.3, 0.3);
    const ufficio = fra(ctx, 0, 1, 0.55, 0.36);
    const volo = tra(locale, fra(ctx, 0, 1, 0.65, 0.4), fra(ctx, 0, 1, 0.95, 0.46));
    const societa = fra(ctx, 1, 2, 0.35, 0.55);
    const online = fra(ctx, 2, 3, 0.15, 0.65);
    const easygov = fra(ctx, 2, 3, 0.5, 0.7);
    const passi = [fra(ctx, 3, null, 0.15, 0.8), fra(ctx, 3, null, 0.45, 0.87), fra(ctx, 3, null, 0.72, 0.93)];
    const fineVolo = fra(ctx, 0, 1, 0.95, 0.46);
    const arrivata = tra(locale, fineVolo + 2, fineVolo + 12);
    const f = inVolo(volo, 470, 200, 880, 270, 60);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La domanda d'esecuzione" />
        <Compare v={molla(locale, tu, fps, true)} cx={380} cy={300}>
          <Persona x={380} y={390} s={0.85} colore={TINTE.accento} />
          <Testo x={380} y={420} corpo={26} titolo peso={800} colore={TINTE.accento}>
            Tu
          </Testo>
        </Compare>
        {/* Il luogo dove abita il cliente: la sua casa e l'Ufficio d'esecuzione. */}
        <Compare v={molla(locale, luogo, fps, true)} cx={LUOGO.x + LUOGO.w / 2} cy={LUOGO.y + LUOGO.h / 2}>
          <rect x={LUOGO.x} y={LUOGO.y} width={LUOGO.w} height={LUOGO.h} rx={28} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={4} strokeDasharray="14 10" />
          <Testo x={LUOGO.x + LUOGO.w / 2} y={LUOGO.y + 30} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Dove abita il cliente
          </Testo>
        </Compare>
        <Compare v={molla(locale, casa, fps)} cx={650} cy={320}>
          <Casa x={650} y={370} s={0.85} />
        </Compare>
        <Compare v={molla(locale, societa, fps)} cx={752} cy={320}>
          <Palazzo x={752} y={370} s={0.42} nome="Sagl" colore={TEAL_CHIARO} />
        </Compare>
        <Compare v={molla(locale, ufficio, fps)} cx={880} cy={300}>
          <Ufficio x={880} y={370} s={0.72} />
          <Righe2 x={880} y={394} righe={["Ufficio", "d'esecuzione"]} corpo={20} passo={22} />
        </Compare>
        {/* La domanda vola dal tu all'ufficio. */}
        <Compare v={molla(locale, domanda, fps) * (1 - arrivata)} cx={f.x} cy={f.y}>
          <g transform={`translate(${f.x} ${f.y}) scale(${1 - 0.45 * volo})`}>
            <Foglio x={-50} y={-62} w={100} h={124}>
              <Testo x={-2} y={-34} corpo={17} titolo peso={800} colore={TINTE.tratto}>
                Domanda
              </Testo>
              <Righe x={-34} y={-6} w={56} n={3} passo={20} />
            </Foglio>
          </g>
        </Compare>
        <Spunta cx={826} cy={214} r={18} p={tra(locale, fineVolo + 6, fineVolo + 20)} />
        {/* In Ticino: online su EasyGov, poi stampata, firmata e spedita. */}
        <Compare v={molla(locale, online, fps)} cx={440} cy={540}>
          <Computer cx={440} cy={540} s={0.9} />
          <rect x={374} y={494} width={132} height={74} rx={8} fill={TINTE.carta} />
          <Testo x={440} y={530} corpo={22} titolo peso={800} colore={TINTE.rischio}>
            EasyGov
          </Testo>
        </Compare>
        <Compare v={molla(locale, easygov, fps)} cx={440} cy={640}>
          <Pillola x={440} y={640} testo="In Ticino, online" corpo={22} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {PASSI_POSTA.map((p, i) => (
          <g key={p.testo}>
            {i > 0 ? <Freccia d={`M ${PASSI_POSTA[i - 1].x + 50} 530 H ${p.x - 50}`} p={tra(locale, passi[i] - 6, passi[i] + 4)} spessore={6} /> : null}
            <Compare v={molla(locale, passi[i], fps)} cx={p.x} cy={540}>
              {i === 0 ? <Stampante cx={p.x} cy={530} s={0.8} /> : null}
              {i === 1 ? <FoglioFirmato cx={p.x} cy={530} s={0.72} firma={tra(locale, passi[1] + 4, passi[1] + 22)} /> : null}
              {i === 2 ? <Busta cx={p.x} cy={530} w={84} /> : null}
              <Testo x={p.x} y={606} corpo={22} titolo peso={800} colore={TINTE.tratto}>
                {p.testo}
              </Testo>
            </Compare>
          </g>
        ))}
      </Tela>
    );
  },
};

/* 6. «Le spese le anticipi tu. La tassa del precetto esecutivo dipende dal credito: sopra … e fino a … è di …, più altre tasse e spese. Se l'esecuzione è giustificata, alla fine le paga il cliente.» */
const SCALA = { x: 400, base: 400, passo: 74, w: 52 } as const;
const ALTEZZE = [26, 44, 62, 80, 112, 150, 196] as const;
const QUALE = 3;
const fnpCosti: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.08) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.25, 0.45) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.8, 0.95) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const persone = 4;
    const anticipo = tra(locale, fra(ctx, null, 0, 0.25, 0.04), fra(ctx, null, 0, 0.95, 0.1));
    const assi = fra(ctx, 0, 1, 0.05, 0.15);
    const colonne = ALTEZZE.map((_, i) => fra(ctx, 0, 1, 0.15 + i * 0.11, 0.2 + i * 0.03));
    const scelta = fra(ctx, 1, 2, 0.2, 0.42);
    const precetto = fra(ctx, 1, 2, 0.35, 0.48);
    const altre = fra(ctx, 1, 2, 0.75, 0.6);
    const cliente = fra(ctx, 2, null, 0.1, 0.78);
    const ritorno = tra(locale, fra(ctx, 2, null, 0.4, 0.85), fra(ctx, 2, null, 0.75, 0.93));
    const pagaCliente = fra(ctx, 2, null, 0.7, 0.95);
    const a = inVolo(anticipo, 430, 580, 600, 590, 70);
    const r = inVolo(ritorno, 840, 580, 430, 580, 120);
    const xQuale = SCALA.x + QUALE * SCALA.passo;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Le spese" />
        {/* Sotto: tu anticipi, alla fine paga il cliente. */}
        <Compare v={molla(locale, persone, fps, true)} cx={380} cy={560}>
          <Persona x={380} y={660} s={0.78} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, persone + 4, fps, true)} cx={640} cy={560}>
          <Ufficio x={640} y={660} s={0.62} />
        </Compare>
        {anticipo > 0 && anticipo < 1 ? <Moneta cx={a.x} cy={a.y} r={22} /> : null}
        <Compare v={molla(locale, cliente, fps, true)} cx={880} cy={560}>
          <Persona x={880} y={660} s={0.78} colore={TEAL_CHIARO} />
        </Compare>
        {ritorno > 0 && ritorno < 1 ? <Moneta cx={r.x} cy={r.y} r={22} /> : null}
        <Spunta cx={440} cy={536} r={22} p={tra(locale, pagaCliente, pagaCliente + 14)} />
        {/* Sopra: la tassa del precetto cresce con il credito. */}
        <Compare v={molla(locale, assi, fps)} cx={640} cy={300}>
          <Freccia d={`M ${SCALA.x - 50} ${SCALA.base} H ${SCALA.x + ALTEZZE.length * SCALA.passo - 10}`} p={1} colore={TINTE.tratto} spessore={6} />
          <Testo x={SCALA.x + ALTEZZE.length * SCALA.passo - 20} y={SCALA.base + 24} corpo={22} titolo peso={800} colore={TINTE.tratto} ancora="end">
            Credito
          </Testo>
          <Testo x={SCALA.x - 50} y={SCALA.base - 220} corpo={22} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Tassa del precetto
          </Testo>
        </Compare>
        {ALTEZZE.map((h, i) => {
          const x = SCALA.x + i * SCALA.passo;
          const v = tra(locale, colonne[i], colonne[i] + 10);
          const evidenziata = i === QUALE && locale >= scelta;
          return v > 0 ? (
            <rect key={h} x={x - SCALA.w / 2} y={SCALA.base - h * v} width={SCALA.w} height={h * v} rx={8} fill={evidenziata ? TINTE.accento : TINTE.tinta} stroke={evidenziata ? TINTE.accento : TINTE.tratto} strokeWidth={4} />
          ) : null;
        })}
        <Compare v={molla(locale, precetto, fps)} cx={xQuale} cy={SCALA.base - ALTEZZE[QUALE] - 52}>
          <Fatturina cx={xQuale} cy={SCALA.base - ALTEZZE[QUALE] - 52} s={0.95} />
        </Compare>
        <Compare v={molla(locale, altre, fps)} cx={455} cy={280}>
          <Pillola x={455} y={280} testo="+ altre tasse e spese" corpo={20} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, persone + 8, fps)} cx={460} cy={460}>
          <Pillola x={460} y={460} testo="Anticipi tu" corpo={22} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, pagaCliente, fps)} cx={790} cy={460}>
          <Pillola x={790} y={460} testo="Alla fine paga il cliente" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Poi l'ufficio manda al cliente il precetto esecutivo: l'ordine di pagare entro … giorni. Se non è d'accordo, il cliente può fare opposizione entro … giorni, anche senza dire perché: allora l'esecuzione si ferma.» */
const fnpPrecetto: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.35, 0.1) },
      { tipo: "scuoti", quando: fra(ctx, 2, 3, 0.55, 0.62) },
      { tipo: "scuoti", quando: fra(ctx, 3, null, 0.8, 0.92) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const ufficio = 4;
    const cliente = 10;
    const volo = tra(locale, fra(ctx, null, 0, 0.3, 0.06), fra(ctx, null, 0, 0.85, 0.18));
    const etichetta = fra(ctx, null, 0, 0.6, 0.14);
    const paga = fra(ctx, 0, 1, 0.3, 0.28);
    const tempo = fra(ctx, 0, 1, 0.6, 0.34);
    const no = fra(ctx, 1, 2, 0.15, 0.45);
    const opposizione = fra(ctx, 1, 2, 0.5, 0.52);
    const tempoBreve = fra(ctx, 1, 2, 0.8, 0.6);
    const motivi = fra(ctx, 2, 3, 0.15, 0.72);
    const stop = fra(ctx, 2, 3, 0.6, 0.85);
    const f = inVolo(volo, 470, 240, 760, 250, 70);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il precetto esecutivo" />
        <Compare v={molla(locale, ufficio, fps, true)} cx={420} cy={250}>
          <Ufficio x={420} y={370} s={0.75} />
          <Righe2 x={420} y={396} righe={["Ufficio d'esecuzione"]} corpo={20} />
        </Compare>
        <Compare v={molla(locale, cliente, fps, true)} cx={860} cy={290}>
          <Persona x={860} y={380} s={0.9} colore={TEAL_CHIARO} />
          <Testo x={860} y={410} corpo={24} titolo peso={800} colore={TEAL_CHIARO}>
            Il cliente
          </Testo>
        </Compare>
        {/* Il precetto vola dall'ufficio al cliente. */}
        <line x1={510} y1={300} x2={760} y2={300} stroke={TINTE.tinta} strokeWidth={6} strokeDasharray="14 12" strokeLinecap="round" opacity={tra(locale, etichetta, etichetta + 10)} />
        {volo > 0 ? (
          <g transform={`translate(${f.x} ${f.y})`}>
            <Foglio x={-38} y={-48} w={76} h={96}>
              <Righe x={-24} y={-16} w={40} n={3} passo={18} />
            </Foglio>
          </g>
        ) : null}
        <Compare v={molla(locale, etichetta, fps)} cx={635} cy={150}>
          <Pillola x={635} y={150} testo="Precetto" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, stop, fps)} cx={635} cy={300}>
          <Stop cx={635} cy={300} r={48} />
        </Compare>
        {/* Due strade: pagare, o fare opposizione. */}
        <Freccia d="M 820 440 Q 700 470 610 510" p={tra(locale, paga - 10, paga + 4)} spessore={6} />
        <Compare v={molla(locale, paga, fps)} cx={520} cy={540}>
          <Pillola x={520} y={540} testo="Pagare" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, tempo, fps)} cx={400} cy={540}>
          <Clessidra cx={400} cy={540} s={0.6} />
        </Compare>
        <Freccia d="M 870 440 V 500" p={tra(locale, opposizione - 10, opposizione + 4)} spessore={6} />
        <Compare v={molla(locale, no, fps)} cx={935} cy={225}>
          <Fumetto cx={935} cy={225} r={32}>
            <No cx={935} cy={225} r={20} />
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, opposizione, fps)} cx={830} cy={540}>
          <Pillola x={830} y={540} testo="Opposizione" corpo={26} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, tempoBreve, fps)} cx={960} cy={600}>
          <Clessidra cx={960} cy={604} s={0.42} />
        </Compare>
        <Compare v={molla(locale, motivi, fps)} cx={830} cy={612}>
          <Pillola x={830} y={612} testo="Senza dire perché" corpo={20} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Per andare avanti chiedi al giudice il rigetto, cioè di togliere l'opposizione. Ti serve un documento: una sentenza, o un riconoscimento di debito firmato dal cliente. Se non ce l'hai, serve una causa in tribunale.» */
const fnpRigetto: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.3, 0.12) },
      { tipo: "festeggia", quando: fra(ctx, null, 0, 0.8, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.6, 0.68) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tu = 4;
    const tribunale = fra(ctx, null, 0, 0.18, 0.08);
    const freccia = fra(ctx, null, 0, 0.32, 0.12);
    const opposizione = fra(ctx, null, 0, 0.45, 0.16);
    const barra = fra(ctx, null, 0, 0.7, 0.24);
    const rigetto = fra(ctx, null, 0, 0.82, 0.28);
    const colpo = tra(locale, rigetto - 6, rigetto + 8);
    const documento = fra(ctx, 0, 1, 0.15, 0.4);
    const sentenza = fra(ctx, 0, 1, 0.55, 0.48);
    const riconoscimento = fra(ctx, 1, 2, 0.15, 0.6);
    const firma = fra(ctx, 1, 2, 0.6, 0.7);
    const causa = fra(ctx, 2, null, 0.25, 0.85);
    const lunga = fra(ctx, 2, null, 0.6, 0.92);
    const larghezzaOpp = "Opposizione".length * 24 * 0.56 + 24 * 1.3;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il rigetto dell'opposizione" />
        <Compare v={molla(locale, tu, fps, true)} cx={380} cy={300}>
          <Persona x={380} y={390} s={0.85} colore={TINTE.accento} />
          <Testo x={380} y={420} corpo={26} titolo peso={800} colore={TINTE.accento}>
            Tu
          </Testo>
        </Compare>
        <Compare v={molla(locale, tribunale, fps, true)} cx={830} cy={280}>
          <Tribunale x={830} y={370} s={0.85} />
          <Testo x={830} y={398} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Il giudice
          </Testo>
        </Compare>
        <Compare v={molla(locale, rigetto, fps)} cx={680} cy={330}>
          <Martelletto cx={672} cy={318} s={0.75} colpo={colpo} />
        </Compare>
        <Freccia d="M 450 300 H 620" p={tra(locale, freccia, freccia + 12)} spessore={7} />
        <Compare v={molla(locale, opposizione, fps)} cx={570} cy={180}>
          <Pillola x={570} y={180} testo="Opposizione" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
          {locale >= barra ? (
            <line x1={570 - larghezzaOpp / 2 + 6} y1={180} x2={570 - larghezzaOpp / 2 + 6 + (larghezzaOpp - 12) * tra(locale, barra, barra + 10)} y2={180} stroke={TINTE.rischio} strokeWidth={6} strokeLinecap="round" />
          ) : null}
        </Compare>
        <Compare v={molla(locale, rigetto, fps)} cx={570} cy={244}>
          <Pillola x={570} y={244} testo="Rigetto" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* I documenti che servono. */}
        <Compare v={molla(locale, documento, fps)} cx={640} cy={470}>
          <Testo x={640} y={470} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Ti serve un documento
          </Testo>
        </Compare>
        <Compare v={molla(locale, sentenza, fps)} cx={440} cy={570}>
          <g transform="translate(440 560)">
            <Foglio x={-46} y={-56} w={92} h={112}>
              <Righe x={-30} y={-24} w={50} n={2} passo={20} />
            </Foglio>
          </g>
          <Sigillo cx={458} cy={590} r={16} />
          <Testo x={440} y={642} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Sentenza
          </Testo>
        </Compare>
        <Compare v={molla(locale, riconoscimento, fps)} cx={540} cy={560}>
          <Testo x={540} y={560} corpo={26} titolo peso={800} colore={TINTE.accento}>
            o
          </Testo>
        </Compare>
        <Compare v={molla(locale, riconoscimento, fps)} cx={650} cy={570}>
          <FoglioFirmato cx={650} cy={560} s={0.93} firma={tra(locale, firma, firma + 20)} />
          <Righe2 x={650} y={638} righe={["Riconoscimento", "di debito"]} corpo={20} passo={24} />
        </Compare>
        <Compare v={molla(locale, causa, fps)} cx={860} cy={560}>
          <Pillola x={860} y={560} testo="Se no: una causa" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, lunga, fps)} cx={860} cy={630}>
          <Clessidra cx={860} cy={630} s={0.5} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_FATTURE_MANCATO_PAGAMENTO: Record<string, Disegno> = {
  "fnp-scadenza": fnpScadenza,
  "fnp-sollecito": fnpSollecito,
  "fnp-mora": fnpMora,
  "fnp-domanda": fnpDomanda,
  "fnp-costi": fnpCosti,
  "fnp-precetto": fnpPrecetto,
  "fnp-rigetto": fnpRigetto,
};
