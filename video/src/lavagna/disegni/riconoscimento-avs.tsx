/**
 * I disegni della lezione 11 («Indipendente per l'AVS»), vedi
 * src/lezioni/riconoscimento-avs.ts. Fonti: promemoria AVS 2.02, pagine di
 * selbststaendig-erwerbend.ch (indipendente.ch), art. 64 LAVS, pagina
 * dell'IAS sull'affiliazione. Il nome e il luogo della cassa ticinese vengono
 * da uffici.cassaCompensazioneTicino. Coordinate della tela 1000×700;
 * l'angolo in basso a sinistra (x < 300, y > 480) è della finestra di Bleo.
 * Niente cifre, solo concetti.
 */
import { uffici } from "../../../../src/data/svizzera";
import {
  Compare,
  Foglio,
  Freccia,
  molla,
  Moneta,
  Negozio,
  Palazzo,
  Persona,
  Pillola,
  Righe,
  Salvadanaio,
  Spunta,
  TEAL_CHIARO,
  Testo,
  TINTE,
  tra,
  Valigetta,
} from "../figure";
import { Tela } from "./ditta-individuale";
import { elenco } from "./documenti-sagl";
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

const CASSA_TICINO = uffici.cassaCompensazioneTicino.valore;
/** «IAS», dalla parentesi nel nome dell'ufficio. */
const SIGLA_CASSA = /\(([A-Z]+)\)/.exec(CASSA_TICINO.nome)?.[1] ?? "IAS";
/** Il luogo, ultima parola dell'indirizzo («Bellinzona»). */
const LUOGO_CASSA = CASSA_TICINO.indirizzo.split(" ").at(-1) ?? "";

/** Una lente d'ingrandimento: la cassa che guarda. */
function Lente({ cx, cy, r = 30, colore = TINTE.tratto }: { cx: number; cy: number; r?: number; colore?: string }) {
  return (
    <g>
      <line x1={cx + r * 0.7} y1={cy + r * 0.7} x2={cx + r * 1.65} y2={cy + r * 1.65} stroke={colore} strokeWidth={r * 0.38} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} fillOpacity={0.55} stroke={colore} strokeWidth={r * 0.28} />
      <path d={`M ${cx - r * 0.45} ${cy - r * 0.1} a ${r * 0.5} ${r * 0.5} 0 0 1 ${r * 0.4} ${-r * 0.38}`} fill="none" stroke={TINTE.tinta} strokeWidth={r * 0.16} strokeLinecap="round" />
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

/** Una busta chiusa centrata in (cx, cy): la lettera della cassa. */
function Busta({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-60} y={-40} width={120} height={80} rx={10} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d="M -56 -34 L 0 8 L 56 -34" fill="none" stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={0} cy={10} r={11} fill={TINTE.accento} />
    </g>
  );
}

