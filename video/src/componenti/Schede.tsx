import type { CSSProperties, ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { dataSvizzera, type Fonte } from "../../../src/data/svizzera";
import type { Scena, Schermo } from "../lezioni/tipi";
import type { TempoScena } from "../tempi";
import { COLORI, GRIGLIA, OMBRA_SCHEDA, SFUMATURA, TESTO, TITOLI } from "../stile";

const USCITA = 8;
const RITARDO_ENTRATA = 5;
const PADDING = 30;
const MOLLA = { damping: 14, stiffness: 110, mass: 0.9 };

type Gruppo = { chiave: string; scene: number[]; inizio: number; fine: number };

/** Scene consecutive con la stessa scheda (per ora: lo stesso elenco) formano un gruppo. */
export function gruppiSchede(scene: readonly Scena[], tempi: readonly TempoScena[]): Gruppo[] {
  const gruppi: Gruppo[] = [];
  scene.forEach((scena, i) => {
    const chiave = scena.schermo.tipo === "elenco" ? `elenco:${scena.schermo.titolo}` : `scena:${i}`;
    const ultimo = gruppi.at(-1);
    const fine = tempi[i].inizio + tempi[i].durata;
    if (ultimo && ultimo.chiave === chiave) {
      ultimo.scene.push(i);
      ultimo.fine = fine;
    } else {
      gruppi.push({ chiave, scene: [i], inizio: tempi[i].inizio, fine });
    }
  });
  return gruppi;
}

/** Il punto chiave di ogni scena, nella colonna accanto a Bleo: entra con una molla, esce scivolando. */
export function Schede({ scene, tempi }: { scene: readonly Scena[]; tempi: readonly TempoScena[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const gruppi = gruppiSchede(scene, tempi);
  return (
    <div
      style={{
        position: "absolute",
        left: GRIGLIA.colonna.x,
        width: GRIGLIA.colonna.larghezza,
        top: GRIGLIA.clip.y,
        height: GRIGLIA.clip.lato,
      }}
    >
      {gruppi.map((g) => {
        if (frame < g.inizio || frame >= g.fine + USCITA) return null;
        const entrata = spring({ frame: frame - g.inizio - RITARDO_ENTRATA, fps, config: MOLLA });
        const uscita = interpolate(frame, [g.fine, g.fine + USCITA], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // La scena del gruppo in corso adesso.
        const attuale = g.scene.filter((i) => tempi[i].inizio <= frame).at(-1) ?? g.scene[0];
        const schermo = scene[attuale].schermo;
        const comparse = g.scene.map((i) => ({ inizio: tempi[i].inizio, schermo: scene[i].schermo }));
        return (
          <div
            key={g.chiave}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              opacity: Math.min(entrata, 1) * (1 - uscita),
              transform: `translateX(${(1 - entrata) * 70 - uscita * 40}px) scale(${0.92 + 0.08 * entrata - uscita * 0.04})`,
              transformOrigin: "left center",
            }}
          >
            <Scheda schermo={schermo} locale={frame - g.inizio} comparse={comparse} />
          </div>
        );
      })}
    </div>
  );
}

/** Una scheda, a frame `locale` dalla sua comparsa (usata anche dallo stile «presentatore»). */
export function Scheda({
  schermo,
  locale,
  comparse,
}: {
  schermo: Schermo;
  locale: number;
  comparse: { inizio: number; schermo: Schermo }[];
}) {
  switch (schermo.tipo) {
    case "titolo":
      return <SchedaTitolo etichetta={schermo.etichetta} titolo={schermo.titolo} locale={locale} />;
    case "elenco":
      return <SchedaElenco schermo={schermo} comparse={comparse} />;
    case "attenzione":
      return <SchedaAttenzione titolo={schermo.titolo} testo={schermo.testo} locale={locale} />;
    case "punto":
      return <SchedaPunto titolo={schermo.titolo} testo={schermo.testo} fonte={schermo.fonte} />;
    case "fonte":
      return <SchedaFonte fonte={schermo.fonte} verificatoIl={schermo.verificatoIl} locale={locale} />;
  }
}

function Cornice({ children, stile }: { children: ReactNode; stile?: CSSProperties }) {
  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: PADDING,
        borderRadius: 40,
        backgroundColor: COLORI.card,
        border: `1px solid ${COLORI.bordo}`,
        boxShadow: OMBRA_SCHEDA,
        fontFamily: TESTO,
        color: COLORI.testo,
        ...stile,
      }}
    >
      {children}
    </div>
  );
}

