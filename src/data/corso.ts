/**
 * «Il corso di Bleo»: una breve lezione video per ogni passo del percorso.
 * I video si fanno con Remotion nella cartella video/ (vedi video/README.md),
 * che legge da qui titolo, numero e fonti di ogni lezione.
 *
 * Per ora solo alcuni passi hanno la lezione; gli altri appaiono come «In arrivo».
 * Una lezione può avere dei video facoltativi (`approfondimenti`), che
 * spiegano meglio un punto: si vedono sotto il video della lezione.
 */
import type { IdPasso } from "./passi";
import {
  fonti,
  fontiPercorso,
  VERIFICATO_ALIMENTI,
  VERIFICATO_AUTORIZZAZIONI,
  VERIFICATO_CHECKLIST,
  VERIFICATO_DOCUMENTI_SAGL,
  VERIFICATO_ESERCIZI_PUBBLICI,
  VERIFICATO_FORME,
  VERIFICATO_SANITA,
  VERIFICATO_PERMESSI,
  VERIFICATO_NOME_DITTA,
  VERIFICATO_SUVA,
  VERIFICATO_INFORTUNI,
  VERIFICATO_AVS_INDIPENDENTI,
  type Fonte,
} from "./svizzera";

/** Un video del corso: una lezione o un suo video facoltativo. */
export type VideoCorso = {
  titolo: string;
  /** Percorsi in public/. */
  video: string;
  poster: string;
  /** Sottotitoli WebVTT in italiano. */
  sottotitoli: string;
  /** Durata del video, arrotondata al secondo (la controlla corso.test.ts sul file). */
  durataSecondi: number;
  /** Le fonti ufficiali citate nella lezione. */
  fonti: readonly Fonte[];
  /** Data ISO dell'ultimo controllo dei contenuti sulle fonti. */
  verificatoIl: string;
};

/** Un video facoltativo di una lezione. Le sue fonti sono anche fonti del passo. */
export type Approfondimento = VideoCorso & {
  /** Nome dei file in public/corso/ e della composizione in video/: «<passo>-<tema>». */
  id: string;
};

export type LezioneCorso = VideoCorso & {
  /** Il passo del percorso che la lezione spiega (id in PASSI). */
  passoId: IdPasso;
  numero: number;
  approfondimenti?: readonly Approfondimento[];
};

