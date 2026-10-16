/**
 * Bleo e la bussolina in 3D, in piedi su un piedistallo, con tutti gli
 * accessori del guardaroba già montati e nascosti: `vesti` mostra solo quelli
 * scelti. Solo geometrie e materiali di three.js, niente renderer: così il
 * modello si può controllare nei test.
 *
 * Unità: Bleo è alto circa 2.2, il piano del piedistallo è a y = 0, la faccia
 * guarda verso +z (verso la camera).
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CAPPELLI, OCCHIALI, SCIARPE, type Vestito } from "./vestito";

export const COLORI_3D = {
  pelle: "#f7f5f0",
  pancia: "#efe2c6",
  inchiostro: "#121417",
  cuoio: "#8d5c37",
  cuoioScuro: "#6c4428",
  ottone: "#c9a35a",
  teal: "#0f5e6b",
  quadrante: "#f5eddc",
  ago: "#e0533f",
  piedistallo: "#f3eee5",
  fascia: "#0f5e6b",
  cappellinoNero: "#1f2124",
  cappellinoBeige: "#cdb89a",
  pescatore: "#7d8f68",
  berrettoRuggine: "#b4542f",
  berrettoBlu: "#26324d",
  sciarpaVerde: "#7f9469",
  sciarpaBeige: "#d6c09d",
} as const;

/** Testa di Bleo: centro e semiassi dell'ellissoide. */
const TESTA = { y: 1.62, a: 0.62, b: 0.58, c: 0.58 } as const;

export type Mascotte3d = {
  /** Il piedistallo con sopra i due personaggi: è il gruppo da far girare. */
  radice: THREE.Group;
  /** Mostra solo gli accessori del vestito scelto. */
  vesti: (vestito: Vestito) => void;
  /** Libera geometrie e materiali. */
  dispose: () => void;
};

type Materiali = ReturnType<typeof creaMateriali>;

