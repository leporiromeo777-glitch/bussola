/**
 * Lezione 14: «IVA: quando e come iscriverti». Fonti, ricontrollate il
 * 18.10.2026 (VERIFICATO_IVA in src/data/svizzera.ts):
 * - Portale PMI, «IVA: come funziona l'imposta sul valore aggiunto»: l'IVA nel
 *   prezzo, versata alla Confederazione meno l'imposta precedente; chi non è
 *   iscritto non la può dedurre; quando conviene iscriversi per scelta; con
 *   l'aliquota saldo il rendiconto è semestrale invece che trimestrale
 *   (fontiPercorso.pmiIva, regoleIva.mesiRendiconto);
 * - LIVA, stato 31.03.2025: esentato chi resta sotto regole.sogliaIva di
 *   cifra d'affari, in Svizzera e all'estero, senza IVA (art. 10, fonti.liva10);
 *   le prestazioni escluse, come le cure mediche e l'insegnamento (art. 21,
 *   fontiPercorso.liva21); assoggettato da subito se è presumibile superare la
 *   soglia entro regolePercorso.mesiPerIvaDaSubito mesi (art. 14, fonti.liva14);
 *   annuncio entro regole.termineAnnuncioIvaGiorni giorni (art. 66,
 *   fonti.liva66); iscrizione per scelta per almeno un periodo fiscale (art.
 *   11, fontiPercorso.liva11), cioè un anno civile (art. 34,
 *   fontiPercorso.liva34); cosa scrivere in fattura (art. 26,
 *   fontiPercorso.liva26) e niente IVA in fattura per chi non è iscritto (art.
 *   27, fonti.liva27); al ristorante l'aliquota normale, per gli alimenti da
 *   asporto e i medicinali la ridotta (art. 25, fontiPercorso.liva25); acconti
 *   con il rendiconto annuale (art. 86a, fontiPercorso.liva86a);
 * - OIVA, stato 01.01.2025 (artt. 9, 76a e 78 uguali dal 01.01.2027): chi è già
 *   attivo è assoggettato alla fine dell'esercizio in cui raggiunge la soglia,
 *   e la cifra d'affari di un anno incompleto è riportata su un anno intero
 *   (art. 9, fontiPercorso.oiva9); aliquota saldo e rendiconto annuale da
 *   chiedere entro regolePercorso.termineMetodoIvaGiorni giorni dalla
 *   comunicazione del numero IVA, se no metodo effettivo per almeno
 *   regoleIva.periodiEffettivoSenzaAliquotaSaldo periodi fiscali interi (artt.
 *   76a e 78, fontiPercorso.oiva76a e oiva78);
 * - AFC: assoggettamento (fonti.afcAssoggettamento), annuncio online anche in
 *   italiano, numero AVS e cifra d'affari prevista (fonti.afcIscrizione),
 *   aliquote dal regoleIva.aliquoteInVigoreDal (fonti.afcAliquote), aliquota
 *   saldo e aliquota di legge in fattura (fontiPercorso.afcAliquoteSaldo).
 * Lo strumento «Preventivo e fattura» (src/app/strumenti/preventivo e
 * fattura) calcola l'IVA per aliquota solo per chi è iscritto.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import {
  aliquoteIva,
  chf,
  dataSvizzera,
  fonti,
  fontiPercorso,
  percentuale,
  regole,
  regoleIva,
  regolePercorso,
} from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("iscrizione-iva");
if (!corso) throw new Error("Manca la lezione iscrizione-iva in src/data/corso.ts");

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  regole.sogliaIva.valore !== 100_000 ||
  regolePercorso.mesiPerIvaDaSubito.valore !== 12 ||
  regole.termineAnnuncioIvaGiorni.valore !== 30 ||
  regoleIva.periodiMinimiIscrizioneVolontaria.valore !== 1 ||
  regoleIva.aliquoteInVigoreDal.valore !== "2024-01-01" ||
  aliquoteIva.valore.normale !== 0.081 ||
  aliquoteIva.valore.ridotta !== 0.026 ||
  aliquoteIva.valore.alloggio !== 0.038 ||
  regoleIva.mesiRendiconto.valore.aliquotaSaldo !== 6 ||
  regoleIva.mesiRendiconto.valore.effettivo !== 3 ||
  regolePercorso.termineMetodoIvaGiorni.valore !== 60 ||
  regoleIva.periodiEffettivoSenzaAliquotaSaldo.valore !== 3
) {
  throw new Error(
    "Una regola sull'IVA è cambiata: aggiorna testo e `voce` delle scene 3, 4, 6, 7, 8, 10 e 11 e rifalle (npm run voce -- iscrizione-iva 3 4 6 7 8 10 11).",
  );
}

/** Come la voce deve dire la sigla dell'AFC (da ascoltare). */
const AFC = "a-effe-ci";

