/**
 * Stile «misto»: ogni scena è «presentatore» o «lavagna» (`stile` della
 * scena; con due stili la scena si divide alla prima pausa della voce). Fra
 * l'uno e l'altro Bleo vola nella finestra rotonda (o ne esce), i disegni
 * entrano o scivolano via, e la bussolina è sempre la stessa: vola al suo
 * nuovo posto e cambia un po' di misura.
 */
import { useCurrentFrame } from "remotion";
import { gruppiSchede } from "../componenti/Schede";
import { scenaLavagna, contestoScena } from "../lavagna/coreografia";
import { LAVAGNA } from "../lavagna/griglia";
import { apparizione, BleoFinestra, Contatore, DisegniLavagna, Puntini, type Segmenti } from "../lavagna/Lavagna";
import { tra } from "../lavagna/figure";
import type { Durate, Lezione, StileScena } from "../lezioni/tipi";
import { BleoPresentatore } from "../presentatore/BleoPresentatore";
import { Bussolina } from "../presentatore/Bussolina";
import {
  DIMENSIONI_BUSSOLINA,
  gruppoPresentatore,
  nuovaRegia,
  posa,
  type GruppoScene,
  type Misura,
  type Piano,
} from "../presentatore/coreografia";
import { PRESENTATORE } from "../presentatore/griglia";
import { CopieDaMisurare, SchedePresentatore, useMisure } from "../presentatore/Presentatore";
import { Scintille } from "../presentatore/Scintille";
import { FPS, type Tempi } from "../tempi";

/** Un pezzo di video in uno stile: [da, a) in fotogrammi. */
export type Segmento = { da: number; a: number; stile: StileScena };

/** Fotogrammi del passaggio fra i due stili (poco prima e dopo il cambio). */
const PRIMA = 6;
const DOPO = 14;

/** Gli stili della scena: uno, o due divisi alla prima pausa della voce. */
function stiliScena(lezione: Lezione, tempi: Tempi, i: number): { stile: StileScena; da: number }[] {
  const s = tempi.scene[i].inizio;
  const st = lezione.scene[i].stile ?? "presentatore";
  if (typeof st === "string") return [{ stile: st, da: s }];
  const taglio = s + (contestoScena(tempi, i).cambi[0] ?? Math.round(tempi.scene[i].voce / 2));
  return [
    { stile: st[0], da: s },
    { stile: st[1], da: taglio },
  ];
}

/** I pezzi del video nei due stili, in ordine, uniti quando lo stile non cambia. */
export function segmentiMisto(lezione: Lezione, tempi: Tempi): Segmento[] {
  const pezzi = lezione.scene.flatMap((_, i) => stiliScena(lezione, tempi, i));
  const segmenti: Segmento[] = [];
  pezzi.forEach((p, k) => {
    const a = pezzi[k + 1]?.da ?? tempi.totale;
    const ultimo = segmenti.at(-1);
    if (ultimo && ultimo.stile === p.stile) ultimo.a = a;
    else segmenti.push({ da: p.da, a, stile: p.stile });
  });
  return segmenti;
}

/** Quanto è «lavagna» il fotogramma: 0 presentatore, 1 lavagna, in mezzo durante i passaggi. */
export function quantoLavagna(f: number, segmenti: readonly Segmento[]): number {
  const valore = (s: Segmento | undefined) => (s?.stile === "lavagna" ? 1 : 0);
  for (let k = 0; k < segmenti.length; k++) {
    const s = segmenti[k];
    if (f < s.da - PRIMA) continue;
    const prossimo = segmenti[k + 1];
    if (prossimo && f >= prossimo.da - PRIMA) continue;
    const prima = valore(segmenti[k - 1]);
    if (k > 0 && f < s.da + DOPO) return prima + (valore(s) - prima) * tra(f, s.da - PRIMA, s.da + DOPO);
    return valore(s);
  }
  return valore(segmenti[0]);
}

/** Lo stile nel momento `f`. */
function stileAl(f: number, segmenti: readonly Segmento[]): StileScena {
  return (segmenti.find((s) => f >= s.da && f < s.a) ?? segmenti[0]).stile;
}

/** I gruppi di schede del presentatore, finiti dove finisce il loro pezzo presentatore. */
function gruppiPresentatore(lezione: Lezione, tempi: Tempi, segmenti: readonly Segmento[]): GruppoScene[] {
  return gruppiSchede(lezione.scene, tempi.scene)
    .filter((g) => stileAl(g.inizio, segmenti) === "presentatore")
    .map((g) => {
      const pezzo = segmenti.find((s) => g.inizio >= s.da && g.inizio < s.a)!;
      return { ...g, fine: Math.min(g.fine, pezzo.a) };
    });
}

