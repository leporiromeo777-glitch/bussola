/**
 * I disegni della lezione 8 («Come chiamare la tua ditta»), vedi
 * src/lezioni/nome-ditta.ts. Fonti: artt. 944-946, 950 e 951 CO, registro di
 * commercio ticinese, direttiva UFRC sulle ditte, Portale PMI, REGIX, Zefix e
 * pagine dell'IPI. I nomi sulle insegne sono esempi («Caseificio di Rossi G.»
 * è quello del registro ticinese, «Müller» quello della direttiva UFRC).
 * Coordinate della tela 1000×700; l'angolo in basso a sinistra (x < 300,
 * y > 480) è della finestra di Bleo. Niente cifre, solo concetti.
 */
import { TITOLI } from "../../stile";
import {
  Compare,
  Freccia,
  molla,
  Negozio,
  Palazzo,
  Persona,
  Pillola,
  Registro,
  Righe,
  Spunta,
  TEAL_CHIARO,
  Testo,
  Timbro,
  TINTE,
  tra,
  Valigetta,
} from "../figure";
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

/** Larghezza media di un carattere dei titoli, in corpi (un po' abbondante). */
const CARATTERE = 0.58;

type Pezzo = { testo: string; colore?: string; opacita?: number };

/** Larghezza di un'insegna con questo testo. */
function larghezzaInsegna(testo: string, corpo: number): number {
  return testo.length * corpo * CARATTERE + corpo * 1.4;
}

/**
 * Un'insegna: rettangolo arrotondato centrato in (cx, cy) con il nome della
 * ditta, a pezzi di colori diversi (per esempio il cognome e l'attività).
 */
function Insegna({
  cx,
  cy,
  pezzi,
  corpo = 34,
  fondo = TINTE.carta,
  bordo = TINTE.tratto,
  colore = TINTE.tratto,
  larghezza,
  dx = 0,
}: {
  cx: number;
  cy: number;
  pezzi: readonly Pezzo[];
  corpo?: number;
  fondo?: string;
  bordo?: string;
  colore?: string;
  /** Se manca, dal testo. */
  larghezza?: number;
  /** Sposta solo il testo, non il rettangolo. */
  dx?: number;
}) {
  const w = larghezza ?? larghezzaInsegna(pezzi.map((p) => p.testo).join(""), corpo);
  const h = corpo * 1.9;
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={16} fill={fondo} stroke={bordo} strokeWidth={6} />
      <text
        x={cx + dx}
        y={cy + 1}
        fontFamily={TITOLI}
        fontWeight={800}
        fontSize={corpo}
        textAnchor="middle"
        dominantBaseline="middle"
        letterSpacing="-0.02em"
        fill={colore}
        style={{ whiteSpace: "pre" }}
      >
        {pezzi.map((p, i) => (
          <tspan key={i} fill={p.colore ?? colore} fillOpacity={p.opacita ?? 1}>
            {p.testo}
          </tspan>
        ))}
      </text>
    </g>
  );
}

/** Un bollino rosso con la croce bianca (p da 0 a 1): «no», come Spunta per «sì». */
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

/** Una croce rossa che si disegna (p da 0 a 1), larga 2·rx e alta 2·ry. */
function Croce({ cx, cy, rx, ry = rx, p, spessore = 12 }: { cx: number; cy: number; rx: number; ry?: number; p: number; spessore?: number }) {
  if (p <= 0) return null;
  const a = Math.min(1, p * 2);
  const b = Math.max(0, p * 2 - 1);
  return (
    <g stroke={TINTE.rischio} strokeWidth={spessore} strokeLinecap="round">
      <line x1={cx - rx} y1={cy - ry} x2={cx - rx + 2 * rx * a} y2={cy - ry + 2 * ry * a} />
      {b > 0 ? <line x1={cx + rx} y1={cy - ry} x2={cx + rx - 2 * rx * b} y2={cy - ry + 2 * ry * b} /> : null}
    </g>
  );
}

/** Uno spicchio di formaggio con i buchi: il caseificio. */
function Formaggio({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  const giallo = "#f2c14e";
  const scuro = "#d9a23a";
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} stroke={TINTE.accento} strokeWidth={5} strokeLinejoin="round">
      <path d="M -80 -34 L -50 -48 L 92 -24 L 62 -10 Z" fill="#f8d77a" />
      <path d="M 62 -10 L 92 -24 L 92 24 L 62 40 Z" fill={scuro} />
      <path d="M -80 -34 L 62 -10 L 62 40 L -80 40 Z" fill={giallo} />
      <circle cx={-44} cy={8} r={11} fill={scuro} />
      <circle cx={6} cy={22} r={8} fill={scuro} />
      <circle cx={30} cy={-2} r={6} fill={scuro} />
    </g>
  );
}

