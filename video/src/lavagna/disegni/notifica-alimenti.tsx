/**
 * I disegni della lezione 5 («Vendi cibo? Notifica la tua attività»), vedi
 * src/lezioni/notifica-alimenti.ts. Fonti: ODerr (artt. 20, 21, 73, 74) e le
 * schede del Laboratorio cantonale ticinese. Coordinate della tela 1000×700;
 * l'angolo in basso a sinistra (x < 300, y > 480) è della finestra di Bleo.
 */
import { Auto, Avviso, Compare, Foglio, Freccia, Fumetto, molla, Negozio, Palazzo, Persona, Pillola, Righe, Scudo, Spunta, TEAL_CHIARO, Testo, Timbro, TINTE, tra } from "../figure";
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

/** Una pentola con il coperchio: chi prepara. */
function Pentola({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 52} y={cy - 26} width={104} height={64} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={cx - 74} y={cy - 16} width={24} height={12} rx={6} fill={TINTE.tratto} />
      <rect x={cx + 50} y={cy - 16} width={24} height={12} rx={6} fill={TINTE.tratto} />
      <path d={`M ${cx - 58} ${cy - 30} q 58 -34 116 0 Z`} fill={TINTE.accento} />
      <circle cx={cx} cy={cy - 48} r={7} fill={TINTE.accento} />
    </g>
  );
}

/** Un frigorifero: chi conserva. */
function Frigo({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 36} y={cy - 62} width={72} height={124} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <line x1={cx - 36} y1={cy - 18} x2={cx + 36} y2={cy - 18} stroke={TINTE.tratto} strokeWidth={5} />
      <rect x={cx + 18} y={cy - 48} width={7} height={20} rx={3} fill={TINTE.tratto} />
      <rect x={cx + 18} y={cy - 6} width={7} height={28} rx={3} fill={TINTE.tratto} />
    </g>
  );
}

/* 2. «Chi lavora con gli alimenti deve notificare la sua attività al Cantone. Per esempio chi li prepara, li conserva, li trasporta o li vende.» */
const aliChi: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.85, 0.9) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const notifica = fra(ctx, 0, 1, 0.2, 0.3);
    const cantone = fra(ctx, 0, 1, 0.55, 0.45);
    const tempi = [0.15, 0.35, 0.55, 0.75].map((f, i) => fra(ctx, 1, null, f, 0.6 + i * 0.08));
    const icone = [
      { x: 400, testo: "Prepara", figura: <Pentola cx={400} cy={455} /> },
      { x: 560, testo: "Conserva", figura: <Frigo cx={560} cy={445} /> },
      { x: 720, testo: "Trasporta", figura: <Auto x={720} y={490} s={0.8} /> },
      { x: 885, testo: "Vende", figura: <Negozio x={885} y={505} s={0.48} /> },
    ];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Chi lavora con gli alimenti" />
        <Compare v={molla(locale, notifica, fps)} cx={450} cy={200}>
          <Foglio x={390} y={110} w={120} h={160}>
            <Righe x={406} y={160} w={78} n={3} passo={24} />
          </Foglio>
          <Pillola x={450} y={300} testo="Notifica" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 530 200 Q 590 170 640 200" p={tra(locale, cantone - 8, cantone + 4)} />
        <Compare v={molla(locale, cantone, fps)} cx={740} cy={220}>
          <Palazzo x={740} y={290} s={0.75} />
          <Pillola x={740} y={330} testo="Cantone" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {icone.map((icona, i) => (
          <Compare key={icona.testo} v={molla(locale, tempi[i], fps)} cx={icona.x} cy={470}>
            {icona.figura}
            <Testo x={icona.x} y={555} corpo={26} titolo peso={800} colore={TINTE.tratto}>
              {icona.testo}
            </Testo>
          </Compare>
        ))}
      </Tela>
    );
  },
};

