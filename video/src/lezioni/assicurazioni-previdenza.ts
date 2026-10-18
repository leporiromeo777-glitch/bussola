/**
 * Lezione 21: «Malattia e pensione: ci pensi tu». Fonti, controllate il
 * 18.10.2026 (VERIFICATO_PREVIDENZA in src/data/svizzera.ts):
 * - promemoria AVS 2.02, punto 2: gli indipendenti pagano AVS/AI/IPG, ma non
 *   sono assicurati contro la disoccupazione né soggetti al regime
 *   obbligatorio della previdenza professionale (fonti.avsPromemoria202);
 * - LAMal, stato 01.07.2026: l'assicurazione delle cure è obbligatoria,
 *   quella d'indennità giornaliera facoltativa (art. 1a, fontiPercorso.lamal1a);
 *   la possono stipulare le persone che hanno compiuto
 *   regolePrevidenza.etaIndennitaGiornaliera anni (da / primaDi), anche con
 *   un assicuratore diverso da quello delle cure (art. 67, fontiPercorso.lamal67);
 * - Portale PMI: l'indennità giornaliera per malattia è consigliata
 *   all'imprenditore e la offrono casse malati e assicurazioni
 *   (fontiPercorso.pmiIndennitaGiornaliera); i tre pilastri e la ditta
 *   individuale che provvede da sé alla previdenza
 *   (fontiPercorso.pmiAssicurazioniSociali); gli indipendenti non possono
 *   assicurarsi contro la disoccupazione e ricevono l'indennità solo con
 *   abbastanza contributi pagati da dipendenti (fontiPercorso.pmiDisoccupazione);
 * - LPP, stato 01.01.2025: assicurazione facoltativa (art. 4,
 *   fontiPercorso.lpp4) presso l'istituto della professione o dei propri
 *   lavoratori, se no presso l'istituto collettore (art. 44, fontiPercorso.lpp44);
 * - OPP 3, stato 01.01.2025: previdenza vincolata (art. 1) e deduzione dei
 *   contributi, fino a datiStrumenti.quotaMassimaPilastro3a del reddito da
 *   attività lucrativa senza cassa pensione (art. 7, fonti.opp3); importi
 *   massimi pilastro3a dagli importi UFAS 2026 e 2027.
 * Lo strumento «Tariffa oraria» (src/app/strumenti/tariffa) ha i costi fissi
 * «Assicurazioni» e il campo «Versamento nel pilastro 3a, all'anno».
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { chf, datiStrumenti, fonti, fontiPercorso, percentuale, pilastro3a, regolePrevidenza } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("assicurazioni-previdenza");
if (!corso) throw new Error("Manca la lezione assicurazioni-previdenza in src/data/corso.ts");

const eta = regolePrevidenza.etaIndennitaGiornaliera.valore;
const p26 = pilastro3a[2026].valore;
const p27 = pilastro3a[2027].valore;

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  eta.da !== 15 ||
  eta.primaDi !== 65 ||
  datiStrumenti.quotaMassimaPilastro3a.valore !== 0.2 ||
  p26.senzaCassaPensione !== 36_288 ||
  p27.senzaCassaPensione !== 36_864 ||
  p26.conCassaPensione !== 7_258 ||
  p27.conCassaPensione !== 7_373
) {
  throw new Error(
    "Una regola su indennità giornaliera o pilastro 3a è cambiata: aggiorna `voce` delle scene 4, 9 e 10 e rifalle (npm run voce -- assicurazioni-previdenza 4 9 10).",
  );
}

const QUOTA = percentuale(datiStrumenti.quotaMassimaPilastro3a.valore, 0);

export const assicurazioniPrevidenza: Lezione = {
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
      testo:
        "Ciao, sono Bleo! Se ti ammali, chi ti paga? E per la pensione? Da indipendente, molte protezioni dei dipendenti non le hai: tocca a te pensarci.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "prev-quadro",
      stile: "lavagna",
      testo:
        "L'AVS la paghi comunque, e degli infortuni abbiamo già parlato. Però da indipendente non sei assicurato contro la disoccupazione. E la cassa pensione, per te, non è obbligatoria.",
      schermo: {
        tipo: "punto",
        titolo: "Da indipendente",
        testo: "L'AVS è obbligatoria. Niente assicurazione contro la disoccupazione, cassa pensione non obbligatoria.",
        fonte: fonti.avsPromemoria202,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "prev-malattia",
      stile: "lavagna",
      testo:
        "Se ti ammali, l'assicurazione obbligatoria della cassa malati paga le cure. Ma il guadagno che perdi, se non puoi lavorare, non te lo paga. Per quello c'è l'indennità giornaliera per malattia.",
      schermo: {
        tipo: "punto",
        titolo: "Se ti ammali",
        testo: "La cassa malati paga le cure. Il guadagno che perdi lo copre l'indennità giornaliera.",
        fonte: fontiPercorso.lamal1a,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "prev-indennita",
      stile: "lavagna",
      testo: `È facoltativa: la puoi stipulare se hai almeno ${eta.da} anni e non ancora ${eta.primaDi}. Puoi farla anche con un assicuratore diverso dalla tua cassa malati.`,
      voce: "È facoltativa: la puoi stipulare se hai almeno quindici anni e non ancora sessantacinque. Puoi farla anche con un assicuratore diverso dalla tua cassa malati.",
      schermo: {
        tipo: "punto",
        titolo: "Indennità giornaliera",
        testo: `Facoltativa, da ${eta.da} anni compiuti e prima dei ${eta.primaDi}. Anche con un altro assicuratore.`,
        fonte: fontiPercorso.lamal67,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "prev-offerte",
      stile: "lavagna",
      testo:
        "Il Portale PMI della Confederazione la consiglia a chi lavora in proprio. La offrono le casse malati e le assicurazioni: chiedi più offerte e confronta premi e prestazioni.",
      schermo: {
        tipo: "punto",
        titolo: "Consigliata",
        testo: "La offrono casse malati e assicurazioni: confronta premi e prestazioni.",
        fonte: fontiPercorso.pmiIndennitaGiornaliera,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "prev-pilastri",
      stile: "lavagna",
      testo:
        "Per la pensione, in Svizzera ci sono tre pilastri: l'AVS, la cassa pensione e la previdenza privata. Da indipendente il primo è obbligatorio, gli altri due li scegli tu.",
      schermo: {
        tipo: "punto",
        titolo: "I tre pilastri",
        testo: "AVS, cassa pensione e previdenza privata. Da indipendente è obbligatoria solo l'AVS.",
        fonte: fontiPercorso.pmiAssicurazioniSociali,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "prev-lpp",
      stile: "lavagna",
      testo:
        "Per la cassa pensione puoi assicurarti a titolo facoltativo: presso l'istituto della tua professione o quello dei tuoi dipendenti. Se non puoi, c'è l'istituto collettore.",
      schermo: {
        tipo: "punto",
        titolo: "Cassa pensione",
        testo: "Facoltativa: istituto della tua professione o dei tuoi dipendenti, se no l'istituto collettore.",
        fonte: fontiPercorso.lpp44,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "prev-3a",
      stile: "lavagna",
      testo:
        "Poi c'è il pilastro 3a: un risparmio vincolato per la pensione. Quello che versi lo puoi dedurre dal reddito, nella dichiarazione d'imposta.",
      voce: "Poi c'è il pilastro tre a: un risparmio vincolato per la pensione. Quello che versi lo puoi dedurre dal reddito, nella dichiarazione d'imposta.",
      schermo: {
        tipo: "punto",
        titolo: "Pilastro 3a",
        testo: "Un risparmio vincolato per la pensione: i versamenti si deducono dal reddito.",
        fonte: fonti.opp3,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "prev-3a-senza",
      stile: "lavagna",
      testo: `Senza cassa pensione puoi dedurre fino al ${QUOTA} del reddito da lavoro. Al massimo ${chf(p26.senzaCassaPensione)} nel 2026 e ${chf(p27.senzaCassaPensione)} nel 2027.`,
      voce: "Senza cassa pensione puoi dedurre fino al venti per cento del reddito da lavoro. Al massimo trentaseimila duecentottantotto franchi nel duemilaventisei e trentaseimila ottocentosessantaquattro franchi nel duemilaventisette.",
      schermo: {
        tipo: "punto",
        titolo: "Senza cassa pensione",
        testo: `Fino al ${QUOTA} del reddito da attività lucrativa: al massimo ${chf(p26.senzaCassaPensione)} nel 2026, ${chf(p27.senzaCassaPensione)} nel 2027.`,
        fonte: fonti.ufasImporti2026,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "prev-3a-con",
      stile: "lavagna",
      testo: `Se invece hai una cassa pensione, per esempio da un lavoro da dipendente, il massimo è più basso: ${chf(p26.conCassaPensione)} nel 2026 e ${chf(p27.conCassaPensione)} nel 2027.`,
      voce: "Se invece hai una cassa pensione, per esempio da un lavoro da dipendente, il massimo è più basso: settemila duecentocinquantotto franchi nel duemilaventisei e settemila trecentosettantatré franchi nel duemilaventisette.",
      schermo: {
        tipo: "punto",
        titolo: "Con cassa pensione",
        testo: `Al massimo ${chf(p26.conCassaPensione)} nel 2026 e ${chf(p27.conCassaPensione)} nel 2027.`,
        fonte: fonti.ufasImporti2027,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "prev-disoccupazione",
      stile: "lavagna",
      testo:
        "E la disoccupazione? Da indipendente non puoi assicurarti, nemmeno volontariamente. Se l'attività va male, contano solo i contributi pagati prima da dipendente. L'indennità ti spetta solo se sono abbastanza.",
      schermo: {
        tipo: "attenzione",
        titolo: "Disoccupazione",
        testo: "Da indipendente non puoi assicurarti. Contano solo i contributi pagati da dipendente.",
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Premi e versamento nel pilastro 3a: mettili nello strumento «Tariffa oraria» di Bleo. Per scegliere un'assicurazione o quanto risparmiare, chiedi un consiglio a un fiduciario autorizzato o a un consulente indipendente.",
      voce: "Premi e versamento nel pilastro tre a: mettili nello strumento «Tariffa oraria» di Bleo. Per scegliere un'assicurazione o quanto risparmiare, chiedi un consiglio a un fiduciario autorizzato o a un consulente indipendente.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "In «Tariffa oraria» metti premi e pilastro 3a. Per un consiglio: un fiduciario autorizzato o un consulente indipendente.",
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.pmiAssicurazioniSociali, verificatoIl: corso.verificatoIl },
    },
  ],
};