function creaMateriali() {
  const vinile = (colore: string, ruvidita = 0.5) =>
    new THREE.MeshPhysicalMaterial({ color: colore, roughness: ruvidita, clearcoat: 0.25, clearcoatRoughness: 0.45 });
  // a due facce: i cappelli sono superfici sottili, si vedono anche da sotto la tesa
  const tessuto = (colore: string) =>
    new THREE.MeshStandardMaterial({ color: colore, roughness: 0.85, side: THREE.DoubleSide });
  return {
    pelle: vinile(COLORI_3D.pelle, 0.42),
    pancia: vinile(COLORI_3D.pancia, 0.55),
    inchiostro: new THREE.MeshPhysicalMaterial({ color: COLORI_3D.inchiostro, roughness: 0.12, clearcoat: 1 }),
    riflesso: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
    cuoio: new THREE.MeshStandardMaterial({ color: COLORI_3D.cuoio, roughness: 0.65 }),
    cuoioScuro: new THREE.MeshStandardMaterial({ color: COLORI_3D.cuoioScuro, roughness: 0.6 }),
    ottone: new THREE.MeshStandardMaterial({ color: COLORI_3D.ottone, roughness: 0.3, metalness: 0.8 }),
    teal: vinile(COLORI_3D.teal, 0.4),
    quadrante: vinile(COLORI_3D.quadrante, 0.6),
    ago: vinile(COLORI_3D.ago, 0.4),
    piedistallo: new THREE.MeshPhysicalMaterial({ color: COLORI_3D.piedistallo, roughness: 0.55, clearcoat: 0.15 }),
    fascia: vinile(COLORI_3D.fascia, 0.35),
    cappellinoNero: tessuto(COLORI_3D.cappellinoNero),
    cappellinoBeige: tessuto(COLORI_3D.cappellinoBeige),
    pescatore: tessuto(COLORI_3D.pescatore),
    berrettoRuggine: tessuto(COLORI_3D.berrettoRuggine),
    berrettoBlu: tessuto(COLORI_3D.berrettoBlu),
    sciarpaVerde: tessuto(COLORI_3D.sciarpaVerde),
    sciarpaBeige: tessuto(COLORI_3D.sciarpaBeige),
    montaturaOro: new THREE.MeshStandardMaterial({ color: "#b8954d", roughness: 0.3, metalness: 0.7 }),
    montaturaMarrone: new THREE.MeshPhysicalMaterial({ color: "#6b4428", roughness: 0.35, clearcoat: 0.6 }),
    lenteAmbra: new THREE.MeshPhysicalMaterial({
      color: "#d08a2a",
      roughness: 0.1,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
    lenteChiara: new THREE.MeshPhysicalMaterial({
      color: "#dbe8ec",
      roughness: 0.05,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  };
}

// --- piccoli aiuti per costruire le forme --------------------------------------------

const SFERA = new THREE.SphereGeometry(1, 48, 32);

function mesh(geometria: THREE.BufferGeometry, materiale: THREE.Material, nome?: string): THREE.Mesh {
  const m = new THREE.Mesh(geometria, materiale);
  m.castShadow = true;
  m.receiveShadow = true;
  if (nome) m.name = nome;
  return m;
}

function ellissoide(materiale: THREE.Material, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0) {
  const m = mesh(SFERA, materiale);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}

function capsula(materiale: THREE.Material, raggio: number, lunghezza: number) {
  return mesh(new THREE.CapsuleGeometry(raggio, lunghezza, 8, 24), materiale);
}

/** Punto sulla faccia di Bleo (coordinate della testa) e direzione verso l'esterno. */
function suFaccia(x: number, y: number, sporgenza = 0) {
  const { a, b, c } = TESTA;
  const z = c * Math.sqrt(Math.max(0, 1 - (x / a) ** 2 - (y / b) ** 2));
  const normale = new THREE.Vector3(x / a ** 2, y / b ** 2, z / c ** 2).normalize();
  const punto = new THREE.Vector3(x, y, z).addScaledVector(normale, sporgenza);
  return { punto, normale };
}

/** Mette un oggetto in `punto` orientato lungo `normale` (il suo +z guarda fuori). */
function appoggia(oggetto: THREE.Object3D, punto: THREE.Vector3, normale: THREE.Vector3) {
  oggetto.position.copy(punto);
  oggetto.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normale);
  return oggetto;
}

function occhio(m: Materiali, rx: number, ry: number, rz: number) {
  const g = new THREE.Group();
  g.add(ellissoide(m.inchiostro, rx, ry, rz));
  const luce = mesh(SFERA, m.riflesso);
  luce.castShadow = false;
  luce.scale.setScalar(rx * 0.28);
  luce.position.set(rx * 0.35, ry * 0.4, rz * 0.75);
  g.add(luce);
  return g;
}

function sorriso(m: Materiali, raggio: number, spessore: number) {
  const g = new THREE.Group();
  const arco = mesh(new THREE.TorusGeometry(raggio, spessore, 12, 32, Math.PI), m.inchiostro);
  arco.rotation.z = Math.PI; // l'arco di sotto
  g.add(arco);
  return g;
}

// --- Bleo ------------------------------------------------------------------------------

function creaBleo(m: Materiali) {
  const bleo = new THREE.Group();
  bleo.name = "bleo";

  // gambe
  for (const x of [-0.17, 0.17]) {
    const gamba = capsula(m.pelle, 0.16, 0.12);
    gamba.position.set(x, 0.22, 0);
    bleo.add(gamba);
  }
  // corpo e pancia
  bleo.add(ellissoide(m.pelle, 0.42, 0.5, 0.38, 0, 0.72, 0));
  bleo.add(ellissoide(m.pancia, 0.25, 0.3, 0.09, 0, 0.66, 0.295));

  // braccio che saluta (a sinistra per chi guarda) e braccio lungo il fianco
  const saluta = capsula(m.pelle, 0.11, 0.36);
  saluta.position.set(-0.52, 1.12, 0.12);
  saluta.rotation.set(-0.3, 0, 0.62);
  bleo.add(saluta);
  const fianco = capsula(m.pelle, 0.11, 0.28);
  fianco.position.set(0.44, 0.7, 0.02);
  fianco.rotation.set(0, 0, 0.32);
  bleo.add(fianco);

  // borsa a tracolla: cinghia ad anello inclinata e borsa sul fianco
  const cinghia = mesh(new THREE.TorusGeometry(1, 0.06, 12, 72), m.cuoioScuro);
  cinghia.scale.set(0.47, 0.42, 0.42);
  cinghia.position.set(0, 0.8, 0);
  // prima sdraiata (x), poi inclinata dalla spalla al fianco (z)
  cinghia.rotation.set(Math.PI / 2, 0, 0.62, "ZYX");
  bleo.add(cinghia);
  const borsa = new THREE.Group();
  borsa.position.set(-0.4, 0.46, 0.22);
  borsa.rotation.set(0, -0.55, 0.1);
  borsa.add(mesh(new RoundedBoxGeometry(0.3, 0.24, 0.12, 4, 0.05), m.cuoio));
  const patta = mesh(new RoundedBoxGeometry(0.31, 0.13, 0.135, 4, 0.05), m.cuoioScuro);
  patta.position.set(0, 0.065, 0.004);
  borsa.add(patta);
  const bottone = mesh(new THREE.SphereGeometry(0.022, 16, 12), m.ottone);
  bottone.position.set(0, 0.01, 0.07);
  borsa.add(bottone);
  bleo.add(borsa);

  // testa con occhi e sorriso
  const testa = new THREE.Group();
  testa.name = "testa";
  testa.position.y = TESTA.y;
  testa.add(ellissoide(m.pelle, TESTA.a, TESTA.b, TESTA.c));
  for (const x of [-0.23, 0.23]) {
    const { punto, normale } = suFaccia(x, -0.02, -0.012);
    testa.add(appoggia(occhio(m, 0.085, 0.11, 0.045), punto, normale));
  }
  {
    const { punto, normale } = suFaccia(0, -0.15, 0.002);
    testa.add(appoggia(sorriso(m, 0.065, 0.014), punto, normale));
  }
  testa.add(creaCappelli(m), creaOcchiali(m));
  bleo.add(testa);

  bleo.add(creaSciarpe(m));
  return bleo;
}

// --- accessori -------------------------------------------------------------------------

/** I cappelli si costruiscono su una sfera di raggio 1 e poi si adattano alla testa. */
function creaCappelli(m: Materiali) {
  const cappelli = new THREE.Group();
  cappelli.name = "cappelli";
  cappelli.scale.set(TESTA.a, TESTA.b, TESTA.c);

  const cappellino = (materiale: THREE.Material, nome: string, girato: boolean) => {
    const g = new THREE.Group();
    g.name = nome;
    const calotta = mesh(new THREE.SphereGeometry(1.05, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.42), materiale);
    g.add(calotta);
    const bottone = mesh(new THREE.SphereGeometry(0.08, 16, 12), materiale);
    bottone.position.y = 1.05;
    g.add(bottone);
    const visiera = mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 40, 1, false, -Math.PI / 2, Math.PI), materiale);
    visiera.position.set(0, 0.27, 0.62);
    visiera.scale.set(0.95, 1, 1.05);
    visiera.rotation.x = 0.2;
    g.add(visiera);
    g.rotation.set(-0.12, girato ? Math.PI : 0, 0);
    return g;
  };
  cappelli.add(cappellino(m.cappellinoNero, "cappello:cappellino-nero", true));
  cappelli.add(cappellino(m.cappellinoBeige, "cappello:cappellino-beige", false));

  {
    const g = new THREE.Group();
    g.name = "cappello:pescatore";
    const profilo = [
      [0, 1.02],
      [0.5, 1.0],
      [0.78, 0.92],
      [0.95, 0.66],
      [1.04, 0.36],
      [1.08, 0.24],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const corona = mesh(new THREE.LatheGeometry(profilo, 64), m.pescatore);
    g.add(corona);
    const cupola = mesh(new THREE.CircleGeometry(0.5, 32), m.pescatore);
    cupola.rotation.x = -Math.PI / 2;
    cupola.position.y = 1.0;
    g.add(cupola);
    const tesa = [
      [1.0, 0.27],
      [1.3, 0.13],
      [1.5, 0.02],
      [1.52, -0.01],
      [1.48, -0.02],
      [1.28, 0.08],
      [1.0, 0.21],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(mesh(new THREE.LatheGeometry(tesa, 64), m.pescatore));
    const nastro = mesh(new THREE.CylinderGeometry(1.075, 1.09, 0.14, 64, 1, true), m.cuoioScuro);
    nastro.position.y = 0.33;
    g.add(nastro);
    g.rotation.x = -0.08;
    cappelli.add(g);
  }

  const berretto = (materiale: THREE.Material, nome: string) => {
    const g = new THREE.Group();
    g.name = nome;
    g.add(mesh(new THREE.SphereGeometry(1.08, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.47), materiale));
    // costine verticali sulla parte bassa (sulla cima si toccherebbero tutte)
    const geometriaCosta = new THREE.TorusGeometry(1.08, 0.02, 6, 20, Math.PI * 0.3);
    for (let i = 0; i < 28; i += 1) {
      const costa = mesh(geometriaCosta, materiale);
      costa.rotation.set(0, (i / 28) * Math.PI * 2, Math.PI * 0.03);
      costa.castShadow = false;
      g.add(costa);
    }
    const risvolto = [
      [1.02, 0.06],
      [1.14, 0.08],
      [1.17, 0.2],
      [1.16, 0.34],
      [1.05, 0.37],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(mesh(new THREE.LatheGeometry(risvolto, 64), materiale));
    const pompon = mesh(new THREE.SphereGeometry(0.2, 24, 16), materiale);
    pompon.position.y = 1.12;
    g.add(pompon);
    g.rotation.x = -0.1;
    return g;
  };
  cappelli.add(berretto(m.berrettoRuggine, "cappello:berretto-ruggine"));
  cappelli.add(berretto(m.berrettoBlu, "cappello:berretto-blu"));

  return cappelli;
}

function creaOcchiali(m: Materiali) {
  const occhiali = new THREE.Group();
  occhiali.name = "occhiali";
  const y = -0.02;

  const stanghette = (materiale: THREE.Material, g: THREE.Group, spessore: number) => {
    for (const lato of [-1, 1]) {
      const da = new THREE.Vector3(lato * 0.4, y + 0.03, 0.5);
      const a = new THREE.Vector3(lato * 0.6, y + 0.06, 0.02);
      const lunghezza = da.distanceTo(a);
      const s = mesh(new THREE.CylinderGeometry(spessore, spessore, lunghezza, 8), materiale);
      s.position.copy(da).lerp(a, 0.5);
      s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(da).normalize());
      g.add(s);
    }
  };

  // da sole: lenti nere arrotondate
  {
    const g = new THREE.Group();
    g.name = "occhiali:sole";
    const forma = new THREE.Shape();
    const [l, h, r] = [0.3, 0.21, 0.08];
    forma.moveTo(-l / 2 + r, -h / 2);
    forma.lineTo(l / 2 - r, -h / 2);
    forma.quadraticCurveTo(l / 2, -h / 2, l / 2, -h / 2 + r);
    forma.lineTo(l / 2, h / 2 - r);
    forma.quadraticCurveTo(l / 2, h / 2, l / 2 - r, h / 2);
    forma.lineTo(-l / 2 + r, h / 2);
    forma.quadraticCurveTo(-l / 2, h / 2, -l / 2, h / 2 - r);
    forma.lineTo(-l / 2, -h / 2 + r);
    forma.quadraticCurveTo(-l / 2, -h / 2, -l / 2 + r, -h / 2);
    const lente = new THREE.ExtrudeGeometry(forma, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.012,
      bevelSegments: 3,
    });
    for (const lato of [-1, 1]) {
      const { punto, normale } = suFaccia(lato * 0.23, y, 0.05);
      g.add(appoggia(mesh(lente, m.inchiostro), punto, normale));
    }
    const ponte = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), m.inchiostro);
    ponte.rotation.z = Math.PI / 2;
    ponte.position.set(0, y + 0.03, 0.62);
    g.add(ponte);
    stanghette(m.inchiostro, g, 0.016);
    occhiali.add(g);
  }

  // tondi colorati e da vista: montatura ad anello
  const tondi = (montatura: THREE.Material, vetro: THREE.Material, nome: string, spessore: number) => {
    const g = new THREE.Group();
    g.name = nome;
    for (const lato of [-1, 1]) {
      const { punto, normale } = suFaccia(lato * 0.23, y, 0.05);
      const lente = new THREE.Group();
      lente.add(mesh(new THREE.TorusGeometry(0.15, spessore, 12, 40), montatura));
      const disco = mesh(new THREE.CircleGeometry(0.15, 40), vetro);
      disco.castShadow = false;
      lente.add(disco);
      g.add(appoggia(lente, punto, normale));
    }
    const ponte = mesh(new THREE.TorusGeometry(0.06, spessore * 0.9, 8, 16, Math.PI), montatura);
    ponte.position.set(0, y + 0.02, 0.6);
    g.add(ponte);
    stanghette(montatura, g, spessore * 0.8);
    return g;
  };
  occhiali.add(tondi(m.montaturaOro, m.lenteAmbra, "occhiali:tondi", 0.016));
  occhiali.add(tondi(m.montaturaMarrone, m.lenteChiara, "occhiali:vista", 0.022));
  return occhiali;
}

