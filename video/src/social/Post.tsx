/**
 * Le immagini dei post social (src/data/social.ts): 1080×1350 (4:5), una per
 * scheda del carosello più quella finale con la fonte e l'invito. Una sola
 * composizione, `post`: le props dicono quale post e quale immagine.
 * Le fa scripts/social.ts.
 */
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { AVVISO, INVITO, POST_SOCIAL, type PostSocial, type SchedaPost } from "../../../src/data/social";
import { dataSvizzera } from "../../../src/data/svizzera";
import { Marchio } from "../componenti/Marchio";
import { Sfondo } from "../componenti/Sfondo";
import { COLORI, OMBRA_SCHEDA, SFUMATURA, TESTO, TITOLI } from "../stile";

export const LARGHEZZA_POST = 1080;
export const ALTEZZA_POST = 1350;
const MARGINE = 84;
const ALTO = 196;

export type PropsPost = { postId: string; indice: number };

/** «CHF 20'000» non va mai a capo tra la valuta e l'importo. */
function unito(testo: string): string {
  return testo.replace(/CHF /g, "CHF\u00a0");
}

export function trovaPost(id: string): PostSocial {
  const post = POST_SOCIAL.find((p) => p.id === id);
  if (!post) throw new Error(`Post sconosciuto: ${id}`);
  return post;
}

export function Post({ postId, indice }: PropsPost) {
  const post = trovaPost(postId);
  const scheda = post.schede[indice];
  return (
    <AbsoluteFill style={{ fontFamily: TESTO, color: COLORI.testo }}>
      <Sfondo />
      <Testata numero={indice + 1} totale={post.schede.length + 1} />
      {scheda ? <Scheda scheda={scheda} /> : <Chiusura post={post} />}
    </AbsoluteFill>
  );
}

function Testata({ numero, totale }: { numero: number; totale: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        left: MARGINE,
        right: MARGINE,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Marchio altezza={50} />
      <span style={{ fontSize: 28, fontWeight: 600, color: COLORI.tenue, letterSpacing: "0.04em" }}>
        {numero}/{totale}
      </span>
    </div>
  );
}

function Scheda({ scheda }: { scheda: SchedaPost }) {
  switch (scheda.tipo) {
    case "copertina":
      return <Copertina scheda={scheda} />;
    case "punti":
      return <Punti scheda={scheda} />;
    case "cifra":
      return <Cifra scheda={scheda} />;
  }
}

function Area({ children, stile }: { children: ReactNode; stile?: CSSProperties }) {
  return (
    <div style={{ position: "absolute", top: ALTO, left: MARGINE, right: MARGINE, bottom: 96, ...stile }}>
      {children}
    </div>
  );
}

function Barra({ larghezza = 120 }: { larghezza?: number }) {
  return <div style={{ width: larghezza, height: 10, borderRadius: 5, backgroundImage: SFUMATURA }} />;
}

function Copertina({ scheda }: { scheda: Extract<SchedaPost, { tipo: "copertina" }> }) {
  const lungo = scheda.titolo.length > 44;
  return (
    <>
      <Area>
        <span
          style={{
            display: "inline-block",
            padding: "14px 28px",
            borderRadius: 999,
            backgroundColor: COLORI.brandTenue,
            color: COLORI.brand,
            fontWeight: 700,
            fontSize: 32,
          }}
        >
          {scheda.occhiello}
        </span>
        <h1
          style={{
            margin: "40px 0 40px",
            fontFamily: TITOLI,
            fontWeight: 800,
            fontSize: lungo ? 84 : 98,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            wordSpacing: "0.08em",
          }}
        >
          {unito(scheda.titolo)}
        </h1>
        <Barra />
      </Area>
      <Img
        src={staticFile(`mascotte/${scheda.mascotte}.webp`)}
        style={{ position: "absolute", right: 36, bottom: 40, height: lungo ? 500 : 560, width: "auto" }}
      />
      <span
        style={{
          position: "absolute",
          left: MARGINE,
          bottom: 92,
          fontFamily: TITOLI,
          fontWeight: 700,
          fontSize: 36,
          color: COLORI.brand,
        }}
      >
        Scorri →
      </span>
    </>
  );
}