/* 3. «Non serve per le piccole vendite occasionali, come a un mercatino o a una festa della scuola. E non conta quello che cucini per la tua famiglia.» */
const aliEccezioni = elenco("Quando non serve", ["Piccole vendite occasionali", "Mercatino, festa della scuola", "Cucina per la famiglia"], (ctx) => [
  fra(ctx, null, 0, 0.5, 0.2),
  fra(ctx, 0, 1, 0.4, 0.5),
  fra(ctx, 1, null, 0.4, 0.8),
]);

/* 4. «In Ticino la notifica va al Laboratorio cantonale, a Bellinzona. Nei Grigioni, invece, si fa con il modulo online del Cantone.» */
const aliUfficio: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.45, 0.25),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.25) },
      { tipo: "lancia", quando: fra(ctx, 0, null, 0.55, 0.75) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const ticino = fra(ctx, null, 0, 0.35, 0.25);
    const grigioni = fra(ctx, 0, null, 0.45, 0.7);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="A chi notificare" />
        <Compare v={molla(locale, ticino, fps)} cx={470} cy={300}>
          <Palazzo x={470} y={380} s={1} nome="TI" />
          <Pillola x={470} y={432} testo="Laboratorio cantonale" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, grigioni, fps)} cx={820} cy={300}>
          <Palazzo x={820} y={380} s={1} nome="GR" colore={TINTE.accento} />
          <Pillola x={820} y={432} testo="Modulo online" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Ci scrivi dove si trova la tua attività, cosa fai con gli alimenti, se vendi online e chi è la persona responsabile.» */
const aliFormulario = elenco(
  "Nel formulario",
  ["Dove si trova l'attività", "Cosa fai con gli alimenti", "Se vendi online", "La persona responsabile"],
  (ctx) => [fra(ctx, 0, 1, 0.3, 0.35), fra(ctx, 0, 1, 0.75, 0.5), fra(ctx, 1, null, 0.25, 0.7), fra(ctx, 1, null, 0.7, 0.85)],
);

