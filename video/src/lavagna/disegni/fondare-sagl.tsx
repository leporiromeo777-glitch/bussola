/**
 * I disegni della lezione 2 («Fondare una Sagl con i soci»): i passi della
 * check list del Portale PMI per creare una Sagl, vedi
 * src/lezioni/soci-forma-giuridica.ts. Le cifre vengono da src/data
 * (`regole`). Coordinate della tela 1000×700; l'angolo in basso a sinistra
 * (x < 300, y > 480) è della finestra di Bleo.
 */
import { chf, regole } from "../../../../src/data/svizzera";
import {
  Cassaforte,
  Compare,
  Esplosione,
  Foglio,
  Freccia,
  molla,
  Moneta,
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
} from "../figure";
import { Tela } from "./ditta-individuale";
import { cambio, COLORE_TENUE, Righe2 } from "./forme-giuridiche";
import type { ContestoDisegno, Disegno, PuntoTela } from "./tipi";

/** Un punto sulla curva da `a` a `b` che passa vicino a `c` (p da 0 a 1). */
function sullaCurva(p: number, a: PuntoTela, c: PuntoTela, b: PuntoTela): PuntoTela {
  const q = 1 - p;
  return { x: q * q * a.x + 2 * q * p * c.x + p * p * b.x, y: q * q * a.y + 2 * q * p * c.y + p * p * b.y };
}

/** Monete che volano da `a` a `b`, una dopo l'altra, a partire da `da`. */
function MoneteInVolo({ locale, da, a, c, b, n = 3 }: { locale: number; da: number; a: PuntoTela; c: PuntoTela; b: PuntoTela; n?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, k) => {
        const p = tra(locale, da + k * 7, da + k * 7 + 16);
        if (p <= 0 || p >= 1) return null;
        const { x, y } = sullaCurva(p, a, c, b);
        return <Moneta key={k} cx={x} cy={y} r={24} />;
      })}
    </g>
  );
}

/** Il titolo della tappa in alto. */
function Tappa({ locale, fps, testo, colore = TINTE.tratto }: { locale: number; fps: number; testo: string; colore?: string }) {
  return (
    <Compare v={molla(locale, 2, fps)} cx={650} cy={50}>
      <Pillola x={650} y={50} testo={testo} corpo={32} fondo={colore} colore={TINTE.carta} />
    </Compare>
  );
}

/** Un lucchetto chiuso: «bloccato». */
function Lucchetto({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M -16 -6 V -22 a 16 16 0 0 1 32 0 V -6" fill="none" stroke={TINTE.accento} strokeWidth={8} strokeLinecap="round" />
      <rect x={-26} y={-8} width={52} height={42} rx={10} fill={TINTE.accento} />
      <circle cx={0} cy={10} r={6} fill={TINTE.carta} />
    </g>
  );
}

