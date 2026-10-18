/**
 * I disegni della lezione 22 («Come dichiarare il reddito della ditta»), vedi
 * src/lezioni/dichiarazione-imposte.ts. Fonti: Istruzioni PF 2025 e Modulo 10
 * della Divisione delle contribuzioni, LT art. 198, pagina eTax PF e lo
 * strumento «I tuoi conti» (src/app/conti). Coordinate della tela 1000×700;
 * l'angolo in basso a sinistra (x < 300, y > 480) è della finestra di Bleo.
 * Niente cifre: le cifre del modulo, il termine e gli esercizi li dice solo
 * la voce (gli esercizi seguenti si vedono come sette barre).
 */
import type { ReactNode } from "react";
import { Avviso, Casa, Compare, Foglio, Freccia, Fumetto, molla, Moneta, Negozio, Palazzo, Persona, Pillola, Righe, Spunta, Testo, TINTE, tra, Valigetta } from "../figure";
import { Tela } from "./ditta-individuale";
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

/** Una firma scritta a mano (si disegna con `p` da 0 a 1), a partire da (x, y). */
function Firma({ x, y, s = 1, p = 1, linea = true }: { x: number; y: number; s?: number; p?: number; linea?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {linea ? <line x1={-10} y1={14} x2={110} y2={14} stroke={TINTE.tinta} strokeWidth={5} strokeLinecap="round" /> : null}
      <path
        d="M 0 6 C 10 -24 22 -24 18 2 C 16 18 30 -10 40 -6 C 50 -2 44 12 56 4 C 66 -4 70 -14 80 -2 C 86 6 94 2 100 -4"
        fill="none"
        stroke={TINTE.tratto}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
      />
    </g>
  );
}

/** Un calendario da muro, senza numeri; `segnato` (da 0 a 1) cerchia di rosso l'ultimo giorno. */
function Calendario({ cx, cy, s = 1, segnato = 0 }: { cx: number; cy: number; s?: number; segnato?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-64} y={-60} width={128} height={124} rx={14} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-64} y={-60} width={128} height={34} rx={14} fill={TINTE.accento} />
      {[-34, 34].map((x) => (
        <rect key={x} x={x - 5} y={-72} width={10} height={24} rx={5} fill={TINTE.tratto} />
      ))}
      {Array.from({ length: 12 }, (_, k) => (
        <rect key={k} x={-48 + (k % 4) * 26} y={-12 + Math.floor(k / 4) * 24} width={18} height={14} rx={4} fill={k === 11 && segnato > 0.5 ? TINTE.rischio : TINTE.tinta} />
      ))}
      {segnato > 0 ? (
        <circle cx={31} cy={43} r={16} fill="none" stroke={TINTE.rischio} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - segnato} />
      ) : null}
    </g>
  );
}

