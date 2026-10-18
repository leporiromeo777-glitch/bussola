/**
 * Dati ufficiali usati da percorso, strumenti e testi. Ogni valore porta la
 * sua fonte e la data di controllo: se cambi un numero, aggiorna anche
 * `verificatoIl` e la fonte. Controllo mensile: vedi docs/fonti.md.
 *
 * Ricerca e verifica: docs/ricerca/ (15.10.2026).
 */

export type Fonte = {
  titolo: string;
  url: string;
  ente: string;
};

export type Dato<T> = {
  valore: T;
  fonte: Fonte;
  /** Data ISO dell'ultimo controllo sulla fonte. */
  verificatoIl: string;
  nota?: string;
};

const VERIFICATO_IL = "2026-10-15";

function dato<T>(valore: T, fonte: Fonte, nota?: string): Dato<T> {
  return { valore, fonte, verificatoIl: VERIFICATO_IL, ...(nota ? { nota } : {}) };
}

/**
 * Data dell'ultimo controllo delle fonti sull'IVA, per il passo e la lezione
 * 14: LIVA artt. 10, 11, 14, 21, 25, 26, 27, 34, 35, 37 e 66 (stato
 * 31.03.2025), OIVA artt. 9, 76a, 78 e 123 (stato 01.01.2025; gli artt. 9,
 * 76a e 78 sono uguali nel testo in vigore dal 01.01.2027), pagine dell'AFC
 * (assoggettamento, iscrizione, aliquote, aliquote saldo, numero IDI) e del
 * Portale PMI («IVA: come funziona l'imposta sul valore aggiunto»).
 */
export const VERIFICATO_IVA = "2026-10-18";

function datoIva<T>(valore: T, fonte: Fonte, nota: string): Dato<T> {
  return { ...dato(valore, fonte, nota), verificatoIl: VERIFICATO_IVA };
}

const CO = "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/it";
const LIVA = "https://www.fedlex.admin.ch/eli/cc/2009/615/it";

export const fonti = {
  co931: { titolo: "Codice delle obbligazioni, art. 931", url: `${CO}#art_931`, ente: "Confederazione (Fedlex)" },
  co945: { titolo: "Codice delle obbligazioni, art. 945", url: `${CO}#art_945`, ente: "Confederazione (Fedlex)" },
  co957: { titolo: "Codice delle obbligazioni, art. 957", url: `${CO}#art_957`, ente: "Confederazione (Fedlex)" },
  co958f: { titolo: "Codice delle obbligazioni, art. 958f", url: `${CO}#art_958_f`, ente: "Confederazione (Fedlex)" },
  co773: { titolo: "Codice delle obbligazioni, art. 773", url: `${CO}#art_773`, ente: "Confederazione (Fedlex)" },
  co621: { titolo: "Codice delle obbligazioni, art. 621", url: `${CO}#art_621`, ente: "Confederazione (Fedlex)" },
  co632: { titolo: "Codice delle obbligazioni, art. 632", url: `${CO}#art_632`, ente: "Confederazione (Fedlex)" },
  liva10: { titolo: "Legge sull'IVA, art. 10", url: `${LIVA}#art_10`, ente: "Confederazione (Fedlex)" },
  liva14: { titolo: "Legge sull'IVA, art. 14", url: `${LIVA}#art_14`, ente: "Confederazione (Fedlex)" },
  liva27: { titolo: "Legge sull'IVA, art. 27", url: `${LIVA}#art_27`, ente: "Confederazione (Fedlex)" },
  liva66: { titolo: "Legge sull'IVA, art. 66", url: `${LIVA}#art_66`, ente: "Confederazione (Fedlex)" },
  afcAliquote: {
    titolo: "Aliquote IVA svizzere",
    url: "https://www.estv.admin.ch/it/aliquote-iva-svizzere",
    ente: "Amministrazione federale delle contribuzioni (AFC)",
  },
  afcAssoggettamento: {
    titolo: "Assoggettamento all'IVA",
    url: "https://www.estv.admin.ch/it/assoggettamento-all-iva",
    ente: "Amministrazione federale delle contribuzioni (AFC)",
  },
  afcIscrizione: {
    titolo: "Iscrizione all'IVA",
    url: "https://www.estv.admin.ch/it/iscrizione-all-iva",
    ente: "Amministrazione federale delle contribuzioni (AFC)",
  },
  oemolRc: {
    titolo: "Ordinanza sugli emolumenti in materia di registro di commercio (OEmol-RC)",
    url: "https://www.fedlex.admin.ch/eli/cc/2020/180/it",
    ente: "Confederazione (Fedlex)",
  },
  rcTicinoIscrizione: {
    titolo: "Registro di commercio: iscrizione (formulari)",
    url: "https://www4.ti.ch/di/dg/rf/sportello/formulari-rc/di-iscrizione",
    ente: "Cantone Ticino, Ufficio del registro di commercio",
  },
  rcTicinoContatti: {
    titolo: "Ufficio del registro di commercio: contatti",
    url: "https://www4.ti.ch/di/dg/rf/contatti/ufficio-del-registro-di-commercio",
    ente: "Cantone Ticino",
  },
  pmiDittaIndividuale: {
    titolo: "Forma giuridica: la ditta individuale",
    url: "https://www.kmu.admin.ch/it/forma-giuridica-ditta-individuale",
    ente: "Portale PMI (SECO)",
  },
  pmiChecklist: {
    titolo: "Check list: creare una ditta individuale, una Sagl o una SA",
    url: "https://www.kmu.admin.ch/it/check-list-creare-una-ditta-individuale-una-sagl-o-una-sa",
    ente: "Portale PMI (SECO)",
  },
  avsPromemoria202: {
    titolo: "Promemoria 2.02: Contributi alle assicurazioni sociali degli indipendenti",
    url: "https://www.ahv-iv.ch/p/2.02.i",
    ente: "Centro d'informazione AVS/AI",
  },
  avsCasseCantonali: {
    titolo: "Casse cantonali di compensazione",
    url: "https://www.ahv-iv.ch/it/Contatti/Casse-cantonali-di-compensazione",
    ente: "Centro d'informazione AVS/AI",
  },
  avsDomandaIndipendente: {
    titolo: "Presentare la domanda di riconoscimento come indipendente",
    url: "https://selbststaendig-erwerbend.ch/it/presentare-una-domanda",
    ente: "Centro d'informazione AVS/AI",
  },
  ufasImporti2026: {
    titolo: "Importi validi dal 1° gennaio 2026",
    url: "https://www.bsv.admin.ch/dam/it/sd-web/sAgdISSXenMT/i_Betr%C3%A4ge%202026.pdf",
    ente: "Ufficio federale delle assicurazioni sociali (UFAS)",
  },
  ufasImporti2027: {
    titolo: "Importi validi dal 1° gennaio 2027",
    url: "https://cms.news.admin.ch/fileservice/sdweb-docs-prod-nsbcch-files/files/2026/10/02/5ab00ecd-a640-4c4a-829c-ee47bb35fec1.pdf",
    ente: "Ufficio federale delle assicurazioni sociali (UFAS)",
  },
  iasAf2026: {
    titolo: "Informazioni periodiche assegni familiari 2026",
    url: "https://www4.ti.ch/fileadmin/DSS/IAS/pdf/informazioni_periodiche/2026_Info_periodiche_AF.pdf",
    ente: "Istituto delle assicurazioni sociali (IAS), Ticino",
  },
  iasAliquote2025: {
    titolo: "Aliquote contributive 2025: contributi personali",
    url: "https://www4.ti.ch/fileadmin/DSS/IAS/pdf/formulari/UC/Aliquote_contributive_2025_personali.pdf",
    ente: "Istituto delle assicurazioni sociali (IAS), Ticino",
  },
  lafTicino73: {
    titolo: "Legge sugli assegni di famiglia (Ticino), art. 73",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/332",
    ente: "Cantone Ticino, Raccolta delle leggi",
  },
  opp3: {
    titolo: "Ordinanza sulla previdenza individuale vincolata (OPP 3), art. 7",
    url: "https://www.fedlex.admin.ch/eli/cc/1985/1778_1778_1778/it#art_7",
    ente: "Confederazione (Fedlex)",
  },
  lfid: {
    titolo: "Legge sull'esercizio delle professioni di fiduciario (LFid), RL 953.100",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/618",
    ente: "Cantone Ticino, Raccolta delle leggi",
  },
  albofiduciari: {
    titolo: "Albo online dei fiduciari autorizzati",
    url: "https://www4.ti.ch/di/dg/fiduciari/albo-online/albo",
    ente: "Cantone Ticino, Autorità di vigilanza sui fiduciari",
  },
  six: {
    titolo: "QR-fattura: standard e linee guida",
    url: "https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/qr-bill.html",
    ente: "SIX",
  },
} as const satisfies Record<string, Fonte>;

/** Soglie e regole stabili, scritte nella legge. */
export const regole = {
  sogliaRegistroCommercio: dato(100_000, fonti.co931, "Cifra d'affari (non utile) dell'ultimo esercizio. Sotto la soglia l'iscrizione è facoltativa (art. 931 cpv. 3 CO)."),
  sogliaIva: datoIva(
    100_000,
    fonti.liva10,
    "Cifra d'affari annua, in Svizzera e all'estero, da prestazioni non escluse dall'imposta (art. 21 LIVA), calcolata sulle controprestazioni convenute senza IVA (art. 10 cpv. 2bis LIVA). È esentato chi resta sotto: con CHF 100'000 esatti si è assoggettati (l'AFC scrive «almeno 100 000 franchi»).",
  ),
  termineAnnuncioIvaGiorni: datoIva(
    30,
    fonti.liva66,
    "Giorni dall'inizio dell'assoggettamento per annunciarsi all'AFC, di propria iniziativa. Dal 01.01.2025 l'annuncio si fa per via elettronica (art. 123 OIVA); l'AFC assegna il numero IVA, che è il numero IDI.",
  ),
  sogliaContabilitaSemplificata: dato(500_000, fonti.co957, "Con una cifra d'affari inferiore a questa nell'ultimo esercizio la ditta individuale può tenere solo entrate, uscite e situazione patrimoniale; da CHF 500'000 esatti serve la contabilità completa."),
  capitaleMinimoSagl: dato(20_000, fonti.co773),
  capitaleMinimoSa: dato(100_000, fonti.co621),
  versamentoMinimoSa: dato(50_000, fonti.co632, "Alla costituzione della SA va versato almeno il 20% del valore nominale di ogni azione e in totale almeno CHF 50'000. Nella Sagl invece il capitale va versato per intero (art. 777c CO)."),
} as const;

/** Aliquote IVA in vigore dal 01.01.2024. */
export const aliquoteIva = dato(
  { normale: 0.081, ridotta: 0.026, alloggio: 0.038 },
  fonti.afcAliquote,
  "Il 29.11.2026 si vota un aumento dell'aliquota normale all'8,5% e di quella per l'alloggio al 4%, non prima del 2028. L'aliquota per l'alloggio vale per legge fino al 31.12.2027; il Parlamento l'ha prorogata al 31.12.2031 (termine di referendum 21.01.2027). Dopo il numero IVA si scrive IVA, MWST o TVA, non VAT.",
);

/** Tasse federali per la prima iscrizione di una ditta individuale nel registro di commercio. */
export const tasseRegistroCommercio = dato(
  { primaIscrizioneDittaIndividuale: 80, perFunzione: 20, perDirittoDiFirma: 20, stimaTitolareConFirma: 120 },
  fonti.oemolRc,
  "Titolare con firma individuale: 80 + 20 + 20 = CHF 120, più l'autenticazione della firma (CHF 20 all'Ufficio RC).",
);

export type ParametriAvs = {
  anno: number;
  /** Tasso massimo AVS/AI/IPG per indipendenti (frazione). */
  tassoMassimo: number;
  /** Tasso più basso della tavola scalare (frazione). */
  tassoMinimoScala: number;
  /** Sotto questo reddito si paga il contributo minimo. */
  limiteInferioreScala: number;
  /** Da questo reddito si applica il tasso massimo. */
  limiteSuperioreScala: number;
  contributoMinimo: number;
};

/** Contributi AVS/AI/IPG degli indipendenti. */
export const avsIndipendenti: Record<2026 | 2027, Dato<ParametriAvs>> = {
  2026: dato(
    { anno: 2026, tassoMassimo: 0.1, tassoMinimoScala: 0.05371, limiteInferioreScala: 10_100, limiteSuperioreScala: 60_500, contributoMinimo: 530 },
    fonti.avsPromemoria202,
  ),
  2027: dato(
    { anno: 2027, tassoMassimo: 0.1, tassoMinimoScala: 0.05371, limiteInferioreScala: 10_300, limiteSuperioreScala: 61_500, contributoMinimo: 541 },
    fonti.ufasImporti2027,
    "Valori decisi dal Consiglio federale il 02.10.2026, in vigore dal 01.01.2027.",
  ),
};