/** Un lucchetto: una parola che non può usare chiunque. */
function Lucchetto({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M -15 -6 V -20 a 15 15 0 0 1 30 0 V -6" fill="none" stroke={TINTE.accento} strokeWidth={7} />
      <rect x={-24} y={-8} width={48} height={40} rx={9} fill={TINTE.accento} />
      <circle cx={0} cy={9} r={6} fill={TINTE.crema} />
      <rect x={-2.5} y={10} width={5} height={12} rx={2} fill={TINTE.crema} />
    </g>
  );
}

/** Il martelletto del giudice, sulla sua base. `colpo` da 0 a 1 lo fa battere. */
function Martelletto({ cx, cy, s = 1, colpo = 0 }: { cx: number; cy: number; s?: number; colpo?: number }) {
  const angolo = -40 + 30 * Math.sin(Math.PI * colpo);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-62} y={46} width={124} height={20} rx={9} fill={TINTE.tratto} />
      <rect x={-40} y={34} width={80} height={16} rx={6} fill={TINTE.tratto} opacity={0.7} />
      <g transform={`rotate(${angolo} 10 20)`}>
        <rect x={2} y={-34} width={16} height={92} rx={8} fill={TINTE.accento} transform="rotate(90 10 12)" />
        <rect x={-36} y={-36} width={40} height={72} rx={10} fill={TINTE.accento} />
        <rect x={-42} y={-24} width={52} height={10} rx={4} fill="#7a4512" />
        <rect x={-42} y={14} width={52} height={10} rx={4} fill="#7a4512" />
      </g>
    </g>
  );
}

/** Una lente d'ingrandimento: cercare. */
function Lente({ cx, cy, r = 24, colore = TINTE.tratto }: { cx: number; cy: number; r?: number; colore?: string }) {
  return (
    <g>
      <line x1={cx + r * 0.7} y1={cy + r * 0.7} x2={cx + r * 1.65} y2={cy + r * 1.65} stroke={colore} strokeWidth={r * 0.38} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} stroke={colore} strokeWidth={r * 0.28} />
      <path d={`M ${cx - r * 0.45} ${cy - r * 0.1} a ${r * 0.5} ${r * 0.5} 0 0 1 ${r * 0.4} ${-r * 0.38}`} fill="none" stroke={TINTE.tinta} strokeWidth={r * 0.16} strokeLinecap="round" />
    </g>
  );
}

/** Una carta d'identità (angolo in alto a sinistra in x, y) con il cognome. */
function CartaIdentita({ x, y, cognome }: { x: number; y: number; cognome: string }) {
  const w = 290;
  const h = 184;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d={`M ${x + 3} ${y + 44} V ${y + 18} q 0 -15 15 -15 H ${x + w - 18} q 15 0 15 15 V ${y + 44} Z`} fill={TINTE.tratto} />
      <rect x={x + 22} y={y + 62} width={84} height={100} rx={12} fill={TINTE.tinta} />
      <circle cx={x + 64} cy={y + 100} r={20} fill={TINTE.tratto} />
      <path d={`M ${x + 34} ${y + 162} q 0 -36 30 -36 q 30 0 30 36 Z`} fill={TINTE.tratto} />
      <Testo x={x + 124} y={y + 86} corpo={34} titolo peso={800} colore={TINTE.tratto} ancora="start">
        {cognome}
      </Testo>
      <Righe x={x + 126} y={y + 128} w={130} n={2} passo={24} />
    </g>
  );
}

/** Un simbolo grande fra due insegne («=», «≈», «≠»). */
function Simbolo({ x, y, testo, colore = TINTE.tratto, corpo = 52 }: { x: number; y: number; testo: string; colore?: string; corpo?: number }) {
  return (
    <Testo x={x} y={y} corpo={corpo} titolo peso={800} colore={colore}>
      {testo}
    </Testo>
  );
}

