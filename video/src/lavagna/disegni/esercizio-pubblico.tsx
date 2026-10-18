/**
 * I disegni della lezione 4 («Aprire un bar o un ristorante»), vedi
 * src/lezioni/esercizio-pubblico.ts. Fonti: LEAR e RLEAR, pagine della
 * Polizia cantonale e della DFP. Coordinate della tela 1000×700; l'angolo in
 * basso a sinistra (x < 300, y > 480) è della finestra di Bleo.
 */
import { Compare, Foglio, Freccia, molla, Moneta, Negozio, Palazzo, Persona, Pillola, Righe, Scudo, TEAL_CHIARO, Testo, Timbro, TINTE, tra, Valigetta } from "../figure";
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

/** Una tazzina fumante: il bar. */
function Tazza({ cx, cy, locale }: { cx: number; cy: number; locale: number }) {
  const fumo = Math.sin(locale / 6) * 4;
  return (
    <g>
      {[-22, 8].map((dx) => (
        <path
          key={dx}
          d={`M ${cx + dx} ${cy - 58} q ${10 + fumo} -16 0 -32 q ${-10 - fumo} -16 0 -32`}
          fill="none"
          stroke={TINTE.accento}
          strokeWidth={6}
          strokeLinecap="round"
        />
      ))}
      <path d={`M ${cx + 52} ${cy - 22} q 38 0 38 24 q 0 24 -38 24`} fill="none" stroke={TINTE.tratto} strokeWidth={8} />
      <path d={`M ${cx - 58} ${cy - 38} h 116 v 46 q 0 46 -46 46 h -24 q -46 0 -46 -46 Z`} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={7} strokeLinejoin="round" />
      <rect x={cx - 80} y={cy + 56} width={160} height={14} rx={7} fill={TINTE.tratto} />
    </g>
  );
}

/** Un piatto con forchetta e coltello: il ristorante. */
function Piatto({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={66} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={7} />
      <circle cx={cx} cy={cy} r={42} fill={TINTE.tinta} />
      {/* forchetta */}
      <rect x={cx - 100} y={cy - 20} width={12} height={84} rx={6} fill={TINTE.tratto} />
      {[-104, -96, -88].map((x) => (
        <rect key={x} x={cx + x + 2} y={cy - 62} width={6} height={40} rx={3} fill={TINTE.tratto} />
      ))}
      <rect x={cx - 104} y={cy - 26} width={20} height={10} rx={4} fill={TINTE.tratto} />
      {/* coltello */}
      <rect x={cx + 88} y={cy - 4} width={12} height={68} rx={6} fill={TINTE.tratto} />
      <path d={`M ${cx + 88} ${cy - 2} V ${cy - 62} q 20 10 14 60 Z`} fill={TINTE.tratto} />
    </g>
  );
}

/** Un letto con il cuscino: l'alloggio. */
function Letto({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 96} y={cy - 64} width={20} height={124} rx={8} fill={TINTE.tratto} />
      <rect x={cx - 84} y={cy - 4} width={180} height={42} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={cx - 70} y={cy - 32} width={52} height={28} rx={12} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} />
      <rect x={cx - 12} y={cy - 22} width={104} height={30} rx={12} fill={TINTE.accento} />
      <rect x={cx + 80} y={cy + 30} width={14} height={30} rx={5} fill={TINTE.tratto} />
    </g>
  );
}