/** Supplementi della cassa cantonale ticinese (IAS) sul reddito soggetto AVS. */
export const supplementiTicino = {
  speseAmministrative: dato(0.02, fonti.iasAliquote2025, "Percentuale dei contributi AVS/AI/IPG. Valore 2025, ultimo foglio pubblicato dall'IAS."),
  assegniFamiliari: dato(0.0085, fonti.iasAf2026, "Cassa cantonale AF, 2026. Le casse professionali possono avere aliquote diverse."),
  assegnoIntegrativo: dato(0.0015, fonti.lafTicino73),
} as const;

/**
 * Anno a cui vale ogni supplemento IAS usato nelle stime: l'ultimo pubblicato.
 * Spese amministrative e tetto degli assegni familiari (CHF 148'200, «fino a
 * CHF 148'200.00 di reddito annuo») vengono dal foglio IAS 2025 dei contributi
 * personali, l'aliquota AF dalle informazioni periodiche AF 2026 (0,85% per
 * le persone di condizione indipendente). Ricontrollato il 16.10.2026: il
 * foglio 2026 dei contributi personali non è ancora pubblicato
 * (Aliquote_contributive_2026_personali.pdf allo stesso indirizzo: 404).
 */
export const anniSupplementiTicino = {
  speseAmministrative: 2025,
  assegniFamiliari: 2026,
  guadagnoMassimoAssegniFamiliari: 2025,
} as const;

/** Pilastro 3a: importo massimo deducibile. */
export const pilastro3a = {
  2026: dato({ senzaCassaPensione: 36_288, conCassaPensione: 7_258 }, fonti.ufasImporti2026, "Senza cassa pensione: 20% del reddito da attività lucrativa, al massimo questo importo."),
  2027: dato({ senzaCassaPensione: 36_864, conCassaPensione: 7_373 }, fonti.ufasImporti2027),
} as const;

/** Uffici ticinesi citati nel percorso. */
export const uffici = {
  registroCommercioTicino: dato(
    {
      nome: "Ufficio del registro di commercio del Cantone Ticino",
      indirizzo: "Via Tognola 7, 6710 Biasca",
      email: "di-rc@ti.ch",
      telefono: "+41 91 816 29 81",
    },
    fonti.rcTicinoContatti,
  ),
  cassaCompensazioneTicino: dato(
    {
      nome: "Istituto delle assicurazioni sociali (IAS), Cassa cantonale di compensazione AVS/AI/IPG",
      indirizzo: "Via Ghiringhelli 15a, 6501 Bellinzona",
      telefono: "+41 91 821 91 11",
    },
    fonti.avsCasseCantonali,
  ),
  cassaCompensazioneGrigioni: dato(
    {
      nome: "Sozialversicherungsanstalt des Kantons Graubünden (cassa n. 18)",
      indirizzo: "Ottostrasse 24, 7001 Coira",
    },
    fonti.avsCasseCantonali,
  ),
  autoritaFiduciari: dato(
    {
      nome: "Autorità di vigilanza sull'esercizio delle professioni di fiduciario",
      indirizzo: "Via Nizzola 1, 6501 Bellinzona",
      telefono: "+41 91 814 03 51",
    },
    fonti.lfid,
  ),
} as const;

