/**
 * I disegni della lezione 20 («Metti da parte i soldi per le imposte»), vedi
 * src/lezioni/acconti-imposte.ts. Fonti: Portale PMI sulla non imposizione
 * della ditta individuale, Istruzioni PF 2025 (pp. 48-49), pagine della DC
 * sugli acconti, decreto esecutivo sulla riscossione 2026, calcolatore
 * d'imposta dell'AFC; gli strumenti «Budget del primo anno» e «Tariffa
 * oraria» del sito. Coordinate della tela 1000×700; l'angolo in basso a
 * sinistra (x < 300, y > 480) è della finestra di Bleo. Niente cifre: i
 * giorni, le date e i tassi li dice solo la voce.
 */
import { Avviso, Compare, Foglio, Freccia, Fumetto, Lampadina, molla, Moneta, Negozio, Palazzo, Persona, Pillola, Righe, Salvadanaio, Spunta, TEAL_CHIARO, Testo, TINTE, tra, Valigetta } from "../figure";
import { Tela } from "./ditta-individuale";
import { Bandiera, Calendario, Clessidra, Computer, No } from "./fatture";
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

/** Una moneta in volo da (x1, y1) a (x2, y2) con un arco; sparisce all'arrivo. */
function Volo({ p, x1, y1, x2, y2, alto = 60, r = 22 }: { p: number; x1: number; y1: number; x2: number; y2: number; alto?: number; r?: number }) {
  if (p <= 0 || p >= 1) return null;
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p - Math.sin(Math.PI * p) * alto;
  return <Moneta cx={x} cy={y} r={r} />;
}

/** Una pila di monete (dal basso, centro in x): `n` può essere frazionario, l'ultima entra con una molla. */
function Pila({ x, y, n, r = 26 }: { x: number; y: number; n: number; r?: number }) {
  const intere = Math.floor(n);
  const resto = n - intere;
  return (
    <g>
      {Array.from({ length: intere + (resto > 0.01 ? 1 : 0) }, (_, i) => {
        const v = i < intere ? 1 : resto;
        return (
          <g key={i} opacity={v}>
            <ellipse cx={x + (i % 2) * 4} cy={y - r * 0.45 - i * r * 0.62} rx={r} ry={r * 0.45} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
}

/** Una busta da lettera (centro in cx, cy). */
function Busta({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-48} y={-32} width={96} height={64} rx={8} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      <path d="M -44 -28 L 0 6 L 44 -28" fill="none" stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
}

/** Una polizza di versamento: un foglietto con la parte da staccare (centro in cx, cy). */
function Polizza({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-60} y={-36} width={120} height={72} rx={8} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
      <rect x={-60} y={-36} width={34} height={72} rx={8} fill={TINTE.crema} stroke={TINTE.tratto} strokeWidth={5} />
      <line x1={-26} y1={-30} x2={-26} y2={30} stroke={TINTE.tratto} strokeWidth={3} strokeDasharray="5 5" />
      <rect x={8} y={-22} width={30} height={30} rx={3} fill={TINTE.tratto} />
      <rect x={16} y={-14} width={14} height={14} rx={2} fill={TINTE.carta} />
      <line x1={-14} y1={20} x2={46} y2={20} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

/** La cassetta delle lettere (il palo finisce in x, y). */
function Cassetta({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-7} y={-84} width={14} height={84} rx={6} fill={TINTE.tratto} />
      <path d="M -54 -84 V -134 Q -54 -160 -28 -160 H 28 Q 54 -160 54 -134 V -84 Z" fill={TEAL_CHIARO} stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-32} y={-136} width={64} height={10} rx={5} fill={TINTE.tratto} />
      <rect x={54} y={-150} width={8} height={40} rx={4} fill={TINTE.rischio} />
    </g>
  );
}

/** Un orologio senza numeri (centro in cx, cy). */
function Orologio({ cx, cy, r = 44 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      {Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2;
        return <circle key={k} cx={cx + Math.cos(a) * r * 0.78} cy={cy + Math.sin(a) * r * 0.78} r={k % 3 === 0 ? 4 : 2.5} fill={TINTE.tratto} />;
      })}
      <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.55} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + r * 0.4} y2={cy + r * 0.1} stroke={TINTE.accento} strokeWidth={6} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill={TINTE.tratto} />
    </g>
  );
}

/** Un'etichetta di testo che compare con una molla. */
function Scritta({ locale, fps, da, x, y, testo, corpo = 24, colore = TINTE.tratto, peso = 800 }: { locale: number; fps: number; da: number; x: number; y: number; testo: string; corpo?: number; colore?: string; peso?: number }) {
  return (
    <Compare v={molla(locale, da, fps)} cx={x} cy={y}>
      <Testo x={x} y={y} corpo={corpo} titolo peso={peso} colore={colore}>
        {testo}
      </Testo>
    </Compare>
  );
}

