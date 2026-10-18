/**
 * I disegni della lezione 15 («Vendere online: cosa mettere sul sito»), vedi
 * src/lezioni/sito-online.ts. Fonti: art. 3 cpv. 1 lett. s e cpv. 2 LCSl,
 * pagina «Acquisti online» della SECO, pagine del Portale PMI sull'e-commerce,
 * art. 954a CO, artt. 3 e 4 OIP, art. 19 LPD. Nomi e indirizzi sono esempi
 * («Giulia Rossi» e «Caseificio di Rossi G.» come nella lezione 8); i passi
 * dell'ordine e le parole dei pulsanti vengono dal Portale PMI. Coordinate
 * della tela 1000×700; l'angolo in basso a sinistra (x < 300, y > 480) è
 * della finestra di Bleo. Niente cifre, solo concetti.
 */
import type { ReactNode } from "react";
import { TITOLI } from "../../stile";
import { Casa, Compare, Foglio, Freccia, molla, Persona, Pillola, Righe, Scudo, Spunta, TEAL_CHIARO, Testo, TINTE, tra } from "../figure";
import { Tela } from "./ditta-individuale";
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

/** Un bollino rosso con la croce bianca (p da 0 a 1): «no», come Spunta per «sì». */
function No({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: number }) {
  if (p <= 0) return null;
  const tondo = Math.min(1, p * 1.6);
  const segno = Math.max(0, (p - 0.4) / 0.6) * r * 0.42;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * (0.6 + 0.4 * tondo)} fill={TINTE.rischio} opacity={tondo} />
      <g stroke={TINTE.carta} strokeWidth={r * 0.2} strokeLinecap="round">
        <line x1={cx - segno} y1={cy - segno} x2={cx + segno} y2={cy + segno} />
        <line x1={cx + segno} y1={cy - segno} x2={cx - segno} y2={cy + segno} />
      </g>
    </g>
  );
}

/** La finestra del browser (angolo in alto a sinistra in x, y): il sito. Il contenuto va dentro. */
function Browser({ x, y, w, h, indirizzo, children }: { x: number; y: number; w: number; h: number; indirizzo?: string; children?: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d={`M ${x + 3} ${y + 48} V ${y + 18} q 0 -15 15 -15 H ${x + w - 18} q 15 0 15 15 V ${y + 48} Z`} fill={TINTE.tratto} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 26 + i * 22} cy={y + 26} r={7} fill={i === 0 ? TINTE.accento : TINTE.tinta} />
      ))}
      <rect x={x + 100} y={y + 11} width={w - 120} height={30} rx={15} fill={TINTE.carta} />
      {indirizzo ? (
        <Testo x={x + 100 + (w - 120) / 2} y={y + 27} corpo={20} titolo peso={800} colore={TINTE.tratto}>
          {indirizzo}
        </Testo>
      ) : null}
      {children}
    </g>
  );
}

/** Una busta chiusa centrata in (cx, cy): l'e-mail. */
function Busta({ cx, cy, s = 1, colore = TINTE.tratto }: { cx: number; cy: number; s?: number; colore?: string }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-60} y={-40} width={120} height={80} rx={10} fill={TINTE.carta} stroke={colore} strokeWidth={6} />
      <path d="M -56 -34 L 0 8 L 56 -34" fill="none" stroke={colore} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** Uno smartphone centrato in (cx, cy); lo schermo va dentro. */
function Telefono({ cx, cy, w = 190, h = 330, children }: { cx: number; cy: number; w?: number; h?: number; children?: ReactNode }) {
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={30} fill={TINTE.tratto} />
      <rect x={cx - w / 2 + 12} y={cy - h / 2 + 34} width={w - 24} height={h - 64} rx={12} fill={TINTE.carta} />
      <rect x={cx - 22} y={cy - h / 2 + 14} width={44} height={8} rx={4} fill={TINTE.tinta} />
      {children}
    </g>
  );
}

