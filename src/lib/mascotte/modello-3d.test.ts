import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { creaMascotte3d } from "./modello-3d";
import { CAPPELLI, OCCHIALI, SCIARPE, VESTITO_PREDEFINITO } from "./vestito";

function visibili(radice: THREE.Object3D, prefisso: string): string[] {
  const nomi: string[] = [];
  radice.traverse((o) => {
    if (o.name.startsWith(prefisso) && o.visible) nomi.push(o.name);
  });
  return nomi;
}

describe("modello 3D della mascotte", () => {
  it("ha un oggetto per ogni accessorio del guardaroba", () => {
    const { radice } = creaMascotte3d();
    const attesi = [
      ...Object.keys(CAPPELLI).filter((k) => k !== "nessuno").map((k) => `cappello:${k}`),
      ...Object.keys(OCCHIALI).filter((k) => k !== "nessuno").map((k) => `occhiali:${k}`),
      ...Object.keys(SCIARPE).filter((k) => k !== "nessuna").map((k) => `sciarpa:${k}`),
    ];
    for (const nome of attesi) expect(radice.getObjectByName(nome), nome).toBeDefined();
  });

  it("senza accessori non mostra cappelli, occhiali né sciarpe", () => {
    const m = creaMascotte3d();
    m.vesti(VESTITO_PREDEFINITO);
    expect(visibili(m.radice, "cappello:")).toEqual([]);
    expect(visibili(m.radice, "occhiali:")).toEqual([]);
    expect(visibili(m.radice, "sciarpa:")).toEqual([]);
  });

  it("combina cappello, occhiali e sciarpa insieme, uno per tipo", () => {
    const m = creaMascotte3d();
    m.vesti({ cappello: "pescatore", occhiali: "sole", sciarpa: "beige" });
    expect(visibili(m.radice, "cappello:")).toEqual(["cappello:pescatore"]);
    expect(visibili(m.radice, "occhiali:")).toEqual(["occhiali:sole"]);
    expect(visibili(m.radice, "sciarpa:")).toEqual(["sciarpa:beige"]);
    // cambiando cappello il vecchio sparisce, il resto resta
    m.vesti({ cappello: "berretto-blu", occhiali: "sole", sciarpa: "beige" });
    expect(visibili(m.radice, "cappello:")).toEqual(["cappello:berretto-blu"]);
    expect(visibili(m.radice, "sciarpa:")).toEqual(["sciarpa:beige"]);
  });

  it("Bleo e la bussolina stanno sul piedistallo e sopra il suo piano", () => {
    const { radice } = creaMascotte3d();
    radice.updateMatrixWorld(true);
    for (const nome of ["bleo", "bussolina"]) {
      const scatola = new THREE.Box3().setFromObject(radice.getObjectByName(nome)!, true);
      // anche con il cappello più largo, niente sporge oltre il bordo del piedistallo (raggio 1.25)
      for (const valore of [scatola.min.x, scatola.max.x, scatola.min.z, scatola.max.z]) {
        expect(Math.abs(valore), nome).toBeLessThan(1.3);
      }
      expect(scatola.min.y, nome).toBeGreaterThanOrEqual(-0.01);
    }
  });

  it("libera le risorse senza errori", () => {
    expect(() => creaMascotte3d().dispose()).not.toThrow();
  });
});