/** Un computer portatile centrato in (cx, cy); lo schermo va dentro (coordinate dal centro). */
function Portatile({ cx, cy, s = 1, children }: { cx: number; cy: number; s?: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-90} y={-72} width={180} height={116} rx={12} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <rect x={-90} y={-72} width={180} height={20} rx={10} fill={TINTE.tinta} />
      {children}
      <path d="M -112 48 H 112 l -14 16 H -98 Z" fill={TINTE.tratto} />
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

/** Un segno «più» (verde) o «meno» (rosso) in un tondo, centrato in (cx, cy). */
function Segno({ cx, cy, piu, r = 18 }: { cx: number; cy: number; piu: boolean; r?: number }) {
  const l = r * 0.5;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={piu ? TINTE.ok : TINTE.rischio} />
      <g stroke={TINTE.carta} strokeWidth={r * 0.26} strokeLinecap="round">
        <line x1={cx - l} y1={cy} x2={cx + l} y2={cy} />
        {piu ? <line x1={cx} y1={cy - l} x2={cx} y2={cy + l} /> : null}
      </g>
    </g>
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

/** Una graffetta (gli allegati), in (x, y), dritta. */
function Graffetta({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 6 -30 V 22 a 12 12 0 0 1 -24 0 V -36 a 8 8 0 0 1 16 0 V 14" fill="none" stroke={COLORE_TENUE} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** Una busta chiusa centrata in (cx, cy): la posta. */
function Busta({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-60} y={-40} width={120} height={80} rx={10} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
      <path d="M -56 -34 L 0 8 L 56 -34" fill="none" stroke={TINTE.tratto} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** Un orologio senza numeri centrato in (cx, cy): il tempo che manca. */
function Orologio({ cx, cy, r = 30 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={r * 0.18} />
      {[0, 1, 2, 3].map((k) => {
        const a = (k * Math.PI) / 2;
        return <line key={k} x1={cx + Math.cos(a) * r * 0.68} y1={cy + Math.sin(a) * r * 0.68} x2={cx + Math.cos(a) * r * 0.82} y2={cy + Math.sin(a) * r * 0.82} stroke={TINTE.tratto} strokeWidth={r * 0.1} strokeLinecap="round" />;
      })}
      <path d={`M ${cx} ${cy - r * 0.55} V ${cy} L ${cx + r * 0.4} ${cy + r * 0.22}`} fill="none" stroke={TINTE.accento} strokeWidth={r * 0.14} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** Un aeroplanino di carta (l'invio online), centrato in (cx, cy), che punta a destra. */
function Aeroplanino({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-14)`}>
      <path d="M -40 -6 L 44 -30 L -6 30 L -10 8 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} strokeLinejoin="round" />
      <path d="M -10 8 L 44 -30" fill="none" stroke={TINTE.tratto} strokeWidth={4} strokeLinecap="round" />
      <path d="M -10 8 L -14 26 L -6 30 Z" fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
}

/** Una chiave (la password), centrata in (cx, cy). */
function Chiave({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) rotate(-30)`}>
      <circle cx={-18} cy={0} r={14} fill="none" stroke={TINTE.oro} strokeWidth={7} />
      <path d="M -4 0 H 26 M 18 0 V 10 M 26 0 V 8" fill="none" stroke={TINTE.oro} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** Una cassetta delle lettere su un palo, con la fessura e la busta disegnata (piedi del palo in x, y). */
function Cassetta({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-9} y={-120} width={18} height={120} rx={6} fill={TINTE.tratto} />
      <path d="M -80 -120 V -196 a 34 34 0 0 1 34 -34 H 46 a 34 34 0 0 1 34 34 V -120 Z" fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-44} y={-212} width={88} height={14} rx={7} fill={TINTE.tratto} />
      <g transform="translate(0 -158) scale(0.42)">
        <rect x={-60} y={-40} width={120} height={80} rx={10} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={9} />
        <path d="M -56 -34 L 0 8 L 56 -34" fill="none" stroke={TINTE.accento} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </g>
  );
}

/* 2. «Nella dichiarazione, il reddito della ditta va alla cifra …: «Reddito da attività indipendente». Se la ditta è la tua attività principale, lo scrivi alla cifra …. Se è accessoria, per esempio accanto a un lavoro da dipendente, alla cifra ….» */
const DICH = { x: 340, y: 110, w: 230, h: 430, riga: 318 } as const;
const ZOOM = { x: 630, y: 150, w: 345, h: 400 } as const;
const dichCifra: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.3, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "tocca", quando: fra(ctx, null, 0, 0.75, 0.2) + 6, bersaglio: { x: DICH.x + 20, y: DICH.riga } },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.85, 0.92) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const foglio = fra(ctx, null, 0, 0.15, 0.06);
    const riga = fra(ctx, null, 0, 0.65, 0.2);
    const zoom = fra(ctx, 0, 1, 0.1, 0.32);
    const principale = fra(ctx, 1, 2, 0.35, 0.5);
    const spuntaP = fra(ctx, 1, 2, 0.85, 0.6);
    const accessoria = fra(ctx, 2, null, 0.25, 0.75);
    const lavoro = fra(ctx, 2, null, 0.55, 0.84);
    const spuntaA = fra(ctx, 2, null, 0.88, 0.92);
    const accesa = tra(locale, riga, riga + 10);
    const apre = tra(locale, zoom, zoom + 14);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Dove va il reddito" />
        <Compare v={molla(locale, foglio, fps, true)} cx={DICH.x + DICH.w / 2} cy={DICH.y + DICH.h / 2}>
          <Modulo x={DICH.x} y={DICH.y} w={DICH.w} h={DICH.h} nome="Dichiarazione">
            <Righe x={DICH.x + 24} y={DICH.y + 104} w={150} n={3} passo={34} />
            <Righe x={DICH.x + 24} y={DICH.riga + 62} w={150} n={4} passo={34} />
          </Modulo>
        </Compare>
        {/* La riga del reddito da attività indipendente. */}
        {foglio <= locale ? (
          <g>
            <rect
              x={DICH.x + 14}
              y={DICH.riga - 22}
              width={DICH.w - 28}
              height={44}
              rx={10}
              fill={accesa > 0 ? TINTE.crema : "none"}
              stroke={TINTE.accento}
              strokeWidth={5}
              opacity={Math.max(0.0, accesa)}
            />
            <line x1={DICH.x + 28} y1={DICH.riga} x2={DICH.x + 160} y2={DICH.riga} stroke={accesa > 0.5 ? TINTE.accento : TINTE.tinta} strokeWidth={10} strokeLinecap="round" />
            {accesa > 0 ? <Moneta cx={DICH.x + 190} cy={DICH.riga} r={14 * accesa} /> : null}
          </g>
        ) : null}
        {/* Lo zoom sulla riga. */}
        {apre > 0 ? (
          <path
            d={`M ${DICH.x + DICH.w - 14} ${DICH.riga - 22} L ${ZOOM.x} ${ZOOM.y} V ${ZOOM.y + ZOOM.h} L ${DICH.x + DICH.w - 14} ${DICH.riga + 22} Z`}
            fill={TINTE.crema}
            opacity={0.8 * apre}
          />
        ) : null}
        <Compare v={molla(locale, zoom + 4, fps, true)} cx={ZOOM.x + ZOOM.w / 2} cy={ZOOM.y + ZOOM.h / 2}>
          <rect x={ZOOM.x} y={ZOOM.y} width={ZOOM.w} height={ZOOM.h} rx={22} fill={TINTE.carta} stroke={TINTE.accento} strokeWidth={6} />
          <Righe2 x={ZOOM.x + ZOOM.w / 2} y={ZOOM.y + 46} righe={["Reddito da attività", "indipendente"]} corpo={28} passo={34} colore={TINTE.accento} />
        </Compare>
        {/* Attività principale: la ditta. */}
        <Compare v={molla(locale, principale, fps)} cx={ZOOM.x + ZOOM.w / 2} cy={ZOOM.y + 172}>
          <rect x={ZOOM.x + 18} y={ZOOM.y + 128} width={ZOOM.w - 36} height={88} rx={16} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={4} />
          <Negozio x={ZOOM.x + 66} y={ZOOM.y + 204} s={0.3} />
          <Testo x={ZOOM.x + 118} y={ZOOM.y + 173} corpo={28} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Principale
          </Testo>
          <Spunta cx={ZOOM.x + ZOOM.w - 52} cy={ZOOM.y + 172} r={20} p={tra(locale, spuntaP, spuntaP + 14)} />
        </Compare>
        {/* Attività accessoria: accanto a un lavoro da dipendente. */}
        <Compare v={molla(locale, accessoria, fps)} cx={ZOOM.x + ZOOM.w / 2} cy={ZOOM.y + 300}>
          <rect x={ZOOM.x + 18} y={ZOOM.y + 236} width={ZOOM.w - 36} height={130} rx={16} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={4} />
          <Negozio x={ZOOM.x + 66} y={ZOOM.y + 300} s={0.3} />
          <Testo x={ZOOM.x + 118} y={ZOOM.y + 272} corpo={28} titolo peso={800} colore={TINTE.accento} ancora="start">
            Accessoria
          </Testo>
          <Spunta cx={ZOOM.x + ZOOM.w - 52} cy={ZOOM.y + 272} r={20} p={tra(locale, spuntaA, spuntaA + 14)} colore={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, lavoro, fps)} cx={ZOOM.x + 160} cy={ZOOM.y + 336}>
          <Valigetta x={ZOOM.x + 66} y={ZOOM.y + 356} s={0.62} />
          <Testo x={ZOOM.x + 118} y={ZOOM.y + 334} corpo={21} peso={700} colore={COLORE_TENUE} ancora="start">
            accanto a un lavoro
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Quale reddito? L'utile netto: quello che hai incassato, meno le spese che ti sono servite per guadagnarlo. Le spese private e le imposte, invece, non le puoi togliere.» */
const RIGA_UTILE = 250;
const dichUtile: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.85, 0.6),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.15, 0.2) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.75, 0.9) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const utile = fra(ctx, 0, 1, 0.12, 0.2);
    const incassi = fra(ctx, 0, 1, 0.65, 0.32);
    const spese = fra(ctx, 1, 2, 0.15, 0.45);
    const uguale = fra(ctx, 1, 2, 0.85, 0.6);
    const privato = fra(ctx, 2, null, 0.15, 0.7);
    const imposte = fra(ctx, 2, null, 0.35, 0.78);
    const no = fra(ctx, 2, null, 0.7, 0.88);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Quale reddito?" />
        {/* Gli incassi. */}
        <Compare v={molla(locale, incassi, fps)} cx={400} cy={RIGA_UTILE}>
          <Moneta cx={372} cy={RIGA_UTILE + 30} r={26} />
          <Moneta cx={428} cy={RIGA_UTILE + 30} r={26} />
          <Moneta cx={400} cy={RIGA_UTILE - 14} r={26} />
          <FrecciaSoldi cx={400} cy={RIGA_UTILE - 92} su s={0.8} />
          <Pillola x={400} y={RIGA_UTILE + 100} testo="Incassi" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Meno le spese della ditta. */}
        <Compare v={molla(locale, spese, fps)} cx={505} cy={RIGA_UTILE}>
          <line x1={488} y1={RIGA_UTILE} x2={522} y2={RIGA_UTILE} stroke={TINTE.rischio} strokeWidth={10} strokeLinecap="round" />
        </Compare>
        <Compare v={molla(locale, spese + 4, fps)} cx={615} cy={RIGA_UTILE}>
          <Foglio x={570} y={RIGA_UTILE - 70} w={90} h={120}>
            <Righe x={584} y={RIGA_UTILE - 22} w={46} n={3} passo={22} />
          </Foglio>
          <FrecciaSoldi cx={615} cy={RIGA_UTILE - 102} su={false} s={0.6} />
          <Pillola x={615} y={RIGA_UTILE + 100} testo="Spese della ditta" corpo={22} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        {/* Uguale: l'utile netto. */}
        <Compare v={molla(locale, uguale, fps)} cx={728} cy={RIGA_UTILE}>
          <g stroke={TINTE.tratto} strokeWidth={10} strokeLinecap="round">
            <line x1={713} y1={RIGA_UTILE - 10} x2={743} y2={RIGA_UTILE - 10} />
            <line x1={713} y1={RIGA_UTILE + 10} x2={743} y2={RIGA_UTILE + 10} />
          </g>
        </Compare>
        <Compare v={molla(locale, utile, fps)} cx={878} cy={RIGA_UTILE}>
          <Pillola x={878} y={RIGA_UTILE} testo="Utile netto" corpo={28} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        {/* Non si tolgono: le spese private e le imposte. */}
        <Compare v={molla(locale, privato, fps)} cx={470} cy={520}>
          <Casa x={470} y={545} s={0.95} />
          <Pillola x={470} y={590} testo="Spese private" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <No cx={526} cy={448} r={24} p={tra(locale, no, no + 14)} />
        <Compare v={molla(locale, imposte, fps)} cx={760} cy={520}>
          <Modulo x={712} y={430} w={96} h={124} nome="" corpo={14}>
            <Righe x={726} y={490} w={50} n={2} passo={22} />
          </Modulo>
          <Pillola x={760} y={590} testo="Imposte" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        <No cx={816} cy={448} r={24} p={tra(locale, no + 6, no + 20)} />
      </Tela>
    );
  },
};

