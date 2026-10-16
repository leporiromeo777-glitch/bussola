"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { IconaFreccia } from "@/components/strumenti/icone";
import { classeLink, classePulsantePrincipale, classePulsanteSecondario } from "@/components/strumenti/ui";
import { ErroreFile, preparaFile, type FilePronto } from "@/components/strumenti/prepara-file";
import { MESSAGGI_LETTERA, PAGINE_MASSIME_PDF, PESO_MASSIMO_PDF, formatoMegabyte } from "@/lib/lettera/richiesta";
import type { SpiegazioneLettera } from "@/lib/lettera/spiegazione";
import { IconaFotocamera, IconaPdf, RisultatoLettera } from "./risultato";

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
      setFile(await preparaFile(scelto));
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
