/**
 * I disegni della lezione 3 («Ti serve un'autorizzazione?»), vedi
 * src/lezioni/autorizzazioni.ts. Fonti: Portale PMI («Mettersi in proprio»,
 * punto 2), note informative della SEFRI, autorizzazioni della Polizia
 * cantonale. Coordinate della tela 1000×700; l'angolo in basso a sinistra
 * (x < 300, y > 480) è della finestra di Bleo.
 */
import { Compare, Foglio, Freccia, molla, Palazzo, Persona, Pillola, Righe, TEAL_CHIARO, Testo, Timbro, TINTE, tra } from "../figure";
import { Tela } from "./ditta-individuale";
import { elenco } from "./documenti-sagl";
import { cambio, Righe2 } from "./forme-giuridiche";
import type { ContestoDisegno, Disegno } from "./tipi";

/** Un momento fra due cambi di sottotitolo (`f` da 0 a 1); senza cambi, una frazione della voce. */
function fra(ctx: ContestoDisegno, da: number | null, a: number | null, f: number, riserva: number): number {
  const inizio = da === null ? 0 : ctx.cambi[da];
  const fine = a === null ? ctx.voce : ctx.cambi[a];
  if (inizio === undefined || fine === undefined) return Math.round(ctx.voce * riserva);
  return Math.round(inizio + (fine - inizio) * f);
}

/* 2. «Per ottenerla contano la buona reputazione, dei controlli o un numero limitato di posti.» */
const autAttivita = elenco("Per l'autorizzazione contano", ["La buona reputazione", "Dei controlli", "A volte: posti limitati"], (ctx) => [
  fra(ctx, 0, 1, 0.5, 0.4),
  fra(ctx, 0, 1, 0.85, 0.55),
  fra(ctx, 1, null, 0.45, 0.8),
]);

/* 5. «Note informative della SEFRI: professioni sanitarie, edilizia, sicurezza, attività sportive.» */
const autSefri = elenco("Note informative della SEFRI", ["Professioni sanitarie", "Edilizia", "Sicurezza e sorveglianza", "Attività sportive"], (ctx) => [
  fra(ctx, 0, 1, 0.6, 0.5),
  fra(ctx, 1, null, 0.1, 0.65),
  fra(ctx, 1, null, 0.35, 0.75),
  fra(ctx, 1, null, 0.7, 0.85),
]);

/* 6. «Autorizzazioni della Polizia cantonale: esercizi pubblici, commercio ambulante, agenzie di sicurezza, agriturismo.» */
const autPolizia = elenco("Polizia cantonale", ["Esercizi pubblici", "Commercio ambulante", "Agenzie di sicurezza", "Agriturismo"], (ctx) => [
  fra(ctx, 0, 1, 0.3, 0.5),
  fra(ctx, 0, 1, 0.75, 0.6),
  fra(ctx, 1, null, 0.2, 0.75),
  fra(ctx, 1, null, 0.7, 0.85),
]);

/** Una croce bianca su un tondo: il medico. */
function CroceMedica({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={22} fill={TINTE.rischio} />
      <rect x={cx - 5} y={cy - 13} width={10} height={26} rx={2} fill={TINTE.carta} />
      <rect x={cx - 13} y={cy - 5} width={26} height={10} rx={2} fill={TINTE.carta} />
    </g>
  );
}

