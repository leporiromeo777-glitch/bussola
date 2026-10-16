"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { IconaDocumento, IconaFotocamera } from "@/components/strumenti/icone";
import { ErroreFile, preparaFile } from "@/components/strumenti/prepara-file";
import { formatoMegabyte, PAGINE_MASSIME_PDF, PESO_MASSIMO_PDF } from "@/lib/lettera/richiesta";
import type { Movimento } from "@/lib/conti/tipi";
import { chiama } from "./api";
import { CampiMovimento, Messaggio, classeNo, classeSi, corpoVoce, type CampiVoce } from "./ui-conti";

/** Foto o PDF di una ricevuta: si riduce nel browser e va a Bleo, che la mette «da confermare». */
export function CaricaRicevuta({ lettura, onAggiunto }: { lettura: boolean; onAggiunto: (annuncio: string) => void }) {
  const inputFoto = useRef<HTMLInputElement>(null);
  const inputFile = useRef<HTMLInputElement>(null);
  const [stato, setStato] = useState<"pronto" | "preparo" | "invio">("pronto");
  const [errore, setErrore] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function scegli(evento: ChangeEvent<HTMLInputElement>) {
    const file = evento.target.files?.[0];
    evento.target.value = "";
    if (!file) return;
    setErrore(null);
    setOk(null);
    setStato("preparo");
    try {
      const pronto = await preparaFile(file);
      setStato("invio");
      const esito = await chiama<{ movimento: Movimento }>("/api/conti/ricevute", {
        metodo: "POST",
        corpo: { tipo: pronto.tipo, dati: pronto.dati, nomeFile: pronto.nome },
      });
      if (!esito.ok) {
        setErrore(esito.messaggio);
        return;
      }
      setOk(
        lettura
          ? "Fatto: Bleo l'ha letta. La trovi in «Da confermare»: controlla e conferma."
          : "Fatto: la ricevuta è salvata in «Da confermare». Scrivi tu importo e data, poi conferma.",
      );
      onAggiunto("Ricevuta aggiunta: è da confermare.");
    } catch (e) {
      setErrore(e instanceof ErroreFile ? e.message : "Non riesco a leggere il file. Riprova con un'altra foto.");
    } finally {
      setStato("pronto");
    }
  }

  const occupato = stato !== "pronto";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h3 className="font-semibold">Fotografa una ricevuta</h3>
      <p className="mt-1 text-sm text-muted">
        {lettura
          ? "Bleo legge data, importo e negozio. Tu poi controlli e confermi."
          : "Bleo salva la foto o il PDF; importo e data li scrivi tu."}{" "}
        PDF fino a {formatoMegabyte(PESO_MASSIMO_PDF)} e {PAGINE_MASSIME_PDF} pagine.
      </p>
      <input ref={inputFoto} type="file" accept="image/*" capture="environment" onChange={scegli} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <input
        ref={inputFile}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
        onChange={scegli}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" className={classeSi} disabled={occupato} onClick={() => inputFoto.current?.click()}>
          <IconaFotocamera className="size-5" />
          {stato === "preparo" ? "Preparo la foto…" : stato === "invio" ? "Bleo sta leggendo…" : "Scatta una foto"}
        </button>
        <button type="button" className={classeNo} disabled={occupato} onClick={() => inputFile.current?.click()}>
          <IconaDocumento className="size-5" />
          Scegli foto o PDF
        </button>
      </div>
      {stato === "invio" && lettura ? (
        <p className="mt-2 text-sm text-muted" role="status">
          Di solito ci vogliono 5–15 secondi. Non chiudere la pagina.
        </p>
      ) : null}
      <Messaggio testo={errore} />
      <Messaggio testo={ok} tipo="ok" />
    </div>
  );
}

function campiVuoti(oggi: string): CampiVoce {
  return { tipo: "uscita", data: oggi, importo: "", descrizione: "", controparte: "", categoria: "altre_uscite" };
}

/** Voce scritta a mano: è già confermata. */
export function NuovaVoce({ oggi, onAggiunto }: { oggi: string; onAggiunto: (annuncio: string) => void }) {
  const [aperta, setAperta] = useState(false);
  const [campi, setCampi] = useState<CampiVoce>(() => campiVuoti(oggi));
  const [errori, setErrori] = useState<Partial<Record<keyof CampiVoce, string>>>({});
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);

  async function salva() {
    const letto = corpoVoce(campi);
    if (!letto.ok) {
      setErrori(letto.errori);
      return;
    }
    setErrori({});
    setInCorso(true);
    setMessaggio(null);
    const esito = await chiama<{ movimento: Movimento }>("/api/conti/movimenti", { metodo: "POST", corpo: letto.corpo });
    setInCorso(false);
    if (!esito.ok) {
      setMessaggio(esito.messaggio);
      return;
    }
    setCampi(campiVuoti(oggi));
    setAperta(false);
    onAggiunto(`«${esito.dati.movimento.descrizione}» aggiunta ai conti.`);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h3 className="font-semibold">Scrivi una voce a mano</h3>
      <p className="mt-1 text-sm text-muted">Per un pagamento in contanti o con TWINT, senza ricevuta da fotografare.</p>
      {aperta ? (
        <div className="mt-4">
          <CampiMovimento id="nuova-voce" valori={campi} onCambia={setCampi} errori={errori} />
          <Messaggio testo={messaggio} />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" className={classeSi} onClick={salva} disabled={inCorso}>
              {inCorso ? "Salvo…" : "Aggiungi ai conti"}
            </button>
            <button type="button" className={classeNo} onClick={() => setAperta(false)} disabled={inCorso}>
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={`${classeNo} mt-4 w-full sm:w-auto`} onClick={() => setAperta(true)}>
          Scrivi una voce
        </button>
      )}
    </div>
  );
}
