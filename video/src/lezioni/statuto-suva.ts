/**
 * Lezione 10: «Edilizia e trasporti: decide anche la Suva». Fonti,
 * ricontrollate il 18.10.2026 (VERIFICATO_SUVA in src/data/svizzera.ts):
 * - LAINF art. 66 (fontiPercorso.lainf66): i settori in cui la Suva assicura
 *   d'obbligo i lavoratori (industria, edilizia e installazioni, boschi,
 *   trasporti, …); OAINF art. 73 (fontiPercorso.oainf73): nell'edilizia
 *   rientra anche la pulizia di edifici, strade e piazze;
 * - Suva, accertamento indipendente o dipendente (fontiPercorso.suvaAccertamento):
 *   perché si controlla (l'indipendente non è assicurato d'obbligo contro gli
 *   infortuni), la richiesta va alla cassa AVS che la inoltra alla Suva, i
 *   criteri, il subappalto (l'esempio del gessatore) e le eccezioni, i
 *   documenti, il termine di regoleSuva.termineDocumentiGiorni giorni, la
 *   conferma ai committenti durante l'accertamento;
 * - Suva, assicurazione per imprenditori (fontiPercorso.suvaImprenditori):
 *   «per prima cosa» la richiesta alla cassa AVS, che la inoltra alla Suva;
 * - Suva, la decisione (fontiPercorso.suvaDecisione): indipendente,
 *   dipendente o doppio statuto, i committenti assicurano anche per il
 *   passato, opposizione scritta entro regoleSuva.termineOpposizioneGiorni
 *   giorni, prima parlarne con l'agenzia Suva;
 * - indipendente.ch, «Cosa significa indipendenza?» (fontiPercorso.avsIndipendenza):
 *   nei settori Suva la cassa valuta d'accordo con la Suva; per le domande si
 *   contatta la cassa (FAQ).
 * Lo strumento «Preventivo e fattura» è in src/app/strumenti/preventivo e fattura.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { fontiPercorso, regoleSuva } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("statuto-suva");
if (!corso) throw new Error("Manca la lezione statuto-suva in src/data/corso.ts");

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (regoleSuva.termineDocumentiGiorni.valore !== 30 || regoleSuva.termineOpposizioneGiorni.valore !== 30) {
  throw new Error("Un termine della Suva è cambiato: aggiorna `voce` delle scene 8 e 10 e rifalle (npm run voce -- statuto-suva 8 10).");
}

const DOCUMENTI = regoleSuva.termineDocumentiGiorni.valore;
const OPPOSIZIONE = regoleSuva.termineOpposizioneGiorni.valore;

export const statutoSuva: Lezione = {
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
        "Ciao, sono Bleo! Lavori in proprio nell'edilizia o nei trasporti? Allora c'è un controllo in più: la Suva verifica se sei davvero indipendente. Ti spiego come funziona.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "suva-settori",
      stile: "lavagna",
      testo:
        "Il controllo vale nei settori in cui la Suva assicura per legge i lavoratori. Per esempio edilizia e installazioni, pulizia di edifici, trasporti, industria e lavori nei boschi.",
      schermo: {
        tipo: "punto",
        titolo: "I settori della Suva",
        testo: "Per esempio edilizia e installazioni, pulizia di edifici, trasporti, industria, lavori forestali.",
        fonte: fontiPercorso.lainf66,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "suva-perche",
      stile: "lavagna",
      testo:
        "Perché questo controllo? Da dipendente sei assicurato contro gli infortuni per legge: ci pensa chi ti dà lavoro. Da indipendente no: dell'assicurazione ti occupi tu.",
      schermo: {
        tipo: "punto",
        titolo: "Perché conta",
        testo: "Da dipendente ti assicura chi ti dà lavoro. Da indipendente l'assicurazione infortuni è affare tuo.",
        fonte: fontiPercorso.suvaAccertamento,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "suva-domanda",
      stile: "lavagna",
      testo:
        "Non devi andare tu alla Suva. Presenti la domanda di riconoscimento alla cassa AVS, come tutti. Per questi settori la cassa la inoltra alla Suva, che esamina il tuo caso.",
      schermo: {
        tipo: "punto",
        titolo: "Prima la cassa AVS",
        testo: "La domanda va alla cassa AVS: nei settori della Suva la cassa la inoltra alla Suva.",
        fonte: fontiPercorso.suvaImprenditori,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "suva-criteri",
      stile: "lavagna",
      testo:
        "Per la Suva sei indipendente se lavori a tuo nome e per conto tuo, per i tuoi clienti. Se il rischio economico è tuo. E se non dipendi dall'organizzazione di un'altra impresa.",
      schermo: {
        tipo: "punto",
        titolo: "Quando sei indipendente",
        testo: "A tuo nome e per conto tuo, con il rischio economico tuo, senza dipendere da un'altra impresa.",
        fonte: fontiPercorso.suvaAccertamento,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "suva-subappalto",
      stile: "lavagna",
      testo:
        "Attenzione al subappalto. La Suva fa questo esempio: un gessatore rifà il soffitto di una famiglia, ma manda la fattura all'impresa che gli ha dato il lavoro. Così è considerato dipendente di quell'impresa.",
      schermo: {
        tipo: "attenzione",
        titolo: "Il subappalto",
        testo: "In subappalto o a cottimo, di regola sei dipendente dell'impresa che ti dà il lavoro.",
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "suva-eccezioni",
      stile: "lavagna",
      testo:
        "In subappalto sei indipendente solo in casi eccezionali: se hai un posto di lavoro attrezzato, macchine o veicoli, il materiale pagato da te, dei dipendenti fissi. O se lavori regolarmente anche per clienti tuoi.",
      schermo: {
        tipo: "punto",
        titolo: "Le eccezioni",
        testo: "Una tua organizzazione (attrezzi, macchine, materiale, dipendenti) o anche clienti tuoi.",
        fonte: fontiPercorso.suvaAccertamento,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "suva-prove",
      stile: "lavagna",
      testo: `Prepara le prove: contratti, offerte e fatture ai clienti, il sito o i biglietti da visita. Nell'edilizia anche le fatture di attrezzi e materiale, nei trasporti il contratto del veicolo. Se la Suva ti chiede i documenti, hai ${DOCUMENTI} giorni per mandarli.`,
      voce: "Prepara le prove: contratti, offerte e fatture ai clienti, il sito o i biglietti da visita. Nell'edilizia anche le fatture di attrezzi e materiale, nei trasporti il contratto del veicolo. Se la Suva ti chiede i documenti, hai trenta giorni per mandarli.",
      schermo: {
        tipo: "punto",
        titolo: "Le prove",
        testo: `Contratti, offerte e fatture, sito, attrezzi e materiale. Alla Suva entro ${DOCUMENTI} giorni dalla richiesta.`,
        fonte: fontiPercorso.suvaAccertamento,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "suva-decisione",
      stile: "lavagna",
      testo:
        "Alla fine la Suva decide, d'accordo con la cassa AVS. Le decisioni possibili sono tre: indipendente, dipendente o doppio statuto. Cioè indipendente per alcuni lavori e dipendente per altri.",
      schermo: {
        tipo: "punto",
        titolo: "Tre decisioni possibili",
        testo: "Indipendente, dipendente o doppio statuto: indipendente per alcuni lavori, dipendente per altri.",
        fonte: fontiPercorso.suvaDecisione,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "suva-passato",
      stile: "lavagna",
      testo: `La decisione vale anche per il passato: se sei dipendente, i committenti devono assicurarti anche per i lavori già fatti. Non sei d'accordo? Parlane prima con l'agenzia Suva. Puoi fare opposizione scritta entro ${OPPOSIZIONE} giorni.`,
      voce: "La decisione vale anche per il passato: se sei dipendente, i committenti devono assicurarti anche per i lavori già fatti. Non sei d'accordo? Parlane prima con l'agenzia Suva. Puoi fare opposizione scritta entro trenta giorni.",
      schermo: {
        tipo: "punto",
        titolo: "Vale anche per il passato",
        testo: `Da dipendente ti assicurano i committenti, anche per i lavori già fatti. Opposizione entro ${OPPOSIZIONE} giorni.`,
        fonte: fontiPercorso.suvaDecisione,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "suva-attesa",
      stile: "lavagna",
      testo:
        "E mentre aspetti? Se un committente ti chiede una conferma, spiegagli che la domanda è in esame: la conferma arriva solo dopo il sì della Suva. Intanto fatti confermare l'incarico per iscritto.",
      schermo: {
        tipo: "punto",
        titolo: "Mentre aspetti",
        testo: "Spiega ai committenti che la domanda è in esame e fatti confermare l'incarico per iscritto.",
        fonte: fontiPercorso.suvaAccertamento,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Bleo ha uno strumento, «Preventivo e fattura», per fare offerte e fatture a tuo nome. Per il tuo caso personale chiedi alla Suva o alla tua cassa AVS. E per altri dubbi, chiedimelo in chat.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "«Preventivo e fattura»: offerte e fatture a tuo nome. Per il tuo caso: Suva o cassa AVS.",
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.suvaAccertamento, verificatoIl: corso.verificatoIl },
    },
  ],
};
