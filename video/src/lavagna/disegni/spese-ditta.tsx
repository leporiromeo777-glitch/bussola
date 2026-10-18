/**
 * I disegni del video facoltativo della lezione 22 («Quali spese puoi
 * dedurre»), vedi src/lezioni/dichiarazione-imposte-spese.ts. Fonti: LIFD
 * artt. 27 e 28, LT artt. 26 e 27, Istruzioni PF 2025 e Modulo 10 della
 * Divisione delle contribuzioni, pagine del Portale PMI e lo strumento «I tuoi
 * conti» (src/app/conti). Coordinate della tela 1000×700; l'angolo in basso a
 * sinistra (x < 300, y > 480) è della finestra di Bleo. Niente cifre: le cifre
 * della dichiarazione e gli anni li dice solo la voce (i dieci anni si vedono
 * come dieci tacche, come nella lezione 18).
 */
import type { ReactNode } from "react";
import { Auto, Casa, Compare, Foglio, Freccia, Lampadina, molla, Moneta, Negozio, Pillola, Righe, Salvadanaio, Scudo, Spunta, Testo, TINTE, tra } from "../figure";
import { Tela } from "./ditta-individuale";
import { COLORE_TENUE } from "./forme-giuridiche";
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

/** Un bollino rosso con la croce bianca (p da 0 a 1): «no». */
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

/** Un modulo ufficiale: un foglio con la fascia colorata e il nome in alto. */
function Modulo({ x, y, w, h, nome, corpo = 20, children }: { x: number; y: number; w: number; h: number; nome?: string; corpo?: number; children?: ReactNode }) {
  const fascia = nome ? Math.min(w - 60, nome.length * corpo * 0.56 + 28) : w * 0.5;
  return (
    <Foglio x={x} y={y} w={w} h={h}>
      <rect x={x + 16} y={y + 20} width={fascia} height={corpo * 1.7} rx={8} fill={TINTE.accento} />
      {nome ? (
        <Testo x={x + 16 + fascia / 2} y={y + 21 + corpo * 0.85} corpo={corpo} titolo peso={800} colore={TINTE.carta}>
          {nome}
        </Testo>
      ) : null}
      {children}
    </Foglio>
  );
}

/** Un importo coperto (niente cifre): tre pallini grigi. */
function Importo({ x, y, n = 3 }: { x: number; y: number; n?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, k) => (
        <circle key={k} cx={x + k * 20} cy={y} r={7} fill={COLORE_TENUE} opacity={0.45} />
      ))}
    </g>
  );
}

/** Una freccia piena verso l'alto (entrata) o verso il basso (uscita), centrata in (cx, cy). */
function FrecciaSoldi({ cx, cy, su, s = 1 }: { cx: number; cy: number; su: boolean; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(${su ? 0 : 180})`}>
      <path d="M 0 -34 L 26 -6 H 10 V 32 H -10 V -6 H -26 Z" fill={su ? TINTE.ok : TINTE.rischio} strokeLinejoin="round" />
    </g>
  );
}

/** Uno scontrino con il bordo in basso a zig-zag (angolo in alto a sinistra in x, y). */
function Scontrino({ x, y, w = 80, h = 110, colore = TINTE.tratto }: { x: number; y: number; w?: number; h?: number; colore?: string }) {
  const denti = 5;
  const d = w / denti;
  let bordo = `M ${x} ${y + 10} q 0 -10 10 -10 H ${x + w - 10} q 10 0 10 10 V ${y + h}`;
  for (let i = 0; i < denti; i++) bordo += ` l ${-d / 2} -9 l ${-d / 2} 9`;
  bordo += " Z";
  return (
    <g>
      <path d={bordo} fill={TINTE.carta} stroke={colore} strokeWidth={5} strokeLinejoin="round" />
      {[0.24, 0.42, 0.6].map((f) => (
        <line key={f} x1={x + 14} y1={y + h * f} x2={x + w - (f === 0.42 ? 30 : 14)} y2={y + h * f} stroke={TINTE.tinta} strokeWidth={7} strokeLinecap="round" />
      ))}
      <line x1={x + 14} y1={y + h * 0.78} x2={x + w - 14} y2={y + h * 0.78} stroke={colore} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
}

/** Uno smartphone centrato in (cx, cy); lo schermo va dentro. */
function Telefono({ cx, cy, w, h, children }: { cx: number; cy: number; w: number; h: number; children?: ReactNode }) {
  const tondo = Math.min(30, w * 0.2);
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={tondo} fill={TINTE.tratto} />
      <rect x={cx - w / 2 + w * 0.08} y={cy - h / 2 + h * 0.1} width={w * 0.84} height={h * 0.8} rx={tondo * 0.4} fill={TINTE.carta} />
      <rect x={cx - w * 0.12} y={cy - h / 2 + h * 0.04} width={w * 0.24} height={Math.max(4, h * 0.02)} rx={2} fill={TINTE.tinta} />
      {children}
    </g>
  );
}

/** Un pacco di cartone (la merce), centrato in (cx, cy). */
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

/** Una matita su un foglietto (il materiale d'ufficio), centrata in (cx, cy). */
function Materiale({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-22} y={-28} width={40} height={54} rx={6} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={4} />
      <line x1={-14} y1={-14} x2={8} y2={-14} stroke={TINTE.tinta} strokeWidth={5} strokeLinecap="round" />
      <line x1={-14} y1={-2} x2={4} y2={-2} stroke={TINTE.tinta} strokeWidth={5} strokeLinecap="round" />
      <g transform="translate(10 4) rotate(40)">
        <rect x={-5} y={-30} width={10} height={40} rx={2} fill={TINTE.oro} stroke={TINTE.accento} strokeWidth={3} />
        <path d="M -5 10 L 0 20 L 5 10 Z" fill={TINTE.pelle} stroke={TINTE.accento} strokeWidth={3} strokeLinejoin="round" />
      </g>
    </g>
  );
}

/** Un ingranaggio (una macchina), centrato in (cx, cy). */
function Ingranaggio({ cx, cy, r = 34 }: { cx: number; cy: number; r?: number }) {
  const denti = 8;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      {Array.from({ length: denti }, (_, k) => (
        <rect key={k} x={-r * 0.2} y={-r * 1.18} width={r * 0.4} height={r * 0.5} rx={r * 0.08} fill={TINTE.tratto} transform={`rotate(${(k * 360) / denti})`} />
      ))}
      <circle r={r * 0.86} fill={TINTE.tratto} />
      <circle r={r * 0.36} fill={TINTE.carta} />
    </g>
  );
}

/** Una scrivania (i mobili), con i piedi in (x, y). */
function Scrivania({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-58} y={-62} width={116} height={14} rx={6} fill={TINTE.accento} />
      <rect x={-50} y={-48} width={10} height={48} rx={4} fill={TINTE.accento} />
      <rect x={6} y={-48} width={46} height={48} rx={6} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={4} />
      <line x1={22} y1={-30} x2={36} y2={-30} stroke={TINTE.accento} strokeWidth={4} strokeLinecap="round" />
      <line x1={22} y1={-12} x2={36} y2={-12} stroke={TINTE.accento} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

/** Un calendario da muro, senza numeri. */
function Calendario({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-64} y={-60} width={128} height={124} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={8} />
      <rect x={-64} y={-60} width={128} height={34} rx={14} fill={TINTE.accento} />
      {Array.from({ length: 6 }, (_, k) => (
        <rect key={k} x={-46 + (k % 3) * 34} y={-8 + Math.floor(k / 3) * 32} width={24} height={20} rx={5} fill={TINTE.tinta} />
      ))}
    </g>
  );
}

/** Un cartellino del prezzo (senza cifre, con una moneta), appeso in (x, y). */
function Cartellino({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(-14)`}>
      <path d="M 0 0 L 22 -22 H 92 Q 100 -22 100 -14 V 14 Q 100 22 92 22 H 22 Z" fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={20} cy={0} r={6} fill={TINTE.carta} stroke={TINTE.accento} strokeWidth={4} />
      <Moneta cx={62} cy={0} r={13} />
    </g>
  );
}