/** Un orologio con la lancetta che gira: ci vuole un po' di tempo. */
function Orologio({ cx, cy, r = 44, locale }: { cx: number; cy: number; r?: number; locale: number }) {
  const giro = (locale * 6) % 360;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      {[0, 90, 180, 270].map((a) => (
        <line
          key={a}
          x1={cx + Math.cos((a * Math.PI) / 180) * r * 0.72}
          y1={cy + Math.sin((a * Math.PI) / 180) * r * 0.72}
          x2={cx + Math.cos((a * Math.PI) / 180) * r * 0.86}
          y2={cy + Math.sin((a * Math.PI) / 180) * r * 0.86}
          stroke={TINTE.tratto}
          strokeWidth={5}
          strokeLinecap="round"
        />
      ))}
      <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.48} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.7} stroke={TINTE.accento} strokeWidth={5} strokeLinecap="round" transform={`rotate(${giro} ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={6} fill={TINTE.tratto} />
    </g>
  );
}

/** La finestra del browser con l'indirizzo del sito e il modulo della domanda. */
function Browser({ x, y, w, h, indirizzo, invio }: { x: number; y: number; w: number; h: number; indirizzo: string; invio: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d={`M ${x + 3} ${y + 52} V ${y + 18} q 0 -15 15 -15 H ${x + w - 18} q 15 0 15 15 V ${y + 52} Z`} fill={TINTE.tratto} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 26 + i * 22} cy={y + 28} r={7} fill={i === 0 ? TINTE.accento : TINTE.tinta} />
      ))}
      <rect x={x + 100} y={y + 12} width={w - 120} height={32} rx={16} fill={TINTE.carta} />
      <Testo x={x + 100 + (w - 120) / 2} y={y + 29} corpo={22} titolo peso={800} colore={TINTE.tratto}>
        {indirizzo}
      </Testo>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <line x1={x + 30} y1={y + 92 + i * 46} x2={x + 110} y2={y + 92 + i * 46} stroke={TINTE.tinta} strokeWidth={9} strokeLinecap="round" />
          <rect x={x + 128} y={y + 76 + i * 46} width={w - 160} height={32} rx={8} fill="none" stroke={TINTE.tinta} strokeWidth={4} />
        </g>
      ))}
      <rect x={x + w - 150} y={y + h - 58} width={120} height={40} rx={20} fill={invio > 0.5 ? TINTE.ok : TINTE.accento} />
      <Testo x={x + w - 90} y={y + h - 37} corpo={22} titolo peso={800} colore={TINTE.carta}>
        Invia
      </Testo>
    </g>
  );
}

/** Un piccolo calendario da muro: un trimestre. */
function Calendario({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-56} y={-52} width={112} height={108} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-56} y={-52} width={112} height={30} rx={14} fill={TINTE.accento} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}-${c}`} x={-38 + c * 28} y={-10 + r * 22} width={20} height={14} rx={4} fill={TINTE.tinta} />
        )),
      )}
    </g>
  );
}

/* 2. «Per l'AVS sei indipendente se lavori a tuo nome e per conto tuo, e ti assumi il rischio economico. Non lo decide il contratto: la cassa … guarda come lavori davvero.» */
const ravsChi: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.5, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.45, 0.2) },
      { tipo: "scuoti", quando: fra(ctx, 1, 2, 0.6, 0.6) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.6, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const nome = fra(ctx, null, 0, 0.4, 0.2);
    const conto = fra(ctx, null, 0, 0.8, 0.3);
    const rischio = fra(ctx, 0, 1, 0.45, 0.45);
    const contratto = fra(ctx, 1, 2, 0.2, 0.55);
    const croce = fra(ctx, 1, 2, 0.7, 0.62);
    const cassa = fra(ctx, 2, null, 0.15, 0.7);
    const lente = fra(ctx, 2, null, 0.5, 0.82);
    const giro = Math.sin((locale - lente) / 8) * 14;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Chi è indipendente" />
        <Compare v={molla(locale, 4, fps)} cx={430} cy={300}>
          <Persona x={430} y={400} colore={TINTE.accento} />
          <Valigetta x={500} y={400} s={0.75} />
        </Compare>
        <Compare v={molla(locale, nome, fps)} cx={770} cy={150}>
          <Pillola x={770} y={150} testo="A tuo nome" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, conto, fps)} cx={770} cy={235}>
          <Pillola x={770} y={235} testo="Per conto tuo" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, rischio, fps)} cx={770} cy={320}>
          <Pillola x={760} y={320} testo="Il rischio è tuo" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
          <Moneta cx={935} cy={320} r={22} />
        </Compare>
        {/* Il contratto non basta. */}
        <Compare v={molla(locale, contratto, fps)} cx={400} cy={560}>
          <Foglio x={345} y={490} w={110} h={140}>
            <Righe x={362} y={538} w={70} n={3} passo={24} />
          </Foglio>
          <Croce cx={400} cy={560} rx={56} ry={62} p={tra(locale, croce, croce + 12)} />
          <Testo x={530} y={560} corpo={26} titolo peso={800} colore={TINTE.rischio} ancora="start">
            Il contratto non basta
          </Testo>
        </Compare>
        {/* La cassa guarda i fatti. */}
        <Compare v={molla(locale, cassa, fps)} cx={870} cy={560}>
          <Palazzo x={880} y={660} s={0.62} nome="AVS" />
        </Compare>
        <Freccia d="M 805 525 Q 630 480 575 330" p={tra(locale, lente - 10, lente + 4)} tratteggio colore={TINTE.tratto} />
        <Compare v={molla(locale, lente, fps)} cx={535} cy={240}>
          <g transform={`rotate(${giro} 535 240)`}>
            <Lente cx={535} cy={240} r={36} />
          </g>
        </Compare>
      </Tela>
    );
  },
};