/* 2. «La ditta individuale non paga imposte per conto suo: le paghi tu. L'utile della ditta si somma al tuo reddito, e su tutto paghi le imposte alla Confederazione, al Cantone e al Comune. Anche la sostanza della ditta si somma alla tua.» */
const TU = { negozio: { x: 420, y: 330 }, persona: { x: 640, y: 330 }, pila: { x: 752, y: 330 }, porcello: { x: 900, y: 330 } } as const;
const ENTI = [
  { x: 450, testo: "Confederazione" },
  { x: 650, testo: "Cantone" },
  { x: 850, testo: "Comune" },
] as const;
const impTu: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.8, 0.25),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.8, 0.25) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.75, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const negozio = fra(ctx, null, 0, 0.1, 0.04);
    const niente = fra(ctx, null, 0, 0.4, 0.14);
    const tu = fra(ctx, null, 0, 0.75, 0.24);
    const utile = fra(ctx, 0, 1, 0.05, 0.3);
    const somma = fra(ctx, 0, 1, 0.75, 0.42);
    const enti = ENTI.map((_, i) => fra(ctx, 1, 2, 0.35 + i * 0.22, 0.5 + i * 0.08));
    const sostanza = fra(ctx, 2, null, 0.1, 0.8);
    const unisci = fra(ctx, 2, null, 0.55, 0.9);
    // Le tre monete dell'utile volano dalla ditta alla pila del reddito.
    const arrivate = [0, 1, 2].map((k) => tra(locale, utile + k * 9, utile + k * 9 + 20));
    const pila = 2 + arrivate.filter((p) => p >= 1).length;
    const porcellino = tra(locale, unisci, unisci + 24);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Le imposte le paghi tu" />
        <Compare v={molla(locale, negozio, fps)} cx={TU.negozio.x} cy={250}>
          <Negozio x={TU.negozio.x} y={TU.negozio.y} s={0.72} targa="La ditta" />
        </Compare>
        <Compare v={molla(locale, niente, fps)} cx={TU.negozio.x} cy={384}>
          <Pillola x={TU.negozio.x} y={384} testo="Non paga imposte" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Compare v={molla(locale, tu, fps)} cx={TU.persona.x} cy={250}>
          <Persona x={TU.persona.x} y={TU.persona.y} s={0.8} colore={TINTE.accento} />
          <Pillola x={TU.persona.x} y={142} testo="Le paghi tu" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, tu + 6, fps)} cx={TU.pila.x} cy={290}>
          <Pila x={TU.pila.x} y={TU.pila.y} n={pila} />
        </Compare>
        {arrivate.map((p, k) => (
          <Volo key={k} p={p} x1={TU.negozio.x + 60} y1={250} x2={TU.pila.x} y2={300 - pila * 16} alto={90} />
        ))}
        <Compare v={molla(locale, somma, fps)} cx={700} cy={384}>
          <Pillola x={700} y={384} testo="Utile + reddito" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Su tutto paghi le imposte: una moneta per ente. */}
        {ENTI.map((e, i) => (
          <g key={e.testo}>
            <Compare v={molla(locale, enti[i], fps)} cx={e.x} cy={580}>
              <Palazzo x={e.x} y={612} s={0.46} colore={i === 2 ? TEAL_CHIARO : TINTE.tratto} />
              <Testo x={e.x} y={648} corpo={22} titolo peso={800} colore={TINTE.tratto}>
                {e.testo}
              </Testo>
            </Compare>
            <Volo p={tra(locale, enti[i] + 4, enti[i] + 24)} x1={TU.pila.x} y1={290} x2={e.x} y2={560} alto={40} r={18} />
          </g>
        ))}
        {/* La sostanza: il salvadanaio della ditta va in quello tuo. */}
        <Compare v={molla(locale, sostanza, fps)} cx={TU.porcello.x} cy={290}>
          <g transform={`translate(${TU.porcello.x} ${TU.porcello.y}) scale(${1 + 0.12 * Math.sin(Math.PI * tra(locale, unisci + 18, unisci + 34))}) translate(${-TU.porcello.x} ${-TU.porcello.y})`}>
            <Salvadanaio x={TU.porcello.x - 8} y={TU.porcello.y} s={0.6} />
          </g>
          <Pillola x={TU.porcello.x} y={384} testo="Sostanza" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {porcellino < 1 ? (
          <Compare v={molla(locale, sostanza + 6, fps)} cx={530} cy={300}>
            <Salvadanaio
              x={530 + (TU.porcello.x - 8 - 530) * porcellino}
              y={318 - Math.sin(Math.PI * porcellino) * 150 + (TU.porcello.y - 318) * porcellino}
              s={0.32 + 0.1 * porcellino}
              colore={TINTE.accento}
            />
          </Compare>
        ) : null}
      </Tela>
    );
  },
};

