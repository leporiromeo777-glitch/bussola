"use client";

import {
  LATO_MASSIMO_FOTO,
  MESSAGGI_LETTERA,
  PAGINE_MASSIME_PDF,
  PESO_MASSIMO_PDF,
  PESO_OBIETTIVO_FOTO,
  QUALITA_FOTO,
  dimensioniRidotte,
  riconosciTipo,
  stimaPaginePdf,
  type TipoLettera,
} from "@/lib/lettera/richiesta";

/**
 * Foto e PDF pronti da mandare al server (lettere da spiegare, ricevute di
 * «I tuoi conti»): le foto si riducono nel browser, i PDF si controllano.
 */

/** Il file pronto da mandare: già ridotto (le foto) e in base64. */
export type FilePronto = {
  tipo: TipoLettera;
  dati: string;
  /** data URL della foto ridotta, per l'anteprima; null per i PDF. */
  anteprima: string | null;
  nome: string;
  byte: number;
};

export class ErroreFile extends Error {}

function leggiComeBase64(blob: Blob): Promise<string> {
  return new Promise((risolvi, rifiuta) => {
    const lettore = new FileReader();
    lettore.onload = () => {
      const url = typeof lettore.result === "string" ? lettore.result : "";
      risolvi(url.slice(url.indexOf(",") + 1));
    };
    lettore.onerror = () => rifiuta(new ErroreFile("Non riesco a leggere il file. Riprova."));
    lettore.readAsDataURL(blob);
  });
}

/**
 * Riduce la foto nel browser: lato lungo al massimo 1600 px, JPEG all'85%.
 * Se pesa ancora troppo riprova più piccola. Così la foto parte leggera e
 * Claude la legge bene lo stesso. L'orientamento della foto (EXIF) lo
 * applica il browser quando la disegna.
 */
export async function preparaFoto(file: File): Promise<FilePronto> {
  const url = URL.createObjectURL(file);
  try {
    const immagine = new Image();
    immagine.src = url;
    try {
      await immagine.decode();
    } catch {
      throw new ErroreFile("Non riesco ad aprire questa foto. Scattala di nuovo oppure usa un file JPG o PNG.");
    }
    let lato = LATO_MASSIMO_FOTO;
    let qualita = QUALITA_FOTO;
    for (let tentativo = 0; tentativo < 4; tentativo++) {
      const { larghezza, altezza } = dimensioniRidotte(immagine.naturalWidth, immagine.naturalHeight, lato);
      const tela = document.createElement("canvas");
      tela.width = larghezza;
      tela.height = altezza;
      const contesto = tela.getContext("2d");
      if (!contesto || larghezza === 0) break;
      // Sfondo bianco: le parti trasparenti di un PNG in JPEG diventerebbero nere.
      contesto.fillStyle = "#ffffff";
      contesto.fillRect(0, 0, larghezza, altezza);
      contesto.drawImage(immagine, 0, 0, larghezza, altezza);
      const blob = await new Promise<Blob | null>((risolvi) => tela.toBlob(risolvi, "image/jpeg", qualita));
      if (blob && blob.size <= PESO_OBIETTIVO_FOTO) {
        const dati = await leggiComeBase64(blob);
        return { tipo: "image/jpeg", dati, anteprima: `data:image/jpeg;base64,${dati}`, nome: file.name, byte: blob.size };
      }
      lato = Math.round(lato * 0.8);
      qualita = Math.max(0.6, qualita - 0.1);
    }
    throw new ErroreFile("Non riesco a preparare questa foto. Prova a scattarla di nuovo.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** `controllaPagine: false` per i PDF che Bleo non legge (cassetto dei documenti): conta solo il peso. */
export type OpzioniFile = { controllaPagine?: boolean };

export async function preparaPdf(file: File, opzioni: OpzioniFile = {}): Promise<FilePronto> {
  if (file.size > PESO_MASSIMO_PDF) throw new ErroreFile(MESSAGGI_LETTERA.pdfGrande);
  const byte = new Uint8Array(await file.arrayBuffer());
  if (riconosciTipo(byte.subarray(0, 12)) !== "application/pdf") {
    throw new ErroreFile("Questo file non sembra un PDF valido.");
  }
  const pagine = opzioni.controllaPagine === false ? null : stimaPaginePdf(byte);
  if (pagine !== null && pagine > PAGINE_MASSIME_PDF) throw new ErroreFile(MESSAGGI_LETTERA.pdfLungo);
  return { tipo: "application/pdf", dati: await leggiComeBase64(file), anteprima: null, nome: file.name, byte: file.size };
}

export function ePdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

/** Prepara una foto o un PDF; lancia ErroreFile con un messaggio da mostrare. */
export async function preparaFile(file: File, opzioni: OpzioniFile = {}): Promise<FilePronto> {
  if (ePdf(file)) return preparaPdf(file, opzioni);
  if (file.type.startsWith("image/") || file.type === "") return preparaFoto(file);
  throw new ErroreFile(MESSAGGI_LETTERA.tipoNonValido);
}