/* 2. «Per la legge, la «ditta» è proprio il nome della tua attività. … deve contenere il tuo cognome. Il tuo nome … puoi metterlo oppure no.» */
const INSEGNA_2 = { cx: 640, cy: 460, corpo: 44 };
const dnCognome: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.45, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.35, 0.2) },
      { tipo: "festeggia", quando: fra(ctx, 0, 1, 0.45, 0.5) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const negozio = fra(ctx, null, 0, 0.3, 0.15);
    const cognome = fra(ctx, 0, 1, 0.4, 0.5);
    const nome = fra(ctx, 1, null, 0.25, 0.8);
    const scritta = tra(locale, cognome - 4, cognome + 8);
    const conNome = tra(locale, nome, nome + 14);
    // «Giulia Rossi» è centrato: prima che compaia il nome, «Rossi» sta al centro.
    const meta = ("Giulia ".length * INSEGNA_2.corpo * CARATTERE) / 2;
    const w = larghezzaInsegna("Giulia Rossi", INSEGNA_2.corpo);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La «ditta» è il nome" />
        <Compare v={molla(locale, negozio, fps, true)} cx={640} cy={560}>
          <Negozio x={640} y={665} s={1.1} />
          <Insegna
            cx={INSEGNA_2.cx}
            cy={INSEGNA_2.cy}
            dx={-meta * (1 - conNome)}
            larghezza={w}
            corpo={INSEGNA_2.corpo}
            fondo={TINTE.carta}
            pezzi={[
              { testo: "Giulia ", colore: TEAL_CHIARO, opacita: conNome },
              { testo: "Rossi", colore: TINTE.tratto, opacita: scritta },
            ]}
          />
        </Compare>
        {/* Il cognome: sempre. */}
        <Compare v={molla(locale, cognome + 4, fps)} cx={770} cy={322}>
          <Pillola x={770} y={322} testo="Il cognome: sempre" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 760 352 Q 755 380 735 408" p={tra(locale, cognome + 8, cognome + 18)} spessore={6} />
        <Spunta cx={952} cy={322} r={24} p={tra(locale, cognome + 12, cognome + 26)} />
        {/* Il nome: se vuoi. */}
        <Compare v={molla(locale, nome + 4, fps)} cx={455} cy={322}>
          <Pillola x={455} y={322} testo="Il nome: se vuoi" corpo={26} fondo={TINTE.carta} colore={TEAL_CHIARO} bordo={TEAL_CHIARO} />
        </Compare>
        <Freccia d="M 480 352 Q 520 385 560 408" p={tra(locale, nome + 8, nome + 18)} spessore={6} colore={TEAL_CHIARO} tratteggio />
      </Tela>
    );
  },
};

/* 3. «Il cognome lo scrivi esattamente come sul tuo documento d'identità. Non puoi cambiarlo, nemmeno di una lettera.» */
const dnDocumento: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.75, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.75, 0.45) + 4 },
      { tipo: "scuoti", quando: fra(ctx, 0, null, 0.55, 0.8) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const carta = fra(ctx, null, 0, 0.3, 0.2);
    const giusto = fra(ctx, null, 0, 0.75, 0.45);
    const sbagliato = fra(ctx, 0, null, 0.2, 0.65);
    const croce = fra(ctx, 0, null, 0.55, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Come sul documento" />
        <Compare v={molla(locale, carta, fps)} cx={495} cy={222}>
          <CartaIdentita x={350} y={130} cognome="Müller" />
        </Compare>
        <Freccia d="M 652 222 H 708" p={tra(locale, giusto - 8, giusto + 2)} />
        <Compare v={molla(locale, giusto, fps)} cx={820} cy={222}>
          <Insegna cx={820} cy={222} corpo={40} pezzi={[{ testo: "Müller" }]} />
        </Compare>
        <Spunta cx={955} cy={222} r={24} p={tra(locale, giusto + 8, giusto + 22)} />
        <Freccia d="M 520 330 Q 540 440 690 440" p={tra(locale, sbagliato - 10, sbagliato + 2)} colore={TINTE.rischio} tratteggio />
        <Compare v={molla(locale, sbagliato, fps)} cx={820} cy={440}>
          <Insegna cx={820} cy={440} corpo={40} pezzi={[{ testo: "M" }, { testo: "ue", colore: TINTE.rischio }, { testo: "ller" }]} bordo={TINTE.rischio} />
        </Compare>
        <No cx={955} cy={440} r={24} p={tra(locale, croce, croce + 14)} />
        <Compare v={molla(locale, croce + 10, fps)} cx={650} cy={590}>
          <Pillola x={650} y={590} testo="Nemmeno una lettera" corpo={28} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Al cognome puoi aggiungere cosa fai, oppure un nome di fantasia. L'Ufficio ticinese del registro di commercio fa questo esempio: «Caseificio di Rossi G.»» */
const CASEIFICIO: readonly Pezzo[] = [{ testo: "Caseificio", colore: TINTE.accento }, { testo: " di " }, { testo: "Rossi G." }];
const dnAggiunte: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.15, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.25) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.15, 0.85) + 10 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cognome = fra(ctx, null, 0, 0.12, 0.08);
    const cosaFai = fra(ctx, null, 0, 0.45, 0.2);
    const fantasia = fra(ctx, null, 0, 0.8, 0.35);
    const registro = fra(ctx, 0, 1, 0.3, 0.55);
    const esempio = fra(ctx, 1, null, 0.05, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cosa puoi aggiungere" />
        <Compare v={molla(locale, cognome, fps)} cx={650} cy={135}>
          <Insegna cx={650} cy={135} corpo={40} pezzi={[{ testo: "Rossi" }]} fondo={TINTE.tratto} bordo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, cosaFai, fps)} cx={478} cy={235}>
          <Pillola x={478} y={235} testo="+ cosa fai" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, fantasia, fps)} cx={800} cy={235}>
          <Pillola x={800} y={235} testo="+ un nome di fantasia" corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, registro, fps)} cx={600} cy={330}>
          <Registro x={400} y={362} s={0.55} />
          <Testo x={452} y={334} corpo={26} titolo peso={800} colore={COLORE_TENUE} ancora="start">
            L&apos;esempio del registro ticinese
          </Testo>
        </Compare>
        <Compare v={molla(locale, esempio, fps, true)} cx={650} cy={560}>
          <Negozio x={650} y={665} />
          <Formaggio cx={606} cy={600} s={0.36} />
          <Insegna cx={650} cy={478} corpo={32} pezzi={CASEIFICIO} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Però le aggiunte devono essere vere e non trarre in inganno. Se il nome dice «Caseificio» … E parole come «banca» o «federale» non le può usare chiunque.» */