/* 2. «Un esercizio pubblico … è un locale dove si vendono cibi o bevande da consumare sul posto. Oppure dove si alloggiano degli ospiti.» */
const epEsercizio: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.8, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.35) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.35, 0.8) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const bar = fra(ctx, 0, 1, 0.35, 0.35);
    const ristorante = fra(ctx, 0, 1, 0.55, 0.45);
    const sulPosto = fra(ctx, 0, 1, 0.85, 0.55);
    const albergo = fra(ctx, 1, null, 0.3, 0.75);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Esercizio pubblico" />
        <Compare v={molla(locale, bar, fps)} cx={440} cy={250}>
          <Tazza cx={430} cy={250} locale={locale} />
          <Pillola x={440} y={375} testo="Bar" corpo={30} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, ristorante, fps)} cx={650} cy={250}>
          <Piatto cx={650} cy={250} />
          <Pillola x={650} y={375} testo="Ristorante" corpo={30} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, sulPosto, fps)} cx={545} cy={470}>
          <Pillola x={545} y={470} testo="Da consumare sul posto" corpo={30} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, albergo, fps)} cx={870} cy={250}>
          <Letto cx={865} cy={260} />
          <Pillola x={870} y={375} testo="Albergo" corpo={30} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Alcune attività restano fuori da questa legge … Per vendere cibi e bevande a una festa serve un permesso speciale del Municipio.» */
const epEccezioni = elenco("Casi particolari", ["Ristorazione a domicilio: esclusa", "Piccoli alloggi: esclusi", "Feste: permesso del Municipio"], (ctx) => [
  fra(ctx, 0, 1, 0.45, 0.35),
  fra(ctx, 0, 1, 0.8, 0.5),
  fra(ctx, 1, null, 0.45, 0.8),
]);

