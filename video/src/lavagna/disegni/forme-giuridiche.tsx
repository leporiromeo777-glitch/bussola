/**
 * I disegni della lezione 1, versione 2 («Quale forma per la tua attività?»):
 * le quattro forme più comuni, chi paga i debiti, le imposte e come scegliere.
 * Contenuti dal Portale PMI (SECO) e dal Codice delle obbligazioni, vedi
 * src/lezioni/ditta-individuale.ts. Le cifre vengono da src/data (`regole`).
 * Coordinate della tela 1000×700; l'angolo in basso a sinistra (x < 300,
 * y > 480) è della finestra di Bleo.
 */
import { chf, regole } from "../../../../src/data/svizzera";
import {
  Auto,
  Avviso,
  Casa,
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
  Salvadanaio,
  Spunta,
  TEAL_CHIARO,
  Testo,
  Timbro,
  TINTE,
  tra,
} from "../figure";
import { Tela } from "./ditta-individuale";
import type { ContestoDisegno, Disegno } from "./tipi";

/** Il cambio di sottotitolo `i` (fotogrammi dall'inizio della scena), o una frazione della voce. */
function cambio(ctx: ContestoDisegno, i: number, frazione: number): number {
  return ctx.cambi[i] ?? Math.round(ctx.voce * frazione);
}

/** Un'etichetta su più righe, centrata. */
function Righe2({ x, y, righe, corpo = 30, colore = TINTE.tratto, passo = 36, peso = 800 }: { x: number; y: number; righe: string[]; corpo?: number; colore?: string; passo?: number; peso?: number }) {
  return (
    <g>
      {righe.map((r, i) => (
        <Testo key={r} x={x} y={y + i * passo} corpo={corpo} titolo={peso >= 800} peso={peso} colore={colore}>
          {r}
        </Testo>
      ))}
    </g>
  );
}