/* 2. «Una forma possibile è la Sagl. Ecco come si fonda, con la check list del Portale PMI.» */
const fondareSoci: Disegno = {
  chiave: (ctx) => cambio(ctx, 0, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: 26 },
      { tipo: "lancia", quando: cambio(ctx, 0, 0.5) + 16 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const lista = cambio(ctx, 0, 0.5);
    const cammino = tra(locale, 6, 34);
    const passo = cammino > 0 && cammino < 1 ? locale / 2.2 : undefined;
    return (
      <Tela>
        <Tappa locale={locale} fps={fps} testo="Società a garanzia limitata" colore={TINTE.accento} />
        {/* I due soci vanno verso la loro società. */}
        <g transform={`translate(${-70 * (1 - cammino)} 0)`} opacity={tra(locale, 2, 10)}>
          <Persona x={370} y={480} s={0.85} passo={passo} />
          <Persona x={460} y={480} s={0.85} colore={TEAL_CHIARO} passo={passo} />
        </g>
        <Compare v={molla(locale, 22, fps)} cx={640} cy={400}>
          <Palazzo x={640} y={480} s={0.95} nome="Sagl" colore={TINTE.accento} />
        </Compare>
        {/* La check list del Portale PMI: le caselle si spuntano una dopo l'altra. */}
        <Compare v={molla(locale, lista, fps)} cx={875} cy={330}>
          <Foglio x={790} y={160} w={170} h={300}>
            {[0, 1, 2, 3, 4].map((k) => {
              const y = 225 + k * 46;
              const p = tra(locale, lista + 12 + k * 6, lista + 20 + k * 6);
              return (
                <g key={k}>
                  <rect x={806} y={y - 14} width={28} height={28} rx={7} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} />
                  {p > 0 ? (
                    <path
                      d={`M 812 ${y} l 7 8 l 12 -16`}
                      fill="none"
                      stroke={TINTE.ok}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={1}
                      strokeDasharray="1 1"
                      strokeDashoffset={1 - p}
                    />
                  ) : null}
                  <line x1={846} y1={y} x2={940 - (k % 2) * 26} y2={y} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
                </g>
              );
            })}
          </Foglio>
          <Righe2 x={875} y={500} righe={["Check list", "del Portale PMI"]} corpo={26} passo={32} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Primo: preparate le basi. Preventivo, nome della società, verifica al registro.» */
const BASI = [
  { x: 440, righe: ["Preventivo", "delle spese"] },
  { x: 650, righe: ["Nome della", "società"] },
  { x: 860, righe: ["Verifica al", "registro"] },
];
function tempiBasi(ctx: ContestoDisegno): number[] {
  const a = cambio(ctx, 0, 0.3);
  const b = cambio(ctx, 1, 0.6);
  return [a, b, b + Math.round((ctx.voce - b) * 0.5)];
}
const fondareBasi: Disegno = {
  chiave: (ctx) => tempiBasi(ctx)[0],
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: tempiBasi(ctx).map((t) => ({ tipo: "lancia" as const, quando: t + 2 })),
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tempi = tempiBasi(ctx);
    return (
      <Tela>
        <Tappa locale={locale} fps={fps} testo="1 · Le basi" />
        {BASI.map((b, i) => (
          <Compare key={b.x} v={molla(locale, tempi[i], fps)} cx={b.x} cy={320}>
            <rect x={b.x - 95} y={130} width={190} height={370} rx={26} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
            {i === 0 ? (
              <g>
                <Foglio x={b.x - 62} y={180} w={110} h={150}>
                  <Righe x={b.x - 44} y={230} w={64} n={3} passo={26} />
                </Foglio>
                <Moneta cx={b.x + 46} cy={322} r={28} />
              </g>
            ) : null}
            {i === 1 ? <Palazzo x={b.x} y={350} s={0.62} nome="Nome" colore={TINTE.accento} /> : null}
            {i === 2 ? (
              <g>
                <Registro x={b.x - 8} y={330} s={0.85} />
                <Spunta cx={b.x + 52} cy={206} r={26} p={tra(locale, tempi[2] + 12, tempi[2] + 24)} />
              </g>
            ) : null}
            <Righe2 x={b.x} y={420} righe={b.righe} corpo={28} passo={34} />
          </Compare>
        ))}
      </Tela>
    );
  },
};

/** Una quota della Sagl: un tondino con lo spicchio, sopra la testa del socio. */
function Quota({ cx, cy, colore }: { cx: number; cy: number; colore: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={22} fill={TINTE.carta} stroke={colore} strokeWidth={5} />
      <path d={`M ${cx} ${cy} V ${cy - 22} A 22 22 0 0 1 ${cx + 22} ${cy} Z`} fill={colore} />
    </g>
  );
}

/* 4. «Decidete chi sono i soci. Per legge dirigono tutti insieme, ma lo statuto può dire altrimenti. Chi lavora senza quota è un collaboratore.» */
function tempiDirezione(ctx: ContestoDisegno) {
  return {
    insieme: cambio(ctx, 0, 0.25),
    statuto: cambio(ctx, 1, 0.45),
    uno: cambio(ctx, 2, 0.6),
    collaboratore: cambio(ctx, 3, 0.8),
  };
}
const fondareDirezione: Disegno = {
  chiave: (ctx) => tempiDirezione(ctx).insieme,
  bussolina: (ctx) => {
    const t = tempiDirezione(ctx);
    return {
      posto: { x: 200, y: 450 },
      azioni: [
        { tipo: "lancia", quando: t.insieme + 4 },
        { tipo: "lancia", quando: t.uno + 4 },
        { tipo: "lancia", quando: t.collaboratore + 4 },
      ],
    };
  },
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const t = tempiDirezione(ctx);
    // «Dirigono insieme» lascia il posto a «dirige» sopra un solo socio.
    const insieme = molla(locale, t.insieme, fps) * (1 - tra(locale, t.uno - 4, t.uno + 4));
    return (
      <Tela>
        <Tappa locale={locale} fps={fps} testo="Soci e direzione" />
        {/* I soci: ognuno ha una quota. */}
        <Compare v={molla(locale, 4, fps)} cx={435} cy={360}>
          <Persona x={380} y={460} s={0.85} />
          <Persona x={490} y={460} s={0.85} colore={TEAL_CHIARO} />
          <Quota cx={380} cy={268} colore={TINTE.tratto} />
          <Quota cx={490} cy={268} colore={TEAL_CHIARO} />
          <Testo x={435} y={500} corpo={30} titolo peso={800} colore={TINTE.tratto}>
            Soci
          </Testo>
          <Testo x={435} y={538} corpo={24} peso={600} colore={COLORE_TENUE}>
            hanno una quota
          </Testo>
        </Compare>
        {/* Per legge dirigono tutti insieme. */}
        <Compare v={insieme} cx={435} cy={200}>
          <path d="M 340 232 Q 340 216 356 216 H 514 Q 530 216 530 232" fill="none" stroke={TINTE.accento} strokeWidth={6} strokeLinecap="round" />
          <Pillola x={435} y={190} testo="dirigono insieme" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* Lo statuto può decidere diversamente: per esempio dirige uno solo. */}
        <Compare v={molla(locale, t.statuto, fps)} cx={685} cy={260}>
          <Foglio x={620} y={170} w={130} h={170}>
            <Righe x={640} y={220} w={84} n={3} passo={26} />
          </Foglio>
          <Testo x={685} y={372} corpo={28} titolo peso={800} colore={TINTE.tratto}>
            Statuto
          </Testo>
        </Compare>
        <Freccia d="M 612 240 Q 520 150 420 196" p={tra(locale, t.uno - 6, t.uno + 8)} colore={TINTE.accento} spessore={6} />
        <Compare v={molla(locale, t.uno + 6, fps)} cx={380} cy={196}>
          <Pillola x={380} y={196} testo="dirige" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* Chi lavora senza quota: un collaboratore, non un socio. */}
        <Compare v={molla(locale, t.collaboratore, fps)} cx={870} cy={380}>
          <Persona x={870} y={460} s={0.8} colore={COLORE_TENUE} />
          <Righe2 x={870} y={500} righe={["Collaboratore", "senza quota"]} corpo={26} colore={COLORE_TENUE} passo={32} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Poi decidete il capitale: almeno CHF 20'000, diviso in quote e da versare per intero, in soldi o in natura.» */
function tempiCapitale(ctx: ContestoDisegno) {
  const quote = cambio(ctx, 0, 0.35);
  const natura = cambio(ctx, 1, 0.75);
  return { importo: Math.round(quote * 0.55), quote, versato: quote + Math.round((natura - quote) * 0.55), natura };
}
const fondareCapitale: Disegno = {
  chiave: (ctx) => tempiCapitale(ctx).importo,
  bussolina: (ctx) => {
    const t = tempiCapitale(ctx);
    return {
      posto: { x: 200, y: 450 },
      azioni: [
        { tipo: "lancia", quando: t.importo + 4 },
        { tipo: "lancia", quando: t.versato + 4 },
      ],
    };
  },
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const t = tempiCapitale(ctx);
    return (
      <Tela>
        <Tappa locale={locale} fps={fps} testo="Il capitale" />
        <Compare v={molla(locale, 4, fps)} cx={425} cy={360}>
          <Persona x={380} y={450} s={0.85} />
          <Persona x={470} y={450} s={0.85} colore={TEAL_CHIARO} />
        </Compare>
        {/* Il capitale, diviso in quote fra i soci. */}
        <Compare v={molla(locale, 8, fps)} cx={780} cy={215}>
          <path d="M 780 120 A 95 95 0 0 0 780 310 Z" fill={TINTE.tratto} />
          <path d="M 780 120 A 95 95 0 0 1 780 310 Z" fill={TEAL_CHIARO} />
          <line x1={780} y1={116} x2={780} y2={314} stroke={TINTE.carta} strokeWidth={8} />
        </Compare>
        <Compare v={molla(locale, t.importo, fps)} cx={780} cy={410}>
          <Pillola x={780} y={410} testo={`almeno ${chf(regole.capitaleMinimoSagl.valore)}`} corpo={32} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <g opacity={tra(locale, t.quote, t.quote + 8)}>
          <Testo x={780} y={345} corpo={28} peso={600} colore={COLORE_TENUE}>
            diviso in quote
          </Testo>
        </g>
        <g opacity={tra(locale, t.versato, t.versato + 8)}>
          <Spunta cx={640} cy={490} r={24} p={tra(locale, t.versato + 2, t.versato + 14)} />
          <Testo x={676} y={492} corpo={30} titolo peso={800} colore={TINTE.ok} ancora="start">
            versato per intero
          </Testo>
        </g>
        <g opacity={tra(locale, t.natura, t.natura + 8)}>
          <Moneta cx={640} cy={560} r={20} />
          <Testo x={676} y={562} corpo={26} peso={600} colore={COLORE_TENUE} ancora="start">
            in soldi o in natura
          </Testo>
        </g>
      </Tela>
    );
  },
};