const dnVero: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.25),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.5) },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.45, 0.8) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const vero = fra(ctx, null, 0, 0.6, 0.25);
    const formaggio = fra(ctx, 0, 1, 0.35, 0.45);
    const quella = fra(ctx, 0, 1, 0.8, 0.6);
    const banca = fra(ctx, 1, null, 0.3, 0.75);
    const federale = fra(ctx, 1, null, 0.5, 0.82);
    const nonTutti = fra(ctx, 1, null, 0.85, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Vero, senza inganni" />
        <Compare v={molla(locale, 4, fps)} cx={650} cy={135}>
          <Insegna cx={650} cy={135} corpo={32} pezzi={CASEIFICIO} />
        </Compare>
        <Compare v={molla(locale, vero, fps)} cx={650} cy={235}>
          <Pillola x={650} y={235} testo="Vero e non ingannevole" corpo={28} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 470 168 Q 380 250 430 350" p={tra(locale, formaggio - 10, formaggio + 2)} colore={TINTE.accento} />
        <Compare v={molla(locale, formaggio, fps)} cx={475} cy={415}>
          <Formaggio cx={470} cy={420} s={0.9} />
        </Compare>
        <Spunta cx={585} cy={395} r={26} p={tra(locale, quella, quella + 14)} />
        <Compare v={molla(locale, quella, fps)} cx={480} cy={530}>
          <Righe2 x={480} y={515} righe={["La tua attività:", "davvero quella"]} corpo={26} passo={32} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, banca, fps)} cx={790} cy={390}>
          <Lucchetto cx={712} cy={386} />
          <Pillola x={810} y={390} testo="banca" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, federale, fps)} cx={800} cy={478}>
          <Lucchetto cx={712} cy={474} />
          <Pillola x={826} y={478} testo="federale" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, nonTutti, fps)} cx={790} cy={565}>
          <Testo x={790} y={565} corpo={28} titolo peso={800} colore={TINTE.accento}>
            Non per tutti
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Niente parole che fanno pensare a una società: … non vanno bene «SA», «Sagl» o «e soci». Il titolare sei solo tu.» */
const PAROLE_SOCIETA = [
  { testo: "SA", x: 465 },
  { testo: "Sagl", x: 615 },
  { testo: "e soci", x: 800 },
] as const;
const dnSocieta: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.55),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.5, 0.55) + 6 },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.35, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tempi = [fra(ctx, 0, 1, 0.38, 0.45), fra(ctx, 0, 1, 0.58, 0.55), fra(ctx, 0, 1, 0.8, 0.65)];
    const solo = fra(ctx, 1, null, 0.2, 0.82);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Niente parole da società" />
        <Compare v={molla(locale, 4, fps)} cx={640} cy={175}>
          <Insegna cx={640} cy={175} corpo={40} pezzi={[{ testo: "Giulia Rossi" }]} fondo={TINTE.tratto} bordo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {PAROLE_SOCIETA.map((parola, i) => {
          const w = parola.testo.length * 34 * 0.56 + 34 * 1.3;
          return (
            <g key={parola.testo}>
              <Compare v={molla(locale, tempi[i], fps)} cx={parola.x} cy={335}>
                <Pillola x={parola.x} y={335} testo={parola.testo} corpo={34} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
              </Compare>
              <No cx={parola.x + w / 2 - 4} cy={300} r={20} p={tra(locale, tempi[i] + 8, tempi[i] + 20)} />
            </g>
          );
        })}
        <Compare v={molla(locale, solo, fps)} cx={640} cy={560}>
          <Persona x={505} y={650} s={0.72} />
          <Pillola x={740} y={575} testo="Il titolare: solo tu" corpo={28} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Una ditta iscritta nel registro di commercio è protetta: nello stesso luogo nessun altro può usarla. Nemmeno chi si chiama come te: chi arriva dopo deve aggiungere qualcosa …» */