/* 3. «Le imposte di un anno si calcolano dopo, con la dichiarazione che consegni all'inizio dell'anno seguente. Intanto si pagano degli acconti: rate calcolate sull'ultima tassazione che hai ricevuto.» */
const LINEA = { y: 330, da: 340, a: 960, taglio: 650 } as const;
const ACCONTI = [430, 510, 590] as const;
const impDopo: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.35) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.7, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const linea = fra(ctx, null, 0, 0.1, 0.04);
    const quest = fra(ctx, null, 0, 0.3, 0.1);
    const guadagni = fra(ctx, null, 0, 0.6, 0.15);
    const dopo = fra(ctx, 0, 1, 0.1, 0.22);
    const dichiarazione = fra(ctx, 0, 1, 0.45, 0.32);
    const calcolata = fra(ctx, 0, 1, 0.85, 0.45);
    const acconti = ACCONTI.map((_, i) => fra(ctx, 1, 2, 0.3 + i * 0.25, 0.55 + i * 0.04));
    const tassazione = fra(ctx, 2, null, 0.15, 0.75);
    const freccia = fra(ctx, 2, null, 0.5, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Le imposte arrivano dopo" />
        <Freccia d={`M ${LINEA.da} ${LINEA.y} H ${LINEA.a}`} p={tra(locale, linea, linea + 24)} spessore={8} />
        <line x1={LINEA.taglio} y1={LINEA.y - 26} x2={LINEA.taglio} y2={LINEA.y + 26} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" opacity={tra(locale, linea + 10, linea + 20)} />
        <Compare v={molla(locale, quest, fps)} cx={495} cy={130}>
          <Pillola x={495} y={130} testo="Quest'anno" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, dopo, fps)} cx={805} cy={130}>
          <Pillola x={805} y={130} testo="L'anno dopo" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* Quest'anno guadagni. */}
        <Compare v={molla(locale, guadagni, fps)} cx={495} cy={250}>
          <Pila x={460} y={300} n={3} r={24} />
          <Pila x={530} y={300} n={4} r={24} />
          <Testo x={495} y={190} corpo={22} titolo peso={800} colore={COLORE_TENUE}>
            guadagni
          </Testo>
        </Compare>
        {/* L'anno dopo: la dichiarazione e il calcolo dell'imposta. */}
        <Compare v={molla(locale, dichiarazione, fps)} cx={760} cy={240}>
          <Foglio x={700} y={170} w={130} h={140}>
            <Righe x={718} y={214} w={70} n={3} passo={24} />
          </Foglio>
          <Testo x={765} y={378} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Dichiarazione
          </Testo>
        </Compare>
        <Freccia d="M 838 250 H 870" p={tra(locale, calcolata - 6, calcolata + 4)} spessore={6} />
        <Compare v={molla(locale, calcolata, fps)} cx={910} cy={250}>
          <Moneta cx={910} cy={250} r={30} />
          <Spunta cx={936} cy={222} r={16} p={tra(locale, calcolata + 6, calcolata + 18)} />
          <Testo x={905} y={378} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Imposta
          </Testo>
        </Compare>
        {/* Intanto, gli acconti: rate durante l'anno. */}
        {ACCONTI.map((x, i) => (
          <Compare key={x} v={molla(locale, acconti[i], fps)} cx={x} cy={LINEA.y}>
            <Moneta cx={x} cy={LINEA.y} r={20} />
          </Compare>
        ))}
        <Compare v={molla(locale, acconti[2] + 4, fps)} cx={510} cy={392}>
          <Pillola x={510} y={392} testo="Acconti" corpo={24} fondo={TINTE.oro} colore={TINTE.carta} />
        </Compare>
        {/* … calcolati sull'ultima tassazione. */}
        <Compare v={molla(locale, tassazione, fps)} cx={400} cy={540}>
          <Foglio x={340} y={470} w={120} h={150}>
            <Righe x={356} y={518} w={60} n={3} passo={24} />
          </Foglio>
          <Testo x={480} y={530} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Ultima tassazione
          </Testo>
          <Testo x={480} y={566} corpo={22} peso={600} colore={COLORE_TENUE} ancora="start">
            quella che hai ricevuto
          </Testo>
        </Compare>
        <Freccia d="M 400 466 Q 410 420 450 410" p={tra(locale, freccia - 6, freccia + 10)} spessore={6} colore={TINTE.accento} />
      </Tela>
    );
  },
};