/* 2. Le quattro forme più comuni. */
const FORME = [
  { x: 135, nome: ["Ditta", "individuale"], chi: "una persona" },
  { x: 380, nome: ["Società in", "nome collettivo"], chi: "due o più persone" },
  { x: 625, nome: ["Sagl"], chi: "una società" },
  { x: 870, nome: ["SA"], chi: "una società" },
];
const quattroForme: Disegno = {
  chiave: (ctx) => cambio(ctx, 1, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 500, y: 745 },
    azioni: [
      { tipo: "lancia", quando: 8 },
      { tipo: "lancia", quando: cambio(ctx, 0, 0.3) + 4 },
      { tipo: "lancia", quando: cambio(ctx, 1, 0.6) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tempi = [8, cambio(ctx, 0, 0.3), cambio(ctx, 1, 0.6), cambio(ctx, 1, 0.6) + 8];
    const separate = cambio(ctx, 1, 0.6) + 30;
    return (
      <Tela>
        {FORME.map((f, i) => {
          const v = molla(locale, tempi[i], fps);
          return (
            <Compare key={f.chi + f.x} v={v} cx={f.x} cy={300}>
              <rect x={f.x - 112} y={110} width={224} height={370} rx={28} fill={TINTE.carta} stroke={i < 2 ? TINTE.tratto : TINTE.accento} strokeWidth={6} />
              {i === 0 ? <Persona x={f.x} y={300} s={0.8} /> : null}
              {i === 1 ? (
                <g>
                  <Persona x={f.x - 34} y={300} s={0.72} />
                  <Persona x={f.x + 34} y={300} s={0.72} colore={TEAL_CHIARO} />
                </g>
              ) : null}
              {i === 2 ? <Palazzo x={f.x} y={300} s={0.8} colore={TINTE.accento} /> : null}
              {i === 3 ? <Palazzo x={f.x} y={300} s={0.95} colore={TINTE.accento} /> : null}
              <Righe2 x={f.x} y={f.nome.length > 1 ? 345 : 360} righe={f.nome} corpo={f.nome.length > 1 ? 30 : 38} colore={i < 2 ? TINTE.tratto : TINTE.accento} />
              <Testo x={f.x} y={445} corpo={i === 1 ? 26 : 28} peso={600} colore={COLORE_TENUE}>
                {f.chi}
              </Testo>
            </Compare>
          );
        })}
        {/* Sagl e SA: separate da chi le fonda. */}
        <Compare v={molla(locale, separate, fps)} cx={748} cy={540}>
          <path d="M 520 505 Q 520 525 540 525 H 956 Q 976 525 976 505" fill="none" stroke={TINTE.accento} strokeWidth={6} strokeLinecap="round" />
          <Testo x={748} y={565} corpo={32} titolo peso={800} colore={TINTE.accento}>
            separate da chi le fonda
          </Testo>
        </Compare>
      </Tela>
    );
  },
};
const COLORE_TENUE = "#5d6470";

/* 3. La ditta individuale: le tre cose da ricordare. */
const PUNTI_DITTA = [
  { x: 470, righe: ["Nasce quando", "inizi"] },
  { x: 680, righe: ["Nessun capitale", "minimo"] },
  { x: 890, righe: ["Il titolare", "sei solo tu"] },
];
function tempiDitta(ctx: ContestoDisegno): number[] {
  const c = cambio(ctx, 0, 0.55);
  return [Math.round(ctx.voce * 0.36), c, c + Math.round((ctx.voce - c) * 0.55)];
}
const dittaTrePunti: Disegno = {
  chiave: (ctx) => tempiDitta(ctx)[0],
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: tempiDitta(ctx).map((t) => ({ tipo: "lancia" as const, quando: t + 2 })),
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tempi = tempiDitta(ctx);
    return (
      <Tela>
        <Compare v={molla(locale, 2, fps)} cx={680} cy={70}>
          <Pillola x={680} y={70} testo="Ditta individuale" corpo={38} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {PUNTI_DITTA.map((p, i) => {
          const v = molla(locale, tempi[i], fps);
          return (
            <Compare key={p.x} v={v} cx={p.x} cy={330}>
              <rect x={p.x - 98} y={150} width={196} height={350} rx={26} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
              <circle cx={p.x} cy={150} r={26} fill={TINTE.tratto} />
              <Testo x={p.x} y={151} corpo={30} titolo peso={800} colore={TINTE.carta}>
                {String(i + 1)}
              </Testo>
              {i === 0 ? (
                <g>
                  <line x1={p.x - 74} y1={330} x2={p.x + 74} y2={330} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" />
                  <Persona x={p.x - 20} y={330} s={0.6} />
                  <Esplosione cx={p.x + 40} cy={270} p={(locale - tempi[0] - 4) / 22} r={46} />
                  <circle cx={p.x + 40} cy={270} r={10 * Math.min(1, v)} fill={TINTE.oro} />
                </g>
              ) : null}
              {i === 1 ? (
                <g>
                  <Cassaforte x={p.x - 62} y={210} lato={110} apertura={tra(locale, tempi[1] + 6, tempi[1] + 20)} />
                  <Spunta cx={p.x + 56} cy={210} r={26} p={tra(locale, tempi[1] + 16, tempi[1] + 28)} />
                </g>
              ) : null}
              {i === 2 ? (
                <g>
                  <Persona x={p.x} y={340} s={0.7} />
                  <path d={`M ${p.x - 30} 196 l 10 -24 l 20 14 l 20 -14 l 10 24 Z`} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={4} strokeLinejoin="round" />
                </g>
              ) : null}
              <Righe2 x={p.x} y={410} righe={p.righe} corpo={30} />
            </Compare>
          );
        })}
      </Tela>
    );
  },
};

