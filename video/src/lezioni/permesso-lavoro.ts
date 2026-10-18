/**
 * Lezione 7: «Il permesso per lavorare in proprio». Fonti, ricontrollate il
 * 18.10.2026 (VERIFICATO_PERMESSI in src/data/svizzera.ts):
 * - LStrI, art. 38 cpv. 4 (con il permesso C si lavora in proprio in tutta la
 *   Svizzera) e art. 19 (condizioni per i cittadini di altri Stati)
 *   (fontiPercorso.lstri38, lstri19); Portale PMI, «Mettersi in proprio»,
 *   punti 6 e 7 (fontiPercorso.pmiMettersiInProprio);
 * - SEM: scheda sul soggiorno con attività lucrativa (permesso B UE/AELS per
 *   indipendenti, regolePermessi.durataPermessoIndipendentiAnni anni, prova
 *   dell'attività già con la domanda), scheda sui frontalieri (permesso G,
 *   rientro regolePermessi.rientroFrontalieri), FAQ sulla libera circolazione
 *   (passaggio da dipendente a indipendente con il permesso B, nuovo permesso
 *   B con il permesso L, inizio dell'attività dopo il deposito dei documenti),
 *   Istruzioni OLCP n. II 4.3 (attività per conto proprio, nuove prove e
 *   revoca);
 * - Ufficio della migrazione ticinese: avvertenze per i permessi B e G degli
 *   indipendenti UE/AELS (obblighi, notificaCambiamentiGiorni e
 *   rinnovoPrimaDellaScadenzaGiorni), pagine per chiedere il permesso B e il
 *   permesso G (procedura online, prima di iniziare), pagina per la modifica
 *   del permesso B (avvisare prima dell'inizio di un'attività);
 * - Grigioni: pagina e promemoria dell'Ufficio della migrazione e del diritto
 *   civile per i dimoranti e i frontalieri indipendenti (documenti, controllo
 *   abitanti del Comune).
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { fontiPercorso, regolePermessi as perm, ufficiPercorso } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("permesso-lavoro");
if (!corso) throw new Error("Manca la lezione permesso-lavoro in src/data/corso.ts");

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  perm.durataPermessoIndipendentiAnni.valore !== 5 ||
  perm.rientroFrontalieri.valore !== "almeno una volta alla settimana" ||
  perm.notificaCambiamentiGiorni.valore !== 14 ||
  perm.rinnovoPrimaDellaScadenzaGiorni.valore !== 14
) {
  throw new Error(
    "Una regola sui permessi è cambiata: aggiorna `voce` delle scene 3, 4 e 10 e rifalle (npm run voce -- permesso-lavoro 3 4 10).",
  );
}

const ANNI = perm.durataPermessoIndipendentiAnni.valore;
const RIENTRO = perm.rientroFrontalieri.valore;
const GIORNI_CAMBI = perm.notificaCambiamentiGiorni.valore;
const GIORNI_RINNOVO = perm.rinnovoPrimaDellaScadenzaGiorni.valore;
const UFFICIO = ufficiPercorso.migrazioneTicino.valore.nome;

/**
 * Le lettere dei permessi e la sigla AELS dette dalla voce: le lettere con il
 * loro nome italiano, l'AELS per esteso (la sigla non è in src/voce.ts).
 */
const AELS_VOCE = "Associazione europea di libero scambio";

