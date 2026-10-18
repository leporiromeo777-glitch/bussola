/**
 * I disegni della lezione 9 («A chi chiedere aiuto»), vedi
 * src/lezioni/aiuto.ts. Fonti: pagine di Fondounimpresa (IFC) e del Portale
 * impresa ticinese, LFid (artt. 1-3) e albo online dei fiduciari, legge di
 * applicazione della LAVS (agenzie comunali), Portale PMI ed EasyGov, pagina
 * dell'Ufficio dell'economia e del turismo dei Grigioni. Coordinate della tela
 * 1000×700; l'angolo in basso a sinistra (x < 300, y > 480) è della finestra
 * di Bleo. Niente cifre, solo concetti.
 */
import {
  Casa,
  Compare,
  Foglio,
  Freccia,
  Fumetto,
  Lampadina,
  molla,
  Moneta,
  Negozio,
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
  Valigetta,
} from "../figure";
import { Tela } from "./ditta-individuale";
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

/** Un orologio senza numeri: le tacche e le lancette (la lunga gira con `giro`, da 0 a 1). */
function Orologio({ cx, cy, r, giro }: { cx: number; cy: number; r: number; giro: number }) {
  const lunga = -90 + giro * 360;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={8} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const dentro = i % 3 === 0 ? r * 0.72 : r * 0.8;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * dentro}
            y1={cy + Math.sin(a) * dentro}
            x2={cx + Math.cos(a) * r * 0.9}
            y2={cy + Math.sin(a) * r * 0.9}
            stroke={i % 3 === 0 ? TINTE.tratto : TINTE.tinta}
            strokeWidth={i % 3 === 0 ? 7 : 5}
            strokeLinecap="round"
          />
        );
      })}
      <line x1={cx} y1={cy} x2={cx + r * 0.42} y2={cy - r * 0.2} stroke={TINTE.tratto} strokeWidth={9} strokeLinecap="round" />
      <line
        x1={cx}
        y1={cy}
        x2={cx + Math.cos((lunga * Math.PI) / 180) * r * 0.66}
        y2={cy + Math.sin((lunga * Math.PI) / 180) * r * 0.66}
        stroke={TINTE.accento}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={9} fill={TINTE.accento} />
    </g>
  );
}

/** Un calendario da muro, senza numeri. */
function Calendario({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 74} y={cy - 70} width={148} height={142} rx={16} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={cx - 74} y={cy - 70} width={148} height={38} rx={16} fill={TINTE.accento} />
      <rect x={cx - 44} y={cy - 84} width={12} height={28} rx={6} fill={TINTE.tratto} />
      <rect x={cx + 32} y={cy - 84} width={12} height={28} rx={6} fill={TINTE.tratto} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}-${c}`} x={cx - 56 + c * 30} y={cy - 18 + r * 28} width={22} height={18} rx={5} fill={TINTE.tinta} />
        )),
      )}
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

/** Un documento d'identità (o un permesso), in formato carta: foto e righe. */
function Documento({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  const w = 160;
  const h = 102;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-6)`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-w / 2 + 14} y={-h / 2 + 16} width={44} height={56} rx={8} fill={TINTE.tinta} />
      <circle cx={-w / 2 + 36} cy={-h / 2 + 36} r={10} fill={TINTE.tratto} opacity={0.6} />
      <path d={`M ${-w / 2 + 20} ${-h / 2 + 70} q 16 -22 32 0 Z`} fill={TINTE.tratto} opacity={0.6} />
      <line x1={-4} y1={-20} x2={58} y2={-20} stroke={TINTE.tinta} strokeWidth={8} strokeLinecap="round" />
      <line x1={-4} y1={2} x2={44} y2={2} stroke={TINTE.tinta} strokeWidth={8} strokeLinecap="round" />
      <line x1={-4} y1={24} x2={52} y2={24} stroke={TINTE.tinta} strokeWidth={8} strokeLinecap="round" />
    </g>
  );
}

/** Una finestra del browser (angolo in alto a sinistra in x, y) con il nome del sito nella barra. */
function Finestra({ x, y, w, h, nome, colore = TINTE.tratto }: { x: number; y: number; w: number; h: number; nome: string; colore?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={TINTE.carta} stroke={colore} strokeWidth={6} />
      <path d={`M ${x + 3} ${y + 52} V ${y + 18} q 0 -15 15 -15 H ${x + w - 18} q 15 0 15 15 V ${y + 52} Z`} fill={colore} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 24 + i * 18} cy={y + 27} r={5} fill={TINTE.carta} opacity={0.7} />
      ))}
      <Testo x={x + w / 2 + 26} y={y + 28} corpo={26} titolo peso={800} colore={TINTE.carta}>
        {nome}
      </Testo>
    </g>
  );
}