/* 4. «E se un anno chiudi in perdita, per esempio il primo? Scrivi l'importo con il segno meno davanti. E le perdite dei … esercizi precedenti, se non le hai ancora compensate, le puoi dedurre dal reddito.» */
const ASSE = { y: 300, inizio: 340, fine: 975 } as const;
const BARRE = { x0: 395, passo: 80, w: 50, perdita: 110, altezze: [70, 95, 110, 125, 120, 140, 150] } as const;
const dichPerdita: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.5, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.7, 0.2) + 4 },
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.55, 0.4) },
      { tipo: "festeggia", quando: fra(ctx, 2, null, 0.9, 0.93) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const asse = fra(ctx, null, 0, 0.15, 0.05);
    const cade = fra(ctx, null, 0, 0.45, 0.15);
    const campo = fra(ctx, 0, 1, 0.15, 0.32);
    const meno = fra(ctx, 0, 1, 0.55, 0.4);
    const barre = fra(ctx, 1, 2, 0.05, 0.6);
    const fineBarre = fra(ctx, 2, null, 0.15, 0.72);
    const dedotta = fra(ctx, 2, null, 0.55, 0.85);
    const ogni = Math.max(2, (fineBarre - barre) / BARRE.altezze.length);
    const giu = tra(locale, cade, cade + 18);
    const scende = tra(locale, dedotta, dedotta + 20);
    const primaX = BARRE.x0 + BARRE.passo;
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Una perdita" />
        {/* L'asse dello zero. */}
        <line x1={ASSE.inizio} y1={ASSE.y} x2={ASSE.inizio + (ASSE.fine - ASSE.inizio) * tra(locale, asse, asse + 16)} y2={ASSE.y} stroke={TINTE.tratto} strokeWidth={6} strokeLinecap="round" />
        {/* L'anno in perdita: la barra scende sotto lo zero. */}
        {giu > 0 ? (
          <rect x={BARRE.x0 - BARRE.w / 2} y={ASSE.y} width={BARRE.w} height={BARRE.perdita * giu} rx={8} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={5} />
        ) : null}
        <Compare v={molla(locale, cade + 10, fps)} cx={BARRE.x0} cy={ASSE.y + BARRE.perdita + 38}>
          <Pillola x={BARRE.x0} y={ASSE.y + BARRE.perdita + 38} testo="Perdita" corpo={22} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        {/* Nel modulo: l'importo con il segno meno davanti. */}
        <Compare v={molla(locale, campo, fps)} cx={470} cy={560}>
          <rect x={330} y={520} width={280} height={80} rx={16} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={5} />
          <Importo x={430} y={560} n={4} />
        </Compare>
        <Compare v={molla(locale, meno, fps)} cx={378} cy={560}>
          <line x1={362} y1={560} x2={394} y2={560} stroke={TINTE.rischio} strokeWidth={10} strokeLinecap="round" />
        </Compare>
        <Compare v={molla(locale, meno + 6, fps)} cx={470} cy={638}>
          <Testo x={470} y={638} corpo={22} peso={700} colore={COLORE_TENUE}>
            Con il segno meno davanti
          </Testo>
        </Compare>
        {/* Gli esercizi seguenti: barre di utile. */}
        {BARRE.altezze.map((h, k) => {
          const quando = barre + ogni * k;
          const cresce = tra(locale, quando, quando + 14);
          const x = BARRE.x0 + BARRE.passo * (k + 1);
          return cresce > 0 ? <rect key={x} x={x - BARRE.w / 2} y={ASSE.y - h * cresce} width={BARRE.w} height={h * cresce} rx={8} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} /> : null;
        })}
        {/* La perdita si deduce dal reddito degli anni dopo. */}
        <Freccia d={`M ${BARRE.x0 + BARRE.w / 2 + 8} ${ASSE.y + BARRE.perdita - 14} C ${BARRE.x0 + 70} ${ASSE.y + BARRE.perdita - 10} ${primaX} ${ASSE.y + 70} ${primaX} ${ASSE.y + 16}`} p={tra(locale, dedotta - 10, dedotta + 6)} colore={TINTE.rischio} spessore={6} />
        {scende > 0 ? (
          <g>
            <rect x={primaX - BARRE.w / 2} y={ASSE.y - BARRE.altezze[0]} width={BARRE.w} height={BARRE.altezze[0] * scende} rx={8} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={5} />
            <rect x={primaX + BARRE.passo - BARRE.w / 2} y={ASSE.y - BARRE.altezze[1]} width={BARRE.w} height={(BARRE.perdita - BARRE.altezze[0]) * scende} rx={8} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={5} />
          </g>
        ) : null}
        <Compare v={molla(locale, fineBarre, fps)} cx={720} cy={130}>
          <path d={`M ${primaX - 30} 150 V 136 H ${BARRE.x0 + BARRE.passo * 7 + 30} V 150`} fill="none" stroke={TINTE.ok} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <Pillola x={(primaX + BARRE.x0 + BARRE.passo * 7) / 2} y={112} testo="Esercizi seguenti" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, dedotta + 12, fps)} cx={660} cy={370}>
          <Pillola x={660} y={370} testo="Dedotta dal reddito" corpo={22} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Ricordi la lezione sulla contabilità? Se tieni solo quella semplificata, senza contabilità commerciale, compili il Modulo …: il «Questionario per indipendenti senza contabilità». Parti dai pagamenti dei clienti, togli merci e spese generali, e trovi il reddito da riportare alla cifra ….» */