export const permessoLavoro: Lezione = {
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
        "Ciao, sono Bleo! Non hai la cittadinanza svizzera? Prima di metterti in proprio, controlla il tuo permesso: ti spiego quale ti serve e come si chiede.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "perm-svizzero",
      stile: "lavagna",
      testo: "Se sei cittadino svizzero, o hai il permesso C, puoi lavorare in proprio in tutta la Svizzera. Non ti serve un altro permesso.",
      voce: "Se sei cittadino svizzero, o hai il permesso ci, puoi lavorare in proprio in tutta la Svizzera. Non ti serve un altro permesso.",
      schermo: {
        tipo: "punto",
        titolo: "Svizzeri e permesso C",
        testo: "Puoi lavorare in proprio in tutta la Svizzera, senza un altro permesso.",
        fonte: fontiPercorso.lstri38,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "perm-ue",
      stile: "lavagna",
      testo: `Se sei cittadino di un Paese dell'Unione europea o dell'AELS, e vuoi abitare in Svizzera, chiedi il permesso B per l'attività indipendente. Se la domanda è accolta, vale ${ANNI} anni e si può rinnovare.`,
      voce: `Se sei cittadino di un Paese dell'Unione europea o dell'${AELS_VOCE}, e vuoi abitare in Svizzera, chiedi il permesso bi per l'attività indipendente. Se la domanda è accolta, vale cinque anni e si può rinnovare.`,
      schermo: {
        tipo: "punto",
        titolo: "UE/AELS: il permesso B",
        testo: `Per chi vuole abitare in Svizzera. Se la domanda è accolta vale ${ANNI} anni e si può rinnovare.`,
        fonte: fontiPercorso.semSoggiornoAttivita,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "perm-frontaliere",
      stile: "lavagna",
      testo: `Se invece abiti in uno di questi Paesi e lavori qui da frontaliere, ti serve il permesso G per l'attività indipendente. Anche lui vale ${ANNI} anni, e devi tornare a casa ${RIENTRO}.`,
      voce: "Se invece abiti in uno di questi Paesi e lavori qui da frontaliere, ti serve il permesso gi per l'attività indipendente. Anche lui vale cinque anni, e devi tornare a casa almeno una volta alla settimana.",
      schermo: {
        tipo: "punto",
        titolo: "Frontalieri: il permesso G",
        testo: `Vale ${ANNI} anni. Torni a casa, all'estero, ${RIENTRO}.`,
        fonte: fontiPercorso.semFrontalieri,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "perm-dipendente",
      stile: "lavagna",
      testo:
        "Lavori già qui da dipendente, con il permesso B? Se sei cittadino di uno di questi Paesi, puoi passare all'attività indipendente, ma prima avvisa l'Ufficio della migrazione. Con il permesso L, invece, ti serve un nuovo permesso B.",
      voce: "Lavori già qui da dipendente, con il permesso bi? Se sei cittadino di uno di questi Paesi, puoi passare all'attività indipendente, ma prima avvisa l'Ufficio della migrazione. Con il permesso elle, invece, ti serve un nuovo permesso bi.",
      schermo: {
        tipo: "punto",
        titolo: "Sei già dipendente?",
        testo: "Con il permesso B puoi passare all'attività indipendente: avvisa prima l'ufficio. Con il permesso L serve un nuovo permesso B.",
        fonte: fontiPercorso.semFaqLiberaCircolazione,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "perm-altri",
      stile: "lavagna",
      testo:
        "Vieni da un altro Paese e non hai il permesso C? Le condizioni sono più severe. Per esempio, ti ammettono solo se è nell'interesse dell'economia svizzera, e se hai i mezzi per finanziare l'attività e per vivere.",
      voce: "Vieni da un altro Paese e non hai il permesso ci? Le condizioni sono più severe. Per esempio, ti ammettono solo se è nell'interesse dell'economia svizzera, e se hai i mezzi per finanziare l'attività e per vivere.",
      schermo: {
        tipo: "attenzione",
        titolo: "Da altri Paesi, senza permesso C",
        testo: "Le condizioni sono più severe: interesse dell'economia svizzera, finanziamento e mezzi per vivere.",
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "perm-vera",
      stile: "lavagna",
      testo:
        "Con il permesso B o G, l'attività indipendente deve essere vera. Già con la domanda dimostri che lavori per conto tuo e che ne puoi vivere. Se poi ci sono dubbi, l'ufficio può chiederti nuove prove, e anche revocare il permesso.",
      voce: "Con il permesso bi o gi, l'attività indipendente deve essere vera. Già con la domanda dimostri che lavori per conto tuo e che ne puoi vivere. Se poi ci sono dubbi, l'ufficio può chiederti nuove prove, e anche revocare il permesso.",
      schermo: {
        tipo: "punto",
        titolo: "Un'attività vera",
        testo: "Già con la domanda dimostri che lavori per conto tuo e che ne puoi vivere.",
        fonte: fontiPercorso.semIstruzioniOlcp,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "perm-documenti",
      stile: "lavagna",
      testo:
        "Cosa preparare? L'elenco ufficiale dei Grigioni chiede, tra l'altro, un business plan e le prove che l'attività ti fa vivere, come commesse e contabilità. Poi il contratto d'affitto del locale e l'assicurazione malattia e infortuni.",
      schermo: {
        tipo: "punto",
        titolo: "I documenti, per esempio",
        testo: "Business plan, commesse e contabilità, contratto d'affitto del locale, assicurazione malattia e infortuni.",
        fonte: fontiPercorso.grPromemoriaIndipendenti,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "perm-domanda",
      stile: "lavagna",
      testo: `In Ticino la domanda va all'${UFFICIO}, con la procedura online. Mandala prima di iniziare: puoi partire solo dopo averla inoltrata, con i documenti richiesti. Nei Grigioni passa di regola dal controllo abitanti del Comune.`,
      schermo: {
        tipo: "punto",
        titolo: "La domanda",
        testo: `In Ticino all'${UFFICIO}, online, prima di iniziare. Nei Grigioni dal controllo abitanti del Comune.`,
        fonte: fontiPercorso.umRichiestaPermessoB,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "perm-obblighi",
      stile: "lavagna",
      testo: `Poi valgono per te le stesse regole degli svizzeri: per la professione, l'AVS e le imposte. I cambiamenti li comunichi all'Ufficio della migrazione entro ${GIORNI_CAMBI} giorni, e il rinnovo lo chiedi almeno ${GIORNI_RINNOVO} giorni prima della scadenza.`,
      voce: "Poi valgono per te le stesse regole degli svizzeri: per la professione, l'AVS e le imposte. I cambiamenti li comunichi all'Ufficio della migrazione entro quattordici giorni, e il rinnovo lo chiedi almeno quattordici giorni prima della scadenza.",
      schermo: {
        tipo: "punto",
        titolo: "I tuoi obblighi",
        testo: `Le regole degli svizzeri valgono anche per te. Cambiamenti entro ${GIORNI_CAMBI} giorni, rinnovo almeno ${GIORNI_RINNOVO} giorni prima della scadenza.`,
        fonte: fontiPercorso.umIndipendentiUeAelsB,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Prima di iniziare, chiedi conferma all'ufficio della migrazione del tuo Cantone. E se il tuo caso è complicato, fatti aiutare da un professionista, per esempio un avvocato che si occupa di permessi.",
      schermo: {
        tipo: "punto",
        titolo: "Nel dubbio, chiedi",
        testo: "All'ufficio della migrazione del tuo Cantone, prima di iniziare. Nei casi complicati, a un professionista.",
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.umIndipendentiUeAelsB, verificatoIl: corso.verificatoIl },
    },
  ],
};
