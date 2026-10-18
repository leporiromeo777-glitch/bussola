"use client";

import { useState } from "react";
import { percorsoFatturaDaOre, precompilaFattura, rigaPerVoceAmmessa, totalePrecompilazione } from "@/lib/clienti/fattura";
import {
  durata,
  importoOre,
  nomeMese,
  oreDecimali,
  oreInFatturaEsatte,
  tariffaVoce,
  type GruppoCliente,
  type RiepilogoMese,
  type Totali,
} from "@/lib/clienti/ore";
import type { Cliente, DettaglioFattura, Mese, RispostaFatturaOre, VoceOre } from "@/lib/clienti/tipi";
import { chiama } from "../api";
import { Messaggio, classePiccolo, classeSi, data, importo } from "../ui-conti";
import { ModuloOre } from "./modulo-ore";

/** «12 h 30 min · CHF 1'500.00», con l'avviso se qualche voce non ha la tariffa. */
function testoTotali(t: Totali): string {
  const parti = [durata(t.minuti)];
  if (t.voci > t.senzaTariffa) parti.push(importo(t.importo));
  return parti.join(" · ");
}

/** Le ore del mese per cliente, con «Crea la fattura» per quelle ancora da fatturare. */
export function ElencoMese({
  mese,
  riepilogo,
  clienti,
  altriMesi,
  oggi,
  onCambiaMese,
  onCambiato,
}: {
  mese: Mese;
  riepilogo: RiepilogoMese;
  clienti: readonly Cliente[];
  altriMesi: { mese: Mese; minuti: number }[];
  oggi: string;
  onCambiaMese: (mese: Mese) => void;
  onCambiato: (annuncio: string) => void;
}) {
  return (
    <div className="space-y-4">
      {riepilogo.gruppi.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted">
          Nessuna ora segnata in {nomeMese(mese)}.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <dt className="text-sm text-muted">Ore del mese</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">{durata(riepilogo.totale.minuti)}</dd>
            </div>
            <div className={`rounded-2xl border bg-card p-4 ${riepilogo.daFatturare.voci > 0 ? "border-accent" : "border-border"}`}>
              <dt className="text-sm text-muted">Da fatturare</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {riepilogo.daFatturare.voci === 0 ? "Niente" : durata(riepilogo.daFatturare.minuti)}
                {riepilogo.daFatturare.voci > riepilogo.daFatturare.senzaTariffa ? (
                  <span className="block text-base font-semibold">{importo(riepilogo.daFatturare.importo)}</span>
                ) : null}
              </dd>
            </div>
          </dl>
          {riepilogo.gruppi.map((g) => (
            <GruppoOre key={g.cliente.id} gruppo={g} mese={mese} clienti={clienti} oggi={oggi} onCambiato={onCambiato} />
          ))}
        </>
      )}
      {altriMesi.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="font-medium">Ore ancora da fatturare in altri mesi</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {altriMesi.map((m) => (
              <li key={m.mese}>
                <button type="button" className={classePiccolo} onClick={() => onCambiaMese(m.mese)}>
                  {nomeMese(m.mese)}: {durata(m.minuti)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function GruppoOre({
  gruppo: g,
  mese,
  clienti,
  oggi,
  onCambiato,
}: {
  gruppo: GruppoCliente;
  mese: Mese;
  clienti: readonly Cliente[];
  oggi: string;
  onCambiato: (annuncio: string) => void;
}) {
  const idTitolo = `gruppo-${g.cliente.id}`;
  return (
    <section aria-labelledby={idTitolo} className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4">
        <h3 id={idTitolo} className="text-lg font-bold break-words">
          {g.cliente.nome}
        </h3>
        <p className="font-semibold tabular-nums">{testoTotali(g.totale)}</p>
      </div>
      <ul className="divide-y divide-border border-t border-border">
        {g.voci.map((v) => (
          <li key={v.id} className="px-4 py-3">
            <RigaVoce voce={v} cliente={g.cliente} clienti={clienti} oggi={oggi} onCambiato={onCambiato} />
          </li>
        ))}
      </ul>
      {g.totale.senzaTariffa > 0 ? (
        <p className="border-t border-border px-4 py-3 text-sm text-accent">
          {g.totale.senzaTariffa === 1 ? "Una voce non ha" : `${g.totale.senzaTariffa} voci non hanno`} la tariffa: aggiungila
          al cliente, oppure scrivi il prezzo nella fattura.
        </p>
      ) : null}
      <div className="space-y-4 border-t border-border p-4">
        {g.daFatturare.voci > 0 ? (
          <CreaFattura gruppo={g} mese={mese} onCambiato={onCambiato} />
        ) : (
          <p className="text-sm text-muted">Tutte le ore di {nomeMese(mese)} sono fatturate.</p>
        )}
        {g.fatturateIl.map((giorno) => (
          <Fatturate key={giorno} gruppo={g} mese={mese} giorno={giorno} onCambiato={onCambiato} />
        ))}
      </div>
    </section>
  );
}

function RigaVoce({
  voce: v,
  cliente,
  clienti,
  oggi,
  onCambiato,
}: {
  voce: VoceOre;
  cliente: Cliente;
  clienti: readonly Cliente[];
  oggi: string;
  onCambiato: (annuncio: string) => void;
}) {
  const [modifica, setModifica] = useState(false);
  const [eliminare, setEliminare] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const valore = importoOre(v.minuti, tariffaVoce(v, cliente));

  async function elimina() {
    setInCorso(true);
    const esito = await chiama(`/api/conti/ore/${encodeURIComponent(v.id)}`, { metodo: "DELETE" });
    setInCorso(false);
    if (!esito.ok) return setMessaggio(esito.messaggio);
    onCambiato(`Voce del ${data(v.data)} eliminata.`);
  }

  if (modifica) {
    return (
      <ModuloOre
        id={`voce-${v.id}`}
        clienti={clienti}
        oggi={oggi}
        voce={v}
        onSalvato={() => {
          setModifica(false);
          onCambiato(`Voce del ${data(v.data)} salvata.`);
        }}
        onAnnulla={() => setModifica(false)}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="font-medium break-words">
            {data(v.data)} <span className="font-normal text-muted">· {v.descrizione || "Lavoro"}</span>
          </p>
          <p className="text-sm text-muted">
            {durata(v.minuti)}
            {v.minuti % 60 !== 0 ? ` (${oreDecimali(v.minuti)})` : ""}
            {v.fatturataIl ? ` · fatturata il ${data(v.fatturataIl)}` : ""}
          </p>
        </div>
        <p className="font-semibold tabular-nums">{valore === null ? "Senza tariffa" : importo(valore)}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {!v.fatturataIl ? (
          <button type="button" className={classePiccolo} onClick={() => setModifica(true)} disabled={inCorso}>
            Modifica<span className="sr-only"> la voce del {data(v.data)}</span>
          </button>
        ) : null}
        {eliminare ? (
          <>
            <button type="button" className={`${classePiccolo} border-danger text-danger`} onClick={elimina} disabled={inCorso}>
              Sì, elimina
            </button>
            <button type="button" className={classePiccolo} onClick={() => setEliminare(false)}>
              Annulla
            </button>
          </>
        ) : (
          <button type="button" className={classePiccolo} onClick={() => setEliminare(true)} disabled={inCorso}>
            Elimina<span className="sr-only"> la voce del {data(v.data)}</span>
          </button>
        )}
      </div>
      <Messaggio testo={messaggio} />
    </div>
  );
}

/** Scelta tra una riga per voce e una riga sola, con il totale, e «Crea la fattura». */
function CreaFattura({ gruppo: g, mese, onCambiato }: { gruppo: GruppoCliente; mese: Mese; onCambiato: (a: string) => void }) {
  const daFatturare = g.voci.filter((v) => !v.fatturataIl);
  const perVoce = rigaPerVoceAmmessa(daFatturare.length);
  const [scelta, setDettaglio] = useState<DettaglioFattura>("voci");
  const dettaglio: DettaglioFattura = perVoce ? scelta : "riepilogo";
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  // La stessa funzione del server: il totale qui è quello della fattura.
  const anteprima = precompilaFattura({ id: "anteprima", cliente: g.cliente, voci: daFatturare, mese, dettaglio });
  const totale = totalePrecompilazione(anteprima);
  const nome = `dettaglio-${g.cliente.id}`;

  async function crea() {
    setInCorso(true);
    setMessaggio(null);
    const esito = await chiama<RispostaFatturaOre>("/api/conti/ore/fattura", {
      metodo: "POST",
      corpo: { clienteId: g.cliente.id, mese, dettaglio },
    });
    if (!esito.ok) {
      setInCorso(false);
      setMessaggio(esito.messaggio);
      if (esito.stato === 409) onCambiato("Le ore sono cambiate: ricarico.");
      return;
    }
    // Lo strumento fattura legge i dati dopo il «#» e li salva nel browser.
    window.location.assign(percorsoFatturaDaOre(esito.dati.precompilazione));
  }

  return (
    <div>
      <p className="font-semibold">
        Da fatturare: {g.daFatturare.voci === 1 ? "1 voce" : `${g.daFatturare.voci} voci`}, {durata(g.daFatturare.minuti)}
      </p>
      <fieldset className="mt-3">
        <legend className="text-sm font-medium">Nella fattura</legend>
        <div className="mt-2 space-y-2">
          {(
            [
              { valore: "voci", etichetta: "Una riga per ogni voce, con giorno e descrizione", attiva: perVoce },
              { valore: "riepilogo", etichetta: "Una riga sola con il totale delle ore", attiva: true },
            ] as const
          ).map((o) => (
            <label key={o.valore} className={`flex items-start gap-3 ${o.attiva ? "" : "opacity-60"}`}>
              <input
                type="radio"
                name={nome}
                value={o.valore}
                checked={dettaglio === o.valore}
                disabled={!o.attiva}
                onChange={() => setDettaglio(o.valore)}
                className="mt-1 size-4 accent-[var(--brand)]"
              />
              <span>{o.etichetta}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-3 text-sm">
        {totale.senzaPrezzo === anteprima.righe.length ? (
          "Senza tariffa: i prezzi li scrivi nella fattura."
        ) : (
          <>
            Importo delle ore: <span className="font-semibold tabular-nums">{importo(totale.importo)}</span>
            {totale.senzaPrezzo > 0 ? " (più le righe senza tariffa, da completare)" : ""}. Se sei iscritto all&apos;IVA,
            la fattura aggiunge l&apos;IVA.
          </>
        )}
      </p>
      <p className="mt-1 text-sm text-muted">
        {daFatturare.every((v) => oreInFatturaEsatte(v.minuti))
          ? ""
          : "In fattura le ore sono in centesimi d'ora: 1 h 20 min diventa 1.33 h. "}
        Le ore usate si segnano come fatturate oggi, così non le fatturi due volte.
      </p>
      <Messaggio testo={messaggio} />
      <button type="button" className={`${classeSi} mt-3 w-full sm:w-auto`} onClick={crea} disabled={inCorso}>
        {inCorso ? "Preparo la fattura…" : "Crea la fattura"}
      </button>
    </div>
  );
}

/** Le voci fatturate un certo giorno, con la possibilità di togliere il segno. */
function Fatturate({
  gruppo: g,
  mese,
  giorno,
  onCambiato,
}: {
  gruppo: GruppoCliente;
  mese: Mese;
  giorno: string;
  onCambiato: (a: string) => void;
}) {
  const [chiedi, setChiedi] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [messaggio, setMessaggio] = useState<string | null>(null);
  const quante = g.voci.filter((v) => v.fatturataIl === giorno).length;

  async function togli() {
    setInCorso(true);
    const parametri = new URLSearchParams({ cliente: g.cliente.id, mese, fatturataIl: giorno });
    const esito = await chiama<{ voci: number }>(`/api/conti/ore/fattura?${parametri}`, { metodo: "DELETE" });
    setInCorso(false);
    if (!esito.ok) return setMessaggio(esito.messaggio);
    setChiedi(false);
    onCambiato(`Le ore di ${g.cliente.nome} sono di nuovo da fatturare.`);
  }

  return (
    <div className="rounded-xl border border-border p-3 text-sm">
      <p>
        {quante === 1 ? "1 voce fatturata" : `${quante} voci fatturate`} il {data(giorno)}.
      </p>
      {chiedi ? (
        <>
          <p className="mt-1 text-muted" role="status">
            Fallo solo se quella fattura non l&apos;hai mandata: le ore tornano da fatturare.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={`${classePiccolo} border-brand text-brand`} onClick={togli} disabled={inCorso}>
              Sì, togli il segno
            </button>
            <button type="button" className={classePiccolo} onClick={() => setChiedi(false)}>
              Annulla
            </button>
          </div>
        </>
      ) : (
        <button type="button" className={`${classePiccolo} mt-2`} onClick={() => setChiedi(true)}>
          Non l&apos;ho mandata: togli il segno<span className="sr-only"> alle ore fatturate il {data(giorno)}</span>
        </button>
      )}
      <Messaggio testo={messaggio} />
    </div>
  );
}
