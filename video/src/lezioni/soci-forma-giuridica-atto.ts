/**
 * Video facoltativo della lezione 2: «L'atto di fondazione della Sagl».
 * Un atto pubblico fatto dal notaio (art. 777 CO) in cui i fondatori
 * dichiarano di costituire la Sagl, stabiliscono lo statuto, designano gli
 * organi e sottoscrivono le quote con numero, valore e prezzo (artt. 777 e
 * 777a CO), e confermano che le quote sono sottoscritte e i conferimenti
 * effettuati (art. 777 cpv. 2 CO). Gli allegati: statuto, attestazione di
 * deposito; con conferimenti in natura altri documenti (art. 777b CO).
 * L'iscrizione nel registro della sede e la personalità giuridica (artt. 778
 * e 779 CO). Testi ricontrollati il 17.10.2026 (VERIFICATO_DOCUMENTI_SAGL).
 * Cosa preparare prima: dalla check list del Portale PMI (lezione 2).
 */
import { approfondimentoPerId } from "../../../src/data/corso";
import { fontiPercorso, VERIFICATO_DOCUMENTI_SAGL } from "../../../src/data/svizzera";
import type { Lezione } from "./tipi";

const corso = approfondimentoPerId("soci-forma-giuridica-atto");
if (!corso) throw new Error("Manca il video facoltativo soci-forma-giuridica-atto in src/data/corso.ts");

export const attoFondazioneSagl: Lezione = {
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
      testo: "Ciao, sono Bleo! In questo video facoltativo vediamo l'atto di fondazione: il documento con cui fondate la vostra Sagl.",
      schermo: { tipo: "titolo", etichetta: `Lezione ${corso.lezione.numero} · Video facoltativo`, titolo: corso.approfondimento.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "atto-firma",
      stile: "lavagna",
      testo: "È un atto pubblico: lo prepara il notaio, e voi fondatori lo firmate.",
      schermo: { tipo: "punto", titolo: "Un atto pubblico", testo: "Lo prepara il notaio; voi fondatori lo firmate.", fonte: fontiPercorso.co777 },
    },
    {
      audio: "scena-3.mp3",
      disegno: "atto-contenuto",
      stile: "lavagna",
      testo:
        "Nell'atto voi fondatori dichiarate di costituire la Sagl. Stabilite lo statuto. Designate gli organi, per esempio i gerenti. E ognuno sottoscrive le sue quote: quante, di che valore e a che prezzo.",
      schermo: {
        tipo: "punto",
        titolo: "Cosa c'è nell'atto",
        testo: "Fondate la Sagl, stabilite lo statuto, designate gli organi, sottoscrivete le quote.",
        fonte: fontiPercorso.co777,
      },
    },
    {
      audio: "scena-4.mp3",
      stile: "presentatore",
      testo: "Poi confermate che tutte le quote sono state sottoscritte e che il capitale è stato versato come chiedono la legge e lo statuto.",
      schermo: {
        tipo: "punto",
        titolo: "Le conferme",
        testo: "Quote sottoscritte e capitale versato come chiedono la legge e lo statuto.",
        fonte: fontiPercorso.co777,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "atto-allegati",
      stile: "lavagna",
      testo:
        "All'atto si allegano dei documenti. Lo statuto. L'attestazione della banca che il capitale è stato depositato. E se qualcuno porta dei beni invece dei soldi, servono anche altri documenti.",
      schermo: {
        tipo: "punto",
        titolo: "Gli allegati",
        testo: "Lo statuto e l'attestazione della banca; con dei beni, altri documenti.",
        fonte: fontiPercorso.co777b,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "atto-registro",
      stile: "lavagna",
      testo:
        "Poi la Sagl va iscritta nel registro di commercio del luogo dove ha la sede. E solo con l'iscrizione diventa una persona giuridica, cioè una società vera e propria.",
      schermo: {
        tipo: "punto",
        titolo: "L'iscrizione",
        testo: "Nel registro di commercio della sede: con l'iscrizione la Sagl diventa persona giuridica.",
        fonte: fontiPercorso.co779,
      },
    },
    {
      audio: "scena-7.mp3",
      stile: "presentatore",
      testo: "Attenzione: l'atto lo prepara il notaio. Ma arrivate preparati: con lo statuto, la banca scelta e il capitale versato sul conto vincolato.",
      schermo: {
        tipo: "attenzione",
        titolo: "Arrivate preparati",
        testo: "Statuto, banca scelta e capitale versato sul conto vincolato.",
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Gli articoli di legge li trovi qui sotto. Ciao!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.co777, verificatoIl: VERIFICATO_DOCUMENTI_SAGL },
    },
  ],
};