/* 3. «Professioni regolamentate, come il notaio o il medico: serve una formazione specifica o un'esperienza dimostrata.» */
const autProfessioni: Disegno = {
  chiave: (ctx) => cambio(ctx, 0, 0.5),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "lancia", quando: Math.round(ctx.voce * 0.3) },
      { tipo: "lancia", quando: cambio(ctx, 0, 0.5) + 14 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const diploma = cambio(ctx, 0, 0.5);
    const medico = Math.round(Math.min(diploma, ctx.voce * 0.5) * 0.75);
    return (
      <Tela>
        <Compare v={molla(locale, 2, fps)} cx={655} cy={40}>
          <Pillola x={655} y={40} testo="Professioni regolamentate" corpo={32} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, 10, fps)} cx={420} cy={360}>
          <Persona x={420} y={430} s={0.9} colore={TINTE.accento} />
          <Pillola x={420} y={480} testo="Notaio" corpo={26} fondo={TINTE.crema} colore={TINTE.accento} bordo={TINTE.accento} />
        </Compare>
        <Compare v={molla(locale, medico, fps)} cx={590} cy={360}>
          <Persona x={590} y={430} s={0.9} colore={TEAL_CHIARO} />
          <CroceMedica cx={590} cy={330} />
          <Pillola x={590} y={480} testo="Medico" corpo={26} fondo={TINTE.tinta} colore={TINTE.tratto} bordo={TINTE.tratto} />
        </Compare>
        <Freccia d="M 670 330 Q 720 290 760 300" p={tra(locale, diploma - 6, diploma + 8)} />
        <Compare v={molla(locale, diploma, fps)} cx={850} cy={320}>
          <Foglio x={780} y={200} w={140} h={180}>
            <Righe x={798} y={250} w={90} n={3} passo={26} />
          </Foglio>
          <g opacity={tra(locale, diploma + 10, diploma + 16)}>
            <Timbro cx={860} cy={345} r={34} />
          </g>
          <Righe2 x={850} y={420} righe={["Formazione", "o esperienza"]} corpo={28} passo={34} />
        </Compare>
      </Tela>
    );
  },
};

/* 4. «Alcune regole sono della Confederazione, altre del Cantone. Per il Ticino non c'è un unico elenco: informarsi prima.» */
const autLivelli: Disegno = {
  chiave: (ctx) => cambio(ctx, 0, 0.45),
  bussolina: (ctx) => ({
    posto: { x: 200, y: 450 },
    azioni: [
      { tipo: "scuoti", quando: cambio(ctx, 0, 0.45) + 6 },
      { tipo: "lancia", quando: cambio(ctx, 1, 0.75) + 6 },
    ],
  }),
  Figura: ({ locale, ctx }) => {
    const { fps } = ctx;
    const nessunElenco = cambio(ctx, 0, 0.45);
    const informati = cambio(ctx, 1, 0.75);
    const cantone = Math.round(nessunElenco * 0.55);
    const croce = tra(locale, nessunElenco + 10, nessunElenco + 20);
    return (
      <Tela>
        <Compare v={molla(locale, 2, fps)} cx={600} cy={40}>
          <Pillola x={600} y={40} testo="Chi fa le regole?" corpo={32} fondo={TINTE.tratto} colore={TINTE.carta} />
        </Compare>
        <Compare v={molla(locale, 8, fps)} cx={430} cy={260}>
          <Palazzo x={430} y={330} s={0.85} nome="CH" colore={TINTE.tratto} />
          <Testo x={430} y={370} corpo={28} titolo peso={800} colore={TINTE.tratto}>
            Confederazione
          </Testo>
        </Compare>
        <Compare v={molla(locale, cantone, fps)} cx={770} cy={260}>
          <Palazzo x={770} y={330} s={0.85} nome="TI" colore={TINTE.accento} />
          <Testo x={770} y={370} corpo={28} titolo peso={800} colore={TINTE.accento}>
            Cantone
          </Testo>
        </Compare>
        {/* Un unico elenco ufficiale per il Ticino? No. */}
        <Compare v={molla(locale, nessunElenco, fps)} cx={600} cy={500}>
          <Foglio x={540} y={420} w={120} h={150}>
            <Righe x={558} y={470} w={76} n={3} passo={24} />
          </Foglio>
          <g opacity={croce} stroke={TINTE.rischio} strokeWidth={12} strokeLinecap="round">
            <line x1={528} y1={418} x2={672} y2={578} />
            <line x1={672} y1={418} x2={528} y2={578} />
          </g>
          <Testo x={700} y={470} corpo={26} titolo peso={800} colore={TINTE.rischio} ancora="start">
            Nessun elenco
          </Testo>
          <Testo x={700} y={504} corpo={26} titolo peso={800} colore={TINTE.rischio} ancora="start">
            unico in Ticino
          </Testo>
        </Compare>
        <Compare v={molla(locale, informati, fps)} cx={600} cy={630}>
          <Pillola x={600} y={630} testo="Informati prima di iniziare" corpo={28} fondo={TINTE.accento} colore={TINTE.carta} />
        </Compare>
      </Tela>
    );
  },
};

export const DISEGNI_AUTORIZZAZIONI: Record<string, Disegno> = {
  "aut-attivita": autAttivita,
  "aut-professioni": autProfessioni,
  "aut-livelli": autLivelli,
  "aut-sefri": autSefri,
  "aut-polizia": autPolizia,
};