/** Formatta un importo in franchi alla svizzera: CHF 1'234 o CHF 1'234.50. */
export function chf(importo: number, decimali: 0 | 2 = 0): string {
  const segno = importo < 0 ? "-" : "";
  const [intero, dec] = Math.abs(importo).toFixed(decimali).split(".");
  const conApostrofi = intero.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${segno}CHF ${conApostrofi}${dec ? `.${dec}` : ""}`;
}

/** Formatta una percentuale alla svizzera: 8,1%. */
export function percentuale(frazione: number, decimali = 1): string {
  return `${(frazione * 100).toFixed(decimali).replace(".", ",").replace(/,0+$/, "")}%`;
}

/** Formatta una data ISO come 15.10.2026. */
export function dataSvizzera(iso: string): string {
  const [a, m, g] = iso.slice(0, 10).split("-");
  return `${g}.${m}.${a}`;
}

// ---------------------------------------------------------------------------
// Percorso guidato (questionario e checklist): fonti, dati e uffici in più.
// Ricerca del 15.10.2026; Zefix, uffici RC ed EasyGov ricontrollati online
// lo stesso giorno.
// ---------------------------------------------------------------------------

const LT_TICINO = "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/580";
const OIVA = "https://www.fedlex.admin.ch/eli/cc/2009/828/it";
const LAVS = "https://www.fedlex.admin.ch/eli/cc/63/837_843_843/it";
const OAVS = "https://www.fedlex.admin.ch/eli/cc/63/1185_1183_1185/it";
const LAMAL = "https://www.fedlex.admin.ch/eli/cc/1995/1328_1328_1328/it";
const LAINF = "https://www.fedlex.admin.ch/eli/cc/1982/1676_1676_1676/it";
const OAINF = "https://www.fedlex.admin.ch/eli/cc/1983/38_38_38/it";
const ODERR = "https://www.fedlex.admin.ch/eli/cc/2017/63/it";
const LSTRI = "https://www.fedlex.admin.ch/eli/cc/2007/758/it";
const LEF = "https://www.fedlex.admin.ch/eli/cc/11/529_488_529/it";
const OIP = "https://www.fedlex.admin.ch/eli/cc/1978/2081_2081_2081/it";
const LABORATORIO_TI = "Cantone Ticino, Laboratorio cantonale";
const PMI = "Portale PMI (SECO)";
const FEDLEX = "Confederazione (Fedlex)";
const IAS = "Istituto delle assicurazioni sociali (IAS), Ticino";
const DC = "Cantone Ticino, Divisione delle contribuzioni";
const RACCOLTA_TI = "Cantone Ticino, Raccolta delle leggi";
const UM_TI = "Cantone Ticino, Ufficio della migrazione";
const SEM = "Segreteria di Stato della migrazione (SEM)";
const UMDC_GR = "Cantone dei Grigioni, Ufficio della migrazione e del diritto civile";

export const fontiPercorso = {
  // Forma giuridica, nome e registro di commercio
  co777: { titolo: "Codice delle obbligazioni, art. 777", url: `${CO}#art_777`, ente: FEDLEX },
  co777c: { titolo: "Codice delle obbligazioni, art. 777c", url: `${CO}#art_777_c`, ente: FEDLEX },
  // Statuto e atto di fondazione della Sagl (video facoltativi della lezione 2):
  // testi ricontrollati il 17.10.2026, vedi VERIFICATO_DOCUMENTI_SAGL.
  co776: { titolo: "Codice delle obbligazioni, art. 776", url: `${CO}#art_776`, ente: FEDLEX },
  co777a: { titolo: "Codice delle obbligazioni, art. 777a", url: `${CO}#art_777_a`, ente: FEDLEX },
  co777b: { titolo: "Codice delle obbligazioni, art. 777b", url: `${CO}#art_777_b`, ente: FEDLEX },
  co778: { titolo: "Codice delle obbligazioni, art. 778", url: `${CO}#art_778`, ente: FEDLEX },
  co779: { titolo: "Codice delle obbligazioni, art. 779", url: `${CO}#art_779`, ente: FEDLEX },
  co809: { titolo: "Codice delle obbligazioni, art. 809", url: `${CO}#art_809`, ente: FEDLEX },
  co774: { titolo: "Codice delle obbligazioni, art. 774", url: `${CO}#art_774`, ente: FEDLEX },
  // Strumento «Fondare una Sagl» (scheda e bozza dello statuto): ricontrollati il 17.10.2026.
  co772: { titolo: "Codice delle obbligazioni, art. 772", url: `${CO}#art_772`, ente: FEDLEX },
  co814: { titolo: "Codice delle obbligazioni, art. 814", url: `${CO}#art_814`, ente: FEDLEX },
  co818: { titolo: "Codice delle obbligazioni, art. 818", url: `${CO}#art_818`, ente: FEDLEX },
  co727a: { titolo: "Codice delle obbligazioni, art. 727a", url: `${CO}#art_727_a`, ente: FEDLEX },
  co804: { titolo: "Codice delle obbligazioni, art. 804", url: `${CO}#art_804`, ente: FEDLEX },
  statutoTipoSagl: {
    titolo: "Statuto tipo Sagl, con le note (modello del 2008)",
    url: "https://www4.ti.ch/fileadmin/DI/DG/RC/Documentazione/Statuti_SAGL_annotati.pdf",
    ente: "Cantone Ticino, Registro di commercio (modello dell'Ufficio federale del registro di commercio)",
  },
  co950: { titolo: "Codice delle obbligazioni, art. 950", url: `${CO}#art_950`, ente: FEDLEX },
  co954a: { titolo: "Codice delle obbligazioni, art. 954a", url: `${CO}#art_954_a`, ente: FEDLEX },
  // Artt. 944 e 946 CO e pagine dell'IPI: testi ricontrollati il 16.10.2026 (strumento «Nome della ditta»).
  co944: { titolo: "Codice delle obbligazioni, art. 944", url: `${CO}#art_944`, ente: FEDLEX },
  co946: { titolo: "Codice delle obbligazioni, art. 946", url: `${CO}#art_946`, ente: FEDLEX },
  // Nome della ditta (passo e lezione 8): ricontrollati il 18.10.2026, vedi VERIFICATO_NOME_DITTA.
  co951: { titolo: "Codice delle obbligazioni, art. 951", url: `${CO}#art_951`, ente: FEDLEX },
  direttivaDitteUfrc: {
    titolo: "Istruzione e direttiva sulla formazione e sull'esame delle ditte e dei nomi (1° aprile 2021)",
    url: "https://www.bj.admin.ch/dam/it/sd-web/R5zheIrURnT6/weisung-firmenrecht.pdf",
    ente: "Ufficio federale del registro di commercio (UFRC)",
  },
  pmiIscrizioneNome: {
    titolo: "Iscrizione di un'impresa e definizione del suo nome",
    url: "https://www.kmu.admin.ch/it/iscrizione-di-unimpresa-e-definizione-del-suo-nome",
    ente: PMI,
  },
  regixFaq: {
    titolo: "REGIX, ricerca della ditta: domande frequenti",
    url: "https://www.regix.ch/it/faq",
    ente: "Ufficio federale del registro di commercio (UFRC)",
  },
  ipiFaqMarchi: {
    titolo: "Marchi: domande frequenti",
    url: "https://www.ige.ch/it/protezione/marchi/faq",
    ente: "Istituto federale della proprietà intellettuale (IPI)",
  },
  ipiRicercaAutonoma: {
    titolo: "Marchi: ricercare autonomamente",
    url: "https://www.ige.ch/it/protezione/marchi/prima-del-deposito/condizioni-della-protezione/rischio-di-conflitto/ricercare-autonomamente",
    ente: "Istituto federale della proprietà intellettuale (IPI)",
  },
  ipiRicercaMarchi: {
    titolo: "Marchi: prima di tutto la ricerca",
    url: "https://www.ige.ch/it/proprieta-intellettuale/una-guida-per-creativi-e-innovatori/marchi/prima-di-tutto-la-ricerca",
    ente: "Istituto federale della proprietà intellettuale (IPI)",
  },
  swissregMarchi: {
    titolo: "Swissreg: ricerca dei marchi",
    url: "https://www.swissreg.ch/database-client/search/query/trademarks/?lang=it",
    ente: "Istituto federale della proprietà intellettuale (IPI)",
  },
  zefix: {
    titolo: "Zefix: ricerca della ditta (Indice centrale delle ditte)",
    url: "https://www.zefix.admin.ch/it/search/entity/welcome",
    ente: "Ufficio federale del registro di commercio (UFRC)",
  },
  zefixUffici: {
    titolo: "Uffici del registro di commercio svizzeri",
    url: "https://www.zefix.admin.ch/it/hra",
    ente: "Ufficio federale del registro di commercio (UFRC)",
  },
  easygovDittaIndividuale: {
    titolo: "Costituire una ditta individuale con EasyGov",
    url: "https://ditta-individuale.easygov.swiss/",
    ente: "EasyGov (SECO)",
  },
  pmiEasyGov: {
    titolo: "EasyGov riduce l'onere amministrativo delle imprese",
    url: "https://www.kmu.admin.ch/it/easygov-riduce-lonere-amministrativo-delle-imprese",
    ente: PMI,
  },
  rcTicinoTasseCantonali: {
    titolo: "Registro di commercio: tasse cantonali",
    url: "https://www4.ti.ch/di/dg/rf/sportello/tasse-cantonali",
    ente: "Cantone Ticino, Ufficio del registro di commercio",
  },
  // Registro di commercio (passo e lezione 13): ricontrollati il 18.10.2026,
  // vedi VERIFICATO_REGISTRO, come rcTicinoTasseCantonali, easygovDittaIndividuale,
  // pmiIscrizioneNome, pmiDittaIndividualeLanciarsi, co946 e co954a qui e
  // fonti.co931, co957, oemolRc, rcTicinoIscrizione e rcTicinoContatti.
  co936: { titolo: "Codice delle obbligazioni, art. 936", url: `${CO}#art_936`, ente: FEDLEX },
  co936a: { titolo: "Codice delle obbligazioni, art. 936a", url: `${CO}#art_936_a`, ente: FEDLEX },
  co938: { titolo: "Codice delle obbligazioni, art. 938", url: `${CO}#art_938`, ente: FEDLEX },
  co940: { titolo: "Codice delle obbligazioni, art. 940", url: `${CO}#art_940`, ente: FEDLEX },
  lef39: { titolo: "Legge sull'esecuzione e sul fallimento (LEF), artt. 39-40", url: `${LEF}#art_39`, ente: FEDLEX },
  lef42: { titolo: "Legge sull'esecuzione e sul fallimento (LEF), artt. 42 e 97", url: `${LEF}#art_42`, ente: FEDLEX },
  lef197: { titolo: "Legge sull'esecuzione e sul fallimento (LEF), art. 197", url: `${LEF}#art_197`, ente: FEDLEX },
  tariffaNotarile: {
    titolo: "Legge sulla tariffa notarile (Ticino), art. 17",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/148",
    ente: RACCOLTA_TI,
  },
  pmiMettersiInProprio: {
    titolo: "Mettersi in proprio: istruzioni",
    url: "https://www.kmu.admin.ch/it/mettersi-in-proprio-istruzioni",
    ente: PMI,
  },
  pmiDittaIndividualeLanciarsi: {
    titolo: "Ditta individuale: per lanciarsi da soli",
    url: "https://www.kmu.admin.ch/it/ditta-individuale-per-lanciarsi-da-soli",
    ente: PMI,
  },
  pmiSagl: {
    titolo: "Forma giuridica: la società a garanzia limitata (Sagl)",
    url: "https://www.kmu.admin.ch/it/forma-giuridica-societa-a-garanzia-limitata-sagl",
    ente: PMI,
  },
  // Le quattro forme più comuni e i criteri per scegliere (lezione 1 del corso):
  // pagine ricontrollate il 17.10.2026, vedi VERIFICATO_FORME.
  pmiNomeCollettivo: {
    titolo: "Forma giuridica: la società in nome collettivo",
    url: "https://www.kmu.admin.ch/it/forma-giuridica-societa-in-nome-collettivo",
    ente: PMI,
  },
  pmiSa: {
    titolo: "Forma giuridica: la società anonima (SA)",
    url: "https://www.kmu.admin.ch/it/forma-giuridica-societa-anonima-sa",
    ente: PMI,
  },
  pmiScegliereForma: {
    titolo: "Scegliere una forma giuridica: una forma giuridica per ogni impresa",
    url: "https://www.kmu.admin.ch/it/scegliere-una-forma-giuridica-una-forma-giuridica-per-ogni-impresa",
    ente: PMI,
  },

  // Autorizzazioni e permessi
  sefriProfessioniRegolamentate: {
    titolo: "Note informative sulle professioni regolamentate",
    url: "https://www.sbfi.admin.ch/it/note-informative-professioni-regolamentate",
    ente: "Segreteria di Stato per la formazione, la ricerca e l'innovazione (SEFRI)",
  },
  poliziaAutorizzazioni: {
    titolo: "Polizia cantonale: servizi online e autorizzazioni",
    url: "https://www4.ti.ch/index.php?id=117316",
    ente: "Polizia cantonale ticinese",
  },
  lear: {
    titolo: "Legge sugli esercizi alberghieri e sulla ristorazione (LEAR), artt. 3-9 e 27",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/792",
    ente: RACCOLTA_TI,
  },
  rlear: {
    titolo: "Regolamento sugli esercizi alberghieri e sulla ristorazione (RLEAR)",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/793",
    ente: RACCOLTA_TI,
  },
  poliziaEserciziPubbliciPersona: {
    titolo: "Autorizzazione per esercizi pubblici: persona fisica",
    url: "https://www4.ti.ch/index.php?id=139975",
    ente: "Polizia cantonale ticinese, Servizio autorizzazioni, commercio e giochi",
  },
  poliziaEserciziPubbliciSocieta: {
    titolo: "Autorizzazione per esercizi pubblici: persona giuridica (società)",
    url: "https://www4.ti.ch/index.php?id=146712",
    ente: "Polizia cantonale ticinese, Servizio autorizzazioni, commercio e giochi",
  },
  diplomaEsercente: {
    titolo: "Diploma cantonale di esercente",
    url: "https://www4.ti.ch/decs/dfp/diploma-esercente/home",
    ente: "Cantone Ticino, Divisione della formazione professionale",
  },
  diplomaEsercenteCorso: {
    titolo: "Diploma cantonale di esercente: il corso di formazione",
    url: "https://www4.ti.ch/decs/dfp/diploma-esercente/corso-di-formazione/il-corso-di-formazione",
    ente: "Cantone Ticino, Divisione della formazione professionale",
  },
  lan: {
    titolo: "Legge sull'apertura dei negozi (LAN)",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/688",
    ente: RACCOLTA_TI,
  },
  // Locale aperto al pubblico (passo e lezione 16): ricontrollati il
  // 18.10.2026, vedi VERIFICATO_LOCALI.
  rlan: {
    titolo: "Regolamento della legge sull'apertura dei negozi (RLAN), artt. 2, 4 e 5",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/694",
    ente: RACCOLTA_TI,
  },
  leggeEdilizia: {
    titolo: "Legge edilizia cantonale, artt. 1, 3 e 4",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/406",
    ente: RACCOLTA_TI,
  },
  impiantiPubblicitari: {
    titolo: "Legge sugli impianti pubblicitari, artt. 2-4",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/449",
    ente: RACCOLTA_TI,
  },
  regolamentoImpiantiPubblicitari: {
    titolo: "Regolamento d'esecuzione della legge sugli impianti pubblicitari, artt. 1-3",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/450",
    ente: RACCOLTA_TI,
  },
  oip: {
    titolo: "Ordinanza sull'indicazione dei prezzi (OIP), artt. 2-3, 7-8 e 10-11",
    url: "https://www.fedlex.admin.ch/eli/cc/1978/2081_2081_2081/it",
    ente: FEDLEX,
  },
  poliziaDistillati: {
    titolo: "Come posso richiedere la patente di vendita distillati?",
    url: "https://www4.ti.ch/index.php?id=144733",
    ente: "Polizia cantonale ticinese, Servizio autorizzazioni, commercio e giochi",
  },
  sanitaLiberoEsercizio: {
    titolo: "Procedure per le autorizzazioni di libero esercizio",
    url: "https://www4.ti.ch/dss/dsp/us/sportello/procedure-per-le-autorizzazioni-di-libero-esercizio",
    ente: "Cantone Ticino, Ufficio di sanità",
  },
  sanitaDocumenti: {
    titolo: "Autorizzazione di libero esercizio: professioni e documenti da presentare",
    url: "https://www4.ti.ch/dss/dsp/us/sportello/procedure-per-le-autorizzazioni-di-libero-esercizio/autorizzazione-di-libero-esercizio",
    ente: "Cantone Ticino, Ufficio di sanità",
  },
  sanitaAltroCantone: {
    titolo: "Autorizzazione di libero esercizio già ricevuta in un altro Cantone",
    url: "https://www4.ti.ch/dss/dsp/us/sportello/procedure-per-le-autorizzazioni-di-libero-esercizio/autorizzazione-di-libero-esercizio-gia-ricevuta-in-un-altro-cantone",
    ente: "Cantone Ticino, Ufficio di sanità",
  },
  sanitaFaqTerapisti: {
    titolo: "Terapista complementare: domande frequenti (FAQ)",
    url: "https://www4.ti.ch/dss/dsp/us/informazioni-utili/revisione-lsan-implicazioni-per-terapisti-complementari-naturopati/faq",
    ente: "Cantone Ticino, Ufficio di sanità",
  },
  sanitaAoms: {
    titolo: "Procedura per la richiesta di esercitare a carico dell'AOMS",
    url: "https://www4.ti.ch/dss/dsp/us/sportello/procedure-per-la-richiesta-di-fatturare-a-carico-dellaoms",
    ente: "Cantone Ticino, Ufficio di sanità",
  },
  lsan: {
    titolo: "Legge sanitaria (LSan), artt. 53-63d e 95",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/270",
    ente: RACCOLTA_TI,
  },
  tasseSanita: {
    titolo: "Regolamento concernente le tasse previste dalla legge sanitaria, art. 2",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/284",
    ente: RACCOLTA_TI,
  },
  regolamentoEstetista: {
    titolo: "Regolamento concernente l'esercizio della professione di estetista",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/309",
    ente: RACCOLTA_TI,
  },
  sefriTerapieComplementari: {
    titolo: "Regolamentazione delle professioni nel settore della medicina alternativa (terapie complementari)",
    url: "https://www.sbfi.admin.ch/dam/it/sd-web/MxoTsi-KhYn1/Alternativmedizin%20oder%20Komplement%C3%A4rtherapie_it.pdf",
    ente: "Segreteria di Stato per la formazione, la ricerca e l'innovazione (SEFRI)",
  },
  lamal36: {
    titolo: "Legge sull'assicurazione malattie (LAMal), artt. 35-36",
    url: `${LAMAL}#art_36`,
    ente: FEDLEX,
  },
  oderr20: {
    titolo: "Ordinanza sulle derrate alimentari e gli oggetti d'uso (ODerr), art. 20",
    url: `${ODERR}#art_20`,
    ente: FEDLEX,
  },
  oderr21: {
    titolo: "Ordinanza sulle derrate alimentari e gli oggetti d'uso (ODerr), art. 21",
    url: `${ODERR}#art_21`,
    ente: FEDLEX,
  },
  laboratorioCantonaleNotifica: {
    titolo: "Annunciare la propria attività di commercio di derrate alimentari",
    url: "https://www4.ti.ch/dss/dsp/lc/informazioni-e-servizi/dettaglio?tx_tichdsslabcantonale_lcschede%5Baction%5D=show&tx_tichdsslabcantonale_lcschede%5Bcontroller%5D=Scheda&tx_tichdsslabcantonale_lcschede%5Bidc%5D=13&tx_tichdsslabcantonale_lcschede%5Bscheda%5D=1&cHash=309da7cd28df37ae6eb122061dc5e6ea",
    ente: LABORATORIO_TI,
  },
  oderr73: {
    titolo: "Ordinanza sulle derrate alimentari e gli oggetti d'uso (ODerr), art. 73",
    url: `${ODERR}#art_73`,
    ente: FEDLEX,
  },
  oderr74: {
    titolo: "Ordinanza sulle derrate alimentari e gli oggetti d'uso (ODerr), art. 74",
    url: `${ODERR}#art_74`,
    ente: FEDLEX,
  },
  laboratorioEssenziale: {
    titolo: "Fabbricare, importare o commercializzare derrate alimentari: l'essenziale in breve",
    url: "https://www4.ti.ch/dss/dsp/lc/informazioni-e-servizi/dettaglio?tx_tichdsslabcantonale_lcschede%5Baction%5D=show&tx_tichdsslabcantonale_lcschede%5Bcontroller%5D=Scheda&tx_tichdsslabcantonale_lcschede%5Bidc%5D=4&tx_tichdsslabcantonale_lcschede%5Bscheda%5D=1&cHash=c330d788625a3019893e627f41ef0333",
    ente: LABORATORIO_TI,
  },
  laboratorioControlloAutonomo: {
    titolo: "Controllo autonomo e analisi di derrate alimentari",
    url: "https://www4.ti.ch/dss/dsp/lc/informazioni-e-servizi/dettaglio?tx_tichdsslabcantonale_lcschede%5Baction%5D=show&tx_tichdsslabcantonale_lcschede%5Bcontroller%5D=Scheda&tx_tichdsslabcantonale_lcschede%5Bidc%5D=14&tx_tichdsslabcantonale_lcschede%5Bscheda%5D=1&cHash=36e07b593c24bab9d1afd353dd343824",
    ente: LABORATORIO_TI,
  },
  laboratorioEtichettatura: {
    titolo: "Come etichettare la merce",
    url: "https://www4.ti.ch/dss/dsp/lc/informazioni-e-servizi/dettaglio?tx_tichdsslabcantonale_lcschede%5Baction%5D=show&tx_tichdsslabcantonale_lcschede%5Bcontroller%5D=Scheda&tx_tichdsslabcantonale_lcschede%5Bidc%5D=17&tx_tichdsslabcantonale_lcschede%5Bscheda%5D=1&cHash=644d1e57aec5e2953bec90e926bb9145",
    ente: LABORATORIO_TI,
  },
  formularioNotificaDerrate: {
    titolo: "Formulario per la notifica di attività alimentari",
    url: "https://www4.ti.ch/fileadmin/DSS/DSP/LC/Formulari/Formulario_per_la_notifica_DA_05_2021.pdf",
    ente: LABORATORIO_TI,
  },
  grNotificaDerrate: {
    titolo: "Derrate alimentari: modulo di notifica (Grigioni)",
    url: "https://www.gr.ch/IT/istituzioni/amministrazione/dvs/alt/derratealimentari/derratealimentari/Seiten/default.aspx",
    ente: "Cantone dei Grigioni, Ufficio per la sicurezza delle derrate alimentari e la salute degli animali",
  },
  // Permesso per lavorare in proprio (passo e lezione 7): ricontrollati il
  // 18.10.2026, vedi VERIFICATO_PERMESSI. Il PDF qui sotto è quello per i
  // frontalieri (permesso G); quello per il permesso B è umIndipendentiUeAelsB.
  umIndipendentiUeAels: {
    titolo: "Avvertenze per i frontalieri UE/AELS indipendenti (permesso G)",
    url: "https://www4.ti.ch/fileadmin/DI/DI_DI/SEZPOP/documentazione/avvertenze/2017/G_Avvertenze_Cittadini_UE-AELS_indipendenti.pdf",
    ente: UM_TI,
  },
  umIndipendentiUeAelsB: {
    titolo: "Avvertenze per i cittadini UE/AELS indipendenti con permesso di dimora (permesso B)",
    url: "https://www4.ti.ch/fileadmin/DI/DI_DI/SEZPOP/documentazione/avvertenze/2017/B_Avvertenze_Cittadini_UE-AELS_indipendenti.pdf",
    ente: UM_TI,
  },
  umRichiestaPermessoB: {
    titolo: "Richiesta nuovo permesso di dimora (B) per cittadini UE/AELS",
    url: "https://www4.ti.ch/index.php?id=130308",
    ente: UM_TI,
  },
  umRichiestaPermessoG: {
    titolo: "Richiesta nuovo permesso per frontalieri (G)",
    url: "https://www4.ti.ch/index.php?id=122090",
    ente: UM_TI,
  },
  umModificaPermessoB: {
    titolo: "Richiesta rinnovo e/o modifica del permesso di dimora (B)",
    url: "https://www4.ti.ch/index.php?id=130259",
    ente: UM_TI,
  },
  semSoggiornoAttivita: {
    titolo: "Scheda: soggiorno in Svizzera in vista di esercitare un'attività lucrativa (UE/AELS)",
    url: "https://www.sem.admin.ch/dam/sem/it/data/eu/fza/personenfreizuegigkeit/factsheets/fs-bew-aufenthalt.pdf.download.pdf/fs-bew-aufenthalt.pdf",
    ente: SEM,
  },
  semFrontalieri: {
    titolo: "Scheda: frontalieri (UE/AELS)",
    url: "https://www.sem.admin.ch/dam/sem/it/data/eu/fza/personenfreizuegigkeit/factsheets/fs-grenzgaenger.pdf.download.pdf/fs-grenzgaenger.pdf",
    ente: SEM,
  },
  semFaqLiberaCircolazione: {
    titolo: "FAQ: libera circolazione delle persone (attività indipendente, permessi, mobilità)",
    url: "https://www.sem.admin.ch/sem/it/home/themen/fza_schweiz-eu-efta/eu-efta_buerger_schweiz/faq.html",
    ente: SEM,
  },
  semIstruzioniOlcp: {
    titolo: "Istruzioni OLCP (01/2026), n. II 4.3: attività lucrativa indipendente",
    url: "https://www.sem.admin.ch/dam/sem/it/data/rechtsgrundlagen/weisungen/fza/weisungen-fza-i.pdf",
    ente: SEM,
  },
  lstri19: {
    titolo: "Legge federale sugli stranieri e la loro integrazione (LStrI), art. 19",
    url: `${LSTRI}#art_19`,
    ente: FEDLEX,
  },
  lstri38: {
    titolo: "Legge federale sugli stranieri e la loro integrazione (LStrI), art. 38",
    url: `${LSTRI}#art_38`,
    ente: FEDLEX,
  },
  grIndipendentiUeAels: {
    titolo: "Dimoranti e frontalieri con attività lucrativa indipendente (UE/AELS)",
    url: "https://www.gr.ch/IT/istituzioni/amministrazione/djsg/afm/servizi/Einreise_Aufenthalt/eu-efta/Seiten/Selbst%C3%A4ndig-erwerbende.aspx",
    ente: UMDC_GR,
  },
  grPromemoriaIndipendenti: {
    titolo: "Promemoria dimoranti e frontalieri con attività lucrativa indipendente (UE/AELS)",
    url: "https://www.gr.ch/DE/institutionen/verwaltung/djsg/afm/Dokumentenliste%20APZ1/107%20-%20Merkblatt%20selbst%c3%a4ndig%20erwerbende%20Aufenthalter%20und%20Grenzg%c3%a4nger%20EU-26%20EFTA-3_IT.pdf",
    ente: UMDC_GR,
  },

  // AVS e assicurazioni
  // Riconoscimento come indipendente (passo e lezione 11): le pagine di
  // selbststaendig-erwerbend.ch le pubblica il Centro d'informazione AVS/AI
  // (impronta del sito); ricontrollate il 18.10.2026, vedi VERIFICATO_AVS_INDIPENDENTI.
  avsCosaSuccedeOra: {
    titolo: "Cosa succede ora? (dopo la domanda di riconoscimento)",
    url: "https://selbststaendig-erwerbend.ch/it/cosa-succede-ora",
    ente: "Centro d'informazione AVS/AI",
  },
  avsIndipendenza: {
    titolo: "Cosa significa indipendenza? (criteri, attività accessoria, casse di compensazione)",
    url: "https://selbststaendig-erwerbend.ch/it/indipendenza",
    ente: "Centro d'informazione AVS/AI",
  },
  iasAffiliazione: {
    titolo: "Affiliazione alla cassa di compensazione competente",
    url: "https://www4.ti.ch/dss/ias/prestazioni-e-contributi/scheda/p/s/dettaglio/obbligo-contributivo-nelle-assicurazioni-sociali/affiliazione-alla-cassa-di-compensazione-competente-per-la-riscossione-dei-contributi",
    ente: IAS,
  },
  iasAcconti: {
    titolo: "Contributi personali d'acconto e obbligo di segnalare le variazioni",
    url: "https://www4.ti.ch/dss/ias/prestazioni-e-contributi/scheda/p/s/dettaglio/contributi-personali-dacconto-e-obbligo-di-segnalare-variazioni-delle-basi-di-calcolo",
    ente: IAS,
  },
  dlAvsTicino: {
    titolo: "Legge di applicazione della LAVS (cassa cantonale e agenzie comunali), RL 851.100",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/359",
    ente: RACCOLTA_TI,
  },
  lavs64: { titolo: "Legge sull'AVS (LAVS), art. 64", url: `${LAVS}#art_64`, ente: FEDLEX },
  oavs41bis: { titolo: "Ordinanza sull'AVS (OAVS), art. 41bis", url: `${OAVS}#art_41_bis`, ente: FEDLEX },
  oavs42: { titolo: "Ordinanza sull'AVS (OAVS), art. 42", url: `${OAVS}#art_42`, ente: FEDLEX },
  pmiAssicurazioniSociali: {
    titolo: "Il funzionamento delle assicurazioni sociali",
    url: "https://www.kmu.admin.ch/it/il-funzionamento-delle-assicurazioni-sociali",
    ente: PMI,
  },
  lainf4: {
    titolo: "Legge sull'assicurazione contro gli infortuni (LAINF), art. 4",
    url: "https://www.fedlex.admin.ch/eli/cc/1982/1676_1676_1676/it#art_4",
    ente: FEDLEX,
  },
  lamal1a: { titolo: "Legge sull'assicurazione malattie (LAMal), art. 1a", url: `${LAMAL}#art_1_a`, ente: FEDLEX },
  lamal8: { titolo: "Legge sull'assicurazione malattie (LAMal), art. 8", url: `${LAMAL}#art_8`, ente: FEDLEX },
  lamal67: { titolo: "Legge sull'assicurazione malattie (LAMal), art. 67", url: `${LAMAL}#art_67`, ente: FEDLEX },
  suvaAccertamento: {
    titolo: "Accertamento: indipendente o dipendente?",
    url: "https://www.suva.ch/it-ch/assicurazione/assicurazione-contro-gli-infortuni/accertamento-indipendente-dipendente",
    ente: "Suva",
  },
  suvaImprenditori: {
    titolo: "Assicurazione per imprenditori (lavoratori indipendenti)",
    url: "https://www.suva.ch/it-ch/assicurazione/assicurazione-contro-gli-infortuni/assicurazione-per-imprenditori-per-lavoratori-indipendenti",
    ente: "Suva",
  },
  // Statuto Suva (passo e lezione 10): ricontrollati il 18.10.2026, vedi VERIFICATO_SUVA.
  suvaDecisione: {
    titolo: "Decisione statuto di dipendente o indipendente: e ora?",
    url: "https://www.suva.ch/it-ch/assicurazione/assicurazione-contro-gli-infortuni/accertamento-indipendente-dipendente/decisione",
    ente: "Suva",
  },
  lainf66: {
    titolo: "Legge sull'assicurazione contro gli infortuni (LAINF), art. 66: settore di competenza della Suva",
    url: "https://www.fedlex.admin.ch/eli/cc/1982/1676_1676_1676/it#art_66",
    ente: FEDLEX,
  },
  oainf73: {
    titolo: "Ordinanza sull'assicurazione contro gli infortuni (OAINF), art. 73: industria edilizia e installazioni",
    url: "https://www.fedlex.admin.ch/eli/cc/1983/38_38_38/it#art_73",
    ente: FEDLEX,
  },
  pmiInfortuni: {
    titolo: "Assicurazione contro gli infortuni professionali e non professionali",
    url: "https://www.kmu.admin.ch/it/assicurazione-contro-gli-infortuni-professionali-e-assicurazione-contro-gli-infortuni-non-professionali",
    ente: PMI,
  },
  // Assicurazione infortuni (passo e lezione 12): ricontrollati il 18.10.2026,
  // vedi VERIFICATO_INFORTUNI. Con quelli sopra: lainf4, lamal1a, lamal8,
  // suvaImprenditori e pmiInfortuni.
  lainf1a: { titolo: "Legge sull'assicurazione contro gli infortuni (LAINF), art. 1a", url: `${LAINF}#art_1_a`, ente: FEDLEX },
  lainf3: { titolo: "Legge sull'assicurazione contro gli infortuni (LAINF), art. 3", url: `${LAINF}#art_3`, ente: FEDLEX },
  lainf17: { titolo: "Legge sull'assicurazione contro gli infortuni (LAINF), artt. 16-17", url: `${LAINF}#art_17`, ente: FEDLEX },
  lainf91: { titolo: "Legge sull'assicurazione contro gli infortuni (LAINF), art. 91", url: `${LAINF}#art_91`, ente: FEDLEX },
  oainf13: { titolo: "Ordinanza sull'assicurazione contro gli infortuni (OAINF), art. 13", url: `${OAINF}#art_13`, ente: FEDLEX },
  oainf135: { titolo: "Ordinanza sull'assicurazione contro gli infortuni (OAINF), artt. 134-135", url: `${OAINF}#art_135`, ente: FEDLEX },
  oainf138: { titolo: "Ordinanza sull'assicurazione contro gli infortuni (OAINF), artt. 22 e 138", url: `${OAINF}#art_138`, ente: FEDLEX },
  oainfModifica2027: {
    titolo: "Modifica dell'OAINF del 26.08.2026 (art. 138, in vigore dal 01.01.2027)",
    url: "https://www.fedlex.admin.ch/eli/oc/2026/432/it",
    ente: FEDLEX,
  },
  lamal28: { titolo: "Legge sull'assicurazione malattie (LAMal), artt. 28 e 64", url: `${LAMAL}#art_28`, ente: FEDLEX },
  lamal10: { titolo: "Legge sull'assicurazione malattie (LAMal), art. 10", url: `${LAMAL}#art_10`, ente: FEDLEX },
  suvaPremiImprenditori: {
    titolo: "Assicurazione per imprenditori: i premi",
    url: "https://www.suva.ch/it-ch/assicurazione/assicurazione-contro-gli-infortuni/assicurazione-per-imprenditori-per-lavoratori-indipendenti/premi-assicurativi-dell-assicurazione-infortuni-per-lavoratori-indipendenti",
    ente: "Suva",
  },
  ufspObbligoInfortuni: {
    titolo: "Assicurazione infortuni: chi è soggetto all'obbligo di assicurazione?",
    url: "https://www.bag.admin.ch/it/assicurazione-infortuni-chi-e-soggetto-allobbligo-di-assicurazione",
    ente: "Ufficio federale della sanità pubblica (UFSP)",
  },
  pmiIndennitaGiornaliera: {
    titolo: "Assicurazione d'indennità giornaliera per malattia",
    url: "https://www.kmu.admin.ch/it/assicurazione-di-indennita-giornaliera-per-malattiaassicurazione-in-caso-di-incapacita-di-guadagno-risp-di-perdita-di-guadagno",
    ente: PMI,
  },
  pmiDisoccupazione: {
    titolo: "Assicurazione contro la disoccupazione (AD)",
    url: "https://www.kmu.admin.ch/it/assicurazione-contro-la-disoccupazione-ad",
    ente: PMI,
  },
  lpp4: {
    titolo: "Legge sulla previdenza professionale (LPP), art. 4",
    url: "https://www.fedlex.admin.ch/eli/cc/1983/797_797_797/it#art_4",
    ente: FEDLEX,
  },

  // IVA e fatture
  liva11: { titolo: "Legge sull'IVA, art. 11", url: `${LIVA}#art_11`, ente: FEDLEX },
  liva26: { titolo: "Legge sull'IVA, art. 26", url: `${LIVA}#art_26`, ente: FEDLEX },
  oiva78: { titolo: "Ordinanza sull'IVA (OIVA), art. 78", url: `${OIVA}#art_78`, ente: FEDLEX },
  oiva76a: { titolo: "Ordinanza sull'IVA (OIVA), art. 76a", url: `${OIVA}#art_76_a`, ente: FEDLEX },
  // Iscrizione all'IVA (passo e lezione 14): controllati il 18.10.2026, vedi
  // VERIFICATO_IVA. Con quelli sopra e liva10, liva14, liva66 e le pagine
  // dell'AFC in `fonti`.
  liva21: { titolo: "Legge sull'IVA, art. 21: prestazioni escluse dall'imposta", url: `${LIVA}#art_21`, ente: FEDLEX },
  liva25: { titolo: "Legge sull'IVA, art. 25: aliquote d'imposta", url: `${LIVA}#art_25`, ente: FEDLEX },
  liva34: { titolo: "Legge sull'IVA, art. 34: periodo fiscale", url: `${LIVA}#art_34`, ente: FEDLEX },
  oiva9: { titolo: "Ordinanza sull'IVA (OIVA), art. 9", url: `${OIVA}#art_9`, ente: FEDLEX },
  liva86a: { titolo: "Legge sull'IVA, art. 86a: acconti con il rendiconto annuale", url: `${LIVA}#art_86_a`, ente: FEDLEX },
  pmiIva: {
    titolo: "IVA: come funziona l'imposta sul valore aggiunto",
    url: "https://www.kmu.admin.ch/it/iva-come-funziona-limposta-sul-valore-aggiunto",
    ente: PMI,
  },
  afcAliquoteSaldo: {
    titolo: "Aliquote saldo e aliquote forfetarie in materia di IVA",
    url: "https://www.estv.admin.ch/it/iva-aliquote-saldo-e-aliquote-forfetarie",
    ente: "Amministrazione federale delle contribuzioni (AFC)",
  },
  afcIdi: {
    titolo: "Numero d'identificazione delle imprese (IDI)",
    url: "https://www.estv.admin.ch/it/numero-identificazione-delle-imprese-idi",
    ente: "Amministrazione federale delle contribuzioni (AFC)",
  },
  ustIdi: {
    titolo: "L'IDI in generale",
    url: "https://www.bfs.admin.ch/bfs/it/home/registri/registro-imprese/numero-identificazione-imprese/idi-generale.html",
    ente: "Ufficio federale di statistica (UST)",
  },
  lcsl3: {
    titolo: "Legge contro la concorrenza sleale (LCSl), art. 3",
    url: "https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/it#art_3",
    ente: FEDLEX,
  },
  // Vendita online (passo e lezione 15): ricontrollati il 18.10.2026, vedi VERIFICATO_SITO_ONLINE.
  secoAcquistiOnline: {
    titolo: "Acquisti online",
    url: "https://www.seco.admin.ch/it/acquisti-online",
    ente: "Segreteria di Stato dell'economia (SECO)",
  },
  pmiObblighiEcommerce: {
    titolo: "E-commerce: obblighi legali in Svizzera e nell'UE",
    url: "https://www.kmu.admin.ch/it/obblighi-legali-in-svizzera-e-nellue",
    ente: PMI,
  },
  oip3: { titolo: "Ordinanza sull'indicazione dei prezzi (OIP), art. 3", url: `${OIP}#art_3`, ente: FEDLEX },
  oip4: { titolo: "Ordinanza sull'indicazione dei prezzi (OIP), art. 4", url: `${OIP}#art_4`, ente: FEDLEX },
  oip10: { titolo: "Ordinanza sull'indicazione dei prezzi (OIP), art. 10", url: `${OIP}#art_10`, ente: FEDLEX },
  lpd19: {
    titolo: "Legge sulla protezione dei dati (LPD), art. 19",
    url: "https://www.fedlex.admin.ch/eli/cc/2022/491/it#art_19",
    ente: FEDLEX,
  },
  pmiProtezioneDatiEcommerce: {
    titolo: "Siti e-commerce e protezione dei dati personali",
    url: "https://www.kmu.admin.ch/it/siti-e-commerce-e-protezione-dei-dati-personali",
    ente: PMI,
  },
  pmiDirittoRecesso: {
    titolo: "E-commerce: che cos'è il diritto di recesso?",
    url: "https://www.kmu.admin.ch/it/che-cose-il-diritto-di-recesso",
    ente: PMI,
  },
  pmiCondizioniGenerali: {
    titolo: "E-commerce: condizioni generali di vendita",
    url: "https://www.kmu.admin.ch/it/condizioni-generali-di-vendita",
    ente: PMI,
  },

  // Imposte e contabilità
  pmiImposteDitta: {
    titolo: "La non imposizione fiscale di alcune società",
    url: "https://www.kmu.admin.ch/it/la-non-imposizione-fiscale-di-alcune-societa",
    ente: PMI,
  },
  lifd125: {
    titolo: "Legge sull'imposta federale diretta (LIFD), art. 125",
    url: "https://www.fedlex.admin.ch/eli/cc/1991/1184_1184_1184/it#art_125",
    ente: FEDLEX,
  },
  leggeTributariaTicino: { titolo: "Legge tributaria del Cantone Ticino (LT)", url: LT_TICINO, ente: RACCOLTA_TI },
  istruzioniPf2025: {
    titolo: "Istruzioni per la dichiarazione d'imposta delle persone fisiche 2025",
    url: "https://www4.ti.ch/fileadmin/DFE/DC/DOC-IPF/2025/Istruzioni/Istruzioni_PF_2025.pdf",
    ente: DC,
  },
  modulo10: {
    titolo: "Modulo 10: questionario per indipendenti senza contabilità (2025)",
    url: "https://www4.ti.ch/fileadmin/DFE/DC/DOC-IPF/2025/Moduli_principali/PF_VS_0608-2025_Mod10_A4.pdf",
    ente: DC,
  },
  dcModuliPf: {
    titolo: "Moduli della dichiarazione d'imposta delle persone fisiche",
    url: "https://www4.ti.ch/dfe/dc/dichiarazione/moduli/moduli-pf-attuale",
    ente: DC,
  },
  dcEtax: {
    titolo: "Dichiarazione elettronica (eTax PF)",
    url: "https://www4.ti.ch/dfe/dc/dichiarazione/dichiarazione-elettronica",
    ente: DC,
  },
  dcRichiestaAcconto: {
    titolo: "Acconti e rateazioni: richiesta d'acconto",
    url: "https://www4.ti.ch/dfe/dc/pagamenti/acconti-e-rateazioni/richiesta-acconto",
    ente: DC,
  },
  dcAccontoCantonale: {
    titolo: "Richiesta d'acconto dell'imposta cantonale",
    url: "https://www4.ti.ch/dfe/dc/pagamenti/richiesta-acconto-imposta-cantonale",
    ente: DC,
  },
  decretoRiscossione2026: {
    titolo: "Decreto esecutivo sulla riscossione e sugli interessi 2026",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/861",
    ente: RACCOLTA_TI,
  },
  dcIfdProvvisorio: {
    titolo: "Calcolo provvisorio dell'imposta federale diretta",
    url: "https://www4.ti.ch/dfe/dc/pagamenti/calcolo-provvisorio-imposta-federale-diretta",
    ente: DC,
  },

  // Dove chiedere aiuto
  fondounimpresa: {
    titolo: "Fondounimpresa: accompagnamento alla microimprenditorialità",
    url: "https://www.ifc.ti.ch/consulenze/fondounimpresa/accompagnamento/accompagnamento-alla-microimprenditorialita",
    ente: "Istituto della formazione continua (IFC), Ticino",
  },
  fondounimpresaGratuito: {
    titolo: "Fondounimpresa: avviare un'impresa in Svizzera",
    url: "https://www.ifc.ti.ch/consulenze/fondounimpresa/approfondimenti/dettaglio/avviare-unimpresa-in-svizzera",
    ente: "Istituto della formazione continua (IFC), Ticino",
  },
  fondounimpresaBreve: {
    titolo: "Fondounimpresa: accompagnamento breve",
    url: "https://www.ifc.ti.ch/consulenze/fondounimpresa/accompagnamento/accompagnamento-breve",
    ente: "Istituto della formazione continua (IFC), Ticino",
  },
  portaleImpresaServizi: {
    titolo: "Portale impresa: panoramica dei servizi",
    url: "https://www4.ti.ch/dfe/de/portale-impresa/portale-impresa/guida-ai-servizi/panoramica-dei-servizi",
    ente: "Cantone Ticino, Divisione dell'economia",
  },
  autoritaFiduciari: {
    titolo: "Autorità di vigilanza sull'esercizio delle professioni di fiduciario",
    url: "https://www4.ti.ch/di/dg/fiduciari/ufficio",
    ente: "Cantone Ticino",
  },
  // A chi chiedere aiuto (passo e lezione 9): ricontrollate il 18.10.2026, vedi VERIFICATO_AIUTO.
  fondounimpresaCorsi: {
    titolo: "Fondounimpresa: i corsi di imprenditorialità",
    url: "https://www.ifc.ti.ch/corsi-imprenditorialita",
    ente: "Istituto della formazione continua (IFC), Ticino",
  },
  pmiServiziSupporto: {
    titolo: "Costituire la propria impresa: consigli preliminari e servizi di supporto",
    url: "https://www.kmu.admin.ch/it/costituire-la-propria-impresa-consigli-preliminari-e-servizi-di-supporto",
    ente: PMI,
  },
  grCostituzioneStartup: {
    titolo: "Costituzione e start up (Grigioni)",
    url: "https://www.gr.ch/IT/istituzioni/amministrazione/dvs/awt/wirtschaftsstandort/Seiten/Gruendung_und_Startups.aspx",
    ente: "Cantone dei Grigioni, Ufficio dell'economia e del turismo",
  },
} as const satisfies Record<string, Fonte>;

