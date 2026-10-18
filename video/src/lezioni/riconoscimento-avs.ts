/**
 * Lezione 11: «Indipendente per l'AVS». Fonti, ricontrollate il 18.10.2026
 * (VERIFICATO_AVS_INDIPENDENTI in src/data/svizzera.ts):
 * - promemoria 2.02, stato 01.01.2026 (fonti.avsPromemoria202): chi è
 *   indipendente (a nome e per conto proprio, rischio economico; conta la
 *   situazione economica, non il contratto), i quattro criteri del punto 1,
 *   un solo mandante = di regola dipendente, la stessa persona può essere
 *   indipendente per un'attività e salariata per un'altra; tassi e tavola
 *   scalare (punti 5-6, avsIndipendenti[2026]), contributo minimo, attività
 *   accessoria fino a regolePercorso.attivitaAccessoriaAvs, spese
 *   amministrative; acconti trimestrali e contributi definitivi sulla
 *   tassazione (punti 8-10);
 * - selbststaendig-erwerbend.ch (www.indipendente.ch, citato dal promemoria,
 *   rimanda lì): «Presentare una domanda» (quando, documenti, il sito inoltra
 *   la domanda alla cassa; fonti.avsDomandaIndipendente), «Cosa succede ora?»
 *   (verifica, decisione per iscritto, se respinta il datore di lavoro versa
 *   i contributi; fontiPercorso.avsCosaSuccedeOra), «Cosa significa
 *   indipendenza?» (attività accessoria, assegni familiari e spese
 *   amministrative in più; fontiPercorso.avsIndipendenza);
 * - art. 64 LAVS e pagina dell'IAS sull'affiliazione: cassa professionale per
 *   i membri delle associazioni fondatrici, se no la cassa cantonale
 *   (fontiPercorso.lavs64, iasAffiliazione); l'IAS di Bellinzona
 *   nell'elenco delle casse cantonali (uffici.cassaCompensazioneTicino);
 * - Portale PMI, «Mettersi in proprio», punti 4-5: bisogna provare di aver già
 *   iniziato (fontiPercorso.pmiMettersiInProprio);
 * - UFAS, importi dal 01.01.2027: contributo minimo avsIndipendenti[2027]
 *   (fonti.ufasImporti2027).
 * Gli strumenti «Tariffa oraria» e «Budget del primo anno» sono in
 * src/app/strumenti/ e calcolano i contributi AVS con la tavola scalare.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { avsIndipendenti, chf, fonti, fontiPercorso, percentuale, regolePercorso, uffici } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("riconoscimento-avs");
if (!corso) throw new Error("Manca la lezione riconoscimento-avs in src/data/corso.ts");

const avs = avsIndipendenti[2026].valore;
const avsPoi = avsIndipendenti[2027].valore;
const accessoria = regolePercorso.attivitaAccessoriaAvs.valore;
const cassaTicino = uffici.cassaCompensazioneTicino.valore;

// La voce dice le cifre e il nome dell'ufficio in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  avs.anno !== 2026 ||
  avs.tassoMinimoScala !== 0.05371 ||
  avs.tassoMassimo !== 0.1 ||
  avs.limiteInferioreScala !== 10_100 ||
  avs.contributoMinimo !== 530 ||
  avsPoi.anno !== 2027 ||
  avsPoi.contributoMinimo !== 541 ||
  accessoria !== 2_500 ||
  !cassaTicino.nome.startsWith("Istituto delle assicurazioni sociali") ||
  !cassaTicino.indirizzo.endsWith("Bellinzona")
) {
  throw new Error(
    "Un dato sui contributi AVS degli indipendenti o sulla cassa ticinese è cambiato: aggiorna `voce` delle scene 5, 10 e 11 e rifalle (npm run voce -- riconoscimento-avs 5 10 11).",
  );
}

const ANNO = avs.anno;
const TASSO_MIN = percentuale(avs.tassoMinimoScala, 3);
const TASSO_MAX = percentuale(avs.tassoMassimo, 0);
const LIMITE = chf(avs.limiteInferioreScala);
const MINIMO = chf(avs.contributoMinimo);
const MINIMO_POI = chf(avsPoi.contributoMinimo);
const ACCESSORIA = chf(accessoria);
const LUOGO_CASSA = cassaTicino.indirizzo.split(" ").at(-1);

/** Come la voce deve dire l'indirizzo del sito (da ascoltare). */
const SITO_VOCE = "indipendente punto ci-acca";