/* 5. «Secondo: scegliete una banca e aprite un conto vincolato, cioè bloccato, dove versate il capitale.» */
function tempiBanca(ctx: ContestoDisegno) {
  const bloccato = cambio(ctx, 0, 0.5);
  return { conto: Math.round(bloccato * 0.6), bloccato, versate: bloccato + 16 };
}
const fondareBanca: Disegno = {
  chiave: (ctx) => tempiBanca(ctx).bloccato,
  bussolina: (ctx) => {
    const t = tempiBanca(ctx);
    return {
      posto: { x: 200, y: 450 },
      azioni: [
        { tipo: "lancia", quando: t.conto + 4 },
        { tipo: "lancia", quando: t.versate + 6 },
      ],
    };
  },
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const t = tempiBanca(ctx);
    return (
      <Tela>
        <Tappa locale={locale} fps={fps} testo="2 · La banca" />
        <Compare v={molla(locale, 4, fps)} cx={400} cy={400}>
          <Persona x={360} y={480} s={0.8} />
          <Persona x={440} y={480} s={0.8} colore={TEAL_CHIARO} />
        </Compare>
        <Compare v={molla(locale, 8, fps)} cx={860} cy={380}>
          <Palazzo x={860} y={480} s={0.95} nome="Banca" colore={TINTE.tratto} />
        </Compare>
        {/* Il conto vincolato: una cassaforte chiusa, con il lucchetto. */}
        <Compare v={molla(locale, t.conto, fps)} cx={630} cy={320}>
          <Cassaforte x={560} y={250} lato={140} apertura={0} />
          <Righe2 x={630} y={455} righe={["Conto", "vincolato"]} corpo={30} passo={36} />
        </Compare>
        <Compare v={molla(locale, t.bloccato, fps)} cx={630} cy={232}>
          <Lucchetto cx={630} cy={232} s={1.1} />
        </Compare>
        <Compare v={molla(locale, t.bloccato + 6, fps)} cx={630} cy={540}>
          <Testo x={630} y={540} corpo={28} titolo peso={800} colore={TINTE.accento}>
            = bloccato
          </Testo>
        </Compare>
        {/* I soci versano il capitale. */}
        <MoneteInVolo locale={locale} da={t.versate} a={{ x: 420, y: 300 }} c={{ x: 520, y: 170 }} b={{ x: 630, y: 320 }} />
      </Tela>
    );
  },
};

