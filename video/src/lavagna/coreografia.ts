/**
 * La bussolina sulla lavagna: per ogni scena va dove dice il disegno e fa la
 * sua azione al momento chiave (tocca, lancia, si spaventa, festeggia). Usa
 * lo stesso regista dello stile «presentatore» (presentatore/coreografia.ts),
 * così nel misto è sempre la stessa bussolina.
 */
import type { Lezione } from "../lezioni/tipi";
import {
  ANGOLO_TOCCO,
  DURATE,
  manoDestra,
  nuovaRegia,
  vai,
  type Piano,
  type Regia,
} from "../presentatore/coreografia";
import { FPS, type Tempi } from "../tempi";
import { DISEGNI, type ContestoDisegno } from "./disegni";
import type { AzioneBussolina } from "./disegni/tipi";
import { LAVAGNA, suTela } from "./griglia";

const ALTEZZA = LAVAGNA.bussolina.altezza;
/** Dove aspetta se la scena non ha un disegno: in basso a destra. */
const POSTO_SENZA_DISEGNO = { x: 880, y: 745 };

/** I tempi di una scena per il suo disegno: i cambi di sottotitolo dall'inizio della scena. */
export function contestoScena(tempi: Tempi, i: number): ContestoDisegno {
  const { inizio, durata, voce } = tempi.scene[i];
  const cambi = tempi.battute
    .map((b) => Math.round(b.inizio * FPS) - inizio)
    .filter((f) => f > 2 && f < durata);
  return { durata, voce, cambi, fps: FPS };
}

/** Il momento chiave della scena `i` (fotogrammi dall'inizio della scena), se ha un disegno. */
export function chiaveScena(lezione: Lezione, tempi: Tempi, i: number): number {
  const nome = lezione.scene[i].disegno;
  const disegno = nome ? DISEGNI[nome] : undefined;
  const ctx = contestoScena(tempi, i);
  return disegno ? disegno.chiave(ctx) : Math.round(ctx.voce * 0.4);
}

/**
 * Le mosse della bussolina per la scena `i` sulla lavagna, a partire dal
 * fotogramma `da` (l'inizio della scena, o il passaggio dal presentatore nel
 * misto). Le azioni che cadrebbero prima di `da` si saltano.
 */
export function scenaLavagna(r: Regia, lezione: Lezione, tempi: Tempi, i: number, da = tempi.scene[i].inizio) {
  const scena = lezione.scene[i];
  const disegno = scena.disegno ? DISEGNI[scena.disegno] : undefined;
  const ctx = contestoScena(tempi, i);
  const s = tempi.scene[i].inizio;
  const fine = s + tempi.scene[i].durata;
  const piano = disegno?.bussolina(ctx) ?? { posto: POSTO_SENZA_DISEGNO, azioni: [] };
  const azioni = piano.azioni.filter((a) => s + a.quando >= da + 14);
  const mano = manoDestra(ANGOLO_TOCCO, ALTEZZA);
  // Per toccare qualcosa si mette accanto, con la mano alla giusta altezza.
  const piediPer = (a: (typeof azioni)[number]) => {
    if (a.tipo !== "tocca") return null;
    const b = suTela(a.bersaglio.x, a.bersaglio.y);
    const verso = a.specchio ? -1 : 1;
    return { x: b.x - verso * (mano.x - 4), y: b.y - mano.y };
  };
  const primoTocco = azioni.map(piediPer).find((p) => p !== null);
  const posto = primoTocco ?? suTela(piano.posto.x, piano.posto.y);
  const tocco = azioni.find((a): a is Extract<AzioneBussolina, { tipo: "tocca" }> => a.tipo === "tocca");
  const specchio = tocco ? (tocco.specchio ?? false) : (piano.specchio ?? false);
  vai(r, posto, da + 2, 14, 80, specchio);
  let festa = false;
  for (const a of azioni) {
    const t = s + a.quando;
    switch (a.tipo) {
      case "tocca": {
        const piedi = piediPer(a)!;
        vai(r, piedi, Math.max(da + 18, t - 18), 12, 50, a.specchio ?? false);
        r.mosse.push({ tipo: "tocca", inizio: t - 5, durata: DURATE.tocco });
        const b = suTela(a.bersaglio.x, a.bersaglio.y);
        r.scintille.push({ x: b.x, y: b.y, inizio: t, raggio: 80 });
        break;
      }
      case "lancia":
        r.mosse.push({ tipo: "lancia", inizio: t - 5, durata: DURATE.lancio });
        break;
      case "scuoti":
        r.mosse.push({ tipo: "scuoti", inizio: t, durata: DURATE.scossa });
        r.allerte.push({ inizio: t + 1, fine: Math.min(t + DURATE.allerta, fine) });
        break;
      case "festeggia":
        festa = true;
        r.mosse.push({ tipo: "festeggia", inizio: t, durata: Math.max(30, fine - 4 - t) });
        break;
    }
  }
  // Nell'ultima scena fa festa sull'ultima frase («Ci vediamo al prossimo passo!»).
  if (!festa && i === lezione.scene.length - 1) {
    const ultima = Math.max(...ctx.cambi.map((c) => s + c), s + Math.round(ctx.voce * 0.6));
    const inizio = Math.max(ultima, (r.mosse.at(-1)?.inizio ?? 0) + (r.mosse.at(-1)?.durata ?? 0) + 2);
    if (fine - 4 - inizio >= 30) r.mosse.push({ tipo: "festeggia", inizio, durata: fine - 4 - inizio });
  }
}

/** Tutta la lezione sulla lavagna. */
export function pianoLavagna(lezione: Lezione, tempi: Tempi): Piano {
  const r = nuovaRegia();
  lezione.scene.forEach((_, i) => scenaLavagna(r, lezione, tempi, i));
  return { ...r, fine: tempi.inizioFine };
}