function Punti({ scheda }: { scheda: Extract<SchedaPost, { tipo: "punti" }> }) {
  const caratteri = scheda.punti.reduce((n, p) => n + p.length, 0);
  const corpo = caratteri > 240 ? 36 : 40;
  return (
    <Area>
      <h2
        style={{
          margin: "0 0 18px",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          wordSpacing: "0.08em",
        }}
      >
        {scheda.titolo}
      </h2>
      <Barra />
      <ol style={{ listStyle: "none", margin: "48px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 24 }}>
        {scheda.punti.map((punto, i) => (
          <li
            key={punto}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: "30px 36px",
              borderRadius: 32,
              backgroundColor: COLORI.card,
              border: `1px solid ${COLORI.bordo}`,
              boxShadow: OMBRA_SCHEDA,
            }}
          >
            <span
              style={{
                flex: "0 0 auto",
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: COLORI.brand,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: TITOLI,
                fontWeight: 800,
                fontSize: 32,
              }}
            >
              {i + 1}
            </span>
            <span style={{ fontSize: corpo, fontWeight: 500, lineHeight: 1.25 }}>{unito(punto)}</span>
          </li>
        ))}
      </ol>
    </Area>
  );
}

function Cifra({ scheda }: { scheda: Extract<SchedaPost, { tipo: "cifra" }> }) {
  return (
    <>
      <Area stile={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 160 }}>
        <div
          style={{
            fontFamily: TITOLI,
            fontWeight: 800,
            fontSize: scheda.cifra.length > 10 ? 136 : 160,
            lineHeight: 1,
            letterSpacing: "-0.035em",
            wordSpacing: "0.12em",
            backgroundImage: SFUMATURA,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            whiteSpace: "nowrap",
            paddingBottom: 12,
          }}
        >
          {scheda.cifra}
        </div>
        <p style={{ margin: "36px 0 0", fontSize: 48, fontWeight: 500, lineHeight: 1.25, maxWidth: 880 }}>{unito(scheda.testo)}</p>
      </Area>
      <Img
        src={staticFile("mascotte/bussolina.webp")}
        style={{ position: "absolute", right: 72, bottom: 64, height: 260, width: "auto" }}
      />
    </>
  );
}

function Chiusura({ post }: { post: PostSocial }) {
  const [fonte, ...altre] = post.fonti;
  // L'invito in due righe: lo slogan e l'azione.
  const [slogan, azione] = INVITO.split(". ");
  return (
    <Area stile={{ display: "flex", flexDirection: "column" }}>
      <h2
        style={{
          margin: "0 0 18px",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 66,
          letterSpacing: "-0.025em",
          wordSpacing: "0.08em",
        }}
      >
        {altre.length ? "Le fonti ufficiali" : "La fonte ufficiale"}
      </h2>
      <Barra />
      <div
        style={{
          marginTop: 44,
          padding: "36px 40px",
          borderRadius: 32,
          backgroundColor: COLORI.card,
          border: `1px solid ${COLORI.bordo}`,
          boxShadow: OMBRA_SCHEDA,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 600, color: COLORI.tenue }}>{fonte.ente}</div>
        <div style={{ marginTop: 12, fontFamily: TITOLI, fontWeight: 700, fontSize: 42, lineHeight: 1.15 }}>{fonte.titolo}</div>
        {altre.length ? (
          <div style={{ marginTop: 16, fontSize: 30, color: COLORI.tenue }}>
            e {altre.length === 1 ? "un'altra fonte" : `altre ${altre.length} fonti`}: i link sono nel testo del post
          </div>
        ) : (
          <div style={{ marginTop: 16, fontSize: 30, color: COLORI.tenue }}>Il link è nel testo del post</div>
        )}
        <div style={{ marginTop: 20, fontSize: 30, fontWeight: 600, color: COLORI.successo }}>
          ✓ Controllata il {dataSvizzera(post.verificatoIl)}
        </div>
      </div>
      <p style={{ margin: "28px 4px 0", fontSize: 28, lineHeight: 1.35, color: COLORI.tenue }}>{AVVISO}</p>
      <div
        style={{
          marginTop: "auto",
          padding: "48px 48px 52px",
          borderRadius: 36,
          backgroundImage: SFUMATURA,
          color: "#fff",
          position: "relative",
        }}
      >
        <div style={{ fontFamily: TITOLI, fontWeight: 800, fontSize: 50, lineHeight: 1.1, maxWidth: 540, wordSpacing: "0.06em" }}>
          {slogan}.
        </div>
        <div style={{ marginTop: 22, fontSize: 36, fontWeight: 600 }}>{azione} →</div>
        <Img
          src={staticFile("mascotte/festa.webp")}
          style={{ position: "absolute", right: 8, bottom: 8, height: 330, width: "auto" }}
        />
      </div>
    </Area>
  );
}