/* 6. «Terzo: atto di fondazione e statuto, controllo dal notaio e dal registro; poi l'assemblea di fondazione, con l'atto pubblico.» */
function tempiNotaio(ctx: ContestoDisegno) {
  const controllo = cambio(ctx, 0, 0.3);
  const assemblea = cambio(ctx, 1, 0.62);
  return { controllo, assemblea, timbro: assemblea + Math.round((ctx.voce - assemblea) * 0.6) };
}
const fondareNotaio: Disegno = {
  chiave: (ctx) => tempiNotaio(ctx).timbro,
  bussolina: (ctx) => {
    const t = tempiNotaio(ctx);
    return {
      posto: { x: 200, y: 450 },
      azioni: [
        { tipo: "lancia", quando: t.controllo + 16 },
        { tipo: "lancia", quando: t.timbro + 2 },
      ],
    };
  },
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const t = tempiNotaio(ctx);
    const prima = 1 - tra(locale, t.assemblea - 6, t.assemblea + 6);
    const seconda = tra(locale, t.assemblea - 2, t.assemblea + 10);
    return (
      <Tela>
        {prima > 0 ? (
          <g opacity={prima} transform={`translate(0 ${-30 * (1 - prima)})`}>
            <Tappa locale={locale} fps={fps} testo="3 · Documenti e notaio" />
            <Compare v={molla(locale, 6, fps)} cx={400} cy={250}>
              <Foglio x={330} y={130} w={140} h={190}>
                <Righe x={350} y={180} w={90} n={4} passo={28} />
              </Foglio>
              <Righe2 x={400} y={360} righe={["Atto di", "fondazione"]} corpo={26} passo={32} />
            </Compare>
            <Compare v={molla(locale, 14, fps)} cx={570} cy={250}>
              <Foglio x={500} y={130} w={140} h={190}>
                <Righe x={520} y={180} w={90} n={4} passo={28} />
              </Foglio>
              <Testo x={570} y={360} corpo={26} titolo peso={800} colore={TINTE.tratto}>
                Statuto
              </Testo>
            </Compare>
            <Freccia d="M 652 230 H 702" p={tra(locale, t.controllo, t.controllo + 10)} />
            <Compare v={molla(locale, t.controllo + 6, fps)} cx={845} cy={290}>
              <rect x={712} y={110} width={268} height={360} rx={26} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
              <Righe2 x={846} y={150} righe={["Controllo", "preliminare"]} corpo={26} passo={30} />
              <Persona x={790} y={340} s={0.55} colore={TINTE.accento} />
              <Testo x={790} y={372} corpo={22} peso={700} colore={TINTE.accento}>
                Notaio
              </Testo>
              <Registro x={905} y={335} s={0.6} />
              <Testo x={905} y={372} corpo={22} peso={700} colore={TINTE.tratto}>
                Registro
              </Testo>
              <Spunta cx={846} cy={425} r={26} p={tra(locale, t.controllo + 26, t.controllo + 38)} />
            </Compare>
          </g>
        ) : null}
        {seconda > 0 ? (
          <g opacity={seconda}>
            <Compare v={molla(locale, t.assemblea, fps)} cx={650} cy={50}>
              <Pillola x={650} y={50} testo="Assemblea di fondazione" corpo={32} fondo={TINTE.tratto} colore={TINTE.carta} />
            </Compare>
            <Compare v={molla(locale, t.assemblea + 4, fps)} cx={620} cy={360}>
              <Persona x={470} y={400} s={0.8} />
              <Persona x={560} y={400} s={0.8} colore={TEAL_CHIARO} />
              <Persona x={710} y={400} s={0.8} colore={TINTE.accento} />
              <rect x={400} y={392} width={380} height={22} rx={10} fill={TINTE.accento} />
              <rect x={420} y={412} width={16} height={70} rx={6} fill={TINTE.accento} />
              <rect x={744} y={412} width={16} height={70} rx={6} fill={TINTE.accento} />
              <Testo x={710} y={226} corpo={24} peso={700} colore={TINTE.accento}>
                Notaio
              </Testo>
            </Compare>
            <Compare v={molla(locale, t.assemblea + 12, fps)} cx={890} cy={320}>
              <Foglio x={830} y={200} w={130} h={170}>
                <Righe x={848} y={250} w={84} n={3} passo={26} />
              </Foglio>
              <g transform={`translate(0 ${-40 * (1 - tra(locale, t.timbro, t.timbro + 10))})`} opacity={tra(locale, t.timbro - 2, t.timbro + 4)}>
                <Timbro cx={900} cy={330} r={38} />
              </g>
              <Righe2 x={895} y={410} righe={["Atto", "pubblico"]} corpo={26} passo={32} />
            </Compare>
          </g>
        ) : null}
      </Tela>
    );
  },
};