/* 3. «La cassa guarda soprattutto quattro cose. Fai le fatture a tuo nome? Il rischio è tuo …? Decidi tu come lavorare? E lavori per diversi clienti?» */
const ravsCriteri = elenco("Cosa guarda la cassa", ["Fatture a tuo nome", "Il rischio è tuo", "Organizzi tu il lavoro", "Diversi clienti"], (ctx) => [
  fra(ctx, 0, 1, 0.35, 0.25),
  fra(ctx, 1, 2, 0.3, 0.45),
  fra(ctx, 2, 3, 0.35, 0.65),
  fra(ctx, 3, null, 0.4, 0.85),
]);

/* 4. «Attenzione: se lavori per un solo cliente, di regola sei considerato un dipendente. E puoi essere indipendente in un'attività e dipendente in un'altra.» */
const ravsUnCliente: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.4, 0.45) + 4 },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.45, 0.8) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cliente = fra(ctx, null, 0, 0.55, 0.25);
    const dipendente = fra(ctx, 0, 1, 0.35, 0.45);
    const una = fra(ctx, 1, null, 0.4, 0.75);
    const altra = fra(ctx, 1, null, 0.75, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Un solo cliente?" />
        <Compare v={molla(locale, 4, fps)} cx={430} cy={290}>
          <Persona x={430} y={380} colore={TINTE.accento} inclinata={dipendente > 0 && locale > dipendente ? -6 : 0} />
        </Compare>
        <Freccia d="M 500 260 Q 600 220 700 260" p={tra(locale, cliente - 10, cliente + 4)} />
        <Compare v={molla(locale, cliente, fps)} cx={820} cy={300}>
          <Negozio x={820} y={380} s={0.75} targa="Cliente" />
        </Compare>
        <Compare v={molla(locale, dipendente, fps)} cx={630} cy={455}>
          <Pillola x={630} y={455} testo="Di regola: dipendente" corpo={28} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Compare v={molla(locale, una, fps)} cx={650} cy={555}>
          <Pillola x={650} y={555} testo="Un'attività: indipendente" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, altra, fps)} cx={650} cy={635}>
          <Pillola x={650} y={635} testo="Un'altra: dipendente" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Se sei membro di un'associazione professionale con una sua cassa, la domanda va a quella. Se no, va alla cassa cantonale: in Ticino è l'Istituto delle assicurazioni sociali …» */
