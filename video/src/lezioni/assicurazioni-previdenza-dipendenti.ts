/**
 * Video facoltativo della lezione 21: «Assumere il primo dipendente». Cosa
 * cambia quando una ditta individuale assume. Fonti, lette il 18.10.2026
 * (VERIFICATO_DIPENDENTI in src/data/svizzera.ts):
 * - IAS: per un indipendente che occupa personale valgono le stesse regole
 *   dei datori di lavoro (fontiPercorso.iasAnnunciareCollaboratori); ci si
 *   affilia come datore di lavoro con il formulario 111, che chiede anche
 *   l'assicurazione infortuni e la cassa pensione (iasAffiliazioneDatori);
 * - promemoria AVS 2.01, stato 01.01.2026 (avsPromemoria201): AVS/AI/IPG
 *   regoleDipendenti.contributiAvsAiIpg2026, metà trattenuta dal salario;
 *   acconti durante l'anno e dichiarazione dei salari entro il 30 gennaio
 *   (regoleDipendenti.dichiarazioneSalari); LADI art. 3: disoccupazione
 *   contributiDisoccupazione2026, metà a testa (ladi3); foglio IAS 2026 delle
 *   aliquote dei datori di lavoro (iasAliquoteDatori2026);
 * - decreto esecutivo AF 2026 (RL 856.310): assegni familiari alla cassa
 *   cantonale assegniFamiliariDatori2026, a carico del datore di lavoro;
 * - LAINF artt. 1a, 66, 68-69: i lavoratori sono assicurati d'obbligo, nei
 *   settori della Suva con la Suva, se no con l'assicuratore che sceglie il
 *   datore di lavoro (assicurazioni private, casse pubbliche, casse malati);
 * - LPP artt. 2, 7, 11 e 66: obbligatoria oltre i regoleDipendenti.etaLpp
 *   anni e la soglia d'entrata (sogliaLpp, importi UFAS 2026 e 2027),
 *   affiliazione a un istituto registrato, almeno metà dei contributi;
 * - CO artt. 320 e 330b: nessuna forma speciale, ma informazione scritta
 *   entro un mese (informazioneScrittaMesi);
 * - LSM ticinese con la modifica del 20.04.2026 e decreto 2026: salario
 *   minimo orario (salarioMinimoTicino), non per gli apprendisti (art. 3);
 * - Ufficio delle imposte alla fonte e del bollo: imposta alla fonte per i
 *   dipendenti senza permesso di domicilio (B, G), partita fiscale del datore
 *   di lavoro (dcImpostaFonte, dcImpostaFonteFaq).
 * Le assicurazioni del titolare sono nelle lezioni 11, 12 e 21. Lo strumento
 * «Budget del primo anno» (src/app/strumenti/budget) ha i «Costi fissi, al mese».
 */
import { approfondimentoPerId, lezionePerPasso } from "../../../src/data/corso";
import { chf, fontiPercorso, percentuale, regoleDipendenti as rd, VERIFICATO_DIPENDENTI } from "../../../src/data/svizzera";
import type { Lezione } from "./tipi";

const corso = approfondimentoPerId("assicurazioni-previdenza-dipendenti");
if (!corso) throw new Error("Manca il video facoltativo assicurazioni-previdenza-dipendenti in src/data/corso.ts");

function numeroLezione(passoId: string): number {
  const lezione = lezionePerPasso(passoId);
  if (!lezione) throw new Error(`Manca la lezione ${passoId} in src/data/corso.ts`);
  return lezione.numero;
}
const LEZIONE_AVS = numeroLezione("riconoscimento-avs");
const LEZIONE_INFORTUNI = numeroLezione("assicurazione-infortuni");
const LEZIONE_PREVIDENZA = numeroLezione("assicurazioni-previdenza");

