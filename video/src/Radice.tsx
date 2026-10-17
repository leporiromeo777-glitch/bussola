import { Composition, staticFile } from "remotion";
import { Lezione, type PropsLezione } from "./Lezione";
import { LEZIONI, trovaLezione } from "./lezioni";
import { STILI, type Durate } from "./lezioni/tipi";
import { calcolaTempi, FPS, LATO } from "./tempi";

/**
 * Una composizione per lezione, con l'id del passo, nello stile della lezione.
 * In più, per provare l'altro stile senza toccare quella pubblicata, una
 * composizione `<id>-<stile>` (per esempio `ditta-individuale-presentatore`).
 * La durata viene dagli audio misurati.
 */
export function Radice() {
  return (
    <>
      {LEZIONI.flatMap((lezione) => {
        const proprio = lezione.stile ?? "classico";
        const varianti = [
          { id: lezione.id, stile: proprio },
          ...STILI.filter((s) => s !== proprio).map((stile) => ({ id: `${lezione.id}-${stile}`, stile })),
        ];
        return varianti.map(({ id, stile }) => (
          <Composition
            key={id}
            id={id}
            component={Lezione}
            fps={FPS}
            width={LATO}
            height={LATO}
            durationInFrames={1}
            defaultProps={{ lezioneId: lezione.id, stile, copertina: false, durate: null } satisfies PropsLezione}
            calculateMetadata={async ({ props }) => {
              const risposta = await fetch(staticFile(`${props.lezioneId}/durate.json`));
              if (!risposta.ok) throw new Error(`Manca public/${props.lezioneId}/durate.json: lancia npm run prepara.`);
              const durate = (await risposta.json()) as Durate;
              const tempi = calcolaTempi(trovaLezione(props.lezioneId), durate);
              return { durationInFrames: tempi.totale, props: { ...props, durate } };
            }}
          />
        ));
      })}
    </>
  );
}