const QUEST = { x: 340, y: 170, w: 420, h: 450 } as const;
const VOCI_QUEST = [
  { y: 330, piu: true, testo: "Pagamenti dei clienti" },
  { y: 390, piu: false, testo: "Merci e materiali" },
  { y: 450, piu: false, testo: "Spese generali" },
] as const;
const dichModulo10: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.3, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.3, 0.45) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.85, 0.92) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const ricordi = fra(ctx, null, 0, 0.35, 0.06);
    const scelta = fra(ctx, 0, 1, 0.4, 0.2);
    const modulo = fra(ctx, 1, 2, 0.15, 0.38);
    const sottotitolo = fra(ctx, 1, 2, 0.6, 0.48);
    const voci = [fra(ctx, 2, 3, 0.1, 0.62), fra(ctx, 2, 3, 0.5, 0.7), fra(ctx, 2, 3, 0.75, 0.76)];
    const reddito = fra(ctx, 3, null, 0.2, 0.84);
    const riporta = fra(ctx, 3, null, 0.6, 0.9);
    const sbiadisce = 1 - 0.65 * tra(locale, scelta, scelta + 10);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Il questionario" />
        {/* Ricordi? Semplificata o completa. */}
        <Compare v={molla(locale, ricordi, fps)} cx={450} cy={115}>
          <Pillola x={450} y={115} testo="Semplificata" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        <g opacity={sbiadisce}>
          <Compare v={molla(locale, ricordi + 6, fps)} cx={660} cy={115}>
            <Pillola x={660} y={115} testo="Completa" corpo={24} fondo={TINTE.accento} colore={TINTE.carta} />
          </Compare>
        </g>
        <Spunta cx={560} cy={115} r={16} p={tra(locale, scelta, scelta + 14)} />
        {/* Il questionario per indipendenti senza contabilità. */}
        <Compare v={molla(locale, modulo, fps, true)} cx={QUEST.x + QUEST.w / 2} cy={QUEST.y + QUEST.h / 2}>
          <Modulo x={QUEST.x} y={QUEST.y} w={QUEST.w} h={QUEST.h} nome="Questionario" corpo={24} />
        </Compare>
        <Compare v={molla(locale, sottotitolo, fps)} cx={QUEST.x + 190} cy={QUEST.y + 96}>
          <Testo x={QUEST.x + 26} y={QUEST.y + 96} corpo={21} peso={700} colore={COLORE_TENUE} ancora="start">
            Per indipendenti senza contabilità
          </Testo>
        </Compare>
        {VOCI_QUEST.map((v, i) => (
          <Compare key={v.testo} v={molla(locale, voci[i], fps)} cx={QUEST.x + 60} cy={v.y}>
            <Segno cx={QUEST.x + 44} cy={v.y} piu={v.piu} r={17} />
            <Testo x={QUEST.x + 74} y={v.y + 1} corpo={24} titolo peso={800} colore={TINTE.tratto} ancora="start">
              {v.testo}
            </Testo>
            <Importo x={QUEST.x + 350} y={v.y} />
          </Compare>
        ))}
        {/* Il risultato: il reddito. */}
        <g opacity={tra(locale, reddito - 6, reddito + 4)}>
          <line x1={QUEST.x + 24} y1={498} x2={QUEST.x + QUEST.w - 24} y2={498} stroke={TINTE.tratto} strokeWidth={5} strokeLinecap="round" />
        </g>
        <Compare v={molla(locale, reddito, fps)} cx={QUEST.x + QUEST.w / 2} cy={552}>
          <rect x={QUEST.x + 18} y={524} width={QUEST.w - 36} height={56} rx={14} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={5} />
          <Testo x={QUEST.x + 40} y={553} corpo={26} titolo peso={800} colore={TINTE.accento} ancora="start">
            Reddito
          </Testo>
          <Importo x={QUEST.x + 350} y={552} />
        </Compare>
        {/* Da riportare nella dichiarazione. */}
        <Freccia d={`M ${QUEST.x + QUEST.w + 6} 552 C 800 552 830 520 846 470`} p={tra(locale, riporta, riporta + 14)} colore={TINTE.accento} spessore={7} />
        <Compare v={molla(locale, riporta + 8, fps)} cx={885} cy={360}>
          <Modulo x={810} y={250} w={150} h={200} nome="" corpo={14}>
            <Righe x={828} y={320} w={84} n={1} />
            <rect x={822} y={350} width={126} height={34} rx={8} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={4} />
            <line x1={834} y1={367} x2={900} y2={367} stroke={TINTE.accento} strokeWidth={9} strokeLinecap="round" />
            <Righe x={828} y={412} w={84} n={1} />
          </Modulo>
          <Testo x={885} y={226} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Dichiarazione
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Il questionario lo firmi e lo alleghi alla dichiarazione, con le distinte firmate dell'anno: attivi e passivi, entrate e uscite, apporti e prelevamenti privati. Se invece tieni la contabilità commerciale, alleghi i conti annuali firmati: il bilancio e il conto economico.» */
const DISTINTE = [
  { x: 488, righe: ["Attivi", "e passivi"] },
  { x: 598, righe: ["Entrate", "e uscite"] },
  { x: 708, righe: ["Apporti e", "prelevamenti"] },
] as const;
const CONTI = [
  { x: 380, righe: ["Bilancio"] },
  { x: 540, righe: ["Conto", "economico"] },
] as const;
const DICH6 = { x: 840, y: 250, w: 130, h: 170 } as const;
const dichAllegati: Disegno = {
  chiave: (ctx) => fra(ctx, 1, 2, 0.5, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.5, 0.15) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.9, 0.93) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const dich = fra(ctx, null, 0, 0.1, 0.04);
    const quest = fra(ctx, null, 0, 0.25, 0.08);
    const firma = fra(ctx, null, 0, 0.45, 0.12);
    const allegaQ = fra(ctx, null, 0, 0.8, 0.18);
    const distinte = fra(ctx, 0, 1, 0.2, 0.25);
    const etichette = [fra(ctx, 1, 2, 0.08, 0.32), fra(ctx, 1, 2, 0.38, 0.4), fra(ctx, 1, 2, 0.66, 0.48)];
    const allegaD = fra(ctx, 1, 2, 0.95, 0.55);
    const commerciale = fra(ctx, 2, 3, 0.25, 0.62);
    const conti = fra(ctx, 3, null, 0.2, 0.72);
    const firmaC = fra(ctx, 3, null, 0.4, 0.8);
    const allegaC = fra(ctx, 3, null, 0.75, 0.9);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Cosa alleghi" />
        {/* La dichiarazione con la graffetta. */}
        <Compare v={molla(locale, dich, fps)} cx={DICH6.x + DICH6.w / 2} cy={DICH6.y + DICH6.h / 2}>
          <Modulo x={DICH6.x} y={DICH6.y} w={DICH6.w} h={DICH6.h} nome="" corpo={14}>
            <Righe x={DICH6.x + 18} y={DICH6.y + 80} w={80} n={4} passo={24} />
          </Modulo>
          <Graffetta x={DICH6.x + 26} y={DICH6.y - 6} s={1.1} />
          <Testo x={DICH6.x + DICH6.w / 2} y={DICH6.y + DICH6.h + 30} corpo={22} titolo peso={800} colore={TINTE.tratto}>
            Dichiarazione
          </Testo>
        </Compare>
        {/* Il questionario, firmato. */}
        <Compare v={molla(locale, quest, fps)} cx={395} cy={180}>
          <Modulo x={340} y={110} w={110} h={140} nome="" corpo={14}>
            <Righe x={356} y={176} w={60} n={3} passo={22} />
          </Modulo>
          <Testo x={395} y={272} corpo={20} titolo peso={800} colore={TINTE.tratto}>
            Questionario
          </Testo>
        </Compare>
        <Firma x={350} y={226} s={0.7} p={tra(locale, firma, firma + 18)} linea={false} />
        {/* Le distinte dell'anno, firmate. */}
        {DISTINTE.map((d, i) => (
          <g key={d.x}>
            <Compare v={molla(locale, distinte + i * 5, fps)} cx={d.x + 40} cy={170}>
              <Foglio x={d.x} y={115} w={80} h={104}>
                <Righe x={d.x + 12} y={160} w={40} n={2} passo={20} />
              </Foglio>
              <Firma x={d.x + 12} y={196} s={0.5} p={tra(locale, distinte + i * 5 + 8, distinte + i * 5 + 24)} linea={false} />
            </Compare>
            <Compare v={molla(locale, etichette[i], fps)} cx={d.x + 40} cy={252}>
              <Righe2 x={d.x + 40} y={244} righe={[...d.righe]} corpo={19} passo={24} />
            </Compare>
          </g>
        ))}
        <Freccia d={`M 400 300 C 460 350 700 350 ${DICH6.x - 16} ${DICH6.y + 50}`} p={tra(locale, allegaQ, allegaQ + 16)} colore={TINTE.ok} spessore={7} />
        <Freccia d={`M 796 168 C 816 172 826 196 ${DICH6.x - 8} ${DICH6.y + 4}`} p={tra(locale, allegaD, allegaD + 12)} colore={TINTE.ok} spessore={7} />
        {/* Con la contabilità commerciale: i conti annuali firmati. */}
        <Compare v={molla(locale, commerciale, fps)} cx={500} cy={400}>
          <Pillola x={500} y={400} testo="Contabilità commerciale" corpo={22} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
        {CONTI.map((c, i) => (
          <Compare key={c.x} v={molla(locale, conti + i * 6, fps)} cx={c.x + 55} cy={510}>
            <Foglio x={c.x} y={448} w={110} h={124}>
              <Righe x={c.x + 16} y={494} w={56} n={2} passo={22} />
            </Foglio>
            <Righe2 x={c.x + 55} y={c.righe.length === 1 ? 600 : 596} righe={[...c.righe]} corpo={20} passo={24} />
          </Compare>
        ))}
        {CONTI.map((c, i) => (
          <Firma key={c.x} x={c.x + 16} y={540} s={0.6} p={tra(locale, firmaC + i * 6, firmaC + i * 6 + 18)} linea={false} />
        ))}
        <Freccia d={`M 680 520 C 760 520 820 500 ${DICH6.x + 40} ${DICH6.y + DICH6.h + 52}`} p={tra(locale, allegaC, allegaC + 14)} colore={TINTE.accento} spessore={7} />
      </Tela>
    );
  },
};

