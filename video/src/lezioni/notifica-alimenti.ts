/**
 * Lezione 5: «Vendi cibo? Notifica la tua attività». Fonti, ricontrollate il
 * 18.10.2026 (VERIFICATO_ALIMENTI in src/data/svizzera.ts):
 * - ODerr, stato 01.07.2025: obbligo di notifica, eccezione per le piccole
 *   vendite occasionali, cambiamenti e chiusura (art. 20); autorizzazione per
 *   alcune aziende con alimenti di origine animale, con eccezioni (art. 21);
 *   persona responsabile (art. 73); controllo autonomo (art. 74);
 * - Laboratorio cantonale ticinese: l'essenziale (uso domestico privato
 *   escluso), la notifica, il controllo autonomo (rintracciabilità, ritiro,
 *   documentazione, linee direttive delle associazioni di categoria),
 *   l'etichettatura (visibile, leggibile, in una lingua ufficiale, niente
 *   promesse di cura);
 * - formulario per la notifica (dati richiesti, verifica della registrazione
 *   dopo regoleAlimenti.verificaRegistrazioneSettimane settimane);
 * - Grigioni: notifica con il modulo online (fontiPercorso.grNotificaDerrate).
 * Ufficio e indirizzo: ufficiPercorso.laboratorioCantonaleTicino.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { fontiPercorso, regoleAlimenti, ufficiPercorso } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("notifica-derrate-alimentari");
if (!corso) throw new Error("Manca la lezione notifica-derrate-alimentari in src/data/corso.ts");

const laboratorio = ufficiPercorso.laboratorioCantonaleTicino.valore;
const SETTIMANE = regoleAlimenti.verificaRegistrazioneSettimane.valore;

// La voce dice le cifre e i luoghi in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (SETTIMANE !== 2 || laboratorio.nome !== "Laboratorio cantonale" || !laboratorio.indirizzo.endsWith("Bellinzona")) {
  throw new Error("Un dato della notifica è cambiato: aggiorna `voce` delle scene 4 e 6 e rifalle (npm run voce -- notifica-derrate-alimentari 4 6).");
}
const CITTA = laboratorio.indirizzo.split(" ").at(-1);

export const notificaAlimenti: Lezione = {
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
        "Ciao, sono Bleo! Vuoi vendere torte fatte in casa, panini o fare catering? Allora c'è un passo da non saltare: la notifica al Cantone.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "ali-chi",
      stile: "lavagna",
      testo:
        "La regola vale per tutti: chi lavora con gli alimenti deve notificare la sua attività al Cantone. Per esempio chi li prepara, li conserva, li trasporta o li vende.",
      schermo: {
        tipo: "punto",
        titolo: "Chi deve notificare",
        testo: "Chi prepara, conserva, trasporta o vende alimenti.",
        fonte: fontiPercorso.oderr20,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "ali-eccezioni",
      stile: "lavagna",
      testo:
        "Non serve per le piccole vendite occasionali, come a un mercatino o a una festa della scuola. E non conta quello che cucini per la tua famiglia.",
      schermo: {
        tipo: "punto",
        titolo: "Quando non serve",
        testo: "Piccole vendite occasionali (mercatini, feste della scuola) e cucina per la famiglia.",
        fonte: fontiPercorso.laboratorioEssenziale,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "ali-ufficio",
      stile: "lavagna",
      testo: `In Ticino la notifica va al ${laboratorio.nome}, a ${CITTA}. Nei Grigioni, invece, si fa con il modulo online del Cantone.`,
      voce: "In Ticino la notifica va al Laboratorio cantonale, a Bellinzona. Nei Grigioni, invece, si fa con il modulo online del Cantone.",
      schermo: {
        tipo: "punto",
        titolo: "A chi notificare",
        testo: `Ticino: ${laboratorio.nome}, ${laboratorio.indirizzo}. Grigioni: modulo online.`,
        fonte: fontiPercorso.laboratorioCantonaleNotifica,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "ali-formulario",
      stile: "lavagna",
      testo:
        "Compili il formulario e lo mandi completo. Ci scrivi dove si trova la tua attività, cosa fai con gli alimenti, se vendi online e chi è la persona responsabile.",
      schermo: {
        tipo: "punto",
        titolo: "Il formulario",
        testo: "Indirizzo dell'attività, cosa fai con gli alimenti, vendita online, persona responsabile.",
        fonte: fontiPercorso.formularioNotificaDerrate,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "ali-conferma",
      stile: "lavagna",
      testo: `Il Laboratorio non manda una conferma. Circa ${SETTIMANE} settimane dopo l'invio, controlli sul suo sito che la tua attività sia registrata.`,
      voce: "Il Laboratorio non manda una conferma. Circa due settimane dopo l'invio, controlli sul suo sito che la tua attività sia registrata.",
      schermo: {
        tipo: "punto",
        titolo: "Niente conferma",
        testo: `Dopo circa ${SETTIMANE} settimane controlli la registrazione sul sito del Laboratorio.`,
        fonte: fontiPercorso.laboratorioCantonaleNotifica,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "ali-responsabile",
      stile: "lavagna",
      testo:
        "In ogni azienda alimentare c'è una persona responsabile: risponde della sicurezza degli alimenti. Se non ne indichi una, il responsabile è chi dirige l'azienda: quindi tu.",
      schermo: {
        tipo: "punto",
        titolo: "La persona responsabile",
        testo: "Se non ne indichi una, è chi dirige l'azienda.",
        fonte: fontiPercorso.oderr73,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "ali-controllo",
      stile: "lavagna",
      testo:
        "Il responsabile fa il controllo autonomo: alimenti sicuri, sapere da dove vengono e ritirarli se c'è un problema, con i documenti in ordine. Va fatto in modo adatto al rischio e a quanto produci.",
      schermo: {
        tipo: "punto",
        titolo: "Il controllo autonomo",
        testo: "Alimenti sicuri, rintracciabili, ritirati se c'è un problema, con i documenti. Adatto al rischio e a quanto produci.",
        fonte: fontiPercorso.oderr74,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "ali-etichetta",
      stile: "lavagna",
      testo:
        "Sull'etichetta, le indicazioni obbligatorie vanno messe ben visibili, leggibili e in almeno una lingua ufficiale. E non devono ingannare: niente promesse di curare malattie.",
      schermo: {
        tipo: "punto",
        titolo: "L'etichetta",
        testo: "Ben visibile, leggibile, in almeno una lingua ufficiale. Niente promesse di curare malattie.",
        fonte: fontiPercorso.laboratorioEtichettatura,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "ali-animale",
      stile: "lavagna",
      testo:
        "Attenzione a carne, latte, uova e agli altri alimenti di origine animale. Per alcune attività serve anche un'autorizzazione. Ci sono diverse eccezioni: chiedi al Laboratorio.",
      schermo: {
        tipo: "attenzione",
        titolo: "Carne, latte, uova",
        testo: "Per alcune attività serve anche un'autorizzazione: chiedi al Laboratorio.",
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "E più avanti? Notifica anche i cambiamenti importanti, come un nuovo indirizzo o un nuovo responsabile, e la chiusura dell'attività. Se hai un dubbio, scrivimi in chat.",
      schermo: {
        tipo: "punto",
        titolo: "Più avanti",
        testo: "Notifica i cambiamenti importanti e la chiusura dell'attività.",
        fonte: fontiPercorso.oderr20,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.laboratorioCantonaleNotifica, verificatoIl: corso.verificatoIl },
    },
  ],
};