const ravsCassa: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.5, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.2, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.55) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.55, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const domanda = fra(ctx, null, 0, 0.12, 0.06);
    const professionale = fra(ctx, null, 0, 0.75, 0.28);
    const cantonale = fra(ctx, 1, 2, 0.45, 0.55);
    const ticino = fra(ctx, 2, null, 0.45, 0.82);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Quale cassa?" />
        <Compare v={molla(locale, 4, fps)} cx={400} cy={330}>
          <Persona x={400} y={430} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, domanda, fps)} cx={490} cy={300}>
          <Foglio x={450} y={250} w={80} h={100}>
            <Righe x={464} y={290} w={46} n={2} passo={20} />
          </Foglio>
        </Compare>
        {/* Con un'associazione professionale: la sua cassa. */}
        <Freccia d="M 545 270 Q 600 180 680 175" p={tra(locale, professionale - 12, professionale + 2)} colore={TEAL_CHIARO} />
        <Compare v={molla(locale, professionale, fps)} cx={810} cy={200}>
          <Palazzo x={810} y={230} s={0.6} colore={TEAL_CHIARO} />
          <Pillola x={810} y={270} testo="Cassa professionale" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TEAL_CHIARO} />
          <Testo x={610} y={130} corpo={22} titolo peso={800} colore={TEAL_CHIARO}>
            Associazione
          </Testo>
        </Compare>
        {/* Se no: la cassa cantonale. */}
        <Freccia d="M 545 340 Q 600 440 680 455" p={tra(locale, cantonale - 12, cantonale + 2)} colore={TINTE.accento} />
        <Compare v={molla(locale, cantonale, fps)} cx={810} cy={480}>
          <Palazzo x={810} y={510} s={0.6} nome="TI" colore={TINTE.accento} />
          <Pillola x={810} y={550} testo="Cassa cantonale" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, ticino, fps)} cx={810} cy={625}>
          <Pillola x={810} y={625} testo={`${SIGLA_CASSA} · ${LUOGO_CASSA}`} corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 6. «La domanda la fai online, sul sito ufficiale indipendente.ch, che la inoltra alla tua cassa. Falla appena inizi, con le prime offerte o fatture: la cassa vuole vedere che l'attività è già partita.» */
