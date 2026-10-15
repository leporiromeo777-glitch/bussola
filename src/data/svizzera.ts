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
  sogliaContabilitaSemplificata: dato(500_000, fonti.co957, "Con una cifra d'affari inferiore a questa nell'ultimo esercizio la ditta individuale può tenere solo entrate, uscite e situazione patrimoniale; da CHF 500'000 esatti serve la contabilità completa."),
  capitaleMinimoSagl: dato(20_000, fonti.co773),
  capitaleMinimoSa: dato(100_000, fonti.co621),
} as const;

/** Aliquote IVA in vigore dal 1.1.2024. */
export const aliquoteIva = dato(
  { normale: 0.081, ridotta: 0.026, alloggio: 0.038 },
  fonti.afcAliquote,
  "Il 29.11.2026 si vota un aumento dell'aliquota normale all'8,5% e di quella per l'alloggio al 4%, non prima del 2028. L'aliquota per l'alloggio vale per legge fino al 31.12.2027; il Parlamento l'ha prorogata al 31.12.2031 (termine di referendum 21.1.2027). Dopo il numero IVA si scrive IVA, MWST o TVA, non VAT.",
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
// Percorso guidato (questionario e checklist): fonti, dati e uffici in più.
// Ricerca del 15.10.2026; Zefix, uffici RC ed EasyGov ricontrollati online
// lo stesso giorno.
// ---------------------------------------------------------------------------

const LT_TICINO = "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/580";
const OIVA = "https://www.fedlex.admin.ch/eli/cc/2009/828/it";
const LAVS = "https://www.fedlex.admin.ch/eli/cc/63/837_843_843/it";
const OAVS = "https://www.fedlex.admin.ch/eli/cc/63/1185_1183_1185/it";
const LAMAL = "https://www.fedlex.admin.ch/eli/cc/1995/1328_1328_1328/it";
const ODERR = "https://www.fedlex.admin.ch/eli/cc/2017/63/it";
const LABORATORIO_TI = "Cantone Ticino, Laboratorio cantonale";
const PMI = "Portale PMI (SECO)";
const FEDLEX = "Confederazione (Fedlex)";
const IAS = "Istituto delle assicurazioni sociali (IAS), Ticino";
const DC = "Cantone Ticino, Divisione delle contribuzioni";
const RACCOLTA_TI = "Cantone Ticino, Raccolta delle leggi";

export const fontiPercorso = {
  // Forma giuridica, nome e registro di commercio
  co777: { titolo: "Codice delle obbligazioni, art. 777", url: `${CO}#art_777`, ente: FEDLEX },
  co777c: { titolo: "Codice delle obbligazioni, art. 777c", url: `${CO}#art_777_c`, ente: FEDLEX },
  co950: { titolo: "Codice delle obbligazioni, art. 950", url: `${CO}#art_950`, ente: FEDLEX },
  co954a: { titolo: "Codice delle obbligazioni, art. 954a", url: `${CO}#art_954_a`, ente: FEDLEX },
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
    titolo: "Legge sugli esercizi alberghieri e sulla ristorazione (LEAR), artt. 5 e 9",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/792",
    ente: RACCOLTA_TI,
  },
  rlear: {
    titolo: "Regolamento sugli esercizi alberghieri e sulla ristorazione (RLEAR)",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/793",
    ente: RACCOLTA_TI,
  },
  lan: {
    titolo: "Legge sull'apertura dei negozi (LAN)",
    url: "https://m3.ti.ch/CAN/RLeggi/public/index.php/raccolta-leggi/legge/num/688",
    ente: RACCOLTA_TI,
  },
  sanitaLiberoEsercizio: {
    titolo: "Procedure per le autorizzazioni di libero esercizio",
    url: "https://www4.ti.ch/dss/dsp/us/sportello/procedure-per-le-autorizzazioni-di-libero-esercizio",
    ente: "Cantone Ticino, Ufficio di sanità",
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
  umIndipendentiUeAels: {
    titolo: "Avvertenze per cittadini UE/AELS indipendenti",
    url: "https://www4.ti.ch/fileadmin/DI/DI_DI/SEZPOP/documentazione/avvertenze/2017/G_Avvertenze_Cittadini_UE-AELS_indipendenti.pdf",
    ente: "Cantone Ticino, Ufficio della migrazione",
  },

  // AVS e assicurazioni
  avsCosaSuccedeOra: {
    titolo: "Cosa succede ora? (dopo la domanda di riconoscimento)",
    url: "https://selbststaendig-erwerbend.ch/it/cosa-succede-ora",
    ente: "Casse di compensazione AVS",
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
  pmiInfortuni: {
    titolo: "Assicurazione contro gli infortuni professionali e non professionali",
    url: "https://www.kmu.admin.ch/it/assicurazione-contro-gli-infortuni-professionali-e-assicurazione-contro-gli-infortuni-non-professionali",
    ente: PMI,
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
  afcIdi: {
    titolo: "Numero d'identificazione delle imprese (IDI)",
    url: "https://www.estv.admin.ch/it/numero-identificazione-delle-imprese-idi",
    ente: "Amministrazione federale delle contribuzioni (AFC)",
  },
  lcsl3: {
    titolo: "Legge contro la concorrenza sleale (LCSl), art. 3",
    url: "https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/it#art_3",
    ente: FEDLEX,
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
} as const satisfies Record<string, Fonte>;

/** Regole e importi usati dal percorso guidato. */
export const regolePercorso = {
  mesiPerIvaDaSubito: dato(12, fonti.liva14, "Se all'avvio è presumibile superare la soglia IVA entro 12 mesi, si è assoggettati da subito."),
  termineMetodoIvaGiorni: dato(60, fontiPercorso.oiva78, "Giorni dalla comunicazione del numero IVA per chiedere l'aliquota saldo (art. 78 OIVA) o il rendiconto annuale (art. 76a OIVA)."),
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
  autenticazioneFirmaRcTicino: dato(20, fontiPercorso.rcTicinoTasseCantonali, "Allo sportello dell'Ufficio RC; dal notaio al massimo CHF 30."),
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
  fondounimpresa: dato(
    { oreMassime: 15, anniMassimi: 2 },
    fontiPercorso.fondounimpresa,
    "Per cittadini svizzeri o stranieri con permesso B o C residenti in Ticino o nella Regione Moesa. Non comprende contabilità, corrispondenza e dichiarazione d'imposta. L'IFC lo definisce un servizio pubblico gratuito (pagina fondounimpresaGratuito); i corsi invece si pagano.",
  ),
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
  fondounimpresa: dato(
    { nome: "Fondounimpresa", luogo: "Camorino", telefono: "+41 91 814 16 71", email: "fondounimpresa@edu.ti.ch" },
    fontiPercorso.portaleImpresaServizi,
    "Indirizzo da confermare: il Portale impresa indica Ala Munda 35, il sito IFC Ala Munda 41.",
  ),
} as const;

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