export const riconoscimentoAvs: Lezione = {
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
      testo: "Ciao, sono Bleo! Per lavorare in proprio non basta deciderlo: deve riconoscerlo la cassa AVS. Ti spiego come.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "ravs-chi",
      stile: "lavagna",
      testo:
        "Per l'AVS sei indipendente se lavori a tuo nome e per conto tuo, e ti assumi il rischio economico. Non lo decide il contratto: la cassa di compensazione guarda come lavori davvero.",
      schermo: {
        tipo: "punto",
        titolo: "Chi è indipendente",
        testo: "Lavori a tuo nome e per conto tuo, con il rischio economico. Decide la cassa AVS, in base ai fatti.",
        fonte: fonti.avsPromemoria202,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "ravs-criteri",
      stile: "lavagna",
      testo:
        "La cassa guarda soprattutto quattro cose. Fai le fatture a tuo nome? Il rischio è tuo, per esempio con investimenti o un affitto? Decidi tu come lavorare? E lavori per diversi clienti?",
      schermo: {
        tipo: "punto",
        titolo: "Cosa guarda la cassa",
        testo: "Fatture a tuo nome, rischio economico tuo, lavoro organizzato da te, diversi clienti.",
        fonte: fonti.avsPromemoria202,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "ravs-un-cliente",
      stile: "lavagna",
      testo:
        "Attenzione: se lavori per un solo cliente, di regola sei considerato un dipendente. E puoi essere indipendente in un'attività e dipendente in un'altra.",
      schermo: {
        tipo: "attenzione",
        titolo: "Un solo cliente?",
        testo: "Di regola sei considerato dipendente. La cassa valuta ogni attività per conto suo.",
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "ravs-cassa",
      stile: "lavagna",
      testo: `Se sei membro di un'associazione professionale con una sua cassa, la domanda va a quella. Se no, va alla cassa cantonale: in Ticino è l'Istituto delle assicurazioni sociali, a ${LUOGO_CASSA}.`,
      voce: "Se sei membro di un'associazione professionale con una sua cassa, la domanda va a quella. Se no, va alla cassa cantonale: in Ticino è l'Istituto delle assicurazioni sociali, a Bellinzona.",
      schermo: {
        tipo: "punto",
        titolo: "Quale cassa",
        testo: `La cassa della tua associazione professionale, se ne ha una; se no la cassa cantonale (in Ticino l'IAS, ${LUOGO_CASSA}).`,
        fonte: fontiPercorso.lavs64,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "ravs-online",
      stile: "lavagna",
      testo:
        "La domanda la fai online, su indipendente.ch, il sito ufficiale che la inoltra alla tua cassa. Falla appena inizi, con le prime offerte o fatture: la cassa vuole vedere che l'attività è partita.",
      voce: `La domanda la fai online, su ${SITO_VOCE}, il sito ufficiale che la inoltra alla tua cassa. Falla appena inizi, con le prime offerte o fatture: la cassa vuole vedere che l'attività è partita.`,
      schermo: {
        tipo: "punto",
        titolo: "Online, appena inizi",
        testo: "Su indipendente.ch, con le prime offerte o fatture: il sito inoltra la domanda alla tua cassa.",
        fonte: fonti.avsDomandaIndipendente,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "ravs-prove",
      stile: "lavagna",
      testo:
        "Alla domanda alleghi le prove: offerte e fatture, contratti, pagamenti ricevuti. E poi pubblicità, contratti d'affitto o di leasing e la prova di quanto hai investito.",
      schermo: {
        tipo: "punto",
        titolo: "Le prove da allegare",
        testo: "Offerte e fatture, contratti, pagamenti ricevuti, pubblicità, affitto o leasing, investimenti.",
        fonte: fonti.avsDomandaIndipendente,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "ravs-decisione",
      stile: "lavagna",
      testo:
        "La cassa verifica tutto con cura, e ci vuole un po'. Poi ti manda la decisione, di solito per lettera. Se dice di no, per quell'attività sei un dipendente: il tuo cliente deve versare per te i contributi AVS.",
      schermo: {
        tipo: "punto",
        titolo: "La decisione",
        testo: "Arriva di solito per lettera. Se è un no, per quell'attività sei dipendente: il cliente versa per te i contributi.",
        fonte: fontiPercorso.avsCosaSuccedeOra,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "ravs-acconti",
      stile: "lavagna",
      testo:
        "Se ti riconosce, la cassa fissa gli acconti: contributi provvisori sul reddito che prevedi, da pagare ogni trimestre. I definitivi si calcolano dopo, sulla tassazione: la cassa ti rimborsa o ti chiede la differenza.",
      schermo: {
        tipo: "punto",
        titolo: "Se ti riconosce",
        testo: "Acconti ogni trimestre sul reddito che prevedi; poi il conguaglio sulla base della tassazione.",
        fonte: fonti.avsPromemoria202,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "ravs-quanto",
      stile: "lavagna",
      testo: `Nel ${ANNO}, per AVS, invalidità e perdita di guadagno, paghi dal ${TASSO_MIN} al ${TASSO_MAX} del reddito. Più guadagni, più alta è la percentuale. In più ci sono gli assegni familiari e le spese della cassa.`,
      voce: "Nel duemilaventisei, per AVS, invalidità e perdita di guadagno, paghi dal cinque virgola trecentosettantuno al dieci per cento del reddito. Più guadagni, più alta è la percentuale. In più ci sono gli assegni familiari e le spese della cassa.",
      schermo: {
        tipo: "punto",
        titolo: `Quanto costa (${ANNO})`,
        testo: `AVS/AI/IPG dal ${TASSO_MIN} al ${TASSO_MAX} del reddito, con la tavola scalare. In più assegni familiari e spese amministrative.`,
        fonte: fonti.avsPromemoria202,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "ravs-poco",
      stile: "lavagna",
      testo: `E se guadagni poco? Nel ${ANNO}, sotto ${LIMITE} di reddito, paghi il minimo: ${MINIMO} l'anno, ${MINIMO_POI} dal ${avsPoi.anno}. Se lavori in proprio accanto a un impiego, e guadagni al massimo ${ACCESSORIA} l'anno, i contributi li paghi solo se li chiedi tu.`,
      voce: "E se guadagni poco? Nel duemilaventisei, sotto diecimilacento franchi di reddito, paghi il minimo: cinquecentotrenta franchi l'anno, cinquecentoquarantuno dal duemilaventisette. Se lavori in proprio accanto a un impiego, e guadagni al massimo duemilacinquecento franchi l'anno, i contributi li paghi solo se li chiedi tu.",
      schermo: {
        tipo: "punto",
        titolo: "Se guadagni poco",
        testo: `${ANNO}: sotto ${LIMITE} il minimo è ${MINIMO} (${MINIMO_POI} dal ${avsPoi.anno}). Attività accessoria fino a ${ACCESSORIA}: contributi solo su richiesta.`,
        fonte: fonti.avsPromemoria202,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Bleo ha uno strumento, «Tariffa oraria»: calcola quanto chiedere all'ora, contributi AVS compresi. Sul tuo caso decide la cassa: nel dubbio, chiedi a lei o a un fiduciario autorizzato.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "«Tariffa oraria»: quanto chiedere all'ora, contributi AVS compresi. Sul tuo caso decide la cassa.",
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fonti.avsPromemoria202, verificatoIl: corso.verificatoIl },
    },
  ],
};
