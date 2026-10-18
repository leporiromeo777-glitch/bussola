/**
 * Lezione 15: «Vendere online: cosa mettere sul sito». Fonti, ricontrollate il
 * 18.10.2026 (VERIFICATO_SITO_ONLINE in src/data/svizzera.ts):
 * - LCSl, art. 3 cpv. 1 lett. s (fontiPercorso.lcsl3): chi offre merci, opere
 *   o prestazioni nel commercio elettronico indica in modo chiaro e completo
 *   identità e indirizzo di contatto con l'e-mail, le fasi tecniche della
 *   conclusione del contratto, mette a disposizione mezzi per individuare e
 *   correggere gli errori prima dell'invio e conferma subito per via
 *   elettronica l'ordinazione; cpv. 2: non vale per la telefonia vocale e per
 *   i contratti conclusi solo con messaggi elettronici o mezzi di
 *   comunicazione individuale analoghi;
 * - SECO, «Acquisti online» (fontiPercorso.secoAcquistiOnline): le quattro
 *   prescrizioni sono cumulative, deve essere chiaro quale clic invia
 *   l'ordinazione e conclude il contratto, conferma per e-mail;
 * - Portale PMI, «Obblighi legali in Svizzera e nell'UE»
 *   (fontiPercorso.pmiObblighiEcommerce): nell'impressum il nome come nel
 *   registro, indirizzo postale ed e-mail, il telefono è raccomandato, un
 *   semplice modulo di contatto non basta; per il pulsante «acquistare», non
 *   «ordinare» o «avanti»; prima dell'invio si controllano tipo di contratto,
 *   quantità e tipo di prodotto, prezzo complessivo e indirizzi; prezzi delle
 *   merci in franchi accanto al prodotto con i supplementi non facoltativi
 *   (per esempio l'IVA), spese di spedizione a parte ma ben visibili (artt. 3
 *   e 4 OIP, fontiPercorso.oip3 e oip4);
 * - CO, art. 954a (fontiPercorso.co954a): la ditta iscritta, completa e senza
 *   modifiche, nella corrispondenza, nei talloncini di ordinazione, nelle
 *   fatture e nelle comunicazioni;
 * - LPD, art. 19 (fontiPercorso.lpd19): informare sulla raccolta di dati
 *   personali, almeno identità e contatti, scopo, destinatari; Portale PMI
 *   (fontiPercorso.pmiProtezioneDatiEcommerce): dichiarazione sulla
 *   protezione dei dati raccomandata;
 * - Portale PMI, diritto di recesso (fontiPercorso.pmiDirittoRecesso): in
 *   Svizzera solo se il venditore lo accorda, nell'UE sì; condizioni generali
 *   (fontiPercorso.pmiCondizioniGenerali): con l'aiuto di un avvocato.
 * Nessuna cifra nella lezione. Lo strumento «Testi pronti» è in
 * src/app/strumenti/testi (non inventa recapiti: li mette la persona).
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { fontiPercorso } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("sito-online");
if (!corso) throw new Error("Manca la lezione sito-online in src/data/corso.ts");

/** «e-mail» con il trattino la voce rischia di leggerlo «e mail»: senza trattino (da ascoltare). */
const EMAIL = "email";

