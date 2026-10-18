/**
 * I disegni della lezione 18 («Come tenere la contabilità»), vedi
 * src/lezioni/contabilita.ts. Fonti: CO artt. 957, 957a e 958f, LIFD
 * art. 125, pagine del Portale PMI (rendiconto annuale della ditta
 * individuale, conservazione elettronica dei libri di commercio) e lo
 * strumento «I tuoi conti» (src/app/conti). Coordinate della tela 1000×700;
 * l'angolo in basso a sinistra (x < 300, y > 480) è della finestra di Bleo.
 * Niente cifre: la soglia e gli anni li dice solo la voce (i dieci anni si
 * vedono come dieci tacche).
 */
import type { ReactNode } from "react";
import { Attrezzo, Auto, Casa, Compare, Foglio, Freccia, Lampadina, molla, Moneta, Negozio, Palazzo, Persona, Pillola, Registro, Righe, Salvadanaio, Spunta, Testo, TINTE, tra, Valigetta } from "../figure";
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

/** Uno scontrino con il bordo in basso a zig-zag (angolo in alto a sinistra in x, y). */
function Scontrino({ x, y, w = 80, h = 110, colore = TINTE.tratto }: { x: number; y: number; w?: number; h?: number; colore?: string }) {
  const denti = 5;
  const d = w / denti;
  let bordo = `M ${x} ${y + 10} q 0 -10 10 -10 H ${x + w - 10} q 10 0 10 10 V ${y + h}`;
  for (let i = 0; i < denti; i++) bordo += ` l ${-d / 2} -9 l ${-d / 2} 9`;
  bordo += " Z";
  return (
    <g>
      <path d={bordo} fill={TINTE.carta} stroke={colore} strokeWidth={5} strokeLinejoin="round" />
      {[0.24, 0.42, 0.6].map((f) => (
        <line key={f} x1={x + 14} y1={y + h * f} x2={x + w - (f === 0.42 ? 30 : 14)} y2={y + h * f} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
      ))}
      <line x1={x + 14} y1={y + h * 0.78} x2={x + w - 14} y2={y + h * 0.78} stroke={colore} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

/** Una carta bancaria centrata in (cx, cy): i soldi sul conto. */
function CartaBanca({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-58} y={-38} width={116} height={76} rx={12} fill={TINTE.tratto} />
      <rect x={-58} y={-22} width={116} height={14} fill="#0b4954" />
      <rect x={-44} y={2} width={26} height={20} rx={5} fill={TINTE.oro} />
      <line x1={-8} y1={20} x2={40} y2={20} stroke={TINTE.tinta} strokeWidth={6} strokeLinecap="round" />
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

/** Una busta chiusa centrata in (cx, cy): l'e-mail. */
function Busta({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-60} y={-40} width={120} height={80} rx={10} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d="M -56 -34 L 0 8 L 56 -34" fill="none" stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** Un computer portatile centrato in (cx, cy); lo schermo va dentro. */
function Portatile({ cx, cy, s = 1, children }: { cx: number; cy: number; s?: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-90} y={-72} width={180} height={116} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-90} y={-72} width={180} height={20} rx={10} fill={TINTE.tinta} />
      {children}
      <path d="M -112 48 H 112 l -14 16 H -98 Z" fill={TINTE.tratto} />
    </g>
  );
}

/** Una scatola d'archivio aperta (bordo in alto al centro in cx, y). Il contenuto va fra il retro e il davanti. */
function Scatola({ cx, y, w, h, children }: { cx: number; y: number; w: number; h: number; children?: ReactNode }) {
  return (
    <g>
      <path d={`M ${cx - w / 2 + 12} ${y} L ${cx - w / 2 + 30} ${y - 24} H ${cx + w / 2 - 30} L ${cx + w / 2 - 12} ${y} Z`} fill="#e9d4b8" stroke={TINTE.accento} strokeWidth={5} strokeLinejoin="round" />
      {children}
      <rect x={cx - w / 2} y={y} width={w} height={h} rx={14} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={6} />
      <rect x={cx - 42} y={y + h * 0.36} width={84} height={h * 0.3} rx={8} fill={TINTE.carta} stroke={TINTE.accento} strokeWidth={4} />
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

/** Una firma scritta a mano (si disegna con `p` da 0 a 1), a partire da (x, y). */
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

/** Una freccia piena verso l'alto (entrata) o verso il basso (uscita), centrata in (cx, cy). */
function FrecciaSoldi({ cx, cy, su, s = 1 }: { cx: number; cy: number; su: boolean; s?: number }) {
  const colore = su ? TINTE.ok : TINTE.rischio;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(${su ? 0 : 180})`}>
      <path d="M 0 -34 L 26 -6 H 10 V 32 H -10 V -6 H -26 Z" fill={colore} strokeLinejoin="round" />
    </g>
  );
}

/* 2. «Quale contabilità? Dipende dalla cifra d'affari dell'ultimo esercizio, cioè da quanto incassi. Sotto … ti basta quella semplificata. Da … in su serve quella completa. E una Sagl la tiene sempre completa.» */
const SOGLIA = { base: 560, linea: 360, a: { x: 440, cima: 450 }, b: { x: 620, cima: 220 }, w: 120 } as const;
const MONETE_A = [
  [418, 528],
  [462, 528],
  [440, 488],
] as const;
const MONETE_B = [
  [598, 528],
  [642, 528],
  [620, 488],
  [598, 448],
  [642, 448],
  [620, 408],
] as const;
const contSoglia: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.45, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.45, 0.45) },
      { tipo: "festeggia", quando: fra(ctx, 2, 3, 0.45, 0.65) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cifra = fra(ctx, null, 0, 0.6, 0.08);
    const crescono = fra(ctx, 0, 1, 0.1, 0.2);
    const monete = fra(ctx, 0, 1, 0.7, 0.3);
    const soglia = fra(ctx, 1, 2, 0.1, 0.4);
    const semplificata = fra(ctx, 1, 2, 0.45, 0.45);
    const completa = fra(ctx, 2, 3, 0.45, 0.65);
    const sagl = fra(ctx, 3, null, 0.25, 0.85);
    const hA = (SOGLIA.base - SOGLIA.a.cima) * tra(locale, crescono, crescono + 18);
    const hB = (SOGLIA.base - SOGLIA.b.cima) * tra(locale, crescono + 6, crescono + 30);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Quale contabilità?" />
        {/* La base e la cifra d'affari dell'ultimo esercizio. */}
        <Compare v={molla(locale, 4, fps, true)} cx={530} cy={SOGLIA.base}>
          <line x1={350} y1={SOGLIA.base} x2={720} y2={SOGLIA.base} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
        </Compare>
        <Compare v={molla(locale, cifra, fps)} cx={530} cy={612}>
          <Righe2 x={530} y={598} righe={["Cifra d'affari", "dell'ultimo esercizio"]} corpo={24} passo={30} />
        </Compare>
        {hA > 1 ? <rect x={SOGLIA.a.x - SOGLIA.w / 2} y={SOGLIA.base - hA} width={SOGLIA.w} height={hA} rx={12} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={6} /> : null}
        {hB > 1 ? <rect x={SOGLIA.b.x - SOGLIA.w / 2} y={SOGLIA.base - hB} width={SOGLIA.w} height={hB} rx={12} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={6} /> : null}
        {/* Quanto incassi: le monete dentro le barre. */}
        {[...MONETE_A, ...MONETE_B].map(([x, y], k) => (
          <Compare key={`${x}-${y}`} v={molla(locale, monete + k * 2, fps)} cx={x} cy={y}>
            <Moneta cx={x} cy={y} r={19} />
          </Compare>
        ))}
        {/* La soglia. */}
        <g opacity={tra(locale, soglia, soglia + 8)}>
          <line x1={350} y1={SOGLIA.linea} x2={725} y2={SOGLIA.linea} stroke={TINTE.rischio} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" />
        </g>
        <Compare v={molla(locale, soglia + 4, fps)} cx={790} cy={SOGLIA.linea}>
          <Pillola x={790} y={SOGLIA.linea} testo="Soglia" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        {/* Sotto: semplificata. Da lì in su: completa. */}
        <Compare v={molla(locale, semplificata, fps)} cx={SOGLIA.a.x} cy={410}>
          <Pillola x={SOGLIA.a.x} y={410} testo="Semplificata" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, completa, fps)} cx={SOGLIA.b.x} cy={180}>
          <Pillola x={SOGLIA.b.x} y={180} testo="Completa" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* La Sagl: sempre completa. */}
        <Compare v={molla(locale, sagl, fps)} cx={865} cy={520}>
          <Palazzo x={865} y={580} s={0.85} nome="Sagl" />
          <Pillola x={865} y={630} testo="Sempre completa" corpo={22} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «La contabilità semplificata ha due parti. Le entrate e le uscite … E il patrimonio: quello che la ditta possiede, come i soldi sul conto o gli attrezzi, e i debiti che ha.» */
const contParti: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.5, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.15) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.8, 0.9) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const colonna1 = fra(ctx, null, 0, 0.45, 0.1);
    const colonna2 = fra(ctx, null, 0, 0.8, 0.18);
    const entrate = fra(ctx, 0, 1, 0.3, 0.3);
    const uscite = fra(ctx, 0, 1, 0.7, 0.42);
    const possiede = fra(ctx, 1, 2, 0.5, 0.6);
    const conto = fra(ctx, 2, null, 0.12, 0.7);
    const attrezzi = fra(ctx, 2, null, 0.35, 0.78);
    const debiti = fra(ctx, 2, null, 0.72, 0.9);
    const cade = tra(locale, entrate + 4, entrate + 22);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Due parti" />
        {/* Prima parte: entrate e uscite. */}
        <Compare v={molla(locale, colonna1, fps)} cx={485} cy={115}>
          <Pillola x={485} y={115} testo="Entrate e uscite" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, colonna1 + 4, fps, true)} cx={485} cy={350}>
          <Salvadanaio x={480} y={430} s={1.25} />
        </Compare>
        {/* Entrata: la moneta cade nella fessura. */}
        <Compare v={molla(locale, entrate, fps)} cx={400} cy={215}>
          <FrecciaSoldi cx={400} cy={258} su s={0.8} />
          <Pillola x={400} y={198} testo="Entrate" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {cade > 0 && cade < 1 ? <Moneta cx={466} cy={180 + cade * 95} r={20} /> : null}
        {cade <= 0 && entrate <= locale ? <Moneta cx={466} cy={180} r={20} /> : null}
        {/* Uscita: una moneta esce. */}
        <Freccia d="M 575 420 Q 620 440 628 490" p={tra(locale, uscite, uscite + 12)} colore={TINTE.rischio} spessore={7} />
        <Compare v={molla(locale, uscite + 8, fps)} cx={600} cy={530}>
          <Moneta cx={630} cy={524} r={20} />
          <Pillola x={630} y={578} testo="Uscite" corpo={22} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        {/* Seconda parte: il patrimonio, come un conto a T. */}
        <Compare v={molla(locale, colonna2, fps)} cx={825} cy={115}>
          <Pillola x={825} y={115} testo="Patrimonio" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <g opacity={tra(locale, colonna2 + 4, colonna2 + 14)}>
          <line x1={680} y1={218} x2={970} y2={218} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
          <line x1={825} y1={168} x2={825} y2={500} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
        </g>
        <Compare v={molla(locale, possiede, fps)} cx={752} cy={192}>
          <Testo x={752} y={192} corpo={24} titolo peso={800} colore={TINTE.ok}>
            Possiede
          </Testo>
        </Compare>
        <Compare v={molla(locale, conto, fps)} cx={752} cy={290}>
          <CartaBanca cx={752} cy={290} s={0.95} />
        </Compare>
        <Compare v={molla(locale, attrezzi, fps)} cx={752} cy={420}>
          <g transform="translate(752 420) scale(1.8) translate(-752 -420)">
            <Attrezzo cx={752} cy={412} />
          </g>
        </Compare>
        <Compare v={molla(locale, debiti, fps)} cx={900} cy={320}>
          <Testo x={900} y={192} corpo={24} titolo peso={800} colore={TINTE.rischio}>
            Debiti
          </Testo>
          <Foglio x={852} y={250} w={96} h={120}>
            <Righe x={866} y={292} w={50} n={3} passo={22} />
          </Foglio>
          <Pillola x={900} y={410} testo="Da pagare" corpo={20} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Anche se è semplice, valgono le regole di una contabilità in ordine. Registri tutto, in modo completo e fedele. E per ogni registrazione hai un documento che la prova: una fattura, una ricevuta o un estratto conto.» */
const REGISTRO = { x: 330, y: 105, w: 280, h: 360, righe: [205, 295, 385] } as const;
const DOCUMENTI = [
  { y: 160, etichetta: "Fattura" },
  { y: 290, etichetta: "Ricevuta" },
  { y: 420, etichetta: "Estratto conto" },
] as const;
const contRegole: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.6, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.2) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.85, 0.92) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const registro = fra(ctx, null, 0, 0.3, 0.1);
    const righe = [fra(ctx, 0, 1, 0.1, 0.32), fra(ctx, 0, 1, 0.35, 0.38), fra(ctx, 0, 1, 0.6, 0.44)];
    const fedele = fra(ctx, 0, 1, 0.75, 0.48);
    const documenti = fra(ctx, 1, 2, 0.45, 0.6);
    const etichette = [fra(ctx, 2, null, 0.1, 0.75), fra(ctx, 2, null, 0.4, 0.82), fra(ctx, 2, null, 0.7, 0.9)];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Una contabilità in ordine" />
        {/* Il quaderno delle registrazioni. */}
        <Compare v={molla(locale, registro, fps, true)} cx={REGISTRO.x + REGISTRO.w / 2} cy={REGISTRO.y + REGISTRO.h / 2}>
          <rect x={REGISTRO.x} y={REGISTRO.y} width={REGISTRO.w} height={REGISTRO.h} rx={18} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <path d={`M ${REGISTRO.x + 3} ${REGISTRO.y + 52} V ${REGISTRO.y + 18} q 0 -15 15 -15 H ${REGISTRO.x + REGISTRO.w - 18} q 15 0 15 15 V ${REGISTRO.y + 52} Z`} fill={TINTE.tratto} />
          <Testo x={REGISTRO.x + REGISTRO.w / 2} y={REGISTRO.y + 29} corpo={24} titolo peso={800} colore={TINTE.carta}>
            Registrazioni
          </Testo>
        </Compare>
        {REGISTRO.righe.map((y, i) => (
          <Compare key={y} v={molla(locale, righe[i], fps)} cx={REGISTRO.x + 40} cy={y}>
            <FrecciaSoldi cx={REGISTRO.x + 38} cy={y} su={i !== 1} s={0.62} />
            <line x1={REGISTRO.x + 70} y1={y - 10} x2={REGISTRO.x + 200} y2={y - 10} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
            <line x1={REGISTRO.x + 70} y1={y + 14} x2={REGISTRO.x + 160} y2={y + 14} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
            <Spunta cx={REGISTRO.x + 240} cy={y} r={20} p={tra(locale, righe[i] + 8, righe[i] + 20)} />
          </Compare>
        ))}
        <Compare v={molla(locale, fedele, fps)} cx={470} cy={515}>
          <Pillola x={470} y={515} testo="Tutto, completo e fedele" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Per ogni registrazione, il suo documento. */}
        {DOCUMENTI.map((d, i) => {
          const da = REGISTRO.righe[i];
          return (
            <g key={d.etichetta}>
              <Freccia d={`M ${REGISTRO.x + REGISTRO.w + 8} ${da} C ${REGISTRO.x + REGISTRO.w + 40} ${da} ${REGISTRO.x + REGISTRO.w + 36} ${d.y} ${REGISTRO.x + REGISTRO.w + 62} ${d.y}`} p={tra(locale, documenti + i * 5, documenti + i * 5 + 12)} colore={TINTE.accento} spessore={6} />
              <Compare v={molla(locale, documenti + i * 5 + 6, fps)} cx={720} cy={d.y}>
                {i === 1 ? (
                  <Scontrino x={688} y={d.y - 52} w={66} h={102} />
                ) : (
                  <Foglio x={684} y={d.y - 50} w={78} h={100}>
                    {i === 0 ? <Righe x={696} y={d.y - 10} w={34} n={3} passo={20} /> : null}
                    {i === 2
                      ? [0, 1, 2].map((k) => (
                          <g key={k}>
                            <line x1={696} y1={d.y - 8 + k * 20} x2={720} y2={d.y - 8 + k * 20} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
                            <line x1={730} y1={d.y - 8 + k * 20} x2={748} y2={d.y - 8 + k * 20} stroke={k === 1 ? TINTE.rischio : TINTE.ok} strokeWidth={7} strokeLinecap="round" />
                          </g>
                        ))
                      : null}
                  </Foglio>
                )}
              </Compare>
              <Compare v={molla(locale, etichette[i], fps)} cx={790} cy={d.y}>
                <Testo x={786} y={d.y} corpo={i === 2 ? 26 : 28} titolo peso={800} colore={TINTE.tratto} ancora="start">
                  {d.etichetta}
                </Testo>
              </Compare>
            </g>
          );
        })}
      </Tela>
    );
  },
};

/* 5. «Il Portale PMI lo dice chiaro: separa bene il privato dalla ditta. Le tue spese private non le puoi mettere a carico della ditta. E le cose che usi per tutte e due, come l'auto, si dividono in proporzione.» */
const contPrivato: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.7, 0.25),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.7, 0.25) },
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.7, 0.55) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.75, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const privato = fra(ctx, null, 0, 0.35, 0.1);
    const ditta = fra(ctx, null, 0, 0.55, 0.18);
    const muro = fra(ctx, null, 0, 0.75, 0.25);
    const spesa = fra(ctx, 0, 1, 0.15, 0.4);
    const no = fra(ctx, 0, 1, 0.65, 0.55);
    const auto = fra(ctx, 1, null, 0.3, 0.75);
    const parti = fra(ctx, 1, null, 0.7, 0.88);
    const quota = tra(locale, parti, parti + 18);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Privato e ditta separati" />
        <Compare v={molla(locale, privato, fps)} cx={430} cy={230}>
          <Casa x={430} y={295} s={1.5} />
          <Pillola x={430} y={330} testo="Privato" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, ditta, fps)} cx={830} cy={230}>
          <Negozio x={830} y={290} s={0.85} />
          <Pillola x={830} y={330} testo="Ditta" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* Il muro fra i due. */}
        <line x1={630} y1={110} x2={630} y2={110 + 270 * tra(locale, muro, muro + 16)} stroke={TINTE.tratto} strokeWidth={8} strokeDasharray="18 14" strokeLinecap="round" />
        {/* Una spesa privata non passa alla ditta. */}
        <Compare v={molla(locale, spesa, fps)} cx={415} cy={430}>
          <Scontrino x={380} y={380} w={70} h={96} colore={TINTE.rischio} />
        </Compare>
        <Freccia d="M 470 430 Q 540 380 606 398" p={tra(locale, spesa + 8, spesa + 22)} colore={TINTE.rischio} spessore={7} />
        <No cx={630} cy={398} r={28} p={tra(locale, no, no + 14)} />
        <Compare v={molla(locale, no + 6, fps)} cx={430} cy={512}>
          <Pillola x={430} y={512} testo="Spese private" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        {/* L'auto usata per tutte e due: si divide in proporzione. */}
        <Compare v={molla(locale, auto, fps)} cx={640} cy={560}>
          <Auto x={640} y={605} s={1.5} />
        </Compare>
        {quota > 0 ? (
          <g opacity={Math.min(1, quota * 2)}>
            <rect x={510} y={622} width={260} height={30} rx={15} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={4} />
            <rect x={510 + 260 * 0.4} y={622} width={260 * 0.6 * quota} height={30} rx={15} fill={TINTE.accento} />
            <line x1={510 + 260 * 0.4} y1={614} x2={510 + 260 * 0.4} y2={660} stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" />
            <Testo x={498} y={638} corpo={22} titolo peso={800} colore={TINTE.tratto} ancora="end">
              privato
            </Testo>
            <Testo x={782} y={638} corpo={22} titolo peso={800} colore={TINTE.accento} ancora="start">
              ditta
            </Testo>
          </g>
        ) : null}
      </Tela>
    );
  },
};

/* 6. «A fine anno, la contabilità ti serve per la dichiarazione d'imposta. Con la contabilità completa alleghi i conti annuali firmati: il bilancio e il conto profitti e perdite. Con quella semplificata, invece, alleghi degli elenchi.» */
const contDichiarazione: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.45, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.2) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.85, 0.92) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const dichiarazione = fra(ctx, null, 0, 0.5, 0.15);
    const completa = fra(ctx, 0, 1, 0.2, 0.3);
    const firma = fra(ctx, 0, 1, 0.75, 0.42);
    const bilancio = fra(ctx, 1, 2, 0.15, 0.5);
    const profitti = fra(ctx, 1, 2, 0.55, 0.6);
    const allegaC = fra(ctx, 1, 2, 0.9, 0.66);
    const semplificata = fra(ctx, 2, null, 0.25, 0.78);
    const elenchi = fra(ctx, 2, null, 0.6, 0.86);
    const allegaS = fra(ctx, 2, null, 0.85, 0.92);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Per la dichiarazione d'imposta" />
        <Compare v={molla(locale, dichiarazione, fps)} cx={660} cy={200}>
          <Foglio x={585} y={88} w={150} h={180}>
            <rect x={600} y={108} width={86} height={22} rx={6} fill={TINTE.accento} />
            <Righe x={603} y={160} w={110} n={4} passo={24} />
          </Foglio>
          <Pillola x={660} y={302} testo="Dichiarazione d'imposta" corpo={22} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {/* Contabilità completa: i conti annuali firmati. */}
        <Compare v={molla(locale, completa, fps)} cx={470} cy={390}>
          <Pillola x={470} y={390} testo="Completa" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
          <Foglio x={340} y={425} w={122} h={150}>
            <Righe x={358} y={530} w={80} n={2} passo={24} />
          </Foglio>
          <Foglio x={478} y={425} w={132} h={150}>
            <Righe x={496} y={548} w={86} n={2} passo={20} />
          </Foglio>
        </Compare>
        <Compare v={molla(locale, bilancio, fps)} cx={398} cy={496}>
          <Testo x={398} y={496} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Bilancio
          </Testo>
        </Compare>
        <Compare v={molla(locale, profitti, fps)} cx={542} cy={502}>
          <Righe2 x={542} y={490} righe={["Profitti", "e perdite"]} corpo={21} passo={25} />
        </Compare>
        <Firma x={420} y={612} s={1} p={tra(locale, firma, firma + 20)} />
        <Freccia d="M 430 362 Q 430 230 572 196" p={tra(locale, allegaC, allegaC + 14)} colore={TINTE.accento} spessore={7} />
        {/* Contabilità semplificata: gli elenchi. */}
        <Compare v={molla(locale, semplificata, fps)} cx={845} cy={390}>
          <Pillola x={845} y={390} testo="Semplificata" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, elenchi, fps)} cx={845} cy={520}>
          {[0, 1, 2].map((k) => (
            <Foglio key={k} x={800 - k * 18} y={428 + k * 18} w={112} h={140}>
              <Righe x={814 - k * 18} y={480 + k * 18} w={60} n={3} passo={22} />
            </Foglio>
          ))}
          <Pillola x={845} y={632} testo="Elenchi" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 890 362 Q 890 230 748 196" p={tra(locale, allegaS, allegaS + 14)} colore={TINTE.ok} spessore={7} />
      </Tela>
    );
  },
};

/* 7. «Gli elenchi sono questi: le entrate e le uscite, la situazione del patrimonio, e i prelevamenti e gli apporti privati. Cioè quello che prendi dalla ditta per te, e quello che ci metti di tuo.» */
const ELENCHI = [
  { x: 345, righe: ["Entrate", "e uscite"] },
  { x: 575, righe: ["Situazione del", "patrimonio"] },
  { x: 805, righe: ["Prelevamenti e", "apporti privati"] },
] as const;
const contElenchi: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.7, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "tocca", quando: fra(ctx, null, 0, 0.6, 0.2) + 6, bersaglio: { x: 345, y: 190 } },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.8, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const fogli = [fra(ctx, null, 0, 0.55, 0.2), fra(ctx, 0, 1, 0.25, 0.4), fra(ctx, 0, 1, 0.7, 0.55)];
    const persone = fra(ctx, 1, null, 0.05, 0.66);
    const prendi = fra(ctx, 1, null, 0.3, 0.75);
    const metti = fra(ctx, 1, null, 0.72, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Gli elenchi dell'anno" />
        {ELENCHI.map((e, i) => (
          <Compare key={e.x} v={molla(locale, fogli[i], fps)} cx={e.x + 75} cy={200}>
            <Foglio x={e.x} y={95} w={150} h={170}>
              {i === 0 ? (
                <g>
                  <FrecciaSoldi cx={e.x + 50} cy={190} su s={0.8} />
                  <FrecciaSoldi cx={e.x + 100} cy={190} su={false} s={0.8} />
                </g>
              ) : null}
              {i === 1 ? (
                <g stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round">
                  <line x1={e.x + 25} y1={160} x2={e.x + 125} y2={160} />
                  <line x1={e.x + 75} y1={160} x2={e.x + 75} y2={240} />
                  <line x1={e.x + 35} y1={190} x2={e.x + 62} y2={190} stroke={TINTE.ok} strokeWidth={8} />
                  <line x1={e.x + 35} y1={214} x2={e.x + 58} y2={214} stroke={TINTE.ok} strokeWidth={8} />
                  <line x1={e.x + 88} y1={190} x2={e.x + 115} y2={190} stroke={TINTE.rischio} strokeWidth={8} />
                </g>
              ) : null}
              {i === 2 ? (
                <g>
                  <Persona x={e.x + 48} y={240} s={0.42} colore={TINTE.accento} />
                  <path d={`M ${e.x + 76} ${172} h 44 M ${e.x + 110} ${162} l 10 10 l -10 10`} fill="none" stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={`M ${e.x + 120} ${212} h -44 M ${e.x + 86} ${202} l -10 10 l 10 10`} fill="none" stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ) : null}
            </Foglio>
            <Righe2 x={e.x + 75} y={300} righe={[...e.righe]} corpo={22} passo={27} />
          </Compare>
        ))}
        {/* Tu e la ditta: quello che prendi e quello che metti. */}
        <Compare v={molla(locale, persone, fps)} cx={640} cy={560}>
          <Persona x={420} y={645} s={0.9} colore={TINTE.accento} />
          <Pillola x={420} y={455} testo="Tu" corpo={22} fondo={TINTE.accento} colore={TINTE.carta} />
          <Negozio x={850} y={650} s={0.78} targa="Ditta" />
        </Compare>
        <Freccia d="M 742 520 Q 612 460 492 520" p={tra(locale, prendi, prendi + 14)} colore={TINTE.accento} spessore={7} />
        <Compare v={molla(locale, prendi + 8, fps)} cx={617} cy={455}>
          <Moneta cx={617} cy={480} r={18} />
          <Testo x={617} y={438} corpo={22} titolo peso={800} colore={TINTE.accento}>
            Prelevamento
          </Testo>
        </Compare>
        <Freccia d="M 492 600 Q 612 660 742 600" p={tra(locale, metti, metti + 14)} colore={TINTE.ok} spessore={7} />
        <Compare v={molla(locale, metti + 8, fps)} cx={617} cy={640}>
          <Moneta cx={617} cy={628} r={18} />
          <Testo x={617} y={672} corpo={22} titolo peso={800} colore={TINTE.ok}>
            Apporto
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Poi conservi tutto per … anni: i libri della contabilità e i documenti, come le ricevute. I … anni partono dalla fine dell'esercizio, non dal giorno della ricevuta.» */
const LINEA = { y: 470, inizio: 470, passo: 46, tacche: 10 } as const;
const contAnni: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.35, 0.7),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.35) },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.8, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const scatola = fra(ctx, null, 0, 0.25, 0.08);
    const tacche = fra(ctx, null, 0, 0.5, 0.12);
    const fineTacche = fra(ctx, 0, 1, 0.3, 0.35);
    const libro = fra(ctx, 0, 1, 0.2, 0.3);
    const ricevute = fra(ctx, 0, 1, 0.7, 0.45);
    const fine = fra(ctx, 1, null, 0.3, 0.7);
    const giorno = fra(ctx, 1, null, 0.7, 0.88);
    const scendeLibro = tra(locale, libro, libro + 16);
    const scendeRicevuta = tra(locale, ricevute, ricevute + 16);
    const ogni = Math.max(2, (fineTacche - tacche) / LINEA.tacche);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Conserva tutto" />
        <Compare v={molla(locale, scatola, fps, true)} cx={660} cy={260}>
          <Scatola cx={660} y={210} w={250} h={130}>
            {libro <= locale ? (
              <g opacity={Math.min(1, scendeLibro * 3)}>
                <Registro x={615} y={110 + scendeLibro * 120} s={0.62} />
              </g>
            ) : null}
            {ricevute <= locale ? (
              <g opacity={Math.min(1, scendeRicevuta * 3)}>
                <Scontrino x={680} y={60 + scendeRicevuta * 110} w={62} h={92} />
              </g>
            ) : null}
          </Scatola>
          <Pillola x={660} y={378} testo="Libri e documenti" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* La linea del tempo, con una tacca per ogni anno. */}
        <g opacity={tra(locale, tacche - 6, tacche + 4)}>
          <line x1={340} y1={LINEA.y} x2={LINEA.inizio} y2={LINEA.y} stroke={COLORE_TENUE} strokeWidth={5} strokeDasharray="10 10" strokeLinecap="round" />
          <line x1={LINEA.inizio} y1={LINEA.y - 26} x2={LINEA.inizio} y2={LINEA.y + 26} stroke={TINTE.tratto} strokeWidth={8} strokeLinecap="round" />
        </g>
        <Freccia d={`M ${LINEA.inizio} ${LINEA.y} H ${LINEA.inizio + LINEA.passo * LINEA.tacche + 30}`} p={tra(locale, tacche, fineTacche + 6)} colore={TINTE.tratto} spessore={7} />
        {Array.from({ length: LINEA.tacche }, (_, k) => {
          const quando = tacche + ogni * (k + 1);
          return (
            <Compare key={k} v={molla(locale, quando, fps)} cx={LINEA.inizio + LINEA.passo * (k + 1)} cy={LINEA.y}>
              <circle cx={LINEA.inizio + LINEA.passo * (k + 1)} cy={LINEA.y} r={13} fill={TINTE.accento} stroke={TINTE.carta} strokeWidth={4} />
            </Compare>
          );
        })}
        {/* Si parte dalla fine dell'esercizio… */}
        <Compare v={molla(locale, fine, fps)} cx={LINEA.inizio} cy={500}>
          <Calendario cx={LINEA.inizio} cy={418} s={0.42} />
          <Pillola x={LINEA.inizio + 20} y={530} testo="Dalla fine dell'esercizio" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* …non dal giorno della ricevuta. */}
        <Compare v={molla(locale, giorno, fps)} cx={372} cy={410}>
          <Scontrino x={344} y={370} w={56} h={78} />
        </Compare>
        <No cx={398} cy={372} r={20} p={tra(locale, giorno + 8, giorno + 22)} />
      </Tela>
    );
  },
};

/* 9. «Puoi conservarli su carta o in digitale, ma devono restare sempre leggibili e corrispondere alle operazioni. Per il digitale ci sono regole precise: le spiega il Portale PMI.» */
const contDigitale: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.75, 0.25),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "tocca", quando: fra(ctx, 0, 1, 0.3, 0.45) + 6, bersaglio: { x: 352, y: 410 } },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.5, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const carta = fra(ctx, null, 0, 0.35, 0.12);
    const digitale = fra(ctx, null, 0, 0.75, 0.25);
    const leggibili = fra(ctx, 0, 1, 0.3, 0.45);
    const conformi = fra(ctx, 0, 1, 0.75, 0.6);
    const regole = fra(ctx, 1, null, 0.3, 0.8);
    const pmi = fra(ctx, 1, null, 0.75, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Su carta o in digitale" />
        <Compare v={molla(locale, carta, fps)} cx={440} cy={200}>
          <Foglio x={394} y={108} w={122} h={160} />
          <Foglio x={374} y={122} w={122} h={160}>
            <Righe x={390} y={180} w={70} n={4} passo={24} />
          </Foglio>
          <Pillola x={440} y={318} testo="Su carta" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, carta + 6, fps)} cx={605} cy={200}>
          <Testo x={605} y={200} corpo={26} peso={600} colore={COLORE_TENUE}>
            oppure
          </Testo>
        </Compare>
        <Compare v={molla(locale, digitale, fps)} cx={790} cy={200}>
          <Portatile cx={790} cy={210} s={1.05}>
            <Scontrino x={-26} y={-44} w={52} h={76} />
          </Portatile>
          <Pillola x={790} y={318} testo="In digitale" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {/* Le due condizioni. */}
        {[
          { t: leggibili, y: 410, testo: "Sempre leggibili" },
          { t: conformi, y: 476, testo: "Conformi alle operazioni" },
        ].map((r) => (
          <Compare key={r.testo} v={molla(locale, r.t, fps)} cx={380} cy={r.y}>
            <Spunta cx={380} cy={r.y} r={22} p={tra(locale, r.t + 4, r.t + 18)} />
            <Testo x={418} y={r.y + 1} corpo={30} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {r.testo}
            </Testo>
          </Compare>
        ))}
        {/* Per il digitale: regole precise. */}
        <Compare v={molla(locale, regole, fps)} cx={665} cy={570}>
          <Lampadina cx={420} cy={566} s={0.9} />
          <Pillola x={680} y={570} testo="Per il digitale: regole precise" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, pmi, fps)} cx={680} cy={628}>
          <Testo x={680} y={628} corpo={22} peso={700} colore={COLORE_TENUE}>
            Le spiega il Portale PMI
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Bleo ha uno strumento, «I tuoi conti». Fotografi le ricevute o le inoltri per email, Bleo le legge e tu confermi: della ditta o privato. A fine anno scarichi tutto in un file per il fiduciario. Una copia delle ricevute, però, tienila anche tu.» */
const TEL = { cx: 432, cy: 318, w: 196, h: 370 } as const;
const contStrumento: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.75, 0.55),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.1) },
      { tipo: "festeggia", quando: fra(ctx, 2, 3, 0.75, 0.8) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const telefono = fra(ctx, null, 0, 0.3, 0.06);
    const foto = fra(ctx, 0, 1, 0.2, 0.2);
    const email = fra(ctx, 0, 1, 0.65, 0.3);
    const legge = fra(ctx, 1, 2, 0.1, 0.4);
    const bottoni = fra(ctx, 1, 2, 0.5, 0.5);
    const conferma = fra(ctx, 1, 2, 0.8, 0.56);
    const file = fra(ctx, 2, 3, 0.2, 0.66);
    const fiduciario = fra(ctx, 2, 3, 0.6, 0.74);
    const copia = fra(ctx, 3, null, 0.2, 0.86);
    const scan = tra(locale, legge, legge + 22);
    const tocco = tra(locale, conferma, conferma + 12);
    const alto = TEL.cy - TEL.h / 2;
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
        {/* La ricevuta fotografata. */}
        <Compare v={molla(locale, foto, fps)} cx={TEL.cx} cy={alto + 140}>
          <Scontrino x={TEL.cx - 36} y={alto + 88} w={72} h={104} />
          {scan > 0 && scan < 1 ? <line x1={TEL.cx - 50} y1={alto + 90 + scan * 100} x2={TEL.cx + 50} y2={alto + 90 + scan * 100} stroke={TINTE.accento} strokeWidth={5} strokeLinecap="round" /> : null}
        </Compare>
        {/* …o inoltrata per email. */}
        <Compare v={molla(locale, email, fps)} cx={620} cy={170}>
          <Busta cx={620} cy={170} s={0.75} />
        </Compare>
        <Freccia d="M 610 210 Q 590 240 548 240" p={tra(locale, email + 6, email + 18)} colore={TINTE.tratto} spessore={6} />
        {/* Della ditta o privato. */}
        <Compare v={molla(locale, bottoni, fps)} cx={TEL.cx} cy={alto + 250}>
          <Pillola x={TEL.cx} y={alto + 236} testo="Della ditta" corpo={20} fondo={tocco > 0.5 ? TINTE.ok : TINTE.carta} colore={tocco > 0.5 ? TINTE.carta : TINTE.ok} bordo={TINTE.ok} />
          <Pillola x={TEL.cx} y={alto + 288} testo="Privato" corpo={20} fondo={TINTE.carta} colore={COLORE_TENUE} bordo={COLORE_TENUE} />
        </Compare>
        {tocco > 0 && tocco < 1 ? <circle cx={TEL.cx + 40} cy={alto + 236} r={14 + tocco * 30} fill="none" stroke={TINTE.accento} strokeWidth={5} opacity={1 - tocco} /> : null}
        {/* A fine anno: il file per il fiduciario. */}
        <Freccia d={`M ${TEL.cx + TEL.w / 2 + 10} 340 H 600`} p={tra(locale, file - 8, file + 4)} colore={TINTE.tratto} spessore={7} />
        <Compare v={molla(locale, file, fps)} cx={665} cy={340}>
          <Foglio x={608} y={268} w={118} h={146}>
            {[0, 1, 2, 3].map((k) => (
              <line key={k} x1={622} y1={330 + k * 20} x2={708} y2={330 + k * 20} stroke={TINTE.tinta} strokeWidth={4} />
            ))}
            <line x1={652} y1={320} x2={652} y2={396} stroke={TINTE.tinta} strokeWidth={4} />
            <rect x={620} y={288} width={52} height={20} rx={6} fill={TINTE.ok} />
          </Foglio>
        </Compare>
        <Freccia d="M 736 340 H 806" p={tra(locale, fiduciario - 8, fiduciario + 4)} colore={TINTE.tratto} spessore={7} />
        <Compare v={molla(locale, fiduciario, fps)} cx={880} cy={340}>
          <Persona x={880} y={430} s={0.95} colore={TINTE.tratto} />
          <Valigetta x={936} y={420} s={0.62} />
          <Pillola x={866} y={474} testo="Per il fiduciario" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {/* Una copia la tieni anche tu. */}
        <Compare v={molla(locale, copia, fps)} cx={700} cy={590}>
          <Scatola cx={630} y={575} w={140} h={80}>
            <Scontrino x={606} y={530} w={50} h={70} />
          </Scatola>
          <Pillola x={830} y={600} testo="Una copia per te" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_CONTABILITA: Record<string, Disegno> = {
  "cont-soglia": contSoglia,
  "cont-parti": contParti,
  "cont-regole": contRegole,
  "cont-privato": contPrivato,
  "cont-dichiarazione": contDichiarazione,
  "cont-elenchi": contElenchi,
  "cont-anni": contAnni,
  "cont-digitale": contDigitale,
  "cont-strumento": contStrumento,
};
