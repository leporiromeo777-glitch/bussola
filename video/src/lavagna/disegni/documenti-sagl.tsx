/**
 * I disegni dei video facoltativi della lezione 2: lo statuto della Sagl e
 * l'atto di fondazione (vedi src/lezioni/soci-forma-giuridica-statuto.ts e
 * soci-forma-giuridica-atto.ts). Fonti: artt. 776-779 e 809 CO e lo statuto
 * tipo Sagl del registro di commercio. Coordinate della tela 1000×700;
 * l'angolo in basso a sinistra (x < 300, y > 480) è della finestra di Bleo.
 */
import {
  Compare,
  Esplosione,
  Foglio,
  Freccia,
  molla,
  Palazzo,
  Persona,
  Pillola,
  Registro,
  Righe,
  TEAL_CHIARO,
  Testo,
  Timbro,
  TINTE,
  tra,
} from "../figure";
import { Tela } from "./ditta-individuale";
import { cambio, Righe2 } from "./forme-giuridiche";
import type { ContestoDisegno, Disegno } from "./tipi";

/** Il titolo in alto. */
function Titolo({ locale, fps, testo }: { locale: number; fps: number; testo: string }) {
  return (
    <Compare v={molla(locale, 2, fps)} cx={655} cy={40}>
      <Pillola x={655} y={40} testo={testo} corpo={32} fondo={TINTE.tratto} colore={TINTE.carta} />
    </Compare>
  );
}

const RIGA = { x: 330, w: 650, alto: 92, h: 78, passo: 92 };

/**
 * Un elenco che si costruisce mentre Bleo parla: ogni riga compare al suo
 * momento (`tempi`, in fotogrammi dall'inizio della scena), con il numero, e
 * la bussolina la tocca.
 */