/* 2. «La regola è questa: puoi dedurre le spese giustificate dall'uso commerciale, cioè quelle che ti servono per la ditta. Per esempio l'affitto del locale, l'elettricità, il materiale d'ufficio, le assicurazioni della ditta. Le spese private no, e nemmeno le imposte sul reddito.» */
const SI = { x: 315, y: 86, w: 360, h: 520 } as const;
const NO_SPESE = { x: 700, y: 86, w: 285, h: 520 } as const;
const RIGHE_SI = [250, 340, 430, 520] as const;
const ICONA_X = 374;
const speseRegola: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.75, 0.2),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.75, 0.2) },
      { tipo: "tocca", quando: fra(ctx, 1, 2, 0.2, 0.4) + 10, bersaglio: { x: SI.x + 16, y: RIGHE_SI[0] } },
      { tipo: "tocca", quando: fra(ctx, 2, 3, 0.6, 0.7) + 10, bersaglio: { x: SI.x + 16, y: RIGHE_SI[3] } },
      { tipo: "scuoti", quando: fra(ctx, 3, null, 0.4, 0.86) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const pannello = fra(ctx, null, 0, 0.12, 0.05);
    const spunta = fra(ctx, null, 0, 0.75, 0.2);
    const serve = fra(ctx, 0, 1, 0.2, 0.3);
    const righe = [fra(ctx, 1, 2, 0.2, 0.4), fra(ctx, 1, 2, 0.7, 0.48), fra(ctx, 2, 3, 0.15, 0.6), fra(ctx, 2, 3, 0.6, 0.7)];
    const destra = fra(ctx, 3, null, 0.05, 0.78);
    const privato = fra(ctx, 3, null, 0.15, 0.8);
    const noPrivato = fra(ctx, 3, null, 0.35, 0.85);
    const imposte = fra(ctx, 3, null, 0.55, 0.9);
    const noImposte = fra(ctx, 3, null, 0.75, 0.95);
    const icone: ReactNode[] = [
      <Negozio key="affitto" x={ICONA_X} y={RIGHE_SI[0] + 17} s={0.21} />,
      <Lampadina key="luce" cx={ICONA_X} cy={RIGHE_SI[1] + 5} s={0.62} />,
      <Materiale key="materiale" cx={ICONA_X - 3} cy={RIGHE_SI[2] + 1} s={0.78} />,
      <Scudo key="assicurazioni" x={ICONA_X} y={RIGHE_SI[3] + 4} s={0.48} />,
    ];
    const etichette = ["Affitto del locale", "Elettricità", "Materiale d'ufficio", "Assicurazioni"];
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cosa puoi dedurre" />
        {/* Si deduce: quello che serve alla ditta. */}
        <Compare v={molla(locale, pannello, fps, true)} cx={SI.x + SI.w / 2} cy={SI.y + SI.h / 2}>
          <rect x={SI.x} y={SI.y} width={SI.w} height={SI.h} rx={26} fill={TINTE.carta} stroke={TINTE.ok} strokeWidth={6} />
          <Pillola x={SI.x + SI.w / 2 - 20} y={SI.y + 46} testo="Si deduce" corpo={26} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Spunta cx={SI.x + SI.w / 2 + 92} cy={SI.y + 46} r={20} p={tra(locale, spunta, spunta + 14)} />
        <Compare v={molla(locale, serve, fps)} cx={SI.x + SI.w / 2} cy={SI.y + 98}>
          <Testo x={SI.x + SI.w / 2} y={SI.y + 98} corpo={22} peso={700} colore={COLORE_TENUE}>
            Serve alla ditta
          </Testo>
        </Compare>
        {RIGHE_SI.map((y, i) => (
          <Compare key={y} v={molla(locale, righe[i], fps)} cx={SI.x + SI.w / 2} cy={y}>
            <rect x={SI.x + 16} y={y - 36} width={SI.w - 32} height={72} rx={18} fill={TINTE.carta} stroke={TINTE.tinta} strokeWidth={4} />
            <rect x={ICONA_X - 28} y={y - 28} width={56} height={56} rx={14} fill={TINTE.crema} />
            {icone[i]}
            <Testo x={ICONA_X + 40} y={y + 1} corpo={21} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {etichette[i]}
            </Testo>
          </Compare>
        ))}
        {/* Non si deduce: le spese private e le imposte sul reddito. */}
        <Compare v={molla(locale, destra, fps, true)} cx={NO_SPESE.x + NO_SPESE.w / 2} cy={NO_SPESE.y + NO_SPESE.h / 2}>
          <rect x={NO_SPESE.x} y={NO_SPESE.y} width={NO_SPESE.w} height={NO_SPESE.h} rx={26} fill={TINTE.carta} stroke={TINTE.rischio} strokeWidth={6} />
          <Pillola x={NO_SPESE.x + NO_SPESE.w / 2} y={NO_SPESE.y + 46} testo="Non si deduce" corpo={24} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, privato, fps)} cx={842} cy={260}>
          <Casa x={842} y={302} s={0.85} />
          <Testo x={842} y={334} corpo={22} titolo peso={800} colore={TINTE.rischio}>
            Spese private
          </Testo>
        </Compare>
        <No cx={905} cy={214} r={22} p={tra(locale, noPrivato, noPrivato + 14)} />
        <Compare v={molla(locale, imposte, fps)} cx={842} cy={470}>
          <Modulo x={797} y={400} w={90} h={116} corpo={12}>
            <Righe x={811} y={466} w={46} n={2} passo={22} />
          </Modulo>
          <Testo x={842} y={548} corpo={21} titolo peso={800} colore={TINTE.rischio}>
            Imposte sul reddito
          </Testo>
        </Compare>
        <No cx={905} cy={410} r={22} p={tra(locale, noImposte, noImposte + 14)} />
      </Tela>
    );
  },
};