/** La cornetta del telefono, centrata in (cx, cy). */
function Cornetta({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-35)`}>
      <path
        d="M -46 -30 q -8 -10 4 -18 l 18 -10 q 10 -5 16 5 l 10 20 q 4 9 -5 14 l -10 6 q 6 22 26 36 l 10 -6 q 9 -5 14 4 l 12 20 q 5 10 -4 16 l -18 10 q -14 6 -26 -4 q -38 -30 -47 -93 Z"
        fill={TINTE.tratto}
        transform="translate(0 -6.5)"
      />
    </g>
  );
}

/** Due fumetti di chat: i messaggi. */
function Messaggi({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <path d={`M ${cx - 90} ${cy - 60} h 110 q 16 0 16 16 v 30 q 0 16 -16 16 h -84 l -18 16 v -16 q -24 0 -24 -16 v -30 q 0 -16 16 -16 Z`} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
      <line x1={cx - 74} y1={cy - 38} x2={cx + 6} y2={cy - 38} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" opacity={0.5} />
      <line x1={cx - 74} y1={cy - 20} x2={cx - 20} y2={cy - 20} stroke={TINTE.tratto} strokeWidth={7} strokeLinecap="round" opacity={0.5} />
      <path d={`M ${cx - 20} ${cy + 18} h 110 q 16 0 16 16 v 30 q 0 16 -16 16 v 16 l -18 -16 h -92 q -16 0 -16 -16 v -30 q 0 -16 16 -16 Z`} fill={TINTE.carta} stroke={TEAL_CHIARO} strokeWidth={5} strokeLinejoin="round" />
      <line x1={cx} y1={cy + 40} x2={cx + 80} y2={cy + 40} stroke={TEAL_CHIARO} strokeWidth={7} strokeLinecap="round" opacity={0.6} />
      <line x1={cx} y1={cy + 58} x2={cx + 50} y2={cy + 58} stroke={TEAL_CHIARO} strokeWidth={7} strokeLinecap="round" opacity={0.6} />
    </g>
  );
}

/** La freccia del mouse, con la punta in (x, y); `clic` da 0 a 1 fa l'onda del clic. */
function Cursore({ x, y, clic = 0 }: { x: number; y: number; clic?: number }) {
  return (
    <g>
      {clic > 0 && clic < 1 ? <circle cx={x} cy={y} r={14 + clic * 30} fill="none" stroke={TINTE.accento} strokeWidth={5} opacity={1 - clic} /> : null}
      <path d={`M ${x} ${y} l 0 52 l 13 -12 l 10 24 l 12 -5 l -10 -23 l 18 -2 Z`} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
}

/** Una matita, con la punta in basso a sinistra in (x, y): correggere. */
function Matita({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(-45)`}>
      <rect x={14} y={-9} width={62} height={18} rx={4} fill={TINTE.accento} />
      <rect x={70} y={-9} width={14} height={18} rx={4} fill={TINTE.rischio} opacity={0.75} />
      <path d="M 14 -9 L 0 0 L 14 9 Z" fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={3} strokeLinejoin="round" />
      <path d="M 5 -3 L 0 0 L 5 3 Z" fill={TINTE.tratto} />
    </g>
  );
}

/** Un pacco con il nastro, centrato in (cx, cy). */
function Pacco({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M -60 -26 L 0 -50 L 60 -26 L 0 -2 Z" fill="#e8c48f" stroke={TINTE.accento} strokeWidth={5} strokeLinejoin="round" />
      <path d="M -60 -26 L 0 -2 V 56 L -60 32 Z" fill="#d9a86a" stroke={TINTE.accento} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 60 -26 L 0 -2 V 56 L 60 32 Z" fill="#c9965a" stroke={TINTE.accento} strokeWidth={5} strokeLinejoin="round" />
      <path d="M -30 -38 L 30 -14 V 12" fill="none" stroke={TINTE.carta} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
    </g>
  );
}

/** Una tazza: il prodotto in vendita. */
function Tazza({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d="M 44 -28 q 34 0 34 28 q 0 28 -34 28" fill="none" stroke={TINTE.tratto} strokeWidth={12} strokeLinecap="round" />
      <path d="M -52 -50 H 52 V 30 q 0 26 -26 26 H -26 q -26 0 -26 -26 Z" fill={TINTE.accento} stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -30 -30 v 50" stroke={TINTE.carta} strokeWidth={8} strokeLinecap="round" opacity={0.5} />
      {[-22, 0, 22].map((dx) => (
        <path key={dx} d={`M ${dx} -66 q -8 -10 0 -20 q 8 -10 0 -20`} fill="none" stroke={TINTE.tinta} strokeWidth={6} strokeLinecap="round" />
      ))}
    </g>
  );
}

