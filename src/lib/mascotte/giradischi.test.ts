import { describe, expect, it } from "vitest";
import {
  avanza,
  finisciTrascinamento,
  giraDi,
  inMovimento,
  iniziaTrascinamento,
  nuovoGiradischi,
  PAUSA_AUTOMATICA,
  RADIANTI_PER_PIXEL,
  trascina,
  VELOCITA_AUTOMATICA,
} from "./giradischi";

function simula(g: ReturnType<typeof nuovoGiradischi>, secondi: number, automatico: boolean) {
  let stato = g;
  for (let t = 0; t < secondi; t += 1 / 60) stato = avanza(stato, 1 / 60, automatico);
  return stato;
}

describe("giradischi", () => {
  it("segue il dito mentre lo si trascina", () => {
    let g = iniziaTrascinamento(nuovoGiradischi());
    g = trascina(g, 100, 0.1);
    expect(g.angolo).toBeCloseTo(100 * RADIANTI_PER_PIXEL);
    // mentre si trascina, il tempo da solo non lo muove
    expect(avanza(g, 1, true).angolo).toBe(g.angolo);
  });

  it("continua a girare per inerzia e poi si ferma", () => {
    let g = iniziaTrascinamento(nuovoGiradischi());
    g = finisciTrascinamento(trascina(g, 40, 0.02));
    const dopoPoco = avanza(g, 1 / 60, false);
    expect(dopoPoco.angolo).toBeGreaterThan(g.angolo);
    const dopoMolto = simula(g, 5, false);
    expect(dopoMolto.velocita).toBe(0);
    expect(inMovimento(dopoMolto, false)).toBe(false);
  });

  it("limita la velocità di un lancio troppo forte", () => {
    const g = trascina(iniziaTrascinamento(nuovoGiradischi()), 10_000, 0.001);
    expect(Math.abs(g.velocita)).toBeLessThanOrEqual(12);
  });

  it("i pulsanti girano di un passo esatto, e due clic si sommano", () => {
    let g = giraDi(nuovoGiradischi(), Math.PI / 4);
    g = giraDi(g, Math.PI / 4);
    const fine = simula(g, 2, false);
    expect(fine.angolo).toBeCloseTo(Math.PI / 2, 3);
    expect(fine.obiettivo).toBeNull();
  });

  it("gira piano da solo solo dopo una pausa e solo se permesso", () => {
    const g = nuovoGiradischi();
    expect(simula(g, PAUSA_AUTOMATICA - 0.5, true).angolo).toBe(0);
    const dopo = simula(g, PAUSA_AUTOMATICA + 1, true);
    expect(dopo.angolo).toBeGreaterThan(0);
    expect(dopo.angolo).toBeLessThanOrEqual(VELOCITA_AUTOMATICA * 1.1);
    // con meno movimento richiesto resta fermo
    expect(simula(g, 10, false).angolo).toBe(0);
  });

  it("un nuovo tocco azzera la pausa", () => {
    const fermo = simula(nuovoGiradischi(), PAUSA_AUTOMATICA + 1, true);
    const toccato = finisciTrascinamento(iniziaTrascinamento(fermo));
    expect(avanza(toccato, 0.5, true).angolo).toBe(toccato.angolo);
  });
});