/**
 * Data dell'ultimo controllo delle pagine del Portale PMI sulle forme
 * giuridiche (ditta individuale, nome collettivo, Sagl, SA, scelta della
 * forma, imposte) e degli artt. 621 e 773 CO.
 */
export const VERIFICATO_FORME = "2026-10-17";

/**
 * Data dell'ultimo controllo della check list del Portale PMI per creare una
 * Sagl (fonti.pmiChecklist), che la lezione 2 del corso segue punto per punto.
 */
export const VERIFICATO_CHECKLIST = "2026-10-17";

/**
 * Data dell'ultimo controllo dello statuto tipo Sagl del registro di commercio
 * e degli artt. 774, 776-779 e 809 CO, per i video facoltativi della lezione 2.
 * Lo statuto tipo è del 2008: precede la riforma del 2023 (per esempio oggi le
 * quote devono solo valere più di zero, art. 774 CO, e l'art. 776a è abrogato).
 */
export const VERIFICATO_DOCUMENTI_SAGL = "2026-10-17";

/**
 * Data dell'ultimo controllo delle fonti sul nome della ditta, per il passo
 * e la lezione 8: artt. 944-946, 950, 951 e 956 CO (testo in vigore dal
 * 01.10.2026; quello dal 01.07.2027 è uguale), pagina del registro di
 * commercio ticinese (iscrizione della ditta individuale), direttiva UFRC
 * sulle ditte del 01.04.2021, Portale PMI, Zefix, REGIX e pagine dell'IPI
 * sui marchi.
 */
