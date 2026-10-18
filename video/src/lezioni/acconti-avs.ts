/**
 * Lezione 19: «Pagare gli acconti AVS». Fonti, ricontrollate il 18.10.2026
 * (VERIFICATO_ACCONTI_AVS in src/data/svizzera.ts):
 * - OAVS, stato 01.01.2026: acconti fissati dalla cassa sul reddito
 *   presumibile, con le indicazioni e i giustificativi dell'assicurato, e
 *   adeguati se il reddito diverge sostanzialmente (art. 24,
 *   fontiPercorso.oavs24); pagamento di regola ogni trimestre, entro dieci
 *   giorni dalla fine del periodo (art. 34, fontiPercorso.oavs34,
 *   regolePercorso.accontiAvs); dilazione se si è in difficoltà (art. 34b,
 *   fontiPercorso.oavs34b; la diffida dell'art. 34a è solo nel passo);
 *   contributi definitivi fissati in una decisione, conguaglio entro
 *   regolePercorso.termineConguaglioAvsGiorni giorni dalla fatturazione,
 *   restituzione di quelli non dovuti (art. 25); i dati del reddito li manda
 *   alla cassa l'autorità fiscale cantonale (art. 27); interessi di mora se un
 *   acconto non arriva entro regoleAccontiAvs.giorniMoraAcconto giorni dalla
 *   fine del trimestre, dalla fine del trimestre (art. 41bis cpv. 1 lett. a), e
 *   se gli acconti sono sotto regolePercorso.sogliaAccontiAvs dei definitivi,
 *   dal 1° gennaio del secondo anno dopo (lett. f,
 *   regoleAccontiAvs.anniInizioMoraAccontiBassi); conta l'arrivo del
 *   pagamento, tasso regolePercorso.interesseMoraAvs (art. 42);
 * - promemoria 2.02, stato 01.01.2026 (fonti.avsPromemoria202): punti 8-16
 *   (avvisare subito la cassa a fine anno se gli acconti sono troppo bassi,
 *   definitivi sulla tassazione, rimborso o fattura, 30 giorni dalla data
 *   della fattura e non dal ricevimento, dilazione con interessi, interessi
 *   compensativi, esempio 2 sugli acconti sotto il 75%);
 * - IAS: divergenze sostanziali di più o meno
 *   regolePercorso.variazioneRedditoIas, per iscritto o online
 *   (fontiPercorso.iasAcconti); nella richiesta online va indicato l'utile
 *   (fatturato meno spese) o una stima, non l'importo che si vorrebbe pagare
 *   (fontiPercorso.iasAdeguamentoIndipendenti);
 * - assegni familiari: supplementiTicino.assegniFamiliari per gli indipendenti
 *   affiliati alla cassa cantonale AF (fonti.iasAf2026) e
 *   supplementiTicino.assegnoIntegrativo (art. 73 LAF, fonti.lafTicino73).
 * Il riquadro «Scadenze da ricordare» del percorso
 * (src/components/percorso/riquadro-scadenze.tsx) ha le quattro date e il file
 * .ics con il promemoria una settimana prima; lo strumento «Fotografa la
 * lettera» è in src/app/strumenti/lettera.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import {
  anniSupplementiTicino,
  avsIndipendenti,
  dataSvizzera,
  fonti,
  fontiPercorso,
  percentuale,
  regoleAccontiAvs as aavs,
  regolePercorso,
  supplementiTicino,
} from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("acconti-avs");
if (!corso) throw new Error("Manca la lezione acconti-avs in src/data/corso.ts");
const lezioneAvs = lezionePerPasso("riconoscimento-avs");
if (!lezioneAvs) throw new Error("Manca la lezione riconoscimento-avs in src/data/corso.ts");

const acconti = regolePercorso.accontiAvs.valore;
const ANNO = avsIndipendenti[2026].valore.anno;

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  lezioneAvs.numero !== 11 ||
  acconti.giorno !== 10 ||
  acconti.mesi.join(",") !== "1,4,7,10" ||
  aavs.giorniMoraAcconto.valore !== 30 ||
  regolePercorso.interesseMoraAvs.valore !== 0.05 ||
  regolePercorso.variazioneRedditoIas.valore !== 0.25 ||
  regolePercorso.termineConguaglioAvsGiorni.valore !== 30 ||
  regolePercorso.sogliaAccontiAvs.valore !== 0.75 ||
  aavs.anniInizioMoraAccontiBassi.valore !== 2 ||
  ANNO !== 2026 ||
  supplementiTicino.assegniFamiliari.valore !== 0.0085 ||
  supplementiTicino.assegnoIntegrativo.valore !== 0.0015 ||
  anniSupplementiTicino.assegniFamiliari !== 2026
) {
  throw new Error(
    "Una regola sugli acconti AVS è cambiata: aggiorna testo e `voce` delle scene 1, 3, 4, 5, 7, 8 e 9 e rifalle (npm run voce -- acconti-avs 1 3 4 5 7 8 9).",
  );
}

/** Il giorno di pagamento con il mese: «10 aprile». */
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const [GENNAIO, APRILE, LUGLIO, OTTOBRE] = acconti.mesi.map((m) => `${acconti.giorno} ${MESI[m - 1]}`);

