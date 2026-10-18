/**
 * I disegni della lezione 13 («Devi iscriverti al registro di commercio?»),
 * vedi src/lezioni/iscrizione-rc.ts. Fonti: CO artt. 931, 936, 936a, 938,
 * 940, 946, 954a e 957, LEF artt. 39, 42, 97 e 197, OEmol-RC, pagine
 * dell'Ufficio del registro di commercio ticinese, tariffa notarile ticinese,
 * EasyGov e Portale PMI. Coordinate della tela 1000×700; l'angolo in basso a
 * sinistra (x < 300, y > 480) è della finestra di Bleo. Niente cifre: soglia,
 * tasse e multa le dice solo la voce (le tasse si vedono come monete).
 */
import { Compare, Foglio, Freccia, Fumetto, Lampadina, molla, Moneta, Negozio, Palazzo, Persona, Pillola, Registro, Righe, Scudo, Spunta, TEAL_CHIARO, Testo, Timbro, TINTE, tra, Valigetta, Casa, Auto } from "../figure";
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

/** Una croce bianca su un tondo rosso: il medico. */
function Croce({ cx, cy, r = 22 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.rischio} />
      <rect x={cx - r * 0.23} y={cy - r * 0.6} width={r * 0.46} height={r * 1.2} rx={r * 0.09} fill={TINTE.carta} />
      <rect x={cx - r * 0.6} y={cy - r * 0.23} width={r * 1.2} height={r * 0.46} rx={r * 0.09} fill={TINTE.carta} />
    </g>
  );
}

