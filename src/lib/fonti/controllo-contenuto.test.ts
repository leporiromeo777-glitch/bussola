import { describe, expect, it } from "vitest";
import { problemaContenuto } from "./controllo-contenuto";

const frammento = (testo: string, posizione = 1) => ({ posizione, titolo_sezione: null, testo });

describe("problemaContenuto", () => {
  it("accetta una pagina con testo sufficiente", () => {
    expect(problemaContenuto([frammento("Iscrizione di nuova ditta individuale. ".repeat(20))])).toBeNull();
  });

  it("rifiuta una pagina di verifica anti-robot", () => {
    const motivo = problemaContenuto([frammento("What code is in the image? " + "x".repeat(400))]);
    expect(motivo).toMatch(/anti-robot/);
  });

  it("rifiuta una pagina quasi vuota", () => {
    expect(problemaContenuto([frammento("Caricamento…")])).toMatch(/troppo corto/);
    expect(problemaContenuto([])).toMatch(/troppo corto/);
  });
});