function Barra() {
  return <div style={{ width: 76, height: 8, borderRadius: 4, backgroundImage: SFUMATURA }} />;
}

function SchedaTitolo({ etichetta, titolo, locale }: { etichetta: string; titolo: string; locale: number }) {
  const { fps } = useVideoConfig();
  const parole = titolo.split(" ");
  return (
    <Cornice stile={{ padding: "40px 32px 44px" }}>
      <span
        style={{
          display: "inline-block",
          padding: "9px 16px",
          borderRadius: 999,
          backgroundColor: COLORI.brandTenue,
          color: COLORI.brand,
          fontWeight: 700,
          fontSize: 20,
          whiteSpace: "nowrap",
        }}
      >
        {etichetta}
      </span>
      <h1
        style={{
          margin: "26px 0 28px",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 58,
          lineHeight: 1.04,
          letterSpacing: "-0.03em",
          color: COLORI.testo,
        }}
      >
        {parole.map((p, i) => {
          const s = spring({ frame: locale - 10 - i * 3, fps, config: MOLLA });
          return (
            <span
              key={`${p}-${i}`}
              style={{
                display: "inline-block",
                marginRight: "0.24em",
                opacity: Math.min(s, 1),
                transform: `translateY(${(1 - s) * 26}px)`,
              }}
            >
              {p}
            </span>
          );
        })}
      </h1>
      <Barra />
    </Cornice>
  );
}