export function elenco(titolo: string, righe: readonly string[], tempi: (ctx: ContestoDisegno) => number[]): Disegno {
  return {
    chiave: (ctx) => tempi(ctx)[0],
    bussolina: (ctx) => ({
      posto: { x: 250, y: 300 },
      azioni: tempi(ctx).map((t, i) => ({
        tipo: "tocca" as const,
        quando: t + 12,
        bersaglio: { x: RIGA.x + 6, y: RIGA.alto + i * RIGA.passo + RIGA.h / 2 },
      })),
    }),
    Figura: ({ locale, ctx }) => {
      const { fps } = ctx;
      const t = tempi(ctx);
      return (
        <Tela>
          <Titolo locale={locale} fps={fps} testo={titolo} />
          {righe.map((testo, i) => {
            const y = RIGA.alto + i * RIGA.passo;
            const cy = y + RIGA.h / 2;
            const tocco = tra(locale, t[i] + 12, t[i] + 20);
            return (
              <Compare key={testo} v={molla(locale, t[i], fps)} cx={RIGA.x + 40} cy={cy}>
                <rect x={RIGA.x} y={y} width={RIGA.w} height={RIGA.h} rx={22} fill={tocco > 0.5 ? TINTE.tinta : TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
                <circle cx={RIGA.x + 44} cy={cy} r={24} fill={TINTE.tratto} />
                <Testo x={RIGA.x + 44} y={cy + 1} corpo={26} titolo peso={800} colore={TINTE.carta}>
                  {String(i + 1)}
                </Testo>
                <Testo x={RIGA.x + 86} y={cy + 1} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
                  {testo}
                </Testo>
              </Compare>
            );
          })}
        </Tela>
      );
    },
  };
}

/** I tempi delle righe: la prima poco dopo l'inizio (o al cambio `primo`), le altre ai cambi seguenti. */
function aiCambi(n: number, primo: number | null) {
  return (ctx: ContestoDisegno) =>
    Array.from({ length: n }, (_, i) => {
      const k = primo === null ? i - 1 : primo + i;
      return k < 0 ? 8 : cambio(ctx, k, (i + 1) / (n + 1));
    });
}

/* Statuto, 2. «Per legge lo statuto deve contenere almeno quattro cose…» (art. 776 CO). */
const statutoQuattro = elenco("Lo statuto deve dire", ["La ditta e la sede", "Lo scopo", "Il capitale e le quote", "Come comunica con i soci"], aiCambi(4, 0));

/* Statuto, 5. «Per esempio, chi dirige…» (art. 809 CO e statuto tipo, art. 22). */
const statutoGerenti = elenco(
  "Chi dirige?",
  ["Per legge: tutti i soci insieme", "Lo statuto può dire altrimenti", "Statuto tipo: elegge l'assemblea", "Il gerente può non essere socio"],
  aiCambi(4, 0),
);

/* Atto, 3. «Nell'atto dichiarate di costituire la Sagl, stabilite lo statuto…» (artt. 777 e 777a CO). */
const attoContenuto = elenco(
  "Nell'atto di fondazione",
  ["Dichiarate di fondare la Sagl", "Stabilite lo statuto", "Designate gli organi", "Sottoscrivete le quote"],
  aiCambi(4, null),
);

/* Atto, 5. «All'atto si allegano dei documenti…» (art. 777b CO). */
const attoAllegati = elenco("Si allegano all'atto", ["Lo statuto", "L'attestazione della banca", "Con dei beni: altri documenti"], aiCambi(3, 0));

/* Statuto, 3. «Il registro di commercio del Ticino pubblica uno statuto tipo… accanto a ogni articolo c'è la norma.» */
const NORME = [
  { y: 230, norma: "Art. 776 CO" },
  { y: 300, norma: "Art. 773 CO" },
  { y: 370, norma: "Art. 809 CO" },
];
function tempiModello(ctx: ContestoDisegno) {
  const registro = cambio(ctx, 0, 0.2);
  return { registro, foglio: registro + 12, ufficio: cambio(ctx, 1, 0.5), norme: cambio(ctx, 2, 0.75) };
}
const statutoModello: Disegno = {
  chiave: (ctx) => tempiModello(ctx).foglio,
  bussolina: (ctx) => {
    const t = tempiModello(ctx);
    return {
      posto: { x: 200, y: 450 },
      azioni: [
        { tipo: "lancia", quando: t.foglio + 4 },
        { tipo: "lancia", quando: t.norme + 10 },
      ],
    };
  },
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const t = tempiModello(ctx);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Lo statuto tipo" />
        <Compare v={molla(locale, t.foglio, fps)} cx={520} cy={310}>
          <Foglio x={350} y={110} w={340} h={400}>
            <Testo x={505} y={160} corpo={30} titolo peso={800} colore={TINTE.tratto}>
              Statuto tipo
            </Testo>
            {NORME.map((n) => (
              <line key={n.y} x1={375} y1={n.y} x2={530} y2={n.y} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
            ))}
            <Righe x={375} y={440} w={150} n={2} passo={26} />
          </Foglio>
        </Compare>
        {/* Accanto a ogni articolo, la norma di legge. */}
        {NORME.map((n, i) => (
          <Compare key={n.norma} v={molla(locale, t.norme + i * 8, fps)} cx={615} cy={n.y}>
            <Pillola x={615} y={n.y} testo={n.norma} corpo={20} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
          </Compare>
        ))}
        <Compare v={molla(locale, t.registro, fps)} cx={860} cy={300}>
          <Registro x={860} y={330} s={1.05} />
          <Righe2 x={860} y={380} righe={["Registro di", "commercio TI"]} corpo={28} passo={34} />
        </Compare>
        <Freccia d="M 780 270 H 712" p={tra(locale, t.foglio - 4, t.foglio + 8)} />
        <Compare v={molla(locale, t.ufficio, fps)} cx={860} cy={480}>
          <Pillola x={860} y={480} testo="modello federale" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* Atto, 2. «È un atto pubblico: lo prepara il notaio, e voi fondatori lo firmate.» (art. 777 CO). */
const attoFirma: Disegno = {
  chiave: (ctx) => Math.round(ctx.voce * 0.7),
  bussolina: (ctx) => ({ posto: { x: 200, y: 450 }, azioni: [{ tipo: "lancia", quando: Math.round(ctx.voce * 0.7) + 2 }] }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const firma = Math.round(ctx.voce * 0.7);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Un atto pubblico" />
        <Compare v={molla(locale, 6, fps)} cx={620} cy={360}>
          <Persona x={470} y={400} s={0.8} />
          <Persona x={560} y={400} s={0.8} colore={TEAL_CHIARO} />
          <Persona x={710} y={400} s={0.8} colore={TINTE.accento} />
          <rect x={400} y={392} width={380} height={22} rx={10} fill={TINTE.accento} />
          <rect x={420} y={412} width={16} height={70} rx={6} fill={TINTE.accento} />
          <rect x={744} y={412} width={16} height={70} rx={6} fill={TINTE.accento} />
          <Testo x={710} y={226} corpo={24} peso={700} colore={TINTE.accento}>
            Notaio
          </Testo>
          <Testo x={515} y={520} corpo={24} peso={700} colore={TINTE.tratto}>
            Fondatori
          </Testo>
        </Compare>
        <Compare v={molla(locale, 18, fps)} cx={890} cy={320}>
          <Foglio x={830} y={200} w={130} h={170}>
            <Righe x={848} y={250} w={84} n={3} passo={26} />
          </Foglio>
          <g transform={`translate(0 ${-40 * (1 - tra(locale, firma, firma + 10))})`} opacity={tra(locale, firma - 2, firma + 4)}>
            <Timbro cx={900} cy={330} r={38} />
          </g>
          <Righe2 x={895} y={410} righe={["Atto di", "fondazione"]} corpo={26} passo={32} />
        </Compare>
      </Tela>
    );
  },
};

/* Atto, 6. «La Sagl va iscritta nel registro di commercio della sede: con l'iscrizione diventa persona giuridica.» (artt. 778 e 779 CO). */
const attoRegistro: Disegno = {
  chiave: (ctx) => cambio(ctx, 0, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: 20 },
      { tipo: "festeggia", quando: cambio(ctx, 0, 0.5) + 10 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const nasce = cambio(ctx, 0, 0.5);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="L'iscrizione" />
        <Compare v={molla(locale, 6, fps)} cx={450} cy={300}>
          <Registro x={450} y={360} s={1.3} />
          <Righe2 x={450} y={410} righe={["Registro di commercio", "della sede"]} corpo={28} passo={34} />
        </Compare>
        <Freccia d="M 560 300 H 700" p={tra(locale, nasce - 10, nasce + 4)} colore={TINTE.accento} />
        <Compare v={molla(locale, nasce, fps)} cx={830} cy={380}>
          <Palazzo x={830} y={470} s={0.95} nome="Sagl" colore={TINTE.accento} />
          <Pillola x={830} y={530} testo="persona giuridica" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Esplosione cx={830} cy={260} p={(locale - nasce - 4) / 24} r={90} />
      </Tela>
    );
  },
};

export const DISEGNI_DOCUMENTI_SAGL: Record<string, Disegno> = {
  "statuto-quattro": statutoQuattro,
  "statuto-modello": statutoModello,
  "statuto-gerenti": statutoGerenti,
  "atto-firma": attoFirma,
  "atto-contenuto": attoContenuto,
  "atto-allegati": attoAllegati,
  "atto-registro": attoRegistro,
};
