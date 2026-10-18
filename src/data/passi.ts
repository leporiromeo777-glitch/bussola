/**
 * Catalogo dei passi del percorso "dalla idea alla ditta individuale aperta".
 * Ogni passo ha il link al modulo o alla pagina ufficiale e le fonti; cifre e
 * scadenze vengono da src/data/svizzera.ts. Quali passi valgono per chi, e
 * perché, lo decide src/lib/percorso/regole.ts.
 *
 * Tempi stimati: indicazioni di Bleo per orientarsi, non dati ufficiali.
 */
import {
  aliquoteIva,
  avsIndipendenti,
  chf,
  fonti,
  fontiPercorso,
  percentuale,
  pilastro3a,
  regole,
  regoleAlimenti,
  regoleEserciziPubblici,
  regolePercorso,
  regoleSanita,
  tasseRegistroCommercio,
  ufficioSanitaTicino,
  ufficiPercorso,
  VERIFICATO_ALIMENTI,
  VERIFICATO_ESERCIZI_PUBBLICI,
  VERIFICATO_SANITA,
  type Fonte,
} from "./svizzera";

export const FASI = ["prima di iniziare", "aprire l'attività", "primi mesi", "ogni anno"] as const;
export type Fase = (typeof FASI)[number];

export const TITOLI_FASI: Record<Fase, string> = {
  "prima di iniziare": "Prima di iniziare",
  "aprire l'attività": "Aprire l'attività",
  "primi mesi": "I primi mesi",
  "ogni anno": "Ogni anno",
};

export type Passo = {
  id: string;
  titolo: string;
  fase: Fase;
  descrizione: string;
  cosaFare: readonly string[];
  /** Il modulo o la pagina ufficiale da cui partire. */
  link: { etichetta: string; url: string };
  fonti: readonly Fonte[];
  /** Data ISO dell'ultimo controllo dei contenuti del passo sulle fonti. */
  verificatoIl: string;
  tempoStimato?: string;
  /** Solo costi con fonte ufficiale. */
  costoNoto?: { testo: string; fonte: Fonte };
  /** Domanda precompilata per "Chiedi a Bleo". */
  domandaChat: string;
};

/** Data dell'ultimo controllo dei testi del percorso (passi, avvisi, scadenze) sulle fonti. */
export const VERIFICATO_IL = "2026-10-15";

const SOGLIA_100K = chf(regole.sogliaRegistroCommercio.valore);
const SOGLIA_IVA = chf(regole.sogliaIva.valore);
const tasseRc = tasseRegistroCommercio.valore;
const avs2026 = avsIndipendenti[2026].valore;
const avs2027 = avsIndipendenti[2027].valore;
const fondo = regolePercorso.fondounimpresa.valore;
const esazione = ufficiPercorso.esazioneCondoniTicino.valore;
const fondounimpresa = ufficiPercorso.fondounimpresa.valore;
const laboratorio = ufficiPercorso.laboratorioCantonaleTicino.valore;
const ep = regoleEserciziPubblici;
const sanita = regoleSanita;
const ufficioSanita = ufficioSanitaTicino.valore;