/* 7. «Il termine per consegnarla è scritto a pagina … del modulo. Per la dichiarazione … era il …. Se per motivi giustificati non ce la fai, puoi chiedere una proroga online.» */
const PAGINA = { x: 340, y: 110, w: 250, h: 340 } as const;
const BOX_TERMINE = { x: 440, y: 186, w: 128, h: 50 } as const;
const dichTermine: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.65, 0.25),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.65, 0.25) },
      { tipo: "festeggia", quando: fra(ctx, 1, null, 0.45, 0.8) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const pagina = fra(ctx, null, 0, 0.2, 0.06);
    const box = fra(ctx, null, 0, 0.55, 0.2);
    const prima = fra(ctx, null, 0, 0.75, 0.26);
    const calendario = fra(ctx, 0, 1, 0.15, 0.4);
    const segna = fra(ctx, 0, 1, 0.6, 0.5);
    const proroga = fra(ctx, 1, null, 0.35, 0.78);
    const motivi = fra(ctx, 1, null, 0.1, 0.7);
    const accesa = tra(locale, box, box + 10);
    const apre = tra(locale, calendario, calendario + 12);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Entro il termine" />
        <Compare v={molla(locale, pagina, fps, true)} cx={PAGINA.x + PAGINA.w / 2} cy={PAGINA.y + PAGINA.h / 2}>
          <Modulo x={PAGINA.x} y={PAGINA.y} w={PAGINA.w} h={PAGINA.h} nome="Dichiarazione" corpo={18}>
            <Righe x={PAGINA.x + 22} y={PAGINA.y + 160} w={180} n={6} passo={30} />
          </Modulo>
        </Compare>
        {/* Il termine, in alto nella prima pagina. */}
        {accesa > 0 ? (
          <g opacity={accesa}>
            <rect x={BOX_TERMINE.x} y={BOX_TERMINE.y} width={BOX_TERMINE.w} height={BOX_TERMINE.h} rx={10} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={5} />
            <Calendario cx={BOX_TERMINE.x + 30} cy={BOX_TERMINE.y + 26} s={0.26} />
            <line x1={BOX_TERMINE.x + 62} y1={BOX_TERMINE.y + 25} x2={BOX_TERMINE.x + 108} y2={BOX_TERMINE.y + 25} stroke={TINTE.rischio} strokeWidth={9} strokeLinecap="round" />
          </g>
        ) : null}
        <Compare v={molla(locale, prima, fps)} cx={PAGINA.x + PAGINA.w / 2} cy={PAGINA.y + PAGINA.h + 40}>
          <Pillola x={PAGINA.x + PAGINA.w / 2} y={PAGINA.y + PAGINA.h + 40} testo="Prima pagina" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        {/* Lo zoom sul calendario. */}
        {apre > 0 ? (
          <path d={`M ${BOX_TERMINE.x + BOX_TERMINE.w} ${BOX_TERMINE.y} L 700 120 V 330 L ${BOX_TERMINE.x + BOX_TERMINE.w} ${BOX_TERMINE.y + BOX_TERMINE.h} Z`} fill={TINTE.rischioTenue} opacity={0.6 * apre} />
        ) : null}
        <Compare v={molla(locale, calendario, fps)} cx={790} cy={230}>
          <Calendario cx={790} cy={232} s={1.25} segnato={tra(locale, segna, segna + 16)} />
        </Compare>
        <Compare v={molla(locale, segna + 10, fps)} cx={790} cy={350}>
          <Pillola x={790} y={350} testo="Il termine" corpo={22} fondo={TINTE.rischio} colore={TINTE.carta} />
        </Compare>
        {/* Per motivi giustificati: la proroga online. */}
        <Compare v={molla(locale, motivi, fps)} cx={790} cy={530}>
          <Portatile cx={790} cy={530} s={0.78}>
            <circle cx={0} cy={-12} r={30} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
            <path d="M 0 -32 V -12 L 16 -2" fill="none" stroke={TINTE.accento} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </Portatile>
        </Compare>
        <Compare v={molla(locale, proroga, fps)} cx={790} cy={622}>
          <Pillola x={790} y={622} testo="Proroga online" corpo={24} fondo={TINTE.ok} colore={TINTE.carta} />
          <Testo x={790} y={668} corpo={20} peso={700} colore={COLORE_TENUE}>
            Solo per motivi giustificati
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 8. «Attenzione: la dichiarazione va consegnata anche se il modulo non ti è arrivato. In quel caso chiedilo al tuo Ufficio circondariale di tassazione.» */
const dichSenzaModulo: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.6, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: fra(ctx, null, 0, 0.6, 0.35) + 4 },
      { tipo: "festeggia", quando: fra(ctx, 0, null, 0.9, 0.93) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const cassetta = fra(ctx, null, 0, 0.15, 0.06);
    const vuota = fra(ctx, null, 0, 0.6, 0.3);
    const avviso = fra(ctx, null, 0, 0.35, 0.18);
    const ufficio = fra(ctx, 0, null, 0.2, 0.62);
    const chiedi = fra(ctx, 0, null, 0.45, 0.75);
    const arriva = fra(ctx, 0, null, 0.7, 0.86);
    const vola = tra(locale, arriva, arriva + 22);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Anche senza modulo" />
        <Compare v={molla(locale, avviso, fps)} cx={490} cy={128}>
          <Avviso x={300} y={130} s={0.62} />
          <Pillola x={512} y={128} testo="Va consegnata lo stesso" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
        {/* La cassetta delle lettere: il modulo non è arrivato. */}
        <Compare v={molla(locale, cassetta, fps, true)} cx={450} cy={440}>
          <Cassetta x={450} y={610} s={1.05} />
        </Compare>
        <Compare v={molla(locale, vuota, fps)} cx={560} cy={300}>
          <Fumetto cx={566} cy={290} r={40}>
            <Testo x={566} y={293} corpo={46} titolo peso={800} colore={TINTE.tratto}>
              ?
            </Testo>
          </Fumetto>
        </Compare>
        <No cx={496} cy={420} r={24} p={tra(locale, vuota + 6, vuota + 20)} />
        {/* Chiedilo all'ufficio. */}
        <Compare v={molla(locale, ufficio, fps)} cx={820} cy={420}>
          <Palazzo x={820} y={480} s={0.9} />
          <Pillola x={820} y={532} testo="Ufficio di tassazione" corpo={22} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 600 360 Q 650 300 712 330" p={tra(locale, chiedi, chiedi + 14)} colore={TINTE.accento} spessore={7} />
        <Compare v={molla(locale, chiedi + 6, fps)} cx={655} cy={268}>
          <Testo x={655} y={262} corpo={24} titolo peso={800} colore={TINTE.accento}>
            Chiedilo
          </Testo>
        </Compare>
        {/* Il modulo arriva. */}
        {arriva <= locale ? (
          <g transform={`translate(${720 - 200 * vola} ${600 - 30 * Math.sin(vola * Math.PI)})`} opacity={Math.min(1, (locale - arriva) / 6)}>
            <Modulo x={-40} y={-50} w={80} h={100} nome="" corpo={10}>
              <Righe x={-28} y={8} w={36} n={2} passo={18} />
            </Modulo>
          </g>
        ) : null}
        <Spunta cx={560} cy={566} r={20} p={tra(locale, arriva + 22, arriva + 34)} />
      </Tela>
    );
  },
};

