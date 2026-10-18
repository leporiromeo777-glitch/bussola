/**
 * Lezione 17: «Come fare una fattura corretta». Fonti, ricontrollate il
 * 18.10.2026 (VERIFICATO_FATTURE in src/data/svizzera.ts):
 * - LIVA, stato 31.03.2025: la fattura indica chiaramente fornitore,
 *   destinatario e genere della prestazione; per chi è iscritto, nome e luogo
 *   del fornitore con il numero IVA, nome e luogo del destinatario, data o
 *   periodo, genere e oggetto della prestazione, importo, aliquota e imposta
 *   (art. 26, fontiPercorso.liva26); chi non è iscritto non può menzionare
 *   l'imposta, se lo fa la deve, salvo correzione con un documento ricettizio
 *   che annulla la fattura (art. 27, fonti.liva27);
 * - CO, testo in vigore dal 01.10.2026: nelle fatture la ditta iscritta nel
 *   registro di commercio, completa e senza modifiche; in più abbreviazioni,
 *   simboli, nomi commerciali (art. 954a, fontiPercorso.co954a); documenti
 *   contabili su carta o in digitale, conservati per
 *   regolePercorso.conservazioneDocumentiAnni anni (artt. 957a e 958f,
 *   fonti.co958f);
 * - AFC: numero IVA = IDI con il complemento «IVA»
 *   (regoleFatture.formatoNumeroIva, fontiPercorso.afcIdi); UST: ogni impresa
 *   attiva in Svizzera riceve gratis un IDI, che comincia con la sigla del
 *   Paese «CHE» (fontiPercorso.ustIdi);
 * - SIX, pagina della QR-fattura (fonti.six): ha sostituito le polizze di
 *   versamento (regoleFatture.qrFatturaDal), sezione pagamento e ricevuta,
 *   codice QR con la croce svizzera, pagamento in e-banking e m-banking o allo
 *   sportello postale, solo indirizzo strutturato
 *   (datiStrumenti.indirizzoStrutturatoQr).
 * Lo strumento «Preventivo e fattura» (src/app/strumenti/preventivo e
 * fattura) trasforma il preventivo in fattura, mostra l'IVA solo a chi è
 * iscritto e disegna la sezione pagamento con swissqrbill
 * (src/lib/strumenti/qr-svg.ts). Quando iscriversi all'IVA lo spiega la
 * lezione del passo iscrizione-iva.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { PASSI } from "../../../src/data/passi";
import { fonti, fontiPercorso, regoleFatture, regolePercorso } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("fatture");
if (!corso) throw new Error("Manca la lezione fatture in src/data/corso.ts");

/** Il numero della lezione sull'iscrizione all'IVA: la posizione del suo passo nel percorso. */
const LEZIONE_IVA = PASSI.findIndex((p) => p.id === "iscrizione-iva") + 1;
const ANNI = regolePercorso.conservazioneDocumentiAnni.valore;

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (ANNI !== 10 || LEZIONE_IVA !== 14) {
  throw new Error(
    "La durata di conservazione o il numero della lezione sull'IVA sono cambiati: aggiorna `voce` delle scene 4 e 10 e rifalle (npm run voce -- fatture 4 10).",
  );
}

/** Come la voce dice le sigle: IDI e CHE lettera per lettera, QR all'italiana. */
const IDI = "i-di-i";
const QR = "cu-erre";

