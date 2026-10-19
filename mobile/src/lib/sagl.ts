/**
 * «Fondare una Sagl» nell'app. Come sul sito, i dati restano dove li scrivi:
 * qui sul telefono (stessa chiave e stesso formato del browser,
 * src/lib/strumenti/archivio.ts), non nell'account. I PDF (scheda di
 * preparazione e bozza dello statuto) sono gli stessi documenti del sito
 * (src/lib/fondazione-sagl/documenti.ts), stampati sul telefono con
 * expo-print dall'HTML di src/lib/pdf/html-documento.ts e condivisi con
 * expo-sharing: non passano dai server di Bleo.
 */
import { Directory, File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { datiFondazioneIniziali, schemaDatiFondazione, type DatiFondazione } from "@/lib/fondazione-sagl/dati";
import { bozzaStatuto, nomeFilePdfFondazione, schedaPreparazione } from "@/lib/fondazione-sagl/documenti";
import { MARGINI_PDF_PUNTI, htmlDocumentoPdf } from "@/lib/pdf/html-documento";
import { CHIAVI_ARCHIVIO, codifica, decodifica } from "@/lib/strumenti/archivio";
import { A4_PUNTI } from "@/lib/strumenti/stampa-documento";
import { iscriviti, leggi, scrivi } from "./memoria";

const CHIAVE = CHIAVI_ARCHIVIO.fondazioneSagl;

export type QualePdf = "scheda" | "statuto";

/** I dati della Sagl salvati sul telefono e la funzione per cambiarli (si salvano subito). */
export function useDatiSagl(): [DatiFondazione, (cambia: (d: DatiFondazione) => DatiFondazione) => void] {
  const grezzo = useSyncExternalStore(
    iscriviti,
    () => leggi(CHIAVE),
    () => null,
  );
  const dati = useMemo(() => decodifica(grezzo, schemaDatiFondazione, datiFondazioneIniziali), [grezzo]);
  const aggiorna = useCallback((cambia: (d: DatiFondazione) => DatiFondazione) => {
    const attuali = decodifica(leggi(CHIAVE), schemaDatiFondazione, datiFondazioneIniziali);
    scrivi(CHIAVE, codifica(cambia(attuali)));
  }, []);
  return [dati, aggiorna];
}

/** Cancella dal telefono i dati di questo strumento (nomi e domicili dei soci compresi). */
export function cancellaDatiSagl(): void {
  scrivi(CHIAVE, null);
}

/** Id per un socio o un gerente nuovo (al massimo 40 caratteri, come vuole lo schema). */
export function nuovoIdSagl(): string {
  const pezzo = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  return `${Date.now().toString(36)}-${pezzo()}`;
}

/** Sul web (anteprima di sviluppo) PDF e condivisione non ci sono. */
export const PDF_SAGL_DISPONIBILE = Platform.OS !== "web";

function documento(quale: QualePdf, dati: DatiFondazione, oggi: string) {
  return quale === "scheda" ? schedaPreparazione(dati, oggi) : bozzaStatuto(dati, oggi);
}

/**
 * Crea il PDF A4 nella cache del telefono, con il nome del sito
 * («scheda-fondazione-rossi-bianchi-sagl.pdf»). Su iPhone i margini vanno a
 * expo-print; su Android stanno nel CSS della pagina.
 */
export async function creaPdfSagl(quale: QualePdf, dati: DatiFondazione, oggi: string): Promise<string> {
  const ios = Platform.OS === "ios";
  const html = htmlDocumentoPdf(documento(quale, dati, oggi), { margineCss: !ios });
  const { uri } = await Print.printToFileAsync({
    html,
    width: A4_PUNTI.larghezza,
    height: A4_PUNTI.altezza,
    ...(ios ? { margins: { ...MARGINI_PDF_PUNTI } } : {}),
  });
  try {
    // I PDF di prima non servono più: ne resta uno, con il nome giusto.
    const base = new Directory(Paths.cache, "pdf-sagl");
    if (base.exists) base.delete();
    const cartella = new Directory(base, nuovoIdSagl());
    cartella.create({ intermediates: true, idempotent: true });
    const conNome = new File(cartella, nomeFilePdfFondazione(quale, dati.ditta));
    await new File(uri).move(conNome);
    return conNome.uri;
  } catch {
    // Se il nome non si può cambiare, il PDF va bene lo stesso.
    return uri;
  }
}

/** Crea il PDF e apre la condivisione (email, messaggi, File…). */
export async function condividiPdfSagl(quale: QualePdf, dati: DatiFondazione, oggi: string): Promise<void> {
  const uri = await creaPdfSagl(quale, dati, oggi);
  if (!(await Sharing.isAvailableAsync())) throw new Error("condivisione non disponibile");
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: quale === "scheda" ? "Scheda per il notaio" : "Bozza dello statuto",
  });
}

/** Crea il PDF e apre la stampa del telefono (con l'anteprima delle pagine). */
export async function stampaPdfSagl(quale: QualePdf, dati: DatiFondazione, oggi: string): Promise<void> {
  const uri = await creaPdfSagl(quale, dati, oggi);
  await Print.printAsync({ uri });
}
