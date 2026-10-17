/**
 * I disegni della lezione 1 («Cos'è una ditta individuale»), uno per scena.
 * Coordinate della tela 1000×700; l'angolo in basso a sinistra (x < 300,
 * y > 480) è della finestra di Bleo, l'angolo in alto a destra (x > 760,
 * y < 100) dei tre cerchi dell'elenco. Niente cifre, solo concetti.
 */
import { Scheda } from "../../componenti/Schede";
import type { Schermo } from "../../lezioni/tipi";
import {
  Attrezzo,
  Auto,
  Cartello,
  Casa,
  Cassaforte,
  Compare,
  Esplosione,
  Foglio,
  Freccia,
  Fumetto,
  Lampadina,
  molla,
  Moneta,
  Negozio,
  Persona,
  Pillola,
  Righe,
  Salvadanaio,
  Spunta,
  TEAL_CHIARO,
  Testo,
  TINTE,
  Timbro,
  tra,
  Valigetta,
} from "../figure";
import { seconda, type Disegno } from "./tipi";

function Tela({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 1000 700" width={1000} height={700} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {children}
    </svg>
  );
}

/* 1. «Ciao, sono Bleo! In un minuto ti spiego cos'è una ditta individuale.» */
const TARGA_1 = { x: 540 + 104, y: 620 - 186 };
const titoloLezione: Disegno = {
  chiave: (ctx) => seconda(ctx) + 26,
  bussolina: (ctx) => ({
    posto: { x: 730, y: 520 },
    specchio: true,
    azioni: [{ tipo: "tocca", quando: seconda(ctx) + 26, bersaglio: TARGA_1, specchio: true }],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const dopo = seconda(ctx);
    const riga1 = tra(locale, 4, 26);
    const riga2 = tra(locale, 18, 42);
    const sotto = tra(locale, 38, 54);
    return (
      <Tela>
        <defs>
          <clipPath id="scrivi-1">
            <rect x={0} y={110} width={1000 * riga1} height={110} />
          </clipPath>
          <clipPath id="scrivi-2">
            <rect x={0} y={200} width={1000 * riga2} height={110} />
          </clipPath>
        </defs>
        <Compare v={molla(locale, 0, fps)} cx={500} cy={60}>
          <Pillola x={500} y={60} testo="Il corso di Bleo · Lezione 1" corpo={30} />
        </Compare>
        <g clipPath="url(#scrivi-1)">
          <Testo x={500} y={165} corpo={76} titolo peso={800}>
            Cos'è una
          </Testo>
        </g>
        <g clipPath="url(#scrivi-2)">
          <Testo x={500} y={250} corpo={76} titolo peso={800}>
            ditta individuale
          </Testo>
        </g>
        <Freccia d="M 220 302 Q 500 286 780 302" p={sotto} colore={TINTE.accento} spessore={10} punta={false} />
        <Compare v={molla(locale, dopo + 4, fps)} cx={370} cy={620}>
          <Persona x={370} y={620} s={0.9} />
        </Compare>
        <Compare v={molla(locale, dopo, fps)} cx={540} cy={620}>
          <Negozio x={540} y={620} targa="Il tuo nome" targaScala={molla(locale, dopo + 26, fps)} />
        </Compare>
      </Tela>
    );
  },
};

/* 2. «È la forma più semplice per lavorare in proprio. Ricorda tre cose.» */
const GRADINI = [
  { x: 330, alto: 510, righe: ["Ditta", "individuale"] },
  { x: 545, alto: 390, righe: ["Sagl"] },
  { x: 760, alto: 270, righe: ["SA"] },
];
const scalaForme: Disegno = {
  chiave: (ctx) => seconda(ctx),
  bussolina: (ctx) => ({
    posto: { x: 190, y: 430 },
    azioni: [
      { tipo: "lancia", quando: Math.round(seconda(ctx) * 0.5) },
      { tipo: "lancia", quando: seconda(ctx) + 4 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    // «la forma più semplice»: a metà della prima frase il primo gradino si illumina.
    const luce = tra(locale, Math.round(seconda(ctx) * 0.45), Math.round(seconda(ctx) * 0.45) + 10);
    return (
      <Tela>
        {GRADINI.map((g, i) => {
          const su = molla(locale, 4 + i * 7, fps, true);
          const acceso = i === 0 ? luce : 0;
          const h = 640 - g.alto;
          return (
            <g key={g.x} transform={`translate(0 ${640}) scale(1 ${Math.max(0.001, su)}) translate(0 ${-640})`} opacity={Math.min(1, su * 2)}>
              {acceso > 0 ? (
                <rect x={g.x - 10} y={g.alto - 10} width={230} height={h + 20} rx={30} fill={TINTE.tinta} opacity={acceso} />
              ) : null}
              <rect
                x={g.x}
                y={g.alto}
                width={210}
                height={h}
                rx={22}
                fill={acceso > 0.5 ? TINTE.tratto : TINTE.carta}
                stroke={TINTE.tratto}
                strokeWidth={6}
              />
              {g.righe.map((riga, j) => (
                <Testo
                  key={riga}
                  x={g.x + 105}
                  y={g.alto + 42 + j * 38}
                  corpo={g.righe.length > 1 ? 32 : 38}
                  titolo
                  peso={800}
                  colore={acceso > 0.5 ? TINTE.carta : TINTE.tratto}
                >
                  {riga}
                </Testo>
              ))}
            </g>
          );
        })}
        <Compare v={molla(locale, Math.round(seconda(ctx) * 0.45) + 6, fps)} cx={425} cy={455}>
          <Pillola x={425} y={455} testo="più semplice" corpo={30} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 3. «Primo: la ditta nasce quando inizi la tua attività.» */
const TARGA_3 = { x: 405, y: 200 };
const lineaTempo: Disegno = {
  chiave: (ctx) => seconda(ctx) + 36,
  bussolina: (ctx) => ({
    posto: { x: 326, y: 281 },
    azioni: [{ tipo: "tocca", quando: seconda(ctx) + 40, bersaglio: TARGA_3 }],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const arrivo = seconda(ctx) + 30;
    const cammino = tra(locale, 6, arrivo);
    const x = 140 + (480 - 140) * cammino;
    const nasce = seconda(ctx) + 36;
    return (
      <Tela>
        <Freccia d="M 80 470 H 960" p={tra(locale, 0, 14)} spessore={8} />
        {[200, 400, 800].map((t, i) => (
          <circle key={t} cx={t} cy={470} r={9 * Math.min(1, molla(locale, 8 + i * 3, fps))} fill={TINTE.tratto} />
        ))}
        <Compare v={molla(locale, 10, fps)} cx={600} cy={470}>
          <Cartello x={600} y={470}>
            <Attrezzo cx={600} cy={-130 + 470} />
          </Cartello>
          <Testo x={600} y={522} corpo={32} titolo peso={800} colore={TINTE.accento}>
            Inizi a lavorare
          </Testo>
        </Compare>
        <Persona x={x} y={470} s={0.85} passo={cammino > 0 && cammino < 1 ? locale / 2.2 : undefined} />
        <Esplosione cx={600} cy={300} p={(locale - nasce) / 22} r={90} />
        <Compare v={molla(locale, nasce, fps)} cx={600} cy={200}>
          <Pillola x={600} y={200} testo="Ditta individuale" corpo={36} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Secondo: non serve un capitale per aprirla.» */
const SPUNTA_4 = { x: 740, y: 300, r: 75 };
const cassaforteVuota: Disegno = {
  chiave: (ctx) => seconda(ctx) + 32,
  bussolina: (ctx) => ({
    posto: { x: 900, y: 390 },
    specchio: true,
    azioni: [{ tipo: "tocca", quando: seconda(ctx) + 34, bersaglio: { x: SPUNTA_4.x + SPUNTA_4.r, y: SPUNTA_4.y }, specchio: true }],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const apre = seconda(ctx) + 4;
    const spunta = seconda(ctx) + 30;
    return (
      <Tela>
        <Compare v={molla(locale, 2, fps)} cx={445} cy={330}>
          <Cassaforte x={330} y={200} lato={230} apertura={tra(locale, apre, apre + 18)} />
        </Compare>
        <Testo x={445} y={300} corpo={32} titolo peso={800} colore={TINTE.accento} opacita={tra(locale, apre + 14, apre + 24)}>
          vuota
        </Testo>
        <Spunta cx={SPUNTA_4.x} cy={SPUNTA_4.y} r={SPUNTA_4.r} p={tra(locale, spunta, spunta + 14)} />
        <Compare v={molla(locale, spunta + 8, fps)} cx={700} cy={530}>
          <Testo x={700} y={530} corpo={36} titolo peso={800} colore={TINTE.tratto}>
            Nessun capitale minimo
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 5. «Terzo: il titolare sei solo tu. Se partite in più persone, serve un'altra forma.» */
const titolareSolo: Disegno = {
  chiave: () => 36,
  bussolina: (ctx) => ({
    posto: { x: 790, y: 745 },
    azioni: [
      { tipo: "lancia", quando: 34 },
      { tipo: "lancia", quando: seconda(ctx) + 18 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const due = seconda(ctx);
    const altra = tra(locale, due + 10, due + 26);
    const spento = 1 - 0.62 * tra(locale, due + 12, due + 24);
    const entraSecondo = tra(locale, due, due + 14);
    return (
      <Tela>
        <Compare v={molla(locale, 0, fps)} cx={400} cy={430}>
          <Persona x={400} y={430} s={0.9} />
        </Compare>
        {entraSecondo > 0 ? <Persona x={320 - (1 - entraSecondo) * 160} y={430} s={0.9} colore={TEAL_CHIARO} opacita={entraSecondo} /> : null}
        <g opacity={spento}>
          <Freccia d="M 470 320 Q 540 250 600 245" p={tra(locale, 8, 22)} />
          <Compare v={molla(locale, 18, fps)} cx={790} cy={245}>
            <rect x={610} y={190} width={360} height={110} rx={24} fill={TINTE.carta} stroke={TINTE.tratto} strokeWidth={6} />
            <Testo x={790} y={247} corpo={34} titolo peso={800} colore={TINTE.tratto}>
              Ditta individuale
            </Testo>
          </Compare>
          <Spunta cx={965} cy={192} r={30} p={tra(locale, 34, 46) * (1 - tra(locale, due + 12, due + 20))} />
        </g>
        <Freccia d="M 470 370 Q 540 455 600 462" p={altra} colore={TINTE.accento} />
        <Compare v={molla(locale, due + 20, fps)} cx={790} cy={465}>
          <rect x={610} y={400} width={360} height={130} rx={24} fill={TINTE.crema} stroke={TINTE.accento} strokeWidth={6} />
          <Testo x={790} y={446} corpo={34} titolo peso={800} colore={TINTE.accento}>
            Un'altra forma
          </Testo>
          <Testo x={790} y={494} corpo={30} peso={600} colore={TINTE.accento}>
            per esempio Sagl
          </Testo>
        </Compare>
      </Tela>
    );
  },
};

/* 6. «Attenzione: tu e la ditta siete la stessa persona. Per questo rispondi dei debiti … patrimonio personale.» */
const BENI = [
  { y: 190, nome: "Casa" },
  { y: 380, nome: "Auto" },
  { y: 570, nome: "Risparmi" },
];
const patrimonio: Disegno = {
  chiave: (ctx) => seconda(ctx),
  bussolina: (ctx) => ({ posto: { x: 170, y: 440 }, azioni: [{ tipo: "scuoti", quando: seconda(ctx) + 2 }] }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const dopo = seconda(ctx);
    const unisce = tra(locale, 48, 78);
    const rimpicciolisce = tra(locale, dopo - 4, dopo + 14);
    // Persona e ditta si avvicinano e diventano una sola figura; poi la figura va in alto, piccola.
    const s = 1 - 0.45 * rimpicciolisce;
    const gx = 0 + (-90) * rimpicciolisce;
    const gy = 0 + (-330) * rimpicciolisce;
    const debiti = molla(locale, dopo + 6, fps);
    return (
      <Tela>
        <g transform={`translate(${gx} ${gy}) translate(560 560) scale(${s}) translate(-560 -560)`}>
          <Compare v={molla(locale, 20, fps)} cx={620} cy={560}>
            <Negozio x={720 - 120 * unisce} y={560} s={0.85} targa="La ditta" />
          </Compare>
          <Compare v={molla(locale, 24, fps)} cx={400} cy={560}>
            <Persona x={380 + 120 * unisce} y={570} s={0.95} />
          </Compare>
          {unisce > 0.95 ? (
            <circle cx={560} cy={455} r={168} fill="none" stroke={TINTE.accento} strokeWidth={6} strokeDasharray="14 14" opacity={tra(locale, 78, 88)} />
          ) : null}
        </g>
        <Testo x={600} y={668} corpo={40} titolo peso={800} colore={TINTE.accento} opacita={tra(locale, 80, 92) * (1 - rimpicciolisce)}>
          = la stessa persona
        </Testo>
        {/* Seconda parte: i debiti della ditta arrivano ai beni personali. */}
        <Compare v={debiti} cx={430} cy={360}>
          <rect x={300} y={300} width={260} height={130} rx={24} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={6} />
          <Testo x={430} y={345} corpo={32} titolo peso={800} colore={TINTE.rischio}>
            Debiti
          </Testo>
          <Testo x={430} y={385} corpo={32} titolo peso={800} colore={TINTE.rischio}>
            della ditta
          </Testo>
        </Compare>
        <Compare v={molla(locale, dopo + 10, fps)} cx={800} cy={40}>
          <Testo x={800} y={40} corpo={34} titolo peso={800} colore={TINTE.tratto}>
            Patrimonio personale
          </Testo>
        </Compare>
        {BENI.map((b, i) => {
          const freccia = tra(locale, dopo + 22 + i * 12, dopo + 36 + i * 12);
          const rosso = freccia > 0.98;
          const colore = rosso ? TINTE.rischio : TINTE.tratto;
          const icona = { x: 740, y: b.y };
          return (
            <g key={b.nome}>
              <Freccia d={`M 565 ${365} Q 640 ${(365 + b.y - 50) / 2} 670 ${b.y - 50}`} p={freccia} colore={TINTE.rischio} spessore={7} />
              <Compare v={molla(locale, dopo + 12 + i * 4, fps)} cx={icona.x} cy={icona.y - 50}>
                {rosso ? <rect x={672} y={b.y - 128} width={318} height={150} rx={26} fill={TINTE.rischioTenue} stroke={TINTE.rischio} strokeWidth={5} /> : null}
                {i === 0 ? <Casa x={icona.x} y={b.y} s={0.95} colore={colore} /> : null}
                {i === 1 ? <Auto x={icona.x} y={b.y} s={1} colore={colore} /> : null}
                {i === 2 ? <Salvadanaio x={icona.x} y={b.y} s={0.9} colore={colore} /> : null}
                <Testo x={830} y={b.y - 50} corpo={32} titolo peso={800} colore={colore} ancora="start">
                  {b.nome}
                </Testo>
              </Compare>
            </g>
          );
        })}
      </Tela>
    );
  },
};

/* 7. «E le imposte sul reddito della ditta le paghi tu, nella tua dichiarazione personale.» */
const imposte: Disegno = {
  chiave: (ctx) => seconda(ctx) + 8,
  bussolina: (ctx) => ({ posto: { x: 450, y: 745 }, azioni: [{ tipo: "lancia", quando: seconda(ctx) + 4 }] }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const timbro = molla(locale, seconda(ctx) + 8, fps);
    return (
      <Tela>
        <Compare v={molla(locale, 2, fps)} cx={420} cy={420}>
          {[0, 1, 2, 3].map((i) => (
            <Moneta key={i} cx={420 + (i % 2) * 8} cy={470 - i * 30} r={44} />
          ))}
          <Testo x={420} y={262} corpo={32} titolo peso={800} colore={TINTE.accento}>
            Reddito della ditta
          </Testo>
        </Compare>
        <Freccia d="M 480 380 Q 570 300 650 360" p={tra(locale, 14, 30)} colore={TINTE.accento} spessore={7} />
        {[0, 1, 2].map((i) => {
          const t = tra(locale, 24 + i * 10, 46 + i * 10);
          if (t <= 0 || t >= 1) return null;
          const x = (1 - t) ** 2 * 440 + 2 * (1 - t) * t * 570 + t * t * 740;
          const y = (1 - t) ** 2 * 380 + 2 * (1 - t) * t * 220 + t * t * 400;
          return <Moneta key={i} cx={x} cy={y} r={30} />;
        })}
        <Compare v={molla(locale, 6, fps)} cx={790} cy={340}>
          <Foglio x={640} y={110} w={300} h={460}>
            <circle cx={690} cy={162} r={22} fill={TINTE.tinta} stroke={TINTE.tratto} strokeWidth={5} />
            <circle cx={690} cy={156} r={7} fill={TINTE.tratto} />
            <path d="M 678 174 q 12 -14 24 0" fill={TINTE.tratto} />
            <Testo x={790} y={226} corpo={32} titolo peso={800} colore={TINTE.tratto}>
              La tua
            </Testo>
            <Testo x={790} y={264} corpo={32} titolo peso={800} colore={TINTE.tratto}>
              dichiarazione
            </Testo>
            <Testo x={790} y={302} corpo={32} titolo peso={800} colore={TINTE.tratto}>
              d'imposta
            </Testo>
            <Righe x={670} y={350} w={240} n={4} passo={30} />
          </Foglio>
        </Compare>
        {timbro > 0.01 ? (
          <g transform={`translate(855 490) scale(${0.6 + 0.4 * Math.min(timbro, 1.15)}) translate(-855 -490)`} opacity={Math.min(1, timbro * 1.5)}>
            <Timbro cx={855} cy={490} r={60} />
          </g>
        ) : null}
      </Tela>
    );
  },
};

/* 8. «Se il rischio ti preoccupa, chiedi a un fiduciario autorizzato se ti conviene un'altra forma.» */
const fiduciario: Disegno = {
  chiave: (ctx) => seconda(ctx) + 20,
  bussolina: (ctx) => ({ posto: { x: 430, y: 745 }, azioni: [{ tipo: "lancia", quando: seconda(ctx) + 18 }] }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const arrivo = seconda(ctx) + 12;
    const cammino = tra(locale, 8, arrivo);
    const x = 340 + (560 - 340) * cammino;
    const idea = seconda(ctx) + 20;
    const capito = locale >= idea;
    return (
      <Tela>
        <Compare v={molla(locale, 2, fps)} cx={800} cy={400}>
          {/* cartello */}
          <line x1={800} y1={250} x2={800} y2={400} stroke={TINTE.tratto} strokeWidth={8} />
          <rect x={650} y={130} width={300} height={124} rx={22} fill={TINTE.tratto} />
          <Testo x={800} y={172} corpo={32} titolo peso={800} colore={TINTE.carta}>
            Fiduciario
          </Testo>
          <Testo x={800} y={212} corpo={32} titolo peso={800} colore={TINTE.carta}>
            autorizzato
          </Testo>
          {/* scrivania con la valigetta */}
          <rect x={640} y={400} width={320} height={22} rx={10} fill={TINTE.accento} />
          <rect x={660} y={420} width={18} height={60} rx={6} fill={TINTE.accento} />
          <rect x={922} y={420} width={18} height={60} rx={6} fill={TINTE.accento} />
          <Valigetta x={730} y={400} s={0.8} />
          <Persona x={890} y={400} s={0.7} colore={TINTE.accento} />
        </Compare>
        <Persona x={x} y={480} s={0.85} inclinata={capito ? 0 : -9} passo={cammino > 0 && cammino < 1 ? locale / 2.2 : undefined} />
        <Compare v={molla(locale, 6, fps)} cx={x + 50} cy={230}>
          <Fumetto cx={x + 50} cy={230} r={46}>
            {capito ? (
              <g transform={`translate(${x + 50} 230) scale(${Math.min(1.1, molla(locale, idea, fps))}) translate(${-(x + 50)} -230)`}>
                <Lampadina cx={x + 50} cy={228} s={0.9} />
              </g>
            ) : (
              <Testo x={x + 50} y={232} corpo={48} titolo peso={800} colore={TINTE.accento}>
                ?
              </Testo>
            )}
          </Fumetto>
        </Compare>
      </Tela>
    );
  },
};

/* 9. «La fonte ufficiale la trovi qui sotto…»: la scheda della fonte, come nello stile classico. */
const fonte: Disegno = {
  chiave: () => 20,
  bussolina: () => ({ posto: { x: 880, y: 745 }, azioni: [{ tipo: "lancia", quando: 8 }] }),
  Figura: ({ locale, ctx, schermo }) => <SchedaHtml schermo={schermo} v={molla(locale, 8, ctx.fps, true)} locale={locale} />,
};

/** Una scheda dello stile classico (HTML), al centro della tela. */
export function SchedaHtml({ schermo, v, locale }: { schermo: Schermo; v: number; locale: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 300,
        top: 70,
        width: 560,
        opacity: Math.min(1, v * 1.4),
        transform: `translateX(${(1 - v) * 120}px) scale(${0.9 + 0.1 * v})`,
        transformOrigin: "left center",
      }}
    >
      <Scheda schermo={schermo} locale={locale} comparse={[]} />
    </div>
  );
}

export const DISEGNI_DITTA_INDIVIDUALE: Record<string, Disegno> = {
  "titolo-lezione": titoloLezione,
  "scala-forme": scalaForme,
  "linea-tempo": lineaTempo,
  "cassaforte-vuota": cassaforteVuota,
  "titolare-solo": titolareSolo,
  patrimonio,
  imposte,
  fiduciario,
  fonte,
};

