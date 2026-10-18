/**
 * Lezione 22: «Come dichiarare il reddito della ditta». Fonti, ricontrollate
 * il 18.10.2026 (VERIFICATO_DICHIARAZIONE in src/data/svizzera.ts):
 * - Divisione delle contribuzioni, pagine «Moduli 2025» e «Istruzioni 2025»
 *   (fontiPercorso.dcModuliPf): sono ancora le ultime, i file 2026 non ci
 *   sono; il Modulo 1 non si scarica, serve l'originale;
 * - Istruzioni per la dichiarazione d'imposta 2025 delle persone fisiche
 *   (fontiPercorso.istruzioniPf2025): cifra 2 «Reddito da attività
 *   indipendente», 2.2 se l'attività è accessoria; l'utile netto, dopo le
 *   spese aziendali necessarie, senza imposte né spese private (pag. 15);
 *   la perdita con il segno «-» (meno); le perdite dei sette esercizi
 *   precedenti non ancora compensate (regoleDichiarazione.
 *   perditeEserciziPrecedenti, art. 30 LT, art. 31 LIFD); conti annuali
 *   firmati, o senza contabilità commerciale le distinte firmate degli
 *   attivi e passivi, delle entrate e uscite, degli apporti e prelevamenti
 *   privati (pag. 14); termine a pagina 1, per la dichiarazione 2025 il
 *   30.04.2026 (regolePercorso.termineDichiarazioneTicino2025), proroga
 *   online per giustificati motivi; moduli mancanti all'Ufficio
 *   circondariale di tassazione (ufficiPercorso.tassazioneTicino, pagg. 2 e
 *   5); eTax con numero di registro e password della pagina 1, invio
 *   elettronico una sola volta (pagg. 8-9);
 * - Modulo 1 2025, traduzione tedesca («Hilfsblatt») sulla stessa pagina dei
 *   moduli: cifra 2.1 attività principale, 2.2 attività accessoria;
 * - Modulo 10 2025 (fontiPercorso.modulo10): per chi non tiene una
 *   contabilità commerciale; dalla cifra d'affari (pagamenti dei clienti)
 *   si tolgono merci e materiali e le spese generali, e il reddito
 *   dell'attività indipendente va riportato alla cifra 2; luogo, data e
 *   firma;
 * - LT, art. 198 cpv. 1 (fontiPercorso.leggeTributariaTicino; uguale l'art.
 *   124 LIFD): la dichiarazione va presentata anche da chi non ha ricevuto
 *   né una comunicazione personale né un modulo; art. 199 cpv. 2: gli
 *   allegati (come l'art. 125 LIFD, spiegato nella lezione 18);
 * - eTax PF 2025 (fontiPercorso.dcEtax) e volantino 2025: invio elettronico
 *   di tutti i moduli e giustificativi, senza spedire niente per posta;
 * - albo dei fiduciari autorizzati (fonti.albofiduciari); LFid, vedi la
 *   lezione 18.
 * Lo strumento «I tuoi conti» è in src/app/conti: la parte «Scarica per il
 * fiduciario» scarica un file (CSV) con le voci dell'anno, senza quelle
 * private (src/lib/conti/csv.ts). Gli acconti delle imposte sono nella
 * lezione del passo acconti-imposte: qui solo un rimando, senza numero.
 */
import { lezionePerPasso } from "../../../src/data/corso";
import { dataSvizzera, fonti, fontiPercorso, regoleDichiarazione, regolePercorso, ufficiPercorso } from "../../../src/data/svizzera";
import { titoloProssimoPasso } from "./prossimo-passo";
import type { Lezione } from "./tipi";

const corso = lezionePerPasso("dichiarazione-imposte");
if (!corso) throw new Error("Manca la lezione dichiarazione-imposte in src/data/corso.ts");

// La voce dice le cifre in parole: se un dato cambia, va cambiata e rifatta anche la voce.
if (regoleDichiarazione.perditeEserciziPrecedenti.valore !== 7 || regolePercorso.termineDichiarazioneTicino2025.valore !== "2026-04-30") {
  throw new Error(
    "Le perdite riportabili o il termine della dichiarazione sono cambiati: aggiorna `voce` delle scene 4 e 7 e rifalle (npm run voce -- dichiarazione-imposte 4 7).",
  );
}

