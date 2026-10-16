/**
 * Lezione 1: «Cos'è una ditta individuale».
 * Testi presi dal passo `ditta-individuale` in src/data/passi.ts; fonti e data
 * di controllo da src/data/corso.ts. La voce dice «Blìo», lo schermo scrive Bleo.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione, PuntoElenco, Schermo } from "./tipi";

const corso = lezionePerPasso("ditta-individuale");
if (!corso) throw new Error("Manca la lezione ditta-individuale in src/data/corso.ts");
const [fonteDitta, fonteImposte] = corso.fonti;

const TRE_COSE = "Ricorda 3 cose";
const PUNTI: readonly PuntoElenco[] = [
  { testo: "Nasce quando inizi l'attività" },
  { testo: "Non serve un capitale" },
  { testo: "Il titolare sei solo tu", nota: "In più persone serve un'altra forma" },
];

/** La scheda «Ricorda 3 cose» con i primi `visibili` punti. */
function treCose(visibili: number): Schermo {
  return { tipo: "elenco", titolo: TRE_COSE, intro: "La forma più semplice per lavorare in proprio", punti: PUNTI, visibili };
}

export const dittaIndividuale: Lezione = {
  id: corso.passoId,
  numero: corso.numero,
  titolo: corso.titolo,
  clip: "clip.mp4",
  prossimoPasso: titoloProssimoPasso(corso.passoId),
  scene: [
    {
      audio: "scena-1.mp3",
      testo: "Ciao, sono Bleo! In un minuto ti spiego cos'è una ditta individuale.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      testo: "È la forma più semplice per lavorare in proprio. Ricorda tre cose.",
      schermo: treCose(0),
    },
    {
      audio: "scena-3.mp3",
      testo: "Primo: la ditta nasce quando inizi la tua attività.",
      schermo: treCose(1),
    },
    {
      audio: "scena-4.mp3",
      testo: "Secondo: non serve un capitale per aprirla.",
      schermo: treCose(2),
    },
    {
      audio: "scena-5.mp3",
      testo: "Terzo: il titolare sei solo tu. Se partite in più persone, serve un'altra forma.",
      schermo: treCose(3),
    },
    {
      audio: "scena-6.mp3",
      testo:
        "Attenzione: tu e la ditta siete la stessa persona. Per questo rispondi dei debiti della ditta con tutto il tuo patrimonio personale.",
      schermo: {
        tipo: "attenzione",
        titolo: "Rispondi con il tuo patrimonio personale",
        testo: "Tu e la ditta siete la stessa persona: i debiti della ditta sono anche tuoi.",
      },
    },
    {
      audio: "scena-7.mp3",
      testo: "E le imposte sul reddito della ditta le paghi tu, nella tua dichiarazione personale.",
      schermo: {
        tipo: "punto",
        titolo: "Le imposte le paghi tu",
        testo: "Il reddito della ditta va nella tua dichiarazione personale.",
        fonte: fonteImposte,
      },
    },
    {
      audio: "scena-8.mp3",
      testo: "Se il rischio ti preoccupa, chiedi a un fiduciario autorizzato se ti conviene un'altra forma.",
      schermo: {
        tipo: "punto",
        titolo: "Il rischio ti preoccupa?",
        testo: "Chiedi a un fiduciario autorizzato se ti conviene un'altra forma.",
      },
    },
    {
      audio: "scena-9.mp3",
      testo: "La fonte ufficiale la trovi qui sotto, sul Portale PMI della Confederazione. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fonteDitta, verificatoIl: corso.verificatoIl },
    },
  ],
};