/** Una lente d'ingrandimento: cercare. */
function Lente({ cx, cy, r = 26 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <line x1={cx + r * 0.7} y1={cy + r * 0.7} x2={cx + r * 1.65} y2={cy + r * 1.65} stroke={TINTE.accento} strokeWidth={r * 0.4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill={TINTE.crema} fillOpacity={0.6} stroke={TINTE.accento} strokeWidth={r * 0.28} />
    </g>
  );
}

/** Uno scontrino con il bordo a zigzag in basso. */
function Ricevuta({ cx, cy, colore = TINTE.tratto }: { cx: number; cy: number; colore?: string }) {
  const w = 56;
  const h = 70;
  const denti = 4;
  const passo = w / denti;
  // Il bordo in basso, da destra a sinistra: un dente giù e uno su per ogni passo.
  const zig = Array.from({ length: denti }, () => `l ${-passo / 2} 8 l ${-passo / 2} -8`).join(" ");
  return (
    <g>
      <path
        d={`M ${cx - w / 2} ${cy - h / 2} H ${cx + w / 2} V ${cy + h / 2} ${zig} Z`}
        fill={TINTE.carta}
        stroke={colore}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <line x1={cx - 16} y1={cy - 18} x2={cx + 16} y2={cy - 18} stroke={colore} strokeWidth={6} strokeLinecap="round" />
      <line x1={cx - 16} y1={cy} x2={cx + 8} y2={cy} stroke={TINTE.tinta} strokeWidth={6} strokeLinecap="round" />
      <line x1={cx - 16} y1={cy + 16} x2={cx + 12} y2={cy + 16} stroke={TINTE.tinta} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
}

/** Una cartella dei documenti, con un foglio che spunta. */
function Cartella({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 62} y={cy - 70} width={110} height={80} rx={8} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} transform={`rotate(-6 ${cx} ${cy})`} />
      <path d={`M ${cx - 80} ${cy - 40} q 0 -10 10 -10 h 40 l 12 14 h 88 q 10 0 10 10 v 76 q 0 10 -10 10 h -140 q -10 0 -10 -10 Z`} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
}

/* 2. «In Ticino c'è Fondounimpresa, un servizio pubblico e gratuito. Ti affianca un consulente personale, che ti aiuta a valutare e a realizzare il tuo progetto.» */
const aiuFondo: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.7, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.75, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const palazzo = fra(ctx, null, 0, 0.12, 0.06);
    const pubblico = fra(ctx, null, 0, 0.55, 0.22);
    const gratuito = fra(ctx, null, 0, 0.78, 0.3);
    const consulente = fra(ctx, 0, 1, 0.3, 0.45);
    const idea = fra(ctx, 1, null, 0.2, 0.65);
    const progetto = fra(ctx, 1, null, 0.62, 0.85);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Fondounimpresa" />
        <Compare v={molla(locale, palazzo, fps)} cx={470} cy={250}>
          <Palazzo x={470} y={330} s={0.85} nome="TI" />
        </Compare>
        <Compare v={molla(locale, pubblico, fps)} cx={790} cy={190}>
          <Pillola x={790} y={190} testo="Servizio pubblico" corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, gratuito, fps)} cx={790} cy={285}>
          <Pillola x={808} y={285} testo="Gratuito" corpo={30} fondo={TINTE.ok} colore={TINTE.carta} />
          <Spunta cx={700} cy={285} r={26} p={tra(locale, gratuito + 6, gratuito + 18)} />
        </Compare>
        {/* Tu e il consulente personale. */}
        <Compare v={molla(locale, consulente - 6, fps)} cx={420} cy={540}>
          <Persona x={420} y={600} s={0.72} colore={TEAL_CHIARO} />
        </Compare>
        <Compare v={molla(locale, consulente, fps)} cx={565} cy={540}>
          <Persona x={565} y={600} s={0.72} />
          <Valigetta x={612} y={604} s={0.55} />
        </Compare>
        <Compare v={molla(locale, consulente + 8, fps)} cx={495} cy={645}>
          <Pillola x={495} y={645} testo="Consulente personale" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, idea, fps)} cx={470} cy={420}>
          <Fumetto cx={470} cy={410} r={38}>
            <Lampadina cx={470} cy={406} s={0.85} />
          </Fumetto>
        </Compare>
        {/* Il progetto che diventa realtà. */}
        <Freccia d="M 650 540 Q 710 500 770 540" p={tra(locale, progetto - 10, progetto + 2)} />
        <Compare v={molla(locale, progetto, fps)} cx={860} cy={560}>
          <Negozio x={860} y={610} s={0.55} />
          <Pillola x={860} y={652} testo="Il tuo progetto" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Lo possono chiedere i cittadini svizzeri e gli stranieri con il permesso B o C. Ma devono vivere in Ticino, oppure nella Regione Moesa, nei Grigioni.» */

