"use client";

import { useState } from "react";
import { CampoScelta, CampoTesto } from "@/components/strumenti/ui";
import { inMinuti, oreEMinuti } from "@/lib/clienti/ore";
import { LUNGHEZZE_ORE, MINUTI_MASSIMI } from "@/lib/clienti/limiti";
import type { Cliente, VoceOre } from "@/lib/clienti/tipi";
import { numeroSvizzero } from "@/lib/strumenti/numeri";
import { chiama } from "../api";
import { Messaggio, classeNo, classePiccolo, classeSi, leggiImporto } from "../ui-conti";

/** Durate da toccare al volo. */
const DURATE_RAPIDE = [15, 30, 60, 120, 240, 480] as const;

type Campi = { clienteId: string; data: string; ore: string; minuti: string; descrizione: string; tariffa: string };
type Errori = Partial<Record<"durata" | "data" | "tariffa", string>>;

const testoTariffa = (t: number | null) => (t === null ? "" : numeroSvizzero(t, 2).replace(/'/g, ""));

function campiIniziali(clienti: readonly Cliente[], oggi: string, voce?: VoceOre): Campi {
  if (voce) {
    const { ore, minuti } = oreEMinuti(voce.minuti);
    return {
      clienteId: voce.clienteId,
      data: voce.data,
      ore: String(ore),
      minuti: String(minuti),
      descrizione: voce.descrizione,
      tariffa: testoTariffa(voce.tariffa),
    };
  }
  const primo = clienti[0];
  return { clienteId: primo?.id ?? "", data: oggi, ore: "", minuti: "", descrizione: "", tariffa: testoTariffa(primo?.tariffa ?? null) };
}

function intero(testo: string): number | null {
  const t = testo.trim();
  if (t === "") return 0;
  return /^\d{1,4}$/.test(t) ? Number(t) : null;
}

/** Controlla i campi e prepara il corpo per le API. */
function corpo(c: Campi): { ok: true; corpo: Record<string, unknown> } | { ok: false; errori: Errori } {
  const errori: Errori = {};
  const ore = intero(c.ore);
  const minuti = intero(c.minuti);
  const totale = ore === null || minuti === null ? null : minuti > 59 ? null : inMinuti(ore, minuti);
  if (totale === null || totale < 1 || totale > MINUTI_MASSIMI) {
    errori.durata = "Scrivi quanto hai lavorato: ore (0-24) e minuti (0-59), per esempio 1 e 30.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.data)) errori.data = "Scegli il giorno.";
  const tariffa = c.tariffa.trim() ? leggiImporto(c.tariffa) : null;
  if (c.tariffa.trim() && tariffa === null) errori.tariffa = "Scrivi la tariffa in franchi, per esempio 80 o 92.50.";
  if (Object.keys(errori).length > 0 || totale === null) return { ok: false, errori };
  return {
    ok: true,
    corpo: { clienteId: c.clienteId, data: c.data, minuti: totale, descrizione: c.descrizione.trim(), tariffa },
  };
}

/**
 * Modulo di una voce di ore: nuova (con le durate rapide) o da modificare.
 * Cambiando cliente, la tariffa diventa quella del cliente.
 */
export function ModuloOre({
  id,
  clienti,
  oggi,
  voce,
  onSalvato,
  onAnnulla,
}: {
  id: string;
  clienti: readonly Cliente[];
  oggi: string;
  voce?: VoceOre;
  onSalvato: (voce: VoceOre) => void;
  onAnnulla?: () => void;
}) {
  const [campi, setCampi] = useState<Campi>(() => campiIniziali(clienti, oggi, voce));
  const [errori, setErrori] = useState<Errori>({});
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const cambia = <K extends keyof Campi>(campo: K, valore: Campi[K]) => setCampi((c) => ({ ...c, [campo]: valore }));

  async function salva() {
    const letto = corpo(campi);
    if (!letto.ok) {
      setErrori(letto.errori);
      return;
    }
    setErrori({});
    setInCorso(true);
    setMessaggio(null);
    const esito = voce
      ? await chiama<{ voce: VoceOre }>(`/api/conti/ore/${encodeURIComponent(voce.id)}`, { metodo: "PATCH", corpo: letto.corpo })
      : await chiama<{ voce: VoceOre }>("/api/conti/ore", { metodo: "POST", corpo: letto.corpo });
    setInCorso(false);
    if (!esito.ok) {
      setMessaggio(esito.messaggio);
      return;
    }
    if (!voce) setCampi((c) => ({ ...c, ore: "", minuti: "", descrizione: "" }));
    onSalvato(esito.dati.voce);
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void salva();
      }}
    >
      <CampoScelta
        id={`${id}-cliente`}
        etichetta="Cliente"
        valore={campi.clienteId}
        onCambia={(clienteId) =>
          setCampi((c) => ({ ...c, clienteId, tariffa: testoTariffa(clienti.find((x) => x.id === clienteId)?.tariffa ?? null) }))
        }
        opzioni={clienti.map((c) => ({ valore: c.id, etichetta: c.nome }))}
      />
      <CampoTesto
        id={`${id}-data`}
        etichetta="Giorno"
        tipo="date"
        valore={campi.data}
        onCambia={(v) => cambia("data", v)}
        errore={errori.data}
      />
      <fieldset className="sm:col-span-2" aria-describedby={errori.durata ? `${id}-durata-errore` : undefined}>
        <legend className="text-sm font-medium">Quanto hai lavorato</legend>
        <div className="mt-1 grid grid-cols-2 gap-3 sm:max-w-sm">
          <CampoTesto
            id={`${id}-ore`}
            etichetta="Ore"
            numerico
            suffisso="h"
            valore={campi.ore}
            onCambia={(v) => cambia("ore", v)}
            placeholder="0"
            maxLength={2}
          />
          <CampoTesto
            id={`${id}-minuti`}
            etichetta="Minuti"
            numerico
            suffisso="min"
            valore={campi.minuti}
            onCambia={(v) => cambia("minuti", v)}
            placeholder="0"
            maxLength={2}
          />
        </div>
        {!voce ? (
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Durate rapide">
            {DURATE_RAPIDE.map((m) => {
              const { ore, minuti } = oreEMinuti(m);
              return (
                <button
                  key={m}
                  type="button"
                  className={classePiccolo}
                  onClick={() => setCampi((c) => ({ ...c, ore: String(ore), minuti: String(minuti) }))}
                >
                  {m < 60 ? `${m} min` : `${ore} h`}
                </button>
              );
            })}
          </div>
        ) : null}
        {errori.durata ? (
          <p id={`${id}-durata-errore`} className="mt-1 text-sm font-medium text-danger">
            {errori.durata}
          </p>
        ) : null}
      </fieldset>
      <CampoTesto
        id={`${id}-descrizione`}
        etichetta="Cosa hai fatto"
        valore={campi.descrizione}
        onCambia={(v) => cambia("descrizione", v)}
        placeholder="Per esempio: sviluppo del sito (facoltativo)"
        maxLength={LUNGHEZZE_ORE.descrizione}
        className="sm:col-span-2"
      />
      <CampoTesto
        id={`${id}-tariffa`}
        etichetta="Tariffa oraria"
        prefisso="CHF"
        numerico
        valore={campi.tariffa}
        onCambia={(v) => cambia("tariffa", v)}
        errore={errori.tariffa}
        placeholder="0.00"
        aiuto="Quella del cliente: cambiala se per questo lavoro è diversa. Se sei iscritto all'IVA, senza IVA."
      />
      <div className="sm:col-span-2">
        <Messaggio testo={messaggio} />
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <button type="submit" className={classeSi} disabled={inCorso}>
            {inCorso ? "Salvo…" : voce ? "Salva le modifiche" : "Segna le ore"}
          </button>
          {onAnnulla ? (
            <button type="button" className={classeNo} onClick={onAnnulla} disabled={inCorso}>
              Annulla
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
