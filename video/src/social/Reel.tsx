/**
 * Il video verticale del post del giorno (1080×1920, ~20 s, musica senza voce): le
 * schede del carosello una dopo l'altra, Bleo presentatore in basso che
 * saluta e indica, la bussolina che entra, tocca i punti e fa festa. Lo fa
 * scripts/reel.ts; i tempi e le mosse sono in tempi-reel.ts.
 */
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Html5Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AVVISO, POST_SOCIAL, type PostSocial, type SchedaPost } from "../../../src/data/social";
import { dataSvizzera } from "../../../src/data/svizzera";
import { Marchio } from "../componenti/Marchio";
import { Sfondo } from "../componenti/Sfondo";
import type { Durate } from "../lezioni/tipi";
import { BleoPresentatore } from "../presentatore/BleoPresentatore";
import { Bussolina } from "../presentatore/Bussolina";
import { posa } from "../presentatore/coreografia";
import { Scintille } from "../presentatore/Scintille";
import { COLORI, OMBRA_SCHEDA, SFUMATURA, TESTO, TITOLI } from "../stile";
import {
  conApostrofi,
  CONTA,
  GRIGLIA_REEL,
  numeroDaContare,
  pianoReel,
  tempiReel,
  type ParteReel,
} from "./tempi-reel";

export type PropsReel = {
  postId: string;
  clip: NonNullable<Durate["presentatore"]> | null;
  /** Musica ed effetti in public/ (li fa scripts/audio-reel.py); null: muto. */
  audio: string | null;
};

const MOLLA = { damping: 14, stiffness: 120, mass: 0.9 };
const USCITA = 10;

function trovaPost(id: string): PostSocial {
  const post = POST_SOCIAL.find((p) => p.id === id);
  if (!post) throw new Error(`Post sconosciuto: ${id}`);
  return post;
}

/** «CHF 20'000» non va mai a capo tra la valuta e l'importo. */
function unito(testo: string): string {
  return testo.replace(/CHF /g, "CHF ");
}

export function Reel({ postId, clip, audio }: PropsReel) {
  const frame = useCurrentFrame();
  const post = trovaPost(postId);
  const tempi = tempiReel(post);
  const piano = pianoReel(tempi);
  const adesso = posa(piano, frame);
  const { bleo, bussolina } = GRIGLIA_REEL;
  return (
    <AbsoluteFill style={{ fontFamily: TESTO, color: COLORI.testo }}>
      <Sfondo />
      {audio ? <Html5Audio src={staticFile(audio)} /> : null}
      <div style={{ position: "absolute", left: GRIGLIA_REEL.margine, top: GRIGLIA_REEL.marchio.y }}>
        <Marchio altezza={56} />
      </div>
      {clip ? (
        <div
          style={{
            position: "absolute",
            left: bleo.x,
            top: bleo.y,
            width: 1080,
            height: 1080,
            transform: `scale(${bleo.scala})`,
            transformOrigin: "0 0",
          }}
        >
          <BleoPresentatore clip={clip} />
        </div>
      ) : null}
      {tempi.parti.map((parte) => (
        <Sequence key={parte.indice} from={parte.inizio} durationInFrames={parte.durata} name={parte.scheda?.tipo ?? "chiusura"}>
          <Parte parte={parte} post={post} />
        </Sequence>
      ))}
      <Scintille scintille={piano.scintille} />
      {adesso ? <Bussolina posa={adesso} piano={piano} altezza={bussolina.altezza} /> : null}
    </AbsoluteFill>
  );
}