/** Il cartellino del prezzo, con la sigla della moneta e una riga al posto della cifra. */
function Cartellino({ cx, cy, s = 1, colore = TINTE.tratto }: { cx: number; cy: number; s?: number; colore?: string }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-8)`}>
      <path d="M -96 -38 H 70 L 104 0 L 70 38 H -96 q -12 0 -12 -12 V -26 q 0 -12 12 -12 Z" fill={colore} />
      <circle cx={74} cy={0} r={8} fill={TINTE.carta} />
      <text x={-82} y={2} fontFamily={TITOLI} fontWeight={800} fontSize={34} fill={TINTE.carta} dominantBaseline="middle">
        CHF
      </text>
      <line x1={-2} y1={2} x2={46} y2={2} stroke={TINTE.carta} strokeWidth={10} strokeLinecap="round" opacity={0.75} />
    </g>
  );
}

/** Un libro di legge chiuso, centrato in (cx, cy). */
function Legge({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-44} y={-58} width={88} height={116} rx={10} fill={TINTE.tratto} />
      <rect x={-34} y={-58} width={10} height={116} fill={TINTE.carta} opacity={0.35} />
      <rect x={-14} y={-34} width={44} height={22} rx={5} fill={TINTE.carta} />
      <path d="M -6 18 h 28 M 8 6 v 26 M -12 6 l 8 12 h -16 Z M 28 6 l 8 12 h -16 Z" fill="none" stroke={TINTE.oro} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** Le stelle in cerchio: l'Unione europea. */
function StelleUe({ cx, cy, r = 52 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#1d4f91" />
      {Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2;
        return (
          <path
            key={k}
            d="M0,-1 L0.29,-0.4 L0.95,-0.31 L0.47,0.15 L0.59,0.81 L0,0.5 L-0.59,0.81 L-0.47,0.15 L-0.95,-0.31 L-0.29,-0.4 Z"
            fill="#f2c94c"
            transform={`translate(${cx + Math.cos(a) * r * 0.66} ${cy + Math.sin(a) * r * 0.66}) scale(${r * 0.13})`}
          />
        );
      })}
    </g>
  );
}

/* 2. «Lo dice la legge contro la concorrenza sleale. Chi offre … online deve fare quattro cose. Dire chi è. Spiegare i passi dell'ordine. Permettere di correggere gli errori. E confermare subito l'ordine.» */
const REGOLE = ["Dire chi sei", "Spiegare i passi dell'ordine", "Far correggere gli errori", "Confermare subito l'ordine"];
const RIGA = { x: 330, w: 650, alto: 180, h: 66, passo: 78 };
function tempiRegole(ctx: ContestoDisegno): number[] {
  return [fra(ctx, 1, 2, 0.1, 0.4), fra(ctx, 2, 3, 0.1, 0.55), fra(ctx, 3, 4, 0.1, 0.7), fra(ctx, 4, null, 0.08, 0.85)];
}
const sitoQuattro: Disegno = {
  chiave: (ctx) => tempiRegole(ctx)[0],
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.15) },
      ...tempiRegole(ctx).map((t, i) => ({
        tipo: "tocca" as const,
        quando: t + 12,
        bersaglio: { x: RIGA.x + 6, y: RIGA.alto + i * RIGA.passo + RIGA.h / 2 },
      })),
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const legge = fra(ctx, null, 0, 0.15, 0.05);
    const online = fra(ctx, 0, 1, 0.3, 0.25);
    const t = tempiRegole(ctx);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Quattro regole per il sito" />
        <Compare v={molla(locale, legge, fps)} cx={655} cy={106}>
          <Legge cx={385} cy={112} s={0.5} />
          <Pillola x={680} y={106} testo="Legge contro la concorrenza sleale" corpo={24} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, online, fps)} cx={655} cy={150}>
          <Testo x={680} y={150} corpo={24} titolo peso={800} colore={TEAL_CHIARO}>
            Per chi vende merci, opere o servizi online
          </Testo>
        </Compare>
        {REGOLE.map((testo, i) => {
          const y = RIGA.alto + i * RIGA.passo;
          const cy = y + RIGA.h / 2;
          const tocco = tra(locale, t[i] + 12, t[i] + 20);
          return (
            <Compare key={testo} v={molla(locale, t[i], fps)} cx={RIGA.x + 40} cy={cy}>
              <rect x={RIGA.x} y={y} width={RIGA.w} height={RIGA.h} rx={22} fill={tocco > 0.5 ? TINTE.tinta : TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
              <circle cx={RIGA.x + 42} cy={cy} r={23} fill={TINTE.tratto} />
              <Spunta cx={RIGA.x + 42} cy={cy} r={23} p={tocco} colore={TINTE.tratto} />
              <Testo x={RIGA.x + 84} y={cy + 1} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
                {testo}
              </Testo>
            </Compare>
          );
        })}
      </Tela>
    );
  },
};

/* 3. «Primo: chi sei. Scrivi in modo chiaro il tuo nome e cognome, il tuo indirizzo postale e l'indirizzo e-mail. Un semplice modulo di contatto non basta. Il telefono è consigliato.» */
const CONTATTI = { x: 340, y: 92, w: 640, h: 300 };
const sitoChiSei: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.7, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "tocca", quando: fra(ctx, 0, 1, 0.5, 0.25) + 8, bersaglio: { x: 400, y: 186 } },
      { tipo: "festeggia", quando: fra(ctx, 1, 2, 0.7, 0.5) + 10 },
      { tipo: "scuoti", quando: fra(ctx, 2, 3, 0.55, 0.75) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const sito = fra(ctx, null, 0, 0.25, 0.08);
    const nome = fra(ctx, 0, 1, 0.45, 0.25);
    const indirizzo = fra(ctx, 1, 2, 0.3, 0.4);
    const email = fra(ctx, 1, 2, 0.7, 0.5);
    const modulo = fra(ctx, 2, 3, 0.15, 0.65);
    const no = fra(ctx, 2, 3, 0.55, 0.75);
    const telefono = fra(ctx, 3, null, 0.15, 0.88);
    const righe = [
      { t: nome, testo: "Giulia Rossi", icona: <Persona x={400} y={213} s={0.3} /> },
      { t: indirizzo, testo: "Via del Sole, Lugano", icona: <Casa x={400} y={293} s={0.42} /> },
      { t: email, testo: "info@giuliarossi.ch", icona: <Busta cx={400} cy={336} s={0.36} /> },
    ];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Chi sei" />
        <Compare v={molla(locale, sito, fps, true)} cx={660} cy={240}>
          <Browser x={CONTATTI.x} y={CONTATTI.y} w={CONTATTI.w} h={CONTATTI.h} indirizzo="Contatti" />
        </Compare>
        {righe.map((r, i) => (
          <Compare key={r.testo} v={molla(locale, r.t, fps)} cx={400} cy={186 + i * 70}>
            {r.icona}
            <Testo x={450} y={188 + i * 70} corpo={32} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {r.testo}
            </Testo>
            <Spunta cx={935} cy={186 + i * 70} r={20} p={tra(locale, r.t + 8, r.t + 20)} />
          </Compare>
        ))}
        {/* Un modulo di contatto da solo non basta. */}
        <Compare v={molla(locale, modulo, fps)} cx={470} cy={545}>
          <rect x={340} y={440} width={260} height={210} rx={16} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <rect x={362} y={462} width={216} height={30} rx={8} fill="none" stroke={TINTE.tinta} strokeWidth={4} />
          <rect x={362} y={504} width={216} height={80} rx={8} fill="none" stroke={TINTE.tinta} strokeWidth={4} />
          <rect x={478} y={600} width={100} height={34} rx={17} fill={TINTE.tinta} />
          <Testo x={528} y={618} corpo={18} titolo peso={800} colore={TINTE.tratto}>
            Invia
          </Testo>
        </Compare>
        <No cx={598} cy={444} r={26} p={tra(locale, no, no + 14)} />
        <Compare v={molla(locale, no + 6, fps)} cx={790} cy={480}>
          <Pillola x={790} y={480} testo="Solo un modulo: non basta" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <Compare v={molla(locale, telefono, fps)} cx={790} cy={590}>
          <Cornetta cx={628} cy={590} s={0.5} />
          <Pillola x={826} y={590} testo="Telefono: consigliato" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Se la tua ditta è iscritta nel registro di commercio, scrivi il nome esattamente come è iscritto, come nelle fatture e negli ordini. Ricordi la lezione sul nome della ditta? Contiene sempre il tuo cognome.» */
const NOME_DITTA = [
  { testo: "Caseificio di ", cognome: false },
  { testo: "Rossi", cognome: true },
  { testo: " G.", cognome: false },
] as const;
/** Il nome della ditta, centrato in (cx, cy); `evidenzia` da 0 a 1 colora il cognome. */
function NomeDitta({ cx, cy, corpo, evidenzia = 0 }: { cx: number; cy: number; corpo: number; evidenzia?: number }) {
  return (
    <text x={cx} y={cy} fontFamily={TITOLI} fontWeight={800} fontSize={corpo} textAnchor="middle" dominantBaseline="middle" letterSpacing="-0.02em" fill={TINTE.tratto} style={{ whiteSpace: "pre" }}>
      {NOME_DITTA.map((p) => (
        <tspan key={p.testo} fill={p.cognome && evidenzia > 0.5 ? TINTE.accento : TINTE.tratto}>
          {p.testo}
        </tspan>
      ))}
    </text>
  );
}
const sitoDitta: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.25),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.25, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.3, 0.85) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const registro = fra(ctx, null, 0, 0.3, 0.12);
    const iscritta = fra(ctx, null, 0, 0.7, 0.25);
    const sito = fra(ctx, 0, 1, 0.25, 0.4);
    const carte = fra(ctx, 0, 1, 0.7, 0.55);
    const lezione = fra(ctx, 1, 2, 0.3, 0.7);
    const cognome = fra(ctx, 2, null, 0.2, 0.85);
    const evidenzia = tra(locale, cognome, cognome + 10);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La ditta come è iscritta" />
        {/* Il registro di commercio, con il nome iscritto. */}
        <Compare v={molla(locale, registro, fps)} cx={655} cy={150}>
          <rect x={360} y={100} width={590} height={104} rx={18} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
          <Testo x={655} y={128} corpo={20} titolo peso={800} colore={TINTE.accento}>
            Registro di commercio
          </Testo>
          <NomeDitta cx={655} cy={170} corpo={36} evidenzia={evidenzia} />
        </Compare>
        <Compare v={molla(locale, iscritta, fps)} cx={905} cy={100}>
          <Pillola x={890} y={100} testo="Iscritta" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 655 214 V 262" p={tra(locale, sito - 10, sito)} />
        {/* Sul sito, uguale. */}
        <Compare v={molla(locale, sito, fps)} cx={655} cy={350}>
          <Browser x={410} y={272} w={490} h={160} indirizzo="Contatti">
            <NomeDitta cx={655} cy={372} corpo={32} evidenzia={evidenzia} />
          </Browser>
          <Spunta cx={905} cy={278} r={22} p={tra(locale, sito + 10, sito + 24)} />
        </Compare>
        {/* Come nelle fatture e negli ordini. */}
        {[
          { x: 400, etichetta: "Fattura" },
          { x: 700, etichetta: "Ordine" },
        ].map((c, i) => (
          <Compare key={c.etichetta} v={molla(locale, carte + i * 6, fps)} cx={c.x + 100} cy={530}>
            <Foglio x={c.x} y={462} w={200} h={136}>
              <Testo x={c.x + 86} y={494} corpo={20} titolo peso={800} colore={TINTE.accento}>
                {c.etichetta}
              </Testo>
              <line x1={c.x + 22} y1={530} x2={c.x + 150} y2={530} stroke={TINTE.tratto} strokeWidth={9} strokeLinecap="round" />
              <Righe x={c.x + 22} y={560} w={130} n={2} passo={22} />
            </Foglio>
          </Compare>
        ))}
        {/* Il cognome, come nella lezione sul nome della ditta. */}
        <Compare v={molla(locale, lezione, fps)} cx={655} cy={652}>
          <Pillola x={655} y={652} testo="Sempre il tuo cognome" corpo={26} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Secondo: i passi dell'ordine. Il cliente deve capire a che punto è, e quale clic invia l'ordine … il Portale PMI consiglia parole chiare, come «acquistare». «Ordinare» o «avanti», invece, non sono adatte.» */
const PASSI_ORDINE = ["Carrello", "Indirizzi", "Pagamento", "Conferma"];
const PASSO_X = (i: number) => 400 + i * 172;
const sitoPassi: Disegno = {
  chiave: (ctx) => fra(ctx, 2, 3, 0.75, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.1) + 6 },
      { tipo: "festeggia", quando: fra(ctx, 2, 3, 0.75, 0.6) + 6 },
      { tipo: "scuoti", quando: fra(ctx, 3, null, 0.5, 0.88) + 8 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const passi = fra(ctx, null, 0, 0.2, 0.05);
    const qui = fra(ctx, 0, 1, 0.1, 0.2);
    const fine = fra(ctx, 1, 2, 0.05, 0.4);
    const pulsante = fra(ctx, 1, 2, 0.3, 0.45);
    const clic = fra(ctx, 1, 2, 0.7, 0.5);
    const parola = fra(ctx, 2, 3, 0.75, 0.6);
    const nonAdatte = fra(ctx, 3, null, 0.08, 0.8);
    // Il segno «Sei qui» va dal primo all'ultimo passo.
    const corsa = tra(locale, qui, qui + 30) + tra(locale, fine - 8, fine + 18) * 2;
    const xQui = PASSO_X(0) + corsa * 172;
    const clicP = tra(locale, clic, clic + 12);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="I passi dell'ordine" />
        <Compare v={molla(locale, passi, fps, true)} cx={658} cy={170}>
          <line x1={PASSO_X(0)} y1={170} x2={PASSO_X(3)} y2={170} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
          <line x1={PASSO_X(0)} y1={170} x2={xQui} y2={170} stroke={TINTE.tratto} strokeWidth={10} strokeLinecap="round" />
          {PASSI_ORDINE.map((p, i) => {
            const fatto = xQui >= PASSO_X(i) - 2;
            return (
              <g key={p}>
                <circle cx={PASSO_X(i)} cy={170} r={26} fill={fatto ? TINTE.tratto : TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
                <Testo x={PASSO_X(i)} y={222} corpo={22} titolo peso={800} colore={TINTE.tratto}>
                  {p}
                </Testo>
              </g>
            );
          })}
        </Compare>
        <Compare v={molla(locale, qui, fps)} cx={xQui} cy={112}>
          <Pillola x={xQui} y={112} testo="Sei qui" corpo={20} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* Il pulsante che invia l'ordine. */}
        <Compare v={molla(locale, pulsante, fps)} cx={655} cy={350}>
          <rect x={495} y={312} width={320} height={80} rx={40} fill={clicP > 0.5 ? TINTE.ok : TINTE.tratto} />
          <Testo x={655} y={353} corpo={36} titolo peso={800} colore={TINTE.carta}>
            Acquistare
          </Testo>
        </Compare>
        {locale >= pulsante && locale < clic + 30 ? (
          <g opacity={1 - tra(locale, clic + 18, clic + 30)}>
            <Cursore x={760 - 40 * tra(locale, pulsante, clic)} y={420 - 50 * tra(locale, pulsante, clic)} clic={clicP} />
          </g>
        ) : null}
        <Spunta cx={860} cy={352} r={28} p={tra(locale, parola, parola + 14)} />
        <Compare v={molla(locale, parola + 4, fps)} cx={655} cy={442}>
          <Testo x={655} y={444} corpo={24} titolo peso={800} colore={TINTE.ok}>
            Parole chiare: invia l&apos;ordine
          </Testo>
        </Compare>
        {/* Le parole non adatte. */}
        {[
          { x: 520, testo: "Ordinare" },
          { x: 800, testo: "Avanti" },
        ].map((b, i) => (
          <g key={b.testo}>
            <Compare v={molla(locale, nonAdatte + i * 8, fps)} cx={b.x} cy={560}>
              <rect x={b.x - 115} y={526} width={230} height={68} rx={34} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={5} />
              <Testo x={b.x} y={562} corpo={30} titolo peso={800} colore={TINTE.rischio}>
                {b.testo}
              </Testo>
            </Compare>
            <No cx={b.x + 112} cy={530} r={22} p={tra(locale, nonAdatte + i * 8 + 10, nonAdatte + i * 8 + 24)} />
          </g>
        ))}
        <Compare v={molla(locale, nonAdatte + 20, fps)} cx={660} cy={640}>
          <Testo x={660} y={640} corpo={24} titolo peso={800} colore={TINTE.rischio}>
            Non sono adatte
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Terzo: gli errori. Prima di inviare l'ordine, il cliente deve poter controllare e correggere tutto: il prodotto, la quantità, il prezzo totale e gli indirizzi.» */
const VOCI_RIEPILOGO = ["Prodotto", "Quantità", "Prezzo totale", "Indirizzi"];
const RIEPILOGO = { x: 340, y: 96, w: 640, h: 470 };
const RIGA_VOCE = (i: number) => 240 + i * 66;
/** Quando Bleo nomina ogni voce (dopo il primo cambio): lì si accende «Modifica». */
function tempiVoci(ctx: ContestoDisegno): number[] {
  return [fra(ctx, 1, null, 0.04, 0.6), fra(ctx, 1, null, 0.24, 0.68), fra(ctx, 1, null, 0.46, 0.76), fra(ctx, 1, null, 0.72, 0.86)];
}
const sitoErrori: Disegno = {
  chiave: (ctx) => tempiVoci(ctx)[0],
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.75, 0.4) },
      ...tempiVoci(ctx).map((t, i) => ({ tipo: "tocca" as const, quando: t + 6, bersaglio: { x: 365, y: RIGA_VOCE(i) } })),
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const carta = fra(ctx, null, 0, 0.3, 0.08);
    const correggi = fra(ctx, 0, 1, 0.05, 0.25);
    const righe = [fra(ctx, 0, 1, 0.2, 0.3), fra(ctx, 0, 1, 0.32, 0.35), fra(ctx, 0, 1, 0.44, 0.4), fra(ctx, 0, 1, 0.56, 0.45)];
    const t = tempiVoci(ctx);
    const invia = fra(ctx, 1, null, 0.95, 0.95);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Correggere gli errori" />
        <Compare v={molla(locale, carta, fps, true)} cx={660} cy={330}>
          <Browser x={RIEPILOGO.x} y={RIEPILOGO.y} w={RIEPILOGO.w} h={RIEPILOGO.h} indirizzo="Riepilogo dell'ordine" />
        </Compare>
        <Compare v={molla(locale, correggi, fps)} cx={660} cy={182}>
          <Testo x={660} y={184} corpo={26} titolo peso={800} colore={TEAL_CHIARO}>
            Controlla e correggi prima di inviare
          </Testo>
        </Compare>
        {VOCI_RIEPILOGO.map((voce, i) => {
          const y = RIGA_VOCE(i);
          const acceso = tra(locale, t[i], t[i] + 10);
          return (
            <Compare key={voce} v={molla(locale, righe[i], fps)} cx={500} cy={y}>
              <Testo x={385} y={y + 1} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
                {voce}
              </Testo>
              <line x1={620} y1={y} x2={760} y2={y} stroke={TINTE.tinta} strokeWidth={12} strokeLinecap="round" />
              <rect x={812} y={y - 24} width={140} height={48} rx={24} fill={acceso > 0.5 ? TINTE.accento : TINTE.carta} stroke={TINTE.accento} strokeWidth={4} />
              <Matita x={830} y={y + 12} s={0.42} />
              <Testo x={897} y={y + 1} corpo={20} titolo peso={800} colore={acceso > 0.5 ? TINTE.carta : TINTE.accento}>
                Modifica
              </Testo>
            </Compare>
          );
        })}
        <Compare v={molla(locale, invia, fps)} cx={660} cy={524}>
          <rect x={540} y={498} width={240} height={52} rx={26} fill={TINTE.ok} />
          <Testo x={660} y={525} corpo={24} titolo peso={800} colore={TINTE.carta}>
            Poi invii
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Quarto: la conferma. Appena ricevi l'ordine, mandi subito una conferma elettronica, per esempio un'e-mail, con i dettagli principali dell'ordine.» */
const DETTAGLI = ["Prodotti", "Prezzo totale", "Consegna"];
const sitoConferma: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.75, 0.55),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.6, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const ordine = fra(ctx, null, 0, 0.3, 0.1);
    const parte = fra(ctx, 0, 1, 0.4, 0.35);
    const arriva = fra(ctx, 0, 1, 0.75, 0.55);
    const subito = fra(ctx, 0, 1, 0.6, 0.5);
    const t = [fra(ctx, 1, null, 0.3, 0.68), fra(ctx, 1, null, 0.5, 0.76), fra(ctx, 1, null, 0.7, 0.84)];
    const volo = tra(locale, parte, arriva);
    // La busta vola dal sito al telefono lungo un arco.
    const bx = 520 + (820 - 520) * volo;
    const by = 300 - Math.sin(Math.PI * volo) * 140 + (250 - 300) * volo;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Conferma subito" />
        <Compare v={molla(locale, ordine, fps)} cx={500} cy={320}>
          <Browser x={350} y={200} w={300} h={240} indirizzo="Negozio">
            <Tazza cx={460} cy={340} s={0.6} />
            <rect x={530} y={318} width={96} height={44} rx={22} fill={TINTE.ok} />
            <path d="M 560 340 l 10 10 l 22 -22" fill="none" stroke={TINTE.carta} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          </Browser>
          <Testo x={500} y={480} corpo={26} titolo peso={800} colore={TINTE.tratto}>
            Ordine ricevuto
          </Testo>
        </Compare>
        <Compare v={molla(locale, arriva - 4, fps)} cx={830} cy={380}>
          <Telefono cx={830} cy={380} w={210} h={350}>
            <Busta cx={830} cy={270} s={0.5} colore={TINTE.ok} />
            <Testo x={830} y={322} corpo={20} titolo peso={800} colore={TINTE.ok}>
              Conferma
            </Testo>
            {DETTAGLI.map((d, i) => (
              <Compare key={d} v={molla(locale, t[i], fps)} cx={830} cy={372 + i * 44}>
                <circle cx={756} cy={372 + i * 44} r={8} fill={TINTE.tratto} />
                <Testo x={772} y={373 + i * 44} corpo={20} titolo peso={800} colore={TINTE.tratto} ancora="start">
                  {d}
                </Testo>
              </Compare>
            ))}
          </Telefono>
        </Compare>
        {volo > 0 && volo < 1 ? <Busta cx={bx} cy={by} s={0.55} /> : null}
        <Compare v={molla(locale, subito, fps)} cx={660} cy={150}>
          <Pillola x={660} y={150} testo="Subito, per e-mail" corpo={26} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Attenzione: queste quattro regole non valgono per le vendite al telefono. E nemmeno per i contratti conclusi solo scambiando e-mail o messaggi simili.» */
const sitoEccezioni: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.75, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.75, 0.4) + 6 },
      { tipo: "scuoti", quando: fra(ctx, 0, null, 0.7, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const negozio = fra(ctx, null, 0, 0.12, 0.06);
    const telefono = fra(ctx, null, 0, 0.6, 0.3);
    const messaggi = fra(ctx, 0, null, 0.4, 0.7);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Quando non valgono" />
        {/* Il negozio online: le regole valgono. */}
        <Compare v={molla(locale, negozio, fps)} cx={490} cy={260}>
          <Browser x={350} y={130} w={280} h={200} indirizzo="Negozio">
            <Tazza cx={490} cy={260} s={0.55} />
          </Browser>
          <Spunta cx={630} cy={136} r={26} p={tra(locale, negozio + 8, negozio + 22)} />
          <Testo x={490} y={372} corpo={26} titolo peso={800} colore={TINTE.ok}>
            Negozio online: valgono
          </Testo>
        </Compare>
        {/* Al telefono: no. */}
        <Compare v={molla(locale, telefono, fps)} cx={830} cy={240}>
          <circle cx={830} cy={230} r={86} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
          <Cornetta cx={830} cy={230} s={0.95} />
          <Testo x={830} y={352} corpo={26} titolo peso={800} colore={TINTE.rischio}>
            Al telefono
          </Testo>
        </Compare>
        <No cx={905} cy={160} r={26} p={tra(locale, telefono + 10, telefono + 24)} />
        {/* Solo e-mail o messaggi: no. */}
        <Compare v={molla(locale, messaggi, fps)} cx={680} cy={540}>
          <rect x={345} y={440} width={630} height={200} rx={30} fill={TINTE.carta} stroke={TINTE.rischio} strokeWidth={4} strokeDasharray="14 12" />
          <Busta cx={430} cy={530} s={0.72} />
          <Messaggi cx={600} cy={520} />
          <Testo x={840} y={518} corpo={28} titolo peso={800} colore={TINTE.rischio}>
            Solo e-mail
          </Testo>
          <Testo x={840} y={558} corpo={28} titolo peso={800} colore={TINTE.rischio}>
            o messaggi
          </Testo>
        </Compare>
        <No cx={965} cy={446} r={26} p={tra(locale, messaggi + 10, messaggi + 24)} />
      </Tela>
    );
  },
};

/* 9. «Poi i prezzi. Se vendi merci ai privati, mostri il prezzo finale in franchi, accanto al prodotto. Dentro ci sono tutti i supplementi obbligatori, anche l'IVA se sei iscritto. Le spese di spedizione puoi indicarle a parte, ma ben visibili.» */
const sitoPrezzi: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.5, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.5, 0.45) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.6, 0.9) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const prodotto = fra(ctx, null, 1, 0.3, 0.15);
    const prezzo = fra(ctx, 1, 2, 0.3, 0.4);
    const accanto = fra(ctx, 1, 2, 0.75, 0.48);
    const supplementi = fra(ctx, 2, 3, 0.2, 0.6);
    const iva = fra(ctx, 2, 3, 0.6, 0.7);
    const spedizione = fra(ctx, 3, null, 0.2, 0.82);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Prezzi chiari" />
        <Compare v={molla(locale, prodotto, fps, true)} cx={490} cy={300}>
          <Browser x={340} y={96} w={310} h={360} indirizzo="Negozio">
            <Tazza cx={495} cy={250} s={0.95} />
            <line x1={380} y1={350} x2={540} y2={350} stroke={TINTE.tratto} strokeWidth={10} strokeLinecap="round" />
          </Browser>
        </Compare>
        <Compare v={molla(locale, prezzo, fps)} cx={540} cy={405}>
          <Cartellino cx={540} cy={405} s={0.85} />
        </Compare>
        <Compare v={molla(locale, accanto, fps)} cx={820} cy={175}>
          <Pillola x={820} y={175} testo="Prezzo finale" corpo={28} fondo={TINTE.tratto} colore={TINTE.carta} />
          <Testo x={820} y={230} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            in franchi, accanto al prodotto
          </Testo>
        </Compare>
        <Freccia d="M 760 254 Q 720 330 650 372" p={tra(locale, accanto + 4, accanto + 16)} spessore={6} />
        <Compare v={molla(locale, supplementi, fps)} cx={820} cy={330}>
          <Pillola x={820} y={330} testo="+ supplementi obbligatori" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, iva, fps)} cx={820} cy={398}>
          <Pillola x={820} y={398} testo="+ IVA, se sei iscritto" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Freccia d="M 690 400 Q 668 410 650 412" p={tra(locale, iva + 6, iva + 16)} spessore={6} colore={TINTE.accento} />
        {/* Spedizione a parte. */}
        <Compare v={molla(locale, spedizione, fps)} cx={700} cy={575}>
          <Pacco cx={420} cy={575} s={0.72} />
          <Pillola x={700} y={575} testo="Spedizione: a parte, ben visibile" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Se sul sito raccogli dati dei clienti, come nome e indirizzo, devi informarli: chi sei, a cosa ti servono i dati e a chi li passi. Per questo, il Portale PMI consiglia una dichiarazione sulla protezione dei dati.» */
const INFORMAZIONI = ["Chi sei", "A cosa servono", "A chi li passi"];
const sitoDati: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.25) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.6, 0.85) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const modulo = fra(ctx, null, 0, 0.2, 0.08);
    const campi = [fra(ctx, null, 0, 0.55, 0.2), fra(ctx, null, 0, 0.8, 0.3)];
    const t = [fra(ctx, 0, 1, 0.3, 0.45), fra(ctx, 0, 1, 0.55, 0.55), fra(ctx, 0, 1, 0.8, 0.62)];
    const dichiarazione = fra(ctx, 1, null, 0.5, 0.82);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="I dati dei clienti" />
        {/* Il modulo con i dati del cliente. */}
        <Compare v={molla(locale, modulo, fps)} cx={465} cy={280}>
          <Browser x={340} y={110} w={250} h={300} indirizzo="Ordine" />
        </Compare>
        {["Nome", "Indirizzo"].map((c, i) => (
          <Compare key={c} v={molla(locale, campi[i], fps)} cx={465} cy={210 + i * 100}>
            <Testo x={362} y={196 + i * 100} corpo={22} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {c}
            </Testo>
            <rect x={362} y={214 + i * 100} width={206} height={40} rx={10} fill={TINTE.carta} stroke={TINTE.tinta} strokeWidth={4} />
            <line x1={378} y1={234 + i * 100} x2={378 + 120 * tra(locale, campi[i] + 4, campi[i] + 20)} y2={234 + i * 100} stroke={TINTE.tratto} strokeWidth={8} strokeLinecap="round" />
          </Compare>
        ))}
        <Freccia d="M 602 260 H 652" p={tra(locale, t[0] - 10, t[0])} />
        {/* Cosa devi dire. */}
        <Compare v={molla(locale, t[0] - 4, fps, true)} cx={810} cy={270}>
          <Foglio x={668} y={110} w={300} h={300}>
            <Testo x={800} y={150} corpo={22} titolo peso={800} colore={TINTE.accento}>
              Devi informare
            </Testo>
          </Foglio>
        </Compare>
        {INFORMAZIONI.map((testo, i) => (
          <Compare key={testo} v={molla(locale, t[i], fps)} cx={800} cy={210 + i * 64}>
            <Spunta cx={708} cy={210 + i * 64} r={18} p={tra(locale, t[i] + 4, t[i] + 16)} />
            <Testo x={736} y={211 + i * 64} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {testo}
            </Testo>
          </Compare>
        ))}
        {/* La dichiarazione sulla protezione dei dati. */}
        <Compare v={molla(locale, dichiarazione, fps)} cx={660} cy={545}>
          <Scudo x={402} y={555} s={0.85} />
          <Pillola x={700} y={510} testo="Dichiarazione sulla" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
          <Pillola x={700} y={578} testo="protezione dei dati" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 11. «E i resi? In Svizzera la legge non prevede il diritto di restituire un acquisto online. Puoi offrirlo tu: allora scrivi le condizioni in modo chiaro. Se vendi anche nell'Unione europea, le regole sono più severe.» */
const sitoResi: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.6, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.6, 0.1) },
      { tipo: "festeggia", quando: fra(ctx, 1, 2, 0.6, 0.6) + 6 },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.65, 0.88) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const pacco = fra(ctx, null, 0, 0.3, 0.06);
    const legge = fra(ctx, 0, 1, 0.55, 0.35);
    const condizioni = fra(ctx, 1, 2, 0.3, 0.55);
    const chiare = fra(ctx, 1, 2, 0.6, 0.62);
    const ue = fra(ctx, 2, null, 0.35, 0.82);
    const severe = fra(ctx, 2, null, 0.65, 0.88);
    const ritorno = tra(locale, pacco + 6, pacco + 26);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="I resi" />
        <Compare v={molla(locale, pacco, fps)} cx={480} cy={240}>
          <Pacco cx={450} cy={250} s={1.05} />
          <Freccia d="M 530 300 Q 620 270 600 200 Q 580 140 500 150" p={ritorno} colore={TEAL_CHIARO} spessore={9} />
        </Compare>
        <Compare v={molla(locale, legge, fps)} cx={470} cy={410}>
          <Testo x={470} y={396} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            In Svizzera, per legge:
          </Testo>
          <Pillola x={470} y={442} testo="non è un obbligo" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {/* Se li offri: condizioni chiare. */}
        <Compare v={molla(locale, condizioni, fps)} cx={830} cy={240}>
          <Foglio x={730} y={100} w={200} h={230}>
            <Testo x={816} y={138} corpo={22} titolo peso={800} colore={TINTE.accento}>
              Condizioni
            </Testo>
            <Righe x={756} y={184} w={140} n={5} passo={28} />
          </Foglio>
          <Spunta cx={930} cy={310} r={26} p={tra(locale, chiare, chiare + 14)} />
        </Compare>
        <Compare v={molla(locale, chiare, fps)} cx={815} cy={378}>
          <Pillola x={815} y={378} testo="Se li offri: condizioni chiare" corpo={20} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Nell'Unione europea, regole più severe. */}
        <Compare v={molla(locale, ue, fps)} cx={430} cy={575}>
          <StelleUe cx={430} cy={575} r={56} />
        </Compare>
        <Compare v={molla(locale, severe, fps)} cx={690} cy={575}>
          <Testo x={690} y={556} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Unione europea:
          </Testo>
          <Pillola x={690} y={600} testo="regole più severe" corpo={26} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_SITO_ONLINE: Record<string, Disegno> = {
  "sito-quattro": sitoQuattro,
  "sito-chi-sei": sitoChiSei,
  "sito-ditta": sitoDitta,
  "sito-passi": sitoPassi,
  "sito-errori": sitoErrori,
  "sito-conferma": sitoConferma,
  "sito-eccezioni": sitoEccezioni,
  "sito-prezzi": sitoPrezzi,
  "sito-dati": sitoDati,
  "sito-resi": sitoResi,
};
