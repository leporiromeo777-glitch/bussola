/**
 * I disegni della lezione 6 («Lavorare in proprio nella salute»), vedi
 * src/lezioni/autorizzazione-sanitaria.ts. Fonti: legge sanitaria ticinese,
 * regolamenti sull'estetista e sulle tasse, pagine dell'Ufficio di sanità,
 * nota della SEFRI sulle terapie complementari, LAMal. Coordinate della tela
 * 1000×700; l'angolo in basso a sinistra (x < 300, y > 480) è della finestra
 * di Bleo.
 */
import { Avviso, Compare, Foglio, Freccia, molla, Moneta, Negozio, Palazzo, Persona, Pillola, Righe, Spunta, TEAL_CHIARO, Testo, Timbro, TINTE, tra } from "../figure";
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

/** Una croce bianca su un tondo rosso: la sanità. */
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

/** Una busta da lettera (angolo in alto a sinistra in x, y). */
function Busta({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d={`M ${x + 8} ${y + 10} L ${x + w / 2} ${y + h * 0.58} L ${x + w - 8} ${y + 10}`} fill="none" stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** Una pila di monete, senza cifre: `n` monete sopra la base. */
function Pila({ cx, base, n }: { cx: number; base: number; n: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const cy = base - 14 - i * 18;
        return (
          <g key={i}>
            <ellipse cx={cx} cy={cy + 8} rx={46} ry={15} fill={TINTE.accento} />
            <rect x={cx - 46} y={cy} width={92} height={8} fill={TINTE.accento} />
            <ellipse cx={cx} cy={cy} rx={46} ry={15} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
}

/** La tessera della cassa malati (angolo in alto a sinistra in x, y). */
function Tessera({ x, y, w = 220, h = 140 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={x + 3} y={y + 26} width={w - 6} height={24} fill={TINTE.tinta} />
      <Croce cx={x + 44} cy={y + h - 40} r={22} />
      <Righe x={x + 84} y={y + h - 52} w={w - 116} n={2} passo={24} />
    </g>
  );
}

/** Un lettino con una persona sdraiata che si rilassa. */
function Lettino({ x, y, locale }: { x: number; y: number; locale: number }) {
  // (x, y): l'angolo in alto a sinistra del piano del lettino, lungo 300.
  const respiro = Math.sin(locale / 9) * 2;
  return (
    <g>
      <rect x={x + 20} y={y + 14} width={14} height={70} rx={6} fill={TINTE.tratto} />
      <rect x={x + 266} y={y + 14} width={14} height={70} rx={6} fill={TINTE.tratto} />
      <rect x={x} y={y} width={300} height={22} rx={11} fill={TINTE.tratto} />
      <circle cx={x + 42} cy={y - 24} r={24} fill={TEAL_CHIARO} />
      <rect x={x + 70} y={y - 42 - respiro} width={200} height={40 + respiro} rx={20} fill={TEAL_CHIARO} />
      {/* il telo sulle gambe */}
      <rect x={x + 170} y={y - 48 - respiro} width={112} height={48 + respiro} rx={16} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={4} />
      {/* tre segni di relax sopra la testa */}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${x + 20 + i * 26} ${y - 74 - (i % 2) * 8} q 8 -10 16 0`}
          fill="none"
          stroke={TINTE.oro}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.6 + 0.4 * Math.sin(locale / 7 + i)}
        />
      ))}
    </g>
  );
}

/** Una riga «no» con il tondo rosso e il testo (da x a 980). */
function RigaNo({ x, y, testo }: { x: number; y: number; testo: string }) {
  return (
    <g>
      <rect x={x} y={y - 34} width={980 - x} height={68} rx={22} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={4} />
      <No cx={x + 40} cy={y} r={20} />
      <Testo x={x + 76} y={y + 1} corpo={28} titolo peso={800} colore={TINTE.rischio} ancora="start">
        {testo}
      </Testo>
    </g>
  );
}

/* 2. «In Ticino le attività sanitarie hanno bisogno di un'autorizzazione. Se lavori sotto la tua responsabilità, … la rilascia l'Ufficio di sanità. Si chiama autorizzazione di libero esercizio.» */
const sanRegola: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.4, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.25) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.4, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const foglio = fra(ctx, null, 0, 0.6, 0.25);
    const responsabile = fra(ctx, 0, 1, 0.3, 0.4);
    const ufficio = fra(ctx, 1, 2, 0.6, 0.65);
    const nome = fra(ctx, 2, null, 0.35, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Attività sanitaria" />
        <Compare v={molla(locale, 4, fps)} cx={430} cy={330}>
          <Persona x={430} y={400} colore={TEAL_CHIARO} />
          <Croce cx={492} cy={214} r={26} />
          <Pillola x={440} y={450} testo="Attività sanitaria" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 505 250 Q 540 200 590 200" p={tra(locale, foglio - 8, foglio + 4)} />
        <Compare v={molla(locale, foglio, fps)} cx={670} cy={210}>
          <Foglio x={600} y={120} w={140} h={180}>
            <Righe x={618} y={170} w={90} n={3} passo={26} />
          </Foglio>
          <g opacity={tra(locale, ufficio + 10, ufficio + 16)}>
            <Timbro cx={680} cy={265} r={34} />
          </g>
        </Compare>
        <Compare v={molla(locale, responsabile, fps)} cx={500} cy={530}>
          <Pillola x={510} y={530} testo="Sotto la tua responsabilità" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Freccia d="M 850 240 Q 830 180 760 190" p={tra(locale, ufficio + 4, ufficio + 14)} />
        <Compare v={molla(locale, ufficio, fps)} cx={850} cy={360}>
          <Palazzo x={850} y={400} s={0.8} nome="TI" />
          <Pillola x={850} y={445} testo="Ufficio di sanità" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, nome, fps)} cx={670} cy={620}>
          <Pillola x={700} y={620} testo="Libero esercizio" corpo={32} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Prima ottieni l'autorizzazione, poi inizi a lavorare. Chi non rispetta la legge sanitaria rischia una multa …» */
const sanPrima: Disegno = {
  chiave: (ctx) => fra(ctx, 0, null, 0.5, 0.75),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.75, 0.4) },
      { tipo: "scuoti", quando: fra(ctx, 0, null, 0.5, 0.75) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const autorizzazione = fra(ctx, null, 0, 0.2, 0.15);
    const inizi = fra(ctx, null, 0, 0.7, 0.4);
    const multa = fra(ctx, 0, null, 0.45, 0.75);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Prima l'autorizzazione" />
        <Compare v={molla(locale, autorizzazione, fps)} cx={440} cy={240}>
          <Foglio x={370} y={130} w={140} h={180}>
            <Righe x={388} y={180} w={90} n={3} passo={26} />
          </Foglio>
          <g opacity={tra(locale, autorizzazione + 8, autorizzazione + 14)}>
            <Timbro cx={450} cy={275} r={34} />
          </g>
          <Pillola x={440} y={355} testo="Prima" corpo={28} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 545 230 Q 600 200 655 230" p={tra(locale, inizi - 10, inizi + 2)} />
        <Compare v={molla(locale, inizi, fps)} cx={800} cy={280}>
          <Negozio x={800} y={330} s={0.8} targa="Studio" />
          <Pillola x={800} y={375} testo="Poi inizi" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, multa, fps)} cx={650} cy={545}>
          <rect x={370} y={480} width={580} height={130} rx={28} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={5} />
          <Avviso x={440} y={548} s={0.85} />
          <Moneta cx={525} cy={540} r={28} />
          <Moneta cx={560} cy={560} r={28} />
          <Testo x={605} y={528} corpo={28} titolo peso={800} colore={TINTE.rischio} ancora="start">
            Senza autorizzazione:
          </Testo>
          <Testo x={605} y={566} corpo={28} titolo peso={800} colore={TINTE.rischio} ancora="start">
            rischi una multa
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Quali professioni? La legge sanitaria le elenca. Per esempio medico, dentista e farmacista. Poi fisioterapista e infermiere, osteopata, psicologo e ottico. E anche massaggiatore medicale ed estetista.» */
const sanProfessioni = elenco(
  "Le professioni della legge",
  ["Medico, dentista, farmacista", "Fisioterapista, infermiere", "Osteopata, psicologo, ottico", "Massaggiatore medicale, estetista"],
  (ctx) => [fra(ctx, 1, 2, 0.25, 0.3), fra(ctx, 2, 3, 0.2, 0.5), fra(ctx, 2, 3, 0.65, 0.65), fra(ctx, 3, null, 0.35, 0.85)],
);

/* 5. «Per l'estetista, però, l'autorizzazione serve solo per alcuni trattamenti. Per esempio il trucco permanente, il microblading e il microneedling. O l'epilazione elettrica e il drenaggio linfatico a fini estetici.» */
const sanEstetista = elenco(
  "Estetista: solo alcuni trattamenti",
  ["Trucco permanente", "Microblading, microneedling", "Epilazione elettrica", "Drenaggio linfatico estetico"],
  (ctx) => [fra(ctx, 0, 1, 0.35, 0.4), fra(ctx, 0, 1, 0.75, 0.55), fra(ctx, 1, null, 0.25, 0.7), fra(ctx, 1, null, 0.65, 0.85)],
);

/* 6. «E il massaggio classico o rilassante? … non è un trattamento sanitario … Però non puoi trattare persone malate, né fare il lavoro del fisioterapista o del massaggiatore medicale.» */
const sanMassaggio: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 2, 0.4, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 2, 0.4, 0.4) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.3, 0.75) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const nonSanitario = fra(ctx, 0, 1, 0.45, 0.3);
    const niente = fra(ctx, 1, 2, 0.4, 0.45);
    const malati = fra(ctx, 2, 3, 0.45, 0.65);
    const fisio = fra(ctx, 3, null, 0.4, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Massaggio classico" />
        <Compare v={molla(locale, 4, fps, true)} cx={490} cy={280}>
          <Lettino x={340} y={300} locale={locale} />
          <Pillola x={490} y={420} testo="Classico o rilassante" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, nonSanitario, fps)} cx={830} cy={220}>
          <Righe2 x={830} y={200} righe={["Non è un trattamento", "sanitario"]} corpo={28} passo={36} />
        </Compare>
        <Compare v={molla(locale, niente, fps)} cx={830} cy={330}>
          <Pillola x={830} y={330} testo="Niente autorizzazione" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, malati, fps)} cx={650} cy={510}>
          <RigaNo x={330} y={510} testo="Niente persone malate" />
        </Compare>
        <Compare v={molla(locale, fisio, fps)} cx={650} cy={600}>
          <RigaNo x={330} y={600} testo="Niente lavoro del fisioterapista" />
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Per le terapie complementari, decide ogni Cantone. In Ticino alcuni metodi, come lo shiatsu o la riflessoterapia, sono riservati a chi ha il diploma federale. Per gli altri metodi, di regola, serve un esame cantonale: poi chiedi l'autorizzazione di terapista complementare.» */
const sanComplementari: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.15) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.5, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cantone = fra(ctx, null, 0, 0.45, 0.12);
    const shiatsu = fra(ctx, 0, 1, 0.45, 0.25);
    const riflesso = fra(ctx, 0, 1, 0.8, 0.32);
    const diploma = fra(ctx, 1, 2, 0.3, 0.45);
    const esame = fra(ctx, 2, 3, 0.55, 0.65);
    const terapista = fra(ctx, 3, null, 0.4, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Terapie complementari" />
        <Compare v={molla(locale, cantone, fps)} cx={420} cy={280}>
          <Palazzo x={420} y={330} s={0.85} nome="TI" colore={TINTE.accento} />
          <Testo x={420} y={372} corpo={26} titolo peso={800} colore={TINTE.accento}>
            Decide il Cantone
          </Testo>
        </Compare>
        {/* Alcuni metodi: solo con il diploma federale. */}
        <Compare v={molla(locale, shiatsu, fps)} cx={870} cy={150}>
          <Pillola x={870} y={150} testo="Shiatsu" corpo={24} fondo={TINTE.crema} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, riflesso, fps)} cx={870} cy={215}>
          <Pillola x={870} y={215} testo="Riflessoterapia" corpo={24} fondo={TINTE.crema} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 772 192 Q 750 184 730 196" p={tra(locale, diploma - 6, diploma + 6)} />
        <Compare v={molla(locale, diploma, fps)} cx={650} cy={210}>
          <Foglio x={590} y={110} w={120} h={150}>
            <Righe x={606} y={154} w={74} n={3} passo={22} />
          </Foglio>
          <g opacity={tra(locale, diploma + 8, diploma + 14)}>
            <Timbro cx={660} cy={226} r={28} />
          </g>
          <Righe2 x={650} y={295} righe={["Diploma", "federale"]} corpo={26} passo={32} />
        </Compare>
        {/* Gli altri metodi: esame cantonale, poi l'autorizzazione. */}
        <Compare v={molla(locale, esame, fps)} cx={600} cy={500}>
          <Foglio x={545} y={430} w={110} h={130} />
          <Spunta cx={600} cy={500} r={30} p={tra(locale, esame + 6, esame + 18)} />
          <Testo x={600} y={595} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Esame cantonale
          </Testo>
        </Compare>
        <Freccia d="M 675 495 L 740 495" p={tra(locale, terapista - 8, terapista + 2)} />
        <Compare v={molla(locale, terapista, fps)} cx={865} cy={495}>
          <rect x={755} y={425} width={225} height={140} rx={24} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
          <Righe2 x={867} y={462} righe={["Terapista", "complementare", "cantonale"]} corpo={26} passo={33} colore={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Ti servono un diploma riconosciuto, una buona conoscenza dell'italiano e un'assicurazione … Alleghi anche l'estratto del casellario giudiziale e un certificato medico …» */
const sanRequisiti = elenco(
  "Cosa ti serve",
  ["Un diploma riconosciuto", "L'italiano e un'assicurazione", "L'estratto del casellario", "Un certificato medico"],
  (ctx) => [fra(ctx, null, 0, 0.55, 0.2), fra(ctx, 0, 1, 0.5, 0.4), fra(ctx, 1, 2, 0.45, 0.6), fra(ctx, 1, 2, 0.85, 0.75)],
);

/* 9. «Paghi prima la tassa online, poi spedisci la domanda su carta all'Ufficio di sanità … La tassa va da … a …, oppure da … a … per le professioni con formazione universitaria.» */
const sanDomanda: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.5, 0.15),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.15) },
      { tipo: "lancia", quando: fra(ctx, 2, null, 0.45, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tassa = fra(ctx, null, 0, 0.35, 0.1);
    const busta = fra(ctx, 0, 1, 0.3, 0.25);
    const ufficio = fra(ctx, 0, 1, 0.7, 0.4);
    const altre = fra(ctx, 1, 2, 0.45, 0.6);
    const universitarie = fra(ctx, 2, null, 0.45, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La domanda" />
        <Compare v={molla(locale, tassa, fps)} cx={420} cy={250}>
          <Pila cx={420} base={290} n={3} />
          <Pillola x={420} y={345} testo="Prima la tassa" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 520 240 L 570 240" p={tra(locale, busta - 8, busta + 2)} />
        <Compare v={molla(locale, busta, fps)} cx={650} cy={240}>
          <Busta x={585} y={195} w={130} h={90} />
          <Testo x={650} y={320} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            Su carta
          </Testo>
        </Compare>
        <Freccia d="M 730 240 L 775 240" p={tra(locale, ufficio - 8, ufficio + 2)} />
        <Compare v={molla(locale, ufficio, fps)} cx={870} cy={270}>
          <Palazzo x={870} y={300} s={0.7} nome="TI" />
          <Pillola x={870} y={345} testo="Ufficio di sanità" corpo={22} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {/* La tassa: più bassa per molte professioni, più alta per quelle universitarie. */}
        <Compare v={molla(locale, altre, fps)} cx={500} cy={580}>
          <Pila cx={500} base={610} n={3} />
          <Testo x={500} y={650} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Altre professioni
          </Testo>
        </Compare>
        <Compare v={molla(locale, universitarie, fps)} cx={790} cy={560}>
          <Pila cx={790} base={610} n={6} />
          <Testo x={790} y={650} corpo={26} titolo peso={800} colore={TINTE.accento}>
            Universitarie
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Attenzione: l'autorizzazione ti permette di lavorare, ma non basta per fatturare all'assicurazione di base della cassa malati. Per quella serve un'altra autorizzazione del Cantone, e solo alcune professioni possono averla.» */
const sanCassaMalati: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.5, 0.4) + 4 },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.45, 0.65) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const lavorare = fra(ctx, null, 0, 0.6, 0.2);
    const cassa = fra(ctx, 0, 1, 0.35, 0.35);
    const altra = fra(ctx, 1, 2, 0.45, 0.65);
    const alcune = fra(ctx, 2, null, 0.35, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="E la cassa malati?" />
        <Compare v={molla(locale, 4, fps)} cx={420} cy={210}>
          <Foglio x={350} y={120} w={140} h={180}>
            <Righe x={368} y={170} w={90} n={3} passo={26} />
          </Foglio>
          <g opacity={tra(locale, 12, 18)}>
            <Timbro cx={430} cy={265} r={34} />
          </g>
        </Compare>
        <Compare v={molla(locale, lavorare, fps)} cx={420} cy={350}>
          <Pillola x={420} y={350} testo="Puoi lavorare" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, cassa, fps)} cx={760} cy={240}>
          <Tessera x={650} y={130} />
          <No cx={870} cy={140} r={26} />
          <Pillola x={760} y={330} testo="Fatturare: non basta" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Freccia d="M 700 370 Q 680 400 660 430" p={tra(locale, altra - 8, altra + 4)} />
        <Compare v={molla(locale, altra, fps)} cx={700} cy={500}>
          <Foglio x={540} y={430} w={120} h={150}>
            <Righe x={556} y={474} w={74} n={3} passo={22} />
          </Foglio>
          <g opacity={tra(locale, altra + 8, altra + 14)}>
            <Timbro cx={610} cy={546} r={28} />
          </g>
          <Righe2 x={820} y={485} righe={["Un'altra", "autorizzazione"]} corpo={28} passo={36} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, alcune, fps)} cx={760} cy={630}>
          <Pillola x={760} y={630} testo="Solo alcune professioni" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_SANITA: Record<string, Disegno> = {
  "san-regola": sanRegola,
  "san-prima": sanPrima,
  "san-professioni": sanProfessioni,
  "san-estetista": sanEstetista,
  "san-massaggio": sanMassaggio,
  "san-complementari": sanComplementari,
  "san-requisiti": sanRequisiti,
  "san-domanda": sanDomanda,
  "san-cassa-malati": sanCassaMalati,
};
