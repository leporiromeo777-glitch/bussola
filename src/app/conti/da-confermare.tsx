"use client";

import { useState } from "react";
import { IconaAvviso, IconaDocumento } from "@/components/strumenti/icone";
import { etichettaCategoria } from "@/lib/conti/importi";
import type { Movimento } from "@/lib/conti/tipi";
import { chiama } from "./api";
import {
  CampiMovimento,
  Messaggio,
  classeLinkConti,
  classeNo,
  classePiccolo,
  classeSi,
  corpoVoce,
  data,
  importo,
  type CampiVoce,
} from "./ui-conti";

/** Apre il documento salvato con un link temporaneo, in una nuova scheda. */
export async function apriDocumento(id: string): Promise<string | null> {
  // La scheda si apre subito (al clic), così il browser non la blocca; poi riceve il link.
  const scheda = window.open("", "_blank");
  const esito = await chiama<{ url: string }>(`/api/conti/documenti/${encodeURIComponent(id)}`);
  if (!esito.ok) {
    scheda?.close();
    return esito.messaggio;
  }
  if (scheda) {
    scheda.opener = null;
    scheda.location.href = esito.dati.url;
  } else {
    window.location.href = esito.dati.url;
  }
  return null;
}

const ORIGINE: Record<Movimento["origine"], string> = {
  email: "Arrivata per email",
  foto: "Da una foto o un PDF",
  fattura: "Da una fattura",
  manuale: "Scritta a mano",
};

export function DaConfermare({ movimenti, onCambiato }: { movimenti: Movimento[]; onCambiato: (annuncio: string) => void }) {
  if (movimenti.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted">
        Niente da confermare. Quando fotografi una ricevuta o ne inoltri una per email, la trovi qui.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {movimenti.map((m) => (
        <li key={m.id}>
          <SchedaDaConfermare movimento={m} onCambiato={onCambiato} />
        </li>
      ))}
    </ul>
  );
}

function campiDa(m: Movimento): CampiVoce {
  return {
    tipo: m.tipo,
    data: m.data,
    importo: m.importo > 0 ? m.importo.toFixed(2) : "",
    descrizione: m.descrizione,
    controparte: m.controparte ?? "",
    categoria: m.categoria,
  };
}

function SchedaDaConfermare({ movimento: m, onCambiato }: { movimento: Movimento; onCambiato: (annuncio: string) => void }) {
  const [modifica, setModifica] = useState(false);
  const [campi, setCampi] = useState<CampiVoce>(() => campiDa(m));
  const [errori, setErrori] = useState<Partial<Record<keyof CampiVoce, string>>>({});
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const titolo = m.controparte || m.descrizione || "Voce da completare";

  async function aggiorna(corpo: Record<string, unknown>, annuncio: string) {
    setInCorso(true);
    setMessaggio(null);
    const esito = await chiama(`/api/conti/movimenti/${encodeURIComponent(m.id)}`, { metodo: "PATCH", corpo });
    setInCorso(false);
    if (!esito.ok) {
      setMessaggio(esito.messaggio);
      return;
    }
    onCambiato(annuncio);
  }

  function conferma() {
    if (!(m.importo > 0) || !m.descrizione) {
      setModifica(true);
      setMessaggio("Prima completa importo e descrizione, poi conferma.");
      return;
    }
    void aggiorna({ stato: "confermato" }, `«${titolo}» è nei conti della ditta.`);
  }

  function salvaEConferma() {
    const letto = corpoVoce(campi);
    if (!letto.ok) {
      setErrori(letto.errori);
      return;
    }
    setErrori({});
    void aggiorna({ ...letto.corpo, stato: "confermato" }, `«${titolo}» corretta e confermata.`);
  }

  async function elimina() {
    setInCorso(true);
    const esito = await chiama(`/api/conti/movimenti/${encodeURIComponent(m.id)}`, { metodo: "DELETE" });
    setInCorso(false);
    if (!esito.ok) setMessaggio(esito.messaggio);
    else onCambiato(`«${titolo}» eliminata.`);
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label={`Da confermare: ${titolo}`}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted">
        <span
          className={`rounded-full px-2 py-0.5 font-semibold ${
            m.tipo === "entrata" ? "bg-brand-soft text-brand" : "border border-border text-foreground"
          }`}
        >
          {m.tipo === "entrata" ? "Entrata" : "Uscita"}
        </span>
        <span>{ORIGINE[m.origine]}</span>
        <span aria-hidden="true">·</span>
        <span>{data(m.data)}</span>
      </p>

      {modifica ? (
        <div className="mt-4">
          <CampiMovimento id={`modifica-${m.id}`} valori={campi} onCambia={setCampi} errori={errori} />
          <Messaggio testo={messaggio} />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" className={classeSi} onClick={salvaEConferma} disabled={inCorso}>
              Salva e conferma
            </button>
            <button
              type="button"
              className={classeNo}
              onClick={() => {
                setModifica(false);
                setCampi(campiDa(m));
                setErrori({});
                setMessaggio(null);
              }}
              disabled={inCorso}
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="min-w-0 text-lg font-semibold break-words">{titolo}</p>
            <p className="text-2xl font-extrabold tabular-nums">{m.importo > 0 ? importo(m.importo) : "CHF —"}</p>
          </div>
          {m.controparte && m.descrizione ? <p className="mt-0.5 text-sm break-words">{m.descrizione}</p> : null}
          <p className="mt-1 text-sm text-muted">{etichettaCategoria(m.categoria)}</p>

          {m.nota ? (
            <p className="mt-3 flex gap-2 rounded-xl border border-accent/50 bg-background p-3 text-sm">
              <IconaAvviso className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>
                <span className="sr-only">Nota di Bleo: </span>
                {m.nota}
              </span>
            </p>
          ) : null}

          {m.documentoId ? (
            <button
              type="button"
              className={`${classeLinkConti} mt-3 inline-flex items-center gap-1.5 text-sm`}
              onClick={async () => setMessaggio(await apriDocumento(m.documentoId!))}
            >
              <IconaDocumento className="size-4" />
              Guarda il documento
            </button>
          ) : null}

          <Messaggio testo={messaggio} />

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" className={classeSi} onClick={conferma} disabled={inCorso}>
              Sì, è della ditta
            </button>
            <button
              type="button"
              className={classeNo}
              onClick={() => void aggiorna({ stato: "privato" }, `«${titolo}» segnata come privata.`)}
              disabled={inCorso}
            >
              No, è privato
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={classePiccolo} onClick={() => setModifica(true)} disabled={inCorso}>
              Modifica
            </button>
            <button type="button" className={classePiccolo} onClick={elimina} disabled={inCorso}>
              Elimina
            </button>
          </div>
        </>
      )}
    </article>
  );
}
