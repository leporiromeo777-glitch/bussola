/**
 * Foto e PDF delle ricevute: scatta, scegli dalla galleria o un PDF, poi
 * riduce le immagini (lato massimo 2000 px, JPEG) e le trasforma in base64
 * per mandarle a Bleo.
 */
import * as DocumentPicker from "expo-document-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import type { FileRicevuta } from "./conti";

const LATO_MASSIMO = 2000;
const QUALITA = 0.7;
/** Circa i limiti del sito: immagini fino a 2 MB, PDF fino a 3,5 MB. */
const MASSIMO_IMMAGINE = 2_000_000;
const MASSIMO_PDF = 3_500_000;

export type SceltaFile =
  | { ok: true; file: FileRicevuta }
  | { ok: false; annullato: true }
  | { ok: false; annullato: false; messaggio: string };

const ANNULLATO: SceltaFile = { ok: false, annullato: true };

function errore(messaggio: string): SceltaFile {
  return { ok: false, annullato: false, messaggio };
}

/** Byte reali di una stringa base64. */
function byteBase64(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function senzaPrefisso(datiUrl: string): string {
  const virgola = datiUrl.indexOf(",");
  return datiUrl.startsWith("data:") && virgola >= 0 ? datiUrl.slice(virgola + 1) : datiUrl;
}

async function comprimi(uri: string, larghezza: number, altezza: number, lato: number, qualita: number) {
  const contesto = ImageManipulator.manipulate(uri, { maxWidth: lato, maxHeight: lato });
  try {
    if (Math.max(larghezza, altezza) > lato) {
      contesto.resize(larghezza >= altezza ? { width: lato } : { height: lato });
    }
    const immagine = await contesto.renderAsync();
    try {
      const risultato = await immagine.saveAsync({ format: SaveFormat.JPEG, compress: qualita, base64: true });
      return risultato.base64 ? senzaPrefisso(risultato.base64) : null;
    } finally {
      immagine.release();
    }
  } finally {
    contesto.release();
  }
}

async function daImmagine(asset: ImagePicker.ImagePickerAsset): Promise<SceltaFile> {
  try {
    let dati = await comprimi(asset.uri, asset.width, asset.height, LATO_MASSIMO, QUALITA);
    // Ancora troppo grande: un secondo tentativo più leggero.
    if (dati && byteBase64(dati) > MASSIMO_IMMAGINE) dati = await comprimi(asset.uri, asset.width, asset.height, 1600, 0.5);
    if (!dati) return errore("Non riesco a preparare la foto. Riprova.");
    if (byteBase64(dati) > MASSIMO_IMMAGINE) return errore("La foto è troppo grande anche dopo averla ridotta. Prova a rifarla.");
    return { ok: true, file: { tipo: "image/jpeg", dati, nomeFile: "ricevuta.jpg" } };
  } catch {
    return errore("Non riesco a preparare la foto. Riprova.");
  }
}

/** Apre la fotocamera. */
export async function scattaFoto(): Promise<SceltaFile> {
  if (Platform.OS !== "web") {
    const permesso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permesso.granted) {
      return errore("Per fotografare le ricevute, permetti a Bleo di usare la fotocamera nelle impostazioni del telefono.");
    }
  }
  try {
    const esito = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1, exif: false });
    if (esito.canceled || !esito.assets[0]) return ANNULLATO;
    return daImmagine(esito.assets[0]);
  } catch {
    return errore("Non riesco ad aprire la fotocamera. Prova a scegliere la foto dalla galleria.");
  }
}

/** Sceglie una foto già fatta. */
export async function scegliFoto(): Promise<SceltaFile> {
  try {
    const esito = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, exif: false });
    if (esito.canceled || !esito.assets[0]) return ANNULLATO;
    return daImmagine(esito.assets[0]);
  } catch {
    return errore("Non riesco ad aprire la galleria. Riprova.");
  }
}

/** Legge un file locale come base64 (senza altri pacchetti: fetch + FileReader). */
async function leggiBase64(uri: string): Promise<string> {
  if (uri.startsWith("data:")) return senzaPrefisso(uri);
  const blob = await (await fetch(uri)).blob();
  return new Promise((risolvi, rifiuta) => {
    const lettore = new FileReader();
    lettore.onload = () => (typeof lettore.result === "string" ? risolvi(senzaPrefisso(lettore.result)) : rifiuta(new Error()));
    lettore.onerror = () => rifiuta(lettore.error ?? new Error());
    lettore.readAsDataURL(blob);
  });
}

/** Sceglie un PDF (fattura ricevuta per email, estratto...). */
export async function scegliPdf(): Promise<SceltaFile> {
  try {
    const esito = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    const asset = esito.canceled ? null : esito.assets[0];
    if (!asset) return ANNULLATO;
    if (asset.mimeType && asset.mimeType !== "application/pdf") return errore("Scegli un file PDF.");
    if (asset.size && asset.size > MASSIMO_PDF) return errore("Il PDF è troppo grande: il massimo è circa 3,5 MB.");
    const dati = asset.base64 ? senzaPrefisso(asset.base64) : await leggiBase64(asset.uri);
    if (byteBase64(dati) > MASSIMO_PDF) return errore("Il PDF è troppo grande: il massimo è circa 3,5 MB.");
    return { ok: true, file: { tipo: "application/pdf", dati, nomeFile: asset.name } };
  } catch {
    return errore("Non riesco ad aprire il PDF. Riprova.");
  }
}