const LUCA: readonly Pezzo[] = [{ testo: "Luca Rossi" }];
const dnLuogo: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.4, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.2) + 4 },
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.7, 0.45) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.4, 0.85) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const primo = fra(ctx, null, 0, 0.2, 0.1);
    const iscritta = fra(ctx, null, 0, 0.6, 0.2);
    const luogo = fra(ctx, 0, 1, 0.15, 0.3);
    const secondo = fra(ctx, 0, 1, 0.35, 0.35);
    const no = fra(ctx, 0, 1, 0.7, 0.45);
    const omonimo = fra(ctx, 1, 2, 0.3, 0.6);
    const aggiunta = fra(ctx, 2, null, 0.4, 0.85);
    const via = tra(locale, aggiunta, aggiunta + 10);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Nello stesso luogo" />
        <Compare v={molla(locale, luogo, fps, true)} cx={660} cy={360}>
          <rect x={335} y={110} width={650} height={530} rx={34} fill="none" stroke={TINTE.tratto} strokeWidth={5} strokeDasharray="16 14" opacity={0.6} />
          <Pillola x={660} y={110} testo="Stesso luogo" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, primo, fps)} cx={500} cy={440}>
          <Negozio x={500} y={540} s={0.9} />
          <Insegna cx={500} cy={372} corpo={30} pezzi={LUCA} />
        </Compare>
        <Compare v={molla(locale, iscritta, fps)} cx={500} cy={595}>
          <Timbro cx={612} cy={292} r={36} />
          <Pillola x={500} y={595} testo="Iscritta" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, secondo, fps)} cx={820} cy={440}>
          <Negozio x={820} y={540} s={0.9} />
          <Insegna cx={820} cy={372} corpo={30} pezzi={LUCA} />
        </Compare>
        <g opacity={1 - via}>
          <No cx={935} cy={340} r={22} p={tra(locale, no, no + 14)} />
        </g>
        <Spunta cx={935} cy={340} r={22} p={tra(locale, aggiunta + 6, aggiunta + 20)} />
        <Compare v={molla(locale, omonimo, fps)} cx={810} cy={595}>
          <Pillola x={810} y={595} testo="Stesso nome e cognome" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, aggiunta, fps)} cx={820} cy={262}>
          <line x1={820} y1={286} x2={820} y2={330} stroke={TINTE.ok} strokeWidth={6} strokeLinecap="round" />
          <Pillola x={820} y={262} testo="+ un'aggiunta" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Però, fra i nomi già iscritti, il registro controlla solo quelli uguali. Se il tuo è solo simile …, chi c'era prima può contestarlo davanti al giudice. E un nome non si può prenotare.» */
const dnSimili: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.75, 0.25) + 4 },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.6) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const uguali = fra(ctx, null, 0, 0.3, 0.1);
    const rifiuto = fra(ctx, null, 0, 0.75, 0.22);
    const simili = fra(ctx, 0, 1, 0.2, 0.3);
    const nonVisto = fra(ctx, 0, 1, 0.75, 0.4);
    const giudice = fra(ctx, 1, 2, 0.35, 0.6);
    const prenota = fra(ctx, 2, null, 0.3, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Uguale o simile" />
        <Compare v={molla(locale, uguali, fps)} cx={700} cy={175}>
          <Registro x={395} y={212} s={0.6} />
          <Insegna cx={578} cy={175} corpo={26} pezzi={[{ testo: "Rossi Bici" }]} />
          <Simbolo x={715} y={175} testo="=" />
          <Insegna cx={852} cy={175} corpo={26} pezzi={[{ testo: "Rossi Bici" }]} />
        </Compare>
        <Compare v={molla(locale, rifiuto, fps)} cx={715} cy={245}>
          <Pillola x={715} y={245} testo="Uguale: no" corpo={24} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, simili, fps)} cx={715} cy={345}>
          <Insegna cx={578} cy={345} corpo={26} pezzi={[{ testo: "Rossi Bici" }]} />
          <Simbolo x={715} y={343} testo="≈" colore={TINTE.accento} />
          <Insegna cx={852} cy={345} corpo={26} pezzi={[{ testo: "Rossi Bike" }]} />
        </Compare>
        <Compare v={molla(locale, nonVisto, fps)} cx={715} cy={415}>
          <Pillola x={715} y={415} testo="Simile: non controllato" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, giudice, fps)} cx={560} cy={525}>
          <Martelletto cx={420} cy={505} s={0.75} colpo={tra(locale, giudice + 10, giudice + 22)} />
          <Pillola x={670} y={525} testo="Decide il giudice" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, prenota, fps)} cx={720} cy={622}>
          <Pillola x={720} y={622} testo="Non si può prenotare" corpo={26} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

