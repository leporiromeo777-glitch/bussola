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
  dataSvizzera,
  datiStrumenti,
  fonti,
  fontiPercorso,
  percentuale,
  pilastro3a,
  regole,
  regoleAccontiAvs,
  regoleAlimenti,
  regoleEserciziPubblici,
  regoleFatture,
  regoleInfortuni,
  regoleIva,
  regoleLocali,
  regolePercorso,
  regoleRegistro,
  regoleSanita,
  regoleSoglie,
  regolePermessi,
  regoleSuva,
  tasseRegistroCommercio,
  ufficioSanitaTicino,
  ufficiPercorso,
  VERIFICATO_ALIMENTI,
  VERIFICATO_ESERCIZI_PUBBLICI,
  VERIFICATO_SANITA,
  VERIFICATO_PERMESSI,
  VERIFICATO_NOME_DITTA,
  VERIFICATO_SUVA,
  VERIFICATO_INFORTUNI,
  VERIFICATO_AVS_INDIPENDENTI,
  VERIFICATO_AIUTO,
  VERIFICATO_REGISTRO,
  VERIFICATO_SITO_ONLINE,
  VERIFICATO_IVA,
  VERIFICATO_FATTURE,
  VERIFICATO_LOCALI,
  VERIFICATO_CONTABILITA,
  VERIFICATO_ACCONTI_AVS,
  VERIFICATO_SOGLIE,
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
/** «un periodo fiscale», «3 periodi fiscali». */
const periodiFiscali = (n: number) => (n === 1 ? "un periodo fiscale" : `${n} periodi fiscali`);
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
const perm = regolePermessi;
const migrazione = ufficiPercorso.migrazioneTicino.valore;
const suva = regoleSuva;
const inf = regoleInfortuni;
const reg = regoleRegistro;
const loc = regoleLocali;
const orari = loc.orariNegozi.valore;
const aavs = regoleAccontiAvs;
/** L'esempio dell'anno incompleto: metà anno con metà soglia, riportata su un anno intero (art. 9 cpv. 3 OIVA). */
const MESI_META_ANNO = regoleSoglie.mesiAnnoIntero.valore / 2;
const META_SOGLIA_IVA = regole.sogliaIva.valore / 2;

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
    descrizione: `Con la cittadinanza svizzera o il permesso C puoi lavorare in proprio in tutta la Svizzera (LStrI, art. 38). Altrimenti ti serve un permesso che consenta l'attività indipendente: i cittadini UE/AELS che vivono in Svizzera chiedono il permesso B, i frontalieri il permesso G. Se la domanda è accolta valgono ${perm.durataPermessoIndipendentiAnni.valore} anni, ma già con la domanda devi dimostrare che la tua attività indipendente è vera e ti permette di vivere. Per i cittadini di altri Stati le condizioni sono più severe (LStrI, art. 19).`,
    cosaFare: [
      `Se sei cittadino UE/AELS e vivi in Svizzera, chiedi il permesso B per l'attività indipendente; se abiti all'estero e lavori qui da frontaliere, il permesso G (e torni a casa ${perm.rientroFrontalieri.valore}). Con un permesso B UE/AELS da dipendente puoi passare all'attività indipendente, ma prima avvisa l'Ufficio della migrazione; con un permesso L serve un nuovo permesso B.`,
      "Prepara le prove della tua attività. L'elenco ufficiale dei Grigioni chiede tra l'altro un business plan, le prove che l'attività ti fa vivere (per esempio commesse ed estratti della contabilità), il contratto d'affitto del locale, l'assicurazione malattia e infortuni e la decisione dell'istituto delle assicurazioni sociali (la cassa AVS).",
      `In Ticino invia la domanda all'${migrazione.nome} (${migrazione.sezione}) con la procedura online, prima di iniziare l'attività: tel. ${migrazione.telefono}, ${migrazione.email}. Nei Grigioni la domanda passa dal controllo abitanti del Comune dove abiti (da frontaliere, di quello dove ha sede la ditta); dall'estero va all'Ufficio della migrazione e del diritto civile.`,
      `Dopo, comunica all'Ufficio della migrazione i cambiamenti (per esempio di indirizzo) entro ${perm.notificaCambiamentiGiorni.valore} giorni e chiedi il rinnovo almeno ${perm.rinnovoPrimaDellaScadenzaGiorni.valore} giorni prima della scadenza.`,
      "Se vieni da uno Stato fuori da UE/AELS e non hai il permesso C, chiedi prima all'ufficio della migrazione del tuo Cantone e fatti aiutare da un professionista.",
    ],
    link: { etichetta: "Portale PMI: mettersi in proprio", url: fontiPercorso.pmiMettersiInProprio.url },
    fonti: [
      fontiPercorso.pmiMettersiInProprio,
      fontiPercorso.lstri38,
      fontiPercorso.semSoggiornoAttivita,
      fontiPercorso.umIndipendentiUeAelsB,
      fontiPercorso.semFrontalieri,
      fontiPercorso.umIndipendentiUeAels,
      fontiPercorso.semFaqLiberaCircolazione,
      fontiPercorso.umModificaPermessoB,
      fontiPercorso.semIstruzioniOlcp,
      fontiPercorso.grPromemoriaIndipendenti,
      fontiPercorso.grIndipendentiUeAels,
      fontiPercorso.umRichiestaPermessoB,
      fontiPercorso.umRichiestaPermessoG,
      fontiPercorso.lstri19,
    ],
    verificatoIl: VERIFICATO_PERMESSI,
    domandaChat: "Con il mio permesso posso lavorare come indipendente in Ticino?",
  },
  {
    id: "nome-ditta",
    fase: "prima di iniziare",
    titolo: "Scegli il nome della ditta, con il tuo cognome",
    descrizione:
      "Il nome di una ditta individuale deve contenere il tuo cognome, con o senza il nome. Non puoi aggiungere parole che facciano pensare a una società (art. 945 CO). Puoi aggiungere cosa fai o un nome di fantasia, se è vero e non trae in inganno (art. 944 CO): per esempio «Caseificio di Rossi G.» (esempio dell'Ufficio RC ticinese).",
    cosaFare: [
      "Usa il cognome esattamente come è scritto sul tuo documento d'identità.",
      "Cerca su Zefix se esistono già ditte con un nome uguale o simile al tuo. Nello stesso luogo nessuno può usare una ditta già iscritta da un altro (art. 946 CO); l'Ufficio del registro di commercio controlla solo i nomi uguali, ma chi ha già un nome simile può contestare il tuo davanti al giudice.",
      "Se vuoi usare il nome anche come marchio o per un sito, cercalo anche fra i marchi su Swissreg e fra i nomi di dominio su SWITCH: la ditta non è protetta in automatico come marchio.",
      "Se non ti iscrivi al registro di commercio, nel registro IDI la ditta appare con il tuo nome e cognome; un nome di fantasia compare solo come «nome supplementare».",
    ],
    link: { etichetta: "Cerca il nome su Zefix", url: fontiPercorso.zefix.url },
    fonti: [
      fonti.co945,
      fontiPercorso.co944,
      fontiPercorso.co946,
      fonti.rcTicinoIscrizione,
      fonti.pmiDittaIndividuale,
      fontiPercorso.zefix,
      fontiPercorso.pmiIscrizioneNome,
      fontiPercorso.regixFaq,
      fontiPercorso.direttivaDitteUfrc,
      fontiPercorso.ipiFaqMarchi,
      fontiPercorso.ipiRicercaAutonoma,
      fontiPercorso.swissregMarchi,
      fontiPercorso.co950,
      fontiPercorso.co951,
    ],
    verificatoIl: VERIFICATO_NOME_DITTA,
    tempoStimato: "30 minuti",
    domandaChat: "Come posso chiamare la mia ditta individuale?",
  },
  {
    id: "aiuto",
    fase: "prima di iniziare",
    titolo: "Sappi a chi chiedere aiuto",
    descrizione: `Chiedere aiuto è normale. In Ticino Fondounimpresa, un servizio pubblico gratuito, ti affianca un consulente personale: al massimo ${fondo.oreMassime} ore in ${fondo.anniMassimi} anni per valutare e realizzare il tuo progetto. Offre anche corsi su business plan, contabilità e marketing, che si pagano. Per il tuo caso personale (imposte, contabilità) la persona giusta è un fiduciario commercialista autorizzato dal Cantone (LFid, artt. 1 e 3).`,
    cosaFare: [
      `Fondounimpresa (${fondounimpresa.luogo}): tel. ${fondounimpresa.telefono}, ${fondounimpresa.email}. È per cittadini svizzeri o stranieri con permesso B o C residenti in Ticino o nella Regione Moesa. Ti iscrivi con il formulario online, allegando una copia del documento d'identità o del permesso. Aiuta con lo studio di fattibilità, la strategia e il business plan; non fa contabilità, corrispondenza né dichiarazioni d'imposta.`,
      "Se hai già avviato l'attività e hai domande puntuali (amministrazione, organizzazione, promozione, finanze), chiedi a Fondounimpresa l'accompagnamento breve.",
      "Per l'AVS c'è un'agenzia in ogni Comune ticinese: dà informazioni e moduli e collabora a determinare il reddito degli indipendenti.",
      "Per il tuo caso personale cerca un fiduciario commercialista nell'albo online del Cantone: in Ticino chi tiene la contabilità o compila le dichiarazioni d'imposta per altri, di mestiere, deve essere autorizzato.",
      "Aiuti della Confederazione: il Portale PMI ha liste di controllo per mettersi in proprio; su EasyGov fai online le iscrizioni (per esempio AVS, IVA, registro di commercio). EasyGov è gratuito, ma gli uffici possono chiedere le loro tasse.",
      "Nei Grigioni Fondounimpresa vale solo per la Regione Moesa; in tutto il Cantone l'Ufficio dell'economia e del turismo aiuta chi fonda un'impresa e fa da tramite con banche, avvocati e fiduciari.",
    ],
    link: { etichetta: "Fondounimpresa", url: fontiPercorso.fondounimpresa.url },
    fonti: [
      fontiPercorso.fondounimpresa,
      fontiPercorso.fondounimpresaGratuito,
      fontiPercorso.fondounimpresaBreve,
      fontiPercorso.fondounimpresaCorsi,
      fontiPercorso.portaleImpresaServizi,
      fontiPercorso.dlAvsTicino,
      fonti.lfid,
      fontiPercorso.autoritaFiduciari,
      fonti.albofiduciari,
      fontiPercorso.pmiMettersiInProprio,
      fontiPercorso.pmiServiziSupporto,
      fontiPercorso.pmiEasyGov,
      fontiPercorso.grCostituzioneStartup,
    ],
    verificatoIl: VERIFICATO_AIUTO,
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
      "Nei settori in cui la Suva assicura per legge i lavoratori (per esempio edilizia e installazioni, pulizia di edifici, trasporti, industria, lavori forestali) la Suva verifica se sei davvero indipendente. La domanda di riconoscimento si presenta comunque alla cassa AVS: la cassa la inoltra alla Suva, che decide d'accordo con la cassa se sei indipendente, dipendente o entrambe le cose (doppio statuto).",
    cosaFare: [
      "Presenta la domanda alla cassa AVS come tutti (passo seguente): non serve un passaggio separato alla Suva.",
      "Se lavori in subappalto o a cottimo per un'altra impresa, di regola sei considerato dipendente di quell'impresa. Sei indipendente solo in via eccezionale: se hai una tua organizzazione (posto di lavoro attrezzato, macchine o veicoli, materiale pagato da te, dipendenti fissi) o se lavori regolarmente anche per clienti tuoi.",
      `Prepara le prove della tua indipendenza: contratti, offerte e fatture a tuo nome a più clienti, sito o biglietti da visita, fatture di attrezzi e materiale, contratto del veicolo. Quando la Suva ti chiede i documenti hai ${suva.termineDocumentiGiorni.valore} giorni per mandarli.`,
      "Finché la Suva non ha deciso, spiega ai committenti che la domanda è in esame e fatti confermare gli incarichi per iscritto.",
      `Se la Suva ti considera dipendente, i committenti devono assicurarti anche per i lavori già fatti. Se non sei d'accordo, parlane con l'agenzia Suva: contro la decisione puoi fare opposizione scritta entro ${suva.termineOpposizioneGiorni.valore} giorni.`,
    ],
    link: { etichetta: "Suva: indipendente o dipendente?", url: fontiPercorso.suvaAccertamento.url },
    fonti: [
      fontiPercorso.suvaAccertamento,
      fontiPercorso.suvaDecisione,
      fontiPercorso.suvaImprenditori,
      fontiPercorso.lainf66,
      fontiPercorso.oainf73,
      fontiPercorso.avsIndipendenza,
      fonti.avsDomandaIndipendente,
      fonti.avsPromemoria202,
    ],
    verificatoIl: VERIFICATO_SUVA,
    domandaChat: "Lavoro nell'edilizia: chi decide se sono indipendente?",
  },
  {
    id: "riconoscimento-avs",
    fase: "aprire l'attività",
    titolo: "Fatti riconoscere come indipendente dalla cassa AVS",
    descrizione:
      "È la cassa di compensazione AVS a decidere se sei indipendente. Guarda se fatturi a tuo nome, se ti assumi il rischio economico, se organizzi liberamente il lavoro e se lavori per diversi clienti. La domanda si fa online e va presentata nei primissimi mesi di attività.",
    cosaFare: [
      "Raccogli le prove: offerte e fatture ai clienti, contratti, prove dei pagamenti ricevuti, pubblicità, contratti d'affitto o di leasing e la prova del capitale che hai investito.",
      "Presenta la domanda online su selbststaendig-erwerbend.ch (anche dall'indirizzo indipendente.ch): il sito la inoltra alla tua cassa.",
      "Se sei membro di un'associazione professionale che ha una propria cassa, devi affiliarti a quella; altrimenti alla cassa cantonale.",
      "Aspetta la decisione scritta della cassa: se respinge la domanda, per quell'attività sei dipendente e il tuo cliente deve versare per te i contributi AVS.",
      `Se ti riconosce, la cassa stabilisce gli acconti da pagare ogni trimestre sul reddito che prevedi. Nel ${avs2026.anno} i contributi AVS/AI/IPG vanno dal ${percentuale(avs2026.tassoMinimoScala, 3)} al ${percentuale(avs2026.tassoMassimo, 0)} del reddito; sotto ${chf(avs2026.limiteInferioreScala)} si paga il contributo minimo di ${chf(avs2026.contributoMinimo)} (${chf(avs2027.contributoMinimo)} dal ${avs2027.anno}).`,
    ],
    link: { etichetta: "Presenta la domanda online", url: fonti.avsDomandaIndipendente.url },
    fonti: [
      fonti.avsPromemoria202,
      fonti.avsDomandaIndipendente,
      fontiPercorso.avsIndipendenza,
      fontiPercorso.avsCosaSuccedeOra,
      fontiPercorso.iasAffiliazione,
      fonti.avsCasseCantonali,
      fontiPercorso.lavs64,
      fontiPercorso.pmiMettersiInProprio,
      fonti.ufasImporti2027,
    ],
    verificatoIl: VERIFICATO_AVS_INDIPENDENTI,
    tempoStimato: "1 ora, più i documenti da raccogliere",
    domandaChat: "Come mi faccio riconoscere come indipendente dalla cassa AVS?",
  },
  {
    id: "assicurazione-infortuni",
    fase: "aprire l'attività",
    titolo: "Controlla di essere assicurato contro gli infortuni",
    descrizione:
      "Da indipendente l'assicurazione infortuni (LAINF) non è obbligatoria: puoi assicurarti a titolo facoltativo. Senza, gli infortuni li copre la cassa malati come una malattia: paga le cure, con franchigia e aliquota, ma non il guadagno che perdi se non puoi lavorare.",
    cosaFare: [
      `Se lasci un lavoro da dipendente, l'assicurazione del datore ti copre fino a ${inf.coperturaDopoImpiegoGiorni.valore} giorni dopo la fine del salario. Prima che finisca puoi prolungarla con un accordo fino a ${inf.prolungamentoMesi.valore} mesi, per gli infortuni non professionali.`,
      "Chiama la tua cassa malati: se da dipendente avevi sospeso la copertura infortuni, avvisala che l'assicurazione del datore di lavoro è finita. Da lì gli infortuni li copre di nuovo lei, ma se non avvisi può chiederti i premi arretrati con gli interessi.",
      `Valuta un'assicurazione infortuni facoltativa: paga le cure e, se non puoi lavorare, un'indennità giornaliera dell'${percentuale(inf.indennitaGiornaliera.valore)} del guadagno assicurato. Nei settori della Suva c'è la sua assicurazione per imprenditori; negli altri settori la offrono assicuratori privati e casse malati.`,
      `Il premio si calcola sul guadagno assicurato, che concordi con l'assicuratore in base al tuo reddito: almeno ${chf(inf.guadagnoMinimoIndipendenti[2026].valore)} nel 2026 e ${chf(inf.guadagnoMinimoIndipendenti[2027].valore)} dal 2027.`,
      `Se hai anche un lavoro da dipendente di almeno ${inf.oreSettimanaliNonProfessionali.valore} ore alla settimana, il datore ti assicura anche contro gli infortuni nel tempo libero; l'attività in proprio la puoi assicurare a titolo facoltativo.`,
      "Se assumi qualcuno, assicurarlo contro gli infortuni è obbligatorio: il premio per gli infortuni professionali lo paghi tu, quello per gli infortuni non professionali lo trattieni dal salario.",
    ],
    link: { etichetta: "Portale PMI: assicurazione infortuni", url: fontiPercorso.pmiInfortuni.url },
    fonti: [
      fontiPercorso.lainf4,
      fonti.avsPromemoria202,
      fontiPercorso.lainf1a,
      fontiPercorso.oainf13,
      fontiPercorso.ufspObbligoInfortuni,
      fontiPercorso.lamal1a,
      fontiPercorso.lamal28,
      fontiPercorso.lainf17,
      fontiPercorso.pmiInfortuni,
      fontiPercorso.suvaImprenditori,
      fontiPercorso.oainf135,
      fontiPercorso.oainf138,
      fontiPercorso.oainfModifica2027,
      fontiPercorso.suvaPremiImprenditori,
      fontiPercorso.lainf3,
      fontiPercorso.lamal8,
      fontiPercorso.lamal10,
      fontiPercorso.lainf91,
    ],
    verificatoIl: VERIFICATO_INFORTUNI,
    tempoStimato: "Una telefonata alla cassa malati, più le offerte da confrontare",
    domandaChat: "Da indipendente sono assicurato contro gli infortuni?",
  },
  {
    id: "iscrizione-rc",
    fase: "aprire l'attività",
    titolo: "Decidi se iscriverti al registro di commercio",
    descrizione: `L'iscrizione è obbligatoria quando la ditta ha realizzato almeno ${SOGLIA_100K} di cifra d'affari nell'ultimo esercizio: conta la cifra d'affari, non l'utile. Sotto la soglia è facoltativa, ma hai sempre il diritto di iscriverti.`,
    cosaFare: [
      "Prima di decidere, guarda cosa cambia: il nome della ditta è protetto nel luogo, ma i dati della ditta, con il tuo nome, sono pubblici (Foglio ufficiale svizzero di commercio e Internet). La contabilità invece non dipende dall'iscrizione, ma dalla cifra d'affari.",
      `Se sei iscritto e non paghi un debito, il creditore può chiedere il tuo fallimento, che riguarda tutto il patrimonio (senza iscrizione di regola c'è il pignoramento). Vale anche per ${reg.fallimentoDopoCancellazioneMesi.valore} mesi dopo la cancellazione.`,
      "Puoi iscriverti online e in italiano con EasyGov. In Ticino c'è anche il formulario dell'Ufficio del registro di commercio, da firmare e spedire per posta con una copia del documento d'identità.",
      `Tasse federali per un titolare con firma individuale: ${chf(tasseRc.primaIscrizioneDittaIndividuale)} per la prima iscrizione, più ${chf(tasseRc.perFunzione)} per la funzione e ${chf(tasseRc.perDirittoDiFirma)} per il diritto di firma.`,
      `La firma sulla notificazione va autenticata: in Ticino ${chf(regolePercorso.autenticazioneFirmaRcTicino.valore)} allo sportello dell'Ufficio RC, al massimo ${chf(reg.autenticazioneFirmaNotaioMassimoFranchi.valore)} da un notaio, oppure dal segretario comunale.`,
      `Se devi iscriverti e non lo fai, l'Ufficio ti dà un termine; poi ti iscrive d'ufficio e può darti una multa fino a ${chf(reg.multaMancataIscrizioneFranchi.valore)}.`,
      "Se ti iscrivi, nelle fatture usa il nome della ditta esattamente come è iscritto.",
    ],
    link: { etichetta: "Iscriviti con EasyGov", url: fontiPercorso.easygovDittaIndividuale.url },
    fonti: [
      fonti.co931,
      fontiPercorso.pmiDittaIndividualeLanciarsi,
      fontiPercorso.co946,
      fontiPercorso.co936,
      fontiPercorso.co936a,
      fonti.co957,
      fontiPercorso.lef39,
      fontiPercorso.lef42,
      fontiPercorso.lef197,
      fontiPercorso.co938,
      fontiPercorso.co940,
      fontiPercorso.easygovDittaIndividuale,
      fontiPercorso.pmiIscrizioneNome,
      fonti.rcTicinoIscrizione,
      fonti.rcTicinoContatti,
      fontiPercorso.rcTicinoTasseCantonali,
      fontiPercorso.tariffaNotarile,
      fonti.oemolRc,
      fontiPercorso.zefixUffici,
      fontiPercorso.co954a,
    ],
    verificatoIl: VERIFICATO_REGISTRO,
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
    titolo: `Annunciati all'IVA entro ${regole.termineAnnuncioIvaGiorni.valore} giorni`,
    descrizione: `Chi realizza almeno ${SOGLIA_IVA} all'anno di cifra d'affari, in Svizzera e all'estero, è assoggettato all'IVA. Se all'avvio è presumibile superare la soglia entro ${regolePercorso.mesiPerIvaDaSubito.valore} mesi, sei assoggettato da subito; altrimenti lo diventi alla fine dell'esercizio in cui raggiungi la soglia. Ti devi annunciare all'AFC entro ${regole.termineAnnuncioIvaGiorni.valore} giorni dall'inizio dell'assoggettamento.`,
    cosaFare: [
      "Annunciati online all'AFC (anche in italiano) oppure tramite EasyGov.",
      "Tieni pronti il tuo numero AVS e la cifra d'affari prevista per il primo esercizio.",
      `Entro ${regolePercorso.termineMetodoIvaGiorni.valore} giorni dalla comunicazione del numero IVA puoi chiedere il metodo dell'aliquota saldo o il rendiconto annuale. Se perdi il termine, applichi il metodo effettivo per almeno ${periodiFiscali(regoleIva.periodiEffettivoSenzaAliquotaSaldo.valore)} interi prima di passare all'aliquota saldo, e il rendiconto annuale lo puoi chiedere al più presto dopo ${periodiFiscali(regoleIva.periodiAttesaRendicontoAnnuale.valore)}. Da valutare con un fiduciario.`,
      `Aliquote in vigore dal ${dataSvizzera(regoleIva.aliquoteInVigoreDal.valore)}: normale ${percentuale(aliquoteIva.valore.normale)}, ridotta ${percentuale(aliquoteIva.valore.ridotta)}, alloggio ${percentuale(aliquoteIva.valore.alloggio)}.`,
      `Sotto la soglia puoi iscriverti per scelta: secondo il Portale PMI conviene soprattutto se lavori per imprese iscritte all'IVA o per l'estero, o se all'inizio investi molto. Poi resti iscritto almeno ${periodiFiscali(regoleIva.periodiMinimiIscrizioneVolontaria.valore)}.`,
    ],
    link: { etichetta: "Iscrizione all'IVA (AFC)", url: fonti.afcIscrizione.url },
    fonti: [
      fonti.liva10,
      fontiPercorso.liva21,
      fonti.liva14,
      fontiPercorso.oiva9,
      fonti.liva66,
      fonti.afcAssoggettamento,
      fonti.afcIscrizione,
      fontiPercorso.pmiIva,
      fontiPercorso.liva11,
      fontiPercorso.liva34,
      fonti.afcAliquote,
      fontiPercorso.liva25,
      fontiPercorso.liva26,
      fonti.liva27,
      fontiPercorso.afcAliquoteSaldo,
      fontiPercorso.oiva78,
      fontiPercorso.oiva76a,
      fontiPercorso.liva86a,
    ],
    verificatoIl: VERIFICATO_IVA,
    tempoStimato: "1 ora",
    domandaChat: "Come e quando devo annunciarmi all'IVA?",
  },
  {
    id: "sito-online",
    fase: "aprire l'attività",
    titolo: "Se vendi online, metti i tuoi dati sul sito",
    descrizione:
      "Chi offre merci, opere o servizi online deve indicare in modo chiaro e completo la sua identità e il suo indirizzo di contatto, compreso l'indirizzo e-mail, spiegare i passi dell'ordine, permettere di correggere gli errori prima dell'invio e confermare subito l'ordine per via elettronica (LCSl, art. 3 cpv. 1 lett. s). Queste regole non valgono per le vendite al telefono e per i contratti conclusi solo scambiando e-mail o messaggi simili (art. 3 cpv. 2).",
    cosaFare: [
      "Metti sul sito chi sei: nome e cognome (o la ditta esattamente come è iscritta nel registro di commercio), indirizzo postale ed e-mail. Un semplice modulo di contatto non basta; il numero di telefono è consigliato.",
      "Rendi chiari i passi dell'ordine: il cliente deve capire quale clic invia l'ordine e conclude il contratto. Per quel pulsante il Portale PMI consiglia parole chiare come «acquistare»; «ordinare» o «avanti» non sono adatte.",
      "Prima dell'invio il cliente deve poter controllare e correggere prodotto, quantità, prezzo totale e indirizzi.",
      "Conferma subito l'ordine per via elettronica, per esempio con un'e-mail con i dettagli principali.",
      "Se vendi merci ai privati, mostra accanto al prodotto il prezzo finale in franchi, con dentro tutti i supplementi obbligatori (anche l'IVA, se sei iscritto). Le spese di spedizione puoi indicarle a parte, ma ben visibili. Per i servizi l'obbligo vale per quelli elencati nell'ordinanza, per esempio parrucchieri, istituti di bellezza e corsi.",
      "Se raccogli dati dei clienti, informali su chi sei, a cosa ti servono i dati e a chi li comunichi: il Portale PMI consiglia una dichiarazione sulla protezione dei dati ben in vista.",
      "In Svizzera la legge non prevede il diritto di restituire un acquisto online: se lo offri, scrivi le condizioni in modo chiaro. Se vendi anche nell'UE valgono regole più severe. Per le condizioni generali di vendita il Portale PMI consiglia un avvocato.",
    ],
    link: { etichetta: "Portale PMI: obblighi di chi vende online", url: fontiPercorso.pmiObblighiEcommerce.url },
    fonti: [
      fontiPercorso.lcsl3,
      fontiPercorso.secoAcquistiOnline,
      fontiPercorso.pmiObblighiEcommerce,
      fontiPercorso.co954a,
      fontiPercorso.oip3,
      fontiPercorso.oip4,
      fontiPercorso.oip10,
      fontiPercorso.lpd19,
      fontiPercorso.pmiProtezioneDatiEcommerce,
      fontiPercorso.pmiDirittoRecesso,
      fontiPercorso.pmiCondizioniGenerali,
    ],
    verificatoIl: VERIFICATO_SITO_ONLINE,
    tempoStimato: "1 ora",
    domandaChat: "Cosa devo scrivere sul mio sito se vendo online?",
  },
  {
    id: "locali-pubblico",
    fase: "aprire l'attività",
    titolo: "Locale aperto al pubblico: verifica le regole",
    descrizione:
      "Per un locale aperto al pubblico possono servire procedure specifiche. Per ristoranti e bar serve l'autorizzazione prevista dalla LEAR. Per i negozi, la legge ticinese sull'apertura dei negozi fissa gli orari e prevede un'autorizzazione solo per le deroghe agli orari. Il cambiamento di destinazione del locale e le insegne passano dal Municipio.",
    cosaFare: [
      `Negozio: rispetta gli orari, dal lunedì al venerdì dalle ${orari.apertura} alle ${orari.chiusuraFeriale}, il sabato fino alle ${orari.chiusuraSabato}, un giorno alla settimana fino alle ${orari.chiusuraSerale} (il giovedì, o un altro giorno se è festivo). La domenica e nei festivi si resta chiusi, salvo le eccezioni previste dalla legge.`,
      `Per aprire fuori orario per un'inaugurazione o una manifestazione chiedi la deroga per scritto almeno ${loc.termineDerogaGiorni.valore} giorni prima (tassa da ${chf(loc.tassaDerogaFranchi.valore.base)}).`,
      "Se cambi la destinazione del locale (per esempio da appartamento a negozio) o lo trasformi in modo importante, serve la licenza edilizia del Municipio.",
      `Per un'insegna visibile dalla strada chiedi l'autorizzazione al Municipio. Non serve per le scritte sulla vetrina o per una targa non luminosa fino a ${String(loc.targaSenzaAutorizzazioneMq.valore).replace(".", ",")} m² con solo il nome e il logo.`,
      "Indica il prezzo in franchi di ogni merce, ben leggibile anche in vetrina; per servizi come parrucchiere, estetista o corsi indica i prezzi delle prestazioni.",
      `Se vendi superalcolici chiedi la patente di vendita distillati alla Polizia cantonale, almeno ${loc.termineDistillatiGiorni.valore} giorni prima.`,
      "Controlla l'elenco delle autorizzazioni della Polizia cantonale e chiedi al tuo Comune se ci sono altre procedure per il tuo locale.",
    ],
    link: { etichetta: "Autorizzazioni della Polizia cantonale", url: fontiPercorso.poliziaAutorizzazioni.url },
    fonti: [
      fontiPercorso.lear,
      fontiPercorso.lan,
      fontiPercorso.rlan,
      fontiPercorso.leggeEdilizia,
      fontiPercorso.impiantiPubblicitari,
      fontiPercorso.regolamentoImpiantiPubblicitari,
      fontiPercorso.oip,
      fontiPercorso.poliziaDistillati,
      fontiPercorso.poliziaAutorizzazioni,
    ],
    verificatoIl: VERIFICATO_LOCALI,
    domandaChat: "Che autorizzazioni servono per aprire un negozio in Ticino?",
  },

  // -------------------------------------------------------------------------
  // Primi mesi
  // -------------------------------------------------------------------------
  {
    id: "fatture",
    fase: "primi mesi",
    titolo: "Prepara fatture corrette",
    descrizione: `Se non sei iscritto all'IVA non puoi indicare l'IVA in fattura: se lo fai e non correggi la fattura, quell'IVA la devi all'AFC (art. 27 LIVA). Per farti pagare si usa la QR-fattura, che dal ${dataSvizzera(regoleFatture.qrFatturaDal.valore)} ha sostituito le vecchie polizze di versamento.`,
    cosaFare: [
      "Non iscritto all'IVA: niente IVA in fattura, né aliquota né importo. Se l'hai scritta per errore, correggi la fattura con un nuovo documento che la annulla e mandalo al cliente.",
      `Iscritto all'IVA: in fattura servono il tuo nome e luogo con il numero IVA (formato ${regoleFatture.formatoNumeroIva.valore}), nome e luogo del cliente, la data o il periodo della prestazione, cosa hai fatto, l'importo, l'aliquota e l'importo dell'IVA (se il prezzo comprende già l'IVA basta l'aliquota).`,
      "Il numero IVA è il tuo numero IDI con «IVA» alla fine: ogni impresa attiva in Svizzera riceve gratis un IDI. Al posto di IVA puoi scrivere TVA o MWST, non VAT.",
      "Iscritto al registro di commercio: usa il nome della ditta completo, esattamente come è iscritto. Accanto puoi aggiungere un logo o un nome breve.",
      `Per la QR-fattura SIX elenca generatori gratuiti, tra cui quello di PostFinance. Dal ${dataSvizzera(datiStrumenti.indirizzoStrutturatoQr.valore)} l'indirizzo va scritto in forma strutturata.`,
      `Conserva una copia di ogni fattura per ${regolePercorso.conservazioneDocumentiAnni.valore} anni, su carta o in digitale: è un documento della tua contabilità.`,
      "Con lo strumento «Preventivo e fattura» di Bleo l'IVA compare solo se sei iscritto e la sezione pagamento con il codice QR si crea da sola.",
    ],
    link: { etichetta: "QR-fattura (SIX)", url: fonti.six.url },
    fonti: [
      fonti.liva27,
      fontiPercorso.liva26,
      fontiPercorso.afcIdi,
      fontiPercorso.ustIdi,
      fontiPercorso.co954a,
      fonti.six,
      fonti.co958f,
    ],
    verificatoIl: VERIFICATO_FATTURE,
    tempoStimato: "30 minuti per il modello",
    domandaChat: "Cosa deve esserci nella mia prima fattura?",
  },
  {
    id: "contabilita",
    fase: "primi mesi",
    titolo: "Tieni la contabilità: entrate, uscite e patrimonio",
    descrizione: `Conta la cifra d'affari dell'ultimo esercizio. Sotto ${chf(regole.sogliaContabilitaSemplificata.valore)} la ditta individuale deve tenere soltanto la contabilità delle entrate e delle uscite e quella del patrimonio; da ${chf(regole.sogliaContabilitaSemplificata.valore)} in su serve la contabilità completa (art. 957 CO). Valgono comunque i principi di una contabilità regolare: tutto registrato in modo completo e fedele, un documento per ogni registrazione (art. 957a CO).`,
    cosaFare: [
      "Registra ogni entrata e ogni uscita con il suo giustificativo (fattura, ricevuta, estratto conto).",
      "Tieni ben separato il privato dalla ditta: le spese private non vanno a carico della ditta. Per i beni che usi per tutte e due, per esempio l'auto, si fa una ripartizione proporzionale (Portale PMI).",
      "A fine anno prepara gli elenchi delle entrate e delle uscite, della situazione patrimoniale e dei prelevamenti e apporti privati: con la contabilità semplificata li alleghi alla dichiarazione d'imposta. Con la contabilità completa alleghi invece i conti annuali firmati (art. 125 LIFD).",
      `Conserva libri e documenti per ${regolePercorso.conservazioneDocumentiAnni.valore} anni dalla fine dell'esercizio, su carta o in digitale, purché restino leggibili e corrispondano alle operazioni (art. 958f CO). Per il digitale ci sono regole precise: le spiega il Portale PMI.`,
      `Con lo strumento «I tuoi conti» di Bleo fotografi le ricevute, le confermi e a fine anno scarichi il file per il fiduciario. Tieni comunque una copia delle ricevute: Bleo non le conserva per ${regolePercorso.conservazioneDocumentiAnni.valore} anni.`,
      "Bleo non tiene la contabilità per te: se vuoi farla fare, o affidare il conto annuale e la dichiarazione d'imposta, rivolgiti a un fiduciario autorizzato.",
    ],
    link: { etichetta: "Codice delle obbligazioni, art. 957", url: fonti.co957.url },
    fonti: [
      fonti.co957,
      fontiPercorso.co957a,
      fonti.co958f,
      fontiPercorso.lifd125,
      fontiPercorso.pmiRendicontoDitta,
      fontiPercorso.pmiConservazioneElettronica,
      fontiPercorso.pmiContabilitaDelegare,
      fonti.albofiduciari,
    ],
    verificatoIl: VERIFICATO_CONTABILITA,
    tempoStimato: "Poco ogni settimana",
    domandaChat: "Che contabilità devo tenere con una ditta individuale?",
  },
  {
    id: "acconti-avs",
    fase: "primi mesi",
    titolo: "Paga gli acconti AVS ogni trimestre",
    descrizione: `Durante l'anno paghi acconti fissati dalla cassa di compensazione sul reddito che prevedi, entro il 10 gennaio, il 10 aprile, il 10 luglio e il 10 ottobre. I contributi definitivi si calcolano dopo, sul reddito della tassazione fiscale, che la cassa riceve dall'autorità fiscale: la cassa ti rimborsa o ti manda il conguaglio da pagare entro ${regolePercorso.termineConguaglioAvsGiorni.valore} giorni dalla data della fattura.`,
    cosaFare: [
      `Paga ogni acconto in tempo: conta il giorno in cui i soldi arrivano sul conto della cassa. Se arrivano più di ${aavs.giorniMoraAcconto.valore} giorni dopo la fine del trimestre, paghi interessi di mora dalla fine del trimestre.`,
      `Se il reddito cambia molto, anche a fine anno, avvisa subito la cassa: per l'IAS conta una variazione di più o meno il ${percentuale(regolePercorso.variazioneRedditoIas.valore, 0)}, da segnalare per iscritto o con la richiesta online di adeguamento.`,
      `Se gli acconti restano sotto il ${percentuale(regolePercorso.sogliaAccontiAvs.valore, 0)} dei contributi definitivi, sulla differenza paghi interessi di mora del ${percentuale(regolePercorso.interesseMoraAvs.valore, 0)} l'anno, dal 1° gennaio del secondo anno dopo quello dei contributi: per il ${avs2026.anno} dal ${dataSvizzera(`${avs2026.anno + aavs.anniInizioMoraAccontiBassi.valore}-01-01`)}.`,
      `Se non paghi, la cassa ti manda una diffida con una tassa da ${chf(aavs.tassaDiffidaFranchi.valore.min)} a ${chf(aavs.tassaDiffidaFranchi.valore.max)}. Se sei in difficoltà, chiedile una dilazione: gli interessi di mora restano dovuti.`,
      `Contributi AVS/AI/IPG degli indipendenti: al massimo il ${percentuale(avs2026.tassoMassimo, 0)} del reddito, al minimo ${chf(avs2026.contributoMinimo)} l'anno nel 2026 e ${chf(avs2027.contributoMinimo)} dal 2027.`,
    ],
    link: { etichetta: "Promemoria AVS 2.02", url: fonti.avsPromemoria202.url },
    fonti: [
      fonti.avsPromemoria202,
      fontiPercorso.oavs24,
      fontiPercorso.oavs34,
      fontiPercorso.oavs42,
      fontiPercorso.oavs41bis,
      fontiPercorso.oavs34a,
      fontiPercorso.oavs34b,
      fontiPercorso.iasAcconti,
      fontiPercorso.iasAdeguamentoIndipendenti,
      fontiPercorso.oavs27,
      fontiPercorso.oavs25,
      fonti.ufasImporti2027,
      fonti.iasAf2026,
      fonti.lafTicino73,
    ],
    verificatoIl: VERIFICATO_ACCONTI_AVS,
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
    descrizione: `Alla fine di ogni esercizio somma la cifra d'affari e confrontala con le soglie. Con almeno ${SOGLIA_100K} nell'ultimo esercizio l'iscrizione al registro di commercio diventa obbligatoria. Per l'IVA, se non eri assoggettato dall'inizio, lo diventi alla fine dell'esercizio in cui hai raggiunto ${SOGLIA_IVA}, e hai ${regole.termineAnnuncioIvaGiorni.valore} giorni per annunciarti. Da ${chf(regole.sogliaContabilitaSemplificata.valore)} nell'ultimo esercizio serve la contabilità completa.`,
    cosaFare: [
      "Somma la cifra d'affari dell'esercizio: tutto quello che hai fatturato, in Svizzera e all'estero, senza IVA. Conta la cifra d'affari, non l'utile: le spese non si tolgono.",
      `Per la soglia dell'IVA non contano le prestazioni escluse dall'imposta, come molte cure mediche e l'insegnamento, e nemmeno doni e sussidi. Se l'attività non è durata tutto l'esercizio, la cifra d'affari si riporta su un anno intero: per esempio ${chf(META_SOGLIA_IVA)} in ${MESI_META_ANNO} mesi valgono come ${SOGLIA_IVA}.`,
      "Se hai raggiunto una soglia, segui i passi su registro di commercio e IVA. Per passare alla contabilità completa rivolgiti a un fiduciario autorizzato.",
      `Se sei iscritto all'IVA e la cifra d'affari scende sotto ${SOGLIA_IVA}, e prevedi che resti sotto anche l'anno dopo, puoi chiedere all'AFC la radiazione entro ${regoleSoglie.termineRadiazioneIvaGiorni.valore} giorni dalla fine dell'anno: se non la chiedi, resti iscritto.`,
      "Nello strumento «I tuoi conti» di Bleo il riepilogo dell'anno mostra le entrate che hai confermato, e Bleo ti avvisa quando si avvicinano alla soglia dell'IVA. Conta però la cifra d'affari vera: controlla che ci siano tutte le fatture.",
    ],
    link: { etichetta: "Assoggettamento all'IVA (AFC)", url: fonti.afcAssoggettamento.url },
    fonti: [
      fonti.co931,
      fonti.liva10,
      fontiPercorso.liva21,
      fonti.afcAssoggettamento,
      fonti.liva14,
      fontiPercorso.oiva9,
      fontiPercorso.afcInfoIva02,
      fonti.liva66,
      fontiPercorso.liva34,
      fonti.co957,
      fonti.albofiduciari,
    ],
    verificatoIl: VERIFICATO_SOGLIE,
    tempoStimato: "15 minuti",
    domandaChat: "A fine anno come controllo le soglie di registro di commercio, IVA e contabilità?",
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