const ravsOnline: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.35) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.6, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const invio = fra(ctx, 0, 1, 0.2, 0.3);
    const cassa = fra(ctx, 0, 1, 0.55, 0.38);
    const offerte = fra(ctx, 1, 2, 0.4, 0.55);
    const fatture = fra(ctx, 1, 2, 0.7, 0.62);
    const partita = fra(ctx, 2, null, 0.55, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Online, appena inizi" />
        <Compare v={molla(locale, 4, fps)} cx={520} cy={235}>
          <Browser x={330} y={100} w={380} h={270} indirizzo="indipendente.ch" invio={tra(locale, invio, invio + 6)} />
        </Compare>
        <Freccia d="M 720 240 Q 770 200 810 230" p={tra(locale, cassa - 12, cassa + 2)} />
        <Compare v={molla(locale, cassa, fps)} cx={880} cy={260}>
          <Palazzo x={880} y={340} s={0.62} nome="AVS" />
        </Compare>
        <Compare v={molla(locale, offerte, fps)} cx={390} cy={520}>
          <Foglio x={340} y={440} w={100} h={130}>
            <Righe x={356} y={486} w={64} n={3} passo={22} />
          </Foglio>
          <Testo x={390} y={600} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Offerte
          </Testo>
        </Compare>
        <Compare v={molla(locale, fatture, fps)} cx={520} cy={520}>
          <Foglio x={470} y={440} w={100} h={130}>
            <Righe x={486} y={486} w={64} n={3} passo={22} />
          </Foglio>
          <Testo x={520} y={600} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Fatture
          </Testo>
        </Compare>
        <Compare v={molla(locale, partita, fps)} cx={790} cy={510}>
          <Spunta cx={622} cy={510} r={28} p={tra(locale, partita, partita + 14)} />
          <Pillola x={815} y={510} testo="Attività già partita" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Alla domanda alleghi le prove: offerte e fatture, contratti, pagamenti ricevuti. E poi pubblicità, contratti d'affitto o di leasing e la prova di quanto hai investito.» */
const ravsProve = elenco(
  "Le prove da allegare",
  ["Offerte e fatture", "Contratti e pagamenti ricevuti", "Pubblicità", "Affitto, leasing, investimenti"],
  (ctx) => [fra(ctx, null, 0, 0.5, 0.25), fra(ctx, null, 0, 0.78, 0.4), fra(ctx, 0, 1, 0.5, 0.55), fra(ctx, 1, null, 0.3, 0.8)],
);

/* 8. «Poi la cassa verifica tutto con cura … Alla fine ricevi la decisione, di solito per lettera. Se dice di no, per quell'attività sei un dipendente: il tuo cliente deve versare per te i contributi AVS.» */
const ravsDecisione: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.5, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.35) },
      { tipo: "scuoti", quando: fra(ctx, 1, 2, 0.5, 0.6) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const lettera = fra(ctx, 0, 1, 0.25, 0.32);
    const arriva = lettera + 22;
    const no = fra(ctx, 1, 2, 0.45, 0.6);
    const cliente = fra(ctx, 2, null, 0.2, 0.75);
    const soldi = fra(ctx, 2, null, 0.55, 0.85);
    // La lente passa avanti e indietro sui fogli della cassa finché non parte la lettera.
    const lenteX = 430 + Math.sin(locale / 9) * 50;
    const volo = tra(locale, lettera, arriva);
    const bx = 520 + (770 - 520) * volo;
    const by = 230 + (240 - 230) * volo - Math.sin(Math.PI * volo) * 70;
    const moneta = tra(locale, soldi, soldi + 26);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La decisione" />
        <Compare v={molla(locale, 4, fps)} cx={430} cy={260}>
          <Palazzo x={430} y={360} s={0.9} nome="AVS" />
        </Compare>
        {locale < lettera ? (
          <Compare v={molla(locale, 8, fps)} cx={lenteX} cy={420}>
            <Lente cx={lenteX} cy={420} r={30} />
          </Compare>
        ) : null}
        <Compare v={molla(locale, 10, fps)} cx={620} cy={170}>
          <Orologio cx={620} cy={170} r={40} locale={locale} />
        </Compare>
        <Compare v={molla(locale, lettera, fps)} cx={bx} cy={by}>
          <Busta cx={bx} cy={by} s={0.8} />
        </Compare>
        <Compare v={molla(locale, arriva - 6, fps)} cx={860} cy={330}>
          <Persona x={860} y={430} colore={TINTE.accento} inclinata={locale > no ? -6 : 0} />
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={860} cy={480}>
          <Pillola x={860} y={480} testo="Dipendente" corpo={26} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={770} cy={170}>
          <g transform="rotate(-10 770 170)">
            <rect x={725} y={142} width={90} height={56} rx={14} fill={TINTE.rischio} />
            <Testo x={770} y={171} corpo={32} titolo peso={800} colore={TINTE.carta}>
              No
            </Testo>
          </g>
        </Compare>
        {/* Il cliente versa i contributi alla cassa. */}
        <Compare v={molla(locale, cliente, fps)} cx={560} cy={580}>
          <Negozio x={560} y={660} s={0.6} targa="Cliente" />
        </Compare>
        <Freccia d="M 500 530 Q 440 470 440 380" p={tra(locale, soldi - 8, soldi + 8)} colore={TINTE.oro} tratteggio />
        {moneta > 0 && moneta < 1 ? <Moneta cx={500 - 60 * moneta} cy={530 - 150 * moneta} r={20} /> : null}
        <Compare v={molla(locale, soldi, fps)} cx={790} cy={600}>
          <Pillola x={790} y={600} testo="Versa i contributi" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 9. «Se invece la cassa ti riconosce, fissa gli acconti: … da pagare ogni trimestre. Quelli definitivi si calcolano dopo, sulla tassazione: la cassa ti rimborsa o ti chiede la differenza.» */
const ravsAcconti: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "festeggia", quando: fra(ctx, null, 0, 0.35, 0.12) + 6 },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.65) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const ok = fra(ctx, null, 0, 0.3, 0.1);
    const trimestri = [0.15, 0.35, 0.55, 0.75].map((f) => fra(ctx, 0, 1, f, 0.25 + f * 0.25));
    const tassazione = fra(ctx, 1, 2, 0.45, 0.65);
    const rimborso = fra(ctx, 2, null, 0.3, 0.78);
    const differenza = fra(ctx, 2, null, 0.65, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Se ti riconosce" />
        <Compare v={molla(locale, ok, fps)} cx={500} cy={140}>
          <Spunta cx={380} cy={140} r={32} p={tra(locale, ok, ok + 14)} />
          <Pillola x={540} y={140} testo="Indipendente" corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {trimestri.map((t, i) => (
          <Compare key={i} v={molla(locale, t, fps)} cx={400 + i * 145} cy={290}>
            <Calendario cx={400 + i * 145} cy={270} s={0.85} />
            <Moneta cx={400 + i * 145} cy={350} r={22} />
          </Compare>
        ))}
        <Compare v={molla(locale, trimestri[3] + 6, fps)} cx={620} cy={415}>
          <Testo x={620} y={415} corpo={26} titolo peso={800} colore={TINTE.accento}>
            Acconti ogni trimestre
          </Testo>
        </Compare>
        <Compare v={molla(locale, tassazione, fps)} cx={400} cy={560}>
          <Foglio x={345} y={490} w={110} h={140}>
            <Righe x={362} y={538} w={70} n={3} passo={24} />
          </Foglio>
          <Testo x={400} y={660} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Tassazione
          </Testo>
        </Compare>
        <Freccia d="M 470 530 Q 530 500 590 510" p={tra(locale, rimborso - 10, rimborso + 2)} colore={TINTE.ok} />
        <Compare v={molla(locale, rimborso, fps)} cx={720} cy={510}>
          <Pillola x={720} y={510} testo="Ti rimborsa" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.ok} />
        </Compare>
        <Freccia d="M 470 590 Q 530 620 590 615" p={tra(locale, differenza - 10, differenza + 2)} colore={TINTE.accento} />
        <Compare v={molla(locale, differenza, fps)} cx={750} cy={615}>
          <Pillola x={750} y={615} testo="Paghi la differenza" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/** Le altezze dei gradini della tavola scalare (gli ultimi uguali: il tasso massimo). */
