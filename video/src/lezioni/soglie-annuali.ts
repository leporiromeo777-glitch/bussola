/**
 * Lezione 23: «A fine anno controlla le soglie», l'ultima del corso. Fonti,
 * ricontrollate il 18.10.2026 (VERIFICATO_SOGLIE in src/data/svizzera.ts):
 * - CO, testo in vigore dal 01.10.2026: iscrizione obbligatoria con almeno
 *   regole.sogliaRegistroCommercio di cifra d'affari nell'ultimo esercizio
 *   (art. 931, fonti.co931); sotto regole.sogliaContabilitaSemplificata
 *   nell'ultimo esercizio basta la contabilità delle entrate e delle uscite e
 *   del patrimonio, da lì in su serve quella completa (art. 957, fonti.co957);
 * - LIVA, stato 31.03.2025: esentato chi resta sotto regole.sogliaIva di
 *   cifra d'affari, in Svizzera e all'estero, da prestazioni non escluse
 *   dall'imposta, calcolata senza l'imposta (art. 10, fonti.liva10; le
 *   prestazioni escluse, come le cure mediche e l'insegnamento, all'art. 21,
 *   fontiPercorso.liva21); l'esenzione termina quando la cifra d'affari
 *   dell'ultimo esercizio raggiunge la soglia, e chi scende sotto e
 *   presumibilmente ci resta deve annunciare la fine, se no resta iscritto
 *   (art. 14 cpv. 3 e 5, fonti.liva14); periodo fiscale = anno civile (art. 34,
 *   fontiPercorso.liva34); annuncio entro regole.termineAnnuncioIvaGiorni
 *   giorni dall'inizio dell'assoggettamento (art. 66, fonti.liva66);
 * - OIVA, stato 01.01.2025: per chi era esentato l'esenzione termina allo
 *   scadere dell'esercizio in cui raggiunge la soglia; se l'attività non è
 *   durata tutto l'anno, la cifra d'affari è riportata su un anno intero
 *   (art. 9 cpv. 3, fontiPercorso.oiva9);
 * - AFC, «Assoggettamento all'IVA» (fonti.afcAssoggettamento): non contano
 *   doni e sussidi (non controprestazioni), le imprese finora esentate sono
 *   assoggettate allo scadere dell'esercizio commerciale in cui raggiungono
 *   la soglia, radiazione tempestiva entro
 *   regoleSoglie.termineRadiazioneIvaGiorni giorni dalla fine del periodo
 *   fiscale, il mancato annuncio vale come rinuncia all'esenzione;
 * - info IVA 02 «Assoggettamento» (fontiPercorso.afcInfoIva02): cifre 2.1.2
 *   (cosa non conta), 5.2.1.2 (imprese finora esentate), 5.3 caso A (anno
 *   incompleto riportato su regoleSoglie.mesiAnnoIntero mesi: CHF 85'000 in
 *   dieci mesi diventano CHF 102'000) e 6.2 (radiazione);
 * - albo dei fiduciari autorizzati (fonti.albofiduciari).
 * Lo strumento «I tuoi conti» (src/app/conti, src/lib/conti/riepilogo.ts):
 * il riepilogo dell'anno mostra le entrate confermate e avvisa quando si
 * avvicinano alla soglia IVA, quando la raggiungono e quando raggiungono
 * quella della contabilità completa, ricordando che conta la cifra d'affari
 * vera. Il riquadro «Scadenze da ricordare» del percorso non ha il controllo
 * delle soglie: la lezione non lo nomina.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { chf, fonti, fontiPercorso, regole, regoleSoglie } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("soglie-annuali");
if (!corso) throw new Error("Manca la lezione soglie-annuali in src/data/corso.ts");
const lezioneRc = lezionePerPasso("iscrizione-rc");
const lezioneIva = lezionePerPasso("iscrizione-iva");
const lezioneContabilita = lezionePerPasso("contabilita");
if (!lezioneRc || !lezioneIva || !lezioneContabilita) {
  throw new Error("Mancano le lezioni iscrizione-rc, iscrizione-iva o contabilita in src/data/corso.ts");
}

// È l'ultima lezione del corso: la prima e le ultime due scene lo dicono.
if (titoloProssimoPasso(corso.passoId) !== undefined) {
  throw new Error(
    "Dopo soglie-annuali c'è un altro passo: la lezione non è più l'ultima. Aggiorna testo e `voce` delle scene 1, 12 e 13 e la scheda finale (prossimoPasso, etichettaFine), poi rifai la voce (npm run voce -- soglie-annuali 1 12 13).",
  );
}

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  regole.sogliaRegistroCommercio.valore !== 100_000 ||
  regole.sogliaIva.valore !== 100_000 ||
  regole.termineAnnuncioIvaGiorni.valore !== 30 ||
  regole.sogliaContabilitaSemplificata.valore !== 500_000 ||
  regoleSoglie.termineRadiazioneIvaGiorni.valore !== 60 ||
  regoleSoglie.mesiAnnoIntero.valore !== 12 ||
  lezioneRc.numero !== 13 ||
  lezioneIva.numero !== 14 ||
  lezioneContabilita.numero !== 18
) {
  throw new Error(
    "Una soglia, un termine o il numero di una lezione è cambiato: aggiorna testo e `voce` delle scene 5, 6, 7, 8, 9 e 11 e rifalle (npm run voce -- soglie-annuali 5 6 7 8 9 11).",
  );
}

/** Come la voce deve dire la sigla dell'AFC (la stessa della lezione 14). */
const AFC = "a-effe-ci";