/** Un permesso per stranieri, in formato carta: foto, righe e la lettera del permesso. */
function Permesso({ cx, cy, lettera, s = 1 }: { cx: number; cy: number; lettera: string; s?: number }) {
  const w = 170;
  const h = 108;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d={`M ${-w / 2} ${-h / 2 + 14} q 0 -14 14 -14 H ${w / 2 - 14} q 14 0 14 14 V ${-h / 2 + 24} H ${-w / 2} Z`} fill={TINTE.tratto} />
      <rect x={-w / 2 + 16} y={-h / 2 + 36} width={40} height={52} rx={8} fill={TINTE.tinta} />
      <line x1={-12} y1={-10} x2={18} y2={-10} stroke={TINTE.tinta} strokeWidth={8} strokeLinecap="round" />
      <line x1={-12} y1={12} x2={8} y2={12} stroke={TINTE.tinta} strokeWidth={8} strokeLinecap="round" />
      <circle cx={w / 2 - 36} cy={10} r={28} fill={TINTE.tratto} />
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
    </g>
  );
}

const aiuChi: Disegno = {
  chiave: (ctx) => fra(ctx, 0, null, 0.55, 0.75),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.75, 0.35) },
      { tipo: "festeggia", quando: fra(ctx, 0, null, 0.7, 0.85) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const carte = [fra(ctx, null, 0, 0.3, 0.15), fra(ctx, null, 0, 0.72, 0.3), fra(ctx, null, 0, 0.82, 0.38)];
    const ticino = fra(ctx, 0, null, 0.18, 0.6);
    const moesa = fra(ctx, 0, null, 0.5, 0.75);
    const grigioni = fra(ctx, 0, null, 0.8, 0.85);
    const voci = [
      { x: 420, testo: "Svizzeri", figura: <Passaporto cx={420} cy={200} s={0.95} /> },
      { x: 640, testo: "Permesso B", figura: <Permesso cx={640} cy={200} lettera="B" s={0.85} /> },
      { x: 860, testo: "Permesso C", figura: <Permesso cx={860} cy={200} lettera="C" s={0.85} /> },
    ];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Per chi è" />
        {voci.map((v, i) => (
          <Compare key={v.testo} v={molla(locale, carte[i], fps)} cx={v.x} cy={220}>
            {v.figura}
            <Testo x={v.x} y={302} corpo={28} titolo peso={800} colore={TINTE.tratto}>
              {v.testo}
            </Testo>
          </Compare>
        ))}
        <line x1={340} y1={360} x2={960} y2={360} stroke={TINTE.tinta} strokeWidth={5} strokeLinecap="round" strokeDasharray="2 14" opacity={tra(locale, ticino - 10, ticino)} />
        <Compare v={molla(locale, ticino, fps)} cx={470} cy={500}>
          <Casa x={470} y={540} s={1.05} />
          <Pillola x={470} y={585} testo="Ticino" corpo={28} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, ticino + 8, fps)} cx={630} cy={500}>
          <Testo x={635} y={500} corpo={28} titolo peso={800} colore={TINTE.accento}>
            oppure
          </Testo>
        </Compare>
        <Compare v={molla(locale, moesa, fps)} cx={800} cy={500}>
          <Casa x={800} y={540} s={1.05} colore={TINTE.accento} />
          <Pillola x={800} y={585} testo="Regione Moesa" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, grigioni, fps)} cx={800} cy={642}>
          <Testo x={800} y={642} corpo={26} titolo peso={800} colore={TINTE.accento}>
            nei Grigioni
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Puoi avere fino a … ore con il consulente. L'accompagnamento dura al massimo … anni. Per iscriverti compili il formulario online, e alleghi una copia del documento d'identità o del permesso.» */
const aiuOre: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.15) },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.7, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const ore = fra(ctx, null, 0, 0.15, 0.06);
    const anni = fra(ctx, 0, 1, 0.3, 0.35);
    const modulo = fra(ctx, 1, 2, 0.15, 0.6);
    const documento = fra(ctx, 2, null, 0.3, 0.8);
    const dentro = fra(ctx, 2, null, 0.75, 0.92);
    // La lancetta lunga gira finché parla della durata, poi si ferma.
    const giro = tra(locale, ore, anni + 30) * 2.5;
    // Il documento vola verso il computer.
    const volo = tra(locale, dentro - 4, dentro + 12);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Tempo e iscrizione" />
        <Compare v={molla(locale, ore, fps)} cx={480} cy={210}>
          <Orologio cx={480} cy={205} r={88} giro={giro} />
          <Pillola x={480} y={330} testo="Ore con il consulente" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, anni, fps)} cx={800} cy={210}>
          <Calendario cx={800} cy={210} />
          <Pillola x={800} y={330} testo="Durata massima" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, modulo, fps)} cx={530} cy={520}>
          <Computer cx={530} cy={520} />
          <Pillola x={530} y={640} testo="Formulario online" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 760 520 Q 715 480 670 505" p={tra(locale, dentro - 10, dentro + 2)} />
        <Compare v={molla(locale, documento, fps)} cx={840} cy={520}>
          <g transform={`translate(${-volo * 40} ${-volo * 10})`}>
            <Documento cx={845} cy={515} s={0.9} />
          </g>
          <Pillola x={840} y={640} testo="Copia del documento" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Con il consulente lavori sullo studio di fattibilità, sulla strategia e sul business plan. Ma Fondounimpresa non tiene la tua contabilità, e non compila la tua dichiarazione d'imposta.» */