const ESERCIZI = regoleDichiarazione.perditeEserciziPrecedenti.valore;
const TERMINE = dataSvizzera(regolePercorso.termineDichiarazioneTicino2025.valore);
const UFFICIO = ufficiPercorso.tassazioneTicino.valore.nome;

export const dichiarazioneImposte: Lezione = {
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
        "Ciao, sono Bleo! Con una ditta individuale, il reddito va ogni anno nella tua dichiarazione d'imposta. Ti spiego come si fa in Ticino. In un altro Cantone valgono i moduli e i termini del tuo Cantone.",
      schermo: { tipo: "titolo", etichetta: `Il corso di Bleo · Lezione ${corso.numero}`, titolo: corso.titolo },
    },
    {
      audio: "scena-2.mp3",
      disegno: "dich-cifra",
      stile: "lavagna",
      testo:
        "Nella dichiarazione, il reddito della ditta va alla cifra 2: «Reddito da attività indipendente». Se la ditta è la tua attività principale, lo scrivi alla cifra 2.1. Se è accessoria, per esempio accanto a un lavoro da dipendente, alla cifra 2.2.",
      voce: "Nella dichiarazione, il reddito della ditta va alla cifra due: «Reddito da attività indipendente». Se la ditta è la tua attività principale, lo scrivi alla cifra due punto uno. Se è accessoria, per esempio accanto a un lavoro da dipendente, alla cifra due punto due.",
      schermo: {
        tipo: "punto",
        titolo: "Alla cifra 2",
        testo: "Reddito da attività indipendente: 2.1 se è la tua attività principale, 2.2 se è accessoria.",
        fonte: fontiPercorso.istruzioniPf2025,
      },
    },
    {
      audio: "scena-3.mp3",
      disegno: "dich-utile",
      stile: "lavagna",
      testo:
        "Quale reddito? L'utile netto: quello che hai incassato, meno le spese che ti sono servite per guadagnarlo. Le spese private e le imposte sul reddito, invece, non le puoi togliere.",
      schermo: {
        tipo: "punto",
        titolo: "L'utile netto",
        testo: "Gli incassi meno le spese della ditta. Spese private e imposte sul reddito non si tolgono.",
        fonte: fontiPercorso.istruzioniPf2025,
      },
    },
    {
      audio: "scena-4.mp3",
      disegno: "dich-perdita",
      stile: "lavagna",
      testo: `E se un anno chiudi in perdita, per esempio il primo? Scrivi l'importo con il segno meno davanti. E le perdite dei ${ESERCIZI} esercizi precedenti, se non le hai ancora compensate, le puoi dedurre dal reddito.`,
      voce: "E se un anno chiudi in perdita, per esempio il primo? Scrivi l'importo con il segno meno davanti. E le perdite dei sette esercizi precedenti, se non le hai ancora compensate, le puoi dedurre dal reddito.",
      schermo: {
        tipo: "punto",
        titolo: "Una perdita",
        testo: `Con il segno meno. Le perdite dei ${ESERCIZI} esercizi precedenti non ancora compensate si possono dedurre.`,
        fonte: fontiPercorso.istruzioniPf2025,
      },
    },
    {
      audio: "scena-5.mp3",
      disegno: "dich-modulo10",
      stile: "lavagna",
      testo:
        "Ricordi la lezione sulla contabilità? Se tieni solo quella semplificata, senza contabilità commerciale, compili il Modulo 10: il «Questionario per indipendenti senza contabilità». Parti dai pagamenti dei clienti, togli merci e spese generali, e trovi il reddito da riportare alla cifra 2.",
      voce: "Ricordi la lezione sulla contabilità? Se tieni solo quella semplificata, senza contabilità commerciale, compili il modulo dieci: il «Questionario per indipendenti senza contabilità». Parti dai pagamenti dei clienti, togli merci e spese generali, e trovi il reddito da riportare alla cifra due.",
      schermo: {
        tipo: "punto",
        titolo: "Il Modulo 10",
        testo: "Senza contabilità commerciale: dai pagamenti dei clienti togli merci e spese, e riporti il reddito alla cifra 2.",
        fonte: fontiPercorso.modulo10,
      },
    },
    {
      audio: "scena-6.mp3",
      disegno: "dich-allegati",
      stile: "lavagna",
      testo:
        "Il questionario lo firmi e lo alleghi alla dichiarazione, con le distinte firmate dell'anno: attivi e passivi, entrate e uscite, apporti e prelevamenti privati. Se invece tieni la contabilità commerciale, alleghi i conti annuali firmati: il bilancio e il conto economico.",
      schermo: {
        tipo: "punto",
        titolo: "Cosa alleghi",
        testo: "Il questionario e le distinte firmate; con la contabilità commerciale, i conti annuali firmati.",
        fonte: fontiPercorso.istruzioniPf2025,
      },
    },
    {
      audio: "scena-7.mp3",
      disegno: "dich-termine",
      stile: "lavagna",
      testo: `Il termine per consegnarla è scritto a pagina 1 del modulo. Per la dichiarazione 2025 era il ${TERMINE}. Se per motivi giustificati non ce la fai, puoi chiedere una proroga online.`,
      voce: "Il termine per consegnarla è scritto a pagina uno del modulo. Per la dichiarazione duemilaventicinque era il trenta aprile duemilaventisei. Se per motivi giustificati non ce la fai, puoi chiedere una proroga online.",
      schermo: {
        tipo: "punto",
        titolo: "Il termine",
        testo: `Scritto a pagina 1. Per la dichiarazione 2025: ${TERMINE}. Proroga online solo per motivi giustificati.`,
        fonte: fontiPercorso.istruzioniPf2025,
      },
    },
    {
      audio: "scena-8.mp3",
      disegno: "dich-senza-modulo",
      stile: "lavagna",
      testo: `Attenzione: la dichiarazione va consegnata anche se il modulo non ti è arrivato. In quel caso chiedilo al tuo ${UFFICIO}.`,
      schermo: {
        tipo: "attenzione",
        titolo: "Anche senza modulo",
        testo: `Va consegnata lo stesso: chiedi il modulo al tuo ${UFFICIO}.`,
      },
    },
    {
      audio: "scena-9.mp3",
      disegno: "dich-etax",
      stile: "lavagna",
      testo:
        "Puoi compilarla al computer con il programma eTax del Cantone e inviarla online, con tutti gli allegati: niente da spedire per posta. Ti servono il numero di registro e la password scritti a pagina 1. Controlla bene prima: l'invio online si fa una sola volta.",
      voce: "Puoi compilarla al computer con il programma i-tax del Cantone e inviarla online, con tutti gli allegati: niente da spedire per posta. Ti servono il numero di registro e la password scritti a pagina uno. Controlla bene prima: l'invio online si fa una sola volta.",
      schermo: {
        tipo: "punto",
        titolo: "Online con eTax PF",
        testo: "Con il numero di registro e la password della pagina 1. L'invio online si fa una sola volta.",
        fonte: fontiPercorso.dcEtax,
      },
    },
    {
      audio: "scena-10.mp3",
      disegno: "dich-strumento",
      stile: "lavagna",
      testo:
        "Bleo ha uno strumento, «I tuoi conti». A fine anno, nella parte «Scarica per il fiduciario», scarichi un file con le entrate e le uscite della ditta: le voci private non ci sono. Lo puoi dare al fiduciario che ti aiuta.",
      schermo: {
        tipo: "punto",
        titolo: "Lo strumento di Bleo",
        testo: "«I tuoi conti»: con «Scarica per il fiduciario» hai il file con le voci della ditta dell'anno.",
      },
    },
    {
      audio: "scena-11.mp3",
      disegno: "fiduciario",
      stile: "presentatore",
      testo:
        "Bleo non compila dichiarazioni per te. Per farti aiutare scegli un fiduciario autorizzato: in Ticino c'è l'albo ufficiale. Gli acconti delle imposte li abbiamo visti in un'altra lezione. Per le domande generali, chiedi a Bleo in chat.",
      schermo: {
        tipo: "punto",
        titolo: "Con un fiduciario",
        testo: "Bleo non compila dichiarazioni: per un aiuto personale, un fiduciario autorizzato.",
        fonte: fonti.albofiduciari,
      },
    },
    {
      audio: "scena-12.mp3",
      disegno: "fonte",
      stile: "presentatore",
      testo: "Le fonti ufficiali le trovi qui sotto. Ci vediamo al prossimo passo!",
      schermo: { tipo: "fonte", fonte: fontiPercorso.istruzioniPf2025, verificatoIl: corso.verificatoIl },
    },
  ],
};