const SOGLIA = chf(regole.sogliaIva.valore);
const MESI = regolePercorso.mesiPerIvaDaSubito.valore;
const GIORNI = regole.termineAnnuncioIvaGiorni.valore;
const DAL = dataSvizzera(regoleIva.aliquoteInVigoreDal.valore);
const NORMALE = percentuale(aliquoteIva.valore.normale);
const RIDOTTA = percentuale(aliquoteIva.valore.ridotta);
const ALLOGGIO = percentuale(aliquoteIva.valore.alloggio);
const SEMESTRE = regoleIva.mesiRendiconto.valore.aliquotaSaldo;
const TRIMESTRE = regoleIva.mesiRendiconto.valore.effettivo;
const TERMINE = regolePercorso.termineMetodoIvaGiorni.valore;
const ANNI_EFFETTIVO = regoleIva.periodiEffettivoSenzaAliquotaSaldo.valore;

export const iscrizioneIva: Lezione = {
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
        "Ciao, sono Bleo! L'IVA è l'imposta che paghi su quasi tutto quello che compri. Quando la tua attività cresce, la devi chiedere anche tu ai clienti. Ti spiego quando e come iscriverti.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "iva-come-funziona",
      stile: "lavagna",
      testo:
        "Chi è iscritto all'IVA la aggiunge ai suoi prezzi e la incassa dai clienti. Poi la versa alla Confederazione, ma prima toglie l'IVA che ha pagato sui suoi acquisti: si chiama imposta precedente.",
      schermo: {
        tipo: "punto",
        titolo: "Come funziona l'IVA",
        testo: "La aggiungi ai prezzi, la incassi e la versi alla Confederazione, meno l'IVA pagata sugli acquisti.",
        fonte: fontiPercorso.pmiIva,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "iva-soglia",
      stile: "lavagna",
      testo: `L'iscrizione è obbligatoria da ${SOGLIA} di cifra d'affari all'anno. Conta il totale delle tue fatture senza IVA, in Svizzera e all'estero: non il guadagno. Non contano le prestazioni escluse dall'IVA, come molte cure mediche e l'insegnamento.`,
      voce: "L'iscrizione è obbligatoria da centomila franchi di cifra d'affari all'anno. Conta il totale delle tue fatture senza IVA, in Svizzera e all'estero: non il guadagno. Non contano le prestazioni escluse dall'IVA, come molte cure mediche e l'insegnamento.",
      schermo: {
        tipo: "punto",
        titolo: "La soglia",
        testo: `${SOGLIA} di cifra d'affari all'anno, senza IVA, in Svizzera e all'estero. Non contano le prestazioni escluse.`,
        fonte: fonti.liva10,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "iva-da-subito",
      stile: "lavagna",
      testo: `Quando inizia l'obbligo? Se all'avvio è prevedibile che superi la soglia entro ${MESI} mesi, sei assoggettato da subito, da quando inizi l'attività.`,
      voce: "Quando inizia l'obbligo? Se all'avvio è prevedibile che superi la soglia entro dodici mesi, sei assoggettato da subito, da quando inizi l'attività.",
      schermo: {
        tipo: "punto",
        titolo: "Da subito",
        testo: `Se all'avvio è prevedibile superare la soglia entro ${MESI} mesi: assoggettato dall'inizio dell'attività.`,
        fonte: fonti.liva14,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "iva-piu-tardi",
      stile: "lavagna",
      testo:
        "Se la superi più tardi, lo sei dalla fine dell'anno contabile in cui l'hai raggiunta. E se hai iniziato a metà anno, la cifra d'affari si calcola come su un anno intero.",
      schermo: {
        tipo: "punto",
        titolo: "Più tardi",
        testo: "Dalla fine dell'esercizio in cui raggiungi la soglia. Un anno incompleto si calcola come un anno intero.",
        fonte: fontiPercorso.oiva9,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "iva-annuncio",
      stile: "lavagna",
      testo: `Da quando sei assoggettato, hai ${GIORNI} giorni per annunciarti all'AFC, l'Amministrazione federale delle contribuzioni. Lo fai online, anche in italiano. Tieni pronti il tuo numero AVS e la cifra d'affari prevista per il primo anno.`,
      voce: `Da quando sei assoggettato, hai trenta giorni per annunciarti all'${AFC}, l'Amministrazione federale delle contribuzioni. Lo fai online, anche in italiano. Tieni pronti il tuo numero AVS e la cifra d'affari prevista per il primo anno.`,
      schermo: {
        tipo: "punto",
        titolo: "L'annuncio",
        testo: `Entro ${GIORNI} giorni, online all'AFC. Servono il numero AVS e la cifra d'affari prevista.`,
        fonte: fonti.afcIscrizione,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "iva-volontaria",
      stile: "lavagna",
      testo:
        "Sotto la soglia puoi iscriverti lo stesso, per scelta. Conviene soprattutto se lavori per imprese iscritte all'IVA o per l'estero, o se all'inizio investi molto. Però poi metti l'IVA nei prezzi, fai i rendiconti e resti iscritto almeno un anno.",
      schermo: {
        tipo: "punto",
        titolo: "Iscriversi per scelta",
        testo: "Conviene con clienti iscritti all'IVA, con l'estero o con grandi spese. Poi resti iscritto almeno un anno.",
        fonte: fontiPercorso.pmiIva,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "iva-aliquote",
      stile: "lavagna",
      testo: `Le aliquote, in vigore dal ${DAL}, sono tre. Normale: ${NORMALE}. Ridotta: ${RIDOTTA}, per esempio per gli alimenti e i medicinali; al ristorante però vale la normale. Per l'alloggio: ${ALLOGGIO}.`,
      voce: "Le aliquote, in vigore dal primo gennaio duemilaventiquattro, sono tre. Normale: otto virgola uno per cento. Ridotta: due virgola sei per cento, per esempio per gli alimenti e i medicinali; al ristorante però vale la normale. Per l'alloggio: tre virgola otto per cento.",
      schermo: {
        tipo: "punto",
        titolo: "Le aliquote",
        testo: `Normale ${NORMALE}, ridotta ${RIDOTTA}, alloggio ${ALLOGGIO} (dal ${DAL}).`,
        fonte: fonti.afcAliquote,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "iva-fattura",
      stile: "lavagna",
      testo:
        "Se sei iscritto, in fattura metti il tuo numero IVA, l'aliquota e l'importo dell'IVA: lo vediamo nella lezione sulle fatture. Se non sei iscritto, invece, l'IVA in fattura non la puoi scrivere.",
      schermo: {
        tipo: "punto",
        titolo: "In fattura",
        testo: "Iscritto: numero IVA, aliquota e importo dell'IVA. Non iscritto: niente IVA in fattura.",
        fonte: fonti.liva27,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "iva-aliquota-saldo",
      stile: "lavagna",
      testo: `C'è anche un metodo più semplice, l'aliquota saldo: moltiplichi la cifra d'affari, IVA compresa, per l'aliquota del tuo settore. Non calcoli l'imposta precedente, e il rendiconto lo fai ogni ${SEMESTRE} mesi invece che ogni ${TRIMESTRE}. In fattura, però, metti sempre l'aliquota di legge.`,
      voce: "C'è anche un metodo più semplice, l'aliquota saldo: moltiplichi la cifra d'affari, IVA compresa, per l'aliquota del tuo settore. Non calcoli l'imposta precedente, e il rendiconto lo fai ogni sei mesi invece che ogni tre. In fattura, però, metti sempre l'aliquota di legge.",
      schermo: {
        tipo: "punto",
        titolo: "L'aliquota saldo",
        testo: `Cifra d'affari con IVA per l'aliquota del settore, rendiconto ogni ${SEMESTRE} mesi. In fattura l'aliquota di legge.`,
        fonte: fontiPercorso.afcAliquoteSaldo,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "iva-termine",
      stile: "lavagna",
      testo: `L'aliquota saldo va chiesta entro ${TERMINE} giorni da quando ricevi il numero IVA. Altrimenti resti al metodo effettivo per almeno ${ANNI_EFFETTIVO} anni interi. Nello stesso termine puoi chiedere anche il rendiconto annuale: uno solo all'anno, con degli acconti.`,
      voce: "L'aliquota saldo va chiesta entro sessanta giorni da quando ricevi il numero IVA. Altrimenti resti al metodo effettivo per almeno tre anni interi. Nello stesso termine puoi chiedere anche il rendiconto annuale: uno solo all'anno, con degli acconti.",
      schermo: {
        tipo: "attenzione",
        titolo: `Entro ${TERMINE} giorni dal numero IVA`,
        testo: `Chiedi l'aliquota saldo o il rendiconto annuale. Dopo, per l'aliquota saldo aspetti almeno ${ANNI_EFFETTIVO} anni.`,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Bleo non compila i rendiconti IVA per te: per il tuo caso e per il metodo, chiedi a un fiduciario autorizzato. Per le fatture, invece, c'è lo strumento di Bleo «Preventivo e fattura»: se sei iscritto, l'IVA la calcola lui.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "Rendiconti e metodo: chiedi a un fiduciario autorizzato. Fatture: «Preventivo e fattura» calcola l'IVA.",
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fonti.afcIscrizione, verificatoIl: corso.verificatoIl },
    },
  ],
};
