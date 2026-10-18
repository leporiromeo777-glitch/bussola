/**
 * Lezione 16: «Aprire un negozio o uno studio». Fonti, ricontrollate il
 * 18.10.2026 (VERIFICATO_LOCALI in src/data/svizzera.ts):
 * - LAN, stato 01.10.2026 (fontiPercorso.lan): cos'è un negozio (art. 2),
 *   orari dal lunedì al sabato e apertura serale (artt. 8-9,
 *   regoleLocali.orariNegozi), chiusura la domenica e nei festivi (art. 12) e
 *   deroghe di legge, per esempio panetterie, fiori e gallerie d'arte fino
 *   alle regoleLocali.chiusuraFestivaEccezioni (art. 14 cpv. 2), deroghe del
 *   Dipartimento per inaugurazioni e manifestazioni (artt. 11 e 15), multa
 *   fino a regoleLocali.multaMassimaFranchi (art. 17);
 * - RLAN (fontiPercorso.rlan): l'istanza di deroga per scritto almeno
 *   termineDerogaGiorni giorni prima (art. 4), la tassa tassaDerogaFranchi
 *   (art. 5), chi decide (art. 2: Ufficio dell'ispettorato del lavoro o
 *   Divisione dell'economia, cioè il Cantone);
 * - legge edilizia, stato 01.01.2024 (fontiPercorso.leggeEdilizia): licenza
 *   edilizia anche per il cambiamento di destinazione, non per la
 *   manutenzione (art. 1), la concede il Municipio (art. 3), la domanda la
 *   firma anche il proprietario del fondo (art. 4);
 * - legge sugli impianti pubblicitari e regolamento
 *   (fontiPercorso.impiantiPubblicitari e regolamentoImpiantiPubblicitari):
 *   autorizzazione del Municipio per le insegne visibili dall'area pubblica
 *   (art. 3 legge), scritte in italiano e traduzioni non più grandi (art. 4
 *   cpv. 3 legge), niente autorizzazione per le scritte sulla vetrina e le
 *   targhe non luminose fino a targaSenzaAutorizzazioneMq m² (art. 1 cpv. 2
 *   regolamento);
 * - OIP, stato 01.01.2025 (fontiPercorso.oip): prezzo in franchi di ogni
 *   merce offerta ai consumatori (artt. 2-3), sulla merce o vicino (art. 7),
 *   leggibile anche dall'esterno della vetrina (art. 8), prezzi dei servizi
 *   come parrucchiere, istituti di bellezza e corsi (art. 10), con listini
 *   facili da consultare (art. 11);
 * - Polizia cantonale, patente di vendita distillati
 *   (fontiPercorso.poliziaDistillati): sopra gradazioneDistillati, domanda
 *   almeno termineDistillatiGiorni giorni prima, non per la birra; la LEAR
 *   (art. 2) vale anche per la vendita di bevande distillate; l'elenco delle
 *   autorizzazioni (fontiPercorso.poliziaAutorizzazioni).
 * Bar e ristoranti sono la lezione 4. Lo strumento «Budget del primo anno» è
 * in src/app/strumenti/budget.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { chf, fontiPercorso, percentuale, regoleLocali as loc } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("locali-pubblico");
if (!corso) throw new Error("Manca la lezione locali-pubblico in src/data/corso.ts");
const bar = lezionePerPasso("autorizzazione-esercizio-pubblico");
if (!bar) throw new Error("Manca la lezione autorizzazione-esercizio-pubblico in src/data/corso.ts");

const orari = loc.orariNegozi.valore;
// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  bar.numero !== 4 ||
  orari.apertura !== "06.00" ||
  orari.chiusuraFeriale !== "19.00" ||
  orari.chiusuraSabato !== "18.30" ||
  orari.chiusuraSerale !== "21.00" ||
  loc.chiusuraFestivaEccezioni.valore !== "18.00" ||
  loc.termineDerogaGiorni.valore !== 30 ||
  loc.tassaDerogaFranchi.valore.base !== 300 ||
  loc.multaMassimaFranchi.valore !== 20_000 ||
  loc.targaSenzaAutorizzazioneMq.valore !== 0.5 ||
  loc.gradazioneDistillati.valore.bevande !== 0.15 ||
  loc.gradazioneDistillati.valore.vini !== 0.18 ||
  loc.termineDistillatiGiorni.valore !== 15
) {
  throw new Error(
    "Una regola sui negozi è cambiata: aggiorna `voce` delle scene 2, 4, 5, 6, 8 e 10 e rifalle (npm run voce -- locali-pubblico 2 4 5 6 8 10).",
  );
}

const TASSA = chf(loc.tassaDerogaFranchi.valore.base);
const MULTA = chf(loc.multaMassimaFranchi.valore);
const TARGA = `${String(loc.targaSenzaAutorizzazioneMq.valore).replace(".", ",")} m²`;
const ALCOL = percentuale(loc.gradazioneDistillati.valore.bevande, 0);
const VINI = percentuale(loc.gradazioneDistillati.valore.vini, 0);

export const localiPubblico: Lezione = {
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
        "Ciao, sono Bleo! Vuoi aprire un negozio, un atelier o uno studio dove ricevi i clienti? Prima di aprire la porta, ecco le regole da conoscere in Ticino.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "loc-quale",
      stile: "lavagna",
      testo: `Prima domanda: cosa fai nel tuo locale? Se servi cibi o bevande da consumare sul posto, è un esercizio pubblico: ne parliamo nella lezione ${bar.numero}. Qui parliamo di negozi e di studi.`,
      voce: "Prima domanda: cosa fai nel tuo locale? Se servi cibi o bevande da consumare sul posto, è un esercizio pubblico: ne parliamo nella lezione quattro. Qui parliamo di negozi e di studi.",
      schermo: {
        tipo: "punto",
        titolo: "Che locale è?",
        testo: `Bar e ristoranti sono esercizi pubblici: lezione ${bar.numero}. Qui: negozi e studi.`,
        fonte: fontiPercorso.lear,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "loc-negozio",
      stile: "lavagna",
      testo:
        "Per la legge ticinese, un negozio è ogni locale aperto al pubblico dove vendi prodotti al dettaglio. Conta anche uno stand, o un angolo vendita dentro un'altra attività o in un appartamento.",
      schermo: {
        tipo: "punto",
        titolo: "Cos'è un negozio",
        testo: "Ogni locale aperto al pubblico dove vendi prodotti al dettaglio, anche uno stand o un angolo vendita.",
        fonte: fontiPercorso.lan,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "loc-orari",
      stile: "lavagna",
      testo: `I negozi hanno orari fissi. Dal lunedì al venerdì puoi aprire dalle ${orari.apertura} alle ${orari.chiusuraFeriale}, il sabato fino alle ${orari.chiusuraSabato}. Il giovedì puoi restare aperto fino alle ${orari.chiusuraSerale}: se è festivo, il Cantone sceglie un altro giorno.`,
      voce: "I negozi hanno orari fissi. Dal lunedì al venerdì puoi aprire dalle sei alle diciannove, il sabato fino alle diciotto e trenta. Il giovedì puoi restare aperto fino alle ventuno: se è festivo, il Cantone sceglie un altro giorno.",
      schermo: {
        tipo: "punto",
        titolo: "Gli orari",
        testo: `Lunedì-venerdì ${orari.apertura}-${orari.chiusuraFeriale}, sabato fino alle ${orari.chiusuraSabato}, giovedì fino alle ${orari.chiusuraSerale}.`,
        fonte: fontiPercorso.lan,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "loc-domenica",
      stile: "lavagna",
      testo: `La domenica e nei giorni festivi ufficiali i negozi restano chiusi. Ma la legge fa delle eccezioni. Per esempio panetterie, fiorai e gallerie d'arte possono aprire fino alle ${loc.chiusuraFestivaEccezioni.valore}. Per queste non serve nessuna domanda.`,
      voce: "La domenica e nei giorni festivi ufficiali i negozi restano chiusi. Ma la legge fa delle eccezioni. Per esempio panetterie, fiorai e gallerie d'arte possono aprire fino alle diciotto. Per queste non serve nessuna domanda.",
      schermo: {
        tipo: "punto",
        titolo: "Domenica e festivi",
        testo: `Chiuso. Eccezioni di legge, per esempio panetterie, fiori e gallerie d'arte fino alle ${loc.chiusuraFestivaEccezioni.valore}.`,
        fonte: fontiPercorso.lan,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "loc-deroga",
      stile: "lavagna",
      testo: `Vuoi restare aperto più a lungo per un'inaugurazione o una manifestazione? Serve un'autorizzazione del Cantone: la chiedi per scritto almeno ${loc.termineDerogaGiorni.valore} giorni prima. La tassa parte da ${TASSA}. Se apri senza, rischi una multa fino a ${MULTA}.`,
      voce: "Vuoi restare aperto più a lungo per un'inaugurazione o una manifestazione? Serve un'autorizzazione del Cantone: la chiedi per scritto almeno trenta giorni prima. La tassa parte da trecento franchi. Se apri senza, rischi una multa fino a ventimila franchi.",
      schermo: {
        tipo: "punto",
        titolo: "Fuori orario",
        testo: `Autorizzazione del Cantone, chiesta per scritto almeno ${loc.termineDerogaGiorni.valore} giorni prima. Tassa da ${TASSA}.`,
        fonte: fontiPercorso.rlan,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "loc-licenza",
      stile: "lavagna",
      testo:
        "Ora il locale. Se cambi il suo uso, per esempio da appartamento a negozio, serve la licenza edilizia del Municipio. Vale anche per le trasformazioni importanti, non per la semplice manutenzione. E la domanda la firma anche il proprietario.",
      schermo: {
        tipo: "punto",
        titolo: "Il locale",
        testo: "Per cambiarne l'uso o trasformarlo in modo importante: licenza edilizia del Municipio.",
        fonte: fontiPercorso.leggeEdilizia,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "loc-insegna",
      stile: "lavagna",
      testo: `E l'insegna? Per un'insegna che si vede dalla strada serve l'autorizzazione del Municipio. Non serve per le scritte sulla vetrina, né per una piccola targa non luminosa, fino a ${TARGA}, con solo il nome e il logo. Le scritte vanno in italiano: le traduzioni sono ammesse, ma non più grandi.`,
      voce: "E l'insegna? Per un'insegna che si vede dalla strada serve l'autorizzazione del Municipio. Non serve per le scritte sulla vetrina, né per una piccola targa non luminosa, fino a mezzo metro quadrato, con solo il nome e il logo. Le scritte vanno in italiano: le traduzioni sono ammesse, ma non più grandi.",
      schermo: {
        tipo: "punto",
        titolo: "L'insegna",
        testo: `Autorizzazione del Municipio. Non serve per le scritte sulla vetrina o una targa non luminosa fino a ${TARGA}.`,
        fonte: fontiPercorso.regolamentoImpiantiPubblicitari,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "loc-prezzi",
      stile: "lavagna",
      testo:
        "Poi i prezzi. Se vendi ai privati, ogni merce deve avere il suo prezzo in franchi, sulla merce o vicino. In vetrina si deve leggere anche da fuori. Per servizi come parrucchiere, estetista o corsi, indica i prezzi, per esempio con un listino.",
      schermo: {
        tipo: "punto",
        titolo: "I prezzi",
        testo: "Su ogni merce, in franchi e ben leggibile, anche in vetrina. Per i servizi: un listino.",
        fonte: fontiPercorso.oip,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "loc-distillati",
      stile: "lavagna",
      testo: `Vendi superalcolici, cioè bevande con più del ${ALCOL} di alcol, o vini oltre il ${VINI}? Serve la patente di vendita distillati della Polizia cantonale. La chiedi almeno ${loc.termineDistillatiGiorni.valore} giorni prima. Per la birra, invece, non serve.`,
      voce: "Vendi superalcolici, cioè bevande con più del quindici per cento di alcol, o vini oltre il diciotto per cento? Serve la patente di vendita distillati della Polizia cantonale. La chiedi almeno quindici giorni prima. Per la birra, invece, non serve.",
      schermo: {
        tipo: "punto",
        titolo: "Superalcolici",
        testo: `Oltre il ${ALCOL} di alcol (vini oltre il ${VINI}): patente della Polizia cantonale, almeno ${loc.termineDistillatiGiorni.valore} giorni prima.`,
        fonte: fontiPercorso.poliziaDistillati,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Bleo ha uno strumento, «Budget del primo anno»: ci metti anche l'affitto del locale e vedi quando l'attività si ripaga. E se apri fuori dal Ticino, chiedi al tuo Comune e al tuo Cantone.",
      schermo: {
        tipo: "punto",
        titolo: "Budget del primo anno",
        testo: "Metti nel budget anche l'affitto del locale. Fuori dal Ticino: chiedi a Comune e Cantone.",
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.lan, verificatoIl: corso.verificatoIl },
    },
  ],
};