/** Entrata con una molla dal basso e uscita sfumando verso l'alto, negli ultimi fotogrammi della parte. */
function useComparsa(durata: number, ritardo = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dentro = spring({ frame: frame - ritardo, fps, config: MOLLA });
  const fuori = interpolate(frame, [durata - USCITA, durata], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return {
    opacity: Math.min(1, dentro) * (1 - fuori),
    transform: `translateY(${(1 - dentro) * 80 - fuori * 60}px)`,
  } satisfies CSSProperties;
}

function Parte({ parte, post }: { parte: ParteReel; post: PostSocial }) {
  const s = parte.scheda;
  if (!s) return <Chiusura post={post} durata={parte.durata} />;
  switch (s.tipo) {
    case "copertina":
      return <Copertina scheda={s} durata={parte.durata} />;
    case "punti":
      return <Punti scheda={s} parte={parte} />;
    case "cifra":
      return <Cifra scheda={s} durata={parte.durata} />;
  }
}

function Riquadro({ children, stile }: { children: ReactNode; stile?: CSSProperties }) {
  const { x, y, larghezza } = GRIGLIA_REEL.scheda;
  return <div style={{ position: "absolute", left: x, top: y, width: larghezza, ...stile }}>{children}</div>;
}

function Barra() {
  return <div style={{ width: 130, height: 10, borderRadius: 5, backgroundImage: SFUMATURA }} />;
}

function Copertina({ scheda, durata }: { scheda: Extract<SchedaPost, { tipo: "copertina" }>; durata: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fuori = interpolate(frame, [durata - USCITA, durata], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const parole = unito(scheda.titolo).split(" ");
  const pillola = spring({ frame: frame - 4, fps, config: MOLLA });
  return (
    <Riquadro stile={{ top: 330, opacity: 1 - fuori, transform: `translateY(${-fuori * 60}px)` }}>
      <span
        style={{
          display: "inline-block",
          padding: "16px 30px",
          borderRadius: 999,
          backgroundColor: COLORI.brandTenue,
          color: COLORI.brand,
          fontWeight: 700,
          fontSize: 38,
          opacity: Math.min(1, pillola),
          transform: `scale(${0.8 + 0.2 * Math.min(1, pillola)})`,
          transformOrigin: "0 50%",
        }}
      >
        {scheda.occhiello}
      </span>
      <h1
        style={{
          margin: "44px 0 40px",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: scheda.titolo.length > 44 ? 92 : 104,
          lineHeight: 1.04,
          letterSpacing: "-0.03em",
        }}
      >
        {parole.map((p, i) => {
          const m = spring({ frame: frame - 12 - i * 3, fps, config: MOLLA });
          return (
            <span
              key={`${p}-${i}`}
              style={{
                display: "inline-block",
                marginRight: "0.26em",
                opacity: Math.min(1, m),
                transform: `translateY(${(1 - m) * 40}px)`,
              }}
            >
              {p}
            </span>
          );
        })}
      </h1>
      <Barra />
    </Riquadro>
  );
}

function Punti({ scheda, parte }: { scheda: Extract<SchedaPost, { tipo: "punti" }>; parte: ParteReel }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const comparsa = useComparsa(parte.durata);
  const { x, y, larghezza, titolo, riga, spazio } = GRIGLIA_REEL.elenco;
  const lungo = scheda.punti.some((p) => p.length > 80);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: larghezza, ...comparsa }}>
      <div style={{ height: titolo }}>
        <h2
          style={{
            margin: "0 0 18px",
            fontFamily: TITOLI,
            fontWeight: 800,
            fontSize: 70,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            whiteSpace: "nowrap",
          }}
        >
          {scheda.titolo}
        </h2>
        <Barra />
      </div>
      {scheda.punti.map((punto, k) => {
        const m = spring({ frame: frame - parte.punti[k], fps, config: { damping: 12, stiffness: 150 } });
        return (
          <div
            key={punto}
            style={{
              position: "absolute",
              left: 0,
              top: titolo + k * (riga + spazio),
              width: larghezza,
              height: riga,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 26,
              padding: "0 32px",
              borderRadius: 32,
              backgroundColor: COLORI.card,
              border: `1px solid ${COLORI.bordo}`,
              boxShadow: OMBRA_SCHEDA,
              opacity: Math.min(1, m),
              transform: `translateX(${(1 - Math.min(1, m)) * -60}px) scale(${0.94 + 0.06 * Math.min(1, m)})`,
            }}
          >
            <span
              style={{
                flex: "0 0 auto",
                width: 68,
                height: 68,
                borderRadius: "50%",
                backgroundColor: COLORI.brand,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: TITOLI,
                fontWeight: 800,
                fontSize: 34,
              }}
            >
              {k + 1}
            </span>
            <span style={{ fontSize: lungo ? 36 : 40, fontWeight: 500, lineHeight: 1.22 }}>{unito(punto)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Cifra({ scheda, durata }: { scheda: Extract<SchedaPost, { tipo: "cifra" }>; durata: number }) {
  const frame = useCurrentFrame();
  const comparsa = useComparsa(durata);
  const conta = numeroDaContare(scheda.cifra);
  // Il numero sale da 0 al valore in poco più di un secondo, poi resta fermo.
  const u = interpolate(frame, [CONTA.da, CONTA.a], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const salita = 1 - (1 - u) ** 3;
  const testo = conta ? `${conta.prima}${conApostrofi(conta.numero * salita)}${conta.dopo}` : scheda.cifra;
  return (
    <Riquadro stile={{ top: 420, ...comparsa }}>
      <div
        style={{
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: scheda.cifra.length > 10 ? 150 : 176,
          lineHeight: 1,
          letterSpacing: "-0.035em",
          wordSpacing: "0.12em",
          backgroundImage: SFUMATURA,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          whiteSpace: "nowrap",
          paddingBottom: 14,
        }}
      >
        {unito(testo)}
      </div>
      <p style={{ margin: "40px 0 0", fontSize: 52, fontWeight: 500, lineHeight: 1.25 }}>{unito(scheda.testo)}</p>
    </Riquadro>
  );
}

function Chiusura({ post, durata }: { post: PostSocial; durata: number }) {
  const fonte = useComparsa(durata, 4);
  const invito = useComparsa(durata, 26);
  const [prima] = post.fonti;
  return (
    <>
      <Riquadro stile={{ top: 300, ...fonte }}>
        <div style={{ fontFamily: TITOLI, fontWeight: 800, fontSize: 64, letterSpacing: "-0.025em" }}>
          {post.fonti.length > 1 ? "Le fonti ufficiali" : "La fonte ufficiale"}
        </div>
        <div
          style={{
            marginTop: 28,
            padding: "34px 38px",
            borderRadius: 32,
            backgroundColor: COLORI.card,
            border: `1px solid ${COLORI.bordo}`,
            boxShadow: OMBRA_SCHEDA,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 600, color: COLORI.tenue }}>{prima.ente}</div>
          <div style={{ marginTop: 10, fontFamily: TITOLI, fontWeight: 700, fontSize: 42, lineHeight: 1.15 }}>{prima.titolo}</div>
          <div style={{ marginTop: 16, fontSize: 30, fontWeight: 600, color: COLORI.successo }}>
            ✓ Controllata il {dataSvizzera(post.verificatoIl)}
          </div>
        </div>
        <p style={{ margin: "22px 4px 0", fontSize: 27, lineHeight: 1.35, color: COLORI.tenue }}>{AVVISO}</p>
      </Riquadro>
      <Riquadro stile={{ top: 1010, ...invito }}>
        <div style={{ padding: "40px 44px", borderRadius: 36, backgroundImage: SFUMATURA, color: "#fff", width: 640 }}>
          <div style={{ fontFamily: TITOLI, fontWeight: 800, fontSize: 46, lineHeight: 1.1 }}>Dall'idea alla prima fattura.</div>
          <div style={{ marginTop: 16, fontSize: 34, fontWeight: 600 }}>Iscriviti alla lista d'attesa: link nel profilo</div>
        </div>
      </Riquadro>
    </>
  );
}
