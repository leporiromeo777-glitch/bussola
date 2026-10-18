/**
 * I disegni della lezione 12 («Sei assicurato contro gli infortuni?»), vedi
 * src/lezioni/assicurazione-infortuni.ts. Fonti: LAINF (artt. 1a, 3, 4,
 * 16-17, 91), OAINF (artt. 13, 134-135, 138), LAMal (artt. 1a, 8, 10, 28,
 * 64), promemoria AVS 2.02, pagine della Suva, del Portale PMI e dell'UFSP.
 * Coordinate della tela 1000×700; l'angolo in basso a sinistra (x < 300,
 * y > 480) è della finestra di Bleo. Niente cifre: ore, giorni e importi li
 * dice solo la voce.
 */
import { Compare, Fumetto, Freccia, molla, Moneta, Palazzo, Persona, Pillola, Righe, Scudo, Spunta, TEAL_CHIARO, Testo, TINTE, tra, Valigetta } from "../figure";
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

/** La tessera della cassa malati (angolo in alto a sinistra in x, y). */
function Tessera({ x, y, w = 220, h = 140 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={x + 3} y={y + h * 0.19} width={w - 6} height={h * 0.17} fill={TINTE.tinta} />
      <Croce cx={x + h * 0.31} cy={y + h * 0.71} r={h * 0.16} />
      <Righe x={x + h * 0.6} y={y + h * 0.63} w={w - h * 0.83} n={2} passo={h * 0.17} />
    </g>
  );
}

/** Lo scudo vuoto, tratteggiato, con il punto di domanda: nessuna copertura. */
function ScudoVuoto({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M 0 -60 L 46 -44 V -10 Q 46 26 0 46 Q -46 26 -46 -10 V -44 Z"
        fill={TINTE.carta}
        stroke={COLORE_TENUE}
        strokeWidth={5}
        strokeDasharray="10 8"
        strokeLinejoin="round"
      />
      <Testo x={0} y={-4} corpo={46} titolo peso={800} colore={COLORE_TENUE}>
        ?
      </Testo>
    </g>
  );
}