/** L'importo in franchi con lo spazio unificatore: nei sottotitoli «CHF» non va a capo da solo. */
const franchi = (importo: number) => chf(importo).replace(" ", " ");
const SOGLIA_RC = franchi(regole.sogliaRegistroCommercio.valore);
const SOGLIA_IVA = franchi(regole.sogliaIva.valore);
const SOGLIA_CONTABILITA = franchi(regole.sogliaContabilitaSemplificata.valore);
const GIORNI_ANNUNCIO = regole.termineAnnuncioIvaGiorni.valore;
const GIORNI_RADIAZIONE = regoleSoglie.termineRadiazioneIvaGiorni.valore;
/** L'esempio dell'anno incompleto: metà anno, metà soglia. */
const META_SOGLIA_IVA = franchi(regole.sogliaIva.valore / 2);

export const soglieAnnuali: Lezione = {
  id: corso.passoId,
  numero: corso.numero,
  titolo: corso.titolo,
  stile: "misto",
  clip: "clip.mp4",
  // Non c'è un passo dopo: la scheda finale fa i complimenti e dice che Bleo continua a seguirti.
  prossimoPasso: "Ora Bleo ti segue nella tua attività",
  etichettaFine: "Complimenti!",
  scene: [
    {
      audio: "scena-1.mp3",
      disegno: "titolo-lezione",
      stile: "presentatore",
      testo:
        "Ciao, sono Bleo! Siamo all'ultima lezione del corso. Ogni anno, quando chiudi l'esercizio, fai un controllo veloce: quanto hai fatturato? Ti spiego cosa sommare e cosa fare se raggiungi una soglia.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "sog-quando",
      stile: "lavagna",
      testo:
        "Quando? Alla fine di ogni esercizio, cioè dell'anno della tua contabilità. Tre regole guardano proprio la cifra d'affari di quell'anno: registro di commercio, IVA e contabilità.",
      schermo: {
        tipo: "punto",
        titolo: "Alla fine dell'esercizio",
        testo: "Registro di commercio, IVA e contabilità guardano la cifra d'affari dell'esercizio.",
        fonte: fonti.co931,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "sog-somma",
      stile: "lavagna",
      testo:
        "Cosa sommi? Tutto quello che hai fatturato nell'esercizio, ai clienti in Svizzera e all'estero, senza l'IVA. Conta la cifra d'affari, non l'utile: le spese non le togli.",
      schermo: {
        tipo: "punto",
        titolo: "Cosa sommi",
        testo: "Tutto il fatturato, in Svizzera e all'estero, senza IVA. La cifra d'affari, non l'utile.",
        fonte: fonti.liva10,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "sog-escluse",
      stile: "lavagna",
      testo:
        "Per la soglia dell'IVA, però, non contano le prestazioni escluse dall'imposta, come molte cure mediche e l'insegnamento. E nemmeno i doni e i sussidi.",
      schermo: {
        tipo: "punto",
        titolo: "Per l'IVA non contano",
        testo: "Le prestazioni escluse dall'imposta, come molte cure mediche e l'insegnamento, i doni e i sussidi.",
        fonte: fonti.afcAssoggettamento,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "sog-registro",
      stile: "lavagna",
      testo: `Prima soglia, il registro di commercio. Se nell'ultimo esercizio sei arrivato ad almeno ${SOGLIA_RC}, iscriverti diventa obbligatorio. Come si fa, te l'ho spiegato nella lezione ${lezioneRc.numero}.`,
      voce: "Prima soglia, il registro di commercio. Se nell'ultimo esercizio sei arrivato ad almeno centomila franchi, iscriverti diventa obbligatorio. Come si fa, te l'ho spiegato nella lezione tredici.",
      schermo: {
        tipo: "punto",
        titolo: "Il registro di commercio",
        testo: `Da ${SOGLIA_RC} nell'ultimo esercizio l'iscrizione è obbligatoria. Come fare: lezione ${lezioneRc.numero}.`,
        fonte: fonti.co931,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "sog-iva",
      stile: "lavagna",
      testo: `Poi l'IVA. Se non eri assoggettato dall'inizio, lo diventi alla fine dell'esercizio in cui hai raggiunto ${SOGLIA_IVA}. Da lì hai ${GIORNI_ANNUNCIO} giorni per annunciarti all'AFC: è nella lezione ${lezioneIva.numero}.`,
      voce: `Poi l'IVA. Se non eri assoggettato dall'inizio, lo diventi alla fine dell'esercizio in cui hai raggiunto centomila franchi. Da lì hai trenta giorni per annunciarti all'${AFC}: è nella lezione quattordici.`,
      schermo: {
        tipo: "punto",
        titolo: "L'IVA",
        testo: `Assoggettato dalla fine dell'esercizio in cui raggiungi ${SOGLIA_IVA}. Annuncio all'AFC entro ${GIORNI_ANNUNCIO} giorni.`,
        fonte: fonti.liva14,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "sog-primo-anno",
      stile: "lavagna",
      testo: `Il primo anno, se hai iniziato a metà anno, per l'IVA la cifra d'affari si riporta su un anno intero. Per esempio, ${META_SOGLIA_IVA} in sei mesi valgono come ${SOGLIA_IVA}: la soglia è raggiunta.`,
      voce: "Il primo anno, se hai iniziato a metà anno, per l'IVA la cifra d'affari si riporta su un anno intero. Per esempio, cinquantamila franchi in sei mesi valgono come centomila: la soglia è raggiunta.",
      schermo: {
        tipo: "punto",
        titolo: "Il primo anno",
        testo: `Un anno incompleto si riporta su un anno intero: ${META_SOGLIA_IVA} in sei mesi valgono ${SOGLIA_IVA}.`,
        fonte: fontiPercorso.oiva9,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "sog-contabilita",
      stile: "lavagna",
      testo: `Terza soglia, la contabilità. Da ${SOGLIA_CONTABILITA} nell'ultimo esercizio non basta più quella semplificata: serve quella completa. Parlane con un fiduciario autorizzato e rivedi la lezione ${lezioneContabilita.numero}.`,
      voce: "Terza soglia, la contabilità. Da cinquecentomila franchi nell'ultimo esercizio non basta più quella semplificata: serve quella completa. Parlane con un fiduciario autorizzato e rivedi la lezione diciotto.",
      schermo: {
        tipo: "punto",
        titolo: "La contabilità",
        testo: `Da ${SOGLIA_CONTABILITA} nell'ultimo esercizio serve la contabilità completa: con un fiduciario autorizzato.`,
        fonte: fonti.co957,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "sog-sotto",
      stile: "lavagna",
      testo: `E se sei iscritto all'IVA e scendi sotto la soglia? Se prevedi di restarci anche l'anno dopo, puoi chiedere all'AFC di uscire. Hai ${GIORNI_RADIAZIONE} giorni dalla fine dell'anno: se non lo chiedi, resti iscritto.`,
      voce: `E se sei iscritto all'IVA e scendi sotto la soglia? Se prevedi di restarci anche l'anno dopo, puoi chiedere all'${AFC} di uscire. Hai sessanta giorni dalla fine dell'anno: se non lo chiedi, resti iscritto.`,
      schermo: {
        tipo: "punto",
        titolo: "Sotto la soglia IVA",
        testo: `Puoi chiedere di uscire dall'IVA entro ${GIORNI_RADIAZIONE} giorni dalla fine dell'anno. Se non lo chiedi, resti iscritto.`,
        fonte: fonti.afcAssoggettamento,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "sog-strumento",
      stile: "lavagna",
      testo:
        "Ti aiuta lo strumento di Bleo «I tuoi conti»: il riepilogo dell'anno mostra le entrate confermate, e Bleo ti avvisa quando si avvicinano alla soglia dell'IVA. Conta però la cifra d'affari vera: controlla che ci siano tutte le fatture.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "«I tuoi conti»: le entrate dell'anno e un avviso vicino alla soglia IVA. Controlla che ci siano tutte le fatture.",
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "sog-routine",
      stile: "lavagna",
      testo: `Ricapitoliamo. Somma la cifra d'affari. Confrontala con le soglie. Se ne hai raggiunta una, agisci in tempo: per l'IVA hai ${GIORNI_ANNUNCIO} giorni. E rifallo ogni anno.`,
      voce: "Ricapitoliamo. Somma la cifra d'affari. Confrontala con le soglie. Se ne hai raggiunta una, agisci in tempo: per l'IVA hai trenta giorni. E rifallo ogni anno.",
      schermo: {
        tipo: "punto",
        titolo: "Ogni fine esercizio",
        testo: `Somma la cifra d'affari, confrontala con le soglie, agisci in tempo (per l'IVA ${GIORNI_ANNUNCIO} giorni) e rifallo ogni anno.`,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Il corso è finito, ma Bleo resta con te: ti segue in tutto quello che fai con la tua impresa. Spese e ricevute, fatture, scadenze: ti aiuta ogni giorno, e per ogni dubbio c'è la chat. Per il tuo caso, rivolgiti a un fiduciario autorizzato.",
      schermo: {
        tipo: "punto",
        titolo: "Bleo è con te",
        testo: "«I tuoi conti», «Preventivo e fattura», le scadenze del tuo percorso e la chat. Per il tuo caso, un fiduciario autorizzato.",
        fonte: fonti.albofiduciari,
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Complimenti! E da qui in avanti, ci vediamo ogni giorno nella tua attività.",
      schermo: { tipo: "fonte", fonte: fonti.afcAssoggettamento, verificatoIl: corso.verificatoIl },
    },
  ],
};
