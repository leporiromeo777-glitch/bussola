/**
 * Video facoltativo della lezione 17: «Se il cliente non paga». Fonti,
 * ricontrollate il 18.10.2026 (VERIFICATO_MANCATO_PAGAMENTO in
 * src/data/svizzera.ts):
 * - la scadenza in fattura la dice già la lezione 17; lo strumento
 *   «Preventivo e fattura» ha la riga «Da pagare entro il»
 *   (src/lib/strumenti/documenti.ts, NOMI_TIPO) e «I tuoi conti» mostra le
 *   fatture registrate scadute (src/lib/conti/riepilogo.ts);
 * - ch.ch, procedure d'esecuzione (fontiPercorso.chEsecuzioni): prima un
 *   sollecito è consueto ma non obbligatorio; la domanda va all'Ufficio di
 *   esecuzione del domicilio del debitore; le spese le anticipa il creditore
 *   e, se l'esecuzione è giustificata, le paga il debitore;
 * - CO art. 102 (fontiPercorso.co102): con il debito scaduto, il debitore è in
 *   mora con l'interpellazione del creditore (nel testo tedesco «Mahnung», il
 *   sollecito); con un giorno stabilito («verabredet»), già quando passa;
 *   art. 104 (fontiPercorso.co104): interessi di mora
 *   regoleMancatoPagamento.interesseMora all'anno;
 * - LEF art. 46 (domicilio, sede delle società), artt. 67-69 (domanda,
 *   spese, precetto con regoleMancatoPagamento.terminePagamentoPrecettoGiorni
 *   giorni per pagare), artt. 74-82 (opposizione entro
 *   termineOpposizioneGiorni giorni, senza motivi, sospende l'esecuzione;
 *   rigetto definitivo con una sentenza, provvisorio con un riconoscimento di
 *   debito; se no la procedura civile);
 * - OTLEF art. 16 (fontiPercorso.otlef16): tassa del precetto per un credito
 *   oltre CHF 1'000 fino a CHF 10'000 (regoleMancatoPagamento.tassaPrecetto);
 * - Ticino, Sezione di esecuzione e fallimento: domanda compilata online su
 *   EasyGov, poi stampata, firmata e spedita (fontiPercorso.tiEsecuzioniOnline);
 *   uffici di esecuzione (tiUfficiEsecuzione); rigetto davanti al giudice
 *   (tiRigettoOpposizione); EasyGov (easygovEsecuzioni).
 * Bleo spiega la procedura in generale: per un caso contestato rimanda a un
 * avvocato o a un fiduciario autorizzato.
 */
import { approfondimentoPerId } from "../../../src/data/corso";
import { chf, fontiPercorso, percentuale, regoleMancatoPagamento as mp, VERIFICATO_MANCATO_PAGAMENTO } from "../../../src/data/svizzera";
import type { Lezione } from "./tipi";

const corso = approfondimentoPerId("fatture-mancato-pagamento");
if (!corso) throw new Error("Manca il video facoltativo fatture-mancato-pagamento in src/data/corso.ts");

const TASSA = mp.tassaPrecetto.valore;

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  mp.interesseMora.valore !== 0.05 ||
  TASSA.oltreFranchi !== 1_000 ||
  TASSA.finoAFranchi !== 10_000 ||
  TASSA.tassaFranchi !== 60 ||
  mp.terminePagamentoPrecettoGiorni.valore !== 20 ||
  mp.termineOpposizioneGiorni.valore !== 10
) {
  throw new Error(
    "Un dato su mora, precetto o opposizione è cambiato: aggiorna `voce` delle scene 4, 6 e 7 e rifalle (npm run voce -- fatture-mancato-pagamento 4 6 7).",
  );
}

const INTERESSE = percentuale(mp.interesseMora.valore, 0);
/** Nel sottotitolo «5 per cento»: lungo quasi come la voce, così il cambio di sottotitolo cade nella pausa giusta. */
const INTERESSE_PAROLE = `${Math.round(mp.interesseMora.valore * 100)} per cento`;
const DA = chf(TASSA.oltreFranchi);
const FINO = chf(TASSA.finoAFranchi);
const TASSA_CHF = chf(TASSA.tassaFranchi);
const PAGARE = mp.terminePagamentoPrecettoGiorni.valore;
const OPPORSI = mp.termineOpposizioneGiorni.valore;

