import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Fine } from "../componenti/Fine";
import { Marchio } from "../componenti/Marchio";
import { Sfondo } from "../componenti/Sfondo";
import { trovaLezione } from "../lezioni";
import type { Durate, Lezione } from "../lezioni/tipi";
import { COLORI, GRIGLIA, OMBRA_SCHEDA, TESTO, TITOLI } from "../stile";
import type { Tempi } from "../tempi";
import { TEMPI_SCHEDE } from "./coreografia";
import { PRESENTATORE } from "./griglia";
import { Presentatore } from "./Presentatore";

/**
 * Vetrina delle animazioni della bussolina (composizione
 * `bussolina-animazioni`, senza voce): le schede della lezione 1 una dopo
 * l'altra, con un'etichetta che dice che cosa sta facendo la bussolina.
 */
const LEZIONE_ID = "ditta-individuale";
/** Le scene della lezione 1 da mostrare e quanti fotogrammi dura ciascuna. */
const SCENE: readonly { indice: number; durata: number }[] = [
  { indice: 0, durata: 90 }, // titolo
  { indice: 1, durata: 54 }, // elenco vuoto, cartellino «3»
  { indice: 2, durata: 42 },
  { indice: 3, durata: 42 },
  { indice: 4, durata: 42 },
  { indice: 5, durata: 78 }, // attenzione
  { indice: 6, durata: 54 }, // punto
  { indice: 8, durata: 84 }, // fonte
];
const INIZIO = 12;
const DURATA_FINE = 60;

export function tempiVetrina(): { lezione: Lezione; tempi: Tempi; etichette: { da: number; testo: string }[] } {
  const originale = trovaLezione(LEZIONE_ID);
  const lezione: Lezione = { ...originale, scene: SCENE.map((s) => originale.scene[s.indice]) };
  let frame = INIZIO;
  const scene = SCENE.map((s) => {
    const tempo = { inizio: frame, durata: s.durata, voce: 0 };
    frame += s.durata;
    return tempo;
  });
  const tempi: Tempi = { scene, inizioFine: frame, totale: frame + DURATA_FINE, battute: [] };
  const da = (i: number) => scene[i].inizio;
  const etichette = [
    { da: 0, testo: "Entra volando" },
    { da: da(0) + TEMPI_SCHEDE.titoloTira, testo: "Srotola il titolo" },
    { da: da(1), testo: "Alza il cartellino «3»" },
    { da: da(2), testo: "Tocca e fa comparire" },
    { da: da(5), testo: "Fa girare l'ago" },
    { da: da(6), testo: "Lancia una scheda" },
    { da: da(7), testo: "Spinge la fonte" },
    { da: tempi.inizioFine, testo: "Festeggia" },
  ];
  return { lezione, tempi, etichette };
}

export type PropsVetrina = { durate: Durate | null };

export function Vetrina({ durate }: PropsVetrina) {
  if (!durate) throw new Error("Mancano le durate: lancia prima npm run prepara.");
  const { lezione, tempi, etichette } = tempiVetrina();
  return (
    <AbsoluteFill>
      <Sfondo />
      <Testata />
      <Presentatore lezione={lezione} durate={durate} tempi={tempi} />
      <Sequence from={tempi.inizioFine}>
        <Fine prossimoPasso={lezione.prossimoPasso} salta marchio={false} />
      </Sequence>
      <Etichetta etichette={etichette} />
    </AbsoluteFill>
  );
}

function Testata() {
  return (
    <div
      style={{
        position: "absolute",
        left: GRIGLIA.margine,
        right: GRIGLIA.margine,
        top: 40,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Marchio altezza={46} />
      <span style={{ fontFamily: TESTO, fontWeight: 600, fontSize: 22, color: COLORI.tenue }}>
        Le animazioni della bussolina
      </span>
    </div>
  );
}

/** L'etichetta in basso, al posto dei sottotitoli: numero e nome dell'animazione. */
function Etichetta({ etichette }: { etichette: readonly { da: number; testo: string }[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = etichette.findLastIndex((e) => frame >= e.da);
  if (i === -1) return null;
  const e = etichette[i];
  const su = spring({ frame: frame - e.da, fps, config: { damping: 13, stiffness: 160 } });
  const { lato, fondo, altezza } = PRESENTATORE.sottotitoli;
  return (
    <div
      style={{
        position: "absolute",
        left: lato,
        right: lato,
        bottom: fondo,
        height: altezza,
        borderRadius: 40,
        backgroundColor: "rgba(255, 255, 255, 0.94)",
        border: `1px solid ${COLORI.bordo}`,
        boxShadow: OMBRA_SCHEDA,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: COLORI.brand,
          color: COLORI.card,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 30,
          transform: `scale(${0.6 + 0.4 * Math.min(su, 1.15)})`,
        }}
      >
        {i + 1}
      </div>
      <span
        style={{
          fontFamily: TITOLI,
          fontWeight: 800,
          fontSize: 50,
          letterSpacing: "-0.02em",
          color: COLORI.testo,
          opacity: Math.min(su, 1),
          transform: `translateY(${(1 - Math.min(su, 1)) * 14}px)`,
        }}
      >
        {e.testo}
      </span>
      <span style={{ fontFamily: TESTO, fontWeight: 600, fontSize: 24, color: COLORI.tenue }}>
        {i + 1}/{etichette.length}
      </span>
    </div>
  );
}