export const LEZIONI: readonly LezioneCorso[] = [
  {
    passoId: "ditta-individuale",
    numero: 1,
    titolo: "Quale forma per la tua attività?",
    video: "/corso/ditta-individuale.mp4",
    poster: "/corso/ditta-individuale.jpg",
    sottotitoli: "/corso/ditta-individuale.vtt",
    durataSecondi: 153,
    fonti: [
      fontiPercorso.pmiScegliereForma,
      fonti.pmiDittaIndividuale,
      fontiPercorso.pmiNomeCollettivo,
      fontiPercorso.pmiSagl,
      fontiPercorso.pmiSa,
      fontiPercorso.pmiImposteDitta,
    ],
    verificatoIl: VERIFICATO_FORME,
  },
  {
    passoId: "soci-forma-giuridica",
    numero: 2,
    titolo: "Fondare una Sagl con i soci",
    video: "/corso/soci-forma-giuridica.mp4",
    poster: "/corso/soci-forma-giuridica.jpg",
    sottotitoli: "/corso/soci-forma-giuridica.vtt",
    durataSecondi: 181,
    fonti: [
      fonti.pmiChecklist,
      fonti.co773,
      fontiPercorso.co777c,
      fontiPercorso.co777,
      fontiPercorso.pmiAssicurazioniSociali,
      fonti.albofiduciari,
      fontiPercorso.pmiNomeCollettivo,
      fontiPercorso.pmiSa,
      fonti.co621,
      fonti.co632,
      fontiPercorso.pmiSagl,
    ],
    verificatoIl: VERIFICATO_CHECKLIST,
    approfondimenti: [
      {
        id: "soci-forma-giuridica-statuto",
        titolo: "Lo statuto della Sagl",
        video: "/corso/soci-forma-giuridica-statuto.mp4",
        poster: "/corso/soci-forma-giuridica-statuto.jpg",
        sottotitoli: "/corso/soci-forma-giuridica-statuto.vtt",
        durataSecondi: 117,
        fonti: [fontiPercorso.statutoTipoSagl, fontiPercorso.co776, fontiPercorso.co809, fontiPercorso.co774, fontiPercorso.co777b],
        verificatoIl: VERIFICATO_DOCUMENTI_SAGL,
      },
      {
        id: "soci-forma-giuridica-atto",
        titolo: "L'atto di fondazione della Sagl",
        video: "/corso/soci-forma-giuridica-atto.mp4",
        poster: "/corso/soci-forma-giuridica-atto.jpg",
        sottotitoli: "/corso/soci-forma-giuridica-atto.vtt",
        durataSecondi: 82,
        fonti: [
          fontiPercorso.co777,
          fontiPercorso.co777a,
          fontiPercorso.co777b,
          fontiPercorso.co778,
          fontiPercorso.co779,
        ],
        verificatoIl: VERIFICATO_DOCUMENTI_SAGL,
      },
    ],
  },
  {
    passoId: "autorizzazioni",
    numero: 3,
    titolo: "Ti serve un'autorizzazione?",
    video: "/corso/autorizzazioni.mp4",
    poster: "/corso/autorizzazioni.jpg",
    sottotitoli: "/corso/autorizzazioni.vtt",
    durataSecondi: 110,
    fonti: [fontiPercorso.pmiMettersiInProprio, fontiPercorso.sefriProfessioniRegolamentate, fontiPercorso.poliziaAutorizzazioni],
    verificatoIl: VERIFICATO_AUTORIZZAZIONI,
  },
  {
    passoId: "autorizzazione-esercizio-pubblico",
    numero: 4,
    titolo: "Aprire un bar o un ristorante",
    video: "/corso/autorizzazione-esercizio-pubblico.mp4",
    poster: "/corso/autorizzazione-esercizio-pubblico.jpg",
    sottotitoli: "/corso/autorizzazione-esercizio-pubblico.vtt",
    durataSecondi: 160,
    fonti: [
      fontiPercorso.lear,
      fontiPercorso.rlear,
      fontiPercorso.poliziaEserciziPubbliciPersona,
      fontiPercorso.poliziaEserciziPubbliciSocieta,
      fontiPercorso.diplomaEsercente,
      fontiPercorso.diplomaEsercenteCorso,
    ],
    verificatoIl: VERIFICATO_ESERCIZI_PUBBLICI,
  },
  {
    passoId: "notifica-derrate-alimentari",
    numero: 5,
    titolo: "Vendi cibo? Notifica la tua attività",
    video: "/corso/notifica-derrate-alimentari.mp4",
    poster: "/corso/notifica-derrate-alimentari.jpg",
    sottotitoli: "/corso/notifica-derrate-alimentari.vtt",
    durataSecondi: 132,
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
  },
  {
    passoId: "autorizzazione-sanitaria",
    numero: 6,
    titolo: "Lavorare in proprio nella salute",
    video: "/corso/autorizzazione-sanitaria.mp4",
    poster: "/corso/autorizzazione-sanitaria.jpg",
    sottotitoli: "/corso/autorizzazione-sanitaria.vtt",
    durataSecondi: 163,
    fonti: [
      fontiPercorso.sanitaLiberoEsercizio,
      fontiPercorso.lsan,
      fontiPercorso.sanitaDocumenti,
      fontiPercorso.regolamentoEstetista,
      fontiPercorso.sanitaFaqTerapisti,
      fontiPercorso.sefriTerapieComplementari,
      fontiPercorso.tasseSanita,
      fontiPercorso.sanitaAoms,
      fontiPercorso.lamal36,
    ],
    verificatoIl: VERIFICATO_SANITA,
  },
  {
    passoId: "permesso-lavoro",
    numero: 7,
    titolo: "Il permesso per lavorare in proprio",
    video: "/corso/permesso-lavoro.mp4",
    poster: "/corso/permesso-lavoro.jpg",
    sottotitoli: "/corso/permesso-lavoro.vtt",
    durataSecondi: 161,
    fonti: [
      fontiPercorso.lstri38,
      fontiPercorso.pmiMettersiInProprio,
      fontiPercorso.semSoggiornoAttivita,
      fontiPercorso.umIndipendentiUeAelsB,
      fontiPercorso.semFrontalieri,
      fontiPercorso.umIndipendentiUeAels,
      fontiPercorso.semFaqLiberaCircolazione,
      fontiPercorso.umModificaPermessoB,
      fontiPercorso.lstri19,
      fontiPercorso.semIstruzioniOlcp,
      fontiPercorso.grPromemoriaIndipendenti,
      fontiPercorso.umRichiestaPermessoB,
      fontiPercorso.umRichiestaPermessoG,
      fontiPercorso.grIndipendentiUeAels,
    ],
    verificatoIl: VERIFICATO_PERMESSI,
  },
  {
    passoId: "nome-ditta",
    numero: 8,
    titolo: "Come chiamare la tua ditta",
    video: "/corso/nome-ditta.mp4",
    poster: "/corso/nome-ditta.jpg",
    sottotitoli: "/corso/nome-ditta.vtt",
    durataSecondi: 173,
    fonti: [
      fonti.co945,
      fontiPercorso.co944,
      fonti.rcTicinoIscrizione,
      fontiPercorso.direttivaDitteUfrc,
      fontiPercorso.co946,
      fontiPercorso.pmiIscrizioneNome,
      fontiPercorso.regixFaq,
      fontiPercorso.zefix,
      fontiPercorso.ipiFaqMarchi,
      fontiPercorso.ipiRicercaAutonoma,
      fonti.pmiDittaIndividuale,
      fontiPercorso.co950,
      fontiPercorso.co951,
    ],
    verificatoIl: VERIFICATO_NOME_DITTA,
  },
  {
    passoId: "statuto-suva",
    numero: 10,
    titolo: "Edilizia e trasporti: decide anche la Suva",
    video: "/corso/statuto-suva.mp4",
    poster: "/corso/statuto-suva.jpg",
    sottotitoli: "/corso/statuto-suva.vtt",
    durataSecondi: 175,
    fonti: [
      fontiPercorso.lainf66,
      fontiPercorso.oainf73,
      fontiPercorso.suvaAccertamento,
      fontiPercorso.suvaImprenditori,
      fontiPercorso.avsIndipendenza,
      fontiPercorso.suvaDecisione,
    ],
    verificatoIl: VERIFICATO_SUVA,
  },
  {
    passoId: "assicurazione-infortuni",
    numero: 12,
    titolo: "Sei assicurato contro gli infortuni?",
    video: "/corso/assicurazione-infortuni.mp4",
    poster: "/corso/assicurazione-infortuni.jpg",
    sottotitoli: "/corso/assicurazione-infortuni.vtt",
    durataSecondi: 162,
    fonti: [
      fontiPercorso.lainf4,
      fontiPercorso.lainf1a,
      fontiPercorso.oainf13,
      fontiPercorso.ufspObbligoInfortuni,
      fonti.avsPromemoria202,
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
  },
  {
    passoId: "riconoscimento-avs",
    numero: 11,
    titolo: "Indipendente per l'AVS",
    video: "/corso/riconoscimento-avs.mp4",
    poster: "/corso/riconoscimento-avs.jpg",
    sottotitoli: "/corso/riconoscimento-avs.vtt",
    durataSecondi: 175,
    fonti: [
      fonti.avsPromemoria202,
      fontiPercorso.avsIndipendenza,
      fontiPercorso.lavs64,
      fontiPercorso.iasAffiliazione,
      fonti.avsCasseCantonali,
      fonti.avsDomandaIndipendente,
      fontiPercorso.pmiMettersiInProprio,
      fontiPercorso.avsCosaSuccedeOra,
      fonti.ufasImporti2027,
    ],
    verificatoIl: VERIFICATO_AVS_INDIPENDENTI,
  },
];

/** La lezione video di un passo, se c'è. */
export function lezionePerPasso(passoId: string): LezioneCorso | undefined {
  return LEZIONI.find((l) => l.passoId === passoId);
}

/** Un video facoltativo con la sua lezione, se c'è. */
export function approfondimentoPerId(id: string): { lezione: LezioneCorso; approfondimento: Approfondimento } | undefined {
  for (const lezione of LEZIONI) {
    const approfondimento = lezione.approfondimenti?.find((a) => a.id === id);
    if (approfondimento) return { lezione, approfondimento };
  }
  return undefined;
}

/** Tutti i video del corso, lezioni e video facoltativi, con il loro passo. */
export function tuttiIVideo(): { passoId: IdPasso; video: VideoCorso }[] {
  return LEZIONI.flatMap((l) => [
    { passoId: l.passoId, video: l },
    ...(l.approfondimenti ?? []).map((a) => ({ passoId: l.passoId, video: a })),
  ]);
}

/** Durata breve per le etichette: «51 s», «1 min 20 s». */
export function durataBreve(secondi: number): string {
  const s = Math.round(secondi);
  if (s < 60) return `${s} s`;
  const resto = s % 60;
  return resto === 0 ? `${s / 60} min` : `${Math.floor(s / 60)} min ${resto} s`;
}
