/**
 * Lezione 6: «Lavorare in proprio nella salute». Fonti, lette il 18.10.2026
 * (VERIFICATO_SANITA in src/data/svizzera.ts):
 * - Ufficio di sanità, procedure per il libero esercizio
 *   (fontiPercorso.sanitaLiberoEsercizio): ogni attività sanitaria sotto la
 *   propria responsabilità professionale è soggetta ad autorizzazione;
 *   documenti su carta all'ufficio (ufficioSanitaTicino); l'autorizzazione non
 *   dà da sola il diritto di esercitare a carico della cassa malati;
 * - legge sanitaria (fontiPercorso.lsan): autorizzazione (art. 53), elenco
 *   delle professioni (art. 54), requisiti (art. 56), terapisti complementari
 *   con esame cantonale (art. 63), multa fino a multaMassimaFranchi (art. 95);
 * - Ufficio di sanità, professioni e documenti (fontiPercorso.sanitaDocumenti):
 *   estetista solo per alcune prestazioni, metodi riservati a chi ha il
 *   diploma federale, documenti (validitaDocumentiMesi), tassa pagata prima;
 * - regolamento sull'estetista, art. 1 (fontiPercorso.regolamentoEstetista);
 * - FAQ sui terapisti complementari (fontiPercorso.sanitaFaqTerapisti): il
 *   massaggio classico e rilassante non è un trattamento sanitario, ma non
 *   può invadere il campo del massaggiatore medicale o del fisioterapista né
 *   essere fatto su persone malate;
 * - nota della SEFRI sulle terapie complementari: decidono i Cantoni
 *   (fontiPercorso.sefriTerapieComplementari);
 * - regolamento sulle tasse, art. 2 (fontiPercorso.tasseSanita);
 * - artt. 35-36 LAMal e procedura AOMS dell'Ufficio di sanità
 *   (fontiPercorso.lamal36, fontiPercorso.sanitaAoms).
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { chf, fontiPercorso, regoleSanita as san, ufficioSanitaTicino } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("autorizzazione-sanitaria");
if (!corso) throw new Error("Manca la lezione autorizzazione-sanitaria in src/data/corso.ts");

const ufficio = ufficioSanitaTicino.valore;

// La voce dice le cifre in parole (e il nome dell'ufficio): se un dato cambia, va cambiata e rifatta anche la voce.
if (
  san.multaMassimaFranchi.valore !== 100_000 ||
  san.validitaDocumentiMesi.valore !== 3 ||
  san.tassaAltreProfessioniFranchi.valore.min !== 400 ||
  san.tassaAltreProfessioniFranchi.valore.max !== 600 ||
  san.tassaProfessioniAccademicheFranchi.valore.min !== 600 ||
  san.tassaProfessioniAccademicheFranchi.valore.max !== 1_200 ||
  ufficio.nome !== "Ufficio di sanità" ||
  ufficio.luogo !== "Bellinzona"
) {
  throw new Error(
    "Una regola sulle attività sanitarie è cambiata: aggiorna `voce` delle scene 3, 8 e 9 e rifalle (npm run voce -- autorizzazione-sanitaria 3 8 9).",
  );
}

const MULTA = chf(san.multaMassimaFranchi.valore);
const MESI = san.validitaDocumentiMesi.valore;
const ALTRE_MIN = chf(san.tassaAltreProfessioniFranchi.valore.min);
const ALTRE_MAX = chf(san.tassaAltreProfessioniFranchi.valore.max);
const ACCADEMICHE_MIN = chf(san.tassaProfessioniAccademicheFranchi.valore.min);
const ACCADEMICHE_MAX = chf(san.tassaProfessioniAccademicheFranchi.valore.max);

export const autorizzazioneSanitaria: Lezione = {
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
        "Ciao, sono Bleo! Vuoi lavorare per conto tuo nella salute, nella cura o nel benessere? In Ticino, prima di iniziare, controlla se ti serve un'autorizzazione.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "san-regola",
      stile: "lavagna",
      testo: `In Ticino le attività sanitarie hanno bisogno di un'autorizzazione. Se lavori sotto la tua responsabilità, per esempio nel tuo studio, la rilascia l'${ufficio.nome}. Si chiama autorizzazione di libero esercizio.`,
      schermo: {
        tipo: "punto",
        titolo: "L'autorizzazione di libero esercizio",
        testo: `Per un'attività sanitaria sotto la tua responsabilità, la rilascia l'${ufficio.nome}.`,
        fonte: fontiPercorso.sanitaLiberoEsercizio,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "san-prima",
      stile: "lavagna",
      testo: `Prima ottieni l'autorizzazione, poi inizi a lavorare. Chi non rispetta la legge sanitaria rischia una multa fino a ${MULTA}.`,
      voce: "Prima ottieni l'autorizzazione, poi inizi a lavorare. Chi non rispetta la legge sanitaria rischia una multa fino a centomila franchi.",
      schermo: {
        tipo: "attenzione",
        titolo: "Prima l'autorizzazione",
        testo: `Chi non rispetta la legge sanitaria rischia una multa fino a ${MULTA}.`,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "san-professioni",
      stile: "lavagna",
      testo:
        "Quali professioni? La legge sanitaria le elenca. Per esempio medico, dentista e farmacista. Poi fisioterapista e infermiere, osteopata, psicologo e ottico. E anche massaggiatore medicale ed estetista.",
      schermo: {
        tipo: "punto",
        titolo: "Le professioni sanitarie",
        testo: "Per esempio medico, fisioterapista, infermiere, osteopata, psicologo, massaggiatore medicale ed estetista.",
        fonte: fontiPercorso.lsan,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "san-estetista",
      stile: "lavagna",
      testo:
        "Per l'estetista, però, l'autorizzazione serve solo per alcuni trattamenti. Per esempio il trucco permanente, il microblading e il microneedling. O l'epilazione elettrica e il drenaggio linfatico a fini estetici.",
      schermo: {
        tipo: "punto",
        titolo: "Estetista: solo alcuni trattamenti",
        testo: "Per esempio trucco permanente, microblading, microneedling, epilazione elettrica, drenaggio linfatico.",
        fonte: fontiPercorso.regolamentoEstetista,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "san-massaggio",
      stile: "lavagna",
      testo: `E il massaggio classico o rilassante? Per l'${ufficio.nome} non è un trattamento sanitario: per questo non rilascia un'autorizzazione. Però non puoi trattare persone malate, né fare il lavoro del fisioterapista o del massaggiatore medicale.`,
      schermo: {
        tipo: "punto",
        titolo: "Massaggio classico o rilassante",
        testo: "Non è un trattamento sanitario. Ma niente persone malate e niente lavoro del fisioterapista.",
        fonte: fontiPercorso.sanitaFaqTerapisti,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "san-complementari",
      stile: "lavagna",
      testo:
        "Per le terapie complementari, decide ogni Cantone. In Ticino alcuni metodi, come lo shiatsu o la riflessoterapia, sono riservati a chi ha il diploma federale. Per gli altri metodi, di regola, serve un esame cantonale: poi chiedi l'autorizzazione di terapista complementare.",
      schermo: {
        tipo: "punto",
        titolo: "Terapie complementari",
        testo: "Alcuni metodi solo con il diploma federale. Per gli altri: esame cantonale e autorizzazione di terapista complementare.",
        fonte: fontiPercorso.sanitaDocumenti,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "san-requisiti",
      stile: "lavagna",
      testo: `Ti servono un diploma riconosciuto, una buona conoscenza dell'italiano e un'assicurazione per i danni. Alleghi anche l'estratto del casellario giudiziale e un certificato medico, fatti da non più di ${MESI} mesi.`,
      voce: "Ti servono un diploma riconosciuto, una buona conoscenza dell'italiano e un'assicurazione per i danni. Alleghi anche l'estratto del casellario giudiziale e un certificato medico, fatti da non più di tre mesi.",
      schermo: {
        tipo: "punto",
        titolo: "Cosa ti serve",
        testo: `Diploma riconosciuto, italiano, assicurazione. Casellario e certificato medico di non più di ${MESI} mesi.`,
        fonte: fontiPercorso.sanitaDocumenti,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "san-domanda",
      stile: "lavagna",
      testo: `Paghi prima la tassa online, poi spedisci la domanda su carta all'${ufficio.nome}, a ${ufficio.luogo}. La tassa va da ${ALTRE_MIN} a ${ALTRE_MAX}, oppure da ${ACCADEMICHE_MIN} a ${ACCADEMICHE_MAX} per le professioni con formazione universitaria.`,
      voce: "Paghi prima la tassa online, poi spedisci la domanda su carta all'Ufficio di sanità, a Bellinzona. La tassa va da quattrocento a seicento franchi, oppure da seicento a milleduecento franchi per le professioni con formazione universitaria.",
      schermo: {
        tipo: "punto",
        titolo: "La domanda",
        testo: `Prima la tassa: da ${ALTRE_MIN} a ${ALTRE_MAX}, o da ${ACCADEMICHE_MIN} a ${ACCADEMICHE_MAX} per le professioni universitarie. Poi i documenti su carta.`,
        fonte: fontiPercorso.tasseSanita,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "san-cassa-malati",
      stile: "lavagna",
      testo:
        "Attenzione: l'autorizzazione ti permette di lavorare, ma non basta per fatturare all'assicurazione di base della cassa malati. Per quella serve un'altra autorizzazione del Cantone, e solo alcune professioni possono averla.",
      schermo: {
        tipo: "attenzione",
        titolo: "E la cassa malati?",
        testo: "Per fatturare all'assicurazione di base serve un'altra autorizzazione del Cantone.",
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo: `Fuori dal Ticino, chiedi all'autorità sanitaria del tuo Cantone: le regole cambiano. E nel dubbio, chiedi all'${ufficio.nome} prima di iniziare.`,
      schermo: {
        tipo: "punto",
        titolo: "E poi?",
        testo: `Fuori dal Ticino: chiedi al tuo Cantone. Nel dubbio: chiedi all'${ufficio.nome} prima di iniziare.`,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.sanitaLiberoEsercizio, verificatoIl: corso.verificatoIl },
    },
  ],
};
