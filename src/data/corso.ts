/**
 * «Il corso di Bleo»: una breve lezione video per ogni passo del percorso.
 * I video si fanno con Remotion nella cartella video/ (vedi video/README.md),
 * che legge da qui titolo, numero e fonti di ogni lezione.
 *
 * Per ora c'è solo la lezione 1; gli altri passi appaiono come «In arrivo».
 */
import { VERIFICATO_IL, type IdPasso } from "./passi";
import { fonti, fontiPercorso, type Fonte } from "./svizzera";

export type LezioneCorso = {
  /** Il passo del percorso che la lezione spiega (id in PASSI). */
  passoId: IdPasso;
  numero: number;
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

export const LEZIONI: readonly LezioneCorso[] = [
  {
    passoId: "ditta-individuale",
    numero: 1,
    titolo: "Cos'è una ditta individuale",
    video: "/corso/ditta-individuale.mp4",
    poster: "/corso/ditta-individuale.jpg",
    sottotitoli: "/corso/ditta-individuale.vtt",
    durataSecondi: 50,
    fonti: [fonti.pmiDittaIndividuale, fontiPercorso.pmiImposteDitta],
    verificatoIl: VERIFICATO_IL,
  },
];

/** La lezione video di un passo, se c'è. */
export function lezionePerPasso(passoId: string): LezioneCorso | undefined {
  return LEZIONI.find((l) => l.passoId === passoId);
}