/* 4. «In Ticino l'imposta cantonale si paga in tre rate d'acconto, più un conguaglio dopo la tassazione. L'imposta federale ha una rata unica, entro il … marzo dell'anno dopo. E l'imposta comunale la chiede il tuo Comune.» */
const COLONNE = { cantone: 440, confederazione: 650, comune: 860, tetto: 300 } as const;
const impRate: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.55),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.8, 0.22) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.55) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.8, 0.92) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cantone = fra(ctx, null, 0, 0.12, 0.05);
    const rate = [0.4, 0.58, 0.76].map((f) => fra(ctx, null, 0, f, 0.2));
    const conguaglio = fra(ctx, 0, 1, 0.3, 0.32);
    const federale = fra(ctx, 1, 2, 0.08, 0.45);
    const unica = fra(ctx, 1, 2, 0.35, 0.52);
    const anno = fra(ctx, 1, 2, 0.7, 0.62);
    const comune = fra(ctx, 2, null, 0.2, 0.82);
    const sue = fra(ctx, 2, null, 0.6, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Le rate in Ticino" />
        {/* Il Cantone: tre acconti e il conguaglio. */}
        <Compare v={molla(locale, cantone, fps)} cx={COLONNE.cantone} cy={250}>
          <Palazzo x={COLONNE.cantone} y={COLONNE.tetto} s={0.55} />
          <Pillola x={COLONNE.cantone} y={340} testo="Cantone" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {[-55, 0, 55].map((dx, i) => (
          <Compare key={dx} v={molla(locale, rate[i], fps)} cx={COLONNE.cantone + dx} cy={412}>
            <Moneta cx={COLONNE.cantone + dx} cy={412} r={22} />
          </Compare>
        ))}
        <Scritta locale={locale} fps={fps} da={rate[2] + 4} x={COLONNE.cantone} y={458} testo="Tre acconti" corpo={22} />
        <Compare v={molla(locale, conguaglio, fps)} cx={COLONNE.cantone} cy={530}>
          <Moneta cx={COLONNE.cantone} cy={530} r={26} />
          <Spunta cx={COLONNE.cantone + 28} cy={506} r={15} p={tra(locale, conguaglio + 6, conguaglio + 18)} />
          <Testo x={COLONNE.cantone} y={584} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Conguaglio
          </Testo>
        </Compare>
        {/* La Confederazione: una rata unica, l'anno dopo. */}
        <Compare v={molla(locale, federale, fps)} cx={COLONNE.confederazione} cy={250}>
          <Palazzo x={COLONNE.confederazione} y={COLONNE.tetto} s={0.55} />
          <Pillola x={COLONNE.confederazione} y={340} testo="Confederazione" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, unica, fps)} cx={COLONNE.confederazione} cy={412}>
          <Moneta cx={COLONNE.confederazione} cy={412} r={26} />
        </Compare>
        <Scritta locale={locale} fps={fps} da={unica + 4} x={COLONNE.confederazione} y={458} testo="Rata unica" corpo={22} />
        <Compare v={molla(locale, anno, fps)} cx={COLONNE.confederazione} cy={540}>
          <Calendario cx={COLONNE.confederazione} cy={530} s={0.5} />
          <Testo x={COLONNE.confederazione} y={584} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            L&apos;anno dopo
          </Testo>
        </Compare>
        {/* Il Comune: le sue rate. */}
        <Compare v={molla(locale, comune, fps)} cx={COLONNE.comune} cy={250}>
          <Palazzo x={COLONNE.comune} y={COLONNE.tetto} s={0.55} colore={TEAL_CHIARO} />
          <Pillola x={COLONNE.comune} y={340} testo="Comune" corpo={24} fondo={TEAL_CHIARO} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, sue, fps)} cx={COLONNE.comune} cy={430}>
          <Moneta cx={COLONNE.comune - 28} cy={412} r={20} />
          <Moneta cx={COLONNE.comune + 28} cy={412} r={20} />
          <Testo x={COLONNE.comune} y={458} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Decide il Comune
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Ma attenzione: se compili la dichiarazione per la prima volta, le richieste di acconto non arrivano. Dopo la tassazione ricevi la polizza per tutta l'imposta, da pagare in … giorni. E può essere una somma importante.» */
const PRIMO = { persona: 380, cassetta: 565, foglio: { x: 670, y: 110, w: 270, h: 330 } } as const;
const impPrimoAnno: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.4, 0.35) },
      { tipo: "scuoti", quando: fra(ctx, 3, null, 0.5, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const persona = fra(ctx, null, 0, 0.12, 0.05);
    const prima = fra(ctx, null, 0, 0.6, 0.2);
    const cassetta = fra(ctx, null, 0, 0.85, 0.27);
    const lettera = fra(ctx, 0, 1, 0.1, 0.32);
    const niente = fra(ctx, 0, 1, 0.6, 0.38);
    const polizza = fra(ctx, 1, 2, 0.35, 0.5);
    const tutta = fra(ctx, 1, 2, 0.8, 0.6);
    const fretta = fra(ctx, 2, 3, 0.1, 0.72);
    const somma = fra(ctx, 3, null, 0.15, 0.85);
    const pila = 1 + 4 * tra(locale, somma, somma + 30);
    // La lettera dell'acconto arriva, ma non entra: svanisce prima della cassetta.
    const pl = tra(locale, lettera, lettera + 26);
    const arrivo = tra(locale, polizza - 22, polizza);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La prima dichiarazione" />
        <Compare v={molla(locale, persona, fps)} cx={PRIMO.persona} cy={380}>
          <Persona x={PRIMO.persona} y={470} s={0.85} colore={TINTE.accento} inclinata={locale > fretta ? -8 : 0} />
        </Compare>
        <Compare v={molla(locale, prima, fps)} cx={470} cy={560}>
          <Pillola x={470} y={560} testo="Prima dichiarazione" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, cassetta, fps)} cx={PRIMO.cassetta} cy={400}>
          <Cassetta x={PRIMO.cassetta} y={470} />
        </Compare>
        {pl > 0 && pl < 1 ? (
          <g opacity={1 - pl * pl}>
            <Busta cx={PRIMO.cassetta + 140 - 110 * pl} cy={190 + 70 * pl} s={0.6} />
          </g>
        ) : null}
        <Compare v={molla(locale, niente, fps)} cx={PRIMO.cassetta} cy={250}>
          <No cx={PRIMO.cassetta + 50} cy={300} r={22} />
          <Pillola x={PRIMO.cassetta} y={250} testo="Niente acconti" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        {/* Dopo la tassazione: la polizza per tutta l'imposta. */}
        {arrivo > 0 ? (
          <g transform={`translate(${(1 - arrivo) * 160} ${-(1 - arrivo) * 40})`} opacity={Math.min(1, arrivo * 2)}>
            <Foglio x={PRIMO.foglio.x} y={PRIMO.foglio.y} w={PRIMO.foglio.w} h={PRIMO.foglio.h}>
              <Testo x={PRIMO.foglio.x + 26} y={PRIMO.foglio.y + 62} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
                Polizza
              </Testo>
              <Righe x={PRIMO.foglio.x + 26} y={PRIMO.foglio.y + 110} w={150} n={2} passo={24} />
              <Pila x={PRIMO.foglio.x + PRIMO.foglio.w / 2} y={PRIMO.foglio.y + PRIMO.foglio.h - 24} n={pila} r={34} />
            </Foglio>
          </g>
        ) : null}
        <Compare v={molla(locale, tutta, fps)} cx={805} cy={474}>
          <Pillola x={805} y={474} testo="Tutta l'imposta" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {/* Da pagare in poco tempo. */}
        <Compare v={molla(locale, fretta, fps)} cx={PRIMO.persona} cy={222}>
          <Fumetto cx={PRIMO.persona} cy={222} r={52}>
            <Clessidra cx={PRIMO.persona} cy={222} s={0.62} />
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, somma + 10, fps)} cx={805} cy={560}>
          <Pillola x={805} y={560} testo="Somma importante" corpo={24} fondo={TINTE.rischio} colore={TINTE.carta} />
          <Avviso x={962} y={556} s={0.6} />
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Per evitarlo, chiedi all'Ufficio esazione e condoni, a Bellinzona, le polizze per pagamenti volontari. Indica i tuoi dati, il reddito e la sostanza che prevedi per l'anno. L'ufficio ti manda le polizze calcolate su quelle cifre.» */
const UFFICIO = { x: 830, y: 330 } as const;
const MODULO = { x: 420, y: 110, w: 290, h: 240 } as const;
const RIGHE_MODULO = ["I tuoi dati", "Reddito previsto", "Sostanza prevista"] as const;
const impPolizze: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.75, 0.15) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.85, 0.92) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const persona = fra(ctx, null, 0, 0.1, 0.04);
    const ufficio = fra(ctx, null, 0, 0.45, 0.12);
    const busta = fra(ctx, null, 0, 0.75, 0.18);
    const luogo = fra(ctx, 0, 1, 0.15, 0.26);
    const email = fra(ctx, 0, 1, 0.55, 0.36);
    const modulo = fra(ctx, 1, 2, 0.05, 0.47);
    const righe = RIGHE_MODULO.map((_, i) => fra(ctx, 1, 2, 0.15 + i * 0.3, 0.5 + i * 0.07));
    const ritorno = fra(ctx, 2, null, 0.15, 0.78);
    const calcolate = fra(ctx, 2, null, 0.6, 0.9);
    const pb = tra(locale, busta, busta + 26);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Chiedi le polizze" />
        <Compare v={molla(locale, persona, fps)} cx={360} cy={380}>
          <Persona x={360} y={470} s={0.8} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, ufficio, fps)} cx={UFFICIO.x} cy={260}>
          <Palazzo x={UFFICIO.x} y={UFFICIO.y} s={0.62} />
          <Righe2 x={UFFICIO.x} y={378} righe={["Ufficio esazione", "e condoni"]} corpo={24} passo={30} />
        </Compare>
        <Scritta locale={locale} fps={fps} da={luogo} x={UFFICIO.x} y={448} testo="Bellinzona" corpo={22} colore={COLORE_TENUE} peso={700} />
        <Compare v={molla(locale, email, fps)} cx={UFFICIO.x} cy={500}>
          <Pillola x={UFFICIO.x} y={500} testo="dfe-dc.uec@ti.ch" corpo={20} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* La richiesta va all'ufficio. */}
        {pb > 0 && pb < 1 ? <Busta cx={420 + (UFFICIO.x - 70 - 420) * pb} cy={380 - 100 * pb - Math.sin(Math.PI * pb) * 90} s={0.6} /> : null}
        {/* Nella richiesta: dati, reddito e sostanza previsti. */}
        <Compare v={molla(locale, modulo, fps)} cx={MODULO.x + MODULO.w / 2} cy={MODULO.y + MODULO.h / 2}>
          <Foglio x={MODULO.x} y={MODULO.y} w={MODULO.w} h={MODULO.h} />
        </Compare>
        {RIGHE_MODULO.map((testo, i) => {
          const y = MODULO.y + 70 + i * 60;
          return (
            <Compare key={testo} v={molla(locale, righe[i], fps)} cx={MODULO.x + 120} cy={y}>
              <Spunta cx={MODULO.x + 36} cy={y} r={16} p={tra(locale, righe[i] + 4, righe[i] + 16)} />
              <Testo x={MODULO.x + 62} y={y} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
                {testo}
              </Testo>
            </Compare>
          );
        })}
        {/* Le polizze tornano a te. */}
        {[0, 1, 2].map((k) => {
          const p = tra(locale, ritorno + k * 8, ritorno + k * 8 + 24);
          if (p <= 0) return null;
          const x = UFFICIO.x - 40 + (520 + k * 34 - UFFICIO.x + 40) * p;
          const y = 300 + (560 - k * 18 - 300) * p - Math.sin(Math.PI * p) * 80;
          return <Polizza key={k} cx={x} cy={y} s={0.75} />;
        })}
        <Compare v={molla(locale, calcolate, fps)} cx={560} cy={640}>
          <Pillola x={560} y={640} testo="Calcolate sulle tue cifre" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «E se gli acconti li ricevi già, per esempio perché hai lavorato da dipendente? Sono calcolati sulla tassazione vecchia, senza il reddito della ditta. Se il tuo reddito cambia molto, puoi chiedere acconti adatti a quello nuovo.» */
