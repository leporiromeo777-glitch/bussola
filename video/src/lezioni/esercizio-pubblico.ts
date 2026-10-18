/**
 * Lezione 4: «Aprire un bar o un ristorante». Fonti, ricontrollate il
 * 18.10.2026 (VERIFICATO_ESERCIZI_PUBBLICI in src/data/svizzera.ts):
 * - LEAR del 15.03.2023 (fontiPercorso.lear): definizione di esercizio,
 *   gestore e gerente (art. 4), eccezioni (art. 3: ristorazione a domicilio,
 *   alloggio fino a regoleEserciziPubblici.alloggioSenzaLearPersone persone),
 *   obbligo di autorizzazione e chiusura immediata (art. 5), società con sede
 *   in Svizzera e una persona come gestore (art. 6), requisiti di gestore e
 *   gerente (art. 9), permessi speciali del Municipio per le feste (art. 27);
 * - RLEAR del 07.06.2023 (fontiPercorso.rlear): domanda almeno
 *   termineDomandaGiorni giorni prima (art. 26), documenti (art. 27), RC
 *   minima rcMinimaFranchi (art. 32), diploma con esame e praticaDiplomaMesi
 *   mesi di pratica (art. 38), tassa tassaAutorizzazioneFranchi (art. 60);
 * - Polizia cantonale, procedura per persone e società
 *   (fontiPercorso.poliziaEserciziPubbliciPersona e …Societa);
 * - DFP, diploma di esercente e corsi della scuola esercenti di GastroTicino
 *   (fontiPercorso.diplomaEsercente e diplomaEsercenteCorso).
 * La notifica degli alimenti è il passo seguente (src/data/passi.ts).
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { chf, fontiPercorso, regoleEserciziPubblici as ep } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("autorizzazione-esercizio-pubblico");
if (!corso) throw new Error("Manca la lezione autorizzazione-esercizio-pubblico in src/data/corso.ts");

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (
  ep.alloggioSenzaLearPersone.valore !== 6 ||
  ep.rcMinimaFranchi.valore !== 3_000_000 ||
  ep.praticaGerenteAltroCantoneAnni.valore !== 3 ||
  ep.praticaDiplomaMesi.valore !== 5 ||
  ep.termineDomandaGiorni.valore !== 15 ||
  ep.tassaAutorizzazioneFranchi.valore.min !== 100 ||
  ep.tassaAutorizzazioneFranchi.valore.max !== 500
) {
  throw new Error(
    "Una regola sugli esercizi pubblici è cambiata: aggiorna `voce` delle scene 3, 6, 7, 8 e 10 e rifalle (npm run voce -- autorizzazione-esercizio-pubblico 3 6 7 8 10).",
  );
}

const RC = chf(ep.rcMinimaFranchi.valore);
const TASSA_MIN = chf(ep.tassaAutorizzazioneFranchi.valore.min);
const TASSA_MAX = chf(ep.tassaAutorizzazioneFranchi.valore.max);

export const esercizioPubblico: Lezione = {
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
        "Ciao, sono Bleo! Vuoi aprire un bar, un ristorante o un piccolo albergo? In Ticino, prima di aprire, ti serve un'autorizzazione. Ti spiego come si ottiene.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "ep-esercizio",
      stile: "lavagna",
      testo:
        "Un esercizio pubblico, per la legge ticinese, è un locale dove si vendono cibi o bevande da consumare sul posto. Oppure dove si alloggiano degli ospiti, come in un albergo.",
      schermo: {
        tipo: "punto",
        titolo: "Cos'è un esercizio pubblico",
        testo: "Un locale dove si vendono cibi o bevande da consumare sul posto, o si alloggiano ospiti.",
        fonte: fontiPercorso.lear,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "ep-eccezioni",
      stile: "lavagna",
      testo: `Alcune attività restano fuori da questa legge: per esempio la ristorazione a domicilio e gli alloggi fino a ${ep.alloggioSenzaLearPersone.valore} persone. Per vendere cibi e bevande a una festa serve invece un permesso speciale del Municipio.`,
      voce: "Alcune attività restano fuori da questa legge: per esempio la ristorazione a domicilio e gli alloggi fino a sei persone. Per vendere cibi e bevande a una festa serve invece un permesso speciale del Municipio.",
      schermo: {
        tipo: "punto",
        titolo: "Casi particolari",
        testo: `Fuori dalla legge: ristorazione a domicilio, alloggi fino a ${ep.alloggioSenzaLearPersone.valore} persone. Per una festa: permesso speciale del Municipio.`,
        fonte: fontiPercorso.lear,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "ep-obbligo",
      stile: "lavagna",
      testo:
        "La regola è chiara: senza autorizzazione non puoi né aprire né gestire il locale. Se apri lo stesso, il Cantone lo fa chiudere subito.",
      schermo: {
        tipo: "attenzione",
        titolo: "Prima l'autorizzazione",
        testo: "Senza, non puoi né aprire né gestire il locale.",
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "ep-ruoli",
      stile: "lavagna",
      testo:
        "Contano due ruoli. Il gestore riceve l'autorizzazione ed è il datore di lavoro. Il gerente conduce il locale e ha il diploma di esercente. Se apri a tuo nome, puoi essere tu sia il gestore sia il gerente.",
      schermo: {
        tipo: "punto",
        titolo: "Gestore e gerente",
        testo: "Il gestore riceve l'autorizzazione, il gerente conduce il locale. Se apri a tuo nome, possono essere la stessa persona.",
        fonte: fontiPercorso.lear,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "ep-gestore",
      stile: "lavagna",
      testo: `Il gestore deve avere l'attestato del Municipio che i locali sono idonei, e il diritto di usarli. Poi un'assicurazione di responsabilità civile di almeno ${RC} per sinistro. E un gerente.`,
      voce: "Il gestore deve avere l'attestato del Municipio che i locali sono idonei, e il diritto di usarli. Poi un'assicurazione di responsabilità civile di almeno tre milioni di franchi per sinistro. E un gerente.",
      schermo: {
        tipo: "punto",
        titolo: "Cosa serve al gestore",
        testo: `Locali idonei (attestato del Municipio), diritto di usarli, assicurazione RC di almeno ${RC} e un gerente.`,
        fonte: fontiPercorso.rlear,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "ep-gerente",
      stile: "lavagna",
      testo: `Il gerente deve avere il diploma cantonale di esercente. Senza un certificato riconosciuto, va bene anche una pratica di almeno ${ep.praticaGerenteAltroCantoneAnni.valore} anni come esercente in un altro Cantone. E non deve avere condanne incompatibili con questo lavoro.`,
      voce: "Il gerente deve avere il diploma cantonale di esercente. Senza un certificato riconosciuto, va bene anche una pratica di almeno tre anni come esercente in un altro Cantone. E non deve avere condanne incompatibili con questo lavoro.",
      schermo: {
        tipo: "punto",
        titolo: "Cosa serve al gerente",
        testo: `Il diploma cantonale di esercente, oppure ${ep.praticaGerenteAltroCantoneAnni.valore} anni di pratica in un altro Cantone.`,
        fonte: fontiPercorso.lear,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "ep-diploma",
      stile: "lavagna",
      testo: `Per il diploma superi un esame e fai ${ep.praticaDiplomaMesi.valore} mesi di pratica, anche a tempo parziale. Per prepararti ci sono i corsi della scuola esercenti di GastroTicino.`,
      voce: "Per il diploma superi un esame e fai cinque mesi di pratica, anche a tempo parziale. Per prepararti ci sono i corsi della scuola esercenti di GastroTicino.",
      schermo: {
        tipo: "punto",
        titolo: "Il diploma di esercente",
        testo: `Un esame e ${ep.praticaDiplomaMesi.valore} mesi di pratica. I corsi li propone la scuola esercenti di GastroTicino.`,
        fonte: fontiPercorso.diplomaEsercenteCorso,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "ep-societa",
      stile: "lavagna",
      testo:
        "Se apri con una Sagl o una SA, l'autorizzazione va alla società. La società deve avere la sede in Svizzera e nominare una persona come gestore.",
      schermo: {
        tipo: "punto",
        titolo: "Con una società",
        testo: "Sede in Svizzera e una persona nominata come gestore.",
        fonte: fontiPercorso.poliziaEserciziPubbliciSocieta,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "ep-domanda",
      stile: "lavagna",
      testo: `L'autorizzazione la chiedi alla Polizia cantonale, con la sua procedura, almeno ${ep.termineDomandaGiorni.valore} giorni prima di aprire. La tassa va da ${TASSA_MIN} a ${TASSA_MAX}.`,
      voce: "L'autorizzazione la chiedi alla Polizia cantonale, con la sua procedura, almeno quindici giorni prima di aprire. La tassa va da cento a cinquecento franchi.",
      schermo: {
        tipo: "punto",
        titolo: "La domanda",
        testo: `Alla Polizia cantonale, almeno ${ep.termineDomandaGiorni.valore} giorni prima di aprire. Tassa da ${TASSA_MIN} a ${TASSA_MAX}.`,
        fonte: fontiPercorso.poliziaEserciziPubbliciPersona,
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "ep-documenti",
      stile: "lavagna",
      testo:
        "Con la domanda alleghi i documenti: l'attestato del Municipio, la prova dell'assicurazione, gli estratti del casellario giudiziale e delle esecuzioni. E per il gerente, il contratto di lavoro e il diploma.",
      schermo: {
        tipo: "punto",
        titolo: "I documenti",
        testo: "Attestato del Municipio, assicurazione, estratti del casellario e delle esecuzioni, contratto e diploma del gerente.",
        fonte: fontiPercorso.rlear,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Un'ultima cosa: se vendi cibo, devi anche notificare la tua attività al Laboratorio cantonale. È il prossimo passo. E se apri fuori dal Ticino, chiedi al tuo Cantone: le regole cambiano.",
      schermo: {
        tipo: "punto",
        titolo: "E poi?",
        testo: "Se vendi cibo: notifica al Laboratorio cantonale. Fuori dal Ticino: chiedi al tuo Cantone.",
      },
    },
    {
      audio: "scena-13.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.lear, verificatoIl: corso.verificatoIl },
    },
  ],
};