function SchedaElenco({
  schermo,
  comparse,
}: {
  schermo: Extract<Schermo, { tipo: "elenco" }>;
  comparse: { inizio: number; schermo: Schermo }[];
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Il frame in cui compare ogni punto: l'inizio della prima scena che lo mostra.
  const comparsaPunto = schermo.punti.map((_, i) => {
    const c = comparse.find((x) => x.schermo.tipo === "elenco" && x.schermo.visibili > i);
    return c ? c.inizio + 4 : Infinity;
  });
  const ultimoVisibile = schermo.visibili - 1;
  return (
    <Cornice>
      {schermo.intro ? (
        <p style={{ margin: 0, fontSize: 24, fontWeight: 500, lineHeight: 1.3, color: COLORI.tenue }}>{schermo.intro}</p>
      ) : null}
      <h2
        style={{
          margin: "10px 0 22px",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 44,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
        }}
      >
        {schermo.titolo}
      </h2>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {schermo.punti.map((punto, i) => {
          const s = spring({ frame: frame - comparsaPunto[i], fps, config: MOLLA });
          const visibile = i < schermo.visibili;
          const evidenza = visibile && i === ultimoVisibile ? Math.min(s, 1) : 0;
          return (
            <li
              key={punto.testo}
              data-punto={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                padding: "12px 14px",
                margin: "0 -14px",
                borderRadius: 22,
                backgroundColor: `rgba(227, 240, 241, ${evidenza})`,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: TITOLI,
                  fontWeight: 800,
                  fontSize: 26,
                  boxSizing: "border-box",
                  border: visibile ? "none" : `2px dashed ${COLORI.bordo}`,
                  backgroundColor: visibile ? COLORI.brand : "transparent",
                  color: visibile ? COLORI.card : "#b3ada2",
                  transform: `scale(${visibile ? 0.6 + 0.4 * s : 1})`,
                }}
              >
                {i + 1}
              </div>
              {visibile ? (
                <div
                  style={{
                    paddingTop: 7,
                    opacity: Math.min(s, 1),
                    transform: `translateX(${(1 - s) * 24}px)`,
                  }}
                >
                  <div style={{ fontSize: 29, fontWeight: 600, lineHeight: 1.2 }}>{punto.testo}</div>
                  {punto.nota ? (
                    <div style={{ marginTop: 6, fontSize: 21, fontWeight: 500, color: COLORI.tenue }}>{punto.nota}</div>
                  ) : null}
                </div>
              ) : (
                <div style={{ paddingTop: 19, flex: 1 }}>
                  <div style={{ height: 14, width: `${78 - i * 12}%`, borderRadius: 7, backgroundColor: "#efece6" }} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Cornice>
  );
}

function SchedaAttenzione({ titolo, testo, locale }: { titolo: string; testo?: string; locale: number }) {
  // L'icona oscilla un attimo quando la scheda entra.
  const smorza = Math.max(0, 1 - Math.max(0, locale - 8) / 24);
  const rotazione = Math.sin(Math.max(0, locale - 8) / 1.6) * 12 * smorza;
  return (
    <Cornice stile={{ backgroundColor: COLORI.accentoTenue, border: `2px solid rgba(156, 92, 28, 0.35)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: COLORI.accento,
            color: COLORI.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: TITOLI,
            fontWeight: 800,
            fontSize: 34,
            transform: `rotate(${rotazione}deg)`,
          }}
        >
          !
        </div>
        <span style={{ fontSize: 24, fontWeight: 700, color: COLORI.accento }}>Attenzione</span>
      </div>
      <h2
        style={{
          margin: "22px 0 0",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 44,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          color: "#5e3510",
        }}
      >
        {titolo}
      </h2>
      {testo ? (
        <p style={{ margin: "18px 0 0", fontSize: 26, fontWeight: 500, lineHeight: 1.35, color: "#4a3b2c" }}>{testo}</p>
      ) : null}
    </Cornice>
  );
}

function SchedaPunto({ titolo, testo, fonte }: { titolo: string; testo?: string; fonte?: Fonte }) {
  return (
    <Cornice>
      <Barra />
      <h2
        style={{
          margin: "22px 0 0",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 46,
          lineHeight: 1.06,
          letterSpacing: "-0.02em",
        }}
      >
        {titolo}
      </h2>
      {testo ? (
        <p style={{ margin: "16px 0 0", fontSize: 28, fontWeight: 500, lineHeight: 1.35, color: COLORI.tenue }}>{testo}</p>
      ) : null}
      {fonte ? (
        <p
          style={{
            margin: "22px 0 0",
            paddingTop: 16,
            borderTop: `1px solid ${COLORI.bordo}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 20,
            fontWeight: 500,
            color: COLORI.tenue,
          }}
        >
          <IconaLink colore={COLORI.brand} />
          Fonte: {fonte.ente}
        </p>
      ) : null}
    </Cornice>
  );
}

function SchedaFonte({ fonte, verificatoIl, locale }: { fonte: Fonte; verificatoIl: string; locale: number }) {
  const { fps } = useVideoConfig();
  const timbro = spring({ frame: locale - 22, fps, config: { damping: 11, stiffness: 140 } });
  const indirizzo = new URL(fonte.url);
  const breve = `${indirizzo.hostname.replace(/^www\./, "")}${indirizzo.pathname}`;
  return (
    <Cornice>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORI.brand, fontSize: 22, fontWeight: 700 }}>
        <IconaLink colore={COLORI.brand} grande />
        Fonte ufficiale
      </div>
      <h2
        style={{
          margin: "18px 0 0",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 38,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        {fonte.titolo}
      </h2>
      <p style={{ margin: "14px 0 0", fontSize: 26, fontWeight: 600, color: COLORI.brand }}>{fonte.ente}</p>
      <p style={{ margin: "6px 0 0", fontSize: 19, fontWeight: 500, color: COLORI.tenue, overflowWrap: "anywhere" }}>{breve}</p>
      <div
        style={{
          marginTop: 24,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          borderRadius: 999,
          whiteSpace: "nowrap",
          backgroundColor: COLORI.successoTenue,
          color: COLORI.successo,
          fontSize: 19,
          fontWeight: 600,
          opacity: Math.min(timbro, 1),
          transform: `scale(${0.7 + 0.3 * timbro})`,
          transformOrigin: "left center",
        }}
      >
        <IconaSpunta colore={COLORI.successo} />
        Fonte controllata il {dataSvizzera(verificatoIl)}
      </div>
    </Cornice>
  );
}

function IconaLink({ colore, grande = false }: { colore: string; grande?: boolean }) {
  const lato = grande ? 26 : 20;
  return (
    <svg width={lato} height={lato} viewBox="0 0 24 24" fill="none" stroke={colore} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}

function IconaSpunta({ colore }: { colore: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colore} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