/* 3. «Se una cosa la usi sia per la ditta sia per te, come l'auto o il telefono, deduci solo la parte della ditta. Per l'auto, nel Modulo … scrivi i chilometri dell'anno e quanti erano privati. Quella parte privata la togli dalle spese.» */
const USO = { x: 460, y: 384, w: 340, ditta: 0.62 } as const;
const KM = { x: 470, y: 560, w: 460, privati: 0.32 } as const;
const speseMisto: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.85, 0.4),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.3, 0.3) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.3, 0.86) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.9, 0.95) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const ditta = fra(ctx, null, 0, 0.3, 0.08);
    const casa = fra(ctx, null, 0, 0.75, 0.2);
    const oggetti = fra(ctx, 0, 1, 0.15, 0.3);
    const telefono = fra(ctx, 0, 1, 0.35, 0.35);
    const barra = fra(ctx, 0, 1, 0.55, 0.4);
    const soloDitta = fra(ctx, 0, 1, 0.85, 0.45);
    const km = fra(ctx, 1, 2, 0.15, 0.55);
    const privati = fra(ctx, 1, 2, 0.7, 0.68);
    const togli = fra(ctx, 2, null, 0.25, 0.85);
    const etichetta = fra(ctx, 2, null, 0.6, 0.92);
    const divide = tra(locale, barra, barra + 16);
    const scende = tra(locale, togli, togli + 18);
    const quotaKm = tra(locale, privati - 6, privati + 10);
    const xDivisione = USO.x + USO.w * USO.ditta;
    const xPrivati = KM.x + KM.w * (1 - KM.privati);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="In parte privato" />
        {/* La ditta e il privato. */}
        <Compare v={molla(locale, ditta, fps)} cx={400} cy={250}>
          <Negozio x={400} y={300} s={0.62} />
          <Pillola x={400} y={330} testo="Ditta" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, casa, fps)} cx={900} cy={250}>
          <Casa x={900} y={302} s={0.95} />
          <Pillola x={900} y={330} testo="Privato" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {/* L'auto e il telefono, usati per tutte e due. */}
        <Compare v={molla(locale, oggetti, fps)} cx={600} cy={240}>
          <Auto x={600} y={290} s={1.05} />
        </Compare>
        <Compare v={molla(locale, telefono, fps)} cx={735} cy={240}>
          <Telefono cx={735} cy={240} w={60} h={104} />
        </Compare>
        {/* L'uso diviso: la parte della ditta e quella privata. */}
        {divide > 0 ? (
          <g opacity={Math.min(1, divide * 2)}>
            <rect x={USO.x} y={USO.y - 18} width={USO.w} height={36} rx={18} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={4} />
            <rect x={USO.x} y={USO.y - 18} width={USO.w * USO.ditta * divide} height={36} rx={18} fill={TINTE.accento} />
            <line x1={xDivisione} y1={USO.y - 26} x2={xDivisione} y2={USO.y + 26} stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" />
          </g>
        ) : null}
        <Freccia d={`M ${USO.x - 10} ${USO.y} C ${USO.x - 46} ${USO.y} 400 ${USO.y - 6} 400 358`} p={tra(locale, soloDitta - 8, soloDitta + 6)} colore={TINTE.accento} spessore={6} />
        <Spunta cx={USO.x + (USO.w * USO.ditta) / 2} cy={USO.y} r={16} p={tra(locale, soloDitta, soloDitta + 14)} />
        {/* I chilometri dell'anno, e quelli privati. */}
        <Compare v={molla(locale, km, fps)} cx={KM.x + KM.w / 2} cy={KM.y}>
          <Auto x={398} y={KM.y + 30} s={0.55} />
          <Testo x={KM.x} y={KM.y - 52} corpo={22} peso={700} colore={COLORE_TENUE} ancora="start">
            Chilometri dell&apos;anno
          </Testo>
          <rect x={KM.x} y={KM.y - 18} width={KM.w * (1 - KM.privati) - 6} height={36} rx={18} fill={TINTE.accento} />
          <line x1={KM.x + 24} y1={KM.y} x2={KM.x + KM.w * (1 - KM.privati) - 16} y2={KM.y} stroke={TINTE.carta} strokeWidth={5} strokeDasharray="18 14" strokeLinecap="round" />
        </Compare>
        {quotaKm > 0 ? (
          <g transform={`translate(${30 * scende} ${46 * scende})`} opacity={(1 - 0.55 * scende) * Math.min(1, quotaKm * 2)}>
            <rect x={xPrivati} y={KM.y - 18} width={KM.w * KM.privati} height={36} rx={18} fill={TINTE.tratto} />
            <Testo x={xPrivati + (KM.w * KM.privati) / 2} y={KM.y + 42} corpo={22} titolo peso={800} colore={TINTE.tratto}>
              privati
            </Testo>
          </g>
        ) : null}
        <Compare v={molla(locale, togli, fps)} cx={xPrivati - 22} cy={KM.y + 46}>
          <circle cx={xPrivati - 22} cy={KM.y + 46} r={18} fill={TINTE.rischio} />
          <line x1={xPrivati - 31} y1={KM.y + 46} x2={xPrivati - 13} y2={KM.y + 46} stroke={TINTE.carta} strokeWidth={5} strokeLinecap="round" />
        </Compare>
        <Compare v={molla(locale, etichetta, fps)} cx={615} cy={645}>
          <Pillola x={615} y={645} testo="Tolta dalle spese" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Un'auto, delle macchine o i mobili della ditta durano più anni: non li togli tutti nell'anno in cui li compri. Li togli un po' ogni anno, con l'ammortamento. Con la contabilità semplificata lo scrivi in una tabella apposta: c'è nel Modulo ….» */
