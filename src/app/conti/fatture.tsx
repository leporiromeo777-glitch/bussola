"use client";

import Link from "next/link";
import { useState } from "react";
import type { FatturaEmessa, StatoFattura } from "@/lib/conti/tipi";
import { chiama } from "./api";
import { Messaggio, classeLinkConti, classePiccolo, classeSi, data, importo } from "./ui-conti";

const ETICHETTE: Record<StatoFattura, { testo: string; classe: string }> = {
  aperta: { testo: "Da incassare", classe: "border border-border text-foreground" },
  scaduta: { testo: "Scaduta", classe: "border border-danger/50 text-danger" },
  pagata: { testo: "Pagata", classe: "bg-brand-soft text-brand" },
};

const ORDINE: Record<StatoFattura, number> = { scaduta: 0, aperta: 1, pagata: 2 };

export function FattureEmesse({
  fatture,
  oggi,
  onCambiato,
}: {
  fatture: FatturaEmessa[];
  oggi: string;
  onCambiato: (annuncio: string) => void;
}) {
  if (fatture.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted">
        Nessuna fattura registrata. Prepara una fattura con lo{" "}
        <Link href="/strumenti/fattura" className={classeLinkConti}>
          strumento fattura
        </Link>{" "}
        e scegli «Registra in I tuoi conti»: quando il cliente paga, la segni qui e diventa un&apos;entrata.
      </p>
    );
  }
  const ordinate = [...fatture].sort((a, b) => ORDINE[a.stato] - ORDINE[b.stato] || b.data.localeCompare(a.data));
  const scadute = fatture.filter((f) => f.stato === "scaduta");
  const aperte = fatture.filter((f) => f.stato === "aperta");
  const somma = (elenco: FatturaEmessa[]) => elenco.reduce((t, f) => t + Math.round(f.importo * 100), 0) / 100;

  return (
    <div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <dt className="text-sm text-muted">Da incassare ({aperte.length})</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">{importo(somma(aperte))}</dd>
        </div>
        <div className={`rounded-2xl border bg-card p-4 ${scadute.length > 0 ? "border-danger/50" : "border-border"}`}>
          <dt className="text-sm text-muted">Scadute ({scadute.length})</dt>
          <dd className={`mt-1 text-lg font-bold tabular-nums ${scadute.length > 0 ? "text-danger" : ""}`}>
            {importo(somma(scadute))}
          </dd>
        </div>
      </dl>
      <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {ordinate.map((f) => (
          <li key={f.id} className="p-4">
            <RigaFattura fattura={f} oggi={oggi} onCambiato={onCambiato} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RigaFattura({ fattura: f, oggi, onCambiato }: { fattura: FatturaEmessa; oggi: string; onCambiato: (a: string) => void }) {
  const [segna, setSegna] = useState(false);
  const [giorno, setGiorno] = useState(oggi);
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const [eliminare, setEliminare] = useState(false);
  const etichetta = ETICHETTE[f.stato];

  async function pagata(pagataIl: string | null) {
    setInCorso(true);
    setMessaggio(null);
    const esito = await chiama(`/api/conti/fatture/${encodeURIComponent(f.id)}`, { metodo: "PATCH", corpo: { pagataIl } });
    setInCorso(false);
    if (!esito.ok) return setMessaggio(esito.messaggio);
    setSegna(false);
    onCambiato(pagataIl ? `Fattura ${f.numero} pagata: è tra le entrate.` : `Fattura ${f.numero} di nuovo da incassare.`);
  }

  async function elimina() {
    setInCorso(true);
    const esito = await chiama(`/api/conti/fatture/${encodeURIComponent(f.id)}`, { metodo: "DELETE" });
    setInCorso(false);
    if (!esito.ok) return setMessaggio(esito.messaggio);
    onCambiato(`Fattura ${f.numero} tolta dai conti.`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="font-semibold break-words">
            {f.numero} <span className="font-normal text-muted">· {f.cliente}</span>
          </p>
          <p className="text-sm text-muted">
            del {data(f.data)}
            {f.pagataIl ? ` · pagata il ${data(f.pagataIl)}` : f.scadenza ? ` · da pagare entro il ${data(f.scadenza)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
          <p className="font-bold tabular-nums">{importo(f.importo)}</p>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${etichetta.classe}`}>
            {etichetta.testo}
          </span>
        </div>
      </div>

      {segna ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block text-sm font-medium">
            Pagata il
            <input
              type="date"
              value={giorno}
              max={oggi}
              onChange={(e) => setGiorno(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <button type="button" className={classeSi} disabled={inCorso || !giorno} onClick={() => void pagata(giorno)}>
            Conferma
          </button>
          <button type="button" className={classePiccolo} disabled={inCorso} onClick={() => setSegna(false)}>
            Annulla
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {f.pagataIl ? (
            <button type="button" className={classePiccolo} disabled={inCorso} onClick={() => void pagata(null)}>
              Non è ancora pagata
            </button>
          ) : (
            <button
              type="button"
              className={`${classePiccolo} border-brand text-brand`}
              disabled={inCorso}
              onClick={() => {
                setGiorno(oggi);
                setSegna(true);
              }}
            >
              Segna pagata<span className="sr-only"> la fattura {f.numero}</span>
            </button>
          )}
          {eliminare ? (
            <>
              <button type="button" className={`${classePiccolo} border-danger text-danger`} disabled={inCorso} onClick={elimina}>
                Sì, togli dai conti
              </button>
              <button type="button" className={classePiccolo} onClick={() => setEliminare(false)}>
                Annulla
              </button>
            </>
          ) : (
            <button type="button" className={classePiccolo} disabled={inCorso} onClick={() => setEliminare(true)}>
              Elimina<span className="sr-only"> la fattura {f.numero}</span>
            </button>
          )}
        </div>
      )}
      <Messaggio testo={messaggio} />
    </div>
  );
}
