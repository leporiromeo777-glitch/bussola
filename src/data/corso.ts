/**
 * «Il corso di Bleo»: una breve lezione video per ogni passo del percorso.
 * I video si fanno con Remotion nella cartella video/ (vedi video/README.md),
 * che legge da qui titolo, numero e fonti di ogni lezione.
 *
 * Per ora ci sono le lezioni da 1 a 5; gli altri passi appaiono come «In arrivo».
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