export const PASSI = [
  // -------------------------------------------------------------------------
  // Prima di iniziare
  // -------------------------------------------------------------------------
  {
    id: "ditta-individuale",
    fase: "prima di iniziare",
    titolo: "Capisci cos'è una ditta individuale",
    descrizione:
      "È la forma più semplice per lavorare in proprio: nasce quando inizi l'attività, non serve capitale e il titolare è una sola persona. In cambio rispondi dei debiti con tutto il tuo patrimonio personale.",
    cosaFare: [
      "Ricorda le tre cose che contano: la ditta nasce quando inizi a lavorare, non serve capitale e il titolare sei solo tu.",
      "Rispondi dei debiti della ditta con tutto il tuo patrimonio personale: se ti preoccupa, chiedi a un fiduciario se ti conviene un'altra forma.",
      "Tu e la ditta siete la stessa persona: le imposte sul reddito della ditta le paghi tu, nella tua dichiarazione personale.",
    ],
    link: { etichetta: "Scheda del Portale PMI", url: fonti.pmiDittaIndividuale.url },
    fonti: [
      fonti.pmiDittaIndividuale,
      fontiPercorso.pmiImposteDitta,
      // Le altre forme, a confronto nella lezione 1 del corso.
      fontiPercorso.pmiScegliereForma,
      fontiPercorso.pmiNomeCollettivo,
      fontiPercorso.pmiSagl,
      fontiPercorso.pmiSa,
    ],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "2 minuti",
    domandaChat: "Cos'è una ditta individuale e cosa rischio con il mio patrimonio personale?",
  },
  {
    id: "soci-forma-giuridica",
    fase: "prima di iniziare",
    titolo: "Con dei soci: scegli la forma giusta",
    descrizione: `Una ditta individuale ha un solo titolare. Se partite in più persone, una forma possibile è la Sagl: serve un capitale di almeno ${chf(regole.capitaleMinimoSagl.valore)}, da versare per intero, un atto pubblico dal notaio e l'iscrizione nel registro di commercio. Il percorso per la Sagl arriverà in Bleo più avanti.`,
    cosaFare: [
      "Seguite la check list ufficiale del Portale PMI per creare una Sagl.",
      "Con lo strumento «Fondare una Sagl» di Bleo preparate i dati e scaricate in PDF la scheda per il notaio e una bozza dello statuto.",
      "Chiedete un preventivo a un notaio e, per il vostro caso, a un fiduciario autorizzato (trovi l'elenco nell'albo online del Cantone).",
      "Sappiate che nella Sagl i soci che lavorano nella società sono considerati dipendenti per le assicurazioni sociali.",
    ],
    link: { etichetta: "Check list del Portale PMI", url: fonti.pmiChecklist.url },
    fonti: [
      fonti.co773,
      fontiPercorso.co777c,
      fontiPercorso.co777,
      fonti.pmiChecklist,
      fontiPercorso.pmiAssicurazioniSociali,
      fonti.albofiduciari,
      // Le alternative con dei soci, nella lezione 2 del corso.
      fontiPercorso.pmiNomeCollettivo,
      fontiPercorso.pmiSa,
      fonti.co621,
      fonti.co632,
      fontiPercorso.pmiSagl,
      // Statuto e atto di fondazione, nei video facoltativi della lezione 2.
      fontiPercorso.statutoTipoSagl,
      fontiPercorso.co776,
      fontiPercorso.co809,
      fontiPercorso.co774,
      fontiPercorso.co777a,
      fontiPercorso.co777b,
      fontiPercorso.co778,
      fontiPercorso.co779,
    ],
    verificatoIl: VERIFICATO_IL,
    domandaChat: "Cosa serve per aprire una Sagl con un socio?",
  },
  {
    id: "autorizzazioni",
    fase: "prima di iniziare",
    titolo: "Controlla se ti serve un'autorizzazione",
    descrizione:
      "Alcune professioni sono regolamentate dalla Confederazione, altre dal Cantone. Non esiste un elenco unico ticinese: il consiglio ufficiale è informarsi prima di iniziare.",
    cosaFare: [
      "Cerca la tua professione nelle note informative della SEFRI sulle professioni regolamentate.",
      "In Ticino guarda l'elenco delle autorizzazioni rilasciate dalla Polizia cantonale (per esempio esercizi pubblici e commercio ambulante).",
      "Nel dubbio, chiedi all'ufficio cantonale competente prima di iniziare.",
    ],
    link: { etichetta: "Portale PMI: mettersi in proprio", url: fontiPercorso.pmiMettersiInProprio.url },
    fonti: [
      fontiPercorso.pmiMettersiInProprio,
      fontiPercorso.sefriProfessioniRegolamentate,
      fontiPercorso.poliziaAutorizzazioni,
    ],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "15-30 minuti",
    domandaChat: "Mi occupo di … (scrivi qui la tua attività). Mi serve un'autorizzazione per iniziare?",
  },
  {
    id: "autorizzazione-esercizio-pubblico",
    fase: "prima di iniziare",
    titolo: "Ristorante o bar: chiedi l'autorizzazione prima di aprire",
    descrizione: `In Ticino un esercizio pubblico (per esempio un ristorante, un bar o un albergo) può essere aperto e gestito soltanto dopo aver ottenuto l'autorizzazione (LEAR, art. 5). Di regola serve anche un gerente con il diploma cantonale di esercente oppure, senza un certificato riconosciuto, con almeno tre anni di pratica come esercente in un altro Cantone (LEAR, art. 9); il regolamento prevede eccezioni. Se apri da solo, come persona fisica, il gerente puoi essere tu (LEAR, art. 4).`,
    cosaFare: [
      "Non aprire il locale prima di avere l'autorizzazione: senza, non puoi né aprirlo né gestirlo (LEAR, art. 5).",
      `Chiedi al Municipio l'attestazione che i locali sono idonei e stipula un'assicurazione di responsabilità civile di almeno ${chf(ep.rcMinimaFranchi.valore)} per sinistro (LEAR, art. 9; RLEAR, art. 32).`,
      `Decidi chi farà da gerente: per il diploma cantonale di esercente servono un esame e ${ep.praticaDiplomaMesi.valore} mesi di pratica (RLEAR, art. 38).`,
      `Presenta la domanda con la procedura della Polizia cantonale almeno ${ep.termineDomandaGiorni.valore} giorni prima di aprire (RLEAR, art. 26).`,
    ],
    link: { etichetta: "Polizia cantonale: autorizzazione per esercizi pubblici", url: fontiPercorso.poliziaEserciziPubbliciPersona.url },
    fonti: [
      fontiPercorso.lear,
      fontiPercorso.rlear,
      fontiPercorso.poliziaEserciziPubbliciPersona,
      fontiPercorso.poliziaEserciziPubbliciSocieta,
      fontiPercorso.diplomaEsercente,
      fontiPercorso.diplomaEsercenteCorso,
      fontiPercorso.poliziaAutorizzazioni,
    ],
    verificatoIl: VERIFICATO_ESERCIZI_PUBBLICI,
    costoNoto: {
      testo: `Tassa di autorizzazione: da ${chf(ep.tassaAutorizzazioneFranchi.valore.min)} a ${chf(ep.tassaAutorizzazioneFranchi.valore.max)}`,
      fonte: fontiPercorso.rlear,
    },
    domandaChat: "Cosa serve in Ticino per aprire un bar o un ristorante?",
  },
  {
    id: "notifica-derrate-alimentari",
    fase: "prima di iniziare",
    titolo: "Alimenti: notifica la tua attività al Cantone",
    descrizione:
      "Chi produce, trasforma, conserva, trasporta o vende alimenti, anche con un catering o con prodotti fatti in casa, deve notificare la sua attività all'autorità cantonale (ODerr, art. 20). Non serve per le vendite occasionali e piccole a mercatini, feste scolastiche e simili. Per gli alimenti di origine animale può servire anche un'autorizzazione (ODerr, art. 21).",
    cosaFare: [
      `In Ticino compila il formulario per la notifica di attività alimentari e invialo, completo, al ${laboratorio.nome}: ${laboratorio.indirizzo}, ${laboratorio.email}, tel. ${laboratorio.telefono}.`,
      `Il Laboratorio non manda una conferma: circa ${regoleAlimenti.verificaRegistrazioneSettimane.valore} settimane dopo l'invio puoi controllare la registrazione sul suo sito.`,
      "Nel formulario indica la persona responsabile della sicurezza degli alimenti: se non ne indichi una, il responsabile è chi dirige l'azienda (ODerr, art. 73).",
      "Organizza il controllo autonomo, adatto al rischio e a quanto produci: alimenti sicuri, rintracciabili e ritirati se c'è un problema (ODerr, art. 74).",
      "Se lavori alimenti di origine animale (per esempio carne, latte o uova), chiedi al Laboratorio se ti serve anche un'autorizzazione: la legge prevede diverse eccezioni.",
      "Più avanti notifica anche i cambiamenti importanti nell'attività e la chiusura.",
    ],
    link: { etichetta: "Laboratorio cantonale: notifica", url: fontiPercorso.laboratorioCantonaleNotifica.url },
    fonti: [
      fontiPercorso.oderr20,
      fontiPercorso.oderr21,
      fontiPercorso.oderr73,
      fontiPercorso.oderr74,
      fontiPercorso.laboratorioCantonaleNotifica,
      fontiPercorso.laboratorioEssenziale,
      fontiPercorso.laboratorioControlloAutonomo,
      fontiPercorso.laboratorioEtichettatura,
      fontiPercorso.formularioNotificaDerrate,
      fontiPercorso.grNotificaDerrate,
    ],
    verificatoIl: VERIFICATO_ALIMENTI,
    tempoStimato: "30 minuti per il formulario",
    domandaChat: "Vendo prodotti alimentari fatti in casa: devo notificare la mia attività?",
  },
  {
    id: "autorizzazione-sanitaria",
    fase: "prima di iniziare",
    titolo: "Attività sanitaria: verifica l'autorizzazione",
    descrizione:
      "In Ticino ogni attività sanitaria svolta sotto la propria responsabilità professionale ha bisogno dell'autorizzazione di libero esercizio dell'Ufficio di sanità (LSan, artt. 53-56). La legge elenca le professioni: per esempio medico, fisioterapista, infermiere, osteopata, psicologo, podologo, massaggiatore medicale ed estetista (art. 54). Per l'Ufficio di sanità il massaggio classico o rilassante non è un trattamento sanitario.",
    cosaFare: [
      "Cerca la tua professione sulla pagina dell'Ufficio di sanità: trovi i documenti da presentare. Nel dubbio, chiedi all'ufficio prima di iniziare.",
      "Se sei estetista, l'autorizzazione serve solo per alcuni trattamenti: per esempio trucco permanente, microblading, microneedling, epilazione elettrica e drenaggio linfatico a fini estetici.",
      "Terapie complementari: alcuni metodi (per esempio shiatsu, riflessoterapia, omeopatia) sono riservati a chi ha il diploma federale; per gli altri serve l'autorizzazione di terapista complementare cantonale, con un esame (LSan, art. 63).",
      `Paga prima la tassa online e spedisci i documenti su carta all'${ufficioSanita.nome}, ${ufficioSanita.indirizzo}. Il casellario giudiziale e il certificato medico non devono avere più di ${sanita.validitaDocumentiMesi.valore} mesi.`,
      "L'autorizzazione non basta per fatturare alla cassa malati: per l'assicurazione di base serve un'altra autorizzazione del Cantone (LAMal, art. 36), e solo alcune professioni possono averla.",
      "Se sei già autorizzato in un altro Cantone, annunciati all'Ufficio di sanità: in Ticino l'autorizzazione è gratuita, ma puoi iniziare solo dopo il nulla osta.",
    ],
    link: { etichetta: "Procedure dell'Ufficio di sanità", url: fontiPercorso.sanitaLiberoEsercizio.url },
    fonti: [
      fontiPercorso.sanitaLiberoEsercizio,
      fontiPercorso.sanitaDocumenti,
      fontiPercorso.lsan,
      fontiPercorso.tasseSanita,
      fontiPercorso.regolamentoEstetista,
      fontiPercorso.sanitaFaqTerapisti,
      fontiPercorso.sefriTerapieComplementari,
      fontiPercorso.sanitaAoms,
      fontiPercorso.lamal36,
      fontiPercorso.sanitaAltroCantone,
    ],
    verificatoIl: VERIFICATO_SANITA,
    costoNoto: {
      testo: `Tassa di autorizzazione: da ${chf(sanita.tassaAltreProfessioniFranchi.valore.min)} a ${chf(sanita.tassaAltreProfessioniFranchi.valore.max)}; per le professioni con formazione accademica da ${chf(sanita.tassaProfessioniAccademicheFranchi.valore.min)} a ${chf(sanita.tassaProfessioniAccademicheFranchi.valore.max)}`,
      fonte: fontiPercorso.tasseSanita,
    },
    domandaChat: "La mia attività nel benessere ha bisogno di un'autorizzazione sanitaria?",
  },
  {
    id: "permesso-lavoro",
    fase: "prima di iniziare",
    titolo: "Verifica il permesso per lavorare in proprio",
    descrizione:
      "Chi non ha la cittadinanza svizzera deve avere un permesso che consenta l'attività indipendente. I frontalieri che vogliono mettersi in proprio chiedono il permesso G; i cittadini UE/AELS, se la domanda è accolta, ricevono un permesso B valido cinque anni.",
    cosaFare: [
      "Se sei frontaliere, per lavorare in proprio ti serve il permesso G; se sei cittadino UE/AELS, chiedi il permesso B per indipendenti (se la domanda è accolta vale cinque anni).",
      "In Ticino prepara la domanda seguendo le indicazioni dell'Ufficio della migrazione per gli indipendenti UE/AELS.",
      "Prima di iniziare, chiedi conferma all'ufficio della migrazione del tuo Cantone.",
    ],
    link: { etichetta: "Portale PMI: mettersi in proprio", url: fontiPercorso.pmiMettersiInProprio.url },
    fonti: [fontiPercorso.pmiMettersiInProprio, fontiPercorso.umIndipendentiUeAels],
    verificatoIl: VERIFICATO_IL,
    domandaChat: "Con il mio permesso posso lavorare come indipendente in Ticino?",
  },
  {
    id: "nome-ditta",
    fase: "prima di iniziare",
    titolo: "Scegli il nome della ditta, con il tuo cognome",
    descrizione:
      "Il nome di una ditta individuale deve contenere il tuo cognome, con o senza il nome. Non puoi aggiungere parole che facciano pensare a una società (art. 945 CO). Puoi aggiungere cosa fai, per esempio «Caseificio di Rossi G.» (esempio dell'Ufficio RC ticinese).",
    cosaFare: [
      "Usa il cognome esattamente come è scritto sul tuo documento d'identità.",
      "Cerca su Zefix se esistono già ditte con un nome simile al tuo.",
      "Se non ti iscrivi al registro di commercio, nel registro IDI la ditta appare con il tuo nome e cognome; un nome di fantasia compare solo come «nome supplementare».",
    ],
    link: { etichetta: "Cerca il nome su Zefix", url: fontiPercorso.zefix.url },
    fonti: [fonti.co945, fonti.rcTicinoIscrizione, fonti.pmiDittaIndividuale, fontiPercorso.zefix, fontiPercorso.co950],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "30 minuti",
    domandaChat: "Come posso chiamare la mia ditta individuale?",
  },
  {
    id: "aiuto",
    fase: "prima di iniziare",
    titolo: "Sappi a chi chiedere aiuto",
    descrizione: `In Ticino Fondounimpresa offre un accompagnamento di al massimo ${fondo.oreMassime} ore in ${fondo.anniMassimi} anni a chi apre una piccola attività, e corsi su business plan, contabilità e marketing. Per i casi personali (imposte, contabilità) la persona giusta è un fiduciario autorizzato.`,
    cosaFare: [
      `Fondounimpresa (${fondounimpresa.luogo}): tel. ${fondounimpresa.telefono}, ${fondounimpresa.email}. È per cittadini svizzeri o stranieri con permesso B o C residenti in Ticino o nella Regione Moesa. Non fa contabilità né dichiarazioni d'imposta. L'accompagnamento è un servizio pubblico gratuito; i corsi si pagano.`,
      "Per l'AVS c'è un'agenzia in ogni Comune ticinese: dà informazioni e aiuta a determinare il reddito degli indipendenti.",
      "Per il tuo caso personale cerca un fiduciario autorizzato nell'albo online del Cantone.",
    ],
    link: { etichetta: "Fondounimpresa", url: fontiPercorso.fondounimpresa.url },
    fonti: [
      fontiPercorso.fondounimpresa,
      fontiPercorso.fondounimpresaGratuito,
      fontiPercorso.fondounimpresaBreve,
      fontiPercorso.portaleImpresaServizi,
      fontiPercorso.dlAvsTicino,
      fonti.albofiduciari,
    ],
    verificatoIl: VERIFICATO_IL,
    domandaChat: "Chi mi può aiutare gratuitamente ad aprire la mia attività in Ticino?",
  },

  // -------------------------------------------------------------------------
  // Aprire l'attività
  // -------------------------------------------------------------------------
  {
    id: "statuto-suva",
    fase: "aprire l'attività",
    titolo: "Edilizia o trasporti: la Suva verifica il tuo statuto",
    descrizione:
      "Anche nell'edilizia e nei trasporti (per esempio imbianchini, muratori, tassisti) la domanda di riconoscimento si presenta alla cassa AVS. La cassa la inoltra alla Suva, che decide d'accordo con la cassa se sei indipendente, dipendente o entrambe le cose.",
    cosaFare: [
      "Presenta la domanda alla cassa AVS come tutti (passo seguente): non serve un passaggio separato alla Suva.",
      "Se lavori in subappalto o a cottimo per un'altra impresa, di regola sei considerato dipendente di quell'impresa.",
      "Prepara le prove della tua indipendenza: più committenti, offerte e fatture a tuo nome, investimenti, rischio economico a tuo carico.",
    ],
    link: { etichetta: "Suva: indipendente o dipendente?", url: fontiPercorso.suvaAccertamento.url },
    fonti: [fontiPercorso.suvaAccertamento, fonti.avsPromemoria202],
    verificatoIl: VERIFICATO_IL,
    domandaChat: "Lavoro nell'edilizia: chi decide se sono indipendente?",
  },
  {
    id: "riconoscimento-avs",
    fase: "aprire l'attività",
    titolo: "Fatti riconoscere come indipendente dalla cassa AVS",
    descrizione:
      "È la cassa di compensazione AVS a decidere se sei indipendente. Guarda se fatturi a tuo nome, se ti assumi il rischio economico, se organizzi liberamente il lavoro e se lavori per diversi clienti. La domanda si fa online e va presentata nei primissimi mesi di attività.",
    cosaFare: [
      "Raccogli le prove: offerte e fatture ai clienti, contratti, prove dei pagamenti ricevuti, pubblicità, eventuali investimenti o contratti d'affitto.",
      "Presenta la domanda online su selbststaendig-erwerbend.ch: il sito la inoltra alla tua cassa.",
      "Se sei membro di un'associazione professionale che ha una propria cassa, devi affiliarti a quella; altrimenti alla cassa cantonale.",
      "La cassa stabilisce poi gli acconti da pagare sul reddito che prevedi.",
    ],
    link: { etichetta: "Presenta la domanda online", url: fonti.avsDomandaIndipendente.url },
    fonti: [
      fonti.avsPromemoria202,
      fonti.avsDomandaIndipendente,
      fontiPercorso.iasAffiliazione,
      fonti.avsCasseCantonali,
      fontiPercorso.lavs64,
      fontiPercorso.pmiMettersiInProprio,
    ],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "1 ora, più i documenti da raccogliere",
    domandaChat: "Come mi faccio riconoscere come indipendente dalla cassa AVS?",
  },
  {
    id: "assicurazione-infortuni",
    fase: "aprire l'attività",
    titolo: "Controlla di essere assicurato contro gli infortuni",
    descrizione:
      "Da indipendente l'assicurazione infortuni (LAINF) non è obbligatoria: puoi assicurarti a titolo facoltativo. Senza assicurazione infortuni, gli infortuni li paga la cassa malati, ma solo se la copertura infortuni è attiva.",
    cosaFare: [
      "Chiedi alla tua cassa malati se la copertura infortuni è attiva: da dipendente poteva essere sospesa.",
      "Valuta un'assicurazione infortuni facoltativa: nei settori della Suva c'è l'assicurazione per imprenditori, negli altri settori offrono coperture assicuratori privati e casse malati.",
    ],
    link: { etichetta: "Portale PMI: assicurazione infortuni", url: fontiPercorso.pmiInfortuni.url },
    fonti: [
      fontiPercorso.lainf4,
      fontiPercorso.lamal1a,
      fontiPercorso.lamal8,
      fonti.avsPromemoria202,
      fontiPercorso.suvaImprenditori,
      fontiPercorso.pmiInfortuni,
    ],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "Una telefonata alla cassa malati",
    domandaChat: "Da indipendente sono assicurato contro gli infortuni?",
  },
  {
    id: "iscrizione-rc",
    fase: "aprire l'attività",
    titolo: "Decidi se iscriverti al registro di commercio",
    descrizione: `L'iscrizione è obbligatoria quando la ditta ha realizzato almeno ${SOGLIA_100K} di cifra d'affari nell'ultimo esercizio: conta la cifra d'affari, non l'utile. Sotto la soglia è facoltativa, ma hai sempre il diritto di iscriverti.`,
    cosaFare: [
      "Puoi iscriverti online e in italiano con EasyGov. In Ticino c'è anche il formulario dell'Ufficio del registro di commercio, da firmare e spedire per posta con una copia del documento d'identità.",
      `Tasse federali per un titolare con firma individuale: ${chf(tasseRc.primaIscrizioneDittaIndividuale)} per la prima iscrizione, più ${chf(tasseRc.perFunzione)} per la funzione e ${chf(tasseRc.perDirittoDiFirma)} per il diritto di firma.`,
      `La firma sulla notificazione va autenticata: in Ticino ${chf(regolePercorso.autenticazioneFirmaRcTicino.valore)} allo sportello dell'Ufficio RC, oppure da un notaio o dal segretario comunale.`,
      "Se ti iscrivi, nelle fatture usa il nome della ditta esattamente come è iscritto.",
    ],
    link: { etichetta: "Iscriviti con EasyGov", url: fontiPercorso.easygovDittaIndividuale.url },
    fonti: [
      fonti.co931,
      fonti.oemolRc,
      fonti.rcTicinoIscrizione,
      fontiPercorso.rcTicinoTasseCantonali,
      fontiPercorso.easygovDittaIndividuale,
      fontiPercorso.zefixUffici,
      fontiPercorso.co954a,
    ],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "1 ora, più l'autenticazione della firma",
    costoNoto: {
      testo: `${chf(tasseRc.stimaTitolareConFirma)} di tasse federali (${chf(tasseRc.primaIscrizioneDittaIndividuale)} + ${chf(tasseRc.perFunzione)} + ${chf(tasseRc.perDirittoDiFirma)}), più l'autenticazione della firma`,
      fonte: fonti.oemolRc,
    },
    domandaChat: "Devo iscrivere la mia ditta individuale al registro di commercio?",
  },
  {
    id: "iscrizione-iva",
    fase: "aprire l'attività",
    titolo: "Annunciati all'IVA entro 30 giorni",
    descrizione: `Chi realizza almeno ${SOGLIA_IVA} all'anno di cifra d'affari, in Svizzera e all'estero, è assoggettato all'IVA. Se all'avvio è presumibile superare la soglia entro ${regolePercorso.mesiPerIvaDaSubito.valore} mesi, sei assoggettato da subito. Ti devi annunciare all'AFC entro ${regole.termineAnnuncioIvaGiorni.valore} giorni dall'inizio dell'assoggettamento.`,
    cosaFare: [
      "Annunciati online all'AFC (anche in italiano) oppure tramite EasyGov.",
      "Tieni pronti il tuo numero AVS e la cifra d'affari prevista per il primo esercizio.",
      `Entro ${regolePercorso.termineMetodoIvaGiorni.valore} giorni dalla comunicazione del numero IVA puoi chiedere il metodo dell'aliquota saldo o il rendiconto annuale: se non lo chiedi in tempo, applichi il metodo effettivo per almeno tre periodi fiscali. Da valutare con un fiduciario.`,
      `Aliquote in vigore: normale ${percentuale(aliquoteIva.valore.normale)}, ridotta ${percentuale(aliquoteIva.valore.ridotta)}, alloggio ${percentuale(aliquoteIva.valore.alloggio)}.`,
    ],
    link: { etichetta: "Iscrizione all'IVA (AFC)", url: fonti.afcIscrizione.url },
    fonti: [
      fonti.liva10,
      fonti.liva14,
      fonti.liva66,
      fonti.afcAssoggettamento,
      fonti.afcIscrizione,
      fontiPercorso.oiva78,
      fontiPercorso.oiva76a,
      fonti.afcAliquote,
    ],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "1 ora",
    domandaChat: "Come e quando devo annunciarmi all'IVA?",
  },
  {
    id: "sito-online",
    fase: "aprire l'attività",
    titolo: "Se vendi online, metti i tuoi dati sul sito",
    descrizione:
      "Chi offre merci, opere o servizi online deve indicare in modo chiaro e completo la sua identità e il suo indirizzo di contatto, compreso l'indirizzo e-mail (LCSl, art. 3 cpv. 1 lett. s). Valgono anche regole sulle fasi dell'ordine, sulla correzione degli errori e sulla conferma immediata dell'ordine.",
    cosaFare: [
      "Metti sul sito nome e cognome, indirizzo completo ed e-mail.",
      "Spiega i passi dell'ordine e permetti di correggere gli errori prima di confermare.",
      "Manda subito una conferma elettronica dell'ordine.",
    ],
    link: { etichetta: "LCSl, art. 3", url: fontiPercorso.lcsl3.url },
    fonti: [fontiPercorso.lcsl3],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "1 ora",
    domandaChat: "Cosa devo scrivere sul mio sito se vendo online?",
  },
  {
    id: "locali-pubblico",
    fase: "aprire l'attività",
    titolo: "Locale aperto al pubblico: verifica le regole",
    descrizione:
      "Per un locale aperto al pubblico possono servire procedure specifiche. Per ristoranti e bar serve l'autorizzazione prevista dalla LEAR. Per i negozi, la legge ticinese sull'apertura dei negozi prevede un'autorizzazione solo per le deroghe agli orari.",
    cosaFare: [
      "Controlla l'elenco delle autorizzazioni della Polizia cantonale.",
      "Chiedi al tuo Comune se ci sono procedure per il tuo locale.",
    ],
    link: { etichetta: "Autorizzazioni della Polizia cantonale", url: fontiPercorso.poliziaAutorizzazioni.url },
    fonti: [fontiPercorso.lear, fontiPercorso.lan, fontiPercorso.poliziaAutorizzazioni],
    verificatoIl: VERIFICATO_IL,
    domandaChat: "Che autorizzazioni servono per aprire un negozio in Ticino?",
  },

  // -------------------------------------------------------------------------
  // Primi mesi
  // -------------------------------------------------------------------------
  {
    id: "fatture",
    fase: "primi mesi",
    titolo: "Prepara fatture corrette",
    descrizione:
      "Se non sei iscritto all'IVA non puoi indicare l'IVA in fattura: se lo fai, la devi comunque all'AFC (art. 27 LIVA). Per farti pagare si usa la QR-fattura, che dal 01.10.2022 ha sostituito le vecchie polizze di versamento.",
    cosaFare: [
      "Non iscritto all'IVA: niente IVA in fattura, né aliquota né importo.",
      "Iscritto all'IVA: in fattura servono il tuo nome e luogo con il numero IVA (formato CHE-123.456.789 IVA), nome e luogo del cliente, la data o il periodo della prestazione, cosa hai fatto, l'importo, l'aliquota e l'importo dell'IVA.",
      "Iscritto al registro di commercio: usa il nome della ditta completo, esattamente come è iscritto.",
      "Per la QR-fattura SIX elenca generatori gratuiti, tra cui quello di PostFinance. Dal 22.11.2025 l'indirizzo va scritto in forma strutturata.",
    ],
    link: { etichetta: "QR-fattura (SIX)", url: fonti.six.url },
    fonti: [fonti.liva27, fontiPercorso.liva26, fontiPercorso.afcIdi, fontiPercorso.co954a, fonti.six],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "30 minuti per il modello",
    domandaChat: "Cosa deve esserci nella mia prima fattura?",
  },
  {
    id: "contabilita",
    fase: "primi mesi",
    titolo: "Tieni la contabilità: entrate, uscite e patrimonio",
    descrizione: `Con una cifra d'affari sotto ${chf(regole.sogliaContabilitaSemplificata.valore)} la ditta individuale può tenere solo la contabilità delle entrate e delle uscite e quella del patrimonio. Valgono comunque i principi di una contabilità regolare: tutto registrato, un documento per ogni registrazione.`,
    cosaFare: [
      "Registra ogni entrata e ogni uscita con il suo giustificativo (fattura, ricevuta, estratto conto).",
      "A fine anno prepara gli elenchi di attivi e passivi, di entrate e uscite e dei prelevamenti e apporti privati: servono per la dichiarazione d'imposta.",
      `Conserva libri e documenti per ${regolePercorso.conservazioneDocumentiAnni.valore} anni dalla fine dell'esercizio, su carta o in digitale.`,
      "Bleo non tiene la contabilità per te: se vuoi farla fare, rivolgiti a un fiduciario autorizzato.",
    ],
    link: { etichetta: "Codice delle obbligazioni, art. 957", url: fonti.co957.url },
    fonti: [fonti.co957, fonti.co958f, fontiPercorso.lifd125, fonti.albofiduciari],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "Poco ogni settimana",
    domandaChat: "Che contabilità devo tenere con una ditta individuale?",
  },
  {
    id: "acconti-avs",
    fase: "primi mesi",
    titolo: "Paga gli acconti AVS ogni trimestre",
    descrizione: `Durante l'anno paghi acconti calcolati dalla cassa sul reddito che prevedi, entro il 10 gennaio, il 10 aprile, il 10 luglio e il 10 ottobre. I contributi definitivi si calcolano dopo, sulla base della tassazione fiscale: la cassa ti rimborsa o ti manda il conguaglio da pagare entro ${regolePercorso.termineConguaglioAvsGiorni.valore} giorni.`,
    cosaFare: [
      `Se il reddito cambia molto, avvisa la cassa: per l'IAS conta una variazione di più o meno il ${percentuale(regolePercorso.variazioneRedditoIas.valore, 0)}.`,
      `Se gli acconti restano sotto il ${percentuale(regolePercorso.sogliaAccontiAvs.valore, 0)} dei contributi definitivi, paghi interessi di mora del ${percentuale(regolePercorso.interesseMoraAvs.valore, 0)} l'anno.`,
      `Contributi AVS/AI/IPG degli indipendenti: al massimo il ${percentuale(avs2026.tassoMassimo, 0)} del reddito, al minimo ${chf(avs2026.contributoMinimo)} l'anno nel 2026 e ${chf(avs2027.contributoMinimo)} dal 2027.`,
    ],
    link: { etichetta: "Promemoria AVS 2.02", url: fonti.avsPromemoria202.url },
    fonti: [
      fonti.avsPromemoria202,
      fontiPercorso.iasAcconti,
      fontiPercorso.oavs41bis,
      fontiPercorso.oavs42,
      fonti.ufasImporti2027,
      fonti.iasAf2026,
      fonti.lafTicino73,
    ],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "10 minuti a trimestre",
    domandaChat: "Come funzionano gli acconti AVS da indipendente?",
  },
  {
    id: "acconti-imposte",
    fase: "primi mesi",
    titolo: "Metti da parte i soldi per le imposte",
    descrizione:
      "La ditta individuale non paga imposte per conto suo: le paghi tu, sul tuo reddito. In Ticino chi compila la dichiarazione per la prima volta non riceve automaticamente le richieste di acconto, e rischia di dover pagare tutto in 30 giorni dopo la tassazione.",
    cosaFare: [
      "Chiedi all'Ufficio esazione e condoni le polizze per pagamenti volontari, indicando il reddito e la sostanza che prevedi.",
      `${esazione.nome}, ${esazione.indirizzo}, tel. ${esazione.telefono}, ${esazione.email}.`,
      "Quanto mettere da parte dipende dal tuo reddito e dal tuo Comune: Bleo non calcola le tue imposte. Per una stima personale rivolgiti a un fiduciario autorizzato.",
    ],
    link: {
      etichetta: "Richiesta d'acconto (Divisione delle contribuzioni)",
      url: fontiPercorso.dcRichiestaAcconto.url,
    },
    fonti: [
      fontiPercorso.pmiImposteDitta,
      fontiPercorso.istruzioniPf2025,
      fontiPercorso.dcRichiestaAcconto,
      fonti.albofiduciari,
    ],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "Una e-mail o una telefonata",
    domandaChat: "Come pago le imposte il primo anno da indipendente in Ticino?",
  },
  {
    id: "assicurazioni-previdenza",
    fase: "primi mesi",
    titolo: "Pensa a malattia, pensione e disoccupazione",
    descrizione:
      "Da indipendente non sei assicurato contro la disoccupazione e la cassa pensione (LPP) non è obbligatoria. Decidi tu come proteggerti.",
    cosaFare: [
      "Indennità giornaliera per malattia: è facoltativa, si può stipulare tra i 15 e i 65 anni, anche con un assicuratore diverso dalla tua cassa malati.",
      "Cassa pensione (LPP): puoi assicurarti facoltativamente, presso l'istituto della tua professione oppure l'istituto collettore.",
      `Pilastro 3a senza cassa pensione: puoi dedurre fino al 20% del reddito da attività lucrativa, al massimo ${chf(pilastro3a[2026].valore.senzaCassaPensione)} nel 2026 e ${chf(pilastro3a[2027].valore.senzaCassaPensione)} nel 2027. Con cassa pensione al massimo ${chf(pilastro3a[2026].valore.conCassaPensione)} nel 2026 e ${chf(pilastro3a[2027].valore.conCassaPensione)} nel 2027.`,
      "Disoccupazione: da indipendente non puoi assicurarti, nemmeno volontariamente.",
    ],
    link: { etichetta: "Portale PMI: indennità giornaliera", url: fontiPercorso.pmiIndennitaGiornaliera.url },
    fonti: [
      fonti.avsPromemoria202,
      fontiPercorso.lamal67,
      fontiPercorso.pmiIndennitaGiornaliera,
      fontiPercorso.lpp4,
      fonti.opp3,
      fonti.ufasImporti2026,
      fonti.ufasImporti2027,
      fontiPercorso.pmiDisoccupazione,
    ],
    verificatoIl: VERIFICATO_IL,
    domandaChat: "Da indipendente come mi assicuro per malattia e pensione?",
  },

  // -------------------------------------------------------------------------
  // Ogni anno
  // -------------------------------------------------------------------------
  {
    id: "dichiarazione-imposte",
    fase: "ogni anno",
    titolo: "Dichiara il reddito della ditta",
    descrizione:
      "Il reddito della ditta va nella tua dichiarazione d'imposta personale, alla cifra 2 («Reddito da attività indipendente»); se l'attività è accessoria, alla cifra 2.2. Una perdita si indica con il segno meno.",
    cosaFare: [
      "Senza contabilità commerciale: compila il Modulo 10 «Questionario per indipendenti senza contabilità» e allega le distinte firmate di attivi e passivi, entrate e uscite, apporti e prelevamenti privati.",
      "Con la contabilità commerciale: allega i conti annuali firmati (bilancio e conto economico).",
      "Consegna la dichiarazione entro il termine scritto a pagina 1. Va consegnata anche se non hai ricevuto il modulo. Puoi inviarla online con eTax PF.",
      "Bleo non compila dichiarazioni: per farti aiutare rivolgiti a un fiduciario autorizzato.",
    ],
    link: { etichetta: "Moduli della dichiarazione (Ticino)", url: fontiPercorso.dcModuliPf.url },
    fonti: [
      fontiPercorso.istruzioniPf2025,
      fontiPercorso.modulo10,
      fontiPercorso.dcModuliPf,
      fontiPercorso.leggeTributariaTicino,
      fontiPercorso.dcEtax,
      fonti.albofiduciari,
    ],
    verificatoIl: VERIFICATO_IL,
    domandaChat: "Come dichiaro il reddito della mia ditta individuale?",
  },
  {
    id: "soglie-annuali",
    fase: "ogni anno",
    titolo: "A fine anno controlla le soglie",
    descrizione: `Con almeno ${SOGLIA_100K} di cifra d'affari nell'ultimo esercizio l'iscrizione al registro di commercio diventa obbligatoria. Per l'IVA, se non eri assoggettato dall'inizio, lo diventi alla fine dell'esercizio in cui hai raggiunto ${SOGLIA_IVA}, e hai ${regole.termineAnnuncioIvaGiorni.valore} giorni per annunciarti. Da ${chf(regole.sogliaContabilitaSemplificata.valore)} serve la contabilità completa.`,
    cosaFare: [
      "Somma la cifra d'affari dell'anno: tutto quello che hai fatturato, in Svizzera e all'estero, senza IVA.",
      "Se hai raggiunto una soglia, segui i passi su registro di commercio e IVA.",
    ],
    link: { etichetta: "Assoggettamento all'IVA (AFC)", url: fonti.afcAssoggettamento.url },
    fonti: [fonti.co931, fonti.liva10, fonti.liva14, fonti.liva66, fonti.co957],
    verificatoIl: VERIFICATO_IL,
    tempoStimato: "15 minuti",
    domandaChat: "Quando devo iscrivermi all'IVA e al registro di commercio?",
  },
] as const satisfies readonly Passo[];

export type IdPasso = (typeof PASSI)[number]["id"];

export const ID_PASSI = PASSI.map((p) => p.id) as readonly IdPasso[];

export function trovaPasso(id: string): Passo | undefined {
  return PASSI.find((p) => p.id === id);
}

export function eIdPasso(id: unknown): id is IdPasso {
  return typeof id === "string" && (ID_PASSI as readonly string[]).includes(id);
}