const avs = rd.contributiAvsAiIpg2026.valore;
const ad = rd.contributiDisoccupazione2026.valore;
const dichiarazione = rd.dichiarazioneSalari.valore;
const lpp26 = rd.sogliaLpp[2026].valore;
const lpp27 = rd.sogliaLpp[2027].valore;
const minimo26 = rd.salarioMinimoTicino[2026].valore;
const minimo27 = rd.salarioMinimoTicino[2027].valore;

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  avs.totale !== 0.106 ||
  avs.dipendente !== avs.totale / 2 ||
  ad.totale !== 0.022 ||
  ad.dipendente !== ad.totale / 2 ||
  rd.assegniFamiliariDatori2026.valore !== 0.016 ||
  dichiarazione.giorno !== 30 ||
  dichiarazione.mese !== 1 ||
  rd.etaLpp.valore !== 17 ||
  lpp26 !== 22_680 ||
  lpp27 !== 23_040 ||
  rd.informazioneScrittaMesi.valore !== 1 ||
  minimo26.da !== 20 ||
  minimo26.a !== 20.5 ||
  minimo27.da !== 20.5 ||
  minimo27.a !== 21 ||
  LEZIONE_AVS !== 11 ||
  LEZIONE_INFORTUNI !== 12 ||
  LEZIONE_PREVIDENZA !== 21
) {
  throw new Error(
    "Una regola sul primo dipendente (o il numero di una lezione) è cambiata: aggiorna `voce` delle scene 2, 3, 5, 6, 7 e 9 e rifalle (npm run voce -- assicurazioni-previdenza-dipendenti 2 3 5 6 7 9).",
  );
}

const AVS = percentuale(avs.totale);
const AD = percentuale(ad.totale);
const AF = percentuale(rd.assegniFamiliariDatori2026.valore);
const DICHIARAZIONE = `${dichiarazione.giorno} gennaio`;
const MIN_26 = `${chf(minimo26.da, 2)} a ${chf(minimo26.a, 2)}`;
const MIN_27 = `${chf(minimo27.da, 2)} a ${chf(minimo27.a, 2)}`;