const COLONNE = { si: { x: 320, w: 310 }, no: { x: 660, w: 320 }, y: 130, h: 440 };
const aiuCosa: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.5, 0.65),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.75, 0.5) },
      { tipo: "scuoti", quando: fra(ctx, 1, 2, 0.6, 0.65) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const si = [fra(ctx, null, 0, 0.55, 0.2), fra(ctx, 0, 1, 0.3, 0.38), fra(ctx, 0, 1, 0.75, 0.48)];
    const pannelloNo = fra(ctx, 1, 2, 0.05, 0.55);
    const no = [fra(ctx, 1, 2, 0.5, 0.65), fra(ctx, 2, null, 0.45, 0.85)];
    const righeSi = ["Fattibilità", "Strategia", "Business plan"];
    const yRiga = (i: number) => COLONNE.y + 130 + i * 100;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cosa fa e cosa no" />
        <Compare v={molla(locale, si[0] - 6, fps)} cx={COLONNE.si.x + COLONNE.si.w / 2} cy={COLONNE.y + COLONNE.h / 2}>
          <rect x={COLONNE.si.x} y={COLONNE.y} width={COLONNE.si.w} height={COLONNE.h} rx={24} fill={TINTE.carta} stroke={TINTE.ok} strokeWidth={6} />
          <Testo x={COLONNE.si.x + COLONNE.si.w / 2} y={COLONNE.y + 50} corpo={34} titolo peso={800} colore={TINTE.ok}>
            Sì
          </Testo>
        </Compare>
        {righeSi.map((testo, i) => (
          <Compare key={testo} v={molla(locale, si[i], fps)} cx={COLONNE.si.x + 60} cy={yRiga(i)}>
            <Spunta cx={COLONNE.si.x + 42} cy={yRiga(i)} r={22} p={tra(locale, si[i] + 4, si[i] + 16)} />
            <Testo x={COLONNE.si.x + 76} y={yRiga(i)} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {testo}
            </Testo>
          </Compare>
        ))}
        <Compare v={molla(locale, pannelloNo, fps)} cx={COLONNE.no.x + COLONNE.no.w / 2} cy={COLONNE.y + COLONNE.h / 2}>
          <rect x={COLONNE.no.x} y={COLONNE.y} width={COLONNE.no.w} height={COLONNE.h} rx={24} fill={TINTE.carta} stroke={TINTE.rischio} strokeWidth={6} />
          <Testo x={COLONNE.no.x + COLONNE.no.w / 2} y={COLONNE.y + 50} corpo={34} titolo peso={800} colore={TINTE.rischio}>
            No
          </Testo>
        </Compare>
        <Compare v={molla(locale, no[0], fps)} cx={COLONNE.no.x + 60} cy={yRiga(0)}>
          <No cx={COLONNE.no.x + 42} cy={yRiga(0)} r={22} p={tra(locale, no[0] + 4, no[0] + 16)} />
          <Testo x={COLONNE.no.x + 76} y={yRiga(0)} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Contabilità
          </Testo>
        </Compare>
        <Compare v={molla(locale, no[1], fps)} cx={COLONNE.no.x + 60} cy={yRiga(1) + 18}>
          <No cx={COLONNE.no.x + 42} cy={yRiga(1) + 18} r={22} p={tra(locale, no[1] + 4, no[1] + 16)} />
          <Testo x={COLONNE.no.x + 76} y={yRiga(1)} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Dichiarazione
          </Testo>
          <Testo x={COLONNE.no.x + 76} y={yRiga(1) + 36} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            d'imposta
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Hai già aperto la tua attività? Per le domande puntuali c'è l'accompagnamento breve. E poi ci sono i corsi, per esempio su business plan, contabilità e marketing: quelli però si pagano.» */
const aiuCorsi: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.4) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.7, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const negozio = fra(ctx, null, 0, 0.15, 0.05);
    const domanda = fra(ctx, null, 0, 0.6, 0.12);
    const breve = fra(ctx, 0, 1, 0.4, 0.4);
    const corsi = fra(ctx, 1, 2, 0.15, 0.6);
    const temi = [fra(ctx, 1, 2, 0.75, 0.7), fra(ctx, 2, null, 0.1, 0.75), fra(ctx, 2, null, 0.3, 0.8)];
    const pagano = fra(ctx, 2, null, 0.7, 0.9);
    const idea = tra(locale, breve, breve + 8);
    const TEMI = ["Business plan", "Contabilità", "Marketing"];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Breve, e i corsi" />
        <Compare v={molla(locale, negozio, fps)} cx={450} cy={300}>
          <Negozio x={450} y={360} s={0.78} />
        </Compare>
        <Compare v={molla(locale, domanda, fps)} cx={570} cy={160}>
          <Fumetto cx={575} cy={150} r={42}>
            <g opacity={1 - idea}>
              <Testo x={575} y={152} corpo={48} titolo peso={800} colore={TINTE.rischio}>
                ?
              </Testo>
            </g>
            <g opacity={idea}>
              <Lampadina cx={575} cy={146} s={0.9} />
            </g>
          </Fumetto>
        </Compare>
        <Compare v={molla(locale, breve, fps)} cx={470} cy={430}>
          <Pillola x={470} y={430} testo="Accompagnamento breve" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
          <Testo x={470} y={482} corpo={24} peso={700} colore={TINTE.tratto}>
            per le domande puntuali
          </Testo>
        </Compare>
        {/* La lavagnetta dei corsi. */}
        <Compare v={molla(locale, corsi, fps)} cx={820} cy={240}>
          <rect x={680} y={120} width={280} height={250} rx={20} fill={TINTE.carta} stroke={TINTE.accento} strokeWidth={6} />
          <path d="M 683 172 V 140 q 0 -17 17 -17 H 940 q 17 0 17 17 V 172 Z" fill={TINTE.accento} />
          <Testo x={820} y={148} corpo={28} titolo peso={800} colore={TINTE.carta}>
            Corsi
          </Testo>
        </Compare>
        {TEMI.map((tema, i) => (
          <Compare key={tema} v={molla(locale, temi[i], fps)} cx={720} cy={215 + i * 54}>
            <circle cx={712} cy={215 + i * 54} r={8} fill={TINTE.accento} />
            <Testo x={732} y={215 + i * 54} corpo={26} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {tema}
            </Testo>
          </Compare>
        ))}
        <Compare v={molla(locale, pagano, fps)} cx={820} cy={440}>
          <Moneta cx={740} cy={440} r={30} />
          <Testo x={786} y={442} corpo={30} titolo peso={800} colore={TINTE.accento} ancora="start">
            Si pagano
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 7. «Per il tuo caso personale, come le tue imposte o la tua contabilità, la persona giusta è un fiduciario commercialista. In Ticino, chi fa questo lavoro per altri deve essere autorizzato dal Cantone.» */
const aiuFiduciario: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.4, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.45, 0.5) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.85, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const imposte = fra(ctx, null, 0, 0.45, 0.15);
    const contabilita = fra(ctx, null, 0, 0.75, 0.25);
    const fiduciario = fra(ctx, 0, 1, 0.4, 0.5);
    const cantone = fra(ctx, 1, null, 0.35, 0.75);
    const timbro = fra(ctx, 1, null, 0.75, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il fiduciario" />
        <Compare v={molla(locale, imposte, fps)} cx={390} cy={200}>
          <Foglio x={330} y={110} w={120} h={160}>
            <Righe x={346} y={160} w={78} n={3} passo={24} />
          </Foglio>
          <Pillola x={390} y={305} testo="Imposte" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, contabilita, fps)} cx={570} cy={220}>
          <Registro x={570} y={270} s={0.95} />
          <Pillola x={570} y={305} testo="Contabilità" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 660 200 Q 700 180 730 210" p={tra(locale, fiduciario - 10, fiduciario + 2)} />
        <Compare v={molla(locale, fiduciario, fps)} cx={810} cy={260}>
          <Persona x={810} y={345} s={0.9} />
          <Valigetta x={872} y={348} s={0.62} />
          <Pillola x={800} y={392} testo="Fiduciario commercialista" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, cantone, fps)} cx={500} cy={560}>
          <Palazzo x={500} y={610} s={0.62} nome="TI" />
          <Pillola x={500} y={648} testo="Cantone" corpo={24} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 580 560 Q 650 520 720 545" p={tra(locale, timbro - 12, timbro)} />
        <Compare v={molla(locale, timbro, fps)} cx={810} cy={540}>
          <Timbro cx={810} cy={530} r={52} />
          <Pillola x={810} y={630} testo="Autorizzato" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Per sapere se è autorizzato, cercalo nell'albo online del Cantone. E Bleo ha uno strumento, «I tuoi conti»: tieni in ordine entrate, uscite e fatture, e a fine anno scarichi tutto per il fiduciario.» */