/** Una spiga di grano: l'agricoltore. */
function Spiga({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M 0 60 Q -4 0 0 -62" fill="none" stroke={TINTE.accento} strokeWidth={6} strokeLinecap="round" />
      {[-44, -22, 0, 22].map((y) => (
        <g key={y}>
          <ellipse cx={-13} cy={y} rx={9} ry={17} transform={`rotate(-28 -13 ${y})`} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={3} />
          <ellipse cx={13} cy={y} rx={9} ry={17} transform={`rotate(28 13 ${y})`} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={3} />
        </g>
      ))}
      <ellipse cx={0} cy={-64} rx={8} ry={15} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={3} />
      <path d="M 0 40 q -22 -8 -30 -26 M 0 30 q 22 -8 30 -26" fill="none" stroke={TINTE.ok} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

/** Un computer portatile. */
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

/** Una busta da lettera (angolo in alto a sinistra in x, y). */
function Busta({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d={`M ${x + 8} ${y + 10} L ${x + w / 2} ${y + h * 0.58} L ${x + w - 8} ${y + 10}`} fill="none" stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** Un calendario da muro, senza numeri. */
function Calendario({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-64} y={-60} width={128} height={124} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-64} y={-60} width={128} height={34} rx={14} fill={TINTE.accento} />
      {Array.from({ length: 12 }, (_, k) => (
        <rect key={k} x={-48 + (k % 4) * 26} y={-12 + Math.floor(k / 4) * 24} width={18} height={14} rx={4} fill={k === 11 ? TINTE.accento : TINTE.tinta} />
      ))}
    </g>
  );
}

/** Una firma scritta a mano (si disegna con `p` da 0 a 1). */
function Firma({ x, y, s = 1, p = 1 }: { x: number; y: number; s?: number; p?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1={-10} y1={14} x2={110} y2={14} stroke={TINTE.tinta} strokeWidth={5} strokeLinecap="round" />
      <path
        d="M 0 6 C 10 -24 22 -24 18 2 C 16 18 30 -10 40 -6 C 50 -2 44 12 56 4 C 66 -4 70 -14 80 -2 C 86 6 94 2 100 -4"
        fill="none"
        stroke={TINTE.tratto}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
      />
    </g>
  );
}

/** Una stampante con il foglio che esce. */
function Stampante({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-30} y={-58} width={60} height={34} rx={6} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      <rect x={-52} y={-30} width={104} height={50} rx={12} fill={TINTE.tratto} />
      <circle cx={34} cy={-12} r={5} fill={TINTE.oro} />
      <rect x={-30} y={4} width={60} height={46} rx={6} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      <Righe x={-18} y={20} w={36} n={2} passo={14} />
    </g>
  );
}

/** Una matita inclinata. */
function Matita({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(40)`}>
      <rect x={-12} y={-56} width={24} height={86} rx={4} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={4} />
      <rect x={-12} y={-66} width={24} height={14} rx={4} fill={TINTE.rischio} />
      <path d="M -12 30 L 0 56 L 12 30 Z" fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -4 47 L 0 56 L 4 47 Z" fill={TINTE.tratto} />
    </g>
  );
}

/** Un giornale: il Foglio ufficiale svizzero di commercio (angolo in alto a sinistra in x, y). */
function Giornale({ x, y, w = 170, h = 130 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x + 10} y={y + 10} width={w} height={h} rx={10} fill={TINTE.tinta} />
      <rect x={x} y={y} width={w} height={h} rx={10} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={x + 14} y={y + 14} width={w - 28} height={20} rx={6} fill={TINTE.tratto} />
      <rect x={x + 14} y={y + 46} width={(w - 36) / 2} height={h - 62} rx={6} fill={TINTE.tinta} />
      <Righe x={x + 22 + (w - 36) / 2} y={y + 54} w={(w - 36) / 2 - 16} n={4} passo={18} />
    </g>
  );
}

/* 2. «Devi iscriverti quando la tua ditta, nell'ultimo esercizio, ha realizzato almeno … di cifra d'affari. Conta la cifra d'affari, cioè quanto incassi, non l'utile …» */
const BARRE = { base: 560, soglia: 330, cifra: { x: 650, cima: 230 }, utile: { x: 860, cima: 440 }, w: 120 } as const;
const rcSoglia: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.55, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.6, 0.45) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.45, 0.85) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const esercizio = fra(ctx, null, 0, 0.55, 0.2);
    const cresce = fra(ctx, 0, 1, 0.15, 0.3);
    const obbligo = fra(ctx, 0, 1, 0.75, 0.45);
    const incassi = fra(ctx, 1, 2, 0.45, 0.65);
    const utile = fra(ctx, 2, null, 0.2, 0.8);
    const no = fra(ctx, 2, null, 0.55, 0.9);
    const h = (BARRE.base - BARRE.cifra.cima) * tra(locale, cresce, cresce + 24);
    const hUtile = (BARRE.base - BARRE.utile.cima) * tra(locale, utile, utile + 16);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Quando devi iscriverti" />
        <Compare v={molla(locale, esercizio, fps)} cx={420} cy={250}>
          <Calendario cx={420} cy={240} />
          <Righe2 x={420} y={345} righe={["L'ultimo", "esercizio"]} corpo={26} passo={32} />
        </Compare>
        {/* La base e la soglia. */}
        <Compare v={molla(locale, 4, fps, true)} cx={760} cy={BARRE.base}>
          <line x1={560} y1={BARRE.base} x2={960} y2={BARRE.base} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
        </Compare>
        <g opacity={tra(locale, cresce - 6, cresce + 4)}>
          <line x1={560} y1={BARRE.soglia} x2={960} y2={BARRE.soglia} stroke={TINTE.rischio} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" />
          <Pillola x={880} y={BARRE.soglia - 32} testo="Soglia" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </g>
        {/* La cifra d'affari che cresce fin sopra la soglia. */}
        {h > 1 ? (
          <rect x={BARRE.cifra.x - BARRE.w / 2} y={BARRE.base - h} width={BARRE.w} height={h} rx={12} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={6} />
        ) : null}
        <Compare v={molla(locale, cresce + 10, fps)} cx={BARRE.cifra.x} cy={BARRE.base + 34}>
          <Testo x={BARRE.cifra.x} y={BARRE.base + 34} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Cifra d&apos;affari
          </Testo>
        </Compare>
        <Compare v={molla(locale, obbligo, fps)} cx={BARRE.cifra.x + 60} cy={BARRE.cifra.cima - 40}>
          <Pillola x={BARRE.cifra.x + 60} y={BARRE.cifra.cima - 40} testo="Iscrizione obbligatoria" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, incassi, fps)} cx={BARRE.cifra.x} cy={420}>
          <Moneta cx={BARRE.cifra.x - 22} cy={410} r={24} />
          <Moneta cx={BARRE.cifra.x + 20} cy={440} r={24} />
          <Moneta cx={BARRE.cifra.x - 14} cy={480} r={24} />
        </Compare>
        <Compare v={molla(locale, incassi + 6, fps)} cx={BARRE.cifra.x} cy={BARRE.base + 68}>
          <Testo x={BARRE.cifra.x} y={BARRE.base + 68} corpo={22} peso={600} colore={COLORE_TENUE}>
            quanto incassi
          </Testo>
        </Compare>
        {/* L'utile: più basso, e non conta. */}
        {hUtile > 1 ? (
          <rect x={BARRE.utile.x - BARRE.w / 2} y={BARRE.base - hUtile} width={BARRE.w} height={hUtile} rx={12} fill="#eceef1" stroke={COLORE_TENUE} strokeWidth={6} />
        ) : null}
        <Compare v={molla(locale, utile + 6, fps)} cx={BARRE.utile.x} cy={BARRE.base + 34}>
          <Testo x={BARRE.utile.x} y={BARRE.base + 34} corpo={26} titolo peso={800} colore={COLORE_TENUE}>
            Utile
          </Testo>
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={BARRE.utile.x} cy={BARRE.utile.cima + 60}>
          <No cx={BARRE.utile.x} cy={BARRE.utile.cima + 60} r={30} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Eccezioni: chi esercita una professione liberale, come un medico o un avvocato, e gli agricoltori non devono iscriversi, se non gestiscono l'attività in forma commerciale. Nel dubbio, chiedi …» */
const ECCEZIONI = { medico: 430, avvocato: 640, agricoltore: 850, piedi: 330 } as const;
const rcEccezioni: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.75, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.75, 0.45) },
      { tipo: "lancia", quando: fra(ctx, 2, null, 0.45, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const medico = fra(ctx, null, 0, 0.6, 0.2);
    const avvocato = fra(ctx, null, 0, 0.85, 0.3);
    const agricoltore = fra(ctx, 0, 1, 0.3, 0.4);
    const non = fra(ctx, 0, 1, 0.8, 0.5);
    const commerciale = fra(ctx, 1, 2, 0.35, 0.65);
    const dubbio = fra(ctx, 2, null, 0.3, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Le eccezioni" />
        <Compare v={molla(locale, medico, fps)} cx={ECCEZIONI.medico} cy={250}>
          <Persona x={ECCEZIONI.medico} y={ECCEZIONI.piedi} s={0.8} colore={TEAL_CHIARO} />
          <Croce cx={ECCEZIONI.medico + 52} cy={190} r={22} />
          <Testo x={ECCEZIONI.medico} y={ECCEZIONI.piedi + 32} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Medico
          </Testo>
        </Compare>
        <Compare v={molla(locale, avvocato, fps)} cx={ECCEZIONI.avvocato} cy={250}>
          <Persona x={ECCEZIONI.avvocato} y={ECCEZIONI.piedi} s={0.8} colore={TINTE.tratto} />
          <Valigetta x={ECCEZIONI.avvocato + 58} y={ECCEZIONI.piedi - 12} s={0.55} />
          <Testo x={ECCEZIONI.avvocato} y={ECCEZIONI.piedi + 32} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Avvocato
          </Testo>
        </Compare>
        <Compare v={molla(locale, agricoltore, fps)} cx={ECCEZIONI.agricoltore} cy={250}>
          <Persona x={ECCEZIONI.agricoltore} y={ECCEZIONI.piedi} s={0.8} colore={TINTE.accento} />
          <Spiga cx={ECCEZIONI.agricoltore + 62} cy={ECCEZIONI.piedi - 70} s={0.75} />
          <Testo x={ECCEZIONI.agricoltore} y={ECCEZIONI.piedi + 32} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Agricoltore
          </Testo>
        </Compare>
        <Compare v={molla(locale, non, fps)} cx={640} cy={440}>
          <Pillola x={640} y={440} testo="Non devono iscriversi" corpo={28} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, commerciale, fps)} cx={640} cy={502}>
          <Testo x={640} y={502} corpo={26} peso={700} colore={TINTE.accento}>
            se l&apos;attività non è in forma commerciale
          </Testo>
        </Compare>
        <Compare v={molla(locale, dubbio, fps)} cx={640} cy={600}>
          <Fumetto cx={420} cy={590} r={32}>
            <Testo x={420} y={592} corpo={38} titolo peso={800} colore={TINTE.tratto}>
              ?
            </Testo>
          </Fumetto>
          <Testo x={470} y={594} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Nel dubbio, chiedi all&apos;Ufficio
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Sotto la soglia, iscriverti è facoltativo: ne hai sempre il diritto. Il vantaggio? Il nome della tua ditta è protetto: nello stesso luogo nessun altro può usarlo.» */
const rcFacoltativa: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.3, 0.7),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.8, 0.35) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.35, 0.75) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const si = fra(ctx, null, 0, 0.35, 0.15);
    const no = fra(ctx, null, 0, 0.55, 0.25);
    const diritto = fra(ctx, null, 0, 0.85, 0.35);
    const vantaggio = fra(ctx, 0, 1, 0.3, 0.45);
    const protetto = fra(ctx, 1, null, 0.2, 0.65);
    const luogo = fra(ctx, 1, null, 0.6, 0.85);
    const idea = tra(locale, vantaggio, vantaggio + 8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Sotto la soglia" />
        <Compare v={molla(locale, 6, fps, true)} cx={420} cy={250}>
          <Persona x={420} y={330} s={0.85} colore={TINTE.accento} />
          <Fumetto cx={490} cy={130} r={36}>
            <g opacity={1 - idea}>
              <Testo x={490} y={132} corpo={40} titolo peso={800} colore={TINTE.tratto}>
                ?
              </Testo>
            </g>
            <g opacity={idea}>
              <Lampadina cx={490} cy={130} s={0.8} />
            </g>
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, si, fps)} cx={720} cy={150}>
          <Pillola x={700} y={150} testo="Ti iscrivi" corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
          <Spunta cx={880} cy={150} r={26} p={tra(locale, diritto, diritto + 12)} />
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={720} cy={240}>
          <Pillola x={700} y={240} testo="Non ti iscrivi" corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
          <Spunta cx={880} cy={240} r={26} p={tra(locale, diritto + 4, diritto + 16)} />
        </Compare>
        <Compare v={molla(locale, diritto + 6, fps)} cx={740} cy={318}>
          <Testo x={740} y={318} corpo={26} titolo peso={800} colore={TINTE.ok}>
            Decidi tu
          </Testo>
        </Compare>
        {/* Il vantaggio: il nome protetto nel luogo. */}
        <Compare v={molla(locale, protetto, fps)} cx={540} cy={540}>
          <Negozio x={510} y={640} s={0.8} targa="La tua ditta" targaScala={0.9} />
          <Scudo x={655} y={520} s={0.9} />
        </Compare>
        <Compare v={molla(locale, luogo, fps)} cx={850} cy={550}>
          <Righe2 x={850} y={530} righe={["Nello stesso luogo,", "solo tu"]} corpo={26} passo={36} colore={TINTE.ok} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Se ti iscrivi, i dati della ditta, con il tuo nome, diventano pubblici: escono nel Foglio ufficiale svizzero di commercio, e chiunque li vede gratis online. La contabilità invece non cambia …» */
const rcPubblico: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.6, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const dati = fra(ctx, null, 0, 0.3, 0.15);
    const pubblici = fra(ctx, null, 0, 0.85, 0.3);
    const foglio = fra(ctx, 0, 1, 0.35, 0.4);
    const online = fra(ctx, 1, 2, 0.35, 0.6);
    const contabilita = fra(ctx, 2, null, 0.15, 0.7);
    const dipende = fra(ctx, 2, null, 0.6, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Un registro pubblico" />
        <Compare v={molla(locale, dati, fps)} cx={420} cy={250}>
          <Registro x={420} y={290} s={1.1} />
          <Righe2 x={420} y={330} righe={["I dati", "della ditta"]} corpo={26} passo={32} />
        </Compare>
        <Compare v={molla(locale, pubblici, fps)} cx={420} cy={130}>
          <Pillola x={420} y={130} testo="Pubblici" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 510 230 Q 540 210 570 220" p={tra(locale, foglio - 8, foglio + 4)} />
        <Compare v={molla(locale, foglio, fps)} cx={665} cy={230}>
          <Giornale x={580} y={170} />
          <Righe2 x={665} y={340} righe={["Foglio ufficiale", "di commercio"]} corpo={24} passo={30} />
        </Compare>
        <Freccia d="M 765 230 Q 790 210 815 220" p={tra(locale, online - 8, online + 4)} />
        <Compare v={molla(locale, online, fps)} cx={895} cy={230}>
          <Computer cx={895} cy={225} s={0.62} />
          <Righe2 x={895} y={340} righe={["Online,", "gratis"]} corpo={24} passo={30} colore={TINTE.ok} />
        </Compare>
        {/* La contabilità: non cambia. */}
        <Compare v={molla(locale, contabilita, fps)} cx={640} cy={540}>
          <Foglio x={380} y={460} w={120} h={150}>
            <line x1={440} y1={500} x2={440} y2={590} stroke={TINTE.tinta} strokeWidth={5} />
            <Righe x={396} y={510} w={34} n={4} passo={22} />
            <Righe x={452} y={510} w={34} n={4} passo={22} />
          </Foglio>
          <Testo x={530} y={525} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            La contabilità non cambia
          </Testo>
        </Compare>
        <Compare v={molla(locale, dipende, fps)} cx={700} cy={570}>
          <Testo x={530} y={570} corpo={24} peso={600} colore={COLORE_TENUE} ancora="start">
            dipende dalla cifra d&apos;affari
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Attenzione ai debiti: se sei iscritto e non paghi, il creditore può chiedere il tuo fallimento, che riguarda tutto il tuo patrimonio. Senza iscrizione, di regola, c'è il pignoramento: si prende solo quanto basta …» */
const COL = { iscritto: 480, senza: 820 } as const;
const rcFallimento: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.6, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.6, 0.3) + 4 },
      { tipo: "lancia", quando: fra(ctx, 3, null, 0.5, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const iscritto = fra(ctx, null, 0, 0.35, 0.1);
    const debito = fra(ctx, null, 0, 0.75, 0.2);
    const fallimento = fra(ctx, 0, 1, 0.55, 0.3);
    const tutto = fra(ctx, 1, 2, 0.3, 0.45);
    const senza = fra(ctx, 2, 3, 0.25, 0.6);
    const pignoramento = fra(ctx, 2, 3, 0.75, 0.7);
    const quanto = fra(ctx, 3, null, 0.35, 0.85);
    const prende = tra(locale, quanto + 6, quanto + 22);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Se non paghi un debito" />
        <line x1={650} y1={110} x2={650} y2={600} stroke={TINTE.tinta} strokeWidth={5} strokeDasharray="10 12" strokeLinecap="round" opacity={tra(locale, senza - 6, senza + 6)} />
        {/* Iscritto: il fallimento, su tutto il patrimonio. */}
        <Compare v={molla(locale, iscritto, fps)} cx={COL.iscritto} cy={115}>
          <Pillola x={COL.iscritto} y={115} testo="Iscritto" corpo={28} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, debito, fps)} cx={COL.iscritto} cy={200}>
          <Foglio x={COL.iscritto - 50} y={152} w={100} h={100}>
            <Righe x={COL.iscritto - 34} y={188} w={58} n={2} passo={22} />
          </Foglio>
          <No cx={COL.iscritto + 54} cy={236} r={22} />
        </Compare>
        <Compare v={molla(locale, fallimento, fps)} cx={COL.iscritto} cy={300}>
          <Pillola x={COL.iscritto} y={300} testo="Fallimento" corpo={30} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, tutto, fps)} cx={COL.iscritto} cy={450}>
          <rect x={COL.iscritto - 150} y={378} width={300} height={130} rx={24} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={5} />
          <Casa x={COL.iscritto - 92} y={490} s={0.7} />
          <Auto x={COL.iscritto + 6} y={486} s={0.85} />
          <Moneta cx={COL.iscritto + 102} cy={444} r={22} />
          <Moneta cx={COL.iscritto + 112} cy={474} r={22} />
          <Testo x={COL.iscritto} y={545} corpo={26} titolo peso={800} colore={TINTE.rischio}>
            Tutto il patrimonio
          </Testo>
        </Compare>
        {/* Senza iscrizione: il pignoramento, solo quanto basta. */}
        <Compare v={molla(locale, senza, fps)} cx={COL.senza} cy={115}>
          <Pillola x={COL.senza} y={115} testo="Senza iscrizione" corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, pignoramento, fps)} cx={COL.senza} cy={300}>
          <Pillola x={COL.senza} y={300} testo="Pignoramento" corpo={30} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, quanto, fps)} cx={COL.senza} cy={450}>
          <rect x={COL.senza - 130} y={378} width={260} height={130} rx={24} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <Casa x={COL.senza - 70} y={490} s={0.7} />
          <Moneta cx={COL.senza + 30} cy={444} r={22} />
          <Moneta cx={COL.senza + 72} cy={444} r={22} />
          {/* Una moneta sola esce dal riquadro: quanto basta per il debito. */}
          <g transform={`translate(0 ${-prende * 128})`}>
            <Moneta cx={COL.senza + 52} cy={480} r={22} />
          </g>
          <Testo x={COL.senza} y={545} corpo={26} titolo peso={800} colore={TINTE.accento}>
            Solo quanto basta
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 7. «E se devi iscriverti, ma non lo fai? L'Ufficio ti dà un termine. Se non lo rispetti, ti iscrive d'ufficio e può darti una multa fino a ….» */
const rcObbligo: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.4, 0.7),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.4) },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.75, 0.85) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const domanda = fra(ctx, null, 0, 0.4, 0.15);
    const ufficio = fra(ctx, 0, 1, 0.15, 0.3);
    const termine = fra(ctx, 0, 1, 0.65, 0.4);
    const dUfficio = fra(ctx, 1, null, 0.35, 0.65);
    const multa = fra(ctx, 1, null, 0.75, 0.85);
    const lettera = tra(locale, termine - 6, termine + 14);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Se non ti iscrivi" />
        <Compare v={molla(locale, 4, fps, true)} cx={420} cy={250}>
          <Persona x={420} y={330} s={0.85} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, domanda, fps)} cx={490} cy={130}>
          <Fumetto cx={490} cy={130} r={34}>
            <Testo x={490} y={132} corpo={40} titolo peso={800} colore={TINTE.tratto}>
              ?
            </Testo>
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, ufficio, fps)} cx={760} cy={250}>
          <Palazzo x={760} y={320} s={0.72} />
          <Testo x={760} y={352} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            L&apos;Ufficio
          </Testo>
        </Compare>
        {/* La lettera con il termine, dall'Ufficio a te. */}
        {lettera > 0 ? (
          <g transform={`translate(${-190 * lettera} ${-30 * Math.sin(Math.PI * lettera)})`} opacity={Math.min(1, lettera * 3)}>
            <Busta x={680} y={180} w={80} h={56} />
          </g>
        ) : null}
        <Compare v={molla(locale, termine, fps)} cx={910} cy={200}>
          <Calendario cx={910} cy={200} s={0.8} />
          <Testo x={910} y={272} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Un termine
          </Testo>
        </Compare>
        <Freccia d="M 700 380 Q 620 420 560 480" p={tra(locale, dUfficio - 10, dUfficio + 2)} />
        <Compare v={molla(locale, dUfficio, fps)} cx={540} cy={530}>
          <Registro x={480} y={580} s={0.8} />
          <Righe2 x={620} y={525} righe={["Iscritto", "d'ufficio"]} corpo={26} passo={32} />
        </Compare>
        <Compare v={molla(locale, multa, fps)} cx={850} cy={530}>
          <Moneta cx={780} cy={530} r={28} />
          <Pillola x={880} y={530} testo="Multa" corpo={30} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Come ti iscrivi? Online con EasyGov, la piattaforma delle autorità. Oppure con il formulario dell'Ufficio ticinese, che compili, stampi, firmi e spedisci per posta.» */
const PASSI_FORMULARIO = [
  { x: 430, testo: "Compili" },
  { x: 580, testo: "Stampi" },
  { x: 730, testo: "Firmi" },
  { x: 880, testo: "Spedisci" },
] as const;
const rcCome: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.9, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const easygov = fra(ctx, 0, 1, 0.2, 0.25);
    const oppure = fra(ctx, 1, 2, 0.1, 0.5);
    const formulario = fra(ctx, 1, 2, 0.45, 0.6);
    const passi = PASSI_FORMULARIO.map((_, i) => fra(ctx, 2, null, 0.08 + i * 0.22, 0.65 + i * 0.08));
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Come ti iscrivi" />
        <Compare v={molla(locale, easygov, fps)} cx={450} cy={220}>
          <Computer cx={450} cy={200} s={0.95} />
          <Pillola x={450} y={300} testo="EasyGov" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, oppure, fps)} cx={640} cy={220}>
          <Testo x={640} y={220} corpo={28} titolo peso={800} colore={COLORE_TENUE}>
            oppure
          </Testo>
        </Compare>
        <Compare v={molla(locale, formulario, fps)} cx={830} cy={210}>
          <Foglio x={770} y={110} w={120} h={150}>
            <Righe x={786} y={160} w={70} n={3} passo={24} />
          </Foglio>
          <Righe2 x={830} y={300} righe={["Formulario", "ticinese"]} corpo={26} passo={32} />
        </Compare>
        {PASSI_FORMULARIO.map((passo, i) => (
          <Compare key={passo.testo} v={molla(locale, passi[i], fps)} cx={passo.x} cy={490}>
            {i === 0 ? (
              <g>
                <Foglio x={passo.x - 40} y={440} w={80} h={100}>
                  <Righe x={passo.x - 28} y={480} w={44} n={2} passo={20} />
                </Foglio>
                <Matita cx={passo.x + 26} cy={486} s={0.5} />
              </g>
            ) : i === 1 ? (
              <Stampante cx={passo.x} cy={500} s={0.95} />
            ) : i === 2 ? (
              <g>
                <Foglio x={passo.x - 40} y={440} w={80} h={100} />
                <Firma x={passo.x - 32} y={505} s={0.6} p={tra(locale, passi[i] + 4, passi[i] + 18)} />
              </g>
            ) : (
              <Busta x={passo.x - 48} y={458} w={96} h={66} />
            )}
            <Testo x={passo.x} y={580} corpo={24} titolo peso={800} colore={TINTE.tratto}>
              {passo.testo}
            </Testo>
          </Compare>
        ))}
        {PASSI_FORMULARIO.slice(1).map((passo, i) => (
          <Freccia key={passo.testo} d={`M ${passo.x - 88} 490 H ${passo.x - 58}`} p={tra(locale, passi[i + 1] - 6, passi[i + 1] + 2)} spessore={6} />
        ))}
      </Tela>
    );
  },
};

/* 9. «Nel formulario scrivi il nome della ditta … Poi lo scopo, cioè cosa fai, e l'indirizzo dove ti si trova: una casella postale non basta. Allega anche una copia del documento d'identità.» */
const rcFormulario = elenco(
  "Nel formulario",
  ["Il nome della ditta", "Lo scopo: cosa fai", "L'indirizzo, non una casella", "Copia del documento d'identità"],
  (ctx) => [fra(ctx, null, 0, 0.4, 0.15), fra(ctx, 0, 1, 0.3, 0.4), fra(ctx, 0, 1, 0.75, 0.6), fra(ctx, 2, null, 0.35, 0.85)],
);

/* 10. «La firma sulla domanda va autenticata: allo sportello dell'Ufficio … costa …. Dal notaio costa al massimo …, oppure vai dal segretario del tuo Comune.» */
const OPZIONI_FIRMA = { ufficio: 440, notaio: 660, comune: 880, piedi: 480 } as const;
const rcFirma: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.75, 0.25),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.8, 0.25) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.8, 0.85) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const foglio = 6;
    const firma = fra(ctx, null, 0, 0.3, 0.1);
    const timbro = fra(ctx, null, 0, 0.75, 0.25);
    const ufficio = fra(ctx, 0, 1, 0.3, 0.45);
    const notaio = fra(ctx, 1, null, 0.15, 0.65);
    const comune = fra(ctx, 1, null, 0.65, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La firma autenticata" />
        <Compare v={molla(locale, foglio, fps, true)} cx={660} cy={210}>
          <Foglio x={570} y={100} w={180} h={210}>
            <Righe x={592} y={150} w={110} n={3} passo={26} />
          </Foglio>
          <Firma x={590} y={262} s={0.95} p={tra(locale, firma, firma + 18)} />
        </Compare>
        <Compare v={molla(locale, timbro, fps)} cx={780} cy={270}>
          <Timbro cx={780} cy={270} r={40} />
        </Compare>
        <Compare v={molla(locale, ufficio, fps)} cx={OPZIONI_FIRMA.ufficio} cy={430}>
          <Palazzo x={OPZIONI_FIRMA.ufficio} y={OPZIONI_FIRMA.piedi} s={0.6} />
          <Testo x={OPZIONI_FIRMA.ufficio} y={OPZIONI_FIRMA.piedi + 34} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            All&apos;Ufficio
          </Testo>
          <Moneta cx={OPZIONI_FIRMA.ufficio} cy={OPZIONI_FIRMA.piedi + 86} r={22} />
        </Compare>
        <Compare v={molla(locale, notaio, fps)} cx={OPZIONI_FIRMA.notaio} cy={430}>
          <Persona x={OPZIONI_FIRMA.notaio} y={OPZIONI_FIRMA.piedi} s={0.68} colore={TEAL_CHIARO} />
          <Valigetta x={OPZIONI_FIRMA.notaio + 48} y={OPZIONI_FIRMA.piedi - 8} s={0.5} />
          <Testo x={OPZIONI_FIRMA.notaio} y={OPZIONI_FIRMA.piedi + 34} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Dal notaio
          </Testo>
          <Moneta cx={OPZIONI_FIRMA.notaio - 18} cy={OPZIONI_FIRMA.piedi + 86} r={22} />
          <Moneta cx={OPZIONI_FIRMA.notaio + 18} cy={OPZIONI_FIRMA.piedi + 86} r={22} />
        </Compare>
        <Compare v={molla(locale, comune, fps)} cx={OPZIONI_FIRMA.comune} cy={430}>
          <Casa x={OPZIONI_FIRMA.comune} y={OPZIONI_FIRMA.piedi + 10} s={0.95} colore={TINTE.accento} />
          <Testo x={OPZIONI_FIRMA.comune} y={OPZIONI_FIRMA.piedi + 34} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            In Comune
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 11. «Poi arriva la fattura delle tasse: … per la prima iscrizione, … per la tua funzione di titolare e … per il diritto di firma. In tutto …, più l'autenticazione.» Le monete stanno per le tasse: quattro per la prima iscrizione, una per ciascuna delle altre due. */
const TASSE = { etichette: 570, moneta: 952, passoMoneta: 36, r: 18 } as const;
const RIGHE_TASSE = [
  { y: 150, testo: "Prima iscrizione", monete: 4 },
  { y: 230, testo: "La tua funzione", monete: 1 },
  { y: 310, testo: "Il diritto di firma", monete: 1 },
] as const;
function MoneteInFila({ y, n }: { y: number; n: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, k) => (
        <Moneta key={k} cx={TASSE.moneta - k * TASSE.passoMoneta} cy={y} r={TASSE.r} />
      ))}
    </g>
  );
}
const rcTasse: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.35, 0.7),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.25) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.4, 0.75) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const fattura = fra(ctx, null, 0, 0.25, 0.1);
    const righe = [fra(ctx, null, 0, 0.7, 0.25), fra(ctx, 0, 1, 0.25, 0.45), fra(ctx, 0, 1, 0.7, 0.6)];
    const totale = fra(ctx, 1, null, 0.2, 0.7);
    const autenticazione = fra(ctx, 1, null, 0.65, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Le tasse" />
        <Compare v={molla(locale, fattura, fps)} cx={430} cy={230}>
          <Foglio x={340} y={110} w={180} h={240}>
            <rect x={358} y={160} width={90} height={18} rx={6} fill={TINTE.tratto} />
            <Righe x={358} y={210} w={120} n={4} passo={30} />
          </Foglio>
          <Testo x={430} y={385} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            La fattura
          </Testo>
        </Compare>
        {RIGHE_TASSE.map((r, i) => (
          <Compare key={r.testo} v={molla(locale, righe[i], fps)} cx={760} cy={r.y}>
            <Testo x={TASSE.etichette} y={r.y} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {r.testo}
            </Testo>
            <MoneteInFila y={r.y} n={r.monete} />
          </Compare>
        ))}
        <Compare v={molla(locale, totale, fps)} cx={760} cy={420}>
          <line x1={TASSE.etichette} y1={370} x2={975} y2={370} stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" />
          <Testo x={TASSE.etichette} y={420} corpo={28} titolo peso={800} colore={TINTE.accento} ancora="start">
            In tutto
          </Testo>
          <MoneteInFila y={420} n={6} />
        </Compare>
        <Compare v={molla(locale, autenticazione, fps)} cx={760} cy={520}>
          <Pillola x={760} y={520} testo="Più l'autenticazione" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_REGISTRO_COMMERCIO: Record<string, Disegno> = {
  "rc-soglia": rcSoglia,
  "rc-eccezioni": rcEccezioni,
  "rc-facoltativa": rcFacoltativa,
  "rc-pubblico": rcPubblico,
  "rc-fallimento": rcFallimento,
  "rc-obbligo": rcObbligo,
  "rc-come": rcCome,
  "rc-formulario": rcFormulario,
  "rc-firma": rcFirma,
  "rc-tasse": rcTasse,
};