export const VERIFICATO_NOME_DITTA = "2026-10-18";

/**
 * Data dell'ultimo controllo delle fonti sulle autorizzazioni (Portale PMI,
 * note informative della SEFRI, Polizia cantonale), per la lezione 3.
 */
export const VERIFICATO_AUTORIZZAZIONI = "2026-10-17";

/**
 * Data dell'ultimo controllo di LEAR (testo del 15.03.2023, stato 15.06.2023),
 * RLEAR e pagine della Polizia cantonale e della DFP sugli esercizi pubblici,
 * per il passo e la lezione 4.
 */
export const VERIFICATO_ESERCIZI_PUBBLICI = "2026-10-18";

function datoEserciziPubblici<T>(valore: T, fonte: Fonte, nota: string): Dato<T> {
  return { ...dato(valore, fonte, nota), verificatoIl: VERIFICATO_ESERCIZI_PUBBLICI };
}

/** Regole ticinesi sugli esercizi pubblici (LEAR e RLEAR). */
export const regoleEserciziPubblici = {
  alloggioSenzaLearPersone: datoEserciziPubblici(6, fontiPercorso.lear, "La LEAR non si applica alle strutture che offrono l'alloggio fino a 6 persone (art. 3 cpv. 1 lett. b LEAR)."),
  praticaGerenteAltroCantoneAnni: datoEserciziPubblici(3, fontiPercorso.lear, "Senza certificato di capacità riconosciuto, il gerente può attestare una pratica d'esercente di almeno tre anni svolta in un altro Cantone (art. 9 cpv. 2 lett. b LEAR)."),
  rcMinimaFranchi: datoEserciziPubblici(3_000_000, fontiPercorso.rlear, "Garanzia globale minima per sinistro, per lesioni corporali e danni materiali (art. 32 RLEAR)."),
  praticaDiplomaMesi: datoEserciziPubblici(5, fontiPercorso.rlear, "Oltre all'esame, pratica in Svizzera o all'estero, a tempo pieno o parziale, anche non consecutiva (art. 38 RLEAR)."),
  termineDomandaGiorni: datoEserciziPubblici(15, fontiPercorso.rlear, "La domanda di autorizzazione va presentata almeno 15 giorni prima dell'inizio dell'attività (art. 26 cpv. 2 RLEAR)."),
  tassaAutorizzazioneFranchi: datoEserciziPubblici({ min: 100, max: 500 }, fontiPercorso.rlear, "Tassa per il rilascio dell'autorizzazione (art. 60 RLEAR); per un aggiornamento CHF 100."),
} as const;