export const fatture: Lezione = {
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
      testo: "Ciao, sono Bleo! Hai finito il tuo primo lavoro? Ora devi farti pagare, con una fattura. Ti spiego cosa ci va scritto, e cosa no.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "fa-base",
      stile: "lavagna",
      testo: "Una fattura dice chiaramente chi la manda e a chi va, che lavoro hai fatto e quanto costa. Questa è la base, che tu sia iscritto all'IVA o no.",
      schermo: {
        tipo: "punto",
        titolo: "La base di ogni fattura",
        testo: "Chi la manda, a chi va, che lavoro hai fatto e quanto costa.",
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "fa-nome",
      stile: "lavagna",
      testo:
        "Se la tua ditta è iscritta al registro di commercio, in fattura scrivi il suo nome completo e senza cambiarlo, proprio com'è iscritto. Accanto puoi aggiungere un logo o un nome breve.",
      schermo: {
        tipo: "punto",
        titolo: "Il nome della ditta",
        testo: "Se sei iscritto: il nome completo, senza modifiche, com'è nel registro. Logo e nome breve solo in più.",
        fonte: fontiPercorso.co954a,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "fa-senza-iva",
      stile: "lavagna",
      testo: `Finché non sei iscritto all'IVA, in fattura l'IVA non deve comparire: né l'aliquota, né l'importo. Scrivi solo il prezzo del tuo lavoro. Quando devi iscriverti, lo spiega la lezione ${LEZIONE_IVA}.`,
      voce: "Finché non sei iscritto all'IVA, in fattura l'IVA non deve comparire: né l'aliquota, né l'importo. Scrivi solo il prezzo del tuo lavoro. Quando devi iscriverti, lo spiega la lezione quattordici.",
      schermo: {
        tipo: "attenzione",
        titolo: "Non sei iscritto all'IVA?",
        testo: "Niente IVA in fattura: né l'aliquota, né l'importo.",
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "fa-iva-dovuta",
      stile: "lavagna",
      testo:
        "Attenzione: se la scrivi lo stesso, quell'IVA la devi pagare tu alla Confederazione. Se hai sbagliato, correggi: manda al cliente un nuovo documento che annulla la fattura sbagliata.",
      schermo: {
        tipo: "punto",
        titolo: "IVA scritta per errore",
        testo: "La devi alla Confederazione. Correggi con un nuovo documento che annulla la fattura, e mandalo al cliente.",
        fonte: fonti.liva27,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "fa-elementi",
      stile: "lavagna",
      testo:
        "Se invece sei iscritto all'IVA, in fattura servono più dati. Il tuo nome e luogo, con il numero IVA. Il nome e il luogo del cliente. La data o il periodo del lavoro, e cosa hai fatto. E l'importo, con l'aliquota e l'importo dell'IVA.",
      schermo: {
        tipo: "punto",
        titolo: "Se sei iscritto all'IVA",
        testo: "Tuo nome, luogo e numero IVA; nome e luogo del cliente; data e lavoro; importo, aliquota e IVA.",
        fonte: fontiPercorso.liva26,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "fa-numero-iva",
      stile: "lavagna",
      testo:
        "Il numero IVA è il tuo numero IDI, con la parola IVA alla fine. IDI vuol dire numero d'identificazione delle imprese: ogni impresa attiva in Svizzera ne riceve uno, gratis. Comincia sempre con CHE, la sigla della Svizzera.",
      voce: `Il numero IVA è il tuo numero ${IDI}, con la parola IVA alla fine. I-di-i vuol dire numero d'identificazione delle imprese: ogni impresa attiva in Svizzera ne riceve uno, gratis. Comincia sempre con ci-acca-e, la sigla della Svizzera.`,
      schermo: {
        tipo: "punto",
        titolo: "Il numero IVA",
        testo: `${regoleFatture.formatoNumeroIva.valore}: il tuo IDI con «IVA» alla fine.`,
        fonte: fontiPercorso.afcIdi,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "fa-qr",
      stile: "lavagna",
      testo:
        "Per farti pagare usa la QR-fattura: ha preso il posto delle vecchie polizze di versamento. In fondo alla fattura c'è la sezione pagamento, con la ricevuta e un codice QR con la croce svizzera.",
      voce: `Per farti pagare usa la ${QR} fattura: ha preso il posto delle vecchie polizze di versamento. In fondo alla fattura c'è la sezione pagamento, con la ricevuta e un codice ${QR} con la croce svizzera.`,
      schermo: {
        tipo: "punto",
        titolo: "La QR-fattura",
        testo: "Sezione pagamento e ricevuta, con il codice QR e la croce svizzera. Ha sostituito le polizze di versamento.",
        fonte: fonti.six,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "fa-paga",
      stile: "lavagna",
      testo:
        "Nel codice ci sono tutti i dati del pagamento. Il cliente lo scansiona con l'app della banca, oppure paga allo sportello postale. Gli indirizzi vanno scritti a campi separati: via e numero, NPA e località.",
      voce: "Nel codice ci sono tutti i dati del pagamento. Il cliente lo scansiona con l'app della banca, oppure paga allo sportello postale. Gli indirizzi vanno scritti a campi separati: via e numero, enne-pi-a e località.",
      schermo: {
        tipo: "punto",
        titolo: "Come si paga",
        testo: "Con l'app della banca o allo sportello postale. Indirizzi a campi: via e numero, NPA, località.",
        fonte: fonti.six,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "fa-copie",
      stile: "lavagna",
      testo: `Scrivi sempre entro quando la fattura va pagata. E tieni una copia di ogni fattura, su carta o in digitale: è un documento della tua contabilità, da conservare per ${ANNI} anni. Della contabilità parliamo nel prossimo passo.`,
      voce: "Scrivi sempre entro quando la fattura va pagata. E tieni una copia di ogni fattura, su carta o in digitale: è un documento della tua contabilità, da conservare per dieci anni. Della contabilità parliamo nel prossimo passo.",
      schermo: {
        tipo: "punto",
        titolo: "Scadenza e copie",
        testo: `Scrivi entro quando pagare. Conserva ogni fattura per ${ANNI} anni, su carta o in digitale.`,
        fonte: fonti.co958f,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "fa-strumento",
      stile: "lavagna",
      testo:
        "Bleo ha uno strumento, «Preventivo e fattura». Prepari il preventivo e, quando il cliente accetta, lo trasformi in fattura con un clic. L'IVA compare solo se sei iscritto, e la sezione pagamento con il codice QR si crea da sola.",
      voce: `Bleo ha uno strumento, «Preventivo e fattura». Prepari il preventivo e, quando il cliente accetta, lo trasformi in fattura con un clic. L'IVA compare solo se sei iscritto, e la sezione pagamento con il codice ${QR} si crea da sola.`,
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "«Preventivo e fattura»: dal preventivo alla fattura con un clic, IVA solo se sei iscritto, codice QR pronto.",
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Hai clienti all'estero, o un caso particolare? Chiedi a Bleo in chat: risponde con le fonti ufficiali. Nei casi complessi, rivolgiti a un fiduciario autorizzato.",
      schermo: {
        tipo: "punto",
        titolo: "Hai un dubbio?",
        testo: "Chiedi a Bleo in chat. Nei casi complessi: un fiduciario autorizzato.",
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.liva26, verificatoIl: corso.verificatoIl },
    },
  ],
};