const RIGHE_ALBO = [180, 240, 300, 360];
const aiuAlbo: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.75, 0.3),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.8, 0.3) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.8, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const albo = fra(ctx, null, 0, 0.12, 0.05);
    const cerca = fra(ctx, null, 0, 0.3, 0.12);
    const trovato = fra(ctx, null, 0, 0.75, 0.3);
    const conti = fra(ctx, 0, 1, 0.2, 0.45);
    const ricevute = [fra(ctx, 0, 1, 0.75, 0.55), fra(ctx, 1, null, 0.08, 0.62), fra(ctx, 1, null, 0.25, 0.7)];
    const cartella = fra(ctx, 1, null, 0.62, 0.85);
    // La lente scende lungo l'albo fino al fiduciario che cerchi (la terza riga).
    const corsa = tra(locale, cerca, trovato);
    const lente = { x: 420 + corsa * 120, y: RIGHE_ALBO[0] + corsa * (RIGHE_ALBO[2] - RIGHE_ALBO[0]) };
    const evidenzia = tra(locale, trovato, trovato + 6);
    const VOCI = ["Entrate", "Uscite", "Fatture"];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Albo e conti" />
        <Compare v={molla(locale, albo, fps)} cx={485} cy={260}>
          <Finestra x={330} y={100} w={310} h={310} nome="Albo online" />
          {RIGHE_ALBO.map((y, i) => (
            <g key={y}>
              <rect x={348} y={y - 22} width={274} height={44} rx={12} fill={i === 2 && evidenzia > 0.5 ? TINTE.tinta : TINTE.carta} />
              <circle cx={372} cy={y} r={14} fill={i === 2 ? TINTE.tratto : TINTE.tinta} />
              <line x1={398} y1={y - 6} x2={398 + (i % 2 ? 120 : 150)} y2={y - 6} stroke={TINTE.tinta} strokeWidth={9} strokeLinecap="round" />
              <line x1={398} y1={y + 10} x2={470} y2={y + 10} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
            </g>
          ))}
          <Spunta cx={598} cy={RIGHE_ALBO[2]} r={18} p={tra(locale, trovato + 2, trovato + 14)} />
        </Compare>
        {corsa > 0 && evidenzia < 1 ? <Lente cx={lente.x} cy={lente.y} /> : null}
        <Compare v={molla(locale, trovato + 4, fps)} cx={485} cy={460}>
          <Pillola x={485} y={460} testo="Autorizzato" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Lo strumento «I tuoi conti». */}
        <Compare v={molla(locale, conti, fps)} cx={825} cy={250}>
          <Finestra x={680} y={100} w={290} h={250} nome="I tuoi conti" colore={TINTE.accento} />
        </Compare>
        {VOCI.map((voce, i) => (
          <Compare key={voce} v={molla(locale, ricevute[i], fps)} cx={735 + i * 90} cy={230}>
            <Ricevuta cx={735 + i * 90} cy={220} colore={i === 1 ? TINTE.rischio : i === 0 ? TINTE.ok : TINTE.tratto} />
            <Testo x={735 + i * 90} y={300} corpo={22} titolo peso={800} colore={TINTE.tratto}>
              {voce}
            </Testo>
          </Compare>
        ))}
        <Freccia d="M 825 365 V 440" p={tra(locale, cartella - 10, cartella)} />
        <Compare v={molla(locale, cartella, fps)} cx={825} cy={520}>
          <Cartella cx={825} cy={530} />
          <Pillola x={825} y={640} testo="Per il fiduciario" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 9. «Per l'AVS, in ogni Comune del Ticino c'è un'agenzia comunale. Lì ti danno informazioni e i moduli che ti servono.» */
