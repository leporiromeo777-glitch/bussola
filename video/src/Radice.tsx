import { Composition, staticFile } from "remotion";
import { Lezione, type PropsLezione } from "./Lezione";
import { LEZIONI, trovaLezione } from "./lezioni";
import type { Durate } from "./lezioni/tipi";
import { calcolaTempi, FPS, LATO } from "./tempi";

/** Una composizione per lezione, con l'id del passo. La durata viene dagli audio misurati. */
export function Radice() {
  return (
    <>
      {LEZIONI.map((lezione) => (
        <Composition
          key={lezione.id}
          id={lezione.id}
          component={Lezione}
          fps={FPS}
          width={LATO}
          height={LATO}
          durationInFrames={1}
          defaultProps={{ lezioneId: lezione.id, poster: false, durate: null } satisfies PropsLezione}
          calculateMetadata={async ({ props }) => {
            const risposta = await fetch(staticFile(`${props.lezioneId}/durate.json`));
            if (!risposta.ok) throw new Error(`Manca public/${props.lezioneId}/durate.json: lancia npm run prepara.`);
            const durate = (await risposta.json()) as Durate;
            const tempi = calcolaTempi(trovaLezione(props.lezioneId), durate);
            return { durationInFrames: tempi.totale, props: { ...props, durate } };
          }}
        />
      ))}
    </>
  );
}