const BARRE = { base: 560, vecchia: 520, nuova: 760, w: 100, alto: 150, ditta: 190 } as const;
const impVecchia: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.75, 0.55) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.8, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const persona = fra(ctx, null, 0, 0.1, 0.05);
    const valigetta = fra(ctx, null, 0, 0.55, 0.18);
    const polizza = fra(ctx, null, 0, 0.3, 0.12);
    const vecchia = fra(ctx, 0, 1, 0.12, 0.36);
    const nuova = fra(ctx, 0, 1, 0.45, 0.45);
    const senza = fra(ctx, 0, 1, 0.8, 0.56);
    const adatti = fra(ctx, 1, null, 0.45, 0.8);
    const h1 = BARRE.alto * tra(locale, vecchia, vecchia + 16);
    const h2 = BARRE.alto * tra(locale, nuova, nuova + 16);
    const h3 = BARRE.ditta * tra(locale, nuova + 12, nuova + 30);
    const contorno = tra(locale, adatti, adatti + 24);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Ricevi già gli acconti?" />
        <Compare v={molla(locale, persona, fps)} cx={370} cy={380}>
          <Persona x={370} y={470} s={0.8} />
        </Compare>
        <Compare v={molla(locale, valigetta, fps)} cx={425} cy={440}>
          <Valigetta x={428} y={468} s={0.62} />
        </Compare>
        <Compare v={molla(locale, polizza, fps)} cx={430} cy={180}>
          <Polizza cx={430} cy={160} s={0.85} />
          <Testo x={430} y={222} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Acconti
          </Testo>
        </Compare>
        {/* Le due barre: la tassazione vecchia e il reddito con la ditta. */}
        <line x1={480} y1={BARRE.base} x2={880} y2={BARRE.base} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" opacity={tra(locale, vecchia - 6, vecchia + 4)} />
        {h1 > 0 ? <rect x={BARRE.vecchia - BARRE.w / 2} y={BARRE.base - h1} width={BARRE.w} height={h1} rx={10} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} /> : null}
        <Scritta locale={locale} fps={fps} da={vecchia + 6} x={BARRE.vecchia} y={600} testo="Tassazione vecchia" corpo={22} />
        {h2 > 0 ? <rect x={BARRE.nuova - BARRE.w / 2} y={BARRE.base - h2} width={BARRE.w} height={h2} rx={10} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} /> : null}
        {h3 > 0 ? (
          <g>
            <rect x={BARRE.nuova - BARRE.w / 2} y={BARRE.base - BARRE.alto - h3 - 6} width={BARRE.w} height={h3} rx={10} fill={TINTE.accento} />
            {h3 > BARRE.ditta * 0.8 ? (
              <Testo x={BARRE.nuova} y={BARRE.base - BARRE.alto - BARRE.ditta / 2 - 6} corpo={22} titolo peso={800} colore={TINTE.carta}>
                Ditta
              </Testo>
            ) : null}
          </g>
        ) : null}
        <Scritta locale={locale} fps={fps} da={nuova + 6} x={BARRE.nuova} y={600} testo="Con la ditta" corpo={22} />
        {/* Gli acconti guardano solo la barra vecchia. */}
        <Freccia d={`M 492 160 Q ${BARRE.vecchia} 170 ${BARRE.vecchia} ${BARRE.base - BARRE.alto - 18}`} p={tra(locale, vecchia + 12, vecchia + 28)} spessore={6} tratteggio />
        <Compare v={molla(locale, senza, fps)} cx={BARRE.vecchia} cy={642}>
          <Pillola x={BARRE.vecchia} y={642} testo="Senza la ditta" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        {/* Acconti adatti: il contorno verde sale fino in cima. */}
        {contorno > 0 ? (
          <rect
            x={BARRE.nuova - BARRE.w / 2 - 12}
            y={BARRE.base - (BARRE.alto + BARRE.ditta + 18) * contorno}
            width={BARRE.w + 24}
            height={(BARRE.alto + BARRE.ditta + 18) * contorno}
            rx={14}
            fill="none"
            stroke={TINTE.ok}
            strokeWidth={6}
            strokeDasharray="14 10"
          />
        ) : null}
        <Compare v={molla(locale, adatti + 18, fps)} cx={BARRE.nuova} cy={176}>
          <Pillola x={BARRE.nuova} y={176} testo="Acconti adatti" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Pagare prima conviene. Per l'imposta cantonale, se paghi in anticipo ricevi un piccolo interesse: nel … lo …. Se paghi più di … giorni dopo la scadenza, invece, c'è un interesse di ritardo: nel … il ….» */
