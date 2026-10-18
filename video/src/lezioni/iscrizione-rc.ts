/**
 * Lezione 13: «Devi iscriverti al registro di commercio?». Fonti,
 * ricontrollate il 18.10.2026 (VERIFICATO_REGISTRO in src/data/svizzera.ts):
 * - CO, testo in vigore dal 01.10.2026: obbligo da
 *   regole.sogliaRegistroCommercio di cifra d'affari nell'ultimo esercizio,
 *   dispensati i liberi professionisti e gli agricoltori che non gestiscono
 *   un'impresa in forma commerciale, diritto di iscriversi sotto la soglia
 *   (art. 931, fonti.co931); registro pubblico e gratuito su Internet
 *   (art. 936, fontiPercorso.co936); iscrizioni pubblicate nel Foglio
 *   ufficiale svizzero di commercio (art. 936a, fontiPercorso.co936a); la
 *   ditta iscritta è protetta nello stesso luogo (art. 946,
 *   fontiPercorso.co946); termine, iscrizione d'ufficio (art. 938,
 *   fontiPercorso.co938) e ammenda fino a
 *   regoleRegistro.multaMancataIscrizioneFranchi (art. 940,
 *   fontiPercorso.co940); il nome iscritto nelle fatture (art. 954a,
 *   fontiPercorso.co954a); la contabilità dipende dalla cifra d'affari
 *   (art. 957, fonti.co957);
 * - LEF, stato 01.01.2026: il titolare iscritto è soggetto all'esecuzione in
 *   via di fallimento (art. 39, fontiPercorso.lef39), gli altri al
 *   pignoramento (art. 42), limitato a quanto basta per i creditori
 *   pignoranti (art. 97, fontiPercorso.lef42); nel fallimento tutti i beni
 *   formano un'unica massa (art. 197, fontiPercorso.lef197);
 * - Portale PMI: con l'iscrizione il nome è protetto e il titolare è
 *   soggetto all'esecuzione in via di fallimento
 *   (fontiPercorso.pmiDittaIndividualeLanciarsi); EasyGov iscrive le ditte
 *   individuali nel registro di commercio (fontiPercorso.pmiIscrizioneNome,
 *   fontiPercorso.easygovDittaIndividuale);
 * - Ufficio del registro di commercio ticinese: formulario da compilare,
 *   stampare, firmare e spedire, ditta, scopo, sede, domicilio legale (non
 *   una casella postale), copia del documento d'identità, firma autenticata
 *   all'Ufficio, dal notaio o dal segretario comunale, fattura di CHF 80 +
 *   20 + 20 (fonti.rcTicinoIscrizione); Biasca (fonti.rcTicinoContatti);
 *   legalizzazione di una firma regolePercorso.autenticazioneFirmaRcTicino
 *   (fontiPercorso.rcTicinoTasseCantonali); dal notaio al massimo
 *   regoleRegistro.autenticazioneFirmaNotaioMassimoFranchi (tariffa notarile,
 *   art. 17, fontiPercorso.tariffaNotarile);
 * - OEmol-RC, allegato n. 1.1: tasseRegistroCommercio (fonti.oemolRc).
 * Lo strumento «Budget del primo anno» (src/app/strumenti/budget) ha la
 * casella «Mi iscrivo al registro di commercio», con il costo nel primo mese.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { chf, fonti, fontiPercorso, regole, regolePercorso, regoleRegistro as reg, tasseRegistroCommercio, uffici } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("iscrizione-rc");
if (!corso) throw new Error("Manca la lezione iscrizione-rc in src/data/corso.ts");

const tasse = tasseRegistroCommercio.valore;

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  regole.sogliaRegistroCommercio.valore !== 100_000 ||
  reg.multaMancataIscrizioneFranchi.valore !== 5_000 ||
  regolePercorso.autenticazioneFirmaRcTicino.valore !== 20 ||
  reg.autenticazioneFirmaNotaioMassimoFranchi.valore !== 30 ||
  tasse.primaIscrizioneDittaIndividuale !== 80 ||
  tasse.perFunzione !== 20 ||
  tasse.perDirittoDiFirma !== 20 ||
  tasse.stimaTitolareConFirma !== 120 ||
  !uffici.registroCommercioTicino.valore.indirizzo.endsWith("Biasca")
) {
  throw new Error(
    "Una regola sul registro di commercio è cambiata: aggiorna `voce` delle scene 2, 7, 10 e 11 e rifalle (npm run voce -- iscrizione-rc 2 7 10 11).",
  );
}

/** L'importo in franchi con lo spazio unificatore: nei sottotitoli «CHF» non va a capo da solo. */
const franchi = (importo: number) => chf(importo).replace(" ", "\u00a0");
const SOGLIA = franchi(regole.sogliaRegistroCommercio.valore);
const MULTA = franchi(reg.multaMancataIscrizioneFranchi.valore);
const UFFICIO = franchi(regolePercorso.autenticazioneFirmaRcTicino.valore);
const NOTAIO = franchi(reg.autenticazioneFirmaNotaioMassimoFranchi.valore);
const PRIMA = franchi(tasse.primaIscrizioneDittaIndividuale);
const FUNZIONE = franchi(tasse.perFunzione);
const FIRMA = franchi(tasse.perDirittoDiFirma);
const TOTALE = franchi(tasse.stimaTitolareConFirma);