/* 9. «Puoi compilarla al computer con il programma eTax del Cantone e inviarla online, con tutti gli allegati: niente da spedire per posta. Ti servono il numero di registro e la password scritti a pagina …. Controlla bene prima: l'invio online si fa una sola volta.» */
const PC = { cx: 560, cy: 290, s: 1.35 } as const;
const dichEtax: Disegno = {
  chiave: (ctx) => fra(ctx, null, 0, 0.75, 0.25),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, null, 0, 0.75, 0.25) },
      { tipo: "lancia", quando: fra(ctx, 1, 2, 0.45, 0.6) },
      { tipo: "scuoti", quando: fra(ctx, 2, null, 0.7, 0.9) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const pc = fra(ctx, null, 0, 0.3, 0.08);
    const invia = fra(ctx, null, 0, 0.8, 0.22);
    const allegati = fra(ctx, 0, 1, 0.2, 0.35);
    const posta = fra(ctx, 0, 1, 0.65, 0.42);
    const pagina = fra(ctx, 1, 2, 0.1, 0.52);
    const registro = fra(ctx, 1, 2, 0.4, 0.6);
    const password = fra(ctx, 1, 2, 0.7, 0.66);
    const entra = fra(ctx, 1, 2, 0.95, 0.72);
    const unaVolta = fra(ctx, 2, null, 0.5, 0.88);
    const volo = tra(locale, invia, invia + 24);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Online con eTax" />
        <Compare v={molla(locale, pc, fps, true)} cx={PC.cx} cy={PC.cy}>
          <Portatile cx={PC.cx} cy={PC.cy} s={PC.s}>
            <Testo x={0} y={-6} corpo={40} titolo peso={800} colore={TINTE.tratto}>
              eTax
            </Testo>
          </Portatile>
        </Compare>
        {/* L'invio online, con gli allegati. */}
        {invia <= locale ? (
          <g opacity={Math.min(1, (locale - invia) / 6)}>
            <Freccia d={`M ${PC.cx + 160} ${PC.cy - 40} Q 790 170 850 190`} p={volo} colore={TINTE.tratto} spessore={5} tratteggio />
            <Aeroplanino cx={PC.cx + 170 + 160 * volo} cy={PC.cy - 50 - 70 * volo} s={0.9} />
          </g>
        ) : null}
        <Compare v={molla(locale, allegati, fps)} cx={870} cy={290}>
          <Graffetta x={846} y={284} s={0.9} />
          <Testo x={878} y={290} corpo={22} titolo peso={800} colore={TINTE.tratto} ancora="start">
            Allegati
          </Testo>
          <Spunta cx={865} cy={336} r={18} p={tra(locale, allegati + 6, allegati + 18)} />
        </Compare>
        <Compare v={molla(locale, posta, fps)} cx={880} cy={430}>
          <Busta cx={880} cy={430} s={0.62} />
        </Compare>
        <No cx={912} cy={404} r={20} p={tra(locale, posta + 6, posta + 20)} />
        {/* Numero di registro e password: dalla prima pagina. */}
        <Compare v={molla(locale, pagina, fps)} cx={385} cy={520}>
          <Modulo x={330} y={455} w={110} h={135} nome="" corpo={12}>
            <rect x={346} y={510} width={60} height={14} rx={7} fill={TINTE.accento} />
            <rect x={346} y={536} width={44} height={14} rx={7} fill={TINTE.oro} />
            <Righe x={346} y={566} w={40} n={1} />
          </Modulo>
        </Compare>
        <Compare v={molla(locale, registro, fps)} cx={600} cy={490}>
          <Pillola x={600} y={490} testo="Numero di registro" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Compare v={molla(locale, password, fps)} cx={600} cy={556}>
          <Chiave cx={528} cy={556} s={0.9} />
          <Pillola x={620} y={556} testo="Password" corpo={22} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 600 462 Q 600 430 592 402" p={tra(locale, entra, entra + 12)} colore={TINTE.tratto} spessore={6} />
        {/* Una sola volta. */}
        <Compare v={molla(locale, unaVolta, fps)} cx={800} cy={620}>
          <Avviso x={682} y={622} s={0.55} />
          <Pillola x={820} y={622} testo="Una sola volta" corpo={24} fondo={TINTE.rischioTenue} colore={TINTE.rischio} bordo={TINTE.rischio} />
        </Compare>
      </Tela>
    );
  },
};