export const assicurazioniPrevidenzaDipendenti: Lezione = {
  id: corso.approfondimento.id,
  numero: corso.lezione.numero,
  titolo: corso.approfondimento.titolo,
  stile: "misto",
  clip: "clip.mp4",
  prossimoPasso: corso.lezione.titolo,
  etichettaFine: "Torna alla lezione",
  scene: [
    {
      audio: "scena-1.mp3",
      stile: "presentatore",
      testo:
        "Ciao, sono Bleo! In questo video facoltativo vediamo cosa cambia se assumi il primo dipendente. Diventi un datore di lavoro, con i suoi obblighi.",
      schermo: { tipo: "titolo", etichetta: `Lezione ${corso.lezione.numero} · Video facoltativo`, titolo: corso.approfondimento.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "dip-cassa",
      stile: "lavagna",
      testo: `Prima cosa: annunciati alla tua cassa AVS come datore di lavoro. Dal salario trattieni la parte del dipendente e la versi alla cassa con la tua. Nel 2026: per AVS, invalidità e perdita di guadagno il ${AVS}, per la disoccupazione il ${AD}. Metà a testa.`,
      voce: "Prima cosa: annunciati alla tua cassa AVS come datore di lavoro. Dal salario trattieni la parte del dipendente e la versi alla cassa con la tua. Nel duemilaventisei: per AVS, invalidità e perdita di guadagno il dieci virgola sei per cento, per la disoccupazione il due virgola due per cento. Metà a testa.",
      schermo: {
        tipo: "punto",
        titolo: "Alla cassa AVS",
        testo: `Annunciati come datore di lavoro. Nel 2026: AVS, AI e IPG ${AVS}, disoccupazione ${AD}; metà le paga il dipendente.`,
        fonte: fontiPercorso.avsPromemoria201,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "dip-assegni",
      stile: "lavagna",
      testo: `I contributi per gli assegni familiari li paghi solo tu. Alla cassa cantonale, nel 2026, l'${AF} dei salari, più piccoli contributi e spese. Entro il ${DICHIARAZIONE} dichiari alla cassa i salari dell'anno prima.`,
      voce: "I contributi per gli assegni familiari li paghi solo tu: alla cassa cantonale, nel duemilaventisei, l'uno virgola sei per cento dei salari, più piccoli contributi e spese. Entro il trenta gennaio dichiari alla cassa i salari dell'anno prima.",
      schermo: {
        tipo: "punto",
        titolo: "Assegni familiari",
        testo: `Alla cassa cantonale, nel 2026, ${AF} dei salari, solo a carico tuo. I salari dell'anno si dichiarano entro il ${DICHIARAZIONE}.`,
        fonte: fontiPercorso.decretoAfDatori2026,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "dip-infortuni",
      stile: "lavagna",
      testo:
        "Poi gli infortuni: assicurare i dipendenti è obbligatorio. Nei settori della Suva, come edilizia, trasporti e industria, li assicura la Suva. Negli altri l'assicuratore lo scegli tu, anche una cassa malati.",
      schermo: {
        tipo: "punto",
        titolo: "Infortuni",
        testo: "Obbligatoria per i dipendenti: con la Suva nei suoi settori, se no con l'assicuratore che scegli.",
        fonte: fontiPercorso.lainf69,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "dip-lpp",
      stile: "lavagna",
      testo: `La cassa pensione è obbligatoria se il dipendente ha più di ${rd.etaLpp.valore} anni, e da te guadagna più di ${chf(lpp26)} all'anno nel 2026, o di ${chf(lpp27)} nel 2027. Allora ti affili a un istituto di previdenza e paghi almeno metà dei contributi.`,
      voce: "La cassa pensione è obbligatoria se il dipendente ha più di diciassette anni, e da te guadagna più di ventiduemila seicentottanta franchi all'anno nel duemilaventisei, o di ventitremila quaranta franchi nel duemilaventisette. Allora ti affili a un istituto di previdenza e paghi almeno metà dei contributi.",
      schermo: {
        tipo: "punto",
        titolo: "Cassa pensione",
        testo: `Obbligatoria oltre ${chf(lpp26)} all'anno nel 2026, ${chf(lpp27)} nel 2027. Paghi almeno metà dei contributi.`,
        fonte: fontiPercorso.lpp2,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "dip-contratto",
      stile: "lavagna",
      testo:
        "Il contratto di lavoro vale anche a voce. Ma se assumi per più di un mese, entro il primo mese dai al dipendente per iscritto: nomi, inizio, funzione, salario e ore alla settimana.",
      schermo: {
        tipo: "punto",
        titolo: "Il contratto",
        testo: "Vale anche a voce. Entro un mese, per iscritto: nomi, inizio, funzione, salario, ore alla settimana.",
        fonte: fontiPercorso.co330b,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "dip-salario",
      stile: "lavagna",
      testo: `In Ticino c'è anche un salario minimo per legge. Nel 2026 va da ${MIN_26} lordi all'ora, secondo il settore. Nel 2027 da ${MIN_27}. Non vale, per esempio, per gli apprendisti.`,
      voce: "In Ticino c'è anche un salario minimo per legge. Nel duemilaventisei va da venti franchi a venti e cinquanta lordi all'ora, secondo il settore. Nel duemilaventisette da venti e cinquanta a ventun franchi. Non vale, per esempio, per gli apprendisti.",
      schermo: {
        tipo: "punto",
        titolo: "Salario minimo in Ticino",
        testo: `Lordo all'ora, secondo il settore: da ${MIN_26} nel 2026, da ${MIN_27} nel 2027.`,
        fonte: fontiPercorso.decretoSalarioMinimo2026,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "dip-fonte",
      stile: "lavagna",
      testo:
        "Il dipendente non ha il permesso di domicilio, per esempio ha un permesso B o G? Allora dal salario trattieni l'imposta alla fonte. Prima apri una partita fiscale all'Ufficio delle imposte alla fonte e del bollo.",
      voce: "Il dipendente non ha il permesso di domicilio, per esempio ha un permesso bi o gi? Allora dal salario trattieni l'imposta alla fonte. Prima apri una partita fiscale all'Ufficio delle imposte alla fonte e del bollo.",
      schermo: {
        tipo: "punto",
        titolo: "Imposta alla fonte",
        testo: "Per i dipendenti senza permesso di domicilio: apri una partita fiscale come datore di lavoro.",
        fonte: fontiPercorso.dcImpostaFonte,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo: `Le tue assicurazioni da titolare sono nelle lezioni ${LEZIONE_AVS}, ${LEZIONE_INFORTUNI} e ${LEZIONE_PREVIDENZA}. Salario e contributi mettili nel «Budget del primo anno» di Bleo. Per il tuo caso, chiedi alla cassa AVS o a un fiduciario autorizzato.`,
      voce: "Le tue assicurazioni da titolare sono nelle lezioni undici, dodici e ventuno. Salario e contributi mettili nel «Budget del primo anno» di Bleo. Per il tuo caso, chiedi alla cassa AVS o a un fiduciario autorizzato.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "Nel «Budget del primo anno» metti salario e contributi fra i costi fissi. Per il tuo caso: la tua cassa AVS o un fiduciario autorizzato.",
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ciao!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.avsPromemoria201, verificatoIl: VERIFICATO_DIPENDENTI },
    },
  ],
};
