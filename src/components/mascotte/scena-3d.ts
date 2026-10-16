/**
 * La scena 3D della mascotte: renderer, luci, ombre e il piedistallo che si
 * gira trascinandolo. Si carica solo nel browser, con un import dinamico,
 * così three.js non pesa sul resto del sito.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  avanza,
  finisciTrascinamento,
  giraDi,
  inMovimento,
  iniziaTrascinamento,
  nuovoGiradischi,
  trascina,
} from "@/lib/mascotte/giradischi";
import { creaMascotte3d } from "@/lib/mascotte/modello-3d";
import type { Vestito } from "@/lib/mascotte/vestito";

export type Scena3d = {
  vesti: (vestito: Vestito) => void;
  /** Gira il piedistallo di `passo` radianti (pulsanti e tastiera). */
  gira: (passo: number) => void;
  /** false quando la scena non si vede: si ferma il disegno. */
  attiva: (attiva: boolean) => void;
  dispose: () => void;
};

/** Angolo iniziale: un po' di tre quarti, così si capisce subito che è 3D. */
const ANGOLO_INIZIALE = -0.35;

export function creaScena(canvas: HTMLCanvasElement, opzioni: { pocoMovimento: boolean }): Scena3d {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const ambiente = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scena.environment = ambiente;
  scena.environmentIntensity = 0.75;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  const bersaglio = new THREE.Vector3(0, 0.92, 0);

  // luce principale da davanti a sinistra, con ombre morbide
  const chiave = new THREE.DirectionalLight("#fff8ee", 1.9);
  chiave.position.set(-3, 6, 5);
  chiave.castShadow = true;
  chiave.shadow.mapSize.set(1024, 1024);
  chiave.shadow.camera.left = -2;
  chiave.shadow.camera.right = 2;
  chiave.shadow.camera.top = 3;
  chiave.shadow.camera.bottom = -1;
  chiave.shadow.camera.near = 1;
  chiave.shadow.camera.far = 15;
  chiave.shadow.radius = 4;
  chiave.shadow.bias = -0.0005;
  chiave.shadow.normalBias = 0.02;
  scena.add(chiave);
  // controluce fredda per staccare i contorni dallo sfondo
  const contro = new THREE.DirectionalLight("#dff3f5", 0.9);
  contro.position.set(4, 3, -4);
  scena.add(contro);
  scena.add(new THREE.HemisphereLight("#ffffff", "#d9e6e3", 0.6));

  // ombra morbida a terra, sotto il piedistallo
  const ombra = creaOmbraATerra();
  ombra.position.y = -0.345;
  scena.add(ombra);

  const mascotte = creaMascotte3d();
  scena.add(mascotte.radice);

  let giradischi = nuovoGiradischi(ANGOLO_INIZIALE);
  const automatico = !opzioni.pocoMovimento;
  let attiva = true;
  let richiesta = 0;
  let ultimo = 0;

  function disegna() {
    mascotte.radice.rotation.y = giradischi.angolo;
    renderer.render(scena, camera);
  }

  function ciclo(adesso: number) {
    const dt = Math.min((adesso - ultimo) / 1000, 0.05);
    ultimo = adesso;
    giradischi = avanza(giradischi, dt, automatico);
    disegna();
    richiesta = attiva && inMovimento(giradischi, automatico) ? requestAnimationFrame(ciclo) : 0;
  }

  function anima() {
    if (richiesta || !attiva) return;
    ultimo = performance.now();
    richiesta = requestAnimationFrame(ciclo);
  }

  // dimensioni: la camera si allontana sugli schermi stretti per non tagliare nulla
  function ridimensiona() {
    const larghezza = canvas.clientWidth;
    const altezza = canvas.clientHeight;
    if (!larghezza || !altezza) return;
    renderer.setSize(larghezza, altezza, false);
    camera.aspect = larghezza / altezza;
    const distanza = 7.4 / Math.min(1, camera.aspect / 0.95);
    camera.position.set(0, 2.05, distanza);
    camera.lookAt(bersaglio);
    camera.updateProjectionMatrix();
    disegna();
  }
  const osservatore = new ResizeObserver(ridimensiona);
  osservatore.observe(canvas);
  ridimensiona();

  // trascinamento con mouse o dito (in verticale la pagina scorre: touch-action pan-y)
  let puntatore: number | null = null;
  let ultimoX = 0;
  let ultimoT = 0;
  function giu(e: PointerEvent) {
    if (puntatore !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    puntatore = e.pointerId;
    ultimoX = e.clientX;
    ultimoT = e.timeStamp;
    canvas.setPointerCapture(e.pointerId);
    canvas.dataset.trascina = "si";
    giradischi = iniziaTrascinamento(giradischi);
    anima();
  }
  function muovi(e: PointerEvent) {
    if (e.pointerId !== puntatore) return;
    const dt = (e.timeStamp - ultimoT) / 1000;
    giradischi = trascina(giradischi, e.clientX - ultimoX, dt);
    ultimoX = e.clientX;
    ultimoT = e.timeStamp;
  }
  function su(e: PointerEvent) {
    if (e.pointerId !== puntatore) return;
    puntatore = null;
    delete canvas.dataset.trascina;
    // se il dito era fermo da un attimo prima di staccarsi, niente lancio
    if (e.timeStamp - ultimoT > 80) giradischi = { ...giradischi, velocita: 0 };
    giradischi = finisciTrascinamento(giradischi);
    anima();
  }
  canvas.addEventListener("pointerdown", giu);
  canvas.addEventListener("pointermove", muovi);
  canvas.addEventListener("pointerup", su);
  canvas.addEventListener("pointercancel", su);

  anima();

  return {
    vesti(vestito) {
      mascotte.vesti(vestito);
      disegna();
    },
    gira(passo) {
      giradischi = giraDi(giradischi, passo);
      anima();
    },
    attiva(valore) {
      attiva = valore;
      if (valore) anima();
      else if (richiesta) {
        cancelAnimationFrame(richiesta);
        richiesta = 0;
      }
    },
    dispose() {
      if (richiesta) cancelAnimationFrame(richiesta);
      osservatore.disconnect();
      canvas.removeEventListener("pointerdown", giu);
      canvas.removeEventListener("pointermove", muovi);
      canvas.removeEventListener("pointerup", su);
      canvas.removeEventListener("pointercancel", su);
      mascotte.dispose();
      (ombra.material as THREE.MeshBasicMaterial).map?.dispose();
      (ombra.material as THREE.Material).dispose();
      ombra.geometry.dispose();
      ambiente.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

function creaOmbraATerra() {
  const lato = 128;
  const tela = document.createElement("canvas");
  tela.width = lato;
  tela.height = lato;
  const ctx = tela.getContext("2d");
  if (ctx) {
    const sfumatura = ctx.createRadialGradient(lato / 2, lato / 2, 0, lato / 2, lato / 2, lato / 2);
    sfumatura.addColorStop(0, "rgba(16, 40, 44, 0.32)");
    sfumatura.addColorStop(0.55, "rgba(16, 40, 44, 0.16)");
    sfumatura.addColorStop(1, "rgba(16, 40, 44, 0)");
    ctx.fillStyle = sfumatura;
    ctx.fillRect(0, 0, lato, lato);
  }
  const trama = new THREE.CanvasTexture(tela);
  const piano = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.6),
    new THREE.MeshBasicMaterial({ map: trama, transparent: true, depthWrite: false }),
  );
  piano.rotation.x = -Math.PI / 2;
  return piano;
}