export const fattureMancatoPagamento: Lezione = {
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
      testo: "Ciao, sono Bleo! Un cliente non ti paga la fattura? In questo video facoltativo vediamo cosa fare, dal sollecito all'esecuzione.",
      schermo: { tipo: "titolo", etichetta: `Lezione ${corso.lezione.numero} · Video facoltativo`, titolo: corso.approfondimento.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "fnp-scadenza",
      stile: "lavagna",
      testo:
        "Tutto comincia dalla fattura: scrivi sempre entro quando va pagata. Lo strumento di Bleo «Preventivo e fattura» ha già la riga «Da pagare entro il». E se la registri in «I tuoi conti», vedi quali fatture sono scadute.",
      schermo: {
        tipo: "punto",
        titolo: "La scadenza",
        testo: "Scrivi in fattura entro quando pagare. In «I tuoi conti» vedi le fatture scadute.",
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "fnp-sollecito",
      stile: "lavagna",
      testo:
        "Il giorno è passato e i soldi non arrivano? Di solito si manda prima un sollecito: un promemoria per ricordare al cliente di pagare. Non è obbligatorio, ma è l'uso.",
      schermo: {
        tipo: "punto",
        titolo: "Il sollecito",
        testo: "Di solito si manda prima un sollecito. Non è obbligatorio, ma è l'uso.",
        fonte: fontiPercorso.chEsecuzioni,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "fnp-mora",
      stile: "lavagna",
      testo: `Per la legge, se il cliente deve già pagare, è «in mora» da quando gli chiedi di pagare, per esempio con il sollecito. Se il giorno per pagare l'avevate stabilito insieme, è in mora appena quel giorno passa. E chi è in mora con un pagamento deve anche gli interessi: il ${INTERESSE_PAROLE} all'anno.`,
      voce: "Per la legge, se il cliente deve già pagare, è «in mora» da quando gli chiedi di pagare, per esempio con il sollecito. Se il giorno per pagare l'avevate stabilito insieme, è in mora appena quel giorno passa. E chi è in mora con un pagamento deve anche gli interessi: il cinque per cento all'anno.",
      schermo: {
        tipo: "punto",
        titolo: "In mora",
        testo: `Da quando gli chiedi di pagare, o appena passa il giorno stabilito insieme. Interessi di mora: ${INTERESSE} all'anno.`,
        fonte: fontiPercorso.co104,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "fnp-domanda",
      stile: "lavagna",
      testo:
        "Se il cliente continua a non pagare, puoi chiedere un'esecuzione. La domanda va all'Ufficio d'esecuzione dove abita il cliente, o dove ha sede la sua società. In Ticino la puoi compilare online su EasyGov: poi la stampi, la firmi e la spedisci.",
      schermo: {
        tipo: "punto",
        titolo: "La domanda d'esecuzione",
        testo: "All'Ufficio d'esecuzione del luogo dove abita il cliente. Online su EasyGov, poi stampata, firmata e spedita.",
        fonte: fontiPercorso.tiEsecuzioniOnline,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "fnp-costi",
      stile: "lavagna",
      testo: `Le spese le anticipi tu. La tassa del precetto esecutivo dipende dal credito: sopra ${DA} e fino a ${FINO} è di ${TASSA_CHF}, più altre tasse e spese. Se l'esecuzione è giustificata, alla fine le paga il cliente.`,
      voce: "Le spese le anticipi tu. La tassa del precetto esecutivo dipende dal credito: sopra mille franchi e fino a diecimila franchi è di sessanta franchi, più altre tasse e spese. Se l'esecuzione è giustificata, alla fine le paga il cliente.",
      schermo: {
        tipo: "punto",
        titolo: "Le spese",
        testo: `Le anticipi tu. Precetto per un credito oltre ${DA} fino a ${FINO}: ${TASSA_CHF}, più altre tasse e spese.`,
        fonte: fontiPercorso.otlef16,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "fnp-precetto",
      stile: "lavagna",
      testo: `Poi l'ufficio manda al cliente il precetto esecutivo: l'ordine di pagare entro ${PAGARE} giorni. Se non è d'accordo, il cliente può fare opposizione entro ${OPPORSI} giorni, anche senza dire perché: allora l'esecuzione si ferma.`,
      voce: "Poi l'ufficio manda al cliente il precetto esecutivo: l'ordine di pagare entro venti giorni. Se non è d'accordo, il cliente può fare opposizione entro dieci giorni, anche senza dire perché. Allora l'esecuzione si ferma.",
      schermo: {
        tipo: "punto",
        titolo: "Precetto e opposizione",
        testo: `Pagare entro ${PAGARE} giorni, o fare opposizione entro ${OPPORSI}: l'esecuzione si ferma.`,
        fonte: fontiPercorso.lef74,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "fnp-rigetto",
      stile: "lavagna",
      testo:
        "Per andare avanti chiedi al giudice il rigetto, cioè di togliere l'opposizione. Ti serve un documento: una sentenza, o un riconoscimento di debito firmato dal cliente. Se non ce l'hai, serve una causa in tribunale.",
      schermo: {
        tipo: "punto",
        titolo: "Il rigetto",
        testo: "Dal giudice, con una sentenza o un riconoscimento di debito firmato. Se no, una causa.",
        fonte: fontiPercorso.tiRigettoOpposizione,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Se il cliente contesta il debito, o il caso è complicato, fatti consigliare da un avvocato o da un fiduciario autorizzato. E chiedi a Bleo in chat: risponde con le fonti ufficiali.",
      schermo: {
        tipo: "punto",
        titolo: "Il cliente contesta?",
        testo: "Fatti consigliare da un avvocato o da un fiduciario autorizzato. E chiedi a Bleo in chat.",
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ciao!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.chEsecuzioni, verificatoIl: VERIFICATO_MANCATO_PAGAMENTO },
    },
  ],
};