const ANNI_X = [420, 540, 660, 780, 900] as const;
const BASE = 462;
const COSTO = { w: 66, h: 200 } as const;
const FETTE = [60, 46, 36, 30, 28] as const;
const TABELLA = { x: 610, y: 548, w: 350, h: 116 } as const;
const speseAmmortamento: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.4, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, 0, 1, 0.7, 0.3) + 4 },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.4, 0.5) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.7, 0.92) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const oggetti = [fra(ctx, null, 0, 0.05, 0.03), fra(ctx, null, 0, 0.3, 0.08), fra(ctx, null, 0, 0.55, 0.13)];
    const anni = fra(ctx, null, 0, 0.8, 0.18);
    const costo = fra(ctx, 0, 1, 0.1, 0.24);
    const no = fra(ctx, 0, 1, 0.65, 0.32);
    const divide = fra(ctx, 1, 2, 0.15, 0.42);
    const ogniAnno = fra(ctx, 1, 2, 0.8, 0.55);
    const tabella = fra(ctx, 2, 3, 0.25, 0.68);
    const righe = fra(ctx, 2, 3, 0.7, 0.76);
    const modulo = fra(ctx, 3, null, 0.1, 0.86);
    const dentro = fra(ctx, 3, null, 0.5, 0.92);
    const sposta = tra(locale, divide, divide + 26);
    const via = tra(locale, divide - 4, divide + 6);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="L'ammortamento" />
        {/* Le cose che durano più anni. */}
        <Compare v={molla(locale, oggetti[0], fps)} cx={420} cy={170}>
          <Auto x={420} y={215} s={0.85} />
        </Compare>
        <Compare v={molla(locale, oggetti[1], fps)} cx={555} cy={172}>
          <Ingranaggio cx={555} cy={172} r={32} />
        </Compare>
        <Compare v={molla(locale, oggetti[2], fps)} cx={680} cy={180}>
          <Scrivania x={680} y={212} s={0.95} />
        </Compare>
        <Compare v={molla(locale, anni, fps)} cx={862} cy={172}>
          <Pillola x={862} y={172} testo="Durano più anni" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {/* Gli anni: un calendario per anno, senza numeri. */}
        <line x1={360} y1={BASE} x2={360 + 600 * tra(locale, anni, anni + 16)} y2={BASE} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
        {ANNI_X.map((x, k) => (
          <Compare key={x} v={molla(locale, anni + 3 * k, fps)} cx={x} cy={BASE + 34}>
            <Calendario cx={x} cy={BASE + 34} s={0.3} />
          </Compare>
        ))}
        {/* Il costo intero, nell'anno dell'acquisto: no. */}
        {(() => {
          const cresce = tra(locale, costo, costo + 16);
          if (cresce <= 0) return null;
          let sopra = 0;
          return FETTE.map((h, k) => {
            const y0 = BASE - COSTO.h + sopra;
            sopra += h;
            const da = { x: ANNI_X[0] - COSTO.w / 2, y: y0 };
            const a = { x: ANNI_X[k] - COSTO.w / 2, y: BASE - h };
            const x = da.x + (a.x - da.x) * sposta;
            const y = da.y + (a.y - da.y) * sposta;
            const altezza = h * cresce;
            return <rect key={k} x={x} y={y + (h - altezza)} width={COSTO.w} height={altezza} rx={8} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />;
          });
        })()}
        <g opacity={1 - via}>
          <No cx={ANNI_X[0] + 46} cy={BASE - COSTO.h - 6} r={22} p={tra(locale, no, no + 14)} />
        </g>
        <Compare v={molla(locale, ogniAnno, fps)} cx={720} cy={330}>
          <Pillola x={720} y={330} testo="Un po' ogni anno" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {/* La tabella d'ammortamento, nel questionario. */}
        <Compare v={molla(locale, modulo, fps, true)} cx={450} cy={606}>
          <Modulo x={350} y={548} w={200} h={116} nome="Questionario" corpo={18} />
        </Compare>
        <Compare v={molla(locale, tabella, fps, true)} cx={TABELLA.x + TABELLA.w / 2} cy={TABELLA.y + TABELLA.h / 2}>
          <rect x={TABELLA.x} y={TABELLA.y} width={TABELLA.w} height={TABELLA.h} rx={16} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <rect x={TABELLA.x + 14} y={TABELLA.y + 12} width={TABELLA.w - 28} height={34} rx={8} fill={TINTE.accento} />
          <Testo x={TABELLA.x + TABELLA.w / 2} y={TABELLA.y + 30} corpo={19} titolo peso={800} colore={TINTE.carta}>
            Tabella d&apos;ammortamento
          </Testo>
        </Compare>
        {[0, 1].map((k) => (
          <g key={k} opacity={tra(locale, righe + 5 * k, righe + 5 * k + 8)}>
            <line x1={TABELLA.x + 24} y1={TABELLA.y + 70 + k * 26} x2={TABELLA.x + 150} y2={TABELLA.y + 70 + k * 26} stroke={TINTE.tinta} strokeWidth={9} strokeLinecap="round" />
            <Importo x={TABELLA.x + 220} y={TABELLA.y + 70 + k * 26} n={4} />
          </g>
        ))}
        <Freccia d={`M ${TABELLA.x - 8} ${TABELLA.y + 70} C 590 610 575 606 562 606`} p={tra(locale, dentro, dentro + 12)} colore={TINTE.accento} spessore={6} />
      </Tela>
    );
  },
};