/** Un cerotto storto: l'infortunio. */
function Cerotto({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-30)`}>
      <rect x={-78} y={-24} width={156} height={48} rx={24} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
      <rect x={-26} y={-24} width={52} height={48} fill={TINTE.oro} opacity={0.55} />
      <rect x={-26} y={-24} width={52} height={48} fill="none" stroke={TINTE.accento} strokeWidth={4} />
      {[-58, -44, 44, 58].map((x) => (
        <circle key={x} cx={x} cy={0} r={3.5} fill={TINTE.accento} />
      ))}
    </g>
  );
}

/** Una bicicletta: il tempo libero. */
function Bici({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} fill="none" stroke={TINTE.accento} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={-44} cy={10} r={28} />
      <circle cx={44} cy={10} r={28} />
      <path d="M -44 10 L -14 -30 H 26 L 44 10 M -14 -30 L 4 10 L 26 -30 M -44 10 H 4" />
      <path d="M -22 -40 H -4 M 26 -30 L 20 -46 H 32" />
    </g>
  );
}

/** Un casco da cantiere: l'edilizia. */
function Casco({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M -52 8 Q -52 -50 0 -52 Q 52 -50 52 8 Z" fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-12} y={-62} width={24} height={36} rx={8} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={5} />
      <rect x={-70} y={4} width={140} height={16} rx={8} fill={TINTE.accento} />
    </g>
  );
}

/** Un computer portatile: un'attività in un altro settore. */
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

/** Un orologio da muro, senza numeri: le ore di lavoro. */
function Orologio({ cx, cy, r = 34, locale }: { cx: number; cy: number; r?: number; locale: number }) {
  const a = (locale / 40) * Math.PI;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={cx + Math.cos((i * Math.PI) / 2) * r * 0.72} cy={cy + Math.sin((i * Math.PI) / 2) * r * 0.72} r={3} fill={TINTE.tratto} />
      ))}
      <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.5} stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.sin(a) * r * 0.66} y2={cy - Math.cos(a) * r * 0.66} stroke={TINTE.accento} strokeWidth={4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill={TINTE.tratto} />
    </g>
  );
}

/** Un calendario da muro, con i giorni che passano (`p` da 0 a 1 li colora uno alla volta). */
function Calendario({ cx, cy, p = 0 }: { cx: number; cy: number; p?: number }) {
  const giorni = 12;
  return (
    <g>
      <rect x={cx - 64} y={cy - 60} width={128} height={124} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={cx - 64} y={cy - 60} width={128} height={34} rx={14} fill={TINTE.accento} />
      {Array.from({ length: giorni }, (_, k) => {
        const r = Math.floor(k / 4);
        const c = k % 4;
        return <rect key={k} x={cx - 48 + c * 26} y={cy - 12 + r * 24} width={18} height={14} rx={4} fill={k < p * giorni ? TINTE.accento : TINTE.tinta} />;
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

/* 2. «Chi lavora come dipendente in Svizzera, per legge, è assicurato contro gli infortuni sul lavoro. Se lavora almeno … ore alla settimana per lo stesso datore, è coperto anche nel tempo libero.» */
const infDipendente: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.55, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.55, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.55, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const dipendente = fra(ctx, null, 0, 0.25, 0.1);
    const lavoro = fra(ctx, 0, 1, 0.5, 0.4);
    const ore = fra(ctx, 1, 2, 0.4, 0.6);
    const libero = fra(ctx, 2, null, 0.4, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Da dipendente" />
        <Compare v={molla(locale, 6, fps, true)} cx={410} cy={300}>
          <Palazzo x={410} y={370} s={0.72} colore={TINTE.accento} />
          <Pillola x={410} y={412} testo="Datore" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, dipendente, fps)} cx={580} cy={330}>
          <Persona x={580} y={400} s={0.9} colore={TEAL_CHIARO} />
          <Valigetta x={636} y={372} s={0.55} />
          <Pillola x={580} y={442} testo="Dipendente" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 650 220 Q 690 180 740 180" p={tra(locale, lavoro - 8, lavoro + 4)} />
        <Compare v={molla(locale, lavoro, fps)} cx={840} cy={190}>
          <Scudo x={800} y={190} s={0.95} />
          <Valigetta x={905} y={215} s={0.75} />
          <Testo x={840} y={275} corpo={28} titolo peso={800} colore={TINTE.ok}>
            Sul lavoro
          </Testo>
        </Compare>
        <Compare v={molla(locale, ore, fps)} cx={580} cy={545}>
          <Orologio cx={410} cy={545} locale={locale} />
          <Testo x={460} y={547} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Abbastanza ore, stesso datore
          </Testo>
        </Compare>
        <Freccia d="M 650 400 Q 700 430 740 420" p={tra(locale, libero - 8, libero + 4)} />
        <Compare v={molla(locale, libero, fps)} cx={840} cy={410}>
          <Scudo x={800} y={410} s={0.95} />
          <Bici cx={912} cy={430} s={0.62} />
          <Testo x={840} y={495} corpo={28} titolo peso={800} colore={TINTE.ok}>
            Nel tempo libero
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Da indipendente, invece, nessuno ti assicura in automatico: la legge non ti obbliga. Però puoi assicurarti … a titolo facoltativo.» */
const infIndipendente: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.55, 0.8),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.75, 0.35) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.55, 0.8) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const nessuno = fra(ctx, null, 0, 0.6, 0.3);
    const obbligo = fra(ctx, 0, 1, 0.3, 0.5);
    const facoltativa = fra(ctx, 1, null, 0.5, 0.8);
    const pieno = tra(locale, facoltativa, facoltativa + 10);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Da indipendente" />
        <Compare v={molla(locale, 6, fps, true)} cx={430} cy={380}>
          <Persona x={430} y={400} colore={TINTE.accento} />
          <Computer cx={430} cy={500} s={0.7} />
          <Pillola x={430} y={590} testo="In proprio" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, nessuno, fps)} cx={760} cy={220}>
          <g opacity={1 - pieno}>
            <ScudoVuoto x={760} y={220} s={1.5} />
          </g>
          <Compare v={molla(locale, facoltativa, fps)} cx={760} cy={220}>
            <Scudo x={760} y={220} s={1.5} />
          </Compare>
        </Compare>
        <Compare v={molla(locale, obbligo, fps)} cx={760} cy={370}>
          <Pillola x={760} y={370} testo="Nessun obbligo" corpo={28} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Compare v={molla(locale, facoltativa + 6, fps)} cx={760} cy={470}>
          <Pillola x={760} y={470} testo="Facoltativa: decidi tu" corpo={30} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Se non ti assicuri, gli infortuni li copre la cassa malati, come una malattia. Paga le cure, ma con la franchigia e la tua parte dei costi.» */
const infCassaMalati: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.55, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.55, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 0, null, 0.5, 0.75) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cassa = fra(ctx, null, 0, 0.45, 0.3);
    const malattia = fra(ctx, null, 0, 0.8, 0.45);
    const cure = fra(ctx, 0, null, 0.15, 0.6);
    const franchigia = fra(ctx, 0, null, 0.5, 0.75);
    const parte = fra(ctx, 0, null, 0.75, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Senza assicurazione infortuni" />
        <Compare v={molla(locale, 6, fps)} cx={420} cy={230}>
          <Cerotto cx={420} cy={220} s={1.1} />
          <Testo x={420} y={310} corpo={28} titolo peso={800} colore={TINTE.accento}>
            Un infortunio
          </Testo>
        </Compare>
        <Freccia d="M 520 220 Q 560 200 600 210" p={tra(locale, cassa - 8, cassa + 4)} />
        <Compare v={molla(locale, cassa, fps)} cx={750} cy={210}>
          <Tessera x={630} y={140} w={240} h={150} />
          <Testo x={750} y={330} corpo={28} titolo peso={800} colore={TINTE.tratto}>
            La cassa malati
          </Testo>
        </Compare>
        <Compare v={molla(locale, malattia, fps)} cx={750} cy={375}>
          <Testo x={750} y={375} corpo={24} peso={600} colore={COLORE_TENUE}>
            come per una malattia
          </Testo>
        </Compare>
        <Compare v={molla(locale, cure, fps)} cx={480} cy={470}>
          <Croce cx={400} cy={470} r={30} />
          <Testo x={444} y={472} corpo={30} titolo peso={800} colore={TINTE.ok} ancora="start">
            Paga le cure
          </Testo>
        </Compare>
        <Compare v={molla(locale, franchigia, fps)} cx={480} cy={570}>
          <Moneta cx={400} cy={570} r={28} />
          <Testo x={444} y={572} corpo={28} titolo peso={800} colore={TINTE.accento} ancora="start">
            Franchigia
          </Testo>
        </Compare>
        <Compare v={molla(locale, parte, fps)} cx={750} cy={570}>
          <Moneta cx={670} cy={570} r={28} />
          <Testo x={714} y={572} corpo={28} titolo peso={800} colore={TINTE.accento} ancora="start">
            La tua parte
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Però l'assicurazione di base della cassa malati non paga il guadagno che perdi. Quella infortuni, se non puoi lavorare, ti dà un'indennità giornaliera …» */
const COLONNE = { cassa: 430, infortuni: 850, etichette: 640 } as const;
const RIGHE_DIFFERENZA = { cure: 330, guadagno: 450 } as const;
const infDifferenza: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.45, 0.8),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.8, 0.4) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.45, 0.8) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const guadagno = fra(ctx, null, 0, 0.6, 0.3);
    const no = fra(ctx, null, 0, 0.85, 0.4);
    const infortuni = fra(ctx, 0, 1, 0.3, 0.55);
    const si = fra(ctx, 1, null, 0.35, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La differenza" />
        <Compare v={molla(locale, 4, fps)} cx={COLONNE.cassa} cy={170}>
          <Tessera x={COLONNE.cassa - 80} y={115} w={160} h={100} />
          <Testo x={COLONNE.cassa} y={250} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Cassa malati
          </Testo>
        </Compare>
        <Compare v={molla(locale, 10, fps)} cx={COLONNE.etichette} cy={RIGHE_DIFFERENZA.cure}>
          <Testo x={COLONNE.etichette} y={RIGHE_DIFFERENZA.cure} corpo={28} titolo peso={800} colore={COLORE_TENUE}>
            Le cure
          </Testo>
          <Spunta cx={COLONNE.cassa} cy={RIGHE_DIFFERENZA.cure} r={28} p={tra(locale, 14, 26)} />
        </Compare>
        <Compare v={molla(locale, guadagno, fps)} cx={COLONNE.etichette} cy={RIGHE_DIFFERENZA.guadagno}>
          <Testo x={COLONNE.etichette} y={RIGHE_DIFFERENZA.guadagno - 16} corpo={28} titolo peso={800} colore={COLORE_TENUE}>
            Il guadagno
          </Testo>
          <Testo x={COLONNE.etichette} y={RIGHE_DIFFERENZA.guadagno + 18} corpo={28} titolo peso={800} colore={COLORE_TENUE}>
            che perdi
          </Testo>
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={COLONNE.cassa} cy={RIGHE_DIFFERENZA.guadagno}>
          <No cx={COLONNE.cassa} cy={RIGHE_DIFFERENZA.guadagno} r={28} />
        </Compare>
        <Compare v={molla(locale, infortuni, fps)} cx={COLONNE.infortuni} cy={170}>
          <Scudo x={COLONNE.infortuni} y={170} s={0.9} />
          <Testo x={COLONNE.infortuni} y={250} corpo={26} titolo peso={800} colore={TINTE.ok}>
            Infortuni
          </Testo>
          <Spunta cx={COLONNE.infortuni} cy={RIGHE_DIFFERENZA.cure} r={28} p={tra(locale, infortuni + 6, infortuni + 18)} />
        </Compare>
        <Spunta cx={COLONNE.infortuni} cy={RIGHE_DIFFERENZA.guadagno} r={28} p={tra(locale, si, si + 14)} />
        <Compare v={molla(locale, si + 4, fps)} cx={760} cy={570}>
          <Moneta cx={572} cy={570} r={26} />
          <Pillola x={800} y={570} testo="Indennità giornaliera" corpo={28} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Dove ti assicuri? Nei settori della Suva, come l'edilizia, c'è la sua assicurazione per imprenditori. Negli altri settori … assicuratori privati e … casse malati.» */
const DOVE = { suva: 590, altri: 845 } as const;
const infDove: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.5) },
      { tipo: "lancia", quando: fra(ctx, 2, null, 0.55, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const edilizia = fra(ctx, 0, 1, 0.3, 0.3);
    const suva = fra(ctx, 1, 2, 0.3, 0.45);
    const altri = fra(ctx, 2, null, 0.15, 0.65);
    const privati = fra(ctx, 2, null, 0.55, 0.8);
    const casse = fra(ctx, 2, null, 0.85, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Dove ti assicuri?" />
        <Compare v={molla(locale, 6, fps, true)} cx={380} cy={330}>
          <Persona x={380} y={420} s={0.95} colore={TINTE.accento} />
          <Fumetto cx={440} cy={170} r={34}>
            <Testo x={440} y={172} corpo={40} titolo peso={800} colore={TINTE.tratto}>
              ?
            </Testo>
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, edilizia, fps)} cx={DOVE.suva} cy={170}>
          <Casco cx={DOVE.suva} cy={170} s={0.95} />
          <Testo x={DOVE.suva} y={232} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Settori della Suva
          </Testo>
        </Compare>
        <Freccia d={`M ${DOVE.suva} 258 V 300`} p={tra(locale, suva - 8, suva + 2)} />
        <Compare v={molla(locale, suva, fps)} cx={DOVE.suva} cy={400}>
          <Palazzo x={DOVE.suva} y={470} s={0.66} nome="Suva" />
          <Righe2 x={DOVE.suva} y={510} righe={["Assicurazione", "per imprenditori"]} corpo={24} passo={30} />
        </Compare>
        <Compare v={molla(locale, altri, fps)} cx={DOVE.altri} cy={170}>
          <Computer cx={DOVE.altri} cy={170} s={0.75} />
          <Testo x={DOVE.altri} y={232} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Altri settori
          </Testo>
        </Compare>
        <Freccia d={`M ${DOVE.altri} 258 V 300`} p={tra(locale, privati - 8, privati + 2)} />
        <Compare v={molla(locale, privati, fps)} cx={DOVE.altri} cy={350}>
          <Pillola x={DOVE.altri} y={350} testo="Assicuratori privati" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, casse, fps)} cx={DOVE.altri} cy={430}>
          <Pillola x={DOVE.altri} y={430} testo="Casse malati" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Il premio si calcola sul guadagno che assicuri: lo concordi con l'assicuratore, in base al tuo reddito. Però c'è un minimo: … nel …, … dal ….» */
const BARRA = { x: 360, y: 450, w: 600, h: 44 } as const;
const infPremio: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.25, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.25) },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.3, 0.65) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const guadagno = fra(ctx, null, 0, 0.5, 0.2);
    const premio = fra(ctx, null, 0, 0.8, 0.3);
    const concordi = fra(ctx, 0, 1, 0.3, 0.45);
    const minimo = fra(ctx, 1, null, 0.2, 0.6);
    const scende = fra(ctx, 1, null, 0.7, 0.85);
    const riempi = tra(locale, guadagno, guadagno + 20);
    const posMinimo = 0.45 - 0.15 * tra(locale, scende, scende + 16);
    const xMinimo = BARRA.x + BARRA.w * posMinimo;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Quanto costa?" />
        <Compare v={molla(locale, 6, fps, true)} cx={430} cy={260}>
          <Persona x={430} y={340} s={0.85} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, concordi, fps)} cx={640} cy={240}>
          <Freccia d="M 500 250 Q 540 230 570 240" p={tra(locale, concordi, concordi + 10)} />
          <rect x={585} y={170} width={110} height={140} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <Righe x={605} y={205} w={70} n={3} passo={24} />
          <Freccia d="M 780 240 Q 740 230 710 240" p={tra(locale, concordi, concordi + 10)} />
          <Testo x={640} y={345} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Lo concordi
          </Testo>
        </Compare>
        <Compare v={molla(locale, concordi + 4, fps, true)} cx={860} cy={250}>
          <Palazzo x={860} y={320} s={0.62} />
          <Testo x={860} y={345} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Assicuratore
          </Testo>
        </Compare>
        {/* La barra del guadagno assicurato e, dentro, il premio. */}
        <Compare v={molla(locale, guadagno, fps)} cx={BARRA.x + BARRA.w / 2} cy={BARRA.y}>
          <Testo x={BARRA.x} y={BARRA.y - 36} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Guadagno assicurato
          </Testo>
          <rect x={BARRA.x} y={BARRA.y} width={BARRA.w} height={BARRA.h} rx={BARRA.h / 2} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <rect x={BARRA.x + 5} y={BARRA.y + 5} width={(BARRA.w - 10) * 0.72 * riempi} height={BARRA.h - 10} rx={(BARRA.h - 10) / 2} fill={TINTE.tinta} />
        </Compare>
        <Compare v={molla(locale, premio, fps)} cx={BARRA.x + 80} cy={BARRA.y + 175}>
          <Moneta cx={BARRA.x + 30} cy={BARRA.y + 175} r={26} />
          <Testo x={BARRA.x + 68} y={BARRA.y + 177} corpo={26} titolo peso={800} colore={TINTE.accento} ancora="start">
            Il premio ne è una parte
          </Testo>
        </Compare>
        {/* Il minimo: una tacca rossa, con l'etichetta sotto la barra, che poi si sposta a sinistra. */}
        <Compare v={molla(locale, minimo, fps)} cx={xMinimo} cy={BARRA.y + BARRA.h / 2}>
          <line x1={xMinimo} y1={BARRA.y - 12} x2={xMinimo} y2={BARRA.y + BARRA.h + 12} stroke={TINTE.rischio} strokeWidth={8} strokeLinecap="round" />
          <Pillola x={xMinimo} y={BARRA.y + BARRA.h + 42} testo="Minimo" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Compare v={molla(locale, scende, fps)} cx={830} cy={BARRA.y + BARRA.h + 42}>
          <Freccia d={`M 900 ${BARRA.y + BARRA.h + 42} H 770`} p={tra(locale, scende, scende + 12)} colore={TINTE.rischio} />
          <Testo x={835} y={BARRA.y + BARRA.h + 80} corpo={24} titolo peso={800} colore={TINTE.rischio}>
            Poi scende
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Lasci un lavoro da dipendente? L'assicurazione del datore ti copre ancora … giorni dopo la fine del salario. Poi … la cassa malati: avvisala, se no può chiederti i premi arretrati.» */
const infLasciLavoro: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.4, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.4) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.4, 0.85) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const esce = fra(ctx, null, 0, 0.3, 0.1);
    const copre = fra(ctx, 0, 1, 0.25, 0.3);
    const giorni = fra(ctx, 0, 1, 0.55, 0.4);
    const finisce = fra(ctx, 0, 1, 0.95, 0.5);
    const cassa = fra(ctx, 1, 2, 0.4, 0.65);
    const avvisa = fra(ctx, 2, null, 0.3, 0.85);
    const cammina = tra(locale, esce, esce + 24);
    const xPersona = 470 + 110 * cammina;
    const svanisce = tra(locale, finisce, finisce + 14);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Se lasci un lavoro" />
        <Compare v={molla(locale, 4, fps, true)} cx={400} cy={300}>
          <Palazzo x={400} y={370} s={0.7} colore={TINTE.accento} />
          <Pillola x={400} y={410} testo="Datore" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Persona x={xPersona} y={420} s={0.85} colore={TEAL_CHIARO} passo={cammina > 0 && cammina < 1 ? locale / 2.5 : undefined} />
        <Compare v={molla(locale, copre, fps)} cx={580} cy={170}>
          <g opacity={1 - svanisce * 0.85}>
            <Scudo x={580} y={170} s={0.8} />
          </g>
        </Compare>
        <Compare v={molla(locale, giorni, fps)} cx={780} cy={190}>
          <Calendario cx={780} cy={190} p={tra(locale, giorni + 6, finisce)} />
          <Testo x={780} y={290} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Ancora per un po'
          </Testo>
        </Compare>
        <Freccia d="M 650 400 Q 690 420 720 450" p={tra(locale, cassa - 8, cassa + 4)} />
        <Compare v={molla(locale, cassa, fps)} cx={840} cy={470}>
          <Tessera x={730} y={400} w={220} h={140} />
        </Compare>
        <Compare v={molla(locale, avvisa, fps)} cx={640} cy={610}>
          <Busta x={400} y={580} w={70} h={52} />
          <Pillola x={680} y={606} testo="Avvisa la cassa malati" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 9. «Tieni anche un lavoro da dipendente, di almeno … ore alla settimana? Allora il datore ti assicura anche nel tempo libero. Per l'attività in proprio chiedi … : puoi anche assicurarla a titolo facoltativo.» */
const infPartTime: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.5, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const dipendente = fra(ctx, null, 0, 0.2, 0.1);
    const proprio = fra(ctx, null, 0, 0.55, 0.25);
    const libero = fra(ctx, 0, 1, 0.45, 0.4);
    const domanda = fra(ctx, 1, 2, 0.4, 0.65);
    const facoltativa = fra(ctx, 2, null, 0.45, 0.85);
    const pieno = tra(locale, facoltativa, facoltativa + 10);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Anche dipendente?" />
        <Compare v={molla(locale, 4, fps, true)} cx={640} cy={460}>
          <Persona x={640} y={560} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, dipendente, fps)} cx={440} cy={330}>
          <Palazzo x={440} y={400} s={0.6} colore={TEAL_CHIARO} />
          <Pillola x={440} y={436} testo="Da dipendente" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, proprio, fps)} cx={850} cy={340}>
          <Computer cx={850} cy={350} s={0.7} />
          <Pillola x={850} y={436} testo="In proprio" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, libero, fps)} cx={440} cy={160}>
          <Scudo x={400} y={160} s={0.85} />
          <Bici cx={500} cy={178} s={0.55} />
          <Testo x={440} y={235} corpo={24} titolo peso={800} colore={TINTE.ok}>
            Anche nel tempo libero
          </Testo>
        </Compare>
        <Compare v={molla(locale, domanda, fps)} cx={850} cy={160}>
          <g opacity={1 - pieno}>
            <ScudoVuoto x={850} y={160} s={0.95} />
          </g>
          <Compare v={molla(locale, facoltativa, fps)} cx={850} cy={160}>
            <Scudo x={850} y={160} s={0.95} />
          </Compare>
        </Compare>
        <Compare v={molla(locale, domanda + 4, fps)} cx={850} cy={240}>
          <Testo x={850} y={240} corpo={24} titolo peso={800} colore={pieno > 0.5 ? TINTE.ok : COLORE_TENUE}>
            {pieno > 0.5 ? "Facoltativa" : "Chiedi"}
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Se assumi qualcuno, assicurarlo … è obbligatorio. Il premio per gli infortuni sul lavoro lo paghi tu. Quello … fuori dal lavoro è a carico del dipendente: lo trattieni dal salario.» */
const infDipendenti: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.7, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.7, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 2, null, 0.4, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const assumi = fra(ctx, null, 0, 0.25, 0.1);
    const obbligo = fra(ctx, null, 0, 0.75, 0.3);
    const lavoro = fra(ctx, 0, 1, 0.4, 0.5);
    const fuori = fra(ctx, 1, 2, 0.4, 0.7);
    const salario = fra(ctx, 2, null, 0.3, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Se assumi qualcuno" />
        <Compare v={molla(locale, 4, fps, true)} cx={410} cy={260}>
          <Persona x={410} y={330} s={0.85} colore={TINTE.accento} />
          <Pillola x={410} y={372} testo="Tu" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, assumi, fps)} cx={590} cy={260}>
          <Persona x={590} y={330} s={0.85} colore={TEAL_CHIARO} />
          <Pillola x={590} y={372} testo="Dipendente" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, obbligo, fps)} cx={820} cy={230}>
          <Scudo x={820} y={200} s={0.95} />
          <Pillola x={820} y={300} testo="Obbligatoria" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, lavoro, fps)} cx={600} cy={470}>
          <Moneta cx={400} cy={470} r={26} />
          <Testo x={440} y={472} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Infortuni sul lavoro: paghi tu
          </Testo>
        </Compare>
        <Compare v={molla(locale, fuori, fps)} cx={600} cy={560}>
          <Moneta cx={400} cy={560} r={26} />
          <Testo x={440} y={562} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Fuori dal lavoro: il dipendente
          </Testo>
        </Compare>
        <Compare v={molla(locale, salario, fps)} cx={700} cy={640}>
          <Pillola x={700} y={640} testo="Lo trattieni dal salario" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 11. «Prima di iniziare, allora: chiama la cassa malati … Poi chiedi delle offerte e confronta premi e prestazioni, anche da quale giorno arriva l'indennità.» */
const infControlla = elenco(
  "Prima di iniziare",
  ["Chiama la cassa malati", "Chiedi delle offerte", "Confronta premi e prestazioni", "Da quando arriva l'indennità?"],
  (ctx) => [fra(ctx, 0, 1, 0.3, 0.3), fra(ctx, 1, 2, 0.3, 0.55), fra(ctx, 1, 2, 0.75, 0.7), fra(ctx, 2, null, 0.4, 0.85)],
);

export const DISEGNI_ASSICURAZIONE_INFORTUNI: Record<string, Disegno> = {
  "inf-dipendente": infDipendente,
  "inf-indipendente": infIndipendente,
  "inf-cassa-malati": infCassaMalati,
  "inf-differenza": infDifferenza,
  "inf-dove": infDove,
  "inf-premio": infPremio,
  "inf-lasci-lavoro": infLasciLavoro,
  "inf-part-time": infPartTime,
  "inf-dipendenti": infDipendenti,
  "inf-controlla": infControlla,
};
