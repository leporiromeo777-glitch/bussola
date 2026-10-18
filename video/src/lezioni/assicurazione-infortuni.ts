/**
 * Lezione 12: «Sei assicurato contro gli infortuni?». Fonti, ricontrollate il
 * 18.10.2026 (VERIFICATO_INFORTUNI in src/data/svizzera.ts):
 * - LAINF, stato 01.01.2026: assicurati d'obbligo i lavoratori occupati in
 *   Svizzera (art. 1a, fontiPercorso.lainf1a); fine dell'assicurazione
 *   regoleInfortuni.coperturaDopoImpiegoGiorni giorni dopo la fine del
 *   salario (art. 3, fontiPercorso.lainf3); gli indipendenti possono
 *   assicurarsi a titolo facoltativo (art. 4, fontiPercorso.lainf4);
 *   indennità giornaliera regoleInfortuni.indennitaGiornaliera del guadagno
 *   assicurato (artt. 16-17, fontiPercorso.lainf17); premi degli infortuni
 *   professionali al datore, di quelli non professionali al lavoratore,
 *   trattenuti dal salario (art. 91, fontiPercorso.lainf91);
 * - OAINF: infortuni non professionali assicurati da
 *   regoleInfortuni.oreSettimanaliNonProfessionali ore alla settimana (art. 13,
 *   fontiPercorso.oainf13, e la pagina dell'UFSP fontiPercorso.ufspObbligoInfortuni);
 *   assicurazione facoltativa anche per chi è in parte dipendente (art. 134),
 *   la Suva per i settori dell'art. 66 LAINF, gli altri assicuratori per gli
 *   altri indipendenti (art. 135, fontiPercorso.oainf135); guadagno assicurato
 *   minimo regoleInfortuni.guadagnoMinimoIndipendenti (art. 138, 45% nel 2026
 *   e 30% dal 01.01.2027: fontiPercorso.oainf138 e oainfModifica2027);
 * - LAMal, stato 01.07.2026: la cassa malati paga gli infortuni non coperti
 *   da un'assicurazione infortuni (art. 1a, fontiPercorso.lamal1a), come le
 *   malattie e con la partecipazione ai costi (artt. 28 e 64,
 *   fontiPercorso.lamal28); l'assicurazione di base paga le cure, l'indennità
 *   giornaliera è facoltativa (art. 1a); la copertura infortuni sospesa torna
 *   appena finisce quella LAINF (art. 8, fontiPercorso.lamal8) e va avvisata
 *   la cassa, che se no può chiedere i premi arretrati (art. 10,
 *   fontiPercorso.lamal10);
 * - promemoria AVS 2.02: gli indipendenti non sono nell'assicurazione
 *   obbligatoria contro gli infortuni (fonti.avsPromemoria202);
 * - Portale PMI: Suva in molti settori, assicuratori e casse malati negli
 *   altri, prestazioni (cure, indennità giornaliere, rendite) e obbligo per i
 *   dipendenti (fontiPercorso.pmiInfortuni); Suva, assicurazione per
 *   imprenditori, prestazioni e premi (indennità dal 3°, 15° o 30° giorno;
 *   guadagno da assicurare in base al reddito effettivo:
 *   fontiPercorso.suvaImprenditori, suvaPremiImprenditori).
 * Lo strumento «Tariffa oraria» (src/app/strumenti/tariffa) ha i costi fissi
 * «Assicurazioni», con l'esempio «infortuni facoltativa».
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { chf, fontiPercorso, percentuale, regoleInfortuni as inf } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("assicurazione-infortuni");
if (!corso) throw new Error("Manca la lezione assicurazione-infortuni in src/data/corso.ts");

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  inf.oreSettimanaliNonProfessionali.valore !== 8 ||
  inf.indennitaGiornaliera.valore !== 0.8 ||
  inf.coperturaDopoImpiegoGiorni.valore !== 31 ||
  inf.guadagnoMinimoIndipendenti[2026].valore !== 66_690 ||
  inf.guadagnoMinimoIndipendenti[2027].valore !== 44_460
) {
  throw new Error(
    "Una regola sull'assicurazione infortuni è cambiata: aggiorna `voce` delle scene 2, 5, 7, 8 e 9 e rifalle (npm run voce -- assicurazione-infortuni 2 5 7 8 9).",
  );
}

const ORE = inf.oreSettimanaliNonProfessionali.valore;
const INDENNITA = percentuale(inf.indennitaGiornaliera.valore);
const GIORNI = inf.coperturaDopoImpiegoGiorni.valore;
const MINIMO_2026 = chf(inf.guadagnoMinimoIndipendenti[2026].valore);
const MINIMO_2027 = chf(inf.guadagnoMinimoIndipendenti[2027].valore);

export const assicurazioneInfortuni: Lezione = {
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
        "Ciao, sono Bleo! Se ti fai male, chi paga? Da dipendente ti assicura il datore di lavoro. Quando lavori in proprio, invece, tocca a te pensarci.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "inf-dipendente",
      stile: "lavagna",
      testo: `Chi lavora come dipendente in Svizzera, per legge, è assicurato contro gli infortuni sul lavoro. Se lavora almeno ${ORE} ore alla settimana per lo stesso datore, è coperto anche nel tempo libero.`,
      voce: "Chi lavora come dipendente in Svizzera, per legge, è assicurato contro gli infortuni sul lavoro. Se lavora almeno otto ore alla settimana per lo stesso datore, è coperto anche nel tempo libero.",
      schermo: {
        tipo: "punto",
        titolo: "Da dipendente",
        testo: `Assicurato per legge al lavoro; da ${ORE} ore alla settimana anche nel tempo libero.`,
        fonte: fontiPercorso.oainf13,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "inf-indipendente",
      stile: "lavagna",
      testo:
        "Da indipendente, invece, nessuno ti assicura in automatico: la legge non ti obbliga. Però puoi assicurarti contro gli infortuni a titolo facoltativo.",
      schermo: {
        tipo: "punto",
        titolo: "Da indipendente",
        testo: "L'assicurazione infortuni non è obbligatoria: puoi farla a titolo facoltativo.",
        fonte: fontiPercorso.lainf4,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "inf-cassa-malati",
      stile: "lavagna",
      testo:
        "Se non ti assicuri, gli infortuni li copre la cassa malati, come una malattia. Paga le cure, ma con la franchigia e la tua parte dei costi.",
      schermo: {
        tipo: "punto",
        titolo: "Senza assicurazione infortuni",
        testo: "Paga la cassa malati, come per una malattia: con franchigia e aliquota.",
        fonte: fontiPercorso.lamal28,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "inf-differenza",
      stile: "lavagna",
      testo: `Però l'assicurazione di base della cassa malati non paga il guadagno che perdi. Quella infortuni, se non puoi lavorare, ti dà un'indennità giornaliera: l'${INDENNITA} del guadagno assicurato.`,
      voce: "Però l'assicurazione di base della cassa malati non paga il guadagno che perdi. Quella infortuni, se non puoi lavorare, ti dà un'indennità giornaliera: l'ottanta per cento del guadagno assicurato.",
      schermo: {
        tipo: "punto",
        titolo: "La differenza",
        testo: `L'assicurazione infortuni paga anche un'indennità giornaliera: l'${INDENNITA} del guadagno assicurato.`,
        fonte: fontiPercorso.lainf17,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "inf-dove",
      stile: "lavagna",
      testo:
        "Dove ti assicuri? Nei settori della Suva, come l'edilizia, c'è la sua assicurazione per imprenditori. Negli altri settori la offrono gli assicuratori privati e le casse malati.",
      schermo: {
        tipo: "punto",
        titolo: "Dove ti assicuri",
        testo: "Nei settori della Suva, la Suva. Negli altri, assicuratori privati e casse malati.",
        fonte: fontiPercorso.pmiInfortuni,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "inf-premio",
      stile: "lavagna",
      testo: `Il premio si calcola sul guadagno che assicuri: lo concordi con l'assicuratore, in base al tuo reddito. Però c'è un minimo: ${MINIMO_2026} nel 2026, ${MINIMO_2027} dal 2027.`,
      voce: "Il premio si calcola sul guadagno che assicuri: lo concordi con l'assicuratore, in base al tuo reddito. Però c'è un minimo: sessantaseimila seicentonovanta franchi nel duemilaventisei, quarantaquattromila quattrocentosessanta franchi dal duemilaventisette.",
      schermo: {
        tipo: "punto",
        titolo: "Quanto costa",
        testo: `Il premio dipende dal guadagno assicurato: almeno ${MINIMO_2026} nel 2026, ${MINIMO_2027} dal 2027.`,
        fonte: fontiPercorso.oainf138,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "inf-lasci-lavoro",
      stile: "lavagna",
      testo: `Lasci un lavoro da dipendente? L'assicurazione del datore ti copre ancora ${GIORNI} giorni dopo la fine del salario. Poi gli infortuni li copre di nuovo la cassa malati: avvisala, se no può chiederti i premi arretrati.`,
      voce: "Lasci un lavoro da dipendente? L'assicurazione del datore ti copre ancora trentun giorni dopo la fine del salario. Poi gli infortuni li copre di nuovo la cassa malati: avvisala, se no può chiederti i premi arretrati.",
      schermo: {
        tipo: "attenzione",
        titolo: "Se lasci un lavoro",
        testo: `L'assicurazione del datore finisce ${GIORNI} giorni dopo il salario: avvisa la cassa malati.`,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "inf-part-time",
      stile: "lavagna",
      testo: `Tieni anche un lavoro da dipendente, di almeno ${ORE} ore alla settimana? Allora il datore ti assicura anche nel tempo libero. Per l'attività in proprio chiedi al suo assicuratore come sei coperto: puoi anche assicurarla a titolo facoltativo.`,
      voce: "Tieni anche un lavoro da dipendente, di almeno otto ore alla settimana? Allora il datore ti assicura anche nel tempo libero. Per l'attività in proprio chiedi al suo assicuratore come sei coperto: puoi anche assicurarla a titolo facoltativo.",
      schermo: {
        tipo: "punto",
        titolo: "Se resti anche dipendente",
        testo: `Da ${ORE} ore alla settimana il datore ti copre anche nel tempo libero. L'attività in proprio la puoi assicurare a parte.`,
        fonte: fontiPercorso.oainf135,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "inf-dipendenti",
      stile: "lavagna",
      testo:
        "Se assumi qualcuno, assicurarlo contro gli infortuni è obbligatorio. Il premio per gli infortuni sul lavoro lo paghi tu. Quello per gli infortuni fuori dal lavoro è a carico del dipendente: lo trattieni dal salario.",
      schermo: {
        tipo: "punto",
        titolo: "Se assumi qualcuno",
        testo: "Assicurarlo è obbligatorio. Infortuni sul lavoro: paghi tu. Fuori dal lavoro: lo trattieni dal salario.",
        fonte: fontiPercorso.lainf91,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "inf-controlla",
      stile: "lavagna",
      testo:
        "Prima di iniziare, allora: chiama la cassa malati e chiedi se la copertura infortuni è attiva. Poi chiedi delle offerte e confronta premi e prestazioni, anche da quale giorno arriva l'indennità.",
      schermo: {
        tipo: "punto",
        titolo: "Prima di iniziare",
        testo: "Chiama la cassa malati, chiedi delle offerte e confronta premi e prestazioni.",
        fonte: fontiPercorso.suvaPremiImprenditori,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Il premio è un costo della tua attività: nello strumento «Tariffa oraria» di Bleo mettilo fra le assicurazioni. Se hai dubbi, chiedi a Bleo in chat o direttamente all'assicuratore.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "In «Tariffa oraria» metti il premio fra le assicurazioni. Dubbi? Chiedi a Bleo o all'assicuratore.",
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.lainf4, verificatoIl: corso.verificatoIl },
    },
  ],
};