export const sitoOnline: Lezione = {
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
      testo: "Ciao, sono Bleo! Vuoi vendere online, con un negozio sul tuo sito? Allora la legge ti chiede di mostrare alcune cose. Ti preparo la lista.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "sito-quattro",
      stile: "lavagna",
      testo:
        "Lo dice la legge contro la concorrenza sleale: chi vende online deve fare quattro cose. Dire chi è. Spiegare i passi dell'ordine. Permettere di correggere gli errori. E confermare subito l'ordine.",
      schermo: {
        tipo: "punto",
        titolo: "Quattro regole per chi vende online",
        testo: "Dire chi sei, spiegare i passi dell'ordine, far correggere gli errori, confermare subito l'ordine.",
        fonte: fontiPercorso.lcsl3,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "sito-chi-sei",
      stile: "lavagna",
      testo:
        "Primo: chi sei. Scrivi in modo chiaro il tuo nome e cognome, il tuo indirizzo postale e l'indirizzo e-mail. Un semplice modulo di contatto non basta. Il telefono è consigliato.",
      voce: `Primo: chi sei. Scrivi in modo chiaro il tuo nome e cognome, il tuo indirizzo postale e l'indirizzo ${EMAIL}. Un semplice modulo di contatto non basta. Il telefono è consigliato.`,
      schermo: {
        tipo: "punto",
        titolo: "Chi sei",
        testo: "Nome e cognome, indirizzo postale ed e-mail. Un modulo di contatto da solo non basta.",
        fonte: fontiPercorso.pmiObblighiEcommerce,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "sito-ditta",
      stile: "lavagna",
      testo:
        "Se la tua ditta è iscritta nel registro di commercio, scrivi il nome esattamente come è iscritto, come nelle fatture e negli ordini. Ricordi la lezione sul nome della ditta? Contiene sempre il tuo cognome.",
      schermo: {
        tipo: "punto",
        titolo: "La ditta come è iscritta",
        testo: "Se sei nel registro di commercio: il nome completo, esattamente come è iscritto.",
        fonte: fontiPercorso.co954a,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "sito-passi",
      stile: "lavagna",
      testo:
        "Secondo: i passi dell'ordine. Il cliente deve capire a che punto è, e quale clic invia l'ordine e conclude il contratto. Sul pulsante, il Portale PMI consiglia parole chiare come «acquistare». «Ordinare» o «avanti» non sono adatte.",
      schermo: {
        tipo: "punto",
        titolo: "I passi dell'ordine",
        testo: "Deve essere chiaro quale clic invia l'ordine. Sul pulsante: «acquistare», non «avanti».",
        fonte: fontiPercorso.pmiObblighiEcommerce,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "sito-errori",
      stile: "lavagna",
      testo:
        "Terzo: gli errori. Prima di inviare l'ordine, il cliente deve poter controllare e correggere tutto: il prodotto, la quantità, il prezzo totale e gli indirizzi.",
      schermo: {
        tipo: "punto",
        titolo: "Correggere gli errori",
        testo: "Prima dell'invio: prodotto, quantità, prezzo totale e indirizzi, tutto modificabile.",
        fonte: fontiPercorso.pmiObblighiEcommerce,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "sito-conferma",
      stile: "lavagna",
      testo:
        "Quarto: la conferma. Appena ricevi l'ordine, mandi subito una conferma elettronica, per esempio un'e-mail, con i dettagli principali dell'ordine.",
      voce: `Quarto: la conferma. Appena ricevi l'ordine, mandi subito una conferma elettronica, per esempio un'${EMAIL}, con i dettagli principali dell'ordine.`,
      schermo: {
        tipo: "punto",
        titolo: "Conferma subito",
        testo: "Una conferma elettronica dell'ordine, per esempio per e-mail, con i dettagli principali.",
        fonte: fontiPercorso.secoAcquistiOnline,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "sito-eccezioni",
      stile: "lavagna",
      testo:
        "Attenzione: queste quattro regole non valgono per le vendite al telefono. E nemmeno per i contratti conclusi solo scambiando e-mail o messaggi simili.",
      voce: `Attenzione: queste quattro regole non valgono per le vendite al telefono. E nemmeno per i contratti conclusi solo scambiando ${EMAIL} o messaggi simili.`,
      schermo: {
        tipo: "attenzione",
        titolo: "Quando non valgono",
        testo: "Vendite al telefono e contratti conclusi solo con e-mail o messaggi simili.",
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "sito-prezzi",
      stile: "lavagna",
      testo:
        "Poi i prezzi. Se vendi merci ai privati, mostri il prezzo finale in franchi, accanto al prodotto. Dentro ci sono tutti i supplementi obbligatori, anche l'IVA se sei iscritto. Le spese di spedizione puoi indicarle a parte, ma ben visibili.",
      schermo: {
        tipo: "punto",
        titolo: "Prezzi chiari",
        testo: "Prezzo finale in franchi accanto al prodotto, con i supplementi obbligatori. Spedizione a parte, ben visibile.",
        fonte: fontiPercorso.pmiObblighiEcommerce,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "sito-dati",
      stile: "lavagna",
      testo:
        "Se sul sito raccogli dati dei clienti, come nome e indirizzo, devi informarli: chi sei, a cosa ti servono i dati e a chi li passi. Il Portale PMI consiglia una dichiarazione sulla protezione dei dati.",
      schermo: {
        tipo: "punto",
        titolo: "I dati dei clienti",
        testo: "Informa chi sei, a cosa servono i dati e a chi li passi: con una dichiarazione sulla protezione dei dati.",
        fonte: fontiPercorso.lpd19,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "sito-resi",
      stile: "lavagna",
      testo:
        "E i resi? In Svizzera la legge non prevede il diritto di restituire un acquisto online. Puoi offrirlo tu: allora scrivi le condizioni in modo chiaro. Se vendi anche nell'Unione europea, le regole sono più severe.",
      schermo: {
        tipo: "punto",
        titolo: "I resi",
        testo: "In Svizzera non sono un obbligo: se li offri, condizioni chiare. Nell'Unione europea regole più severe.",
        fonte: fontiPercorso.pmiDirittoRecesso,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Bleo ha uno strumento, «Testi pronti»: ti scrive la descrizione della tua attività per il sito. I tuoi dati, però, li aggiungi tu. Per le condizioni generali di vendita, il Portale PMI consiglia un avvocato.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "«Testi pronti» scrive la descrizione per il sito. Per le condizioni generali: un avvocato.",
        fonte: fontiPercorso.pmiCondizioniGenerali,
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.lcsl3, verificatoIl: corso.verificatoIl },
    },
  ],
};