/* 7. «Quarto: la Sagl viene iscritta nel registro di commercio. Con l'estratto, la banca sblocca il capitale.» */
function tempiIscrizione(ctx: ContestoDisegno) {
  const estratto = cambio(ctx, 0, 0.5);
  return { iscritta: Math.round(estratto * 0.55), estratto, apre: estratto + 18 };
}
const fondareIscrizione: Disegno = {
  chiave: (ctx) => tempiIscrizione(ctx).iscritta,
  bussolina: (ctx) => {
    const t = tempiIscrizione(ctx);
    return {
      posto: { x: 200, y: 450 },
      azioni: [
        { tipo: "lancia", quando: t.iscritta + 2 },
        { tipo: "lancia", quando: t.apre + 6 },
      ],
    };
  },
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const t = tempiIscrizione(ctx);
    const prima = 1 - tra(locale, t.estratto - 6, t.estratto + 6);
    const seconda = tra(locale, t.estratto - 2, t.estratto + 10);
    return (
      <Tela>
        <Tappa locale={locale} fps={fps} testo="4 · Registro di commercio" />
        {prima > 0 ? (
          <g opacity={prima}>
            <Compare v={molla(locale, 4, fps)} cx={450} cy={280}>
              <Registro x={450} y={360} s={1.3} />
              <Righe2 x={450} y={410} righe={["Registro di", "commercio"]} corpo={30} passo={36} />
            </Compare>
            <Esplosione cx={450} cy={200} p={(locale - t.iscritta) / 24} r={80} />
          </g>
        ) : null}
        {/* La Sagl nasce con l'iscrizione e resta. */}
        <Compare v={molla(locale, t.iscritta, fps)} cx={870} cy={380}>
          <Palazzo x={870} y={480} s={0.95} nome="Sagl" colore={TINTE.accento} />
        </Compare>
        {seconda > 0 ? (
          <g opacity={seconda}>
            <Compare v={molla(locale, t.estratto, fps)} cx={360} cy={280}>
              <Foglio x={305} y={190} w={110} h={150}>
                <Righe x={322} y={240} w={70} n={3} passo={26} />
              </Foglio>
              <Testo x={360} y={375} corpo={28} titolo peso={800} colore={TINTE.tratto}>
                Estratto
              </Testo>
            </Compare>
            <Freccia d="M 428 265 H 470" p={tra(locale, t.estratto + 8, t.estratto + 18)} />
            <Compare v={molla(locale, t.estratto + 4, fps)} cx={670} cy={300}>
              <Cassaforte x={600} y={210} lato={140} apertura={tra(locale, t.apre, t.apre + 14)} />
              <Righe2 x={670} y={420} righe={["Capitale", "sbloccato"]} corpo={28} passo={34} />
            </Compare>
            <MoneteInVolo locale={locale} da={t.apre + 10} a={{ x: 670, y: 280 }} c={{ x: 760, y: 150 }} b={{ x: 860, y: 330 }} />
          </g>
        ) : null}
      </Tela>
    );
  },
};

export const DISEGNI_FONDARE_SAGL: Record<string, Disegno> = {
  "fondare-soci": fondareSoci,
  "fondare-basi": fondareBasi,
  "fondare-direzione": fondareDirezione,
  "fondare-capitale": fondareCapitale,
  "fondare-banca": fondareBanca,
  "fondare-notaio": fondareNotaio,
  "fondare-iscrizione": fondareIscrizione,
};