/* 9. «Per questo, prima di decidere, cerca il nome su Zefix, l'indice centrale delle ditte. È gratis e ti mostra le ditte iscritte con un nome uguale o simile.» */
const RISULTATI = [
  { nome: "Rossi Bici", etichetta: "uguale", colore: TINTE.rischio },
  { nome: "Rossi Bike", etichetta: "simile", colore: TINTE.accento },
  { nome: "Bici Rossi", etichetta: "simile", colore: TINTE.accento },
] as const;
const dnZefix: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.25),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.25) + 6 },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.12, 0.6) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const digita = fra(ctx, null, 0, 0.35, 0.15);
    const lettere = Math.round(5 * tra(locale, digita, digita + 18));
    const indice = fra(ctx, 0, 1, 0.15, 0.4);
    const gratis = fra(ctx, 1, null, 0.08, 0.55);
    const risultati = [fra(ctx, 1, null, 0.3, 0.65), fra(ctx, 1, null, 0.5, 0.75), fra(ctx, 1, null, 0.68, 0.85)];
    const cursore = Math.floor(locale / 8) % 2 === 0 && locale < digita + 40;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cerca su Zefix" />
        <Compare v={molla(locale, 4, fps, true)} cx={660} cy={350}>
          <rect x={350} y={95} width={620} height={510} rx={24} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <path d="M 353 150 V 119 q 0 -21 21 -21 H 946 q 21 0 21 21 V 150 Z" fill={TINTE.tinta} />
          {[382, 408, 434].map((x) => (
            <circle key={x} cx={x} cy={124} r={8} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={3} />
          ))}
          <Testo x={660} y={125} corpo={28} titolo peso={800} colore={TINTE.tratto}>
            Zefix
          </Testo>
          <rect x={390} y={178} width={540} height={66} rx={33} fill={TINTE.crema} stroke={TINTE.tratto} strokeWidth={4} />
          <Testo x={428} y={212} corpo={34} titolo peso={800} colore={TINTE.tratto} ancora="start">
            {"Rossi".slice(0, lettere)}
          </Testo>
          {cursore ? <rect x={430 + lettere * 20} y={192} width={4} height={40} rx={2} fill={TINTE.tratto} /> : null}
          <Lente cx={882} cy={206} r={17} />
        </Compare>
        <Compare v={molla(locale, indice, fps)} cx={660} cy={285}>
          <Testo x={660} y={285} corpo={26} titolo peso={800} colore={COLORE_TENUE}>
            Indice centrale delle ditte
          </Testo>
        </Compare>
        {RISULTATI.map((r, i) => {
          const y = 330 + i * 76;
          return (
            <Compare key={r.nome} v={molla(locale, risultati[i], fps)} cx={660} cy={y + 28}>
              <rect x={390} y={y} width={540} height={58} rx={16} fill={TINTE.carta} stroke={TINTE.tinta} strokeWidth={4} />
              <Testo x={418} y={y + 30} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
                {r.nome}
              </Testo>
              <Pillola x={850} y={y + 29} testo={r.etichetta} corpo={22} fondo={TINTE.carta} colore={r.colore} bordo={r.colore} />
            </Compare>
          );
        })}
        <Compare v={molla(locale, gratis, fps)} cx={890} cy={590}>
          <g transform="rotate(-8 890 590)">
            <Pillola x={890} y={590} testo="Gratis" corpo={30} fondo={TINTE.ok} colore={TINTE.carta} />
          </g>
        </Compare>
      </Tela>
    );
  },
};