function creaSciarpe(m: Materiali) {
  const sciarpe = new THREE.Group();
  sciarpe.name = "sciarpe";
  const sciarpa = (materiale: THREE.Material, nome: string) => {
    const g = new THREE.Group();
    g.name = nome;
    const giro = mesh(new THREE.TorusGeometry(0.3, 0.1, 16, 48), materiale);
    giro.rotation.x = Math.PI / 2;
    giro.scale.set(1.05, 0.95, 1.1);
    giro.position.y = 1.07;
    g.add(giro);
    const coda = mesh(new RoundedBoxGeometry(0.17, 0.42, 0.07, 4, 0.03), materiale);
    coda.position.set(0.17, 0.84, 0.4);
    coda.rotation.set(-0.12, 0, 0.05);
    g.add(coda);
    for (const dx of [-0.05, 0, 0.05]) {
      const frangia = capsula(materiale, 0.016, 0.06);
      frangia.position.set(0.17 + dx, 0.6, 0.43);
      g.add(frangia);
    }
    return g;
  };
  sciarpe.add(sciarpa(m.sciarpaVerde, "sciarpa:verde"));
  sciarpe.add(sciarpa(m.sciarpaBeige, "sciarpa:beige"));
  return sciarpe;
}

// --- bussolina -------------------------------------------------------------------------

