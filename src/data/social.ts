/**
 * Il piano editoriale dei social di Bleo: un post al giorno, con le schede
 * del carosello (le grafiche le fa video/, vedi social/README.md), la
 * didascalia e le fonti. I testi riprendono i passi del percorso
 * (src/data/passi.ts) e le cifre vengono da src/data/svizzera.ts: niente
 * numeri a memoria. Se cambia un dato, rifai le grafiche (cd video && npm run social).
 *
 * La pubblicazione è automatica (scripts/social/pubblica.ts): un post al
 * giorno, nell'ordine dell'elenco, a partire da INIZIO_PIANO (ora svizzera).
 */
import { FASI, TITOLI_FASI, VERIFICATO_IL, type IdPasso } from "./passi";
import {
  aliquoteIva,
  avsIndipendenti,
  chf,
  datiStrumenti,
  fonti,
  fontiPercorso,
  percentuale,
  pilastro3a,
  regole,
  regolePercorso,
  tasseRegistroCommercio,
  type Fonte,
} from "./svizzera";

/** Le immagini della mascotte in public/mascotte/ usate nelle copertine. */
export const MASCOTTE = ["pensa", "checklist", "festa", "scrivania", "coppia", "bussolina"] as const;
export type Mascotte = (typeof MASCOTTE)[number];

export type SchedaPost =
  /** La prima scheda: occhiello, titolo grande e la mascotte. */
  | { tipo: "copertina"; occhiello: string; titolo: string; mascotte: Mascotte }
  /** Un elenco breve: al massimo 4 punti. */
  | { tipo: "punti"; titolo: string; punti: readonly string[] }
  /** Una cifra grande con la spiegazione sotto. */
  | { tipo: "cifra"; cifra: string; testo: string };

export type PostSocial = {
  id: string;
  /** Giorno di pubblicazione (ISO, ora svizzera): lo calcola il piano da INIZIO_PIANO. */
  data: string;
  /** Il passo del percorso da cui vengono testo e fonti. */
  passoId?: IdPasso;
  /**
   * Le schede del carosello, a partire dalla copertina. L'ultima immagine
   * (fonte e invito alla lista d'attesa) la aggiungono le grafiche.
   */
  schede: readonly SchedaPost[];
  /** Il testo della didascalia; fonte, avviso e invito li aggiunge src/lib/social. */
  testo: string;
  /** La prima è quella mostrata nell'ultima immagine. */
  fonti: readonly Fonte[];
  /** Data ISO dell'ultimo controllo sulle fonti. */
  verificatoIl: string;
  /** Al massimo 2: altri 3 sono comuni a tutti i post. */
  hashtag: readonly string[];
};

/** Avviso in fondo a ogni post: Bleo dà informazioni generali (LFid). */
export const AVVISO =
  "Informazioni generali, non consulenza personalizzata: per il tuo caso rivolgiti a un fiduciario autorizzato.";

/** L'invito dell'ultima immagine e della didascalia. */
export const INVITO = "Bleo ti accompagna dall'idea alla prima fattura. Iscriviti alla lista d'attesa";

/** Hashtag di tutti i post. Instagram ne accetta al massimo 5 per post. */
export const HASHTAG_COMUNI = ["#Ticino", "#DittaIndividuale", "#MettersiInProprio"] as const;

const MESI = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
] as const;

/** «a, b e c» */
function elenco(voci: readonly string[]): string {
  return voci.length < 2 ? voci.join("") : `${voci.slice(0, -1).join(", ")} e ${voci.at(-1)}`;
}

const SOGLIA_RC = chf(regole.sogliaRegistroCommercio.valore);
const SOGLIA_IVA = chf(regole.sogliaIva.valore);
const GIORNI_IVA = regole.termineAnnuncioIvaGiorni.valore;
const SOGLIA_CONTABILITA = chf(regole.sogliaContabilitaSemplificata.valore);
const tasseRc = tasseRegistroCommercio.valore;
const avs2026 = avsIndipendenti[2026].valore;
const avs2027 = avsIndipendenti[2027].valore;
const aliquote = aliquoteIva.valore;
const fondo = regolePercorso.fondounimpresa.valore;
const acconti = regolePercorso.accontiAvs.valore;

/** Il primo giorno del piano: ogni post esce il giorno dopo il precedente. Per spostare tutto basta cambiare questa data. */
export const INIZIO_PIANO = "2026-10-21";

