import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ClipBleo } from "./componenti/ClipBleo";
import { Fine } from "./componenti/Fine";
import { Intestazione } from "./componenti/Intestazione";
import { Schede } from "./componenti/Schede";
import { Sfondo } from "./componenti/Sfondo";
import { Sottotitoli } from "./componenti/Sottotitoli";
import { trovaLezione } from "./lezioni";
import type { Durate } from "./lezioni/tipi";
import { GRIGLIA } from "./stile";
import { calcolaTempi, FPS, LATO } from "./tempi";

/** Nella copertina Bleo e il titolo scendono al centro dello spazio sotto l'intestazione. */
const SPOSTAMENTO_COPERTINA = (LATO - GRIGLIA.margine - (GRIGLIA.clip.y + GRIGLIA.clip.lato)) / 2;

export type PropsLezione = {
  lezioneId: string;
  /**
   * Per la copertina: niente sottotitoli e Bleo con il titolo al centro, così
   * i comandi del lettore, che stanno in basso, non coprono niente.
   */
  copertina: boolean;
  /** Riempito da calculateMetadata con public/<id>/durate.json. */
  durate: Durate | null;
};

/** Una lezione del corso: Bleo che parla, il punto chiave accanto e i sottotitoli sotto. */
export function Lezione({ lezioneId, copertina, durate }: PropsLezione) {
  const frame = useCurrentFrame();
  if (!durate) throw new Error(`Mancano le durate di ${lezioneId}: lancia prima npm run prepara.`);
  const lezione = trovaLezione(lezioneId);
  const tempi = calcolaTempi(lezione, durate);
  const parla = tempi.scene.some((s) => frame >= s.inizio && frame < s.inizio + s.voce);
  return (
    <AbsoluteFill>
      <Sfondo />
      <Intestazione scene={tempi.scene} numero={lezione.numero} />
      <AbsoluteFill style={{ transform: `translateY(${copertina ? SPOSTAMENTO_COPERTINA : 0}px)` }}>
        <ClipBleo src={`${lezione.id}/${lezione.clip}`} durataLoop={Math.floor(durate.clip * FPS)} />
        <Schede scene={lezione.scene} tempi={tempi.scene} />
      </AbsoluteFill>
      {copertina ? null : <Sottotitoli battute={tempi.battute} parla={parla} fine={tempi.inizioFine} />}
      {lezione.scene.map((scena, i) => (
        <Sequence key={scena.audio} from={tempi.scene[i].inizio} durationInFrames={tempi.scene[i].durata}>
          <Html5Audio src={staticFile(`${lezione.id}/${scena.audio}`)} />
        </Sequence>
      ))}
      <Sequence from={tempi.inizioFine}>
        <Fine prossimoPasso={lezione.prossimoPasso} />
      </Sequence>
    </AbsoluteFill>
  );
}