function creaBussolina(m: Materiali) {
  const b = new THREE.Group();
  b.name = "bussolina";
  const centro = 0.62;

  for (const x of [-0.11, 0.11]) {
    const gamba = capsula(m.pelle, 0.075, 0.06);
    gamba.position.set(x, 0.105, 0);
    b.add(gamba);
  }
  const bracciaSu = capsula(m.pelle, 0.058, 0.13);
  bracciaSu.position.set(0.47, 0.8, 0.02);
  bracciaSu.rotation.z = -0.65;
  b.add(bracciaSu);
  const bracciaGiu = capsula(m.pelle, 0.058, 0.13);
  bracciaGiu.position.set(-0.44, 0.44, 0.02);
  bracciaGiu.rotation.z = -0.5;
  b.add(bracciaGiu);

  // cassa: disco verde acqua, bordo arrotondato e quadrante chiaro
  const cassa = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.14, 64), m.teal);
  cassa.rotation.x = Math.PI / 2;
  cassa.position.y = centro;
  b.add(cassa);
  for (const z of [0.07, -0.07]) {
    const bordo = mesh(new THREE.TorusGeometry(0.4, 0.05, 16, 64), m.teal);
    bordo.position.set(0, centro, z);
    b.add(bordo);
  }
  const quadrante = mesh(new THREE.CircleGeometry(0.31, 64), m.quadrante);
  quadrante.position.set(0, centro, 0.085);
  b.add(quadrante);

  // tacche dei punti cardinali
  for (let i = 0; i < 4; i += 1) {
    const angolo = (i * Math.PI) / 2;
    const tacca = mesh(new THREE.OctahedronGeometry(0.035), m.teal);
    tacca.scale.set(0.7, 1.4, 0.3);
    tacca.position.set(Math.sin(angolo) * 0.24, centro + Math.cos(angolo) * 0.24, 0.09);
    tacca.rotation.z = -angolo;
    b.add(tacca);
  }

  // faccia
  for (const x of [-0.09, 0.09]) {
    const o = occhio(m, 0.042, 0.054, 0.02);
    o.position.set(x, centro + 0.02, 0.09);
    b.add(o);
  }
  const bocca = sorriso(m, 0.032, 0.008);
  bocca.position.set(0, centro - 0.07, 0.09);
  b.add(bocca);

  // pomello e ago in cima
  const pomello = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.09, 24), m.teal);
  pomello.position.y = centro + 0.47;
  b.add(pomello);
  const baseAgo = mesh(new THREE.SphereGeometry(0.07, 24, 16), m.pelle);
  baseAgo.scale.set(0.85, 0.9, 0.85);
  baseAgo.position.y = centro + 0.56;
  b.add(baseAgo);
  const punta = mesh(new THREE.ConeGeometry(0.06, 0.2, 24), m.ago);
  punta.position.y = centro + 0.68;
  b.add(punta);

  return b;
}

