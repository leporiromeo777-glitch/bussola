import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ClipBleo } from "./componenti/ClipBleo";
import { Fine } from "./componenti/Fine";
import { Intestazione } from "./componenti/Intestazione";
import { Schede } from "./componenti/Schede";
import { Sfondo } from "./componenti/Sfondo";
import { Sottotitoli } from "./componenti/Sottotitoli";
import { trovaLezione } from "./lezioni";
import type { Durate } from "./lezioni/tipi";
import { calcolaTempi, FPS } from "./tempi";

export type PropsLezione = {
  lezioneId: string;
  /** true per l'immagine di copertina: niente sottotitoli. */
  poster: boolean;
  /** Riempito da calculateMetadata con public/<id>/durate.json. */
  durate: Durate | null;
};

/** Una lezione del corso: Bleo che parla, il punto chiave accanto e i sottotitoli sotto. */
export function Lezione({ lezioneId, poster, durate }: PropsLezione) {
  const frame = useCurrentFrame();
  if (!durate) throw new Error(`Mancano le durate di ${lezioneId}: lancia prima npm run prepara.`);
  const lezione = trovaLezione(lezioneId);
  const tempi = calcolaTempi(lezione, durate);
  const parla = tempi.scene.some((s) => frame >= s.inizio && frame < s.inizio + s.voce);
  return (
    <AbsoluteFill>
      <Sfondo />
      <Intestazione scene={tempi.scene} numero={lezione.numero} />
      <ClipBleo src={`${lezione.id}/${lezione.clip}`} durataLoop={Math.floor(durate.clip * FPS)} />
      <Schede scene={lezione.scene} tempi={tempi.scene} />
      {poster ? null : <Sottotitoli battute={tempi.battute} parla={parla} fine={tempi.inizioFine} />}
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
