"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { IconaFreccia } from "@/components/strumenti/icone";
import { classeLink, classePulsantePrincipale, classePulsanteSecondario } from "@/components/strumenti/ui";
import {
  LATO_MASSIMO_FOTO,
  MESSAGGI_LETTERA,
  PAGINE_MASSIME_PDF,
  PESO_MASSIMO_PDF,
  PESO_OBIETTIVO_FOTO,
  QUALITA_FOTO,
  dimensioniRidotte,
  formatoMegabyte,
  riconosciTipo,
  stimaPaginePdf,
  type TipoLettera,
} from "@/lib/lettera/richiesta";
import type { SpiegazioneLettera } from "@/lib/lettera/spiegazione";
import { IconaFotocamera, IconaPdf, RisultatoLettera } from "./risultato";

/** Il file pronto da mandare: già ridotto (le foto) e in base64. */
type FilePronto = {
  tipo: TipoLettera;
  dati: string;
  /** data URL della foto ridotta, per l'anteprima; null per i PDF. */
  anteprima: string | null;
  nome: string;
  byte: number;
};

class ErroreFile extends Error {}

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
async function preparaFoto(file: File): Promise<FilePronto> {
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

async function preparaPdf(file: File): Promise<FilePronto> {
  if (file.size > PESO_MASSIMO_PDF) throw new ErroreFile(MESSAGGI_LETTERA.pdfGrande);
  const byte = new Uint8Array(await file.arrayBuffer());
  if (riconosciTipo(byte.subarray(0, 12)) !== "application/pdf") {
    throw new ErroreFile("Questo file non sembra un PDF valido.");
  }
  const pagine = stimaPaginePdf(byte);
  if (pagine !== null && pagine > PAGINE_MASSIME_PDF) throw new ErroreFile(MESSAGGI_LETTERA.pdfLungo);
  return { tipo: "application/pdf", dati: await leggiComeBase64(file), anteprima: null, nome: file.name, byte: file.size };
}

function ePdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

/** «Fotografa la lettera»: scegli o scatta la foto, Bleo la spiega. */
export function FotografaLettera() {
  const id = useId();
  const inputFoto = useRef<HTMLInputElement>(null);
  const inputGalleria = useRef<HTMLInputElement>(null);
  const inputPdf = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<FilePronto | null>(null);
  const [preparazione, setPreparazione] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [spiegazione, setSpiegazione] = useState<SpiegazioneLettera | null>(null);
  const [trascinamento, setTrascinamento] = useState(false);

  async function scegli(scelto: File | undefined) {
    if (!scelto) return;
    setErrore(null);
    setFile(null);
    setPreparazione(true);
    try {
      if (ePdf(scelto)) setFile(await preparaPdf(scelto));
      else if (scelto.type.startsWith("image/") || scelto.type === "") setFile(await preparaFoto(scelto));
      else setErrore(MESSAGGI_LETTERA.tipoNonValido);
    } catch (e) {
      setErrore(e instanceof ErroreFile ? e.message : "Non riesco a leggere il file. Riprova con un'altra foto.");
    } finally {
      setPreparazione(false);
    }
  }

  function daInput(evento: ChangeEvent<HTMLInputElement>) {
    const scelto = evento.target.files?.[0];
    // Così si può scegliere di nuovo lo stesso file.
    evento.target.value = "";
    void scegli(scelto);
  }

  function rilascia(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setTrascinamento(false);
    void scegli(evento.dataTransfer.files[0]);
  }

  async function invia() {
    if (!file) return;
    setErrore(null);
    setInCorso(true);
    try {
      const risposta = await fetch("/api/lettera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: file.tipo, dati: file.dati }),
      });
      const corpo = (await risposta.json().catch(() => null)) as {
        spiegazione?: SpiegazioneLettera;
        messaggio?: unknown;
      } | null;
      if (!risposta.ok || !corpo?.spiegazione) {
        setErrore(typeof corpo?.messaggio === "string" ? corpo.messaggio : MESSAGGI_LETTERA.nonCapito);
        return;
      }
      setSpiegazione(corpo.spiegazione);
      setFile(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrore("Non riesco a raggiungere Bleo: controlla la connessione e riprova.");
    } finally {
      setInCorso(false);
    }
  }

  function ricomincia() {
    setSpiegazione(null);
    setFile(null);
    setErrore(null);
  }

  if (spiegazione) {
    return <RisultatoLettera spiegazione={spiegazione} onAltra={ricomincia} />;
  }

  return (
    <section aria-labelledby={`${id}-titolo`} className="mt-8">
      <h2 id={`${id}-titolo`} className="sr-only">
        Scegli la lettera
      </h2>

      {/* Input nascosti: li aprono i pulsanti grandi. */}
      <input ref={inputFoto} type="file" accept="image/*" capture="environment" onChange={daInput} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <input ref={inputGalleria} type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={daInput} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <input ref={inputPdf} type="file" accept="application/pdf,.pdf" onChange={daInput} className="sr-only" tabIndex={-1} aria-hidden="true" />

      {file ? (
        <div className="rounded-3xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {file.anteprima ? (
              // eslint-disable-next-line @next/next/no-img-element -- anteprima locale (data URL), non un'immagine del sito
              <img
                src={file.anteprima}
                alt="Anteprima della lettera fotografata"
                className="max-h-72 w-auto max-w-full rounded-xl border border-border bg-background object-contain shadow-sm sm:max-h-48"
              />
            ) : (
              <div className="flex size-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-brand-soft text-brand">
                <IconaPdf className="size-10" />
                <span className="text-xs font-semibold">PDF</span>
              </div>
            )}
            <div className="min-w-0 text-center sm:text-left">
              <p className="font-semibold">{file.anteprima ? "Foto pronta" : "PDF pronto"}</p>
              <p className="mt-1 truncate text-sm text-muted">
                {file.anteprima ? "Ridotta a " : ""}
                {formatoMegabyte(file.byte)}
                {file.anteprima ? "" : ` · ${file.nome}`}
              </p>
              <p className="mt-2 text-sm text-muted">
                Si legge bene? Deve vedersi tutta la pagina, dritta e a fuoco, soprattutto date e importi.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={invia} disabled={inCorso} className={`${classePulsantePrincipale} py-3 text-lg`}>
              {inCorso ? "Bleo sta leggendo…" : "Spiegami la lettera"}
              {inCorso ? null : <IconaFreccia className="size-5" />}
            </button>
            <button
              type="button"
              onClick={() => (file.anteprima ? inputFoto : inputPdf).current?.click()}
              disabled={inCorso}
              className={`${classePulsanteSecondario} py-3`}
            >
              {file.anteprima ? "Rifai la foto" : "Scegli un altro PDF"}
            </button>
          </div>
          {inCorso ? (
            <p className="mt-3 text-sm text-muted">Ci vogliono di solito 10–20 secondi. Non chiudere la pagina.</p>
          ) : null}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setTrascinamento(true);
          }}
          onDragLeave={() => setTrascinamento(false)}
          onDrop={rilascia}
          className={`rounded-3xl border-2 border-dashed p-5 text-center transition-colors sm:p-8 ${
            trascinamento ? "border-brand bg-brand-soft" : "border-border bg-card"
          }`}
        >
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
            <IconaFotocamera className="size-8" />
          </div>
          <p className="mt-3 text-lg font-semibold">Fotografa la lettera o carica il PDF</p>
          <p className="mt-1 text-sm text-muted">Metti il foglio su un tavolo, con buona luce, e inquadra tutta la pagina.</p>
          <div className="mx-auto mt-5 grid max-w-md gap-3">
            <button
              type="button"
              onClick={() => inputFoto.current?.click()}
              disabled={preparazione}
              className={`${classePulsantePrincipale} w-full py-3.5 text-lg`}
            >
              <IconaFotocamera className="size-6" />
              {preparazione ? "Preparo la foto…" : "Scatta una foto"}
            </button>
            <button
              type="button"
              onClick={() => inputPdf.current?.click()}
              disabled={preparazione}
              className={`${classePulsanteSecondario} w-full py-3.5 text-lg`}
            >
              <IconaPdf className="size-6" />
              Carica un PDF
            </button>
          </div>
          <p className="mt-4 text-sm">
            <button type="button" onClick={() => inputGalleria.current?.click()} disabled={preparazione} className={classeLink}>
              Oppure scegli una foto che hai già
            </button>
          </p>
          <p className="mt-2 hidden text-xs text-muted sm:block">Dal computer puoi anche trascinare qui il file.</p>
          <p className="mt-2 text-xs text-muted">
            PDF fino a {formatoMegabyte(PESO_MASSIMO_PDF)} e {PAGINE_MASSIME_PDF} pagine.
          </p>
        </div>
      )}

      {errore ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-card p-3 font-medium text-danger">
          {errore}
        </p>
      ) : null}

      <div className="mt-6 rounded-2xl bg-brand-soft p-4 text-sm">
        <p className="font-semibold">I tuoi dati</p>
        <p className="mt-1">
          La foto o il PDF li legge solo l&apos;intelligenza artificiale che usa Bleo (Claude, di Anthropic) per
          spiegarti la lettera. Bleo non li salva.
        </p>
        <p className="mt-2 text-muted">
          Se vuoi, prima di scattare copri con un foglio il numero AVS e le coordinate bancarie (IBAN): per capire la
          lettera non servono.
        </p>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {preparazione ? "Preparo il file." : inCorso ? "Bleo sta leggendo la lettera." : file ? "File pronto." : ""}
      </p>
    </section>
  );
}
