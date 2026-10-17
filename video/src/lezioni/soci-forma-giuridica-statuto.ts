/**
 * Video facoltativo della lezione 2: «Lo statuto della Sagl». Cosa deve dire
 * lo statuto per legge (art. 776 CO), lo statuto tipo Sagl pubblicato dal
 * registro di commercio del Ticino (modello dell'Ufficio federale del
 * registro di commercio, con la norma di legge accanto a ogni articolo), cosa
 * regola (quote, soci, assemblea, gerenti, conti), chi dirige (art. 809 CO;
 * statuto tipo, art. 22: i gerenti li elegge l'assemblea e non devono essere
 * soci), e che poi si allega all'atto di fondazione (art. 777b CO).
 * Lo statuto tipo è del 2008: la scena 6 lo dice (la legge è cambiata, per
 * esempio sul valore delle quote, art. 774 CO).
 * Testi ricontrollati il 17.10.2026 (VERIFICATO_DOCUMENTI_SAGL).
 *
 * Bleo spiega il modello, non scrive lo statuto per qualcuno: per il proprio
 * caso rimanda al notaio o a un fiduciario autorizzato.
 */
import { approfondimentoPerId } from "../../../src/data/corso";
import { fontiPercorso, VERIFICATO_DOCUMENTI_SAGL } from "../../../src/data/svizzera";
import type { Lezione } from "./tipi";

const corso = approfondimentoPerId("soci-forma-giuridica-statuto");
if (!corso) throw new Error("Manca il video facoltativo soci-forma-giuridica-statuto in src/data/corso.ts");

export const statutoSagl: Lezione = {
  id: corso.approfondimento.id,
  numero: corso.lezione.numero,
  titolo: corso.approfondimento.titolo,
  stile: "misto",
  clip: "clip.mp4",
  prossimoPasso: corso.lezione.titolo,
  etichettaFine: "Torna alla lezione",
  scene: [
    {
      audio: "scena-1.mp3",
      stile: "presentatore",
      testo: "Ciao, sono Bleo! In questo video facoltativo vediamo lo statuto della Sagl: le regole della vostra società, scritte nero su bianco.",
      schermo: { tipo: "titolo", etichetta: `Lezione ${corso.lezione.numero} · Video facoltativo`, titolo: corso.approfondimento.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "statuto-quattro",
      stile: "lavagna",
      testo:
        "Per legge lo statuto deve contenere almeno quattro cose. La ditta, cioè il nome, e la sede. Lo scopo, cioè cosa fa la società. Il capitale, con il numero e il valore delle quote. E come la società comunica con i soci.",
      schermo: {
        tipo: "punto",
        titolo: "Cosa deve dire lo statuto",
        testo: "Ditta e sede, scopo, capitale e quote, comunicazioni ai soci.",
        fonte: fontiPercorso.co776,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "statuto-modello",
      stile: "lavagna",
      testo:
        "Non dovete partire da zero. Il registro di commercio del Ticino pubblica uno statuto tipo per la Sagl, preparato dall'Ufficio federale del registro di commercio. Accanto a ogni articolo c'è la norma di legge.",
      schermo: {
        tipo: "punto",
        titolo: "Lo statuto tipo",
        testo: "Un modello ufficiale, con la norma di legge accanto a ogni articolo.",
        fonte: fontiPercorso.statutoTipoSagl,
      },
    },
    {
      audio: "scena-4.mp3",
      stile: "presentatore",
      testo:
        "Oltre a queste quattro cose, lo statuto tipo regola per esempio la cessione delle quote, i diritti e i doveri dei soci, l'assemblea dei soci, i gerenti e i conti.",
      schermo: {
        tipo: "punto",
        titolo: "Cosa regola lo statuto tipo",
        testo: "Cessione delle quote, diritti e doveri dei soci, assemblea, gerenti, conti.",
        fonte: fontiPercorso.statutoTipoSagl,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "statuto-gerenti",
      stile: "lavagna",
      testo:
        "Per esempio, chi dirige. Per legge i soci dirigono la società tutti insieme, ma lo statuto può decidere diversamente. Nello statuto tipo, i gerenti li elegge l'assemblea dei soci. E i gerenti non devono essere per forza dei soci.",
      schermo: {
        tipo: "punto",
        titolo: "Chi dirige",
        testo: "Per legge tutti i soci insieme; lo statuto può decidere diversamente.",
        fonte: fontiPercorso.co809,
      },
    },
    {
      audio: "scena-6.mp3",
      stile: "presentatore",
      testo:
        "Attenzione: lo statuto tipo è del 2008, e da allora la legge è cambiata, per esempio sul valore delle quote. Quindi usatelo solo come esempio: le parti tra parentesi quadre le scrivete voi, e il resto lo adattate con il notaio o con un fiduciario autorizzato.",
      voce: "Attenzione: lo statuto tipo è del duemilaotto, e da allora la legge è cambiata, per esempio sul valore delle quote. Quindi usatelo solo come esempio: le parti tra parentesi quadre le scrivete voi, e il resto lo adattate con il notaio o con un fiduciario autorizzato.",
      schermo: {
        tipo: "attenzione",
        titolo: "Lo statuto tipo è del 2008",
        testo: "La legge è cambiata (per esempio sul valore delle quote): usatelo solo come esempio, con il notaio o un fiduciario autorizzato.",
      },
    },
    {
      audio: "scena-7.mp3",
      stile: "presentatore",
      testo:
        "Poi lo statuto va fatto controllare dal notaio e dal registro di commercio, e si allega all'atto di fondazione. Come funziona, lo vedi nell'altro video facoltativo. E con lo strumento di Bleo «Fondare una Sagl» potete preparare i vostri dati e una prima bozza da portare al notaio.",
      schermo: {
        tipo: "punto",
        titolo: "E poi?",
        testo: "Controllo del notaio e del registro; poi lo statuto si allega all'atto di fondazione.",
        fonte: fontiPercorso.co777b,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Lo statuto tipo lo trovi qui sotto, sul sito del registro di commercio del Ticino. Ciao!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.statutoTipoSagl, verificatoIl: VERIFICATO_DOCUMENTI_SAGL },
    },
  ],
};