/**
 * Data dell'ultimo controllo delle fonti sul locale aperto al pubblico, per il
 * passo e la lezione 16: LAN (stato 01.10.2026: definizione di negozio, orari,
 * domeniche e festivi, deroghe, multa), RLAN (competenze, istanza di deroga,
 * tassa), legge edilizia (stato 01.01.2024: licenza edilizia anche per il
 * cambiamento di destinazione, Municipio, domanda), legge sugli impianti
 * pubblicitari e suo regolamento (insegne), OIP (stato 01.01.2025: indicazione
 * dei prezzi di merci e servizi), pagina della Polizia cantonale sulla patente
 * di vendita distillati e il suo elenco delle autorizzazioni, LEAR (art. 2:
 * anche la vendita di bevande distillate).
 */
export const VERIFICATO_LOCALI = "2026-10-18";

function datoLocali<T>(valore: T, fonte: Fonte, nota: string): Dato<T> {
  return { ...dato(valore, fonte, nota), verificatoIl: VERIFICATO_LOCALI };
}

/** Regole per un negozio o un locale aperto al pubblico in Ticino. */
export const regoleLocali = {
  orariNegozi: datoLocali(
    { apertura: "06.00", chiusuraFeriale: "19.00", chiusuraSabato: "18.30", chiusuraSerale: "21.00" },
    fontiPercorso.lan,
    "Dal lunedì al venerdì dalle 06.00 alle 19.00, il sabato dalle 06.00 alle 18.30 (art. 8 LAN). Apertura serale fino alle 21.00 ogni giovedì; se il giovedì è festivo, un altro giorno deciso dal Dipartimento a inizio anno, escluso il sabato (art. 9 LAN). La domenica e nei festivi ufficiali i negozi restano chiusi (art. 12 LAN), salvo le deroghe di legge (artt. 13-14).",
  ),
  chiusuraFestivaEccezioni: datoLocali(
    "18.00",
    fontiPercorso.lan,
    "Deroga di legge per la domenica e i festivi: panetterie, pasticcerie, confetterie e gelaterie, negozi di piante e fiori, gallerie d'arte e atelier che vendono opere d'arte possono aprire dalle 06.00 alle 18.00 (art. 14 cpv. 2 LAN). Altri negozi (chioschi sotto i 50 mq, cibi da asporto, negozi dei camping, …) fino alle 22.30 (art. 14 cpv. 1).",
  ),
  multaMassimaFranchi: datoLocali(20_000, fontiPercorso.lan, "Chi contravviene alla legge sull'apertura dei negozi è punibile con una multa fino a 20'000 franchi (art. 17 LAN)."),
  termineDerogaGiorni: datoLocali(
    30,
    fontiPercorso.rlan,
    "L'istanza di deroga agli orari va presentata per scritto almeno 30 giorni prima dell'evento, con una motivazione succinta e i giorni e le ore (art. 4 RLAN). La decide l'Ufficio dell'ispettorato del lavoro per esposizioni, inaugurazioni, ricorrenze e anniversari, la Divisione dell'economia per le manifestazioni culturali, sportive o popolari (art. 2 RLAN).",
  ),
  tassaDerogaFranchi: datoLocali(
    { base: 300, perGiornoInPiu: 20, max: 1_000 },
    fontiPercorso.rlan,
    "Tassa per l'autorizzazione di apertura in deroga: 300 franchi più 20 franchi per ogni giorno in più, al massimo 1000 franchi (art. 5 RLAN; art. 20 LAN).",
  ),
  targaSenzaAutorizzazioneMq: datoLocali(
    0.5,
    fontiPercorso.regolamentoImpiantiPubblicitari,
    "Non sono impianti pubblicitari (e quindi non serve l'autorizzazione del Municipio) le targhe non luminose fino a 0,5 mq, sull'edificio dove ha sede l'attività, con solo il nome o la ragione sociale, la qualifica e il logo, e le scritte incollate o dipinte sulle vetrine riferite all'attività (art. 1 cpv. 2 del regolamento). Le altre insegne visibili dall'area pubblica richiedono l'autorizzazione del Municipio (art. 3 della legge), con il formulario ufficiale (art. 3 del regolamento).",
  ),
  gradazioneDistillati: datoLocali(
    { bevande: 0.15, vini: 0.18 },
    fontiPercorso.poliziaDistillati,
    "Per vendere prodotti alcolici con più del 15% del volume (per i vini più del 18%) serve la patente di vendita distillati della Polizia cantonale. Per la birra non serve.",
  ),
  termineDistillatiGiorni: datoLocali(
    15,
    fontiPercorso.poliziaDistillati,
    "La domanda di patente va presentata almeno 15 giorni prima dell'inizio della vendita. Tassa annua: CHF 175 per metro cubo di esposizione di vendita (art. 63 RLEAR); rilascio CHF 100.",
  ),
} as const;

/**
 * Data dell'ultimo controllo di ODerr (artt. 2, 20, 21, 73 e 74, stato
 * 01.07.2025), delle schede del Laboratorio cantonale ticinese, del suo
 * formulario e della pagina dei Grigioni sulla notifica, per il passo e la
 * lezione 5.
 */
export const VERIFICATO_ALIMENTI = "2026-10-18";

/** Notifica delle attività con le derrate alimentari. */
export const regoleAlimenti = {
  verificaRegistrazioneSettimane: {
    ...dato(2, fontiPercorso.formularioNotificaDerrate, "Il Laboratorio cantonale non manda una conferma: circa 2 settimane dopo l'invio del formulario si può verificare la registrazione sul suo sito."),
    verificatoIl: VERIFICATO_ALIMENTI,
  },
} as const;

/**
 * Data dell'ultimo controllo delle fonti sulle attività sanitarie in Ticino,
 * per il passo e la lezione 6: LSan (stato 01.06.2025), regolamento delle
 * tasse (stato 01.01.2026), regolamento sull'estetista, pagine dell'Ufficio di
 * sanità (procedure, documenti, altro Cantone, FAQ sui terapisti
 * complementari, AOMS), nota della SEFRI sulle terapie complementari (gennaio
 * 2020) e artt. 35-36 LAMal (stato 01.07.2026).
 */
export const VERIFICATO_SANITA = "2026-10-18";

function datoSanita<T>(valore: T, fonte: Fonte, nota: string): Dato<T> {
  return { ...dato(valore, fonte, nota), verificatoIl: VERIFICATO_SANITA };
}

/** Regole ticinesi sull'autorizzazione di libero esercizio delle professioni sanitarie. */
export const regoleSanita = {
  tassaProfessioniAccademicheFranchi: datoSanita(
    { min: 600, max: 1_200 },
    fontiPercorso.tasseSanita,
    "Libero esercizio delle professioni sanitarie con formazione accademica (art. 2 lett. b del regolamento sulle tasse). La tassa si paga in anticipo (art. 1 cpv. 2); l'importo definitivo lo stabilisce la decisione.",
  ),
  tassaAltreProfessioniFranchi: datoSanita(
    { min: 400, max: 600 },
    fontiPercorso.tasseSanita,
    "Libero esercizio delle altre professioni sanitarie e dei terapisti complementari (art. 2 lett. c del regolamento sulle tasse).",
  ),
  validitaDocumentiMesi: datoSanita(
    3,
    fontiPercorso.sanitaDocumenti,
    "Estratto del casellario giudiziale, certificato medico di buona salute e certificato di good professional standing: validità di 3 mesi.",
  ),
  multaMassimaFranchi: datoSanita(
    100_000,
    fontiPercorso.lsan,
    "Le infrazioni alla legge sanitaria e ai suoi regolamenti sono punite con la multa fino a CHF 100'000; quelle intenzionali gravi fino a CHF 500'000 (art. 95 LSan).",
  ),
} as const;

/** L'Ufficio di sanità ticinese, che rilascia l'autorizzazione di libero esercizio. */
export const ufficioSanitaTicino = datoSanita(
  { nome: "Ufficio di sanità", indirizzo: "Via Orico 5, 6501 Bellinzona", luogo: "Bellinzona" },
  fontiPercorso.sanitaLiberoEsercizio,
  "La documentazione per il libero esercizio si invia su carta (A4, senza fermagli, punti metallici o nastro adesivo).",
);

/**
 * Data dell'ultimo controllo delle fonti sul permesso per lavorare in proprio,
 * per il passo e la lezione 7: avvertenze (09.2024) e pagine dell'Ufficio della
 * migrazione ticinese, schede, FAQ e Istruzioni OLCP (01/2026) della SEM, LStrI
 * artt. 19 e 38 (stato 12.06.2026, uguali nella versione dal 01.11.2026),
 * Portale PMI («Mettersi in proprio», punti 6 e 7), pagina e promemoria
 * dell'Ufficio della migrazione e del diritto civile dei Grigioni.
 */
export const VERIFICATO_PERMESSI = "2026-10-18";

function datoPermessi<T>(valore: T, fonte: Fonte, nota: string): Dato<T> {
  return { ...dato(valore, fonte, nota), verificatoIl: VERIFICATO_PERMESSI };
}