const GRADINI = [0.22, 0.32, 0.42, 0.52, 0.64, 0.78, 1, 1];

/* 10. «Nel …, per AVS, invalidità e perdita di guadagno, paghi dal … al … del reddito. Più guadagni, più alta è la percentuale. In più ci sono gli assegni familiari e le spese della cassa.» */
const ravsQuanto: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.5, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.4, 0.15) },
      { tipo: "festeggia", quando: fra(ctx, 1, 2, 0.6, 0.65) + 4 },
      { tipo: "lancia", quando: fra(ctx, 2, null, 0.4, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const voci = [fra(ctx, null, 0, 0.35, 0.1), fra(ctx, null, 0, 0.55, 0.15), fra(ctx, null, 0, 0.8, 0.2)];
    const scala = fra(ctx, 0, 1, 0.1, 0.3);
    const sale = fra(ctx, 1, 2, 0.2, 0.55);
    const assegni = fra(ctx, 2, null, 0.4, 0.8);
    const spese = fra(ctx, 2, null, 0.75, 0.9);
    const base = 520;
    const alto = 250;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Quanto costa?" />
        <Compare v={molla(locale, voci[0], fps)} cx={395} cy={130}>
          <Pillola x={395} y={130} testo="AVS" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, voci[1], fps)} cx={545} cy={130}>
          <Pillola x={545} y={130} testo="Invalidità" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, voci[2], fps)} cx={800} cy={130}>
          <Pillola x={800} y={130} testo="Perdita di guadagno" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {/* La tavola scalare: più reddito, percentuale più alta. */}
        <g opacity={tra(locale, scala - 4, scala + 6)}>
          <line x1={340} y1={base} x2={920} y2={base} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
          <Testo x={905} y={base + 32} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="end">
            Reddito
          </Testo>
        </g>
        {GRADINI.map((h, i) => {
          const cresce = tra(locale, scala + i * 4, scala + i * 4 + 14);
          const altezza = h * alto * cresce;
          const ultimo = h === 1;
          return altezza > 0 ? (
            <rect
              key={i}
              x={360 + i * 66}
              y={base - altezza}
              width={50}
              height={altezza}
              rx={8}
              fill={ultimo ? TINTE.accento : TINTE.tinta}
              stroke={ultimo ? TINTE.accento : TINTE.tratto}
              strokeWidth={4}
            />
          ) : null;
        })}
        <Freccia d="M 375 425 C 560 395 700 330 790 225" p={tra(locale, sale, sale + 18)} colore={TINTE.accento} spessore={9} />
        <Compare v={molla(locale, sale + 10, fps)} cx={545} cy={215}>
          <Testo x={545} y={215} corpo={26} titolo peso={800} colore={TINTE.accento}>
            Più reddito, percentuale più alta
          </Testo>
        </Compare>
        <Compare v={molla(locale, assegni, fps)} cx={500} cy={615}>
          <Pillola x={500} y={615} testo="+ Assegni familiari" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, spese, fps)} cx={800} cy={615}>
          <Pillola x={800} y={615} testo="+ Spese della cassa" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 11. «E se guadagni poco? … paghi il minimo … Se lavori in proprio accanto a un impiego, e guadagni al massimo … l'anno, i contributi li paghi solo se li chiedi tu.» */
