/**
 * I disegni della lezione 7 («Il permesso per lavorare in proprio»), vedi
 * src/lezioni/permesso-lavoro.ts. Fonti: LStrI (artt. 19 e 38), schede, FAQ e
 * Istruzioni OLCP della SEM, avvertenze e pagine dell'Ufficio della migrazione
 * ticinese, promemoria dei Grigioni. Coordinate della tela 1000×700; l'angolo
 * in basso a sinistra (x < 300, y > 480) è della finestra di Bleo. Niente
 * cifre: sulle tessere dei permessi solo la lettera.
 */
import { Casa, Compare, Foglio, Freccia, molla, Moneta, Negozio, Palazzo, Persona, Pillola, Righe, Spunta, TEAL_CHIARO, Testo, Timbro, TINTE, tra, Valigetta } from "../figure";
import { Tela } from "./ditta-individuale";
import { elenco } from "./documenti-sagl";
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

/** Un permesso per stranieri, in formato carta di credito: foto, righe e la lettera del permesso. */
function Carta({ cx, cy, lettera, s = 1, colore = TINTE.tratto }: { cx: number; cy: number; lettera: string; s?: number; colore?: string }) {
  const w = 170;
  const h = 108;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={TINTE.carta} stroke={colore} strokeWidth={6} />
      <path d={`M ${-w / 2} ${-h / 2 + 14} q 0 -14 14 -14 H ${w / 2 - 14} q 14 0 14 14 V ${-h / 2 + 24} H ${-w / 2} Z`} fill={colore} />
      <rect x={-w / 2 + 16} y={-h / 2 + 36} width={40} height={52} rx={8} fill={TINTE.tinta} />
      <circle cx={-w / 2 + 36} cy={-h / 2 + 54} r={10} fill={colore} opacity={0.55} />
      <path d={`M ${-w / 2 + 22} ${-h / 2 + 86} q 14 -20 28 0 Z`} fill={colore} opacity={0.55} />
      <line x1={-12} y1={-10} x2={18} y2={-10} stroke={TINTE.tinta} strokeWidth={8} strokeLinecap="round" />
      <line x1={-12} y1={12} x2={8} y2={12} stroke={TINTE.tinta} strokeWidth={8} strokeLinecap="round" />
      <circle cx={w / 2 - 36} cy={10} r={28} fill={colore} />
      <Testo x={w / 2 - 36} y={12} corpo={34} titolo peso={800} colore={TINTE.carta}>
        {lettera}
      </Testo>
    </g>
  );
}