/* 10. «La ditta non è protetta in automatico come marchio. Il marchio si registra all'IPI. Cerca … su Swissreg e … su SWITCH. È gratis, ma per i nomi simili l'IPI consiglia un professionista.» */
function Scheda({ x, nome, cosa, locale, da, fps }: { x: number; nome: string; cosa: string; locale: number; da: number; fps: number }) {
  return (
    <Compare v={molla(locale, da, fps)} cx={x + 145} cy={390}>
      <rect x={x} y={335} width={290} height={110} rx={22} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      <Lente cx={x + 44} cy={384} r={20} />
      <Testo x={x + 84} y={374} corpo={30} titolo peso={800} colore={TINTE.tratto} ancora="start">
        {nome}
      </Testo>
      <Testo x={x + 84} y={412} corpo={22} titolo peso={800} colore={COLORE_TENUE} ancora="start">
        {cosa}
      </Testo>
    </Compare>
  );
}
const dnMarchio: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.15),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.6, 0.15) + 4 },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.5, 0.55) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.12, 0.8) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const ditta = fra(ctx, null, 0, 0.2, 0.05);
    const diverso = fra(ctx, null, 0, 0.6, 0.12);
    const marchio = fra(ctx, null, 0, 0.78, 0.16);
    const ipi = fra(ctx, 0, 1, 0.35, 0.3);
    const swissreg = fra(ctx, 1, 2, 0.3, 0.45);
    const switchDomini = fra(ctx, 1, 2, 0.7, 0.55);
    const gratis = fra(ctx, 2, null, 0.06, 0.75);
    const professionista = fra(ctx, 2, null, 0.5, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La ditta non è un marchio" />
        <Compare v={molla(locale, ditta, fps)} cx={470} cy={190}>
          <Insegna cx={470} cy={170} corpo={30} pezzi={[{ testo: "Rossi Bici" }]} fondo={TINTE.tratto} bordo={TINTE.tratto} colore={TINTE.carta} />
          <Testo x={470} y={238} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Ditta
          </Testo>
        </Compare>
        <Compare v={molla(locale, diverso, fps)} cx={628} cy={170}>
          <Simbolo x={628} y={168} testo="≠" colore={TINTE.rischio} corpo={60} />
        </Compare>
        <Compare v={molla(locale, marchio, fps)} cx={760} cy={190}>
          <circle cx={760} cy={170} r={46} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={6} />
          <Testo x={761} y={172} corpo={50} titolo peso={800} colore={TINTE.accento}>
            R
          </Testo>
          <Testo x={760} y={238} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Marchio
          </Testo>
        </Compare>
        <Freccia d="M 812 150 Q 842 128 866 150" p={tra(locale, ipi - 8, ipi + 2)} colore={TINTE.accento} spessore={6} />
        <Compare v={molla(locale, ipi, fps)} cx={918} cy={190}>
          <Palazzo x={918} y={214} s={0.5} colore={TINTE.accento} />
          <Testo x={918} y={240} corpo={24} titolo peso={800} colore={TINTE.accento}>
            IPI
          </Testo>
        </Compare>
        <Scheda x={345} nome="Swissreg" cosa="marchi" locale={locale} da={swissreg} fps={fps} />
        <Scheda x={665} nome="SWITCH" cosa="nomi di dominio" locale={locale} da={switchDomini} fps={fps} />
        <Compare v={molla(locale, gratis, fps)} cx={655} cy={490}>
          <Pillola x={655} y={490} testo="Ricerche gratis" corpo={28} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, professionista, fps)} cx={700} cy={600}>
          <Persona x={470} y={680} s={0.68} colore={TEAL_CHIARO} />
          <Valigetta x={522} y={672} s={0.55} />
          <Testo x={570} y={590} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Per i nomi simili:
          </Testo>
          <Testo x={570} y={630} corpo={28} titolo peso={800} colore={TINTE.accento} ancora="start">
            un professionista
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 11. «Se non iscrivi la ditta nel registro di commercio, nel registro IDI compare con il tuo nome e cognome. Il nome di fantasia appare solo come «nome supplementare».» */
const dnIdi: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.45, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.45) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.6, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const senza = fra(ctx, null, 0, 0.3, 0.12);
    const scheda = fra(ctx, 0, 1, 0.1, 0.35);
    const ditta = fra(ctx, 0, 1, 0.45, 0.45);
    const fantasia = fra(ctx, 1, null, 0.2, 0.65);
    const supplementare = fra(ctx, 1, null, 0.62, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Nel registro IDI" />
        <Compare v={molla(locale, senza, fps)} cx={640} cy={175}>
          <Registro x={410} y={210} s={0.6} />
          <Testo x={478} y={176} corpo={28} titolo peso={800} colore={TINTE.rischio} ancora="start">
            Senza registro di commercio
          </Testo>
        </Compare>
        <Croce cx={410} cy={178} rx={40} ry={40} p={tra(locale, senza + 8, senza + 18)} spessore={9} />
        <Compare v={molla(locale, scheda, fps, true)} cx={660} cy={430}>
          <rect x={350} y={250} width={620} height={350} rx={24} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <path d="M 353 312 V 274 q 0 -21 21 -21 H 946 q 21 0 21 21 V 312 Z" fill={TINTE.tratto} />
          <Testo x={660} y={283} corpo={30} titolo peso={800} colore={TINTE.carta}>
            Registro IDI
          </Testo>
          <line x1={380} y1={445} x2={940} y2={445} stroke={TINTE.tinta} strokeWidth={4} />
        </Compare>
        <Compare v={molla(locale, ditta, fps)} cx={500} cy={378}>
          <rect x={372} y={328} width={576} height={102} rx={16} fill={TINTE.tinta} opacity={tra(locale, ditta + 10, ditta + 20)} />
          <Testo x={392} y={354} corpo={22} titolo peso={800} colore={COLORE_TENUE} ancora="start">
            Ditta
          </Testo>
          <Testo x={392} y={396} corpo={38} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Giulia Rossi
          </Testo>
        </Compare>
        <Compare v={molla(locale, fantasia, fps)} cx={500} cy={508}>
          <rect x={372} y={460} width={576} height={110} rx={16} fill={TINTE.crema} opacity={tra(locale, supplementare, supplementare + 10)} />
          <Testo x={392} y={488} corpo={22} titolo peso={800} colore={COLORE_TENUE} ancora="start" opacita={tra(locale, supplementare - 6, supplementare + 6)}>
            Nome supplementare
          </Testo>
          <Testo x={392} y={530} corpo={38} titolo peso={800} colore={TINTE.accento} ancora="start">
            Bici Veloci
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 12. «E se apri una Sagl o una SA? Il nome lo scegli liberamente, ma deve indicare la forma giuridica. E deve essere ben diverso dai nomi delle società già iscritte in Svizzera.» */
const dnSagl: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.6, 0.55),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.6, 0.55) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.5, 0.85) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const sagl = fra(ctx, null, 0, 0.25, 0.06);
    const sa = fra(ctx, null, 0, 0.7, 0.12);
    const nomeSagl = fra(ctx, 0, 1, 0.3, 0.3);
    const nomeSa = fra(ctx, 0, 1, 0.45, 0.4);
    const forma = fra(ctx, 0, 1, 0.8, 0.55);
    const svizzera = fra(ctx, 1, null, 0.45, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Sagl e SA" />
        <Compare v={molla(locale, sagl, fps)} cx={480} cy={250}>
          <Palazzo x={480} y={330} s={0.9} nome="Sagl" />
        </Compare>
        <Compare v={molla(locale, sa, fps)} cx={800} cy={250}>
          <Palazzo x={800} y={330} s={0.9} nome="SA" colore={TEAL_CHIARO} />
        </Compare>
        <Compare v={molla(locale, nomeSagl, fps)} cx={480} cy={405}>
          <Insegna cx={480} cy={405} corpo={28} pezzi={[{ testo: "Bici Veloci " }, { testo: "Sagl", colore: TINTE.accento }]} />
        </Compare>
        <Compare v={molla(locale, nomeSa, fps)} cx={800} cy={405}>
          <Insegna cx={800} cy={405} corpo={28} pezzi={[{ testo: "Pedali " }, { testo: "SA", colore: TINTE.accento }]} bordo={TEAL_CHIARO} />
        </Compare>
        <Compare v={molla(locale, forma, fps)} cx={640} cy={490}>
          <Pillola x={640} y={490} testo="Nome libero + forma giuridica" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, svizzera, fps)} cx={640} cy={580}>
          <Pillola x={640} y={580} testo="Ben diverso in tutta la Svizzera" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_NOME_DITTA: Record<string, Disegno> = {
  "ditta-nome-cognome": dnCognome,
  "ditta-nome-documento": dnDocumento,
  "ditta-nome-aggiunte": dnAggiunte,
  "ditta-nome-vero": dnVero,
  "ditta-nome-societa": dnSocieta,
  "ditta-nome-luogo": dnLuogo,
  "ditta-nome-simili": dnSimili,
  "ditta-nome-zefix": dnZefix,
  "ditta-nome-marchio": dnMarchio,
  "ditta-nome-idi": dnIdi,
  "ditta-nome-sagl": dnSagl,
};