/** Il giorno ISO `giorni` dopo `inizio`. */
function giornoDopo(inizio: string, giorni: number): string {
  const d = new Date(`${inizio}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + giorni);
  return d.toISOString().slice(0, 10);
}

const PIANO: readonly Omit<PostSocial, "data">[] = [
  {
    id: "ciao-sono-bleo",
    schede: [
      { tipo: "copertina", occhiello: "Ciao, sono Bleo", titolo: "Apri un'attività in Ticino? Ti accompagno io", mascotte: "coppia" },
      {
        tipo: "punti",
        titolo: "Cosa faccio",
        punti: [
          "Ti preparo un percorso con i passi nell'ordine giusto",
          "Per ogni passo ti do il link al modulo ufficiale",
          "Rispondo alle tue domande citando sempre la fonte",
          "Ti aiuto a tenere la tua contabilità: ricevute, entrate e uscite in ordine",
        ],
      },
      {
        tipo: "punti",
        titolo: "Cosa non faccio",
        punti: [
          "Non compilo la tua dichiarazione d'imposta",
          "Non tengo la contabilità al posto tuo",
          "Nei casi complessi ti indico un fiduciario autorizzato",
        ],
      },
    ],
    testo:
      "Ciao, sono Bleo! Aiuto chi vuole aprire un'attività in Svizzera italiana, a partire dalla ditta individuale. Ogni giorno qui trovi un passo spiegato in modo semplice, con il link alla fonte ufficiale. Tu che attività vorresti aprire?",
    fonti: [fonti.albofiduciari, fonti.lfid],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#SvizzeraItaliana", "#Startup"],
  },
  {
    id: "cos-e-la-ditta-individuale",
    passoId: "ditta-individuale",
    schede: [
      { tipo: "copertina", occhiello: "Le basi", titolo: "Cos'è una ditta individuale?", mascotte: "pensa" },
      {
        tipo: "punti",
        titolo: "3 cose da sapere",
        punti: ["Nasce quando inizi a lavorare", "Non serve capitale", "Il titolare sei solo tu"],
      },
      {
        tipo: "punti",
        titolo: "Il rovescio della medaglia",
        punti: [
          "Rispondi dei debiti della ditta con tutto il tuo patrimonio personale",
          "Tu e la ditta siete la stessa persona: le imposte le paghi tu, nella tua dichiarazione",
        ],
      },
    ],
    testo:
      "La ditta individuale è la forma più semplice per lavorare in proprio: nasce quando inizi l'attività, non serve capitale e il titolare sei solo tu. In cambio rispondi dei debiti con tutto il tuo patrimonio personale. Salva il post per quando ti servirà.",
    fonti: [fonti.pmiDittaIndividuale, fontiPercorso.pmiImposteDitta],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Indipendente", "#Svizzera"],
  },
  {
    id: "registro-di-commercio",
    passoId: "iscrizione-rc",
    schede: [
      { tipo: "copertina", occhiello: "Registro di commercio", titolo: "Devo iscrivermi al registro di commercio?", mascotte: "pensa" },
      {
        tipo: "cifra",
        cifra: SOGLIA_RC,
        testo: "di cifra d'affari nell'ultimo esercizio: da qui l'iscrizione è obbligatoria.",
      },
      {
        tipo: "punti",
        titolo: "Da ricordare",
        punti: [
          "Conta la cifra d'affari, non l'utile",
          "Sotto la soglia l'iscrizione è facoltativa, ma puoi sempre farla",
          "Puoi iscriverti online e in italiano con EasyGov",
        ],
      },
    ],
    testo: `Il registro di commercio diventa obbligatorio quando la ditta ha realizzato almeno ${SOGLIA_RC} di cifra d'affari nell'ultimo esercizio. Attenzione: conta tutto quello che fatturi, non quello che ti resta in tasca. Sotto la soglia puoi comunque iscriverti, se vuoi.`,
    fonti: [fonti.co931, fontiPercorso.easygovDittaIndividuale],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#RegistroDiCommercio", "#Svizzera"],
  },
  {
    id: "quando-scatta-l-iva",
    passoId: "iscrizione-iva",
    schede: [
      { tipo: "copertina", occhiello: "IVA", titolo: "Quando devo pagare l'IVA?", mascotte: "pensa" },
      {
        tipo: "cifra",
        cifra: SOGLIA_IVA,
        testo: "di cifra d'affari all'anno, in Svizzera e all'estero: da qui sei assoggettato all'IVA.",
      },
      {
        tipo: "punti",
        titolo: "E poi?",
        punti: [
          `Hai ${GIORNI_IVA} giorni per annunciarti all'AFC`,
          `Se all'avvio prevedi di superare la soglia entro ${regolePercorso.mesiPerIvaDaSubito.valore} mesi, sei assoggettato da subito`,
          "Ti annunci online, anche in italiano, oppure con EasyGov",
        ],
      },
    ],
    testo: `L'IVA scatta da ${SOGLIA_IVA} di cifra d'affari all'anno, contando anche quello che fatturi all'estero. Da quel momento hai ${GIORNI_IVA} giorni per annunciarti all'Amministrazione federale delle contribuzioni. Sotto la soglia, niente IVA.`,
    fonti: [fonti.liva10, fonti.liva14, fonti.liva66, fonti.afcIscrizione],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#IVA", "#Svizzera"],
  },
  {
    id: "fattura-senza-iva",
    passoId: "fatture",
    schede: [
      { tipo: "copertina", occhiello: "Fatture", titolo: "Non sei iscritto all'IVA? Niente IVA in fattura", mascotte: "festa" },
      {
        tipo: "punti",
        titolo: "Perché",
        punti: [
          "Se non sei iscritto all'IVA non puoi indicarla in fattura",
          "Se la scrivi lo stesso, la devi comunque all'AFC",
          "Quindi: né aliquota né importo dell'IVA",
        ],
      },
      {
        tipo: "punti",
        titolo: "Per farti pagare",
        punti: [
          "Usa la QR-fattura: ha sostituito le vecchie polizze di versamento",
          "SIX elenca generatori gratuiti, tra cui quello di PostFinance",
        ],
      },
    ],
    testo:
      "Errore classico della prima fattura: aggiungere l'IVA «per sembrare più professionali». Se non sei iscritto all'IVA non puoi indicarla, e se lo fai la devi comunque versare all'AFC. Per farti pagare usa la QR-fattura.",
    fonti: [fonti.liva27, fonti.six],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Fattura", "#IVA"],
  },
  {
    id: "nome-della-ditta",
    passoId: "nome-ditta",
    schede: [
      { tipo: "copertina", occhiello: "Il nome", titolo: "Come posso chiamare la mia ditta?", mascotte: "scrivania" },
      {
        tipo: "punti",
        titolo: "La regola",
        punti: [
          "Il nome deve contenere il tuo cognome, con o senza il nome",
          "Niente parole che fanno pensare a una società",
          "Puoi aggiungere cosa fai: «Caseificio di Rossi G.»",
        ],
      },
      {
        tipo: "punti",
        titolo: "Prima di decidere",
        punti: [
          "Usa il cognome come è scritto sul tuo documento d'identità",
          "Cerca su Zefix se esistono già ditte con un nome simile",
        ],
      },
    ],
    testo:
      "Il nome di una ditta individuale deve contenere il tuo cognome. Puoi aggiungere cosa fai, ma niente parole che facciano pensare a una società. Prima di decidere, cerca su Zefix se c'è già un nome simile. Come chiameresti la tua?",
    fonti: [fonti.co945, fontiPercorso.zefix],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#NomeDitta", "#Svizzera"],
  },
  {
    id: "indipendente-per-l-avs",
    passoId: "riconoscimento-avs",
    schede: [
      { tipo: "copertina", occhiello: "AVS", titolo: "Chi decide se sei indipendente?", mascotte: "checklist" },
      {
        tipo: "punti",
        titolo: "La cassa AVS guarda se",
        punti: [
          "Fatturi a tuo nome",
          "Ti assumi il rischio economico",
          "Organizzi liberamente il lavoro",
          "Lavori per diversi clienti",
        ],
      },
      {
        tipo: "punti",
        titolo: "Come fare",
        punti: [
          "Raccogli le prove: offerte, fatture, contratti, pagamenti ricevuti",
          "Presenta la domanda online su selbststaendig-erwerbend.ch",
          "Fallo nei primissimi mesi di attività",
        ],
      },
    ],
    testo:
      "Non basta dire «sono indipendente»: lo decide la cassa di compensazione AVS. Guarda se fatturi a tuo nome, se ti assumi il rischio economico, se organizzi il lavoro come vuoi e se hai diversi clienti. La domanda si fa online, nei primissimi mesi di attività.",
    fonti: [fonti.avsPromemoria202, fonti.avsDomandaIndipendente],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#AVS", "#Indipendente"],
  },
  {
    id: "contributi-avs",
    passoId: "acconti-avs",
    schede: [
      { tipo: "copertina", occhiello: "AVS", titolo: "Quanto paghi di AVS da indipendente?", mascotte: "pensa" },
      {
        tipo: "cifra",
        cifra: chf(avs2026.contributoMinimo),
        testo: `è il contributo minimo AVS/AI/IPG di un anno nel 2026. Dal 2027 sarà ${chf(avs2027.contributoMinimo)}.`,
      },
      {
        tipo: "punti",
        titolo: "Come funziona",
        punti: [
          `Al massimo paghi il ${percentuale(avs2026.tassoMassimo, 0)} del reddito`,
          "Durante l'anno paghi acconti ogni trimestre, sul reddito che prevedi",
          "I contributi definitivi si calcolano dopo, sulla base della tassazione",
        ],
      },
    ],
    testo: `Da indipendente i contributi AVS/AI/IPG li paghi tu: al massimo il ${percentuale(avs2026.tassoMassimo, 0)} del reddito, al minimo ${chf(avs2026.contributoMinimo)} l'anno nel 2026 e ${chf(avs2027.contributoMinimo)} dal 2027. Durante l'anno paghi acconti, poi la cassa fa il conguaglio.`,
    fonti: [fonti.avsPromemoria202, fonti.ufasImporti2027],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#AVS", "#Indipendente"],
  },
  {
    id: "date-acconti-avs",
    passoId: "acconti-avs",
    schede: [
      { tipo: "copertina", occhiello: "Calendario", titolo: "Le 4 date degli acconti AVS", mascotte: "scrivania" },
      {
        tipo: "punti",
        titolo: "Paga entro il",
        punti: acconti.mesi.map((mese) => `${acconti.giorno} ${MESI[mese - 1]}`),
      },
      {
        tipo: "punti",
        titolo: "Attenzione",
        punti: [
          `Con la cassa ticinese (IAS): se il reddito cambia di più o meno il ${percentuale(regolePercorso.variazioneRedditoIas.valore, 0)}, avvisala`,
          `Acconti sotto il ${percentuale(regolePercorso.sogliaAccontiAvs.valore, 0)} dei contributi definitivi: interessi di mora del ${percentuale(regolePercorso.interesseMoraAvs.valore, 0)} l'anno`,
        ],
      },
    ],
    testo: `Segna in agenda: gli acconti AVS si pagano ogni trimestre, entro ${elenco(acconti.mesi.map((m) => `il ${acconti.giorno} ${MESI[m - 1]}`))}. Se il tuo reddito cambia molto, avvisa la cassa: acconti troppo bassi costano interessi di mora.`,
    fonti: [fonti.avsPromemoria202, fontiPercorso.iasAcconti, fontiPercorso.oavs41bis, fontiPercorso.oavs42],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#AVS", "#Scadenze"],
  },
  {
    id: "soldi-per-le-imposte",
    passoId: "acconti-imposte",
    schede: [
      { tipo: "copertina", occhiello: "Imposte", titolo: "Metti da parte i soldi per le imposte", mascotte: "pensa" },
      {
        tipo: "punti",
        titolo: "Perché",
        punti: [
          "La ditta individuale non paga imposte per conto suo: le paghi tu",
          "In Ticino, alla prima dichiarazione, non ricevi in automatico le richieste di acconto",
          "Rischi di dover pagare tutto insieme dopo la tassazione",
        ],
      },
      {
        tipo: "punti",
        titolo: "Cosa fare",
        punti: [
          "Chiedi all'Ufficio esazione e condoni le polizze per pagamenti volontari",
          "Quanto mettere da parte dipende da reddito e Comune: per una stima, un fiduciario autorizzato",
        ],
      },
    ],
    testo:
      "Il primo anno da indipendente in Ticino non ricevi in automatico le richieste di acconto per le imposte. Così rischi di dover pagare tutto insieme dopo la tassazione. Meglio chiedere subito le polizze per i pagamenti volontari.",
    fonti: [fontiPercorso.pmiImposteDitta, fontiPercorso.dcRichiestaAcconto],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Imposte", "#Indipendente"],
  },
  {
    id: "contabilita-semplice",
    passoId: "contabilita",
    schede: [
      { tipo: "copertina", occhiello: "Contabilità", titolo: "Che contabilità devo tenere?", mascotte: "scrivania" },
      {
        tipo: "cifra",
        cifra: SOGLIA_CONTABILITA,
        testo: "Sotto questa cifra d'affari bastano entrate, uscite e patrimonio.",
      },
      {
        tipo: "punti",
        titolo: "Le regole d'oro",
        punti: [
          "Registra ogni entrata e ogni uscita",
          "Un giustificativo per ogni registrazione: fattura, ricevuta, estratto conto",
          `Conserva libri e documenti per ${regolePercorso.conservazioneDocumentiAnni.valore} anni`,
        ],
      },
    ],
    testo: `Con una cifra d'affari sotto ${SOGLIA_CONTABILITA} la ditta individuale può tenere una contabilità semplice: entrate, uscite e patrimonio. Le regole però valgono lo stesso: tutto registrato, con un documento per ogni registrazione.`,
    fonti: [fonti.co957, fonti.co958f],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Contabilità", "#Indipendente"],
  },
  {
    id: "assicurazione-infortuni",
    passoId: "assicurazione-infortuni",
    schede: [
      { tipo: "copertina", occhiello: "Assicurazioni", titolo: "Da indipendente sei assicurato contro gli infortuni?", mascotte: "pensa" },
      {
        tipo: "punti",
        titolo: "Come stanno le cose",
        punti: [
          "L'assicurazione infortuni (LAINF) non è obbligatoria per gli indipendenti",
          "Puoi assicurarti a titolo facoltativo",
          "Senza, gli infortuni li paga la cassa malati, solo se la copertura infortuni è attiva",
        ],
      },
      {
        tipo: "punti",
        titolo: "Cosa fare oggi",
        punti: ["Chiedi alla tua cassa malati se la copertura infortuni è attiva: da dipendente poteva essere sospesa"],
      },
    ],
    testo:
      "Da dipendente l'assicurazione infortuni te la pagava il datore di lavoro. Da indipendente non è obbligatoria: se non ti assicuri, paga la cassa malati, ma solo se la copertura infortuni è attiva. Una telefonata oggi ti evita brutte sorprese.",
    fonti: [fontiPercorso.lainf4, fontiPercorso.lamal8, fontiPercorso.pmiInfortuni],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Assicurazioni", "#Indipendente"],
  },
  {
    id: "pilastro-3a",
    passoId: "assicurazioni-previdenza",
    schede: [
      { tipo: "copertina", occhiello: "Previdenza", titolo: "Pilastro 3a: quanto puoi dedurre?", mascotte: "checklist" },
      {
        tipo: "cifra",
        cifra: chf(pilastro3a[2026].valore.senzaCassaPensione),
        testo: `al massimo nel 2026 senza cassa pensione, e comunque non più del ${percentuale(datiStrumenti.quotaMassimaPilastro3a.valore, 0)} del reddito da attività lucrativa.`,
      },
      {
        tipo: "punti",
        titolo: "Gli importi massimi",
        punti: [
          `Senza cassa pensione: ${chf(pilastro3a[2026].valore.senzaCassaPensione)} nel 2026, ${chf(pilastro3a[2027].valore.senzaCassaPensione)} nel 2027`,
          `Con cassa pensione: ${chf(pilastro3a[2026].valore.conCassaPensione)} nel 2026, ${chf(pilastro3a[2027].valore.conCassaPensione)} nel 2027`,
        ],
      },
    ],
    testo: `Da indipendente senza cassa pensione puoi dedurre di più nel pilastro 3a: fino al ${percentuale(datiStrumenti.quotaMassimaPilastro3a.valore, 0)} del reddito da attività lucrativa, al massimo ${chf(pilastro3a[2026].valore.senzaCassaPensione)} nel 2026 e ${chf(pilastro3a[2027].valore.senzaCassaPensione)} nel 2027.`,
    fonti: [fonti.opp3, fonti.ufasImporti2026, fonti.ufasImporti2027],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Pilastro3a", "#Previdenza"],
  },
  {
    id: "chi-ti-protegge",
    passoId: "assicurazioni-previdenza",
    schede: [
      { tipo: "copertina", occhiello: "Protezione", titolo: "Malattia, pensione, disoccupazione: chi ti copre?", mascotte: "pensa" },
      {
        tipo: "punti",
        titolo: "Da indipendente",
        punti: [
          "Disoccupazione: non puoi assicurarti, nemmeno volontariamente",
          "Cassa pensione (LPP): non è obbligatoria, puoi aderire facoltativamente",
          "Indennità giornaliera per malattia: facoltativa, tra i 15 e i 65 anni",
        ],
      },
    ],
    testo:
      "Da indipendente non sei assicurato contro la disoccupazione e la cassa pensione non è obbligatoria. Decidi tu come proteggerti: per esempio con un'indennità giornaliera per malattia o aderendo facoltativamente a una cassa pensione.",
    fonti: [fontiPercorso.pmiDisoccupazione, fontiPercorso.lpp4, fontiPercorso.pmiIndennitaGiornaliera],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Assicurazioni", "#Previdenza"],
  },
  {
    id: "serve-un-autorizzazione",
    passoId: "autorizzazioni",
    schede: [
      { tipo: "copertina", occhiello: "Prima di iniziare", titolo: "Ti serve un'autorizzazione?", mascotte: "checklist" },
      {
        tipo: "punti",
        titolo: "Da sapere",
        punti: [
          "Alcune professioni sono regolamentate dalla Confederazione, altre dal Cantone",
          "Non esiste un elenco unico ticinese",
          "Il consiglio ufficiale: informati prima di iniziare",
        ],
      },
      {
        tipo: "punti",
        titolo: "Dove guardare",
        punti: [
          "Le note informative della SEFRI sulle professioni regolamentate",
          "L'elenco delle autorizzazioni della Polizia cantonale",
          "Nel dubbio, chiedi all'ufficio cantonale competente",
        ],
      },
    ],
    testo:
      "Prima di aprire, controlla se la tua professione è regolamentata: alcune lo sono dalla Confederazione, altre dal Cantone, e in Ticino non c'è un elenco unico. Nel dubbio, chiedi all'ufficio cantonale prima di iniziare.",
    fonti: [fontiPercorso.sefriProfessioniRegolamentate, fontiPercorso.poliziaAutorizzazioni, fontiPercorso.pmiMettersiInProprio],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Autorizzazioni", "#Svizzera"],
  },
  {
    id: "alimenti-fatti-in-casa",
    passoId: "notifica-derrate-alimentari",
    schede: [
      { tipo: "copertina", occhiello: "Alimenti", titolo: "Vendi cibo fatto in casa? Notificalo al Cantone", mascotte: "festa" },
      {
        tipo: "punti",
        titolo: "Chi deve notificare",
        punti: [
          "Chi produce, trasforma, conserva, trasporta o vende alimenti",
          "Anche con un catering o con prodotti fatti in casa",
          "Non serve per vendite occasionali e piccole a mercatini e feste",
        ],
      },
      {
        tipo: "punti",
        titolo: "Come",
        punti: [
          "In Ticino si manda il formulario al Laboratorio cantonale",
          "Non arriva una conferma: dopo circa 2 settimane controlli la registrazione sul suo sito",
        ],
      },
    ],
    testo:
      "Torte, conserve, catering: chi vende alimenti, anche fatti in casa, deve notificare la sua attività al Cantone. In Ticino il formulario va al Laboratorio cantonale. Non serve per le piccole vendite occasionali, come mercatini e feste.",
    fonti: [fontiPercorso.oderr20, fontiPercorso.laboratorioCantonaleNotifica],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Alimenti", "#FattoInCasa"],
  },
  {
    id: "permesso-per-lavorare-in-proprio",
    passoId: "permesso-lavoro",
    schede: [
      { tipo: "copertina", occhiello: "Permessi", titolo: "Non hai la cittadinanza svizzera? Controlla il permesso", mascotte: "checklist" },
      {
        tipo: "punti",
        titolo: "Da sapere",
        punti: [
          "Serve un permesso che consenta l'attività indipendente",
          "Frontalieri: per mettersi in proprio chiedono il permesso G",
          "Cittadini UE/AELS: se la domanda è accolta, permesso B valido cinque anni",
          "Prima di iniziare, chiedi conferma all'ufficio della migrazione",
        ],
      },
    ],
    testo:
      "Senza cittadinanza svizzera, per lavorare in proprio serve un permesso che lo consenta. I frontalieri chiedono il permesso G, i cittadini UE/AELS il permesso B per indipendenti. Prima di iniziare, chiedi conferma all'ufficio della migrazione del tuo Cantone.",
    fonti: [fontiPercorso.pmiMettersiInProprio, fontiPercorso.umIndipendentiUeAels],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Frontalieri", "#Permessi"],
  },
  {
    id: "aiuto-gratuito",
    passoId: "aiuto",
    schede: [
      { tipo: "copertina", occhiello: "Aiuto", titolo: "A chi chiedere aiuto, gratis", mascotte: "coppia" },
      {
        tipo: "cifra",
        cifra: `${fondo.oreMassime} ore`,
        testo: `di accompagnamento in ${fondo.anniMassimi} anni con Fondounimpresa, per chi apre una piccola attività in Ticino.`,
      },
      {
        tipo: "punti",
        titolo: "Da sapere",
        punti: [
          "È per cittadini svizzeri o stranieri con permesso B o C residenti in Ticino o nella Regione Moesa",
          "L'accompagnamento è gratuito, i corsi si pagano",
          "Non fa contabilità né dichiarazioni d'imposta",
        ],
      },
    ],
    testo: `Non sei solo: in Ticino Fondounimpresa offre fino a ${fondo.oreMassime} ore di accompagnamento in ${fondo.anniMassimi} anni a chi apre una piccola attività, e l'accompagnamento è gratuito. Per i casi personali, come imposte e contabilità, rivolgiti a un fiduciario autorizzato.`,
    fonti: [fontiPercorso.fondounimpresa, fontiPercorso.fondounimpresaGratuito],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Fondounimpresa", "#Startup"],
  },
  {
    id: "fattura-con-iva",
    passoId: "fatture",
    schede: [
      { tipo: "copertina", occhiello: "Fatture", titolo: "Iscritto all'IVA? Cosa scrivere in fattura", mascotte: "festa" },
      {
        tipo: "punti",
        titolo: "In fattura servono",
        punti: [
          "Il tuo nome e luogo con il numero IVA (CHE-123.456.789 IVA)",
          "Nome e luogo del cliente",
          "Data o periodo della prestazione e cosa hai fatto",
          "Importo, aliquota e importo dell'IVA",
        ],
      },
    ],
    testo:
      "Se sei iscritto all'IVA, la fattura deve contenere alcuni dati precisi: il tuo nome e luogo con il numero IVA, i dati del cliente, la data e cosa hai fatto, l'importo con aliquota e importo dell'IVA. Salva il post e usalo come lista di controllo.",
    fonti: [fontiPercorso.liva26, fontiPercorso.afcIdi],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Fattura", "#IVA"],
  },
  {
    id: "aliquote-iva",
    passoId: "iscrizione-iva",
    schede: [
      { tipo: "copertina", occhiello: "IVA", titolo: "Le aliquote IVA in Svizzera", mascotte: "scrivania" },
      {
        tipo: "punti",
        titolo: "Le aliquote in vigore",
        punti: [
          `Normale: ${percentuale(aliquote.normale)}`,
          `Ridotta: ${percentuale(aliquote.ridotta)}`,
          `Alloggio: ${percentuale(aliquote.alloggio)}`,
        ],
      },
      {
        tipo: "punti",
        titolo: "Il metodo",
        punti: [
          `Entro ${regolePercorso.termineMetodoIvaGiorni.valore} giorni dalla comunicazione del numero IVA puoi chiedere l'aliquota saldo o il rendiconto annuale`,
          "Se non lo chiedi in tempo, applichi il metodo effettivo per almeno tre periodi fiscali",
          "Da valutare con un fiduciario autorizzato",
        ],
      },
    ],
    testo: `In Svizzera l'aliquota IVA normale è ${percentuale(aliquote.normale)}, quella ridotta ${percentuale(aliquote.ridotta)} e quella per l'alloggio ${percentuale(aliquote.alloggio)}. Appena ricevi il numero IVA hai ${regolePercorso.termineMetodoIvaGiorni.valore} giorni per scegliere il metodo: non lasciarli passare.`,
    fonti: [fonti.afcAliquote, fontiPercorso.oiva78, fontiPercorso.oiva76a],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#IVA", "#Svizzera"],
  },
  {
    id: "vendere-online",
    passoId: "sito-online",
    schede: [
      { tipo: "copertina", occhiello: "Vendere online", titolo: "Vendi online? Il tuo sito deve dire chi sei", mascotte: "scrivania" },
      {
        tipo: "punti",
        titolo: "Sul sito servono",
        punti: ["Nome e cognome", "Indirizzo completo", "Indirizzo e-mail"],
      },
      {
        tipo: "punti",
        titolo: "E per gli ordini",
        punti: [
          "Spiega i passi dell'ordine",
          "Permetti di correggere gli errori prima di confermare",
          "Manda subito una conferma elettronica",
        ],
      },
    ],
    testo:
      "Hai un e-shop o vendi servizi online? La legge chiede di indicare in modo chiaro chi sei: nome, indirizzo completo ed e-mail. E durante l'ordine il cliente deve poter correggere gli errori e ricevere subito una conferma.",
    fonti: [fontiPercorso.lcsl3],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Ecommerce", "#VendereOnline"],
  },
  {
    id: "edilizia-e-suva",
    passoId: "statuto-suva",
    schede: [
      { tipo: "copertina", occhiello: "Edilizia e trasporti", titolo: "Chi decide se sei indipendente?", mascotte: "pensa" },
      {
        tipo: "punti",
        titolo: "Come funziona",
        punti: [
          "Presenti la domanda alla cassa AVS, come tutti",
          "La cassa la inoltra alla Suva, che decide d'accordo con la cassa",
          "In subappalto o a cottimo per un'altra impresa? Di regola sei suo dipendente",
        ],
      },
      {
        tipo: "punti",
        titolo: "Prepara le prove",
        punti: ["Più committenti", "Offerte e fatture a tuo nome", "Investimenti e rischio economico a tuo carico"],
      },
    ],
    testo:
      "Imbianchino, muratore, tassista? Nell'edilizia e nei trasporti la domanda di riconoscimento passa dalla cassa AVS alla Suva, che decide se sei indipendente o dipendente. Se lavori solo in subappalto per un'altra impresa, di regola sei suo dipendente.",
    fonti: [fontiPercorso.suvaAccertamento],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Edilizia", "#Indipendente"],
  },
  {
    id: "costo-registro-di-commercio",
    passoId: "iscrizione-rc",
    schede: [
      { tipo: "copertina", occhiello: "Costi", titolo: "Quanto costa iscriversi al registro di commercio?", mascotte: "checklist" },
      {
        tipo: "cifra",
        cifra: chf(tasseRc.stimaTitolareConFirma),
        testo: "di tasse federali per un titolare con firma individuale.",
      },
      {
        tipo: "punti",
        titolo: "Il conto",
        punti: [
          `${chf(tasseRc.primaIscrizioneDittaIndividuale)} per la prima iscrizione`,
          `${chf(tasseRc.perFunzione)} per la funzione`,
          `${chf(tasseRc.perDirittoDiFirma)} per il diritto di firma`,
          `Più l'autenticazione della firma: in Ticino ${chf(regolePercorso.autenticazioneFirmaRcTicino.valore)} allo sportello dell'Ufficio RC`,
        ],
      },
    ],
    testo: `Iscrivere una ditta individuale al registro di commercio costa ${chf(tasseRc.stimaTitolareConFirma)} di tasse federali per un titolare con firma individuale, più l'autenticazione della firma. In Ticino allo sportello dell'Ufficio RC costa ${chf(regolePercorso.autenticazioneFirmaRcTicino.valore)}.`,
    fonti: [fonti.oemolRc, fontiPercorso.rcTicinoTasseCantonali],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#RegistroDiCommercio", "#Costi"],
  },
  {
    id: "partire-con-un-socio",
    passoId: "soci-forma-giuridica",
    schede: [
      { tipo: "copertina", occhiello: "Forme giuridiche", titolo: "Parti con un socio? La ditta individuale non basta", mascotte: "coppia" },
      {
        tipo: "punti",
        titolo: "La Sagl, in breve",
        punti: [
          "Una ditta individuale ha un solo titolare",
          "Con dei soci, una forma possibile è la Sagl",
          `Serve un capitale di almeno ${chf(regole.capitaleMinimoSagl.valore)}, versato per intero`,
          "Servono un atto pubblico dal notaio e l'iscrizione nel registro di commercio",
        ],
      },
    ],
    testo: `Se partite in due o più, la ditta individuale non va bene: ha un solo titolare. Una forma possibile è la Sagl, con un capitale di almeno ${chf(regole.capitaleMinimoSagl.valore)} da versare per intero e l'atto pubblico dal notaio. Per il vostro caso, chiedete a un fiduciario autorizzato.`,
    fonti: [fonti.co773, fontiPercorso.co777c, fonti.pmiChecklist],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Sagl", "#Soci"],
  },
  {
    id: "reddito-nella-dichiarazione",
    passoId: "dichiarazione-imposte",
    schede: [
      { tipo: "copertina", occhiello: "Imposte", titolo: "Dove va il reddito della ditta nella dichiarazione?", mascotte: "scrivania" },
      {
        tipo: "punti",
        titolo: "Nella tua dichiarazione",
        punti: [
          "Alla cifra 2: «Reddito da attività indipendente»",
          "Se l'attività è accessoria, alla cifra 2.2",
          "Una perdita si indica con il segno meno",
        ],
      },
      {
        tipo: "punti",
        titolo: "Senza contabilità commerciale",
        punti: [
          "Compila il Modulo 10, il questionario per indipendenti senza contabilità",
          "Allega le distinte firmate: attivi e passivi, entrate e uscite, apporti e prelevamenti privati",
          "Puoi inviare tutto online con eTax PF",
        ],
      },
    ],
    testo:
      "La ditta individuale non ha una dichiarazione sua: il reddito va nella tua dichiarazione personale, alla cifra 2. Senza contabilità commerciale compili il Modulo 10. Bleo non compila dichiarazioni: per farti aiutare, un fiduciario autorizzato.",
    fonti: [fontiPercorso.istruzioniPf2025, fontiPercorso.modulo10, fontiPercorso.dcEtax],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Imposte", "#Dichiarazione"],
  },
  {
    id: "soglie-di-fine-anno",
    passoId: "soglie-annuali",
    schede: [
      { tipo: "copertina", occhiello: "Ogni anno", titolo: "A fine anno controlla 3 soglie", mascotte: "checklist" },
      {
        tipo: "punti",
        titolo: "Le soglie",
        punti: [
          `${SOGLIA_RC}: registro di commercio obbligatorio`,
          `${SOGLIA_IVA}: IVA, e hai ${GIORNI_IVA} giorni per annunciarti`,
          `${SOGLIA_CONTABILITA}: serve la contabilità completa`,
        ],
      },
      {
        tipo: "punti",
        titolo: "Come contare",
        punti: ["Somma tutto quello che hai fatturato nell'anno", "In Svizzera e all'estero, senza IVA"],
      },
    ],
    testo: `Tre numeri da controllare ogni fine anno: ${SOGLIA_RC} per il registro di commercio, ${SOGLIA_IVA} per l'IVA, ${SOGLIA_CONTABILITA} per la contabilità completa. Conta la cifra d'affari: tutto quello che hai fatturato, senza IVA.`,
    fonti: [fonti.co931, fonti.liva10, fonti.liva66, fonti.co957],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Soglie", "#IVA"],
  },
  {
    id: "attivita-accessoria",
    passoId: "riconoscimento-avs",
    schede: [
      { tipo: "copertina", occhiello: "Attività accessoria", titolo: "Lavori in proprio accanto al tuo impiego?", mascotte: "scrivania" },
      {
        tipo: "cifra",
        cifra: chf(regolePercorso.attivitaAccessoriaAvs.valore),
        testo: "di reddito all'anno da attività indipendente accessoria: fino a qui i contributi AVS/AI/IPG si pagano solo se li chiedi tu.",
      },
      {
        tipo: "punti",
        titolo: "Da sapere",
        punti: [
          "Vale per l'attività indipendente accessoria",
          "Sopra questo importo i contributi si pagano",
          "Chiedi alla tua cassa AVS come vale per il tuo caso",
        ],
      },
    ],
    testo: `Hai un lavoro da dipendente e qualche cliente tuo la sera? Se il reddito dell'attività indipendente accessoria non supera ${chf(regolePercorso.attivitaAccessoriaAvs.valore)} all'anno, i contributi AVS/AI/IPG si pagano solo se li chiedi tu.`,
    fonti: [fonti.avsPromemoria202],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#AVS", "#SecondoLavoro"],
  },
  {
    id: "il-percorso-di-bleo",
    schede: [
      { tipo: "copertina", occhiello: "Il percorso", titolo: "Dall'idea alla prima fattura, in 4 fasi", mascotte: "festa" },
      { tipo: "punti", titolo: "Le fasi", punti: FASI.map((fase) => TITOLI_FASI[fase]) },
      {
        tipo: "punti",
        titolo: "Per ogni passo",
        punti: [
          "Cosa fare, in parole semplici",
          "Il link al modulo o alla pagina ufficiale",
          "Le fonti, con la data dell'ultimo controllo",
        ],
      },
    ],
    testo:
      "In queste settimane abbiamo visto i passi uno per uno. Bleo li mette in fila per te, in 4 fasi: prima di iniziare, aprire l'attività, i primi mesi e ogni anno. Per ogni passo trovi il link al modulo ufficiale.",
    fonti: [fontiPercorso.pmiMettersiInProprio],
    verificatoIl: VERIFICATO_IL,
    hashtag: ["#Startup", "#SvizzeraItaliana"],
  },
];

export const POST_SOCIAL: readonly PostSocial[] = PIANO.map((post, i) => ({ ...post, data: giornoDopo(INIZIO_PIANO, i) }));

/** Il post di un giorno (data ISO), se c'è. */
export function postDelGiorno(data: string): PostSocial | undefined {
  return POST_SOCIAL.find((p) => p.data === data);
}

/** Nomi delle immagini di un post in social/<id>/: una per scheda più quella finale (fonte e invito). */
export function immaginiPost(post: PostSocial): string[] {
  return Array.from({ length: post.schede.length + 1 }, (_, i) => `${String(i + 1).padStart(2, "0")}.jpg`);
}
