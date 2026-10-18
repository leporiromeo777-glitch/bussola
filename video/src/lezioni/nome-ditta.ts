/**
 * Lezione 8: «Come chiamare la tua ditta». Fonti, ricontrollate il
 * 18.10.2026 (VERIFICATO_NOME_DITTA in src/data/svizzera.ts):
 * - CO (testo in vigore dal 01.10.2026): il cognome nella ditta individuale,
 *   niente aggiunte da società (art. 945, fonti.co945); aggiunte vere e non
 *   ingannevoli (art. 944, fontiPercorso.co944); nello stesso luogo nessun
 *   altro, nemmeno un omonimo, usa una ditta già iscritta (art. 946,
 *   fontiPercorso.co946); per le società nome libero con la forma giuridica
 *   (art. 950) e diverso da quelli delle società iscritte in Svizzera (art. 951);
 * - registro di commercio ticinese, iscrizione della ditta individuale: il
 *   cognome come sul documento d'identità, l'esempio «Caseificio di Rossi G.»,
 *   l'attività indicata nella ditta va d'accordo con lo scopo
 *   (fonti.rcTicinoIscrizione);
 * - direttiva UFRC sulle ditte del 01.04.2021: il cognome non si modifica
 *   («Müller», non «Mueller»), «banca» solo con l'autorizzazione della FINMA,
 *   designazioni ufficiali come «federale» (fontiPercorso.direttivaDitteUfrc);
 * - Portale PMI: il registro controlla solo i nomi uguali, per quelli simili
 *   chi c'era prima può agire per vie legali (fontiPercorso.pmiIscrizioneNome);
 *   il registro IDI e il «nome supplementare» (fonti.pmiDittaIndividuale);
 * - REGIX (UFRC): sulla somiglianza decide il giudice, una ditta non si può
 *   riservare (fontiPercorso.regixFaq); Zefix, gratuito (fontiPercorso.zefix);
 * - IPI: la ditta non è protetta in automatico come marchio, il marchio vale
 *   in tutta la Svizzera (fontiPercorso.ipiFaqMarchi); ricerche gratuite su
 *   Swissreg e SWITCH, per i nomi simili una ricerca professionale
 *   (fontiPercorso.ipiRicercaAutonoma).
 * Lo strumento «Nome della ditta» è in src/app/strumenti/nome.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { fonti, fontiPercorso } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("nome-ditta");
if (!corso) throw new Error("Manca la lezione nome-ditta in src/data/corso.ts");

/** Come la voce deve dire i nomi propri che legge male (da ascoltare). */
const ZEFIX = "Zèfix";
const IPI = "i-pi-i";
const IDI = "i-di-i";
const SWISSREG = "Suìssreg";
const SWITCH = "Suìtch";

