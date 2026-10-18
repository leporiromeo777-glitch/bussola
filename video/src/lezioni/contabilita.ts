/**
 * Lezione 18: «Come tenere la contabilità». Fonti, ricontrollate il
 * 18.10.2026 (VERIFICATO_CONTABILITA in src/data/svizzera.ts):
 * - CO, art. 957 (fonti.co957): con una cifra d'affari inferiore a
 *   regole.sogliaContabilitaSemplificata nell'ultimo esercizio la ditta
 *   individuale tiene soltanto la contabilità delle entrate e delle uscite e
 *   la contabilità del patrimonio (cpv. 2); da quella cifra in su, e per le
 *   persone giuridiche come la Sagl, la contabilità completa (cpv. 1); i
 *   principi della tenuta regolare dei conti valgono per analogia (cpv. 3);
 * - CO, art. 957a (fontiPercorso.co957a): registrazione completa, fedele e
 *   sistematica, prova documentata di ogni registrazione; documenti
 *   contabili su carta, su supporto elettronico o in forma analoga;
 * - Portale PMI, «Rendiconto annuale presso la ditta individuale»
 *   (fontiPercorso.pmiRendicontoDitta): separare chiaramente il privato dal
 *   professionale, le spese private non vanno a carico della ditta, per i
 *   beni usati per tutte e due (per esempio il veicolo) una ripartizione
 *   proporzionale;
 * - LIFD, art. 125 cpv. 2 (fontiPercorso.lifd125): chi ha un reddito da
 *   attività indipendente allega alla dichiarazione i conti annuali firmati
 *   (bilanci e conti profitti e perdite) oppure, con la contabilità
 *   semplificata dell'art. 957 cpv. 2 CO, le distinte delle entrate e delle
 *   uscite, della situazione patrimoniale e dei prelevamenti e apporti privati;
 * - CO, art. 958f (fonti.co958f): libri e documenti contabili conservati per
 *   regolePercorso.conservazioneDocumentiAnni anni dalla fine dell'esercizio
 *   (cpv. 1), su carta, su supporto elettronico o in forma analoga se restano
 *   conformi alle operazioni e leggibili in ogni momento (cpv. 3); le regole
 *   sui supporti elettronici le spiega il Portale PMI
 *   (fontiPercorso.pmiConservazioneElettronica, art. 9 Olc);
 * - Portale PMI, «Tenere da soli la contabilità o delegare?»
 *   (fontiPercorso.pmiContabilitaDelegare): forme miste, le parti semplici
 *   in azienda, conto annuale e rendiconto d'imposta a un fiduciario;
 * - LFid, art. 3 lett. a e b: la tenuta della contabilità e le dichiarazioni
 *   d'imposta per altri sono attività di fiduciario; albo dei fiduciari
 *   autorizzati (fonti.albofiduciari).
 * Lo strumento «I tuoi conti» è in src/app/conti (ricevute fotografate o
 * inoltrate per email, confermate «della ditta» o «privato», file per il
 * fiduciario; Bleo non conserva le ricevute per dieci anni).
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { chf, fonti, fontiPercorso, regole, regolePercorso } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("contabilita");
if (!corso) throw new Error("Manca la lezione contabilita in src/data/corso.ts");

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (regole.sogliaContabilitaSemplificata.valore !== 500_000 || regolePercorso.conservazioneDocumentiAnni.valore !== 10) {
  throw new Error(
    "La soglia della contabilità semplificata o gli anni di conservazione sono cambiati: aggiorna `voce` delle scene 2 e 8 e rifalle (npm run voce -- contabilita 2 8).",
  );
}

const SOGLIA = chf(regole.sogliaContabilitaSemplificata.valore);
const ANNI = regolePercorso.conservazioneDocumentiAnni.valore;

export const contabilita: Lezione = {
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
        "Ciao, sono Bleo! Hai aperto la tua ditta individuale? Allora devi tenere la contabilità: segnare i soldi che entrano e quelli che escono. Ti spiego come fare.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "cont-soglia",
      stile: "lavagna",
      testo: `Quale contabilità? Dipende dalla cifra d'affari dell'ultimo esercizio, cioè da quanto incassi. Sotto ${SOGLIA} ti basta quella semplificata. Da ${SOGLIA} in su serve quella completa. E una Sagl la tiene sempre completa.`,
      voce: "Quale contabilità? Dipende dalla cifra d'affari dell'ultimo esercizio, cioè da quanto incassi. Sotto i cinquecentomila franchi ti basta quella semplificata. Da cinquecentomila franchi in su serve quella completa. E una Sagl la tiene sempre completa.",
      schermo: {
        tipo: "punto",
        titolo: "Quale contabilità",
        testo: `Cifra d'affari dell'ultimo esercizio sotto ${SOGLIA}: semplificata. Da ${SOGLIA}: completa.`,
        fonte: fonti.co957,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "cont-parti",
      stile: "lavagna",
      testo:
        "La contabilità semplificata ha due parti. Le entrate e le uscite: i soldi che incassi e quelli che spendi. E il patrimonio: quello che la ditta possiede, come i soldi sul conto o gli attrezzi, e i debiti che ha.",
      schermo: {
        tipo: "punto",
        titolo: "Due parti",
        testo: "Le entrate e le uscite, e il patrimonio: quello che la ditta possiede e i debiti che ha.",
        fonte: fonti.co957,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "cont-regole",
      stile: "lavagna",
      testo:
        "Anche se è semplice, valgono le regole di una contabilità in ordine. Registri tutto, in modo completo e fedele. E per ogni registrazione hai un documento che la prova: una fattura, una ricevuta o un estratto conto.",
      schermo: {
        tipo: "punto",
        titolo: "Tutto registrato, tutto provato",
        testo: "Ogni entrata e ogni uscita con il suo documento: fattura, ricevuta o estratto conto.",
        fonte: fontiPercorso.co957a,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "cont-privato",
      stile: "lavagna",
      testo:
        "Il Portale PMI lo dice chiaro: separa bene il privato dalla ditta. Le tue spese private non le puoi mettere a carico della ditta. E le cose che usi per tutte e due, come l'auto, si dividono in proporzione.",
      schermo: {
        tipo: "punto",
        titolo: "Privato e ditta separati",
        testo: "Le spese private non vanno a carico della ditta. Ciò che usi per tutte e due, come l'auto, si divide in proporzione.",
        fonte: fontiPercorso.pmiRendicontoDitta,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "cont-dichiarazione",
      stile: "lavagna",
      testo:
        "A fine anno, la contabilità ti serve per la dichiarazione d'imposta. Con la contabilità completa alleghi i conti annuali firmati: il bilancio e il conto profitti e perdite. Con quella semplificata, invece, alleghi degli elenchi.",
      schermo: {
        tipo: "punto",
        titolo: "Per la dichiarazione d'imposta",
        testo: "Contabilità completa: i conti annuali firmati. Semplificata: gli elenchi dell'anno.",
        fonte: fontiPercorso.lifd125,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "cont-elenchi",
      stile: "lavagna",
      testo:
        "Gli elenchi sono questi: le entrate e le uscite, la situazione del patrimonio, e i prelevamenti e gli apporti privati. Cioè quello che prendi dalla ditta per te, e quello che ci metti di tuo.",
      schermo: {
        tipo: "punto",
        titolo: "Gli elenchi dell'anno",
        testo: "Entrate e uscite, situazione del patrimonio, prelevamenti e apporti privati.",
        fonte: fontiPercorso.lifd125,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "cont-anni",
      stile: "lavagna",
      testo: `Poi conservi tutto per ${ANNI} anni: i libri della contabilità e i documenti, come le ricevute. I ${ANNI} anni partono dalla fine dell'esercizio, non dal giorno della ricevuta.`,
      voce: "Poi conservi tutto per dieci anni: i libri della contabilità e i documenti, come le ricevute. I dieci anni partono dalla fine dell'esercizio, non dal giorno della ricevuta.",
      schermo: {
        tipo: "punto",
        titolo: `Conserva per ${ANNI} anni`,
        testo: "Libri e documenti, a partire dalla fine dell'esercizio.",
        fonte: fonti.co958f,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "cont-digitale",
      stile: "lavagna",
      testo:
        "Puoi conservarli su carta o in digitale, ma devono restare sempre leggibili e corrispondere alle operazioni. Per il digitale ci sono regole precise: le spiega il Portale PMI.",
      schermo: {
        tipo: "punto",
        titolo: "Su carta o in digitale",
        testo: "Sempre leggibili e conformi alle operazioni. Per il digitale ci sono regole precise.",
        fonte: fontiPercorso.pmiConservazioneElettronica,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "cont-strumento",
      stile: "lavagna",
      testo:
        "Bleo ha uno strumento, «I tuoi conti». Fotografi le ricevute o le inoltri per email, Bleo le legge e tu confermi: della ditta o privato. A fine anno scarichi tutto in un file per il fiduciario. Una copia delle ricevute, però, tienila anche tu.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "«I tuoi conti»: fotografi le ricevute, confermi, e a fine anno scarichi il file per il fiduciario.",
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Bleo non tiene la contabilità per te. Il Portale PMI propone anche una via di mezzo: le cose semplici le fai tu, il conto annuale e la dichiarazione d'imposta li affidi a un fiduciario. In Ticino scegline uno autorizzato: c'è l'albo ufficiale.",
      schermo: {
        tipo: "punto",
        titolo: "Con un fiduciario",
        testo: "Le cose semplici le fai tu; conto annuale e dichiarazione a un fiduciario autorizzato.",
        fonte: fonti.albofiduciari,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fonti.co957, verificatoIl: corso.verificatoIl },
    },
  ],
};