const TEMPO = { y: 360, da: 340, a: 970, scadenza: 640, termine: 790, prima: 470, tardi: 890 } as const;
const impInteressi: Disegno = {
  chiave: (ctx) => fra(ctx, 2, 3, 0.4, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "festeggia", quando: fra(ctx, 2, 3, 0.55, 0.45) },
      { tipo: "scuoti", quando: fra(ctx, 4, null, 0.4, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const linea = fra(ctx, null, 0, 0.1, 0.03);
    const bandiera = fra(ctx, null, 0, 0.55, 0.06);
    const cantonale = fra(ctx, 0, 1, 0.3, 0.12);
    const prima = fra(ctx, 1, 2, 0.1, 0.24);
    const interesse = fra(ctx, 2, 3, 0.25, 0.4);
    const termine = fra(ctx, 3, 4, 0.2, 0.58);
    const tardi = fra(ctx, 3, 4, 0.7, 0.68);
    const ritardo = fra(ctx, 4, null, 0.3, 0.85);
    const pi = tra(locale, interesse, interesse + 16);
    const pr = tra(locale, ritardo, ritardo + 16);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Pagare prima conviene" />
        <Compare v={molla(locale, cantonale, fps)} cx={655} cy={112}>
          <Pillola x={655} y={112} testo="Imposta cantonale" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} />
        </Compare>
        <Freccia d={`M ${TEMPO.da} ${TEMPO.y} H ${TEMPO.a}`} p={tra(locale, linea, linea + 22)} spessore={8} />
        {/* La scadenza: una bandierina sulla linea del tempo. */}
        <Compare v={molla(locale, bandiera, fps)} cx={TEMPO.scadenza} cy={300}>
          <line x1={TEMPO.scadenza} y1={TEMPO.y} x2={TEMPO.scadenza} y2={226} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
          <path d={`M ${TEMPO.scadenza} 228 h 74 l -16 22 l 16 22 h -74 Z`} fill={TINTE.accento} />
          <Testo x={TEMPO.scadenza} y={198} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Scadenza
          </Testo>
        </Compare>
        {/* Prima della scadenza: un piccolo interesse in più. */}
        <Compare v={molla(locale, prima, fps)} cx={TEMPO.prima} cy={TEMPO.y}>
          <Moneta cx={TEMPO.prima} cy={TEMPO.y} r={28} />
        </Compare>
        {pi > 0 ? (
          <g opacity={pi}>
            <Moneta cx={TEMPO.prima + 40 * pi} cy={TEMPO.y - 30 - 50 * pi} r={14} />
            <Testo x={TEMPO.prima + 70 * pi} y={TEMPO.y - 40 - 60 * pi} corpo={34} titolo peso={800} colore={TINTE.ok}>
              +
            </Testo>
          </g>
        ) : null}
        <Compare v={molla(locale, interesse + 8, fps)} cx={TEMPO.prima} cy={440}>
          <Pillola x={TEMPO.prima} y={440} testo="Piccolo interesse" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Il termine per pagare dopo la scadenza, e poi il ritardo. */}
        {tra(locale, termine, termine + 16) > 0 ? (
          <g opacity={tra(locale, termine, termine + 16)}>
            <path d={`M ${TEMPO.scadenza + 6} ${TEMPO.y + 26} V ${TEMPO.y + 38} H ${TEMPO.termine} V ${TEMPO.y + 26}`} fill="none" stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            <Testo x={(TEMPO.scadenza + TEMPO.termine) / 2} y={TEMPO.y + 66} corpo={22} titolo peso={800} colore={TINTE.tratto}>
              Termine
            </Testo>
          </g>
        ) : null}
        <Compare v={molla(locale, tardi, fps)} cx={TEMPO.tardi} cy={TEMPO.y}>
          <Moneta cx={TEMPO.tardi} cy={TEMPO.y} r={28} />
          <Avviso x={TEMPO.tardi} y={276} s={0.55} />
        </Compare>
        {pr > 0 ? (
          <g opacity={pr}>
            <Testo x={TEMPO.tardi + 46} y={TEMPO.y - 40 - 20 * pr} corpo={40} titolo peso={800} colore={TINTE.rischio}>
              −
            </Testo>
          </g>
        ) : null}
        <Compare v={molla(locale, ritardo + 8, fps)} cx={850} cy={480}>
          <Pillola x={850} y={480} testo="Interesse di ritardo" corpo={22} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 9. «Quanto mettere da parte? Dipende dal tuo reddito, dalla tua sostanza e dal tuo Comune. Per farti un'idea, la Confederazione ha un calcolatore d'imposta online.» */
const FATTORI = [
  { testo: "Reddito", y: 150 },
  { testo: "Sostanza", y: 245 },
  { testo: "Comune", y: 340 },
] as const;
const impQuanto: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.4, 0.7),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.6, 0.1) },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.4, 0.7) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const porcello = fra(ctx, null, 0, 0.15, 0.03);
    const domanda = fra(ctx, null, 0, 0.6, 0.08);
    const fattori = FATTORI.map((_, i) => fra(ctx, 0, 1, 0.2 + i * 0.3, 0.2 + i * 0.1));
    const computer = fra(ctx, 1, null, 0.3, 0.65);
    const idea = fra(ctx, 1, null, 0.12, 0.58);
    const confederazione = fra(ctx, 1, null, 0.6, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Quanto mettere da parte?" />
        <Compare v={molla(locale, porcello, fps)} cx={460} cy={270}>
          <Salvadanaio x={450} y={350} s={1.15} />
        </Compare>
        <Compare v={molla(locale, domanda, fps)} cx={560} cy={150}>
          <Fumetto cx={560} cy={150} r={40}>
            <Testo x={560} y={152} corpo={46} titolo peso={800} colore={TINTE.accento}>
              ?
            </Testo>
          </Fumetto>
        </Compare>
        {FATTORI.map((f, i) => (
          <g key={f.testo}>
            <Freccia d={`M 760 ${f.y} Q 680 ${f.y} 600 ${250 + (i - 1) * 24}`} p={tra(locale, fattori[i] + 4, fattori[i] + 16)} spessore={6} colore={TINTE.accento} />
            <Compare v={molla(locale, fattori[i], fps)} cx={860} cy={f.y}>
              <Pillola x={860} y={f.y} testo={f.testo} corpo={28} fondo={i === 2 ? TEAL_CHIARO : TINTE.tratto} colore={TINTE.carta} />
            </Compare>
          </g>
        ))}
        {/* Per farti un'idea: il calcolatore della Confederazione. */}
        <Compare v={molla(locale, idea, fps)} cx={400} cy={470}>
          <Lampadina cx={400} cy={470} s={1.1} />
        </Compare>
        <Compare v={molla(locale, computer, fps)} cx={540} cy={580}>
          <Computer cx={540} cy={580} s={0.8} />
          <rect x={500} y={548} width={80} height={10} rx={5} fill={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, confederazione, fps)} cx={790} cy={560}>
          <Bandiera cx={672} cy={560} lato={44} />
          <Righe2 x={820} y={545} righe={["Calcolatore", "della Confederazione"]} corpo={24} passo={32} />
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Bleo ha due strumenti che ti aiutano. Nel «Budget del primo anno» scegli una percentuale per le imposte, e vedi quanto mettere da parte ogni mese. Nella «Tariffa oraria», la stessa riserva entra nel prezzo della tua ora.» */
const CARTA_BUDGET = { x: 330, y: 96, w: 320, h: 470 } as const;
const CARTA_TARIFFA = { x: 670, y: 96, w: 310, h: 470 } as const;
const MESI_BUDGET = Array.from({ length: 12 }, (_, i) => ({ x: 364 + i * 22.5, alto: 70 + ((i * 37) % 50) }));
const impStrumenti: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.2),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.1) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.8, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const budget = fra(ctx, null, 0, 0.2, 0.04);
    const tariffa = fra(ctx, null, 0, 0.6, 0.1);
    const cursore = fra(ctx, 0, 1, 0.3, 0.25);
    const mesi = fra(ctx, 1, 2, 0.05, 0.45);
    const riserva = fra(ctx, 2, null, 0.35, 0.8);
    const pc = tra(locale, cursore, cursore + 30);
    const xc = 380 + 110 * pc;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Gli strumenti di Bleo" />
        {/* Budget del primo anno: la percentuale e ogni mese un po' da parte. */}
        <Compare v={molla(locale, budget, fps)} cx={CARTA_BUDGET.x + CARTA_BUDGET.w / 2} cy={330}>
          <rect x={CARTA_BUDGET.x} y={CARTA_BUDGET.y} width={CARTA_BUDGET.w} height={CARTA_BUDGET.h} rx={26} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <Righe2 x={CARTA_BUDGET.x + CARTA_BUDGET.w / 2} y={146} righe={["Budget del", "primo anno"]} corpo={30} passo={36} />
          <Testo x={CARTA_BUDGET.x + CARTA_BUDGET.w / 2} y={242} corpo={22} titolo peso={800} colore={COLORE_TENUE}>
            Riserva imposte
          </Testo>
          <line x1={370} y1={290} x2={610} y2={290} stroke={TINTE.tinta} strokeWidth={12} strokeLinecap="round" />
          <line x1={370} y1={290} x2={xc} y2={290} stroke={TINTE.accento} strokeWidth={12} strokeLinecap="round" />
          <circle cx={xc} cy={290} r={22} fill={TINTE.carta} stroke={TINTE.accento} strokeWidth={6} />
          <Testo x={xc} y={291} corpo={20} titolo peso={800} colore={TINTE.accento}>
            %
          </Testo>
          {MESI_BUDGET.map((m, i) => {
            const da = mesi + i * 5;
            const h = m.alto * tra(locale, budget + 8, budget + 24);
            const parte = 22 * tra(locale, da, da + 8);
            return (
              <g key={m.x}>
                <rect x={m.x - 7} y={480 - h} width={14} height={h} rx={5} fill={TINTE.tinta} />
                {parte > 0 ? <rect x={m.x - 7} y={480 - h - parte - 3} width={14} height={parte} rx={5} fill={TINTE.accento} /> : null}
              </g>
            );
          })}
          <line x1={352} y1={483} x2={628} y2={483} stroke={TINTE.tratto} strokeWidth={4} strokeLinecap="round" />
        </Compare>
        <Scritta locale={locale} fps={fps} da={mesi + 12} x={CARTA_BUDGET.x + CARTA_BUDGET.w / 2} y={526} testo="Da parte ogni mese" corpo={22} colore={TINTE.accento} />
        {/* Tariffa oraria: la riserva entra nel prezzo dell'ora. */}
        <Compare v={molla(locale, tariffa, fps)} cx={CARTA_TARIFFA.x + CARTA_TARIFFA.w / 2} cy={330}>
          <rect x={CARTA_TARIFFA.x} y={CARTA_TARIFFA.y} width={CARTA_TARIFFA.w} height={CARTA_TARIFFA.h} rx={26} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <Righe2 x={CARTA_TARIFFA.x + CARTA_TARIFFA.w / 2} y={146} righe={["Tariffa", "oraria"]} corpo={30} passo={36} />
          <Orologio cx={735} cy={290} r={40} />
          <rect x={790} y={400} width={64} height={80} rx={8} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={4} />
          <rect x={790} y={350} width={64} height={46} rx={8} fill={TINTE.crema} stroke={TINTE.tratto} strokeWidth={4} />
          <Testo x={866} y={440} corpo={20} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Reddito
          </Testo>
          <Testo x={866} y={373} corpo={20} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Costi
          </Testo>
          <line x1={776} y1={483} x2={868} y2={483} stroke={TINTE.tratto} strokeWidth={4} strokeLinecap="round" />
        </Compare>
        {tra(locale, riserva, riserva + 16) > 0 ? (
          <g transform={`translate(0 ${-40 * (1 - tra(locale, riserva, riserva + 16))})`} opacity={tra(locale, riserva, riserva + 16)}>
            <rect x={790} y={296} width={64} height={50} rx={8} fill={TINTE.accento} />
            <Testo x={866} y={321} corpo={20} titolo peso={800} colore={TINTE.accento} ancora="start">
              Imposte
            </Testo>
          </g>
        ) : null}
        <Scritta locale={locale} fps={fps} da={riserva + 14} x={CARTA_TARIFFA.x + CARTA_TARIFFA.w / 2} y={526} testo="Nel prezzo dell'ora" corpo={22} colore={TINTE.accento} />
      </Tela>
    );
  },
};

export const DISEGNI_ACCONTI_IMPOSTE: Record<string, Disegno> = {
  "imp-tu": impTu,
  "imp-dopo": impDopo,
  "imp-rate": impRate,
  "imp-primo-anno": impPrimoAnno,
  "imp-polizze": impPolizze,
  "imp-vecchia": impVecchia,
  "imp-interessi": impInteressi,
  "imp-quanto": impQuanto,
  "imp-strumenti": impStrumenti,
};