/* 5. «Anche i tuoi contributi AVS, invalidità e perdita di guadagno si deducono. Ma una volta sola: nel Modulo … tra le spese generali, oppure alla cifra … della dichiarazione. Il pilastro … invece è privato: non va tra le spese della ditta, lo deduci a parte, alla cifra ….» */
const QUESTIONARIO = { x: 330, y: 330, w: 240, h: 290 } as const;
const DICH = { x: 680, y: 330, w: 240, h: 290 } as const;
const RIGA_GENERALI = 470;
const RIGA_AVS = 460;
const RIGA_3A = 545;
const speseAvs: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.8, 0.15),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.8, 0.15) },
      { tipo: "scuoti", quando: fra(ctx, 2, 3, 0.75, 0.7) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.8, 0.94) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const carta = fra(ctx, null, 0, 0.15, 0.04);
    const deduci = fra(ctx, null, 0, 0.8, 0.15);
    const unaVolta = fra(ctx, 0, 1, 0.12, 0.22);
    const questionario = fra(ctx, 0, 1, 0.4, 0.26);
    const versoQuest = fra(ctx, 0, 1, 0.75, 0.32);
    const oppure = fra(ctx, 1, 2, 0.05, 0.4);
    const dich = fra(ctx, 1, 2, 0.2, 0.43);
    const versoDich = fra(ctx, 1, 2, 0.6, 0.5);
    const pilastro = fra(ctx, 2, 3, 0.15, 0.6);
    const noDitta = fra(ctx, 2, 3, 0.65, 0.7);
    const aParte = fra(ctx, 3, null, 0.2, 0.84);
    const spunta3a = fra(ctx, 3, null, 0.6, 0.92);
    // Quando arriva il terzo pilastro, la parte sull'AVS se ne va (restano le righe evidenziate nei moduli).
    const sbiadisce = 1 - tra(locale, pilastro - 14, pilastro);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Contributi e previdenza" />
        {/* I contributi AVS, AI e IPG. */}
        <g opacity={sbiadisce}>
          <Compare v={molla(locale, carta, fps)} cx={625} cy={160}>
            <rect x={530} y={110} width={190} height={100} rx={18} fill={TINTE.tratto} />
            <Testo x={625} y={150} corpo={40} titolo peso={800} colore={TINTE.carta}>
              AVS
            </Testo>
            <Testo x={625} y={188} corpo={22} titolo peso={800} colore={TINTE.tinta}>
              AI e IPG
            </Testo>
          </Compare>
          <Spunta cx={720} cy={112} r={20} p={tra(locale, deduci, deduci + 14)} />
          <Compare v={molla(locale, unaVolta, fps)} cx={625} cy={262}>
            <Pillola x={625} y={262} testo="Una volta sola" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
          </Compare>
          <Freccia d={`M 526 160 C 330 160 300 ${RIGA_GENERALI} 322 ${RIGA_GENERALI}`} p={tra(locale, versoQuest - 8, versoQuest + 8)} colore={TINTE.tratto} spessore={6} />
          <Freccia d={`M 724 160 C 940 160 960 ${RIGA_AVS} 930 ${RIGA_AVS}`} p={tra(locale, versoDich - 8, versoDich + 8)} colore={TINTE.tratto} spessore={6} />
        </g>
        {/* Nel questionario, tra le spese generali. */}
        <Compare v={molla(locale, questionario, fps, true)} cx={QUESTIONARIO.x + QUESTIONARIO.w / 2} cy={QUESTIONARIO.y + QUESTIONARIO.h / 2}>
          <Modulo x={QUESTIONARIO.x} y={QUESTIONARIO.y} w={QUESTIONARIO.w} h={QUESTIONARIO.h} nome="Questionario" corpo={20}>
            <Righe x={QUESTIONARIO.x + 24} y={QUESTIONARIO.y + 94} w={140} n={1} />
            <rect x={QUESTIONARIO.x + 14} y={RIGA_GENERALI - 24} width={QUESTIONARIO.w - 28} height={48} rx={12} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={4} />
            <Testo x={QUESTIONARIO.x + 28} y={RIGA_GENERALI + 1} corpo={20} titolo peso={800} colore={TINTE.accento} ancora="start">
              Spese generali
            </Testo>
            <Righe x={QUESTIONARIO.x + 24} y={RIGA_GENERALI + 52} w={150} n={3} passo={28} />
          </Modulo>
        </Compare>
        {/* Oppure nella dichiarazione. */}
        <Compare v={molla(locale, oppure, fps)} cx={625} cy={470}>
          <Pillola x={625} y={470} testo="oppure" corpo={20} fondo={TINTE.carta} colore={COLORE_TENUE} bordo={COLORE_TENUE} />
        </Compare>
        <Compare v={molla(locale, dich, fps, true)} cx={DICH.x + DICH.w / 2} cy={DICH.y + DICH.h / 2}>
          <Modulo x={DICH.x} y={DICH.y} w={DICH.w} h={DICH.h} nome="Dichiarazione" corpo={20}>
            <Righe x={DICH.x + 24} y={DICH.y + 94} w={150} n={1} />
            <rect x={DICH.x + 14} y={RIGA_AVS - 22} width={DICH.w - 28} height={44} rx={12} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={4} />
            <line x1={DICH.x + 32} y1={RIGA_AVS} x2={DICH.x + 130} y2={RIGA_AVS} stroke={TINTE.accento} strokeWidth={9} strokeLinecap="round" />
            <Righe x={DICH.x + 24} y={RIGA_AVS + 44} w={150} n={1} />
            <rect x={DICH.x + 14} y={RIGA_3A - 22} width={DICH.w - 28} height={44} rx={12} fill={TINTE.carta} stroke={TINTE.tinta} strokeWidth={4} />
            <line x1={DICH.x + 32} y1={RIGA_3A} x2={DICH.x + 130} y2={RIGA_3A} stroke={TINTE.tinta} strokeWidth={9} strokeLinecap="round" />
          </Modulo>
        </Compare>
        {/* Il terzo pilastro: privato, va a parte. */}
        <Compare v={molla(locale, pilastro, fps)} cx={625} cy={190}>
          <Salvadanaio x={620} y={232} s={0.8} />
          <Pillola x={625} y={268} testo="Terzo pilastro" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 560 200 C 340 200 314 290 314 368" p={tra(locale, noDitta - 12, noDitta + 2)} colore={TINTE.rischio} spessore={6} punta={false} />
        <No cx={314} cy={396} r={24} p={tra(locale, noDitta, noDitta + 14)} />
        <Freccia d={`M 690 200 C 940 200 960 ${RIGA_3A} 930 ${RIGA_3A}`} p={tra(locale, aParte - 6, aParte + 12)} colore={TINTE.ok} spessore={6} />
        <Spunta cx={DICH.x + DICH.w - 40} cy={RIGA_3A} r={18} p={tra(locale, spunta3a, spunta3a + 14)} />
      </Tela>
    );
  },
};