export const nomeDitta: Lezione = {
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
      testo: "Ciao, sono Bleo! Stai per aprire una ditta individuale? Allora le serve un nome. Ti spiego le regole per sceglierlo bene.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "ditta-nome-cognome",
      stile: "lavagna",
      testo:
        "Per la legge, la «ditta» è proprio il nome della tua attività. La regola più importante: deve contenere il tuo cognome. Il tuo nome, invece, puoi metterlo oppure no.",
      schermo: {
        tipo: "punto",
        titolo: "Sempre il tuo cognome",
        testo: "Il nome della ditta individuale contiene il tuo cognome, con o senza il nome.",
        fonte: fonti.co945,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "ditta-nome-documento",
      stile: "lavagna",
      testo: "Il cognome lo scrivi esattamente come sul tuo documento d'identità. Non puoi cambiarlo, nemmeno di una lettera.",
      schermo: {
        tipo: "punto",
        titolo: "Come sul documento",
        testo: "Il cognome va scritto esattamente come sul documento d'identità, senza modifiche.",
        fonte: fonti.rcTicinoIscrizione,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "ditta-nome-aggiunte",
      stile: "lavagna",
      testo:
        "Al cognome puoi aggiungere cosa fai, oppure un nome di fantasia. L'Ufficio ticinese del registro di commercio fa questo esempio: «Caseificio di Rossi G.»",
      voce: "Al cognome puoi aggiungere cosa fai, oppure un nome di fantasia. L'Ufficio ticinese del registro di commercio fa questo esempio: «Caseificio di Rossi Gi».",
      schermo: {
        tipo: "punto",
        titolo: "Cosa puoi aggiungere",
        testo: "Cosa fai o un nome di fantasia. L'esempio del registro ticinese: «Caseificio di Rossi G.»",
        fonte: fonti.rcTicinoIscrizione,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "ditta-nome-vero",
      stile: "lavagna",
      testo:
        "Però le aggiunte devono essere vere e non trarre in inganno. Se il nome dice «Caseificio», la tua attività deve essere davvero quella. E parole come «banca» o «federale» non le può usare chiunque.",
      schermo: {
        tipo: "punto",
        titolo: "Vero, senza inganni",
        testo: "Le aggiunte devono essere vere. Parole come «banca» o «federale» non le può usare chiunque.",
        fonte: fontiPercorso.co944,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "ditta-nome-societa",
      stile: "lavagna",
      testo: "Niente parole che fanno pensare a una società: per una ditta individuale non vanno bene «SA», «Sagl» o «e soci». Il titolare sei solo tu.",
      schermo: {
        tipo: "attenzione",
        titolo: "Niente parole da società",
        testo: "Per una ditta individuale non vanno bene «SA», «Sagl» o «e soci».",
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "ditta-nome-luogo",
      stile: "lavagna",
      testo:
        "Una ditta iscritta nel registro di commercio è protetta: nello stesso luogo nessun altro può usarla. Nemmeno chi si chiama come te: chi arriva dopo deve aggiungere qualcosa che distingua bene la sua ditta.",
      schermo: {
        tipo: "punto",
        titolo: "Nello stesso luogo",
        testo: "Una ditta iscritta non la può usare nessun altro nello stesso luogo, nemmeno chi ha lo stesso nome.",
        fonte: fontiPercorso.co946,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "ditta-nome-simili",
      stile: "lavagna",
      testo:
        "Però, fra i nomi già iscritti, il registro controlla solo quelli uguali. Se il tuo è solo simile a un altro, chi c'era prima può contestarlo davanti al giudice. E un nome non si può prenotare.",
      schermo: {
        tipo: "punto",
        titolo: "Uguale o simile",
        testo: "Il registro controlla solo i nomi uguali. Per quelli simili, se qualcuno contesta, decide il giudice.",
        fonte: fontiPercorso.pmiIscrizioneNome,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "ditta-nome-zefix",
      stile: "lavagna",
      testo:
        "Per questo, prima di decidere, cerca il nome su Zefix, l'indice centrale delle ditte. È gratis e ti mostra le ditte iscritte con un nome uguale o simile.",
      voce: `Per questo, prima di decidere, cerca il nome su ${ZEFIX}, l'indice centrale delle ditte. È gratis e ti mostra le ditte iscritte con un nome uguale o simile.`,
      schermo: {
        tipo: "punto",
        titolo: "Cerca su Zefix",
        testo: "È gratis: ti mostra le ditte iscritte con un nome uguale o simile.",
        fonte: fontiPercorso.zefix,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "ditta-nome-marchio",
      stile: "lavagna",
      testo:
        "Attenzione: la ditta non è protetta in automatico come marchio. Il marchio si registra all'IPI. Cerca il nome anche fra i marchi su Swissreg e fra i nomi di dominio su SWITCH. È gratis, ma per i nomi simili l'IPI consiglia un professionista.",
      voce: `Attenzione: la ditta non è protetta in automatico come marchio. Il marchio si registra all'${IPI}. Cerca il nome anche fra i marchi su ${SWISSREG} e fra i nomi di dominio su ${SWITCH}. È gratis, ma per i nomi simili l'${IPI} consiglia un professionista.`,
      schermo: {
        tipo: "punto",
        titolo: "La ditta non è un marchio",
        testo: "Il marchio si registra all'IPI. Cerca gratis su Swissreg (marchi) e SWITCH (domini).",
        fonte: fontiPercorso.ipiRicercaAutonoma,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "ditta-nome-idi",
      stile: "lavagna",
      testo:
        "Se non iscrivi la ditta nel registro di commercio, nel registro IDI compare con il tuo nome e cognome. Il nome di fantasia appare solo come «nome supplementare».",
      voce: `Se non iscrivi la ditta nel registro di commercio, nel registro ${IDI} compare con il tuo nome e cognome. Il nome di fantasia appare solo come «nome supplementare».`,
      schermo: {
        tipo: "punto",
        titolo: "Nel registro IDI",
        testo: "Senza registro di commercio: nome e cognome; il nome di fantasia solo come «nome supplementare».",
        fonte: fonti.pmiDittaIndividuale,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "ditta-nome-sagl",
      stile: "lavagna",
      testo:
        "E se apri una Sagl o una SA? Il nome lo scegli liberamente, ma deve indicare la forma giuridica. E deve essere ben diverso dai nomi delle società già iscritte in Svizzera.",
      schermo: {
        tipo: "punto",
        titolo: "Con una Sagl o una SA",
        testo: "Nome libero, con la forma giuridica, e diverso da quelli delle società iscritte in Svizzera.",
        fonte: fontiPercorso.co950,
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Bleo ha uno strumento, «Nome della ditta»: ti propone dei nomi con il tuo cognome e fa un primo controllo su Zefix. Se il nome va bene, alla fine lo decide l'Ufficio del registro di commercio.",
      voce: `Bleo ha uno strumento, «Nome della ditta»: ti propone dei nomi con il tuo cognome e fa un primo controllo su ${ZEFIX}. Se il nome va bene, alla fine lo decide l'Ufficio del registro di commercio.`,
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "«Nome della ditta»: idee con il tuo cognome e un primo controllo su Zefix. Decide l'Ufficio del registro.",
      },
    },
    {
      audio: "scena-14.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fonti.co945, verificatoIl: corso.verificatoIl },
    },
  ],
};