// --- piedistallo -----------------------------------------------------------------------

function creaPiedistallo(m: Materiali) {
  const p = new THREE.Group();
  p.name = "piedistallo";
  const profilo = [
    [0, -0.34],
    [1.16, -0.34],
    [1.22, -0.32],
    [1.25, -0.27],
    [1.25, -0.07],
    [1.23, -0.025],
    [1.18, 0],
    [0, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const corpo = mesh(new THREE.LatheGeometry(profilo, 96), m.piedistallo);
  corpo.castShadow = false;
  p.add(corpo);
  const fascia = mesh(new THREE.CylinderGeometry(1.258, 1.258, 0.08, 96, 1, true), m.fascia);
  fascia.position.y = -0.17;
  fascia.castShadow = false;
  p.add(fascia);
  // rosa dei venti appena accennata sul piano: anello e quattro tacche
  const anello = mesh(new THREE.RingGeometry(1.02, 1.045, 96), m.fascia);
  anello.rotation.x = -Math.PI / 2;
  anello.position.y = 0.002;
  anello.castShadow = false;
  p.add(anello);
  for (let i = 0; i < 4; i += 1) {
    const tacca = mesh(new THREE.CircleGeometry(0.06, 3), m.fascia);
    tacca.castShadow = false;
    tacca.rotation.x = -Math.PI / 2;
    tacca.rotation.z = (i * Math.PI) / 2 + Math.PI / 2;
    const angolo = (i * Math.PI) / 2;
    tacca.position.set(Math.sin(angolo) * 1.1, 0.003, Math.cos(angolo) * 1.1);
    p.add(tacca);
  }
  return p;
}

// --- tutto insieme ---------------------------------------------------------------------

export function creaMascotte3d(): Mascotte3d {
  const materiali = creaMateriali();
  const radice = new THREE.Group();
  radice.name = "giradischi";

  radice.add(creaPiedistallo(materiali));
  const bleo = creaBleo(materiali);
  bleo.position.set(-0.3, 0, -0.05);
  bleo.rotation.y = 0.12;
  radice.add(bleo);
  const bussolina = creaBussolina(materiali);
  bussolina.position.set(0.62, 0, 0.12);
  bussolina.rotation.y = -0.25;
  radice.add(bussolina);

  const accessori = {
    cappello: Object.keys(CAPPELLI).filter((k) => k !== "nessuno"),
    occhiali: Object.keys(OCCHIALI).filter((k) => k !== "nessuno"),
    sciarpa: Object.keys(SCIARPE).filter((k) => k !== "nessuna"),
  } as const;

  function vesti(vestito: Vestito) {
    for (const [tipo, valori] of Object.entries(accessori) as [keyof Vestito, readonly string[]][]) {
      for (const valore of valori) {
        const oggetto = radice.getObjectByName(`${tipo}:${valore}`);
        if (oggetto) oggetto.visible = vestito[tipo] === valore;
      }
    }
  }

  function dispose() {
    const geometrie = new Set<THREE.BufferGeometry>();
    radice.traverse((o) => {
      if (o instanceof THREE.Mesh && o.geometry !== SFERA) geometrie.add(o.geometry);
    });
    for (const g of geometrie) g.dispose();
    for (const materiale of Object.values(materiali)) materiale.dispose();
  }

  return { radice, vesti, dispose };
}