/** Il passaporto svizzero: rosso, con la croce bianca. */
function Passaporto({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-8)`}>
      <rect x={-44} y={-60} width={88} height={120} rx={10} fill={TINTE.rischio} />
      <rect x={-44} y={-60} width={12} height={120} rx={6} fill="#a32f22" />
      <rect x={-8} y={-34} width={16} height={48} rx={2} fill={TINTE.carta} />
      <rect x={-24} y={-18} width={48} height={16} rx={2} fill={TINTE.carta} />
      <line x1={-22} y1={38} x2={26} y2={38} stroke={TINTE.carta} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
    </g>
  );
}

/** Una lente d'ingrandimento: l'ufficio controlla. */
function Lente({ cx, cy, r = 36 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <line x1={cx + r * 0.7} y1={cy + r * 0.7} x2={cx + r * 1.7} y2={cy + r * 1.7} stroke={TINTE.accento} strokeWidth={15} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill={TINTE.crema} fillOpacity={0.7} stroke={TINTE.accento} strokeWidth={9} />
      <path d={`M ${cx - r * 0.5} ${cy - r * 0.15} a ${r * 0.55} ${r * 0.55} 0 0 1 ${r * 0.4} ${-r * 0.35}`} fill="none" stroke={TINTE.carta} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
}

/** Un computer portatile con un modulo sullo schermo: la procedura online. */
function Computer({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 100} y={cy - 80} width={200} height={132} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={cx - 100} y={cy - 80} width={200} height={24} rx={12} fill={TINTE.tinta} />
      <Righe x={cx - 72} y={cy - 30} w={110} n={3} passo={24} />
      <rect x={cx + 30} y={cy + 20} width={46} height={20} rx={8} fill={TINTE.accento} />
      <path d={`M ${cx - 126} ${cy + 58} H ${cx + 126} l -16 18 H ${cx - 110} Z`} fill={TINTE.tratto} />
    </g>
  );
}

/** Una croce rossa che si disegna sopra qualcosa (p da 0 a 1). */
function Croce({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: number }) {
  if (p <= 0) return null;
  return (
    <g opacity={p} stroke={TINTE.rischio} strokeWidth={12} strokeLinecap="round">
      <line x1={cx - r} y1={cy - r * 0.7} x2={cx + r} y2={cy + r * 0.7} />
      <line x1={cx + r} y1={cy - r * 0.7} x2={cx - r} y2={cy + r * 0.7} />
    </g>
  );
}

/* 2. «Se sei cittadino svizzero, o hai il permesso C, puoi lavorare in proprio in tutta la Svizzera. Non ti serve un altro permesso.» */
const permSvizzero: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.5) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.4, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const svizzero = 6;
    const permessoC = fra(ctx, null, 0, 0.7, 0.3);
    const inProprio = fra(ctx, 0, 1, 0.25, 0.5);
    const nessunAltro = fra(ctx, 1, null, 0.3, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Svizzero o permesso C" />
        <Compare v={molla(locale, svizzero, fps)} cx={400} cy={280}>
          <Persona x={400} y={370} colore={TINTE.accento} />
          <Passaporto cx={472} cy={262} s={0.75} />
          <Pillola x={400} y={420} testo="Cittadino svizzero" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, permessoC, fps)} cx={670} cy={280}>
          <Persona x={670} y={370} colore={TEAL_CHIARO} />
          <Carta cx={752} cy={250} lettera="C" s={0.62} />
          <Pillola x={670} y={420} testo="Permesso C" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, inProprio, fps)} cx={895} cy={300}>
          <Valigetta x={895} y={340} s={1.15} />
          <Spunta cx={935} cy={225} r={28} p={tra(locale, inProprio + 4, inProprio + 18)} />
        </Compare>
        <Compare v={molla(locale, inProprio + 8, fps)} cx={620} cy={510}>
          <Pillola x={620} y={510} testo="Lavori in proprio in tutta la Svizzera" corpo={28} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, nessunAltro, fps)} cx={620} cy={600}>
          <Pillola x={620} y={600} testo="Nessun altro permesso" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «… dell'Unione europea o dell'AELS, e vuoi abitare in Svizzera, chiedi il permesso B … vale … anni e si può rinnovare.» */
const permUe: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.65, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.65, 0.5) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.6, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const paesi = 6;
    const aels = fra(ctx, null, 0, 0.75, 0.3);
    const casa = fra(ctx, 0, 1, 0.2, 0.45);
    const permesso = fra(ctx, 0, 1, 0.65, 0.55);
    const accolta = fra(ctx, 1, null, 0.25, 0.75);
    const rinnovo = fra(ctx, 1, null, 0.7, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="UE/AELS: il permesso B" />
        <Compare v={molla(locale, paesi, fps)} cx={420} cy={280}>
          {[350, 420, 490].map((x, i) => (
            <Persona key={x} x={x} y={330} s={0.62} colore={i === 1 ? TINTE.accento : i === 0 ? TEAL_CHIARO : TINTE.tratto} />
          ))}
          <Pillola x={420} y={372} testo="UE/AELS" corpo={30} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, aels, fps)} cx={420} cy={440}>
          <Righe2 x={420} y={428} righe={["più Islanda, Norvegia", "e Liechtenstein"]} corpo={24} passo={30} colore={TINTE.accento} />
        </Compare>
        <Freccia d="M 510 250 Q 560 210 600 240" p={tra(locale, casa - 8, casa + 6)} />
        <Compare v={molla(locale, casa, fps)} cx={660} cy={290}>
          <Casa x={660} y={350} s={1.1} colore={TINTE.tratto} />
          <Righe2 x={660} y={385} righe={["Abiti in Svizzera"]} corpo={24} />
        </Compare>
        <Compare v={molla(locale, permesso, fps)} cx={870} cy={260}>
          <Carta cx={870} cy={250} lettera="B" s={0.95} colore={TINTE.accento} />
          <Righe2 x={870} y={340} righe={["Per l'attività", "indipendente"]} corpo={24} passo={30} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, accolta, fps)} cx={660} cy={520}>
          <g opacity={tra(locale, accolta + 6, accolta + 14)}>
            <Timbro cx={410} cy={520} r={34} />
          </g>
          <Pillola x={660} y={520} testo="Se la domanda è accolta" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, rinnovo, fps)} cx={660} cy={610}>
          <Pillola x={660} y={610} testo="Si può rinnovare" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Se invece abiti in uno di questi Paesi e lavori qui da frontaliere, ti serve il permesso G … devi tornare a casa almeno una volta alla settimana.» */
const permFrontaliere: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.5) },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.7, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const casa = 6;
    const lavoro = fra(ctx, null, 0, 0.55, 0.3);
    const andata = fra(ctx, null, 0, 0.8, 0.4);
    const permesso = fra(ctx, 0, 1, 0.3, 0.55);
    const ritorno = fra(ctx, 1, null, 0.5, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Frontalieri: il permesso G" />
        {/* Il confine. */}
        <g opacity={tra(locale, 4, 14)}>
          <line x1={600} y1={110} x2={600} y2={400} stroke={TINTE.tinta} strokeWidth={8} strokeLinecap="round" strokeDasharray="6 22" />
          <Testo x={440} y={125} corpo={24} titolo peso={800} colore={TEAL_CHIARO}>
            Estero
          </Testo>
          <Testo x={770} y={125} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Svizzera
          </Testo>
        </g>
        <Compare v={molla(locale, casa, fps)} cx={440} cy={290}>
          <Casa x={440} y={350} s={1.15} colore={TEAL_CHIARO} />
          <Testo x={440} y={385} corpo={24} titolo peso={800} colore={TEAL_CHIARO}>
            La tua casa
          </Testo>
        </Compare>
        <Compare v={molla(locale, lavoro, fps)} cx={770} cy={290}>
          <Negozio x={770} y={350} s={0.62} targa="In proprio" />
          <Testo x={770} y={385} corpo={24} titolo peso={800}>
            Il tuo lavoro
          </Testo>
        </Compare>
        <Freccia d="M 500 205 Q 600 150 700 200" p={tra(locale, andata - 6, andata + 10)} />
        <Compare v={molla(locale, permesso, fps)} cx={600} cy={500}>
          <Carta cx={600} cy={495} lettera="G" s={0.95} colore={TINTE.accento} />
          <Testo x={600} y={572} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Per l&apos;attività indipendente
          </Testo>
        </Compare>
        <Freccia d="M 700 300 Q 600 350 500 300" p={tra(locale, ritorno - 4, ritorno + 12)} colore={TEAL_CHIARO} />
        <Compare v={molla(locale, ritorno + 6, fps)} cx={620} cy={640}>
          <Pillola x={620} y={640} testo="A casa almeno una volta alla settimana" corpo={26} fondo={TEAL_CHIARO} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Lavori già qui da dipendente, con il permesso B? … puoi passare all'attività indipendente, ma prima avvisa l'Ufficio della migrazione. Con il permesso L … un nuovo permesso B.» */
const permDipendente: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.6, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.6, 0.45) },
      { tipo: "scuoti", quando: fra(ctx, 1, 2, 0.4, 0.6) },
      { tipo: "lancia", quando: fra(ctx, 2, null, 0.6, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const dipendente = 6;
    const indipendente = fra(ctx, 0, 1, 0.55, 0.45);
    const avvisa = fra(ctx, 1, 2, 0.25, 0.6);
    const permessoL = fra(ctx, 2, null, 0.2, 0.75);
    const nuovoB = fra(ctx, 2, null, 0.65, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Sei già dipendente?" />
        <Compare v={molla(locale, dipendente, fps)} cx={430} cy={260}>
          <Persona x={430} y={350} s={0.9} colore={TEAL_CHIARO} />
          <Carta cx={512} cy={235} lettera="B" s={0.55} />
          <Pillola x={430} y={395} testo="Dipendente" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 560 280 Q 630 230 690 270" p={tra(locale, indipendente - 8, indipendente + 6)} />
        <Compare v={molla(locale, indipendente, fps)} cx={790} cy={260}>
          <Persona x={790} y={350} s={0.9} colore={TINTE.accento} />
          <Valigetta x={858} y={300} s={0.8} />
          <Pillola x={790} y={395} testo="Indipendente" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, avvisa, fps)} cx={610} cy={470}>
          <Pillola x={610} y={470} testo="Prima avvisa l'ufficio" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, permessoL, fps)} cx={470} cy={590}>
          <Carta cx={470} cy={590} lettera="L" s={0.75} />
        </Compare>
        <Freccia d="M 550 590 H 640" p={tra(locale, nuovoB - 8, nuovoB + 2)} />
        <Compare v={molla(locale, nuovoB, fps)} cx={740} cy={590}>
          <Carta cx={740} cy={590} lettera="B" s={0.75} colore={TINTE.accento} />
          <Testo x={870} y={590} corpo={26} titolo peso={800} colore={TINTE.accento}>
            Nuovo
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Vieni da un altro Paese e non hai il permesso C? Le condizioni sono più severe … interesse dell'economia svizzera … i mezzi per finanziare l'attività e per vivere.» */
const permAltri = elenco("Altri Paesi: regole più severe", ["Interesse dell'economia svizzera", "Mezzi per finanziare l'attività", "Mezzi sufficienti per vivere"], (ctx) => [
  fra(ctx, 1, 2, 0.55, 0.55),
  fra(ctx, 2, null, 0.3, 0.75),
  fra(ctx, 2, null, 0.7, 0.88),
]);

/* 7. «Con il permesso B o G, l'attività indipendente deve essere vera … per conto tuo e che ne puoi vivere … nuove prove, e anche revocare il permesso.» */
const permVera: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.4) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.5, 0.88) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const persona = 6;
    const contoTuo = fra(ctx, 0, 1, 0.45, 0.35);
    const vivere = fra(ctx, 0, 1, 0.85, 0.5);
    const prove = fra(ctx, 1, 2, 0.5, 0.7);
    const revoca = fra(ctx, 2, null, 0.35, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Un'attività vera" />
        <Compare v={molla(locale, persona, fps)} cx={400} cy={280}>
          <Persona x={400} y={370} colore={TINTE.accento} />
          <Valigetta x={468} y={310} s={0.85} />
        </Compare>
        <Compare v={molla(locale, contoTuo, fps)} cx={400} cy={425}>
          <Pillola x={400} y={425} testo="Per conto tuo" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, vivere, fps)} cx={665} cy={330}>
          <Moneta cx={627} cy={330} r={30} />
          <Moneta cx={667} cy={345} r={30} />
          <Moneta cx={707} cy={322} r={30} />
          <Pillola x={667} y={425} testo="Ne puoi vivere" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, prove, fps)} cx={860} cy={280}>
          <Foglio x={810} y={160} w={120} h={150}>
            <Righe x={826} y={205} w={74} n={3} passo={24} />
          </Foglio>
          <Lente cx={850} cy={290} r={34} />
          <Testo x={880} y={425} corpo={24} titolo peso={800}>
            Nuove prove
          </Testo>
        </Compare>
        <Compare v={molla(locale, revoca, fps)} cx={640} cy={580}>
          <Carta cx={560} cy={580} lettera="B" s={0.75} />
          <Croce cx={560} cy={580} r={62} p={tra(locale, revoca + 6, revoca + 14)} />
          <Testo x={650} y={580} corpo={30} titolo peso={800} colore={TINTE.rischio} ancora="start">
            Revoca
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Cosa preparare? L'elenco ufficiale dei Grigioni chiede … business plan … commesse e contabilità … contratto d'affitto … assicurazione malattia e infortuni.» */
const permDocumenti = elenco(
  "Esempio: l'elenco dei Grigioni",
  ["Un business plan", "Commesse e contabilità", "Contratto d'affitto del locale", "Assicurazione malattia e infortuni"],
  (ctx) => [fra(ctx, 1, 2, 0.45, 0.35), fra(ctx, 2, 3, 0.5, 0.55), fra(ctx, 3, null, 0.3, 0.75), fra(ctx, 3, null, 0.72, 0.88)],
);

/* 9. «In Ticino la domanda va all'Ufficio della migrazione, con la procedura online. Mandala prima di iniziare … Nei Grigioni … controllo abitanti del Comune.» */
const permDomanda: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 2, null, 0.5, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const online = 6;
    const ufficio = fra(ctx, null, 0, 0.45, 0.25);
    const prima = fra(ctx, 0, 1, 0.2, 0.45);
    const documenti = fra(ctx, 1, 2, 0.2, 0.6);
    const grigioni = fra(ctx, 2, null, 0.3, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La domanda" />
        <Compare v={molla(locale, online, fps)} cx={440} cy={230}>
          <Computer cx={440} cy={225} />
          <Testo x={440} y={330} corpo={24} titolo peso={800}>
            Procedura online
          </Testo>
        </Compare>
        <Compare v={molla(locale, documenti, fps)} cx={615} cy={300}>
          <g transform="rotate(8 615 300)">
            <Foglio x={578} y={252} w={74} h={96}>
              <Righe x={590} y={286} w={44} n={3} passo={18} />
            </Foglio>
          </g>
        </Compare>
        <Freccia d="M 570 230 Q 620 200 660 230" p={tra(locale, ufficio - 8, ufficio + 4)} />
        <Compare v={molla(locale, ufficio, fps)} cx={780} cy={260}>
          <Palazzo x={780} y={330} s={0.85} nome="TI" />
          <Pillola x={780} y={375} testo="Ufficio della migrazione" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, prima, fps)} cx={440} cy={400}>
          <Pillola x={440} y={400} testo="Prima di iniziare" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, grigioni, fps)} cx={700} cy={560}>
          <Palazzo x={600} y={620} s={0.6} nome="GR" colore={TEAL_CHIARO} />
          <Righe2 x={810} y={560} righe={["Grigioni:", "controllo abitanti", "del Comune"]} corpo={26} passo={32} colore={TEAL_CHIARO} />
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Poi valgono per te le stesse regole degli svizzeri: per la professione, l'AVS e le imposte. I cambiamenti … e il rinnovo …» */
const permObblighi = elenco(
  "I tuoi obblighi",
  ["Le stesse regole degli svizzeri", "Professione, AVS e imposte", "Cambiamenti: avvisa l'ufficio", "Rinnovo: chiedilo prima"],
  (ctx) => [fra(ctx, null, 0, 0.5, 0.2), fra(ctx, 0, 1, 0.4, 0.4), fra(ctx, 1, 2, 0.4, 0.65), fra(ctx, 2, null, 0.4, 0.88)],
);

export const DISEGNI_PERMESSO_LAVORO: Record<string, Disegno> = {
  "perm-svizzero": permSvizzero,
  "perm-ue": permUe,
  "perm-frontaliere": permFrontaliere,
  "perm-dipendente": permDipendente,
  "perm-altri": permAltri,
  "perm-vera": permVera,
  "perm-documenti": permDocumenti,
  "perm-domanda": permDomanda,
  "perm-obblighi": permObblighi,
};