/* 4. La società in nome collettivo. */
const nomeCollettivo: Disegno = {
  chiave: (ctx) => cambio(ctx, 0, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 880, y: 745 },
    azioni: [
      { tipo: "lancia", quando: cambio(ctx, 0, 0.35) + 4 },
      { tipo: "lancia", quando: cambio(ctx, 1, 0.7) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const badge = cambio(ctx, 0, 0.35);
    const debiti = cambio(ctx, 1, 0.7);
    const soci = debiti + 30;
    const rossi = locale >= soci + 10;
    return (
      <Tela>
        <Compare v={molla(locale, 2, fps)} cx={470} cy={320}>
          {/* la «casa» comune dei soci */}
          <path d="M 300 470 V 240 L 470 120 L 640 240 V 470" fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={7} strokeLinejoin="round" />
          <Persona x={420} y={460} s={0.85} contorno={rossi ? TINTE.rischio : undefined} />
          <Persona x={525} y={460} s={0.85} colore={TEAL_CHIARO} contorno={rossi ? TINTE.rischio : undefined} />
          <Pillola x={470} y={80} testo="Nome collettivo" corpo={34} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, badge, fps)} cx={820} cy={130}>
          <rect x={670} y={90} width={320} height={84} rx={22} fill={TINTE.carta} stroke={TINTE.ok} strokeWidth={5} />
          <Spunta cx={712} cy={132} r={24} p={tra(locale, badge + 4, badge + 16)} />
          <Righe2 x={850} y={114} righe={["Nessun capitale", "minimo"]} corpo={30} colore={TINTE.ok} passo={34} />
        </Compare>
        <Compare v={molla(locale, badge + 22, fps)} cx={820} cy={250}>
          <rect x={670} y={200} width={320} height={110} rx={22} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <Registro x={732} y={295} s={0.6} />
          <Righe2 x={860} y={236} righe={["Registro di", "commercio"]} corpo={30} passo={36} />
        </Compare>
        <Compare v={molla(locale, debiti, fps)} cx={830} cy={440}>
          <rect x={700} y={395} width={260} height={90} rx={22} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={6} />
          <Testo x={830} y={441} corpo={34} titolo peso={800} colore={TINTE.rischio}>
            Debiti
          </Testo>
        </Compare>
        <Freccia d="M 700 440 Q 670 400 640 330" p={tra(locale, debiti + 8, debiti + 22)} colore={TINTE.rischio} spessore={7} />
        <Freccia d="M 760 490 Q 700 560 590 520" p={tra(locale, soci, soci + 14)} colore={TINTE.rischio} spessore={7} />
        <Compare v={molla(locale, soci + 8, fps)} cx={470} cy={560}>
          <Righe2 x={470} y={540} righe={["poi i soci, con il", "loro patrimonio"]} corpo={30} colore={TINTE.rischio} passo={36} />
        </Compare>
        <Compare v={molla(locale, debiti + 18, fps)} cx={650} cy={360}>
          <Testo x={600} y={380} corpo={28} peso={700} colore={TINTE.rischio} ancora="end">
            prima
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 5. Sagl e SA: notaio, registro di commercio, capitale minimo (da src/data). */
const saglSa: Disegno = {
  chiave: (ctx) => cambio(ctx, 1, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: 30 },
      { tipo: "lancia", quando: cambio(ctx, 1, 0.6) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const capitale = cambio(ctx, 1, 0.6);
    // Prima parte: dal notaio al registro; seconda: le due società con il capitale minimo.
    const prima = 1 - tra(locale, capitale - 6, capitale + 6);
    const seconda = tra(locale, capitale - 2, capitale + 10);
    return (
      <Tela>
        <g opacity={prima} transform={`translate(0 ${-30 * (1 - prima)})`}>
          <Compare v={molla(locale, 4, fps)} cx={430} cy={320}>
            <Foglio x={360} y={150} w={160} h={210}>
              <Righe x={385} y={200} w={100} n={4} passo={28} />
            </Foglio>
            <g transform={`translate(0 ${-40 * (1 - tra(locale, 16, 26))})`} opacity={tra(locale, 14, 20)}>
              <Timbro cx={480} cy={320} r={40} />
            </g>
            <Testo x={440} y={410} corpo={34} titolo peso={800} colore={TINTE.tratto}>
              Notaio
            </Testo>
          </Compare>
          <Freccia d="M 560 260 H 660" p={tra(locale, 30, 42)} />
          <Compare v={molla(locale, 40, fps)} cx={790} cy={300}>
            <Registro x={790} y={330} s={1.2} />
            <Righe2 x={790} y={390} righe={["Registro di", "commercio"]} corpo={32} passo={38} />
          </Compare>
          <Esplosione cx={790} cy={210} p={(locale - 50) / 24} r={80} />
        </g>
        {seconda > 0 ? (
          <g opacity={seconda}>
            <Testo x={650} y={50} corpo={36} titolo peso={800} colore={TINTE.accento}>
              Capitale minimo
            </Testo>
            {[
              { x: 480, nome: "Sagl", importo: chf(regole.capitaleMinimoSagl.valore), monete: 2, s: 0.9 },
              { x: 820, nome: "SA", importo: chf(regole.capitaleMinimoSa.valore), monete: 4, s: 1.05 },
            ].map((c, i) => {
              const v = molla(locale, capitale + i * 12, fps);
              return (
                <Compare key={c.nome} v={v} cx={c.x} cy={330}>
                  <Palazzo x={c.x - 40} y={400} s={c.s} nome={c.nome} colore={TINTE.accento} />
                  {Array.from({ length: c.monete }, (_, k) => (
                    <Moneta key={k} cx={c.x + 90} cy={385 - k * 22} r={30} />
                  ))}
                  <rect x={c.x - 150} y={440} width={300} height={70} rx={20} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
                  <Testo x={c.x} y={477} corpo={36} titolo peso={800} colore={TINTE.accento}>
                    {c.importo}
                  </Testo>
                </Compare>
              );
            })}
          </g>
        ) : null}
      </Tela>
    );
  },
};

/* 6. Chi paga i debiti? Ditta individuale: tu. Sagl e SA: la società. */
const BENI = [
  { y: 260, nome: "Casa" },
  { y: 380, nome: "Auto" },
  { y: 500, nome: "Risparmi" },
];
const chiPagaDebiti: Disegno = {
  chiave: (ctx) => cambio(ctx, 0, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 600, y: 745 },
    azioni: [
      { tipo: "scuoti", quando: cambio(ctx, 0, 0.3) + 2 },
      { tipo: "lancia", quando: cambio(ctx, 1, 0.68) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tu = cambio(ctx, 0, 0.3);
    const societa = cambio(ctx, 1, 0.68);
    // Prima del primo cambio: tu e la ditta, una persona sola.
    const unisce = tra(locale, 20, 46);
    const via = tra(locale, tu - 6, tu + 6);
    return (
      <Tela>
        {via < 1 ? (
          <g opacity={1 - via}>
            <Compare v={molla(locale, 6, fps)} cx={600} cy={420}>
              <g transform={`translate(${-90 * (1 - unisce)} 0)`}>
                <Persona x={560} y={470} s={1} />
              </g>
              <g transform={`translate(${90 * (1 - unisce)} 0)`}>
                <Palazzo x={680} y={470} s={0.8} colore={TINTE.accento} />
              </g>
            </Compare>
            <Testo x={620} y={560} corpo={40} titolo peso={800} colore={TINTE.accento} opacita={tra(locale, 44, 56)}>
              = la stessa persona
            </Testo>
          </g>
        ) : null}
        {/* A sinistra: ditta individuale. */}
        <g opacity={tra(locale, tu - 2, tu + 8)}>
          <Testo x={470} y={40} corpo={34} titolo peso={800} colore={TINTE.tratto}>
            Ditta individuale
          </Testo>
          <rect x={360} y={80} width={220} height={74} rx={20} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={6} />
          <Testo x={470} y={118} corpo={32} titolo peso={800} colore={TINTE.rischio}>
            Debiti
          </Testo>
          {BENI.map((b, i) => {
            const p = tra(locale, tu + 10 + i * 10, tu + 22 + i * 10);
            const rosso = p > 0.98;
            const colore = rosso ? TINTE.rischio : TINTE.tratto;
            return (
              <g key={b.nome}>
                <Freccia d={`M 400 156 Q 360 ${(156 + b.y - 40) / 2} 382 ${b.y - 52}`} p={p} colore={TINTE.rischio} spessore={6} />
                <Compare v={molla(locale, tu + 4 + i * 4, fps)} cx={420} cy={b.y - 40}>
                  {i === 0 ? <Casa x={420} y={b.y} s={0.72} colore={colore} /> : null}
                  {i === 1 ? <Auto x={420} y={b.y - 4} s={0.8} colore={colore} /> : null}
                  {i === 2 ? <Salvadanaio x={420} y={b.y} s={0.72} colore={colore} /> : null}
                  <Testo x={490} y={b.y - 40} corpo={30} titolo peso={800} colore={colore} ancora="start">
                    {b.nome}
                  </Testo>
                </Compare>
              </g>
            );
          })}
        </g>
        {/* A destra: Sagl e SA. */}
        <line x1={660} y1={30} x2={660} y2={540} stroke={TINTE.tinta} strokeWidth={5} strokeDasharray="10 12" opacity={tra(locale, societa - 6, societa)} />
        <g opacity={tra(locale, societa - 4, societa + 6)}>
          <Testo x={830} y={40} corpo={34} titolo peso={800} colore={TINTE.accento}>
            Sagl e SA
          </Testo>
          <rect x={720} y={80} width={220} height={74} rx={20} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={6} />
          <Testo x={830} y={118} corpo={32} titolo peso={800} colore={TINTE.rischio}>
            Debiti
          </Testo>
          <Freccia d="M 830 158 V 214" p={tra(locale, societa + 8, societa + 18)} colore={TINTE.rischio} spessore={6} />
          <Compare v={molla(locale, societa + 14, fps)} cx={830} cy={330}>
            <Palazzo x={830} y={420} s={0.85} colore={TINTE.accento} />
          </Compare>
          <Compare v={molla(locale, societa + 26, fps)} cx={830} cy={480}>
            <Righe2 x={830} y={470} righe={["solo il patrimonio", "della società"]} corpo={30} colore={TINTE.accento} passo={36} />
          </Compare>
        </g>
      </Tela>
    );
  },
};

/* 7. Le imposte: dichiarazione personale o imposte della società. */
const imposteConfronto: Disegno = {
  chiave: (ctx) => cambio(ctx, 0, 0.2),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: cambio(ctx, 1, 0.5) + 4 },
      { tipo: "lancia", quando: (ctx.cambi.at(-1) ?? Math.round(ctx.voce * 0.75)) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const sinistra = cambio(ctx, 0, 0.2);
    const reddito = cambio(ctx, 1, 0.5);
    const destra = ctx.cambi.at(-1) ?? Math.round(ctx.voce * 0.75);
    return (
      <Tela>
        <Compare v={molla(locale, 2, fps)} cx={650} cy={40}>
          <Pillola x={650} y={40} testo="Le imposte" corpo={36} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <g opacity={tra(locale, sinistra, sinistra + 10)}>
          <Righe2 x={470} y={120} righe={["Ditta individuale", "e nome collettivo"]} corpo={30} passo={36} />
          {[0, 1, 2].map((i) => (
            <Moneta key={i} cx={360} cy={330 - i * 24} r={34} />
          ))}
          <Freccia d="M 400 290 Q 440 250 470 270" p={tra(locale, reddito, reddito + 12)} colore={TINTE.accento} spessore={6} />
          <Compare v={molla(locale, reddito + 6, fps)} cx={540} cy={320}>
            <Foglio x={470} y={200} w={150} h={220}>
              <circle cx={545} cy={262} r={30} fill={TINTE.tratto} />
              <path d="M 515 316 q 30 -34 60 0" fill={TINTE.tratto} />
              <Righe x={492} y={350} w={100} n={3} passo={24} />
            </Foglio>
          </Compare>
          <Compare v={molla(locale, reddito + 16, fps)} cx={470} cy={480}>
            <Righe2 x={470} y={470} righe={["nella tua", "dichiarazione"]} corpo={30} colore={TINTE.tratto} passo={36} />
          </Compare>
        </g>
        <line x1={660} y1={100} x2={660} y2={540} stroke={TINTE.tinta} strokeWidth={5} strokeDasharray="10 12" opacity={tra(locale, destra - 4, destra + 4)} />
        <g opacity={tra(locale, destra - 2, destra + 8)}>
          <Testo x={830} y={120} corpo={30} titolo peso={800} colore={TINTE.accento}>
            Sagl e SA
          </Testo>
          <Compare v={molla(locale, destra + 4, fps)} cx={760} cy={330}>
            <Palazzo x={750} y={420} s={0.7} colore={TINTE.accento} />
          </Compare>
          <Compare v={molla(locale, destra + 14, fps)} cx={900} cy={330}>
            <Foglio x={845} y={230} w={120} h={180}>
              <Righe x={862} y={290} w={80} n={4} passo={24} />
            </Foglio>
          </Compare>
          <Compare v={molla(locale, destra + 22, fps)} cx={830} cy={480}>
            <Righe2 x={830} y={470} righe={["pagano come", "società"]} corpo={30} colore={TINTE.accento} passo={36} />
          </Compare>
        </g>
      </Tela>
    );
  },
};

/* 8. Come scegliere: quattro domande (criteri del Portale PMI). */
const DOMANDE = [
  { testo: "Da solo o con altre persone?", icona: "persone" },
  { testo: "Quanto rischio c'è?", icona: "rischio" },
  { testo: "Quanto capitale puoi mettere?", icona: "capitale" },
  { testo: "Come pagare le imposte?", icona: "imposte" },
] as const;
const RIGA = { x: 330, w: 650, alto: 100, h: 82, passo: 96 };
function tempiDomande(ctx: ContestoDisegno): number[] {
  return [1, 2, 3, 4].map((i) => cambio(ctx, i, 0.2 + i * 0.17));
}
const quattroDomande: Disegno = {
  chiave: (ctx) => tempiDomande(ctx)[0],
  bussolina: (ctx) => ({
    posto: { x: 250, y: 300 },
    azioni: tempiDomande(ctx).map((t, i) => ({
      tipo: "tocca" as const,
      quando: t + 14,
      bersaglio: { x: RIGA.x + 6, y: RIGA.alto + i * RIGA.passo + RIGA.h / 2 },
    })),
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tempi = tempiDomande(ctx);
    return (
      <Tela>
        <Compare v={molla(locale, 2, fps)} cx={655} cy={40}>
          <Pillola x={655} y={40} testo="Come scegliere: quattro domande" corpo={32} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {DOMANDE.map((d, i) => {
          const y = RIGA.alto + i * RIGA.passo;
          const v = molla(locale, tempi[i], fps);
          const spunta = tra(locale, tempi[i] + 14, tempi[i] + 24);
          const cy = y + RIGA.h / 2;
          return (
            <Compare key={d.testo} v={v} cx={RIGA.x + 40} cy={cy}>
              <rect x={RIGA.x} y={y} width={RIGA.w} height={RIGA.h} rx={22} fill={spunta > 0.5 ? TINTE.tinta : TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
              <rect x={RIGA.x + 18} y={cy - 22} width={44} height={44} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
              {spunta > 0 ? (
                <path
                  d={`M ${RIGA.x + 28} ${cy} l 10 11 l 18 -22`}
                  fill="none"
                  stroke={TINTE.ok}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - spunta}
                />
              ) : null}
              <g transform={`translate(${RIGA.x + 106} ${cy})`}>
                {d.icona === "persone" ? (
                  <g>
                    <Persona x={-14} y={30} s={0.34} />
                    <Persona x={14} y={30} s={0.34} colore={TEAL_CHIARO} />
                  </g>
                ) : null}
                {d.icona === "rischio" ? <Avviso x={0} y={0} s={0.62} /> : null}
                {d.icona === "capitale" ? (
                  <g>
                    <Moneta cx={-8} cy={6} r={18} />
                    <Moneta cx={8} cy={-8} r={18} />
                  </g>
                ) : null}
                {d.icona === "imposte" ? (
                  <g>
                    <rect x={-20} y={-26} width={40} height={52} rx={6} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} />
                    <line x1={-10} y1={-10} x2={10} y2={-10} stroke={TINTE.tinta} strokeWidth={5} strokeLinecap="round" />
                    <line x1={-10} y1={2} x2={10} y2={2} stroke={TINTE.tinta} strokeWidth={5} strokeLinecap="round" />
                    <line x1={-10} y1={14} x2={4} y2={14} stroke={TINTE.tinta} strokeWidth={5} strokeLinecap="round" />
                  </g>
                ) : null}
              </g>
              <Testo x={RIGA.x + 150} y={cy + 1} corpo={32} titolo peso={800} colore={TINTE.tratto} ancora="start">
                {d.testo}
              </Testo>
            </Compare>
          );
        })}
      </Tela>
    );
  },
};

/* 9. In generale: tre strade (parole del Portale PMI: «spesso», «di solito»). */
const STRADE = [
  { y: 140, se: "Da solo, poco rischio", allora: "spesso ditta individuale" },
  { y: 300, se: "Con altre persone", allora: "spesso nome collettivo" },
  { y: 460, se: "Più rischio", allora: "di solito Sagl o SA" },
];
const CARTA = { x: 560, w: 430, h: 112 };
function tempiStrade(ctx: ContestoDisegno): number[] {
  return [cambio(ctx, 0, 0.25), cambio(ctx, 1, 0.5), cambio(ctx, 2, 0.75)];
}
const percorsoScelta: Disegno = {
  chiave: (ctx) => tempiStrade(ctx)[0],
  bussolina: (ctx) => ({
    posto: { x: 480, y: 300 },
    azioni: tempiStrade(ctx).map((t, i) => ({
      tipo: "tocca" as const,
      quando: t + 10,
      bersaglio: { x: CARTA.x + 4, y: STRADE[i].y },
    })),
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const tempi = tempiStrade(ctx);
    return (
      <Tela>
        <Compare v={molla(locale, 2, fps)} cx={370} cy={360}>
          <Persona x={370} y={400} s={0.9} />
          <Testo x={370} y={440} corpo={30} titolo peso={800} colore={TINTE.tratto}>
            Tu
          </Testo>
        </Compare>
        {STRADE.map((s, i) => {
          const p = tra(locale, tempi[i] - 10, tempi[i] + 4);
          const v = molla(locale, tempi[i], fps);
          const colore = i === 2 ? TINTE.accento : TINTE.tratto;
          return (
            <g key={s.se}>
              <Freccia d={`M 420 ${300 + (i - 1) * 30} Q 500 ${(300 + s.y) / 2} ${CARTA.x - 8} ${s.y}`} p={p} colore={colore} spessore={7} />
              <Compare v={v} cx={CARTA.x + CARTA.w / 2} cy={s.y}>
                <rect x={CARTA.x} y={s.y - CARTA.h / 2} width={CARTA.w} height={CARTA.h} rx={24} fill={i === 0 ? TINTE.tinta : TINTE.carta} stroke={colore} strokeWidth={6} />
                <Testo x={CARTA.x + CARTA.w / 2} y={s.y - 22} corpo={30} peso={600} colore={COLORE_TENUE}>
                  {s.se}
                </Testo>
                <Testo x={CARTA.x + CARTA.w / 2} y={s.y + 22} corpo={32} titolo peso={800} colore={colore}>
                  {s.allora}
                </Testo>
              </Compare>
            </g>
          );
        })}
      </Tela>
    );
  },
};

export const DISEGNI_FORME: Record<string, Disegno> = {
  "quattro-forme": quattroForme,
  "ditta-tre-punti": dittaTrePunti,
  "nome-collettivo": nomeCollettivo,
  "sagl-sa": saglSa,
  "chi-paga-debiti": chiPagaDebiti,
  "imposte-confronto": imposteConfronto,
  "quattro-domande": quattroDomande,
  "percorso-scelta": percorsoScelta,
};

