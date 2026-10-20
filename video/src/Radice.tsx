import { Composition, staticFile } from "remotion";
import { POST_SOCIAL } from "../../src/data/social";
import { Lezione, type PropsLezione } from "./Lezione";
import { LEZIONI, trovaLezione } from "./lezioni";
import { tempiVetrina, Vetrina, type PropsVetrina } from "./presentatore/Vetrina";
import { ALTEZZA_POST, LARGHEZZA_POST, Post, type PropsPost } from "./social/Post";
import { Reel, type PropsReel } from "./social/Reel";
import { ALTEZZA_REEL, FPS_REEL, LARGHEZZA_REEL, tempiReel } from "./social/tempi-reel";
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
      {/* Le animazioni della bussolina una per una, senza voce (stile «presentatore»). */}
      <Composition
        id="bussolina-animazioni"
        component={Vetrina}
        fps={FPS}
        width={LATO}
        height={LATO}
        durationInFrames={tempiVetrina().tempi.totale}
        defaultProps={{ durate: null } satisfies PropsVetrina}
        calculateMetadata={async ({ props }) => {
          const risposta = await fetch(staticFile("ditta-individuale/durate.json"));
          if (!risposta.ok) throw new Error("Manca public/ditta-individuale/durate.json: lancia npm run prepara.");
          return { props: { ...props, durate: (await risposta.json()) as Durate } };
        }}
      />
      {/* Le immagini dei post social, una per scheda: le fa scripts/social.ts. */}
      <Composition
        id="post"
        component={Post}
        fps={FPS}
        width={LARGHEZZA_POST}
        height={ALTEZZA_POST}
        durationInFrames={1}
        defaultProps={{ postId: POST_SOCIAL[0].id, indice: 0 } satisfies PropsPost}
      />
      {/* Il video verticale del post del giorno: lo fa scripts/reel.ts. */}
      <Composition
        id="reel"
        component={Reel}
        fps={FPS_REEL}
        width={LARGHEZZA_REEL}
        height={ALTEZZA_REEL}
        durationInFrames={1}
        defaultProps={{ postId: POST_SOCIAL[0].id, clip: null } satisfies PropsReel}
        calculateMetadata={({ props }) => {
          const post = POST_SOCIAL.find((p) => p.id === props.postId);
          if (!post) throw new Error(`Post sconosciuto: ${props.postId}`);
          return { durationInFrames: tempiReel(post).totale };
        }}
      />
    </>
  );
}
