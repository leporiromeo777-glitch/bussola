/**
 * Lezione 1, versione 2: «Quale forma per la tua attività?». Le quattro forme
 * più comuni (ditta individuale, società in nome collettivo, Sagl, SA), chi
 * paga i debiti, le imposte e come scegliere; poi la ditta individuale, il
 * passo del percorso.
 *
 * Fonti (pagine del Portale PMI ricontrollate il 17.10.2026, vedi
 * VERIFICATO_FORME in src/data/svizzera.ts):
 * - ditta individuale: nasce con l'attività, nessun capitale, un solo
 *   titolare, risponde con il patrimonio personale, imposte sul reddito del
 *   titolare (fonti.pmiDittaIndividuale, fontiPercorso.pmiImposteDitta);
 * - nome collettivo: due o più persone fisiche, nessun capitale minimo,
 *   iscrizione obbligatoria nel RC (art. 552 CO), i soci rispondono in
 *   seconda istanza con il patrimonio personale (art. 568 CO), ogni socio è
 *   tassato per la sua parte (fontiPercorso.pmiNomeCollettivo);
 * - Sagl e SA: persone giuridiche, atto pubblico e iscrizione nel RC, capitale
 *   minimo (regole.capitaleMinimoSagl e capitaleMinimoSa, artt. 773 e 621 CO),
 *   per i debiti risponde solo il patrimonio sociale, tassate come società
 *   (fontiPercorso.pmiSagl, fontiPercorso.pmiSa);
 * - criteri di scelta (autonomia, rischio, capitale, imposte) e indicazioni
 *   generali (fontiPercorso.pmiScegliereForma).
 *
 * La voce dice «Blìo» ed «esse-a», e le cifre in parole («ventimila
 * franchi», nel campo `voce` della scena 5): se cambiano i dati, va rifatta
 * la voce con `npm run voce` (vedi il controllo qui sotto). Lo schermo scrive
 * Bleo, SA e CHF 20'000.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { chf, fonti, fontiPercorso, regole, VERIFICATO_FORME } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("ditta-individuale");
if (!corso) throw new Error("Manca la lezione ditta-individuale in src/data/corso.ts");

// La voce (scena 5) dice «ventimila» e «centomila franchi».
if (regole.capitaleMinimoSagl.valore !== 20_000 || regole.capitaleMinimoSa.valore !== 100_000) {
  throw new Error("Il capitale minimo di Sagl o SA è cambiato: aggiorna `voce` della scena 5 e rifalla (npm run voce -- ditta-individuale 5).");
}
const SAGL = chf(regole.capitaleMinimoSagl.valore);
const SA = chf(regole.capitaleMinimoSa.valore);

export const dittaIndividuale: Lezione = {
  id: corso.passoId,
  numero: corso.numero,
  titolo: "Quale forma per la tua attività?",
  clip: "clip.mp4",
  prossimoPasso: titoloProssimoPasso(corso.passoId),
  scene: [
    {
      audio: "scena-1.mp3",
      disegno: "titolo-lezione",
      stile: "presentatore",
      testo: "Ciao, sono Bleo! Prima di aprire un'attività, scegli la forma giuridica giusta. Ecco le quattro più comuni.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: "Quale forma per la tua attività?" },
    },
    {
      audio: "scena-2.mp3",
      disegno: "quattro-forme",
      stile: "lavagna",
      testo:
        "La ditta individuale è per una persona sola. La società in nome collettivo è per due o più persone. Sagl e SA, invece, sono società vere e proprie, separate da chi le fonda.",
      schermo: {
        tipo: "punto",
        titolo: "Le quattro forme più comuni",
        testo: "Ditta individuale, società in nome collettivo, Sagl e SA.",
        fonte: fontiPercorso.pmiScegliereForma,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "ditta-tre-punti",
      stile: "lavagna",
      testo: "La ditta individuale è la più semplice: nasce quando inizi l'attività, non serve un capitale minimo e il titolare sei solo tu.",
      schermo: {
        tipo: "punto",
        titolo: "Ditta individuale",
        testo: "Nasce quando inizi, senza capitale minimo, con un solo titolare.",
        fonte: fonti.pmiDittaIndividuale,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "nome-collettivo",
      stile: "lavagna",
      testo:
        "La società in nome collettivo è simile, ma per due o più persone. Anche qui non serve un capitale minimo, ma va iscritta nel registro di commercio. Se la società non paga i suoi debiti, ne rispondono i soci, con il loro patrimonio personale.",
      schermo: {
        tipo: "punto",
        titolo: "Società in nome collettivo",
        testo: "Due o più persone, nel registro di commercio. Per i debiti rispondono anche i soci.",
        fonte: fontiPercorso.pmiNomeCollettivo,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "sagl-sa",
      stile: "lavagna",
      testo: `Sagl e SA, invece, si fondano davanti a un notaio e nascono con l'iscrizione nel registro di commercio. Serve un capitale minimo: per la Sagl almeno ${SAGL}, per la SA almeno ${SA}.`,
      voce: "Sagl ed esse-a, invece, si fondano davanti a un notaio e nascono con l'iscrizione nel registro di commercio. Serve un capitale minimo: per la Sagl almeno ventimila franchi, per la esse-a almeno centomila franchi.",
      schermo: {
        tipo: "punto",
        titolo: "Sagl e SA",
        testo: `Notaio e registro di commercio. Capitale minimo: Sagl ${SAGL}, SA ${SA}.`,
        fonte: fontiPercorso.pmiSagl,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "chi-paga-debiti",
      stile: ["presentatore", "lavagna"],
      testo:
        "Attenzione: nella ditta individuale tu e la ditta siete la stessa persona. Per questo rispondi dei debiti con tutto il tuo patrimonio personale. Nella Sagl e nella SA, invece, per i debiti risponde solo il patrimonio della società.",
      schermo: {
        tipo: "attenzione",
        titolo: "Rispondi con il tuo patrimonio personale",
        testo: "Nella ditta individuale tu e la ditta siete la stessa persona.",
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "imposte-confronto",
      stile: "lavagna",
      testo:
        "Anche le imposte cambiano. Con la ditta individuale, e anche nella società in nome collettivo, il reddito va nella tua dichiarazione personale. Sagl e SA, invece, pagano le imposte come società.",
      schermo: {
        tipo: "punto",
        titolo: "Le imposte",
        testo: "Ditta e nome collettivo: nella tua dichiarazione. Sagl e SA: come società.",
        fonte: fontiPercorso.pmiImposteDitta,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "quattro-domande",
      stile: "lavagna",
      testo:
        "Come scegliere? Fatti quattro domande. Sei da solo o con altre persone? Quanto rischio c'è, per esempio di debiti? Quanto capitale puoi mettere? E come vuoi pagare le imposte?",
      schermo: {
        tipo: "punto",
        titolo: "Come scegliere",
        testo: "Da solo o con altri? Quanto rischio? Quanto capitale? Come pagare le imposte?",
        fonte: fontiPercorso.pmiScegliereForma,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "percorso-scelta",
      stile: "lavagna",
      testo:
        "In generale: da solo e con poco rischio, spesso si parte con la ditta individuale. Con altre persone, spesso con una società in nome collettivo. Con più rischio, di solito si sceglie una Sagl o una SA.",
      schermo: {
        tipo: "punto",
        titolo: "In generale",
        testo: "Da solo e poco rischio: spesso ditta individuale. Con altri: nome collettivo. Più rischio: Sagl o SA.",
        fonte: fontiPercorso.pmiScegliereForma,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo: "Queste sono indicazioni generali. Per il tuo caso, chiedi a un fiduciario autorizzato.",
      schermo: { tipo: "punto", titolo: "Per il tuo caso", testo: "Chiedi a un fiduciario autorizzato." },
    },
    {
      audio: "scena-11.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto, sul Portale PMI della Confederazione. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.pmiScegliereForma, verificatoIl: VERIFICATO_FORME },
    },
  ],
};