export const iscrizioneRc: Lezione = {
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
        "Ciao, sono Bleo! La tua ditta individuale deve stare nel registro di commercio? Dipende da quanto incassi. Ti spiego come decidere.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "rc-soglia",
      stile: "lavagna",
      testo: `Devi iscriverti quando la tua ditta, nell'ultimo esercizio, ha realizzato almeno ${SOGLIA} di cifra d'affari. Conta la cifra d'affari, cioè quanto incassi, non l'utile che ti resta dopo le spese.`,
      voce: "Devi iscriverti quando la tua ditta, nell'ultimo esercizio, ha realizzato almeno centomila franchi di cifra d'affari. Conta la cifra d'affari, cioè quanto incassi, non l'utile che ti resta dopo le spese.",
      schermo: {
        tipo: "punto",
        titolo: "Quando è obbligatoria",
        testo: `Da ${SOGLIA} di cifra d'affari nell'ultimo esercizio. Conta la cifra d'affari, non l'utile.`,
        fonte: fonti.co931,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "rc-eccezioni",
      stile: "lavagna",
      testo:
        "Eccezioni: chi esercita una professione liberale, come un medico o un avvocato, e gli agricoltori non devono iscriversi, se non gestiscono l'attività in forma commerciale. Nel dubbio, chiedi all'Ufficio del registro.",
      schermo: {
        tipo: "punto",
        titolo: "Le eccezioni",
        testo: "Professioni liberali e agricoltori, se non gestiscono l'attività in forma commerciale. Nel dubbio, chiedi all'Ufficio.",
        fonte: fonti.co931,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "rc-facoltativa",
      stile: "lavagna",
      testo:
        "Sotto la soglia, iscriverti è facoltativo: ne hai sempre il diritto. Il vantaggio? Il nome della tua ditta è protetto: nello stesso luogo nessun altro può usarlo.",
      schermo: {
        tipo: "punto",
        titolo: "Sotto la soglia",
        testo: "Iscriverti è facoltativo, ma è un tuo diritto. Se ti iscrivi, il nome della ditta è protetto nel luogo.",
        fonte: fontiPercorso.pmiDittaIndividualeLanciarsi,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "rc-pubblico",
      stile: "lavagna",
      testo:
        "Se ti iscrivi, i dati della ditta, con il tuo nome, diventano pubblici: escono nel Foglio ufficiale svizzero di commercio, e chiunque li vede gratis online. La contabilità invece non cambia: dipende dalla cifra d'affari.",
      schermo: {
        tipo: "punto",
        titolo: "Un registro pubblico",
        testo: "L'iscrizione esce nel Foglio ufficiale svizzero di commercio ed è online, gratis. La contabilità non cambia.",
        fonte: fontiPercorso.co936a,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "rc-fallimento",
      stile: "lavagna",
      testo:
        "Attenzione ai debiti: se sei iscritto e non paghi, il creditore può chiedere il tuo fallimento, che riguarda tutto il tuo patrimonio. Senza iscrizione, di regola, c'è il pignoramento: si prende solo quanto basta per quei debiti.",
      schermo: {
        tipo: "attenzione",
        titolo: "Debiti e fallimento",
        testo: "Se sei iscritto, per i debiti si va in via di fallimento: riguarda tutto il patrimonio.",
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "rc-obbligo",
      stile: "lavagna",
      testo: `E se devi iscriverti, ma non lo fai? L'Ufficio ti dà un termine. Se non lo rispetti, ti iscrive d'ufficio e può darti una multa fino a ${MULTA}.`,
      voce: "E se devi iscriverti, ma non lo fai? L'Ufficio ti dà un termine. Se non lo rispetti, ti iscrive d'ufficio e può darti una multa fino a cinquemila franchi.",
      schermo: {
        tipo: "punto",
        titolo: "Se non ti iscrivi",
        testo: `L'Ufficio ti dà un termine, poi ti iscrive d'ufficio. Multa fino a ${MULTA}.`,
        fonte: fontiPercorso.co940,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "rc-come",
      stile: "lavagna",
      testo:
        "Come ti iscrivi? Online con EasyGov, la piattaforma delle autorità. Oppure con il formulario dell'Ufficio ticinese, che compili, stampi, firmi e spedisci per posta.",
      schermo: {
        tipo: "punto",
        titolo: "Come ti iscrivi",
        testo: "Online con EasyGov, oppure con il formulario del Ticino, firmato e spedito per posta.",
        fonte: fonti.rcTicinoIscrizione,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "rc-formulario",
      stile: "lavagna",
      testo:
        "Nel formulario scrivi il nome della ditta: le regole sono nella lezione 8. Poi lo scopo, cioè cosa fai, e l'indirizzo dove ti si trova: una casella postale non basta. Allega anche una copia del documento d'identità.",
      voce: "Nel formulario scrivi il nome della ditta: le regole sono nella lezione otto. Poi lo scopo, cioè cosa fai, e l'indirizzo dove ti si trova: una casella postale non basta. Allega anche una copia del documento d'identità.",
      schermo: {
        tipo: "punto",
        titolo: "Nel formulario",
        testo: "La ditta, lo scopo e l'indirizzo (non una casella postale), con la copia di un documento d'identità.",
        fonte: fonti.rcTicinoIscrizione,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "rc-firma",
      stile: "lavagna",
      testo: `La firma sulla domanda va autenticata: allo sportello dell'Ufficio, a Biasca, costa ${UFFICIO}. Dal notaio costa al massimo ${NOTAIO}, oppure vai dal segretario del tuo Comune.`,
      voce: "La firma sulla domanda va autenticata: allo sportello dell'Ufficio, a Biasca, costa venti franchi. Dal notaio costa al massimo trenta franchi, oppure vai dal segretario del tuo Comune.",
      schermo: {
        tipo: "punto",
        titolo: "La firma autenticata",
        testo: `All'Ufficio ${UFFICIO}, dal notaio al massimo ${NOTAIO}, oppure dal segretario comunale.`,
        fonte: fontiPercorso.rcTicinoTasseCantonali,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "rc-tasse",
      stile: "lavagna",
      testo: `Poi arriva la fattura delle tasse: ${PRIMA} per la prima iscrizione, ${FUNZIONE} per la tua funzione di titolare e ${FIRMA} per il diritto di firma. In tutto ${TOTALE}, più l'autenticazione.`,
      voce: "Poi arriva la fattura delle tasse: ottanta franchi per la prima iscrizione, venti per la tua funzione di titolare e venti per il diritto di firma. In tutto centoventi franchi, più l'autenticazione.",
      schermo: {
        tipo: "punto",
        titolo: "Le tasse",
        testo: `${PRIMA} + ${FUNZIONE} + ${FIRMA} = ${TOTALE}, più l'autenticazione della firma.`,
        fonte: fonti.oemolRc,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Se ti iscrivi, nelle fatture usa il nome della ditta proprio com'è iscritto. E nello strumento «Budget del primo anno» di Bleo, spunta il registro di commercio: il costo entra nel primo mese.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "Nel «Budget del primo anno» spunta il registro di commercio. Nelle fatture, il nome com'è iscritto.",
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fonti.co931, verificatoIl: corso.verificatoIl },
    },
  ],
};