/** Permessi per lavorare in proprio (cittadini UE/AELS e frontalieri). */
export const regolePermessi = {
  durataPermessoIndipendentiAnni: datoPermessi(5, fontiPercorso.semSoggiornoAttivita, "Primo permesso B UE/AELS per chi si stabilisce in Svizzera come indipendente, se dimostra l'attività già con la domanda. Anche il permesso G UE/AELS per i frontalieri indipendenti vale 5 anni (scheda SEM «Frontalieri»; avvertenze dell'Ufficio della migrazione per i permessi B e G)."),
  rientroFrontalieri: datoPermessi("almeno una volta alla settimana", fontiPercorso.semFrontalieri, "Il frontaliere torna al suo domicilio all'estero di norma ogni giorno, o almeno una volta alla settimana."),
  notificaCambiamentiGiorni: datoPermessi(14, fontiPercorso.umIndipendentiUeAelsB, "Cambiamenti di indirizzo, nazionalità, nome, Comune o Cantone, stato civile o famiglia: da notificare all'Ufficio della migrazione entro 14 giorni (lo stesso termine vale con il permesso G)."),
  rinnovoPrimaDellaScadenzaGiorni: datoPermessi(14, fontiPercorso.umIndipendentiUeAelsB, "Il rinnovo del permesso va chiesto all'Ufficio della migrazione almeno 14 giorni prima della scadenza (anche con il permesso G)."),
} as const;

/**
 * Data dell'ultimo controllo delle fonti sullo statuto di indipendente nei
 * settori della Suva, per il passo e la lezione 10: pagine della Suva
 * (accertamento, decisione, assicurazione per imprenditori), LAINF art. 66 e
 * OAINF art. 73 (stato 01.01.2026), pagina «Cosa significa indipendenza?» e
 * «Presentare una domanda» di indipendente.ch, Promemoria AVS 2.02 (stato
 * 01.01.2026).
 */
export const VERIFICATO_SUVA = "2026-10-18";

function datoSuva<T>(valore: T, fonte: Fonte, nota: string): Dato<T> {
  return { ...dato(valore, fonte, nota), verificatoIl: VERIFICATO_SUVA };
}

/** L'accertamento della Suva: indipendente o dipendente. */
export const regoleSuva = {
  termineDocumentiGiorni: datoSuva(
    30,
    fontiPercorso.suvaAccertamento,
    "Quando la Suva chiede la documentazione ci sono 30 giorni per mandarla. Se manca qualche documento si mandano quelli che si hanno; se necessario la Suva proroga il termine.",
  ),
  termineOpposizioneGiorni: datoSuva(
    30,
    fontiPercorso.suvaDecisione,
    "Contro una decisione della Suva (per esempio sullo statuto di dipendente) si può fare opposizione scritta entro 30 giorni. La Suva consiglia di parlarne prima con la sua agenzia.",
  ),
} as const;

/**
 * Data dell'ultimo controllo delle fonti sull'assicurazione infortuni, per il
 * passo e la lezione 12: LAINF artt. 1a, 3, 4, 16-17, 66, 69 e 91 (stato
 * 01.01.2026), OAINF artt. 8, 13, 22 e 134-139 (stato 01.01.2026, e testo in
 * vigore dal 01.01.2027 con la modifica del 26.08.2026), LAMal artt. 1a, 8,
 * 10, 28, 64 e 67 (stato 01.07.2026), pagine della Suva (assicurazione per
 * imprenditori, prestazioni e premi), del Portale PMI e dell'UFSP, promemoria
 * AVS 2.02 (stato 01.01.2026).
 */
export const VERIFICATO_INFORTUNI = "2026-10-18";

function datoInfortuni<T>(valore: T, fonte: Fonte, nota: string): Dato<T> {
  return { ...dato(valore, fonte, nota), verificatoIl: VERIFICATO_INFORTUNI };
}

/** Assicurazione contro gli infortuni (LAINF e OAINF). */
export const regoleInfortuni = {
  oreSettimanaliNonProfessionali: datoInfortuni(
    8,
    fontiPercorso.oainf13,
    "Chi lavora almeno 8 ore alla settimana per lo stesso datore di lavoro è assicurato anche contro gli infortuni non professionali (art. 13 OAINF, pagina dell'UFSP). Sotto questo minimo è infortunio professionale anche quello sul tragitto per il lavoro.",
  ),
  coperturaDopoImpiegoGiorni: datoInfortuni(
    31,
    fontiPercorso.lainf3,
    "L'assicurazione del datore di lavoro termina allo spirare del 31° giorno dopo quello in cui cessa il diritto almeno a metà del salario (art. 3 cpv. 2 LAINF).",
  ),
  prolungamentoMesi: datoInfortuni(
    6,
    fontiPercorso.lainf3,
    "L'assicuratore deve offrire di prolungare l'assicurazione, con un accordo speciale, fino a 6 mesi (art. 3 cpv. 3 LAINF). Vale per gli infortuni non professionali e l'accordo va concluso prima che l'assicurazione finisca (art. 8 OAINF).",
  ),
  indennitaGiornaliera: datoInfortuni(
    0.8,
    fontiPercorso.lainf17,
    "Con un'incapacità lavorativa totale l'indennità giornaliera è l'80% del guadagno assicurato, dal terzo giorno dopo l'infortunio (artt. 16-17 LAINF). Nell'assicurazione per imprenditori della Suva si può scegliere di riceverla dal 15° o dal 30° giorno, con uno sconto sul premio.",
  ),
  guadagnoMassimoAssicurato: datoInfortuni(
    148_200,
    fontiPercorso.oainf138,
    "Importo massimo del guadagno assicurato all'anno (art. 22 cpv. 1 OAINF); uguale nel testo in vigore dal 01.01.2027.",
  ),
  /** Guadagno assicurato minimo di un indipendente nell'assicurazione facoltativa, per anno. */
  guadagnoMinimoIndipendenti: {
    2026: datoInfortuni(
      66_690,
      fontiPercorso.oainf138,
      "Il 45% del guadagno massimo assicurato (art. 138 OAINF, testo in vigore nel 2026). Lo stesso importo è sulla pagina dei premi della Suva.",
    ),
    2027: datoInfortuni(
      44_460,
      fontiPercorso.oainfModifica2027,
      "Dal 01.01.2027 il minimo è il 30% del guadagno massimo assicurato, e gli assicuratori possono adeguarlo al grado di occupazione (art. 138 OAINF, modifica del 26.08.2026).",
    ),
  },
} as const;
/**
 * Data dell'ultimo controllo delle fonti sul riconoscimento come indipendente
 * presso la cassa AVS, per il passo e la lezione 11: promemoria 2.02 (stato
 * 01.01.2026, edizione novembre 2025: criteri, tassi, contributo minimo,
 * attività accessoria, acconti e contributi definitivi), pagine
 * «Presentare una domanda», «Cosa succede ora?» e «Cosa significa
 * indipendenza?» di selbststaendig-erwerbend.ch (www.indipendente.ch, citato
 * dal promemoria, rimanda lì), pagina dell'IAS sull'affiliazione, art. 64
 * LAVS (stato 01.01.2026), elenco delle casse cantonali, Portale PMI
 * («Mettersi in proprio», punti 3-5) e importi UFAS dal 01.01.2027.
 * I valori usati (avsIndipendenti, regolePercorso.attivitaAccessoriaAvs,
 * uffici.cassaCompensazioneTicino) corrispondono a queste fonti.
 */
export const VERIFICATO_AVS_INDIPENDENTI = "2026-10-18";
/**
 * Data dell'ultimo controllo delle fonti su chi può aiutare chi apre
 * un'attività, per il passo e la lezione 9: pagine di Fondounimpresa
 * (accompagnamento, accompagnamento breve, «servizio pubblico gratuito»,
 * corsi a pagamento), Portale impresa del Cantone Ticino, LFid (artt. 1-3),
 * pagina e albo online dell'Autorità di vigilanza sui fiduciari, legge di
 * applicazione della LAVS (agenzie comunali, artt. 3 e 6), Portale PMI
 * (mettersi in proprio, servizi di supporto, EasyGov) e pagina dell'Ufficio
 * dell'economia e del turismo dei Grigioni sulla costituzione d'impresa.
 */
export const VERIFICATO_AIUTO = "2026-10-18";

/**
 * Data dell'ultimo controllo delle fonti sul registro di commercio, per il
 * passo e la lezione 13: CO artt. 931, 936, 936a, 938, 940, 946, 954a e 957
 * (testo in vigore dal 01.10.2026), OEmol-RC (stato 01.01.2021, ultimo
 * testo: allegato n. 1.1), LEF artt. 39-40, 42, 97 e 197 (stato 01.01.2026),
 * pagine dell'Ufficio del registro di commercio ticinese (iscrizione della
 * ditta individuale, tasse cantonali, contatti), tariffa notarile ticinese
 * (art. 17), EasyGov e Portale PMI (iscrizione e nome, ditta individuale).
 */
export const VERIFICATO_REGISTRO = "2026-10-18";

function datoRegistro<T>(valore: T, fonte: Fonte, nota: string): Dato<T> {
  return { ...dato(valore, fonte, nota), verificatoIl: VERIFICATO_REGISTRO };
}

/** Registro di commercio: cosa succede se non ti iscrivi, i debiti, la firma dal notaio. */
export const regoleRegistro = {
  multaMancataIscrizioneFranchi: datoRegistro(
    5_000,
    fontiPercorso.co940,
    "Chi deve iscriversi e non lo fa riceve dall'ufficio del registro di commercio un termine; se non lo rispetta, l'ufficio lo iscrive d'ufficio (art. 938 CO) e, se l'aveva diffidato con questa comminatoria, può punirlo con un'ammenda fino a CHF 5'000 (art. 940 CO).",
  ),
  fallimentoDopoCancellazioneMesi: datoRegistro(
    6,
    fontiPercorso.lef39,
    "Chi è iscritto come titolare di una ditta è soggetto all'esecuzione in via di fallimento (art. 39 LEF), e lo resta per sei mesi dalla pubblicazione della cancellazione nel Foglio ufficiale svizzero di commercio (art. 40 LEF).",
  ),
  autenticazioneFirmaNotaioMassimoFranchi: datoRegistro(
    30,
    fontiPercorso.tariffaNotarile,
    "Onorario massimo del notaio ticinese per autenticare le firme; per ogni firma oltre la seconda al massimo CHF 20 (art. 17 della tariffa notarile).",
  ),
} as const;

/**
 * Data dell'ultimo controllo delle fonti sulla vendita online, per il passo e
 * la lezione 15: art. 3 cpv. 1 lett. s e cpv. 2 LCSl (stato 01.01.2025),
 * artt. 3, 4 e 10 OIP (stato 01.01.2025), art. 19 LPD (stato 07.07.2025),
 * art. 954a CO (stato 01.10.2026), pagina «Acquisti online» della SECO e
 * pagine del Portale PMI sull'e-commerce (obblighi legali, protezione dei
 * dati, diritto di recesso, condizioni generali). Nessuna cifra: solo regole.
 */
export const VERIFICATO_SITO_ONLINE = "2026-10-18";

/** IVA: date e periodi minimi (passo e lezione 14), con quelli in `regole` e `regolePercorso`. */
export const regoleIva = {
  aliquoteInVigoreDal: datoIva(
    "2024-01-01",
    fonti.afcAliquote,
    "Le aliquote di `aliquoteIva` (normale 8,1%, ridotta 2,6%, alloggio 3,8%) si applicano dal 01.01.2024 (pagina dell'AFC e art. 25 LIVA).",
  ),
  periodiMinimiIscrizioneVolontaria: datoIva(
    1,
    fontiPercorso.liva11,
    "Chi si iscrive all'IVA senza esservi obbligato (rinuncia all'esenzione) deve restare iscritto almeno per un periodo fiscale (art. 11 cpv. 2 LIVA), cioè un anno civile (art. 34 LIVA). L'iscrizione vale al più presto dall'inizio del periodo fiscale in corso (art. 14 cpv. 4 LIVA).",
  ),
  periodiEffettivoSenzaAliquotaSaldo: datoIva(
    3,
    fontiPercorso.oiva78,
    "Se l'aliquota saldo non è chiesta entro il termine di regolePercorso.termineMetodoIvaGiorni giorni, si applica il metodo di rendiconto effettivo per almeno tre periodi fiscali interi prima di poterla chiedere (art. 78 cpv. 3 OIVA).",
  ),
  periodiAttesaRendicontoAnnuale: datoIva(
    1,
    fontiPercorso.oiva76a,
    "Passato il termine, il rendiconto annuale si può chiedere al più presto dopo un periodo fiscale (art. 76a cpv. 3 OIVA).",
  ),
  mesiRendiconto: datoIva(
    { effettivo: 3, aliquotaSaldo: 6 },
    fontiPercorso.pmiIva,
    "Di norma il rendiconto IVA si fa ogni trimestre; con il metodo dell'aliquota saldo ogni semestre (art. 35 cpv. 1 LIVA; Portale PMI e pagina dell'AFC sulle aliquote saldo). Su richiesta si può fare ogni mese o, con il rendiconto annuale, una volta all'anno.",
  ),
} as const;