/* 4. «Senza autorizzazione non puoi né aprire né gestire il locale. Se apri lo stesso, il Cantone lo fa chiudere subito.» */
const epObbligo: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.5, 0.8),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.4) },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.5, 0.8) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const permesso = fra(ctx, 0, 1, 0.35, 0.35);
    const chiuso = fra(ctx, 1, null, 0.5, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Prima l'autorizzazione" />
        <Compare v={molla(locale, 6, fps, true)} cx={560} cy={480}>
          <Negozio x={560} y={620} s={1.25} targa="Bar" />
        </Compare>
        <Freccia d="M 830 330 Q 790 380 720 410" p={tra(locale, permesso + 6, permesso + 18)} />
        <Compare v={molla(locale, permesso, fps)} cx={870} cy={210}>
          <Foglio x={800} y={110} w={140} h={180}>
            <Righe x={818} y={160} w={90} n={3} passo={26} />
          </Foglio>
          <g opacity={tra(locale, permesso + 8, permesso + 14)}>
            <Timbro cx={880} cy={255} r={34} />
          </g>
        </Compare>
        {/* Senza autorizzazione: il locale viene chiuso. */}
        <Compare v={molla(locale, chiuso, fps)} cx={600} cy={500}>
          <g transform="rotate(-8 600 500)">
            <rect x={505} y={462} width={190} height={76} rx={16} fill={TINTE.rischio} />
            <Testo x={600} y={501} corpo={38} titolo peso={800} colore={TINTE.carta}>
              Chiuso
            </Testo>
          </g>
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Il gestore riceve l'autorizzazione ed è il datore di lavoro. Il gerente conduce il locale … puoi essere tu sia il gestore sia il gerente.» */
const epRuoli: Disegno = {
  chiave: (ctx) => fra(ctx, 2, null, 0.5, 0.85),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.5, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const gestore = fra(ctx, 0, 1, 0.15, 0.25);
    const gerente = fra(ctx, 1, 2, 0.15, 0.5);
    const stessa = fra(ctx, 2, null, 0.45, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Due ruoli" />
        <Compare v={molla(locale, gestore, fps)} cx={470} cy={330}>
          <Persona x={470} y={400} colore={TINTE.accento} />
          <Valigetta x={530} y={330} s={0.7} />
          <Pillola x={470} y={450} testo="Gestore" corpo={30} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
          <Righe2 x={470} y={510} righe={["Riceve", "l'autorizzazione"]} corpo={24} passo={30} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, gerente, fps)} cx={820} cy={330}>
          <Persona x={820} y={400} colore={TEAL_CHIARO} />
          <Foglio x={870} y={250} w={70} h={90}>
            <Righe x={880} y={280} w={40} n={2} passo={20} />
          </Foglio>
          <Pillola x={820} y={450} testo="Gerente" corpo={30} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
          <Righe2 x={820} y={510} righe={["Conduce", "il locale"]} corpo={24} passo={30} />
        </Compare>
        <Freccia d="M 560 200 Q 645 130 730 200" p={tra(locale, stessa - 4, stessa + 10)} />
        <Freccia d="M 730 210 Q 645 280 560 210" p={tra(locale, stessa - 4, stessa + 10)} />
        <Compare v={molla(locale, stessa, fps)} cx={645} cy={600}>
          <Pillola x={645} y={600} testo="A tuo nome: puoi essere tu" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Il gestore deve avere l'attestato del Municipio … il diritto di usarli … un'assicurazione … E un gerente.» */
const epGestore = elenco("Cosa serve al gestore", ["Locali idonei (Municipio)", "Il diritto di usare i locali", "Assicurazione RC", "Un gerente"], (ctx) => [
  fra(ctx, null, 0, 0.55, 0.2),
  fra(ctx, 0, 1, 0.2, 0.35),
  fra(ctx, 1, 2, 0.35, 0.55),
  fra(ctx, 2, null, 0.15, 0.85),
]);

/* 7. «Il gerente deve avere il diploma cantonale di esercente … oppure una pratica … in un altro Cantone … condanne incompatibili.» */
const epGerente: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.5, 0.2),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.55, 0.2) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.45, 0.55) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const diploma = fra(ctx, null, 0, 0.5, 0.2);
    const oppure = fra(ctx, 0, 1, 0.3, 0.35);
    const pratica = fra(ctx, 1, 2, 0.4, 0.55);
    const condanne = fra(ctx, 2, null, 0.35, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cosa serve al gerente" />
        <Compare v={molla(locale, 4, fps)} cx={420} cy={380}>
          <Persona x={420} y={450} colore={TEAL_CHIARO} />
          <Pillola x={420} y={498} testo="Gerente" corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, diploma, fps)} cx={620} cy={210}>
          <Foglio x={550} y={110} w={140} h={180}>
            <Righe x={568} y={160} w={90} n={3} passo={26} />
          </Foglio>
          <g opacity={tra(locale, diploma + 8, diploma + 14)}>
            <Timbro cx={630} cy={255} r={34} />
          </g>
          <Righe2 x={620} y={330} righe={["Diploma", "di esercente"]} corpo={26} passo={32} />
        </Compare>
        <Compare v={molla(locale, oppure, fps)} cx={760} cy={210}>
          <Testo x={760} y={210} corpo={28} titolo peso={800} colore={TINTE.accento}>
            oppure
          </Testo>
        </Compare>
        <Compare v={molla(locale, pratica, fps)} cx={890} cy={220}>
          <Palazzo x={890} y={290} s={0.6} colore={TINTE.accento} />
          <Righe2 x={890} y={330} righe={["Pratica in un", "altro Cantone"]} corpo={26} passo={32} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, condanne, fps)} cx={690} cy={600}>
          <Scudo x={470} y={600} s={0.7} />
          <Testo x={512} y={600} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Senza condanne incompatibili
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Per il diploma superi un esame e fai … mesi di pratica … i corsi della scuola esercenti di GastroTicino.» */
const epDiploma = elenco("Il diploma di esercente", ["Un esame", "Pratica, anche a tempo parziale", "Corsi: scuola esercenti"], (ctx) => [
  fra(ctx, null, 0, 0.35, 0.2),
  fra(ctx, null, 0, 0.6, 0.35),
  fra(ctx, 0, null, 0.55, 0.75),
]);