/* 6. «E se prendi per te qualcosa della ditta, per esempio la merce del tuo negozio? È un prelevamento in natura: il suo valore conta come un incasso, al prezzo a cui la vendi.» */
const PACCO_DA = { x: 520, y: 290 } as const;
const PACCO_A = { x: 720, y: 290 } as const;
const speseNatura: Disegno = {
  chiave: (ctx) => fra(ctx, 1, null, 0.45, 0.75),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.75, 0.3) },
      { tipo: "scuoti", quando: fra(ctx, 1, null, 0.4, 0.75) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.9, 0.95) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const negozio = fra(ctx, null, 0, 0.1, 0.04);
    const casa = fra(ctx, null, 0, 0.3, 0.1);
    const pacco = fra(ctx, null, 0, 0.55, 0.2);
    const viaggio = fra(ctx, null, 0, 0.75, 0.28);
    const natura = fra(ctx, 0, 1, 0.2, 0.45);
    const prezzo = fra(ctx, 1, null, 0.15, 0.62);
    const etichettaPrezzo = fra(ctx, 1, null, 0.85, 0.85);
    const incasso = fra(ctx, 1, null, 0.3, 0.72);
    const vola = fra(ctx, 1, null, 0.45, 0.78);
    const conta = fra(ctx, 1, null, 0.65, 0.88);
    const t = tra(locale, viaggio, viaggio + 26);
    const px = PACCO_DA.x + (PACCO_A.x - PACCO_DA.x) * t;
    const py = PACCO_DA.y - Math.sin(Math.PI * t) * 70;
    const m = tra(locale, vola, vola + 22);
    const mx = PACCO_A.x + 50 + (680 - PACCO_A.x - 50) * m;
    const my = 236 + (582 - 236) * m - Math.sin(Math.PI * m) * 60;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Prelevamenti in natura" />
        <Compare v={molla(locale, negozio, fps)} cx={420} cy={260}>
          <Negozio x={420} y={330} s={0.8} />
          <Pillola x={420} y={362} testo="Ditta" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, casa, fps)} cx={890} cy={260}>
          <Casa x={890} y={330} s={1.05} />
          <Pillola x={890} y={362} testo="Per te" corpo={24} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {/* La merce che prendi per te. */}
        <Freccia d={`M ${PACCO_DA.x - 20} ${PACCO_DA.y - 40} Q ${(PACCO_DA.x + PACCO_A.x) / 2} ${PACCO_DA.y - 150} ${PACCO_A.x - 15} ${PACCO_A.y - 42}`} p={tra(locale, viaggio + 4, viaggio + 26)} colore={COLORE_TENUE} spessore={5} />
        <Compare v={molla(locale, pacco, fps)} cx={px} cy={py}>
          <Pacco cx={px} cy={py} s={0.5} />
        </Compare>
        <Compare v={molla(locale, natura, fps)} cx={640} cy={130}>
          <Pillola x={640} y={130} testo="Merce della ditta, per te" corpo={22} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        {/* Il prezzo di vendita: conta come un incasso. */}
        <Compare v={molla(locale, prezzo, fps)} cx={PACCO_A.x + 50} cy={PACCO_A.y - 50}>
          <Cartellino x={PACCO_A.x - 2} y={PACCO_A.y - 40} s={0.95} />
        </Compare>
        <Compare v={molla(locale, etichettaPrezzo, fps)} cx={640} cy={PACCO_A.y + 70}>
          <Testo x={640} y={PACCO_A.y + 70} corpo={22} peso={700} colore={COLORE_TENUE}>
            al prezzo di vendita
          </Testo>
        </Compare>
        <Compare v={molla(locale, incasso, fps)} cx={600} cy={560}>
          <rect x={470} y={505} width={260} height={110} rx={22} fill={TINTE.carta} stroke={TINTE.ok} strokeWidth={5} />
          <FrecciaSoldi cx={515} cy={545} su s={0.62} />
          <Testo x={545} y={545} corpo={24} titolo peso={800} colore={TINTE.ok} ancora="start">
            Incassi
          </Testo>
          <Importo x={545} y={585} n={4} />
        </Compare>
        <Freccia d={`M ${PACCO_A.x + 70} ${PACCO_A.y - 26} C ${PACCO_A.x + 90} 400 ${PACCO_A.x + 40} 440 ${PACCO_A.x - 2} 492`} p={tra(locale, vola, vola + 22)} colore={TINTE.ok} spessore={5} />
        {m > 0 && m < 1 ? <Moneta cx={mx} cy={my} r={18} /> : null}
        <Compare v={molla(locale, conta, fps)} cx={680} cy={582}>
          <Moneta cx={680} cy={582} r={18} />
        </Compare>
        <Spunta cx={705} cy={530} r={18} p={tra(locale, conta + 4, conta + 18)} />
      </Tela>
    );
  },
};