/* 10. «Bleo ha uno strumento, «I tuoi conti». A fine anno, nella parte «Scarica per il fiduciario», scarichi un file con le entrate e le uscite della ditta: le voci private non ci sono. Lo puoi dare al fiduciario che ti aiuta.» */
const APP = { x: 330, y: 95, w: 360, h: 470 } as const;
const VOCI_APP = [
  { y: 200, su: true, privato: false },
  { y: 256, su: false, privato: false },
  { y: 312, su: false, privato: true },
  { y: 368, su: true, privato: false },
] as const;
const dichStrumento: Disegno = {
  chiave: (ctx) => fra(ctx, 0, 1, 0.75, 0.35),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: fra(ctx, 0, 1, 0.75, 0.35) },
      { tipo: "festeggia", quando: fra(ctx, 3, null, 0.85, 0.92) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const app = fra(ctx, null, 0, 0.35, 0.08);
    const voci = fra(ctx, null, 0, 0.7, 0.14);
    const bottone = fra(ctx, 0, 1, 0.45, 0.3);
    const premuto = fra(ctx, 0, 1, 0.85, 0.36);
    const file = fra(ctx, 1, 2, 0.2, 0.5);
    const etichetta = fra(ctx, 1, 2, 0.75, 0.58);
    const privato = fra(ctx, 2, 3, 0.25, 0.7);
    const fiduciario = fra(ctx, 3, null, 0.25, 0.82);
    const consegna = fra(ctx, 3, null, 0.6, 0.9);
    const tocco = tra(locale, premuto, premuto + 6) - tra(locale, premuto + 6, premuto + 12);
    const fuori = tra(locale, privato + 8, privato + 22);
    return (
      <Tela>
        <Titolo locale={locale} fps={fps} testo="Lo strumento di Bleo" />
        <Compare v={molla(locale, app, fps, true)} cx={APP.x + APP.w / 2} cy={APP.y + APP.h / 2}>
          <rect x={APP.x} y={APP.y} width={APP.w} height={APP.h} rx={26} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
          <path d={`M ${APP.x + 3} ${APP.y + 62} V ${APP.y + 24} q 0 -21 21 -21 H ${APP.x + APP.w - 24} q 21 0 21 21 V ${APP.y + 62} Z`} fill={TINTE.tratto} />
          <Testo x={APP.x + APP.w / 2} y={APP.y + 34} corpo={28} titolo peso={800} colore={TINTE.carta}>
            I tuoi conti
          </Testo>
        </Compare>
        {/* Le voci dell'anno. */}
        {VOCI_APP.map((v, i) => (
          <Compare key={v.y} v={molla(locale, voci + i * 4, fps)} cx={APP.x + APP.w / 2} cy={v.y}>
            <g opacity={v.privato ? 1 - 0.75 * fuori : 1}>
              <rect x={APP.x + 20} y={v.y - 22} width={APP.w - 40} height={44} rx={12} fill={v.privato ? TINTE.crema : TINTE.tinta} stroke={v.privato ? TINTE.accento : "none"} strokeWidth={3} />
              {v.privato ? (
                <Testo x={APP.x + 46} y={v.y + 1} corpo={22} titolo peso={800} colore={TINTE.accento} ancora="start">
                  Privato
                </Testo>
              ) : (
                <g>
                  <FrecciaSoldi cx={APP.x + 46} cy={v.y} su={v.su} s={0.5} />
                  <line x1={APP.x + 78} y1={v.y} x2={APP.x + 200} y2={v.y} stroke={TINTE.carta} strokeWidth={10} strokeLinecap="round" />
                </g>
              )}
              <Importo x={APP.x + 270} y={v.y} />
            </g>
          </Compare>
        ))}
        <No cx={APP.x + APP.w - 26} cy={VOCI_APP[2].y - 18} r={20} p={tra(locale, privato, privato + 14)} />
        {/* Scarica per il fiduciario. */}
        <Compare v={molla(locale, bottone, fps)} cx={APP.x + APP.w / 2} cy={480}>
          <g transform={`translate(${APP.x + APP.w / 2} 480) scale(${1 - 0.06 * tocco}) translate(${-(APP.x + APP.w / 2)} -480)`}>
            <Pillola x={APP.x + APP.w / 2} y={480} testo="Scarica per il fiduciario" corpo={21} fondo={TINTE.accento} colore={TINTE.carta} />
          </g>
        </Compare>
        {/* Il file, senza le voci private. */}
        <Freccia d={`M ${APP.x + APP.w + 8} 470 C 760 470 790 420 790 352`} p={tra(locale, file - 8, file + 6)} colore={TINTE.accento} spessore={6} />
        <Compare v={molla(locale, file, fps)} cx={800} cy={250}>
          <Foglio x={745} y={170} w={110} h={150}>
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <line x1={760} y1={232 + k * 26} x2={790} y2={232 + k * 26} stroke={TINTE.tinta} strokeWidth={8} strokeLinecap="round" />
                <line x1={802} y1={232 + k * 26} x2={830} y2={232 + k * 26} stroke={k === 1 ? TINTE.rischio : TINTE.ok} strokeWidth={8} strokeLinecap="round" />
              </g>
            ))}
          </Foglio>
        </Compare>
        <Compare v={molla(locale, etichetta, fps)} cx={835} cy={130}>
          <Pillola x={835} y={130} testo="Le voci della ditta" corpo={22} fondo={TINTE.ok} colore={TINTE.carta} />
        </Compare>
        {/* Al fiduciario. */}
        <Compare v={molla(locale, fiduciario, fps)} cx={880} cy={560}>
          <Persona x={880} y={660} s={0.72} colore={TINTE.tratto} />
          <Valigetta x={930} y={662} s={0.55} />
          <Pillola x={880} y={495} testo="Fiduciario" corpo={22} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Freccia d="M 822 332 Q 860 400 872 462" p={tra(locale, consegna, consegna + 12)} colore={TINTE.tratto} spessore={6} />
      </Tela>
    );
  },
};

export const DISEGNI_DICHIARAZIONE_IMPOSTE: Record<string, Disegno> = {
  "dich-cifra": dichCifra,
  "dich-utile": dichUtile,
  "dich-perdita": dichPerdita,
  "dich-modulo10": dichModulo10,
  "dich-allegati": dichAllegati,
  "dich-termine": dichTermine,
  "dich-senza-modulo": dichSenzaModulo,
  "dich-etax": dichEtax,
  "dich-strumento": dichStrumento,
};