const COMUNI = [430, 630, 830];
const aiuAvs: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.65, 0.35) },
      { tipo: "festeggia", quando: fra(ctx, 0, null, 0.75, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const case_ = [fra(ctx, null, 0, 0.3, 0.12), fra(ctx, null, 0, 0.45, 0.2), fra(ctx, null, 0, 0.6, 0.28)];
    const ogni = fra(ctx, null, 0, 0.8, 0.4);
    const info = fra(ctx, 0, null, 0.35, 0.65);
    const moduli = fra(ctx, 0, null, 0.65, 0.8);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="L'agenzia AVS" />
        {COMUNI.map((x, i) => (
          <Compare key={x} v={molla(locale, case_[i], fps)} cx={x} cy={260}>
            <Casa x={x} y={320} s={1.1} />
            <Pillola x={x} y={170} testo="AVS" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
          </Compare>
        ))}
        <Compare v={molla(locale, ogni, fps)} cx={630} cy={370}>
          <Testo x={630} y={370} corpo={30} titolo peso={800} colore={TINTE.tratto}>
            In ogni Comune del Ticino
          </Testo>
        </Compare>
        <Compare v={molla(locale, info, fps)} cx={500} cy={530}>
          <circle cx={500} cy={520} r={52} fill={TINTE.tratto} />
          <circle cx={500} cy={494} r={8} fill={TINTE.carta} />
          <rect x={493} y={510} width={14} height={38} rx={7} fill={TINTE.carta} />
          <Pillola x={500} y={622} testo="Informazioni" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, moduli, fps)} cx={770} cy={530}>
          <Foglio x={715} y={445} w={110} h={140}>
            <Righe x={731} y={492} w={70} n={3} passo={24} />
          </Foglio>
          <Pillola x={770} y={622} testo="Moduli" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Anche la Confederazione ti aiuta. Il Portale PMI ha liste di controllo … Su EasyGov fai online le pratiche, per esempio l'iscrizione all'AVS o all'IVA. Usarlo è gratis, ma gli uffici possono chiedere le loro tasse.» */