/* 7. «Per ogni spesa che deduci ti serve il giustificativo, cioè la fattura o la ricevuta. Conservali … anni, come hai visto nella lezione sulla contabilità. Con lo strumento «I tuoi conti» di Bleo segni ogni ricevuta: «Sì, è della ditta» oppure «No, è privato».» */
const APP = { cx: 830, cy: 360, w: 250, h: 450 } as const;
const BOTTONE_SI = 440;
const BOTTONE_NO = 496;
const speseRicevute: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.5, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.85, 0.15) },
      { tipo: "scuoti", quando: fra(ctx, 1, 2, 0.5, 0.45) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.85, 0.94) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const spesa = fra(ctx, null, 0, 0.1, 0.03);
    const documenti = fra(ctx, null, 0, 0.7, 0.12);
    const fattura = fra(ctx, 0, 1, 0.35, 0.18);
    const ricevuta = fra(ctx, 0, 1, 0.8, 0.24);
    const scatola = fra(ctx, 1, 2, 0.08, 0.32);
    const tacche = fra(ctx, 1, 2, 0.35, 0.38);
    const fineTacche = fra(ctx, 1, 2, 0.8, 0.5);
    const app = fra(ctx, 2, 3, 0.15, 0.58);
    const voce = fra(ctx, 2, 3, 0.6, 0.66);
    const si = fra(ctx, 3, null, 0.1, 0.76);
    const no = fra(ctx, 3, null, 0.5, 0.84);
    const premuto = fra(ctx, 3, null, 0.8, 0.92);
    const ogni = Math.max(2, (fineTacche - tacche) / 10);
    const tocco = tra(locale, premuto, premuto + 6) - tra(locale, premuto + 6, premuto + 12);
    const vScatola = molla(locale, scatola, fps, true);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="I giustificativi" />
        {/* Una spesa, con il suo documento. */}
        <Compare v={molla(locale, spesa, fps)} cx={370} cy={180}>
          <Moneta cx={360} cy={180} r={30} />
          <FrecciaSoldi cx={360} cy={110} su={false} s={0.55} />
          <Testo x={360} y={240} corpo={22} titolo peso={800} colore={TINTE.rischio}>
            Spesa
          </Testo>
        </Compare>
        <Freccia d="M 404 180 H 446" p={tra(locale, documenti - 8, documenti + 4)} colore={TINTE.tratto} spessore={6} />
        <g>
          <Compare v={molla(locale, documenti, fps)} cx={498} cy={175}>
            <Foglio x={455} y={115} w={86} h={120}>
              <Righe x={469} y={165} w={44} n={3} passo={20} />
            </Foglio>
          </Compare>
          <Compare v={molla(locale, documenti + 5, fps)} cx={595} cy={175}>
            <Scontrino x={560} y={125} w={70} h={100} />
          </Compare>
        </g>
        <g>
          <Compare v={molla(locale, fattura, fps)} cx={498} cy={262}>
            <Testo x={498} y={262} corpo={20} titolo peso={800} colore={TINTE.tratto}>
              Fattura
            </Testo>
          </Compare>
          <Compare v={molla(locale, ricevuta, fps)} cx={595} cy={262}>
            <Testo x={595} y={262} corpo={20} titolo peso={800} colore={TINTE.tratto}>
              Ricevuta
            </Testo>
          </Compare>
        </g>
        {/* Nell'archivio, per dieci anni: dieci tacche. */}
        <Compare v={vScatola} cx={520} cy={470}>
          <path d="M 412 420 L 430 396 H 610 L 628 420 Z" fill="#e9d4b8" stroke={TINTE.accento} strokeWidth={5} strokeLinejoin="round" />
          <Foglio x={458} y={360} w={70} h={100}>
            <Righe x={470} y={402} w={30} n={2} passo={18} />
          </Foglio>
          <Scontrino x={540} y={372} w={58} h={84} />
          <rect x={400} y={420} width={240} height={140} rx={14} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={6} />
          <rect x={478} y={470} width={84} height={42} rx={8} fill={TINTE.carta} stroke={TINTE.accento} strokeWidth={4} />
        </Compare>
        {Array.from({ length: 10 }, (_, k) => {
          const quando = tacche + ogni * k;
          const v = molla(locale, quando, fps);
          return v > 0.001 ? (
            <Compare key={k} v={v} cx={421 + k * 22} cy={604}>
              <rect x={414 + k * 22} y={588} width={14} height={32} rx={7} fill={TINTE.accento} />
            </Compare>
          ) : null;
        })}
        {/* «I tuoi conti»: della ditta o privato. */}
        <Compare v={molla(locale, app, fps, true)} cx={APP.cx} cy={APP.cy}>
          <Telefono cx={APP.cx} cy={APP.cy} w={APP.w} h={APP.h} />
          <Testo x={APP.cx} y={APP.cy - APP.h / 2 + 76} corpo={24} titolo peso={800} colore={TINTE.tratto}>
            I tuoi conti
          </Testo>
        </Compare>
        <Compare v={molla(locale, voce, fps)} cx={APP.cx} cy={330}>
          <rect x={APP.cx - 96} y={262} width={192} height={136} rx={16} fill={TINTE.tinta} />
          <Scontrino x={APP.cx - 80} y={278} w={62} h={92} />
          <Importo x={APP.cx + 6} y={316} />
          <line x1={APP.cx + 2} y1={350} x2={APP.cx + 70} y2={350} stroke={TINTE.carta} strokeWidth={9} strokeLinecap="round" />
        </Compare>
        <Spunta cx={APP.cx + 84} cy={268} r={18} p={tra(locale, premuto + 4, premuto + 18)} />
        <Compare v={molla(locale, si, fps)} cx={APP.cx} cy={BOTTONE_SI}>
          <g transform={`translate(${APP.cx} ${BOTTONE_SI}) scale(${1 - 0.07 * tocco}) translate(${-APP.cx} ${-BOTTONE_SI})`}>
            <Pillola x={APP.cx} y={BOTTONE_SI} testo="Sì, è della ditta" corpo={18} fondo={TINTE.ok} colore={TINTE.carta} />
          </g>
        </Compare>
        <Compare v={molla(locale, no, fps)} cx={APP.cx} cy={BOTTONE_NO}>
          <Pillola x={APP.cx} y={BOTTONE_NO} testo="No, è privato" corpo={18} fondo={TINTE.carta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_SPESE_DITTA: Record<string, Disegno> = {
  "spese-regola": speseRegola,
  "spese-misto": speseMisto,
  "spese-ammortamento": speseAmmortamento,
  "spese-avs": speseAvs,
  "spese-natura": speseNatura,
  "spese-ricevute": speseRicevute,
};