/**
 * Data dell'ultimo controllo delle fonti sulle fatture, per il passo e la
 * lezione 17: LIVA artt. 26, 27 e 70 (stato 31.03.2025), CO artt. 954a, 957,
 * 957a e 958f (testo in vigore dal 01.10.2026), pagine dell'AFC sul numero IVA
 * (IDI) e dell'UST «L'IDI in generale», pagina della SIX sulla QR-fattura
 * (polizze sostituite, sezione pagamento e ricevuta, come si paga, generatori
 * gratuiti, solo indirizzo strutturato dal 22.11.2025) e linee guida SIX
 * per la QR-fattura, versione 2.3 (QR-IID, importo, indirizzo strutturato).
 * Anche i dati della QR-fattura in datiStrumenti corrispondono a queste fonti.
 */
export const VERIFICATO_FATTURE = "2026-10-18";

function datoFatture<T>(valore: T, fonte: Fonte, nota: string): Dato<T> {
  return { ...dato(valore, fonte, nota), verificatoIl: VERIFICATO_FATTURE };
}

/** Fatture: il numero IVA e la QR-fattura. */
export const regoleFatture = {
  formatoNumeroIva: datoFatture(
    "CHE-123.456.789 IVA",
    fontiPercorso.afcIdi,
    "Il numero IVA è il numero IDI con il complemento «IVA»; al posto di IVA si può scrivere TVA o MWST, ma non l'inglese VAT. L'IDI è composto dalla sigla del Paese «CHE» e da nove cifre (UST, «L'IDI in generale»).",
  ),
  qrFatturaDal: datoFatture(
    "2022-10-01",
    fonti.six,
    "La QR-fattura, in circolazione da giugno 2020, ha sostituito definitivamente le polizze di versamento svizzere il 01.10.2022.",
  ),
} as const;

/** Regole e importi usati dal percorso guidato. */
export const regolePercorso = {
  mesiPerIvaDaSubito: datoIva(
    12,
    fonti.liva14,
    "Se all'avvio è presumibile superare la soglia IVA entro 12 mesi, si è assoggettati da subito (art. 14 cpv. 3 LIVA, art. 9 OIVA). Chi è già attivo ed esentato lo diventa allo scadere dell'esercizio in cui raggiunge la soglia; se l'attività non è durata tutto l'anno, la cifra d'affari è riportata su un anno intero (art. 9 cpv. 3 OIVA).",
  ),
  termineMetodoIvaGiorni: datoIva(
    60,
    fontiPercorso.oiva78,
    "Giorni dalla comunicazione del numero IVA per chiedere l'aliquota saldo (art. 78 OIVA) o il rendiconto annuale (art. 76a OIVA).",
  ),
  attivitaAccessoriaAvs: dato(2_500, fonti.avsPromemoria202, "Reddito annuo da attività indipendente accessoria fino al quale i contributi si pagano solo su richiesta."),
  accontiAvs: dato(
    { giorno: 10, mesi: [1, 4, 7, 10] },
    fonti.avsPromemoria202,
    "Acconti trimestrali entro il 10° giorno dalla fine di ogni trimestre.",
  ),
  sogliaAccontiAvs: dato(0.75, fontiPercorso.oavs41bis, "Se gli acconti sono inferiori al 75% dei contributi definitivi, gli interessi di mora decorrono dal 1° gennaio del secondo anno dopo l'anno di contribuzione."),
  interesseMoraAvs: dato(0.05, fontiPercorso.oavs42),
  variazioneRedditoIas: dato(0.25, fontiPercorso.iasAcconti, "Variazione del reddito, in più o in meno, da segnalare alla cassa."),
  termineConguaglioAvsGiorni: dato(30, fonti.avsPromemoria202),
  conservazioneDocumentiAnni: dato(10, fonti.co958f),
  autenticazioneFirmaRcTicino: dato(20, fontiPercorso.rcTicinoTasseCantonali, "Allo sportello dell'Ufficio RC (legalizzazione di una firma)."),
  ifdRataUnicaTicino: dato({ giorno: 31, mese: 3 }, fontiPercorso.dcIfdProvvisorio, "Termine di pagamento della rata unica del calcolo provvisorio IFD."),
  /** Termini di pagamento degli acconti dell'imposta cantonale, per anno. Il decreto 2027 esce di solito a novembre. */
  accontiCantonaliTicino: {
    2026: dato(
      ["2026-05-31", "2026-07-31", "2026-09-30"],
      fontiPercorso.dcAccontoCantonale,
      "Scadenze 1.5, 1.7 e 1.9; si paga entro 30 giorni (decreto esecutivo del 19.11.2025).",
    ),
  } as Partial<Record<number, Dato<string[]>>>,
  termineDichiarazioneTicino2025: dato("2026-04-30", fontiPercorso.istruzioniPf2025, "Il termine vale per la dichiarazione 2025; quello della dichiarazione 2026 non è ancora pubblicato."),
  fondounimpresa: {
    ...dato(
      { oreMassime: 15, anniMassimi: 2 },
      fontiPercorso.fondounimpresa,
      "Per cittadini svizzeri o stranieri con permesso B o C residenti in Ticino o nella Regione Moesa. Non comprende contabilità, corrispondenza e dichiarazione d'imposta. L'IFC lo definisce un servizio pubblico gratuito (pagina fondounimpresaGratuito); i corsi invece si pagano (pagina fondounimpresaCorsi). Anche l'accompagnamento breve, per chi ha già avviato l'attività, è di 15 ore sull'arco di 2 anni (pagina fondounimpresaBreve).",
    ),
    verificatoIl: VERIFICATO_AIUTO,
  },
} as const;

/** Uffici e servizi citati nel percorso guidato. */
export const ufficiPercorso = {
  esazioneCondoniTicino: dato(
    {
      nome: "Ufficio esazione e condoni",
      indirizzo: "Viale S. Franscini 6, Bellinzona",
      telefono: "+41 91 814 40 21",
      email: "dfe-dc.uec@ti.ch",
    },
    fontiPercorso.dcRichiestaAcconto,
  ),
  iasContributiPersonali: dato(
    {
      nome: "IAS, Servizio contributi personali",
      email: "personali@ias.ti.ch",
      telefono: "+41 91 821 92 04",
      telefonoAffiliazioni: "+41 91 821 92 88",
    },
    fontiPercorso.iasAcconti,
  ),
  laboratorioCantonaleTicino: dato(
    {
      nome: "Laboratorio cantonale",
      indirizzo: "Via Mirasole 22, 6500 Bellinzona",
      telefono: "+41 91 814 61 11",
      email: "dss-lc@ti.ch",
    },
    fontiPercorso.laboratorioCantonaleNotifica,
    "Riceve le notifiche delle attività alimentari (art. 20 ODerr). Non manda una conferma: dopo circa 2 settimane la registrazione si controlla sul suo sito.",
  ),
  migrazioneTicino: datoPermessi(
    { nome: "Ufficio della migrazione", sezione: "Sezione della popolazione", telefono: "+41 91 814 55 00", email: "di-sp.migrazione@ti.ch" },
    fontiPercorso.umRichiestaPermessoB,
    "Contact center dei permessi per stranieri, dal lunedì al venerdì 08:00-12:00 e 13:30-17:00. La domanda si presenta con la procedura online della pagina.",
  ),
  fondounimpresa: {
    ...dato(
      { nome: "Fondounimpresa", luogo: "Camorino", telefono: "+41 91 814 16 71", email: "fondounimpresa@edu.ti.ch" },
      fontiPercorso.portaleImpresaServizi,
      "Indirizzo da confermare: il Portale impresa indica Ala Munda 35, il sito IFC Ala Munda 41 (ancora così il 18.10.2026). L'iscrizione si fa con il formulario online della pagina fontiPercorso.fondounimpresa.",
    ),
    verificatoIl: VERIFICATO_AIUTO,
  },
} as const;

// ---------------------------------------------------------------------------
// Strumenti (tariffa oraria, budget, preventivo e fattura). Aggiunti il
// 15.10.2026: i valori della tavola scalare AVS sono in avs-tavola-scalare.ts.
// ---------------------------------------------------------------------------

/** Fonti usate solo dagli strumenti in /strumenti. */
export const fontiStrumenti = {
  lavs8: {
    titolo: "Legge sull'AVS (LAVS), art. 8: contributi degli indipendenti",
    url: `${LAVS}#art_8`,
    ente: "Confederazione (Fedlex)",
  },
  oavs21: {
    titolo: "Ordinanza sull'AVS (OAVS), art. 21: tavola scalare dei contributi",
    url: "https://www.fedlex.admin.ch/eli/cc/63/1185_1183_1185/it#art_21",
    ente: "Confederazione (Fedlex)",
  },
  adeguamentiAvs2027: {
    titolo: "Ordinanze sugli adeguamenti AVS/AI/IPG dal 2027 (testo provvisorio)",
    url: "https://cms.news.admin.ch/fileservice/sdweb-docs-prod-nsbcch-files/files/2026/10/02/10735a88-7905-4354-9b3f-2b4a118acd39.pdf",
    ente: "Consiglio federale",
  },
  ufasContributi: {
    titolo: "Contributi: panoramica e calcolatore",
    url: "https://www.bsv.admin.ch/it/contributi-panoramica",
    ente: "Ufficio federale delle assicurazioni sociali (UFAS)",
  },
  lafam16: {
    titolo: "Legge sugli assegni familiari (LAFam), art. 16",
    url: "https://www.fedlex.admin.ch/eli/cc/2008/51/it#art_16",
    ente: "Confederazione (Fedlex)",
  },
  afcCalcolatoreImposte: {
    titolo: "Calcolatore d'imposta",
    url: "https://www.estv.admin.ch/it/calcolatore-d-imposta-calcolare-le-imposte",
    ente: "Amministrazione federale delle contribuzioni (AFC)",
  },
  liva26: { titolo: "Legge sull'IVA, art. 26", url: `${LIVA}#art_26`, ente: "Confederazione (Fedlex)" },
  afcIdi: {
    titolo: "Numero d'identificazione delle imprese (IDI)",
    url: "https://www.estv.admin.ch/it/numero-identificazione-delle-imprese-idi",
    ente: "Amministrazione federale delle contribuzioni (AFC)",
  },
  co954a: { titolo: "Codice delle obbligazioni, art. 954a", url: `${CO}#art_954_a`, ente: "Confederazione (Fedlex)" },
  sixLineeGuidaQr: {
    titolo: "Swiss Implementation Guidelines for the QR-bill, versione 2.3",
    url: "https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.3-en.pdf",
    ente: "SIX",
  },
} as const satisfies Record<string, Fonte>;

/** Dati usati dagli strumenti, oltre a quelli già sopra. */
export const datiStrumenti = {
  guadagnoMassimoAssegniFamiliari: dato(
    148_200,
    fonti.iasAliquote2025,
    "Il contributo per gli assegni familiari si calcola solo fino al guadagno massimo assicurato LAINF (LAFam art. 16 cpv. 4). Valore del foglio IAS 2025.",
  ),
  arrotondamentoRedditoAvs: dato(
    100,
    fontiStrumenti.lavs8,
    "Per il calcolo del contributo il reddito è arrotondato al multiplo di 100 franchi immediatamente inferiore (art. 8 cpv. 1 LAVS).",
  ),
  limiteAttivitaAccessoria: dato(
    2_500,
    fonti.avsPromemoria202,
    "Attività indipendente accessoria: fino a questo reddito annuo i contributi AVS/AI/IPG si pagano solo se li chiedi tu (punto 6).",
  ),
  quotaMassimaPilastro3a: dato(
    0.2,
    fonti.opp3,
    "Senza cassa pensione il versamento 3a deducibile è al massimo il 20% del reddito da attività lucrativa, entro l'importo massimo dell'anno.",
  ),
  qrIid: datoFatture(
    { da: 30_000, a: 31_999 },
    fontiStrumenti.sixLineeGuidaQr,
    "I QR-IBAN hanno un QR-IID tra 30000 e 31999 (cap. 2.8) e si usano solo con il riferimento QR (QRR).",
  ),
  importoQr: datoFatture(
    { minimo: 0.01, massimo: 999_999_999.99 },
    fontiStrumenti.sixLineeGuidaQr,
    "Importo ammesso nella sezione pagamento, in CHF o EUR (cap. 3.5.3 e 3.6.3).",
  ),
  indirizzoStrutturatoQr: datoFatture(
    "2025-11-22",
    fonti.six,
    "Dal 22.11.2025 nella QR-fattura è ammesso solo l'indirizzo strutturato (tipo S): NPA, località e paese obbligatori.",
  ),
} as const;