const ravsPoco: Disegno = {
  chiave: (ctx) => fra(ctx, 4, null, 0.4, 0.88),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.3, 0.35) },
      { tipo: "lancia", quando: fra(ctx, 2, 3, 0.5, 0.6) },
      { tipo: "festeggia", quando: fra(ctx, 4, null, 0.5, 0.88) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const poco = fra(ctx, null, 0, 0.3, 0.05);
    const minimo = fra(ctx, 1, 2, 0.3, 0.35);
    const accessoria = fra(ctx, 2, 3, 0.25, 0.55);
    const impiego = fra(ctx, 2, 3, 0.7, 0.62);
    const piccolo = fra(ctx, 3, 4, 0.4, 0.75);
    const richiesta = fra(ctx, 4, null, 0.4, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Se guadagni poco" />
        {/* Reddito basso: il contributo minimo. */}
        <Compare v={molla(locale, poco, fps)} cx={420} cy={220}>
          <Salvadanaio x={420} y={290} s={1.1} colore={TINTE.tratto} />
        </Compare>
        <Freccia d="M 510 230 Q 550 200 590 215" p={tra(locale, minimo - 10, minimo + 2)} colore={TINTE.oro} />
        <Compare v={molla(locale, minimo, fps)} cx={790} cy={225}>
          <Moneta cx={630} cy={225} r={30} />
          <Pillola x={810} y={225} testo="Contributo minimo" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <line x1={340} y1={380} x2={960} y2={380} stroke={TINTE.tinta} strokeWidth={4} strokeDasharray="10 12" strokeLinecap="round" opacity={tra(locale, accessoria - 8, accessoria)} />
        {/* Attività accessoria, accanto a un impiego. */}
        <Compare v={molla(locale, accessoria, fps)} cx={420} cy={540}>
          <Persona x={420} y={640} colore={TINTE.accento} />
          <Pillola x={420} y={420} testo="Accessoria" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, impiego, fps)} cx={640} cy={470}>
          <Valigetta x={560} y={490} s={0.6} />
          <Testo x={600} y={470} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Accanto a un impiego
          </Testo>
        </Compare>
        <Compare v={molla(locale, piccolo, fps)} cx={640} cy={550}>
          <Moneta cx={565} cy={550} r={18} />
          <Testo x={600} y={552} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Reddito piccolo
          </Testo>
        </Compare>
        <Compare v={molla(locale, richiesta, fps)} cx={720} cy={630}>
          <Pillola x={720} y={630} testo="Contributi solo se li chiedi" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.ok} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_RICONOSCIMENTO_AVS: Record<string, Disegno> = {
  "ravs-chi": ravsChi,
  "ravs-criteri": ravsCriteri,
  "ravs-un-cliente": ravsUnCliente,
  "ravs-cassa": ravsCassa,
  "ravs-online": ravsOnline,
  "ravs-prove": ravsProve,
  "ravs-decisione": ravsDecisione,
  "ravs-acconti": ravsAcconti,
  "ravs-quanto": ravsQuanto,
  "ravs-poco": ravsPoco,
};