/** La bussolina in tutto il misto: un solo regista, scena dopo scena, nello stile di ogni pezzo. */
export function pianoMisto(
  lezione: Lezione,
  tempi: Tempi,
  gruppi: readonly GruppoScene[],
  misure: Readonly<Record<string, Misura>>,
): Piano {
  const r = nuovaRegia();
  lezione.scene.forEach((_, i) => {
    for (const pezzo of stiliScena(lezione, tempi, i)) {
      if (pezzo.stile === "lavagna") scenaLavagna(r, lezione, tempi, i, pezzo.da);
      else {
        const g = gruppi.find((x) => x.scene[0] === i);
        if (g) gruppoPresentatore(r, g, lezione.scene, tempi, misure);
      }
    }
  });
  return { ...r, fine: tempi.inizioFine };
}

export function Misto({ lezione, durate, tempi, parla }: { lezione: Lezione; durate: Durate; tempi: Tempi; parla: boolean }) {
  const frame = useCurrentFrame();
  if (!durate.presentatore) throw new Error("Manca Bleo presentatore: rilancia npm run prepara.");
  const segmenti = segmentiMisto(lezione, tempi);
  const lavagna: Segmenti = segmenti.filter((s) => s.stile === "lavagna").map((s) => [s.da, s.a] as const);
  const p = quantoLavagna(frame, segmenti);
  const gruppi = gruppiPresentatore(lezione, tempi, segmenti);
  const misure = useMisure();
  const piano = pianoMisto(lezione, tempi, gruppi, misure.valori);
  const adesso = frame < piano.fine ? posa(piano, frame) : null;
  const altezza = DIMENSIONI_BUSSOLINA.altezza + (LAVAGNA.bussolina.altezza - DIMENSIONI_BUSSOLINA.altezza) * p;
  return (
    <>
      <Puntini opacita={apparizione(frame, lavagna)} />
      <DisegniLavagna lezione={lezione} tempi={tempi} segmenti={lavagna} />
      <Contatore lezione={lezione} tempi={tempi} segmenti={lavagna} />
      <BleoMisto lezione={lezione} durate={durate} p={p} parla={parla} />
      <CopieDaMisurare rif={misure.rif} lezione={lezione} gruppi={gruppi} />
      <SchedePresentatore lezione={lezione} tempi={tempi} gruppi={gruppi} misure={misure.valori} />
      <Scintille scintille={piano.scintille} />
      {adesso ? <Bussolina posa={adesso} piano={piano} altezza={altezza} /> : null}
    </>
  );
}

/**
 * Bleo fra i due stili: `p` = 0 grande in primo piano, 1 nella finestra
 * rotonda. In mezzo si rimpicciolisce e va verso il cerchio mentre la
 * maschera rotonda si stringe attorno a lui, e il clip del viso entra in
 * dissolvenza.
 */
function BleoMisto({ lezione, durate, p, parla }: { lezione: Lezione; durate: Durate; p: number; parla: boolean }) {
  const { cx, cy, r } = LAVAGNA.cerchio;
  const { bleo } = PRESENTATORE;
  // Il punto fra gli occhi di Bleo nel clip del presentatore (960×960): gli
  // occhi sono a ~219 px l'uno dall'altro. Nel cerchio il clip del viso li
  // mostra a ~113 px, con il punto fra gli occhi in (cx + 4, cy − 14): lì
  // va a finire il presentatore, così la dissolvenza non sdoppia il viso.
  const occhi = { x: 405, y: 466 };
  const scalaNormale = bleo.lato / 960;
  const da = { x: bleo.x + occhi.x * scalaNormale, y: bleo.y + occhi.y * scalaNormale };
  const a = { x: cx + 4, y: cy - 14 };
  const scala = 1 + (113 / 219 / scalaNormale - 1) * p;
  const raggio = r + (1250 - r) * (1 - p) ** 2;
  return (
    <>
      {p < 0.999 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `circle(${raggio}px at ${cx}px ${cy}px)` }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: `${da.x}px ${da.y}px`,
              transform: `translate(${(a.x - da.x) * p}px, ${(a.y - da.y) * p}px) scale(${scala})`,
            }}
          >
            <BleoPresentatore clip={durate.presentatore!} />
          </div>
        </div>
      ) : null}
      <BleoFinestra
        src={`${lezione.id}/${lezione.clip}`}
        durataLoop={Math.floor(durate.clip * FPS)}
        parla={parla}
        comparsa={tra(p * 100, 62, 96)}
        dissolvenza
      />
    </>
  );
}