const GIORNI_MORA = aavs.giorniMoraAcconto.valore;
const MORA = percentuale(regolePercorso.interesseMoraAvs.valore, 0);
const VARIAZIONE = percentuale(regolePercorso.variazioneRedditoIas.valore, 0);
const CONGUAGLIO = regolePercorso.termineConguaglioAvsGiorni.valore;
const SOGLIA = percentuale(regolePercorso.sogliaAccontiAvs.valore, 0);
const INIZIO_MORA = dataSvizzera(`${ANNO + aavs.anniInizioMoraAccontiBassi.valore}-01-01`);
const AF = percentuale(supplementiTicino.assegniFamiliari.valore, 2);
const AFI = percentuale(supplementiTicino.assegnoIntegrativo.valore, 2);
const ANNO_AF = anniSupplementiTicino.assegniFamiliari;

export const accontiAvs: Lezione = {
  id: corso.passoId,
  numero: corso.numero,
  titolo: corso.titolo,
  stile: "misto",
  clip: "clip.mp4",
  prossimoPasso: titoloProssimoPasso(corso.passoId),
  scene: [
    {
      audio: "scena-1.mp3",
      disegno: "titolo-lezione",
      stile: "presentatore",
      testo: `Ciao, sono Bleo! Nella lezione ${lezioneAvs.numero} hai visto quanto costano i contributi AVS. Ora ti spiego come si pagano: con gli acconti, ogni trimestre.`,
      voce: "Ciao, sono Bleo! Nella lezione undici hai visto quanto costano i contributi AVS. Ora ti spiego come si pagano: con gli acconti, ogni trimestre.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "aavs-cosa",
      stile: "lavagna",
      testo:
        "Gli acconti sono contributi provvisori. La cassa di compensazione li fissa sul reddito che prevedi per quest'anno, con le indicazioni che le dai tu.",
      schermo: {
        tipo: "punto",
        titolo: "Cosa sono gli acconti",
        testo: "Contributi provvisori sul reddito che prevedi per quest'anno. Li fissa la cassa, con le tue indicazioni.",
        fonte: fontiPercorso.oavs24,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "aavs-date",
      stile: "lavagna",
      testo: `Si pagano ogni trimestre, entro dieci giorni dalla fine: il ${APRILE}, il ${LUGLIO} e il ${OTTOBRE}. L'ultimo trimestre, entro il ${GENNAIO} dell'anno dopo.`,
      voce: "Si pagano ogni trimestre, entro dieci giorni dalla fine: il dieci aprile, il dieci luglio e il dieci ottobre. L'ultimo trimestre, entro il dieci gennaio dell'anno dopo.",
      schermo: {
        tipo: "punto",
        titolo: "Ogni trimestre",
        testo: `Entro il ${APRILE}, il ${LUGLIO}, il ${OTTOBRE} e il ${GENNAIO} (l'ultimo trimestre dell'anno prima).`,
        fonte: fonti.avsPromemoria202,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "aavs-ritardo",
      stile: "lavagna",
      testo: `Conta il giorno in cui i soldi arrivano alla cassa, non quello in cui paghi. Se un acconto arriva più di ${GIORNI_MORA} giorni dopo la fine del trimestre, paghi interessi di mora del ${MORA} l'anno, dalla fine del trimestre.`,
      voce: "Conta il giorno in cui i soldi arrivano alla cassa, non quello in cui paghi. Se un acconto arriva più di trenta giorni dopo la fine del trimestre, paghi interessi di mora del cinque per cento l'anno, dalla fine del trimestre.",
      schermo: {
        tipo: "attenzione",
        titolo: "Conta quando arrivano i soldi",
        testo: `Più di ${GIORNI_MORA} giorni dopo la fine del trimestre: interessi di mora del ${MORA} l'anno.`,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "aavs-cambia",
      stile: "lavagna",
      testo: `Se il tuo reddito cambia molto, anche a fine anno, avvisa subito la cassa: così adegua gli acconti. Alla cassa ticinese conta una variazione di più o meno il ${VARIAZIONE}. Nella sua richiesta online scrivi l'utile previsto: fatturato meno spese.`,
      voce: "Se il tuo reddito cambia molto, anche a fine anno, avvisa subito la cassa: così adegua gli acconti. Alla cassa ticinese conta una variazione di più o meno il venticinque per cento. Nella sua richiesta online scrivi l'utile previsto: fatturato meno spese.",
      schermo: {
        tipo: "punto",
        titolo: "Il reddito cambia?",
        testo: `Avvisa subito la cassa. All'IAS conta una variazione di più o meno il ${VARIAZIONE}: richiesta online con l'utile previsto.`,
        fonte: fontiPercorso.iasAcconti,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "aavs-definitivi",
      stile: "lavagna",
      testo:
        "I contributi definitivi arrivano dopo, con la tassazione: l'autorità fiscale manda alla cassa i dati del tuo reddito. La cassa calcola i contributi veri e li confronta con gli acconti pagati.",
      schermo: {
        tipo: "punto",
        titolo: "I contributi definitivi",
        testo: "Sul reddito della tassazione: i dati li manda alla cassa l'autorità fiscale. Poi il confronto con gli acconti.",
        fonte: fontiPercorso.oavs27,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "aavs-conguaglio",
      stile: "lavagna",
      testo: `Se hai pagato troppo, la cassa ti restituisce la differenza, con un interesse. Se hai pagato troppo poco, ti manda la fattura del conguaglio: da pagare entro ${CONGUAGLIO} giorni dalla sua data. Non ce la fai? Chiedi una dilazione: gli interessi però restano.`,
      voce: "Se hai pagato troppo, la cassa ti restituisce la differenza, con un interesse. Se hai pagato troppo poco, ti manda la fattura del conguaglio: da pagare entro trenta giorni dalla sua data. Non ce la fai? Chiedi una dilazione: gli interessi però restano.",
      schermo: {
        tipo: "punto",
        titolo: "Il conguaglio",
        testo: `Troppo: ti rimborsa, con un interesse. Troppo poco: fattura da pagare entro ${CONGUAGLIO} giorni dalla sua data, o una dilazione.`,
        fonte: fonti.avsPromemoria202,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "aavs-trappola",
      stile: "lavagna",
      testo: `Attenzione alla trappola: se gli acconti restano sotto il ${SOGLIA} dei definitivi, sulla differenza paghi interessi di mora. Per il ${ANNO} si contano dal ${INIZIO_MORA}, anche se la fattura arriva dopo e la paghi in tempo.`,
      voce: "Attenzione alla trappola: se gli acconti restano sotto il settantacinque per cento dei definitivi, sulla differenza paghi interessi di mora. Per il duemilaventisei si contano dal primo gennaio duemilaventotto, anche se la fattura arriva dopo e la paghi in tempo.",
      schermo: {
        tipo: "attenzione",
        titolo: "Acconti troppo bassi",
        testo: `Sotto il ${SOGLIA} dei definitivi: interessi di mora sulla differenza. Per il ${ANNO} dal ${INIZIO_MORA}.`,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "aavs-ticino",
      stile: "lavagna",
      testo: `In Ticino, con la cassa cantonale, paghi anche due contributi sul reddito soggetto AVS. Lo ${AF} per gli assegni familiari e lo ${AFI} per l'assegno integrativo: sono le aliquote del ${ANNO_AF}.`,
      voce: "In Ticino, con la cassa cantonale, paghi anche due contributi sul reddito soggetto AVS. Lo zero virgola ottantacinque per cento per gli assegni familiari e lo zero virgola quindici per cento per l'assegno integrativo: sono le aliquote del duemilaventisei.",
      schermo: {
        tipo: "punto",
        titolo: `In Ticino, in più (${ANNO_AF})`,
        testo: `Assegni familiari ${AF} e assegno integrativo ${AFI} del reddito soggetto AVS, con la cassa cantonale.`,
        fonte: fonti.iasAf2026,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "aavs-scadenze",
      stile: "lavagna",
      testo:
        "Nel tuo percorso, il riquadro «Scadenze da ricordare» ha le quattro date: le scarichi nel calendario, con un promemoria una settimana prima.",
      schermo: {
        tipo: "punto",
        titolo: "Bleo ti ricorda le date",
        testo: "Nel percorso, «Scadenze da ricordare»: le quattro date nel tuo calendario, con un promemoria.",
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Ti arriva una lettera della cassa e non la capisci? Fotografala con lo strumento «Fotografa la lettera». Sul tuo caso decide la cassa: nel dubbio chiedi a lei o a un fiduciario autorizzato.",
      schermo: {
        tipo: "punto",
        titolo: "Una lettera della cassa?",
        testo: "«Fotografa la lettera» te la spiega. Sul tuo caso decide la cassa: chiedi a lei o a un fiduciario autorizzato.",
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fonti.avsPromemoria202, verificatoIl: corso.verificatoIl },
    },
  ],
};