const aiuConfederazione: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.35, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.35) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.6) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.4, 0.85) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const ch = fra(ctx, null, 0, 0.3, 0.05);
    const pmi = fra(ctx, 0, 1, 0.15, 0.25);
    const lista = [fra(ctx, 0, 1, 0.4, 0.3), fra(ctx, 0, 1, 0.6, 0.35), fra(ctx, 0, 1, 0.8, 0.4)];
    const easygov = fra(ctx, 1, 2, 0.1, 0.5);
    const pratiche = [fra(ctx, 1, 2, 0.6, 0.6), fra(ctx, 1, 2, 0.85, 0.65)];
    const gratis = fra(ctx, 2, null, 0.2, 0.8);
    const tasse = fra(ctx, 2, null, 0.65, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="La Confederazione" />
        <Compare v={molla(locale, ch, fps)} cx={655} cy={200}>
          <Palazzo x={655} y={265} s={0.72} nome="CH" />
        </Compare>
        <Freccia d="M 580 245 Q 520 255 480 300" p={tra(locale, pmi - 10, pmi + 2)} />
        <Freccia d="M 730 245 Q 790 255 830 300" p={tra(locale, easygov - 10, easygov + 2)} />
        <Compare v={molla(locale, pmi, fps)} cx={470} cy={430}>
          <Finestra x={330} y={315} w={280} h={235} nome="Portale PMI" />
        </Compare>
        {lista.map((t, i) => (
          <Compare key={i} v={molla(locale, t, fps)} cx={400} cy={410 + i * 46}>
            <Spunta cx={372} cy={410 + i * 46} r={16} p={tra(locale, t + 2, t + 12)} />
            <line x1={402} y1={410 + i * 46} x2={402 + (i === 1 ? 120 : 160)} y2={410 + i * 46} stroke={TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
          </Compare>
        ))}
        <Compare v={molla(locale, easygov, fps)} cx={825} cy={430}>
          <Finestra x={690} y={315} w={270} h={235} nome="EasyGov" colore={TINTE.accento} />
        </Compare>
        {["AVS", "IVA"].map((p, i) => (
          <Compare key={p} v={molla(locale, pratiche[i], fps)} cx={825} cy={420 + i * 64}>
            <Pillola x={825} y={420 + i * 64} testo={p} corpo={28} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
          </Compare>
        ))}
        <Compare v={molla(locale, gratis, fps)} cx={825} cy={598}>
          <Pillola x={825} y={598} testo="Gratis" corpo={28} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, tasse, fps)} cx={825} cy={655}>
          <Moneta cx={712} cy={655} r={18} />
          <Testo x={740} y={656} corpo={24} titolo peso={800} colore={TINTE.accento} ancora="start">
            Tasse degli uffici
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 11. «E nei Grigioni? Lì Fondounimpresa è solo per chi vive nella Regione Moesa. In tutto il Cantone c'è l'Ufficio dell'economia e del turismo: aiuta chi fonda un'impresa e ti mette in contatto con banche e fiduciari.» */
const aiuGrigioni: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.4, 0.3) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.45, 0.6) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.85, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const gr = fra(ctx, null, 0, 0.3, 0.06);
    const moesa = fra(ctx, 0, 1, 0.45, 0.3);
    const ufficio = fra(ctx, 1, 2, 0.35, 0.55);
    const tu = fra(ctx, 2, null, 0.15, 0.7);
    const banche = fra(ctx, 2, null, 0.62, 0.82);
    const fiduciari = fra(ctx, 2, null, 0.82, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Nei Grigioni" />
        <Compare v={molla(locale, gr, fps)} cx={470} cy={250}>
          <Palazzo x={470} y={330} s={0.92} nome="GR" colore={TINTE.accento} />
        </Compare>
        {/* Fondounimpresa solo nella Regione Moesa. */}
        <Compare v={molla(locale, moesa, fps)} cx={800} cy={190}>
          <rect x={630} y={110} width={340} height={150} rx={22} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <Casa x={690} y={226} s={0.62} />
          <Testo x={745} y={160} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Regione Moesa
          </Testo>
          <Testo x={745} y={205} corpo={24} peso={700} colore={TINTE.tratto} ancora="start">
            Fondounimpresa
          </Testo>
        </Compare>
        <Compare v={molla(locale, ufficio, fps)} cx={470} cy={395}>
          <Righe2 x={470} y={378} righe={["Ufficio dell'economia", "e del turismo"]} corpo={26} passo={34} colore={TINTE.accento} />
        </Compare>
        {/* Chi fonda un'impresa, con banche e fiduciari. */}
        <Freccia d="M 600 430 Q 640 470 660 510" p={tra(locale, tu - 10, tu + 2)} />
        <Compare v={molla(locale, tu, fps)} cx={700} cy={560}>
          <Persona x={700} y={655} s={0.82} colore={TEAL_CHIARO} />
          <Fumetto cx={772} cy={448} r={32}>
            <Lampadina cx={772} cy={444} s={0.7} />
          </Fumetto>
        </Compare>
        <Freccia d="M 755 575 Q 790 525 835 500" p={tra(locale, banche - 10, banche)} tratteggio />
        <Compare v={molla(locale, banche, fps)} cx={890} cy={470}>
          <Pillola x={890} y={470} testo="Banche" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 760 610 Q 800 610 820 600" p={tra(locale, fiduciari - 10, fiduciari)} tratteggio />
        <Compare v={molla(locale, fiduciari, fps)} cx={895} cy={600}>
          <Pillola x={895} y={600} testo="Fiduciari" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_AIUTO: Record<string, Disegno> = {
  "aiu-fondo": aiuFondo,
  "aiu-chi": aiuChi,
  "aiu-ore": aiuOre,
  "aiu-cosa": aiuCosa,
  "aiu-corsi": aiuCorsi,
  "aiu-fiduciario": aiuFiduciario,
  "aiu-albo": aiuAlbo,
  "aiu-avs": aiuAvs,
  "aiu-confederazione": aiuConfederazione,
  "aiu-grigioni": aiuGrigioni,
};