/* 9. «Se apri con una Sagl o una SA, l'autorizzazione va alla società … sede in Svizzera … una persona come gestore.» */
const epSocieta: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.75, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.8, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 0, null, 0.8, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const autorizzazione = fra(ctx, null, 0, 0.7, 0.35);
    const sede = fra(ctx, 0, null, 0.35, 0.6);
    const gestore = fra(ctx, 0, null, 0.75, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Con una società" />
        <Compare v={molla(locale, 4, fps)} cx={450} cy={300}>
          <Palazzo x={450} y={400} s={1.05} nome="Sagl" />
        </Compare>
        <Freccia d="M 560 280 Q 600 250 650 270" p={tra(locale, autorizzazione - 8, autorizzazione + 4)} />
        <Compare v={molla(locale, autorizzazione, fps)} cx={740} cy={240}>
          <Foglio x={670} y={150} w={140} h={180}>
            <Righe x={688} y={200} w={90} n={3} passo={26} />
          </Foglio>
          <g opacity={tra(locale, autorizzazione + 8, autorizzazione + 14)}>
            <Timbro cx={750} cy={295} r={34} />
          </g>
        </Compare>
        <Compare v={molla(locale, sede, fps)} cx={450} cy={460}>
          <Pillola x={450} y={460} testo="Sede in Svizzera" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, gestore, fps)} cx={890} cy={430}>
          <Persona x={890} y={500} s={0.85} colore={TINTE.accento} />
          <Pillola x={890} y={545} testo="Gestore" corpo={28} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
      </Tela>
    );
  },
};

/** Un calendario da muro. */
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

/* 10. «L'autorizzazione la chiedi alla Polizia cantonale … almeno … giorni prima di aprire. La tassa va da … a ….» */
const epDomanda: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.7, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.7, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 1, null, 0.4, 0.8) },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const polizia = fra(ctx, null, 0, 0.6, 0.3);
    const prima = fra(ctx, 0, 1, 0.6, 0.6);
    const tassa = fra(ctx, 1, null, 0.35, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La domanda" />
        <Compare v={molla(locale, 4, fps)} cx={410} cy={210}>
          <Foglio x={340} y={120} w={140} h={180}>
            <Righe x={358} y={170} w={90} n={4} passo={26} />
          </Foglio>
        </Compare>
        <Freccia d="M 500 210 Q 560 190 600 230" p={tra(locale, polizia - 8, polizia + 4)} />
        <Compare v={molla(locale, polizia, fps)} cx={700} cy={260}>
          <Palazzo x={700} y={330} s={0.85} nome="TI" />
          <Pillola x={700} y={378} testo="Polizia cantonale" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, prima, fps)} cx={890} cy={220}>
          <Calendario cx={890} cy={210} />
          <Testo x={890} y={315} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Prima di aprire
          </Testo>
        </Compare>
        <Compare v={molla(locale, tassa, fps)} cx={600} cy={500}>
          <Moneta cx={520} cy={500} r={30} />
          <Moneta cx={560} cy={516} r={30} />
          <Testo x={610} y={510} corpo={30} titolo peso={800} colore={TINTE.tratto} ancora="start">
            La tassa
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 11. «Con la domanda alleghi i documenti: l'attestato del Municipio, la prova dell'assicurazione, gli estratti … il contratto di lavoro e il diploma.» */
const epDocumenti = elenco(
  "Da allegare alla domanda",
  ["L'attestato del Municipio", "La prova dell'assicurazione", "Estratti: casellario, esecuzioni", "Contratto e diploma del gerente"],
  (ctx) => [fra(ctx, null, 0, 0.7, 0.2), fra(ctx, 0, 1, 0.35, 0.4), fra(ctx, 1, 2, 0.35, 0.6), fra(ctx, 2, null, 0.35, 0.85)],
);

export const DISEGNI_ESERCIZIO_PUBBLICO: Record<string, Disegno> = {
  "ep-esercizio": epEsercizio,
  "ep-eccezioni": epEccezioni,
  "ep-obbligo": epObbligo,
  "ep-ruoli": epRuoli,
  "ep-gestore": epGestore,
  "ep-gerente": epGerente,
  "ep-diploma": epDiploma,
  "ep-societa": epSocieta,
  "ep-domanda": epDomanda,
  "ep-documenti": epDocumenti,
};
