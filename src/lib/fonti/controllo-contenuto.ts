import type { Frammento } from "./frammenti";

/** Frasi tipiche delle pagine di verifica anti-robot al posto del contenuto. */
const SEGNI_CAPTCHA = [
  /what code is in the image/i,
  /are you a robot/i,
  /sei un robot/i,
  /inserisci il codice (che vedi|dell'immagine)/i,
  /verify you are human/i,
  /enable javascript and cookies to continue/i,
];

/** Sotto questa lunghezza totale la pagina non ha abbastanza testo da usare. */
export const TESTO_MINIMO = 300;

/**
 * Motivo per cui il testo estratto non va salvato come fonte (pagina di
 * verifica anti-robot o quasi vuota), oppure null se è utilizzabile.
 */
export function problemaContenuto(frammenti: readonly Frammento[]): string | null {
  const testo = frammenti.map((f) => `${f.titolo_sezione ?? ""} ${f.testo}`).join(" ");
  if (SEGNI_CAPTCHA.some((segno) => segno.test(testo))) {
    return "il sito ha mostrato una verifica anti-robot al posto della pagina: aprila in un browser e riprova più tardi";
  }
  const lunghezza = frammenti.reduce((somma, f) => somma + f.testo.length, 0);
  if (lunghezza < TESTO_MINIMO) {
    return `testo estratto troppo corto (${lunghezza} caratteri): la pagina forse si carica solo con JavaScript`;
  }
  return null;
}