/** Un piccolo calendario da muro. */
function Calendario({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 64} y={cy - 60} width={128} height={124} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={cx - 64} y={cy - 60} width={128} height={34} rx={14} fill={TINTE.accento} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}-${c}`} x={cx - 48 + c * 26} y={cy - 12 + r * 24} width={18} height={14} rx={4} fill={r === 2 && c === 3 ? TINTE.accento : TINTE.tinta} />
        )),
      )}
    </g>
  );
}

/* 6. «Il Laboratorio non manda una conferma. Circa … settimane dopo l'invio, controlli sul suo sito che la tua attività sia registrata.» */
const aliConferma: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.6, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.6, 0.25) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.65, 0.85) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const niente = fra(ctx, null, 0, 0.45, 0.2);
    const attesa = fra(ctx, 0, 1, 0.3, 0.45);
    const sito = fra(ctx, 1, null, 0.45, 0.75);
    const spunta = tra(locale, sito + 10, sito + 22);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Niente conferma" />
        <Compare v={molla(locale, 4, fps)} cx={400} cy={210}>
          <Foglio x={340} y={120} w={120} h={160}>
            <Righe x={356} y={170} w={78} n={3} passo={24} />
          </Foglio>
        </Compare>
        <Freccia d="M 480 200 Q 530 170 580 200" p={tra(locale, 8, 20)} />
        <Compare v={molla(locale, 10, fps)} cx={660} cy={220}>
          <Palazzo x={660} y={290} s={0.75} nome="TI" />
        </Compare>
        <Compare v={molla(locale, niente, fps)} cx={790} cy={150}>
          <Fumetto cx={800} cy={140} r={44}>
            <Testo x={800} y={142} corpo={46} titolo peso={800} colore={TINTE.rischio}>
              ?
            </Testo>
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, attesa, fps)} cx={440} cy={460}>
          <Calendario cx={440} cy={460} />
        </Compare>
        <Freccia d="M 520 460 Q 560 440 600 460" p={tra(locale, sito - 8, sito + 4)} />
        {/* Il sito del Laboratorio: la tua attività è registrata. */}
        <Compare v={molla(locale, sito, fps)} cx={760} cy={460}>
          <rect x={630} y={385} width={260} height={160} rx={16} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <rect x={630} y={385} width={260} height={30} rx={14} fill={TINTE.tratto} />
          <Righe x={655} y={445} w={120} n={3} passo={26} />
          <Spunta cx={840} cy={480} r={30} p={spunta} />
          <Testo x={760} y={580} corpo={26} titolo peso={800} colore={TINTE.ok}>
            Registrata
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 7. «In ogni azienda alimentare c'è una persona responsabile … Se non ne indichi una, il responsabile è chi dirige l'azienda: quindi tu.» */
const aliResponsabile: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.7, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.75, 0.85) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const responsabile = fra(ctx, null, 0, 0.6, 0.25);
    const sicurezza = fra(ctx, 0, 1, 0.3, 0.45);
    const tu = fra(ctx, 1, null, 0.7, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La persona responsabile" />
        <Compare v={molla(locale, 4, fps)} cx={450} cy={380}>
          <Negozio x={450} y={470} s={0.9} />
        </Compare>
        <Compare v={molla(locale, responsabile, fps)} cx={720} cy={330}>
          <Persona x={720} y={420} colore={TEAL_CHIARO} />
          <Pillola x={720} y={468} testo="Responsabile" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, sicurezza, fps)} cx={820} cy={230}>
          <Scudo x={820} y={240} s={0.9} />
        </Compare>
        <Compare v={molla(locale, tu, fps)} cx={600} cy={580}>
          <Pillola x={600} y={580} testo="Se non lo indichi: chi dirige, cioè tu" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Il responsabile fa il controllo autonomo: alimenti sicuri, sapere da dove vengono e ritirarli se c'è un problema, con i documenti in ordine.» */
const aliControllo = elenco(
  "Il controllo autonomo",
  ["Alimenti sicuri", "Sapere da dove vengono", "Ritirarli se c'è un problema", "Documenti in ordine"],
  (ctx) => [fra(ctx, null, 0, 0.8, 0.2), fra(ctx, 0, 1, 0.3, 0.35), fra(ctx, 0, 1, 0.75, 0.45), fra(ctx, 1, 2, 0.3, 0.55)],
);

/** Un barattolo con l'etichetta. */
function Barattolo({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 62} y={cy - 104} width={124} height={30} rx={10} fill={TINTE.accento} />
      <rect x={cx - 74} y={cy - 78} width={148} height={180} rx={26} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={7} />
      <rect x={cx - 56} y={cy - 30} width={112} height={84} rx={10} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
      <line x1={cx - 40} y1={cy - 6} x2={cx + 40} y2={cy - 6} stroke={TINTE.accento} strokeWidth={7} strokeLinecap="round" />
      <line x1={cx - 40} y1={cy + 14} x2={cx + 24} y2={cy + 14} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
      <line x1={cx - 40} y1={cy + 32} x2={cx + 32} y2={cy + 32} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

/* 9. «Sull'etichetta, le indicazioni obbligatorie vanno messe ben visibili, leggibili e in almeno una lingua ufficiale. E non devono ingannare.» */
const aliEtichetta: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.6, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.5, 0.5) },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.6, 0.85) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tempi = [fra(ctx, null, 0, 0.75, 0.25), fra(ctx, 0, 1, 0.2, 0.4), fra(ctx, 0, 1, 0.65, 0.55)];
    const inganno = fra(ctx, 1, null, 0.55, 0.85);
    const voci = ["Ben visibile", "Leggibile", "Lingua ufficiale"];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="L'etichetta" />
        <Compare v={molla(locale, 4, fps)} cx={450} cy={300}>
          <Barattolo cx={450} cy={300} />
        </Compare>
        {voci.map((voce, i) => (
          <Compare key={voce} v={molla(locale, tempi[i], fps)} cx={760} cy={170 + i * 80}>
            <Spunta cx={630} cy={170 + i * 80} r={22} p={tra(locale, tempi[i] + 6, tempi[i] + 16)} />
            <Testo x={670} y={170 + i * 80} corpo={30} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {voce}
            </Testo>
          </Compare>
        ))}
        <Compare v={molla(locale, inganno, fps)} cx={650} cy={500}>
          <Avviso x={420} y={510} s={0.85} />
          <Testo x={470} y={512} corpo={28} titolo peso={800} colore={TINTE.rischio} ancora="start">
            Niente promesse di cura
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/** Un cartone del latte. */
function Latte({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <path d={`M ${cx - 34} ${cy - 40} L ${cx - 20} ${cy - 70} H ${cx + 20} L ${cx + 34} ${cy - 40} Z`} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
      <rect x={cx - 34} y={cy - 40} width={68} height={100} rx={8} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={cx - 34} y={cy} width={68} height={22} fill={TINTE.tratto} />
    </g>
  );
}

/** Tre uova. */
function Uova({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      {[-34, 0, 34].map((dx, i) => (
        <ellipse key={dx} cx={cx + dx} cy={cy + (i === 1 ? -10 : 6)} rx={22} ry={30} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
      ))}
    </g>
  );
}

/** Una bistecca. */
function Carne({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <path d={`M ${cx - 56} ${cy - 10} q 0 -40 50 -36 q 60 4 60 40 q 0 34 -54 36 q -56 2 -56 -40 Z`} fill={TINTE.rischio} opacity={0.85} />
      <path d={`M ${cx - 36} ${cy - 8} q 0 -22 32 -20 q 40 2 40 22`} fill="none" stroke={TINTE.carta} strokeWidth={6} strokeLinecap="round" />
      <circle cx={cx + 22} cy={cy + 8} r={10} fill={TINTE.carta} />
    </g>
  );
}

/* 10. «Attenzione a carne, latte, uova … Per alcune attività serve anche un'autorizzazione. Ci sono diverse eccezioni: chiedi al Laboratorio.» */
const aliAnimale: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.55),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.3, 0.15) },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.5, 0.85) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const prodotti = [fra(ctx, null, 0, 0.15, 0.1), fra(ctx, null, 0, 0.28, 0.15), fra(ctx, null, 0, 0.4, 0.2)];
    const autorizzazione = fra(ctx, 0, 1, 0.4, 0.55);
    const chiedi = fra(ctx, 1, null, 0.5, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Origine animale" />
        <Compare v={molla(locale, prodotti[0], fps)} cx={420} cy={210}>
          <Carne cx={420} cy={210} />
        </Compare>
        <Compare v={molla(locale, prodotti[1], fps)} cx={560} cy={200}>
          <Latte cx={560} cy={200} />
        </Compare>
        <Compare v={molla(locale, prodotti[2], fps)} cx={700} cy={210}>
          <Uova cx={700} cy={210} />
        </Compare>
        <Freccia d="M 760 250 Q 800 290 820 330" p={tra(locale, autorizzazione - 8, autorizzazione + 4)} />
        <Compare v={molla(locale, autorizzazione, fps)} cx={860} cy={420}>
          <Foglio x={790} y={340} w={140} h={170}>
            <Righe x={808} y={390} w={90} n={3} passo={26} />
          </Foglio>
          <g opacity={tra(locale, autorizzazione + 8, autorizzazione + 14)}>
            <Timbro cx={870} cy={470} r={32} />
          </g>
        </Compare>
        <Compare v={molla(locale, chiedi, fps)} cx={560} cy={575}>
          <Pillola x={560} y={575} testo="Eccezioni: chiedi al Laboratorio" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_NOTIFICA_ALIMENTI: Record<string, Disegno> = {
  "ali-chi": aliChi,
  "ali-eccezioni": aliEccezioni,
  "ali-ufficio": aliUfficio,
  "ali-formulario": aliFormulario,
  "ali-conferma": aliConferma,
  "ali-responsabile": aliResponsabile,
  "ali-controllo": aliControllo,
  "ali-etichetta": aliEtichetta,
  "ali-animale": aliAnimale,
};
