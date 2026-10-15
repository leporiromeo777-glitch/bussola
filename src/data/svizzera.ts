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

const CO = "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/it";
const LIVA = "https://www.fedlex.admin.ch/eli/cc/2009/615/it";

export const fonti = {
  co931: { titolo: "Codice delle obbligazioni, art. 931", url: `${CO}#art_931`, ente: "Confederazione (Fedlex)" },
  co945: { titolo: "Codice delle obbligazioni, art. 945", url: `${CO}#art_945`, ente: "Confederazione (Fedlex)" },
  co957: { titolo: "Codice delle obbligazioni, art. 957", url: `${CO}#art_957`, ente: "Confederazione (Fedlex)" },
  co958f: { titolo: "Codice delle obbligazioni, art. 958f", url: `${CO}#art_958_f`, ente: "Confederazione (Fedlex)" },
  co773: { titolo: "Codice delle obbligazioni, art. 773", url: `${CO}#art_773`, ente: "Confederazione (Fedlex)" },
  co621: { titolo: "Codice delle obbligazioni, art. 621", url: `${CO}#art_621`, ente: "Confederazione (Fedlex)" },
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
    ente: "Casse di compensazione AVS",
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
  sogliaIva: dato(100_000, fonti.liva10, "Cifra d'affari annua, in Svizzera e all'estero, da prestazioni non escluse dall'imposta."),
  termineAnnuncioIvaGiorni: dato(30, fonti.liva66, "Giorni dall'inizio dell'assoggettamento per annunciarsi all'AFC."),
  sogliaContabilitaSemplificata: dato(500_000, fonti.co957, "Sotto questa cifra d'affari la ditta individuale può tenere solo entrate, uscite e situazione patrimoniale."),
  capitaleMinimoSagl: dato(20_000, fonti.co773),
  capitaleMinimoSa: dato(100_000, fonti.co621),
} as const;

/** Aliquote IVA in vigore dal 1.1.2024. */
export const aliquoteIva = dato(
  { normale: 0.081, ridotta: 0.026, alloggio: 0.038 },
  fonti.afcAliquote,
  "Il 29.11.2026 si vota un aumento di 0,4 punti dell'aliquota normale, non prima del 2028.",
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
    "Valori decisi dal Consiglio federale il 2.10.2026, in vigore dal 1.1.2027.",
  ),
};

/** Supplementi della cassa cantonale ticinese (IAS) sul reddito soggetto AVS. */
export const supplementiTicino = {
  speseAmministrative: dato(0.02, fonti.iasAliquote2025, "Percentuale dei contributi AVS/AI/IPG. Valore 2025, ultimo foglio pubblicato dall'IAS."),
  assegniFamiliari: dato(0.0085, fonti.iasAf2026, "Cassa cantonale AF, 2026. Le casse professionali possono avere aliquote diverse."),
  assegnoIntegrativo: dato(0.0015, fonti.lafTicino73),
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
// Strumenti (tariffa oraria, budget, preventivo e fattura). Aggiunti il
// 15.10.2026: i valori della tavola scalare AVS sono in avs-tavola-scalare.ts.
// ---------------------------------------------------------------------------

/** Fonti usate solo dagli strumenti in /strumenti. */
export const fontiStrumenti = {
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
  qrIid: dato(
    { da: 30_000, a: 31_999 },
    fontiStrumenti.sixLineeGuidaQr,
    "I QR-IBAN hanno un QR-IID tra 30000 e 31999 (cap. 2.8) e si usano solo con il riferimento QR (QRR).",
  ),
  importoQr: dato(
    { minimo: 0.01, massimo: 999_999_999.99 },
    fontiStrumenti.sixLineeGuidaQr,
    "Importo ammesso nella sezione pagamento, in CHF o EUR (cap. 3).",
  ),
  indirizzoStrutturatoQr: dato(
    "2025-11-22",
    fonti.six,
    "Dal 22.11.2025 nella QR-fattura è ammesso solo l'indirizzo strutturato (tipo S): NPA, località e paese obbligatori.",
  ),
} as const;
